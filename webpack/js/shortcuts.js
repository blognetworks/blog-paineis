// Atalhos globais (R5.5): ← recolhe o próximo painel, → restaura, ↑ volta ao topo do artigo.
// Ignorados com tecla modificadora ou quando o foco está num controle que já usa as setas
// (campo editável, separador, botão, link ou item de lista focável).
import { collapseNext, restoreNext, toTop } from './panels.js';

const IGNORE = 'input,textarea,select,[contenteditable],button,a,[role=separator],[tabindex]';
const ACTIONS = { ArrowLeft: collapseNext, ArrowRight: restoreNext, ArrowUp: toTop };

function onKeydown(event) {
  const action = ACTIONS[event.key];
  if (!action || event.defaultPrevented) return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest(IGNORE)) return;
  action();
}

export function initShortcuts() {
  document.addEventListener('keydown', onKeydown);
}
