import { test, expect } from '@playwright/test';

// Tema: tokens claro/escuro, botão #themeToggle (Sistema → Claro → Escuro) e pré-pintura.

const bgApp = (page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim().toLowerCase(),
  );
const dataTheme = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const stored = (page) => page.evaluate(() => localStorage.getItem('blog.theme'));

test.describe('tema', () => {
  test('sem preferência salva, segue o esquema do sistema', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect(await dataTheme(page)).toBeNull();
    expect(await bgApp(page)).toBe('#0f1218');

    await page.emulateMedia({ colorScheme: 'light' });
    expect(await bgApp(page)).toBe('#f3f4f6');
  });

  test('#themeToggle cicla sistema → claro → escuro → sistema e persiste', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const btn = page.locator('#themeToggle');
    await expect(btn).toHaveAttribute('aria-label', 'Tema: sistema');
    expect(await dataTheme(page)).toBeNull();

    await btn.click();
    expect(await dataTheme(page)).toBe('light');
    expect(await stored(page)).toBe('light');
    await expect(btn).toHaveAttribute('aria-label', 'Tema: claro');
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-sun');

    await btn.click();
    expect(await dataTheme(page)).toBe('dark');
    expect(await stored(page)).toBe('dark');
    expect(await bgApp(page)).toBe('#0f1218');
    await expect(btn).toHaveAttribute('aria-label', 'Tema: escuro');
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-moon');
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#161b22');

    await btn.click();
    expect(await dataTheme(page)).toBeNull();
    expect(await stored(page)).toBe('system');
    await expect(btn).toHaveAttribute('aria-label', 'Tema: sistema');
    await expect(btn.locator('use')).toHaveAttribute('href', '#i-monitor');
  });

  test('tema escuro salvo já está aplicado no primeiro DOMContentLoaded', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          window.__dclTheme = document.documentElement.getAttribute('data-theme');
        },
        { once: true },
      );
    });
    await page.goto('/');
    await page.locator('#themeToggle').click(); // claro
    await page.locator('#themeToggle').click(); // escuro
    await page.reload();
    expect(await page.evaluate(() => window.__dclTheme)).toBe('dark');
    expect(await bgApp(page)).toBe('#0f1218');
  });

  test('tema escuro sobrevive à navegação PJAX e o botão continua funcional', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.evaluate(() => { window.__semRecarga = true; });
    const btn = page.locator('#themeToggle');
    await btn.click();
    await btn.click();
    expect(await dataTheme(page)).toBe('dark');

    const first = page.locator('#filenameUL a').first();
    const href = await first.getAttribute('href');
    await first.locator('li.postNames').click();
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect(page.locator('#pageContent h2').first()).toBeVisible();
    expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
    expect(await dataTheme(page)).toBe('dark');

    await btn.click();
    expect(await dataTheme(page)).toBeNull();
    expect(await stored(page)).toBe('system');
  });
});
