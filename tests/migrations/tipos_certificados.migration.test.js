describe('Migration: tipos_certificados', () => {
  const { sequelize } = require('../../src/models')
  const migration = require('../../migrations/20260311180308-create-tipos-certificados.js')

  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
  })

  test('up cria a tabela tipos_certificados com campos esperados', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    const table = await queryInterface.describeTable('tipos_certificados')

    expect(table).toHaveProperty('id')
    expect(table).toHaveProperty('codigo')
    expect(table).toHaveProperty('descricao')
    expect(table).toHaveProperty('campo_destaque')
    expect(table).toHaveProperty('texto_base')
    expect(table).toHaveProperty('dados_dinamicos')
    expect(table).toHaveProperty('created_at')
    expect(table).toHaveProperty('updated_at')
    expect(table).toHaveProperty('deleted_at')
  })

  test('down remove a tabela tipos_certificados', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    await migration.down(queryInterface, sequelize.constructor)

    await expect(
      queryInterface.describeTable('tipos_certificados'),
    ).rejects.toThrow()
  })
})
