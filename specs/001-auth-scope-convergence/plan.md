# Plano de Implementação: Convergência Transversal de Autorização e Escopo

**Branch**: `001-auth-scope-convergence` | **Date**: 2026-06-05 | **Spec**: `/specs/001-auth-scope-convergence/spec.md`
**Input**: Feature specification from `/specs/001-auth-scope-convergence/spec.md`

## Resumo

Convergir autorização e escopo entre API/SSR em brownfield sem alterar regra de negócio: adotar principal canônico único, scoping canônico em `req.contextoAutorizacao.eventoIds`, enforcement na camada de serviço e equivalência de perfil mínimo por quíntuplo de operação (ADR 009/011/012/014 + SRS). A execução será incremental por ondas, com convivência controlada de legado, critérios objetivos de depreciação e auditoria de conformidade por operação.

## Technical Context

**Language/Version**: Node.js >= 24 (JavaScript CommonJS)  
**Primary Dependencies**: Express.js, jsonwebtoken, Sequelize, PostgreSQL, Handlebars, Jest, Playwright  
**Storage**: PostgreSQL (principal), SQLite apenas para alguns testes unitários  
**Testing**: Jest (unit/integration), Playwright (e2e), auditoria arquitetural por matriz de conformidade  
**Target Platform**: Linux server (Docker/docker-compose)  
**Project Type**: Web application monolítica (API REST + SSR)  
**Performance Goals**: Zero regressão perceptível em latência de autorização; manter comportamento atual de throughput administrativo  
**Constraints**: Preservar invariantes ADR 009/011/012/014 e SRS; não expandir escopo funcional; transição incremental com rollback por onda  
**Scale/Scope**: Convergência transversal em middlewares, controllers API/SSR e services com maior risco multi-tenant/RBAC

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0

- [x] **I. Fonte de Verdade** — SRS em `docs/especificacoes.md` e backlog em `docs/backlog/dominios-backlog.md` consultados; escopo restrito à convergência arquitetural.
- [x] **II. Test-First** — Plano exige testes por onda antes da implementação e gate final com `npm run check`.
- [x] **III. Layered MVC** — Enforcement definido no service layer; controllers apenas orquestram; sem deslocar regra para rotas/models.
- [x] **IV. Soft Delete** — Não há mudança de política de remoção; invariantes de soft delete preservadas.
- [x] **V. Security/RBAC** — Contrato canônico de principal, RBAC por quíntuplo e negação segura para escopo falho previstos no plano.

### Post-Phase 1 (Re-check)

- [x] Artefatos de design mantêm separação identidade x escopo e contrato canônico API/SSR.
- [x] Críticos de regressão multi-tenant/RBAC possuem mitigação e validação por camada de teste.
- [x] Estratégia de convivência/depreciação legada está objetiva e rastreável por critério de saída.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-scope-convergence/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── authorization-scope-convergence.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── middlewares/
├── controllers/
├── services/
├── routes/
└── models/

tests/
├── middleware/
├── controllers/
├── services/
├── routes/
└── e2e/

docs/
├── especificacoes.md
├── backlog/
└── decisoes/
```

**Structure Decision**: Monolito web existente (API + SSR) com refatoração incremental em `src/` e cobertura em `tests/`, sem criar novos módulos de runtime.

## Fases e Ondas (Brownfield)

### Onda 0 - Baseline e Mapa de Conformidade

**Objetivo**: estabelecer baseline auditável por operação (quíntuplo), sem alterar comportamento.

**Entradas**:

- Spec 001 aprovada.
- ADR 009/011/012/014 e SRS vigentes.
- Inventário inicial de operações API/SSR alvo.

**Atividades**:

- Catalogar operações por quíntuplo e perfil mínimo atual em API e SSR.
- Classificar conformidade inicial: conforme / não conforme / exceção formal.
- Identificar pontos de contrato legado de principal e canais não canônicos de escopo.

**Saidas (Gate)**:

- Matriz baseline consolidada com 100% das operações prioritárias P1.
- Lista priorizada de desvios críticos (drift RBAC + risco multi-tenant).
- Sem mudanças funcionais em runtime.

### Onda 1 - Contrato Canônico de Principal (Convergência de Fronteira)

**Objetivo**: unificar principal autenticado API/SSR com adaptação controlada de legado.

**Entradas**:

- Onda 0 concluida.
- Definição de contrato canônico pronta nos contratos da feature.

**Atividades**:

- Introduzir materialização canônica (`subjectId`, `role`, `authChannel`, `sessionId/tokenId`, `tenantScopeMode`).
- Isolar adaptadores legados temporários para consumidores ainda não migrados.
- Publicar critério de depreciação dos adaptadores (por cobertura de operações).

**Saidas (Gate)**:

- API e SSR populam principal canônico no request.
- Nenhum endpoint crítico depende diretamente de capacidade ORM no principal.
- Adaptadores legados rastreados com owner + prazo de retirada.

### Onda 2 - Scoping Canônico e Negação Segura

**Objetivo**: separar identidade de escopo e padronizar canal canônico de escopo.

**Entradas**:

- Onda 1 concluida.
- Resolução de evento por vínculo usuário-evento operacional.

**Atividades**:

- Resolver escopo em `req.contextoAutorizacao.eventoIds` (admin global com `null`).
- Garantir negação segura para `gestor/monitor` em falha determinística de escopo.
- Remover dependências de canal legado (`req.query` como proxy de segurança).

**Saidas (Gate)**:

- 100% das operações P1 usam canal canônico de escopo.
- Falhas determinísticas de escopo resultam em negação segura (API/SSR).
- Sem regressão de acesso admin global.

### Onda 3 - Enforcement na Camada de Serviço e Equivalência RBAC

**Objetivo**: consolidar isolamento multi-tenant e equivalência de perfil mínimo por quíntuplo.

**Entradas**:

- Onda 2 concluida.
- Services alvo mapeados por domínio.

**Atividades**:

- Aplicar filtro/ownership por `eventoIds` explicitamente no service layer.
- Alinhar API e SSR para perfil mínimo idêntico por quíntuplo.
- Registrar e tratar divergências como não conformidade (ou exceção formal ADR).

**Saidas (Gate)**:

- Operações P1 sem drift de perfil mínimo API/SSR.
- Operações escopadas sem bypass cross-tenant detectável.
- Matriz de conformidade atualizada para status convergido nas operações migradas.

### Onda 4 - Depreciação de Legado e Fechamento de Convergência

**Objetivo**: retirar convivência legada e fechar estado convergido auditável.

**Entradas**:

- Ondas 1-3 concluídas com evidências de teste.
- Lista de componentes legados em transição com status.

**Atividades**:

- Remover adaptadores/paths legados que ainda mantinham contratos antigos.
- Congelar critério objetivo de depreciação por operação.
- Executar auditoria final de conformidade arquitetural.

**Saidas (Gate)**:

- 0 consumidores ativos de contrato legado de principal/escopo.
- 100% das operações no escopo da feature classificadas como conformes ou com exceção formal aprovada.
- Estado pronto para gerar tasks de execução detalhada.

## Convivência de Legado e Depreciação

Durante transição, legado pode coexistir somente sob controle:

1. Cada item legado deve ter identificador, dono, risco e prazo.
2. Coexistência permitida apenas enquanto houver operações não migradas dependentes.
3. Critério objetivo de depreciação por item:

- todas as operações consumidoras migradas para contrato canônico;
- cobertura de teste unit/integration/e2e verde para casos equivalentes API/SSR;
- evidência de auditoria sem drift para o quíntuplo associado.

4. Item sem evidências não pode ser removido; item com evidências não pode permanecer ativo após janela da onda.

## Dependências Críticas

1. ADR 009: enforcement multi-tenant na camada de serviço com `eventoIds` explícito.
2. ADR 011: contrato canônico de principal entre API e SSR.
3. ADR 012: perfil mínimo definido por quíntuplo, independente de superfície.
4. ADR 014: nenhuma ampliação indevida em endpoints públicos durante convergência.
5. SRS (`docs/especificacoes.md`): FR-34..FR-38, FR-62, NFR-1, NFR-6 e diretrizes de fronteira.
6. Baseline de auditoria (`docs/auditorias/07/triagem-arquitetural-final.md`).

## Riscos e Mitigações

1. **Regressão cross-tenant em rotas por ID**

- Mitigação: ownership na camada de serviço e testes de autorização negativa por domínio.

2. **Drift RBAC entre API e SSR durante migração parcial**

- Mitigação: matriz de equivalência por quíntuplo como gate de cada onda.

3. **Quebra de fluxos admin globais**

- Mitigação: testes dedicados para `eventoIds = null` em services e e2e admin.

4. **Persistência de legado sem retirada**

- Mitigação: política de depreciação objetiva com owner/prazo/evidência obrigatória.

5. **Mudança acidental de escopo de negócio**

- Mitigação: regra de não expansão no review de cada PR + checklist de aderência ao SRS.

## Estratégia de Validação do Plano

### Unit

- Middlewares/adapters: materialização canônica do principal e resolução de escopo.
- Services: filtros de `eventoIds`, ownership por recurso e regras admin/restrito.

### Integration

- API e SSR para mesma operação (mesmo quíntuplo) com asserção de perfil mínimo equivalente.
- Casos de falha determinística de escopo para `gestor/monitor` com negação segura.

### E2E

- Fluxos ponta-a-ponta por perfil (`admin`, `gestor`, `monitor`) em operações de maior risco.
- Verificação de não regressão em endpoints públicos alinhados à ADR 014.

### Auditoria de Conformidade

- Matriz de operações com status conforme/não conforme/exceção formal.
- Críticos de saída por onda: drift RBAC, scoping canônico, enforcement na camada de serviço.
- Crítico final: SC-001..SC-006 da spec com evidência rastreável.

## Pronto para /speckit.tasks

Condições para gerar tasks:

1. Artefatos de design da feature gerados (research, data-model, contracts, quickstart).
2. Gates de Onda 0 definidos e sem clarificações pendentes.
3. Dependências críticas e riscos com mitigação explicitados.

Status atual: **PRONTO**, com escopo da feature delimitado para decomposição em tarefas de implementação.

## Complexity Tracking

Sem violacoes da constituicao que exijam excecao formal neste plano.
