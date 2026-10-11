# Roadmap: modernização do projeto

Transformar o tema CMS de três colunas (herdado de Xu-Jian.github.io) em base própria de blog/conhecimento, com stack atual e design novo, sem perder features.

| Ordem | Spec | Depende de | Resumo |
|---|---|---|---|
| 1 | [001-stack-upgrade](001-stack-upgrade/spec.md) | — | Jekyll 4.4 + Ruby atual, esbuild + Dart Sass, deps fora de CDN morto, conteúdo lorem ipsum, smoke test |
| 3 | [002-js-vanilla](002-js-vanilla/spec.md) | 001, 003 | Reescrita dos módulos JS em JS moderno sem jQuery/plugins, testes Playwright por feature, acessibilidade por teclado (itens, divisores com alternativa por clique, setas cientes do foco) (remove jQuery 2.2.4: 4 alertas moderados de XSS aceitos até lá) |
| 2 | [003-redesign](003-redesign/spec.md) | 001 | Direção Editor/IDE: tokens claro/escuro, tipografia local, ícones Lucide, regiões redesenhadas (auditoria Codex) |
| 4 | 004-deploy (opcional) | 001 | Publicação (destino a definir) |

Cada spec segue o próprio ciclo spec → plano → implementação → revisão.
