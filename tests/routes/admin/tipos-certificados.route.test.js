const request = require('supertest')
const app = require('../../../app')
const {
  Usuario,
  TiposCertificados,
  Evento,
  UsuarioEvento,
  sequelize,
} = require('../../../src/models')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'jwt_secret_teste'
const JWT_SECRET = process.env.JWT_SECRET

describe('Rotas SSR /admin/tipos-certificados', () => {
  let agent
  let gestorToken
  let gestorOutroToken
  let adminToken
  let eventoId
  let outroEventoId

  beforeAll(async () => {
    await sequelize.sync({ force: true })
    agent = request.agent(app)

    const admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: 'senha123',
      perfil: 'admin',
    })

    const evento = await Evento.create({
      nome: 'Evento Gestor',
      codigo_base: 'EGT',
      ano: 2026,
    })
    eventoId = evento.id

    const outroEvento = await Evento.create({
      nome: 'Outro Evento',
      codigo_base: 'OEV',
      ano: 2026,
    })
    outroEventoId = outroEvento.id

    const gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@gestor.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: eventoId })

    const gestorOutro = await Usuario.create({
      nome: 'Gestor Outro',
      email: 'gestoroutro@gestor.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    await UsuarioEvento.create({
      usuario_id: gestorOutro.id,
      evento_id: outroEventoId,
    })

    adminToken = jwt.sign({ id: admin.id }, JWT_SECRET)
    gestorToken = jwt.sign({ id: gestor.id }, JWT_SECRET)
    gestorOutroToken = jwt.sign({ id: gestorOutro.id }, JWT_SECRET)
  })

  it('GET /admin/tipos-certificados exige autenticação SSR', async () => {
    const res = await agent.get('/admin/tipos-certificados')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/auth/login')
  })

  it('GET /admin/tipos-certificados exige rbac gestor/admin', async () => {
    const res = await agent
      .get('/admin/tipos-certificados')
      .set('Cookie', `token=${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Tipos de Certificados/)
  })

  it('GET /admin/tipos-certificados/novo não é capturado como :id/editar', async () => {
    const res = await agent
      .get('/admin/tipos-certificados/novo')
      .set('Cookie', `token=${gestorToken}`)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Novo Tipo de Certificado/)
  })

  it('POST /admin/tipos-certificados/:id/deletar funciona para tipo do próprio evento', async () => {
    const tipo = await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'XX',
      descricao: 'Teste',
      campo_destaque: 'nome',
      texto_base: 'base',
      dados_dinamicos: {},
    })
    const res = await agent
      .post(`/admin/tipos-certificados/${tipo.id}/deletar`)
      .set('Cookie', `token=${adminToken}`)
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/tipos-certificados')
  })

  it('POST /admin/tipos-certificados/:id/restaurar funciona para tipo do próprio evento', async () => {
    const tipo = await TiposCertificados.create({
      evento_id: eventoId,
      codigo: 'YY',
      descricao: 'Teste2',
      campo_destaque: 'nome',
      texto_base: 'base',
      dados_dinamicos: {},
      deleted_at: new Date(),
    })
    const res = await agent
      .post(`/admin/tipos-certificados/${tipo.id}/restaurar`)
      .set('Cookie', `token=${gestorToken}`)
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/tipos-certificados')
  })

  it('gestor não pode deletar tipo de outro evento', async () => {
    const tipo = await TiposCertificados.create({
      evento_id: outroEventoId,
      codigo: 'ZZ',
      descricao: 'Tipo outro evento',
      campo_destaque: 'nome',
      texto_base: 'base',
      dados_dinamicos: {},
    })
    const res = await agent
      .post(`/admin/tipos-certificados/${tipo.id}/deletar`)
      .set('Cookie', `token=${gestorToken}`)
    // Deve redirecionar com flash de erro (não executa a exclusão)
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/tipos-certificados')
    // Confirmar que o tipo não foi deletado
    const tipoAtualizado = await TiposCertificados.findByPk(tipo.id)
    expect(tipoAtualizado).not.toBeNull()
  })

  it('NENHUMA rota de eventos é alterada', async () => {
    const res = await agent
      .get('/admin/eventos')
      .set('Cookie', `token=${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Eventos/)
  })
})
