// Sumário "Nesta página" (#MDh1): construído a partir dos h2–h6 do artigo e com scroll spy
// no #contentDiv. Fora de posts/páginas (home) o sumário fica vazio.
import { on, qs, qsa } from './dom.js';

const HEADINGS = '#pageContent h2, #pageContent h3, #pageContent h4, #pageContent h5, #pageContent h6';
const LIST = '#MDh1';

function headings() {
  // A home (.home) lista posts com <h2>; só artigos (layouts post e page) têm sumário.
  return qs('#pageContent article.post') ? qsa(HEADINGS) : [];
}

// Âncora por índice, como o código antigo: posição do título entre os irmãos.
function siblingIndex(el) {
  return Array.prototype.indexOf.call(el.parentElement.children, el);
}

// Idempotente: limpa a lista e não duplica as âncoras <a name> já inseridas nos títulos.
export function buildToc() {
  const list = qs(LIST);
  if (!list) return;
  const items = headings().map((heading) => {
    const name = String(siblingIndex(heading));
    if (!heading.querySelector(`:scope > a[name="${name}"]`)) {
      const anchor = document.createElement('a');
      anchor.setAttribute('name', name);
      heading.append(anchor);
    }
    const link = document.createElement('a');
    link.href = `#${name}`;
    link.textContent = heading.textContent.trim();
    const li = document.createElement('li');
    li.className = `toc-level-${heading.tagName.charAt(1)}`;
    li.append(link);
    return li;
  });
  list.replaceChildren(...items);
  highlight(); // o primeiro item visível já sai destacado no carregamento e na navegação
}

// Destaca o primeiro título com topo ≥ 0 (o primeiro visível do topo para baixo).
function highlight() {
  const list = qs(LIST);
  if (!list) return;
  const items = qsa(':scope > li', list);
  const index = headings().findIndex((h) => h.getBoundingClientRect().top >= 0);
  items.forEach((li, i) => {
    const active = i === index;
    li.classList.toggle('active', active);
    const link = li.querySelector('a');
    if (active) link?.setAttribute('aria-current', 'location');
    else link?.removeAttribute('aria-current');
  });
}

export function initTocSpy() {
  const content = qs('#contentDiv');
  if (!content) return;
  let frame = 0;
  on(content, 'scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      highlight();
    });
  });
}
