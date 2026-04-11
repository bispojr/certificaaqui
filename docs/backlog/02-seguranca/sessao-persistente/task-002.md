# TASK ID: SEG-SES-002

## Título

Configurar `express-session` com store `connect-pg-simple` em `app.js`

## Tipo

código

## Dependências

- SEG-SES-001 (`connect-pg-simple` instalado)

## Objetivo

Substituir o MemoryStore implícito pelo `connect-pg-simple` na configuração de sessão em `app.js`, usando `DATABASE_URL` como connection string e configurando os parâmetros de prune.

## Contexto

`app.js` atual (linhas 41–49):

```js
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
)
```

Nenhum `store` é definido → MemoryStore implícito.

Em testes (`NODE_ENV === 'test'`), `DATABASE_URL` pode não estar definida (ou pode apontar para banco de teste). Para evitar que os testes quebrem quando `DATABASE_URL` não existe, o store deve usar um **fallback condicional**: se `DATABASE_URL` for falsy, mantém MemoryStore (aceitável em testes).

## Arquivos envolvidos

- `app.js` ← alterar a configuração da sessão

## Passos

1. Adicionar o import de `connect-pg-simple` no topo de `app.js`, após o `require('express-session')`:

```js
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
```

2. Substituir o bloco `session({...})` existente pelo novo:

```js
const sessionStore = process.env.DATABASE_URL
  ? new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      pruneSessionInterval: 900, // limpeza de sessões expiradas a cada 15 min
    })
  : undefined // MemoryStore implícito — apenas em testes sem DATABASE_URL

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
)
```

3. **Não alterar** as linhas de `SESSION_SECRET` guard, `flash()` nem o middleware de `res.locals.flash` — manter intactos.

## Notas de implementação

- `pruneSessionInterval: 900` → limpeza automática de sessões expiradas a cada 900 segundos (15 min)
- `conString` aceita URL no formato `postgresql://user:pass@host:port/db` — exatamente o formato de `DATABASE_URL` definido no `docker-compose.yml`
- O fallback `undefined` faz o `express-session` usar MemoryStore — comportamento idêntico ao atual para testes
- **Não** usar `createTableIfMissing: true` — a tabela é gerenciada por migrations (SEG-SES-001)

## Resultado esperado

- Com `DATABASE_URL` definida, as sessões são persistidas na tabela `user_sessions` do PostgreSQL
- Sem `DATABASE_URL` (ambiente de teste sem a variável), o app sobe normalmente com MemoryStore
- `npm run check` passa

## Critério de aceite

- `app.js` importa `connect-pg-simple` no topo
- O `store` é definido condicionalmente baseado em `DATABASE_URL`
- `tableName: 'user_sessions'` e `pruneSessionInterval: 900` estão configurados
- `resave: false` e `saveUninitialized: false` permanecem
