const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const { Usuario, sequelize } = require('../../src/models');
const participanteService = require('../../src/services/participanteService');

jest.mock('../../src/services/participanteService');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';
let adminToken;

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE');
  const admin = await Usuario.create({ nome: 'Admin', email: 'admin_pctrl@test.com', senha: 'senha123', perfil: 'admin' });
  adminToken = jwt.sign({ id: admin.id, perfil: admin.perfil, evento_id: admin.evento_id }, JWT_SECRET);
});

describe('ParticipanteController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um participante', async () => {
    participanteService.create.mockResolvedValue({ id: 1, nome: 'Teste' });
    const res = await request(app)
      .post('/participantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Teste' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, nome: 'Teste' });
  });

  it('deve retornar todos os participantes', async () => {
    participanteService.findAll.mockResolvedValue([{ id: 1, nome: 'Teste' }]);
    const res = await request(app)
      .get('/participantes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: 'Teste' }]);
  });

  it('deve retornar participante pelo id', async () => {
    participanteService.findById.mockResolvedValue({ id: 1, nome: 'Teste' });
    const res = await request(app)
      .get('/participantes/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Teste' });
  });

  it('deve retornar 404 se participante não encontrado', async () => {
    participanteService.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/participantes/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Participante não encontrado' });
  });

  it('deve atualizar um participante', async () => {
    participanteService.update.mockResolvedValue({ id: 1, nome: 'Atualizado' });
    const res = await request(app)
      .put('/participantes/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizado' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Atualizado' });
  });

  it('deve deletar um participante', async () => {
    participanteService.delete.mockResolvedValue();
    const res = await request(app)
      .delete('/participantes/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('deve restaurar um participante', async () => {
    participanteService.restore.mockResolvedValue({ id: 1, nome: 'Restaurado' });
    const res = await request(app)
      .post('/participantes/1/restore')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' });
  });
});
