// Garante JWT_SECRET antes de importar o middleware
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jwt_secret_teste'
}
const request = require('supertest')
const express = require('express')
const jwt = require('jsonwebtoken')
const { Usuario, sequelize } = require('../../src/models')
const migrationUsuarios = require('../../migrations/20260312180000-create-usuarios.js')
const auth = require('../../middleware/auth')

const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET não configurado')

describe('Middleware auth', () => {
  let app
  let usuario

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    app.get('/protegida', auth, (req, res) => {
      res.json({ usuario: req.usuario.email })
    })
    // Garante que a tabela usuarios existe
    await migrationUsuarios.up(
      sequelize.getQueryInterface(),
      sequelize.constructor,
    )
    await Usuario.destroy({ where: {}, force: true })
    usuario = await Usuario.create({
      nome: 'Teste',
      email: 'teste@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
  })

  it('deve permitir acesso com token válido', async () => {
    const token = jwt.sign({ id: usuario.id }, secret)
    const res = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.usuario).toBe('teste@email.com')
  })

  it('deve bloquear acesso sem token', async () => {
    const res = await request(app).get('/protegida')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Token não fornecido')
  })

  it('deve bloquear acesso com token inválido', async () => {
    const res = await request(app)
      .get('/protegida')
      .set('Authorization', 'Bearer token_invalido')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Token inválido')
  })
})
