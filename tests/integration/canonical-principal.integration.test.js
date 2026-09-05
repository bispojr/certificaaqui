const express = require('express')
const cookieParser = require('cookie-parser')
const request = require('supertest')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'segredo-integracao'

jest.mock('jsonwebtoken')
jest.mock('../../src/models', () => ({
  Usuario: { findByPk: jest.fn() },
}))

const { Usuario } = require('../../src/models')
const auth = require('../../src/middlewares/auth')
const authSSR = require('../../src/middlewares/authSSR')

describe('canonical principal integration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-integracao'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('materializa o mesmo contrato canônico em API e SSR para o mesmo usuário', async () => {
    const app = express()
    app.use(express.json())
    app.use(cookieParser())

    app.get('/api', auth, (req, res) => {
      res.json({ principal: req.principal })
    })

    app.get('/admin', authSSR, (req, res) => {
      res.json({ principal: req.principal, usuario: req.usuario })
    })

    const usuario = { id: 11, nome: 'Ana', perfil: 'admin' }

    jwt.verify.mockReturnValueOnce({ id: 11, perfil: 'admin' })
    Usuario.findByPk.mockResolvedValueOnce(usuario)
    const apiRes = await request(app)
      .get('/api')
      .set('Authorization', 'Bearer token-api')

    expect(apiRes.body.principal).toEqual({
      subjectId: 11,
      role: 'admin',
      authChannel: 'api_bearer',
      sessionId: null,
      tokenId: 'jwt:11',
      tenantScopeMode: 'global',
    })

    jwt.verify.mockReturnValueOnce({ id: 11, perfil: 'admin' })
    Usuario.findByPk.mockResolvedValueOnce(usuario)
    const ssrRes = await request(app)
      .get('/admin')
      .set('Cookie', ['token=token-ssr'])

    expect(ssrRes.body.principal).toEqual({
      subjectId: 11,
      role: 'admin',
      authChannel: 'ssr_cookie',
      sessionId: null,
      tokenId: 'jwt:11',
      tenantScopeMode: 'global',
    })

    expect(ssrRes.body.usuario).toEqual({
      id: 11,
      nome: 'Ana',
      perfil: 'admin',
      isAdmin: true,
      isGestor: false,
    })
  })
})
