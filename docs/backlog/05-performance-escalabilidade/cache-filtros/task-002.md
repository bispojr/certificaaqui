# PERF-CACHE-002 — Invalidação do cache após mutações de Evento e TiposCertificados

## Identificador

PERF-CACHE-002

## Feature

cache-filtros

## Domínio

05 — Performance e Escalabilidade

## Prioridade

MÉDIA

## Pré-requisitos

- PERF-CACHE-001 implementado (`src/utils/simpleCache.js` existe e está em uso em `certificadoSSRController`)

## Descrição

Com o cache TTL ativo, qualquer create/update/delete de Evento ou TiposCertificados deixa o cache desatualizado pelo período do TTL (60s). Para garantir consistência imediata após mutações, as operações de escrita nos controllers correspondentes devem invalidar a entrada de cache relevante.

---

## Alterações necessárias

### 1. `src/controllers/eventoSSRController.js`

Adicionar ao topo do arquivo:

```js
const simpleCache = require('../utils/simpleCache')
```

Nas funções de mutação (`criar`, `editar`, `deletar`, `restaurar`), chamar após a operação bem-sucedida:

```js
simpleCache.invalidate('eventos:filtro')
```

**Pontos de inserção:**

- Após `await eventoService.create(...)` ou equivalente em `criar`
- Após `await eventoService.update(...)` ou equivalente em `editar`
- Após `await eventoService.softDelete(...)` ou equivalente em `deletar`
- Após `await eventoService.restore(...)` ou equivalente em `restaurar`

A chamada deve ocorrer imediatamente antes do `res.redirect(...)` de sucesso.

---

### 2. `src/controllers/tiposCertificadosSSRController.js`

Adicionar ao topo do arquivo:

```js
const simpleCache = require('../utils/simpleCache')
```

Nas funções de mutação (`criar`, `editar`, `deletar`, `restaurar`), chamar após a operação bem-sucedida:

```js
simpleCache.invalidate('tipos:filtro')
```

**Mesma lógica de posicionamento:** imediatamente antes do `res.redirect(...)` no fluxo de sucesso.

---

## Comportamento esperado

| Ação                                        | Resultado no cache                                  |
| ------------------------------------------- | --------------------------------------------------- |
| GET /admin/certificados                     | Miss na 1ª request → preenche cache                 |
| GET /admin/certificados (2ª)                | Hit → sem query ao banco                            |
| POST /admin/eventos/criar                   | `invalidate('eventos:filtro')`                      |
| GET /admin/certificados (após criar evento) | Miss → preenche cache atualizado                    |
| 60s após qualquer SET                       | TTL expira → próxima request faz query e repreenche |

---

## Critérios de aceite

- [ ] Após criar um novo evento via `POST /admin/eventos/criar`, a listagem de certificados exibe o novo evento no select de filtro imediatamente (sem esperar o TTL expirar).
- [ ] `invalidate('eventos:filtro')` é chamado nas 4 operações de mutação de evento (criar, editar, deletar, restaurar).
- [ ] `invalidate('tipos:filtro')` é chamado nas 4 operações de mutação de tipo de certificado.
- [ ] Nenhum teste existente quebra após a adição das chamadas de invalidação.

## Estimativa

PP (até 30min)
