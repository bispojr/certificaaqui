# TASK ID: TEST-SSR-005

## Título

Criar `tests/routes/adminEntidades.test.js` — smoke tests das entidades admin

## Objetivo

Cobrir os GETs de listagem das entidades administrativas (participantes, eventos, tipos-certificados, usuários), verificando proteção de rota e restrição RBAC de `GET /admin/usuarios` para admin.

## Contexto

- Rotas de participantes, eventos e tipos-certificados: rbac('monitor') = todos os perfis autenticados
- Rota `/admin/usuarios`: rbac('admin') = apenas admin → gestor recebe 403
- Padrão `makeAuthCookie(id, perfil)` idêntico ao usado em TEST-SSR-003 e TEST-SSR-004
- `beforeAll`: cria usuário admin + gestor
- `afterAll`: truncate de usuários

## Arquivos envolvidos

- `tests/routes/adminEntidades.test.js` ← CRIAR

## Passos

### Criar `tests/routes/adminEntidades.test.js`

```js
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const makeAuthCookie = (id, perfil) => {
  const token = jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  return `token=${token}`
}

let adminCookie
let gestorCookie

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, usuarios RESTART IDENTITY CASCADE',
  )
  const admin = await Usuario.create({
    nome: 'Admin AE',
    email: 'admin.ae@test.com',
    senha: 'hash',
    perfil: 'admin',
  })
  const gestor = await Usuario.create({
    nome: 'Gestor AE',
    email: 'gestor.ae@test.com',
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

const rotas = [
  '/admin/participantes',
  '/admin/eventos',
  '/admin/tipos-certificados',
]

rotas.forEach((rota) => {
  describe(`GET ${rota}`, () => {
    it('redireciona para /auth/login sem autenticação', async () => {
      const res = await request(app).get(rota)
      expect(res.status).toBe(302)
      expect(res.headers.location).toMatch(/\/auth\/login/)
    })

    it('retorna 200 para admin autenticado', async () => {
      const res = await request(app).get(rota).set('Cookie', adminCookie)
      expect(res.status).toBe(200)
    })

    it('retorna 200 para gestor autenticado', async () => {
      const res = await request(app).get(rota).set('Cookie', gestorCookie)
      expect(res.status).toBe(200)
    })
  })
})

describe('GET /admin/usuarios', () => {
  it('redireciona sem autenticação', async () => {
    const res = await request(app).get('/admin/usuarios')
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/auth\/login/)
  })

  it('retorna 200 para admin autenticado', async () => {
    const res = await request(app)
      .get('/admin/usuarios')
      .set('Cookie', adminCookie)
    expect(res.status).toBe(200)
  })

  it('retorna 403 para gestor (acesso restrito a admin)', async () => {
    const res = await request(app)
      .get('/admin/usuarios')
      .set('Cookie', gestorCookie)
    expect(res.status).toBe(403)
  })
})
```

## Critério de aceite

- `GET /admin/participantes`, `/admin/eventos`, `/admin/tipos-certificados` sem cookie → 302
- Todos retornam 200 para admin e gestor autenticados
- `GET /admin/usuarios` sem cookie → 302
- `GET /admin/usuarios` com admin → 200
- `GET /admin/usuarios` com gestor → 403

## Metadados

- Completado em: 07/04/2026 03:30 ✅
