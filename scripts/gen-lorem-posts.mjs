// Gera posts lorem ipsum determinísticos em src/_posts.
// Contrato: 4 categorias × 3 tags × 2 posts; cada tag pertence a uma única categoria;
// nomes são identificadores CSS válidos (o filtro usa [data-cate=X], #X e #TagX sem aspas).
import { mkdirSync, writeFileSync } from 'node:fs';

const TAXONOMY = {
  Frontend: ['CSS', 'JavaScript', 'HTML'],
  Backend: ['Node', 'Ruby', 'SQL'],
  Ferramentas: ['Git', 'Docker', 'Editor'],
  Notas: ['Leitura', 'Ideias', 'Diario'],
};
const POSTS_PER_TAG = 2;
const START = Date.UTC(2025, 0, 6);
const DAY = 86_400_000;
const OUT = 'src/_posts';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

function body(tag, n) {
  return `Introdução sobre ${tag}. ${LOREM}

## Visão geral ${n}

${LOREM}

<img class="lazy" data-original="/assets/img/placeholder.svg" src="/assets/img/placeholder.svg" width="640" height="360" alt="Imagem de exemplo">

### Exemplo em JavaScript

\`\`\`js
const soma = (a, b) => a + b;
console.log(soma(${n}, 2));
\`\`\`

#### Exemplo em Ruby

\`\`\`ruby
def saudacao(nome) = "Olá, #{nome}"
puts saudacao("${tag}")
\`\`\`

##### Notas finais

${LOREM}
`;
}

mkdirSync(OUT, { recursive: true });
let i = 0;
for (const [category, tags] of Object.entries(TAXONOMY)) {
  for (const tag of tags) {
    for (let n = 1; n <= POSTS_PER_TAG; n++) {
      const date = new Date(START + i * 3 * DAY).toISOString().slice(0, 10);
      const slug = `${category}-${tag}-${n}`.toLowerCase();
      const front = `---\nlayout: post\ntitle: "${tag} ${n}: lorem ipsum"\ncategories: ${category}\ntags: ${tag}\n---\n\n`;
      writeFileSync(`${OUT}/${date}-${slug}.md`, front + body(tag, n));
      i++;
    }
  }
}
console.log(`${i} posts gerados em ${OUT}`);
