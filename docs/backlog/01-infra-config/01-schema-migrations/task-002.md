# TASK ID: INFRA-MIGRATIONS-002

## Título
Criar teste de migration para os índices de performance

## Objetivo
Criar um arquivo de teste Jest que verifica que a migration de índices (TASK-001) cria e remove corretamente os 5 índices nas tabelas `certificados`, `participantes` e `usuarios`.

## Contexto

O padrão de testes de migration do projeto está em `tests/migrations/`.
Referência: `tests/migrations/certificados.migration.test.js`.

Padrão observado:
- Importa `sequelize` de `../../src/models`
- Importa as migrations necessárias diretamente dos arquivos
- No `beforeEach`, dropa e recria o schema com `DROP SCHEMA IF EXISTS public CASCADE`
- Para verificar índices, usa `queryInterface.showIndex('<tabela>')` que retorna array de objetos com campo `name`

A migration de índices depende das tabelas já existirem, portanto o `beforeEach` deve rodar as migrations de `certificados` (e suas dependências), `participantes` e `usuarios` antes de rodar a migration de índices.

**Atenção:** O nome do arquivo de migration de índices (TASK-001) ainda não existe — use a variável `INDEXES_MIGRATION_FILE` no comentário para que o executor da task substitua pelo nome real após criar o arquivo na TASK-001.

## Arquivos envolvidos

- `tests/migrations/indexes.migration.test.js` ← criar

## Passos

1. Criar `tests/migrations/indexes.migration.test.js`.
2. Importar `sequelize` de `../../src/models`.
3. Importar as migrations de dependência: `create-participantes`, `create-eventos`, `create-tipos-certificados`, `create-certificados`, `create-usuarios`.
4. Importar a migration de índices pelo seu caminho completo (substituir `<TIMESTAMP>` pelo timestamp real do arquivo criado na TASK-001).
5. No `beforeEach`, executar `DROP SCHEMA IF EXISTS public CASCADE` + `CREATE SCHEMA public` e depois rodar `up` de todas as dependências.
6. Escrever dois testes:
   - `up cria os 5 índices de performance`: chama `up` da migration de índices, depois usa `queryInterface.showIndex` em cada tabela e verifica que os índices esperados estão presentes.
   - `down remove os 5 índices de performance`: chama `up` depois `down`, verifica que `showIndex` não retorna mais os índices.

### Estrutura do arquivo

```js
'use strict'

describe('Migration: performance indexes', () => {
  const { sequelize } = require('../../src/models')
  // Substituir <TIMESTAMP> pelo timestamp real do arquivo criado na TASK-001
  const migration = require('../../migrations/<TIMESTAMP>-create-performance-indexes.js')
  const migParticipantes = require('../../migrations/20260311180742-create-participantes.js')
  const migEventos = require('../../migrations/20260311175950-create-eventos.js')
  const migTipos = require('../../migrations/20260311180308-create-tipos-certificados.js')
  const migCertificados = require('../../migrations/20260311180841-create-certificados.js')
  const migUsuarios = require('../../migrations/20260312180000-create-usuarios.js')

  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
    await migParticipantes.up(queryInterface, sequelize.constructor)
    await migEventos.up(queryInterface, sequelize.constructor)
    await migTipos.up(queryInterface, sequelize.constructor)
    await migCertificados.up(queryInterface, sequelize.constructor)
    await migUsuarios.up(queryInterface, sequelize.constructor)
  })

  test('up cria os 5 índices de performance', async () => {
    await migration.up(queryInterface, sequelize.constructor)

    const idxCerts = await queryInterface.showIndex('certificados')
    const nomesCerts = idxCerts.map((i) => i.name)
    expect(nomesCerts).toContain('idx_certificados_evento_id')
    expect(nomesCerts).toContain('idx_certificados_participante_id')
    expect(nomesCerts).toContain('idx_certificados_status')

    const idxParts = await queryInterface.showIndex('participantes')
    expect(idxParts.map((i) => i.name)).toContain('idx_participantes_email')

    const idxUsers = await queryInterface.showIndex('usuarios')
    expect(idxUsers.map((i) => i.name)).toContain('idx_usuarios_email')
  })

  test('down remove os 5 índices de performance', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    await migration.down(queryInterface, sequelize.constructor)

    const idxCerts = await queryInterface.showIndex('certificados')
    const nomesCerts = idxCerts.map((i) => i.name)
    expect(nomesCerts).not.toContain('idx_certificados_evento_id')
    expect(nomesCerts).not.toContain('idx_certificados_participante_id')
    expect(nomesCerts).not.toContain('idx_certificados_status')

    const idxParts = await queryInterface.showIndex('participantes')
    expect(idxParts.map((i) => i.name)).not.toContain('idx_participantes_email')

    const idxUsers = await queryInterface.showIndex('usuarios')
    expect(idxUsers.map((i) => i.name)).not.toContain('idx_usuarios_email')
  })
})
```

## Resultado esperado

Arquivo `tests/migrations/indexes.migration.test.js` criado com 2 testes que passam ao rodar `npm run check`.

## Critério de aceite

- Arquivo criado em `tests/migrations/`
- Testa `up` (presença dos 5 índices) e `down` (ausência dos 5 índices)
- `npm run check` passa sem erros
- Nenhum índice de outra migration é verificado neste arquivo
