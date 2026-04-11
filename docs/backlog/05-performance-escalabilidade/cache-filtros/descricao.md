# Feature: Redução de Queries por Page Load na Listagem de Certificados

## Identificador da feature
cache-filtros

## Domínio
05 — Performance e Escalabilidade

## Prioridade
MÉDIA

## Problema

`certificadoSSRController.index()` executa entre 5 e 6 queries a cada request:

| # | Query | Frequência de mudança |
|---|-------|-----------------------|
| 1 | escopo de evento do usuário | a cada request (depende do usuário) |
| 2 | `Certificado.findAndCountAll` — ativos | a cada request |
| 3 | `Certificado.findAndCountAll` — arquivados | a cada request |
| 4 | `Evento.findAll()` — select de filtro | raramente muda |
| 5 | `TiposCertificados.findAll()` — select de filtro | raramente muda |

As queries 4 e 5 retornam dados que mudam raramente (somente quando um evento ou tipo é criado/editado/deletado) e são idênticas para todos os usuários. Cachear essas duas queries em memória por um TTL curto elimina 2 das 5-6 queries por request.

---

## Estratégia de solução

### Cache em memória simples (TTL)

Implementar um módulo utilitário `src/utils/simpleCache.js`:

```js
// src/utils/simpleCache.js
const cache = new Map()

function get(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function set(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

function invalidate(key) {
  cache.delete(key)
}

module.exports = { get, set, invalidate }
```

### Uso no controller

```js
const simpleCache = require('../utils/simpleCache')
const TTL = 60_000 // 60 segundos

async function getEventosParaFiltro() {
  const cached = simpleCache.get('eventos:filtro')
  if (cached) return cached
  const data = await Evento.findAll({ where: { deleted_at: null }, attributes: ['id', 'nome'], order: [['nome', 'ASC']] })
  simpleCache.set('eventos:filtro', data, TTL)
  return data
}
```

### Invalidação

- Em `eventoSSRController.criar`, `eventoSSRController.editar`, `eventoSSRController.deletar`: chamar `simpleCache.invalidate('eventos:filtro')`.
- Em `tiposCertificadosSSRController` equivalente: chamar `simpleCache.invalidate('tipos:filtro')`.

---

## Escopo desta feature

1. `src/utils/simpleCache.js` — módulo de cache TTL em memória
2. `certificadoSSRController.js` — usar cache para `Evento.findAll()` e `TiposCertificados.findAll()` dos selects de filtro
3. `eventoSSRController.js` — invalidar `'eventos:filtro'` nas operações de mutação
4. `tiposCertificadosSSRController.js` — invalidar `'tipos:filtro'` nas operações de mutação

---

## Critérios de aceite

- [ ] Segunda request consecutiva à listagem de certificados executa no máximo 3 queries ao banco (sem as queries de eventos e tipos).
- [ ] Após criar/editar/deletar um evento, a próxima request à listagem reflete os dados atualizados.
- [ ] Cache não é compartilhado entre processos (comportamento aceitável — TTL curto mitiga inconsistência em deploy multi-worker).
- [ ] Testes unitários cobrem `simpleCache.get`, `simpleCache.set` e `simpleCache.invalidate`.

---

## Riscos e limitações

- **Multi-processo:** em deploys com múltiplos workers (cluster, PM2), cada worker tem seu próprio cache em memória. Não há consistência entre workers — aceitável dado o TTL de 60s.
- **Memória:** `Map` cresce apenas com as chaves usadas (2 entradas fixas). Sem risco de memory leak.
- **Alternativas não adotadas:** Redis ou node-cache — excesso de complexidade para 2 queries de metadados.
