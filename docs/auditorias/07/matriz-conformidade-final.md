# Matriz Final de Conformidade e Exceções — Onda 4

**Feature:** `001-auth-scope-convergence`  
**Data:** 2026-09-05 20:35 (BRT)  
**Status:** finalizado

## Resumo executivo

A convergência arquitetural foi concluída para as operações no escopo da feature. O sistema passou a usar:

- contrato canônico de principal autenticado sem `legacyPrincipalAdapter`
- resolução de escopo canônica via `req.contextoAutorizacao.eventoIds`
- enforcement no service layer para perfis restritos
- catálogo de perfis mínimos por `operationKey`
- testes de regressão unitários, de integração e e2e

## Matriz final

| Operação                  | Superfície                         | Status   | Evidência                                                 |
| ------------------------- | ---------------------------------- | -------- | --------------------------------------------------------- |
| principal canônico        | API/SSR                            | conforme | `canonicalPrincipalFactory` e testes de contrato          |
| scoping canônico          | API/SSR                            | conforme | `resolveAuthorizationScope`, `scopeGuard`, `scopedEvento` |
| enforcement service layer | certificados/participantes/eventos | conforme | `enforceTenantScope` + testes de integração               |
| drift RBAC                | API/SSR                            | conforme | `operationPolicyCatalog` + `operationConformanceService`  |
| contrato legado           | principal/escopo                   | removido | ausência do adaptador e ausência de `req.query.evento_id` |
| regressão final           | autorização e escopo               | conforme | e2e de regressão final                                    |

## Exceções formais

Nenhuma exceção formal foi necessária para o escopo da feature. A convergência foi concluída com status conforme em todos os quíntuplos tratados.

## Critério de fechamento

- 0 consumidores ativos de contrato legado de principal/escopo
- 100% das operações da feature classificadas como conforme
- evidências de unit/integration/e2e registradas no gate final
