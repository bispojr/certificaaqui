const request = require('supertest')
const express = require('express')
const rbac = require('../../src/middlewares/rbac')
const {
  getMinimumRole,
} = require('../../src/services/auth/operationPolicyCatalog')

function createApp(perfil) {
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.usuario = { perfil }
    next()
  })

  app.get('/certificado/read', rbac('certificado.read'), (req, res) =>
    res.json({ acesso: true }),
  )
  app.get('/certificado/write', rbac('certificado.write'), (req, res) =>
    res.json({ acesso: true }),
  )

  return app
}

describe('RBAC equivalência por operationKey', () => {
  it('usa o mínimo de perfil do catálogo para operações críticas', () => {
    expect(getMinimumRole('certificado.read')).toBe('monitor')
    expect(getMinimumRole('certificado.write')).toBe('gestor')
  })

  it('permite monitor em leitura e nega em escrita', async () => {
    const app = createApp('monitor')

    const read = await request(app).get('/certificado/read')
    const write = await request(app).get('/certificado/write')

    expect(read.status).toBe(200)
    expect(write.status).toBe(403)
  })

  it('permite gestor em escrita', async () => {
    const app = createApp('gestor')
    const res = await request(app).get('/certificado/write')

    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
})
