# 003: Redesign "Editor/IDE"

## Contexto

Depois da 001, o site roda num stack atual, mas o visual continua o de 2017. Cada coluna tem uma cor saturada (lilás, rosa, verde) sem relação com estado. Contadores em vermelho sobre rosa ficam em 2,60:1, o tema de código reprova em contraste, a tipografia depende de uma fonte que não é carregada e os ícones vêm de um iconfont chinês com cores embutidas.

O mantenedor escolheu a direção **Editor/IDE** (painéis neutros, hierarquia por peso tipográfico, mono para metadados, um acento) e **tema claro/escuro que segue o sistema, com botão que alterna e guarda a escolha**. Uma auditoria independente (Codex) detalhou diagnóstico, paleta, tipografia e regras por região: [codex-audit.md](codex-audit.md). Esta spec adota essa auditoria como referência de design, com os desvios listados abaixo.

A ordem do roadmap foi alterada por decisão do mantenedor: o redesign vem antes da reescrita do JS (002) e preserva o DOM que o JS legado usa.

## Requisitos

### R1. Tokens e tema
- R1.1 Todas as cores vêm de CSS custom properties com os valores exatos da seção 2 de `codex-audit.md`, para claro e escuro.
- R1.2 Sem preferência salva, o tema segue `prefers-color-scheme`, inclusive sem JavaScript.
- R1.3 Um botão na barra superior alterna em ciclo Sistema → Claro → Escuro → Sistema. A escolha fica em `localStorage["blog.theme"]` e é aplicada em `<html data-theme>` antes da primeira pintura, sem flash. Falha de storage não quebra a página.
- R1.4 A troca de tema sobrevive à navegação PJAX e atualiza `meta[name="theme-color"]`.

### R2. Contraste
- R2.1 Texto e fundo passam WCAG AA (4,5:1 para texto normal) em ambos os temas, na home e num post, medidos pela regra `color-contrast` do axe-core.
- R2.2 Contadores, datas e metadados são neutros (sem vermelho); o acento azul só marca interação, seleção, foco e links.

### R3. Tipografia
- R3.1 Inter (interface e texto) e JetBrains Mono (código, datas, contadores) vêm de `@fontsource/*` empacotados localmente; nenhuma requisição a domínio externo.
- R3.2 Escala e larguras conforme a seção 3 da auditoria; o artigo tem largura máxima de `72ch`.
- R3.3 O título do post aparece uma única vez.

### R4. Regiões
- R4.1 Barra superior com 48px, ícones de 18px em alvos de 32px, botão de tema no grupo direito.
- R4.2 Colunas com superfícies neutras opacas, cabeçalhos ("Categorias", "Tags", "Posts", "Nesta página"), itens com estados normal, hover e ativo (fundo suave, marcador lateral de 3px, peso 600).
- R4.3 Contadores sem float nem offset, alinhados à direita do item em mono.
- R4.4 Divisores de 10px com linha de 1px neutra que fica azul no hover.
- R4.5 Scrollbars visíveis e finas.
- R4.6 TOC com recuo por nível via classes `.toc-level-2` a `.toc-level-6`, sem `&nbsp;`, e coletando títulos só dentro de `#pageContent`.
- R4.7 Conteúdo markdown com ritmo editorial (margens, listas, citações, tabelas, imagens fluidas) e blocos de código com o mapeamento Rouge da auditoria.
- R4.8 Home com lista de posts em ritmo de lista (título 20px/600, data mono), não manchetes.
- R4.9 Foco visível (`:focus-visible`) e seleção com tokens próprios. Zoom do navegador liberado e `lang="pt-BR"`.

### R5. Ícones
- R5.1 O iconfont (`webpack/js/4iconfont.js`) e os emojis/setas Unicode da interface são substituídos por um sprite SVG local gerado a partir de `lucide-static`, com o mapeamento da seção 5 da auditoria.
- R5.2 Os IDs de símbolo antigos usados pelo JS (`#icon-13eye`, `#icon-eyeblocked`) continuam existindo como aliases.
- R5.3 Controles de ícone têm nome acessível em português.

### R6. Mobile
- R6.1 Breakpoint único de **1024px**: abaixo dele só a barra superior e o conteúdo aparecem; os botões existentes continuam abrindo os painéis. O mesmo valor vale no Sass e no JS.
- R6.2 Em 390×844 não há rolagem horizontal da página; imagens e código respeitam a largura.

### R7. Preservação
- R7.1 IDs, classes e atributos `data-*` usados pelo JS legado continuam iguais; o `flex-basis` escrito pelo JS continua prevalecendo (sem `!important` nas larguras).
- R7.2 Os 6 testes do smoke da 001 continuam passando sem alteração de asserções.

## Critérios de aceite

1. `npm run build && bundle exec jekyll build` sem erro; `npm run test:smoke` passa com os testes da 001 e os novos.
2. Teste novo: axe `color-contrast` sem violações na home e num post, nos temas claro e escuro.
3. Teste novo: o botão de tema cicla Sistema → Claro → Escuro, persiste após recarregar e após navegação PJAX; com `localStorage` vazio e `prefers-color-scheme: dark` emulado, `<html>` recebe o tema escuro.
4. Teste novo: em 390×844, `document.documentElement.scrollWidth <= 390` no post, e as colunas laterais estão ocultas.
5. Teste novo: nenhuma requisição sai de `127.0.0.1` ao carregar home e post.
6. Screenshots em `docs/specs/003-redesign/after/`: home e post em 1440×900 (claro e escuro) e post em 390×844.

## Desvios em relação à auditoria

| Auditoria | Esta spec | Motivo |
|---|---|---|
| Breakpoint 1279px | 1024px | 1279px esconderia as colunas em notebooks de 1280px, contrariando a ideia do layout |
| Teclado em categorias/tags, divisores com teclado e alternativa por clique, setas globais cientes do foco | Movido para a 002 | Exige reescrever os módulos de filtro e de arraste, que é o escopo da 002 |
| Corrigir alturas fixas de 30/50px no JS de rolagem | Incluído (R4) só no que a barra de 48px exige | Necessário para a lista não ser cortada |
| Spec numerada 002 | 003 | 002 já é a reescrita do JS |

## Fora de escopo

- Reescrita do JS legado e remoção do jQuery (002).
- Busca funcional (a lupa vira marcador decorativo).
- Deploy (004).
