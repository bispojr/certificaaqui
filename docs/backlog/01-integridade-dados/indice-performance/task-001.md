# TASK ID: INTEG-IDX-001

## Título

Migration para adicionar índice `idx_certificados_tipo_certificado_id`

## Tipo

banco

## Dependências

nenhuma

## Objetivo

Adicionar o índice de performance `idx_certificados_tipo_certificado_id` na coluna `tipo_certificado_id` da tabela `certificados`, seguindo o padrão `tryAddIndex` já estabelecido na migration `20260324083059-create-performance-indexes.js`.

## Contexto

A migration `20260324083059-create-performance-indexes.js` usa uma função auxiliar `tryAddIndex` que adiciona o índice com tratamento de erro caso já exista (idempotente). O mesmo padrão deve ser seguido.

Grep confirmou que `idx_certificados_tipo_certificado_id` não existe em nenhuma migration atual — só foi referenciado em documentação (`docs/`).

## Arquivos envolvidos

- `migrations/20260411180000-add-index-certificados-tipo-certificado-id.js` ← criar

## Passos

1. Ler o início da migration `20260324083059-create-performance-indexes.js` para copiar exatamente o padrão `tryAddIndex`

2. Criar a nova migration:

```javascript
'use strict'

async function tryAddIndex(queryInterface, tableName, fields, indexName) {
  try {
    await queryInterface.addIndex(tableName, fields, { name: indexName })
  } catch (err) {
    if (err.original?.code === '42P07') {
      // índice já existe — idempotente
      return
    }
    throw err
  }
}

module.exports = {
  async up(queryInterface) {
    await tryAddIndex(
      queryInterface,
      'certificados',
      ['tipo_certificado_id'],
      'idx_certificados_tipo_certificado_id'
    )
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'certificados',
      'idx_certificados_tipo_certificado_id'
    )
  },
}
```

3. Usar timestamp posterior às migrations existentes (ex.: `20260411180000`)

## Resultado esperado

- Após `npx sequelize-cli db:migrate`, o índice existe em `certificados`
- Verificável com: `\d certificados` no psql — linha `idx_certificados_tipo_certificado_id`
- `SELECT * FROM pg_indexes WHERE tablename='certificados' AND indexname='idx_certificados_tipo_certificado_id'` retorna 1 linha
- `npm run check` passa

## Critério de aceite

- Migration criada com timestamp correto
- `up` usa `tryAddIndex` com tratamento idempotente (código `42P07`)
- `down` remove o índice com `removeIndex`
- Nenhum model ou arquivo JS de aplicação precisa ser alterado (índices são transparentes para o ORM)
