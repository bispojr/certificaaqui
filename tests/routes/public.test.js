const request = require('supertest')
const app = require('../../app')
const {
  Participante,
  Certificado,
  Evento,
  TiposCertificados,
} = require('../../src/models')

describe('Rotas públicas de certificados', () => {
  let participante, certificado, evento, tipo

  beforeEach(async () => {
    // Limpeza robusta: truncate com cascade e reinício de IDs
    await Certificado.sequelize.query(
      'TRUNCATE TABLE "certificados", "tipos_certificados", "participantes", "eventos" RESTART IDENTITY CASCADE',
    )

    evento = await Evento.create({
      nome: 'Evento Teste',
      codigo_base: 'EVT',
      ano: 2026,
      created_at: new Date(),
      updated_at: new Date(),
    })
    tipo = await TiposCertificados.create({
      evento_id: evento.id,
      codigo: 'CT',
      descricao: 'Tipo Teste',
      campo_destaque: 'nomeCompleto',
      texto_base: 'Certificado para ${nomeCompleto}',
      dados_dinamicos: { nomeCompleto: { tipo: 'string', obrigatorio: true } },
    })
    participante = await Participante.create({
      nomeCompleto: 'Maria Teste',
      email: 'maria@teste.com',
      instituicao: 'Universidade Teste',
    })
    certificado = await Certificado.create({
      nome: 'Certificado Teste',
      status: 'emitido',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'ABC123',
    })
  })

  afterEach(async () => {
    await Certificado.sequelize.query(
      'TRUNCATE TABLE "certificados", "tipos_certificados", "participantes", "eventos" RESTART IDENTITY CASCADE',
    )
  })

  it('GET /public/certificados?email retorna certificados do participante', async () => {
    const res = await request(app).get(
      '/public/certificados?email=maria@teste.com',
    )
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.certificados)).toBe(true)
    expect(res.body.certificados[0].nome).toBe('Certificado Teste')
  })

  it('GET /public/certificados?email retorna 404 para email inexistente', async () => {
    const res = await request(app).get(
      '/public/certificados?email=naoexiste@teste.com',
    )
    expect(res.status).toBe(404)
  })

  it('GET /public/validar/:codigo retorna certificado válido', async () => {
    const res = await request(app).get('/public/validar/ABC123')
    expect(res.status).toBe(200)
    expect(res.body.valido).toBe(true)
    expect(res.body.certificado.nome).toBe('Certificado Teste')
  })

  it('GET /public/validar/:codigo retorna 404 para código inválido', async () => {
    const res = await request(app).get('/public/validar/INVALIDO')
    expect(res.status).toBe(404)
    expect(res.body.valido).toBe(false)
  })

  it('GET /public/certificados/:id/pdf retorna PDF válido', async () => {
    const res = await request(app).get(
      `/public/certificados/${certificado.id}/pdf`,
    )
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['content-disposition']).toContain(
      `certificado-${certificado.id}.pdf`,
    )
    expect(Buffer.isBuffer(res.body)).toBe(true)
    expect(res.body.slice(0, 4).toString()).toBe('%PDF')
  }, 10000)
})
