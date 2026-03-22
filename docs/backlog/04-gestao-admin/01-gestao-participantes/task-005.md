# TASK ID: ADMIN-PART-005

## Título
Adicionar rotas SSR de participantes em `src/routes/admin.js`

## Objetivo
Importar `participanteSSRController` em `src/routes/admin.js` e registrar as 7 rotas de CRUD SSR de participantes, protegidas por `authSSR` (já aplicado via `router.use` no arquivo).

## Contexto
- `src/routes/admin.js` existe desde TASK-031-C com `router.use(authSSR)` e rotas de dashboard e eventos
- `src/controllers/participanteSSRController.js` deve existir (criado em ADMIN-PART-002)
- Não é necessário importar `rbac` individualmente — participantes são acessíveis a todos os perfis autenticados (admin, gestor, monitor)
- Rotas a adicionar: GET index, GET novo, GET editar, POST criar, POST atualizar, POST deletar, POST restaurar

## Arquivos envolvidos
- `src/routes/admin.js`

## Passos

### 1. Adicionar import no topo do arquivo, após os `require` existentes:
```js
const participanteSSRController = require('../controllers/participanteSSRController')
```

### 2. Adicionar bloco de rotas após as rotas de eventos (ou após `router.get('/dashboard', ...)`):
```js
// Gestão de participantes (todos os perfis autenticados)
router.get('/participantes', participanteSSRController.index)
router.get('/participantes/novo', participanteSSRController.novo)
router.get('/participantes/:id/editar', participanteSSRController.editar)
router.post('/participantes', participanteSSRController.criar)
router.post('/participantes/:id', participanteSSRController.atualizar)
router.post('/participantes/:id/deletar', participanteSSRController.deletar)
router.post('/participantes/:id/restaurar', participanteSSRController.restaurar)
```

**ATENÇÃO:** A rota `GET /participantes/:id/editar` deve ser declarada ANTES de qualquer rota `GET /participantes/:id` genérica, para evitar conflito de parâmetros.

## Resultado esperado
- `GET /admin/participantes` sem cookie → redireciona para `/auth/login`
- `GET /admin/participantes` com cookie válido (qualquer perfil) → renderiza listagem
- `POST /admin/participantes` com dados válidos → cria e redireciona com flash success
- `POST /admin/participantes/:id/deletar` → soft delete e redireciona

## Critério de aceite
- 7 rotas adicionadas no arquivo sem duplicar a linha `router.use(authSSR)`
- Rota de edição declarada antes de qualquer rota genérica `/:id`
- Nenhuma rota existente (dashboard, eventos) foi alterada
