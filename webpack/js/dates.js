// Olho das datas (R3.3): o botão #filenameDivDate alterna .hidden em .fileNameDate e aponta o
// <use> interno para #icon-13eye (datas visíveis) ou #icon-eyeblocked (ocultas).
import { on, qs, qsa } from './dom.js';

const XLINK = 'http://www.w3.org/1999/xlink';

function setIcon(use, id) {
  use.setAttribute('href', `#${id}`);
  use.removeAttributeNS(XLINK, 'href');
}

export function initDates() {
  const button = qs('#filenameDivDate');
  if (!button) return;
  on(button, 'click', () => {
    const show = button.getAttribute('aria-pressed') !== 'true';
    for (const sup of qsa('.fileNameDate')) sup.classList.toggle('hidden', !show);
    button.setAttribute('aria-pressed', String(show));
    const use = qs('use', button);
    if (use) setIcon(use, show ? 'icon-13eye' : 'icon-eyeblocked');
  });
}
