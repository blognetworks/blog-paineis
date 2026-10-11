import { test, expect } from '@playwright/test';

// Erros conhecidos e aceitos (recursos ausentes que não fazem parte desta spec).
const IGNORED = [/favicon/i];

function trackErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('home carrega com 4 categorias, 12 tags, 24 posts e sem erros', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.locator('li.cateNames')).toHaveCount(4);
  await expect(page.locator('li.tagNames')).toHaveCount(12);
  await expect(page.locator('li.postNames')).toHaveCount(24);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('sem jQuery: window.jQuery e window.$ indefinidos, NProgress disponível', async ({ page }) => {
  await page.goto('/');
  const globals = await page.evaluate(() => ({
    jQuery: typeof window.jQuery,
    dollar: typeof window.$,
  }));
  expect(globals).toEqual({ jQuery: 'undefined', dollar: 'undefined' });
  // O NProgress vem empacotado no bundle (não é global): disponível = a barra aparece no nav:start.
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('nav:start', { detail: { url: location.href } })));
  await expect(page.locator('#nprogress')).toBeAttached();
});

test('clicar numa categoria filtra tags e posts', async ({ page }) => {
  await page.goto('/');
  await page.locator('#Frontend').click();
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.tagNames:visible')).toHaveCount(3);
  await expect(page.locator('li.postNames:visible')).toHaveCount(6);
});

test('clicar numa tag filtra posts e destaca a categoria', async ({ page }) => {
  await page.goto('/');
  await page.locator('#TagCSS').click();
  await expect(page.locator('#TagCSS')).toHaveClass(/active/);
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.postNames:visible')).toHaveCount(2);
});

test('clicar num post navega via PJAX, sem recarga, e destaca tag e categoria', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.evaluate(() => { window.__semRecarga = true; });
  const first = page.locator('#filenameUL a').first();
  const href = await first.getAttribute('href');
  await page.locator('#filenameUL li.postNames').first().click(); // li.postNames > a (002, R5.2)
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await expect(page.locator('#pageContent h2').first()).toBeVisible();
  expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
  await expect(page.locator('#TagCSS')).toHaveClass(/active/);
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.tagNames:visible')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('post tem TOC de h2 a h5, imagem lazy e não vaza "meta:"', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('#filenameUL a').first().getAttribute('href');
  await page.goto(href);
  await expect(page.locator('#MDh1 > li')).toHaveCount(4);
  await expect(page.locator('#pageContent img.lazy')).toHaveCount(1);
  await expect(page.locator('#contentDiv')).not.toContainText('meta:');
});
