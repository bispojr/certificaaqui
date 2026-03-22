# TASK ID: TEST-SSR-003

## Título
Criar `tests/routes/adminDashboard.test.js` — rota `/admin/dashboard`

## Objetivo
Cobrir proteção de autenticação e renderização do painel admin, incluindo diferença de conteúdo entre perfis `admin` e `gestor`.

## Contexto
- Rota implementada por DASH-003 (Domínio 5): `GET /admin/dashboard`
- Sem cookie → `authSSR.js` redireciona para `/auth/login` (302)
- Com cookie `admin` → 200, HTML com "Dashboard"
- Com cookie `gestor` → 200, HTML (escopo reduzido)
- Helper local `makeAuthCookie(id, perfil)` usa `jwt.sign` com `JWT_SECRET` do `process.env`
- Modelo `Usuario` deve existir no banco (lookup feito por authSSR)
- Padrão de truncate + create em `beforeAll`; truncate em `afterAll`

## Arquivos envolvidos
- `tests/routes/adminDashboard.test.js` ← CRIAR

## Passos

### Criar `tests/routes/adminDashboard.test.js`

```js
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
let adminCookie
let gestorCookie

const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, usuarios RESTART IDENTITY CASCADE',
  )
  const admin = await Usuario.create({
    nome: 'Admin Test',
    email: 'admin.dash@test.com',
    senha: 'hash',
    perfil: 'admin',
  })
  const gestor = await Usuario.create({
    nome: 'Gestor Test',
    email: 'gestor.dash@test.com',
    senha: 'hash',
    perfil: 'gestor',
  })
  adminCookie = makeAuthCookie(admin.id, 'admin')
  gestorCookie = makeAuthCookie(gestor.id, 'gestor')
})

afterAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, usuarios RESTART IDENTITY CASCADE',
  )
})

describe('GET /admin/dashboard', () => {
  it('redireciona para /auth/login sem autenticação', async () => {
    const res = await request(app).get('/admin/dashboard')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/auth\/login/)
  })

  it('retorna 200 com HTML para admin autenticado', async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/[Dd]ashboard/)
  })

  it('retorna 200 com HTML para gestor autenticado', async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(200)
  })
})
```

## Critério de aceite
- `GET /admin/dashboard` sem cookie → 302 redirecionando para `/auth/login`
- `GET /admin/dashboard` com cookie `admin` → 200 + HTML contendo "Dashboard"
- `GET /admin/dashboard` com cookie `gestor` → 200
- `makeAuthCookie` reutilizável — mesmo padrão usado nas demais suítes admin
