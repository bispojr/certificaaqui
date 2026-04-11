# TASK ID: BACK-REQ-002

## Título

Mover os dois `require()` inline de `certificadoSSRController.js` para o topo do arquivo

## Tipo

código

## Dependências

nenhuma

## Objetivo

Remover os dois `require()` invocados dentro de funções em `certificadoSSRController.js` e promovê-los ao topo do arquivo, seguindo o padrão de todos os outros controllers do projeto.

## Contexto

Dois `require()` inline confirmados via grep:

**Linha 42** — dentro da função `index()`:
```js
where: { ...where, deleted_at: { [require('sequelize').Op.ne]: null } },
```

Este require de `sequelize` já está disponível indiretamente (Sequelize é carregado pelos models), mas nenhum `Op` está importado no topo. Corrigir adicionando `const { Op } = require('sequelize')` no topo e substituindo o inline.

**Linha 74** — dentro da função `detalhe()`:
```js
const templateService = require('../services/templateService')
```

Este require é feito dentro do corpo da função a cada chamada. Como os modules do Node.js são cacheados, isso não causa recarregamento, mas impede mock em testes e é contrário à convenção do projeto.

## Arquivos envolvidos

- `src/controllers/certificadoSSRController.js` ← alterar topo + linhas 42 e 74

## Passos

### 1. Adicionar imports no topo do arquivo

Localizar o bloco de imports no início do arquivo:
```js
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  UsuarioEvento,
} = require('../models')
const certificadoService = require('../services/certificadoService')
```

Adicionar as duas novas linhas após os imports existentes:
```js
const { Op } = require('sequelize')
const templateService = require('../services/templateService')
```

O topo do arquivo deve ficar:
```js
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  UsuarioEvento,
} = require('../models')
const certificadoService = require('../services/certificadoService')
const { Op } = require('sequelize')
const templateService = require('../services/templateService')
```

### 2. Substituir o `require('sequelize').Op.ne` inline na linha 42

```js
// Antes:
where: { ...where, deleted_at: { [require('sequelize').Op.ne]: null } },

// Depois:
where: { ...where, deleted_at: { [Op.ne]: null } },
```

### 3. Remover o `const templateService = require(...)` inline na linha 74

```js
// Antes (dentro de detalhe()):
const templateService = require('../services/templateService')
const textoInterpolado = templateService.interpolate(

// Depois (o require foi removido — templateService já está no topo):
const textoInterpolado = templateService.interpolate(
```

## Resultado esperado

- `grep -n "require" src/controllers/certificadoSSRController.js` retorna apenas as linhas do bloco de imports no topo
- A função `detalhe()` continua chamando `templateService.interpolate()` normalmente
- A função `index()` continua usando `Op.ne` para filtrar soft-deleted
- `npm run check` passa

## Critério de aceite

- Nenhum `require()` dentro do corpo de funções no arquivo
- `Op` importado do topo via `require('sequelize')`
- `templateService` importado do topo
- Comportamento das funções `index()` e `detalhe()` inalterado
