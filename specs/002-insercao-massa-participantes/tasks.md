# Tasks: Importação em Massa de Participantes

> Idioma obrigatório para este artefato: português brasileiro (pt-BR), com ortografia oficial, acentuação e cedilha preservadas. Revisar ortografia e nomenclatura antes de finalizar.

**Input**: Artefatos de design de `/specs/002-insercao-massa-participantes/`
**Prerequisites**: plan.md (obrigatório), research.md, data-model.md, contracts/importacao-participantes-ssr.md, quickstart.md

**Tests**: Incluídos porque o plano e o quickstart desta feature pedem abordagem test-first para o novo fluxo SSR.

**Organization**: As tasks estão agrupadas por história de usuário para permitir implementação e validação independentes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar fixtures e helpers compartilhados para os testes da feature.

- [ ] T001 [P] Criar fixtures de entrada para importação em `tests/fixtures/participantes-importacao/` com exemplos de texto colado e CSV
- [ ] T002 [P] Criar helper de autenticação SSR e montagem de upload em `tests/helpers/participantesImportacao.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estabelecer os suportes comuns usados pelos testes e pela orquestração da importação.

**⚠️ CRITICAL**: Nenhuma task da história de usuário deve começar antes desta base mínima estar pronta.

- [ ] T003 [P] Criar factory de cenário para participantes e eventos em `tests/helpers/participantesImportacao.js`
- [ ] T004 [P] Criar helper para montar payloads `multipart/form-data` de colagem e CSV em `tests/helpers/participantesImportacao.js`

**Checkpoint**: base de testes pronta para iniciar a história de usuário.

---

## Phase 3: User Story 1 - Importação em massa de participantes na SSR (Priority: P1) 🎯 MVP

**Goal**: permitir a importação de participantes por texto colado ou arquivo CSV na interface SSR, com processamento linha a linha, sucesso parcial e relatório de erros por linha, sem quebrar o CRUD individual existente.

**Independent Test**: com usuário autorizado autenticado, enviar uma importação válida e parcialmente inválida em `/admin/participantes/importar`, verificar que as linhas válidas são processadas, as inválidas são reportadas individualmente e a tela SSR exibe o resumo sem regressão no cadastro/edição/listagem de participantes.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Cobrir parsing e consolidação do importador em `tests/services/participanteImportService.test.js`
- [x] T006 [P] [US1] Cobrir a action SSR de importação em `tests/controllers/participanteSSRController.test.js`
- [x] T007 [P] [US1] Cobrir a renderização do formulário e do resumo em `tests/views/admin/participantesIndexView.test.js`
- [ ] T008 [P] [US1] Cobrir o fluxo ponta a ponta em `tests/e2e/participantes-importacao.spec.js`

### Implementation for User Story 1

- [x] T009 [US1] Implementar `src/services/participanteImportService.js` para normalizar texto colado, ler CSV, ignorar linhas em branco e consolidar sucesso parcial
- [x] T010 [US1] Reaproveitar a criação unitária por e-mail em `src/services/participanteService.js` para a importação linha a linha
- [x] T011 [US1] Implementar a action `importar` em `src/controllers/participanteSSRController.js` e repassar o resultado para a view SSR
- [x] T012 [US1] Registrar `POST /admin/participantes/importar` em `src/routes/admin.js` com `authSSR` e o RBAC existente para participantes
- [x] T013 [US1] Atualizar `views/admin/participantes/index.hbs` com textarea de colagem, upload CSV, resumo da importação e exibição dos erros por linha

**Checkpoint**: a importação SSR deve estar funcional e testável de forma independente.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: consolidar validação final, regressões e acabamento da feature.

- [ ] T014 [P] Revalidar a navegação e o CRUD atual de participantes em `tests/controllers/participanteSSRController.test.js`, `tests/routes/participantes.test.js` e `tests/views/admin/participantesIndexView.test.js`
- [ ] T015 Executar a suíte focada da feature e `npm run check`, corrigindo regressões em `src/services/participanteImportService.js`, `src/services/participanteService.js`, `src/controllers/participanteSSRController.js`, `src/routes/admin.js` e `views/admin/participantes/index.hbs`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências; pode começar imediatamente.
- **Foundational (Phase 2)**: depende da Setup e bloqueia a história de usuário.
- **User Story 1 (Phase 3)**: depende da Foundation pronta.
- **Polish (Phase 4)**: depende da conclusão da história de usuário.

### User Story Dependencies

- **User Story 1 (P1)**: pode começar após a fase foundational; não depende de outra história.

### Within the Story

- Os testes devem ser escritos antes da implementação correspondente.
- Parser e orquestração devem ficar em `src/services/participanteImportService.js`.
- A orquestração da UI deve passar por `src/controllers/participanteSSRController.js` e `src/routes/admin.js`.
- A apresentação do resultado final deve ser tratada em `views/admin/participantes/index.hbs`.

### Parallel Opportunities

- `T001` e `T002` podem rodar em paralelo.
- `T003` e `T004` podem rodar em paralelo.
- `T005`, `T006`, `T007` e `T008` podem ser preparados em paralelo depois da base comum.
- `T014` pode rodar em paralelo com qualquer ajuste final de regressão já estabilizado.

---

## Parallel Example: User Story 1

```bash
Task: "Cobrir parsing e consolidação do importador em tests/services/participanteImportService.test.js"
Task: "Cobrir a action SSR de importação em tests/controllers/participanteSSRController.test.js"
Task: "Cobrir a renderização do formulário e do resumo em tests/views/admin/participantesIndexView.test.js"
Task: "Cobrir o fluxo ponta a ponta em tests/e2e/participantes-importacao.spec.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar as fases 1 e 2.
2. Escrever os testes da User Story 1 e fazê-los falhar inicialmente.
3. Implementar o serviço de importação, depois controller, rota e view.
4. Validar a história de forma independente.
5. Só então executar a regressão geral.

### Incremental Delivery

1. Preparar fixtures e helpers.
2. Cobrir parser e controller com testes.
3. Entregar a importação SSR funcional.
4. Ajustar o resultado visual e os erros por linha.
5. Fechar com validação geral e não regressão do CRUD individual.

### Parallel Team Strategy

1. Uma pessoa prepara os testes de serviço e controller.
2. Outra implementa o parser/orquestração em `src/services/participanteImportService.js`.
3. Outra cuida da view em `views/admin/participantes/index.hbs` e da rota em `src/routes/admin.js`.
4. Depois, o time consolida regressões e validação final.
