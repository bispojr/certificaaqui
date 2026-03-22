## DOMÍNIO 7: DOCUMENTAÇÃO E RASTREABILIDADE

---

### FEATURE 7.1 — Documentação de Arquitetura (ADRs)

| Task | Status |
|------|--------|
| ADR-001: escolha do ORM Sequelize | ✅ 001-orm-sequelize.md |
| ADR-002: soft delete via `paranoid` | ✅ 002-soft-delete-paranoid.md |
| ADR-003: uso de JSONB para `dados_dinamicos` | ✅ 003-jsonb-dados-dinamicos.md |
| ADR-004: engine de geração de PDF (PDFKit vs. Puppeteer) | ⬜ |
| ADR-005: vínculo usuário-evento N:N via `usuario_eventos` | ⬜ |
| ADR-006: estratégia de paginação offset-based | ⬜ |
| ADR-007: onde validar `valores_dinamicos` (service vs. model vs. validator) | ⬜ |
| ADR-008: armazenamento de PDFs (on-the-fly vs. S3/disco) | ⬜ |

**Status: 3/8 — Parcialmente coberta**

---

### FEATURE 7.2 — Documentação Técnica Geral

| Task | Status |
|------|--------|
| visao-geral.md — descrição, stakeholders, glossário | ✅ |
| arquitetura.md — diagramas C4 em Mermaid | ✅ |
| modulos.md — entidades, campos, regras | ✅ |
| desenvolvimento.md — setup local, variáveis, como rodar testes | ✅ |
| deploy.md — Docker, migrations em produção | ✅ |

**Status: 5/5 ✅ — Completa**

---

### FEATURE 7.3 — Documentação de API (Swagger/OpenAPI)

| Task | Status |
|------|--------|
| Instalar `swagger-jsdoc` e `swagger-ui-express` | ✅ |
| Expor interface em `GET /api-docs` | ✅ |
| Anotações `@swagger` em participantes.js | ✅ |
| Anotações `@swagger` em eventos.js | ✅ |
| Anotações `@swagger` em tipos-certificados.js | ✅ |
| Anotações `@swagger` em certificados.js | ✅ |
| Anotações `@swagger` em usuarios.js | ✅ |
| Anotações `@swagger` em health.js | ✅ |
| Anotações `@swagger` em public.js | ⬜ |
| Anotações `@swagger` nas rotas SSR (`/auth`, `/admin`) quando criadas | ⬜ |

**Observação:** As rotas SSR (`/auth`, `/admin`) não existem ainda, portanto suas anotações são dependências futuras. A rota public.js existe mas não tem `@swagger`.

**Status: 8/10 — Rotas REST documentadas; public.js e rotas SSR pendentes**

---

### Resumo do Domínio

| Feature | Completo | Pendente | % |
|---------|----------|----------|---|
| 7.1 ADRs | 3 | 5 | 37% |
| 7.2 Docs Técnicas Gerais | 5 | 0 | 100% ✅ |
| 7.3 Swagger/OpenAPI | 8 | 2 | 80% |
| **Total** | **16** | **7** | **70%** |

**Observações:**
- Os 5 ADRs pendentes (004–008) são independentes — podem ser redigidos em qualquer ordem sem bloqueio de código
- A anotação `@swagger` em public.js é tarefa simples e não bloqueada
- As anotações para rotas SSR ficam naturalmente bloqueadas pelos Domínios 4 e 5