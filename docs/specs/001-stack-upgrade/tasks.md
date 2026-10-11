# 001: Atualização do stack — Tarefas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rodar o site em Jekyll 4.4 + Ruby atual + esbuild/Dart Sass, sem CDN morto, com conteúdo lorem ipsum e smoke test, mantendo features e visual.

**Architecture:** ver [plan.md](plan.md). O Jekyll lê `src/`; o npm compila `entry.js` e `webpack/sass/main.sass` para `src/js` e `src/css` antes.

**Tech Stack:** Ruby 4.0, Jekyll 4.4.1, jekyll-feed 0.18, Node 24, esbuild 0.28, sass 1.105, @playwright/test 1.64, concurrently 10, jQuery 2.2.4 + jquery-pjax 2.0.1 + jquery-lazyload 1.9.7 + nprogress 0.2.0.

**Spec:** [spec.md](spec.md)

**Diretório de trabalho:** worktree `/Users/jobs/Dev/4-projetos/Xu-Jian.github.io-001`, branch `feat/001-stack-upgrade`. Todos os comandos rodam a partir dela.

Global Constraints e Review Focus estão em [plan.md](plan.md#global-constraints) e valem para todas as tarefas.

**Regra de exclusão (inviolável):** toda etapa marcada 🗑 mostra ao usuário a lista exata (caminho, tamanho, motivo) e só executa após aprovação explícita daquela lista.

---

### Task 1: Baseline visual do site atual

**Files:**
- Create: `docs/specs/001-stack-upgrade/baseline/home.png`, `docs/specs/001-stack-upgrade/baseline/post.png`

**Interfaces:**
- Consumes: container Docker `xujian-jekyll` servindo `master` em `http://localhost:4010`.
- Produces: as imagens de referência usadas na Task 6.

- [ ] **Step 1: Confirmar que o site atual está no ar**

Run: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4010/`
Expected: `200`. Se não for 200: `docker start xujian-jekyll` e aguardar cerca de 20 s.

- [ ] **Step 2: Instalar o Chromium do Playwright (cache global do usuário)**

Run: `npx -y playwright@1.64.0 install chromium`
Expected: termina sem erro.

- [ ] **Step 3: Capturar home e um post**

```bash
mkdir -p docs/specs/001-stack-upgrade/baseline
POST=$(curl -s http://localhost:4010/ | grep -o 'href="/[^"]*\.html"' | head -1 | cut -d'"' -f2)
echo "$POST"
npx -y playwright@1.64.0 screenshot --viewport-size "1200,650" --wait-for-timeout 1500 http://localhost:4010/ docs/specs/001-stack-upgrade/baseline/home.png
npx -y playwright@1.64.0 screenshot --viewport-size "1200,650" --wait-for-timeout 1500 "http://localhost:4010$POST" docs/specs/001-stack-upgrade/baseline/post.png
```
Expected: dois PNG não vazios. Abrir os dois com a ferramenta Read e confirmar visualmente as três colunas e a barra superior.

- [ ] **Step 4: Commit**

```bash
git add docs/specs/001-stack-upgrade/baseline
git commit -m "docs(001): baseline visual do site antes da atualização"
```

---

### Task 2: Ruby e Jekyll 4.4 sem tema

**Files:**
- Create: `.ruby-version`, `src/_layouts/home.html`, `src/_layouts/post.html`, `src/_layouts/page.html`
- Modify: `Gemfile`, `Gemfile.lock` (regenerado), `_config.yml`, `.gitignore`, `src/about.md`

**Interfaces:**
- Consumes: nada.
- Produces: `bundle exec jekyll build` funcional; layouts `home`, `post` e `page` locais que embrulham `default`.

- [ ] **Step 1: Teste de falha: o build atual não roda no Ruby local**

Run: `ruby -v && bundle exec jekyll build 2>&1 | tail -3`
Expected: falha (Bundler não resolve o lock de Ruby 2.7 ou o Jekyll 3.4 quebra no Ruby 4).

- [ ] **Step 2: Escrever `.ruby-version`**

```
4.0.7
```

- [ ] **Step 3: Substituir o `Gemfile`**

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.4"
gem "webrick", "~> 1.9"

# Removidas do Ruby padrão; o Jekyll e suas dependências ainda as carregam.
gem "base64"
gem "bigdecimal"
gem "csv"
gem "logger"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.18"
end
```

- [ ] **Step 4: Instalar gems isoladas no projeto e regenerar o lock**

```bash
bundle config set --local path vendor/bundle
bundle lock --update
bundle install
```
Expected: `Bundle complete!`, com `jekyll 4.4.x` no `Gemfile.lock`.

- [ ] **Step 5: Ignorar artefatos do Bundler**

Acrescentar ao `.gitignore`:
```
.bundle
vendor
```

- [ ] **Step 6: Substituir `_config.yml`**

```yaml
title: Meu Blog
email: voce@example.com
name: Seu Nome
Phone: "000 0000 0000"
# name e Phone aparecem no ícone de telefone da barra superior.

baseurl: ""
url: ""

markdown: kramdown
kramdown:
  input: GFM

plugins:
  - jekyll-feed

# O Jekyll lê só src/; node_modules, vendor e webpack ficam de fora naturalmente.
source: src
destination: _site

githubHomeURL: https://github.com/seu-usuario
githubReadmeURL: https://github.com/seu-usuario/seu-repo
codePen_url: https://codepen.io/seu-usuario
```

- [ ] **Step 7: Criar `src/_layouts/home.html`** (cópia literal da minima 2.1.1)

```html
---
layout: default
---

<div class="home">

  <h1 class="page-heading">Posts</h1>
  
  {{ content }}

  <ul class="post-list">
    {% for post in site.posts %}
      <li>
        {% assign date_format = site.minima.date_format | default: "%b %-d, %Y" %}
        <span class="post-meta">{{ post.date | date: date_format }}</span>

        <h2>
          <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title | escape }}</a>
        </h2>
      </li>
    {% endfor %}
  </ul>

  <p class="rss-subscribe">subscribe <a href="{{ "/feed.xml" | relative_url }}">via RSS</a></p>

</div>
```

- [ ] **Step 8: Criar `src/_layouts/post.html`** (cópia literal da minima 2.1.1, sem o bloco Disqus)

```html
---
layout: default
---
<article class="post" itemscope itemtype="http://schema.org/BlogPosting">

  <header class="post-header">
    <h1 class="post-title" itemprop="name headline">{{ page.title | escape }}</h1>
    <p class="post-meta">
      <time datetime="{{ page.date | date_to_xmlschema }}" itemprop="datePublished">
        {% assign date_format = site.minima.date_format | default: "%b %-d, %Y" %}
        {{ page.date | date: date_format }}
      </time>
      {% if page.author %}
        • <span itemprop="author" itemscope itemtype="http://schema.org/Person"><span itemprop="name">{{ page.author }}</span></span>
      {% endif %}</p>
  </header>

  <div class="post-content" itemprop="articleBody">
    {{ content }}
  </div>

</article>
```

- [ ] **Step 9: Criar `src/_layouts/page.html`** (cópia literal da minima 2.1.1)

```html
---
layout: default
---
<article class="post">

  <header class="post-header">
    <h1 class="post-title">{{ page.title | escape }}</h1>
  </header>

  <div class="post-content">
    {{ content }}
  </div>

</article>
```

- [ ] **Step 10: Substituir `src/about.md`** (remove o include da minima)

```markdown
---
layout: page
title: Sobre
permalink: /about/
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Escreva aqui quem você é e do que trata este blog.
```

- [ ] **Step 11: Rodar o build**

Run: `bundle exec jekyll build 2>&1 | tail -5 && grep -c 'class="cateNames"' _site/index.html`
Expected: `done in ...`, sem `Liquid Exception` nem `Error`, e contagem > 0. Se houver erro de Liquid em `src/_includes/main.html` por causa de `‘’`, trocar `{% if page.meta != ‘’ %}` por `{% if page.meta and page.meta != "" %}`; a semântica pretendida (mostrar meta só se definido) é preservada, e a mudança fica registrada na mensagem de commit.

**Se o Step 4 ou o Step 11 falharem por incompatibilidade com o Ruby 4.0** (erro dentro de gem, não de template): trocar `.ruby-version` para a 3.4 mais recente instalável, criar `docs/adr/0001-ruby-3-4.md` (contexto: Jekyll 4.4 x Ruby 4.0, com a mensagem de erro; decisão: Ruby 3.4; status: aceito; consequências: exige gerenciador de versão) e repetir os Steps 4 e 11.

- [ ] **Step 12: Commit**

```bash
git add .ruby-version Gemfile Gemfile.lock _config.yml .gitignore src/_layouts/home.html src/_layouts/post.html src/_layouts/page.html src/about.md
git commit -m "build: Jekyll 4.4 no Ruby 4.0 sem tema minima"
```

---

### Task 3: Build de front-end com esbuild e Dart Sass, sem CDN

**Files:**
- Create: `.nvmrc`, `webpack/js/vendor.js`
- Modify: `package.json` (substituído), `entry.js` (substituído), `src/_includes/header.html`, `src/_includes/footer.html`, `src/_layouts/default.html`, `.gitignore`
- Create (gerado): `package-lock.json`

**Interfaces:**
- Consumes: build Jekyll da Task 2.
- Produces: scripts `build`, `build:js`, `build:css`, `dev`, `serve`; artefatos `src/js/bundle.js`, `src/js/bundle.css` e `src/css/main.css`; globais `window.$`, `window.jQuery`, `window.NProgress`, `$.fn.pjax`, `$.fn.lazyload`.

- [ ] **Step 1: Teste de falha: ainda há CDN morto e Firebase**

Run: `grep -rn "bootcss\|firebase\|tether" src/_includes src/_layouts entry.js`
Expected: várias ocorrências.

- [ ] **Step 2: Escrever `.nvmrc`**

```
24
```

- [ ] **Step 3: Substituir `package.json`**

```json
{
  "name": "cms-blog",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "build:js": "esbuild entry.js --bundle --format=iife --target=es2020 --outfile=src/js/bundle.js",
    "build:css": "sass --no-source-map --load-path=. --silence-deprecation=import webpack/sass/main.sass src/css/main.css",
    "build": "npm run build:js && npm run build:css",
    "dev": "concurrently -n js,css \"npm:build:js -- --watch=forever\" \"npm:build:css -- --watch\"",
    "serve": "npm run build && concurrently -n fe,jekyll \"npm:dev\" \"bundle exec jekyll serve --livereload\"",
    "gen:posts": "node scripts/gen-lorem-posts.mjs",
    "test:smoke": "playwright test"
  }
}
```

- [ ] **Step 4: Instalar dependências com versão exata**

```bash
npm install -E jquery@2.2.4 jquery-pjax@2.0.1 jquery-lazyload@1.9.7 nprogress@0.2.0
npm install -D -E esbuild@0.28.2 sass@1.105.1 @playwright/test@1.64.0 concurrently@10.0.6
```
Expected: `package-lock.json` criado, sem erros.

- [ ] **Step 5: Criar `webpack/js/vendor.js`**

```js
// Publica as globais que os plugins jQuery e os módulos legados esperam.
// Importado primeiro em entry.js: jquery-pjax e jquery-lazyload leem `jQuery` ao serem avaliados.
import jQuery from 'jquery';
import NProgress from 'nprogress';

window.$ = window.jQuery = jQuery;
window.NProgress = NProgress;
```

- [ ] **Step 6: Substituir `entry.js`**

```js
// A ordem importa: vendor.js publica as globais antes dos plugins e dos módulos legados.
import './webpack/js/vendor.js';
import 'jquery-pjax';
import 'jquery-lazyload';
import 'nprogress/nprogress.css';

import './webpack/js/0filter&highlight.js';
import './webpack/js/4iconfont.js';
import './webpack/js/5mobile.js';
import './webpack/js/7structurebar(pjax).js';
import './webpack/js/9btn.js';
import './webpack/js/9dragbar.js';
import './webpack/js/9ES6-scroll.js';
import './webpack/js/9lazyload.js';
import './webpack/js/9serviceworker.js';
import './webpack/js/9showAll(eye).js';
```

- [ ] **Step 7: Rodar o build de front-end**

Run: `npm run build && ls -la src/js/bundle.js src/js/bundle.css src/css/main.css`
Expected: três arquivos não vazios. Avisos de depreciação do Sass, além do `import` silenciado, são aceitáveis; erros não.

- [ ] **Step 8: `src/_includes/header.html`: linkar o CSS e remover o manifest quebrado**

Remover a linha `  <link rel="manifest" href="/manifest.json">` e substituir o bloco comentado

```html
  <!-- 

  <link rel="stylesheet" href="/css/main.css" >


   -->
```

por

```html
  <link rel="stylesheet" href="/js/bundle.css">
  <link rel="stylesheet" href="/css/main.css">
```

- [ ] **Step 9: Substituir `src/_includes/footer.html`**

```html
	<script src="/js/bundle.js"></script>
</body></html>
```

(Remove os scripts de `cdn.bootcss.com`, Tether, o link CSS do NProgress, o comentário do Firebase e o Google Analytics do autor original.)

- [ ] **Step 10: `src/_layouts/default.html`: remover o include do Firebase**

Apagar a linha `	{% include firebase.html %}`.

- [ ] **Step 11: Ignorar artefatos gerados**

No `.gitignore`, substituir a linha `src/assets/bundle.js` por:
```
src/js/bundle.js
src/js/bundle.css
src/css/main.css
```

- [ ] **Step 12: Verificar**

```bash
grep -rn "bootcss\|firebase\|tether" src/_includes/header.html src/_includes/footer.html src/_layouts entry.js; echo "grep exit=$?"
bundle exec jekyll build 2>&1 | tail -2
grep -c 'js/bundle.js' _site/index.html
```
Expected: `grep exit=1` (nada encontrado), build `done`, contagem `1`.

- [ ] **Step 13: Commit**

```bash
git add .nvmrc package.json package-lock.json entry.js webpack/js/vendor.js src/_includes/header.html src/_includes/footer.html src/_layouts/default.html .gitignore
git commit -m "build: esbuild + Dart Sass, deps empacotadas e fim do CDN bootcss"
```

---

### Task 4: Remoção de conteúdo, identidade e legado

**Files:**
- Delete (🗑, com aprovação): ver Step 1
- Modify: `src/_includes/topbar.html`, `src/sw.js`, `src/contact.html`

**Interfaces:**
- Consumes: Tasks 2 e 3.
- Produces: repositório sem posts, sem dados do autor original e sem arquivos de webpack/Firebase/gem.

- [ ] **Step 1: 🗑 Listar o lote de exclusão e pedir aprovação**

```bash
{
  ls -d src/_posts/* ;
  ls -d CNAME jekyll-theme-CMS-2.2.2.gem jekyll-theme-CMS.gemspec yarn.lock webpack.config.js .babelrc \
        webpack/first.js webpack/component webpack/js/firebase.js webpack/js/sw.js \
        src/_includes/firebase.html src/Misc ;
  find . -path ./node_modules -prune -o -path ./vendor -prune -o -path ./.git -prune -o \( -name 'Icon' -o -name 'Icon_' \) -size 0 -print ;
} | while read -r f; do printf '%s\t%s\n' "$(du -sh "$f" | cut -f1)" "$f"; done
```

Apresentar ao usuário a saída completa, agrupada por motivo:
- `src/_posts/*`: posts do autor original (R4.1).
- `CNAME`, `.gem`, `.gemspec`: domínio e pacote do tema original (R4.5).
- `yarn.lock`, `webpack.config.js`, `.babelrc`, `webpack/first.js`, `webpack/component/`: toolchain removida (R2.2, R4.5).
- `webpack/js/firebase.js`, `src/_includes/firebase.html`: Firebase (R3.3).
- `webpack/js/sw.js`: cópia antiga não referenciada do `src/sw.js`.
- `src/Misc/`: rascunhos com dados do autor original (R4.4).
- `Icon`/`Icon_` vazios: lixo do Finder (R4.5).

Mais `src/js/bundle.js`, removido só do índice do git (`git rm --cached`; o arquivo é regenerado pelo build) (R2.5).

**PARAR até o usuário aprovar esta lista.** Excluir apenas o que foi aprovado.

- [ ] **Step 2: Executar a exclusão aprovada**

```bash
git rm -r -q src/_posts CNAME jekyll-theme-CMS-2.2.2.gem jekyll-theme-CMS.gemspec yarn.lock webpack.config.js .babelrc \
  webpack/first.js webpack/component webpack/js/firebase.js webpack/js/sw.js src/_includes/firebase.html src/Misc
git rm -q --cached src/js/bundle.js
find . -path ./node_modules -prune -o -path ./vendor -prune -o -path ./.git -prune -o \( -name 'Icon' -o -name 'Icon_' \) -size 0 -print0 | xargs -0 git rm -q --ignore-unmatch
find . -path ./node_modules -prune -o -path ./vendor -prune -o -path ./.git -prune -o \( -name 'Icon' -o -name 'Icon_' \) -size 0 -print -delete
mkdir -p src/_posts
```

- [ ] **Step 3: `src/_includes/topbar.html`: tirar o telefone fixo do botão de doação**

Substituir
```html
        title="Donate-支付宝: 186 219 23213"; onclick="alert('Donate-支付宝: 186 219 23213')">💝
```
por
```html
        title="Donate: {{site.Phone}}"; onclick="alert('Donate: {{site.Phone}}')">💝
```

- [ ] **Step 4: `src/contact.html`: placeholder**

```html
---
layout: page
title: Contato
permalink: /contact/
---
<p>Lorem ipsum: escreva aqui como falar com você ({{ site.email }}).</p>
```

- [ ] **Step 5: `src/sw.js`: remover hosts comentados do autor original e do CDN morto**

Apagar do array `ignoreFetch` as linhas comentadas que contêm `clouddn.com`, `bootcss.com`, `alicdn.com` e `google-analytics.com`; o restante do arquivo fica intacto.

- [ ] **Step 6: Verificar a ausência de identidade e de CDN**

Run: `grep -rn "bootcss\|firebase\|Xu-Jian\|xx2610\|186 219\|UA-5882" src webpack _config.yml entry.js; echo "exit=$?"`
Expected: `exit=1`.

Run: `npm run build && bundle exec jekyll build 2>&1 | tail -2`
Expected: build `done` com zero posts.

- [ ] **Step 7: Commit**

```bash
git add -A src webpack _config.yml .gitignore
git commit -m "chore: remove conteúdo, identidade e toolchain do autor original"
```

---

### Task 5: Conteúdo lorem ipsum e smoke test

**Files:**
- Create: `playwright.config.js`, `tests/smoke.spec.js`, `scripts/gen-lorem-posts.mjs`, `src/assets/img/placeholder.svg`, `src/_posts/*.md` (gerados)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: scripts `build` e `gen:posts`; contratos de categorias, tags e seletores DOM de [plan.md](plan.md#contratos-consumidos-por-tarefas-posteriores-e-pela-002).
- Produces: `npm run test:smoke` verde; 24 posts determinísticos; o primeiro post em ordem cronológica é `Frontend`/`CSS`.

- [ ] **Step 1: Escrever `playwright.config.js`**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4001',
    viewport: { width: 1200, height: 650 },
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run build && bundle exec jekyll serve --host 127.0.0.1 --port 4001 --no-watch',
    url: 'http://127.0.0.1:4001/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
```

- [ ] **Step 2: Escrever `tests/smoke.spec.js`**

```js
import { test, expect } from '@playwright/test';

// Erros conhecidos e aceitos (recursos ausentes que não fazem parte desta spec).
const IGNORED = [/favicon/i];

function trackErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('home carrega com 4 categorias, 12 tags, 24 posts e sem erros', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.locator('li.cateNames')).toHaveCount(4);
  await expect(page.locator('li.tagNames')).toHaveCount(12);
  await expect(page.locator('li.postNames')).toHaveCount(24);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('plugins jQuery estão carregados', async ({ page }) => {
  await page.goto('/');
  const ok = await page.evaluate(() => ({
    pjax: typeof window.$?.fn?.pjax,
    lazyload: typeof window.$?.fn?.lazyload,
    nprogress: typeof window.NProgress?.start,
  }));
  expect(ok).toEqual({ pjax: 'function', lazyload: 'function', nprogress: 'function' });
});

test('clicar numa categoria filtra tags e posts', async ({ page }) => {
  await page.goto('/');
  await page.locator('#Frontend').click();
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.tagNames:visible')).toHaveCount(3);
  await expect(page.locator('li.postNames:visible')).toHaveCount(6);
});

test('clicar numa tag filtra posts e destaca a categoria', async ({ page }) => {
  await page.goto('/');
  await page.locator('#TagCSS').click();
  await expect(page.locator('#TagCSS')).toHaveClass(/active/);
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.postNames:visible')).toHaveCount(2);
});

test('clicar num post navega via PJAX, sem recarga, e destaca tag e categoria', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.evaluate(() => { window.__semRecarga = true; });
  const first = page.locator('#filenameUL a').first();
  const href = await first.getAttribute('href');
  await first.locator('li.postNames').click();
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await expect(page.locator('#pageContent h2').first()).toBeVisible();
  expect(await page.evaluate(() => window.__semRecarga)).toBe(true);
  await expect(page.locator('#TagCSS')).toHaveClass(/active/);
  await expect(page.locator('#Frontend')).toHaveClass(/active/);
  await expect(page.locator('li.tagNames:visible')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('post tem TOC de h2 a h5, imagem lazy e não vaza "meta:"', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('#filenameUL a').first().getAttribute('href');
  await page.goto(href);
  await expect(page.locator('#MDh1 > li')).toHaveCount(4);
  await expect(page.locator('#pageContent img.lazy')).toHaveCount(1);
  await expect(page.locator('#contentDiv')).not.toContainText('meta:');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx playwright test 2>&1 | tail -15`
Expected: FAIL; `li.cateNames` com contagem 0 (não há posts).

- [ ] **Step 4: Criar `src/assets/img/placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#e2efc4"/><text x="320" y="190" font-family="sans-serif" font-size="28" text-anchor="middle" fill="#555">640 × 360</text></svg>
```

- [ ] **Step 5: Criar `scripts/gen-lorem-posts.mjs`**

```js
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
```

- [ ] **Step 6: Gerar os posts**

Run: `npm run gen:posts && ls src/_posts | head -3 && ls src/_posts | wc -l`
Expected: `24 posts gerados`; o primeiro arquivo é `2025-01-06-frontend-css-1.md`; contagem `24`.

- [ ] **Step 7: Ignorar a saída do Playwright**

Acrescentar ao `.gitignore`:
```
test-results
playwright-report
.playwright-mcp
```

- [ ] **Step 8: Rodar os testes**

Run: `npm run test:smoke 2>&1 | tail -15`
Expected: `6 passed`.

Se `clicar num post navega via PJAX` falhar com `__semRecarga` indefinido, o PJAX não interceptou o clique (ver Review Focus 1 no plan.md): confirmar com `grep -n "jquery-pjax\|vendor" src/js/bundle.js | head` que o vendor aparece antes do plugin. Se a TOC tiver contagem diferente de 4, conferir em `webpack/js/7structurebar(pjax).js` quais headings ele percorre e ajustar o **teste** ao comportamento atual (o objetivo é preservar o comportamento, não mudá-lo), registrando o motivo no commit.

- [ ] **Step 9: Commit**

```bash
git add playwright.config.js tests/smoke.spec.js scripts/gen-lorem-posts.mjs src/assets/img/placeholder.svg src/_posts .gitignore
git commit -m "test: posts lorem ipsum determinísticos e smoke test Playwright"
```

---

### Task 6: Comparação visual e console

**Files:**
- Create: `docs/specs/001-stack-upgrade/after/home.png`, `docs/specs/001-stack-upgrade/after/post.png`

**Interfaces:**
- Consumes: baseline da Task 1; site da Task 5.
- Produces: evidência para o critério de aceite 4.

- [ ] **Step 1: Subir o site novo na porta 4002**

Run (em background): `npm run build && bundle exec jekyll serve --host 127.0.0.1 --port 4002 --no-watch`
Aguardar até `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4002/` retornar `200`.

- [ ] **Step 2: Capturar home e o primeiro post**

```bash
mkdir -p docs/specs/001-stack-upgrade/after
POST=$(curl -s http://127.0.0.1:4002/ | grep -o 'href="/[^"]*\.html"' | head -1 | cut -d'"' -f2)
npx playwright screenshot --viewport-size "1200,650" --wait-for-timeout 1500 http://127.0.0.1:4002/ docs/specs/001-stack-upgrade/after/home.png
npx playwright screenshot --viewport-size "1200,650" --wait-for-timeout 1500 "http://127.0.0.1:4002$POST" docs/specs/001-stack-upgrade/after/post.png
```

- [ ] **Step 3: Comparar**

Abrir `baseline/home.png` e `after/home.png` com a ferramenta Read, depois `baseline/post.png` e `after/post.png`. Critério: mesmas colunas, mesmas larguras aproximadas, mesma paleta (lilás, rosa, verde-claro), barra superior e setas iguais. O texto difere (lorem ipsum) e isso é esperado. Qualquer diferença de layout ou cor é bug: corrigir antes de seguir. A causa provável é a ordem de CSS (`bundle.css` antes de `main.css` no `<head>`) ou regra que dependia da injeção via JS.

- [ ] **Step 4: Parar o servidor da porta 4002 e fazer commit**

```bash
git add docs/specs/001-stack-upgrade/after
git commit -m "docs(001): screenshots pós-atualização para comparação"
```

---

### Task 7: Aceite em clone limpo e README

**Files:**
- Modify: `README.md` (substituído)

**Interfaces:**
- Consumes: tudo acima.
- Produces: critérios de aceite 1–5 verificados.

- [ ] **Step 1: Substituir `README.md`**

````markdown
# Blog CMS de três colunas

Blog Jekyll com navegação Categorias → Tags → Posts, PJAX, barras arrastáveis e sumário por post. Baseado no tema CMS de Xu-Jian.

## Requisitos

- Ruby conforme `.ruby-version`
- Node conforme `.nvmrc`

## Desenvolvimento

```bash
bundle install
npm ci
npm run serve        # front-end em watch + jekyll serve em http://localhost:4000
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Gera `src/js/bundle.js`, `src/js/bundle.css` e `src/css/main.css` |
| `npm run dev` | Mesmo build, em watch |
| `npm run serve` | Build + watch + `jekyll serve` |
| `npm run gen:posts` | Recria os posts lorem ipsum de exemplo |
| `npm run test:smoke` | Testes Playwright contra o site servido na porta 4001 |

## Conteúdo

Posts em `src/_posts/` com uma categoria e uma tag cada. Nomes de categoria e tag precisam ser identificadores CSS válidos (sem espaço, `_`, `/`, sem começar por dígito) e uma tag não pode ter o mesmo nome de uma categoria.

## Specs

Ver [`docs/specs/ROADMAP.md`](docs/specs/ROADMAP.md).
````

- [ ] **Step 2: Commit do README**

```bash
git add README.md
git commit -m "docs: README com stack e comandos atuais"
```

- [ ] **Step 3: Critério 1: clone limpo**

```bash
CLONE=/private/tmp/claude-501/-Users-jobs-Dev-4-projetos-Xu-Jian-github-io/89a244e9-8219-499b-86cd-5b283f1eaaae/scratchpad/clone-001
git clone -q --branch feat/001-stack-upgrade "$PWD" "$CLONE"
cd "$CLONE" && bundle config set --local path vendor/bundle && bundle install --quiet && npm ci --silent && npm run build && bundle exec jekyll build 2>&1 | tail -2
```
Expected: `done in ...`, sem erro.

- [ ] **Step 4: Critério 2: smoke test no clone**

Run (no clone): `npm run test:smoke 2>&1 | tail -5`
Expected: `6 passed`.

- [ ] **Step 5: Critério 3: grep de identidade e CDN**

Run (na worktree): `grep -rn "bootcss\|firebase\|Xu-Jian\|xx2610\|186 219" src _config.yml; echo "exit=$?"`
Expected: `exit=1`.

- [ ] **Step 6: Critérios 4 e 5**

O critério 4 foi verificado na Task 6. O 5 é coberto pelos testes de console da Task 5. Registrar o resultado no relatório final ao usuário.

- [ ] **Step 7: 🗑 Limpeza do clone temporário**

Mostrar ao usuário o caminho e o tamanho (`du -sh "$CLONE"`), aguardar aprovação e só então remover o diretório.
