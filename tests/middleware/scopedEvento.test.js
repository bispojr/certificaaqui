const request = require('supertest')
const express = require('express')
const scopedEvento = require('../../src/middlewares/scopedEvento')

const app = express()
app.use(express.json())

// Helper para simular req.usuario com método getEventos()
// IMPORTANTE: funções não sobrevivem à serialização JSON, por isso o mock é
// injetado diretamente no req pelo middleware de teste, não via req.body.
function usuarioComEventos(perfil, eventosIds = []) {
  return {
    perfil,
    getEventos: async () => eventosIds.map(id => ({ id })),
  }
}

let mockUsuario = null

app.post(
  '/evento/:eventoId/test',
  (req, res, next) => {
    req.usuario = mockUsuario
    next()
  },
  scopedEvento,
  (req, res) => {
    res.status(200).json({ acesso: 'permitido' })
  },
)

describe('Middleware scopedEvento', () => {
  it('permite admin acessar qualquer evento', async () => {
    mockUsuario = usuarioComEventos('admin')
    const res = await request(app).post('/evento/42/test').send()
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('permite gestor acessar evento vinculado', async () => {
    mockUsuario = usuarioComEventos('gestor', [10, 20])
    const res = await request(app).post('/evento/10/test').send()
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('bloqueia gestor para evento não vinculado', async () => {
    mockUsuario = usuarioComEventos('gestor', [10, 20])
    const res = await request(app).post('/evento/99/test').send()
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/restrito/)
  })

  it('permite monitor acessar evento vinculado', async () => {
    mockUsuario = usuarioComEventos('monitor', [20])
    const res = await request(app).post('/evento/20/test').send()
    expect(res.status).toBe(200)
    expect(res.body.acesso).toBe('permitido')
  })

  it('bloqueia monitor para evento não vinculado', async () => {
    mockUsuario = usuarioComEventos('monitor', [20])
    const res = await request(app).post('/evento/21/test').send()
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/restrito/)
  })

  it('bloqueia gestor/monitor sem eventos vinculados', async () => {
    mockUsuario = usuarioComEventos('gestor', [])
    const res = await request(app).post('/evento/1/test').send()
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/nenhum evento/)
  })
})
