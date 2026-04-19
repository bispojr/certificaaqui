const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Participante, Usuario, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
let adminToken

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  await sequelize.query('TRUNCATE TABLE participantes CASCADE')
  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_participante@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign(
    { id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id },
    JWT_SECRET,
  )
})

describe('Rotas de Participantes', () => {
  let participanteId

  it('deve criar participante com sucesso', async () => {
    const res = await request(app)
      .post(`/admin/${1}/participantes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nomeCompleto: 'João Teste', email: 'joao@teste.com' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    participanteId = res.body.id
  })

  it('deve listar participantes', async () => {
    const res = await request(app)
      .get(`/admin/${1}/participantes`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('meta')
    expect(res.body.meta).toHaveProperty('total')
    expect(res.body.meta).toHaveProperty('page')
    expect(res.body.meta).toHaveProperty('perPage')
    expect(res.body.meta).toHaveProperty('totalPages')
  })

  it('deve buscar participante por id', async () => {
    const res = await request(app)
      .get(`/admin/${1}/participantes/${participanteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', participanteId)
  })

  it('deve atualizar participante', async () => {
    const res = await request(app)
      .put(`/admin/${1}/participantes/${participanteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nomeCompleto: 'João Atualizado' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('nomeCompleto', 'João Atualizado')
  })

  it('deve deletar participante', async () => {
    const res = await request(app)
      .delete(`/admin/${1}/participantes/${participanteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('deve restaurar participante', async () => {
    const res = await request(app)
      .post(`/admin/${1}/participantes/${participanteId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('deleted_at', null)
  })

  it('deve retornar 400 ao criar participante com payload inválido', async () => {
    const res = await request(app)
      .post(`/admin/${1}/participantes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nomeCompleto: '' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('deve retornar 404 ao buscar participante inexistente', async () => {
    const res = await request(app)
      .get(`/admin/${1}/participantes/99999`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
