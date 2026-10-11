// Navegação parcial (substitui o jquery-pjax): fetch + DOMParser troca só o #contentDiv,
// atualiza document.title e a URL (history), e avisa os outros módulos com eventos em document:
//   nav:start  { detail: { url } }
//   nav:end    { detail: { url } }
// Qualquer falha (rede, status ≠ 200, resposta que não é HTML, página sem #contentDiv)
// cai para a navegação normal com location.assign.
import NProgress from 'nprogress';
import { on, qs } from './dom.js';

const CONTENT = '#contentDiv';
// Extensões que o servidor entrega como página HTML; qualquer outra (feed.xml, .pdf, .png…) não é interceptada.
const HTML_EXT = /\.html?$/i;

let controller = null;
// Documento carregado no #contentDiv (sem o hash): popstate só busca quando ele muda,
// para que voltar de uma âncora do sumário não recarregue a página.
let currentDoc = '';

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

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return false; // externo, mailto:, tel:, javascript:
  if (url.hash && docKey(url) === docKey(location.href)) return false; // âncora na mesma página
  return isHtmlPath(url.pathname);
}

function emit(type, url) {
  document.dispatchEvent(new CustomEvent(type, { detail: { url } }));
}

export async function navigate(url, { push = true } = {}) {
  const target = new URL(url, location.href);
  controller?.abort();
  const ctrl = new AbortController();
  controller = ctrl;
  emit('nav:start', target.href);

  try {
    const res = await fetch(target.href, { headers: { Accept: 'text/html' }, signal: ctrl.signal });
    const type = res.headers.get('content-type') || '';
    if (res.status !== 200 || !type.includes('text/html')) throw new Error(`resposta ${res.status} ${type}`);
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
      if (finalUrl.href === location.href) history.replaceState({ url: finalUrl.href }, '', finalUrl.href);
      else history.pushState({ url: finalUrl.href }, '', finalUrl.href);
    }
    currentDoc = docKey(finalUrl.href);

    const anchor = finalUrl.hash && document.getElementById(decodeURIComponent(finalUrl.hash.slice(1)));
    if (anchor) anchor.scrollIntoView();
    else current.scrollTop = 0;

    emit('nav:end', finalUrl.href);
  } catch (err) {
    if (err?.name === 'AbortError') return;
    location.assign(target.href);
  } finally {
    if (controller === ctrl) controller = null;
  }
}

export function initNav() {
  currentDoc = docKey(location.href);
  // A primeira entrada do histórico ganha estado, mas popstate não depende dele (R2.3).
  history.replaceState({ url: location.href }, '', location.href);

  on(document, 'nav:start', () => NProgress.start());
  on(document, 'nav:end', () => NProgress.done());

  on(document, 'click', 'a[href]', (event, link) => {
    if (!shouldIntercept(event, link)) return;
    event.preventDefault();
    navigate(link.href);
  });

  on(window, 'popstate', () => {
    if (docKey(location.href) === currentDoc) return; // só o hash mudou
    navigate(location.href, { push: false });
  });
}
