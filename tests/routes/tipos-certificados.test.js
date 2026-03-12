const request = require('supertest');
const app = require('../../app');
const { TiposCertificados } = require('../../models');

beforeAll(async () => {
  await TiposCertificados.destroy({ where: {}, force: true });
});

describe('Rotas de TiposCertificados', () => {
  let tipoCertificadoId;

  it('deve criar tipo de certificado com sucesso', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .send({
        nome: 'Tipo Teste',
        codigo: 'AB',
        descricao: 'Descrição teste',
        texto_base: 'Texto base teste',
        dados_dinamicos: {},
        campo_destaque: 'nome'
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    tipoCertificadoId = res.body.id;
  });

  it('deve listar tipos de certificados', async () => {
    const res = await request(app)
      .get('/tipos-certificados');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve buscar tipo de certificado por id', async () => {
    const res = await request(app)
      .get(`/tipos-certificados/${tipoCertificadoId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', tipoCertificadoId);
  });

  it('deve atualizar tipo de certificado', async () => {
    const res = await request(app)
      .put(`/tipos-certificados/${tipoCertificadoId}`)
      .send({ descricao: 'Descrição Atualizada' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('descricao', 'Descrição Atualizada');
  });

  it('deve deletar tipo de certificado', async () => {
    const res = await request(app)
      .delete(`/tipos-certificados/${tipoCertificadoId}`);
    expect(res.status).toBe(204);
  });

  it('deve restaurar tipo de certificado', async () => {
    const res = await request(app)
      .post(`/tipos-certificados/${tipoCertificadoId}/restore`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted_at', null);
  });

  it('deve retornar 400 ao criar tipo de certificado com payload inválido', async () => {
    const res = await request(app)
      .post('/tipos-certificados')
      .send({ nome: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve retornar 404 ao buscar tipo de certificado inexistente', async () => {
    const res = await request(app)
      .get('/tipos-certificados/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
