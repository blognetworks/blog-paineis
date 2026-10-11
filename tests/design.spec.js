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

// Regiões (Task 3): o arraste dos divisores continua mudando o flex-basis e o fim das listas é alcançável.
test.describe('regiões', () => {
  test('arrastar #lineLeft muda o flex-basis de #tagDiv', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const basis = () => page.locator('#tagDiv').evaluate((el) => getComputedStyle(el).flexBasis);
    expect(await basis()).toBe('128px');

    const box = await page.locator('#lineLeft').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 40, y, { steps: 8 });
    await page.mouse.up();

    const after = parseFloat(await basis());
    expect(after).toBeGreaterThan(160);
    expect(after).toBeLessThan(176);
  });

  test('o último item de cada lista lateral é alcançável por rolagem', async ({ page }) => {
    await page.goto('/');
    for (const list of ['#catenameUL', '#tagnameUL', '#filenameUL']) {
      const result = await page.locator(list).evaluate((ul) => {
        ul.scrollTop = ul.scrollHeight;
        const items = ul.querySelectorAll('li');
        const last = items[items.length - 1].getBoundingClientRect();
        const box = ul.getBoundingClientRect();
        return { lastBottom: last.bottom, listBottom: box.bottom, viewport: window.innerHeight };
      });
      expect(result.listBottom, list).toBeLessThanOrEqual(result.viewport + 0.5);
      expect(result.lastBottom, list).toBeLessThanOrEqual(result.listBottom + 0.5);
    }
  });
});

// Aceite (Task 5): contraste nos dois temas, mobile sem rolagem horizontal e rede só local.
import AxeBuilder from '@axe-core/playwright';

const firstPostHref = async (page) => {
  await page.goto('/');
  return page.locator('#filenameUL a').first().getAttribute('href');
};

test.describe('contraste (axe color-contrast)', () => {
  for (const theme of ['light', 'dark']) {
    for (const where of ['home', 'post']) {
      test(`${where} sem violações no tema ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const href = where === 'post' ? await firstPostHref(page) : '/';
        await page.addInitScript((t) => {
          try { localStorage.setItem('blog.theme', t); } catch (e) {}
        }, theme);
        await page.goto(href);
        expect(await dataTheme(page)).toBe(theme);
        await page.evaluate(() => document.fonts.ready);
        const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        const resumo = violations.flatMap((v) =>
          v.nodes.map((n) => `${n.target.join(' ')}: ${n.any.map((a) => a.message).join('; ')}`),
        );
        expect(resumo).toEqual([]);
      });
    }
  }
});

test.describe('mobile 390×844', () => {
  test('post sem rolagem horizontal e com colunas laterais ocultas', async ({ page }) => {
    const href = await firstPostHref(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(href);
    await expect(page.locator('#pageContent h2').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    for (const id of ['#cateDiv', '#tagDiv', '#filenameDiv', '#rightNavbar']) {
      await expect(page.locator(id), id).toBeHidden();
    }
    // Imagens e código respeitam a largura do conteúdo.
    const larguras = await page.evaluate(() => {
      const box = document.querySelector('#contentDiv').getBoundingClientRect();
      return [...document.querySelectorAll('#pageContent img, #pageContent pre')].map(
        (el) => el.getBoundingClientRect().right - box.right,
      );
    });
    for (const excesso of larguras) expect(excesso).toBeLessThanOrEqual(0.5);
  });

  test('#topbarToggle abre os painéis e escolher um post fecha de novo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#filenameDiv')).toBeHidden();
    await page.locator('#topbarToggle').click();
    for (const id of ['#cateDiv', '#tagDiv', '#filenameDiv']) {
      await expect(page.locator(id), id).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    // O fim de cada lista do navegador é alcançável dentro da tela.
    await page.waitForTimeout(200); // animação .show(100)
    for (const list of ['#filenameUL', '#catenameUL', '#tagnameUL']) {
      const r = await page.locator(list).evaluate((ul) => {
        ul.scrollTop = ul.scrollHeight;
        const items = [...ul.querySelectorAll('li')].filter((li) => li.offsetParent);
        return {
          lastBottom: items[items.length - 1].getBoundingClientRect().bottom,
          listBottom: ul.getBoundingClientRect().bottom,
          viewport: window.innerHeight,
        };
      });
      expect(r.listBottom, list).toBeLessThanOrEqual(r.viewport + 0.5);
      expect(r.lastBottom, list).toBeLessThanOrEqual(r.viewport + 0.5);
    }
    await page.locator('#filenameUL li.postNames:visible').first().click();
    for (const id of ['#cateDiv', '#tagDiv', '#filenameDiv', '#rightNavbar']) {
      await expect(page.locator(id), id).toBeHidden();
    }
    await expect(page.locator('#pageContent h2').first()).toBeVisible();
  });

  test('alvos da barra superior têm 44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const tamanhos = await page.locator('#topbarDiv .icon-button:visible').evaluateAll((els) =>
      els.map((el) => [el.id || el.title, el.getBoundingClientRect().width, el.getBoundingClientRect().height]),
    );
    expect(tamanhos.length).toBeGreaterThan(3);
    for (const [nome, w, h] of tamanhos) {
      expect(w, nome).toBeGreaterThanOrEqual(44);
      expect(h, nome).toBeGreaterThanOrEqual(44);
    }
  });
});

test('cabeçalho "Nesta página" só aparece quando o sumário tem itens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const href = await firstPostHref(page);
  await expect(page.locator('#rightNavbar > .panel-header')).toBeHidden();
  await page.goto(href);
  await expect(page.locator('#rightNavbar > .panel-header')).toBeVisible();
});

test.describe('rede', () => {
  for (const where of ['home', 'post']) {
    test(`${where} não faz requisições fora de 127.0.0.1`, async ({ page }) => {
      const href = where === 'post' ? await firstPostHref(page) : '/';
      const externas = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (/^(data|blob):/.test(req.url())) return;
        if (url.hostname !== '127.0.0.1') externas.push(req.url());
      });
      await page.goto(href, { waitUntil: 'networkidle' });
      await page.locator('#contentDiv').evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForLoadState('networkidle');
      expect(externas).toEqual([]);
    });
  }
});
