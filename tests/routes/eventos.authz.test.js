const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Usuario, Evento, UsuarioEvento, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro'

describe('Eventos - Autorização por papel/id', () => {
  let admin, adminToken
  let gestor, gestorToken
  let monitor, monitorToken
  let eventoId

  beforeAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuario_eventos RESTART IDENTITY CASCADE')
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')

    admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin_authz@test.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil }, JWT_SECRET)

    gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor_authz@test.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    gestorToken = jwt.sign({ id: gestor.id, perfil: gestor.perfil }, JWT_SECRET)

    monitor = await Usuario.create({
      nome: 'Monitor',
      email: 'monitor_authz@test.com',
      senha: 'senha123',
      perfil: 'monitor',
    })
    monitorToken = jwt.sign({ id: monitor.id, perfil: monitor.perfil }, JWT_SECRET)

    // Admin cria evento
    const evento = await Evento.create({
      nome: 'Evento Authz',
      codigo_base: 'AUT',
      ano: 2026,
    })
    eventoId = evento.id

    // Vincula gestor e monitor ao evento
    await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: eventoId })
    await UsuarioEvento.create({ usuario_id: monitor.id, evento_id: eventoId })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Criação de eventos (apenas admin)', () => {
    it('admin pode criar evento', async () => {
      const res = await request(app)
        .post(`/admin/${admin.id}/eventos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Evento Novo', codigo_base: 'NOV', ano: 2026 })
      expect(res.status).toBe(201)
    })

    it('gestor não pode criar evento', async () => {
      const res = await request(app)
        .post(`/gestor/${gestor.id}/eventos`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({ nome: 'Evento Gestor', codigo_base: 'GST', ano: 2026 })
      expect(res.status).toBe(403)
    })

    it('monitor não pode criar evento', async () => {
      const res = await request(app)
        .post(`/monitor/${monitor.id}/eventos`)
        .set('Authorization', `Bearer ${monitorToken}`)
        .send({ nome: 'Evento Monitor', codigo_base: 'MON', ano: 2026 })
      expect(res.status).toBe(403)
    })
  })

  describe('Acesso com papel/id incorreto', () => {
    it('retorna 403 quando gestor tenta usar papel de admin', async () => {
      const res = await request(app)
        .get(`/admin/${admin.id}/eventos`)
        .set('Authorization', `Bearer ${gestorToken}`)
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando usuário tenta usar id de outro usuário', async () => {
      const res = await request(app)
        .get(`/gestor/${admin.id}/eventos`)
        .set('Authorization', `Bearer ${gestorToken}`)
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando monitor tenta usar papel de gestor', async () => {
      const res = await request(app)
        .get(`/gestor/${gestor.id}/eventos`)
        .set('Authorization', `Bearer ${monitorToken}`)
      expect(res.status).toBe(403)
    })
  })

  describe('Admin pode acessar recursos de outros perfis', () => {
    it('admin pode listar eventos usando papel gestor', async () => {
      const res = await request(app)
        .get(`/gestor/${gestor.id}/eventos`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })

    it('admin pode listar eventos usando papel monitor', async () => {
      const res = await request(app)
        .get(`/monitor/${monitor.id}/eventos`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('Gestor e monitor acessam com próprio papel/id', () => {
    it('gestor lista eventos com próprio papel/id', async () => {
      const res = await request(app)
        .get(`/gestor/${gestor.id}/eventos`)
        .set('Authorization', `Bearer ${gestorToken}`)
      expect(res.status).toBe(200)
    })

    it('monitor lista eventos com próprio papel/id', async () => {
      const res = await request(app)
        .get(`/monitor/${monitor.id}/eventos`)
        .set('Authorization', `Bearer ${monitorToken}`)
      expect(res.status).toBe(200)
    })

    it('monitor busca evento específico com próprio papel/id', async () => {
      const res = await request(app)
        .get(`/monitor/${monitor.id}/eventos/${eventoId}`)
        .set('Authorization', `Bearer ${monitorToken}`)
      expect(res.status).toBe(200)
    })
  })
})
