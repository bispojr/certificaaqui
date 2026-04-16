# TASK ID: INTEG-LIMP-002

## Título

Criar script SQL de normalização de certificados duplicados

## Tipo

banco

## Dependências

- INTEG-LIMP-001

## Objetivo

Gerar um arquivo `.sql` que cancela os registros duplicados, mantendo apenas o certificado mais recente de cada grupo `(participante_id, evento_id, tipo_certificado_id)` ativo. O script deve ter um bloco de verificação antes da modificação e ser seguro para execução em produção.

## Contexto

A normalização de duplicatas é pré-requisito para a migration `INTEG-PREV-001`, que adiciona constraint única parcial. Se a constraint for aplicada antes da limpeza e houver duplicatas no banco, a migration falhará com erro de violação de unicidade.

Estratégia de normalização:

- **Manter:** o registro com `created_at` mais recente (última criação) para cada grupo
- **Cancelar:** todos os demais registros do grupo, definindo `status = 'cancelado'`
- **Não deletar:** o soft delete não é usado aqui para preservar rastreabilidade; o `status = 'cancelado'` é suficiente e mantém o registro visível para auditoria

## Arquivos envolvidos

- `docs/scripts/normalize-certificados-duplicados.sql` ← criar

## Passos

1. Criar o arquivo `docs/scripts/normalize-certificados-duplicados.sql` com o conteúdo abaixo:

```sql
-- Normalização: cancelamento de certificados duplicados
-- Mantém apenas o certificado mais recente por grupo (participante_id, evento_id, tipo_certificado_id).
-- Os demais registros ativos do grupo têm status alterado para 'cancelado'.
--
-- IMPORTANTE: Executar APÓS audit-certificados-duplicados.sql e revisar o resultado.
-- IMPORTANTE: Executar dentro de uma transação e verificar antes de confirmar.

BEGIN;

-- ① Preview: mostra quais IDs serão cancelados (não altera dados)
SELECT id, participante_id, evento_id, tipo_certificado_id, codigo, status, created_at
FROM certificados
WHERE deleted_at IS NULL
  AND id IN (
    SELECT id FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY participante_id, evento_id, tipo_certificado_id
          ORDER BY created_at DESC
        ) AS rn
      FROM certificados
      WHERE deleted_at IS NULL
    ) ranked
    WHERE rn > 1
  )
ORDER BY participante_id, evento_id, tipo_certificado_id, created_at;

-- ② Executar apenas após revisar o preview acima
-- Descomente o bloco abaixo para aplicar a normalização:

/*
UPDATE certificados
SET
  status     = 'cancelado',
  updated_at = NOW()
WHERE deleted_at IS NULL
  AND id IN (
    SELECT id FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY participante_id, evento_id, tipo_certificado_id
          ORDER BY created_at DESC
        ) AS rn
      FROM certificados
      WHERE deleted_at IS NULL
    ) ranked
    WHERE rn > 1
  );
*/

-- ③ Verificar resultado (executar após descomentar e rodar o UPDATE)
-- SELECT COUNT(*) AS duplicatas_restantes
-- FROM certificados
-- WHERE deleted_at IS NULL
-- GROUP BY participante_id, evento_id, tipo_certificado_id
-- HAVING COUNT(*) > 1;

-- Se ③ retornar zero linhas, confirmar a transação:
-- COMMIT;
-- Caso contrário: ROLLBACK;
```

2. Garantir que o UPDATE está comentado por padrão, exigindo ação manual explícita do operador antes de executar

## Resultado esperado

- Arquivo `docs/scripts/normalize-certificados-duplicados.sql` criado
- O script possui uma fase de preview (SELECT) separada do UPDATE
- O UPDATE está comentado por padrão (segurança)
- O script usa `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY created_at DESC)` para preservar o mais recente

## Critério de aceite

- O arquivo existe em `docs/scripts/normalize-certificados-duplicados.sql`
- O UPDATE modifica apenas certificados com `deleted_at IS NULL`
- O UPDATE usa `ROW_NUMBER() OVER (... ORDER BY created_at DESC)` com `rn > 1`
- O UPDATE está comentado por padrão no arquivo entregue
- O script inclui um SELECT de verificação pós-update
