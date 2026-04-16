# PERF-CACHE-001 — Módulo `simpleCache` e cache das queries de filtro em certificados

## Identificador

PERF-CACHE-001

## Feature

cache-filtros

## Domínio

05 — Performance e Escalabilidade

## Prioridade

MÉDIA

## Pré-requisitos

- Nenhum (pode ser implementado independentemente de PERF-PAG-\*)

## Descrição

Criar o módulo utilitário `src/utils/simpleCache.js` e aplicá-lo em `certificadoSSRController.js` para cachear as duas queries de metadados que populam os selects de filtro da listagem (`Evento.findAll` e `TiposCertificados.findAll`).

---

## Alterações necessárias

### 1. Criar `src/utils/simpleCache.js`

```js
'use strict'

const _cache = new Map()

function get(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key)
    return null
  }
  return entry.data
}

function set(key, data, ttlMs) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

function invalidate(key) {
  _cache.delete(key)
}

// Expõe o Map interno apenas para testes (não usar em produção)
function _clear() {
  _cache.clear()
}

module.exports = { get, set, invalidate, _clear }
```

**Notas:**

- `_clear()` é exportado exclusivamente para uso em `beforeEach` de testes — prefixo `_` sinaliza uso interno.
- O módulo é singleton (o `Map` vive no escopo do módulo); comportamento correto para cache em processo único.

---

### 2. Modificar `src/controllers/certificadoSSRController.js`

Adicionar ao topo do arquivo:

```js
const simpleCache = require('../utils/simpleCache')
const FILTRO_TTL = 60_000
```

Substituir as chamadas diretas `Evento.findAll(...)` e `TiposCertificados.findAll(...)` dentro de `index()` por funções auxiliares no escopo do módulo:

```js
async function getEventosParaFiltro() {
  const key = 'eventos:filtro'
  const cached = simpleCache.get(key)
  if (cached) return cached
  const data = await Evento.findAll({
    attributes: ['id', 'nome'],
    order: [['nome', 'ASC']],
  })
  simpleCache.set(key, data, FILTRO_TTL)
  return data
}

async function getTiposParaFiltro() {
  const key = 'tipos:filtro'
  const cached = simpleCache.get(key)
  if (cached) return cached
  const data = await TiposCertificados.findAll({
    attributes: ['id', 'nome'],
    order: [['nome', 'ASC']],
  })
  simpleCache.set(key, data, FILTRO_TTL)
  return data
}
```

Dentro de `index()`, substituir as chamadas existentes a `Evento.findAll` e `TiposCertificados.findAll` por `getEventosParaFiltro()` e `getTiposParaFiltro()`.

---

## Critérios de aceite

- [ ] `src/utils/simpleCache.js` existe e exporta `get`, `set`, `invalidate`, `_clear`.
- [ ] `get` retorna `null` para chaves inexistentes.
- [ ] `get` retorna `null` após o TTL expirar (verificar via mock de `Date.now`).
- [ ] `set` armazena o dado e `get` o recupera antes do TTL.
- [ ] `invalidate` remove a entrada e `get` passa a retornar `null`.
- [ ] Em `certificadoSSRController.index()`, `Evento.findAll` e `TiposCertificados.findAll` não são chamadas na segunda request consecutiva (cache hit).
- [ ] O comportamento da listagem de certificados permanece idêntico após a introdução do cache.

## Estimativa

P (até 1h)
