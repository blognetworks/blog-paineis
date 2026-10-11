# 003: Redesign "Editor/IDE" — Tarefas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Aplicar a direção Editor/IDE (tokens claro/escuro, tipografia local, ícones Lucide, regiões redesenhadas) mantendo o layout de cinco colunas e o JS legado.

**Spec:** [spec.md](spec.md) · **Plano e decisões:** [plan.md](plan.md) · **Referência de design (valores exatos):** [codex-audit.md](codex-audit.md)

**Diretório:** worktree `/Users/jobs/Dev/4-projetos/Xu-Jian.github.io-003`, branch `feat/003-redesign` (a partir de `feat/001-stack-upgrade`).

Os Global Constraints e o Review Focus do plan.md valem para todas as tarefas. Ao final de cada tarefa: `npm run build && bundle exec jekyll build` sem erro e `npm run test:smoke` verde (os 6 testes da 001 mais os testes novos já existentes).

---

### Task 1: Sprite de ícones Lucide

**Files:** Create `scripts/build-icons.mjs`, `src/_includes/icons.svg` (gerado). Modify `package.json` (devDependency `lucide-static`, script `build:icons`, `build` passa a rodar `build:icons` primeiro), `entry.js` (remover import de `4iconfont.js`), `src/_layouts/default.html` (`{% include icons.svg %}` logo após `<body>`, que fica em header.html: incluir no início de `#bigDiv` ou logo após o include do header), `src/_includes/topbar.html`, `src/_includes/main.html`, `src/_layouts/default.html` (emojis e setas Unicode).

- [ ] Instalar `lucide-static` com versão exata (`npm install -D -E lucide-static@<última>`).
- [ ] `scripts/build-icons.mjs`: lê `node_modules/lucide-static/icons/<nome>.svg` para a lista de nomes da seção 5 da auditoria (`panel-left`, `panel-right`, `folder-git-2`, `chevron-left`, `chevron-right`, `smartphone`, `mail`, `search`, `folder`, `tags`, `file-text`, `eye`, `eye-off`, `heart-handshake`, `panel-left-close`, `panel-left-open`, `arrow-up-to-line`, `monitor`, `sun`, `moon`) e escreve um `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">` com um `<symbol id="i-<nome>" viewBox="0 0 24 24">` por ícone (conteúdo interno do SVG original, sem atributos de cor), mais aliases `icon-13eye` (= eye) e `icon-eyeblocked` (= eye-off). Saída determinística.
- [ ] Trocar nos templates cada `<use xlink:href="#icon-…">` pelo `#i-…` correspondente (tabela da auditoria §5; `#icon-layouts` da esquerda → `i-panel-left`, da direita → `i-panel-right`); `#filenameDivDate` mantém o id e passa a usar `#icon-eyeblocked` (alias), já que o JS escreve `#icon-13eye`/`#icon-eyeblocked` nele.
- [ ] Emojis/setas: `💝` → `i-heart-handshake`; `➟` invertido (`#leftBtn`) → `i-panel-left-close`; `➟` (`#rightBtn`) → `i-panel-left-open`; `➼` (`#toTopBtn`) → `i-arrow-up-to-line`; `➤➤` dos botões anterior/próximo → `i-chevron-left`/`i-chevron-right`. Preservar todos os IDs.
- [ ] Cada controle de ícone recebe `aria-label` em português; o `<svg>` interno recebe `aria-hidden="true"`.
- [ ] Verificar: nenhum `#icon-` restante nos templates além do alias em `#filenameDivDate`; `grep -c "<symbol" src/_includes/icons.svg` ≥ 22; smoke verde; clicar no olho alterna o ícone (checar via Playwright que `#filenameDivDate use` aponta para `#icon-13eye` após um clique e que esse símbolo existe).
- [ ] Commit: `feat(003): sprite de ícones Lucide local no lugar do iconfont`.

### Task 2: Tokens, tema claro/escuro e fontes locais

**Files:** Create `webpack/styles/main.scss`, `webpack/styles/_tokens.scss`, `webpack/styles/_base.scss`, `webpack/js/theme.js`, `tests/design.spec.js`. Modify `package.json` (`build:css` → `webpack/styles/main.scss`, sem `--silence-deprecation`; `build:js` com loaders de fonte da decisão 4; deps `@fontsource/inter`, `@fontsource/jetbrains-mono`, devDep `@axe-core/playwright`, versões exatas), `entry.js`, `src/_includes/header.html`, `src/_includes/topbar.html` (botão `#themeToggle`), `.gitignore` (`src/js/fonts`).

- [ ] Escrever primeiro os testes de tema em `tests/design.spec.js` (devem falhar): (a) com `localStorage` limpo e `colorScheme: 'dark'` emulado, `getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim().toLowerCase() === '#0f1218'`; com `'light'`, `#f3f4f6`; (b) clicar `#themeToggle` cicla `data-theme`: ausente → `light` → `dark` → ausente, e `localStorage['blog.theme']` vale `light`/`dark`/`system`; (c) após escolher `dark` e recarregar, `data-theme="dark"` já está presente no primeiro `DOMContentLoaded`; (d) após escolher `dark` e navegar para um post via PJAX (clique em `#filenameUL a`), continua `dark` e o botão continua funcional.
- [ ] `_tokens.scss`: mixins `light` e `dark` com TODOS os tokens da auditoria §2 (valores exatos), mais `--font-sans`, `--font-mono`, `--topbar-height: 48px`. `main.scss` aplica: `:root { @include light }`, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { @include dark } }`, `:root[data-theme="dark"] { @include dark }`.
- [ ] `_base.scss`: reset moderno mínimo (box-sizing, margin 0 no body), `body` com `--bg-app`/`--text-primary`/`--font-sans`, `html, body` com altura 100% e `overflow: hidden` (como antes), `:focus-visible` e `::selection` da auditoria §4 "Foco e seleção", `.hidden` preservado com `!important` (o JS depende), cor do NProgress (`#nprogress .bar { background: var(--accent) }`, peg/spinner idem).
- [ ] Nesta tarefa, `main.scss` também faz `@use` de um `_legacy.scss` temporário que contém a tradução literal para SCSS das regras estruturais de layout dos `.sass` antigos (flex de `#Div`, posições, `#arrowNav`, `.lineFlex`, alturas), **sem cores**, para o layout não quebrar antes da Task 3. A Task 3 substitui esse arquivo.
- [ ] `header.html`: `lang="pt-BR"`; viewport `width=device-width, initial-scale=1` (zoom liberado); `<meta name="theme-color">` existente mantido; script inline de pré-pintura antes dos `<link>` de CSS:
  ```html
  <script>try{var t=localStorage.getItem('blog.theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
  ```
- [ ] `theme.js`: ciclo Sistema → Claro → Escuro; grava `system|light|dark` em `localStorage['blog.theme']` (try/catch); remove o atributo em `system`; troca o ícone do botão (`i-monitor`/`i-sun`/`i-moon`) e o `aria-label` ("Tema: sistema/claro/escuro"); atualiza `meta[name=theme-color]` com o valor computado de `--bg-topbar`; escuta `matchMedia('(prefers-color-scheme: dark)')` para atualizar o `theme-color` quando em `system`.
- [ ] `entry.js`: imports de fontes (decisão 4) e `./webpack/js/theme.js` antes dos módulos legados.
- [ ] Verificar: testes de tema verdes, smoke da 001 verde, `ls src/js/fonts` com `.woff2`.
- [ ] Commit: `feat(003): tokens claro/escuro, botão de tema e fontes locais`.

### Task 3: Regiões — barra superior, painéis, itens, divisores, TOC

**Files:** Create `webpack/styles/_layout.scss`, `_topbar.scss`, `_panels.scss`, `_toc.scss`. Delete do `@use`: `_legacy.scss` (o arquivo é removido do `main.scss`; se não for mais usado, apagar o arquivo — ele foi criado nesta branch, então não precisa de aprovação). Modify `src/_includes/topbar.html`, `src/_includes/main.html`, `src/_layouts/default.html` (remover `style=` inline, adicionar cabeçalhos de painel), `webpack/js/7structurebar(pjax).js`, `webpack/js/9ES6-scroll.js`, `webpack/js/0filter&highlight.js`, `webpack/js/5mobile.js`, `webpack/js/9btn.js` (só o literal 414 → 1024).

- [ ] Implementar a auditoria §4 "Estrutura e superfícies", "Barra superior", "Itens normal, hover e ativo", "Contadores `<sup>`", "Divisores arrastáveis" (só CSS e atributos; teclado fica na 002), "TOC" e "Anterior/próximo e controles inferiores", usando os tokens.
- [ ] Cabeçalhos de painel ("Categorias", "Tags", "Nesta página") como elementos FORA das `ul`; nunca entre `li` e `span`. O cabeçalho de posts reaproveita `#filenameDivBtnes` (flex, `gap: 6px`, sem `position:absolute` nem `left:-7px`), com `aria-label="Mostrar todas as categorias, tags e posts"` em `#allCateTagPostBtn`.
- [ ] Remover todos os `style=` inline de `topbar.html`, `main.html` e `default.html`, levando o equivalente para o SCSS. Remover o título duplicado (`<div style="text-align: center;">{{ page.title }}</div>`) e o bloco `meta:` visível (manter `page.meta` só no `<meta>` do head). Remover `<ul id=“list”>` com aspas tipográficas (lixo).
- [ ] `#contentDiv-Buttons`: um único elemento interativo por destino (o `<a id="prePost">`/`<a id="nextPost">` com classe `contentButton`, sem `<button>` dentro), rótulo mono "Anterior"/"Próximo" + título.
- [ ] `7structurebar(pjax).js`: seletor `$("#pageContent h2, #pageContent h3, #pageContent h4, #pageContent h5, #pageContent h6")` e `<li class="toc-level-N"><a href="#…">texto</a></li>` (N = nível do heading), sem `&nbsp;`. O teste da 001 que espera 4 itens na TOC precisa continuar passando.
- [ ] `9ES6-scroll.js`: alturas das listas = altura da janela − `--topbar-height` − altura real do cabeçalho do painel (medida via `getBoundingClientRect`), substituindo `-50`/`-30`.
- [ ] Literais de breakpoint `414` → `1024` nos três módulos citados.
- [ ] Larguras iniciais: `#cateDiv` 128px, `#tagDiv` 128px, `#filenameDiv` 256px, `#rightNavbar` 192px, sem `!important`.
- [ ] Verificar em 1440×900 que o último item de cada lista é alcançável por scroll e que arrastar `#lineLeft` ainda muda o `flex-basis` de `#tagDiv` (teste Playwright em `tests/design.spec.js`: `mouse.down/move/up` sobre `#lineLeft` e comparar `flex-basis` antes/depois).
- [ ] Commit: `feat(003): barra superior, painéis, itens, divisores e TOC no estilo editor`.

### Task 4: Conteúdo, home e código

**Files:** Create `webpack/styles/_content.scss`, `webpack/styles/_code.scss`. Modify `src/_layouts/home.html`, `scripts/gen-lorem-posts.mjs` + posts regenerados (só se necessário para a imagem), `src/assets/img/placeholder.svg`.

- [ ] Auditoria §4 "Conteúdo e Markdown" (incluindo home: título 32/700, itens 20/600, data mono 13px, `padding-block: 16px`, borda inferior) e "Blocos de código e Rouge" com o mapeamento completo de classes. Remover a dependência de `site.minima.date_format` usando formato fixo `"%d %b %Y"`.
- [ ] `#pageContent` com `max-width: 72ch` centralizado; imagens fluidas.
- [ ] `placeholder.svg`: fundo `#E8EDF3`, texto `#475569` (visível nos dois temas).
- [ ] Verificar visualmente home e post nos dois temas (screenshots no scratchpad, ver com Read).
- [ ] Commit: `feat(003): ritmo editorial, home e tema de código acessível`.

### Task 5: Mobile, testes de aceite e screenshots

**Files:** Create `webpack/styles/_mobile.scss`, `docs/specs/003-redesign/after/*.png`. Modify `tests/design.spec.js`, `README.md` (seção curta "Tema" e "Ícones").

- [ ] Testes primeiro em `tests/design.spec.js`: (a) axe `color-contrast` sem violações em home e post, `colorScheme` light e dark (via `localStorage` `light`/`dark` antes do carregamento); (b) viewport 390×844 no post: `scrollWidth <= 390`, `#cateDiv`, `#tagDiv`, `#filenameDiv`, `#rightNavbar` não visíveis; (c) nenhuma requisição para host diferente de `127.0.0.1` em home e post.
- [ ] `_mobile.scss`: auditoria §4 "Mobile" com `@media (max-width: 1023.98px)` (breakpoint 1024px), alvos de 44px.
- [ ] Corrigir o que os testes apontarem até ficarem verdes (sem alterar valores de token sem registrar o motivo no commit).
- [ ] Screenshots: `after/home-light.png`, `after/home-dark.png`, `after/post-light.png`, `after/post-dark.png` (1440×900) e `after/post-mobile.png` (390×844). Conferir cada um com Read.
- [ ] README: como alternar o tema e como regenerar ícones (`npm run build:icons`).
- [ ] Commit: `test(003): contraste, tema, mobile e rede local; screenshots`.
