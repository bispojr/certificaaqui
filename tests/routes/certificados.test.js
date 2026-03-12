const request = require('supertest');
const app = require('../../app');
const { Certificado, Participante, Evento, TiposCertificados } = require('../../models');

let participanteId, eventoId, tipoCertificadoId;

beforeAll(async () => {
  await Certificado.destroy({ where: {}, force: true });
  await Participante.destroy({ where: {}, force: true });
  await Evento.destroy({ where: {}, force: true });
  await TiposCertificados.destroy({ where: {}, force: true });

  // Criar dependências
  const participante = await Participante.create({ nomeCompleto: 'Teste Cert', email: 'cert@teste.com' });
  participanteId = participante.id;
  const evento = await Evento.create({ nome: 'Evento Cert', codigo_base: 'XYZ', ano: 2026 });
  eventoId = evento.id;
  const tipoCertificado = await TiposCertificados.create({
    nome: 'Tipo Cert',
    codigo: 'AB',
    descricao: 'Descrição teste',
    texto_base: 'Texto base teste',
    dados_dinamicos: {},
    campo_destaque: 'nome'
  });
  tipoCertificadoId = tipoCertificado.id;
});

describe('Rotas de Certificados', () => {
  let certificadoId;

  it('deve emitir certificado com sucesso', async () => {
    const res = await request(app)
      .post('/certificados')
      .send({
        nome: 'Certificado Teste',
        participante_id: participanteId,
        evento_id: eventoId,
        tipo_certificado_id: tipoCertificadoId,
        valores_dinamicos: { campo: 'valor' }
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    certificadoId = res.body.id;
  });

  it('deve listar certificados', async () => {
    const res = await request(app)
      .get('/certificados');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve buscar certificado por id', async () => {
    const res = await request(app)
      .get(`/certificados/${certificadoId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', certificadoId);
  });

  it('deve atualizar certificado', async () => {
    const res = await request(app)
      .put(`/certificados/${certificadoId}`)
      .send({ nome: 'Certificado Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'Certificado Atualizado');
  });

  it('deve cancelar certificado', async () => {
    const res = await request(app)
      .post(`/certificados/${certificadoId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'cancelado');
  });

  it('deve restaurar certificado', async () => {
    const res = await request(app)
      .post(`/certificados/${certificadoId}/restore`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted_at', null);
  });

  it('deve deletar certificado', async () => {
    const res = await request(app)
      .delete(`/certificados/${certificadoId}`);
    expect(res.status).toBe(204);
  });

  it('deve retornar 400 ao emitir certificado com payload inválido', async () => {
    const res = await request(app)
      .post('/certificados')
      .send({ participante_id: null });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve retornar 404 ao buscar certificado inexistente', async () => {
    const res = await request(app)
      .get('/certificados/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
