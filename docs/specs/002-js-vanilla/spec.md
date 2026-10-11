# 002: JS moderno sem jQuery

## Contexto

Depois da 001 e da 003, o visual e o stack estão atualizados, mas o comportamento ainda roda em cerca de 600 linhas de jQuery 2.2.4 escritas em 2017, espalhadas por 10 módulos com efeitos colaterais no carregamento. Os plugins jquery-pjax e jquery-lazyload acompanham esse código. O jQuery 2.2.4 tem 4 alertas moderados de XSS, aceitos até esta spec.

Esse JS também concentra as pendências das specs anteriores:
- só funciona com mouse;
- o estado dos painéis vive em `style="display"` inline, do qual a regra mobile `:has([style*="display: block"])` depende;
- as alturas das listas são medidas no JS, e o mobile compensa com `height: calc(100% - 40px) !important`;
- o service worker é registrado com caminho relativo e dá 404 nas páginas de post;
- as setas do teclado são capturadas globalmente, sem olhar o foco.

## Requisitos

### R1. Sem jQuery
- R1.1 `jquery`, `jquery-pjax` e `jquery-lazyload` saem de `package.json`. Nenhum código do projeto usa `$`, `jQuery` ou `window.$`.
- R1.2 O JS do projeto é composto de módulos ES com responsabilidade única e funções exportadas. Não há código com efeito colateral no topo do módulo, exceto o ponto de entrada, que inicializa tudo uma vez.
- R1.3 `nprogress` continua (não depende de jQuery). `npm audit --omit=dev` termina sem vulnerabilidades.

### R2. Navegação parcial (substitui o PJAX)
- R2.1 Cliques em links internos para páginas HTML trocam só o conteúdo de `#contentDiv` por `fetch`, atualizam `document.title` e a URL com `history.pushState`, e voltam o scroll de `#contentDiv` ao topo.
- R2.2 Não interceptar:
  - links externos;
  - links com `target`, `download` ou modificadores (Ctrl, Meta, Shift, Alt ou botão do meio);
  - âncoras na mesma página (`#…`);
  - URLs que não são HTML (`/feed.xml`, arquivos);
  - respostas que não sejam 200 ou HTML. Nesses casos, faz navegação normal como fallback.
- R2.3 Voltar e avançar do navegador (`popstate`) restauram o conteúdo da URL correspondente.
- R2.4 Durante a navegação, a barra de progresso (NProgress) aparece. Ao final, o sumário é reconstruído e os botões anterior/próximo da barra superior são sincronizados.

### R3. Paridade de comportamento
Continuam iguais ao estado atual:
- R3.1 Filtro em três níveis:
  - categoria filtra tags e posts;
  - tag filtra posts e destaca a categoria;
  - post destaca a tag e a categoria;
  - no mobile, escolher um post fecha o navegador.
- R3.2 O botão "mostrar tudo" limpa o filtro e os destaques.
- R3.3 O olho mostra e oculta as datas e troca o ícone entre `#icon-13eye` e `#icon-eyeblocked`.
- R3.4 Sumário (TOC):
  - construído a partir dos h2 a h6 de `#pageContent`, com `.toc-level-N`;
  - o item da seção visível fica destacado com `aria-current="location"`;
  - fica vazio na home.
- R3.5 Botões da barra e da faixa inferior:
  - alternam os painéis de navegação e o sumário;
  - recolhem e restauram painéis em sequência;
  - voltam ao topo.
- R3.6 Divisores arrastáveis redimensionam tags, posts e sumário, respeitando largura mínima e máxima.
- R3.7 Imagens com `loading="lazy"` nativo. Os posts gerados mantêm a classe `lazy`.
- R3.8 O tema (`theme.js`) continua como está.

### R4. Estado por classes
- R4.1 A visibilidade de painéis e divisores é controlada por classes:
  - `.is-hidden` em cada painel;
  - `#Div.is-nav-open` para o navegador aberto no mobile.
- R4.2 Não há `style.display` nem `.show()`/`.hide()`.
- R4.3 A regra CSS `:has([style*="display: block"])` sai.
- R4.4 As alturas das listas laterais vêm só do CSS (painel em coluna flex, lista com `flex: 1; min-height: 0; overflow-y: auto`). Saem do código o cálculo em JS e o `calc(100% - 40px) !important` do mobile.
- R4.5 O breakpoint usa `matchMedia('(max-width: 1023.98px)')`, a mesma consulta do CSS.

### R5. Teclado e alternativa ao arraste (WCAG 2.2 AA)
- R5.1 Itens de categoria e tag:
  - focáveis (`tabindex="0"`) e acionáveis por Enter e Espaço, com o mesmo efeito do clique;
  - o `span` continua filho direto do `li`.
- R5.2 Posts: o link fica dentro do `li` (`li.postNames > a`, que corrige o HTML inválido `a > li`), mantendo `data-cate` e `data-tag` no `li`.
- R5.3 Divisores:
  - `role="separator"`, `tabindex="0"`, `aria-orientation="vertical"`, `aria-controls` e `aria-valuenow`/`min`/`max` em px;
  - ← e → ajustam a largura em 16px e Home restaura a largura inicial.
- R5.4 Alternativa ao arraste com um só ponteiro: os cabeçalhos dos painéis de tags, posts e sumário têm botões "Diminuir largura" e "Aumentar largura" (ícones `minus`/`plus`), cada um mudando 16px.
- R5.5 Atalhos globais (← recolhe, → restaura, ↑ volta ao topo) são ignorados quando:
  - o foco está em campo editável, separador, botão ou item de lista;
  - há tecla modificadora.
- R5.6 Controles que hoje são `<a>` sem `href` ou `<svg role="button">` viram `<button type="button">`, mantendo IDs e rótulos:
  - `#allCateTagPostBtn`;
  - `#filenameDivDate` (passa a ser um botão contendo o svg; o id do `<svg>` que o código atualiza fica no svg interno, com um id novo documentado, ou o código passa a atualizar o `<use>` dentro do botão);
  - `#mobile`.

### R6. Correções pendentes
- R6.1 O service worker é registrado em `/sw.js` (caminho absoluto) e, por consequência, sem 404 nas páginas de post.
- R6.2 O ícone de telefone (`#mobile`) mostra o número num `title` e abre `tel:`, em vez de `alert`.

## Critérios de aceite

1. `npm ls jquery jquery-pjax jquery-lazyload` vazio. `grep -rnE '\$\(|jQuery' webpack/js entry.js` sem ocorrências. `npm audit --omit=dev` sem vulnerabilidades.
2. Todos os testes atuais passam. A única asserção que muda é o teste "plugins jQuery estão carregados" da 001, substituído por "sem jQuery: `window.jQuery` e `window.$` indefinidos, `NProgress` disponível".
3. Testes novos:
   - (a) navegação parcial:
     - sem recarga;
     - título atualizado;
     - ←/voltar do navegador restaura o post anterior;
     - link externo e `/feed.xml` não são interceptados;
   - (b) Enter numa categoria filtra como o clique;
   - (c) foco num separador + → aumenta o `flex-basis` de tags em 16px e Home restaura;
   - (d) os botões "Aumentar largura" e "Diminuir largura" mudam 16px;
   - (e) com foco num separador, ← não recolhe painéis;
   - (f) no mobile, abrir e fechar o navegador alterna `#Div.is-nav-open`, e o fim das listas é alcançável sem regra `!important`;
   - (g) post não gera requisição 404 para `sw.js`;
   - (h) axe sem violações nas regras `button-name`, `link-name`, `aria-allowed-role`, `nested-interactive` e `listitem` na home e no post.
4. O bundle JS de produção encolhe: `src/js/bundle.js` minificado fica menor que hoje (medir antes e depois).

## Fora de escopo

- Busca funcional.
- Mudanças visuais além de botões de largura, foco e estados já definidos na 003.
- Meses em português, "subscribe via RSS" e placeholder no tema escuro (templates e conteúdo, não JS).
