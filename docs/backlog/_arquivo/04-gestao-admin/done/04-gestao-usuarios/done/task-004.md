# TASK ID: ADMIN-USR-004

## Título

Adicionar rotas SSR de Usuários em `src/routes/admin.js` com `rbac('admin')`

## Objetivo

Registrar as 7 rotas SSR de usuários no router admin, protegidas exclusivamente por `rbac('admin')` (gestor e monitor não podem gerenciar usuários).

## Contexto

- `src/routes/admin.js` já existe após ADMIN-EVT-005 (rotas de eventos) e ADMIN-TIPOS-005 (rotas de tipos)
- `rbac('admin')` bloqueia `gestor` e `monitor` — apenas `admin` acessa
- Controller: `src/controllers/usuarioSSRController.js` (criado em ADMIN-USR-001)
- Padrão de URL: `/admin/usuarios/...`
- `/novo` deve ser declarado antes de `/:id/editar` para evitar conflito de rota

## Arquivos envolvidos

- `src/routes/admin.js` ← MODIFICAR (adicionar import + 7 rotas)

## Passos

### 1. Adicionar import no topo de `src/routes/admin.js`

Após os outros imports de controllers, adicionar:

```js
const usuarioSSRController = require('../controllers/usuarioSSRController')
```

### 2. Adicionar bloco de rotas no final do arquivo, antes de `module.exports`

```js
// Usuários
router.get('/usuarios', rbac('admin'), usuarioSSRController.index)
router.get('/usuarios/novo', rbac('admin'), usuarioSSRController.novo)
router.post('/usuarios', rbac('admin'), usuarioSSRController.criar)
router.get('/usuarios/:id/editar', rbac('admin'), usuarioSSRController.editar)
router.post('/usuarios/:id', rbac('admin'), usuarioSSRController.atualizar)
router.post(
  '/usuarios/:id/deletar',
  rbac('admin'),
  usuarioSSRController.deletar,
)
router.post(
  '/usuarios/:id/restaurar',
  rbac('admin'),
  usuarioSSRController.restaurar,
)
```

## Resultado esperado

`src/routes/admin.js` exporta router com rotas de eventos + tipos-certificados + usuários.

## Critério de aceite

- `GET /admin/usuarios` chama `usuarioSSRController.index` protegido por `rbac('admin')`
- `GET /admin/usuarios/novo` não é capturado por `/:id/editar`
- Gestor acessando `/admin/usuarios` recebe 403
- Nenhuma rota existente (eventos, tipos-certificados) é alterada

## Metadados

- Completado em: 04/04/2026 17:50 ✅
