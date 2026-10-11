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

O Jekyll não compila JS/CSS: rode `npm run build` (ou `npm run serve`) antes de `bundle exec jekyll build` ou `serve`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Gera o sprite de ícones, `src/js/bundle.js`, `src/js/bundle.css` e `src/css/main.css` |
| `npm run build:icons` | Regenera só o sprite `src/_includes/icons.svg` |
| `npm run dev` | Mesmo build, em watch |
| `npm run serve` | Build + watch + `jekyll serve` |
| `npm run gen:posts` | Recria os posts lorem ipsum de exemplo |
| `npm run test:smoke` | Testes Playwright contra o site servido na porta 4001 |

## Tema

O tema segue o claro/escuro do sistema. O botão no canto direito da barra superior alterna em ciclo **Sistema → Claro → Escuro → Sistema** e guarda a escolha em `localStorage["blog.theme"]` (`system`, `light` ou `dark`), aplicada antes da primeira pintura. Para voltar ao padrão, escolha "Sistema" ou apague essa chave. As cores são tokens CSS em `webpack/styles/_tokens.scss`.

Abaixo de 1024px de largura só a barra e o artigo aparecem; os botões de painel da barra abrem a navegação e o sumário.

## Ícones

Os ícones vêm de [Lucide](https://lucide.dev) (`lucide-static`) num sprite SVG local, `src/_includes/icons.svg`, gerado por `scripts/build-icons.mjs`. Para adicionar um ícone, inclua o nome Lucide na lista `names` desse script e rode:

```bash
npm run build:icons
```

Use no HTML com `<svg class="icon" aria-hidden="true"><use href="#i-<nome>"></use></svg>` e dê ao controle um `aria-label` em português.

## Conteúdo

Posts em `src/_posts/` com uma categoria e uma tag cada. Nomes de categoria e tag precisam ser identificadores CSS válidos (sem espaço, `_`, `/`, sem começar por dígito) e uma tag não pode ter o mesmo nome de uma categoria.

## Specs

Ver [`docs/specs/ROADMAP.md`](docs/specs/ROADMAP.md).

## Licença

MIT. Baseado no tema CMS original de Xu-Jian (MIT).
