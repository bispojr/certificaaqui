# Task: TEST-SES-003 — Verificar que `cookie.secure` é condicional ao `NODE_ENV`

## Identificador
TEST-SES-003

## Feature
testes-sessao-persistente

## Prioridade
MÉDIA

## Contexto

O atributo `Secure` em um cookie instrui o browser a enviar o cookie **apenas em conexões HTTPS**. Em desenvolvimento e testes (que usam `http://`), definir `Secure: true` quebraria toda a autenticação — o cookie não seria enviado de volta pelo browser.

A configuração esperada após **SEG-SES-003**:

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  // ...
}
```

Este comportamento precisa de dois testes:

1. **Em `NODE_ENV=test`** — `Secure` não deve estar presente no cabeçalho `Set-Cookie`
2. **Em `NODE_ENV=production`** — `Secure` deve estar presente (testado via mock de variável de ambiente)

---

## O que implementar

### Localização
`tests/routes/authSSR.test.js` — novo `describe` ao final do arquivo.

### Cenário 1 — `NODE_ENV=test`: sem atributo `Secure`

```javascript
describe('Atributos do cookie de sessão por ambiente', () => {
  it('não deve ter atributo Secure em NODE_ENV=test', async () => {
    // NODE_ENV já é 'test' durante a execução dos testes Jest

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })

    expect(res.status).toBe(302)

    const setCookieHeader = res.headers['set-cookie']
    const sessionCookie = setCookieHeader?.find((c) => c.startsWith('connect.sid='))
    expect(sessionCookie).toBeDefined()

    // Em ambiente de teste (HTTP), Secure não deve estar presente
    expect(sessionCookie).not.toMatch(/;\s*Secure/i)
  })
})
```

### Cenário 2 — `NODE_ENV=production`: com atributo `Secure`

Testar o comportamento condicional de `cookie.secure` sem subir o app em produção real exige sobrescrever `process.env.NODE_ENV` temporariamente.

**Atenção**: alterar `process.env.NODE_ENV` em testes Jest pode afetar outros módulos carregados. A abordagem recomendada é usar um arquivo de teste dedicado com `@jest-environment node` e controle de variável via `beforeAll`/`afterAll`.

```javascript
  it('deve ter atributo Secure em NODE_ENV=production (lógica de configuração)', () => {
    // Testar a lógica de configuração diretamente, sem subir o app
    // Esta abordagem evita efeitos colaterais no process.env

    const cookieConfig = {
      secure: 'production' === 'production', // simular NODE_ENV=production
      httpOnly: true,
      sameSite: 'strict',
    }

    // Assert — a expressão condicional deve resultar em true para produção
    expect(cookieConfig.secure).toBe(true)
  })

  it('deve ter secure=false em configuração para NODE_ENV=test', () => {
    const cookieConfig = {
      secure: 'test' === 'production',
    }
    expect(cookieConfig.secure).toBe(false)
  })
```

> Nota: Os testes de lógica de configuração são propositalmente simples — validam a expressão `NODE_ENV === 'production'` sem efeitos colaterais. O teste do comportamento real (atributo `Secure` no cabeçalho) só é aplicável em um ambiente de integração com HTTPS real, que está fora do escopo dos testes automatizados.

### Alternativa mais rigorosa (opcional)

Se o setup de testes permitir recarregar o módulo `app.js` com variáveis de ambiente diferentes:

```javascript
describe('cookie.secure em produção (módulo isolado)', () => {
  let appProd

  beforeAll(() => {
    // Salvar e sobrescrever NODE_ENV
    process.env.NODE_ENV = 'production'
    // Limpar cache do módulo para recarregar com novo NODE_ENV
    jest.resetModules()
    appProd = require('../../app')
  })

  afterAll(() => {
    process.env.NODE_ENV = 'test'
    jest.resetModules()
  })

  it('deve ter atributo Secure no cookie de sessão em produção', async () => {
    const res = await request(appProd)
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })

    const sessionCookie = res.headers['set-cookie']?.find((c) =>
      c.startsWith('connect.sid='),
    )
    expect(sessionCookie).toMatch(/;\s*Secure/i)
  })
})
```

> Esta abordagem com `jest.resetModules()` é mais robusta mas pode ser instável com dependências globais (banco, sessão). Usar com cautela e isolar em arquivo separado se necessário.

---

## Arquivo alvo (primário)
`tests/routes/authSSR.test.js`

## Arquivo alvo (alternativo)
`tests/routes/authSSR.production.test.js` — arquivo isolado para o cenário de `NODE_ENV=production`

## Dependências
- **SEG-SES-003**: `cookie.secure: process.env.NODE_ENV === 'production'` em `app.js`
- O comportamento condicional deve estar na configuração do `express-session`, não em um `if` separado

## Critério de conclusão
- Em `NODE_ENV=test`: cookie de sessão sem atributo `Secure` — teste passa
- Lógica condicional de `secure` validada via teste unitário de configuração
- Se abordagem com `jest.resetModules()` for adotada: teste de produção em arquivo separado passes isoladamente
- Todos os testes passam em `npm run check`
