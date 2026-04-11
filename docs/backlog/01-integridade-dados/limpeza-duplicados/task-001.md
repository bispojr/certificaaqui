# TASK ID: INTEG-LIMP-001

## Título

Criar script SQL de auditoria de certificados duplicados

## Tipo

banco

## Dependências

nenhuma

## Objetivo

Gerar um arquivo `.sql` que, ao ser executado no banco de dados de produção, retorna todos os grupos de certificados ativos que compartilham a mesma combinação `(participante_id, evento_id, tipo_certificado_id)` — ou seja, as duplicatas que impedem a aplicação da constraint única.

## Contexto

A tabela `certificados` não possui constraint composta sobre `(participante_id, evento_id, tipo_certificado_id)`. O sistema permite criar múltiplos registros com a mesma combinação. Antes de adicionar a constraint via migration (`INTEG-PREV-001`), é necessário identificar e tratar essas duplicatas em produção.

O campo `deleted_at` é gerenciado pelo Sequelize com `paranoid: true`. Registros com `deleted_at IS NOT NULL` são considerados soft-deleted e não serão afetados pela nova constraint, portanto devem ser ignorados na auditoria.

## Arquivos envolvidos

- `docs/scripts/audit-certificados-duplicados.sql` ← criar

## Passos

1. Criar o diretório `docs/scripts/` caso não exista
2. Criar o arquivo `docs/scripts/audit-certificados-duplicados.sql` com a query abaixo:

```sql
-- Auditoria: certificados duplicados ativos
-- Retorna grupos com mais de um certificado ativo para a mesma combinação
-- (participante_id, evento_id, tipo_certificado_id)
--
-- Executar em produção ANTES de aplicar a migration INTEG-PREV-001.
-- Se esta query retornar linhas, executar normalize-certificados-duplicados.sql primeiro.

SELECT
  c.participante_id,
  c.evento_id,
  c.tipo_certificado_id,
  COUNT(*)                              AS total_duplicatas,
  ARRAY_AGG(c.id ORDER BY c.created_at) AS ids,
  ARRAY_AGG(c.codigo ORDER BY c.created_at) AS codigos,
  MIN(c.created_at)                    AS primeiro_emitido,
  MAX(c.created_at)                    AS ultimo_emitido
FROM certificados c
WHERE c.deleted_at IS NULL
GROUP BY c.participante_id, c.evento_id, c.tipo_certificado_id
HAVING COUNT(*) > 1
ORDER BY total_duplicatas DESC, ultimo_emitido DESC;
```

3. Adicionar bloco de comentário no topo do arquivo com instruções de uso

## Resultado esperado

- Arquivo `docs/scripts/audit-certificados-duplicados.sql` criado
- A query retorna zero linhas em um banco limpo
- A query retorna uma linha por grupo duplicado, com IDs e códigos ordenados por data de criação

## Critério de aceite

- O arquivo existe em `docs/scripts/audit-certificados-duplicados.sql`
- A query usa `WHERE deleted_at IS NULL` para ignorar registros soft-deleted
- A query usa `HAVING COUNT(*) > 1` para retornar apenas grupos com duplicatas
- A query inclui `ARRAY_AGG(c.id ORDER BY c.created_at)` para identificar qual é o mais recente
