# 001: Atualização do stack

## Contexto

O site é um tema Jekyll de três colunas (Categorias → Tags → Posts) herdado de Xu-Jian.github.io. O stack está congelado em 2017:

- Jekyll 3.4.0 com lockfile de Ruby 2.7; não roda no Ruby local (4.0) e hoje só sobe via Docker `ruby:2.7` com `bundle install --full-index`.
- webpack 2, babel 6, node-sass 4 e React 15 (React não é usado).
- jQuery 2.2.4, jquery.pjax, jquery.lazyload, NProgress e Tether carregados de `cdn.bootcss.com`, CDN desativado.
- Resquícios de Firebase 3 e dados pessoais do autor original (`_config.yml`, `CNAME`).
- 180 posts do autor original.

O projeto vai virar a base de blog/conhecimento do mantenedor. Esta spec atualiza o stack sem alterar comportamento nem visual; a reescrita do JS (002) e o redesign (003) vêm depois e dependem desta.

## Requisitos

### R1. Ruby e Jekyll
- R1.1 O site builda e serve com `bundle exec jekyll serve` no Ruby declarado em `.ruby-version`, instalado localmente, sem Docker.
- R1.2 Jekyll na linha 4.4 e plugins em versões compatíveis; `Gemfile.lock` regenerado.
- R1.3 `_config.yml` usa `plugins:` (não `gems:`) e não depende do tema `minima` se nenhum layout dele for usado.
- R1.4 Ruby alvo: 4.0. Se Jekyll 4.4 não funcionar no 4.0, o alvo passa a ser Ruby 3.4, e a decisão fica registrada em `docs/adr/`.

### R2. Build de front-end
- R2.1 Versão de Node declarada em `.nvmrc`; dependências via npm com `package-lock.json`.
- R2.2 webpack, babel, node-sass, React, `colors`, `minimatch` e loaders saem de `package.json`.
- R2.3 esbuild gera `src/js/bundle.js` a partir de `entry.js`; Dart Sass (`sass`) gera `src/css/main.css` a partir de `webpack/sass/main.sass`.
- R2.4 Scripts npm: `build` (build único de JS e CSS), `dev` (watch de JS e CSS), `serve` (watch de front-end e `jekyll serve` juntos), `test:smoke`.
- R2.5 Os artefatos gerados (`src/js/bundle.js`, `src/css/main.css`) não são versionados.

### R3. Dependências de runtime
- R3.1 Nenhum recurso de `cdn.bootcss.com` é referenciado.
- R3.2 jQuery, jquery-pjax, jquery-lazyload e NProgress vêm de pacotes npm empacotados no bundle (JS) e no CSS gerado, nas versões mais próximas das atuais que mantenham o código existente funcionando sem mudança de lógica.
- R3.3 Tether e Firebase (script, include e módulo) são removidos.
- R3.4 O iconfont de `at.alicdn.com` permanece nesta spec.

### R4. Conteúdo e identidade
- R4.1 Os 180 posts atuais são removidos.
- R4.2 Entram ao menos 20 posts em lorem ipsum, distribuídos em 4 categorias e ao menos 10 tags, com nomes compatíveis com os ids e atributos `data-*` usados pelo filtro: sem espaço, `_` ou `/`, uma categoria e uma tag por post, e nenhuma tag com o mesmo nome de uma categoria.
- R4.3 Os posts de exemplo cobrem: títulos h2 a h5 (barra de estrutura), ao menos uma imagem (lazyload), blocos de código em pelo menos duas linguagens (Rouge) e datas distintas (ordenação).
- R4.4 `_config.yml`, `about.md` e `contact.html` não contêm nome, e-mail, telefone ou links do autor original; usam placeholders.
- R4.5 `CNAME`, `jekyll-theme-CMS-2.2.2.gem`, `jekyll-theme-CMS.gemspec`, `yarn.lock` e os arquivos vazios `Icon`/`Icon_` são removidos, cada lote listado e aprovado antes da exclusão.

### R5. Preservação de features e visual
Continuam funcionando como antes:
- R5.1 Filtro em três níveis: clicar numa categoria filtra tags e posts; clicar numa tag filtra posts; destaque automático do item ativo.
- R5.2 Navegação PJAX com barra de progresso e botões anterior/próximo da barra superior.
- R5.3 Barras arrastáveis entre colunas.
- R5.4 Barra de estrutura: TOC de h2 a h5 com destaque conforme a rolagem e âncoras.
- R5.5 Botão "olho" (mostrar/ocultar datas) e botão de exibir todos.
- R5.6 Lazyload de imagens, Service Worker com página offline, layout mobile e página 404.
- R5.7 O visual da home e de um post é equivalente ao da versão atual (comparação por screenshot no mesmo viewport).

### R6. Verificação automatizada
- R6.1 `npm run test:smoke` roda Playwright contra o site servido localmente e cobre: carregar a home sem erro de console além de recursos sabidamente ausentes; filtrar por categoria e por tag; abrir um post via PJAX sem recarga completa; existência da TOC no post.

## Critérios de aceite

1. Num clone limpo, com Ruby e Node nas versões declaradas: `bundle install && npm ci && npm run build && bundle exec jekyll build` termina com sucesso.
2. `npm run serve` sobe o site e `npm run test:smoke` passa.
3. `grep -r "bootcss\|firebase\|Xu-Jian\|xx2610\|186 219" src _config.yml` não encontra ocorrências (exceto em `docs/`).
4. Screenshots da home e de um post, antes e depois, no viewport 1200×650, mostram o mesmo layout e paleta.
5. O console do navegador não exibe erros novos em relação à versão atual.

## Fora de escopo

- Reescrever JS ou remover jQuery (002).
- Qualquer mudança de design, tipografia, cores ou layout (003).
- Substituir o iconfont do alicdn (003).
- Deploy, CI e domínio (004).
- Criar um web app manifest. A referência quebrada a `/manifest.json` pode apenas ser removida.
