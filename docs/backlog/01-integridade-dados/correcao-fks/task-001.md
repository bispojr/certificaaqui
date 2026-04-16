# TASK ID: INTEG-FK-001

## Título

Migration para alterar `onDelete` das FKs de `certificados` de `CASCADE` para `RESTRICT`

## Tipo

banco

## Dependências

nenhuma

## Objetivo

Criar uma migration Sequelize que remove as três FK constraints da tabela `certificados` e as recria com `ON DELETE RESTRICT`, impedindo que um hard delete acidental em `participantes`, `eventos` ou `tipos_certificados` destrua os certificados associados.

## Contexto

A migration original `20260311180841-create-certificados.js` criou as FKs com `onDelete: 'CASCADE'`. Migrations existentes não devem ser editadas retroativamente (violaria o histórico de versões do banco). A alteração deve ser feita por uma nova migration.

No PostgreSQL, alterar uma FK constraint exige:

1. Dropar a constraint existente (`ALTER TABLE ... DROP CONSTRAINT`)
2. Recriar com o novo comportamento (`ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE RESTRICT`)

Os nomes das constraints gerados pelo Sequelize seguem o padrão `{tabela}_{coluna}_fkey` para FKs criadas com `references` no `createTable`. Os nomes esperados são:

- `certificados_participante_id_fkey`
- `certificados_evento_id_fkey`
- `certificados_tipo_certificado_id_fkey`

> Se os nomes reais diferirem (verificável com `\d+ certificados` no psql), ajustar na migration antes de aplicar.

## Arquivos envolvidos

- `migrations/20260411160000-alter-certificados-fks-to-restrict.js` ← criar (usar timestamp real no momento da criação)

## Passos

1. Criar a migration com o seguinte conteúdo:

```javascript
'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE certificados
        DROP CONSTRAINT IF EXISTS certificados_participante_id_fkey,
        DROP CONSTRAINT IF EXISTS certificados_evento_id_fkey,
        DROP CONSTRAINT IF EXISTS certificados_tipo_certificado_id_fkey;

      ALTER TABLE certificados
        ADD CONSTRAINT certificados_participante_id_fkey
          FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE RESTRICT,
        ADD CONSTRAINT certificados_evento_id_fkey
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE RESTRICT,
        ADD CONSTRAINT certificados_tipo_certificado_id_fkey
          FOREIGN KEY (tipo_certificado_id) REFERENCES tipos_certificados(id) ON DELETE RESTRICT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE certificados
        DROP CONSTRAINT IF EXISTS certificados_participante_id_fkey,
        DROP CONSTRAINT IF EXISTS certificados_evento_id_fkey,
        DROP CONSTRAINT IF EXISTS certificados_tipo_certificado_id_fkey;

      ALTER TABLE certificados
        ADD CONSTRAINT certificados_participante_id_fkey
          FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
        ADD CONSTRAINT certificados_evento_id_fkey
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
        ADD CONSTRAINT certificados_tipo_certificado_id_fkey
          FOREIGN KEY (tipo_certificado_id) REFERENCES tipos_certificados(id) ON DELETE CASCADE;
    `)
  },
}
```

2. Verificar o timestamp do arquivo — deve ser posterior a todas as migrations existentes

3. Não alterar nenhum model Sequelize (a propriedade `onDelete` nos models é apenas documentação para o Sequelize gerar SQL; a FK real no banco será RESTRICT após a migration)

## Resultado esperado

- Após `npx sequelize-cli db:migrate`, as três FKs de `certificados` têm `ON DELETE RESTRICT` no banco
- Tentar deletar diretamente (hard delete via SQL) um participante que tem certificados resulta em erro de FK, não em cascade silenciosa
- `npm run check` passa após a migration ser aplicada no banco de teste

## Critério de aceite

- O arquivo de migration existe em `migrations/` com timestamp correto
- O `up` usa `DROP CONSTRAINT IF EXISTS` seguido de `ADD CONSTRAINT ... ON DELETE RESTRICT` para as três FKs
- O `down` restaura `ON DELETE CASCADE` (reversibilidade)
- A migration é idempotente para o `down`: se a constraint não existir, `DROP ... IF EXISTS` não falha
