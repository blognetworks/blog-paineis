// Utilitários de DOM compartilhados pelos módulos (sem efeito colateral ao importar).

// Mesma consulta do CSS (_mobile.scss: max-width 1023.98px).
export const MOBILE_QUERY = '(max-width: 1023.98px)';

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// on(target, type, handler) ou on(target, type, selector, handler) com delegação via closest.
// No modo delegado, o handler recebe (event, elementoCasado) e `this` é o elemento casado.
export function on(target, type, selectorOrHandler, handler) {
  if (typeof selectorOrHandler === 'function') {
    target.addEventListener(type, selectorOrHandler);
    return () => target.removeEventListener(type, selectorOrHandler);
  }
  const selector = selectorOrHandler;
  const listener = (event) => {
    const origin = event.target instanceof Element ? event.target : event.target?.parentElement;
    const match = origin?.closest(selector);
    if (match && (target === document || target === window || target.contains(match))) {
      handler.call(match, event, match);
    }
  };
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}

export function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}
