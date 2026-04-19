const express = require('express')
const tiposCertificadosOwnership = require('../../src/middlewares/tiposCertificadosOwnership')

// Mock do modelo TiposCertificados
jest.mock('../../src/models', () => ({
  TiposCertificados: {
    findByPk: jest.fn(),
  },
}))
const { TiposCertificados } = require('../../src/models')

function buildApp(method, path, mockUsuario) {
  const app = express()
  app.use(express.json())
  app[method](
    path,
    (req, res, next) => {
      req.usuario = mockUsuario
      next()
    },
    tiposCertificadosOwnership,
    (req, res) => {
      res.status(200).json({ acesso: 'permitido' })
    },
  )
  return app
}

function usuario(perfil, eventosIds = []) {
  return {
    perfil,
    getEventos: async () => eventosIds.map((id) => ({ id })),
  }
}

const request = require('supertest')

describe('Middleware tiposCertificadosOwnership', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── Admin ───────────────────────────────────────────────────────────────────
  it('admin pode criar (POST)', async () => {
    const app = buildApp('post', '/tipos-certificados', usuario('admin'))
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 99 })
    expect(res.status).toBe(200)
  })

  it('admin pode deletar (DELETE)', async () => {
    TiposCertificados.findByPk.mockResolvedValue({ id: 1, evento_id: 5 })
    const app = buildApp('delete', '/tipos-certificados/:id', usuario('admin'))
    const res = await request(app).delete('/tipos-certificados/1')
    expect(res.status).toBe(200)
  })

  // ── Monitor ──────────────────────────────────────────────────────────────────
  it('monitor não pode criar (POST) → 403', async () => {
    const app = buildApp('post', '/tipos-certificados', usuario('monitor', [1]))
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 1 })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/monitor/)
  })

  it('monitor não pode deletar (DELETE) → 403', async () => {
    const app = buildApp(
      'delete',
      '/tipos-certificados/:id',
      usuario('monitor', [1]),
    )
    const res = await request(app).delete('/tipos-certificados/1')
    expect(res.status).toBe(403)
  })

  // ── Gestor ───────────────────────────────────────────────────────────────────
  it('gestor pode criar em seu evento (POST)', async () => {
    const app = buildApp('post', '/tipos-certificados', usuario('gestor', [3]))
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 3 })
    expect(res.status).toBe(200)
  })

  it('gestor não pode criar em evento de outro → 403', async () => {
    const app = buildApp('post', '/tipos-certificados', usuario('gestor', [3]))
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 99 })
    expect(res.status).toBe(403)
  })

  it('gestor sem eventos vinculados → 403', async () => {
    const app = buildApp('post', '/tipos-certificados', usuario('gestor', []))
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 1 })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/nenhum evento/)
  })

  it('gestor pode deletar tipo do seu evento', async () => {
    TiposCertificados.findByPk.mockResolvedValue({ id: 7, evento_id: 3 })
    const app = buildApp(
      'delete',
      '/tipos-certificados/:id',
      usuario('gestor', [3]),
    )
    const res = await request(app).delete('/tipos-certificados/7')
    expect(res.status).toBe(200)
  })

  it('gestor não pode deletar tipo de evento alheio → 403', async () => {
    TiposCertificados.findByPk.mockResolvedValue({ id: 7, evento_id: 99 })
    const app = buildApp(
      'delete',
      '/tipos-certificados/:id',
      usuario('gestor', [3]),
    )
    const res = await request(app).delete('/tipos-certificados/7')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/outro evento/)
  })

  it('tipo não encontrado pelo :id → next() (controller trata 404)', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    const app = buildApp(
      'delete',
      '/tipos-certificados/:id',
      usuario('gestor', [3]),
    )
    const res = await request(app).delete('/tipos-certificados/999')
    // Middleware passa; handler de teste responde 200
    expect(res.status).toBe(200)
  })

  it('gestor sem getEventos → 500', async () => {
    const app = buildApp('post', '/tipos-certificados', {
      perfil: 'gestor',
      // sem getEventos
    })
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ evento_id: 1 })
    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/getEventos/)
  })
})
