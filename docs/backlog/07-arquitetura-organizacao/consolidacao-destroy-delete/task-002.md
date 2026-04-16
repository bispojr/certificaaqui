# ARQ-DEL-002 — Atualizar callers: `eventoSSRController` e `eventoController`

## Identificador

ARQ-DEL-002

## Feature

consolidacao-destroy-delete

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

ALTA

## Pré-requisitos

- ARQ-DEL-001 implementado (`eventoService.softDelete` existe e `delete` foi removido)

## Descrição

Atualizar as duas ocorrências de `eventoService.delete(...)` nos controllers para `eventoService.softDelete(...)`.

---

## Alterações necessárias

### 1. `src/controllers/eventoSSRController.js` — linha 108

**Antes:**

```js
await eventoService.delete(req.params.id)
```

**Depois:**

```js
await eventoService.softDelete(req.params.id)
```

### 2. `src/controllers/eventoController.js` — linha 47

**Antes:**

```js
await eventoService.delete(req.params.id)
```

**Depois:**

```js
await eventoService.softDelete(req.params.id)
```

---

## Verificação adicional

Fazer grep em todo o codebase por `eventoService.delete` e `eventoService.destroy` para confirmar que não restam outras chamadas após as duas substituições acima:

```
grep -r "eventoService\.delete\|eventoService\.destroy" src/ tests/
```

Se encontrar ocorrências adicionais, substituir da mesma forma.

---

## Critérios de aceite

- [ ] Nenhuma ocorrência de `eventoService.delete(` em `src/`.
- [ ] Nenhuma ocorrência de `eventoService.destroy(` em `src/`.
- [ ] `eventoSSRController.js` chama `eventoService.softDelete(req.params.id)`.
- [ ] `eventoController.js` chama `eventoService.softDelete(req.params.id)`.

## Estimativa

PP (até 10min)
