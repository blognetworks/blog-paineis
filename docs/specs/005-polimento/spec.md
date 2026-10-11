# 005: Polimento

## Contexto

As revisões finais da 003 e da 002 adiaram pequenos acabamentos que estragam a experiência num blog em português:
- datas com meses em inglês ("Feb") numa página `pt-BR`;
- o texto "subscribe via RSS";
- o botão de doação abre um `alert` com o telefone de exemplo;
- a imagem de exemplo clara ofusca no tema escuro;
- links para uma seção de outro post (`post.html#3`) abrem no topo;
- voltar no navegador perde a posição de leitura.

Esta spec fecha esses itens sem mudar o layout nem a arquitetura do JS da 002.

## Requisitos

### R1. Texto em português
- R1.1 Todas as datas exibidas (home, post e datas da lista de posts) usam meses abreviados em português em minúsculas, no formato `06 jan 2025`. A lista de posts mantém o formato numérico `2025-01-06`.
- R1.2 O link do feed na home diz "Assinar via RSS".

### R2. Doação configurável
- R2.1 `_config.yml` ganha `donate_url: ""`. Com valor, `#donate` é um link (`<a>`) para essa URL, com `rel="noopener"`, `target="_blank"` e `aria-label="Apoiar (abre em nova aba)"`. Vazio, o botão não é renderizado.
- R2.2 Nenhum `alert(` no HTML gerado.

### R3. Imagem de exemplo no tema escuro
- R3.1 `placeholder.svg` (e os posts gerados) usam uma imagem que não ofusca no tema escuro: luminância relativa média da imagem ≤ 0,45, contraste do texto da imagem ≥ 4,5:1 sobre o próprio fundo, legível nos dois temas.

### R4. Navegação parcial: âncora e rolagem
- R4.1 Ao navegar para uma URL com hash (`/post.html#3`), depois que o sumário cria as âncoras, `#contentDiv` rola até o alvo (por `id` ou `name`).
- R4.2 Voltar e avançar restauram o `scrollTop` de `#contentDiv` que a entrada tinha ao sair dela. Uma navegação nova começa no topo, ou na âncora (R4.1).

## Critérios de aceite

1. Suíte completa verde (os 60 testes atuais), mais testes novos:
   - (a) home e post sem nomes de mês em inglês (`/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/`) e com `jan`…`dez`;
   - (b) texto "Assinar via RSS";
   - (c) com `donate_url` vazio, não há `#donate`; com valor (build de teste ou fixture), `#donate` é `a[href][target=_blank][rel~=noopener]`;
   - (d) nenhum `alert(` no HTML da home e do post;
   - (e) navegação parcial para `post#3` rola o alvo para dentro da viewport de `#contentDiv`;
   - (f) post A rolado até 600 → abre post B → voltar → `scrollTop` de A ≈ 600 (±20);
   - (g) axe `color-contrast` continua sem violações nos dois temas.
2. Screenshot do post no tema escuro em `docs/specs/005-polimento/after/post-dark.png`, com a imagem de exemplo sem ofuscar.

## Fora de escopo

- Deploy (004).
- Busca.
- Tradução de outros textos de template.
