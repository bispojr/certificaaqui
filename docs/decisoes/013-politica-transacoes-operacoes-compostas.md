# ADR 013 — Política de Transações em Operações Compostas

## Status

Aprovado

## Contexto

O CertificaAqui adota Node.js, Express, Sequelize e PostgreSQL, com arquitetura em camadas `routes -> controllers -> services -> models` e superfícies API REST + SSR. As decisões arquiteturais vigentes já estabeleceram:

1. Sequelize como ORM oficial (ADR 001).
2. Soft delete como estratégia canônica de preservação e restauração de dados (ADR 002).
3. Necessidade de enforcement canônico e consistente entre superfícies para requisitos transversais (ADR 009 e ADR 011).

Na triagem arquitetural consolidada da rodada 07, foi identificado padrão sistêmico de ausência de atomicidade transacional em operações compostas (PST-04), com três achados críticos diretamente relacionados: STF-009, STF-043 e STF-022.

## Problema

Há ausência total de `sequelize.transaction()` nas operações compostas do service layer. Como consequência, operações que devem ser semanticamente indivisíveis são executadas como múltiplas operações independentes.

Esse desenho expõe o sistema a:

1. Race conditions em cenários concorrentes.
2. Estados intermediários inválidos quando ocorre falha parcial.
3. Violação de invariantes de integridade em fluxos com soft delete e restore.

Impactos já observados na triagem:

1. STF-009: colisão de código de certificado em contexto de concorrência e soft delete.
2. STF-043: restauração com reativação indevida de vínculos em cascata.
3. STF-022: não atomicidade sistêmica em operações compostas.

## Decisão

Adotar transações explícitas com `sequelize.transaction()` como política arquitetural mandatória para todas as operações compostas que alterem estado persistido e dependam de consistência entre múltiplas mutações relacionadas.

A decisão é normativa no nível arquitetural e estabelece que a fronteira transacional pertence ao service layer, onde a regra de negócio composta é orquestrada.

Esta ADR não define roteiro de implementação, nem detalha assinatura de métodos, isolamentos por operação ou plano de migração de código legado. Define o princípio arquitetural obrigatório de atomicidade para operações compostas.

## Alternativas Consideradas

1. Transações em todas as operações compostas no service layer (adotada).
   Trade-off: maior garantia de integridade e previsibilidade sob concorrência, com custo potencial de contenção de locks e aumento de latência em fluxos de escrita.

2. Transações apenas em operações consideradas críticas (certificados e vínculos usuário-evento).
   Trade-off: menor custo operacional de curto prazo, porém mantém lacunas de consistência e risco de regressão em outros domínios que também executam mutações compostas.

3. Uso de sequência de banco para geração de código, sem política transacional ampla.
   Trade-off: reduz uma classe específica de corrida na geração de código, mas não resolve falhas de atomicidade em cascatas de soft delete/restore nem em outras operações compostas multi-entidade.

## Consequências

### Positivas

1. Estabelece atomicidade como invariante arquitetural explícita para operações compostas.
2. Reduz risco de estados intermediários inválidos em falhas parciais.
3. Reduz superfície de race conditions em fluxos concorrentes de escrita.
4. Alinha comportamento de persistência aos requisitos de confiabilidade e restauração do SRS.
5. Melhora auditabilidade arquitetural: ausência de transação em operação composta passa a ser não conformidade objetiva.

### Negativas

1. Pode elevar contenção de lock, especialmente em cargas concorrentes elevadas.
2. Pode aumentar latência de operações de escrita em cenários com múltiplas entidades relacionadas.
3. Exige disciplina arquitetural para delimitar corretamente fronteiras transacionais.
4. Se aplicada sem critério de escopo transacional, pode ampliar risco de deadlocks.

## Impactos Arquiteturais

1. Service layer torna-se fronteira canônica de atomicidade, reforçando NFR-6 (separação de responsabilidades).
2. Estratégia de soft delete/restore (ADR 002) passa a depender explicitamente de consistência transacional em operações em cascata.
3. Regras de geração e persistência de certificados (incluindo código incremental) passam a ser tratadas sob invariantes de concorrência, não apenas validação funcional.
4. Governança de arquitetura passa a exigir avaliação de atomicidade em toda operação composta nova ou alterada.

## Riscos

1. Risco de degradação de throughput se transações ficarem excessivamente longas.
2. Risco de lock contention em tabelas de alta frequência de escrita.
3. Risco de adoção parcial e inconsistente, mantendo pontos cegos de integridade.
4. Risco de falsa sensação de segurança se a política transacional não for acompanhada de critérios de concorrência adequados.

## Dependências

1. ADR 001 (ORM Sequelize): provê o mecanismo transacional adotado nesta decisão.
2. ADR 002 (Soft delete paranoid): depende de atomicidade para cascatas de delete/restore semanticamente consistentes.
3. Triagem arquitetural final da rodada 07 (`docs/auditorias/07/triagem-arquitetural-final.md`): evidencia a criticidade sistêmica (STF-009, STF-043, STF-022).
4. SRS (`docs/especificacoes.md`): base normativa de confiabilidade, soft delete e consistência funcional das entidades.

## Relação com SRS

Esta ADR não cria novos requisitos funcionais. Ela formaliza decisão arquitetural para viabilizar e proteger requisitos já existentes no SRS, com ênfase em:

1. FR-21: consistência de associações obrigatórias de certificado.
2. FR-22: remoção lógica e restauração de certificados.
3. FR-32: consistência de vínculos usuário-evento.
4. FR-52: geração de código de certificado com integridade sob concorrência.
5. NFR-4: confiabilidade baseada em soft delete e restauração.
6. NFR-6: responsabilidade arquitetural adequada por camada.

## Observações

1. Ambiguidade pendente de validação arquitetural: definição canônica e exaustiva do que constitui "operação composta" para fins de conformidade desta ADR.
2. Ambiguidade pendente de validação arquitetural: critérios de isolamento transacional por classe de operação (ex.: leitura-modificação-escrita concorrente).
3. Ponto pendente de validação arquitetural: política de tratamento para operações com efeitos externos não transacionais (ex.: armazenamento externo), para evitar inconsistência entre banco e recursos externos.
4. Esta ADR é deliberadamente normativa e não contém plano de execução, detalhamento de refatoração, nem especificação de testes.
