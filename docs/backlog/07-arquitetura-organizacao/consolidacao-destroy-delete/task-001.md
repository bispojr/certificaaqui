# ARQ-DEL-001 — Renomear `delete()` para `softDelete()` e remover `destroy()` público em `eventoService`

## Identificador
ARQ-DEL-001

## Feature
consolidacao-destroy-delete

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
ALTA

## Pré-requisitos
- ARQ-PATH-001 implementado (mover `UsuarioEvento` para o topo e corrigir path — evitar conflito de edição no mesmo arquivo)

## Descrição

Renomear o método `delete()` para `softDelete()` e remover o método `destroy()` do `module.exports` em `src/services/eventoService.js`.

---

## Alterações necessárias

### `src/services/eventoService.js`

**1. Renomear `delete` para `softDelete`:**

```js
// ANTES:
async delete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},

// DEPOIS:
async softDelete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},
```

**2. Remover `destroy` do `module.exports`:**

```js
// REMOVER do module.exports:
async destroy(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  return evento.destroy()
},
```

**Nota:** O método `Evento#destroy()` (método de instância do Sequelize) continua sendo chamado internamente. O que está sendo removido é o método `destroy(id)` do service que ficava exposto publicamente — o qual não faz a cascata em `UsuarioEvento`.

---

## Critérios de aceite

- [ ] `eventoService` exporta `softDelete` (não exporta `delete` nem `destroy`).
- [ ] `eventoService.softDelete(id)` faz `evento.destroy()` e `UsuarioEvento.destroy({ where: { evento_id: id } })`.
- [ ] Chamada a `eventoService.destroy(id)` lança `TypeError: eventoService.destroy is not a function` (confirma que foi removido).

## Estimativa
PP (até 15min)
