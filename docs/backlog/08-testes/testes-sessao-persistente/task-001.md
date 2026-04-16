# Task: TEST-SES-001 — Sessão autenticada permanece válida após reinicialização simulada do store

## Identificador

TEST-SES-001

## Feature

testes-sessao-persistente

## Prioridade

MÉDIA

## Contexto

Com `MemoryStore` (estado atual), as sessões são armazenadas em memória no processo Node.js. Ao reiniciar o processo (ou ao simular isso em teste recriando a instância da aplicação), todas as sessões são perdidas.

Após implementação de **SEG-SES-002** com `connect-pg-simple`, as sessões ficam no banco PostgreSQL. O objetivo deste teste é garantir que a sessão criada durante o login persiste e pode ser reutilizada mesmo após uma reconexão ao store.

---

## O que implementar

### Localização

`tests/routes/authSSR.test.js` — novo `describe` ao final do arquivo.

### Estratégia de teste

Ao contrário do `MemoryStore`, não é possível "reiniciar" o processo em um teste de integração. A forma correta de simular a persistência é:

1. Fazer login → capturar o cookie de sessão do cabeçalho `set-cookie`
2. Fazer uma segunda requisição autenticada **reutilizando o cookie** — sem nova autenticação
3. Verificar que a segunda requisição retorna 200 (sessão válida)

Se a sessão fosse `MemoryStore` e o app fosse reiniciado entre os passos 1 e 2, a segunda requisição retornaria 302 (redirect para login). Com `connect-pg-simple`, a sessão persiste no banco e a requisição retorna 200.

### Cenário

```javascript
describe('Persistência de sessão entre requests', () => {
  it('deve reutilizar sessão autenticada em request subsequente', async () => {
    // Passo 1 — fazer login e capturar cookie de sessão
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })

    expect(loginRes.status).toBe(302)

    // Extrair o cookie de sessão do cabeçalho Set-Cookie
    const setCookie = loginRes.headers['set-cookie']
    expect(setCookie).toBeDefined()

    // O cookie de sessão do connect-pg-simple se chama 'connect.sid' por padrão
    const sessionCookie = setCookie.find((c) => c.startsWith('connect.sid='))
    expect(sessionCookie).toBeDefined()

    // Passo 2 — fazer request com o cookie de sessão (sem novo login)
    const protectedRes = await request(app)
      .get('/admin/dashboard')
      .set('Cookie', sessionCookie.split(';')[0]) // apenas o valor, sem atributos

    // Assert — deve estar autenticado (200), não redirecionar para login (302)
    expect(protectedRes.status).toBe(200)
  })
})
```

### Verificação do nome do cookie

Confirmar o nome do store cookie após implementação de SEG-SES-002:

```bash
grep -n "name\|connect.sid\|cookie" app.js | grep -i session
```

O nome padrão do `express-session` é `connect.sid`. Se for alterado na configuração, ajustar o teste.

---

## Nota sobre `MemoryStore`

Com o store atual (`MemoryStore`), este teste já **passa** na mesma instância do `supertest` (porque o estado em memória é compartilhado dentro do mesmo processo de teste). O valor do teste é garantir que continua passando com `connect-pg-simple` — validando que a tabela `user_sessions` está sendo escrita e lida correctamente.

Para tornar o teste mais rigoroso com `connect-pg-simple`, adicionar verificação na tabela:

```javascript
// Após o login, verificar que a sessão foi gravada no banco
const { sequelize } = require('../../src/models')
const [sessions] = await sequelize.query(
  "SELECT * FROM user_sessions WHERE sess::text LIKE '%admin@email.com%'",
)
expect(sessions.length).toBeGreaterThan(0)
```

---

## Arquivo alvo

`tests/routes/authSSR.test.js`

## Dependências

- **SEG-SES-002**: `connect-pg-simple` configurado e tabela `user_sessions` criada por migration
- Usuário `admin@email.com` deve existir no banco de teste (já criado no `setupDb` do arquivo)

## Critério de conclusão

- Request com cookie de sessão capturado no login retorna 200 em `/admin/dashboard`
- (Opcional) Registro na tabela `user_sessions` é verificado após o login
- Teste passa em `npm run check`
