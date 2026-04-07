const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const { Usuario, UsuarioEvento, Evento, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

let adminCookie
let gestorCookie

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, usuarios, eventos RESTART IDENTITY CASCADE',
  )
  const admin = await Usuario.create({
    nome: 'Admin AE',
    email: 'admin.ae@test.com',
    senha: 'hash',
    perfil: 'admin',
  })
  const gestor = await Usuario.create({
    nome: 'Gestor AE',
    email: 'gestor.ae@test.com',
    senha: 'hash',
    perfil: 'gestor',
  })
  // Cria eventos
  const evento1 = await Evento.create({ nome: 'Evento 1', codigo_base: 'EVT', ano: 2026 })
  const evento2 = await Evento.create({ nome: 'Evento 2', codigo_base: 'ABC', ano: 2026 })
  // Associa gestor ao evento1
  await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: evento1.id })
  adminCookie = makeAuthCookie(admin.id, 'admin')
  gestorCookie = makeAuthCookie(gestor.id, 'gestor')
})

// afterAll(async () => {
//   await sequelize.query(
//     'TRUNCATE TABLE usuario_eventos, usuarios, eventos RESTART IDENTITY CASCADE',
//   )
// })

const rotas = [
  '/admin/participantes',
  '/admin/eventos',
  '/admin/tipos-certificados',
]

rotas.forEach((rota) => {
  describe(`GET ${rota}`, () => {
    it('redireciona para /auth/login sem autenticação', async () => {
      const res = await request(app).get(rota)
      expect(res.status).toBe(302)
      expect(res.headers.location).toMatch(/\/auth\/login/)
    })

    it('retorna 200 para admin autenticado', async () => {
      const res = await request(app).get(rota).set('Cookie', adminCookie)
      expect(res.status).toBe(200)
    })

    it('retorna 200 para gestor autenticado', async () => {
      const res = await request(app).get(rota).set('Cookie', gestorCookie)
      expect(res.status).toBe(200)
    })
  })
})

describe('GET /admin/usuarios', () => {
  it('redireciona sem autenticação', async () => {
    const res = await request(app).get('/admin/usuarios')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/auth\/login/)
  })

  it('retorna 200 para admin autenticado', async () => {
    const res = await request(app)
      .get('/admin/usuarios')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
  })

  it('retorna 403 para gestor (acesso restrito a admin)', async () => {
    const res = await request(app)
      .get('/admin/usuarios')
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(403)
  })
})

describe('GET /admin/eventos', () => {
  it('redireciona para /auth/login sem autenticação', async () => {
    const res = await request(app).get('/admin/eventos')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/auth\/login/)
  })

  it('admin vê todos os eventos', async () => {
    const res = await request(app).get('/admin/eventos').set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Evento 1/)
    expect(res.text).toMatch(/Evento 2/)
  })

  it('gestor vê apenas eventos que gerencia', async () => {
    const res = await request(app).get('/admin/eventos').set('Cookie', gestorCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Evento 1/)
    expect(res.text).not.toMatch(/Evento 2/)
  })
})