// Filtro em três níveis (R3.1, R3.2, R5.1): categoria → tags e posts; tag → posts (destaca a
// categoria); post → destaca tag e categoria. Delegação nos painéis; Enter e Espaço nos
// li[tabindex] fazem o mesmo que o clique. Itens filtrados recebem .hidden (_base.scss).
import { on, qs, qsa, isMobile } from './dom.js';
import { closeMobileNav } from './panels.js';

const ITEMS = '#cateDiv li, #tagDiv li, #filenameDiv li';

const nameOf = (li) => li.querySelector(':scope > span')?.textContent ?? '';

function clearActive() {
  for (const li of qsa(ITEMS)) li.classList.remove('active');
}

// Mostra só os itens de `selector` cujo data-<key> é igual a `value` (comparação literal,
// sem montar seletor CSS com o nome).
function showOnly(selector, key, value) {
  for (const li of qsa(selector)) li.classList.toggle('hidden', li.dataset[key] !== value);
}

function selectCategory(li) {
  const cate = nameOf(li);
  clearActive();
  li.classList.add('active');
  showOnly('.tagNames', 'tagcate', cate);
  showOnly('.postNames', 'cate', cate);
}

function selectTag(li) {
  clearActive();
  li.classList.add('active');
  document.getElementById(li.dataset.tagcate)?.classList.add('active');
  showOnly('.postNames', 'tag', nameOf(li));
}

function selectPost(li) {
  // No mobile, escolher um post fecha o navegador (os destaques não aparecem ali).
  if (isMobile()) {
    closeMobileNav();
    return;
  }
  const { cate, tag } = li.dataset;
  clearActive();
  li.classList.add('active');
  showOnly('.tagNames', 'tagcate', cate);
  document.getElementById(`Tag${tag}`)?.classList.add('active');
  document.getElementById(cate)?.classList.add('active');
}

// "Mostrar tudo": limpa o filtro e os destaques.
export function showAll() {
  for (const li of qsa('.tagNames, .postNames')) li.classList.remove('hidden');
  clearActive();
}

function bindItems(panel, selector, action) {
  if (!panel) return;
  on(panel, 'click', selector, (event, li) => action(li));
  on(panel, 'keydown', selector, (event, li) => {
    if (event.target !== li) return; // só o próprio item focado
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); // Espaço não rola a lista
    action(li);
  });
}

export function initFilter() {
  bindItems(qs('#cateDiv'), 'li.cateNames', selectCategory);
  bindItems(qs('#tagDiv'), 'li.tagNames', selectTag);
  // Posts: o <a> interno navega (nav.js); aqui só destaque e fechamento no mobile.
  const files = qs('#filenameDiv');
  if (files) on(files, 'click', 'li.postNames', (event, li) => selectPost(li));
  const all = qs('#allCateTagPostBtn');
  if (all) on(all, 'click', showAll);
}
