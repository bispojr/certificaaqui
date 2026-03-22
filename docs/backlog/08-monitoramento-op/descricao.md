## DOMÍNIO 8: MONITORAMENTO E OPERAÇÕES

---

### FEATURE 8.1 — Health Check

| Task | Status |
|------|--------|
| `GET /health` retornando `{ status, db, uptime }` | ✅ |
| HTTP 503 quando banco indisponível | ✅ |
| Testes de rota — status ok + 503 com banco indisponível | ✅ |

**Status: 3/3 ✅ — Completa**

---

### FEATURE 8.2 — Validação de Entrada (Zod)

| Task | Status |
|------|--------|
| Schemas Zod em participante.js | ✅ |
| Schemas Zod em evento.js | ✅ |
| Schemas Zod em certificado.js | ✅ |
| Schemas Zod em usuario.js | ✅ |
| Schemas Zod em tipos_certificados.js | ✅ |
| validate.js — responde 400 com `{ error, detalhes }` via `ZodError` | ✅ |
| Aplicar `validate` em rotas `POST`/`PUT` de `participantes` | ✅ |
| Aplicar `validate` em rotas `POST`/`PUT` de `eventos` | ✅ |
| Aplicar `validate` em rotas `POST`/`PUT` de `certificados` | ✅ |
| Aplicar `validate` em rotas `POST`/`PUT` de `usuarios` | ✅ |
| Aplicar `validate` em rotas `POST`/`PUT` de `tipos-certificados` | ⬜ |

**Observação:** tipos-certificados.js não importa `validate` nem o schema Zod correspondente, embora ambos existam. É a única rota com aplicação pendente.

**Status: 10/11 — Quase completa; apenas `tipos-certificados` pendente**

---

### FEATURE 8.3 — Migração de Arquivos Legados

| Task | Status |
|------|--------|
| `src/middlewares/auth.js` criado em src (substituindo legado) | ⬜ |
| Atualizar import `../../middleware/auth` → `../middlewares/auth` em 5 rotas (`participantes`, `eventos`, `certificados`, `tipos-certificados`, `usuarios`) | ⬜ |
| Atualizar import em auth.test.js | ⬜ |
| Remover auth.js após migração completa | ⬜ |
| validate.js → mover para `src/middlewares/validate.js` e atualizar 4 imports de rotas | ⬜ |
| index.js — substituir carregamento dinâmico por registro explícito | ✅ |

**Observação:** `models/index.js` já usa registro explícito (6 `require` manuais — sem `readdirSync`). A migração de validate.js não estava no backlog original mas é consistente com o padrão de mover tudo para src.

**Status: 1/6 ⬜ — Carregamento de models resolvido; arquivos legados de middleware ainda no diretório raiz**

---

### Resumo do Domínio

| Feature | Completo | Pendente | % |
|---------|----------|----------|---|
| 8.1 Health Check | 3 | 0 | 100% ✅ |
| 8.2 Validação de Entrada (Zod) | 10 | 1 | 91% |
| 8.3 Migração de Arquivos Legados | 1 | 5 | 17% ⬜ |
| **Total** | **14** | **6** | **70%** |

**Observação importante:** A FEATURE 8.3 é tecnicamente simples (renomear + atualizar imports), mas deve ser executada em conjunto para evitar quebras — os 5 `require('../../middleware/auth')` e os 4 `require('../../middleware/validate')` precisam ser atualizados atomicamente junto com a criação dos arquivos em middlewares.