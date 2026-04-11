# Feature: Correção de Semântica em `eventoService` — `destroy` vs `softDelete`

## ID da Feature

BACK-EVT

## Domínio

Domínio 3 — Backend / Camada de Serviço

## Problema

`eventoService.js` expõe dois métodos públicos com comportamentos divergentes para a mesma operação de soft delete:

| Método | Comportamento |
|--------|---------------|
| `destroy(id)` | Soft delete apenas no `Evento` (via `evento.destroy()`) |
| `delete(id)` | Soft delete no `Evento` **e** cascata em `UsuarioEvento.destroy(...)` |

Problemas adicionais:
1. Ambos são públicos — não há indicação de qual usar
2. `eventoSSRController.deletar()` e `eventoController.delete()` usam `eventoService.delete()` corretamente, mas qualquer novo código pode invocar `destroy()` por engano, deixando associações órfãs silenciosamente
3. `delete()` e `restore()` executam `require('../../src/models')` **inline** dentro da função — path relativo incorreto e impede mock efetivo
4. O path `../../src/models` a partir de `src/services/` está errado: deveria ser `../models`

## Objetivo

Renomear `delete()` para `softDelete()`, remover/privatizar `destroy()`, corrigir os requires inline e atualizar todos os callers e testes.

## Arquivos envolvidos

- `src/services/eventoService.js` ← refatorar
- `src/controllers/eventoSSRController.js` ← atualizar chamada
- `src/controllers/eventoController.js` ← atualizar chamada
- `tests/services/eventoService.test.js` ← atualizar testes
- `tests/controllers/eventoSSRController.test.js` ← atualizar mock
- `tests/controllers/eventoController.test.js` ← atualizar mock

## Tasks

- [BACK-EVT-001](./task-001.md) — Refatorar `eventoService.js`: renomear, remover e corrigir requires
- [BACK-EVT-002](./task-002.md) — Atualizar controllers que chamam `delete()` para `softDelete()`
- [BACK-EVT-003](./task-003.md) — Atualizar testes de `eventoService` e controllers

## Critério de aceite da Feature

- `grep "eventoService.delete\|eventoService.destroy" src/` não retorna nenhum resultado
- `grep "require.*models" src/services/eventoService.js` retorna apenas a linha do topo do arquivo
- `npm run check` passa
