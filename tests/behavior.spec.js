import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

// Comportamento da 002 (JS vanilla): navegação parcial, sumário e registro do service worker.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('navegação parcial', () => {
  test('clicar num post da home troca #contentDiv sem recarga, com título e URL novos', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.__semRecarga = true; });
    const link = page.locator('#contentDiv .post-list a.post-link').first();
    const href = await link.getAttribute('href');
    const titulo = (await link.textContent()).trim();

    await link.click();
    await expect(page).toHaveURL(new RegExp(escapeRe(href) + '$'));
    await expect(page.locator('#pageContent h1.post-title')).toHaveText(titulo);
    await expect(page).toHaveTitle(titulo);
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
    expect(await page.evaluate(() => document.getElementById('contentDiv').scrollTop)).toBe(0);
    // Sumário reconstruído no fim da navegação.
    await expect(page.locator('#MDh1 > li').first()).toBeAttached();
  });

  test('voltar do navegador restaura a home e avançar restaura o post', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.__semRecarga = true; });
    const link = page.locator('#contentDiv .post-list a.post-link').first();
    const titulo = (await link.textContent()).trim();
    await link.click();
    await expect(page.locator('#pageContent h1.post-title')).toHaveText(titulo);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#contentDiv .post-list')).toBeVisible();
    await expect(page.locator('#MDh1 > li')).toHaveCount(0);
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);

    await page.goForward();
    await expect(page.locator('#pageContent h1.post-title')).toHaveText(titulo);
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
  });

  test('links externos, com target, download, âncora, modificador e /feed.xml não são interceptados', async ({ page }) => {
    await page.goto('/');
    const resultado = await page.evaluate(() => {
      const casos = [
        { attrs: { href: '/feed.xml' } },
        { attrs: { href: '/', target: '_blank' } },
        { attrs: { href: '/', download: '' } },
        { attrs: { href: 'https://example.com/' } },
        { attrs: { href: '#pageContent' } },
        { attrs: { href: '/' }, init: { ctrlKey: true } },
        { attrs: { href: '/' }, init: { metaKey: true } },
        { attrs: { href: '/' }, init: { shiftKey: true } },
      ];
      const out = [];
      // Ouvinte em window roda depois do handler delegado em document: registra se o handler
      // impediu a navegação e então a impede, para o teste não sair da página.
      let ultimo = null;
      const espiao = (e) => { ultimo = e.defaultPrevented; e.preventDefault(); };
      window.addEventListener('click', espiao);
      for (const { attrs, init } of casos) {
        const a = document.createElement('a');
        for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
        a.textContent = 'teste';
        document.getElementById('pageContent').append(a);
        ultimo = null;
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
        out.push({ ...attrs, ...init, interceptado: ultimo });
        a.remove();
      }
      window.removeEventListener('click', espiao);
      return out;
    });
    for (const r of resultado) expect(r, JSON.stringify(r)).toMatchObject({ interceptado: false });
  });

  test('link interno comum é interceptado', async ({ page }) => {
    await page.goto('/');
    const interceptado = await page.evaluate(() => {
      let ultimo = null;
      const espiao = (e) => { ultimo = e.defaultPrevented; e.preventDefault(); };
      window.addEventListener('click', espiao);
      const a = document.querySelector('#contentDiv .post-list a.post-link');
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      window.removeEventListener('click', espiao);
      return ultimo;
    });
    expect(interceptado).toBe(true);
  });
});

test('botões anterior/próximo da barra seguem o post atual e navegam sem recarga', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#topbarPre')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#topbarNext')).toHaveAttribute('aria-disabled', 'true');

  await page.evaluate(() => { window.__semRecarga = true; });
  await page.locator('#filenameUL a').first().click();
  await expect(page.locator('#pageContent h1.post-title')).toBeVisible();
  const proximo = page.locator('#nextPost, #prePost').first();
  const id = await proximo.getAttribute('id');
  const href = await proximo.getAttribute('href');
  const botao = page.locator(id === 'nextPost' ? '#topbarNext' : '#topbarPre');
  await expect(botao).toHaveAttribute('aria-disabled', 'false');

  await botao.click();
  await expect(page).toHaveURL(new RegExp(escapeRe(href) + '$'));
  expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
});

test('sumário destaca a seção visível com aria-current="location"', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('#filenameUL a').first().getAttribute('href');
  await page.goto(href);
  await expect(page.locator('#MDh1 > li').first()).toBeAttached();
  await page.locator('#contentDiv').evaluate((el) => {
    el.scrollTop = 1;
    el.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('#MDh1 a[aria-current="location"]')).toHaveCount(1);
  await expect(page.locator('#MDh1 > li.active')).toHaveCount(1);
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('post não gera 404 para sw.js e o registro usa /sw.js', async ({ page, context }) => {
    // Registra a URL resolvida de cada chamada a register(); a busca do script do SW não passa
    // pelos eventos de rede da página.
    await page.addInitScript(() => {
      window.__swRegs = [];
      const sw = navigator.serviceWorker;
      if (!sw) return;
      const original = sw.register.bind(sw);
      sw.register = (url, opts) => {
        const p = original(url, opts);
        const entry = { url: new URL(url, location.href).pathname, ok: null };
        window.__swRegs.push(entry);
        p.then(() => { entry.ok = true; }, () => { entry.ok = false; });
        return p;
      };
    });
    const falhas = [];
    context.on('response', (r) => {
      if (/sw\.js(\?|$)/.test(r.url()) && r.status() === 404) falhas.push(r.url());
    });
    await page.goto('/');
    const href = await page.locator('#filenameUL a').first().getAttribute('href');
    await page.goto(href);
    await expect.poll(() => page.evaluate(() => window.__swRegs.map((r) => r.ok))).toEqual([true]);
    expect(await page.evaluate(() => window.__swRegs.map((r) => r.url))).toEqual(['/sw.js']);
    expect(falhas).toEqual([]);
  });
});

// Filtro, datas e "mostrar tudo" (002, tarefa 2): teclado, botões nativos e markup válido.
test.describe('filtro e teclado', () => {
  const useHref = (page) =>
    page.locator('#filenameDivDate use').evaluate(
      (u) => u.getAttribute('href') || u.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
    );

  test('Enter numa categoria focada filtra igual ao clique', async ({ page }) => {
    await page.goto('/');
    await page.locator('#Frontend').focus();
    await expect(page.locator('#Frontend')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#Frontend')).toHaveClass(/active/);
    await expect(page.locator('li.tagNames:visible')).toHaveCount(3);
    await expect(page.locator('li.postNames:visible')).toHaveCount(6);
  });

  test('Espaço numa tag filtra os posts e não rola a lista', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 300 });
    await page.goto('/');
    await page.locator('#TagCSS').focus();
    const antes = await page.evaluate(() => ({
      tags: document.getElementById('tagnameUL').scrollTop,
      page: document.scrollingElement.scrollTop,
    }));
    await page.evaluate(() => {
      window.__spacePrevented = null;
      window.addEventListener('keydown', (e) => { if (e.key === ' ') window.__spacePrevented = e.defaultPrevented; });
    });
    await page.keyboard.press(' ');
    await expect(page.locator('#TagCSS')).toHaveClass(/active/);
    await expect(page.locator('#Frontend')).toHaveClass(/active/);
    await expect(page.locator('li.postNames:visible')).toHaveCount(2);
    expect(await page.evaluate(() => window.__spacePrevented)).toBe(true);
    const depois = await page.evaluate(() => ({
      tags: document.getElementById('tagnameUL').scrollTop,
      page: document.scrollingElement.scrollTop,
    }));
    expect(depois).toEqual(antes);
  });

  test('"mostrar tudo" é um <button> e limpa o filtro e os destaques', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#allCateTagPostBtn');
    expect(await btn.evaluate((el) => [el.tagName, el.getAttribute('type')])).toEqual(['BUTTON', 'button']);
    await page.locator('#TagCSS').click();
    await expect(page.locator('li.postNames:visible')).toHaveCount(2);
    await btn.click();
    await expect(page.locator('li.tagNames:visible')).toHaveCount(12);
    await expect(page.locator('li.postNames:visible')).toHaveCount(24);
    await expect(page.locator('#catenameUL .active, #tagnameUL .active, #filenameUL .active')).toHaveCount(0);
  });

  test('o olho é um <button>, mostra as datas e alterna o ícone', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#filenameDivDate');
    expect(await btn.evaluate((el) => [el.tagName, el.getAttribute('type')])).toEqual(['BUTTON', 'button']);
    expect(await useHref(page)).toBe('#icon-eyeblocked');
    await expect(page.locator('.fileNameDate').first()).toBeHidden();

    await btn.click();
    await expect(page.locator('.fileNameDate').first()).toBeVisible();
    expect(await useHref(page)).toBe('#icon-13eye');

    await btn.click();
    await expect(page.locator('.fileNameDate').first()).toBeHidden();
    expect(await useHref(page)).toBe('#icon-eyeblocked');
  });

  test('home sem violações axe listitem e nested-interactive', async ({ page }) => {
    await page.goto('/');
    const { violations } = await new AxeBuilder({ page }).withRules(['listitem', 'nested-interactive']).analyze();
    const resumo = violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.target.join(' ')}`));
    expect(resumo).toEqual([]);
  });
});

// Painéis por classe, alturas em CSS, navegador mobile e atalhos (002, tarefa 3).
test.describe('painéis e atalhos', () => {
  const NAV = ['#cateDiv', '#tagDiv', '#filenameDiv', '#lineLeft', '#lineRight'];
  const semDisplayInline = (page, ids) =>
    page.evaluate((sels) => sels.filter((s) => document.querySelector(s).style.display !== ''), ids);

  test('#topbarToggle esconde e mostra os três painéis, os divisores e o sumário por classe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const TODOS = [...NAV, '#rightNavbar', '#lineSide'];
    for (const id of TODOS) await expect(page.locator(id), id).toBeVisible();

    await page.locator('#topbarToggle').click();
    for (const id of TODOS) {
      await expect(page.locator(id), id).toHaveClass(/\bis-hidden\b/);
      await expect(page.locator(id), id).toBeHidden();
    }
    await expect(page.locator('#contentDiv')).toBeVisible();

    await page.locator('#topbarToggle').click();
    for (const id of TODOS) {
      await expect(page.locator(id), id).not.toHaveClass(/\bis-hidden\b/);
      await expect(page.locator(id), id).toBeVisible();
    }

    // Depois disso, #topbarStructureToggle continua alternando só o sumário.
    await page.locator('#topbarStructureToggle').click();
    for (const id of ['#rightNavbar', '#lineSide']) await expect(page.locator(id), id).toBeHidden();
    for (const id of NAV) await expect(page.locator(id), id).toBeVisible();
    await page.locator('#topbarStructureToggle').click();
    for (const id of ['#rightNavbar', '#lineSide']) await expect(page.locator(id), id).toBeVisible();
    expect(await semDisplayInline(page, TODOS)).toEqual([]);
  });

  test('#topbarStructureToggle alterna o sumário e #lineSide', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const ids = ['#rightNavbar', '#lineSide'];
    for (const id of ids) await expect(page.locator(id), id).toBeVisible();
    await page.locator('#topbarStructureToggle').click();
    for (const id of ids) {
      await expect(page.locator(id), id).toHaveClass(/\bis-hidden\b/);
      await expect(page.locator(id), id).toBeHidden();
    }
    await page.locator('#topbarStructureToggle').click();
    for (const id of ids) await expect(page.locator(id), id).toBeVisible();
    expect(await semDisplayInline(page, ids)).toEqual([]);
  });

  test('#leftBtn recolhe cate → tag → posts e #rightBtn restaura na ordem inversa', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const visiveis = () =>
      page.evaluate(() =>
        ['cateDiv', 'tagDiv', 'lineLeft', 'filenameDiv', 'lineRight'].filter(
          (id) => document.getElementById(id).getClientRects().length > 0,
        ),
      );
    const left = page.locator('#leftBtn');
    const right = page.locator('#rightBtn');

    expect(await visiveis()).toEqual(['cateDiv', 'tagDiv', 'lineLeft', 'filenameDiv', 'lineRight']);
    await left.click();
    expect(await visiveis()).toEqual(['tagDiv', 'lineLeft', 'filenameDiv', 'lineRight']);
    await left.click();
    expect(await visiveis()).toEqual(['filenameDiv', 'lineRight']);
    await left.click();
    expect(await visiveis()).toEqual([]);

    await right.click();
    expect(await visiveis()).toEqual(['filenameDiv', 'lineRight']);
    await right.click();
    expect(await visiveis()).toEqual(['tagDiv', 'lineLeft', 'filenameDiv', 'lineRight']);
    await right.click();
    expect(await visiveis()).toEqual(['cateDiv', 'tagDiv', 'lineLeft', 'filenameDiv', 'lineRight']);
    expect(await semDisplayInline(page, NAV)).toEqual([]);
  });

  test('mobile 390×844: #topbarToggle alterna #Div.is-nav-open, listas rolam até o fim e escolher um post fecha', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const div = page.locator('#Div');
    await expect(div).not.toHaveClass(/\bis-nav-open\b/);
    await expect(page.locator('#filenameDiv')).toBeHidden();

    await page.locator('#topbarToggle').click();
    await expect(div).toHaveClass(/\bis-nav-open\b/);
    for (const id of ['#cateDiv', '#tagDiv', '#filenameDiv']) await expect(page.locator(id), id).toBeVisible();
    await expect(page.locator('#contentDiv')).toBeHidden();
    for (const list of ['#catenameUL', '#tagnameUL', '#filenameUL']) {
      const r = await page.locator(list).evaluate((ul) => {
        ul.scrollTop = ul.scrollHeight;
        const items = [...ul.querySelectorAll('li')].filter((li) => li.getClientRects().length);
        return {
          lastBottom: items[items.length - 1].getBoundingClientRect().bottom,
          listBottom: ul.getBoundingClientRect().bottom,
          viewport: window.innerHeight,
        };
      });
      expect(r.listBottom, list).toBeLessThanOrEqual(r.viewport + 0.5);
      expect(r.lastBottom, list).toBeLessThanOrEqual(r.listBottom + 0.5);
    }

    await page.locator('#topbarToggle').click();
    await expect(div).not.toHaveClass(/\bis-nav-open\b/);
    await expect(page.locator('#filenameDiv')).toBeHidden();

    await page.locator('#topbarToggle').click();
    await page.locator('#filenameUL li.postNames').first().click();
    await expect(div).not.toHaveClass(/\bis-nav-open\b/);
    await expect(page.locator('#pageContent h1.post-title')).toBeVisible();
    expect(await semDisplayInline(page, [...NAV, '#rightNavbar', '#lineSide'])).toEqual([]);
  });

  test('o CSS compilado não usa [style*=] nem altura com !important', async () => {
    const css = fs.readFileSync(new URL('../src/css/main.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/style\*=/);
    expect(css.match(/(?:^|[;{\s])(?:min-|max-)?height\s*:[^;}]*!important/g)).toBeNull();
  });

  test('atalhos: ← ignorado com foco em separador, item, botão ou modificador; sem foco, recolhe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const cate = page.locator('#cateDiv');

    for (const alvo of ['#lineLeft', '#Frontend', '#leftBtn']) {
      await page.locator(alvo).focus();
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(150); // um recolhimento indevido teria tempo de acontecer
      expect(await cate.isVisible(), alvo).toBe(true);
    }

    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForTimeout(150);
    expect(await cate.isVisible()).toBe(true);

    await page.keyboard.press('ArrowLeft');
    await expect(cate).toBeHidden();
    await page.keyboard.press('ArrowRight');
    await expect(cate).toBeVisible();

    // ↑ volta ao topo do artigo.
    await page.locator('#contentDiv').evaluate((el) => { el.scrollTop = 200; });
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => page.locator('#contentDiv').evaluate((el) => el.scrollTop)).toBe(0);
  });
});

// Redimensionamento acessível (002, tarefa 4): ponteiro, teclado e botões ± (R3.6, R5.3, R5.4).
test.describe('redimensionamento', () => {
  const basis = (page, sel) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).flexBasis));

  test('divisores são separadores focáveis com aria-valuenow/min/max e aria-controls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const esperado = {
      lineLeft: ['tagDiv', '88', '300', '128'],
      lineRight: ['filenameDiv', '160', '500', '256'],
      lineSide: ['rightNavbar', '120', '400', '192'],
    };
    for (const [id, [controls, min, max, now]] of Object.entries(esperado)) {
      const sep = page.locator(`#${id}`);
      await expect(sep, id).toHaveAttribute('role', 'separator');
      await expect(sep, id).toHaveAttribute('tabindex', '0');
      await expect(sep, id).toHaveAttribute('aria-orientation', 'vertical');
      await expect(sep, id).toHaveAttribute('aria-controls', controls);
      await expect(sep, id).toHaveAttribute('aria-valuemin', min);
      await expect(sep, id).toHaveAttribute('aria-valuemax', max);
      await expect(sep, id).toHaveAttribute('aria-valuenow', now);
      await expect(sep, id).toHaveAccessibleName(/.+/);
    }
  });

  test('teclado: → soma 16px, ← subtrai, Home restaura 128px e aria-valuenow acompanha', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const sep = page.locator('#lineLeft');
    await sep.focus();
    await page.keyboard.press('ArrowRight');
    expect(await basis(page, '#tagDiv')).toBe(144);
    await expect(sep).toHaveAttribute('aria-valuenow', '144');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    expect(await basis(page, '#tagDiv')).toBe(144);
    // ← não dispara o atalho global de recolher.
    await expect(page.locator('#cateDiv')).toBeVisible();
    await page.keyboard.press('Home');
    expect(await basis(page, '#tagDiv')).toBe(128);
    await expect(sep).toHaveAttribute('aria-valuenow', '128');
    // Clamp no mínimo.
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
    expect(await basis(page, '#tagDiv')).toBe(88);
    await expect(sep).toHaveAttribute('aria-valuenow', '88');
  });

  test('arrastar #lineLeft atualiza aria-valuenow e respeita o máximo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const box = await page.locator('#lineLeft').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 400, y, { steps: 10 });
    await page.mouse.up();
    expect(await basis(page, '#tagDiv')).toBe(300);
    await expect(page.locator('#lineLeft')).toHaveAttribute('aria-valuenow', '300');
  });

  test('botões ± do cabeçalho de tags mudam 16px e respeitam 88–300', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const header = page.locator('#tagDiv > .panel-header');
    const mais = header.getByRole('button', { name: 'Aumentar largura das tags' });
    const menos = header.getByRole('button', { name: 'Diminuir largura das tags' });
    await header.hover();
    await mais.click();
    expect(await basis(page, '#tagDiv')).toBe(144);
    await expect(page.locator('#lineLeft')).toHaveAttribute('aria-valuenow', '144');
    await menos.click();
    await menos.click();
    expect(await basis(page, '#tagDiv')).toBe(112);
    await menos.click();
    await menos.click();
    expect(await basis(page, '#tagDiv')).toBe(88);
    // No limite o botão fica aria-disabled e cliques extras não passam do mínimo.
    await expect(menos).toHaveAttribute('aria-disabled', 'true');
    await menos.click({ force: true });
    expect(await basis(page, '#tagDiv')).toBe(88);

    await page.locator('#lineLeft').focus();
    await page.keyboard.press('Home');
    await expect(menos).toHaveAttribute('aria-disabled', 'false');
    for (let i = 0; i < 11; i++) await mais.click();
    expect(await basis(page, '#tagDiv')).toBe(300);
    await expect(mais).toHaveAttribute('aria-disabled', 'true');
    await mais.click({ force: true });
    expect(await basis(page, '#tagDiv')).toBe(300);

    // Alvo mínimo de 24×24 (WCAG 2.5.8).
    const b = await mais.boundingBox();
    expect(b.width).toBeGreaterThanOrEqual(24);
    expect(b.height).toBeGreaterThanOrEqual(24);
  });

  test('posts e sumário também têm botões ±', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const href = await page.locator('#filenameUL a').first().getAttribute('href');
    await page.goto(href);
    await page.locator('#filenameDivBtnes').getByRole('button', { name: 'Aumentar largura dos posts' }).click();
    expect(await basis(page, '#filenameDiv')).toBe(272);
    const toc = page.locator('#rightNavbar > .panel-header');
    await toc.getByRole('button', { name: 'Aumentar largura do sumário' }).click();
    expect(await basis(page, '#rightNavbar')).toBe(208);
    await toc.getByRole('button', { name: 'Diminuir largura do sumário' }).click();
    expect(await basis(page, '#rightNavbar')).toBe(192);
  });

  test('botões ± ficam ocultos no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#topbarToggle').click();
    await expect(page.locator('#tagDiv > .panel-header')).toBeVisible();
    await expect(page.getByRole('button', { name: /largura/ })).toHaveCount(0);
  });

  test('sem violações axe aria-allowed-role, button-name e atributos ARIA', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const { violations } = await new AxeBuilder({ page })
      .withRules(['aria-allowed-role', 'button-name', 'aria-valid-attr-value', 'aria-required-attr'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
});

// Aceite final (002): regras axe 3h na home e num post, lazyload nativo e #mobile como tel:.
test.describe('aceite final', () => {
  for (const pagina of ['home', 'post']) {
    test(`${pagina} sem violações axe button-name, link-name, aria-allowed-role, nested-interactive e listitem`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      if (pagina === 'post') await page.goto(await page.locator('#filenameUL a').first().getAttribute('href'));
      const { violations } = await new AxeBuilder({ page })
        .withRules(['button-name', 'link-name', 'aria-allowed-role', 'nested-interactive', 'listitem'])
        .analyze();
      expect(violations.flatMap((v) => v.nodes.map((n) => `${v.id} ${n.target.join(' ')}`))).toEqual([]);
    });
  }

  test('imagens do post usam lazyload nativo e mantêm a classe lazy (R3.7)', async ({ page }) => {
    await page.goto('/');
    await page.goto(await page.locator('#filenameUL a').first().getAttribute('href'));
    const img = page.locator('#pageContent img.lazy');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(page.locator('#pageContent img[data-original]')).toHaveCount(0);
  });

  test('#mobile abre tel: com o número no title, sem alert', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('#mobile a');
    await expect(link).toHaveAttribute('href', /^tel:\d+$/);
    await expect(link).toHaveAttribute('title', /\d/);
    await expect(link).toHaveAccessibleName('Telefone');
    await expect(page.locator('#mobile [onclick]')).toHaveCount(0);
  });
});
