// Ponto de entrada dos módulos ES: único lugar com efeito colateral (init uma vez).
import { initNav } from './nav.js';
import { buildToc, initTocSpy } from './toc.js';
import { initPanels, syncTopbarNav, closeMobileNav } from './panels.js';
import { initShortcuts } from './shortcuts.js';
import { registerSW } from './sw-register.js';
import { initFilter } from './filter.js';
import { initDates } from './dates.js';
import { initResize } from './resize.js';

function init() {
  initNav();
  initPanels();
  initShortcuts();
  initTocSpy();
  initFilter();
  initDates();
  initResize();

  // Carregamento inicial e cada navegação parcial.
  buildToc();
  syncTopbarNav();
  document.addEventListener('nav:end', () => {
    buildToc();
    syncTopbarNav();
    closeMobileNav();
  });

  registerSW();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
