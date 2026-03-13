const request = require('supertest');
const app = require('../../app');
const { Participante, sequelize } = require('../../src/models');

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE participantes CASCADE');
});

describe('Rotas de Participantes', () => {
  let participanteId;

  it('deve criar participante com sucesso', async () => {
    const res = await request(app)
      .post('/participantes')
      .send({ nomeCompleto: 'João Teste', email: 'joao@teste.com' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    participanteId = res.body.id;
  });

  it('deve listar participantes', async () => {
    const res = await request(app)
      .get('/participantes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve buscar participante por id', async () => {
    const res = await request(app)
      .get(`/participantes/${participanteId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', participanteId);
  });

  it('deve atualizar participante', async () => {
    const res = await request(app)
      .put(`/participantes/${participanteId}`)
      .send({ nomeCompleto: 'João Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nomeCompleto', 'João Atualizado');
  });

  it('deve deletar participante', async () => {
    const res = await request(app)
      .delete(`/participantes/${participanteId}`);
    expect(res.status).toBe(204);
    // Não verifica body, pois 204 não retorna conteúdo
  });

  it('deve restaurar participante', async () => {
    const res = await request(app)
      .post(`/participantes/${participanteId}/restore`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted_at', null);
  });

  it('deve retornar 400 ao criar participante com payload inválido', async () => {
    const res = await request(app)
      .post('/participantes')
      .send({ nomeCompleto: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve retornar 404 ao buscar participante inexistente', async () => {
    const res = await request(app)
      .get('/participantes/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
