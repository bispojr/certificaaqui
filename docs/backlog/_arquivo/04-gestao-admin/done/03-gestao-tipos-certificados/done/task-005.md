# TASK ID: ADMIN-TIPOS-005

## Título

Adicionar rotas SSR de Tipos de Certificados em `src/routes/admin.js`

## Objetivo

Registrar as 7 rotas SSR de tipos de certificados no router admin, protegidas por `rbac('gestor')`.

## Contexto

- `src/routes/admin.js` **já existe** após ADMIN-EVT-005 (que cria o arquivo com as rotas de eventos)
- `rbac` middleware: `require('../middlewares/rbac')` — `rbac('gestor')` libera `gestor` e `admin`, bloqueia `monitor`
- Controller: `src/controllers/tiposCertificadosSSRController.js` (criado em ADMIN-TIPOS-002)
- Rotas SSR de tipos seguem o padrão `/admin/tipos-certificados/...`
- Nenhum arquivo novo é criado — apenas `src/routes/admin.js` é modificado

## Arquivos envolvidos

- `src/routes/admin.js` ← MODIFICAR (adicionar import + 7 rotas)

## Passos

### 1. Adicionar import no topo de `src/routes/admin.js`

Após os outros imports de controllers, adicionar:

```js
const tiposCertificadosSSRController = require('../controllers/tiposCertificadosSSRController')
```

### 2. Adicionar bloco de rotas após as rotas de eventos

```js
// Tipos de Certificados
router.get(
  '/tipos-certificados',
  rbac('gestor'),
  tiposCertificadosSSRController.index,
)
router.get(
  '/tipos-certificados/novo',
  rbac('gestor'),
  tiposCertificadosSSRController.novo,
)
router.post(
  '/tipos-certificados',
  rbac('gestor'),
  tiposCertificadosSSRController.criar,
)
router.get(
  '/tipos-certificados/:id/editar',
  rbac('gestor'),
  tiposCertificadosSSRController.editar,
)
router.post(
  '/tipos-certificados/:id',
  rbac('gestor'),
  tiposCertificadosSSRController.atualizar,
)
router.post(
  '/tipos-certificados/:id/deletar',
  rbac('gestor'),
  tiposCertificadosSSRController.deletar,
)
router.post(
  '/tipos-certificados/:id/restaurar',
  rbac('gestor'),
  tiposCertificadosSSRController.restaurar,
)
```

**Atenção à ordem das rotas:** `/tipos-certificados/novo` deve ser declarado **antes** de `/tipos-certificados/:id/editar` para que o segmento `novo` não seja capturado como `:id`.

## Resultado esperado

`src/routes/admin.js` exporta o router com todas as rotas de eventos (já existentes) + 7 novas rotas de tipos de certificados.

## Critério de aceite

- `GET /admin/tipos-certificados` chama `tiposCertificadosSSRController.index` protegido por `rbac('gestor')`
- `GET /admin/tipos-certificados/novo` NÃO é capturado como `/:id/editar`
- `POST /admin/tipos-certificados/:id/deletar` e `/:id/restaurar` funcionam corretamente
- Nenhuma rota de eventos é alterada

## Metadados

- Completado em: 04/04/2026 08:43 (BRT) ✅
