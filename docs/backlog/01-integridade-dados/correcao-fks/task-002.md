# TASK ID: INTEG-FK-002

## Título

Migration para alterar `onDelete` das FKs de `usuario_eventos` de `CASCADE` para `RESTRICT`

## Tipo

banco

## Dependências

nenhuma (independente de INTEG-FK-001)

## Objetivo

Criar uma migration Sequelize que remove as duas FK constraints da tabela `usuario_eventos` e as recria com `ON DELETE RESTRICT`, impedindo que um hard delete em `usuarios` ou `eventos` destrua os vínculos de associação silenciosamente.

## Contexto

A migration `20260313190000-create-usuario_eventos.js` criou as FKs com `onDelete: 'CASCADE'`. O mesmo padrão da INTEG-FK-001 aplica-se aqui.

Nomes esperados das constraints (padrão Sequelize + PostgreSQL):
- `usuario_eventos_usuario_id_fkey`
- `usuario_eventos_evento_id_fkey`

## Arquivos envolvidos

- `migrations/20260411170000-alter-usuario-eventos-fks-to-restrict.js` ← criar (usar timestamp real)

## Passos

1. Criar a migration:

```javascript
'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_eventos
        DROP CONSTRAINT IF EXISTS usuario_eventos_usuario_id_fkey,
        DROP CONSTRAINT IF EXISTS usuario_eventos_evento_id_fkey;

      ALTER TABLE usuario_eventos
        ADD CONSTRAINT usuario_eventos_usuario_id_fkey
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
        ADD CONSTRAINT usuario_eventos_evento_id_fkey
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE RESTRICT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_eventos
        DROP CONSTRAINT IF EXISTS usuario_eventos_usuario_id_fkey,
        DROP CONSTRAINT IF EXISTS usuario_eventos_evento_id_fkey;

      ALTER TABLE usuario_eventos
        ADD CONSTRAINT usuario_eventos_usuario_id_fkey
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        ADD CONSTRAINT usuario_eventos_evento_id_fkey
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
    `)
  },
}
```

2. Verificar que o timestamp é posterior ao da migration `20260313190000-create-usuario_eventos.js`

## Resultado esperado

- As FKs de `usuario_eventos` têm `ON DELETE RESTRICT` após a migration
- Um hard delete de usuário com vínculos ativos falha com erro de FK
- `npm run check` passa

## Critério de aceite

- Migration existe em `migrations/` com timestamp correto
- `up` usa RESTRICT, `down` restaura CASCADE
- Ambos usam `DROP CONSTRAINT IF EXISTS` para segurança
