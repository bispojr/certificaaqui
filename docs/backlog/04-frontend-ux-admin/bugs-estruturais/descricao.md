# FEATURE: Correção de Bugs Estruturais nas Views

## Domínio

04 — Frontend / UX Admin

## Identificador

FRONT-BUG

## Prioridade

CRÍTICA

## Descrição

Dois bugs confirmados com impacto imediato na usabilidade do painel administrativo:

1. **Flash duplicado**: O layout `views/layouts/admin.hbs` já renderiza as mensagens de flash globalmente (linhas 53–60 via `{{#if flash.success}}` / `{{#if flash.error}}`), mas diversas views filhas repetem o mesmo bloco localmente. O resultado visível é que cada ação de criação, edição ou exclusão exibe a mensagem de feedback duas vezes consecutivas na tela.

   Views afetadas confirmadas:
   - `views/admin/certificados/index.hbs` (linhas 6–7)
   - `views/admin/certificados/detalhe.hbs` (linhas 11–12)
   - `views/admin/certificados/form.hbs` (linha 4)
   - `views/admin/usuarios/index.hbs` (linhas 6–11)
   - `views/admin/usuarios/form.hbs` (linhas 3–5)
   - `views/admin/tipos-certificados/index.hbs` (linhas 7–11)
   - `views/admin/tipos-certificados/form.hbs` (linhas 4–6)

2. **Botão "Remover" na coluna errada**: Em `views/admin/certificados/index.hbs`, o `<form method="POST" action=".../deletar">` que render o botão "Remover" está dentro do `<td>` da coluna **Status** (junto ao badge de status), e não dentro do `<td>` da coluna **Ações**. Isso quebra o alinhamento visual da tabela e gera confusão sobre o que o botão faz.

## Arquivos envolvidos

- `views/admin/certificados/index.hbs`
- `views/admin/certificados/detalhe.hbs`
- `views/admin/certificados/form.hbs`
- `views/admin/usuarios/index.hbs`
- `views/admin/usuarios/form.hbs`
- `views/admin/tipos-certificados/index.hbs`
- `views/admin/tipos-certificados/form.hbs`

## Tasks

- `task-001.md` — FRONT-BUG-001: Remover blocos de flash duplicados das views filhas
- `task-002.md` — FRONT-BUG-002: Mover form do botão "Remover" para o `<td>` de ações em `certificados/index.hbs`

## Critério de aceite global

- `grep -r "flash.success\|flash.error" views/admin/` retorna apenas ocorrências dentro de `views/layouts/admin.hbs`
- Na listagem de certificados, o botão "Remover" aparece na mesma célula que "Ver" e "Editar"
- `npm run check` passa
