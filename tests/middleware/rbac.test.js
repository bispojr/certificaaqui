const request = require('supertest')
const express = require('express')
const rbac = require('../../src/middlewares/rbac')

function createApp(perfil) {
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.usuario = { perfil }
    next()
  })
  app.get('/monitor', rbac('monitor'), (req, res) => res.json({ acesso: true }))
  app.get('/gestor', rbac('gestor'), (req, res) => res.json({ acesso: true }))
  app.get('/admin', rbac('admin'), (req, res) => res.json({ acesso: true }))
  return app
}

describe('RBAC Middleware', () => {
  // monitor
  it('monitor acessa rota monitor', async () => {
    const app = createApp('monitor')
    const res = await request(app).get('/monitor')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
  it('monitor não acessa rota gestor', async () => {
    const app = createApp('monitor')
    const res = await request(app).get('/gestor')
    expect(res.status).toBe(403)
  })
  it('monitor não acessa rota admin', async () => {
    const app = createApp('monitor')
    const res = await request(app).get('/admin')
    expect(res.status).toBe(403)
  })
  // gestor
  it('gestor acessa rota monitor', async () => {
    const app = createApp('gestor')
    const res = await request(app).get('/monitor')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
  it('gestor acessa rota gestor', async () => {
    const app = createApp('gestor')
    const res = await request(app).get('/gestor')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
  it('gestor não acessa rota admin', async () => {
    const app = createApp('gestor')
    const res = await request(app).get('/admin')
    expect(res.status).toBe(403)
  })
  // admin
  it('admin acessa rota monitor', async () => {
    const app = createApp('admin')
    const res = await request(app).get('/monitor')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
  it('admin acessa rota gestor', async () => {
    const app = createApp('admin')
    const res = await request(app).get('/gestor')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
  it('admin acessa rota admin', async () => {
    const app = createApp('admin')
    const res = await request(app).get('/admin')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })
})
