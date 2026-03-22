# TASK ID: ADMIN-EVT-001

## Título

Corrigir bugs de cascata em `eventoService.delete` e `eventoService.restore`

## Objetivo

Substituir `UsuarioEvento.update({ deleted_at })` por `UsuarioEvento.destroy(...)` no método `delete`, e adicionar `UsuarioEvento.restore(...)` no método `restore` para que ambos respeitem o mecanismo `paranoid` do Sequelize.

## Contexto

- `src/services/eventoService.js` linhas 29-35: `delete` usa `UsuarioEvento.update({ deleted_at: new Date() }, { where: { evento_id: id } })` — bypass manual do paranoid; registros em `usuario_eventos` ficam com `deleted_at` setado mas Sequelize não os reconhece como soft-deletados via `restore()`
- `src/services/eventoService.js` linhas 37-41: `restore` só restaura o `Evento`, deixando registros em `usuario_eventos` com `deleted_at` preenchido → relação N:N quebrada após restore
- `src/models/usuario_eventos.js` tem `paranoid: true` — `UsuarioEvento.destroy` e `UsuarioEvento.restore` funcionam corretamente

## Arquivos envolvidos

- `src/services/eventoService.js`

## Passos

### 1. Corrigir `delete`:

Substituir o bloco atual:

```js
async delete(id) {
  // Soft delete do evento
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  // Soft delete das associações N:N
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.update(
    { deleted_at: new Date() },
    { where: { evento_id: id } },
  )
  return evento
},
```

Por:

```js
async delete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},
```

### 2. Corrigir `restore`:

Substituir o bloco atual:

```js
async restore(id) {
  const evento = await Evento.findByPk(id, { paranoid: false })
  if (!evento) return null
  return evento.restore()
},
```

Por:

```js
async restore(id) {
  const evento = await Evento.findByPk(id, { paranoid: false })
  if (!evento) return null
  await evento.restore()
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.restore({ where: { evento_id: id } })
  return evento
},
```

## Resultado esperado

- Após `eventoService.delete(id)`, registros em `usuario_eventos` são soft-deletados via Sequelize paranoid (campo `deleted_at` preenchido pelo ORM)
- Após `eventoService.restore(id)`, registros em `usuario_eventos` voltam com `deleted_at = null`

## Critério de aceite

- `eventoService.delete` NÃO usa `UsuarioEvento.update` com `deleted_at` manual
- `eventoService.restore` chama `UsuarioEvento.restore` após restaurar o evento
- `npm run check` passa (os testes existentes quebrarão — serão corrigidos em ADMIN-EVT-002)
