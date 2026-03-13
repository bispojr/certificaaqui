const request = require('supertest')
const express = require('express')
const scopedEvento = require('../../src/middlewares/scopedEvento')

const app = express()
app.use(express.json())

app.post(
  '/evento/:eventoId/test',
  (req, res, next) => {
    // Simula usuário autenticado
    req.usuario = req.body.usuario
    next()
  },
  scopedEvento,
  (req, res) => {
    res.status(200).json({ acesso: 'permitido' })
  },
)

describe('Middleware scopedEvento', () => {
  it('permite admin acessar qualquer evento', async () => {
    const res = await request(app)
      .post('/evento/42/test')
      .send({ usuario: { perfil: 'admin' } })
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('permite gestor acessar evento vinculado', async () => {
    const res = await request(app)
      .post('/evento/10/test')
      .send({ usuario: { perfil: 'gestor', evento_id: '10' } })
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('bloqueia gestor para evento não vinculado', async () => {
    const res = await request(app)
      .post('/evento/99/test')
      .send({ usuario: { perfil: 'gestor', evento_id: '10' } })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/restrito/)
  })

  it('permite monitor acessar evento vinculado', async () => {
    const res = await request(app)
      .post('/evento/20/test')
      .send({ usuario: { perfil: 'monitor', evento_id: '20' } })
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('bloqueia monitor para evento não vinculado', async () => {
    const res = await request(app)
      .post('/evento/21/test')
      .send({ usuario: { perfil: 'monitor', evento_id: '20' } })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/restrito/)
  })
})
