const { sequelize } = require('../../src/models')
const migration = require('../../migrations/20260311175950-create-eventos.js')

describe('Migration: eventos', () => {
  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    // Isola o teste limpando completamente o schema public.
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
  })

  test('up cria a tabela eventos com campos esperados', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    const table = await queryInterface.describeTable('eventos')

    expect(table).toHaveProperty('id')
    expect(table).toHaveProperty('nome')
    expect(table).toHaveProperty('codigo_base')
    expect(table).toHaveProperty('ano')
    expect(table).toHaveProperty('created_at')
    expect(table).toHaveProperty('updated_at')
    expect(table).toHaveProperty('deleted_at')
  })

  test('down remove a tabela eventos', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    await migration.down(queryInterface, sequelize.constructor)

    await expect(queryInterface.describeTable('eventos')).rejects.toThrow()
  })
})
