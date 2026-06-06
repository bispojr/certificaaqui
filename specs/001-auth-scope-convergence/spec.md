# Feature Specification: Convergencia Transversal de Autorizacao e Escopo

**Feature Branch**: `[001-auth-scope-convergence]`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "Convergencia transversal: contrato canonico de principal autenticado + scoping unificado por evento"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operacao Autorizada com Invariancia API/SSR (Priority: P1)

Como administrador, gestor ou monitor, eu preciso que a mesma operacao de negocio tenha o mesmo comportamento de autorizacao em API e SSR para evitar permissao divergente por canal.

**Why this priority**: elimina o risco arquitetural mais critico da base brownfield: drift de RBAC e escopo entre superficies para o mesmo intento de negocio.

**Independent Test**: para um mesmo quintuplo de operacao, validar em API e SSR que o perfil minimo exigido e o resultado de autorizacao sao identicos.

**Acceptance Scenarios**:

1. **Given** uma operacao de negocio definida pelo mesmo quintuplo canonico em API e SSR, **When** um usuario com perfil abaixo do minimo tenta executa-la, **Then** ambas as superficies negam de forma equivalente.
2. **Given** uma operacao de negocio definida pelo mesmo quintuplo canonico em API e SSR, **When** um usuario com perfil minimo permitido tenta executa-la dentro do escopo valido, **Then** ambas as superficies autorizam de forma equivalente.

---

### User Story 2 - Principal Canonico e Resolucao de Escopo Separada (Priority: P1)

Como arquitetura de seguranca do produto, precisamos que identidade autenticada e escopo de tenant sejam responsabilidades separadas e canonicamente descritas para reduzir ambiguidade e dependencia de legado.

**Why this priority**: sem essa separacao, o sistema permanece suscetivel a bypass por variacao de contrato entre superficies e por acoplamento indevido com detalhes de infraestrutura.

**Independent Test**: validar que toda requisicao autenticada usa contrato canonico de principal e que o escopo de eventos e resolvido por canal especifico de autorizacao, independente da superficie.

**Acceptance Scenarios**:

1. **Given** uma requisicao autenticada em qualquer superficie, **When** o principal e materializado, **Then** ele contem no minimo `subjectId`, `role`, `authChannel`, `sessionId/tokenId` e `tenantScopeMode`.
2. **Given** uma requisicao autenticada com perfil restrito (`gestor` ou `monitor`), **When** a resolucao de escopo falha de forma deterministica, **Then** a operacao e negada de forma segura.
3. **Given** uma requisicao autenticada de `admin`, **When** o escopo e resolvido, **Then** o modo global e representado por `eventoIds = null`.

---

### User Story 3 - Enforcement Canonico no Service Layer (Priority: P1)

Como gestor de conformidade arquitetural, preciso garantir que o isolamento multi-tenant seja aplicado na camada de servico com escopo explicito para prevenir acesso cruzado entre eventos.

**Why this priority**: sem enforcement no service layer, o comportamento em brownfield permanece dependente de variacoes de middleware/controlador e nao garante isolamento verificavel.

**Independent Test**: validar que operacoes de negocio com escopo restrito so produzem resultado quando `eventoIds` explicito e compativel com o recurso alvo.

**Acceptance Scenarios**:

1. **Given** um usuario `gestor` ou `monitor` com conjunto valido de eventos, **When** executa operacao escopada, **Then** somente dados pertencentes aos eventos autorizados sao considerados.
2. **Given** tentativa de operacao escopada sem `eventoIds` explicito para perfil restrito, **When** a avaliacao de autorizacao ocorre, **Then** a operacao e negada por nao conformidade.
3. **Given** uma operacao por recurso unico, **When** o recurso nao pertence aos eventos autorizados do usuario restrito, **Then** a operacao e negada de forma consistente.

---

### User Story 4 - Governanca Brownfield de Conformidade (Priority: P2)

Como responsavel por evolucao arquitetural, preciso de criterios objetivos de conformidade e nao conformidade para avaliar legados sem bloquear a continuidade do produto.

**Why this priority**: a convergencia sera incremental e precisa de marco objetivo para verificar progresso sem detalhar implementacao.

**Independent Test**: classificar um conjunto de operacoes existentes como conforme ou nao conforme usando apenas os criterios desta especificacao.

**Acceptance Scenarios**:

1. **Given** uma operacao com perfil minimo diferente entre API e SSR para mesmo quintuplo, **When** auditada contra esta spec, **Then** e classificada como nao conformidade arquitetural critica.
2. **Given** uma operacao com principal canonico, escopo canonico e enforcement no service layer, **When** auditada contra esta spec, **Then** e classificada como conformidade arquitetural.

### Edge Cases

- Falha deterministica para resolver escopo de eventos de perfil restrito deve sempre resultar em negacao segura, sem fallback permissivo.
- Requisicoes de `admin` nao podem ser indevidamente restringidas por escopo de eventos quando o modo global for aplicavel.
- Operacoes equivalentes com pequenas variacoes de interface (API/SSR) nao podem ser tratadas como operacoes distintas quando preservarem o mesmo quintuplo canonico.
- Operacoes publicas nao autenticadas nao podem herdar comportamento de principal autenticado nem ampliar exposicao de dados fora da politica canonica vigente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST adotar contrato canonico unico do principal autenticado nas superficies API e SSR com atributos minimos `subjectId`, `role`, `authChannel`, `sessionId/tokenId` e `tenantScopeMode`, conforme diretriz de fronteira do SRS e ADR 011.
- **FR-002**: O sistema MUST separar identidade autenticada de resolucao de escopo de tenant, com canal canonico de escopo representado em `req.contextoAutorizacao.eventoIds`.
- **FR-003**: O sistema MUST representar operacoes de `admin` em escopo global canonico com `eventoIds = null`.
- **FR-004**: O sistema MUST negar de forma segura qualquer operacao de `gestor` ou `monitor` quando a resolucao de escopo falhar de forma deterministica.
- **FR-005**: O sistema MUST aplicar enforcement multi-tenant na camada de servico para operacoes escopadas, exigindo `eventoIds` explicito para perfis restritos, em aderencia a ADR 009.
- **FR-006**: O sistema MUST definir equivalencia de autorizacao entre API e SSR por operacao de negocio com base no quintuplo canonico (intento funcional, recurso alvo, efeito de estado, escopo/tenant, classe de risco), conforme ADR 012.
- **FR-007**: O sistema MUST classificar como nao conformidade arquitetural qualquer divergencia de perfil minimo entre API e SSR para o mesmo quintuplo, salvo excecao formal rastreavel em decisao arquitetural complementar.
- **FR-008**: O sistema MUST manter alinhamento com a politica de dados publicos vigente (ADR 014), garantindo que convergencia de autorizacao e escopo nao introduza ampliacao indevida de exposicao em endpoints publicos.
- **FR-009**: O sistema MUST definir criterios objetivos de conformidade e nao conformidade para avaliacao de legados, cobrindo contrato de principal, canal de escopo, regra de admin global, negacao segura de perfis restritos e enforcement no service layer.
- **FR-010**: O sistema MUST estabelecer estrategia de transicao brownfield em nivel de especificacao, com convivencia temporaria controlada, rastreabilidade de desvios e criterio de saida para estado convergido, sem detalhamento de implementacao.
- **FR-011**: O sistema MUST preservar os requisitos de negocio existentes, limitando mudancas ao necessario para convergencia arquitetural de autorizacao e escopo.

### Criterios de Conformidade Arquitetural

Uma operacao e **conforme** quando atende simultaneamente:

- Contrato canonico do principal autenticado presente e consistente entre API e SSR.
- Escopo resolvido fora da identidade e disponibilizado no canal canonico `req.contextoAutorizacao.eventoIds`.
- `admin` operando em modo global com `eventoIds = null`.
- `gestor/monitor` com negacao segura em falha deterministica de escopo.
- Enforcement de tenant executado no service layer com escopo explicito.
- Perfil minimo equivalente para mesmo quintuplo de operacao em API e SSR.

Uma operacao e **nao conforme** quando ocorre qualquer um dos itens:

- Dependencia de contrato legado assimetrico de principal por superficie.
- Mistura entre identidade e escopo no mesmo artefato de autorizacao.
- Escopo implicito, ausente ou inferido por canal nao canonico em perfis restritos.
- Divergencia de perfil minimo para mesmo quintuplo sem excecao arquitetural formal.
- Enforcement fora do service layer como mecanismo principal de isolamento.

### Key Entities *(include if feature involves data)*

- **Principal Autenticado Canonico**: representacao padrao de identidade e atributos minimos de autorizacao, comum a API e SSR.
- **Contexto de Autorizacao**: artefato de requisicao que carrega resultado de escopo por tenant (`eventoIds`) separado da identidade.
- **Operacao de Negocio Canonica**: unidade semantica definida por quintuplo para decisao de perfil minimo e equivalencia entre superficies.
- **Estado de Conformidade Arquitetural**: classificacao auditavel (conforme/nao conforme) por operacao a partir dos criterios desta spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das operacoes de negocio classificadas como equivalentes entre API e SSR apresentam o mesmo perfil minimo requerido para autorizacao.
- **SC-002**: 100% das operacoes escopadas de perfis restritos executadas em avaliacao de conformidade demonstram negacao segura quando o escopo nao e resolvido deterministicamente.
- **SC-003**: 100% das operacoes escopadas avaliadas em conformidade utilizam escopo explicito por evento no service layer.
- **SC-004**: 100% das operacoes auditadas de `admin` utilizam modo global consistente com `eventoIds = null`.
- **SC-005**: 100% dos desvios mapeados na baseline brownfield possuem classificacao de conformidade e status de transicao rastreavel.
- **SC-006**: 0 regressao de requisito de negocio fora do escopo de convergencia arquitetural durante a transicao.

## Assumptions

- A arquitetura em camadas existente (routes -> controllers -> services -> models) permanece como referencia normativa para aplicacao das regras desta spec.
- O quintuplo canonico definido na ADR 012 e suficiente para identificar equivalencia de operacoes entre API e SSR neste contexto.
- A politica de dados publicos da ADR 014 permanece vigente e nao sera flexibilizada por esta convergencia.
- Excecoes de autorizacao por superficie so serao aceitas com formalizacao arquitetural rastreavel.
- A transicao brownfield ocorrera de forma incremental, com prioridade para operacoes de maior risco de seguranca e isolamento multi-tenant.

## Riscos, Dependencias e Premissas de Transicao Brownfield

### Riscos

- Persistencia de contratos legados em partes do sistema pode gerar falsa sensacao de convergencia parcial.
- Divergencias historicas de RBAC por superficie podem reaparecer se a equivalencia por quintuplo nao for aplicada de forma sistematica.
- Lacunas de rastreabilidade de escopo em operacoes antigas podem atrasar validacao de conformidade.

### Dependencias

- Alinhamento normativo com SRS em [docs/especificacoes.md](../../docs/especificacoes.md).
- Alinhamento com enforcement multi-tenant em [docs/decisoes/009-enforcement-multi-tenant.md](../../docs/decisoes/009-enforcement-multi-tenant.md).
- Alinhamento com contrato unificado em [docs/decisoes/011-contrato-unificado-api-ssr.md](../../docs/decisoes/011-contrato-unificado-api-ssr.md).
- Alinhamento com quintuplo e perfil minimo em [docs/decisoes/012-definicao-canonica-perfis-minimos.md](../../docs/decisoes/012-definicao-canonica-perfis-minimos.md).
- Alinhamento com politica de dados publicos em [docs/decisoes/014-politica-dados-expostos-endpoint-publico.md](../../docs/decisoes/014-politica-dados-expostos-endpoint-publico.md).
- Evidencias de baseline em [docs/auditorias/07/triagem-arquitetural-final.md](../../docs/auditorias/07/triagem-arquitetural-final.md).

### Estrategia de Transicao Brownfield (nivel de especificacao)

- Adotar convergencia por ondas de conformidade, priorizando operacoes de maior criticidade arquitetural.
- Permitir convivencia temporaria de componentes legados somente quando classificados e rastreados como nao conformes em transicao.
- Exigir criterio de saida explicito por operacao: somente migrar para estado convergido quando todos os criterios de conformidade desta spec forem atendidos.
- Preservar comportamento de negocio existente, restringindo mudancas ao necessario para convergencia de autorizacao e scoping.
