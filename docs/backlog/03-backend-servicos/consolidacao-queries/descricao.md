# Feature: Consolidação das Queries de Listagem no Service Layer

## ID da Feature

BACK-LIST

## Domínio

Domínio 3 — Backend / Camada de Serviço

## Problema

`certificadoSSRController.js` contém em `index()`:

1. **Duas chamadas diretas a `Certificado.findAll()`** — contornando `certificadoService`
2. **A função local `getEventoIds(req)`** — duplicação da lógica de escopo que também existe em `participanteSSRController.js` (via `Usuario.findByPk` com include)

As duas implementações de escopo são semanticamente equivalentes mas usam estratégias diferentes:

- `certificadoSSRController`: `UsuarioEvento.findAll({ where: { usuario_id } })` → mapeia `.evento_id`
- `participanteSSRController`: `Usuario.findByPk(id, { include: 'eventos' })` → mapeia `.id`

Qualquer mudança na lógica de escopo (ex.: adicionar filtro de eventos ativos) teria que ser replicada em dois lugares.

## Objetivo

1. Centralizar a lógica de escopo em `src/utils/getScopedEventoIds.js`
2. Adicionar `findAllForSSR({ where, eventoIds })` em `certificadoService.js` que encapsula as duas queries (ativos + arquivados) com os includes padrão

## Arquivos envolvidos

- `src/utils/getScopedEventoIds.js` ← criar (novo)
- `src/services/certificadoService.js` ← adicionar método
- `src/controllers/certificadoSSRController.js` ← refatorar `index()`
- `src/controllers/participanteSSRController.js` ← substituir lógica de escopo

## Tasks

- [BACK-LIST-001](./task-001.md) — Criar `src/utils/getScopedEventoIds.js`
- [BACK-LIST-002](./task-002.md) — Adicionar `findAllForSSR` em `certificadoService.js`
- [BACK-LIST-003](./task-003.md) — Refatorar `certificadoSSRController.index()` e `participanteSSRController.index()` para usar os novos utilitários

## Critério de aceite da Feature

- `grep "getEventoIds\|UsuarioEvento.findAll\|Usuario.findByPk.*include.*eventos" src/controllers/` retorna zero resultados (lógica de escopo centralizada)
- `grep "Certificado.findAll" src/controllers/certificadoSSRController.js` retorna zero resultados (queries no service)
- `npm run check` passa
