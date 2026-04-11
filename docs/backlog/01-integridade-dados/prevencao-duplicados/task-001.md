# TASK ID: INTEG-PREV-001

## Título

Criar migration de índice único parcial em `certificados` para `(participante_id, evento_id, tipo_certificado_id)`

## Tipo

banco

## Dependências

- INTEG-LIMP-002 (execução em produção como pré-requisito)

## Objetivo

Adicionar uma migration Sequelize que cria um índice único parcial no PostgreSQL garantindo que não existam dois certificados **ativos** com a mesma combinação `(participante_id, evento_id, tipo_certificado_id)`.

## Contexto

A tabela `certificados` já possui `UNIQUE` simples no campo `codigo`. O que falta é uma constraint que garanta unicidade semântica: um participante não pode ter dois certificados ativos do mesmo tipo no mesmo evento.

O índice deve ser **parcial** (`WHERE deleted_at IS NULL`) para que:
- Certificados soft-deleted (incluindo os cancelados via `INTEG-LIMP-002`) não sejam contados
- Um participante possa ter um certificado cancelado/soft-deleted e depois receber um novo certificado do mesmo tipo

O Sequelize CLI não suporta índices parciais via `addIndex` com cláusula `WHERE` diretamente. Deve-se usar `queryInterface.sequelize.query()` para executar SQL raw dentro da migration.

## Arquivos envolvidos

- `migrations/20260411153000-add-unique-certificados-participante-evento-tipo.js` ← criar (usar timestamp do momento de criação real)

## Passos

1. Criar arquivo de migration com nome no formato `YYYYMMDDHHMMSS-add-unique-certificados-participante-evento-tipo.js`. O timestamp deve refletir o momento real de criação.

2. Implementar o método `up` usando SQL raw via `queryInterface.sequelize.query()`:
   ```javascript
   await queryInterface.sequelize.query(`
     CREATE UNIQUE INDEX uq_certificados_participante_evento_tipo
     ON certificados (participante_id, evento_id, tipo_certificado_id)
     WHERE deleted_at IS NULL
   `)
   ```

3. Implementar o método `down` para remover o índice:
   ```javascript
   await queryInterface.sequelize.query(`
     DROP INDEX IF EXISTS uq_certificados_participante_evento_tipo
   `)
   ```

4. Não alterar nenhum outro arquivo — a migration deve ser autossuficiente

## Resultado esperado

- Arquivo de migration criado em `migrations/`
- Após `npx sequelize-cli db:migrate`, o banco PostgreSQL possui o índice `uq_certificados_participante_evento_tipo`
- Inserção de dois certificados ativos com mesma tripla `(participante_id, evento_id, tipo_certificado_id)` é rejeitada pelo banco com erro de unicidade
- Inserção de certificado com mesma tripla onde o anterior tem `deleted_at IS NOT NULL` **não** é rejeitada

## Critério de aceite

- O arquivo de migration existe em `migrations/` com timestamp correto
- O método `up` utiliza `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`
- O método `down` utiliza `DROP INDEX IF EXISTS`
- `npm run check` passa sem falhas após a migration ser aplicada no banco de teste
