# Feature: Helper de Escopo de Evento Reutilizável

## Identificador da feature
helper-escopo-evento

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
ALTA

## Problema

A lógica de "obter IDs de eventos acessíveis pelo usuário autenticado" está implementada de **duas formas diferentes** em dois controllers SSR, com estratégias de query divergentes:

### `certificadoSSRController.js` (linhas 19–24) — via `UsuarioEvento.findAll`

```js
async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null
  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: req.usuario.id },
  })
  return associacoes.map((a) => a.evento_id)
}
```

### `participanteSSRController.js` (linhas 21–25) — via `Usuario.findByPk` com include

```js
if (req.usuario && req.usuario.perfil !== 'admin') {
  const usuarioComEventos = await Usuario.findByPk(req.usuario.id, {
    include: 'eventos',
  })
  eventoIds = (usuarioComEventos?.eventos || []).map((e) => e.id)
}
```

### `dashboardController.js` (linhas 35–38) — terceira variação

```js
const dbUsuario = await Usuario.findByPk(req.usuario.id, {
  include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
})
const eventoIds = (dbUsuario.eventos || []).map((e) => e.id)
```

Há **3 implementações diferentes** para o mesmo comportamento. A estratégia via `UsuarioEvento.findAll` (certificado) é a mais correta — query direta na tabela de junção, sem JOIN desnecessário.

---

## Estratégia de solução

### `src/utils/getScopedEventoIds.js`

```js
'use strict'

const { UsuarioEvento } = require('../models')

/**
 * Retorna null para admin (sem filtro de escopo).
 * Retorna array de evento_ids para gestor/monitor.
 * Array vazio significa que o usuário não tem eventos vinculados.
 *
 * @param {{ id: number, perfil: string }} usuario
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

**Diferença em relação à função local de `certificadoSSRController`:**
- Recebe `usuario` diretamente (não `req`) → facilita teste unitário sem mock de `req`
- Adiciona `attributes: ['evento_id']` para evitar SELECT * na tabela de junção

---

## Escopo desta feature

1. `src/utils/getScopedEventoIds.js` — novo arquivo utilitário
2. `src/controllers/certificadoSSRController.js` — substituir `getEventoIds(req)` por `getScopedEventoIds(req.usuario)`
3. `src/controllers/participanteSSRController.js` — substituir query inline por `getScopedEventoIds(req.usuario)`
4. Verificar `eventoSSRController.js`, `tiposCertificadosSSRController.js` e `dashboardController.js`
5. Testes unitários de `getScopedEventoIds`

---

## Critérios de aceite

- [ ] `getScopedEventoIds` retorna `null` para admin.
- [ ] `getScopedEventoIds` retorna array de IDs para gestor com eventos.
- [ ] `getScopedEventoIds` retorna `[]` para gestor sem eventos vinculados.
- [ ] Todos os controllers SSR utilizam o utilitário centralizado.
- [ ] Nenhum dos 3 controllers mantém a lógica local de escopo após a refatoração.
