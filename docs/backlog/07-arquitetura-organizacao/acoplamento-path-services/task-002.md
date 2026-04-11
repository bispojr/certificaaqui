# ARQ-PATH-002 — Corrigir path `require` nos demais services e verificar controllers SSR

## Identificador
ARQ-PATH-002

## Feature
acoplamento-path-services

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
MÉDIA

## Pré-requisitos
- ARQ-PATH-001 implementado (para garantir que o padrão está correto e testado antes de aplicar nos demais)

## Descrição

Corrigir o path `'../../src/models'` para `'../models'` nos demais services e verificar se `certificadoSSRController.js` contém `require()` inline.

---

## Alterações necessárias

### 1. `src/services/participanteService.js`

Linha 2 atual:
```js
const { Participante } = require('../../src/models')
```
Corrigir para:
```js
const { Participante } = require('../models')
```

### 2. `src/services/certificadoService.js`

Linha 2 atual:
```js
const { Certificado, TiposCertificados, Evento } = require('../../src/models')
```
Corrigir para:
```js
const { Certificado, TiposCertificados, Evento } = require('../models')
```

### 3. `src/services/tiposCertificadosService.js`

Linha 2 atual:
```js
const { TiposCertificados } = require('../../src/models')
```
Corrigir para:
```js
const { TiposCertificados } = require('../models')
```

### 4. Verificar `src/controllers/certificadoSSRController.js`

Fazer grep por `require(` dentro do corpo das funções (não no topo). Verificar especificamente se existe:
```js
const templateService = require('../services/templateService')
```
ou similar dentro da função `detalhe`.

Se encontrado: mover para o topo do arquivo.

---

## Observação sobre funcionalidade

O path `'../../src/models'` funcionava anteriormente porque o Node.js resolve o módulo corretamente a partir de `src/services/` (desce até a raiz do pacote e reentra em `src/`). A correção para `'../models'` torna o path semanticamente correto e mais resistente a refatorações de diretório.

---

## Critérios de aceite

- [ ] `participanteService.js`, `certificadoService.js` e `tiposCertificadosService.js` usam `require('../models')`.
- [ ] Nenhum `require()` inline encontrado em `certificadoSSRController.js` (ou movido se encontrado).
- [ ] `npm run check` passa sem erros após todas as correções.

## Estimativa
PP (até 20min)
