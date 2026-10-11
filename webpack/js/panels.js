// Painéis e barra superior. Por ora: botões anterior/próximo da barra superior e o
// closeMobileNav() provisório; o restante dos painéis vem para cá na tarefa 3.
import { on, qs } from './dom.js';
import { navigate } from './nav.js';

const TOPBAR_TARGETS = { topbarPre: '#prePost', topbarNext: '#nextPost' };

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
}

// TEMPORÁRIO (002, tarefa 2): fecha o navegador no mobile com display:none inline, igual ao
// .hide() do jQuery que o 5mobile.js/9btn.js ainda usam para abrir. Assim continuam valendo a
// regra CSS `#Div:has(> #filenameDiv[style*="display: block"])` (_mobile.scss) e o teste do
// #topbarToggle. A tarefa 3 troca isto por classes (#Div.is-nav-open / .is-hidden).
const MOBILE_NAV = ['#cateDiv', '#tagDiv', '#filenameDiv', '#rightNavbar', '#lineLeft', '#lineRight', '#lineSide'];

export function closeMobileNav() {
  for (const sel of MOBILE_NAV) {
    const el = qs(sel);
    if (el) el.style.display = 'none';
  }
}
