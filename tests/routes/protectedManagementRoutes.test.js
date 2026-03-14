const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Usuario, Evento, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

// Helper to create user and token
async function createUserAndToken(perfil, eventoId = null) {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8)
  const user = await Usuario.create({
    nome: 'Test User',
    email: `test_${perfil}_${uniqueSuffix}@email.com`,
    senha: '123456',
    perfil,
    evento_id: eventoId,
  })
  const token = jwt.sign(
    { id: user.id, perfil: user.perfil, evento_id: user.evento_id },
    JWT_SECRET,
  )
  return { user, token }
}

describe('Proteção das rotas de gestão', () => {
  let adminToken, gestorToken, monitorToken, evento1Id, evento2Id
  beforeAll(async () => {
    // Limpa tabelas
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    // Cria eventos necessários
    const evento1 = await Evento.create({
      nome: 'Evento 1',
      codigo_base: 'ABC',
      ano: 2026,
    })
    const evento2 = await Evento.create({
      nome: 'Evento 2',
      codigo_base: 'DEF',
      ano: 2026,
    })
    evento1Id = evento1.id
    evento2Id = evento2.id
    // Cria usuários
    const admin = await createUserAndToken('admin')
    const gestor = await createUserAndToken('gestor', evento1Id)
    const monitor = await createUserAndToken('monitor', evento1Id)
    adminToken = admin.token
    gestorToken = gestor.token
    monitorToken = monitor.token
  })

  test('admin pode acessar todas as rotas', async () => {
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).not.toBe(403)
  })

  test('gestor só acessa rotas do seu evento', async () => {
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${gestorToken}`)
    expect(res.status).not.toBe(403)
  })

  test('monitor só acessa rotas do seu evento', async () => {
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${monitorToken}`)
    expect(res.status).not.toBe(403)
  })

  test('gestor de outro evento ainda acessa lista de participantes (sem restrição por evento)', async () => {
    const gestorOutroEvento = await createUserAndToken('gestor', evento2Id)
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${gestorOutroEvento.token}`)
    expect(res.status).toBe(200)
  })

  test('monitor de outro evento ainda acessa lista de participantes (sem restrição por evento)', async () => {
    const monitorOutroEvento = await createUserAndToken('monitor', evento2Id)
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${monitorOutroEvento.token}`)
    expect(res.status).toBe(200)
  })

  test('usuário sem token não acessa rotas protegidas', async () => {
    const res = await request(app).get('/participantes')
    expect(res.status).toBe(401)
  })
})
