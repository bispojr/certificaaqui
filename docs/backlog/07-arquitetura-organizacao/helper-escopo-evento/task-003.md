# ARQ-ESC-003 — Refatorar `participanteSSRController.js` e `dashboardController.js`

## Identificador
ARQ-ESC-003

## Feature
helper-escopo-evento

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
ALTA

## Pré-requisitos
- ARQ-ESC-001 implementado

## Descrição

Substituir as queries inline de escopo em `participanteSSRController.js` e `dashboardController.js` pelo utilitário centralizado `getScopedEventoIds`.

---

## Alterações necessárias

### 1. `src/controllers/participanteSSRController.js`

**Adicionar import no topo:**
```js
const { getScopedEventoIds } = require('../utils/getScopedEventoIds')
```

**Localizar o bloco inline de escopo** (linhas 19–26 aproximadas):

```js
// REMOVER:
let eventoIds = null
if (req.usuario && req.usuario.perfil !== 'admin') {
  const usuarioComEventos = await Usuario.findByPk(req.usuario.id, {
    include: 'eventos',
  })
  eventoIds = (usuarioComEventos?.eventos || []).map((e) => e.id)
}
```

**Substituir por:**
```js
const eventoIds = await getScopedEventoIds(req.usuario)
```

**Verificar se `Usuario` ainda é usado no arquivo** após remover o bloco — se não for usado em outro lugar, remover do destructuring de imports.

---

### 2. `src/controllers/dashboardController.js`

**Adicionar import no topo:**
```js
const { getScopedEventoIds } = require('../utils/getScopedEventoIds')
```

**Localizar o bloco inline de escopo gestor** (linhas 34–39 aproximadas):

```js
// REMOVER:
const dbUsuario = await Usuario.findByPk(req.usuario.id, {
  include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
})
const eventoIds = (dbUsuario.eventos || []).map((e) => e.id)
```

**Substituir por:**
```js
const eventoIds = await getScopedEventoIds(req.usuario)
```

**Atualizar a linha seguinte** que cria `whereEvento`:
- Não é necessária mudança — `eventoIds` continua sendo `null` para admin ou array para gestor, mesma semântica.

**Verificar se `Evento` ainda é usado no imports do dashboardController** após remover o `include` manual — confirmar antes de remover do destructuring, pois `Evento` também pode ser usado em queries do admin.

---

## Critérios de aceite

- [ ] `participanteSSRController.js` usa `getScopedEventoIds(req.usuario)` em vez do bloco `Usuario.findByPk` com include.
- [ ] `dashboardController.js` usa `getScopedEventoIds(req.usuario)` em vez do bloco `Usuario.findByPk` com include.
- [ ] O comportamento de escopo por evento permanece idêntico em ambos os controllers.
- [ ] Nenhum teste existente quebra após as refatorações.

## Estimativa
P (até 30min)
