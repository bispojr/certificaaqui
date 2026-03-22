# TASK ID: TEST-MIG-001

## Título

Criar `tests/migrations/performanceIndexes.migration.test.js`

## Objetivo

Verificar que a migration de índices de performance (`up`) cria os 5 índices esperados e que (`down`) os remove completamente.

## Bloqueio

**Requer INFRA-MIGRATIONS-001 executado primeiro.** O arquivo `migrations/<timestamp>-create-performance-indexes.js` deve existir no projeto antes de implementar este teste.

## Contexto

- Padrão dos demais testes de migration: `DROP SCHEMA / CREATE SCHEMA` no `beforeEach` para isolamento total
- `queryInterface.showIndex('tabela')` retorna array com objetos que têm `name` — usado para verificar presença/ausência dos índices
- O `beforeEach` precisa rodar as migrations de tabelas pré-requisito antes da migration de índices:
  - `certificados` (depende de `participantes`, `eventos`, `tipos_certificados`)
  - `participantes`
  - `usuarios`
- No `afterEach` (ou via `beforeEach` com DROP SCHEMA), o schema é reconstruído

## Arquivos envolvidos

- `tests/migrations/performanceIndexes.migration.test.js` ← CRIAR

## Passos

### Criar `tests/migrations/performanceIndexes.migration.test.js`

> **Antes de criar:** substituir `<TIMESTAMP>` pelo valor real do arquivo de migration gerado em INFRA-MIGRATIONS-001 (ex: `20260322120000`).

```js
const { sequelize } = require('../../src/models')
const migrationIndexes = require('../../migrations/<TIMESTAMP>-create-performance-indexes.js')
const migrationCertificados = require('../../migrations/20260311180841-create-certificados.js')
const migrationParticipantes = require('../../migrations/20260311180742-create-participantes.js')
const migrationEventos = require('../../migrations/20260311175950-create-eventos.js')
const migrationTipos = require('../../migrations/20260311180308-create-tipos-certificados.js')
const migrationUsuarios = require('../../migrations/20260312180000-create-usuarios.js')

const EXPECTED_INDEXES = [
  'idx_certificados_evento_id',
  'idx_certificados_participante_id',
  'idx_certificados_status',
  'idx_participantes_email',
  'idx_usuarios_email',
]

describe('Migration: performance indexes', () => {
  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
    await migrationParticipantes.up(queryInterface, sequelize.constructor)
    await migrationEventos.up(queryInterface, sequelize.constructor)
    await migrationTipos.up(queryInterface, sequelize.constructor)
    await migrationCertificados.up(queryInterface, sequelize.constructor)
    await migrationUsuarios.up(queryInterface, sequelize.constructor)
  })

  test('up adiciona os 5 índices de performance', async () => {
    await migrationIndexes.up(queryInterface, sequelize.constructor)

    const certIndexes = await queryInterface.showIndex('certificados')
    const certNames = certIndexes.map((i) => i.name)
    expect(certNames).toContain('idx_certificados_evento_id')
    expect(certNames).toContain('idx_certificados_participante_id')
    expect(certNames).toContain('idx_certificados_status')

    const partIndexes = await queryInterface.showIndex('participantes')
    const partNames = partIndexes.map((i) => i.name)
    expect(partNames).toContain('idx_participantes_email')

    const userIndexes = await queryInterface.showIndex('usuarios')
    const userNames = userIndexes.map((i) => i.name)
    expect(userNames).toContain('idx_usuarios_email')
  })

  test('down remove todos os 5 índices', async () => {
    await migrationIndexes.up(queryInterface, sequelize.constructor)
    await migrationIndexes.down(queryInterface, sequelize.constructor)

    const certIndexes = await queryInterface.showIndex('certificados')
    const certNames = certIndexes.map((i) => i.name)
    expect(certNames).not.toContain('idx_certificados_evento_id')
    expect(certNames).not.toContain('idx_certificados_participante_id')
    expect(certNames).not.toContain('idx_certificados_status')

    const partIndexes = await queryInterface.showIndex('participantes')
    expect(partIndexes.map((i) => i.name)).not.toContain(
      'idx_participantes_email',
    )

    const userIndexes = await queryInterface.showIndex('usuarios')
    expect(userIndexes.map((i) => i.name)).not.toContain('idx_usuarios_email')
  })
})
```

## Critério de aceite

- `up`: `showIndex` nas 3 tabelas contém os 5 nomes de índice esperados
- `down`: `showIndex` nas 3 tabelas não contém nenhum dos 5 nomes
- Teste isolado: `beforeEach` dropa e recria schema inteiro para não vazar estado
