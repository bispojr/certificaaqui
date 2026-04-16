# ARQ-ESC-001 — Criar `src/utils/getScopedEventoIds.js`

## Identificador

ARQ-ESC-001

## Feature

helper-escopo-evento

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

ALTA

## Pré-requisitos

- Nenhum

## Descrição

Criar o arquivo utilitário `src/utils/getScopedEventoIds.js` com a função centralizada de escopo de evento.

---

## Arquivo a criar

**`src/utils/getScopedEventoIds.js`**

```js
'use strict'

const { UsuarioEvento } = require('../models')

/**
 * Retorna null para perfil admin (sem filtro de escopo).
 * Retorna array de evento_ids para gestor/monitor.
 * Retorna array vazio [] se o usuário não tiver eventos vinculados.
 *
 * @param {{ id: number, perfil: string }} usuario - objeto do usuário autenticado
 * @returns {Promise<null | number[]>}
 */
async function getScopedEventoIds(usuario) {
  if (!usuario || usuario.perfil === 'admin') return null

  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: usuario.id },
    attributes: ['evento_id'],
  })

  return associacoes.map((a) => a.evento_id)
}

module.exports = { getScopedEventoIds }
```

**Notas de implementação:**

- `attributes: ['evento_id']` garante SELECT mínimo (sem `created_at`, `updated_at`, etc.)
- Arquivo em `src/utils/` — mesma convenção de `simpleCache.js` (PERF-CACHE-001)
- `require('../models')` é o path correto a partir de `src/utils/`

---

## Critérios de aceite

- [ ] `src/utils/getScopedEventoIds.js` existe e exporta `getScopedEventoIds`.
- [ ] `getScopedEventoIds(null)` retorna `null` (sem erro).
- [ ] `getScopedEventoIds({ perfil: 'admin', id: 1 })` retorna `null`.
- [ ] `getScopedEventoIds({ perfil: 'gestor', id: 5 })` executa `UsuarioEvento.findAll({ where: { usuario_id: 5 } })` e retorna array de IDs.
- [ ] Quando não há registros em `usuario_eventos` para o usuário, retorna `[]`.

## Estimativa

PP (até 20min)
