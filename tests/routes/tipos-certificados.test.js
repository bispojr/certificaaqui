const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const {
  TiposCertificados,
  Usuario,
  Evento,
  UsuarioEvento,
  sequelize,
} = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

let adminToken
let gestorToken
let gestorOutroToken
let monitorToken
let eventoId
let outroEventoId

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, certificados, tipos_certificados, participantes, usuarios, eventos RESTART IDENTITY CASCADE',
  )

  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_tipos@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil }, JWT_SECRET)

  const evento = await Evento.create({
    nome: 'Evento A',
    codigo_base: 'EVA',
    ano: 2026,
  })
  eventoId = evento.id

  const outroEvento = await Evento.create({
    nome: 'Evento B',
    codigo_base: 'EVB',
    ano: 2026,
  })
  outroEventoId = outroEvento.id

  const gestor = await Usuario.create({
    nome: 'Gestor A',
    email: 'gestor_a@test.com',
    senha: 'senha123',
    perfil: 'gestor',
  })
  await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: eventoId })
  gestorToken = jwt.sign({ id: gestor.id, perfil: gestor.perfil }, JWT_SECRET)

  const gestorOutro = await Usuario.create({
    nome: 'Gestor B',
    email: 'gestor_b@test.com',
    senha: 'senha123',
    perfil: 'gestor',
  })
  await UsuarioEvento.create({
    usuario_id: gestorOutro.id,
    evento_id: outroEventoId,
  })
  gestorOutroToken = jwt.sign(
    { id: gestorOutro.id, perfil: gestorOutro.perfil },
    JWT_SECRET,
  )

  const monitor = await Usuario.create({
    nome: 'Monitor A',
    email: 'monitor_a@test.com',
    senha: 'senha123',
    perfil: 'monitor',
  })
  await UsuarioEvento.create({ usuario_id: monitor.id, evento_id: eventoId })
  monitorToken = jwt.sign(
    { id: monitor.id, perfil: monitor.perfil },
    JWT_SECRET,
  )
})

describe('Rotas de TiposCertificados', () => {
  let tipoCertificadoId

  it('admin deve criar tipo de certificado com sucesso', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        evento_id: eventoId,
        codigo: 'AB',
        descricao: 'Descrição teste',
        texto_base: 'Texto base teste',
        dados_dinamicos: {},
        campo_destaque: 'nome',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('evento_id', eventoId)
    tipoCertificadoId = res.body.id
  })

  it('gestor deve criar tipo de certificado no seu evento', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({
        evento_id: eventoId,
        codigo: 'GA',
        descricao: 'Tipo do gestor',
        texto_base: 'Texto base',
        dados_dinamicos: {},
        campo_destaque: 'nome',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('evento_id', eventoId)
  })

  it('gestor não deve criar tipo em evento de outro gestor', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({
        evento_id: outroEventoId,
        codigo: 'XX',
        descricao: 'Invasão',
        texto_base: 'texto',
        dados_dinamicos: {},
        campo_destaque: 'nome',
      })
    expect(res.status).toBe(403)
  })

  it('monitor não deve criar tipo de certificado', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${monitorToken}`)
      .send({
        evento_id: eventoId,
        codigo: 'MN',
        descricao: 'Monitor tentando criar',
        texto_base: 'texto',
        dados_dinamicos: {},
        campo_destaque: 'nome',
      })
    expect(res.status).toBe(403)
  })

  it('deve listar tipos de certificados (monitor pode listar)', async () => {
    const res = await request(app)
      .get('/tipos-certificados')
      .set('Authorization', `Bearer ${monitorToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('meta')
  })

  it('deve buscar tipo de certificado por id', async () => {
    const res = await request(app)
      .get(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', tipoCertificadoId)
  })

  it('admin deve atualizar tipo de certificado', async () => {
    const payload = {
      evento_id: eventoId,
      codigo: 'AB',
      descricao: 'Descrição Atualizada',
      campo_destaque: 'nome',
      texto_base: 'Texto base teste',
      dados_dinamicos: {},
    }
    const res = await request(app)
      .put(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('descricao', 'Descrição Atualizada')
  })

  it('gestor de outro evento não deve atualizar tipo', async () => {
    const payload = {
      evento_id: eventoId,
      codigo: 'AB',
      descricao: 'Invasão',
      campo_destaque: 'nome',
      texto_base: 'texto',
      dados_dinamicos: {},
    }
    const res = await request(app)
      .put(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${gestorOutroToken}`)
      .send(payload)
    expect(res.status).toBe(403)
  })

  it('gestor do evento deve atualizar tipo', async () => {
    const payload = {
      evento_id: eventoId,
      codigo: 'AB',
      descricao: 'Atualizado pelo gestor',
      campo_destaque: 'nome',
      texto_base: 'Texto base teste',
      dados_dinamicos: {},
    }
    const res = await request(app)
      .put(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send(payload)
    expect(res.status).toBe(200)
  })

  it('gestor de outro evento não deve deletar tipo', async () => {
    const res = await request(app)
      .delete(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${gestorOutroToken}`)
    expect(res.status).toBe(403)
  })

  it('deve deletar tipo de certificado (admin)', async () => {
    const res = await request(app)
      .delete(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('deve restaurar tipo de certificado (admin)', async () => {
    const res = await request(app)
      .post(`/tipos-certificados/${tipoCertificadoId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('deleted_at', null)
  })

  it('deve retornar 400 ao criar tipo de certificado com payload inválido', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: '' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('deve retornar 404 ao buscar tipo de certificado inexistente', async () => {
    const res = await request(app)
      .get('/tipos-certificados/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
