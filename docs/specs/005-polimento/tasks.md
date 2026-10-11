# 005: Polimento — Tarefas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Spec:** [spec.md](spec.md) · **Plano:** [plan.md](plan.md)

**Diretório:** worktree `/Users/jobs/Dev/4-projetos/Xu-Jian.github.io-005`, branch `feat/005-polimento` (a partir de `feat/002-js-vanilla`).

Ao final de cada tarefa: `npm run build && bundle exec jekyll build` sem erro e `npm run test:smoke` verde.

---

### Task 1: Templates — datas, RSS, doação e placeholder

**Files:** Create `src/_includes/data-pt.html`, `tests/polish.spec.js`. Modify `src/_layouts/home.html`, `src/_layouts/post.html`, `src/_includes/topbar.html`, `_config.yml`, `src/assets/img/placeholder.svg`, docs `after/`.

- [ ] Testes primeiro (RED): critérios 1(a)–(d) e (g) da spec.
- [ ] Implementar as decisões 1–3 do plano.
- [ ] Screenshot `docs/specs/005-polimento/after/post-dark.png` (1440×900, tema escuro, rolado até a imagem); conferir com Read.
- [ ] Commit: `feat(005): datas em português, RSS, doação configurável e placeholder escuro`.

### Task 2: Navegação — âncora entre páginas e restauração de rolagem

**Files:** Modify `webpack/js/nav.js`, `webpack/js/main.js` (e `toc.js` só se necessário), `tests/polish.spec.js`.

- [ ] Testes primeiro (RED): critérios 1(e) e 1(f) da spec, mais um caso de `popstate` na primeira entrada sem `state`.
- [ ] Implementar as decisões 4–5 do plano.
- [ ] Commit: `feat(005): âncora entre páginas e rolagem restaurada ao voltar`.
