# 002: JS moderno sem jQuery — Tarefas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Reescrever o comportamento do site em módulos ES vanilla, remover jQuery e plugins, e cumprir teclado/alternativa ao arraste (WCAG 2.2 AA).

**Spec:** [spec.md](spec.md) · **Plano, contratos e decisões:** [plan.md](plan.md)

**Diretório:** worktree `/Users/jobs/Dev/4-projetos/Xu-Jian.github.io-002`, branch `feat/002-js-vanilla` (a partir de `master`).

Valem para todas as tarefas os Global Constraints, os contratos e o Review Focus do plan.md. Ao final de cada tarefa: `npm run build && bundle exec jekyll build` sem erro e `npm run test:smoke` verde. Durante as Tasks 1–4 o jQuery continua instalado: cada módulo novo substitui o legado correspondente, e os dois nunca ligam o mesmo handler. A Task 5 remove o jQuery.

---

### Task 1: Base, navegação parcial e registro do SW

**Files:** Create `webpack/js/dom.js`, `webpack/js/main.js`. `git mv "webpack/js/7structurebar(pjax).js" webpack/js/nav.js` (a parte de TOC vai para `toc.js` nesta mesma tarefa: crie `toc.js` com `buildToc`/`initTocSpy` portados), `git mv webpack/js/9serviceworker.js webpack/js/sw-register.js`. Modify `entry.js` (importar `main.js`; deixar de importar os legados substituídos), `tests/design.spec.js` ou novo `tests/behavior.spec.js`.

- [ ] Testes primeiro (`tests/behavior.spec.js`), RED:
  - (1) clicar no primeiro post da home troca `#contentDiv` sem recarga (marcador em `window`), atualiza `document.title` para o título do post e a URL;
  - (2) `page.goBack()` volta para a home e `#contentDiv` contém `.post-list`;
  - (3) um link com `target="_blank"` e o link de `/feed.xml` não são interceptados (inserir um link de teste via `page.evaluate` e verificar que o evento não foi `defaultPrevented` pelo handler, ou que houve navegação completa);
  - (4) post não gera resposta 404 para nenhuma URL terminando em `sw.js` (com `serviceWorkers: 'allow'` neste teste).
- [ ] `dom.js` e `nav.js` conforme contratos e decisão 1; `nav:start` → `NProgress.start()`, `nav:end` → `NProgress.done()`.
- [ ] `toc.js`: `buildToc()` (h2–h6 de `#pageContent`, `.toc-level-N`, âncora por índice como hoje, sumário vazio fora de post) e `initTocSpy()` (scroll de `#contentDiv`, destaca o primeiro heading com topo ≥ 0, `aria-current="location"`).
- [ ] `panels.js` mínimo nesta tarefa: `syncTopbarNav()` (aria-disabled + clique em `#topbarPre`/`#topbarNext` chama `navigate`).
- [ ] `main.js`: init de nav, toc (inicial + `nav:end`), syncTopbarNav (inicial + `nav:end`), sw-register.
- [ ] O `$(document).pjax(...)` deixa de existir (arquivo renomeado e reescrito). Verificar que nenhum outro legado chama `showSideStructure`/`syncTopbarNav` antigos; se chamar, ajustar a chamada para o export novo.
- [ ] GREEN + suíte completa. Commit: `feat(002): navegação parcial, TOC e registro do SW em JS vanilla`.

### Task 2: Filtro, datas e "mostrar tudo" com teclado

**Files:** `git mv "webpack/js/0filter&highlight.js" webpack/js/filter.js`, `git mv "webpack/js/9showAll(eye).js" webpack/js/dates.js` (o `showAll` vai para `filter.js`). Modify `src/_includes/main.html` (R5.1, R5.2, R5.6 para `#allCateTagPostBtn` e `#filenameDivDate`), CSS em `webpack/styles/_panels.scss` só o necessário para `li > a` e botões, `main.js`, testes.

- [ ] Testes primeiro, RED: (1) Enter em `#Frontend` (focado) filtra igual ao clique (3 tags e 6 posts visíveis, `.active`); (2) Espaço em `#TagCSS` filtra 2 posts e não rola a lista; (3) botão `#allCateTagPostBtn` é `<button>` e limpa o filtro; (4) botão do olho mostra datas e o `<use>` aponta para `#icon-13eye`, e o segundo clique volta para `#icon-eyeblocked`; (5) axe `listitem` e `nested-interactive` sem violações na home.
- [ ] Markup: `li.cateNames`/`li.tagNames` com `tabindex="0"`; `#filenameUL` com `<li class="postNames" data-cate data-tag><a href>…</a></li>`; `#allCateTagPostBtn` e `#filenameDivDate` como `<button type="button">` (ids no botão; o código de datas atualiza o `<use>` dentro do botão).
- [ ] `filter.js` com delegação e teclado; no mobile, clicar num post chama `closeMobileNav()` (stub em `panels.js` se a Task 3 ainda não existir: a Task 3 o implementa de fato).
- [ ] Os 6 testes do smoke continuam verdes (`#filenameUL a` e `li.postNames` existem).
- [ ] Commit: `feat(002): filtro, datas e mostrar tudo em JS vanilla com teclado`.

### Task 3: Painéis por classe, alturas por CSS e mobile

**Files:** `git mv webpack/js/9btn.js webpack/js/panels.js` (fundir com o `panels.js` da Task 1: se já existir, mova o conteúdo útil e esvazie `9btn.js` em vez de `git mv`), `git mv webpack/js/9ES6-scroll.js webpack/js/shortcuts.js` (conteúdo novo: atalhos), `webpack/js/5mobile.js` deixa de ser importado. Modify `webpack/styles/_base.scss` (`.is-hidden`), `_layout.scss`/`_panels.scss` (coluna flex), `_mobile.scss` (classe `#Div.is-nav-open`; remover `:has([style*=…])` e `calc(100% - 40px) !important`), `main.js`, testes.

- [ ] Testes primeiro, RED: (1) desktop: `#topbarToggle` esconde e mostra os três painéis e os dois divisores (classe `.is-hidden`, sem `style.display`); (2) `#topbarStructureToggle` alterna sumário e `#lineSide`; (3) `#leftBtn` recolhe em sequência cate → tag → posts e `#rightBtn` restaura em ordem inversa; (4) mobile 390×844: `#topbarToggle` alterna `#Div.is-nav-open`; as três listas rolam até o último item dentro da viewport; escolher um post remove a classe; (5) `grep` no CSS compilado não encontra `style*=` nem `!important` em `height`; (6) com foco num separador, ← não recolhe painéis; sem foco em controle, ← recolhe.
- [ ] Implementar conforme contratos e decisões 2–4; `shortcuts.js` conforme contrato.
- [ ] Commit: `feat(002): painéis por classe, alturas em CSS e atalhos cientes do foco`.

### Task 4: Redimensionamento acessível

**Files:** `git mv webpack/js/9dragbar.js webpack/js/resize.js`. Modify `src/_includes/main.html` (atributos ARIA nos separadores; botões ± nos cabeçalhos de tags, posts e sumário), `scripts/build-icons.mjs` (+`minus`, `plus`) e `src/_includes/icons.svg` regenerado, `webpack/styles/_panels.scss` (botões ± discretos, visíveis em hover/foco do cabeçalho, alvo 24px mínimo), `main.js`, testes.

- [ ] Testes primeiro, RED: (1) arrastar `#lineLeft` 40px aumenta `#tagDiv` ~40px (já existe: manter verde); (2) foco em `#lineLeft` + `ArrowRight` → +16px; `Home` → 128px; `aria-valuenow` acompanha; (3) botões "Aumentar largura"/"Diminuir largura" do cabeçalho de tags mudam ±16px e respeitam min 88/max 300; (4) axe `aria-allowed-role`, `button-name` sem violações.
- [ ] Pointer Events (`pointerdown`/`pointermove`/`pointerup` com `setPointerCapture`), clamp conforme `PANELS`, largura gravada em `style.flexBasis` (único inline permitido, como hoje).
- [ ] Commit: `feat(002): redimensionamento por ponteiro, teclado e botões`.

### Task 5: Remover jQuery, lazyload nativo e aceite

**Files:** Modify `package.json`/`package-lock.json` (remover `jquery`, `jquery-pjax`, `jquery-lazyload`), `entry.js` (sem `vendor.js`), `webpack/js/vendor.js` e `webpack/js/9lazyload.js` e `webpack/js/5mobile.js` deixam de ser importados (exclusão física fica para o lote aprovado), `scripts/gen-lorem-posts.mjs` + `src/_posts/*` regenerados (decisão 6), `tests/smoke.spec.js` (só a troca do teste "plugins jQuery estão carregados", spec critério 2), `src/_includes/topbar.html` (R6.2 `#mobile` como link `tel:`), README (seção "Arquitetura do JS" curta com a tabela de módulos).

- [ ] Trocar o teste da 001 conforme o critério 2 e mostrar RED com o jQuery ainda presente.
- [ ] Remover as dependências e os imports; `grep -rnE '\$\(|jQuery' webpack/js entry.js` vazio (exceto arquivos não importados que vão para o lote de exclusão — listar).
- [ ] `npm audit --omit=dev` sem vulnerabilidades; medir bundle minificado com o comando do plano (decisão 7) e registrar antes/depois no commit.
- [ ] Suíte completa verde; screenshots rápidos de home/post desktop e mobile no scratchpad para confirmar que nada visual regrediu.
- [ ] Commit: `feat(002): remove jQuery e plugins; lazyload nativo`.
