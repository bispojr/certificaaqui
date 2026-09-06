Você é um arquiteto de software principal conduzindo a:

# SUPER TRIAGEM ARQUITETURAL FINAL

do sistema:

> Certifique-me

Esta é a consolidação arquitetural DEFINITIVA de todas as auditorias e triagens já realizadas.

---

# Objetivo

Produzir uma análise arquitetural consolidada, sistêmica e rastreável do sistema inteiro, unificando:

- todas as auditorias por domínio
- todas as triagens consolidadas intermediárias
- todos os achados críticos
- todos os problemas arquiteturais transversais
- todas as inconsistências entre implementação e SRS
- todos os gaps de implementação
- todas as ambiguidades documentais
- todos os riscos de segurança
- todos os riscos multi-tenant
- todos os blockers arquiteturais
- todas as dependências entre domínios
- todas as necessidades de ADR
- todas as necessidades de novas specs
- roadmap completo de estabilização arquitetural

---

# Escopo obrigatório

Consolidar obrigatoriamente:

## Auditorias individuais

Todos os arquivos em:

`docs/auditorias/07/*.md`

incluindo auditorias de:

- certificados
- RBAC
- escopo
- eventos
- usuários
- autenticação
- participantes
- tipos
- dashboards
- templates
- upload/R2/arquivos
- geração de PDF
- quaisquer outros domínios auditados

---

## Triagens intermediárias

Consolidar também:

- triagens consolidadas anteriores
- análises arquiteturais intermediárias
- agrupamentos por domínio
- consolidações parciais

---

## Especificação principal

Utilizar obrigatoriamente:

`docs/especificacoes.md`

como referência normativa oficial do sistema.

---

# Objetivos centrais da super triagem

A análise deve identificar:

## 1. Problemas Sistêmicos

Detectar padrões transversais como:

- middleware sem enforcement real
- violações de multi-tenancy
- services ignorando filtros
- inconsistências API vs SSR
- RBAC divergente
- ownership inconsistente
- dependências implícitas
- lógica crítica espalhada
- ausência de contratos entre camadas
- violações arquiteturais recorrentes
- inconsistências de validação
- acoplamento excessivo
- duplicação de regras
- fragilidade estrutural

---

## 2. Estado Real da Arquitetura

Avaliar:

- maturidade arquitetural
- consistência entre domínios
- coesão do service layer
- confiabilidade do enforcement de segurança
- confiabilidade do enforcement multi-tenant
- confiabilidade do RBAC
- integridade de dados
- estabilidade dos contratos internos
- riscos de manutenção
- riscos evolutivos
- riscos operacionais

---

## 3. Dependências Estruturais

Mapear:

- blockers arquiteturais
- dependências entre domínios
- dependências entre specs futuras
- dependências entre correções
- problemas que impedem estabilização
- problemas que invalidam outras camadas

---

## 4. Necessidade de ADRs

Identificar explicitamente:

- decisões arquiteturais obrigatórias
- pontos onde o sistema precisa de definição arquitetural formal
- conflitos de estratégia
- inconsistências de enforcement
- ausência de definição de ownership
- ausência de definição de escopo
- ausência de contratos claros

---

## 5. Necessidade de Novas Specs

Identificar:

- specs obrigatórias
- specs corretivas
- specs arquiteturais
- specs transversais
- specs bloqueadoras
- specs de estabilização

---

## 6. Roadmap de Estabilização

Construir roadmap arquitetural completo contendo:

### Fase 0 — Emergencial

- vulnerabilidades críticas
- vazamentos multi-tenant
- falhas graves de RBAC
- corrupção de integridade
- falhas de ownership

### Fase 1 — Estabilização Arquitetural

- enforcement consistente
- contratos entre camadas
- unificação de RBAC
- unificação de ownership
- service layer
- isolamento multi-tenant

### Fase 2 — Consolidação Estrutural

- redução de acoplamento
- simplificação arquitetural
- padronização transversal
- eliminação de duplicação

### Fase 3 — Evolução Segura

- novas funcionalidades
- otimizações
- escalabilidade
- hardening

---

# Regras CRÍTICAS

## NÃO extrapolar

- NÃO inventar problemas.
- NÃO assumir bugs sem evidência.
- NÃO inferir comportamentos não auditados.
- NÃO transformar hipótese em achado.

---

## NÃO implementar

- NÃO corrigir código.
- NÃO propor patch detalhado.
- NÃO escrever implementação.
- NÃO refatorar.

---

## Somente evidência

Todo achado deve:

- possuir rastreabilidade;
- referenciar auditorias;
- referenciar FRs/NFRs;
- possuir impacto explícito.

---

# Classificação obrigatória

Classificar achados como:

- BR → Bug real
- GI → Gap de implementação
- IP → Implementação parcial
- ID → Inconsistência documental
- DT → Dívida técnica
- VU → Vulnerabilidade
- VA → Violação arquitetural
- AM → Ambiguidade
- VH → Validação humana necessária

---

# Severidade obrigatória

Usar:

- Crítico
- Alto
- Médio
- Baixo

---

# Estrutura obrigatória da SUPER TRIAGEM FINAL

# 1. Sumário Executivo Arquitetural

Deve conter:

- estado geral do sistema
- maturidade arquitetural
- confiabilidade do enforcement
- principais riscos
- principais fragilidades
- principais blockers
- avaliação de risco operacional

---

# 2. Panorama Consolidado de Achados

Tabela consolidada contendo:

- ID
- domínio
- descrição
- severidade
- tipo
- impacto
- rastreabilidade
- status arquitetural

---

# 3. Problemas Sistêmicos Transversais

Agrupar padrões recorrentes encontrados entre múltiplos domínios.

---

# 4. Matriz de Dependências Arquiteturais

Mapear:

- dependências entre problemas
- dependências entre specs
- dependências entre ADRs
- dependências entre domínios

---

# 5. Vulnerabilidades e Riscos Críticos

Separar:

- multi-tenant
- RBAC
- ownership
- integridade
- vazamento de dados
- PDFs públicos
- upload
- autenticação
- SSR

---

# 6. ADRs Necessários

Para cada ADR indicar:

- problema arquitetural
- contexto
- impacto
- alternativas implícitas
- domínios afetados
- criticidade

---

# 7. Specs Necessárias (Spec Kit)

Listar:

- specs corretivas
- specs arquiteturais
- specs transversais
- specs bloqueadoras

com:

- objetivo
- motivação
- domínios afetados
- dependências
- criticidade

---

# 8. Atualizações Necessárias no SRS

Consolidar:

- ambiguidades
- inconsistências
- requisitos incompletos
- comportamentos não especificados
- conflitos entre FRs

---

# 9. Itens para Validação Humana

Somente:

- decisões de produto
- decisões arquiteturais
- ambiguidades reais
- conflitos não resolvidos

---

# 10. Roadmap Arquitetural de Estabilização

Separar em:

## Fase 0 — Emergencial

## Fase 1 — Estabilização

## Fase 2 — Consolidação

## Fase 3 — Evolução

Cada item deve conter:

- objetivo
- impacto
- criticidade
- dependências
- risco mitigado

---

# 11. Avaliação Final da Arquitetura

Produzir avaliação técnica final sobre:

- robustez
- manutenibilidade
- segurança
- confiabilidade
- isolamento multi-tenant
- consistência estrutural
- capacidade de evolução

---

# 12. Conclusão Executiva

Explicar:

- quais são os maiores riscos do sistema;
- o que bloqueia evolução segura;
- o que deve ser resolvido primeiro;
- qual é a prioridade arquitetural real do projeto.

---

# Saída obrigatória

Salvar obrigatoriamente em:

`docs/auditorias/07/triagem-arquitetural-final.md`

---

# Regra final

Esta super triagem deve ser:

- extremamente técnica
- extremamente consolidada
- baseada apenas em evidência
- arquiteturalmente rigorosa
- rastreável
- sistêmica
- sem extrapolação
- sem implementação
- sem subjetividade
- sem corrigir código
