## DOMÍNIO: AUTENTICAÇÃO E CONTROLE DE ACESSO

**Descrição:**
Identidade e autorização no sistema — autenticação JWT para a API JSON, autenticação via cookie para SSR, RBAC por perfil e escopo por evento.

---

**FEATURE: Autenticação JWT (API)**

Descrição:
Login/logout via endpoint JSON com geração e validação de tokens JWT para consumo da API REST.

TASKS:

- ✅ Model `Usuario` criado com `nome`, `email`, `senha` (bcrypt), `perfil`
- ✅ auth.js valida JWT e popula `req.usuario`
- ✅ usuarioController.js com `login`, `logout`, `me`, `create`, `updateEventos`
- ✅ usuarios.js com `POST /login`, `POST /logout`, `GET /me`, `POST /`, `PUT /:id`
- ✅ `JWT_SECRET` sem fallback inseguro
- ⬜ Aplicar rate limiting (`express-rate-limit`) em `POST /usuarios/login`

---

**FEATURE: Autenticação SSR (Cookie-based)**

Descrição:
Login via formulário web, token armazenado em cookie `httpOnly`, redirecionamento pós-login e limpeza de cookie no logout.

TASKS:

- ⬜ Criar `src/middlewares/authSSR.js` lendo cookie `token`, verificando JWT e populando `req.usuario` + `res.locals.usuario`
- ⬜ Criar `src/routes/auth.js` com `GET /auth/login`, `POST /auth/login`, `POST /auth/logout`
- ✅ `express-session` e `connect-flash` configurados em app.js
- ⬜ Registrar rota `/auth` no app.js

---

**FEATURE: Controle de Acesso por Perfil (RBAC)**

Descrição:
Middleware hierárquico (`admin > gestor > monitor`) que restringe rotas por perfil mínimo exigido.

TASKS:

- ✅ rbac.js implementado com hierarquia de perfis
- ✅ Rotas da API protegidas com `auth` + `rbac`
- ✅ Testes de rbac.test.js cobrindo 401, 403 e acesso permitido
- ⬜ Aplicar `rbac` nas rotas SSR administrativas (`src/routes/admin.js`) quando criadas

---

**FEATURE: Escopo de Evento (scopedEvento)**

Descrição:
Middleware que restringe gestores e monitores a operar exclusivamente dentro do(s) evento(s) vinculado(s) via relação N:N.

TASKS:

- ✅ scopedEvento.js corrigido para usar `req.usuario.getEventos()` (N:N)
- ✅ Admin passa sem restrição
- ✅ Usuário sem evento vinculado recebe 403
- ✅ Testes de scopedEvento.test.js atualizados para o modelo N:N

---

**Status resumido:**

| Feature                   | Progresso                                                   |
| ------------------------- | ----------------------------------------------------------- |
| Autenticação JWT (API)    | 5/6 tasks — falta rate limiting                             |
| Autenticação SSR (Cookie) | 1/4 tasks — `authSSR.js` e auth.js (rota) pendentes         |
| RBAC                      | 3/4 tasks — aplicação SSR pendente (depende de rotas admin) |
| Escopo de Evento          | 4/4 ✅                                                      |

Obs.: A task pendente de RBAC será granularizada junto com a criação de src/routes/admin.js no Domínio 4, pois modificar o mesmo arquivo em tasks separadas criaria conflito de edição.
