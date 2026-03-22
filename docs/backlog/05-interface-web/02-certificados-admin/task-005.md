# TASK ID: CERT-ADMIN-005

## Título
Adicionar rotas SSR de certificados em `src/routes/admin.js`

## Objetivo
Registrar as 8 rotas SSR de certificados no router admin com proteção por `rbac`.

## Contexto
- `src/routes/admin.js` já existe desde ADMIN-EVT-005
- Proteção por perfil:
  - `GET` (listagem, detalhe): `rbac('monitor')` — todos os perfis autenticados
  - `GET /novo`, `GET /:id/editar`, `POST /`, `POST /:id`, `POST /:id/cancelar`: `rbac('gestor')`
  - `POST /:id/restaurar`: `rbac('admin')` — apenas admin pode restaurar arquivados
- Controller: `src/controllers/certificadoSSRController.js` (criado em CERT-ADMIN-001)
- Atenção à ordem: `/novo` antes de `/:id`; `/cancelar` e `/restaurar` antes de `/:id` genérico

## Arquivos envolvidos
- `src/routes/admin.js` ← MODIFICAR (adicionar import + 8 rotas)

## Passos

### 1. Adicionar import no topo de `src/routes/admin.js`
```js
const certificadoSSRController = require('../controllers/certificadoSSRController')
```

### 2. Adicionar bloco de rotas antes de `module.exports`
```js
// Certificados
router.get('/certificados', rbac('monitor'), certificadoSSRController.index)
router.get('/certificados/novo', rbac('gestor'), certificadoSSRController.novo)
router.post('/certificados', rbac('gestor'), certificadoSSRController.criar)
router.get('/certificados/:id', rbac('monitor'), certificadoSSRController.detalhe)
router.get('/certificados/:id/editar', rbac('gestor'), certificadoSSRController.editar)
router.post('/certificados/:id', rbac('gestor'), certificadoSSRController.atualizar)
router.post('/certificados/:id/cancelar', rbac('gestor'), certificadoSSRController.cancelar)
router.post('/certificados/:id/restaurar', rbac('admin'), certificadoSSRController.restaurar)
```

**Atenção à ordem das rotas:**
- `/certificados/novo` declarado **antes** de `/certificados/:id` para não capturar "novo" como id
- `/certificados/:id/cancelar` e `/certificados/:id/restaurar` declarados **antes** de `/certificados/:id` (POST genérico de atualização)

## Resultado esperado
Router admin com rotas de dashboard + eventos + tipos + usuários + certificados.

## Critério de aceite
- `GET /admin/certificados` acessível por monitor, gestor e admin
- `POST /admin/certificados/:id/cancelar` bloqueado para monitor (403)
- `POST /admin/certificados/:id/restaurar` bloqueado para gestor e monitor (403)
- `GET /admin/certificados/novo` não é capturado como `/:id`
- Nenhuma rota existente é alterada
