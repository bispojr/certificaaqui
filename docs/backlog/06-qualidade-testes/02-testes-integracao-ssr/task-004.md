# TASK ID: TEST-SSR-004

## Título

Criar `tests/routes/adminCertificados.test.js` — CRUD de certificados admin SSR

## Objetivo

Cobrir as rotas administrativas de certificados (`GET /admin/certificados`, `POST /admin/certificados`, cancelar e restaurar), verificando RBAC e fluxo completo com fixtures.

## Contexto

- Rotas implementadas por CERT-ADMIN-005 (Domínio 5) em `src/routes/admin.js`
- `GET /admin/certificados` → rbac('monitor') = qualquer perfil autenticado
- `POST /admin/certificados` → rbac('gestor') = gestor ou admin; cria certificado + redirect
- `POST /admin/certificados/:id/cancelar` → rbac('gestor')
- `POST /admin/certificados/:id/restaurar` → rbac('admin') → 403 para gestor
- `beforeAll`: cria usuários admin + gestor + fixtures de participante/evento/tipo
- `afterAll`: truncate completo

## Arquivos envolvidos

- `tests/routes/adminCertificados.test.js` ← CRIAR

## Passos

### Criar `tests/routes/adminCertificados.test.js`

```js
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

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

let adminCookie
let gestorCookie
let participanteId
let eventoId
let tipoId
let certificadoId

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE certificados, tipos_certificados, participantes, eventos, usuario_eventos, usuarios RESTART IDENTITY CASCADE',
  )
  const admin = await Usuario.create({
    nome: 'Admin CA',
    email: 'admin.ca@test.com',
    senha: 'hash',
    perfil: 'admin',
  })
  const gestor = await Usuario.create({
    nome: 'Gestor CA',
    email: 'gestor.ca@test.com',
    senha: 'hash',
    perfil: 'gestor',
  })
  adminCookie = makeAuthCookie(admin.id, 'admin')
  gestorCookie = makeAuthCookie(gestor.id, 'gestor')

  const evento = await Evento.create({
    nome: 'Ev CA',
    codigo_base: 'CA',
    ano: 2026,
  })
  const tipo = await TiposCertificados.create({
    codigo: 'CA',
    descricao: 'Tipo CA',
    campo_destaque: 'nome',
    texto_base: 'Certificado de ${nome}',
    dados_dinamicos: {},
  })
  const participante = await Participante.create({
    nomeCompleto: 'Part CA',
    email: 'part.ca@test.com',
  })
  eventoId = evento.id
  tipoId = tipo.id
  participanteId = participante.id

  const cert = await Certificado.create({
    nome: 'Part CA',
    status: 'emitido',
    participante_id: participanteId,
    evento_id: eventoId,
    tipo_certificado_id: tipoId,
    codigo: 'CA-001',
  })
  certificadoId = cert.id
})

afterAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE certificados, tipos_certificados, participantes, eventos, usuario_eventos, usuarios RESTART IDENTITY CASCADE',
  )
})

describe('GET /admin/certificados', () => {
  it('redireciona sem autenticação', async () => {
    const res = await request(app).get('/admin/certificados')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/auth\/login/)
  })

  it('retorna 200 para admin autenticado', async () => {
    const res = await request(app)
      .get('/admin/certificados')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
  })
})

describe('POST /admin/certificados/:id/cancelar', () => {
  it('cancela certificado como gestor', async () => {
    const res = await request(app)
      .post(`/admin/certificados/${certificadoId}/cancelar`)
      .set('Cookie', gestorCookie)
    expect([302, 200]).toContain(res.status)
  })
})

describe('POST /admin/certificados/:id/restaurar', () => {
  it('retorna 403 para gestor (somente admin)', async () => {
    const res = await request(app)
      .post(`/admin/certificados/${certificadoId}/restaurar`)
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(403)
  })

  it('restaura certificado como admin', async () => {
    const res = await request(app)
      .post(`/admin/certificados/${certificadoId}/restaurar`)
      .set('Cookie', adminCookie)
    expect([302, 200]).toContain(res.status)
  })
})
```

## Critério de aceite

- `GET /admin/certificados` sem cookie → 302 para `/auth/login`
- `GET /admin/certificados` com admin → 200
- `POST /:id/cancelar` com gestor → 302 (redirect após ação)
- `POST /:id/restaurar` com gestor → 403
- `POST /:id/restaurar` com admin → 302 (redirect após ação)
