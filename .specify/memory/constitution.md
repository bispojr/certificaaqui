\<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification from template)
Added sections:

- Core Principles (5 principles)
- Technology Stack
- Development Workflow
- Governance
  Removed sections: N/A
  Templates updated:
- .specify/templates/plan-template.md ✅ Constitution Check gates aligned
- .specify/templates/spec-template.md ✅ Requirements section aligned
- .specify/templates/tasks-template.md ✅ Task structure aligned
  Follow-up TODOs: none
  -->

# CertificaAqui Constitution

## Core Principles

### I. Especificações como Fonte de Verdade (NON-NEGOTIABLE)

`docs/especificacoes.md` e `docs/backlog.md` DEVEM ser lidos antes de qualquer
modificação no código. Nenhuma feature pode ser implementada se contradizer
esses documentos. Toda alteração concluída DEVE ser refletida no backlog com
timestamp no formato `YYYY-MM-DD HH:mm (BRT)` obtido do sistema operacional.

### II. Test-First Development (NON-NEGOTIABLE)

TDD é mandatório para toda funcionalidade nova:

- Testes DEVEM ser escritos antes da implementação.
- O ciclo Red → Green → Refactor DEVE ser respeitado.
- A suíte completa (`npm run check`) DEVE passar antes de qualquer commit.
- Testes DEVEM ser pequenos, isolados e determinísticos — sem dependências
  ocultas, sem dependência de ordem de execução, sem serviços externos.

### III. Arquitetura MVC em Camadas

O sistema DEVE seguir separação estrita de responsabilidades:

- `models` — entidades e acesso a dados (Sequelize).
- `services` — regras de negócio; sem referências a `req`/`res`.
- `controllers` — orquestração HTTP; delega lógica para services.
- `routes` — mapeamento de endpoints; sem lógica de negócio.
- `middlewares` — autenticação, RBAC e escopo de evento.

Dependências DEVEM fluir para baixo na pilha (routes → controllers →
services → models). Referências inversas são proibidas.

### IV. Integridade de Dados e Soft Delete

Toda remoção de entidade DEVE ser lógica (soft delete via Paranoid do
Sequelize). Registros removidos DEVEM poder ser restaurados. Deleção física
(`force: true`) é proibida em produção sem decisão arquitectural registrada
em `docs/decisoes/`.

### V. Segurança e RBAC

- Autenticação via JWT Bearer (API) e cookie JWT HTTP-only (SSR) é obrigatória
  para todas as rotas protegidas.
- Controle de acesso por perfil (admin / gestor / monitor) DEVE ser aplicado
  via middleware antes de qualquer lógica de negócio.
- Gestores DEVEM operar apenas dentro do escopo dos eventos aos quais estão
  vinculados.
- O código DEVE estar livre das vulnerabilidades do OWASP Top 10.
- `JWT_SECRET` NUNCA deve ser commitado; DEVE ser injetado via variável de
  ambiente.

## Technology Stack

- **Runtime**: Node.js ≥ 24
- **Framework**: Express.js (API REST + SSR via Handlebars)
- **ORM**: Sequelize com PostgreSQL
- **Autenticação**: JWT (jsonwebtoken)
- **Geração de PDF**: PDFKit
- **Armazenamento de templates**: Cloudflare R2 (compatível com S3)
- **Testes**: Jest (unit/integration), Playwright (e2e)
- **Linter/Formatter**: ESLint + Prettier
- **Infraestrutura**: Docker / docker-compose

Adições ao stack DEVEM ser registradas como decisão arquitetural em
`docs/decisoes/` antes de serem adotadas.

## Development Workflow

1. Ler `docs/especificacoes.md` e `docs/backlog.md` antes de qualquer mudança.
2. Criar ou atualizar o teste que cobre a mudança planejada.
3. Rodar apenas o teste específico (`npm test -- --testPathPattern=...`).
4. Implementar a mudança até o teste passar.
5. Rodar a suíte completa (`npm run check`).
6. Corrigir eventuais falhas incrementalmente.
7. Atualizar `docs/backlog.md` marcando o item como `[x]` com timestamp BRT.
8. Sugerir o próximo passo com base nas dependências do backlog.

Commits DEVEM ser em português (pt-BR). Código e identificadores DEVEM
permanecer em inglês.

## Governance

- Esta constituição tem precedência sobre quaisquer outras diretrizes de
  desenvolvimento.
- Emendas requerem: descrição da mudança, justificativa, bump de versão
  semântica e atualização de `LAST_AMENDED_DATE`.
  - MAJOR: remoção ou redefinição incompatível de princípio.
  - MINOR: adição ou expansão material de princípio/seção.
  - PATCH: clarificações, correções de redação, refinamentos não-semânticos.
- Todo PR/review DEVE verificar conformidade com os princípios I–V.
- Complexidade adicional DEVE ser justificada; soluções simples são preferidas
  (YAGNI).
- Consulte `docs/especificacoes.md` como referência de runtime para
  desenvolvimento.

**Version**: 1.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-08
