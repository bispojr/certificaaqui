# TASK ID: BACK-REQ-001

## Título

Corrigir path `../../src/models` para `../models` nos três services com import incorreto

## Tipo

código

## Dependências

nenhuma (independente de BACK-EVT-001 — services diferentes)

## Objetivo

Substituir o path de import `../../src/models` por `../models` em `participanteService.js`, `certificadoService.js` e `tiposCertificadosService.js`. O path correto de `src/services/` para `src/models/` é um nível acima (`../models`).

## Contexto

Os três services se encontram em `src/services/`. Os models estão em `src/models/`. O path relativo correto é `../models` (subir um nível da pasta `services`, entrar em `models`).

O path atual `../../src/models` funciona porque vai: `src/services/` → `src/` → raiz → `src/models/`. Isso é frágil: se o projeto for reorganizado (ex.: services movidos para `src/api/services/`), o path silenciosamente quebraria.

## Arquivos envolvidos

- `src/services/participanteService.js` ← alterar linha 2
- `src/services/certificadoService.js` ← alterar linha 2
- `src/services/tiposCertificadosService.js` ← alterar linha 2

## Passos

Para cada arquivo, localizar a linha:
```js
const { ... } = require('../../src/models')
```
e substituir por:
```js
const { ... } = require('../models')
```

Manter os nomes dos símbolos importados (conteúdo das chaves `{ ... }`) exatamente iguais — apenas o path muda.

### `participanteService.js`
```js
// Antes:
const { Participante } = require('../../src/models')
// Depois:
const { Participante } = require('../models')
```

### `certificadoService.js`
```js
// Antes:
const { Certificado, TiposCertificados, Evento } = require('../../src/models')
// Depois:
const { Certificado, TiposCertificados, Evento } = require('../models')
```

### `tiposCertificadosService.js`
```js
// Antes:
const { TiposCertificados } = require('../../src/models')
// Depois:
const { TiposCertificados } = require('../models')
```

## Resultado esperado

- `grep -r "require('../../src/models')" src/services/` retorna zero resultados (exceto `eventoService.js` se BACK-EVT-001 ainda não foi aplicada)
- Todos os testes que dependem desses services continuam passando (os paths funcionais são equivalentes — apenas a representação muda)
- `npm run check` passa

## Critério de aceite

- Os três arquivos agora usam `require('../models')` na primeira linha após os imports de libs externas
- Nenhum comportamento ou resultado de função é alterado
