// Gera src/_includes/icons.svg (sprite local) a partir de lucide-static.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const names = [
  'panel-left', 'panel-right', 'folder-git-2', 'chevron-left', 'chevron-right',
  'smartphone', 'mail', 'search', 'folder', 'tags', 'file-text', 'eye', 'eye-off',
  'heart-handshake', 'panel-left-close', 'panel-left-open', 'arrow-up-to-line',
  'monitor', 'sun', 'moon', 'file-user', 'code-xml', 'minus', 'plus',
];
// Ids legados que o JS escreve em #filenameDivDate.
const aliases = { 'icon-13eye': 'eye', 'icon-eyeblocked': 'eye-off' };

const inner = (name) => {
  const svg = readFileSync(join(root, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8');
  const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!m) throw new Error(`SVG inválido: ${name}`);
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean).join('');
};
const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const symbol = (id, name) => `<symbol id="${id}" ${attrs}>${inner(name)}</symbol>`;

const out = [
  '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">',
  ...names.map((n) => symbol(`i-${n}`, n)),
  ...Object.entries(aliases).map(([id, n]) => symbol(id, n)),
  '</svg>',
  '',
].join('\n');
writeFileSync(join(root, 'src/_includes/icons.svg'), out);
console.log(`icons.svg: ${names.length + Object.keys(aliases).length} símbolos`);
