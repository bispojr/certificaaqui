Você é um arquiteto de software sênior especializado em análise arquitetural, engenharia reversa de código e identificação de riscos técnicos.

Este projeto possui:

* um repositório principal (o projeto atual: @workspace)
* parte de um repositório que serviu como referência ou ponto de partida (arquivo raiz é esse https://github.com/EduCompBR/educompbrasil-site/blob/master/routes/simposio/2025/educomp/pt-BR/certificado.js, podendo acessar os demais arquivos dentro do repositório. Enquanto o repositório de referência usou Google Sheets, esse repositório usa banco de dados)
* backlog técnico
* especificações funcionais
* algumas decisões arquiteturais iniciais

Sua tarefa é realizar uma **auditoria arquitetural profunda com Architecture Stress Test**, incluindo **extração de funcionalidades do repositório base** para identificar lacunas funcionais e riscos arquiteturais.

Estruture a análise nas etapas abaixo.

---

ETAPA 1 — Entendimento dos Repositórios

Analise:

1. o repositório principal (projeto atual)
2. o repositório base que serviu de referência

Para cada um, identifique:

* tecnologias utilizadas
* frameworks principais
* organização de diretórios
* principais módulos ou componentes
* padrão arquitetural aparente (MVC, camadas, hexagonal, clean architecture, etc.)

Explique como cada sistema parece funcionar em alto nível.

---

ETAPA 2 — Extração de Funcionalidades do Repositório Base

Realize engenharia reversa do repositório base para identificar as funcionalidades existentes.

Liste as funcionalidades do sistema base organizadas por categorias, por exemplo:

* autenticação e autorização
* gestão de usuários
* regras de negócio
* APIs ou endpoints
* integração com serviços externos
* processamento de dados
* interface do usuário
* persistência de dados
* rotinas administrativas

Para cada funcionalidade, descreva:

* objetivo
* principais módulos envolvidos
* dependências importantes

---

ETAPA 3 — Mapeamento de Funcionalidades

Compare o repositório base com o projeto atual.

Classifique as funcionalidades em:

FUNCIONALIDADES JÁ IMPLEMENTADAS
FUNCIONALIDADES PARCIALMENTE IMPLEMENTADAS
FUNCIONALIDADES AUSENTES
FUNCIONALIDADES NOVAS (que existem apenas no novo projeto)

Explique claramente o que falta para alcançar paridade funcional com o sistema base, quando aplicável.

---

ETAPA 4 — Impacto Arquitetural das Funcionalidades

Analise se a arquitetura atual do novo projeto suporta bem as funcionalidades identificadas.

Verifique:

* se os módulos atuais suportam essas responsabilidades
* se existem riscos de acoplamento excessivo
* se novas camadas ou módulos deveriam ser criados
* se há risco de centralização excessiva de lógica

Sugira melhorias arquiteturais quando necessário.

---

ETAPA 5 — Architecture Stress Test

Agora realize um teste de estresse arquitetural.

Avalie como a arquitetura se comportaria nos seguintes cenários:

1. crescimento de usuários (10x e 100x)
2. crescimento de volume de dados
3. aumento de concorrência e requisições simultâneas
4. introdução de novas funcionalidades complexas
5. mudanças frequentes em regras de negócio
6. integração com sistemas externos
7. falhas em componentes críticos

Para cada cenário, identifique possíveis gargalos ou pontos de falha.

---

ETAPA 6 — Gargalos Arquiteturais

Identifique possíveis gargalos como:

* componentes com responsabilidade excessiva
* módulos altamente acoplados
* dependências frágeis
* camadas mal separadas
* infraestrutura misturada com lógica de domínio
* duplicação de lógica de negócio
* dificuldades para testes automatizados
* problemas de escalabilidade futura

Explique por que cada ponto pode se tornar um problema.

---

ETAPA 7 — Dívida Técnica Potencial

Identifique onde a arquitetura atual pode gerar dívida técnica no futuro.

Classifique em:

ALTO RISCO
MÉDIO RISCO
BAIXO RISCO

Explique consequências possíveis.

---

ETAPA 8 — Decisões Arquiteturais Pendentes

Identifique decisões arquiteturais que ainda deveriam ser tomadas.

Sugira quais decisões deveriam ser registradas como ADRs (Architecture Decision Records).

---

ETAPA 9 — Ajustes Recomendados

Sugira melhorias arquiteturais concretas para reduzir riscos.

Organize em:

CRÍTICAS
IMPORTANTES
OPCIONAIS

Sempre que possível, mostre exemplos de reorganização de módulos ou camadas.

---

ETAPA 10 — Impacto no Backlog Técnico

Analise o backlog existente.

Sugira:

* novas tarefas técnicas
* tarefas que deveriam ser re-priorizadas
* tarefas que podem ser simplificadas
* tarefas necessárias para implementar funcionalidades ainda ausentes

Explique o motivo.

---

ETAPA 11 — Evolução da Arquitetura

Sugira como a arquitetura poderia evoluir ao longo do tempo:

Fase 1 — MVP
Fase 2 — Crescimento do sistema
Fase 3 — Escala e maturidade

Explique quais mudanças arquiteturais seriam naturais em cada fase.

---

ETAPA 12 — Atualização do C4 Model

Revise ou proponha um C4 Model para o sistema contendo:

* Context Diagram
* Container Diagram
* Component Diagram

Descreva os elementos principais de cada nível.

Sempre que possível, forneça exemplos usando sintaxe de diagrama como Mermaid ou PlantUML.
