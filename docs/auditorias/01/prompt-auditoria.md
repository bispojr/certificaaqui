@workspace

Você é um arquiteto de software sênior especializado em engenharia de software, arquitetura limpa e documentação técnica.

Analise todo o repositório atualmente aberto no workspace e realize uma auditoria arquitetural completa do projeto.

Estruture sua resposta nas etapas abaixo.

ETAPA 1 — Entendimento do Projeto
Analise o repositório e descreva:

- tecnologias e linguagens utilizadas
- frameworks e bibliotecas principais
- estrutura de diretórios do projeto
- módulos ou componentes principais
- padrão arquitetural aparente (por exemplo: MVC, monólito em camadas, hexagonal, clean architecture, modular, etc.)

Explique brevemente como o sistema parece funcionar com base no código disponível.

ETAPA 2 — Análise da Arquitetura Atual
Avalie a organização do projeto considerando:

- modularização
- separação de responsabilidades
- organização de pastas
- dependências entre módulos
- nível de acoplamento
- reutilização de código

Verifique se o projeto segue boas práticas de engenharia de software como:

- SOLID
- Separation of Concerns
- Clean Architecture
- Domain-Driven Design (quando aplicável)

ETAPA 3 — Identificação de Problemas
Identifique possíveis problemas arquiteturais ou estruturais, como:

- arquivos com responsabilidades excessivas
- dependências circulares
- lógica de domínio misturada com infraestrutura
- duplicação de código
- baixa coesão entre módulos
- alta dependência entre camadas
- organização confusa de diretórios
- ausência ou insuficiência de documentação

Liste os problemas de forma clara.

ETAPA 4 — Recomendações de Melhoria
Sugira melhorias arquiteturais concretas.

Organize as recomendações em três níveis:

CRÍTICAS
Problemas que podem comprometer manutenção ou evolução do projeto.

IMPORTANTES
Melhorias que aumentariam a qualidade da arquitetura.

OPCIONAIS
Boas práticas adicionais.

Sempre que possível, sugira:

- refatoração de módulos
- reorganização de diretórios
- separação de camadas
- introdução de abstrações
- padrões arquiteturais mais adequados

ETAPA 5 — Estrutura Ideal do Repositório
Proponha uma estrutura de diretórios ideal para este projeto.

Mostre uma árvore de arquivos exemplo, como:

repo/
├ docs/
├ src/
│ ├ domain/
│ ├ application/
│ ├ infrastructure/
│ └ interfaces/
├ tests/
└ README.md

Explique brevemente a função de cada diretório.

ETAPA 6 — Proposta de Documentação Técnica
Com base no código analisado, proponha uma estrutura completa de documentação técnica dentro de uma pasta /docs.

Sugira arquivos como:

docs/
├ visao-geral.md
├ arquitetura.md
├ modulos.md
├ api.md
├ desenvolvimento.md
├ deploy.md
└ decisoes/

Explique o que cada documento deve conter.

ETAPA 7 — Criação do C4 Model
Gere uma proposta de documentação arquitetural baseada no C4 Model contendo:

- Context Diagram (nível 1)
- Container Diagram (nível 2)
- Component Diagram (nível 3)

Descreva os elementos principais de cada nível.

Sempre que possível, forneça exemplos de diagramas usando sintaxe compatível com ferramentas como Mermaid ou PlantUML.

ETAPA 8 — Próximos Passos
Liste quais arquivos ou partes do código deveriam ser analisados em maior profundidade para melhorar a análise arquitetural.

Se necessário, peça explicitamente para que arquivos específicos sejam abertos para análise mais detalhada.

---