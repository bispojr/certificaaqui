describe('Migration: certificados', () => {
  const { sequelize } = require('../../src/models')
  const migration = require('../../migrations/20260311180841-create-certificados.js')
  const migrationParticipantes = require('../../migrations/20260311180742-create-participantes.js')
  const migrationEventos = require('../../migrations/20260311175950-create-eventos.js')
  const migrationTiposCertificados = require('../../migrations/20260311180308-create-tipos-certificados.js')
  // Removed duplicate describe block
  const queryInterface = sequelize.getQueryInterface()

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;')
    await sequelize.query('CREATE SCHEMA public;')
    await migrationParticipantes.up(queryInterface, sequelize.constructor)
    await migrationEventos.up(queryInterface, sequelize.constructor)
    await migrationTiposCertificados.up(queryInterface, sequelize.constructor)
  })

  test('up cria a tabela certificados com campos esperados', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    const table = await queryInterface.describeTable('certificados')

    expect(table).toHaveProperty('id')
    expect(table).toHaveProperty('nome')
    expect(table).toHaveProperty('status')
    expect(table).toHaveProperty('valores_dinamicos')
    expect(table).toHaveProperty('participante_id')
    expect(table).toHaveProperty('evento_id')
    expect(table).toHaveProperty('tipo_certificado_id')
    expect(table).toHaveProperty('created_at')
    expect(table).toHaveProperty('updated_at')
    expect(table).toHaveProperty('deleted_at')
  })

  test('down remove a tabela certificados e dependentes', async () => {
    await migration.up(queryInterface, sequelize.constructor)
    await migration.down(queryInterface, sequelize.constructor)
    await expect(queryInterface.describeTable('certificados')).rejects.toThrow()

    await migrationTiposCertificados.down(queryInterface, sequelize.constructor)
    await expect(
      queryInterface.describeTable('tipos_certificados'),
    ).rejects.toThrow()

    await migrationEventos.down(queryInterface, sequelize.constructor)
    await expect(queryInterface.describeTable('eventos')).rejects.toThrow()

    await migrationParticipantes.down(queryInterface, sequelize.constructor)
    await expect(
      queryInterface.describeTable('participantes'),
    ).rejects.toThrow()
  })
})
