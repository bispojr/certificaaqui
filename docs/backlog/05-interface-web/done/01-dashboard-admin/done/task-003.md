# TASK ID: DASH-003

## Título

Adicionar rota `GET /admin/dashboard` em `src/routes/admin.js`

## Objetivo

Registrar a rota do dashboard no router admin, garantindo que seja a rota raiz do painel (acessada por `GET /admin/dashboard`) e protegida por `authSSR`.

## Contexto

- `src/routes/admin.js` é criado por ADMIN-EVT-005 com as rotas de eventos
- O arquivo já importa `authSSR` como middleware global do router (`router.use(authSSR)`)
- `dashboardController` é novo import a acrescentar
- Rota raiz `/` no router admin equivale a `GET /admin/` quando montado em `/admin`
- A navbar em `admin.hbs` usa `href='/admin/dashboard'` — então a rota deve ser `/dashboard`

## Arquivos envolvidos

- `src/routes/admin.js` ← MODIFICAR (adicionar import + 1 rota)

## Passos

### 1. Adicionar import no topo de `src/routes/admin.js`

Após os outros imports de controllers:

```js
const dashboardController = require('../controllers/dashboardController')
```

### 2. Adicionar rota antes das demais, logo após `router.use(authSSR)`

```js
// Dashboard
router.get('/dashboard', dashboardController.dashboard)
```

**Atenção:** A rota `/dashboard` não precisa de `rbac` próprio — `authSSR` global já garante que apenas usuários autenticados acessam o router admin. O controller adapta o conteúdo ao perfil.

## Resultado esperado

`GET /admin/dashboard` chama `dashboardController.dashboard` com `req.usuario` populado por `authSSR`.

## Critério de aceite

- Rota `/dashboard` declarada antes das rotas específicas de entidades
- Nenhum `rbac()` adicional (todos os perfis autenticados acessam o dashboard)
- Nenhuma rota existente (eventos, tipos-certificados, usuários) é alterada

## Metadados

- Completado em: 2026-03-26 08:26 (BRT) ✅
