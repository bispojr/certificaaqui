const path = require('path')
const request = require('supertest')
const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')

async function buildApp({
  hasAdmin = true,
  currentUser = null,
  onboardingResult = { created: false, reason: 'admin_exists' },
} = {}) {
  jest.resetModules()
  process.env.JWT_SECRET = 'jwt_secret_teste'

  const existsAdmin = jest.fn().mockResolvedValue(hasAdmin)
  const createFirstAdmin = jest.fn().mockResolvedValue(onboardingResult)
  const findOne = jest.fn()
  const compare = jest.fn().mockResolvedValue(true)
  const sign = jest.fn().mockReturnValue('token-teste')

  jest.doMock('../../src/services/adminOnboardingService', () => ({
    existsAdmin,
    createFirstAdmin,
  }))
  jest.doMock('../../src/middlewares/authSSR', () => (req, res, next) => {
    req.usuario = currentUser
    res.locals.usuario = currentUser
    next()
  })
  jest.doMock('../../src/models', () => ({
    Usuario: { findOne },
  }))
  jest.doMock('bcryptjs', () => ({ compare }))
  jest.doMock('jsonwebtoken', () => ({ sign }))

  const authRouter = require('../../src/routes/auth')

  const app = express()
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, '../../views'))
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use(
    session({
      secret: 'sessao_teste',
      resave: false,
      saveUninitialized: false,
    }),
  )
  app.use(flash())
  app.use('/', authRouter)

  return {
    app,
    mocks: { existsAdmin, createFirstAdmin, findOne, compare, sign },
  }
}

describe('SSR Auth + onboarding inicial', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('redireciona GET /login para /onboarding quando ainda não existe admin', async () => {
    const { app } = await buildApp({ hasAdmin: false })

    const res = await request(app).get('/login')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/onboarding')
  })

  it('redireciona POST /login para /onboarding quando ainda não existe admin', async () => {
    const { app } = await buildApp({ hasAdmin: false })

    const res = await request(app)
      .post('/login')
      .send('email=admin@test.com&senha=Senha@123')
      .set('Content-Type', 'application/x-www-form-urlencoded')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/onboarding')
  })

  it('bloqueia GET /onboarding redirecionando para /login quando já existe admin', async () => {
    const { app } = await buildApp({ hasAdmin: true })

    const res = await request(app).get('/onboarding')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/login')
  })

  it('cria o primeiro admin no POST /onboarding, autentica e redireciona para dashboard', async () => {
    const { app, mocks } = await buildApp({
      hasAdmin: false,
      onboardingResult: {
        created: true,
        usuario: { id: 1, perfil: 'admin' },
      },
    })

    const res = await request(app)
      .post('/onboarding')
      .send(
        'nome=Primeiro Admin&email=primeiro%40admin.com&senha=Senha%40123&confirmarSenha=Senha%40123',
      )
      .set('Content-Type', 'application/x-www-form-urlencoded')

    expect(mocks.createFirstAdmin).toHaveBeenCalledWith({
      nome: 'Primeiro Admin',
      email: 'primeiro@admin.com',
      senha: 'Senha@123',
    })
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/dashboard')
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.headers['set-cookie'].some((c) => c.startsWith('token='))).toBe(
      true,
    )
  })
})
