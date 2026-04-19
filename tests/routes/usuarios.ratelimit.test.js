const request = require('supertest')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

describe('Rate limiting em POST /usuarios/login', () => {
  beforeAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    await Usuario.create({
      nome: 'RateLimit',
      email: 'ratelimit@test.com',
      senha: 'senha123',
      perfil: 'admin',
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  it('deve bloquear após 10 tentativas de login em 15 minutos', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/usuarios/login')
        .send({ email: 'ratelimit@test.com', senha: 'errada' })
      expect([401, 429]).toContain(res.status)
      if (res.status === 429) {
        // Se já bloqueou antes do 10º, para o teste
        break
      }
    }
    // 11ª tentativa deve ser bloqueada
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'ratelimit@test.com', senha: 'errada' })
    expect(res.status).toBe(429)
    expect(res.body).toEqual({
      error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    })
  })

  it('não afeta outras rotas', async () => {
    // Verifica que o rate limit do login não bloqueia outras rotas
    const res = await request(app).get('/usuarios/me')
    // Sem token deve retornar 401, não 429 (rate limit)
    expect(res.status).toBe(401)
  })
})
