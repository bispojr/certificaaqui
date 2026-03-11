const { sequelize } = require('../../models');
const migration = require('../../migrations/20260311190353-create-usuarios.js');
const migrationEventos = require('../../migrations/20260311175950-create-eventos.js');

describe('Migration: usuarios', () => {
  const queryInterface = sequelize.getQueryInterface();

  beforeEach(async () => {
    await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await migrationEventos.up(queryInterface, sequelize.constructor);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('up cria a tabela usuarios com campos esperados', async () => {
    await migration.up(queryInterface, sequelize.constructor);
    const table = await queryInterface.describeTable('usuarios');

    expect(table).toHaveProperty('id');
    expect(table).toHaveProperty('nome');
    expect(table).toHaveProperty('email');
    expect(table).toHaveProperty('senha');
    expect(table).toHaveProperty('perfil');
    expect(table).toHaveProperty('evento_id');
    expect(table).toHaveProperty('created_at');
    expect(table).toHaveProperty('updated_at');
    expect(table).toHaveProperty('deleted_at');
  });

  test('down remove a tabela usuarios', async () => {
    await migration.up(queryInterface, sequelize.constructor);
    await migration.down(queryInterface, sequelize.constructor);

    await expect(queryInterface.describeTable('usuarios')).rejects.toThrow();
  });
});
