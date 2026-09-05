# Tasks: 001-auth-scope-convergence

> Idioma obrigatório: português brasileiro (pt-BR), com ortografia oficial.

**Input**: Artefatos de design em specs/001-auth-scope-convergence/
**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/authorization-scope-convergence.md
**Organização**: Tarefas em ondas (Onda 0 a Onda 4), com rastreabilidade por histórias US1-US4.

## Formato: [ID] [P?] [Story?] Descrição com caminho de arquivo

- [P]: pode executar em paralelo (arquivos diferentes, sem dependência direta)
- [Story]: US1, US2, US3, US4 quando a tarefa pertence a uma história

---

## Onda 0: Baseline e Matriz de Conformidade

**Objetivo**: estabelecer baseline auditável por operação canônica (quíntuplo), sem alterar comportamento de runtime.

**Critério independente de validação**: todas as operações prioritárias P1 mapeadas por quíntuplo com status inicial conforme/nao_conforme/excecao_formal e evidência rastreável.

- [x] T001 Inventariar operações API por quíntuplo canônico em docs/auditorias/07/baseline-operacoes-api.md
- [x] T002 [P] Inventariar operações SSR por quíntuplo canônico em docs/auditorias/07/baseline-operacoes-ssr.md
- [x] T003 [P] Definir baseline por operação (quíntuplo) com perfil mínimo atual em docs/auditorias/07/baseline-operacoes-quintuplo.md
- [x] T004 Consolidar matriz de conformidade inicial (conforme/nao_conforme/excecao_formal) em docs/auditorias/07/matriz-conformidade-autorizacao-escopo.md (depende de T001, T002, T003)
- [x] T005 [P] Mapear contratos legados de principal e escopo por operação em docs/auditorias/07/legado-principal-escopo.md
- [x] T006 [P] Criar registro inicial de itens de convivência legada com owner e targetWave em docs/auditorias/07/legado-itens-transicao.md
- [x] T007 [P] Criar testes unit de baseline de mapeamento por quíntuplo em tests/services/authorizationConformanceBaseline.unit.test.js
- [x] T008 [P] Criar testes de integração de equivalência de operação API/SSR por quíntuplo em tests/integration/authorizationConformanceBaseline.integration.test.js
- [x] T009 [P] Criar teste e2e de auditoria mínima da matriz de conformidade em tests/e2e/authorization-conformance-baseline.e2e.spec.js
- [x] T010 Executar gate da Onda 0 (unit + integration + e2e + revisão de matriz) e registrar evidências em docs/auditorias/07/gate-onda-0.md (depende de T004, T005, T006, T007, T008, T009)

**Gate da Onda 0**:
- Baseline por operação (quíntuplo) publicado
- Matriz de conformidade publicada
- Lista de desvios críticos e itens legados em transição registrada

---

## Onda 1: Contrato Canônico de Principal (US2)

**Objetivo**: convergir principal autenticado API/SSR para contrato canônico único com adaptação legada controlada.

**Critério independente de validação**: principal canônico materializado em API e SSR com atributos mínimos e sem dependência de capacidades ORM.

- [ ] T011 [US2] Definir utilitário de materialização do principal canônico em src/services/auth/canonicalPrincipalFactory.js (depende de T010)
- [ ] T012 [P] [US2] Integrar principal canônico no middleware API de autenticação em src/middlewares/auth.js (depende de T011)
- [ ] T013 [P] [US2] Integrar principal canônico no middleware SSR de autenticação em src/middlewares/authSSR.js (depende de T011)
- [ ] T014 [US2] Criar adaptador legado temporário de principal para consumidores não migrados em src/services/auth/legacyPrincipalAdapter.js (depende de T012, T013)
- [ ] T015 [P] [US2] Publicar critérios de depreciação do adaptador legado em docs/auditorias/07/legado-principal-criterios.md (depende de T014)
- [ ] T016 [P] [US2] Criar testes unit para canonicalPrincipalFactory e legacyPrincipalAdapter em tests/services/canonicalPrincipalFactory.unit.test.js
- [ ] T017 [P] [US2] Criar testes de integração para materialização canônica API/SSR em tests/middleware/canonical-principal.integration.test.js
- [ ] T018 [P] [US2] Criar teste e2e de login API/SSR validando principal canônico em tests/e2e/auth-canonical-principal.e2e.spec.js
- [ ] T019 [US2] Executar gate da Onda 1 e registrar conformidade em docs/auditorias/07/gate-onda-1.md (depende de T012, T013, T014, T016, T017, T018)

**Gate da Onda 1**:
- Principal canônico populado em API e SSR
- Dependência direta de principal legado removida dos endpoints críticos mapeados
- Adaptador legado rastreado com owner e prazo de retirada

---

## Onda 2: Scoping Canônico e Negação Segura (US2)

**Objetivo**: separar identidade e escopo, padronizando req.contextoAutorizacao.eventoIds e negação segura para perfis restritos.

**Critério independente de validação**: operações P1 restritas usam apenas canal canônico de escopo; falhas determinísticas de resolução geram negação segura.

- [ ] T020 [US2] Implementar resolvedor canônico de escopo de eventos em src/services/auth/resolveAuthorizationScope.js (depende de T019)
- [ ] T021 [P] [US2] Aplicar resolvedor de escopo no pipeline API em src/middlewares/scopedEvento.js (depende de T020)
- [ ] T022 [P] [US2] Aplicar resolvedor de escopo no pipeline SSR em src/middlewares/authSSR.js (depende de T020)
- [ ] T023 [US2] Introduzir política de negação segura para gestor/monitor em falha determinística em src/services/auth/scopeGuard.js (depende de T021, T022)
- [ ] T024 [US2] Remover uso de req.query como canal de segurança nos controladores mapeados em src/controllers/certificadoController.js (depende de T023)
- [ ] T025 [P] [US2] Remover uso de req.query como canal de segurança nos controladores SSR mapeados em src/controllers/certificadoSSRController.js (depende de T023)
- [ ] T026 [P] [US2] Criar testes unit para resolveAuthorizationScope e scopeGuard em tests/services/authorization-scope.unit.test.js
- [ ] T027 [P] [US2] Criar testes de integração de negação segura em falha determinística em tests/middleware/authorization-scope.integration.test.js
- [ ] T028 [P] [US2] Criar teste e2e por perfil (admin, gestor, monitor) para scoping canônico em tests/e2e/authorization-scope.e2e.spec.js
- [ ] T029 [US2] Executar gate da Onda 2 e atualizar matriz de conformidade parcial em docs/auditorias/07/gate-onda-2.md (depende de T024, T025, T026, T027, T028)

**Gate da Onda 2**:
- Operações P1 usam req.contextoAutorizacao.eventoIds
- Falhas determinísticas de escopo restrito negadas com segurança
- Modo global admin com eventoIds = null sem regressão

---

## Onda 3: Enforcement no Service Layer e Equivalência RBAC (US1 e US3)

**Objetivo**: consolidar isolamento multi-tenant no service layer e equivalência de perfil mínimo por quíntuplo entre API/SSR.

**Critério independente de validação**: operações escopadas P1 exigem eventoIds explícito para perfis restritos; API e SSR compartilham perfil mínimo idêntico por operação equivalente.

- [ ] T030 [US3] Criar utilitário de enforcement canônico por escopo no service layer em src/services/auth/enforceTenantScope.js (depende de T029)
- [ ] T031 [P] [US3] Aplicar enforcement de escopo em serviços de certificados em src/services/certificadoService.js (depende de T030)
- [ ] T032 [P] [US3] Aplicar enforcement de escopo em serviços de participantes em src/services/participanteService.js (depende de T030)
- [ ] T033 [P] [US3] Aplicar enforcement de escopo em serviços de eventos em src/services/eventoService.js (depende de T030)
- [ ] T034 [US1] Definir catálogo de minimumRole por operationKey (quíntuplo) em src/services/auth/operationPolicyCatalog.js (depende de T029)
- [ ] T035 [P] [US1] Integrar catálogo de minimumRole no fluxo API em src/middlewares/rbac.js (depende de T034)
- [ ] T036 [P] [US1] Integrar catálogo de minimumRole no fluxo SSR em src/controllers/dashboardController.js (depende de T034)
- [ ] T037 [US1] Implementar verificador de drift API/SSR por operationKey em src/services/auth/operationConformanceService.js (depende de T035, T036)
- [ ] T038 [P] [US3] Criar testes unit de enforceTenantScope por modo global/restrito em tests/services/enforce-tenant-scope.unit.test.js
- [ ] T039 [P] [US1] Criar testes unit de operationPolicyCatalog e operationConformanceService em tests/services/operation-conformance.unit.test.js
- [ ] T040 [P] [US1] Criar testes de integração de equivalência de perfil mínimo API/SSR em tests/integration/rbac-equivalence.integration.test.js
- [ ] T041 [P] [US3] Criar testes de integração de bloqueio cross-tenant no service layer em tests/integration/service-scope-enforcement.integration.test.js
- [ ] T042 [P] [US1] Criar teste e2e de invariância de autorização API/SSR por quíntuplo em tests/e2e/rbac-equivalence.e2e.spec.js
- [ ] T043 [US1] Executar gate da Onda 3 e atualizar matriz de conformidade das operações migradas em docs/auditorias/07/gate-onda-3.md (depende de T031, T032, T033, T037, T038, T039, T040, T041, T042)

**Gate da Onda 3**:
- Drift de perfil mínimo API/SSR eliminado nas operações P1 migradas
- Bypass cross-tenant não detectável nas operações escopadas testadas
- Matriz de conformidade atualizada com status convergido por operação migrada

---

## Onda 4: Depreciação de Legado e Fechamento de Convergência (US4)

**Objetivo**: remover convivência legada remanescente e concluir auditoria final de conformidade arquitetural.

**Critério independente de validação**: zero consumidores ativos de contrato legado para operações no escopo da feature e auditoria final com classificação completa.

- [ ] T044 [US4] Remover adaptadores legados de principal sem consumidores ativos em src/services/auth/legacyPrincipalAdapter.js (depende de T043)
- [ ] T045 [P] [US4] Remover caminhos legados de escopo remanescentes em src/middlewares/scopedEvento.js (depende de T043)
- [ ] T046 [P] [US4] Publicar baseline final de operação por quíntuplo convergida em docs/auditorias/07/baseline-operacoes-quintuplo-final.md (depende de T043)
- [ ] T047 [US4] Consolidar matriz final de conformidade e exceções formais aprovadas em docs/auditorias/07/matriz-conformidade-final.md (depende de T046)
- [ ] T048 [P] [US4] Criar testes unit de ausência de fallback legado em src/services/auth em tests/services/no-legacy-fallback.unit.test.js
- [ ] T049 [P] [US4] Criar testes de integração de bloqueio de contrato legado em tests/integration/no-legacy-contract.integration.test.js
- [ ] T050 [P] [US4] Criar teste e2e de regressão final de autorização e escopo em tests/e2e/authorization-scope-final-regression.e2e.spec.js
- [ ] T051 [US4] Executar gate da Onda 4 (unit + integration + e2e + auditoria final) e registrar relatório em docs/auditorias/07/gate-onda-4.md (depende de T044, T045, T047, T048, T049, T050)

**Gate da Onda 4**:
- 0 consumidores ativos de contrato legado de principal/escopo
- 100% das operações da feature classificadas como conforme ou excecao_formal aprovada
- Evidências de teste unit, integration e e2e anexadas ao relatório final

---

## Dependências e Ordem de Execução

### Dependências entre ondas

- Onda 0: sem dependência prévia
- Onda 1: depende da conclusão da Onda 0 (T010)
- Onda 2: depende da conclusão da Onda 1 (T019)
- Onda 3: depende da conclusão da Onda 2 (T029)
- Onda 4: depende da conclusão da Onda 3 (T043)

### Dependências por história

- US2: implementada nas Ondas 1 e 2
- US1 e US3: implementadas na Onda 3
- US4: implementada na Onda 4

### Grafo resumido

- T001-T009 -> T010
- T010 -> T011-T018 -> T019
- T019 -> T020-T028 -> T029
- T029 -> T030-T042 -> T043
- T043 -> T044-T050 -> T051

---

## Oportunidades de Execução Paralela

### Onda 0

- T001 com T002 e T003
- T005 com T006
- T007, T008 e T009

### Onda 1

- T012 com T013
- T015 com T016, T017 e T018

### Onda 2

- T021 com T022
- T024 com T025
- T026, T027 e T028

### Onda 3

- T031, T032 e T033
- T035 com T036
- T038, T039, T040, T041 e T042

### Onda 4

- T045 com T046
- T048, T049 e T050

---

## Estratégia de Implementação

### MVP recomendado

1. Concluir Onda 0
2. Concluir Onda 1
3. Concluir Onda 2
4. Validar convergência de fronteira (principal + escopo)

### Entrega incremental

1. Onda 0 estabelece baseline e governança
2. Onda 1 e Onda 2 convergem fronteira de autenticação/autorização
3. Onda 3 elimina drift e consolida isolamento no service layer
4. Onda 4 remove legado e fecha conformidade auditável

---

## Critérios de Pronto para iniciar a Onda 1

- T010 concluída com gate da Onda 0 aprovado
- Baseline por quíntuplo publicada e rastreável
- Matriz de conformidade inicial publicada
- Desvios críticos priorizados e itens legados com owner, targetWave e critérios de retirada
