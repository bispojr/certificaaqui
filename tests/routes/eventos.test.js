const request = require('supertest');
const app = require('../../app');
const { Evento, sequelize } = require('../../src/models');

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE eventos CASCADE');
});

describe('Rotas de Eventos', () => {
  let eventoId;

  it('deve criar evento com sucesso', async () => {
    const res = await request(app)
      .post('/eventos')
      .send({ nome: 'Evento Teste', codigo_base: 'ABC', ano: 2026 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    eventoId = res.body.id;
  });

  it('deve listar eventos', async () => {
    const res = await request(app)
      .get('/eventos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve buscar evento por id', async () => {
    const res = await request(app)
      .get(`/eventos/${eventoId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', eventoId);
  });

  it('deve atualizar evento', async () => {
    const res = await request(app)
      .put(`/eventos/${eventoId}`)
      .send({ nome: 'Evento Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'Evento Atualizado');
  });

  it('deve deletar evento', async () => {
    const res = await request(app)
      .delete(`/eventos/${eventoId}`);
    expect(res.status).toBe(204);
  });

  it('deve restaurar evento', async () => {
    const res = await request(app)
      .post(`/eventos/${eventoId}/restore`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted_at', null);
  });

  it('deve retornar 400 ao criar evento com payload inválido', async () => {
    const res = await request(app)
      .post('/eventos')
      .send({ nome: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve retornar 404 ao buscar evento inexistente', async () => {
    const res = await request(app)
      .get('/eventos/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
