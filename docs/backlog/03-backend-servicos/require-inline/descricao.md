# Feature: Eliminação de `require()` Inline e Paths Incorretos em Services

## ID da Feature

BACK-REQ

## Domínio

Domínio 3 — Backend / Camada de Serviço

## Problema

Três categorias de problemas identificados via grep:

### 1. Path `../../src/models` incorreto nos services

Todos os services em `src/services/` usam o path `../../src/models` para importar models:

| Arquivo | Path atual | Path correto |
|---------|-----------|--------------|
| `src/services/participanteService.js` | `../../src/models` | `../models` |
| `src/services/certificadoService.js` | `../../src/models` | `../models` |
| `src/services/tiposCertificadosService.js` | `../../src/models` | `../models` |

O path `../../src/models` funciona acidentalmente (vai para a raiz e desce de novo), mas é semanticamente errado, frágil a movimentações de diretório e confuso para novos contribuidores.

> Nota: `eventoService.js` já tem esse problema coberto por BACK-EVT-001.

### 2. `require()` inline em `certificadoSSRController.js`

**Linha 42** — `require('sequelize').Op` inline dentro de `Certificado.findAll()`:
```js
where: { ...where, deleted_at: { [require('sequelize').Op.ne]: null } },
```

**Linha 74** — `templateService` importado dentro da função `detalhe()`:
```js
const templateService = require('../services/templateService')
```

## Objetivo

Corrigir os paths de import para o caminho relativo correto e mover todos os `require()` inline para o topo dos respectivos arquivos.

## Arquivos envolvidos

- `src/services/participanteService.js` ← corrigir path
- `src/services/certificadoService.js` ← corrigir path
- `src/services/tiposCertificadosService.js` ← corrigir path
- `src/controllers/certificadoSSRController.js` ← mover 2 requires para o topo

## Tasks

- [BACK-REQ-001](./task-001.md) — Corrigir path `../../src/models` nos services
- [BACK-REQ-002](./task-002.md) — Mover `require()` inline de `certificadoSSRController.js` para o topo

## Critério de aceite da Feature

- `grep -r "require('../../src/models')" src/` retorna zero resultados
- `grep -n "require" src/controllers/certificadoSSRController.js` retorna apenas linhas no topo do arquivo
- `npm run check` passa
