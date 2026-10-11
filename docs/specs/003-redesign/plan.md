# 003: Redesign "Editor/IDE" — Plano

**Spec:** [spec.md](spec.md) · **Referência de design:** [codex-audit.md](codex-audit.md) · **Tarefas:** [tasks.md](tasks.md)

## Arquitetura

```
webpack/styles/            (novo, SCSS com @use; substitui webpack/sass/)
  main.scss  ─ @use tokens, base, layout, topbar, panels, toc, content, code, mobile
  _tokens.scss             mixins light()/dark() com os valores da auditoria §2 + fontes/medidas
  ...
        │ sass
        ▼
src/css/main.css

entry.js ─ vendor.js → plugins → @fontsource/* (CSS + woff2) → theme.js → módulos legados
        │ esbuild (loader file p/ fontes)
        ▼
src/js/bundle.js, src/js/bundle.css, src/js/fonts/*

scripts/build-icons.mjs ─ lucide-static → src/_includes/icons.svg (sprite, versionado)
src/_includes/header.html ─ <script> inline de pré-pintura do tema
src/_layouts/default.html ─ {% include icons.svg %} no início do <body>
```

## Decisões

1. **Pasta nova `webpack/styles/` em SCSS com `@use`.** Reescrever ~500 linhas por região fica mais claro em arquivos novos do que editando os `.sass` antigos. O `build:css` passa a compilar `webpack/styles/main.scss` sem `--silence-deprecation`. Os `.sass` antigos e `webpack/js/4iconfont.js` deixam de ser importados; a exclusão física vai num lote listado e aprovado pelo usuário ao final.
2. **Tokens.** `:root` recebe o tema claro; `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` e `:root[data-theme="dark"]` recebem o escuro, via mixin, para não duplicar valores. Preferência "Sistema" = sem atributo `data-theme`.
3. **Pré-pintura.** Script inline curto no `<head>` lê `localStorage["blog.theme"]` dentro de `try/catch` e define `data-theme` só para `light`/`dark`. `webpack/js/theme.js` (ESM novo) cuida do botão `#themeToggle`, do ciclo, do ícone, do `aria-label`, do `meta[name=theme-color]` e de `matchMedia` change. O botão fica fora de `#contentDiv`, então o PJAX não o substitui.
4. **Fontes.** Imports `@fontsource/inter/{400,500,600,700}.css`, `@fontsource/inter/400-italic.css`, `@fontsource/jetbrains-mono/{400,600}.css`, `@fontsource/jetbrains-mono/400-italic.css` em `entry.js`. esbuild com `--loader:.woff2=file --loader:.woff=file --asset-names=fonts/[name]-[hash] --public-path=/js/`. `src/js/fonts/` vai para o `.gitignore`.
5. **Ícones.** `lucide-static` (devDependency) + `scripts/build-icons.mjs` gera `src/_includes/icons.svg` com `<symbol id="i-<nome>">` para cada ícone usado, mais aliases `icon-13eye` (eye) e `icon-eyeblocked` (eye-off) usados pelo JS. O sprite gerado é versionado (Jekyll precisa dele sem passar pelo npm); `npm run build` o regenera.
6. **Breakpoint 1024px** em `webpack/styles/_mobile.scss` e nos pontos do JS legado que testam `414` (`0filter&highlight.js`, `5mobile.js`, `9btn.js`): troca do literal, sem mudar lógica.
7. **Mudanças mínimas no JS legado**, só onde o visual depende:
   - `7structurebar(pjax).js`: seletor `#pageContent h2, #pageContent h3, …` e `<li class="toc-level-N">` no lugar de `&nbsp;`.
   - `9ES6-scroll.js`: alturas calculadas a partir de `--topbar-height` e do cabeçalho real do painel, em vez de `-50`/`-30`.
   - `9showAll(eye).js`: `<use href="#icon-13eye">` continua funcionando via alias (sem mudança).
8. **Testes novos** em `tests/design.spec.js` com `@axe-core/playwright` (contraste nos dois temas), tema, mobile e rede local. O `playwright.config.js` não muda.

## Global Constraints

- Valores de cor exatamente os da seção 2 de `codex-audit.md`.
- Breakpoint único 1024px (Sass e JS).
- Nenhum `!important` em larguras de coluna; `flex-basis` inline do JS prevalece.
- IDs/classes/`data-*` do JS legado preservados; `span` direto dentro de `.cateNames`/`.tagNames` preservado (o filtro lê `children('span')`).
- Sem requisição a domínio externo.
- Os 6 testes do smoke da 001 passam sem mudar asserções.
- Exclusões só com lista aprovada pelo usuário.
- Commits assinados, autor Matheus Breguêz, trailer `Co-Authored-By` com o nome do modelo que escreveu.

## Review Focus

1. **Flash de tema errado** ao carregar com tema salvo diferente do sistema: o script inline precisa rodar antes do CSS pintar.
2. **Larguras iniciais vs JS de arraste:** o arraste calcula com padding e `flex-basis`; padding externo dos painéis fica 0.
3. **Filtro por `children('span')`:** cabeçalhos ou wrappers novos não podem entrar entre `li` e `span`.
4. **Alias de ícone dinâmico:** clicar no olho troca para `#icon-13eye`; o símbolo precisa existir.
5. **Rolagem cortada:** com barra de 48px e cabeçalhos de 40px, o fim das listas precisa ficar alcançável.
