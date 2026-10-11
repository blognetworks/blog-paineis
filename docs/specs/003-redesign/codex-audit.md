**Recomendação:** manter a estrutura de cinco colunas e transformar sua aparência em um editor: painéis neutros, conteúdo com maior respiro e azul reservado a interação, seleção e foco. A cor deve comunicar estado; a posição e os títulos devem identificar as regiões.

Auditoria baseada nos screenshots e na leitura do repositório. Nenhum arquivo foi alterado. Os trechos abaixo são especificações para implementação.

## 1. Diagnóstico, em ordem de severidade

### 1. Contraste insuficiente em informações pequenas e código — crítico

Os contadores usam `red` e `font-size: 0.7em`. Sobre o painel `pink`, vermelho `#FF0000` sobre `#FFC0CB` tem contraste de **2,60:1**, abaixo dos **4,5:1** exigidos para texto pequeno. Além disso, vermelho sugere erro ou notificação, embora esses números sejam apenas quantidades.

Fonte: [main.sass:13](webpack/sass/main.sass:13).

O tema de código também apresenta falhas mensuráveis sobre `#272822`:

| Elemento atual | Cor | Contraste |
|---|---|---:|
| Comentários | `#75715E` | **3,03:1** |
| Keywords/operadores rosados | `#F92672` | **3,93:1** |
| Prompt | `#555555` | **1,99:1** |
| Erros | `#960050` | **1,71:1** |
| Inserções/remoções | `#49483E` | **1,61:1** |

Fonte: [7-syntax.sass:1](webpack/sass/7-syntax.sass:1).

**Ação:** substituir os contadores por metadados neutros e trocar integralmente a paleta Rouge. Texto normal deve alcançar pelo menos 4,5:1; indicadores visuais necessários à operação, pelo menos 3:1. [Critérios de contraste textual](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### 2. A interface ainda impede acessibilidade além da cor — crítico

- O viewport declara `maximum-scale=1.0, user-scalable=0`, restringindo zoom.
- Categorias e tags são `li` com eventos de clique, sem operação equivalente por teclado.
- Controles são SVGs, spans ou links sem `href`, com identificação dependente de `title`.
- Divisores oferecem somente interação por mouse.
- As setas globais interceptam o teclado sem considerar o elemento focado.

Fontes: [header.html:13](src/_includes/header.html:13), [main.html:8](src/_includes/main.html:8), [9dragbar.js:25](webpack/js/9dragbar.js:25), [9btn.js:91](webpack/js/9btn.js:91).

**Ação:** liberar zoom, fornecer nomes acessíveis e teclado para todos os controles e acrescentar alternativa por clique para redimensionar. A conformidade AA do blog depende desses ajustes, além da paleta.

### 3. Grandes áreas coloridas competem com o conteúdo — alta

Categorias roxas, tags lilases, posts rosas, artigo verde e barra superior rosada recebem destaque semelhante. Não há relação consistente entre essas cores e ações ou estados. No screenshot, a própria estrutura é mais expressiva que o artigo.

As superfícies usam misturas de RGBA e cores opacas. Os divisores repetem cores específicas, inclusive `#e3f0c3`, criando vários lugares para manter a mesma aparência.

Fontes: [main.sass:88](webpack/sass/main.sass:88), [main.sass:112](webpack/sass/main.sass:112), [1-Dragbar.sass:20](webpack/sass/1-Dragbar.sass:20).

**Ação:** usar superfícies opacas neutras, agrupando categorias/tags e dando ao conteúdo a superfície principal. Eliminar cores específicas de cada metade dos divisores.

### 4. Seleção, hover e links não formam um sistema — alta

- `.active` usa amarelo global.
- Links são pretos e não têm sublinhado.
- Hover da barra superior usa `#00bfff`.
- Ícones introduzem vermelho, turquesa e amarelo dentro dos próprios paths.
- Não há tratamento explícito de `:focus-visible` nos Sass auditados.

Fontes: [main.sass:9](webpack/sass/main.sass:9), [2-Topbar.sass:45](webpack/sass/2-Topbar.sass:45), [4iconfont.js:359](webpack/js/4iconfont.js:359).

**Ação:** hover neutro; ativo com fundo azul suave, marcador lateral e peso 600; foco com contorno azul; links do texto sublinhados. Seleção e foco precisam permanecer distinguíveis.

### 5. O artigo perdeu ritmo de leitura — alta

O reset universal remove margens e padding. O conteúdo recebe apenas `5px` de padding, sem largura máxima. Títulos, parágrafos, datas e blocos de código ficam encostados.

A home apresenta todos os títulos com peso e tamanho muito fortes, formando uma sequência de manchetes. No post, o título aparece duas vezes: centralizado pelo include e novamente como `h1`.

Fontes: [main.sass:1](webpack/sass/main.sass:1), [main.sass:145](webpack/sass/main.sass:145), [main.html:95](src/_includes/main.html:95), [post.html:7](src/_layouts/post.html:7).

**Ação:** preservar apenas um título, estabelecer margens editoriais e limitar o artigo a `72ch`.

### 6. Tipografia sem distribuição de funções — média/alta

A família `"Ubuntu Mono"` é aplicada a todos os elementos, seguida de Verdana. Não há carregamento dessa fonte no header ou dependência correspondente no `package.json`; portanto, sua presença depende do computador.

Datas e contadores não têm diferenciação tipográfica intencional. O TOC usa `0.8em`, ficando excessivamente pequeno.

Fontes: [main.sass:4](webpack/sass/main.sass:4), [main.sass:158](webpack/sass/main.sass:158).

**Ação:** Inter para interface e leitura; JetBrains Mono para código, datas e números.

### 7. Painéis estreitos e controles congestionados — média/alta

Categorias partem de `83px`, tags de `100px` e TOC de `90px`. Isso corta nomes como “Ferramentas” e praticamente inviabiliza títulos do sumário.

A barra de posts posiciona controles absolutamente e aproxima os contadores com `left: -7px`. Ícones de 25px ocupam uma barra de apenas 30px.

Fontes: [main.sass:71](webpack/sass/main.sass:71), [main.html:37](src/_includes/main.html:37), [6-icon.sass:3](webpack/sass/6-icon.sass:3).

**Ação:** aumentar larguras iniciais, organizar controles em flex e separar tamanho do desenho do ícone de sua área clicável.

### 8. Mobile e rolagem têm problemas estruturais visíveis — alta

No screenshot mobile, a imagem de 640px ultrapassa a largura disponível, deslocando seu texto e ocupando uma área desproporcional. O gerador fixa `width="640" height="360"` sem regra responsiva suficiente.

Também existem breakpoints divergentes: Sass usa 414/700px, enquanto o JS toma decisões em 414px. Scrollbars são escondidas, embora as regiões continuem roláveis.

Fontes: [gen-lorem-posts.mjs:27](scripts/gen-lorem-posts.mjs:27), [0-Mobile.sass:5](webpack/sass/0-Mobile.sass:5), [5mobile.js:5](webpack/js/5mobile.js:5), [main.sass:59](webpack/sass/main.sass:59).

**Ação:** imagens fluidas, um único breakpoint compartilhado e scrollbars visíveis.

## 2. Paleta proposta: claro e escuro

**Acento escolhido: azul.** O syntax highlight também usa apenas azuis e neutros, com distinção adicional por peso e itálico. Não reintroduzir uma paleta multicolorida dentro do artigo.

Os tokens repetidos são intencionais: permitem manter contratos sem atribuir uma cor diferente a cada coluna.

```css
:root,
:root[data-theme="light"] {
  color-scheme: light;

  /* Superfícies */
  --bg-app: #F3F4F6;
  --bg-topbar: #F8FAFC;
  --bg-categories: #F1F5F9;
  --bg-tags: #F1F5F9;
  --bg-posts: #F8FAFC;
  --bg-content: #FFFFFF;
  --bg-toc: #F8FAFC;
  --bg-elevated: #FFFFFF;
  --bg-hover: #E8EDF3;
  --bg-active: #DBEAFE;

  /* Bordas e controles */
  --border: #D7DEE7;
  --border-control: #748092;
  --divider: #748092;

  /* Texto */
  --text-primary: #111827;
  --text-secondary: #475569;
  --text-tertiary: #596579;
  --text-on-accent: #FFFFFF;

  /* Interação */
  --accent: #1D4ED8;
  --accent-hover: #1E40AF;
  --accent-soft: #DBEAFE;
  --link: #1D4ED8;
  --link-hover: #1E40AF;
  --focus: #1D4ED8;
  --selection-bg: #DBEAFE;
  --selection-text: #111827;

  /* Código */
  --code-bg: #F6F8FA;
  --code-text: #24292F;
  --code-border: #D7DEE7;
  --code-inline-bg: #F1F5F9;
  --code-inline-text: #24292F;
  --code-comment: #59636E;
  --code-keyword: #174EA6;
  --code-string: #1D4ED8;
  --code-number: #334155;
  --code-function: #1D4ED8;
  --code-type: #174EA6;
  --code-constant: #174EA6;
  --code-attribute: #334155;
  --code-variable: #24292F;
  --code-operator: #59636E;
  --code-punctuation: #59636E;
  --code-regex: #1D4ED8;
  --code-error: #24292F;
  --code-error-bg: #E8EDF3;
  --code-mark-bg: #DBEAFE;
  --code-insert-bg: #DBEAFE;
  --code-delete-bg: #E8EDF3;
}

:root[data-theme="dark"] {
  color-scheme: dark;

  /* Superfícies */
  --bg-app: #0F1218;
  --bg-topbar: #161B22;
  --bg-categories: #161B22;
  --bg-tags: #161B22;
  --bg-posts: #1B212B;
  --bg-content: #11161D;
  --bg-toc: #161B22;
  --bg-elevated: #1B212B;
  --bg-hover: #252F3D;
  --bg-active: #203758;

  /* Bordas e controles */
  --border: #303A49;
  --border-control: #7C8DA3;
  --divider: #7C8DA3;

  /* Texto */
  --text-primary: #F1F5F9;
  --text-secondary: #B6C2D2;
  --text-tertiary: #A1ACBC;
  --text-on-accent: #11161D;

  /* Interação */
  --accent: #93C5FD;
  --accent-hover: #BFDBFE;
  --accent-soft: #203758;
  --link: #93C5FD;
  --link-hover: #BFDBFE;
  --focus: #93C5FD;
  --selection-bg: #203758;
  --selection-text: #F1F5F9;

  /* Código */
  --code-bg: #161B22;
  --code-text: #E6EDF3;
  --code-border: #303A49;
  --code-inline-bg: #252F3D;
  --code-inline-text: #E6EDF3;
  --code-comment: #9DA7B3;
  --code-keyword: #93C5FD;
  --code-string: #BFDBFE;
  --code-number: #CBD5E1;
  --code-function: #93C5FD;
  --code-type: #93C5FD;
  --code-constant: #93C5FD;
  --code-attribute: #CBD5E1;
  --code-variable: #E6EDF3;
  --code-operator: #9DA7B3;
  --code-punctuation: #9DA7B3;
  --code-regex: #BFDBFE;
  --code-error: #E6EDF3;
  --code-error-bg: #252F3D;
  --code-mark-bg: #203758;
  --code-insert-bg: #203758;
  --code-delete-bg: #252F3D;
}
```

**Contrastes calculados pela luminância relativa sRGB**, apresentados com duas casas decimais:

| Combinação | Claro | Escuro |
|---|---:|---:|
| Texto primário / conteúdo | 17,74:1 | 16,58:1 |
| Texto secundário / conteúdo | 7,58:1 | 10,06:1 |
| Texto terciário / categorias | 5,38:1 | 7,53:1 |
| Texto terciário / hover | 5,01:1 | 5,89:1 |
| Texto terciário / ativo | **4,83:1** | **5,23:1** |
| Link ou foco / conteúdo | 6,70:1 | 10,07:1 |
| Acento / fundo ativo | 5,49:1 | 6,66:1 |
| Link hover / conteúdo | 8,72:1 | 12,78:1 |
| Texto da seleção / seleção | 14,54:1 | 10,96:1 |
| Divisor / painel de posts | 3,83:1 | 4,77:1 |
| Borda de controle / fundo ativo | 3,28:1 | 3,54:1 |
| Texto de código / bloco | 13,76:1 | 14,64:1 |
| Comentário / bloco | 5,74:1 | 7,09:1 |
| Keyword / bloco | 7,37:1 | 9,59:1 |
| String ou regex / bloco | 6,30:1 | 12,17:1 |
| Número / bloco | 9,73:1 | 11,65:1 |
| Função / bloco | 6,30:1 | 9,59:1 |

Os textos primário, secundário, terciário e de interação passam AA nas superfícies de interface especificadas, inclusive hover e ativo. Todas as cores textuais de código passam AA no bloco.

`--border` é uma borda **decorativa** de agrupamento. Usar `--border-control` quando o contorno for necessário para reconhecer um controle; usar `--divider` no elemento arrastável. Não aplicar `opacity` aos textos para criar estados secundários.

**Contrato do tema:**

- Preferência inicial: `system`, resolvida por `prefers-color-scheme`.
- Botão com ciclo **Sistema → Claro → Escuro → Sistema**.
- Persistência em `localStorage["blog.theme"]`, com valores `system`, `light`, `dark`.
- Aplicar o tema resolvido em `<html data-theme="…">`, antes da primeira pintura.
- Enquanto a preferência for `system`, acompanhar alterações do sistema.
- Sem JavaScript, repetir as declarações escuras em `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])`. Gerar essa repetição por mixin Sass.
- Falha de acesso ao storage não deve impedir o funcionamento.
- Atualizar `meta[name="theme-color"]` para o fundo da barra superior.
- Manter a preferência fora do fragmento substituído pelo PJAX.

## 3. Tipografia

**Famílias escolhidas:**

- Interface e conteúdo: **Inter**, pacote npm **`@fontsource/inter`**.
- Código e metadados: **JetBrains Mono**, pacote npm **`@fontsource/jetbrains-mono`**.

Carregar faces locais:

```js
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/400-italic.css";
import "@fontsource/jetbrains-mono/600.css";
```

Fontsource fornece os arquivos para hospedagem local; esses imports não devem apontar para CDN. [Documentação de instalação](https://fontsource.org/docs/getting-started/install), [Inter](https://fontsource.org/fonts/inter) e [JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono).

O build atual usa **esbuild para JS e Sass para CSS**, apesar do nome da pasta `webpack`. Configurar emissão local dos arquivos `.woff/.woff2` pelo esbuild; o comando atual não declara esses loaders. Fonte: [package.json:9](package.json:9).

```css
:root {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --topbar-height: 48px;
}
```

| Uso | Tamanho | Peso | Line-height |
|---|---:|---:|---:|
| Categorias, tags e posts laterais | 14px | 400; ativo 600 | 1,4 |
| Rótulos de painel | 12px | 600 | 1,5 |
| TOC | 13px | 400; ativo 600 | 1,5 |
| Contadores | 12px mono | 400 | 1,5 |
| Datas e metadados | 13px mono | 400 | 1,5 |
| Texto do artigo | 18px | 400 | 1,7 |
| Texto do artigo mobile | 17px | 400 | 1,65 |
| Título principal | 32px; mobile 28px | 700 | 1,2 |
| `h2` do artigo | 24px | 600 | 1,3 |
| `h3` do artigo | 20px | 600 | 1,4 |
| `h4`–`h6` do artigo | 18px | 600 | 1,4 |
| Título de post na home | 20px | 600 | 1,4 |
| Código | 14px mono | 400 | 1,65 |
| Botões | 14px | 500 | 1,4 |

Implementar tamanhos em `rem`, considerando raiz de 16px. **Largura máxima: `72ch`**, com o conteúdo centralizado dentro de sua coluna. Reservar mono para informação técnica; parágrafos permanecem em Inter.

## 4. Especificação por região

As regras devem substituir as declarações legadas correspondentes. Acrescentar um stylesheet ao final sem retirar regras globais e estilos inline deixaria conflitos desnecessários.

### Estrutura e superfícies

Manter `#Div` em flexbox, a ordem das cinco regiões e os três divisores.

```css
body {
  margin: 0;
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

#Div {
  display: flex;
  top: var(--topbar-height);
  bottom: 0;
}

#cateDiv {
  flex-basis: 128px;
  background: var(--bg-categories);
}
#tagDiv {
  flex-basis: 128px;
  background: var(--bg-tags);
}
#filenameDiv {
  flex-basis: 256px;
  background: var(--bg-posts);
}
#rightNavbar {
  flex-basis: 192px;
  background: var(--bg-toc);
}

#cateDiv,
#tagDiv,
#filenameDiv,
#rightNavbar {
  padding: 0;
  min-height: 0;
  flex-shrink: 0;
}

#contentDiv {
  min-width: 0;
  min-height: 0;
  padding: 32px;
  background: var(--bg-content);
  overflow-y: auto;
  overflow-x: hidden;
}

#pageContent {
  max-width: 72ch;
  margin-inline: auto;
  overflow: visible;
  overflow-wrap: anywhere;
}

#catenameUL,
#tagnameUL,
#filenameUL,
#rightNavbar {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--divider) transparent;
}
```

As larguras acima são **iniciais**, sem `!important`: o `flex-basis` inline escrito pelo JS precisa continuar prevalecendo. Não impor `min-width` que neutralize o recolhimento deliberado de painéis.

Remover a regra que oculta scrollbars WebKit e usar trilho transparente com thumb `--divider`.

**Categorias/tags:** cabeçalho de 40px, rótulos “Categorias” e “Tags”, padding horizontal de 8px.  
**Posts:** cabeçalho de 40px, mantendo os controles existentes.  
**TOC:** cabeçalho “Nesta página”, seguido da árvore de títulos.

Como o código de drag calcula posições e padding, manter padding externo desses painéis em zero e aplicar espaçamento nos cabeçalhos e itens.

### Barra superior

- Altura desktop: **48px**.
- Fundo `--bg-topbar`, borda inferior de 1px `--border`.
- Ícones de **18px** em controles de **32 × 32px**.
- Cor normal `--text-secondary`; hover com `--bg-hover` e `--text-primary`.
- Adicionar o botão de tema no grupo direito.
- Usar SVG monocromático, sem círculos vermelhos ou cores por ação.

```css
#topbarDiv {
  height: var(--topbar-height);
  padding-inline: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border);
}

#topbarLeft,
#topbarRight {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
#topbarRight { justify-content: flex-end; }

.navbox,
.navbox > ul > li,
.navbox ul li a {
  height: auto;
}

.navbox > ul {
  display: flex;
  align-items: center;
  gap: 4px;
}
.navbox > ul > li { float: none; }

.icon-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
}
.icon-button:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
```

Retirar os floats, offsets e padding inline antigos. Menus existentes devem abrir também com `:focus-within`, com fundo `--bg-elevated` e borda `--border-control`.

**Dependência obrigatória:** substituir os descontos fixos de 30/50px por medidas reais dos painéis e cabeçalhos. Apenas aumentar a barra cortaria o final das listas. Fonte: [9ES6-scroll.js:25](webpack/js/9ES6-scroll.js:25).

### Itens normal, hover e ativo

Manter as classes `.cateNames`, `.tagNames`, `.postNames` e `.active`.

```css
.cateNames,
.tagNames,
.postNames {
  min-height: 32px;
  box-sizing: border-box;
  padding: 6px 8px;
  color: var(--text-primary);
  background: transparent;
  font-size: 0.875rem;
  line-height: 1.4;
  cursor: pointer;
}

.cateNames:hover,
.tagNames:hover,
.postNames:hover {
  background: var(--bg-hover);
}

.cateNames.active,
.tagNames.active,
.postNames.active,
#MDh1 > li.active {
  color: var(--accent);
  background: var(--bg-active);
  font-weight: 600;
  box-shadow: inset 3px 0 var(--accent);
}

#filenameUL > a {
  display: block;
  color: inherit;
  text-decoration: none;
}
```

O ativo mantém esse fundo durante hover. O marcador de 3px e o peso 600 dão sinais adicionais à cor.

Categorias/tags: texto principal flexível e contador de largura estável, sem colisão. Preservar o `span` diretamente dentro de cada `li`: o filtro lê seu texto por `children('span')`.

Posts: permitir duas linhas, sem truncamento vertical; quebrar títulos longos. Datas visíveis ocupam uma linha de metadados, sem flutuar sobre o título.

### Contadores `<sup>`

Aplicar somente aos contadores da interface. **Não neutralizar sobrescritos matemáticos do artigo.**

```css
#cateDiv sup,
#tagDiv sup,
#filenameDiv sup {
  float: none;
  position: static;
  vertical-align: baseline;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

.cateSup,
.tagSup {
  min-width: 2ch;
  margin-left: auto;
  padding-left: 8px;
  text-align: right;
}
```

Não usar badge colorido para quantidades comuns.

Em `#allCateTagPostBtn`, organizar os três pares ícone/contador com flex e `gap: 6px`; remover `left: -7px`. O nome acessível deve explicar sua ação: **“Mostrar todas as categorias, tags e posts”**.

### Divisores arrastáveis

Preservar largura de **10px**, os IDs e a estrutura das metades. Isso reduz o impacto sobre a matemática existente.

```css
#lineLeft,
#lineRight,
#lineSide {
  width: 10px;
  flex: 0 0 10px;
  cursor: col-resize;
  background: transparent;
}

.lineFlex { width: 100%; }
.lineInDiv {
  flex-basis: 1px;
  background: var(--divider);
}

#lineLeft-left,
#lineLeft-right,
#lineRight-left,
#lineRight-right,
#lineSide-left,
#lineSide-right {
  background: transparent;
}

#lineLeft:hover .lineInDiv,
#lineRight:hover .lineInDiv,
#lineSide:hover .lineInDiv,
#lineLeft:focus-visible .lineInDiv,
#lineRight:focus-visible .lineInDiv,
#lineSide:focus-visible .lineInDiv {
  background: var(--accent);
}
```

Acrescentar `role="separator"`, `tabindex="0"`, `aria-orientation="vertical"` e valores mínimo/máximo/atual.

- Setas redimensionam em **16px**.
- `Home` restaura a largura inicial.
- Um controle de largura no cabeçalho do painel oferece **Diminuir / Aumentar / Restaurar**, com alvos de 32px.

A alternativa por clique é necessária: oferecer somente teclado não resolve o requisito AA de alternativa a arrastar. A área de 10px também precisa dessa alternativa maior para o critério de tamanho de alvo. [Movimentos de arraste](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) e [tamanho mínimo de alvo](https://www.w3.org/TR/WCAG22/#target-size-minimum).

### Foco e seleção

```css
:where(a, button, [tabindex="0"]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.cateNames:focus-visible,
.tagNames:focus-visible,
#lineLeft:focus-visible,
#lineRight:focus-visible,
#lineSide:focus-visible {
  outline-offset: -2px;
}

::selection {
  color: var(--selection-text);
  background: var(--selection-bg);
}
```

Manter espaço para o foco ao redor dos controles. Um item ativo e focado apresenta **marcador lateral mais contorno**, sem depender apenas de mudança cromática.

### Conteúdo e Markdown

Remover o título duplicado do include e manter `.post-title`. Remover o reset universal de família tipográfica e restaurar margens e marcadores de listas no artigo.

```css
.post-content {
  font-size: 1.125rem;
  line-height: 1.7;
}

.post-title,
.page-heading {
  margin: 0 0 12px;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.post-meta {
  margin-bottom: 24px;
  font: 400 0.8125rem/1.5 var(--font-mono);
  color: var(--text-tertiary);
}

.post-content p { margin: 0 0 20px; }

.post-content h2 {
  margin: 36px 0 12px;
  font-size: 1.5rem;
  line-height: 1.3;
}
.post-content h3 {
  margin: 28px 0 12px;
  font-size: 1.25rem;
  line-height: 1.4;
}
.post-content :is(h4, h5, h6) {
  margin: 24px 0 12px;
  font-size: 1.125rem;
  line-height: 1.4;
}
.post-content :is(h2, h3, h4, h5, h6) {
  font-weight: 600;
  scroll-margin-top: 24px;
}

.post-content a,
.rss-subscribe a {
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.post-content a:hover,
.rss-subscribe a:hover {
  color: var(--link-hover);
}

.post-content ul,
.post-content ol {
  margin: 0 0 20px;
  padding-left: 24px;
}
.post-content ul > li { list-style: disc; }
.post-content ol > li { list-style: decimal; }
.post-content li { margin-block: 6px; }

.post-content blockquote {
  margin: 24px 0;
  padding: 12px 16px;
  color: var(--text-secondary);
  background: var(--bg-posts);
  border-left: 3px solid var(--divider);
}

.post-content img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 24px auto;
}

.post-content table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}
.post-content :is(th, td) {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.post-content th {
  text-align: left;
  font-weight: 600;
  background: var(--bg-posts);
}
```

Na home:

- Título “Posts”: 32px/700.
- Títulos dos artigos: **20px/600**, texto primário.
- Datas: **13px mono**, texto terciário.
- Cada entrada: `padding-block: 16px`, borda inferior `--border`.
- Hover/foco do título: sublinhado e `--link`.
- Manter ordem cronológica e estrutura `.post-list`/`.post-link`.

### Blocos de código e Rouge

```css
.highlight {
  margin: 24px 0;
  color: var(--code-text);
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  overflow: hidden;
}

.highlight pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  white-space: pre;
}

.highlight pre,
.highlight code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.65;
  font-variant-ligatures: none;
}

.post-content :not(pre) > code {
  padding: 2px 5px;
  border-radius: 4px;
  color: var(--code-inline-text);
  background: var(--code-inline-bg);
  font-family: var(--font-mono);
  font-size: 0.875em;
}
```

Código deve rolar horizontalmente **dentro do bloco**. Não quebrar linhas automaticamente nem permitir que o bloco alargue o artigo.

Mapeamento de syntax highlight:

| Classes Rouge | Token | Tratamento adicional |
|---|---|---|
| `.c .ch .cd .cm .c1 .cs .cp .cpf` | `--code-comment` | Itálico |
| `.k .kc .kd .kn .kp .kr .kt .kv` | `--code-keyword` | Peso 600 |
| `.s .sa .sb .sc .dl .sd .s1 .s2 .se .sh .si .sx .ss` | `--code-string` | Normal |
| `.sr` | `--code-regex` | Normal |
| `.m .mb .mf .mh .mi .mo .mx .il` | `--code-number` | Normal |
| `.nf .fm` | `--code-function` | Peso 600 |
| `.nc .nd .ne .nb .bp` | `--code-type` | Peso 600 |
| `.no .nt` | `--code-constant` | Normal |
| `.na` | `--code-attribute` | Normal |
| `.n .nx .nv .vc .vg .vi .nn .nl .ni .py` | `--code-variable` | Normal |
| `.o .ow` | `--code-operator` | Normal |
| `.p .pi` | `--code-punctuation` | Normal |
| `.l .ld .w .go` e tokens sem regra | `--code-text` | Normal |
| `.gp` | `--code-comment` | Peso 600 |
| `.gh .gu .gs` | `--code-text` | Peso 600 |
| `.ge` | `--code-text` | Itálico |
| `.err .gr .gt` | `--code-error` | Fundo `--code-error-bg`; `.err` com sublinhado ondulado |
| `.gi` | `--code-text` | Fundo `--code-insert-bg`; manter indicador `+` |
| `.gd` | `--code-text` | Fundo `--code-delete-bg`; manter indicador `-` |
| `.hll` | `--code-text` | Fundo `--code-mark-bg` |

Diferenciar inserção/remoção também por seus sinais textuais; erros precisam de mensagem legível. Aplicar essas regras em `7-syntax.sass`, retirando as cores anteriores.

### TOC

- Largura inicial de **192px**.
- Fonte **13px/1,5**.
- Cada link: `display: block; min-height: 32px; padding: 6px 10px`.
- Cor normal `--text-secondary`; hover `--bg-hover`; ativo com o mesmo sistema de marcador e peso das listas.
- Permitir quebra: `white-space: normal; overflow-wrap: anywhere`.
- Recuo por nível: **12px**.
- Usar `aria-current="location"` no link da seção atual.

O JS hoje simula hierarquia com `&nbsp;`. Substituir isso por classes aditivas, como `.toc-level-2` até `.toc-level-6`, preservando `#MDh1` e `.CSMDh1`.

Corrigir o escopo do seletor de títulos: usar `#pageContent` em todos os níveis, em vez de `"#pageContent h2,h3,h4,h5,h6"`. Fonte: [7structurebar(pjax).js:13](webpack/js/7structurebar(pjax).js:13).

### Anterior/próximo e controles inferiores

`#topbarPre`/`#topbarNext` devem continuar acionando a navegação existente. Quando não houver destino, mostrar estado desabilitado com `aria-disabled`, sem executar o acesso a um elemento inexistente.

Apresentar `#contentDiv-Buttons` ao final do artigo:

- Duas áreas de navegação, `gap: 12px`.
- Padding de **12px 16px**.
- Fundo `--bg-posts`, borda `--border-control`, raio **6px**.
- Rótulo mono de 12px “Anterior”/“Próximo”; título de 14px/500.
- Hover com `--bg-hover`.
- Preservar `#prePost`, `#nextPost` e `.contentButton`, mas usar um único elemento interativo por destino, eliminando `button` dentro de `a`.

`#arrowNav` mantém suas funções de recolher painéis, restaurá-los e voltar ao topo. Usar três botões de 32px, em uma faixa de fundo `--bg-toc`, com padding de 8px. Reservar espaço inferior no TOC para que essa faixa não cubra links.

### Mobile

**Breakpoint único: até 1279px, leitura com apenas conteúdo; a partir de 1280px, layout completo.** Essa escolha evita comprimir cinco regiões até o artigo ficar ilegível. Substituir os limiares legados no Sass e no JS pelo mesmo contrato.

```css
@media (max-width: 1279px) {
  :root {
    --topbar-height: calc(52px + env(safe-area-inset-top));
  }

  #topbarDiv {
    padding-top: env(safe-area-inset-top);
    padding-inline: 8px;
  }

  #cateDiv,
  #tagDiv,
  #filenameDiv,
  #rightNavbar,
  #arrowNav {
    display: none;
  }

  #lineLeft,
  #lineRight,
  #lineSide {
    display: none !important;
  }

  #contentDiv {
    padding: 24px 16px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  .post-content {
    font-size: 1.0625rem;
    line-height: 1.65;
  }

  .post-title,
  .page-heading {
    font-size: 1.75rem;
  }

  .icon-button {
    width: 44px;
    height: 44px;
  }

  #contentDiv-Buttons {
    flex-direction: column;
  }
}
```

As regras de painéis acima definem o **estado inicial**. Preservar sua abertura pelos controles, mas a navegação temporária deve ocupar a área de leitura e fechar ao selecionar o post; nunca comprimir conteúdo e cinco colunas no mesmo viewport. Sincronizar esse estado com os handlers existentes.

No mobile, priorizar na barra: navegador, anterior/próximo, tema e TOC. A imagem de 640 × 360 passa a respeitar a largura disponível, mantendo sua proporção.

Remover a restrição de zoom e ajustar o idioma de `<html>` ao conteúdo — `pt-BR` para este blog em português.

## 5. Ícones

Usar **`lucide-static` via npm**, gerando um sprite SVG local. Essa abordagem funciona com Jekyll e preserva os `<use>` existentes, inclusive o ícone que o JS troca dinamicamente. [Documentação do pacote](https://lucide.dev/guide/static).

Manter `.icon` e os IDs dos símbolos antigos como aliases para os novos desenhos.

| Ícone atual | Uso | Lucide escolhido |
|---|---|---|
| `#icon-layouts` | Navegador esquerdo | `PanelLeft` — `panel-left` |
| `#icon-layouts` | TOC direito | `PanelRight` — `panel-right`; criar alias específico para esse uso |
| `#icon-Git` | Repositório GitHub | `FolderGit2` — `folder-git-2` |
| `#icon-jiantou121` | Post anterior | `ChevronLeft` — `chevron-left` |
| `#icon-jiantou122` | Próximo post | `ChevronRight` — `chevron-right` |
| `#icon-shouji` | Telefone/contato | `Smartphone` — `smartphone` |
| `#icon-emailround` | E-mail | `Mail` — `mail` |
| `#icon-sousuo` | Busca | `Search` — `search` |
| `#icon-iconfontcolor52` | Categorias | `Folder` — `folder` |
| `#icon-biaoqian` | Tags | `Tags` — `tags` |
| `#icon-wenjianleixing` | Posts | `FileText` — `file-text` |
| `#icon-eyeblocked` | Datas ocultas | `EyeOff` — `eye-off` |
| `#icon-13eye` | Datas visíveis; inserido pelo JS | `Eye` — `eye` |
| `#icon-jianli` | Currículo; trecho comentado | `FileUser` — `file-user` |
| `#icon-codepen` | CodePen; trecho comentado | `CodeXml` — `code-xml` |
| `💝` | Apoiar/doar | `HeartHandshake` — `heart-handshake` |
| `➤➤` invertido | Anterior no artigo | `ChevronLeft` |
| `➤➤` | Próximo no artigo | `ChevronRight` |
| `➟` invertido, `#leftBtn` | Recolher painéis | `PanelLeftClose` — `panel-left-close` |
| `➟`, `#rightBtn` | Restaurar painéis | `PanelLeftOpen` — `panel-left-open` |
| `➼` rotacionado, `#toTopBtn` | Voltar ao topo | `ArrowUpToLine` — `arrow-up-to-line` |

Os símbolos `➟`, `➼` e `➤` são caracteres Unicode, mas devem receber a mesma substituição dos emojis.

Lucide não fornece logos de marcas. `FolderGit2` e `CodeXml` são substituições semânticas; manter nomes acessíveis “Repositório no GitHub” e “CodePen”. [Política de marcas do Lucide](https://github.com/lucide-icons/lucide/blob/main/README.md).

Ícones adicionais:

| Controle | Lucide |
|---|---|
| Tema seguindo sistema | `Monitor` |
| Tema claro | `Sun` |
| Tema escuro | `Moon` |
| Diminuir/aumentar largura | `Minus` / `Plus` |
| Restaurar largura | `RotateCcw` |

**Regra visual:**

```css
.icon {
  width: 18px;
  height: 18px;
  padding: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
```

Os paths dos novos símbolos devem usar coordenadas de `viewBox="0 0 24 24"`, sem fills coloridos.

Controles recebem nome acessível em português; SVG decorativo permanece `aria-hidden="true"`. Toggles de painéis usam `aria-expanded` e `aria-controls`.

**Cuidado específico:** preservar `#filenameDivDate` no SVG, pois o JS escreve `<use>` dentro dele. Acrescentar um botão externo acessível que invoque `fileNameDate()`, substituindo o binding antigo para evitar dupla execução. Fonte: [9showAll(eye).js:11](webpack/js/9showAll(eye).js:11).

Não encontrei handler para `#filenameDiSearch` nos módulos auditados. Até existir busca funcional, a lupa deve ser um marcador decorativo do cabeçalho, sem aparência de botão.

## 6. Mudanças priorizadas e o que não mudar

### Ordem de implementação

1. **Especificar a feature antes do código:** `docs/specs/002-editor-theme/spec.md`, `plan.md` e `tasks.md`. Uma spec para o tema visual e sua acessibilidade, com um plano e critérios de aceite.
2. **Resolver contraste e cores:** implementar tokens claros/escuros, substituir superfícies e estados, contadores e Rouge. Retirar cores fixas dos divisores e sobrescrever a cor do NProgress com `--accent`.
3. **Implementar o contrato de tema:** sistema, alternância, persistência e inicialização antes da pintura.
4. **Liberar zoom e estabelecer foco/teclado:** controles, categorias/tags, divisores e navegação. Impedir que atalhos globais capturem setas em controles focados, campos ou conteúdo editável.
5. **Aplicar tipografia e ritmo editorial:** fontes locais, largura de 72ch, margens, listas e remoção do título duplicado.
6. **Ajustar dimensões com compatibilidade:** barra de 48px, larguras iniciais dos painéis, cálculo real das alturas e breakpoint único.
7. **Substituir ícones:** sprite local Lucide, aliases e botões acessíveis; preservar a troca dinâmica de Eye/EyeOff.
8. **Validar os estados finais:** home e post em 1440 × 900; mobile em 390 × 844 e 320px; ambos os temas; zoom de 200% e reflow a 400%; teclado, drag e alternativa por clique; PJAX, histórico, filtros, TOC e datas.

Usar os smoke tests existentes como base de regressão. Eles já verificam IDs, classes ativas, filtros e navegação PJAX, mas não cobrem contraste, tema ou mobile. Fonte: [smoke.spec.js:35](tests/smoke.spec.js:35).

### O que não mudar

- **A arquitetura visual:** barra superior, cinco colunas, divisores e TOC à direita.
- **Os contratos do legado:** IDs, classes e atributos `data-cate`, `data-tag`, `data-tagcate`.
- **As classes de estado:** `.active`, `.hidden` e sua relação com os filtros.
- **O controle de largura pelo JS:** não bloquear `flex-basis` inline com `!important`.
- **O container de rolagem `#contentDiv`:** TOC e retorno ao topo dependem dele.
- **O fragmento PJAX `#contentDiv`**, os destinos de navegação e a ordem dos posts.
- **Os contratos de ícones dinâmicos**, especialmente `#filenameDivDate`.
- **Jekyll, jQuery e o build atual como parte desta revisão:** adaptar os pontos necessários sem introduzir uma migração de stack.
- **Acesso local aos assets:** fontes e ícones empacotados, sem CDN.
- **Conteúdo e taxonomia:** a revisão deve melhorar sua apresentação e acesso.