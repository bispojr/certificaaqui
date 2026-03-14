  it('não permite criar usuário com eventos inexistentes', async () => {
    const res = await request(app)
      .post('/usuarios')
      .send({
        nome: 'Invalido',
        email: 'invalido@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [9999, 8888],
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('permite criar usuário sem eventos (ausente)', async () => {
    const res = await request(app)
      .post('/usuarios')
      .send({
        nome: 'SemEvento1',
        email: 'semevento1@evento.com',
        senha: 'senha123',
        perfil: 'gestor',
      })
    expect(res.status).toBe(201)
    expect(res.body.nome).toBe('SemEvento1')
    expect(res.body.eventos.length).toBe(0)
  })

  it('permite criar usuário com eventos array vazio', async () => {
    const res = await request(app)
      .post('/usuarios')
      .send({
        nome: 'SemEvento2',
        email: 'semevento2@evento.com',
        senha: 'senha123',
        perfil: 'gestor',
        eventos: [],
      })
    expect(res.status).toBe(201)
    expect(res.body.nome).toBe('SemEvento2')
    expect(res.body.eventos.length).toBe(0)
  })

  it('não permite criar usuário com eventos duplicados', async () => {
    const evento = await sequelize.models.Evento.create({ nome: 'Evento Duplicado', codigo_base: 'DUP', ano: 2026 })
    const res = await request(app)
      .post('/usuarios')
      .send({
        nome: 'Duplicado',
        email: 'duplicado@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [evento.id, evento.id],
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('retorna eventos associados ao buscar usuário', async () => {
    const evento1 = await sequelize.models.Evento.create({ nome: 'Evento Consulta 1', codigo_base: 'ABC', ano: 2026 })
    const evento2 = await sequelize.models.Evento.create({ nome: 'Evento Consulta 2', codigo_base: 'DEF', ano: 2026 })
    const resCriacao = await request(app)
      .post('/usuarios')
      .send({
        nome: 'Consulta',
        email: 'consulta@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [evento1.id, evento2.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    const usuario = await sequelize.models.Usuario.findByPk(usuarioId, { include: 'eventos' })
    expect(usuario.eventos.length).toBe(2)
    expect(usuario.eventos.map(e => e.nome)).toEqual(expect.arrayContaining(['Evento Consulta 1', 'Evento Consulta 2']))
  })

  it('atualiza eventos de um usuário existente', async () => {
    const eventoA = await sequelize.models.Evento.create({ nome: 'Evento Atualiza A', codigo_base: 'ATA', ano: 2026 })
    const eventoB = await sequelize.models.Evento.create({ nome: 'Evento Atualiza B', codigo_base: 'ATB', ano: 2026 })
    const resCriacao = await request(app)
      .post('/usuarios')
      .send({
        nome: 'Atualiza',
        email: 'atualiza@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [eventoA.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    // Atualiza para adicionar eventoB e remover eventoA
    const resUpdate = await request(app)
      .put(`/usuarios/${usuarioId}/eventos`)
      .send({ eventos: [eventoB.id] })
    expect(resUpdate.status).toBe(200)
    expect(resUpdate.body.eventos.length).toBe(1)
    expect(resUpdate.body.eventos[0].nome).toBe('Evento Atualiza B')
  })

  it('remove todos os eventos de um usuário', async () => {
    const eventoA = await sequelize.models.Evento.create({ nome: 'Evento Remove A', codigo_base: 'RMA', ano: 2026 })
    const resCriacao = await request(app)
      .post('/usuarios')
      .send({
        nome: 'RemoveEventos',
        email: 'remove@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [eventoA.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    // Remove todos os eventos
    const resUpdate = await request(app)
      .put(`/usuarios/${usuarioId}/eventos`)
      .send({ eventos: [] })
    expect(resUpdate.status).toBe(200)
    expect(resUpdate.body.eventos.length).toBe(0)
  })

  it('remove associações ao deletar evento (cascata)', async () => {
    const evento = await sequelize.models.Evento.create({ nome: 'Evento Cascata', codigo_base: 'CAS', ano: 2026 })
    const resCriacao = await request(app)
      .post('/usuarios')
      .send({
        nome: 'Cascata',
        email: 'cascata@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [evento.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    // Cria admin e token
    const admin = await sequelize.models.Usuario.create({
      nome: 'AdminCascade',
      email: 'admincascade@evento.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro'
    const token = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    // Deleta o evento autenticado
    await request(app)
      .delete(`/eventos/${evento.id}`)
      .set('Authorization', `Bearer ${token}`)
    // Busca usuário e garante que não há eventos associados
    const usuario = await sequelize.models.Usuario.findByPk(usuarioId, {
      include: [{
        association: 'eventos',
        required: false,
        through: { where: { deleted_at: null } },
        where: { deleted_at: null },
      }],
    })
    expect((usuario.eventos || []).length).toBe(0)
  })
const request = require('supertest')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro'
global.adminToken = null

describe('Rotas de Usuários', () => {
  beforeAll(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios CASCADE')
    await sequelize.query('TRUNCATE TABLE eventos CASCADE')
    await sequelize.query('TRUNCATE TABLE usuario_eventos CASCADE')
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    global.adminToken = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
  })

  beforeEach(async () => {
    await sequelize.query('TRUNCATE TABLE usuarios CASCADE')
    await sequelize.query('TRUNCATE TABLE eventos CASCADE')
    await sequelize.query('TRUNCATE TABLE usuario_eventos CASCADE')
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    global.adminToken = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
  })

  afterAll(async () => {
    await sequelize.close()
  })

  it('deve autenticar usuário e retornar token', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@email.com', senha: 'senha123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('deve retornar erro para senha inválida', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@email.com', senha: 'errada' })
    expect(res.status).toBe(401)
  })

  it('deve retornar erro para usuário inexistente', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'naoexiste@email.com', senha: 'senha123' })
    expect(res.status).toBe(401)
  })

  it('deve retornar dados do usuário autenticado', async () => {
    const usuario = await Usuario.findOne({
      where: { email: 'admin@email.com' },
    })
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    const res = await request(app)
      .get('/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('admin@email.com')
  })

  it('deve realizar logout', async () => {
    const res = await request(app).post('/usuarios/logout')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Logout realizado')
  })

  it('deve criar usuário com múltiplos eventos', async () => {
    // Cria eventos para associar
    const evento1 = await sequelize.models.Evento.create({ nome: 'Evento X', codigo_base: 'XXX', ano: 2026 })
    const evento2 = await sequelize.models.Evento.create({ nome: 'Evento Y', codigo_base: 'YYY', ano: 2026 })
    const res = await request(app)
      .post('/usuarios')
      .send({
        nome: 'MultiEventoRoute',
        email: 'multi.route@evento.com',
        senha: 'senha123',
        perfil: 'gestor',
        eventos: [evento1.id, evento2.id],
      })
    expect(res.status).toBe(201)
    expect(res.body.nome).toBe('MultiEventoRoute')
    expect(res.body.eventos.length).toBe(2)
    expect(res.body.eventos.map(e => e.nome)).toEqual(expect.arrayContaining(['Evento X', 'Evento Y']))
  })
})
