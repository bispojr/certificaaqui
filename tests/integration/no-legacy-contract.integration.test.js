const express = require('express')
const request = require('supertest')

const scopedEvento = require('../../src/middlewares/scopedEvento')

function buildUser() {
  return {
    id: 7,
    perfil: 'monitor',
    getEventos: async () => [{ id: 10 }, { id: 20 }],
  }
}

describe('no-legacy-contract integration', () => {
  it('usa o contrato canônico sem injetar req.query.evento_id ou fallback legado', async () => {
    const app = express()
    app.use(express.json())

    app.get(
      '/eventos/:id',
      async (req, res, next) => {
        req.usuario = buildUser()
        req.principal = { role: 'monitor' }
        return scopedEvento(req, res, next)
      },
      (req, res) => {
        res.json({
          ok: true,
          hasQueryEventoId: Object.prototype.hasOwnProperty.call(
            req.query,
            'evento_id',
          ),
          contexto: req.contextoAutorizacao,
        })
      },
    )

    const response = await request(app).get('/eventos/10')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      ok: true,
      hasQueryEventoId: false,
      contexto: { eventoIds: [10, 20], scopeMode: 'scoped_events' },
    })
  })

  it('nega acesso fora do escopo sem usar fallback de contrato legado', async () => {
    const app = express()
    app.use(express.json())

    app.get(
      '/eventos/:id',
      async (req, res, next) => {
        req.usuario = buildUser()
        req.principal = { role: 'monitor' }
        return scopedEvento(req, res, next)
      },
      (req, res) => {
        res.json({ ok: true })
      },
    )

    const response = await request(app).get('/eventos/99')

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      error: expect.stringMatching(/escopo|restrito|evento/i),
    })
  })
})
