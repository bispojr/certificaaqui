const { TipoAtividade } = require('../../models');

describe('TipoAtividade Model', () => {
  beforeEach(async () => {
    await TipoAtividade.destroy({ where: {}, force: true });
  });

  test('deve criar tipos_atividade com campo_destaque', async () => {
    const tipoData = {
      codigo: 'PA',
      descricao: 'Palestra',
      campo_destaque: 'Tema da palestra'
    };
    const tipo = await TipoAtividade.create(tipoData);
    expect(tipo).toBeDefined();
    expect(tipo.id).toBeDefined();
    expect(tipo.codigo).toBe(tipoData.codigo);
    expect(tipo.descricao).toBe(tipoData.descricao);
    expect(tipo.campo_destaque).toBe(tipoData.campo_destaque);
    expect(tipo.created_at).toBeDefined();
    expect(tipo.updated_at).toBeDefined();
  });

  test('não deve criar tipos_atividade sem campo_destaque', async () => {
    await expect(
      TipoAtividade.create({ codigo: 'MC', descricao: 'Minicurso' })
    ).rejects.toThrow();
  });

  test('não deve criar tipos_atividade sem codigo', async () => {
    await expect(
      TipoAtividade.create({ descricao: 'Oficina', campo_destaque: 'Material' })
    ).rejects.toThrow();
  });

  test('não deve criar tipos_atividade com codigo fora do padrão', async () => {
    await expect(
      TipoAtividade.create({ codigo: '123', descricao: 'Oficina', campo_destaque: 'Material' })
    ).rejects.toThrow();
    await expect(
      TipoAtividade.create({ codigo: 'A', descricao: 'Oficina', campo_destaque: 'Material' })
    ).rejects.toThrow();
    await expect(
      TipoAtividade.create({ codigo: 'ABC', descricao: 'Oficina', campo_destaque: 'Material' })
    ).rejects.toThrow();
    await expect(
      TipoAtividade.create({ codigo: '1A', descricao: 'Oficina', campo_destaque: 'Material' })
    ).rejects.toThrow();
  });

  test('não deve criar tipos_atividade com codigo duplicado', async () => {
    await TipoAtividade.create({ codigo: 'PA', descricao: 'Palestra', campo_destaque: 'Tema' });
    await expect(
      TipoAtividade.create({ codigo: 'PA', descricao: 'Outra palestra', campo_destaque: 'Outro tema' })
    ).rejects.toThrow();
  });

  test('soft delete deve funcionar', async () => {
    const tipo = await TipoAtividade.create({ codigo: 'MC', descricao: 'Minicurso', campo_destaque: 'Instrutor' });
    await tipo.destroy();
    const encontrado = await TipoAtividade.findByPk(tipo.id);
    expect(encontrado).toBeNull();
    const comDeletados = await TipoAtividade.findByPk(tipo.id, { paranoid: false });
    expect(comDeletados).toBeDefined();
    expect(comDeletados.deleted_at).not.toBeNull();
  });

  test('deve permitir restaurar tipos_atividade deletado', async () => {
    const tipo = await TipoAtividade.create({ codigo: 'OF', descricao: 'Oficina', campo_destaque: 'Material' });
    await tipo.destroy();
    await tipo.restore();
    const restaurado = await TipoAtividade.findByPk(tipo.id);
    expect(restaurado).toBeDefined();
    expect(restaurado.deleted_at).toBeNull();
  });
});
