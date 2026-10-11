// Registro do service worker. Caminho absoluto: com 'sw.js' relativo, as páginas de post
// (/AAAA/MM/DD/…) pediam /AAAA/MM/DD/sw.js e recebiam 404.
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Sem SW o site funciona igual (só perde a página offline).
  });
}
