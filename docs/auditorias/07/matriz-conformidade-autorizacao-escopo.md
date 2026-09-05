# Matriz de Conformidade Inicial - Autorização e Escopo (Onda 0)

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Status de classificação: baseline inicial (sem mudanças de runtime)

## Critérios de classificação usados

- conforme: atende contrato canônico (ou aderência funcional equivalente no estado atual), escopo consistente e equivalência de perfil mínimo API/SSR para o quíntuplo.
- nao_conforme: viola ao menos um critério acima.
- excecao_formal: divergência justificada por decisão arquitetural formal rastreável (não identificada neste baseline).

## Matriz por operação P1

| operationKey | Perfil API | Perfil SSR | Escopo atual | Canal de escopo | Status | Principais evidências |
|---|---|---|---|---|---|---|
| cert.create | monitor | gestor | por evento (incompleto) | scopedEvento + body/query legados | nao_conforme | rbac divergente + ausência de canal canônico |
| cert.list | monitor | monitor | por evento (incompleto) | query legado (API) e resolução local (SSR) | nao_conforme | service API ignora filtro de evento |
| cert.read | monitor | monitor | por evento (incompleto) | params id legado | nao_conforme | ownership ausente nas duas superfícies |
| cert.update | monitor | gestor | por evento (incompleto) | params/body legados | nao_conforme | rbac divergente + ownership ausente |
| cert.cancel | monitor | gestor | por evento (incompleto) | params/body legados | nao_conforme | rbac divergente + ownership ausente |
| cert.delete | monitor | gestor | por evento (incompleto) | params/body legados | nao_conforme | rbac divergente + ownership ausente |
| cert.restore | monitor | admin | por evento/global (inconsistente) | params legado | nao_conforme | divergência crítica de perfil mínimo |
| participante.create | monitor | autenticado | sem escopo robusto | sem canal canônico | nao_conforme | sem scoped canônico e perfis divergentes |
| participante.list | monitor | autenticado | parcial apenas no SSR | sem canal canônico | nao_conforme | API sem escopo por evento |
| participante.read | monitor | autenticado | sem ownership por evento | params legado | nao_conforme | acesso por ID sem validação de tenant |
| participante.update | monitor | autenticado | sem ownership por evento | params/body legados | nao_conforme | perfis e escopo inconsistentes |
| participante.delete | monitor | autenticado | inconsistente | params legado | nao_conforme | política FR-60 não convergida |
| participante.restore | monitor | autenticado | inconsistente | params legado | nao_conforme | política de restore sem convergência |
| tipo.list | monitor | gestor | sem escopo robusto | sem canal canônico | nao_conforme | API sem filtro e SSR só com flag podeEditar |
| tipo.create | gestor | gestor | por evento (parcial) | ownership middleware/controller | nao_conforme | sem principal canônico e sem canal req.contextoAutorizacao |
| tipo.update | gestor | gestor | por evento (parcial) | ownership middleware/controller | nao_conforme | sem contrato canônico transversal |
| tipo.delete | gestor | gestor | por evento (parcial) | ownership middleware/controller | nao_conforme | sem contrato canônico transversal |
| tipo.restore | gestor | gestor | por evento (parcial) | ownership middleware/controller | nao_conforme | sem contrato canônico transversal |
| evento.create | monitor | admin | global/admin (inconsistente) | scopedEvento legado na API | nao_conforme | divergência crítica de perfil mínimo |
| evento.list | monitor | gestor | por evento para não-admin (inconsistente) | scopedEvento legado + SSR local | nao_conforme | divergência de perfil + canal de escopo não canônico |
| evento.read | monitor | admin | por evento para não-admin (inconsistente) | params legado | nao_conforme | divergência de perfil mínimo |
| evento.update | monitor | admin | global/admin (inconsistente) | params/body legados | nao_conforme | divergência crítica de perfil mínimo |
| evento.delete | monitor | admin | global/admin (inconsistente) | params/body legados | nao_conforme | divergência crítica de perfil mínimo |
| evento.restore | monitor | admin | global/admin (inconsistente) | params/body legados | nao_conforme | divergência crítica de perfil mínimo |
| dashboard.view | n/a | autenticado (sem rbac explícito) | por evento para não-admin | resolução local no controller | nao_conforme | ausência de declaração explícita de policy |

## Resumo da classificação

- conforme: 0
- nao_conforme: 25
- excecao_formal: 0

## Desvios críticos priorizados

1. Drift de RBAC em operações de eventos e certificados entre API e SSR.
2. Falta de ownership por evento em operações por ID (principalmente certificados e participantes).
3. Ausência de canal canônico de escopo req.contextoAutorizacao.eventoIds.
4. Dependência de mecanismos legados de escopo (query/body/params) sem padronização.

## Pronto para Onda 1

A Onda 0 atende ao objetivo de baseline e matriz inicial. O próximo gate exige introduzir contrato canônico de principal e estratégia de convivência legada controlada.
