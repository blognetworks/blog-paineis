# 002: JS moderno sem jQuery — Plano

**Spec:** [spec.md](spec.md) · **Tarefas:** [tasks.md](tasks.md)

## Arquitetura

```
entry.js
  ├─ nprogress/nprogress.css, @fontsource/*      (inalterado)
  └─ webpack/js/main.js        único ponto com efeito colateral: init() no DOMContentLoaded
        ├─ dom.js              qs, qsa, on (delegação), isMobile(), MOBILE_QUERY
        ├─ theme.js            (existente, sem mudança de comportamento)
        ├─ panels.js           visibilidade por classe; toggleNav, toggleToc, collapseNext, restoreNext, toTop
        ├─ filter.js           filtro 3 níveis + teclado; showAll
        ├─ dates.js            olho (datas)
        ├─ toc.js              buildToc(), scroll spy
        ├─ resize.js           separadores: ponteiro, teclado, botões ±; clamp
        ├─ nav.js              navegação parcial (fetch + history) + eventos nav:start/nav:end
        ├─ shortcuts.js        ← → ↑ globais, cientes do foco
        └─ sw-register.js      navigator.serviceWorker.register('/sw.js')
```

Os módulos legados `webpack/js/0filter&highlight.js`, `4…`, `5mobile.js`, `7structurebar(pjax).js`, `9btn.js`, `9dragbar.js`, `9ES6-scroll.js`, `9lazyload.js`, `9serviceworker.js`, `9showAll(eye).js` e `vendor.js` são **renomeados com `git mv`** para o módulo novo correspondente e reescritos. Assim o histórico fica preservado e não há exclusão de arquivo. O que não tem correspondente (`9lazyload.js`, `9ES6-scroll.js`, `5mobile.js`, `vendor.js`) é esvaziado e deixa de ser importado. A remoção física vai num lote listado e aprovado pelo usuário no fim.

## Contratos

| Módulo | Exporta | Notas |
|---|---|---|
| `dom.js` | `qs(sel, root?)`, `qsa(sel, root?) → Array`, `on(target, type, selectorOrHandler, handler?)`, `MOBILE_QUERY = '(max-width: 1023.98px)'`, `isMobile() → boolean` | `on` com seletor faz delegação via `closest` |
| `panels.js` | `initPanels()`, `isHidden(el)`, `setHidden(el, bool)`, `toggleNav()`, `toggleToc()`, `collapseNext()`, `restoreNext()`, `toTop()`, `closeMobileNav()` | Classe `.is-hidden` nos painéis e divisores; `#Div.is-nav-open` no mobile |
| `filter.js` | `initFilter()`, `showAll()` | Delegação em `#cateDiv`, `#tagDiv`, `#filenameDiv`; Enter/Espaço nos `li[tabindex]` |
| `dates.js` | `initDates()` | Botão `#filenameDivDate` alterna `.hidden` em `.fileNameDate` e o `href` do `<use>` |
| `toc.js` | `buildToc()`, `initTocSpy()` | `buildToc` é idempotente; sumário vazio fora de posts |
| `resize.js` | `initResize()`, `PANELS` | `PANELS = { lineLeft: {target:'#tagDiv', min:88, max:300, initial:128}, lineRight: {target:'#filenameDiv', min:160, max:500, initial:256}, lineSide: {target:'#rightNavbar', min:120, max:400, initial:192} }` |
| `nav.js` | `initNav()`, `navigate(url, {push})` | Dispara `CustomEvent('nav:start')` e `('nav:end', {detail:{url}})` em `document` |
| `shortcuts.js` | `initShortcuts()` | Ignora quando `event.target.closest('input,textarea,select,[contenteditable],button,a,[role=separator],[tabindex]')` ou modificador |
| `sw-register.js` | `registerSW()` | `'/sw.js'` |
| `main.js` | — | Chama `initTheme?`/inits em ordem; escuta `nav:end` → `buildToc()`, `syncTopbarNav()`, `closeMobileNav()` |

`syncTopbarNav()` fica em `panels.js`: `#topbarPre`/`#topbarNext` recebem `aria-disabled` conforme a existência de `#prePost`/`#nextPost`, e o clique dispara `navigate(href)`.

## Decisões

1. **Navegação:** `fetch(url, {headers:{Accept:'text/html'}})` → `DOMParser` → troca do `innerHTML` de `#contentDiv` pelo do documento novo, `document.title` novo, `pushState({url})`. Erro ou resposta que não é HTML → `location.assign(url)`. Uma navegação em andamento é abortada (`AbortController`) quando outra começa.
2. **Alturas:** CSS. `#cateDiv`, `#tagDiv`, `#filenameDiv` e `#rightNavbar` viram `display:flex; flex-direction:column`; as listas recebem `flex:1; min-height:0; overflow-y:auto`. O mesmo vale no mobile, sem `!important`.
3. **Mobile:** `toggleNav()` no mobile alterna `#Div.is-nav-open`. O CSS mobile mostra os painéis só com essa classe, e escolher um post chama `closeMobileNav()`.
4. **Animação:** as transições de 100ms do jQuery saem. Painéis aparecem e somem sem animação, para respeitar `prefers-reduced-motion` por padrão.
5. **Posts no `#filenameUL`:** passa a ser `<li class="postNames" data-cate data-tag><a href>título<sup class="fileNameDate hidden">data</sup></a></li>`. O smoke usa `#filenameUL a` e `li.postNames`, e os dois continuam existindo.
6. **Lazyload:** `scripts/gen-lorem-posts.mjs` passa a emitir `<img class="lazy" loading="lazy" src=… width height alt>`, sem `data-original`, e os posts são regenerados.
7. **Bundle:** baseline minificado = **113.625 bytes** (esbuild `--minify`, entry atual). O critério 4 compara com o mesmo comando.

## Global Constraints

- Nenhum `$`/`jQuery` no código do projeto; módulos ES com exports nomeados.
- IDs e classes usados por CSS e testes preservados (`#cateDiv`, `#tagDiv`, `#filenameDiv`, `#rightNavbar`, `#lineLeft`/`#lineRight`/`#lineSide`, `#MDh1`, `.cateNames`/`.tagNames`/`.postNames`, `.active`, `#filenameUL a`, `#TagX`, `#<Categoria>`, `#prePost`/`#nextPost`, `#topbarToggle`, `#topbarStructureToggle`, `#themeToggle`, `#leftBtn`/`#rightBtn`/`#toTopBtn`).
- Breakpoint: `matchMedia('(max-width: 1023.98px)')`.
- Só tokens de cor no CSS.
- Exclusões só com lista aprovada; renomear com `git mv`.
- Commits assinados, autor Matheus Breguêz, trailer `Co-Authored-By` com o modelo que escreveu.

## Review Focus

1. Interceptação indevida de links (externos, `feed.xml`, âncoras, modificadores).
2. Ordem de init: `buildToc` e `syncTopbarNav` também no carregamento inicial, não só no `nav:end`.
3. `popstate` na primeira entrada do histórico (sem `state`) precisa funcionar.
4. Teclado: Espaço em `li[tabindex]` não pode rolar a lista (`preventDefault`).
5. Listas no mobile alcançáveis sem `!important`.
