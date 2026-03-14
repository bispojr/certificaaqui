You are a senior software architect and requirements engineer.

`docs/especificacoes.md` is the project specification document that is currently unstructured.
Your task is to transform it into a **well-structured Software Requirements
Specification (SRS)** document.

Your goal is to extract, organize, and clarify the system requirements while
preserving the original intent of the text.

IMPORTANT RULES

1. Do NOT invent features that are not implied by the document.
2. If something is ambiguous, list it as an **open question**.
3. Clearly separate:
   - functional requirements
   - non-functional requirements
4. Use clear and concise language.
5. Prefer bullet points and numbered lists instead of long paragraphs.
6. Preserve all relevant information from the original document.

LANGUAGE RULE

The final document MUST be written in **Brazilian Portuguese (pt-BR)**.

However:

- Requirement identifiers must remain in English (FR-1, FR-2, NFR-1, etc.).
- Technical terms such as API, endpoint, middleware, database, and backend may remain in English when appropriate.
- Code examples must remain in English.

OUTPUT FORMAT

Produce a structured SRS document in Markdown using the following sections:

# Visão Geral do Sistema

Breve explicação do sistema e de seu propósito.

# Objetivos

Objetivos de alto nível que o sistema pretende alcançar.

# Stakeholders

Quem utilizará ou interagirá com o sistema.

# Requisitos Funcionais

Liste todos os requisitos funcionais usando o formato:

FR-1: Descrição  
FR-2: Descrição

Cada requisito deve descrever um comportamento que o sistema deve suportar.

# Requisitos Não Funcionais

Exemplos:

- Performance
- Segurança
- Confiabilidade
- Usabilidade
- Manutenibilidade

Use identificadores:

NFR-1: Descrição  
NFR-2: Descrição

# Funcionalidades do Sistema

Agrupe os requisitos funcionais em funcionalidades lógicas.

Para cada funcionalidade inclua:

## Nome da funcionalidade

Descrição  
Requisitos relacionados: FR-x, FR-y

# Papéis de Usuário (se aplicável)

Descreva diferentes tipos de usuário e suas permissões.

# Modelo de Dados (se identificável)

Descreva as principais entidades e relacionamentos mencionados no texto.

# Integrações Externas

Liste sistemas, APIs ou serviços com os quais o sistema deve interagir.

# Restrições

Restrições técnicas, legais ou arquiteturais.

# Premissas

Coisas que parecem ser assumidas pelo documento.

# Questões em Aberto

Pontos que estão pouco claros e precisam de esclarecimento.

# Melhorias Sugeridas

Melhorias opcionais que poderiam tornar o sistema mais robusto,
sem alterar os requisitos originais.

IMPORTANT

Return the result **entirely in Markdown** so it can be replaced directly
as `docs/especificacoes.md`.