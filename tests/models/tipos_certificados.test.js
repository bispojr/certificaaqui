const { TiposCertificados, Evento, sequelize } = require('../../src/models')

let eventoId
let outroEventoId

describe('TiposCertificados Model', () => {
  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE tipos_certificados, eventos RESTART IDENTITY CASCADE',
    )
    const evento = await Evento.create({
      nome: 'Evento Modelo',
      codigo_base: 'EMO',
      ano: 2026,
    })
    eventoId = evento.id
    const outroEvento = await Evento.create({
      nome: 'Outro Evento',
      codigo_base: 'OEM',
      ano: 2026,
    })
    outroEventoId = outroEvento.id
  })

  beforeEach(async () => {
    await sequelize.query('TRUNCATE TABLE tipos_certificados CASCADE')
  })

  test('deve criar tipos_certificados com campo_destaque, texto_base e dados_dinamicos', async () => {
    const tipoData = {
      evento_id: eventoId,
      codigo: 'PA',
      descricao: 'Palestra',
      campo_destaque: 'tema',
      texto_base:
        'Certificamos que ${nome_completo} participou como ${funcao} na palestra.',
      dados_dinamicos: { tema: '', palestrante: '', duracao: '' },
    }
    const tipo = await TiposCertificados.create(tipoData)
    expect(tipo).toBeDefined()
    expect(tipo.id).toBeDefined()
    expect(tipo.codigo).toBe(tipoData.codigo)
    expect(tipo.descricao).toBe(tipoData.descricao)
    expect(tipo.campo_destaque).toBe(tipoData.campo_destaque)
    expect(tipo.texto_base).toBe(tipoData.texto_base)
    expect(tipo.dados_dinamicos).toEqual(tipoData.dados_dinamicos)
    expect(tipo.created_at).toBeDefined()
    expect(tipo.updated_at).toBeDefined()
  })

  test('não deve criar tipos_certificados sem texto_base', async () => {
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'MC',
        descricao: 'Minicurso',
        campo_destaque: 'tema',
        dados_dinamicos: { instrutor: '', vagas: '' },
      }),
    ).rejects.toThrow()
  })

  test('não deve criar tipos_certificados sem campo_destaque', async () => {
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'MC',
        descricao: 'Minicurso',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { instrutor: '', vagas: '' },
      }),
    ).rejects.toThrow()
  })

  test('não deve criar tipos_certificados sem codigo', async () => {
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        descricao: 'Oficina',
        campo_destaque: 'material',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { material: '' },
      }),
    ).rejects.toThrow()
  })

  test('não deve criar tipos_certificados com codigo fora do padrão', async () => {
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: '123',
        descricao: 'Oficina',
        campo_destaque: 'material',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { material: '' },
      }),
    ).rejects.toThrow()
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'A',
        descricao: 'Oficina',
        campo_destaque: 'material',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { material: '' },
      }),
    ).rejects.toThrow()
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'ABC',
        descricao: 'Oficina',
        campo_destaque: 'material',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { material: '' },
      }),
    ).rejects.toThrow()
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: '1A',
        descricao: 'Oficina',
        campo_destaque: 'material',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { material: '' },
      }),
    ).rejects.toThrow()
  })

  test('não deve criar tipos_certificados com campo_destaque inválido', async () => {
    // campo_destaque não existe em dados_dinamicos nem é 'nome' do certificado
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'OF',
        descricao: 'Oficina',
        campo_destaque: 'campo_invalido',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { instrutor: '', vagas: '' },
      }),
    ).rejects.toThrow()

    // campo_destaque válido: 'nome' do certificado
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'OA',
        descricao: 'Oficina',
        campo_destaque: 'nome',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { instrutor: '', vagas: '' },
      }),
    ).resolves.toBeDefined()

    // campo_destaque válido: campo em dados_dinamicos
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'OB',
        descricao: 'Oficina',
        campo_destaque: 'instrutor',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { instrutor: '', vagas: '' },
      }),
    ).resolves.toBeDefined()
  })

  test('não deve criar tipos_certificados com codigo duplicado no mesmo evento', async () => {
    await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'PA',
      descricao: 'Palestra',
      campo_destaque: 'tema',
      texto_base: 'Texto exemplo',
      dados_dinamicos: { tema: '', palestrante: '' },
    })
    await expect(
      TiposCertificados.create({
        evento_id: eventoId,
        codigo: 'PA',
        descricao: 'Outra palestra',
        campo_destaque: 'tema',
        texto_base: 'Texto exemplo',
        dados_dinamicos: { tema: '', palestrante: '' },
      }),
    ).rejects.toThrow()
  })

  test('deve permitir o mesmo codigo em eventos diferentes', async () => {
    await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'ZZ',
      descricao: 'Tipo A',
      campo_destaque: 'nome',
      texto_base: 'Texto',
      dados_dinamicos: {},
    })
    await expect(
      TiposCertificados.create({
        evento_id: outroEventoId,
        codigo: 'ZZ',
        descricao: 'Tipo B',
        campo_destaque: 'nome',
        texto_base: 'Texto',
        dados_dinamicos: {},
      }),
    ).resolves.toBeDefined()
  })

  test('soft delete deve funcionar', async () => {
    const tipo = await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'MC',
      descricao: 'Minicurso',
      campo_destaque: 'instrutor',
      texto_base: 'Texto exemplo',
      dados_dinamicos: { instrutor: '', vagas: '' },
    })
    await tipo.destroy()
    const encontrado = await TiposCertificados.findByPk(tipo.id)
    expect(encontrado).toBeNull()
    const comDeletados = await TiposCertificados.findByPk(tipo.id, {
      paranoid: false,
    })
    expect(comDeletados).toBeDefined()
    expect(comDeletados.deleted_at).not.toBeNull()
  })

  test('deve permitir restaurar tipos_certificados deletado', async () => {
    const tipo = await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'MC',
      descricao: 'Minicurso',
      campo_destaque: 'instrutor',
      texto_base: 'Texto exemplo',
      dados_dinamicos: { instrutor: '', vagas: '' },
    })
    await tipo.destroy()
    await tipo.restore()
    const restaurado = await TiposCertificados.findByPk(tipo.id)
    expect(restaurado).toBeDefined()
    expect(restaurado.deleted_at).toBeNull()
  })
})
