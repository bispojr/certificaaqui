const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const { Usuario, sequelize } = require('../../src/models')
const tiposCertificadosService = require('../../src/services/tiposCertificadosService')

jest.mock('../../src/services/tiposCertificadosService')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
let adminToken

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  const admin = await Usuario.create({
    nome: 'Admin',
    email: 'admin_tctrl@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
  adminToken = jwt.sign(
    { id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id },
    JWT_SECRET,
  )
})

describe('TiposCertificadosController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar um tipo de certificado', async () => {
    tiposCertificadosService.create.mockResolvedValue({
      id: 1,
      nome: 'Tipo Teste',
    })
    const payload = {
      evento_id: 1,
      codigo: 'AB',
      descricao: 'Descrição teste',
      campo_destaque: 'campo',
      texto_base: 'texto',
      dados_dinamicos: { campo1: 'string' },
    }
    tiposCertificadosService.create.mockResolvedValue({ id: 1, ...payload })
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ id: 1, ...payload })
  })

  it('deve retornar tipos de certificados paginados', async () => {
    const paged = {
      data: [{ id: 1, nome: 'Tipo Teste' }],
      meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
    }
    tiposCertificadosService.findAll.mockResolvedValue(paged)
    const res = await request(app)
      .get('/tipos-certificados?page=1&perPage=20')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(paged)
  })

  it('deve retornar tipo de certificado pelo id', async () => {
    tiposCertificadosService.findById.mockResolvedValue({
      id: 1,
      nome: 'Tipo Teste',
    })
    const res = await request(app)
      .get('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Tipo Teste' })
  })

  it('deve retornar 404 se tipo de certificado não encontrado', async () => {
    tiposCertificadosService.findById.mockResolvedValue(null)
    const res = await request(app)
      .get('/tipos-certificados/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Tipo de certificado não encontrado' })
  })

  it('deve atualizar um tipo de certificado', async () => {
    const payload = {
      evento_id: 1,
      codigo: 'CD',
      descricao: 'Atualizado',
      campo_destaque: 'campo',
      texto_base: 'texto',
      dados_dinamicos: { campo1: 'string' },
    }
    tiposCertificadosService.update.mockResolvedValue({ id: 1, ...payload })
    const res = await request(app)
      .put('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, ...payload })
  })

  it('deve deletar um tipo de certificado', async () => {
    tiposCertificadosService.delete.mockResolvedValue()
    const res = await request(app)
      .delete('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(204)
  })

  it('deve restaurar um tipo de certificado', async () => {
    tiposCertificadosService.restore.mockResolvedValue({
      id: 1,
      nome: 'Restaurado',
    })
    const res = await request(app)
      .post('/tipos-certificados/1/restore')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' })
  })
})
