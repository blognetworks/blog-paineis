// Painéis e barra superior. Nesta etapa (002, tarefa 1) só os botões anterior/próximo
// da barra superior; o restante dos painéis vem para cá nas próximas tarefas.
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
