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

  beforeAll(async () => {
    // Limpa tabelas para evitar conflitos de FK
    await Certificado.destroy({ where: {} })
    await Participante.destroy({ where: {} })
    await Evento.destroy({ where: {} })
    await TiposCertificados.destroy({ where: {} })

    evento = await Evento.create({
      nome: 'Evento Teste',
      codigo_base: 'EVT',
      ano: 2026,
    })
    tipo = await TiposCertificados.create({
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

  afterAll(async () => {
    if (certificado)
      await Certificado.destroy({ where: { id: certificado.id } })
    if (participante)
      await Participante.destroy({ where: { id: participante.id } })
    if (evento) await Evento.destroy({ where: { id: evento.id } })
    if (tipo) await TiposCertificados.destroy({ where: { id: tipo.id } })
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
})
