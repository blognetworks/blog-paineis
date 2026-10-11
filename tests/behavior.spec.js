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

    // Separador focável (a tarefa 4 dá role="separator" e tabindex nativos aos divisores).
    await page.locator('#lineLeft').evaluate((el) => {
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      if (!el.hasAttribute('role')) el.setAttribute('role', 'separator');
    });
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
