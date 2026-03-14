const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  Usuario,
  sequelize,
} = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
let adminToken
let participanteId, eventoId, tipoCertificadoId

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  await Certificado.destroy({ where: {}, force: true })
  await Participante.destroy({ where: {}, force: true })
  await Evento.destroy({ where: {}, force: true })
  await TiposCertificados.destroy({ where: {}, force: true })

  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_cert@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign(
    { id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id },
    JWT_SECRET,
  )

  // Criar dependências
  const participante = await Participante.create({
    nomeCompleto: 'Teste Cert',
    email: 'cert@teste.com',
  })
  participanteId = participante.id
  const evento = await Evento.create({
    nome: 'Evento Cert',
    codigo_base: 'XYZ',
    ano: 2026,
  })
  eventoId = evento.id
  const tipoCertificado = await TiposCertificados.create({
    nome: 'Tipo Cert',
    codigo: 'AB',
    descricao: 'Descrição teste',
    texto_base: 'Texto base teste',
    dados_dinamicos: {},
    campo_destaque: 'nome',
  })
  tipoCertificadoId = tipoCertificado.id
})

describe('Rotas de Certificados', () => {
  let certificadoId

  it('deve emitir certificado com sucesso', async () => {
    const res = await request(app)
      .post('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Certificado Teste',
        participante_id: participanteId,
        evento_id: eventoId,
        tipo_certificado_id: tipoCertificadoId,
        status: 'emitido',
        valores_dinamicos: { campo: 'valor' },
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    certificadoId = res.body.id
  })

  it('deve listar certificados', async () => {
    const res = await request(app)
      .get('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('deve buscar certificado por id', async () => {
    const res = await request(app)
      .get(`/certificados/${certificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', certificadoId)
  })

  it('deve atualizar certificado', async () => {
    const res = await request(app)
      .put(`/certificados/${certificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Certificado Atualizado', status: 'emitido' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('nome', 'Certificado Atualizado')
  })

  it('deve cancelar certificado', async () => {
    const res = await request(app)
      .post(`/certificados/${certificadoId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'cancelado')
  })

  it('deve restaurar certificado', async () => {
    const res = await request(app)
      .post(`/certificados/${certificadoId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('deleted_at', null)
  })

  it('deve deletar certificado', async () => {
    const res = await request(app)
      .delete(`/certificados/${certificadoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('deve retornar 400 ao emitir certificado com payload inválido', async () => {
    const res = await request(app)
      .post('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ participante_id: null })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('deve retornar 400 ao emitir certificado sem status', async () => {
    const res = await request(app)
      .post('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Certificado Teste',
        participante_id: participanteId,
        evento_id: eventoId,
        tipo_certificado_id: tipoCertificadoId,
        valores_dinamicos: { campo: 'valor' },
      })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('deve retornar 404 ao buscar certificado inexistente', async () => {
    const res = await request(app)
      .get('/certificados/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
