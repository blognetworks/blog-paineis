// Tema: ciclo Sistema → Claro → Escuro no botão #themeToggle.
// "Sistema" = sem atributo data-theme (o CSS segue prefers-color-scheme).
// A pré-pintura (script inline em header.html) aplica o tema salvo antes do CSS.
// O botão fica fora de #contentDiv, então o PJAX não o substitui.

const KEY = 'blog.theme';
const ORDER = ['system', 'light', 'dark'];
const UI = {
  system: { icon: 'i-monitor', label: 'Tema: sistema' },
  light: { icon: 'i-sun', label: 'Tema: claro' },
  dark: { icon: 'i-moon', label: 'Tema: escuro' },
};

const root = document.documentElement;
const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function readStored() {
  try {
    const value = localStorage.getItem(KEY);
    return ORDER.includes(value) ? value : 'system';
  } catch (e) {
    return 'system';
  }
}

function store(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch (e) {
    // Armazenamento indisponível (modo privado, bloqueio): o tema vale só nesta página.
  }
}

function current() {
  const attr = root.getAttribute('data-theme');
  return attr === 'light' || attr === 'dark' ? attr : 'system';
}

function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const value = getComputedStyle(root).getPropertyValue('--bg-topbar').trim().toLowerCase();
  if (value) meta.setAttribute('content', value);
}

function syncButton(theme) {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  button.setAttribute('aria-label', UI[theme].label);
  button.setAttribute('title', UI[theme].label);
  const use = button.querySelector('use');
  if (use) use.setAttribute('href', '#' + UI[theme].icon);
}

function apply(theme) {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  syncButton(theme);
  syncThemeColor();
}

function next() {
  const theme = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
  store(theme);
  apply(theme);
}

function init() {
  apply(readStored());
  // Delegação no document: continua valendo mesmo se a barra for re-renderizada.
  document.addEventListener('click', (event) => {
    if (event.target.closest && event.target.closest('#themeToggle')) next();
  });
  if (media) {
    const onChange = () => {
      if (current() === 'system') syncThemeColor();
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
