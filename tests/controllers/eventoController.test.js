const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const { Usuario, sequelize } = require('../../src/models');
const eventoService = require('../../src/services/eventoService');

jest.mock('../../src/services/eventoService');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';
let adminToken;

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE');
  const admin = await Usuario.create({ nome: 'Admin', email: 'admin_ectrl@test.com', senha: 'senha123', perfil: 'admin' });
  adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id }, JWT_SECRET);
});

describe('EventoController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um evento', async () => {
    eventoService.create.mockResolvedValue({ id: 1, nome: 'Evento Teste' });
    const res = await request(app)
      .post('/eventos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Evento Teste' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, nome: 'Evento Teste' });
  });

  it('deve retornar todos os eventos', async () => {
    eventoService.findAll.mockResolvedValue([{ id: 1, nome: 'Evento Teste' }]);
    const res = await request(app)
      .get('/eventos')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: 'Evento Teste' }]);
  });

  it('deve retornar evento pelo id', async () => {
    eventoService.findById.mockResolvedValue({ id: 1, nome: 'Evento Teste' });
    const res = await request(app)
      .get('/eventos/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Evento Teste' });
  });

  it('deve retornar 404 se evento não encontrado', async () => {
    eventoService.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/eventos/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Evento não encontrado' });
  });

  it('deve atualizar um evento', async () => {
    eventoService.update.mockResolvedValue({ id: 1, nome: 'Atualizado' });
    const res = await request(app)
      .put('/eventos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizado' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Atualizado' });
  });

  it('deve deletar um evento', async () => {
    eventoService.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/eventos/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('deve restaurar um evento', async () => {
    eventoService.restore.mockResolvedValue({ id: 1, nome: 'Restaurado' });
    const res = await request(app)
      .post('/eventos/1/restore')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' });
  });
});
