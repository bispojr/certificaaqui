# Feature: Testes de Sessão com Store Persistente

## Identificador da feature
testes-sessao-persistente

## Domínio
08 — Testes

## Prioridade
MÉDIA

## Situação real

Configuração atual de sessão em `app.js` (linhas 47–51):

```javascript
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
)
```

**Problemas identificados na configuração atual:**

| Parâmetro | Estado atual | Estado esperado (após SEG-SES-002) |
|---|---|---|
| `store` | `MemoryStore` (padrão) | `connect-pg-simple` |
| `cookie.httpOnly` | não declarado (Express default: `true`) | `true` explícito e testado |
| `cookie.secure` | não declarado | `true` em produção, `false` em teste |
| `cookie.sameSite` | não declarado | `'strict'` |
| `cookie.maxAge` | não declarado (sessão expira ao fechar browser) | `28800000` (8h) |

**Cobertura existente em `tests/routes/authSSR.test.js`:**

- `set-cookie` é verificado como definido (linha 38) — mas apenas para o cookie `token=`
- Nenhum teste verifica atributos do cookie (`HttpOnly`, `Secure`, `SameSite`)
- Nenhum teste verifica comportamento do store após reconexão

---

## Escopo desta feature

1. **task-001**: Teste de integração — sessão permanece válida após simulação de reinicialização do store
2. **task-002**: Teste — `cookie.httpOnly: true` está presente nos cabeçalhos de resposta do login
3. **task-003**: Teste — `cookie.secure` ausente em `NODE_ENV=test`, presente em `NODE_ENV=production`

---

## Dependência principal

Os testes desta feature só passam após implementação de **SEG-SES-001/002/003** (feature `sessoes-persistentes` do Domínio 2), que:
- Substitui `MemoryStore` por `connect-pg-simple`
- Adiciona os atributos `httpOnly`, `secure`, `sameSite`, `maxAge` ao cookie
