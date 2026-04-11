const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const {
  Usuario,
  Participante,
  Evento,
  TiposCertificados,
  Certificado,
  sequelize,
} = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET
const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

describe('Admin SSR - certificados', () => {
  let admin,
    gestor,
    participante,
    evento,
    tipo,
    certificado,
    adminCookie,
    gestorCookie

  beforeAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE certificados RESTART IDENTITY CASCADE',
    )
    await sequelize.query(
      'TRUNCATE TABLE participantes RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query(
      'TRUNCATE TABLE tipos_certificados RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
    admin = await Usuario.create({
      nome: 'Admin',
      email: 'admin@admin.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    gestor = await Usuario.create({
      nome: 'Gestor',
      email: 'gestor@admin.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    adminCookie = makeAuthCookie(admin.id, 'admin')
    gestorCookie = makeAuthCookie(gestor.id, 'gestor')
    participante = await Participante.create({
      nomeCompleto: 'Fulano',
      email: 'fulano@teste.com',
    })
    evento = await Evento.create({
      nome: 'Evento',
      codigo_base: 'EVT',
      ano: 2026,
      data_inicio: '2026-04-01',
      data_fim: '2026-04-02',
    })
    tipo = await TiposCertificados.create({
      codigo: 'TP',
      descricao: 'Tipo',
      campo_destaque: 'nome',
      texto_base: 'Texto',
      dados_dinamicos: { nome: {} },
    })
    certificado = await Certificado.create({
      nome: 'Fulano',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      valores_dinamicos: { nome: 'Fulano' },
      codigo: 'ABC123',
      status: 'emitido',
    })
  })

  afterAll(async () => {
    await sequelize.query(
      'TRUNCATE TABLE certificados RESTART IDENTITY CASCADE',
    )
    await sequelize.query(
      'TRUNCATE TABLE participantes RESTART IDENTITY CASCADE',
    )
    await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
    await sequelize.query(
      'TRUNCATE TABLE tipos_certificados RESTART IDENTITY CASCADE',
    )
    // Não trunca a tabela de usuários para manter os usuários de autenticação
  })

  it('GET /admin/certificados exige autenticação', async () => {
    const res = await request(app).get('/admin/certificados')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/auth/login')
  })

  it('GET /admin/certificados permite admin e gestor', async () => {
    let res = await request(app)
      .get('/admin/certificados')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificados/i)
    res = await request(app)
      .get('/admin/certificados')
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Certificados/i)
  })

  it('POST /admin/certificados cria certificado (gestor)', async () => {
    const res = await request(app)
      .post('/admin/certificados')
      .set('Cookie', gestorCookie)
      .type('form')
      .send({
        participante_id: participante.id,
        evento_id: evento.id,
        tipo_certificado_id: tipo.id,
        nome: 'Novo Certificado',
        valores_dinamicos_json: JSON.stringify({ nome: 'Novo Certificado' }),
      })
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/certificados')
    const cert = await Certificado.findOne({
      where: { nome: 'Novo Certificado' },
    })
    expect(cert).not.toBeNull()
  })

  it('POST /admin/certificados/:id/cancelar só permite gestor ou admin', async () => {
    // gestor pode cancelar
    let res = await request(app)
      .post(`/admin/certificados/${certificado.id}/cancelar`)
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(302)
    await certificado.reload()
    expect(certificado.status).toBe('cancelado')
    // admin pode cancelar
    await certificado.update({ status: 'emitido' })
    res = await request(app)
      .post(`/admin/certificados/${certificado.id}/cancelar`)
      .set('Cookie', adminCookie)
    expect(res.status).toBe(302)
    await certificado.reload()
    expect(certificado.status).toBe('cancelado')
  })

  it('POST /admin/certificados/:id/restaurar só permite admin', async () => {
    // Soft-delete diretamente para poder testar o restaurar
    await certificado.destroy()
    // gestor NÃO pode restaurar
    const res403 = await request(app)
      .post(`/admin/certificados/${certificado.id}/restaurar`)
      .set('Cookie', gestorCookie)
    expect(res403.status).toBe(403)
    // admin pode restaurar
    const res302 = await request(app)
      .post(`/admin/certificados/${certificado.id}/restaurar`)
      .set('Cookie', adminCookie)
    expect(res302.status).toBe(302)
    await certificado.reload({ paranoid: false })
    expect(certificado.dataValues.deleted_at).toBeNull()
  })
})
