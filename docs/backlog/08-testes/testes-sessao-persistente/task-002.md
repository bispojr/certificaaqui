# Task: TEST-SES-002 — Verificar que `cookie.httpOnly: true` está presente no cabeçalho de resposta do login

## Identificador
TEST-SES-002

## Feature
testes-sessao-persistente

## Prioridade
MÉDIA

## Contexto

A configuração atual de sessão em `app.js` não declara explicitamente `cookie.httpOnly`. O Express define `httpOnly: true` por padrão para cookies de sessão, mas isso não está nem testado nem documentado.

Após implementação de **SEG-SES-003**, o cookie deve ter `HttpOnly` explícito na configuração:

```javascript
session({
  secret: sessionSecret,
  store: pgSession,
  cookie: {
    httpOnly: true,      // ← explícito
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 horas
  },
  resave: false,
  saveUninitialized: false,
})
```

O atributo `HttpOnly` impede que o JavaScript do cliente (ex.: script malicioso injetado via XSS) leia o cookie de sessão — proteção direta contra OWASP A07 (Identification and Authentication Failures).

---

## Estado atual em `tests/routes/authSSR.test.js`

O teste existente (linha 38) verifica apenas:

```javascript
expect(res.header['set-cookie']).toBeDefined()
expect(res.header['set-cookie'].some((c) => c.startsWith('token='))).toBe(true)
```

Não verifica `HttpOnly` nem outros atributos de segurança do cookie de sessão.

---

## O que implementar

### Localização
`tests/routes/authSSR.test.js` — dentro do `describe('POST /auth/login', ...)` existente (linha 30), como novo `it`.

### Cenário

```javascript
it('deve retornar cookie de sessão com atributo HttpOnly', async () => {
  // Arrange — criar usuário se não existir (já feito no beforeAll/beforeEach)

  // Act
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@email.com', senha: '123456' })

  // Assert
  expect(res.status).toBe(302)

  const setCookieHeader = res.headers['set-cookie']
  expect(setCookieHeader).toBeDefined()

  // O cookie de sessão deve ter o atributo HttpOnly
  const sessionCookie = setCookieHeader.find((c) => c.startsWith('connect.sid='))
  expect(sessionCookie).toBeDefined()
  expect(sessionCookie).toMatch(/HttpOnly/i)
})
```

### Por que o cookie se chama `connect.sid`

O `express-session` com qualquer store cria um cookie chamado `connect.sid` por padrão. O JWT/token pode existir em cookie separado (`token=`), que já é verificado nos testes existentes. Este teste é específico para o cookie de **sessão server-side**.

### Verificação manual antes de implementar

Para confirmar o nome e os atributos atuais dos cookies de sessão, executar:

```bash
curl -v -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@email.com","senha":"123456"}' \
  2>&1 | grep -i set-cookie
```

---

## Atributos de segurança recomendados a verificar

| Atributo | Teste obrigatório | Observação |
|---|---|---|
| `HttpOnly` | ✅ (esta task) | Protege contra XSS e roubo de session cookie |
| `SameSite=Strict` | Opcional | Protege contra CSRF |
| `Secure` | Coberto em task-003 | Só em produção |
| `Max-Age` ou `Expires` | Opcional | Evita sessões eternas |

---

## Arquivo alvo
`tests/routes/authSSR.test.js`

## Dependências
- **SEG-SES-003**: `cookie.httpOnly: true` declarado explicitamente em `app.js`
- O nome do cookie deve ser `connect.sid` — confirmar se foi alterado na configuração

## Critério de conclusão
- `sessionCookie` encontrado via `connect.sid=` no `set-cookie`
- `sessionCookie` contém a string `HttpOnly` (case-insensitive)
- Teste passa em `npm run check`
