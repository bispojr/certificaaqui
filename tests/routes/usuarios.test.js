const request = require('supertest')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

global.adminToken = null
global.adminId = null

describe('Rotas de Usuários', () => {
  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE usuario_eventos, certificados, participantes, usuarios, eventos, tipos_certificados RESTART IDENTITY CASCADE',
    )
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    global.adminId = admin.id
    global.adminToken = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
  })

  beforeEach(async () => {
    await sequelize.query(
      'TRUNCATE TABLE usuario_eventos, certificados, participantes, usuarios, eventos, tipos_certificados RESTART IDENTITY CASCADE',
    )
    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    global.adminId = admin.id
    global.adminToken = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
  })

  // Não fechar sequelize aqui! O fechamento é feito no afterAll global do arquivo.

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

  it('retorna 401 ao criar usuário sem autenticação', async () => {
    const res = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .send({
        nome: 'SemAuth',
        email: 'semauth@email.com',
        senha: 'senha123',
        perfil: 'gestor',
      })
    expect(res.status).toBe(401)
  })

  it('retorna 403 ao criar usuário com token de perfil não-admin', async () => {
    const gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@email.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    const gestorToken = jwt.sign(
      { id: gestor.id, perfil: gestor.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    const res = await request(app)
      .post(`/gestor/${gestor.id}/usuarios`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({
        nome: 'Novo',
        email: 'novo@email.com',
        senha: 'senha123',
        perfil: 'monitor',
      })
    expect(res.status).toBe(403)
  })

  it('retorna 403 ao criar usuário com id diferente do token', async () => {
    const res = await request(app)
      .post(`/admin/99999/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({
        nome: 'Teste',
        email: 'teste@email.com',
        senha: 'senha123',
        perfil: 'monitor',
      })
    expect(res.status).toBe(403)
  })

  it('não permite criar usuário com eventos inexistentes', async () => {
    const res = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
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
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
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
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
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
    const evento = await sequelize.models.Evento.create({
      nome: 'Evento Duplicado',
      codigo_base: 'DUP',
      ano: 2026,
    })
    const res = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
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
    const evento1 = await sequelize.models.Evento.create({
      nome: 'Evento Consulta 1',
      codigo_base: 'UCO',
      ano: 2026,
    })
    const evento2 = await sequelize.models.Evento.create({
      nome: 'Evento Consulta 2',
      codigo_base: 'UCD',
      ano: 2026,
    })
    const resCriacao = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({
        nome: 'Consulta',
        email: 'consulta@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [evento1.id, evento2.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    const usuario = await sequelize.models.Usuario.findByPk(usuarioId, {
      include: 'eventos',
    })
    expect(usuario.eventos.length).toBe(2)
    expect(usuario.eventos.map((e) => e.nome)).toEqual(
      expect.arrayContaining(['Evento Consulta 1', 'Evento Consulta 2']),
    )
  })

  it('atualiza eventos de um usuário existente', async () => {
    const eventoA = await sequelize.models.Evento.create({
      nome: 'Evento Atualiza A',
      codigo_base: 'ATA',
      ano: 2026,
    })
    const eventoB = await sequelize.models.Evento.create({
      nome: 'Evento Atualiza B',
      codigo_base: 'ATB',
      ano: 2026,
    })
    const resCriacao = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({
        nome: 'Atualiza',
        email: 'atualiza@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [eventoA.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    const resUpdate = await request(app)
      .put(`/admin/${global.adminId}/usuarios/${usuarioId}/eventos`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({ eventos: [eventoB.id] })
    expect(resUpdate.status).toBe(200)
    expect(resUpdate.body.eventos.length).toBe(1)
    expect(resUpdate.body.eventos[0].nome).toBe('Evento Atualiza B')
  })

  it('remove todos os eventos de um usuário', async () => {
    const eventoA = await sequelize.models.Evento.create({
      nome: 'Evento Remove A',
      codigo_base: 'RMA',
      ano: 2026,
    })
    const resCriacao = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({
        nome: 'RemoveEventos',
        email: 'remove@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [eventoA.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    const resUpdate = await request(app)
      .put(`/admin/${global.adminId}/usuarios/${usuarioId}/eventos`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({ eventos: [] })
    expect(resUpdate.status).toBe(200)
    expect(resUpdate.body.eventos.length).toBe(0)
  })

  it('remove associações ao deletar evento (cascata)', async () => {
    const evento = await sequelize.models.Evento.create({
      nome: 'Evento Cascata',
      codigo_base: 'CAS',
      ano: 2026,
    })
    const resCriacao = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
      .send({
        nome: 'Cascata',
        email: 'cascata@evento.com',
        senha: 'senha123',
        perfil: 'monitor',
        eventos: [evento.id],
      })
    expect(resCriacao.status).toBe(201)
    const usuarioId = resCriacao.body.id
    await request(app)
      .delete(`/admin/${global.adminId}/eventos/${evento.id}`)
      .set('Authorization', `Bearer ${global.adminToken}`)
    const usuario = await sequelize.models.Usuario.findByPk(usuarioId, {
      include: [
        {
          association: 'eventos',
          required: false,
          through: { where: { deleted_at: null } },
          where: { deleted_at: null },
        },
      ],
    })
    expect((usuario.eventos || []).length).toBe(0)
  })

  it('deve criar usuário com múltiplos eventos', async () => {
    const evento1 = await sequelize.models.Evento.create({
      nome: 'Evento X',
      codigo_base: 'XXX',
      ano: 2026,
    })
    const evento2 = await sequelize.models.Evento.create({
      nome: 'Evento Y',
      codigo_base: 'YYY',
      ano: 2026,
    })
    const res = await request(app)
      .post(`/admin/${global.adminId}/usuarios`)
      .set('Authorization', `Bearer ${global.adminToken}`)
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
    expect(res.body.eventos.map((e) => e.nome)).toEqual(
      expect.arrayContaining(['Evento X', 'Evento Y']),
    )
  })
})

describe('Autorização de updateEventos por papel/id', () => {
  let adminId, adminToken, gestorId, gestorToken, monitorId, usuarioAlvoId

  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE usuario_eventos, usuarios, eventos RESTART IDENTITY CASCADE',
    )
    const admin = await sequelize.models.Usuario.create({
      nome: 'Admin',
      email: 'admin_ue_authz@test.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    adminId = admin.id
    adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil }, JWT_SECRET)

    const gestor = await sequelize.models.Usuario.create({
      nome: 'Gestor',
      email: 'gestor_ue_authz@test.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    gestorId = gestor.id
    gestorToken = jwt.sign({ id: gestor.id, perfil: gestor.perfil }, JWT_SECRET)

    const monitor = await sequelize.models.Usuario.create({
      nome: 'Monitor',
      email: 'monitor_ue_authz@test.com',
      senha: 'senha123',
      perfil: 'monitor',
    })
    monitorId = monitor.id

    const usuarioAlvo = await sequelize.models.Usuario.create({
      nome: 'Alvo',
      email: 'alvo_ue_authz@test.com',
      senha: 'senha123',
      perfil: 'monitor',
    })
    usuarioAlvoId = usuarioAlvo.id
  })

  afterAll(async () => {
    await sequelize.close()
  })

  it('admin pode atualizar eventos de um usuário', async () => {
    const res = await request(app)
      .put(`/admin/${adminId}/usuarios/${usuarioAlvoId}/eventos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventos: [] })
    expect(res.status).toBe(200)
  })

  it('gestor não pode atualizar eventos de usuário (papel não-admin)', async () => {
    const res = await request(app)
      .put(`/gestor/${gestorId}/usuarios/${usuarioAlvoId}/eventos`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({ eventos: [] })
    expect(res.status).toBe(403)
  })

  it('admin com id diferente do token não pode atualizar eventos', async () => {
    const res = await request(app)
      .put(`/admin/99999/usuarios/${usuarioAlvoId}/eventos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventos: [] })
    expect(res.status).toBe(403)
  })

  it('gestor tentando usar papel admin é bloqueado', async () => {
    const res = await request(app)
      .put(`/admin/${adminId}/usuarios/${usuarioAlvoId}/eventos`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({ eventos: [] })
    expect(res.status).toBe(403)
  })
})
