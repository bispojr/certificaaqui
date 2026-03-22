## DOMÍNIO 5: INTERFACE WEB (SSR / Handlebars)

---

### FEATURE 5.1 — Layouts e Estrutura Base

| Task                                                                                       | Status |
| ------------------------------------------------------------------------------------------ | ------ |
| layout.hbs — Bootstrap 5 CDN, navbar pública, slot de flash messages                       | ✅     |
| admin.hbs — navbar admin, links condicionais por `isAdmin`/`isGestor`, botão logout, flash | ✅     |
| error.hbs — Bootstrap, botão "Voltar ao início"                                            | ✅     |
| `express-session` + `connect-flash` configurados em app.js                                 | ✅     |
| `views/auth/login.hbs` — formulário de login                                               | ✅     |

**Observação:** admin.hbs referencia `{{#if usuario.isAdmin}}` e `{{#if usuario.isGestor}}`. Essas propriedades precisam ser populadas por `authSSR.js` em `res.locals.usuario` (tarefa da FEATURE 2.2 — Domínio 2).

**Status: 5/5 ✅ — Completa**

---

### FEATURE 5.2 — Dashboard Administrativo

| Task                                                                                                              | Status |
| ----------------------------------------------------------------------------------------------------------------- | ------ |
| Criar `src/controllers/dashboardController.js` com contagens por perfil (admin: 4 cards; gestor/monitor: 2 cards) | ⬜     |
| Criar `views/admin/dashboard.hbs` com cards Bootstrap condicionais                                                | ⬜     |
| Criar `src/routes/admin.js` com rota `GET /admin/dashboard` protegida por `authSSR`                               | ⬜     |
| Registrar rota `/admin` no app.js                                                                                 | ⬜     |

**Status: 0/4 ⬜ — Nenhuma tarefa iniciada**

---

### FEATURE 5.3 — Fluxo Público de Certificados (SSR)

| Task                                                                                               | Status |
| -------------------------------------------------------------------------------------------------- | ------ |
| opcoes.hbs — tela de opções (obter / validar)                                                      | ✅     |
| form-obter.hbs — formulário de busca por e-mail                                                    | ✅     |
| form-validar.hbs — formulário de validação por código                                              | ✅     |
| `views/certificados/obter-lista.hbs` — lista de certificados retornados por e-mail                 | ⬜     |
| `views/certificados/validar-resultado.hbs` — resultado da validação por código                     | ⬜     |
| Adicionar rotas SSR em public.js: `GET /pagina/opcoes`, `GET /pagina/obter`, `GET /pagina/validar` | ⬜     |
| Adicionar rotas `POST` em public.js: `POST /pagina/buscar` e `POST /pagina/validar`                | ⬜     |
| Integrar spinner de loading nos formulários de busca                                               | ⬜     |

**Status: 3/8 ⬜ — Parcialmente iniciada (views estáticas prontas, rotas e views de resultado ausentes)**

---

### FEATURE 5.4 — Painel Administrativo — Views de Gestão

| Task                                                                                                       | Status |
| ---------------------------------------------------------------------------------------------------------- | ------ |
| `views/admin/eventos/index.hbs` — listagem com seção de arquivados                                         | ⬜     |
| `views/admin/eventos/form.hbs` — formulário criar/editar                                                   | ⬜     |
| `views/admin/participantes/index.hbs` — listagem com busca `?q=` e coluna de count de certificados         | ⬜     |
| `views/admin/participantes/form.hbs` — formulário criar/editar                                             | ⬜     |
| `views/admin/certificados/index.hbs` — listagem com filtros por evento/status/tipo e modal de cancelamento | ⬜     |
| `views/admin/certificados/detalhe.hbs` — texto interpolado + link de PDF                                   | ⬜     |
| `views/admin/certificados/form.hbs` — campos dinâmicos carregados via `fetch`                              | ⬜     |
| `views/admin/tipos-certificados/index.hbs` — listagem                                                      | ⬜     |
| `views/admin/tipos-certificados/form.hbs` — editor JSONB de `dados_dinamicos` + preview ao vivo            | ⬜     |
| `views/admin/usuarios/index.hbs` — listagem com eventos vinculados                                         | ⬜     |
| `views/admin/usuarios/form.hbs` — checkboxes de eventos, campo senha opcional em edição                    | ⬜     |

**Status: 0/11 ⬜ — Nenhuma view administrativa existe**

---

### Resumo do Domínio

| Feature                      | Completo | Pendente | %        |
| ---------------------------- | -------- | -------- | -------- |
| 5.1 Layouts e Estrutura Base | 5        | 0        | 100% ✅  |
| 5.2 Dashboard Administrativo | 0        | 4        | 0% ⬜    |
| 5.3 Fluxo Público (SSR)      | 3        | 5        | 37%      |
| 5.4 Painel Admin — Views     | 0        | 11       | 0% ⬜    |
| **Total**                    | **8**    | **20**   | **~29%** |

**Bloqueios:**

- FEATURE 5.2 e 5.4 dependem de `src/routes/admin.js` (Domínio 4) e `src/middlewares/authSSR.js` (Domínio 2)
- FEATURE 5.4 — `certificados/detalhe.hbs` depende da integração com `templateService` (Domínio 3)
- admin.hbs precisa que `authSSR.js` popule `usuario.isAdmin` e `usuario.isGestor` em `res.locals`
