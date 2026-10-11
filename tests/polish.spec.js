import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Polimento da 005: datas em português, RSS, doação configurável e placeholder escuro.

const MESES_EN = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/;
const MESES_PT = /\b\d{2} (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) \d{4}\b/;

async function primeiroPost(page) {
  await page.goto('/');
  return page.locator('#contentDiv .post-list a.post-link').first().getAttribute('href');
}

test.describe('textos em português', () => {
  test('home: datas sem meses em inglês e com meses em português', async ({ page }) => {
    await page.goto('/');
    const texto = await page.locator('#contentDiv .post-list').innerText();
    expect(texto).not.toMatch(MESES_EN);
    expect(texto).toMatch(MESES_PT);
    // A lista de posts no navegador continua numérica.
    expect(await page.locator('.fileNameDate').first().innerText()).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('post: data sem meses em inglês e com meses em português', async ({ page }) => {
    await page.goto(await primeiroPost(page));
    const meta = await page.locator('#pageContent .post-meta').innerText();
    expect(meta).not.toMatch(MESES_EN);
    expect(meta).toMatch(MESES_PT);
  });

  test('home: link do feed diz "Assinar via RSS"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.rss-subscribe')).toContainText('Assinar via RSS');
  });

  test('nenhum alert( no HTML da home e do post', async ({ page, request }) => {
    const href = await primeiroPost(page);
    for (const url of ['/', href]) {
      const html = await (await request.get(url)).text();
      expect(html).not.toContain('alert(');
    }
  });
});

test.describe('doação configurável', () => {
  test('donate_url vazio: #donate não existe', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#donate')).toHaveCount(0);
  });

  test('donate_url com valor: #donate é um link externo seguro', async () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'donate-'));
    try {
      execFileSync('bundle', ['exec', 'jekyll', 'build', '--config', '_config.yml,tests/fixtures/donate.yml', '--destination', dest], { stdio: 'pipe' });
      const html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
      const tag = html.match(/<a\b[^>]*\bid="donate"[^>]*>/);
      expect(tag).not.toBeNull();
      expect(tag[0]).toContain('href="https://example.com/apoie"');
      expect(tag[0]).toContain('target="_blank"');
      expect(tag[0]).toMatch(/rel="[^"]*noopener/);
      expect(tag[0]).toContain('aria-label="Apoiar (abre em nova aba)"');
      expect(html).not.toContain('alert(');
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });
});

test.describe('data em português (fronteira de dezembro)', () => {
  test('data-pt.html: 2024-12-05 -> "05 dez 2024" e 2025-01-31 -> "31 jan 2025"', async () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'datapt-src-'));
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'datapt-out-'));
    try {
      fs.mkdirSync(path.join(src, '_includes'));
      fs.copyFileSync('src/_includes/data-pt.html', path.join(src, '_includes', 'data-pt.html'));
      fs.writeFileSync(path.join(src, '_config.yml'), 'plugins: []\n');
      fs.writeFileSync(path.join(src, 'index.html'),
        '---\n---\n[{% include data-pt.html date="2024-12-05" %}][{% include data-pt.html date="2025-01-31" %}]');
      execFileSync('bundle', ['exec', 'jekyll', 'build', '--source', src, '--config', path.join(src, '_config.yml'), '--destination', dest], { stdio: 'pipe' });
      const html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
      expect(html).toContain('[05 dez 2024][31 jan 2025]');
    } finally {
      fs.rmSync(src, { recursive: true, force: true });
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });
});

test.describe('contraste (axe) com a nova imagem', () => {
  for (const theme of ['light', 'dark']) {
    test(`post sem violações de color-contrast no tema ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem('blog.theme', t); } catch (e) {}
      }, theme);
      await page.goto(await primeiroPost(page));
      const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(r.violations).toEqual([]);
    });
  }
});

test.describe('navegação parcial: âncora e rolagem', () => {
  const scrollTop = (page) => page.locator('#contentDiv').evaluate((el) => el.scrollTop);

  // Rola para o sumário do post carregado e devolve o href do último item.
  async function ultimaAncora(page, post) {
    await page.goto(post);
    return page.locator('#MDh1 > li a').last().getAttribute('href');
  }

  test('1e: navegar para post#N rola o alvo para dentro de #contentDiv', async ({ page }) => {
    const post = await primeiroPost(page);
    const hash = await ultimaAncora(page, post);
    await page.goto('/');
    await page.evaluate(() => { window.__semRecarga = true; });
    await page.evaluate(([href]) => {
      const a = document.createElement('a');
      a.id = 'saltoTeste';
      a.href = href;
      a.textContent = 'salto';
      document.body.append(a);
    }, [post + hash]);
    await page.locator('#saltoTeste').evaluate((a) => a.click());
    await expect(page.locator('#MDh1 > li').first()).toBeAttached();
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
    const id = hash.slice(1);
    await expect.poll(() => page.evaluate((n) => {
      const alvo = document.querySelector(`[name="${n}"]`).parentElement;
      const box = document.getElementById('contentDiv').getBoundingClientRect();
      const r = alvo.getBoundingClientRect();
      return r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
    }, id)).toBe(true);
    expect(await scrollTop(page)).toBeGreaterThan(0);
  });

  test('1f: voltar restaura o scrollTop que o post tinha ao sair', async ({ page }) => {
    await page.goto('/');
    const posts = await page.locator('#contentDiv .post-list a.post-link').evaluateAll((as) => as.slice(0, 2).map((a) => a.getAttribute('href')));
    await page.goto(posts[0]);
    await page.evaluate(() => { window.__semRecarga = true; });
    await page.locator('#contentDiv').evaluate((el) => { el.scrollTop = 600; });
    const antes = await scrollTop(page);
    expect(antes).toBeGreaterThan(300);
    await page.evaluate((h) => {
      const a = document.createElement('a');
      a.id = 'saltoTeste';
      a.href = h;
      document.body.append(a);
      a.click();
    }, posts[1]);
    await expect(page).toHaveURL(new RegExp(posts[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect.poll(() => scrollTop(page)).toBe(0);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(posts[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect.poll(async () => Math.abs((await scrollTop(page)) - antes)).toBeLessThanOrEqual(20);
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
  });

  test('ids de entrada são únicos entre recarregamentos: voltar após reload restaura a rolagem certa', async ({ page }) => {
    await page.goto('/');
    const posts = await page.locator('#contentDiv .post-list a.post-link').evaluateAll((as) => as.slice(0, 2).map((a) => a.getAttribute('href')));
    const clicar = (h) => page.evaluate((href) => {
      const a = document.createElement('a');
      a.href = href;
      document.body.append(a);
      a.click();
      a.remove();
    }, h);
    const rolar = (y) => page.locator('#contentDiv').evaluate((el, v) => { el.scrollTop = v; }, y);
    // A primeira entrada é o próprio post A (id 1): depois do reload o post B também recebia id 1.
    await page.goto(posts[0]);
    await rolar(600);
    const a = await scrollTop(page);
    expect(a).toBeGreaterThan(300);
    await clicar(posts[1]);
    await expect(page).toHaveURL(new RegExp(posts[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect.poll(() => scrollTop(page)).toBe(0);
    await rolar(300);
    await page.reload();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(posts[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect.poll(async () => Math.abs((await scrollTop(page)) - a)).toBeLessThanOrEqual(20);
  });

  test('popstate para a primeira entrada (sem state) troca o conteúdo e rola ao topo', async ({ page }) => {
    await page.goto('/');
    // Remove o state da primeira entrada, como numa entrada criada antes do JS.
    await page.evaluate(() => { history.replaceState(null, '', location.href); window.__semRecarga = true; });
    const link = page.locator('#contentDiv .post-list a.post-link').first();
    await link.click();
    await expect(page.locator('#pageContent h1.post-title')).toBeVisible();
    await page.goBack();
    await expect(page.locator('#contentDiv .post-list')).toBeVisible();
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
    expect(await scrollTop(page)).toBe(0);
  });
});
