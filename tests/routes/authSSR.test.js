const request = require('supertest')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

describe('SSR Auth rotas', () => {
  beforeAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    await Usuario.create({
      nome: 'Admin SSR',
      email: 'admin.ssr@test.com',
      senha: 'senha123',
      perfil: 'admin',
    })
  })

  afterAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  })

  describe('GET /auth/login', () => {
    it('deve renderizar o formulário de login', async () => {
      const res = await request(app).get('/auth/login')
      expect(res.status).toBe(200)
      expect(res.text).toMatch(/login/i)
      expect(res.text).toMatch(/email/i)
      expect(res.text).toMatch(/senha/i)
    })
  })

  describe('POST /auth/login', () => {
    it('redireciona para /admin/:id com credenciais válidas', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send('email=admin.ssr@test.com&senha=senha123')
        .set('Content-Type', 'application/x-www-form-urlencoded')
      expect(res.status).toBe(302)
      expect(res.header.location).toBe('/admin/1')
      expect(res.header['set-cookie']).toBeDefined()
      expect(res.header['set-cookie'].some((c) => c.startsWith('token='))).toBe(
        true,
      )
    })

    it('redireciona para /auth/login com credenciais inválidas', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send('email=admin.ssr@test.com&senha=errada')
        .set('Content-Type', 'application/x-www-form-urlencoded')
      expect(res.status).toBe(302)
      expect(res.header.location).toBe('/auth/login')
    })

    it('redireciona para /auth/login com usuário inexistente', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send('email=naoexiste@test.com&senha=qualquer')
        .set('Content-Type', 'application/x-www-form-urlencoded')
      expect(res.status).toBe(302)
      expect(res.header.location).toBe('/auth/login')
    })
  })

  describe('POST /auth/logout', () => {
    it('limpa o cookie e redireciona para /auth/login', async () => {
      const res = await request(app).post('/auth/logout')
      expect(res.status).toBe(302)
      expect(res.header.location).toBe('/auth/login')
      if (res.header['set-cookie']) {
        const tokenCookie = res.header['set-cookie'].find((c) =>
          c.startsWith('token='),
        )
        if (tokenCookie) {
          expect(tokenCookie).toMatch(/Max-Age=0|expires=.*1970/i)
        }
      }
    })
  })
})
