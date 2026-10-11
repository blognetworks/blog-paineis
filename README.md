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
