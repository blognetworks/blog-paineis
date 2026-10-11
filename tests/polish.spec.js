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
    execFileSync('bundle', ['exec', 'jekyll', 'build', '--config', '_config.yml,tests/fixtures/donate.yml', '--destination', dest], { stdio: 'pipe' });
    const html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
    const tag = html.match(/<a\b[^>]*\bid="donate"[^>]*>/);
    expect(tag).not.toBeNull();
    expect(tag[0]).toContain('href="https://example.com/apoie"');
    expect(tag[0]).toContain('target="_blank"');
    expect(tag[0]).toMatch(/rel="[^"]*noopener/);
    expect(tag[0]).toContain('aria-label="Apoiar (abre em nova aba)"');
    expect(html).not.toContain('alert(');
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
