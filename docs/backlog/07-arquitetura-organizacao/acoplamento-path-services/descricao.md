# Feature: Remoção de Acoplamento de Path em Services

## Identificador da feature
acoplamento-path-services

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
MÉDIA

## Problema

Auditoria de `require()` inline e paths incorretos, confirmada via grep:

### `src/services/eventoService.js` — 3 problemas

**Linha 2 — path incorreto:**
```js
const { Evento } = require('../../src/models')
```
O arquivo está em `src/services/`, portanto o path correto para `src/models/` é `'../models'`, não `'../../src/models'` (que sai de `src/services` → volta para raiz → entra em `src/models`, funcionando por acidente no Node.js devido ao cache de módulos).

**Linhas 41 e 49 — `require()` inline dentro de funções:**
```js
async delete(id) {
  // ...
  const { UsuarioEvento } = require('../../src/models')  // linha 41
  await UsuarioEvento.destroy({ where: { evento_id: id } })
},
async restore(id) {
  // ...
  const { UsuarioEvento } = require('../../src/models')  // linha 49
  await UsuarioEvento.restore({ where: { evento_id: id } })
},
```

**Problema:** `require()` dentro de funções impede que `UsuarioEvento` seja mockado em testes unitários — o mock precisa ser registrado antes do `require()` ser executado.

### Outros services (`participanteService.js`, `certificadoService.js`, `tiposCertificadosService.js`)

Path `'../../src/models'` também está incorreto semanticamente nesses arquivos. Verificar e corrigir.

---

## Estratégia de correção

Para `eventoService.js`:

```js
// ANTES (linhas 1-2):
// Service para lógica de negócio de Evento
const { Evento } = require('../../src/models')

// DEPOIS:
'use strict'
const { Evento, UsuarioEvento } = require('../models')
```

Remover as duas ocorrências de `require('../../src/models')` inline dentro de `delete` e `restore`.

---

## Escopo desta feature

1. `src/services/eventoService.js` — mover `UsuarioEvento` para o topo + corrigir path
2. `src/services/participanteService.js` — corrigir path
3. `src/services/certificadoService.js` — corrigir path
4. `src/services/tiposCertificadosService.js` — corrigir path

---

## Critérios de aceite

- [ ] Nenhum `require()` fora do topo do módulo em nenhum service.
- [ ] Todos os services usam `require('../models')` em vez de `require('../../src/models')`.
- [ ] `UsuarioEvento` importado no topo de `eventoService.js`.
- [ ] Suite de testes completa (`npm run check`) passa após as correções.
