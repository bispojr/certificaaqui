# ARQ-PATH-001 — Corrigir `eventoService.js`: mover `require` inline para o topo e corrigir path

## Identificador

ARQ-PATH-001

## Feature

acoplamento-path-services

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

MÉDIA

## Pré-requisitos

- Nenhum (independente de outras tasks)

## Descrição

Corrigir `src/services/eventoService.js`:

1. Mover `UsuarioEvento` para o import do topo junto com `Evento`
2. Corrigir o path de `'../../src/models'` para `'../models'`
3. Remover as duas ocorrências de `require()` inline nas funções `delete` e `restore`

---

## Alterações necessárias

### `src/services/eventoService.js`

**Antes (linhas 1–2):**

```js
// Service para lógica de negócio de Evento
const { Evento } = require('../../src/models')
```

**Depois:**

```js
'use strict'
// Service para lógica de negócio de Evento
const { Evento, UsuarioEvento } = require('../models')
```

**Remover linha 41** (dentro da função `delete`):

```js
const { UsuarioEvento } = require('../../src/models')
```

**Remover linha 49** (dentro da função `restore`):

```js
const { UsuarioEvento } = require('../../src/models')
```

---

## Resultado esperado

```js
'use strict'
// Service para lógica de negócio de Evento
const { Evento, UsuarioEvento } = require('../models')

module.exports = {
  // ...
  async delete(id) {
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    await evento.destroy()
    await UsuarioEvento.destroy({ where: { evento_id: id } }) // usa import do topo
    return evento
  },
  async restore(id) {
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    await evento.restore()
    await UsuarioEvento.restore({ where: { evento_id: id } }) // usa import do topo
    return evento
  },
}
```

---

## Critérios de aceite

- [ ] `eventoService.js` usa `require('../models')` no topo (não `'../../src/models'`).
- [ ] `UsuarioEvento` importado no topo junto com `Evento`.
- [ ] Nenhuma ocorrência de `require()` fora do topo em `eventoService.js`.
- [ ] Testes existentes de `eventoService` passam sem alteração.

## Estimativa

PP (até 15min)
