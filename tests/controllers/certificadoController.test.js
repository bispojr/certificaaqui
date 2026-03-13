const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Usuario, sequelize } = require('../../src/models')
const certificadoService = require('../../src/services/certificadoService')

jest.mock('../../src/services/certificadoService')

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro'
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
    })
    const res = await request(app)
      .post('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Certificado Teste' })
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ id: 1, nome: 'Certificado Teste' })
  })

  it('deve retornar todos os certificados', async () => {
    certificadoService.findAll.mockResolvedValue([
      { id: 1, nome: 'Certificado Teste' },
    ])
    const res = await request(app)
      .get('/certificados')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([{ id: 1, nome: 'Certificado Teste' }])
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
