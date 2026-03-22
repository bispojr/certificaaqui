const jwt = require('jsonwebtoken')
const httpMocks = require('node-mocks-http')
const { Usuario } = require('../../src/models')
const authSSR = require('../../src/middlewares/authSSR')

jest.mock('jsonwebtoken')
jest.mock('../../src/models', () => ({
  Usuario: { findByPk: jest.fn() },
}))

describe('authSSR middleware', () => {
  const JWT_SECRET = 'segredo-teste'
  const usuarioFake = { id: 1, nome: 'João', perfil: 'admin' }
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('define req.usuario e res.locals.usuario corretamente para admin', async () => {
    const req = httpMocks.createRequest({ cookies: { token: 'tokenvalido' } })
    const res = httpMocks.createResponse()
    const next = jest.fn()
    jwt.verify.mockReturnValue({ id: 1 })
    Usuario.findByPk.mockResolvedValue(usuarioFake)
    await authSSR(req, res, next)
    expect(req.usuario).toEqual({
      id: 1,
      nome: 'João',
      perfil: 'admin',
      isAdmin: true,
      isGestor: false,
    })
    expect(res.locals.usuario).toEqual(req.usuario)
    expect(next).toHaveBeenCalled()
  })

  it('define isGestor corretamente', async () => {
    const req = httpMocks.createRequest({ cookies: { token: 'tokenvalido' } })
    const res = httpMocks.createResponse()
    const next = jest.fn()
    jwt.verify.mockReturnValue({ id: 2 })
    Usuario.findByPk.mockResolvedValue({
      id: 2,
      nome: 'Maria',
      perfil: 'gestor',
    })
    await authSSR(req, res, next)
    expect(req.usuario).toEqual({
      id: 2,
      nome: 'Maria',
      perfil: 'gestor',
      isAdmin: false,
      isGestor: true,
    })
    expect(res.locals.usuario).toEqual(req.usuario)
    expect(next).toHaveBeenCalled()
  })

  it('define null se token ausente', async () => {
    const req = httpMocks.createRequest()
    const res = httpMocks.createResponse()
    const next = jest.fn()
    await authSSR(req, res, next)
    expect(req.usuario).toBeNull()
    expect(res.locals.usuario).toBeNull()
    expect(next).toHaveBeenCalled()
  })

  it('define null se token inválido', async () => {
    const req = httpMocks.createRequest({ cookies: { token: 'tokeninvalido' } })
    const res = httpMocks.createResponse()
    const next = jest.fn()
    jwt.verify.mockImplementation(() => {
      throw new Error('inválido')
    })
    await authSSR(req, res, next)
    expect(req.usuario).toBeNull()
    expect(res.locals.usuario).toBeNull()
    expect(next).toHaveBeenCalled()
  })

  it('define null se usuário não encontrado', async () => {
    const req = httpMocks.createRequest({ cookies: { token: 'tokenvalido' } })
    const res = httpMocks.createResponse()
    const next = jest.fn()
    jwt.verify.mockReturnValue({ id: 99 })
    Usuario.findByPk.mockResolvedValue(null)
    await authSSR(req, res, next)
    expect(req.usuario).toBeNull()
    expect(res.locals.usuario).toBeNull()
    expect(next).toHaveBeenCalled()
  })
})
