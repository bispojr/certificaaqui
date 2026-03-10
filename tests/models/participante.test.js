const { Participante } = require('../../models');

describe('Participante Model', () => {
  beforeEach(async () => {
    // Limpa tabela antes de cada teste
    await Participante.destroy({ where: {}, force: true });
  });

  test('deve criar participante com dados válidos', async () => {
    // RED: Este teste vai falhar primeiro
    const participanteData = {
      nomeCompleto: 'João Silva',
      email: 'joao@email.com',
      instituicao: 'Universidade Federal'
    };

    const participante = await Participante.create(participanteData);
    console.log('Participante criado:', participante.toJSON());

    // Verificações
    expect(participante).toBeDefined();
    expect(participante.id).toBeDefined();
    expect(participante.nomeCompleto).toBe(participanteData.nomeCompleto);
    expect(participante.email).toBe(participanteData.email);
    expect(participante.instituicao).toBe(participanteData.instituicao);
    expect(participante.created_at).toBeDefined();
    expect(participante.updated_at).toBeDefined();
  });

  test('não deve criar participante com email duplicado', async () => {
    // Primeiro participante
    await Participante.create({
      nomeCompleto: 'João Silva',
      email: 'joao@email.com'
    });

    // Segundo participante com mesmo email deve falhar
    await expect(
      Participante.create({
        nomeCompleto: 'Maria Silva',
        email: 'joao@email.com'
      })
    ).rejects.toThrow();
  });

  test('soft delete deve funcionar', async () => {
    const participante = await Participante.create({
      nomeCompleto: 'João Silva',
      email: 'joao@email.com'
    });

    // Soft delete
    await participante.destroy();

    // Não deve encontrar com busca normal
    const encontrado = await Participante.findByPk(participante.id);
    expect(encontrado).toBeNull();

    // Mas deve encontrar com paranoid: false
    const comDeletados = await Participante.findByPk(participante.id, {
      paranoid: false
    });
    expect(comDeletados).toBeDefined();
    expect(comDeletados.deleted_at).not.toBeNull();
  });

  test('deve permitir restaurar participante deletado', async () => {
    const participante = await Participante.create({
      nomeCompleto: 'João Silva',
      email: 'joao@email.com'
    });

    await participante.destroy();

    // Restaurar
    await participante.restore();

    // Deve encontrar novamente
    const restaurado = await Participante.findByPk(participante.id);
    expect(restaurado).toBeDefined();
    expect(restaurado.deleted_at).toBeNull();
  });

  test('não deve criar participante sem nomeCompleto', async () => {
    await expect(
      Participante.create({
        email: 'semnome@email.com',
        instituicao: 'UF'
      })
    ).rejects.toThrow();
  });

  test('não deve criar participante sem email', async () => {
    await expect(
      Participante.create({
        nomeCompleto: 'Sem Email',
        instituicao: 'UF'
      })
    ).rejects.toThrow();
  });

  test('não deve criar participante com email inválido', async () => {
    await expect(
      Participante.create({
        nomeCompleto: 'Email Inválido',
        email: 'emailinvalido',
        instituicao: 'UF'
      })
    ).rejects.toThrow();
  });

  // Teste de associação com atividades será implementado após criação dos models participacoes e atividades
});