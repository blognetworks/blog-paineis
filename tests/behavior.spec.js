import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
