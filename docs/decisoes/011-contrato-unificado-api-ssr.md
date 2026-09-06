# ADR 011 — Contrato Unificado de `req.usuario` entre API e SSR

## Status

Aprovado

## Contexto

O sistema possui duas superfícies autenticadas com mecanismos deliberadamente distintos: API REST com Bearer JWT e SSR com cookie JWT. Essa assimetria de transporte é aderente ao contexto funcional e não está em discussão nesta decisão.

O problema arquitetural identificado na triagem final é que o objeto `req.usuario` possui contratos incompatíveis entre as duas superfícies. Na API, o contrato é orientado a instância ORM com capacidades de associação. No SSR, o contrato é um objeto plano reduzido. Essa divergência inviabiliza reutilização de middlewares de autorização e força duplicação de regras de escopo e ownership em camadas distintas.

A criticidade é alta porque o tema afeta transversalmente todos os domínios com controle de acesso e bloqueia a convergência arquitetural já apontada pela estratégia canônica de enforcement multi-tenant.

## Problema

A coexistência de dois contratos semânticos para `req.usuario` gera os seguintes efeitos sistêmicos:

1. Incompatibilidade de middlewares entre API e SSR por dependência de capacidades não portáveis.
2. Duplicação de lógica de autorização em controllers SSR, com risco estrutural de drift funcional.
3. Fragilidade de manutenção e teste, pois autorização passa a depender da superfície de entrada e não de um contrato arquitetural único.
4. Acoplamento indevido entre autenticação e autorização: o formato do principal autenticado passa a ditar regras de escopo.

A decisão precisa preservar o mecanismo de autenticação de cada superfície e, ao mesmo tempo, unificar semanticamente o principal autenticado consumido por autorização e regras de domínio.

## Decisão

Adotar contrato canônico único para `req.usuario` baseado em objeto de domínio explícito, estável e serializável, comum a API e SSR.

O contrato canônico deve representar identidade e autorização mínima necessárias de forma agnóstica ao mecanismo de autenticação e agnóstica à tecnologia de persistência. Capacidades de acesso a escopo de eventos devem ser tratadas como resolução sob demanda por abstração dedicada, e não como método acoplado ao objeto autenticado.

Com isso, autenticação permanece assimétrica por superfície, mas autorização passa a depender de uma interface única de principal autenticado.

### Contrato canônico mínimo do principal autenticado

O principal autenticado deve expor, de forma obrigatória e uniforme entre API e SSR:

1. `subjectId` — identificador do usuário autenticado.
2. `role` — perfil autorizado (`admin`, `gestor`, `monitor`).
3. `authChannel` — canal de autenticação (`api` ou `ssr`) para auditoria e rastreabilidade.
4. `sessionId` ou `tokenId` — identificador de sessão/token quando aplicável.
5. `tenantScopeMode` — modo de escopo (`global` para `admin`, `restricted` para `gestor/monitor`).

Capacidades ORM e métodos de associação não fazem parte do contrato canônico.

### Fronteira canônica entre identidade e escopo

1. Identidade autenticada descreve **quem** é o principal e **qual** seu perfil.
2. Resolução de escopo descreve **sobre quais eventos** a operação pode atuar.
3. Em perfis restritos (`gestor`, `monitor`), falha determinística na resolução de escopo implica negação segura da operação.
4. O resultado da resolução de escopo deve ser disponibilizado no request como `req.contextoAutorizacao.eventoIds`.

## Alternativas Consideradas

1. `authSSR` carregar entidade ORM completa para espelhar API

- Vantagem: compatibilidade imediata com middlewares atuais baseados em capacidades ORM.
- Desvantagem: custo recorrente por requisição SSR, aumento de acoplamento com ORM, expansão de superfície de dados no contexto de renderização.
- Conclusão: não adotada como direção arquitetural padrão por custo sistêmico e acoplamento.

2. API e SSR produzirem objeto canônico explícito; resolução de escopo por abstração dedicada

- Vantagem: contrato estável, portável entre superfícies, redução de acoplamento com ORM, alinhamento com arquitetura em camadas.
- Desvantagem: exige convergência de pontos de consumo de autorização para depender de abstrações explícitas de escopo.
- Conclusão: alternativa adotada.

3. Resolver eventos apenas nos services via helper centralizado

- Vantagem: centraliza acesso a escopo no domínio.
- Desvantagem: não resolve por si só a divergência de contrato em middlewares e controllers; mantém ambiguidade em fronteiras de autorização.
- Conclusão: tratada como complemento possível da decisão adotada, não como decisão principal de contrato.

## Consequências

### Positivas

1. Unificação semântica do principal autenticado entre API e SSR.
2. Redução de duplicação de regras de autorização e de escopo.
3. Aumento de previsibilidade para testes e auditoria de segurança.
4. Menor acoplamento entre autorização e detalhes de ORM.
5. Desbloqueio arquitetural para reuso consistente de políticas de acesso em todos os domínios.

### Negativas

1. Necessidade de alinhamento transversal dos consumidores de `req.usuario` para o contrato canônico.
2. Convivência temporária com adaptadores durante período de transição arquitetural.
3. Risco de regressão de autorização caso coexistam contratos legados sem política de depreciação explícita.
4. Dependência de definição formal de fronteira entre identidade autenticada e resolução de escopo.

## Impactos Arquiteturais

1. Segurança e autorização: autorização deixa de inferir capacidades pela superfície e passa a inferir por contrato único.
2. Camadas: preserva separação entre autenticação, autorização e acesso a dados, em conformidade com arquitetura em camadas.
3. Multi-tenant: fornece pré-condição arquitetural para enforcement consistente de escopo entre API e SSR.
4. Governança: transforma `req.usuario` em artefato arquitetural versionável, auditável e independente de mecanismo de transporte.

## Riscos

1. Risco de contrato canônico incompleto para cenários de autorização avançada.
2. Risco de manter caminhos legados ativos além do período aceitável.
3. Risco de divergência entre documentação arquitetural e comportamento real caso não haja validação contínua.
4. Risco de ambiguidades de fronteira entre dados de identidade e dados derivados de escopo.

## Dependências

1. Dependência de coerência com a estratégia de enforcement multi-tenant já definida em `docs/decisoes/009-enforcement-multi-tenant.md`.
2. Dependência de coerência com o modelo de vínculos N:N de usuário-evento em `docs/decisoes/005-usuario-evento-nn.md`.
3. Dependência de coerência com decisão de ORM em `docs/decisoes/001-orm-sequelize.md`, sem reintroduzir acoplamento indevido no contrato autenticado.
4. Dependência de validação cruzada com a decisão de scoping de participantes em `docs/decisoes/010-scoping-participantes-sem-evento.md`, dado o impacto em autorização transversal.

## Relação com SRS

Esta decisão é compatível e necessária para sustentar, sem alterá-los, os requisitos do SRS em `docs/especificacoes.md`, especialmente:

1. FR-30: coexistência dos dois fluxos de autenticação.
2. FR-31: identidade autenticada consistente para endpoint de usuário corrente.
3. FR-32: vínculo usuário-evento como base de escopo para perfis restritos.
4. FR-34, FR-35, FR-36, FR-37: regras de RBAC e isolamento por evento.
5. FR-49 e FR-56: consistência de comportamento entre painel SSR e políticas de escopo.
6. NFR-1 e NFR-6: segurança de acesso e separação arquitetural de responsabilidades.

Não introduz novos requisitos funcionais. Formaliza decisão de contrato arquitetural para viabilizar requisitos já existentes.

## Observações

1. Esta ADR não altera o mecanismo de autenticação de API ou SSR; altera apenas o contrato arquitetural consumido por autorização.
2. Ambiguidades de fronteira resolvidas (2026-06-05):

- Delimitação entre atributos obrigatórios de identidade e atributos derivados de escopo.
- Canal canônico de escopo no request (`req.contextoAutorizacao.eventoIds`).
- Critério de negação segura quando o escopo não puder ser resolvido de forma determinística para perfis restritos.

3. Política de coexistência e descontinuação de contratos legados deve ser controlada por janela de transição explícita em plano de execução, sem alterar esta decisão arquitetural.
4. A decisão foi formulada com base em `docs/especificacoes.md`, `docs/auditorias/07/triagem-arquitetural-final.md` e no conjunto de ADRs vigentes em `docs/decisoes`.
