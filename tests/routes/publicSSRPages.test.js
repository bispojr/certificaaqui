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
    app.use('/', publicRouter)
  })

  it('GET /opcoes renderiza HTML', async () => {
    const res = await request(app).get('/opcoes')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
    expect(res.text).toMatch(/certificados/i)
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
})
