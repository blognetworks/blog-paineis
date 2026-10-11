# 005: Polimento — Plano

**Spec:** [spec.md](spec.md) · **Tarefas:** [tasks.md](tasks.md)

## Decisões

1. **Datas:** novo include `src/_includes/data-pt.html` que recebe `date` e imprime `DD mmm AAAA` com meses de um array Liquid: `{% assign meses = "jan,fev,mar,abr,mai,jun,jul,ago,set,out,nov,dez" | split: "," %}`, índice por `date | date: "%-m" | minus: 1`. Usado em `home.html` e `post.html`. O `<time datetime>` continua em ISO.
2. **Doação:** `{% if site.donate_url and site.donate_url != "" %}` em `topbar.html`; o `<a class="icon-button" id="donate">` mantém o ícone `i-heart-handshake`. O teste (c) com valor usa uma config extra, num build Jekyll separado com `--config _config.yml,tests/fixtures/donate.yml` servido na porta 4008 (a 4002 está ocupada nesta máquina), ou checa o template renderizado por Liquid. Escolher a opção mais simples que exercite o HTML real.
3. **Placeholder:** fundo `#334155`, texto `#E2E8F0` (contraste ≈ 9,7:1), borda arredondada. Fica neutro nos dois temas e não ofusca. `gen-lorem-posts.mjs` não muda, porque usa o mesmo arquivo.
4. **Âncora:** em `main.js`, no `nav:end`, depois de `buildToc()`, se `location.hash` existir: `target = document.getElementById(id) || document.querySelector('[name="'+CSS.escape(id)+'"]')`, depois `target.scrollIntoView({block:'start'})` dentro de `#contentDiv`. No carregamento inicial vale o mesmo, depois do primeiro `buildToc()`.
5. **Rolagem:** em `nav.js`, antes de navegar, `history.replaceState({...history.state, url, scrollTop: contentDiv.scrollTop}, '')`. No `popstate`, depois da troca, aplica `scrollTop` de `event.state`. Navegação nova (push) zera, exceto quando há hash (decisão 4).

## Global Constraints

- Sem jQuery; módulos ES da 002; só tokens de cor no SCSS.
- IDs e classes preservados; os 60 testes atuais continuam verdes sem mudar asserções.
- Exclusões só com lista aprovada.
- Commits assinados, autor Matheus Breguêz, trailer `Co-Authored-By` com o modelo que escreveu.

## Review Focus

1. Mês de dezembro e janeiro (índices 11 e 0) e datas de 1 dígito.
2. `popstate` sem `state` (primeira entrada) não quebra a restauração.
3. A âncora no carregamento inicial não briga com o restaurador de rolagem do navegador (`history.scrollRestoration = 'manual'` se necessário).
