// Navegação parcial (substitui o jquery-pjax): fetch + DOMParser troca só o #contentDiv,
// atualiza document.title e a URL (history), e avisa os outros módulos com eventos em document:
//   nav:start  { detail: { url } }
//   nav:end    { detail: { url } }
// Qualquer falha (rede, status ≠ 200, resposta que não é HTML, página sem #contentDiv)
// cai para a navegação normal com location.assign (location.replace no popstate).
import NProgress from 'nprogress';
import { on, qs } from './dom.js';

const CONTENT = '#contentDiv';
// Extensões que o servidor entrega como página HTML; qualquer outra (feed.xml, .pdf, .png…) não é interceptada.
const HTML_EXT = /\.html?$/i;

let controller = null;
// Documento carregado no #contentDiv (sem o hash): popstate só busca quando ele muda,
// para que voltar de uma âncora do sumário não recarregue a página.
let currentDoc = '';
// Rolagem do #contentDiv por entrada do histórico. A chave é o id guardado no state da entrada
// (ou a URL, para entradas sem state); o Map cobre também a saída por popstate, quando o
// state da entrada que ficou para trás já não é acessível.
const scrolls = new Map();
let currentKey = '';
let nextId = 0;
const entryKey = (state) => state?.id ?? location.href;

function saveScroll() {
  const content = qs(CONTENT);
  if (!content) return;
  scrolls.set(currentKey, content.scrollTop);
  if (history.state?.id) history.replaceState({ ...history.state, scrollTop: content.scrollTop }, '');
}

const docKey = (url) => {
  const u = new URL(url, location.href);
  return u.origin + u.pathname + u.search;
};

function isHtmlPath(pathname) {
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return !last.includes('.') || HTML_EXT.test(last);
}

// Decide se um clique em <a> vira navegação parcial (R2.2).
export function shouldIntercept(event, link) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (!(link instanceof HTMLAnchorElement)) return false; // <a> de SVG etc.
  if (link.hasAttribute('target') || link.hasAttribute('download')) return false;
  if (link.getAttribute('rel')?.split(/\s+/).includes('external')) return false;
  if (link.getAttribute('href')?.startsWith('#')) return false; // âncora local, inclusive "#"

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return false; // externo, mailto:, tel:, javascript:
  if (url.hash && docKey(url) === docKey(location.href)) return false; // âncora na mesma página
  return isHtmlPath(url.pathname);
}

// Depois da troca: anuncia o novo título na região viva #navStatus (fora do #contentDiv) e, se o
// foco se perdeu (estava num elemento substituído, ex.: #nextPost, ou já no body), leva-o ao
// título da página. Foco num elemento que continua na página (ex.: link da lista de posts) fica.
function announce(title) {
  const status = qs('#navStatus');
  if (status) status.textContent = title;
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) return;
  const heading = qs('#pageContent h1') || qs('#pageContent .post-title, #pageContent .page-heading');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function emit(type, url) {
  document.dispatchEvent(new CustomEvent(type, { detail: { url } }));
}

export async function navigate(url, { push = true } = {}) {
  const target = new URL(url, location.href);
  controller?.abort();
  const ctrl = new AbortController();
  controller = ctrl;
  if (push) saveScroll();
  emit('nav:start', target.href);

  try {
    const res = await fetch(target.href, { headers: { Accept: 'text/html' }, signal: ctrl.signal });
    const type = res.headers.get('content-type') || '';
    if (res.status !== 200 || !type.includes('text/html')) throw new Error(`resposta ${res.status} ${type}`);
    // Um redirecionamento para outra origem não troca o conteúdo: navegação normal.
    if (new URL(res.url || target.href).origin !== location.origin) throw new Error('resposta de outra origem');
    const html = await res.text();
    if (ctrl !== controller) return; // outra navegação começou enquanto o corpo chegava

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = qs(CONTENT, doc);
    const current = qs(CONTENT);
    if (!fresh || !current) throw new Error('página sem #contentDiv');

    // Redirecionamento do servidor (ex.: /about → /about/): a URL final vem da resposta.
    const finalUrl = new URL(res.redirected ? res.url : target.href);
    finalUrl.hash = target.hash;

    current.innerHTML = fresh.innerHTML;
    document.title = doc.title;
    if (push) {
      const state = { url: finalUrl.href, id: ++nextId };
      if (finalUrl.href === location.href) history.replaceState(state, '', finalUrl.href);
      else history.pushState(state, '', finalUrl.href);
      currentKey = state.id;
    } else {
      currentKey = entryKey(history.state);
    }
    currentDoc = docKey(finalUrl.href);

    // Voltar/avançar restaura a rolagem da entrada; navegação nova começa no topo e a âncora
    // (hash) é aplicada pelo main.js depois que o sumário cria os <a name>.
    const restored = push ? undefined : scrolls.get(currentKey) ?? history.state?.scrollTop;
    current.scrollTop = restored ?? 0;
    announce(document.title);

    document.dispatchEvent(new CustomEvent('nav:end', { detail: { url: finalUrl.href, restored: restored !== undefined } }));
  } catch (err) {
    if (err?.name === 'AbortError') return;
    // No popstate (push = false) a URL já está no histórico: replace evita uma entrada duplicada.
    if (push) location.assign(target.href);
    else location.replace(target.href);
  } finally {
    if (controller === ctrl) controller = null;
  }
}

export function initNav() {
  currentDoc = docKey(location.href);
  // A primeira entrada do histórico ganha estado, mas popstate não depende dele (R2.3).
  const state = { url: location.href, id: ++nextId };
  history.replaceState(state, '', location.href);
  currentKey = state.id;

  on(document, 'nav:start', () => NProgress.start());
  on(document, 'nav:end', () => NProgress.done());

  on(document, 'click', 'a[href]', (event, link) => {
    if (!shouldIntercept(event, link)) return;
    event.preventDefault();
    navigate(link.href);
  });

  on(window, 'popstate', (event) => {
    const leaving = currentKey;
    const content = qs(CONTENT);
    if (content) scrolls.set(leaving, content.scrollTop);
    currentKey = entryKey(event.state);
    if (docKey(location.href) === currentDoc) return; // só o hash mudou
    navigate(location.href, { push: false });
  });
}
