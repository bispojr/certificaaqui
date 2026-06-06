# Data Model - 001-auth-scope-convergence

## Escopo

Modelo conceitual para convergência arquitetural de autorização e escopo (sem alterar entidades de negócio do produto).

## Entidade: CanonicalPrincipal

Campos:
- `subjectId` (number, obrigatório)
- `role` (enum: `admin|gestor|monitor`, obrigatorio)
- `authChannel` (enum: `api|ssr`, obrigatório)
- `sessionId` (string, opcional)
- `tokenId` (string, opcional)
- `tenantScopeMode` (enum: `global|restricted`, obrigatório)

Regras:
- Deve existir exatamente um identificador de sessão (`sessionId` ou `tokenId`) quando aplicável.
- `tenantScopeMode = global` implica `role = admin`.
- Não pode carregar capacidades ORM/métodos de associação.

## Entidade: AuthorizationContext

Campos:
- `principal` (CanonicalPrincipal, obrigatório)
- `eventoIds` (array<number> ou null, obrigatório)
- `scopeResolutionStatus` (enum: `resolved|failed_deterministic|not_required`, obrigatório)

Regras:
- `eventoIds = null` apenas para `tenantScopeMode = global`.
- Para `tenantScopeMode = restricted`, `scopeResolutionStatus` deve ser `resolved` com array não vazio; falha determinística implica negação segura.
- Canal canônico no request: `req.contextoAutorizacao.eventoIds`.

## Entidade: CanonicalBusinessOperation

Campos:
- `operationKey` (string, obrigatório, único)
- `functionalIntent` (string, obrigatório)
- `targetResource` (string, obrigatório)
- `stateEffect` (enum: `read|create|update|delete|restore|cancel`, obrigatório)
- `tenantScopeClass` (enum: `global|event_scoped|public`, obrigatório)
- `riskClass` (enum: `low|medium|high|critical`, obrigatório)
- `minimumRole` (enum: `admin|gestor|monitor`, obrigatório)

Regras:
- `operationKey` representa o quíntuplo canônico (ADR 012).
- Operações equivalentes API/SSR devem compartilhar o mesmo `operationKey` e `minimumRole`.
- Divergência sem exceção formal registrada = não conformidade crítica.

## Entidade: ConformanceAssessment

Campos:
- `operationKey` (string, obrigatório)
- `surface` (enum: `api|ssr|cross-surface`, obrigatório)
- `status` (enum: `conforme|nao_conforme|excecao_formal`, obrigatório)
- `findings` (array<string>, obrigatório)
- `evidenceRefs` (array<string>, obrigatório)
- `updatedAt` (datetime, obrigatório)

Regras:
- Toda operação no baseline deve possuir avaliação.
- `excecao_formal` requer referência rastreável para ADR complementar.

## Entidade: LegacyCompatibilityItem

Campos:
- `legacyId` (string, obrigatório, único)
- `componentRef` (string, obrigatório)
- `legacyContractType` (enum: `principal|scope|rbac`, obrigatório)
- `dependentOperationKeys` (array<string>, obrigatório)
- `owner` (string, obrigatório)
- `sunsetCriteria` (array<string>, obrigatório)
- `targetWave` (enum: `wave1|wave2|wave3|wave4`, obrigatório)
- `status` (enum: `active|migrating|deprecated|removed`, obrigatório)

Regras:
- Item legado ativo sem owner e sem critério de retirada é inválido.
- Mudança para `deprecated` exige critérios de saída cumpridos + evidências.

## Relacionamentos

- `AuthorizationContext.principal` -> `CanonicalPrincipal` (1:1)
- `ConformanceAssessment.operationKey` -> `CanonicalBusinessOperation.operationKey` (N:1)
- `LegacyCompatibilityItem.dependentOperationKeys[]` -> `CanonicalBusinessOperation.operationKey` (N:N lógico)

## Transicoes de Estado

### ConformanceAssessment
- `nao_conforme -> conforme` quando contrato canônico + scoping canônico + enforcement na camada de serviço + equivalência RBAC forem comprovados.
- `nao_conforme -> excecao_formal` apenas com ADR complementar aprovado.

### LegacyCompatibilityItem
- `active -> migrating`: onda iniciada e plano de migração aprovado.
- `migrating -> deprecated`: todas as operações dependentes migradas e testadas.
- `deprecated -> removed`: janela de transição encerrada sem consumidores ativos.
