const request = require('supertest');
const app = require('../../app');
const eventoService = require('../../src/services/eventoService');

jest.mock('../../src/services/eventoService');

describe('EventoController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um evento', async () => {
    eventoService.create.mockResolvedValue({ id: 1, nome: 'Evento Teste' });
    const res = await request(app)
      .post('/eventos')
      .send({ nome: 'Evento Teste' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, nome: 'Evento Teste' });
  });

  it('deve retornar todos os eventos', async () => {
    eventoService.findAll.mockResolvedValue([{ id: 1, nome: 'Evento Teste' }]);
    const res = await request(app).get('/eventos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nome: 'Evento Teste' }]);
  });

  it('deve retornar evento pelo id', async () => {
    eventoService.findById.mockResolvedValue({ id: 1, nome: 'Evento Teste' });
    const res = await request(app).get('/eventos/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Evento Teste' });
  });

  it('deve retornar 404 se evento não encontrado', async () => {
    eventoService.findById.mockResolvedValue(null);
    const res = await request(app).get('/eventos/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Evento não encontrado' });
  });

  it('deve atualizar um evento', async () => {
    eventoService.update.mockResolvedValue({ id: 1, nome: 'Atualizado' });
    const res = await request(app)
      .put('/eventos/1')
      .send({ nome: 'Atualizado' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Atualizado' });
  });

  it('deve deletar um evento', async () => {
    eventoService.delete.mockResolvedValue();
    const res = await request(app).delete('/eventos/1');
    expect(res.statusCode).toBe(204);
  });

  it('deve restaurar um evento', async () => {
    eventoService.restore.mockResolvedValue({ id: 1, nome: 'Restaurado' });
    const res = await request(app).post('/eventos/1/restore');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 1, nome: 'Restaurado' });
  });
});
