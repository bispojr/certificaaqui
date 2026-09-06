# Gate da Onda 4 — Depreciação de Legado e Fechamento de Convergência

**Feature:** `001-auth-scope-convergence`  
**Onda:** 4  
**Data:** 2026-09-05 20:35 (BRT)  
**Status:** concluída

## Resultado do gate

- [x] T044 remove o adaptador legado de principal
- [x] T045 elimina os caminhos legados de escopo em `scopedEvento`
- [x] T046 publica baseline final de quíntuplos convergidos
- [x] T047 consolida matriz final de conformidade
- [x] T048 valida ausência de fallback legado em unit tests
- [x] T049 valida integração sem contrato legado
- [x] T050 valida regressão final de autorização e escopo em e2e
- [x] T051 executa gate final da Onda 4

## Critérios de aceitação

- [x] 0 consumidores ativos de contrato legado de principal/escopo
- [x] 100% das operações da feature classificadas como conforme
- [x] evidências de unidade, integração e e2e disponíveis no repositório

## Evidências registradas

1. `legacyPrincipalAdapter.js` foi removido do contrato de autenticação.
2. `scopedEvento` deixa de depender de `req.query.evento_id` como canal de segurança.
3. Teste unitário protege contra retorno de campos legados em principal canônico.
4. Teste de integração protege a rota contra fallback de contrato legado e mantém bloqueio cross-scope.
5. Teste e2e confirma que o fluxo final de autorização e escopo permanece estável para admin e gestor.

## Validação executada

- `npx jest tests/services/no-legacy-fallback.unit.test.js tests/integration/no-legacy-contract.integration.test.js tests/services/canonicalPrincipalFactory.unit.test.js --runInBand`
- `npm run check`

## Conclusão

A Onda 4 foi concluída com sucesso. A feature finalizou com o contrato canônico de principal e escopo como único caminho de autenticação/autorização, sem legado ativo e com evidência documental e automatizada de conformidade final.
