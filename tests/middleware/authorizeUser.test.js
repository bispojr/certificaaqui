const request = require('supertest')
const express = require('express')
const authorizeUser = require('../../src/middlewares/authorizeUser')

function createApp(usuario) {
  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.usuario = usuario
    next()
  })
  app.get('/:papel/:id/recurso', authorizeUser, (req, res) =>
    res.json({ acesso: true }),
  )
  return app
}

describe('Middleware authorizeUser', () => {
  it('permite acesso quando papel e id correspondem ao usuário', async () => {
    const app = createApp({ id: 42, perfil: 'gestor' })
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })

  it('bloqueia acesso quando papel não corresponde', async () => {
    const app = createApp({ id: 42, perfil: 'monitor' })
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/papel\/id não conferem/)
  })

  it('bloqueia acesso quando id não corresponde', async () => {
    const app = createApp({ id: 99, perfil: 'gestor' })
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/papel\/id não conferem/)
  })

  it('bloqueia acesso quando papel e id não correspondem', async () => {
    const app = createApp({ id: 99, perfil: 'monitor' })
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/papel\/id não conferem/)
  })

  it('admin pode acessar rota com papel/id de outro usuário', async () => {
    const app = createApp({ id: 1, perfil: 'admin' })
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })

  it('admin pode acessar rota com o próprio papel/id', async () => {
    const app = createApp({ id: 1, perfil: 'admin' })
    const res = await request(app).get('/admin/1/recurso')
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe(true)
  })

  it('retorna 401 quando req.usuario não está definido', async () => {
    const app = createApp(null)
    const res = await request(app).get('/gestor/42/recurso')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Não autenticado/)
  })
})
