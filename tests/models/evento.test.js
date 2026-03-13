const { Evento, sequelize } = require('../../src/models');

describe('Evento Model', () => {
  beforeEach(async () => {
    await sequelize.query('TRUNCATE TABLE eventos CASCADE');
  });

  test('deve criar evento com dados válidos', async () => {
    const eventoData = {
      nome: 'Congresso de Educação',
      codigo_base: 'EDU',
      ano: 2026
    };
    const evento = await Evento.create(eventoData);
    expect(evento).toBeDefined();
    expect(evento.id).toBeDefined();
    expect(evento.nome).toBe(eventoData.nome);
    expect(evento.codigo_base).toBe(eventoData.codigo_base);
    expect(evento.ano).toBe(eventoData.ano);
    expect(evento.created_at).toBeDefined();
    expect(evento.updated_at).toBeDefined();
  });

  test('não deve criar evento sem ano', async () => {
    await expect(
      Evento.create({ nome: 'Congresso de Educação', codigo_base: 'EDU' })
    ).rejects.toThrow();
  });

  test('não deve criar evento sem nome', async () => {
    await expect(
      Evento.create({ codigo_base: 'EDU', ano: 2026 })
    ).rejects.toThrow();
  });

  test('não deve criar evento sem codigo_base', async () => {
    await expect(
      Evento.create({ nome: 'Congresso de Educação', ano: 2026 })
    ).rejects.toThrow();
  });

  test('não deve criar evento com codigo_base duplicado', async () => {
    await Evento.create({ nome: 'Evento 1', codigo_base: 'EDU', ano: 2026 });
    await expect(
      Evento.create({ nome: 'Evento 2', codigo_base: 'EDU', ano: 2026 })
    ).rejects.toThrow();
  });


  test('soft delete deve funcionar', async () => {
    const evento = await Evento.create({ nome: 'Congresso', codigo_base: 'EDU', ano: 2026 });
    await evento.destroy();
    const encontrado = await Evento.findByPk(evento.id);
    expect(encontrado).toBeNull();
    const comDeletados = await Evento.findByPk(evento.id, { paranoid: false });
    expect(comDeletados).toBeDefined();
    expect(comDeletados.deleted_at).not.toBeNull();
  });

  test('deve permitir restaurar evento deletado', async () => {
    const evento = await Evento.create({ nome: 'Congresso', codigo_base: 'EDU', ano: 2026 });
    await evento.destroy();
    await evento.restore();
    const restaurado = await Evento.findByPk(evento.id);
    expect(restaurado).toBeDefined();
    expect(restaurado.deleted_at).toBeNull();
  });
});
