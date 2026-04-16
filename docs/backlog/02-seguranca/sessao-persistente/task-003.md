# TASK ID: SEG-SES-003

## Título

Configurar opções de cookie seguras na sessão (`httpOnly`, `sameSite`, `secure`, `maxAge`)

## Tipo

código

## Dependências

- SEG-SES-002 (`express-session` configurado com store)

## Objetivo

Adicionar as opções de cookie ao bloco `session({...})` em `app.js`, seguindo boas práticas de segurança: `httpOnly` sempre ativo, `secure` apenas em produção, `sameSite: 'strict'`, e `maxAge` de 8 horas.

## Contexto

`app.js` atual (após SEG-SES-002) terá o bloco de sessão sem `cookie`:

```js
app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
)
```

Sem `cookie` configurado, o `express-session` usa os padrões: `httpOnly: true`, `secure: false`, sem `maxAge` (sessão expira ao fechar o browser). O `sameSite` padrão depende da versão do Node/express-session.

## Arquivos envolvidos

- `app.js` ← adicionar `cookie` ao bloco `session({...})`

## Passos

1. Localizar o bloco `session({...})` em `app.js` (após SEG-SES-002 aplicada)

2. Adicionar a chave `cookie` com as seguintes opções:

```js
app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas em milissegundos
    },
  }),
)
```

## Notas de implementação

| Opção                | Valor                       | Justificativa                                                                |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `httpOnly: true`     | sempre                      | Impede acesso via JavaScript no browser (XSS mitigation)                     |
| `secure`             | `NODE_ENV === 'production'` | HTTPS obrigatório em produção; desabilita em dev/test para funcionar sem TLS |
| `sameSite: 'strict'` | sempre                      | Bloqueia envio do cookie em requests cross-site (CSRF mitigation)            |
| `maxAge`             | `28800000` (8h)             | Sessão expira após 8 horas de inatividade; evita sessões eternas             |

- `secure: false` em desenvolvimento é intencional — testar com HTTPS local é complexo desnecessariamente
- `sameSite: 'strict'` pode causar problemas se o sistema for acessado via redirect de outro domínio (ex.: OAuth, pagamentos). Para este projeto não há esse caso de uso.

## Resultado esperado

- Em produção (`NODE_ENV=production`): cabeçalho `Set-Cookie` inclui `HttpOnly; Secure; SameSite=Strict`
- Em desenvolvimento/teste: cabeçalho `Set-Cookie` inclui `HttpOnly; SameSite=Strict` (sem `Secure`)
- Sessão expira após 8 horas
- `npm run check` passa

## Critério de aceite

- `app.js` tem chave `cookie` no bloco `session({...})` com `httpOnly`, `secure`, `sameSite` e `maxAge`
- `secure` usa `process.env.NODE_ENV === 'production'` (não hardcoded)
- `maxAge` é `8 * 60 * 60 * 1000` (legível) ou o valor calculado equivalente `28800000`
