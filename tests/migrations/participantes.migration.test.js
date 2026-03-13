const { sequelize } = require('../../src/models')
const migration = require('../../migrations/20260311180742-create-participantes.js')

describe('Migration: participantes', () => {
  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
  })

  test('up cria a tabela participantes com campos esperados', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    const table = await queryInterface.describeTable('participantes')

    expect(table).toHaveProperty('id')
    expect(table).toHaveProperty('nome_completo')
    expect(table).toHaveProperty('email')
    expect(table).toHaveProperty('instituicao')
    expect(table).toHaveProperty('created_at')
    expect(table).toHaveProperty('updated_at')
    expect(table).toHaveProperty('deleted_at')
  })

  test('down remove a tabela participantes', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    await migration.down(queryInterface, sequelize.constructor)

    await expect(
      queryInterface.describeTable('participantes'),
    ).rejects.toThrow()
  })
})
