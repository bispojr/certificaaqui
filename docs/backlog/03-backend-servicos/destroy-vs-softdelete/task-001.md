# TASK ID: BACK-EVT-001

## Título

Refatorar `eventoService.js`: renomear `delete` → `softDelete`, remover `destroy` e corrigir requires inline

## Tipo

código

## Dependências

nenhuma

## Objetivo

Aplicar as três alterações em `src/services/eventoService.js`:
1. Renomear `delete()` para `softDelete()`
2. Remover o método `destroy()` do módulo exportado
3. Mover os `require()` inline de `delete()` e `restore()` para o topo do arquivo com path correto

## Contexto

`eventoService.js` atual (`src/services/eventoService.js` lido diretamente):

```js
const { Evento } = require('../../src/models')   // ← path errado (deveria ser ../models)

module.exports = {
  // ... findAll, findById, create, update ...
  async destroy(id) {                            // ← método a remover
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    return evento.destroy()
  },
  async delete(id) {                             // ← renomear para softDelete
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    await evento.destroy()
    const { UsuarioEvento } = require('../../src/models')  // ← inline a mover
    await UsuarioEvento.destroy({ where: { evento_id: id } })
    return evento
  },
  async restore(id) {
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    await evento.restore()
    const { UsuarioEvento } = require('../../src/models')  // ← inline a mover
    await UsuarioEvento.restore({ where: { evento_id: id } })
    return evento
  },
}
```

## Arquivos envolvidos

- `src/services/eventoService.js` ← alterar

## Passos

### 1. Corrigir o require do topo

```js
// Antes:
const { Evento } = require('../../src/models')

// Depois:
const { Evento, UsuarioEvento } = require('../models')
```

### 2. Remover o método `destroy()`

Apagar todo o bloco `async destroy(id) { ... }` do objeto exportado.

### 3. Renomear `delete()` para `softDelete()` e remover require inline

```js
// Antes:
async delete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},

// Depois:
async softDelete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},
```

### 4. Remover require inline de `restore()`

```js
// Antes:
async restore(id) {
  const evento = await Evento.findByPk(id, { paranoid: false })
  if (!evento) return null
  await evento.restore()
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.restore({ where: { evento_id: id } })
  return evento
},

// Depois:
async restore(id) {
  const evento = await Evento.findByPk(id, { paranoid: false })
  if (!evento) return null
  await evento.restore()
  await UsuarioEvento.restore({ where: { evento_id: id } })
  return evento
},
```

## Resultado esperado

- `grep "require" src/services/eventoService.js` retorna apenas 1 linha (o import do topo)
- `grep "destroy" src/services/eventoService.js` retorna apenas as chamadas a método em instâncias (`.destroy()`) e `UsuarioEvento.destroy(...)` — não um método exportado chamado `destroy`
- O módulo exporta: `findAll`, `findById`, `create`, `update`, `softDelete`, `restore`
- `npm run check` pode falhar até BACK-EVT-002 e BACK-EVT-003 serem aplicadas

## Critério de aceite

- Arquivo tem exatamente 1 `require` no topo com path `../models`
- Não há método `destroy` no `module.exports`
- Há método `softDelete` no `module.exports` com a lógica de cascata em `UsuarioEvento`
- `restore` não tem `require` inline
