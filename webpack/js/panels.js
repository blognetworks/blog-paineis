// Painéis e barra superior (R3.5, R4.1, R4.2): visibilidade só por classes, sem estilo inline.
// Desktop: `.is-hidden` (_base.scss) em cada painel e divisor.
// Mobile (MOBILE_QUERY): `#Div.is-nav-open` mostra o navegador (categorias, tags e posts) no
// lugar do artigo e `#Div.is-toc-open` sobrepõe o sumário (_mobile.scss).
import { on, qs, isMobile } from './dom.js';
import { navigate } from './nav.js';

const NAV_PANELS = ['#cateDiv', '#tagDiv', '#filenameDiv', '#lineLeft', '#lineRight'];
const TOC_PANELS = ['#rightNavbar', '#lineSide'];
// Ordem do recolhimento (←): categorias → tags (+ divisor esquerdo) → posts (+ divisor direito).
// A restauração (→) percorre a mesma lista de trás para frente.
const COLLAPSE_STEPS = [['#cateDiv'], ['#tagDiv', '#lineLeft'], ['#filenameDiv', '#lineRight']];

const TOPBAR_TARGETS = { topbarPre: '#prePost', topbarNext: '#nextPost' };
const NAV_OPEN = 'is-nav-open';
const TOC_OPEN = 'is-toc-open';

export function isHidden(el) {
  return !el || el.classList.contains('is-hidden');
}

export function setHidden(el, hidden) {
  el?.classList.toggle('is-hidden', hidden);
}

const setAll = (selectors, hidden) => {
  for (const sel of selectors) setHidden(qs(sel), hidden);
};

const root = () => qs('#Div');

// Mobile: alterna a classe de `#Div`; ao abrir, limpa .is-hidden deixado pelo desktop.
function toggleMobile(className, panels) {
  const div = root();
  if (!div) return;
  const open = !div.classList.contains(className);
  if (open) setAll(panels, false);
  div.classList.toggle(className, open);
}

export function toggleNav() {
  if (isMobile()) return toggleMobile(NAV_OPEN, NAV_PANELS);
  const allHidden = ['#cateDiv', '#tagDiv', '#filenameDiv'].every((sel) => isHidden(qs(sel)));
  setAll(NAV_PANELS, !allHidden);
}

export function toggleToc() {
  if (isMobile()) return toggleMobile(TOC_OPEN, TOC_PANELS);
  setAll(TOC_PANELS, !isHidden(qs('#rightNavbar')));
}

export function collapseNext() {
  const step = COLLAPSE_STEPS.find(([panel]) => !isHidden(qs(panel)));
  if (step) setAll(step, true);
}

export function restoreNext() {
  const step = [...COLLAPSE_STEPS].reverse().find(([panel]) => isHidden(qs(panel)));
  if (step) setAll(step, false);
}

export function toTop() {
  const content = qs('#contentDiv');
  if (content) content.scrollTop = 0;
}

// Fecha o navegador e o sumário do mobile (escolha de um post, fim da navegação parcial).
// No desktop essas classes não têm efeito.
export function closeMobileNav() {
  root()?.classList.remove(NAV_OPEN, TOC_OPEN);
}

// Sem destino (primeiro/último post, home): botão com aria-disabled="true" e o clique não faz nada.
export function syncTopbarNav() {
  for (const [id, sel] of Object.entries(TOPBAR_TARGETS)) {
    qs(`#${id}`)?.setAttribute('aria-disabled', qs(sel) ? 'false' : 'true');
  }
}

export function initPanels() {
  for (const [id, sel] of Object.entries(TOPBAR_TARGETS)) {
    const button = qs(`#${id}`);
    if (!button) continue;
    // O link é lido no clique: o #contentDiv muda a cada navegação.
    on(button, 'click', () => {
      const link = qs(sel);
      if (link) navigate(link.href);
    });
  }

  const actions = {
    '#topbarToggle': toggleNav,
    '#topbarStructureToggle': toggleToc,
    '#leftBtn': collapseNext,
    '#rightBtn': restoreNext,
    '#toTopBtn': toTop,
  };
  for (const [sel, action] of Object.entries(actions)) {
    const button = qs(sel);
    if (button) on(button, 'click', () => action());
  }
}
