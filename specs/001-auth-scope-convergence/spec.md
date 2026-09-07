# Feature Specification: Convergência Transversal de Autorização e Escopo

**Feature Branch**: `[001-auth-scope-convergence]`
**Created**: 2026-06-05
**Status**: Completed
**Input**: User description: "Convergência transversal: contrato canônico de principal autenticado + scoping unificado por evento"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Operação Autorizada com Invariância API/SSR (Priority: P1)

Como administrador, gestor ou monitor, eu preciso que a mesma operação de negócio tenha o mesmo comportamento de autorização em API e SSR para evitar permissão divergente por canal.

**Why this priority**: elimina o risco arquitetural mais crítico da base brownfield: drift de RBAC e escopo entre superfícies para o mesmo intento de negócio.

**Independent Test**: para um mesmo quíntuplo de operação, validar em API e SSR que o perfil mínimo exigido e o resultado de autorização são idênticos.

**Acceptance Scenarios**:

1. **Given** uma operação de negócio definida pelo mesmo quíntuplo canônico em API e SSR, **When** um usuário com perfil abaixo do mínimo tenta executá-la, **Then** ambas as superfícies negam de forma equivalente.
2. **Given** uma operação de negócio definida pelo mesmo quíntuplo canônico em API e SSR, **When** um usuário com perfil mínimo permitido tenta executá-la dentro do escopo válido, **Then** ambas as superfícies autorizam de forma equivalente.

---

### User Story 2 - Principal Canônico e Resolução de Escopo Separada (Priority: P1)

Como arquitetura de segurança do produto, precisamos que identidade autenticada e escopo de tenant sejam responsabilidades separadas e canonicamente descritas para reduzir ambiguidade e dependência de legado.

**Why this priority**: sem essa separação, o sistema permanece suscetível a bypass por variação de contrato entre superfícies e por acoplamento indevido com detalhes de infraestrutura.

**Independent Test**: validar que toda requisição autenticada usa contrato canônico de principal e que o escopo de eventos é resolvido por canal específico de autorização, independente da superfície.

**Acceptance Scenarios**:

1. **Given** uma requisição autenticada em qualquer superfície, **When** o principal é materializado, **Then** ele contém no mínimo `subjectId`, `role`, `authChannel`, `sessionId/tokenId` e `tenantScopeMode`.
2. **Given** uma requisição autenticada com perfil restrito (`gestor` ou `monitor`), **When** a resolução de escopo falha de forma determinística, **Then** a operação é negada de forma segura.
3. **Given** uma requisição autenticada de `admin`, **When** o escopo é resolvido, **Then** o modo global é representado por `eventoIds = null`.

---

### User Story 3 - Enforcement Canônico no Service Layer (Priority: P1)

Como gestor de conformidade arquitetural, preciso garantir que o isolamento multi-tenant seja aplicado na camada de serviço com escopo explícito para prevenir acesso cruzado entre eventos.

**Why this priority**: sem enforcement no service layer, o comportamento em brownfield permanece dependente de variações de middleware/controlador e não garante isolamento verificável.

**Independent Test**: validar que operações de negócio com escopo restrito só produzem resultado quando `eventoIds` explícito é compatível com o recurso alvo.

**Acceptance Scenarios**:

1. **Given** um usuário `gestor` ou `monitor` com conjunto válido de eventos, **When** executa operação escopada, **Then** somente dados pertencentes aos eventos autorizados são considerados.
2. **Given** tentativa de operação escopada sem `eventoIds` explícito para perfil restrito, **When** a avaliação de autorização ocorre, **Then** a operação é negada por não conformidade.
3. **Given** uma operação por recurso único, **When** o recurso não pertence aos eventos autorizados do usuário restrito, **Then** a operação é negada de forma consistente.

---

### User Story 4 - Governança Brownfield de Conformidade (Priority: P2)

Como responsável por evolução arquitetural, preciso de critérios objetivos de conformidade e não conformidade para avaliar legados sem bloquear a continuidade do produto.

**Why this priority**: a convergência será incremental e precisa de marco objetivo para verificar progresso sem detalhar implementação.

**Independent Test**: classificar um conjunto de operações existentes como conforme ou não conforme usando apenas os critérios desta especificação.

**Acceptance Scenarios**:

1. **Given** uma operação com perfil mínimo diferente entre API e SSR para mesmo quíntuplo, **When** auditada contra esta spec, **Then** é classificada como não conformidade arquitetural crítica.
2. **Given** uma operação com principal canônico, escopo canônico e enforcement no service layer, **When** auditada contra esta spec, **Then** é classificada como conformidade arquitetural.

### Edge Cases

- Falha determinística para resolver escopo de eventos de perfil restrito deve sempre resultar em negação segura, sem fallback permissivo.
- Requisições de `admin` não podem ser indevidamente restringidas por escopo de eventos quando o modo global for aplicável.
- Operações equivalentes com pequenas variações de interface (API/SSR) não podem ser tratadas como operações distintas quando preservarem o mesmo quíntuplo canônico.
- Operações públicas não autenticadas não podem herdar comportamento de principal autenticado nem ampliar exposição de dados fora da política canônica vigente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST adotar contrato canônico único do principal autenticado nas superfícies API e SSR com atributos mínimos `subjectId`, `role`, `authChannel`, `sessionId/tokenId` e `tenantScopeMode`, conforme diretriz de fronteira do SRS e ADR 011.
- **FR-002**: O sistema MUST separar identidade autenticada de resolução de escopo de tenant, com canal canônico de escopo representado em `req.contextoAutorizacao.eventoIds`.
- **FR-003**: O sistema MUST representar operações de `admin` em escopo global canônico com `eventoIds = null`.
- **FR-004**: O sistema MUST negar de forma segura qualquer operação de `gestor` ou `monitor` quando a resolução de escopo falhar de forma determinística.
- **FR-005**: O sistema MUST aplicar enforcement multi-tenant na camada de serviço para operações escopadas, exigindo `eventoIds` explícito para perfis restritos, em aderência à ADR 009.
- **FR-006**: O sistema MUST definir equivalência de autorização entre API e SSR por operação de negócio com base no quíntuplo canônico (intento funcional, recurso alvo, efeito de estado, escopo/tenant, classe de risco), conforme ADR 012.
- **FR-007**: O sistema MUST classificar como não conformidade arquitetural qualquer divergência de perfil mínimo entre API e SSR para o mesmo quíntuplo, salvo exceção formal rastreável em decisão arquitetural complementar.
- **FR-008**: O sistema MUST manter alinhamento com a política de dados públicos vigente (ADR 014), garantindo que convergência de autorização e escopo não introduza ampliação indevida de exposição em endpoints públicos.
- **FR-009**: O sistema MUST definir critérios objetivos de conformidade e não conformidade para avaliação de legados, cobrindo contrato de principal, canal de escopo, regra de admin global, negação segura de perfis restritos e enforcement no service layer.
- **FR-010**: O sistema MUST estabelecer estratégia de transição brownfield em nível de especificação, com convivência temporária controlada, rastreabilidade de desvios e critério de saída para estado convergido, sem detalhamento de implementação.
- **FR-011**: O sistema MUST preservar os requisitos de negócio existentes, limitando mudanças ao necessário para convergência arquitetural de autorização e escopo.

### Critérios de Conformidade Arquitetural

Uma operação é **conforme** quando atende simultaneamente:

- Contrato canônico do principal autenticado presente e consistente entre API e SSR.
- Escopo resolvido fora da identidade e disponibilizado no canal canônico `req.contextoAutorizacao.eventoIds`.
- `admin` operando em modo global com `eventoIds = null`.
- `gestor/monitor` com negação segura em falha determinística de escopo.
- Enforcement de tenant executado no service layer com escopo explícito.
- Perfil mínimo equivalente para mesmo quíntuplo de operação em API e SSR.

Uma operação é **não conforme** quando ocorre qualquer um dos itens:

- Dependência de contrato legado assimétrico de principal por superfície.
- Mistura entre identidade e escopo no mesmo artefato de autorização.
- Escopo implícito, ausente ou inferido por canal não canônico em perfis restritos.
- Divergência de perfil mínimo para mesmo quíntuplo sem exceção arquitetural formal.
- Enforcement fora do service layer como mecanismo principal de isolamento.

### Key Entities _(include if feature involves data)_

- **Principal Autenticado Canônico**: representação padrão de identidade e atributos mínimos de autorização, comum a API e SSR.
- **Contexto de Autorização**: artefato de requisição que carrega resultado de escopo por tenant (`eventoIds`) separado da identidade.
- **Operação de Negócio Canônica**: unidade semântica definida por quíntuplo para decisão de perfil mínimo e equivalência entre superfícies.
- **Estado de Conformidade Arquitetural**: classificação auditável (conforme/não conforme) por operação a partir dos critérios desta spec.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das operações de negócio classificadas como equivalentes entre API e SSR apresentam o mesmo perfil mínimo requerido para autorização.
- **SC-002**: 100% das operações escopadas de perfis restritos executadas em avaliação de conformidade demonstram negação segura quando o escopo não é resolvido deterministicamente.
- **SC-003**: 100% das operações escopadas avaliadas em conformidade utilizam escopo explícito por evento no service layer.
- **SC-004**: 100% das operações auditadas de `admin` utilizam modo global consistente com `eventoIds = null`.
- **SC-005**: 100% dos desvios mapeados na baseline brownfield possuem classificação de conformidade e status de transição rastreável.
- **SC-006**: 0 regressão de requisito de negócio fora do escopo de convergência arquitetural durante a transição.

## Assumptions

- A arquitetura em camadas existente (routes -> controllers -> services -> models) permanece como referência normativa para aplicação das regras desta spec.
- O quíntuplo canônico definido na ADR 012 é suficiente para identificar equivalência de operações entre API e SSR neste contexto.
- A política de dados públicos da ADR 014 permanece vigente e não será flexibilizada por esta convergência.
- Exceções de autorização por superfície só serão aceitas com formalização arquitetural rastreável.
- A transição brownfield ocorrerá de forma incremental, com prioridade para operações de maior risco de segurança e isolamento multi-tenant.

## Riscos, Dependências e Premissas de Transição Brownfield

### Riscos

- Persistência de contratos legados em partes do sistema pode gerar falsa sensação de convergência parcial.
- Divergências históricas de RBAC por superfície podem reaparecer se a equivalência por quíntuplo não for aplicada de forma sistemática.
- Lacunas de rastreabilidade de escopo em operações antigas podem atrasar validação de conformidade.

### Dependências

- Alinhamento normativo com SRS em [docs/especificacoes.md](../../docs/especificacoes.md).
- Alinhamento com enforcement multi-tenant em [docs/decisoes/009-enforcement-multi-tenant.md](../../docs/decisoes/009-enforcement-multi-tenant.md).
- Alinhamento com contrato unificado em [docs/decisoes/011-contrato-unificado-api-ssr.md](../../docs/decisoes/011-contrato-unificado-api-ssr.md).
- Alinhamento com quíntuplo e perfil mínimo em [docs/decisoes/012-definicao-canonica-perfis-minimos.md](../../docs/decisoes/012-definicao-canonica-perfis-minimos.md).
- Alinhamento com política de dados públicos em [docs/decisoes/014-politica-dados-expostos-endpoint-publico.md](../../docs/decisoes/014-politica-dados-expostos-endpoint-publico.md).
- Evidências de baseline em [docs/auditorias/07/triagem-arquitetural-final.md](../../docs/auditorias/07/triagem-arquitetural-final.md).

### Estratégia de Transição Brownfield (nível de especificação)

- Adotar convergência por ondas de conformidade, priorizando operações de maior criticidade arquitetural.
- Permitir convivência temporária de componentes legados somente quando classificados e rastreados como não conformes em transição.
- Exigir critério de saída explícito por operação: somente migrar para estado convergido quando todos os critérios de conformidade desta spec forem atendidos.
- Preservar comportamento de negócio existente, restringindo mudanças ao necessário para convergência de autorização e escopo.
