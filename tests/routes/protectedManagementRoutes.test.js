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
  let adminUser, gestorUser, monitorUser
  beforeAll(async () => {
    // Limpa tabelas
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    // Cria eventos necessários
    const evento1 = await Evento.create({
      nome: 'Evento 1',
      codigo_base: 'PMR',
      ano: 2026,
    })
    const evento2 = await Evento.create({
      nome: 'Evento 2',
      codigo_base: 'PMD',
      ano: 2026,
    })
    evento1Id = evento1.id
    evento2Id = evento2.id
    // Cria usuários
    const admin = await createUserAndToken('admin')
    const gestor = await createUserAndToken('gestor', evento1Id)
    const monitor = await createUserAndToken('monitor', evento1Id)
    adminUser = admin.user
    gestorUser = gestor.user
    monitorUser = monitor.user
    adminToken = admin.token
    gestorToken = gestor.token
    monitorToken = monitor.token
  })

  test('admin pode acessar rotas de participantes com seu próprio papel/id', async () => {
    const res = await request(app)
      .get(`/admin/${adminUser.id}/participantes`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).not.toBe(403)
  })

  test('gestor pode acessar rotas de participantes com seu próprio papel/id', async () => {
    const res = await request(app)
      .get(`/gestor/${gestorUser.id}/participantes`)
      .set('Authorization', `Bearer ${gestorToken}`)
    expect(res.status).not.toBe(403)
  })

  test('monitor pode acessar rotas de participantes com seu próprio papel/id', async () => {
    const res = await request(app)
      .get(`/monitor/${monitorUser.id}/participantes`)
      .set('Authorization', `Bearer ${monitorToken}`)
    expect(res.status).not.toBe(403)
  })

  test('gestor de outro evento acessa lista de participantes com seu próprio papel/id', async () => {
    const gestorOutroEvento = await createUserAndToken('gestor', evento2Id)
    const res = await request(app)
      .get(`/gestor/${gestorOutroEvento.user.id}/participantes`)
      .set('Authorization', `Bearer ${gestorOutroEvento.token}`)
    expect(res.status).toBe(200)
  })

  test('monitor de outro evento acessa lista de participantes com seu próprio papel/id', async () => {
    const monitorOutroEvento = await createUserAndToken('monitor', evento2Id)
    const res = await request(app)
      .get(`/monitor/${monitorOutroEvento.user.id}/participantes`)
      .set('Authorization', `Bearer ${monitorOutroEvento.token}`)
    expect(res.status).toBe(200)
  })

  test('usuário sem token não acessa rotas protegidas', async () => {
    const res = await request(app).get(`/admin/${adminUser.id}/participantes`)
    expect(res.status).toBe(401)
  })

  test('gestor não pode acessar rota com papel diferente do seu (admin)', async () => {
    const res = await request(app)
      .get(`/admin/${adminUser.id}/participantes`)
      .set('Authorization', `Bearer ${gestorToken}`)
    expect(res.status).toBe(403)
  })

  test('gestor não pode acessar rota com id diferente do seu', async () => {
    const res = await request(app)
      .get(`/gestor/99999/participantes`)
      .set('Authorization', `Bearer ${gestorToken}`)
    expect(res.status).toBe(403)
  })

  test('admin pode acessar rota de outro papel (gestor)', async () => {
    const res = await request(app)
      .get(`/gestor/${gestorUser.id}/participantes`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})
