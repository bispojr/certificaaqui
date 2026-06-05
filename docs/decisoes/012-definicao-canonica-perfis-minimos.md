# ADR 012 — Definição Canônica de Perfis Mínimos por Operação

## Status

Aprovado

## Contexto

O sistema CertificaAqui opera com duas superfícies funcionais para os mesmos casos de uso de negócio: API REST e SSR. O SRS define papéis (`admin`, `gestor`, `monitor`) e hierarquia de privilégio, mas não formaliza, de modo canônico, o perfil mínimo por operação de negócio independentemente da superfície.

A triagem arquitetural final da rodada 07 identificou assimetrias recorrentes entre API e SSR para operações equivalentes, com permissões mais amplas em uma superfície e mais restritas em outra, sem justificativa arquitetural registrada. Esse padrão aparece como risco sistêmico de segurança e de regressão funcional, com impacto transversal em todos os domínios.

As ADRs existentes já estabeleceram princípios estruturantes relevantes:

- ADR 009: enforcement de isolamento multi-tenant deve ser canônico e verificável, não dependente de variações ad hoc por superfície.
- ADR 011: o contrato de autorização deve ser unificado entre API e SSR, evitando divergência semântica por canal de acesso.

Nesse contexto, falta uma decisão explícita de arquitetura para o eixo RBAC: qual é a regra canônica para determinar o perfil mínimo autorizado por operação.

## Problema

Para a mesma operação de negócio, API REST e SSR aplicam perfis RBAC diferentes sem decisão arquitetural formal que justifique a divergência.

Essa ausência de canonicidade cria quatro efeitos arquiteturais críticos:

1. Quebra de invariância de segurança: a superfície de entrada passa a alterar privilégio necessário para a mesma capacidade de negócio.
2. Regressão de governança: correções de RBAC deixam de ser globais e passam a depender de revisão manual endpoint a endpoint.
3. Inconsistência de conformidade: o SRS define papéis e escopo, mas não assegura rastreabilidade objetiva do perfil mínimo por operação.
4. Acoplamento indevido entre camada de apresentação e política de autorização: decisão de UI/transporte influencia política de acesso.

## Decisão

Adotar a regra arquitetural canônica de que o **perfil mínimo é definido por operação de negócio e não pela superfície**.

Com isso:

1. Cada operação de negócio possui um único perfil mínimo autorizado, aplicável de forma equivalente em API e SSR.
2. Diferença de superfície não é critério válido para ampliar ou reduzir privilégio mínimo por si só.
3. Exceções só são admissíveis quando houver justificativa arquitetural explícita, documentada e rastreável no SRS e em ADR específica complementar.
4. Na ausência de justificativa formal de exceção, divergências entre API e SSR devem ser tratadas como não conformidade arquitetural.

Esta decisão não define implementação, nem detalha matriz operacional completa de permissões. Ela define o princípio canônico de autorização para estabilizar o desenho arquitetural do RBAC no sistema.

### Critério formal de identificação de operação de negócio

Uma operação de negócio é definida pelo quíntuplo canônico:

1. Intento funcional da ação de domínio.
2. Recurso de domínio alvo.
3. Efeito de estado esperado (leitura, criação, alteração, remoção, restauração, cancelamento).
4. Escopo de dados/tenant aplicável.
5. Classe de risco de segurança e conformidade.

Dois fluxos em superfícies diferentes (API e SSR) representam a mesma operação de negócio quando preservam o mesmo quíntuplo. Nesse caso, devem compartilhar o mesmo perfil mínimo.

Exceções por superfície só são válidas quando formalizadas em ADR complementar e refletidas no SRS com justificativa explícita de risco.

## Alternativas Consideradas

1. Perfil unificado por operação de negócio, independente da superfície (adotada).
Trade-off: aumenta consistência arquitetural e auditabilidade, com custo de revisão de alinhamento em fluxos já divergentes.

2. Perfis distintos por superfície, desde que documentados no SRS com justificativa explícita.
Trade-off: preserva flexibilidade localizada, porém eleva complexidade de governança, risco de drift entre canais e custo de validação contínua.

3. Manter divergências sem regra formal, tratando ajustes de RBAC como decisão local por endpoint.
Trade-off: menor atrito de curto prazo, porém incompatível com controle arquitetural de segurança e com rastreabilidade de requisitos.

## Consequências

### Positivas

- Estabelece invariância de autorização entre API e SSR para a mesma operação de negócio.
- Reduz superfície de privilege escalation por inconsistência de configuração RBAC entre canais.
- Melhora auditabilidade e rastreabilidade entre SRS, ADRs e comportamento observado.
- Fornece critério objetivo para classificar divergências como defeito arquitetural e não como variação funcional legítima.
- Reforça coesão com ADR 009 (canonicidade de enforcement) e ADR 011 (contrato unificado de autorização).

### Negativas

- Exige convergência de endpoints legados que hoje operam com políticas distintas entre API e SSR.
- Pode expor ambiguidades do SRS em operações ainda não mapeadas explicitamente a perfil mínimo.
- Impõe disciplina documental adicional para qualquer exceção legítima por superfície.
- Pode demandar reavaliação de backlog priorizado por domínio, dado impacto transversal.

## Impactos Arquiteturais

- Autorização deixa de ser atributo implícito de rota/superfície e passa a ser atributo explícito da operação de negócio.
- API e SSR tornam-se projeções de uma mesma política de acesso, reduzindo drift comportamental.
- O desenho em camadas mantém separação de responsabilidade: transporte não define política de autorização.
- A governança de segurança passa a exigir rastreabilidade bidirecional: operação de negócio <-> perfil mínimo <-> requisitos SRS.

## Riscos

1. Ambiguidade de fronteira entre "operação de negócio" e "variante de interface" pode gerar classificação inconsistente.
2. Sem taxonomia canônica de operações, pode haver interpretações conflitantes entre times.
3. Exceções por superfície sem critério objetivo podem reintroduzir o mesmo problema sob nova nomenclatura.
4. Divergências históricas podem persistir por janela prolongada se não houver validação arquitetural contínua.

## Dependências

1. SRS em [docs/especificacoes.md](../especificacoes.md): base normativa de papéis, escopo e requisitos de RBAC (FR-34 a FR-38, NFR-1, NFR-6).
2. Triagem final em [docs/auditorias/07/triagem-arquitetural-final.md](../auditorias/07/triagem-arquitetural-final.md): evidência consolidada das assimetrias e criticidade sistêmica.
3. ADR 009 em [docs/decisoes/009-enforcement-multi-tenant.md](009-enforcement-multi-tenant.md): canonicidade de enforcement de escopo.
4. ADR 011 em [docs/decisoes/011-contrato-unificado-api-ssr.md](011-contrato-unificado-api-ssr.md): unificação semântica do principal autenticado entre API e SSR.

## Relação com SRS

Esta ADR não cria novos requisitos funcionais. Ela formaliza critério arquitetural para interpretar e aplicar requisitos já existentes:

- FR-34: acesso irrestrito de `admin` permanece invariável entre superfícies.
- FR-35 e FR-36: permissões de `gestor` e `monitor` devem ser avaliadas por operação de negócio, não por canal.
- FR-37: restrição por escopo de evento deve ser coerente em qualquer superfície da mesma operação.
- FR-38: proteção por autenticação e RBAC na API não autoriza assimetria sem justificativa frente à SSR para a mesma capacidade.
- NFR-1 e NFR-6: reforça segurança de acesso com separação arquitetural adequada entre camada de transporte e política de autorização.

**Ambiguidades de fronteira resolvidas (2026-06-05):**

1. O critério canônico para identificar operação de negócio passa a ser o quíntuplo definido na seção de decisão desta ADR.
2. Casos limítrofes entre API e SSR devem ser classificados pelo quíntuplo; se o quíntuplo divergir, trata-se de operação distinta e requer rastreabilidade própria no SRS.

## Observações

1. Esta ADR é deliberadamente normativa e arquitetural; não inclui plano de execução, refatorações detalhadas ou matriz operacional exaustiva.
2. Qualquer exceção futura ao princípio de perfil mínimo unificado por operação deve ser tratada como decisão arquitetural explícita, com justificativa de risco e atualização de rastreabilidade no SRS.
3. Divergências entre API e SSR para a mesma operação (mesmo quíntuplo) devem ser tratadas como não conformidade arquitetural crítica.