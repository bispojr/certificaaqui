const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const {
  Evento,
  Usuario,
  UsuarioEvento,
  sequelize,
} = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro'

describe('Eventos API - Visibilidade do Gestor', () => {
  let gestor, token, evento1, evento2, evento3

  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE usuario_eventos RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')

    gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor_eventos@test.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    token = jwt.sign({ id: gestor.id, perfil: gestor.perfil }, JWT_SECRET)

    evento1 = await Evento.create({
      nome: 'Evento 1',
      codigo_base: 'EVA',
      ano: 2026,
    })
    evento2 = await Evento.create({
      nome: 'Evento 2',
      codigo_base: 'EVB',
      ano: 2026,
    })
    evento3 = await Evento.create({
      nome: 'Evento 3',
      codigo_base: 'EVC',
      ano: 2026,
    })

    // Associa gestor apenas ao evento1 e evento3
    await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: evento1.id })
    await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: evento3.id })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  it('gestor só vê eventos aos quais está associado', async () => {
    const res = await request(app)
      .get(`/gestor/${gestor.id}/eventos`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    const nomes = res.body.data.map((e) => e.nome)
    expect(nomes).toContain('Evento 1')
    expect(nomes).toContain('Evento 3')
    expect(nomes).not.toContain('Evento 2')
  })
})
