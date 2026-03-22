# TASK ID: TEST-SSR-001

## Título
Criar `tests/routes/authSSR.test.js` — rotas de autenticação SSR

## Objetivo
Cobrir `GET /auth/login` (renderiza formulário), `POST /auth/login` (sucesso → cookie + redirect, credenciais inválidas → flash + redirect), `POST /auth/logout` (limpa cookie + redirect).

## Contexto
- `src/routes/auth.js` registrado em `app.js` (a ser feito em `02-ssr-cookie` TASK-003/004)
- `POST /auth/login` com sucesso: seta cookie `token=<JWT>`, redireciona para `/admin/dashboard`
- `POST /auth/login` com credenciais inválidas: redireciona para `/auth/login` com flash error
- `POST /auth/logout`: limpa cookie `token`, redireciona para `/auth/login`
- Supertest não segue redirects por padrão — verificar `302 + Location`
- Senha do usuário criado no `beforeAll` deve ser bcrypt-hashed automaticamente pelo hook do model

## Arquivos envolvidos
- `tests/routes/authSSR.test.js` ← CRIAR

## Passos

### Criar `tests/routes/authSSR.test.js`

```js
const request = require('supertest')
const app = require('../../app')
const { Usuario, sequelize } = require('../../src/models')

beforeAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  await Usuario.create({
    nome: 'Admin SSR',
    email: 'admin.ssr@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })
})

afterAll(async () => {
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
})

describe('GET /auth/login', () => {
  it('deve renderizar o formulário de login', async () => {
    const res = await request(app).get('/auth/login')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/login/i)
    expect(res.text).toMatch(/email/i)
    expect(res.text).toMatch(/senha/i)
  })
})

describe('POST /auth/login', () => {
  it('redireciona para /admin/dashboard com credenciais válidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send('email=admin.ssr@test.com&senha=senha123')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(302)
    expect(res.header.location).toBe('/admin/dashboard')
    expect(res.header['set-cookie']).toBeDefined()
    expect(res.header['set-cookie'].some((c) => c.startsWith('token='))).toBe(true)
  })

  it('redireciona para /auth/login com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send('email=admin.ssr@test.com&senha=errada')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(302)
    expect(res.header.location).toBe('/auth/login')
  })

  it('redireciona para /auth/login com usuário inexistente', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send('email=naoexiste@test.com&senha=qualquer')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(302)
    expect(res.header.location).toBe('/auth/login')
  })
})

describe('POST /auth/logout', () => {
  it('limpa o cookie e redireciona para /auth/login', async () => {
    const res = await request(app).post('/auth/logout')
    expect(res.status).toBe(302)
    expect(res.header.location).toBe('/auth/login')
    // Cookie zerado ou com maxAge=0
    if (res.header['set-cookie']) {
      const tokenCookie = res.header['set-cookie'].find((c) => c.startsWith('token='))
      if (tokenCookie) {
        expect(tokenCookie).toMatch(/Max-Age=0|expires=.*1970/i)
      }
    }
  })
})
```

## Critério de aceite
- `GET /auth/login` retorna 200 com HTML contendo campo email e senha
- `POST /auth/login` com sucesso: 302 + `Location: /admin/dashboard` + cookie `token`
- `POST /auth/login` com falha: 302 + `Location: /auth/login`
- `POST /auth/logout`: 302 + `Location: /auth/login`
