const request = require('supertest')
const app = require('../../../app')
const {
  Usuario,
  Evento,
  TiposCertificados,
  Participante,
  Certificado,
  sequelize,
} = require('../../../src/models')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'jwt_secret_teste'
const JWT_SECRET = process.env.JWT_SECRET

describe('Rota GET /admin/dashboard', () => {
  let agent
  beforeAll(async () => {
    await sequelize.sync({ force: true })
    agent = request.agent(app)
    // Usuário admin
    await Usuario.create({
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    // Usuário gestor
    await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@gestor.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
  })

  it('deve exigir autenticação SSR', async () => {
    const res = await agent.get('/admin/dashboard')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/auth/login')
  })

  it('deve renderizar dashboard para admin com totais', async () => {
    const usuario = await Usuario.findOne({
      where: { email: 'admin@admin.com' },
    })
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET)
    const res = await agent
      .get('/admin/dashboard')
      .set('Cookie', `token=${token}`)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/)
    expect(res.text).toMatch(/Eventos/)
    expect(res.text).toMatch(/Tipos de Certificados/)
    expect(res.text).toMatch(/Participantes/)
    expect(res.text).toMatch(/Usuários/)
  })

  it('deve renderizar dashboard para gestor com cards escopados', async () => {
    const usuario = await Usuario.findOne({
      where: { email: 'gestor@gestor.com' },
    })
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET)
    const res = await agent
      .get('/admin/dashboard')
      .set('Cookie', `token=${token}`)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Dashboard/)
    expect(res.text).toMatch(/Certificados/)
    expect(res.text).toMatch(/Participantes/)
    expect(res.text).not.toMatch(/Eventos/)
    expect(res.text).not.toMatch(/Usuários/)
  })
})
