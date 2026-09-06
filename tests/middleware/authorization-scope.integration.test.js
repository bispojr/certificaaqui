const express = require('express')
const request = require('supertest')
const scopedEvento = require('../../src/middlewares/scopedEvento')
const {
  resolveAuthorizationScope,
} = require('../../src/services/auth/resolveAuthorizationScope')

describe('authorization scope integration', () => {
  it('usa req.contextoAutorizacao.eventoIds e permite acesso dentro do escopo', async () => {
    const app = express()
    app.use(express.json())

    app.use(async (req, res, next) => {
      req.usuario = {
        perfil: 'gestor',
        getEventos: async () => [{ id: '10' }, { id: 20 }],
      }
      req.principal = { role: 'gestor' }
      req.contextoAutorizacao = await resolveAuthorizationScope({
        usuario: req.usuario,
        principal: req.principal,
      })
      next()
    })

    app.get('/evento/10', scopedEvento, (req, res) => {
      res
        .status(200)
        .json({ ok: true, eventoIds: req.contextoAutorizacao.eventoIds })
    })

    const res = await request(app).get('/evento/10')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, eventoIds: [10, 20] })
  })

  it('nega acesso seguro quando o escopo restrito falha', async () => {
    const app = express()
    app.use(express.json())

    app.use(async (req, res, next) => {
      req.usuario = {
        perfil: 'monitor',
        getEventos: async () => [],
      }
      req.principal = { role: 'monitor' }
      try {
        req.contextoAutorizacao = await resolveAuthorizationScope({
          usuario: req.usuario,
          principal: req.principal,
        })
        next()
      } catch (error) {
        return res.status(403).json({ error: error.message })
      }
    })

    app.get('/evento/10', scopedEvento, (req, res) => {
      res.status(200).json({ ok: true })
    })

    const res = await request(app).get('/evento/10')
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/escopo|restrito|negacao segura/i)
  })
})
