// Ponto de entrada dos módulos ES: único lugar com efeito colateral (init uma vez).
import { initNav } from './nav.js';
import { buildToc, initTocSpy } from './toc.js';
import { initPanels, syncTopbarNav, closeMobileNav } from './panels.js';
import { initShortcuts } from './shortcuts.js';
import { registerSW } from './sw-register.js';
import { initFilter } from './filter.js';
import { initDates } from './dates.js';
import { initResize } from './resize.js';

// Leva o alvo do hash (id ou <a name> criado pelo sumário) para dentro do #contentDiv.
function scrollToHash() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!id) return;
  const target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
  target?.scrollIntoView({ block: 'start' });
}

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
  scrollToHash();
  syncTopbarNav();
  document.addEventListener('nav:end', (event) => {
    buildToc();
    if (!event.detail?.restored) scrollToHash();
    syncTopbarNav();
    closeMobileNav();
  });

  registerSW();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
