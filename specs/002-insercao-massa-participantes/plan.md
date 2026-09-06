# Implementação: Importação em Massa de Participantes

> Idioma obrigatório para este artefato: português brasileiro (pt-BR), com ortografia oficial, acentuação e cedilha preservadas. Revisar ortografia e nomenclatura antes de finalizar.

**Branch**: `002-insercao-massa-participantes` | **Date**: 2026-09-06 | **Spec**: [docs/especificacoes.md](../../docs/especificacoes.md)
**Input**: Requisito FR-63 adicionado à especificação do produto durante a clarificação.

## Summary

Adicionar inserção em massa de participantes na interface SSR, aceitando colagem tabular de planilha e arquivo CSV, sem alterar o CRUD individual já existente. O novo fluxo deve reaproveitar a validação e a criação unitária atuais, processando cada linha de forma independente e registrando erros por linha sem bloquear os registros válidos.

## Technical Context

**Language/Version**: Node.js 24 + JavaScript
**Primary Dependencies**: Express, Handlebars, Sequelize, Zod, Multer, Jest, Playwright
**Storage**: PostgreSQL para dados persistentes; payload da importação tratado de forma transitória em memória
**Testing**: Jest para serviços/controladores/rotas; Playwright para o fluxo SSR da tela de participantes
**Target Platform**: Aplicação web em Linux server
**Project Type**: Web application
**Performance Goals**: Processar lotes pequenos e médios de participantes em uma única interação SSR, mantendo resposta previsível por linha
**Constraints**: Preservar as regras atuais de `FR-2`, `FR-3`, `FR-58`, `FR-59` e `FR-61`; não introduzir nova tabela; suportar sucesso parcial
**Scale/Scope**: Alteração localizada no módulo de participantes SSR, com impacto controlado em service, controller, rota, view e testes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verificar conformidade com a Constituição do CertificaAqui (`.specify/memory/constitution.md`):

- [x] **I. Fonte de Verdade** — `docs/especificacoes.md` foi consultado; `docs/backlog.md` não existe neste workspace, então não há item de backlog para reconciliar.
- [x] **II. Test-First** — A implementação deve ser guiada por testes específicos antes do código.
- [x] **III. Layered MVC** — O fluxo deve permanecer em `models → services → controllers → routes → middlewares`.
- [x] **IV. Soft Delete** — Nenhuma remoção física é necessária; o importador apenas reutiliza a criação existente.
- [x] **V. Security/RBAC** — O novo fluxo SSR deve manter a mesma proteção/escopo já aplicado às páginas de participantes.

## Project Structure

### Documentation (this feature)

```text
specs/002-insercao-massa-participantes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── importacao-participantes-ssr.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── controllers/
│   └── participanteSSRController.js
├── routes/
│   └── admin.js
├── services/
│   ├── participanteService.js
│   └── participanteImportService.js
├── validators/
│   └── participante.js
└── models/
    └── participante.js

views/
└── admin/
    └── participantes/
        ├── index.hbs
        └── form.hbs

tests/
├── controllers/
├── integration/
├── services/
└── views/
```

**Structure Decision**: manter a feature dentro do módulo SSR de participantes, adicionando um serviço específico de importação para normalizar colagem/CSV e reutilizar a criação unitária já consolidada.

## Complexity Tracking

Não há violações arquiteturais que justifiquem complexidade extra. A solução deve permanecer local, sem novas tabelas nem novos fluxos de autenticação.
