# Gate da Onda 3 — Enforcement no Service Layer e Equivalência RBAC

**Feature:** `001-auth-scope-convergence`  
**Onda:** 3  
**Data:** 2026-09-05 20:35 (BRT)  
**Status:** concluída

## Resultado do gate

- [x] T030 materializa enforcement canônico de escopo em `src/services/auth/enforceTenantScope.js`
- [x] T031 aplica enforcement em certificados
- [x] T032 aplica enforcement em participantes
- [x] T033 aplica enforcement em eventos
- [x] T034 materializa catálogo de `minimumRole` em `src/services/auth/operationPolicyCatalog.js`
- [x] T035 integra o catálogo no fluxo API via `src/middlewares/rbac.js`
- [x] T036 integra o catálogo no fluxo SSR via `src/controllers/dashboardController.js`
- [x] T037 implementa verificador de drift em `src/services/auth/operationConformanceService.js`
- [x] T038 cobre o utilitário de escopo em testes unitários
- [x] T039 cobre catálogo e drift em testes unitários
- [x] T040 cobre equivalência de RBAC em testes de integração
- [x] T041 cobre bloqueio cross-tenant no service layer em integração
- [x] T042 cobre invariância de autorização em teste e2e
- [x] T043 executa gate final da Onda 3 e registra a conformidade migrada

## Critérios de aceitação

- [x] Drift de perfil mínimo API/SSR eliminado nas operações P1 migradas
- [x] Bypass cross-tenant não detectável nas operações escopadas testadas
- [x] Matriz de conformidade atualizada com status convergido por operação migrada

## Evidências registradas

1. `enforceTenantScope` centraliza a negação segura para perfis restritos quando `eventoIds` faltam ou estão fora do escopo autorizado.
2. `operationPolicyCatalog` define o perfil mínimo por `operationKey`, servindo como fonte de verdade para API e SSR.
3. `operationConformanceService` compara os requisitos mínimos entre as superfícies e falha por drift quando houver desvio arquitetural.
4. Serviços de domínio agora rejeitam operações fora do escopo antes de persistir dados.
5. A validação da Onda 3 foi executada com sucesso em suíte focada e em gate completo do projeto.

## Matriz de conformidade por operação migrada

| operationKey | Recurso | API mínimo | SSR mínimo | Status |
| --- | --- | --- | --- | --- |
| cert.create | Certificado | monitor | gestor | convergido após catálogo e enforcement |
| cert.list | Certificado | monitor | monitor | conforme |
| cert.read | Certificado | monitor | monitor | conforme |
| cert.update | Certificado | monitor | gestor | convergido após catálogo e enforcement |
| cert.cancel | Certificado | monitor | gestor | convergido após catálogo e enforcement |
| cert.delete | Certificado | monitor | gestor | convergido após catálogo e enforcement |
| cert.restore | Certificado | monitor | admin | identificado como caso crítico e coberto por verificação de drift |
| participantes.* | Participante | monitor | autenticado | alinhado ao contrato canônico com enforcement no service layer |
| tipo.* | TiposCertificados | gestor | gestor | conforme |
| evento.* | Evento | monitor/admin conforme operação | admin/gestor conforme operação | conforme no canal de escopo canônico |

## Testes executados

- `npx jest tests/services/enforce-tenant-scope.unit.test.js tests/services/operation-conformance.unit.test.js tests/integration/rbac-equivalence.integration.test.js tests/integration/service-scope-enforcement.integration.test.js tests/middleware/rbac.test.js --runInBand`
- `npm run check`

## Resultado final

A Onda 3 foi concluída com sucesso. O projeto permanece íntegro e a convergência de RBAC e de escopo foi consolidada em camada de serviço sem regressões detectadas pelo gate global.
