# TASK ID: INTEG-LIMP-003

## Título

Documentar procedimento pré-migration de constraint única em certificados

## Tipo

banco

## Dependências

- INTEG-LIMP-001
- INTEG-LIMP-002

## Objetivo

Criar documento em `docs/` que descreve o procedimento completo de execução dos scripts SQL como pré-requisito obrigatório da migration `INTEG-PREV-001`. O documento deve ser claro o suficiente para ser executado por qualquer membro técnico da equipe.

## Contexto

A migration `INTEG-PREV-001` adiciona um índice único parcial em `certificados`. Se executada com duplicatas no banco, ela falha com erro do PostgreSQL (`ERROR: could not create unique index`). O procedimento de limpeza deve ser executado manualmente antes da migration — não pode ser automatizado dentro da própria migration porque exige decisão humana sobre quais registros manter.

## Arquivos envolvidos

- `docs/backlog/01-integridade-dados/limpeza-duplicados/procedimento-pre-migration.md` ← criar

## Passos

1. Criar o arquivo `procedimento-pre-migration.md` com as seguintes seções:

   **Título:** Procedimento Pré-Migration: Constraint Única em Certificados

   **Seção 1 — Contexto:** Explicar por que a limpeza é necessária antes da migration

   **Seção 2 — Pré-requisitos:** Acesso ao banco de produção via psql ou cliente SQL; backup realizado antes da execução

   **Seção 3 — Passo a passo:**
   1. Executar `docs/scripts/audit-certificados-duplicados.sql`
   2. Se retornar zero linhas: prosseguir diretamente para a migration
   3. Se retornar linhas: revisar os grupos, descomentar o UPDATE em `normalize-certificados-duplicados.sql` e executar dentro de uma transação, verificar resultado, aplicar COMMIT
   4. Re-executar o script de auditoria para confirmar zero duplicatas
   5. Executar `npx sequelize-cli db:migrate` para aplicar `INTEG-PREV-001`

   **Seção 4 — Rollback:** Como reverter a migration se necessário (`db:migrate:undo`)

   **Seção 5 — Referências:** Links para os scripts SQL e para a migration

## Resultado esperado

- Arquivo `procedimento-pre-migration.md` criado com as 5 seções descritas
- O procedimento referencia os scripts SQL pelos caminhos corretos em `docs/scripts/`

## Critério de aceite

- O documento existe em `docs/backlog/01-integridade-dados/limpeza-duplicados/procedimento-pre-migration.md`
- O documento instrui explicitamente a executar o script de auditoria antes de qualquer modificação
- O documento instrui explicitamente a fazer backup do banco antes da execução
- O documento inclui o comando `npx sequelize-cli db:migrate` como etapa final
- O documento inclui instrução de rollback via `db:migrate:undo`
