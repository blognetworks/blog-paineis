# 001: Atualização do stack — Plano

**Spec:** [spec.md](spec.md) · **Tarefas:** [tasks.md](tasks.md)

## Arquitetura

```
_config.yml (source: src)          package.json (esbuild, sass, playwright)
        │                                   │
        ▼                                   ▼
src/ ── Jekyll 4.4 ──► _site/      entry.js ─esbuild─► src/js/bundle.js + src/js/bundle.css
  _layouts/default|home|post|page  webpack/sass/main.sass ─sass─► src/css/main.css
  _includes/header|topbar|main|footer        (artefatos gerados, fora do git)
  _posts/ (lorem, gerado por scripts/gen-lorem-posts.mjs)
```

O Jekyll continua lendo `src/` e copia `src/js` e `src/css` como estáticos. O front-end é compilado antes, pelo npm. Não há integração Jekyll↔npm além dos arquivos gerados.

## Decisões

1. **Ruby 4.0 + Jekyll ~> 4.4.** Gems que saíram do Ruby padrão (`csv`, `base64`, `logger`, `bigdecimal`) entram explicitamente no Gemfile. Se o build falhar por incompatibilidade do Jekyll com o Ruby 4.0, a T2 troca `.ruby-version` para 3.4 e registra `docs/adr/0001-ruby-3-4.md`.
2. **Sem tema `minima`.** O site só usa dele os layouts `home`, `post` e `page`, que embrulham o `default.html` do próprio site. Esses três layouts são copiados para `src/_layouts/` (cópia literal da minima 2.1.1, já que o visual deve ficar igual) e a gem sai. `about.md` deixa de usar `icon-github.html`.
3. **esbuild em vez de webpack.** Formato `iife`, alvo `es2020`. `entry.js` vira um módulo ESM com imports em ordem. O primeiro import, `webpack/js/vendor.js`, publica `window.$`, `window.jQuery` e `window.NProgress`. Isso é necessário porque o jQuery, carregado como CommonJS, não cria a global, e jquery-pjax e jquery-lazyload dependem da global `jQuery` no momento em que são avaliados. Os módulos legados (`webpack/js/*.js`) não mudam: eles continuam referenciando `$` e `NProgress` como globais.
4. **Versões de runtime fixadas nas atuais ou nas mais próximas publicadas no npm:** `jquery@2.2.4`, `jquery-pjax@2.0.1` (a 1.9.6 não existe no npm; a 2.0.1 mantém a API `$(document).pjax(selector, container, options)`), `jquery-lazyload@1.9.7` e `nprogress@0.2.0`. O código legado não é tocado nesta spec. Subir o jQuery para 3.x exigiria auditar APIs removidas, o que vale só para código que a 002 vai apagar. O risco conhecido do jQuery 2 (CVEs de XSS em `$.html`/`$.ajax`) dura até a 002.
5. **CSS por arquivo, não por JS.** O Sass deixa de ser injetado via `style-loader` e vira `src/css/main.css`. O CSS do NProgress sai do import no bundle para `src/js/bundle.css`. Os dois são linkados no `<head>`. A pasta `webpack/` mantém o nome nesta spec para não gerar churn; a 002 reorganiza o JS.
6. **Imports do Sass.** `main.sass` importa `./webpack/sass/...` relativo à raiz, então o build roda com `--load-path=.`. O aviso de depreciação de `@import` é silenciado (`--silence-deprecation=import`); a migração para `@use` fica para a 003.
7. **Conteúdo gerado por script determinístico** (`scripts/gen-lorem-posts.mjs`): 4 categorias × 3 tags × 2 posts = 24 posts. Cada tag pertence a uma única categoria, porque `data-tagcate` usa a categoria do primeiro post da tag. Os nomes são identificadores CSS válidos, porque o filtro usa seletores sem aspas (`[data-cate=X]`, `#X`, `#TagX`).
8. **Smoke test com `@playwright/test`.** O `webServer` próprio roda `jekyll serve --no-watch` na porta 4001, com viewport de 1200×650 e Service Worker bloqueado no contexto de teste, para que o cache não mascare regressões.
9. **Baseline visual** capturada do site atual (container Docker `ruby:2.7` na porta 4010, que serve `master`) antes de qualquer mudança, e salva em `docs/specs/001-stack-upgrade/baseline/`.

## Contratos (consumidos por tarefas posteriores e pela 002)

| Contrato | Valor |
|---|---|
| Categorias | `Frontend`, `Backend`, `Ferramentas`, `Notas` |
| Tags por categoria | Frontend: `CSS`, `JavaScript`, `HTML` · Backend: `Node`, `Ruby`, `SQL` · Ferramentas: `Git`, `Docker`, `Editor` · Notas: `Leitura`, `Ideias`, `Diario` |
| Seletores DOM do filtro | `li.cateNames#<Cat>`, `li.tagNames#Tag<Tag>[data-tagcate=<Cat>]`, `li.postNames[data-cate][data-tag]`, item ativo `.active` |
| PJAX | links `a` dentro do documento, container `#contentDiv` |
| TOC | `#MDh1 > li` gerados a partir de h2–h5 de `#pageContent` |
| Artefatos de build | `src/js/bundle.js`, `src/js/bundle.css`, `src/css/main.css` |
| Scripts npm | `build`, `dev`, `serve`, `test:smoke`, `gen:posts` |

## Global Constraints

- Ruby: versão de `.ruby-version` (alvo 4.0; fallback 3.4 com ADR).
- Node: 24 (`.nvmrc`); npm com `package-lock.json`; nada de yarn.
- Jekyll `~> 4.4`; plugins em `plugins:`; sem gem de tema.
- Nenhuma referência a `cdn.bootcss.com`, Firebase ou Tether em `src/`, `webpack/`, `entry.js` ou `_config.yml`.
- Nenhum dado do autor original (nome, e-mail, telefone, links, ID do Google Analytics) fora de `docs/`.
- Comportamento e visual inalterados (R5); nenhuma mudança de lógica em `webpack/js/*.js` além de remover `firebase.js` e `sw.js` mortos.
- Toda exclusão é listada (caminho, tamanho, motivo) e aprovada pelo usuário antes de executar.
- Commits assinados com GPG, autor Matheus Breguêz, trailer `Co-Authored-By`.

## Review Focus

1. **Ordem de avaliação dos plugins jQuery no bundle.** Se `jquery-pjax` for avaliado antes de `vendor.js`, `$.fn.pjax` fica indefinido e toda navegação vira recarga completa. Coberto pelo teste "abre post via PJAX sem recarga" (T5).
2. **Liquid 4 em modo mais estrito.** `main.html` tem `{% if page.meta != ‘’ %}` com aspas tipográficas. Se o Liquid 4 rejeitar ou mudar a avaliação, aparece "meta:" em todo post. A T2 verifica que o build não emite erro e a T5 verifica que o post não renderiza o texto `meta:`.
3. **Página sem post (home, about) com PJAX e TOC.** O código de TOC roda em toda página; se a home não tem h2, a TOC fica vazia sem erro. Coberto pelo teste "home carrega sem erros de console" (T5).
4. **Clique em post filtrando tags da categoria.** Clicar num post destaca a tag e a categoria e reduz a coluna de tags às da categoria. Coberto pelo teste de filtro por post (T5).
5. **Rebuild limpo sem artefatos.** Com `src/js/bundle.js` fora do git, um clone novo sem `npm run build` não tem JS. O critério de aceite 1 é verificado em clone limpo na T7.
