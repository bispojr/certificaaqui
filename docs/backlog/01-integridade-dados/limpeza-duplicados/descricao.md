# Feature: Limpeza de Dados Duplicados Existentes

## Descrição

Antes de aplicar a constraint única composta `(participante_id, evento_id, tipo_certificado_id) WHERE deleted_at IS NULL`, é necessário garantir que não existem duplicatas ativas no banco.

Esta feature cria os scripts SQL de identificação e normalização, e documenta o procedimento que deve ser executado manualmente em produção como pré-requisito da migration de constraint.

A execução desta feature é **obrigatória** antes da `INTEG-PREV-001`.

## Entidade afetada

- Tabela: `certificados`
- Campo de soft delete: `deleted_at`

## Tasks (alto nível)

- INTEG-LIMP-001: Criar script SQL de auditoria de duplicatas
- INTEG-LIMP-002: Criar script SQL de normalização (cancelamento dos duplicados)
- INTEG-LIMP-003: Documentar procedimento pré-migration em `docs/`

## Ordem de execução obrigatória

```
INTEG-LIMP-001 → INTEG-LIMP-002 → INTEG-LIMP-003 → INTEG-PREV-001
```
