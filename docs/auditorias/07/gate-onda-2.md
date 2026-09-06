# Gate da Onda 2 — Scoping Canônico e Negação Segura

**Feature:** `001-auth-scope-convergence`
**Onda:** 2
**Data:** 2026-09-05 18:35 (BRT)
**Status:** concluída

## Resultado do gate

- [x] T020 materializa o resolvedor canônico de escopo em `resolveAuthorizationScope.js`
- [x] T021 aplica o resolutor no pipeline API via `scopedEvento`
- [x] T022 aplica o resolutor no pipeline SSR via `authSSR`
- [x] T023 introduce negação segura em `scopeGuard` para perfis restritos
- [x] T024 remove o uso de `req.query` como canal de segurança em controle de certificados API
- [x] T025 remove o uso de `req.query` como canal de segurança em controle de certificados SSR
- [x] T026 cobre `resolveAuthorizationScope` e `scopeGuard` em testes unitários
- [x] T027 cobre negação segura em integração de middleware
- [x] T028 valida scoping canônico em cenário e2e por perfil

## Evidências registradas

1. O modelo canônico de escopo agora usa `req.contextoAutorizacao.eventoIds` como canal único de autorização.
2. `admin` mantém `eventoIds = null` em modo global; `gestor` e `monitor` exigem evento(s) vinculados.
3. Falha determinística em resolução de escopo dispara negação segura sem fallback de consulta legada.
4. Testes automatizados validam comportamento dentro e fora do escopo para perfis restritos.

## Observações

Os testes automatizados executados correspondentes à Onda 2 incluem:

- `tests/services/authorization-scope.unit.test.js`
- `tests/middleware/authorization-scope.integration.test.js`
- `tests/e2e/authorization-scope.e2e.spec.js`

## Conclusão

Os critérios da Onda 2 foram atendidos: a operação de acesso por escopo foi unificada em canal canônico, com negação segura para perfis restritos e compatibilidade com o modo global de admin.
