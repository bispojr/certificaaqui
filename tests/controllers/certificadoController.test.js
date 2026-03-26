const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Usuario, sequelize } = require('../../src/models')
const certificadoService = require('../../src/services/certificadoService')

jest.mock('../../src/services/certificadoService')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
let adminToken

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_cctrl@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign(
    { id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id },
    JWT_SECRET,
  )
})

describe('CertificadoController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar um certificado', async () => {
    certificadoService.create.mockResolvedValue({
      id: 1,
      nome: 'Certificado Teste',
      status: 'emitido',
      participante_id: 10,
      evento_id: 20,
      tipo_certificado_id: 30,
    })
    const payload = {
      nome: 'Certificado Teste',
      status: 'emitido',
      participante_id: 10,
      evento_id: 20,
      tipo_certificado_id: 30,
    }
    const res = await request(app)
      .post('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      id: 1,
      nome: 'Certificado Teste',
      status: 'emitido',
      participante_id: 10,
      evento_id: 20,
      tipo_certificado_id: 30,
    })
  })

  it('deve retornar certificados paginados com padrão', async () => {
    const paged = {
      data: [{ id: 1, nome: 'Certificado Teste' }],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    }
    certificadoService.findAll.mockResolvedValue(paged)
    const res = await request(app)
      .get('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(paged)
  })

  it('deve retornar certificados paginados com page/perPage customizados', async () => {
    const paged = {
      data: [{ id: 2 }],
      meta: { total: 42, page: 2, perPage: 5, totalPages: 9 },
    }
    certificadoService.findAll.mockResolvedValue(paged)
    const res = await request(app)
      .get('/certificados?page=2&perPage=5')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(paged)
  })

  it('deve retornar certificado pelo id', async () => {
    certificadoService.findById.mockResolvedValue({
      id: 1,
      nome: 'Certificado Teste',
    })
    const res = await request(app)
      .get('/certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Certificado Teste' })
  })

  it('deve retornar 404 se certificado não encontrado', async () => {
    certificadoService.findById.mockResolvedValue(null)
    const res = await request(app)
      .get('/certificados/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Certificado não encontrado' })
  })

  it('deve atualizar um certificado', async () => {
    certificadoService.update.mockResolvedValue({ id: 1, nome: 'Atualizado' })
    const res = await request(app)
      .put('/certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizado' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Atualizado' })
  })

  it('deve deletar um certificado', async () => {
    certificadoService.delete.mockResolvedValue()
    const res = await request(app)
      .delete('/certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(204)
  })

  it('deve restaurar um certificado', async () => {
    certificadoService.restore.mockResolvedValue({ id: 1, nome: 'Restaurado' })
    const res = await request(app)
      .post('/certificados/1/restore')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' })
  })

  it('deve cancelar um certificado', async () => {
    certificadoService.cancel.mockResolvedValue({ id: 1, nome: 'Cancelado' })
    const res = await request(app)
      .post('/certificados/1/cancel')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Cancelado' })
  })
})
