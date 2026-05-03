const request = require('supertest')
const express = require('express')
const path = require('path')
const publicRouter = require('../../src/routes/public')
const { Certificado, Participante, Evento } = require('../../src/models')

jest.mock('../../src/models')

describe('SSR POST rotas públicas de certificados', () => {
  let app
  beforeAll(() => {
    app = express()
    app.set('views', path.join(__dirname, '../../views'))
    app.set('view engine', 'hbs')
    app.engine('hbs', require('hbs').__express)
    // Registrar helper eq globalmente para SSR
    const hbs = require('hbs')
    hbs.handlebars.registerHelper('eq', (a, b) => a === b)
    app.use(express.urlencoded({ extended: false }))
    app.use('/', publicRouter)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('POST /obter com email válido renderiza obter-lista', async () => {
    Participante.findOne.mockResolvedValue({
      id: 1,
      email: 'teste@exemplo.com',
    })
    Certificado.findAll.mockResolvedValue([
      {
        id: 1,
        nome: 'Certificado 1',
        status: 'emitido',
        created_at: '2026-03-26',
      },
    ])
    const res = await request(app)
      .post('/obter')
      .send('email=teste@exemplo.com')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Seus certificados/)
    expect(res.text).toMatch(/Certificado 1/)
    expect(res.text).toMatch(/teste@exemplo.com/)
  })

  it('POST /obter sem email re-renderiza form-obter com mensagem', async () => {
    const res = await request(app).post('/obter').send('email=')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Informe um e-mail válido/)
  })

  it('POST /obter com email inexistente re-renderiza form-obter com mensagem', async () => {
    Participante.findOne.mockResolvedValue(null)
    const res = await request(app)
      .post('/obter')
      .send('email=naoexiste@exemplo.com')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Nenhum participante encontrado/)
  })

  it('POST /validar com código válido renderiza validar-resultado (valido: true)', async () => {
    Certificado.findOne.mockResolvedValue({
      id: 1,
      codigo: 'ABC123',
      nome: 'Certificado Teste',
      Participante: { nome: 'João', email: 'joao@exemplo.com' },
      Evento: { nome: 'Evento Teste' },
      status: 'emitido',
      created_at: '2026-03-26',
    })
    const res = await request(app)
      .post('/validar')
      .send('codigo=ABC123')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificado Válido/)
    expect(res.text).toMatch(/João/)
    expect(res.text).toMatch(/Evento Teste/)
    expect(res.text).toMatch(/ABC123/)
  })

  it('POST /validar com código inválido renderiza validar-resultado (valido: false)', async () => {
    Certificado.findOne.mockResolvedValue(null)
    const res = await request(app)
      .post('/validar')
      .send('codigo=ERR')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificado Inválido/)
  })

  it('POST /validar sem código re-renderiza form-validar com mensagem', async () => {
    const res = await request(app)
      .post('/validar')
      .send('codigo=')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Informe o código do certificado/)
  })
})
