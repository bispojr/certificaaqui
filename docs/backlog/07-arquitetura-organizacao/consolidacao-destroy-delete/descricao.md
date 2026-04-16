# Feature: Consolidação entre `destroy` e `delete` no `eventoService`

## Identificador da feature

consolidacao-destroy-delete

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

ALTA

## Problema

`eventoService.js` expõe dois métodos públicos com semânticas divergentes para a mesma operação de soft delete — confirmado via leitura do código real:

```js
// Linha 32 — destroy: soft delete simples, SEM cascata em UsuarioEvento
async destroy(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  return evento.destroy()
},

// Linha 37 — delete: soft delete COM cascata em UsuarioEvento
async delete(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) return null
  await evento.destroy()
  const { UsuarioEvento } = require('../../src/models')
  await UsuarioEvento.destroy({ where: { evento_id: id } })
  return evento
},
```

O controller SSR atual usa `eventoService.delete()` (linha 108 de `eventoSSRController.js`) — o método correto com cascata. O método `destroy()` fica exposto como armadilha para qualquer futuro desenvolvedor que o invoque inadvertidamente.

---

## Estratégia de correção

1. **Renomear** `delete()` para `softDelete()` — explicita a semântica com cascata
2. **Remover** `destroy()` do `module.exports` — deixar de ser uma API pública
   - Alternativa: converter para função interna `_destroy(id)` usada por `softDelete` se necessário — mas a lógica atual de `destroy` é um subset simples de `softDelete`, tornando-a redundante
3. **Atualizar** os callers: `eventoSSRController.js` e `eventoController.js` (API REST)

---

## Escopo desta feature

1. `src/services/eventoService.js` — renomear + remover
2. `src/controllers/eventoSSRController.js` — atualizar chamada
3. `src/controllers/eventoController.js` — verificar e atualizar chamada
4. Testes de `eventoService` — atualizar nomenclatura e validar cascata

---

## Critérios de aceite

- [ ] `eventoService` expõe `softDelete()` e não expõe mais `destroy()` nem `delete()` como métodos públicos.
- [ ] `eventoSSRController` chama `eventoService.softDelete()`.
- [ ] `eventoController` (API REST) chama `eventoService.softDelete()`.
- [ ] Testes de `eventoService` cobrem que `softDelete` faz soft delete em `Evento` E em `UsuarioEvento`.
- [ ] `npm run check` passa sem erros.
