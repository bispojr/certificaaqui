const { Participante, sequelize } = require('../../src/models');

describe('Participante Model', () => {
  beforeEach(async () => {
    // Limpa tabela antes de cada teste (cascade remove certificados dependentes)
    await sequelize.query('TRUNCATE TABLE participantes CASCADE');
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

  test('deve associar participante a certificados', async () => {
    const { Certificado, Evento, TiposCertificados } = require('../../src/models');

    // Limpa TiposCertificados para evitar conflito de código duplicado
    await TiposCertificados.destroy({ where: {}, force: true });

    // Cria dependências
    const participante = await Participante.create({
      nomeCompleto: 'Maria Teste',
      email: 'maria@teste.com',
      instituicao: 'IF Teste'
    });
    const evento = await Evento.create({
      nome: 'Evento Teste',
      codigo_base: 'EVT',
      ano: 2026
    });
    const tipo = await TiposCertificados.create({
      codigo: 'MC',
      descricao: 'Minicurso',
      campo_destaque: 'tema',
      texto_base: 'Certificamos que ${nome_completo} participou como ${tema} no minicurso.',
      dados_dinamicos: { tema: '', instrutor: '' }
    });

    // Cria certificado associado
    const certificado = await Certificado.create({
      nome: 'Certificado Teste',
      status: 'emitido',
      valores_dinamicos: { tema: 'TDD' },
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id
    });

    // Busca certificados pelo participante
    const certificados = await participante.getCertificados();
    expect(certificados.length).toBe(1);
    expect(certificados[0].id).toBe(certificado.id);
  });

  // Teste de associação com certificados será implementado após criação dos models participacoes e certificados
});