# ARQ-ESC-002 — Refatorar `certificadoSSRController.js` para usar `getScopedEventoIds`

## Identificador
ARQ-ESC-002

## Feature
helper-escopo-evento

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
ALTA

## Pré-requisitos
- ARQ-ESC-001 implementado

## Descrição

Substituir a função local `getEventoIds(req)` em `certificadoSSRController.js` pelo utilitário centralizado `getScopedEventoIds`.

---

## Alterações necessárias

### `src/controllers/certificadoSSRController.js`

**1. Adicionar import no topo:**

Após os imports existentes, adicionar:
```js
const { getScopedEventoIds } = require('../utils/getScopedEventoIds')
```

**2. Remover a função local `getEventoIds`** (linhas 19–24 atuais):

```js
// REMOVER:
async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null
  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: req.usuario.id },
  })
  return associacoes.map((a) => a.evento_id)
}
```

**3. Substituir a chamada** dentro de `index()`:

```js
// ANTES:
const eventoIds = await getEventoIds(req)

// DEPOIS:
const eventoIds = await getScopedEventoIds(req.usuario)
```

**4. Remover `UsuarioEvento` do destructuring de imports** se não for mais usado em nenhum outro ponto do arquivo:

```js
// ANTES:
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  UsuarioEvento,
} = require('../models')

// DEPOIS (se UsuarioEvento não for mais usado):
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../models')
```

**Verificar antes de remover `UsuarioEvento`:** fazer grep em todo o arquivo para confirmar que não há outras referências.

---

## Critérios de aceite

- [ ] `certificadoSSRController.js` não contém mais a função `getEventoIds`.
- [ ] `certificadoSSRController.js` importa e usa `getScopedEventoIds`.
- [ ] O comportamento de filtragem por escopo permanece idêntico ao anterior.
- [ ] Testes existentes do controller certificado (se houver) passam sem alteração.

## Estimativa
PP (até 20min)
