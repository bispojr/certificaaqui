# TASK ID: MON-ZOD-001

## Título

Aplicar `validate` + `tiposCertificadosSchema` em `src/routes/tipos-certificados.js`

## Objetivo

Adicionar validação Zod nas rotas `POST /` e `PUT /:id` de tipos-certificados, que atualmente não fazem nenhuma validação de entrada antes de chamar o controller.

## Contexto

- `middleware/validate.js` exporta `(schema) => (req, res, next)` — responde 400 com `{ error, detalhes }` em caso de erro Zod
- `src/validators/tipos_certificados.js` exporta `tiposCertificadosSchema` com campos: `codigo`, `descricao`, `campo_destaque`, `texto_base`, `dados_dinamicos`
- Padrão dos outros arquivos de rota: `validate(schema)` é inserido entre `rbac(...)` e o controller
- O import de `validate` usa o módulo legado `../../middleware/validate` (padrão atual de todas as rotas)

## Arquivo envolvido

- `src/routes/tipos-certificados.js` ← EDITAR

## Passos

### 1. Adicionar imports (logo após o import de `auth` na linha 4)

```js
const validate = require('../../middleware/validate')
const tiposCertificadosSchema = require('../validators/tipos_certificados')
```

### 2. Atualizar `router.post('/', ...)` — inserir `validate(tiposCertificadosSchema)` antes do controller

**Antes:**

```js
router.post(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.create,
)
```

**Depois:**

```js
router.post(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  validate(tiposCertificadosSchema),
  tiposCertificadosController.create,
)
```

### 3. Atualizar `router.put('/:id', ...)` — inserir `validate(tiposCertificadosSchema)` antes do controller

**Antes:**

```js
router.put(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.update,
)
```

**Depois:**

```js
router.put(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  validate(tiposCertificadosSchema),
  tiposCertificadosController.update,
)
```

## Critério de aceite

- `POST /tipos-certificados` com `codigo: "ABC"` (3 letras) retorna 400 com `detalhes`
- `POST /tipos-certificados` com `codigo: "AB"` e campos obrigatórios → chega ao controller
- `PUT /tipos-certificados/:id` com `descricao: ""` retorna 400
- `npm run check` passa sem regressões
