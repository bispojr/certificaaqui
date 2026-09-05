const request = require('supertest')
const express = require('express')
const path = require('path')
const publicRouter = require('../../src/routes/public')

describe('SSR rotas públicas de certificados', () => {
  let app
  beforeAll(() => {
    app = express()
    app.set('views', path.join(__dirname, '../../views'))
    app.set('view engine', 'hbs')
    app.engine('hbs', require('hbs').__express)
    app.use(express.urlencoded({ extended: false }))
    // Middleware para expor a URL atual para as views (para menu active)
    app.use((req, res, next) => {
      res.locals.url = req.originalUrl
      res.locals.activeValidar =
        req.originalUrl === '/validar' ||
        req.originalUrl.startsWith('/validar/')
      next()
    })
    app.use('/', publicRouter)
  })

  it('GET /obter renderiza HTML', async () => {
    const res = await request(app).get('/obter')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
    expect(res.text).toMatch(/certificado/i)
  })

  it('GET /validar renderiza HTML', async () => {
    const res = await request(app).get('/validar')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
    expect(res.text).toMatch(/validar/i)
  })

  it('GET /validar/:codigo com caracteres inválidos retorna 400', async () => {
    const res = await request(app).get("/validar/abc'OR'1'='1")
    expect(res.status).toBe(400)
  })

  it('link Validar fica active em /validar', async () => {
    const res = await request(app).get('/validar')
    expect(res.status).toBe(200)
    // O link deve conter class com "active" e href="/validar" (ordem de atributos independente)
    expect(res.text).toMatch(
      /<a(?=[^>]*active)(?=[^>]*href=['"]\/validar['"])[^>]*>\s*Validar/i,
    )
  })

  it('link Validar fica active em /validar/:codigo', async () => {
    const res = await request(app).get('/validar/EDC-25-PT-109')
    // Pode ser 200 (válido) ou 400 (inválido), mas o importante é o menu
    expect([200, 400]).toContain(res.status)
    expect(res.text).toMatch(
      /<a(?=[^>]*active)(?=[^>]*href=['"]\/validar['"])[^>]*>\s*Validar/i,
    )
  })
})
