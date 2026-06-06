# Pesquisa - 001-auth-scope-convergence

## Objetivo

Consolidar decisões de implementação brownfield para convergência de autorização e escopo, eliminando pontos de ambiguidade sem alterar escopo de negócio.

## Decisão 1: Contrato canônico único de principal autenticado

- Decision: materializar principal canônico em API/SSR com `subjectId`, `role`, `authChannel`, `sessionId/tokenId`, `tenantScopeMode`.
- Rationale: atende FR-001, preserva ADR 011 e remove dependência de capacidades ORM no principal.
- Alternatives considered:
  - Manter contrato assimétrico por superfície: rejeitado por aumentar drift RBAC.
  - Carregar entidade ORM completa em SSR: rejeitado por acoplamento e custo recorrente.

## Decisão 2: Separação estrita entre identidade e escopo

- Decision: resolver escopo em canal canônico `req.contextoAutorizacao.eventoIds`, mantendo `admin` com `eventoIds = null`.
- Rationale: atende FR-002/FR-003/FR-004 e invariantes de fronteira do SRS + ADR 009/011.
- Alternatives considered:
  - Injetar escopo em `req.query`: rejeitado por canal implícito de segurança.
  - Inferir escopo no controller sem contrato comum: rejeitado por inconsistências API/SSR.

## Decisão 3: Enforcement multi-tenant na camada de serviço

- Decision: aplicar filtro e ownership nos services com `eventoIds` explícito para operações escopadas.
- Rationale: atende FR-005 e reduz bypass em rotas por ID/listagem.
- Alternatives considered:
  - Enforcement principal em middleware: rejeitado por baixa aplicabilidade SSR e duplicação de query.
  - RLS no banco nesta etapa: rejeitado por complexidade operacional fora do escopo da convergência.

## Decisão 4: Equivalência de perfil mínimo por quíntuplo

- Decision: classificar operações API/SSR por quíntuplo e exigir perfil mínimo idêntico (salvo exceção formal).
- Rationale: atende FR-006/FR-007, preserva ADR 012 e cria critério auditável de não conformidade.
- Alternatives considered:
  - Permitir divergência por superfície sem ADR: rejeitado por quebra de invariância de segurança.
  - Tratar endpoint como unidade canônica: rejeitado por acoplamento a transporte.

## Decisão 5: Convivência temporária de legado com depreciação objetiva

- Decision: permitir adaptadores legados somente durante ondas de migração, com owner, prazo e critério objetivo de retirada.
- Rationale: atende FR-010 sem bloqueio de entrega em brownfield.
- Alternatives considered:
  - Big-bang migration: rejeitado por risco alto de regressão.
  - Convivência sem prazo/gate: rejeitado por risco de legado permanente.

## Decisão 6: Proteção de endpoints públicos durante convergência

- Decision: manter política de dados públicos vigente (ADR 014) como gate de regressão para qualquer ajuste de autorização/scoping.
- Rationale: atende FR-008 e evita ampliação indevida de exposição.
- Alternatives considered:
  - Postergar validação pública para fase final: rejeitado por risco de regressão silenciosa.

## Decisão 7: Estratégia de validação em quatro níveis

- Decision: validar por unit, integration, e2e e auditoria de conformidade arquitetural.
- Rationale: atende objetivo de convergência transversal com evidência objetiva por operação.
- Alternatives considered:
  - Apenas testes de rota: rejeitado por não cobrir drift por camada.
  - Apenas auditoria documental: rejeitado por falta de prova executável.

## Clarificações pendentes

Nenhuma. A spec e o checklist da feature não contêm marcadores `NEEDS CLARIFICATION`.
