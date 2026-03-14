const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { TiposCertificados, Usuario, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
let adminToken

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  await sequelize.query('TRUNCATE TABLE tipos_certificados CASCADE')
  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_tipos@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign(
    { id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id },
    JWT_SECRET,
  )
})

describe('Rotas de TiposCertificados', () => {
  let tipoCertificadoId

  it('deve criar tipo de certificado com sucesso', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Tipo Teste',
        codigo: 'AB',
        descricao: 'Descrição teste',
        texto_base: 'Texto base teste',
        dados_dinamicos: {},
        campo_destaque: 'nome',
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    tipoCertificadoId = res.body.id
  })

  it('deve listar tipos de certificados', async () => {
    const res = await request(app)
      .get('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('deve buscar tipo de certificado por id', async () => {
    const res = await request(app)
      .get(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', tipoCertificadoId)
  })

  it('deve atualizar tipo de certificado', async () => {
    const res = await request(app)
      .put(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ descricao: 'Descrição Atualizada' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('descricao', 'Descrição Atualizada')
  })

  it('deve deletar tipo de certificado', async () => {
    const res = await request(app)
      .delete(`/tipos-certificados/${tipoCertificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('deve restaurar tipo de certificado', async () => {
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
