const request = require('supertest');
const app = require('../../app');
const { Usuario, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro';

describe('UsuarioController', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('deve autenticar usuário e retornar token', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@email.com', senha: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('deve retornar erro para senha inválida', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'admin@email.com', senha: 'errada' });
    expect(res.status).toBe(401);
  });

  it('deve retornar erro para usuário inexistente', async () => {
    const res = await request(app)
      .post('/usuarios/login')
      .send({ email: 'naoexiste@email.com', senha: 'senha123' });
    expect(res.status).toBe(401);
  });

  it('deve retornar dados do usuário autenticado', async () => {
    const usuario = await Usuario.findOne({ where: { email: 'admin@email.com' } });
    const token = jwt.sign({ id: usuario.id, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/usuarios/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@email.com');
  });

  it('deve realizar logout', async () => {
    const res = await request(app)
      .post('/usuarios/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logout realizado');
  });
});
