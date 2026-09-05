# Gate da Onda 1 — Contrato Canônico de Principal

**Feature:** `001-auth-scope-convergence`
**Onda:** 1
**Data:** 2026-09-05 18:13 (BRT)
**Status:** concluída

## Resultado do gate

- [x] T012 materializa principal canônico na autenticação API
- [x] T013 materializa principal canônico na autenticação SSR
- [x] T014 fornece adaptador legado temporário para consumidores não migrados
- [x] T016 cobre contrato canônico e compatibilidade legada em teste unitário
- [x] T017 cobre materialização canônica em integração API/SSR
- [x] T018 cobre login API/SSR em e2e com observação da mesma identidade de interface

## Evidências registradas

1. Principal canônico exposto em `req.principal` com `subjectId`, `role`, `authChannel`, `sessionId/tokenId` e `tenantScopeMode`.
2. Adaptador legado limitado a espelhar o principal canônico em visão compatível com consumidores transitórios.
3. Validações unit, integration e e2e focadas no contrato da Onda 1.

## Observações

Os testes automatizados correspondentes foram executados no workspace:

- `tests/services/canonicalPrincipalFactory.unit.test.js`
- `tests/integration/canonical-principal.integration.test.js`
- `tests/e2e/auth-canonical-principal.e2e.spec.js`