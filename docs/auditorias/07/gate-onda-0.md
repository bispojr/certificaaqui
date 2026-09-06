# Gate da Onda 0 - Baseline e Conformidade

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Status: concluído

## Escopo validado

- T001 a T006 concluídas com artefatos documentais publicados.
- T007 a T009 concluídas na criação dos testes automatizados.

## Evidências documentais

- docs/auditorias/07/baseline-operacoes-api.md
- docs/auditorias/07/baseline-operacoes-ssr.md
- docs/auditorias/07/baseline-operacoes-quintuplo.md
- docs/auditorias/07/matriz-conformidade-autorizacao-escopo.md
- docs/auditorias/07/legado-principal-escopo.md
- docs/auditorias/07/legado-itens-transicao.md

## Evidências de testes

### T007 + T008 (Jest)

Execução:

- runTests em tests/services/authorizationConformanceBaseline.unit.test.js
- runTests em tests/integration/authorizationConformanceBaseline.integration.test.js

Resultado final:

- 4 testes executados
- 4 testes aprovados
- 0 falhas

### T009 (Playwright e2e)

Execução:

- npx playwright test tests/e2e/authorization-conformance-baseline.e2e.spec.js

Resultado:

- Execução final aprovada: 1 teste executado, 1 aprovado, 0 falhas
- Observação: na primeira tentativa houve falha de ambiente (ECONNREFUSED 127.0.0.1:5434), resolvida após subir serviços com docker compose -f docker-compose.test.yml up -d

## Conclusão do gate

- Critérios documentais da Onda 0: atendidos.
- Critérios de testes automatizados: atendidos.
- Gate T010: concluído.

## Próxima ação objetiva

1. Iniciar Onda 1 pela T011 (canonicalPrincipalFactory).
2. Integrar principal canônico em auth API e auth SSR (T012 e T013).
