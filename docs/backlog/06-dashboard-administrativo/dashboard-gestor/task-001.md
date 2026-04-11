# DASH-GEST-001 — Verificar exportação de `sequelize` em `src/models/index.js`

## Identificador
DASH-GEST-001

## Feature
dashboard-gestor

## Domínio
06 — Dashboard Administrativo

## Prioridade
MÉDIA

## Pré-requisitos
- Nenhum (pré-requisito técnico para DASH-GEST-002)

## Descrição

A query de agrupamento de certificados por tipo requer `sequelize.fn('COUNT', ...)` e `sequelize.col(...)`. Para usá-los no `dashboardController.js`, o objeto `sequelize` deve estar disponível como import no topo do arquivo.

Esta task é uma verificação + ajuste mínimo, não uma refatoração.

---

## O que verificar

### `src/models/index.js`

Verificar se o arquivo exporta o objeto `sequelize` (a instância da conexão), além dos modelos.

**Padrão esperado de exportação:**

```js
module.exports = {
  sequelize,
  Sequelize,
  Evento,
  Participante,
  Certificado,
  TiposCertificados,
  Usuario,
  UsuarioEvento,
}
```

Se `sequelize` já for exportado, nenhuma alteração é necessária.

Se **não** for exportado, adicionar a linha correspondente ao objeto `module.exports`.

---

### `src/controllers/dashboardController.js`

Verificar se o destructuring no topo do arquivo já inclui `sequelize`:

```js
const {
  Evento,
  TiposCertificados,
  Participante,
  Usuario,
  Certificado,
} = require('../models')
```

Se `sequelize` não estiver no destructuring, adicionar:

```js
const {
  sequelize,
  Evento,
  TiposCertificados,
  Participante,
  Usuario,
  Certificado,
} = require('../models')
```

---

## Critérios de aceite

- [ ] `src/models/index.js` exporta o objeto `sequelize`.
- [ ] `dashboardController.js` importa `sequelize` via destructuring no topo do arquivo.
- [ ] Nenhum teste existente quebra após as alterações.

## Estimativa
PP (até 15min — verificação + ajuste pontual)
