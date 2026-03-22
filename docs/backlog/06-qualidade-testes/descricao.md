## DOMÍNIO 6: QUALIDADE E TESTES

---

### FEATURE 6.1 — Testes Unitários (Services e Validators)

| Task                                                                                                            | Status |
| --------------------------------------------------------------------------------------------------------------- | ------ |
| templateService.test.js — interpolação, campos ausentes, texto sem chaves                                       | ✅     |
| pdfService.test.js — buffer válido (%PDF), rejeição sem código, rejeição com campos nulos, erro de interpolação | ✅     |
| Testes de validators Zod — `usuario`, `certificado`, `evento`, `participante`, `tipos_certificados`             | ✅     |
| certificadoService.test.js — criar com validação de `valores_dinamicos` vs `dados_dinamicos`                    | ⬜     |
| Testes de paginação (`findAndCountAll`, formato `{ data, meta }`) para todos os services                        | ⬜     |
| eventoService.test.js — `delete` com cascata `UsuarioEvento.destroy` + `restore` com `UsuarioEvento.restore`    | ⬜     |

**Observação:** Os testes existentes de `eventoService.delete` apenas verificam que `eventoMock.destroy` foi chamado — não testam a cascata em `UsuarioEvento`. Esses testes precisam ser atualizados junto com a correção do serviço (Domínio 4).

**Status: 3/6 — Parcialmente coberta**

---

### FEATURE 6.2 — Testes de Integração (Controllers e Rotas)

| Task                                                                                                              | Status |
| ----------------------------------------------------------------------------------------------------------------- | ------ |
| Testes de rota — `participantes` (CRUD, 400, 404)                                                                 | ✅     |
| Testes de rota — `eventos`                                                                                        | ✅     |
| Testes de rota — `certificados`                                                                                   | ✅     |
| Testes de rota — `tipos-certificados`                                                                             | ✅     |
| Testes de rota — `usuarios` (login, logout, me, criação com eventos)                                              | ✅     |
| Testes de autenticação e RBAC — protectedManagementRoutes.test.js (401 sem token, 403 por escopo)                 | ✅     |
| Testes de `scopedEvento` para modelo N:N                                                                          | ✅     |
| Testes de rotas públicas JSON (`/public/certificados`, `/public/validar/:codigo`, `/public/certificados/:id/pdf`) | ✅     |
| Testes de `auth.js` middleware (token válido, ausente, inválido)                                                  | ✅     |
| Testes de rotas SSR do painel admin (`/admin/*`)                                                                  | ⬜     |
| Testes de rotas SSR públicas (`/public/pagina/*`)                                                                 | ⬜     |
| Testes de rotas de autenticação SSR (`/auth/login`, `/auth/logout`)                                               | ⬜     |

**Status: 9/12 — Rotas REST totalmente cobertas; rotas SSR sem cobertura**

---

### FEATURE 6.3 — Testes de Migração

| Task                                                                                                                  | Status |
| --------------------------------------------------------------------------------------------------------------------- | ------ |
| Migration `certificados` — `up` + `down`                                                                              | ✅     |
| Migration `participantes` — `up` + `down`                                                                             | ✅     |
| Migration `eventos` — `up` + `down`                                                                                   | ✅     |
| Migration `tipos_certificados` — `up` + `down`                                                                        | ✅     |
| Migration `usuarios` — `up` + `down`                                                                                  | ✅     |
| Migration `usuario_eventos` — `up` + `down`                                                                           | ✅     |
| Testes da migration de índices de performance (`idx_certificados_*`, `idx_participantes_email`, `idx_usuarios_email`) | ⬜     |

**Observação:** A migration de índices ainda não existe (Domínio 1), logo o teste correspondente também não. É dependente dessa migration ser criada primeiro.

**Status: 6/7 — Bloqueado pela migration de índices pendente**

---

### FEATURE 6.4 — Testes E2E com Playwright

| Task                                                                    | Status |
| ----------------------------------------------------------------------- | ------ |
| Instalar `@playwright/test` e criar `playwright.config.js`              | ⬜     |
| Criar seed E2E (`tests/e2e/setup/seed.js`) com dados mínimos por perfil | ⬜     |
| Criar helpers `loginAs` e `createViaApi`                                | ⬜     |
| Criar `publico.spec.js` — UC-P01 a UC-P10 (fluxo público)               | ⬜     |
| Criar `auth.spec.js` — UC-A01 a UC-A11 (login, logout, RBAC)            | ⬜     |
| Criar `admin.spec.js` — UC-AD01 a UC-AD10 (CRUD painel admin)           | ⬜     |

**Bloqueio total:** depende das FEATURES 5.2, 5.3 e 5.4 (views e rotas SSR não existem ainda).

**Status: 0/6 ⬜ — Nenhuma tarefa iniciada**

---

### Resumo do Domínio

| Feature                     | Completo | Pendente | %       |
| --------------------------- | -------- | -------- | ------- |
| 6.1 Testes Unitários        | 3        | 3        | 50%     |
| 6.2 Testes de Integração    | 9        | 3        | 75%     |
| 6.3 Testes de Migração      | 6        | 1        | 86%     |
| 6.4 Testes E2E (Playwright) | 0        | 6        | 0% ⬜   |
| **Total**                   | **18**   | **13**   | **58%** |

**Bloqueios críticos:**

- 6.1: testes de paginação e `valores_dinamicos` bloqueados pelas correções pendentes dos services (Domínio 4)
- 6.4: totalmente bloqueado pelas views SSR do painel admin (Domínio 5)
