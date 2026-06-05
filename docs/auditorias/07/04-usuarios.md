# Auditoria 07.04 — Domínio de Usuários

**Sistema:** Certifique-me  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Data da auditoria:** 2026-05-09  
**Hora:** 18:36 (BRT)  
**Auditor:** Agente arquitetural automatizado  
**Escopo:** Domínio de Usuários — CRUD, autenticação, associação usuário↔evento, RBAC, ownership, soft delete, fluxos SSR e API

---

## Fontes consultadas

| Arquivo | Propósito |
|---|---|
| `docs/especificacoes.md` | SRS v2.0 — fonte de requisitos |
| `src/models/usuario.js` | Modelo ORM do usuário |
| `src/models/usuario_eventos.js` | Modelo da tabela de junção N:N |
| `src/models/index.js` | Registro de modelos |
| `src/models/evento.js` | Associação inversa Evento→Usuario |
| `src/controllers/usuarioController.js` | Controller REST de usuários |
| `src/controllers/usuarioSSRController.js` | Controller SSR de usuários |
| `src/controllers/perfilSSRController.js` | Controller de perfil (alterar senha) |
| `src/controllers/dashboardController.js` | Dashboard — escopo por perfil |
| `src/routes/usuarios.js` | Rotas REST: login / logout / me |
| `src/routes/usuarios-crud.js` | Rotas REST: criação / eventos |
| `src/routes/admin.js` | Rotas SSR admin (inclui usuários) |
| `src/routes/auth.js` | Rotas SSR de autenticação |
| `src/middlewares/auth.js` | JWT Bearer (API) |
| `src/middlewares/authSSR.js` | Cookie JWT (SSR) |
| `src/middlewares/rbac.js` | Middleware hierárquico de perfis |
| `src/middlewares/scopedEvento.js` | Filtro de escopo por evento |
| `src/validators/usuario.js` | Schema Zod de usuário |
| `src/validators/senhaForte.js` | Schema Zod de senha forte |
| `migrations/20260312180000-create-usuarios.js` | Migration da tabela `usuarios` |
| `migrations/20260313190000-create-usuario_eventos.js` | Migration da tabela `usuario_eventos` |
| `app.js` | Montagem de rotas |

---

# 1. Matriz de Achados

| ID | Descrição curta | Severidade | Tipo | Impacto | FR/NFR |
|---|---|---|---|---|---|
| U-01 | `login` API retorna mensagens distintas para e-mail inválido vs senha errada | Alta | VU | User enumeration (OWASP A07) — atacante descobre e-mails cadastrados | FR-30 / NFR-1 |
| U-02 | SSR login (`POST /login`) sem rate limiting | Alta | GI | Brute-force irrestrito na superfície SSR; apenas API é protegida | FR-55 / NFR-1 |
| U-03 | Cookie JWT sem flag `secure` | Alta | VU | Cookie transmissível por HTTP em produção (OWASP A02) | FR-30 / NFR-3 |
| U-04 | Ausência de `usuarioService.js` — lógica de negócio no controller | Alta | VA | Violação de NFR-6 (routes→controllers→services→models) | NFR-6 |
| U-05 | RBAC de criação/atualização de eventos implementado no controller, não no middleware | Alta | VA | Padrão arquitetural violado; RBAC não é reutilizável nem auditável | FR-38 / NFR-1 / NFR-6 |
| U-06 | URL pattern `/:papel/:id/usuarios` — ID do admin exposto na URL e lógica frágil | Alta | VA | Information disclosure + design não convencional, impeditivo de escalonamento | FR-26 / NFR-6 |
| U-07 | API de usuários não tem CRUD completo (ausentes GET, PUT, DELETE) | Alta | GI | FR-26 ("CRUD completo via API") não atendido | FR-26 |
| U-08 | `usuarioController.login` sem `try/catch` — exceções de DB não tratadas | Média | BR | Erro de banco não capturado propaga para Express handler genérico | FR-30 |
| U-09 | SSR criação/atualização de usuários não valida senha — sem `senhaForte` nem schema Zod | Média | IP | Senhas fracas podem ser definidas por admin; inconsistência com FR-57 | FR-29 / FR-57 |
| U-10 | `usuarioSSRController.criar` — eventos não validados quanto à existência | Média | IP | Associação a eventos inexistentes pode falhar silenciosamente (Sequelize) | FR-32 |
| U-11 | `usuarioSSRController.atualizar` — eventos não validados quanto à existência | Média | IP | Idem U-10 no fluxo de edição | FR-32 |
| U-12 | FR-30 define `POST /auth/login`; URL real é `POST /login` | Baixa | ID | Divergência entre SRS e implementação na denominação da rota SSR | FR-30 |
| U-13 | Swagger documenta `POST /usuarios` para criação; rota real é `POST /:papel/:id/usuarios` | Baixa | ID | Documentação OpenAPI inconsistente com a implementação real | FR-26 |
| U-14 | `authSSR` popula `req.usuario` como plain object sem `email` e sem `isMonitor` | Baixa | DT | Campos ausentes limitam usos futuros sem alteração do middleware | NFR-6 |
| U-15 | `authSSR` usa `process.env.JWT_SECRET` sem guard explícito | Baixa | DT | Divergência com padrão do projeto; falha implícita se env não definida | NFR-3 |
| U-16 | `rbac` retorna JSON 403 em contexto SSR (não HTML/redirect) | Baixa | VA | UX inconsistente em rotas SSR de usuários e demais domínios | FR-49 |
| U-17 | `usuario_eventos` paranoid=true — `setEventos()` acumula linhas soft-deleted | Baixa | DT | Crescimento indefinido da tabela de junção sem coleta de registros obsoletos | NFR-4 / NFR-10 |
| U-18 | `usuarioSSRController.index` sem paginação — carga de todos os usuários | Baixa | DT | Risco de degradação de performance com volume elevado de usuários | NFR-5 |
| U-19 | `scopedEvento` exige `req.usuario.getEventos()` (instância Sequelize), incompatível com `authSSR` | Média | AM | Se `scopedEvento` for aplicado a rotas SSR no futuro, sempre falhará com HTTP 500 | FR-37 |
| U-20 | Política de senha forte para admin criando/editando usuário não especificada no SRS | — | AM | Ambiguidade: FR-57 cobre apenas self-service; FR-29 apenas hash | FR-29 / FR-57 |

---

# 2. Achados Críticos

## U-01 — User Enumeration no login da API

**Evidência de código:**

`src/controllers/usuarioController.js`, função `login`:

```javascript
const usuario = await Usuario.findOne({ where: { email } })
if (!usuario)
  return res.status(401).json({ error: 'Usuário não encontrado' })      // e-mail não existe
const valid = await bcrypt.compare(senha, usuario.senha)
if (!valid) return res.status(401).json({ error: 'Senha inválida' })    // e-mail existe, senha errada
```

**Impacto concreto:** Atacante pode confirmar quais e-mails estão cadastrados no sistema realizando tentativas de login. O endpoint `POST /usuarios/login` retorna respostas distintas para os dois casos, permitindo enumeração de usuários registrados (OWASP A07 — Identification and Authentication Failures).

**Contraste com SSR:** O fluxo SSR em `src/routes/auth.js` usa corretamente `'Credenciais inválidas'` para ambos os casos:

```javascript
if (!usuario) {
  req.flash('error', 'Credenciais inválidas')    // mesmo erro para ambos
  return res.redirect('/login')
}
const valid = await bcrypt.compare(senha, usuario.senha)
if (!valid) {
  req.flash('error', 'Credenciais inválidas')    // idem
}
```

**FR/NFR relacionado:** NFR-1, FR-30.

---

## U-02 — SSR Login sem Rate Limiting

**Evidência de código:**

`src/routes/auth.js` — `POST /login` não aplica `loginLimiter`:

```javascript
router.post('/login', async (req, res) => {
  // Nenhum middleware de rate limiting
  const { email, senha } = req.body
  const usuario = await Usuario.findOne({ where: { email } })
  ...
})
```

`src/routes/usuarios.js` — somente a rota da API tem rate limiting:

```javascript
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, ... })
router.post('/login', loginLimiter, usuarioController.login)
```

**Impacto concreto:** A superfície SSR (`POST /login`) não possui limite de tentativas. Um atacante pode realizar ataques de força bruta na interface web sem ser bloqueado, mesmo com FR-55 especificando proteção para o endpoint de login.

**FR/NFR relacionado:** FR-55, NFR-1.

---

## U-03 — Cookie JWT sem Flag `secure`

**Evidência de código:**

`src/routes/auth.js`, `POST /login`:

```javascript
res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
// Sem: secure: true
```

**Impacto concreto:** Em um ambiente de produção com HTTPS, o navegador também transmitirá o cookie por conexões HTTP simples se houver downgrade ou se algum recurso for carregado por HTTP. Isso expõe o token de sessão a interceptação. A flag `secure: true` é obrigatória para cookies de autenticação em produção.

**FR/NFR relacionado:** NFR-1, NFR-3, FR-30.

---

## U-04 — Ausência de `usuarioService.js`

**Evidência:** O diretório `src/services/` contém `certificadoService.js`, `eventoService.js`, `participanteService.js`, `tiposCertificadosService.js` — mas **não possui** `usuarioService.js`.

A lógica de negócio do domínio de usuários reside diretamente em `src/controllers/usuarioController.js`, incluindo:
- Validação de unicidade e existência de eventos associados
- Geração de JWT
- Comparação de hash de senha
- Associação via `setEventos()`

**Impacto arquitetural:** Violação do padrão `routes → controllers → services → models` (NFR-6). O controller concentra responsabilidades de orquestração, de negócio e de persistência.

---

## U-05 — RBAC reimplementado manualmente no controller

**Evidência de código:**

`src/routes/usuarios-crud.js`:
```javascript
router.post('/:papel/:id/usuarios', auth, validate(usuarioSchema), usuarioController.create)
// Sem: rbac('admin')
```

`src/controllers/usuarioController.js`, função `create`:
```javascript
if (
  !req.usuario ||
  req.usuario.perfil !== 'admin' ||
  req.usuario.id !== Number(id) ||    // check manual com parâmetro de rota
  papel !== 'admin'                    // check manual com parâmetro de rota
) {
  return res.status(403).json({ error: 'Acesso negado' })
}
```

**Impacto:** Contradição com o padrão do projeto — todos os demais domínios usam `rbac('admin')` no nível de rota. O RBAC manual no controller acopla lógica de autorização ao controller, tornando-a não reutilizável e difícil de auditar.

**Contraste com padrão correto (admin.js):**
```javascript
router.get('/usuarios', rbac('admin'), usuarioSSRController.index)
router.post('/usuarios', rbac('admin'), usuarioSSRController.criar)
```

---

## U-06 — URL Pattern `/:papel/:id/usuarios` — Design Frágil e Information Disclosure

**Evidência de código:**

`src/routes/usuarios-crud.js`:
```javascript
router.post('/:papel/:id/usuarios', auth, validate(usuarioSchema), usuarioController.create)
router.put('/:papel/:id/usuarios/:usuarioId/eventos', auth, ...)
```

Montado em `app.js` como:
```javascript
app.use('/', usuariosCrudRouter)
```

**Problemas identificados:**
1. O `:id` na URL é o ID do próprio admin autenticado (`req.usuario.id !== Number(id)`). Isso obriga o frontend a conhecer e incluir o ID do usuário logado na URL — expondo o ID internamente.
2. O pattern `/:papel/:id/usuarios` é suficientemente genérico para conflitar com outras rotas futuras (ex: `/gestor/5/usuarios`) e não está restrito pelo roteador — o filtro ocorre apenas no controller.
3. Qualquer admin com ID diferente não pode usar o ID de outro admin na URL; a consequência é que dois admins com IDs diferentes chamam URLs diferentes para a mesma operação — inesperado e inconsistente.

---

## U-07 — API REST de Usuários sem CRUD Completo

**Evidência:** FR-26 especifica "CRUD completo" para usuários. Os endpoints existentes são:

| Operação | Rota | Status |
|---|---|---|
| Login | `POST /usuarios/login` | ✅ Implementado |
| Logout | `POST /usuarios/logout` | ✅ Implementado |
| Usuário autenticado | `GET /usuarios/me` | ✅ Implementado |
| Criar usuário | `POST /:papel/:id/usuarios` | ✅ Parcial (URL não convencional) |
| Atualizar eventos | `PUT /:papel/:id/usuarios/:usuarioId/eventos` | ✅ Parcial |
| Listar usuários | `GET /usuarios` | ❌ **Ausente** |
| Obter usuário | `GET /usuarios/:id` | ❌ **Ausente** |
| Atualizar usuário | `PUT /usuarios/:id` | ❌ **Ausente** |
| Remover usuário (soft) | `DELETE /usuarios/:id` | ❌ **Ausente** |
| Restaurar usuário | `POST /usuarios/:id/restore` | ❌ **Ausente** |

**Impacto:** A gestão completa de usuários está disponível apenas via SSR (admin), sem correspondência na API REST. Uma integração programática não pode realizar listagem, atualização ou remoção de usuários.

---

## U-08 — `usuarioController.login` sem `try/catch`

**Evidência de código:**

`src/controllers/usuarioController.js`:
```javascript
async login(req, res) {
  const { email, senha } = req.body
  const usuario = await Usuario.findOne({ where: { email } })   // sem try/catch
  if (!usuario) return res.status(401).json(...)
  const valid = await bcrypt.compare(senha, usuario.senha)       // sem try/catch
  ...
}
```

**Impacto:** Una falha de banco de dados (ex: connection timeout) lança uma exceção não capturada, que Express encaminha ao error handler genérico com `500`. A ausência de `try/catch` é inconsistente com todos os demais controllers do projeto e não fornece resposta controlada ao cliente.

---

# 3. Problemas Arquiteturais

## A1 — Ausência da camada de service no domínio de usuários

**Localização:** Toda a lógica de neg ócio está em `src/controllers/usuarioController.js`.

NFR-6 define a arquitetura obrigatória como `routes → controllers → services → models`. Todos os outros domínios (`certificadoService.js`, `eventoService.js`, `participanteService.js`, `tiposCertificadosService.js`) possuem service dedicado. O domínio de usuários é a única exceção, concentrando no controller:
- autenticação (JWT, bcrypt)
- associação de eventos (`setEventos`)
- validação de existência de entidades (`Evento.findAll`)

## A2 — RBAC duplicado e inconsistente entre API e controller

A API de CRUD de usuários (`usuarios-crud.js`) não usa o middleware `rbac`, ao contrário de todas as rotas SSR e API dos demais domínios. O check é manual no controller, incluindo parâmetros de URL como parte do critério de autorização. Isso cria dois caminhos de RBAC paralelos e não auditáveis de forma centralizada.

## A3 — Validação ausente na superfície SSR

As rotas SSR de criação e atualização de usuários (`POST /admin/usuarios`, `POST /admin/usuarios/:id`) não passam pelo middleware `validate(usuarioSchema)`. A única proteção é o ORM Sequelize no nível de banco (tipo ENUM, `allowNull`). A superfície API, ao contrário, usa `validate(usuarioSchema)` antes de chegar ao controller.

## A4 — `scopedEvento` incompatível com `authSSR`

`src/middlewares/scopedEvento.js`:
```javascript
if (typeof req.usuario.getEventos !== 'function') {
  return res.status(500).json({ error: 'Usuário sem método getEventos (modelo N:N)' })
}
```

`src/middlewares/authSSR.js` popula `req.usuario` como plain object:
```javascript
const usuarioData = { id, nome, perfil, isAdmin, isGestor }
req.usuario = usuarioData    // sem methods do modelo Sequelize
```

`src/middlewares/auth.js` (API) popula com a instância completa:
```javascript
req.usuario = usuario    // instância Sequelize com getEventos()
```

Resultado: `scopedEvento` só funciona em rotas da API. Qualquer tentativa de usar `scopedEvento` em rotas SSR resultará em HTTP 500 imediato. As rotas SSR de usuários não aplicam `scopedEvento`, mas a incompatibilidade estrutural existe e é um bloqueio para qualquer evolução que exija escopo em rotas SSR.

## A5 — `rbac` retorna JSON 403 em contexto SSR

**Evidência:** `src/middlewares/rbac.js`:
```javascript
return res.status(403).json({ error: 'Acesso negado: perfil insuficiente.' })
```

Todas as rotas SSR em `admin.js` (incluindo as de usuários) usam `rbac`, mas o middleware retorna JSON. Em contexto SSR (Handlebars), a resposta esperada seria um redirect com flash message ou renderização de uma página de erro HTML.

---

# 4. Divergências API vs SSR

| Aspecto | API REST | SSR (Admin) |
|---|---|---|
| **Rate limiting no login** | ✅ `loginLimiter` aplicado em `POST /usuarios/login` | ❌ Ausente em `POST /login` |
| **Mensagem de erro no login** | ❌ Mensagens distintas (user enumeration) | ✅ Mensagem genérica (`Credenciais inválidas`) |
| **Validação Zod na criação** | ✅ `validate(usuarioSchema)` em `usuarios-crud.js` | ❌ Ausente em `POST /admin/usuarios` |
| **Validação de existência de eventos** | ✅ Controller verifica via `Evento.findAll` | ❌ Ausente no SSR controller |
| **Força de senha na criação** | ❌ Schema Zod exige mín. 6 chars (não strong) | ❌ Sem validação de força |
| **Força de senha na atualização** | ❌ Schema via pick só valida `eventos` | ❌ Sem validação de força |
| **Força de senha (self-service)** | ❌ Sem rota API equivalente | ✅ `senhaForteSchema` em `perfilSSRController` |
| **Tipo de `req.usuario`** | Instância Sequelize completa (`auth.js`) | Plain object sem métodos (`authSSR.js`) |
| **Resposta em RBAC negado** | JSON `{ error }` com HTTP 403 | JSON `{ error }` com HTTP 403 (inconsistente para SSR) |
| **CRUD completo** | ❌ Parcial (sem GET, PUT, DELETE convencionais) | ✅ Completo via SSR admin |
| **Soft delete/restore** | ❌ Sem endpoint REST | ✅ Via `POST /admin/usuarios/:id/deletar` e `/restaurar` |

---

# 5. Atualizações Recomendadas no SRS

## 5.1 — FR-30: Rota SSR de login diverge da especificação

**Trecho atual do SRS:**
> FR-30: SSR: `POST /auth/login` define cookie HTTP-only `token`

**Implementação real:** A rota de login SSR está em `POST /login` (router montado na raiz `/`, com path `/login`), não em `/auth/login`. O SRS deve ser atualizado para refletir a URL real, ou a implementação deve ser ajustada para que o router de auth seja montado em `/auth`.

## 5.2 — FR-55: Rate limiting deveria cobrir ambas as superfícies

**Trecho atual do SRS:**
> FR-55: O endpoint `POST /usuarios/login` deve ser protegido por rate limiting: máximo 10 tentativas em 15 minutos por IP.

**Lacuna:** O SRS não menciona rate limiting para o login SSR. Ambas as superfícies autenticam usuários, e apenas proteger a API cria um vetor de ataque via SSR. O SRS deveria especificar rate limiting para ambas as rotas ou deixar explícito que é intencional proteger apenas a API.

## 5.3 — FR-26: CRUD completo precisa de esclarecimento sobre superfícies

**Trecho atual do SRS:**
> FR-26: O sistema deve permitir criar, listar, atualizar e remover usuários.

**Lacuna:** FR-26 não especifica se o CRUD deve estar disponível tanto na API REST quanto na SSR, ou apenas em uma delas. A implementação atual fornece CRUD completo apenas na SSR. O SRS deve explicitar em quais superfícies cada operação deve estar disponível.

## 5.4 — FR-29/FR-57: Política de senha na criação por admin

**Trecho atual do SRS:**
> FR-29: A senha do usuário deve ser armazenada como hash bcrypt (10 rounds).
> FR-57: Todo usuário autenticado deve poder alterar sua própria senha [...] A nova senha deve atender à política de senha forte.

**Ambiguidade:** FR-57 especifica política de senha forte para self-service. Não há especificação equivalente para quando um admin cria ou edita outro usuário. O SRS deve declarar explicitamente se a mesma política de senha forte se aplica ou não às operações de admin.

---

# 6. Itens para Validação Humana

## VH-01 — URL pattern `/:papel/:id/usuarios` é proposital ou legado?

O padrão de URL que inclui o papel e o ID do admin autenticado na própria rota (`/admin/42/usuarios`) é incomum. É necessário confirmar:
- Se este padrão foi uma decisão arquitetural intencional (e qual o raciocínio)
- Ou se é um artefato de uma implementação legada que deveria ser substituída pelo padrão convencional (`POST /usuarios` com `rbac('admin')`)

**Implicação:** A resposta define se U-06 deve gerar uma refatoração ou apenas documentação.

## VH-02 — CRUD completo de usuários via API REST é requisito ativo?

FR-26 especifica CRUD completo, mas a API atual fornece apenas login, logout, me, criar e atualizar eventos. As operações de listagem, atualização e remoção estão ausentes na API. É necessário confirmar:
- Se a ausência dessas operações na API é intencional (SSR como único canal admin)
- Ou se é um gap de implementação que deve ser priorizado

## VH-03 — Rate limiting na SSR deve ser implementado?

FR-55 só menciona `POST /usuarios/login` (API). O login SSR (`POST /login`) não tem rate limiting. A decisão de proteger ou não a rota SSR deve ser tomada explicitamente, com atualização do SRS independentemente da conclusão.

## VH-04 — Política de senha na criação/edição admin

Quando um admin cria ou edita um usuário via API ou SSR, a senha fornecida não é validada quanto à força (apenas comprimento mínimo de 6 chars no schema Zod da API; sem nenhuma validação no SSR). Deve-se confirmar se a exigência de senha forte (FR-57) deve ser universal ou restrita ao self-service.

## VH-05 — `scopedEvento` em rotas SSR: decisão de arquitetura

A incompatibilidade entre `authSSR` (plain object) e `scopedEvento` (exige instância Sequelize) impede que filtros de escopo por evento sejam aplicados em rotas SSR sem refatoração do `authSSR`. É preciso declarar se:
- O escopo por evento nas operações SSR de gestores/monitores é um requisito futuro (o que exige mudança arquitetural no `authSSR`)
- Ou se o escopo SSR é intencionalmente gerenciado apenas no nível da view template sem filtros de banco

---

# 7. Iniciativas Futuras de Spec

## SPEC-U-01 — Refatoração do padrão de URL de gerenciamento de usuários via API

Especificar a migração do padrão `/:papel/:id/usuarios` para URLs REST convencionais (`POST /usuarios`, `GET /usuarios`, `PUT /usuarios/:id`, `DELETE /usuarios/:id`) com `rbac('admin')` no nível de middleware, removendo a dependência do ID do admin na URL.

## SPEC-U-02 — API REST completa para domínio de usuários (FR-26)

Se o CRUD completo via API for confirmado como requisito ativo (VH-02), especificar:
- `GET /usuarios` — listagem paginada (admin only)
- `GET /usuarios/:id` — detalhe de usuário com eventos associados (admin only)
- `PUT /usuarios/:id` — atualização de dados e eventos (admin only)
- `DELETE /usuarios/:id` — soft delete (admin only)
- `POST /usuarios/:id/restore` — restauração (admin only)

## SPEC-U-03 — Criação de `usuarioService.js`

Especificar extração da lógica de negócio do controller para um service dedicado, incluindo:
- Autenticação (geração de JWT, comparação de hash)
- Gestão de associações usuário↔evento (com validação de existência)
- Soft delete e restore

## SPEC-U-04 — `authSSR` com suporte a `getEventos()`

Especificar ou carregar a instância Sequelize completa no `authSSR` (em vez de plain object), viabilizando uso de `scopedEvento` em rotas SSR no futuro, e adicionando `email` e `isMonitor` ao objeto de usuário disponível nas views.

## SPEC-U-05 — Rate limiting universal para ambas as rotas de login

Especificar que o rate limiting de login deve ser aplicado a ambas as superfícies (`POST /usuarios/login` e `POST /login`) com os mesmos parâmetros (10 tentativas / 15 minutos), como middleware compartilhado ou configuração equivalente.

## SPEC-U-06 — Padronizar resposta de RBAC negado para SSR

Especificar que o middleware `rbac`, quando invocado em contexto SSR, deve redirecionar para o dashboard com flash de erro ou renderizar uma página de erro HTML, em vez de retornar JSON 403.

---

# 8. Conclusão Arquitetural do Domínio

O domínio de usuários apresenta **déficit arquitetural e de segurança mais pronunciado que os outros domínios auditados** nesta série, sendo a única área do sistema sem uma camada de service dedicada (NFR-6 violado) e com RBAC reimplementado manualmente no controller (NFR-1, FR-38 violados).

**Vulnerabilidades de segurança confirmadas:**
- User enumeration no login API (U-01 — Alta)
- Ausência de rate limiting no login SSR (U-02 — Alta)
- Cookie JWT sem `secure` em produção (U-03 — Alta)

**Gaps funcionais confirmados:**
- API REST sem CRUD completo (U-07 — FR-26 não atendido)
- Login SSR sem rate limiting (U-02 — FR-55 não atendido pela metade)
- Sem rota API para alterar senha (FR-57 não tem correspondência via API)

**Inconsistências entre superfícies:**
- Mensagens de erro de login distintas entre API (user enumeration) e SSR (correto)
- Validação Zod presente apenas na API, ausente no SSR
- `req.usuario` com tipos diferentes em API (instância Sequelize) vs SSR (plain object)

**Divergências documentais:**
- URL real de login SSR (`POST /login`) difere do SRS (`POST /auth/login`)
- Swagger documenta `POST /usuarios` mas rota real é `POST /:papel/:id/usuarios`

O domínio não possui bloqueadores de funcionamento em modo normal — as operações SSR funcionam corretamente para o fluxo principal de admin. Porém, os três achados de segurança Alta (U-01, U-02, U-03) devem ser priorizados imediatamente, seguidos da criação de `usuarioService.js` para conformidade arquitetural.
