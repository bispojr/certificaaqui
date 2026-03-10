const { Atividade } = require('../../models');

describe('Atividade Model', () => {
  beforeEach(async () => {
    await Atividade.destroy({ where: {}, force: true });
  });

  test('deve criar atividade com dados válidos', async () => {
    const atividadeData = {
      nome: 'Minicurso de IA',
      status: 'liberado',
      dados_dinamicos: { instrutor: 'Maria Souza', vagas: 30 },
      evento_id: 1,
      tipo_atividade_id: 1
    };
    const atividade = await Atividade.create(atividadeData);
    expect(atividade).toBeDefined();
    expect(atividade.id).toBeDefined();
    expect(atividade.nome).toBe(atividadeData.nome);
    expect(atividade.status).toBe('liberado');
    expect(atividade.dados_dinamicos).toEqual(atividadeData.dados_dinamicos);
    expect(atividade.created_at).toBeDefined();
    expect(atividade.updated_at).toBeDefined();
  });

  test('não deve criar atividade sem nome', async () => {
    await expect(
      Atividade.create({
        status: 'liberado',
        evento_id: 1,
        tipo_atividade_id: 1
      })
    ).rejects.toThrow();
  });

  test('não deve criar atividade com status inválido', async () => {
    await expect(
      Atividade.create({
        nome: 'Oficina de Robótica',
        status: 'invalido',
        evento_id: 1,
        tipo_atividade_id: 1
      })
    ).rejects.toThrow();
  });

  test('soft delete deve funcionar', async () => {
    const atividade = await Atividade.create({
      nome: 'Palestra de IA',
      status: 'liberado',
      evento_id: 1,
      tipo_atividade_id: 1
    });
    await atividade.destroy();
    const encontrado = await Atividade.findByPk(atividade.id);
    expect(encontrado).toBeNull();
    const comDeletados = await Atividade.findByPk(atividade.id, { paranoid: false });
    expect(comDeletados).toBeDefined();
    expect(comDeletados.deleted_at).not.toBeNull();
  });

  test('deve permitir restaurar atividade deletada', async () => {
    const atividade = await Atividade.create({
      nome: 'Oficina de Arduino',
      status: 'liberado',
      evento_id: 1,
      tipo_atividade_id: 1
    });
    await atividade.destroy();
    await atividade.restore();
    const restaurada = await Atividade.findByPk(atividade.id);
    expect(restaurada).toBeDefined();
    expect(restaurada.deleted_at).toBeNull();
  });
});
