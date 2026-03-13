const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const { Usuario, sequelize } = require('../../src/models');
const tiposCertificadosService = require('../../src/services/tiposCertificadosService');

jest.mock('../../src/services/tiposCertificadosService');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';
let adminToken;

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE');
  const admin = await Usuario.create({ nome: 'Admin', email: 'admin_tctrl@test.com', senha: 'senha123', perfil: 'admin' });
  adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id }, JWT_SECRET);
});

describe('TiposCertificadosController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um tipo de certificado', async () => {
    tiposCertificadosService.create.mockResolvedValue({ id: 1, nome: 'Tipo Teste' });
    const res = await request(app)
      .post('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Tipo Teste' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, nome: 'Tipo Teste' });
  });

  it('deve retornar todos os tipos de certificados', async () => {
    tiposCertificadosService.findAll.mockResolvedValue([{ id: 1, nome: 'Tipo Teste' }]);
    const res = await request(app)
      .get('/tipos-certificados')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: 'Tipo Teste' }]);
  });

  it('deve retornar tipo de certificado pelo id', async () => {
    tiposCertificadosService.findById.mockResolvedValue({ id: 1, nome: 'Tipo Teste' });
    const res = await request(app)
      .get('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Tipo Teste' });
  });

  it('deve retornar 404 se tipo de certificado não encontrado', async () => {
    tiposCertificadosService.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/tipos-certificados/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Tipo de certificado não encontrado' });
  });

  it('deve atualizar um tipo de certificado', async () => {
    tiposCertificadosService.update.mockResolvedValue({ id: 1, nome: 'Atualizado' });
    const res = await request(app)
      .put('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizado' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Atualizado' });
  });

  it('deve deletar um tipo de certificado', async () => {
    tiposCertificadosService.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/tipos-certificados/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('deve restaurar um tipo de certificado', async () => {
    tiposCertificadosService.restore.mockResolvedValue({ id: 1, nome: 'Restaurado' });
    const res = await request(app)
      .post('/tipos-certificados/1/restore')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' });
  });
});
