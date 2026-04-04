const request = require('supertest')
const app = require('../../../app')
const { Usuario, sequelize } = require('../../../src/models')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'jwt_secret_teste'
const JWT_SECRET = process.env.JWT_SECRET

describe('Rotas SSR /admin/usuarios', () => {
  let agent
  let adminToken
  let gestorToken
  beforeAll(async () => {
    await sequelize.sync({ force: true })
    agent = request.agent(app)
    // Usuário admin
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    // Usuário gestor
    const gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@gestor.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    adminToken = jwt.sign({ id: admin.id }, JWT_SECRET)
    gestorToken = jwt.sign({ id: gestor.id }, JWT_SECRET)
  })

  it('GET /admin/usuarios exige autenticação SSR', async () => {
    const res = await agent.get('/admin/usuarios')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/auth/login')
  })

  it('GET /admin/usuarios exige rbac admin', async () => {
    // Simula login como gestor
    agent.jar.setCookie(`token=${gestorToken}`)
    const res = await agent.get('/admin/usuarios')
    expect(res.status).toBe(403)
  })

  it('GET /admin/usuarios permite admin', async () => {
    agent.jar.setCookie(`token=${adminToken}`)
    const res = await agent.get('/admin/usuarios')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Usuário/) // Deve renderizar página de usuários
  })

  it('GET /admin/usuarios/novo não conflita com /:id/editar', async () => {
    agent.jar.setCookie(`token=${adminToken}`)
    const res = await agent.get('/admin/usuarios/novo')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Novo Usuário/)
  })
})
