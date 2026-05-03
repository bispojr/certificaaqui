const request = require('supertest')
const app = require('../../app')
const {
  Participante,
  Certificado,
  Evento,
  TiposCertificados,
  sequelize,
} = require('../../src/models')

describe('SSR Público - POST', () => {
  let participante, evento, tipo, certificado

  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE certificados RESTART IDENTITY CASCADE',
    )
    await sequelize.query(
      'TRUNCATE TABLE participantes RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query(
      'TRUNCATE TABLE tipos_certificados RESTART IDENTITY CASCADE',
    )
    evento = await Evento.create({
      nome: 'Evento Público',
      codigo_base: 'PUB',
      ano: 2026,
      data_inicio: '2026-04-01',
      data_fim: '2026-04-02',
    })
    tipo = await TiposCertificados.create({
      evento_id: evento.id,
      codigo: 'TP',
      descricao: 'Tipo Público',
      campo_destaque: 'nome',
      texto_base: 'Texto base',
      dados_dinamicos: { nome: {} },
    })
    participante = await Participante.create({
      nomeCompleto: 'Fulano',
      email: 'fulano@teste.com',
    })
    certificado = await Certificado.create({
      nome: 'Fulano',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      valores_dinamicos: { nome: 'Fulano' },
      codigo: 'ABC123',
      status: 'emitido',
    })
  })

  afterAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE certificados RESTART IDENTITY CASCADE',
    )
    await sequelize.query(
      'TRUNCATE TABLE participantes RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query(
      'TRUNCATE TABLE tipos_certificados RESTART IDENTITY CASCADE',
    )
  })

  it('POST /obter - sucesso', async () => {
    const res = await request(app)
      .post('/obter')
      .type('form')
      .send({ email: 'fulano@teste.com' })
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Seus certificados/i)
    expect(res.text).toMatch(/Fulano/)
    expect(res.text).toMatch(
      /href=['"]\/api\/certificados\/[0-9]+\/pdf['"]?/,
    )
  })

  it('POST /obter - não encontrado', async () => {
    const res = await request(app)
      .post('/obter')
      .type('form')
      .send({ email: 'naoexiste@teste.com' })
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Nenhum participante encontrado com este e-mail/i)
  })

  it('POST /validar - sucesso', async () => {
    const res = await request(app)
      .post('/validar')
      .type('form')
      .send({ codigo: 'ABC123' })
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificado válido/i)
    expect(res.text).toMatch(/ABC123/)
  })

  it('POST /validar - código inválido', async () => {
    const res = await request(app)
      .post('/validar')
      .type('form')
      .send({ codigo: 'ZZZ999' })
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificado inválido|não encontrado/i)
  })
})
