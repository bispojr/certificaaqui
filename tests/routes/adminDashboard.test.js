const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_teste'
let adminCookie
let gestorCookie

const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

describe('GET /admin/dashboard', () => {
  let admin, gestor

  beforeAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@admin.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    monitor = await Usuario.create({
      nome: 'Monitor',
      email: 'monitor@admin.com',
      senha: 'senha123',
      perfil: 'monitor',
    })
    adminCookie = makeAuthCookie(admin.id, 'admin')
    gestorCookie = makeAuthCookie(gestor.id, 'gestor')
    monitorCookie = makeAuthCookie(monitor.id, 'monitor')
  })

  let monitor, monitorCookie

  afterAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  })

  it('redireciona para /auth/login se não autenticado', async () => {
    const res = await request(app).get(`/admin/${admin.id}`)
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/auth/login')
  })

  it('renderiza dashboard para admin', async () => {
    const res = await request(app)
      .get(`/admin/${admin.id}`)
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/i)
  })

  it('renderiza dashboard para gestor (escopo reduzido)', async () => {
    const res = await request(app)
      .get(`/gestor/${gestor.id}`)
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/i)
    expect(res.text).toMatch(/Certificados \(seus eventos\)/i)
    expect(res.text).toMatch(/Participantes \(seus eventos\)/i)
    expect(res.text).not.toMatch(/Eventos<\/div>/i)
    expect(res.text).not.toMatch(/Tipos de Certificados<\/div>/i)
    expect(res.text).not.toMatch(/Usuários<\/div>/i)
  })

  it('monitor acessa próprio dashboard', async () => {
    const res = await request(app)
      .get(`/monitor/${monitor.id}`)
      .set('Cookie', monitorCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/i)
  })

  it('gestor tentando acessar dashboard com papel admin retorna 403', async () => {
    const res = await request(app)
      .get(`/admin/${admin.id}`)
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(403)
  })

  it('gestor tentando acessar dashboard com id de outro usuário retorna 403', async () => {
    const res = await request(app)
      .get(`/gestor/${admin.id}`)
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(403)
  })

  it('admin pode acessar dashboard de gestor', async () => {
    const res = await request(app)
      .get(`/gestor/${gestor.id}`)
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/i)
  })

  it('admin pode acessar dashboard de monitor', async () => {
    const res = await request(app)
      .get(`/monitor/${monitor.id}`)
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/i)
  })
})
