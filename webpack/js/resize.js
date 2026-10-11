// Redimensionamento das colunas (R3.6, R5.3, R5.4): cada divisor é um separador focável que
// ajusta a largura do painel que controla por ponteiro, teclado (← → 16px, Home restaura) e pelos
// botões ± dos cabeçalhos (alternativa de um só ponteiro ao arraste, WCAG 2.5.7).
// A largura vai em `style.flexBasis`, o único estilo inline permitido; o CSS dá a largura inicial.
import { on, qs, MOBILE_QUERY } from './dom.js';

// side: lado do divisor em que fica o painel. 'left' = o painel cresce quando o divisor vai para
// a direita; 'right' (#lineSide fica à esquerda do sumário) = cresce quando vai para a esquerda.
export const PANELS = {
  lineLeft: { target: '#tagDiv', min: 88, max: 300, initial: 128, side: 'left' },
  lineRight: { target: '#filenameDiv', min: 160, max: 500, initial: 256, side: 'left' },
  lineSide: { target: '#rightNavbar', min: 120, max: 400, initial: 192, side: 'right' },
};

const STEP = 16;
const RESIZING = 'is-resizing';

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, Math.round(value)));

// Largura atual: a inline (arraste anterior) ou a inicial do contrato.
function currentWidth(id) {
  const cfg = PANELS[id];
  const inline = parseFloat(qs(cfg.target)?.style.flexBasis);
  return Number.isFinite(inline) ? inline : cfg.initial;
}

// Estado acessível: aria-valuenow do separador e aria-disabled dos botões no limite.
function syncAria(id, width) {
  const cfg = PANELS[id];
  qs(`#${id}`)?.setAttribute('aria-valuenow', String(width));
  for (const btn of document.querySelectorAll(`[data-resize="${id}"]`)) {
    const atLimit = Number(btn.dataset.step) < 0 ? width <= cfg.min : width >= cfg.max;
    btn.setAttribute('aria-disabled', String(atLimit));
  }
}

function setWidth(id, value) {
  const panel = qs(PANELS[id].target);
  if (!panel) return;
  const width = clamp(value, PANELS[id]);
  panel.style.flexBasis = `${width}px`;
  syncAria(id, width);
}

const nudge = (id, delta) => setWidth(id, currentWidth(id) + delta);

function onKeydown(event, id) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  // As setas movem o divisor na direção da tecla, como no arraste.
  const dir = PANELS[id].side === 'left' ? 1 : -1;
  const actions = {
    ArrowRight: () => nudge(id, dir * STEP),
    ArrowLeft: () => nudge(id, -dir * STEP),
    Home: () => setWidth(id, PANELS[id].initial),
  };
  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

function onPointerdown(event, sep, id) {
  if (event.button !== 0 || !event.isPrimary) return;
  event.preventDefault(); // sem seleção de texto durante o arraste
  const dir = PANELS[id].side === 'left' ? 1 : -1;
  const startX = event.clientX;
  const startWidth = currentWidth(id);
  sep.setPointerCapture(event.pointerId);
  document.documentElement.classList.add(RESIZING);

  const move = (e) => setWidth(id, startWidth + dir * (e.clientX - startX));
  const end = () => {
    sep.removeEventListener('pointermove', move);
    sep.removeEventListener('pointerup', end);
    sep.removeEventListener('pointercancel', end);
    sep.removeEventListener('lostpointercapture', end);
    document.documentElement.classList.remove(RESIZING);
  };
  sep.addEventListener('pointermove', move);
  sep.addEventListener('pointerup', end);
  sep.addEventListener('pointercancel', end);
  sep.addEventListener('lostpointercapture', end);
}

export function initResize() {
  for (const [id, cfg] of Object.entries(PANELS)) {
    const sep = qs(`#${id}`);
    const panel = qs(cfg.target);
    if (!sep || !panel) continue;
    // role, tabindex, aria-orientation, aria-controls e aria-label vêm do HTML (main.html);
    // os limites vêm daqui, para haver uma única fonte.
    sep.setAttribute('aria-valuemin', String(cfg.min));
    sep.setAttribute('aria-valuemax', String(cfg.max));
    syncAria(id, currentWidth(id));

    sep.addEventListener('keydown', (event) => onKeydown(event, id));
    sep.addEventListener('pointerdown', (event) => onPointerdown(event, sep, id));
  }

  // Ao entrar no mobile, a largura inline do desktop venceria as larguras do _mobile.scss:
  // volta à largura do CSS (e ao valor inicial no aria-valuenow).
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener('change', (event) => {
    if (!event.matches) return;
    for (const [id, cfg] of Object.entries(PANELS)) {
      const panel = qs(cfg.target);
      if (panel) panel.style.removeProperty('flex-basis');
      syncAria(id, cfg.initial);
    }
  });

  on(document, 'click', '[data-resize]', (event, btn) => {
    if (btn.getAttribute('aria-disabled') === 'true') return; // no limite: nada a fazer
    const id = btn.dataset.resize;
    if (PANELS[id]) nudge(id, Number(btn.dataset.step) || 0);
  });
}
