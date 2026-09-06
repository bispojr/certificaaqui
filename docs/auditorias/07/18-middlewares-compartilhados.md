# Auditoria Técnica — Domínio: Middlewares Compartilhados

**Sistema:** Certifique-me  
**Versão SRS auditada:** 2.0  
**Data da auditoria:** 2026-05-10  
**Hora:** 12:15 (BRT)  
**Auditor:** Arquiteto de Software Sênior — revisão técnica automatizada  
**Status:** Concluído

---

## Fontes analisadas

| Arquivo                                         | Propósito                                     |
| ----------------------------------------------- | --------------------------------------------- |
| `docs/especificacoes.md`                        | SRS — requisitos funcionais e não funcionais  |
| `src/middlewares/auth.js`                       | Autenticação JWT Bearer (API)                 |
| `src/middlewares/authSSR.js`                    | Autenticação via cookie HTTP-only (SSR)       |
| `src/middlewares/rbac.js`                       | Controle de acesso por perfil                 |
| `src/middlewares/scopedEvento.js`               | Isolamento multi-evento                       |
| `src/middlewares/tiposCertificadosOwnership.js` | Ownership de tipos por gestor                 |
| `src/middlewares/validate.js`                   | Validação Zod                                 |
| `src/middlewares/uploadTemplate.js`             | Upload via multer                             |
| `app.js`                                        | Registro e ordem dos middlewares globais      |
| `src/routes/usuarios.js`                        | Rate limiting em login API                    |
| `src/routes/auth.js`                            | Fluxo SSR login/logout                        |
| `src/routes/admin.js`                           | Rotas SSR admin + aplicação de authSSR + rbac |
| `src/routes/certificados.js`                    | Cadeia de middlewares para certificados       |
| `src/routes/eventos.js`                         | Cadeia de middlewares para eventos            |
| `src/routes/tipos-certificados.js`              | Cadeia para tipos de certificados             |
| `src/routes/participantes.js`                   | Cadeia para participantes                     |
| `src/routes/usuarios-crud.js`                   | CRUD de usuários via API                      |
| `src/models/usuario.js`                         | Modelo com paranoid: true                     |
| `src/controllers/usuarioController.js`          | Evidência de enforcement no controller        |
| `src/controllers/perfilSSRController.js`        | Evidência de uso de req.usuario.id em SSR     |

---

## 1. Matriz Consolidada de Achados

| ID   | Middleware envolvido                          | Descrição                                                                                                                                                                       | Evidências                                                                                                                                                                                                                                                                                           | Severidade | Tipo | Impacto                                                                                                                                                                                                                                                  | Requisitos violados                                          | Destino recomendado                |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| F-01 | `scopedEvento`                                | `req.params.id` tratado como `eventoId` para operações em recurso único — confunde ID do recurso com ID de evento                                                               | `scopedEvento.js:31–40`: `const eventoId = req.body.evento_id \|\| req.params.eventoId \|\| req.params.id`. Rotas como `GET /certificados/:id`, `PUT /certificados/:id`, `DELETE /certificados/:id` expõem `:id` do certificado como suposto `eventoId`.                                             | Crítico    | VU   | Acesso cross-evento: usuário com evento_id=3 pode acessar qualquer recurso com id=3; usuário com evento=[1,2] é bloqueado de certificado id=5 mesmo que pertença ao evento 1                                                                             | FR-37, NFR-1                                                 | Backlog segurança — curto prazo    |
| F-02 | nenhum (`usuarios-crud.js`)                   | Rotas de criação de usuários e atualização de eventos sem `rbac` no pipeline de middlewares; enforcement realizado apenas no controller                                         | `usuarios-crud.js:10–19`: `router.post('/:papel/:id/usuarios', auth, validate(usuarioSchema), usuarioController.create)`. Nenhum `rbac` na cadeia. Controller (`usuarioController.js:13–18`) verifica `req.usuario.perfil !== 'admin'`, violando NFR-6                                               | Alto       | VU   | Qualquer usuário autenticado (monitor, gestor) pode tentar criar usuários via API sem bloqueio de middleware; enforcement é responsabilidade do controller, não do pipeline de autorização                                                               | FR-34, FR-38, NFR-1, NFR-6                                   | Backlog segurança — curto prazo    |
| F-03 | nenhum (`routes/auth.js`)                     | `POST /login` (SSR) não tem rate limiting; apenas `POST /usuarios/login` (API) é protegido                                                                                      | `routes/auth.js:40–63`: `router.post('/login', async (req, res) => {...})` — sem `loginLimiter`. `routes/usuarios.js:8–18`: `loginLimiter` definido com `max: 10, windowMs: 15*60*1000` mas aplicado somente em `router.post('/login', loginLimiter, ...)`                                           | Alto       | GI   | Endpoint SSR de autenticação vulnerável a brute force sem limitação de tentativas                                                                                                                                                                        | FR-55 (parcialmente — FR-55 nomeia apenas `/usuarios/login`) | Backlog segurança — curto prazo    |
| F-04 | `authSSR`                                     | Injeta plain object sem método `getEventos()` em `req.usuario`, criando contrato assimétrico com `auth` e risco latente de HTTP 500 se `scopedEvento` for aplicado em rotas SSR | `authSSR.js:48–55`: `const usuarioData = { id, nome, perfil, isAdmin, isGestor }`. `scopedEvento.js:8–11`: `if (typeof req.usuario.getEventos !== 'function') return res.status(500).json(...)`. Campo `email` também ausente no objeto SSR                                                          | Alto       | VA   | Assimetria de contrato `req.usuario` entre fluxo API e SSR; risco latente de 500 em qualquer extensão futura que aplique `scopedEvento` em contexto SSR; `perfilSSRController.js` usa `req.usuario.id` (presente), mas `email` e `getEventos()` ausentes | FR-37, NFR-6                                                 | Backlog arquitetural — médio prazo |
| F-05 | `rbac` (falha em `routes/eventos.js`)         | `POST /eventos` usa `rbac('monitor')` em vez de `rbac('admin')`; proteção real é contornada acidentalmente por `scopedEvento`                                                   | `routes/eventos.js:152`: `router.post('/', auth, rbac('monitor'), scopedEvento, ...)`. SSR: `routes/admin.js:83`: `router.post('/eventos', rbac('admin'), ...)`. Para não-admin via API, `scopedEvento` bloqueia com erro "Acesso restrito ao evento vinculado" (confuso), não "Perfil insuficiente" | Médio      | VA   | Violação de defense-in-depth: RBAC não é o guardião primário para criação de eventos na API; mensagem de erro enganosa leva a diagnóstico incorreto                                                                                                      | FR-34, FR-38, NFR-1                                          | Backlog arquitetural — curto prazo |
| F-06 | `authSSR`                                     | Sem validação de `JWT_SECRET` ao carregamento do módulo; dependência implícita de `auth.js` ser carregado primeiro                                                              | `authSSR.js:` sem nenhum check de env no topo. `auth.js:3-4`: `const secret = process.env.JWT_SECRET; if (!secret) throw new Error(...)`. `authSSR.js:33`: `jwt.verify(token, process.env.JWT_SECRET)` inline                                                                                        | Médio      | DT   | Dependência implícita de ordem de carregamento de módulos; se `auth.js` não for carregado, `authSSR` falha silenciosamente em runtime ao invés de abortar o startup                                                                                      | NFR-3                                                        | Backlog técnico — médio prazo      |
| F-07 | `scopedEvento`                                | Sem try/catch ao redor de `req.usuario.getEventos()`                                                                                                                            | `scopedEvento.js:8`: `const eventos = await req.usuario.getEventos()` — sem tratamento de exceção                                                                                                                                                                                                    | Médio      | DT   | Falha de banco de dados propagada para handler genérico do Express; rotas API podem receber resposta HTML de erro em vez de JSON                                                                                                                         | NFR-1 (indiretamente)                                        | Backlog técnico — curto prazo      |
| F-08 | `authSSR` / `routes/auth.js`                  | SRS especifica SSR login em `POST /auth/login`; implementação registra `POST /login`                                                                                            | FR-30: "(b) SSR: `POST /auth/login`". `app.js:176`: `app.use('/', authRouter)`. `routes/auth.js:40`: `router.post('/login', ...)` → rota efetiva: `POST /login`                                                                                                                                      | Médio      | ID   | Documentação diverge da implementação; pode causar confusão em integração, automação de testes e documentação de API                                                                                                                                     | FR-30                                                        | Backlog documental — médio prazo   |
| F-09 | `scopedEvento` / `tiposCertificadosOwnership` | `GET /tipos-certificados` e `GET /tipos-certificados/:id` sem filtragem por evento do usuário                                                                                   | `routes/tipos-certificados.js:144-145`: `router.get('/', auth, rbac('monitor'), tiposCertificadosController.findAll)` e `router.get('/:id', auth, rbac('monitor'), tiposCertificadosController.findById)` — nenhum `scopedEvento`                                                                    | Médio      | GI   | Gestores e monitores podem listar e visualizar tipos de certificados de todos os eventos, não apenas dos seus; violação do princípio de isolamento multi-evento                                                                                          | FR-37                                                        | Backlog segurança — curto prazo    |
| F-10 | `routes/auth.js` / `app.js` (session)         | Cookies JWT e de sessão sem atributo `secure: true` explícito                                                                                                                   | `routes/auth.js:59`: `res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })`. `app.js:43-47`: `session({ secret, resave: false, saveUninitialized: false })` sem `cookie: { secure: true }`                                                                                                | Médio      | VH   | Se HTTPS não for enforçado no proxy reverso, cookies transmitidos via HTTP podem ser interceptados (OWASP A02)                                                                                                                                           | NFR-1 (implícito)                                            | Validação humana / backlog infra   |
| F-11 | `authSSR`                                     | Backdoor de teste `x-mock-user` injeta usuário via cabeçalho HTTP sem validação de schema                                                                                       | `authSSR.js:6-14`: `JSON.parse(req.headers['x-mock-user'])` sem validação de estrutura; `req.session.mockUser = mockUser` persiste na sessão                                                                                                                                                         | Baixo      | AM   | Risco caso `NODE_ENV === 'test'` seja definido inadvertidamente em ambiente não-teste; object injection via JSON parse sem schema                                                                                                                        | NFR-1                                                        | Validação humana                   |
| F-12 | `authSSR`                                     | `isMonitor` ausente no objeto `req.usuario` / `res.locals.usuario` no contexto SSR                                                                                              | `authSSR.js:48-55`: `{ id, nome, perfil, isAdmin, isGestor }` — sem `isMonitor`. `auth.js` retorna instância Sequelize completa                                                                                                                                                                      | Baixo      | DT   | Qualquer view, helper ou lógica que verifique `req.usuario.isMonitor` recebe `undefined`; inconsistência de API do contexto de usuário                                                                                                                   | —                                                            | Backlog técnico — longo prazo      |
| F-13 | `tiposCertificadosOwnership`                  | Check redundante de `perfil === 'monitor'` em middleware de ownership; rota já tem `rbac('gestor')` antes                                                                       | `tiposCertificadosOwnership.js:21-26`: bloqueia monitor com 403. `routes/tipos-certificados.js:147-167`: toda mutação já aplica `rbac('gestor')` que bloqueia monitor antes de chegar ao ownership middleware                                                                                        | Baixo      | DT   | Lógica duplicada; em caso de refatoração das rotas, pode criar comportamento diferente do esperado                                                                                                                                                       | NFR-6                                                        | Backlog técnico — longo prazo      |
| F-14 | `authSSR` / `routes/auth.js`                  | Ausência de mecanismo de revogação/sincronização de logout entre SSR e API                                                                                                      | `routes/auth.js:69-72`: `router.post('/logout', (req, res) => { res.clearCookie('token'); return res.redirect('/login') })` — não invalida o token JWT. `routes/usuarios.js:130`: `router.post('/logout', usuarioController.logout)` — retorna JSON sem limpar cookie                                | Médio      | VH   | Token JWT emitido permanece válido por 1h após logout SSR; logout API não afeta cookie SSR; comportamento de sessão unificada não especificado no SRS                                                                                                    | FR-30 (implícito)                                            | Validação humana                   |
| F-15 | `tiposCertificadosOwnership`                  | Comentário JSDoc no middleware afirma "GET (qualquer): passa sempre" mas o middleware não é aplicado a rotas GET                                                                | `tiposCertificadosOwnership.js:5-6`: `* - GET (qualquer): passa sempre`. `routes/tipos-certificados.js:144-145`: GET routes não incluem este middleware                                                                                                                                              | Baixo      | ID   | Comentário enganoso; pode causar interpretação incorreta do comportamento esperado durante manutenção                                                                                                                                                    | —                                                            | Backlog documental — longo prazo   |

---

## 2. Problemas Sistêmicos Transversais

### 2.1 Falha de autenticação entre API e SSR

O maior problema transversal é a **assimetria do contrato `req.usuario`** entre os dois fluxos de autenticação:

- **API (`auth`):** `req.usuario` é uma instância Sequelize completa com todos os métodos ORM, incluindo `getEventos()`. O objeto expõe todos os campos do modelo, incluindo `email`, `senha` (hash) e `deleted_at`.
- **SSR (`authSSR`):** `req.usuario` é um plain object com apenas `{ id, nome, perfil, isAdmin, isGestor }`. Sem `email`, sem `getEventos()`, sem `isMonitor`.

Esta assimetria não é documentada no SRS. Qualquer middleware que precise operar em ambos os contextos (ex.: `scopedEvento` ou um futuro middleware unificado) precisará tratar os dois tipos de objeto.

### 2.2 Inconsistência de RBAC global

O RBAC é aplicado de forma inconsistente entre API e SSR:

- **SSR (`admin.js`):** criação de eventos protegida por `rbac('admin')`.
- **API (`eventos.js`):** criação de eventos protegida por `rbac('monitor')` — a proteção efetiva vem de `scopedEvento`.
- **Usuarios CRUD (`usuarios-crud.js`):** sem `rbac` na rota — proteção apenas no controller.

O enforcement centralizado de RBAC via middleware não é universal, violando o princípio declarado em NFR-1.

### 2.3 Bypass de scopedEvento por confusão de IDs (F-01)

A lógica de resolução do `eventoId` em `scopedEvento` para operações de recurso único (`GET/PUT/DELETE /:id`) usa `req.params.id` como fallback para `evento_id`. Para recursos como certificados, eventos e participantes (quaisquer cujo id não seja um evento_id), este campo resolve para o ID do recurso, não do evento. O resultado é uma verificação de isolamento com dados semanticamente incorretos.

### 2.4 Fragilidade do pipeline HTTP

A cadeia de middlewares para a API de certificados é:

```
auth → rbac('monitor') → scopedEvento → validate → controller
```

Para `GET /certificados/:id`, `scopedEvento` tenta resolver o evento do certificado via `req.params.id`. Esta cadeia é frágil: se o certificado de ID=5 não pertencer ao evento=5, o acesso é incorretamente negado ou permitido dependendo da coincidência de IDs.

### 2.5 Divergência de sessão vs JWT

O sistema mantém dois estados independentes:

1. **Sessão Express** (`express-session`): usada para flash messages e mock de testes.
2. **JWT via cookie HTTP-only**: autenticação real no SSR.

Não há ligação entre eles. O logout SSR limpa o cookie JWT mas não invalida nenhuma sessão de servidor. O token JWT permanece válido por até 1 hora após logout. O SRS não especifica o comportamento esperado para revogação de tokens.

### 2.6 Risco sistêmico de privilege escalation via pipeline incompleto

O padrão `auth → controller (com check manual de perfil)` em `usuarios-crud.js` é um antipadrão de segurança. Se o check no controller for removido ou alterado durante refatoração, não há defesa de middleware. A escalada de privilégio resultante permitiria a qualquer usuário autenticado criar administradores.

---

## 3. Correções Críticas Imediatas

### 3.1 F-01 — scopedEvento: confusão de IDs em operações de recurso único

**Problema:** Para `GET/PUT/DELETE /:id`, o middleware compara `req.params.id` (ID do recurso) com a lista de IDs de eventos do usuário.

**Risco imediato:** Acesso cross-evento é possível se o ID de um recurso coincidir com um ID de evento do usuário. Usuários legítimos podem ser bloqueados por IDs não coincidentes.

**Recomendação de destino:** A lógica de isolamento para operações de recurso único deve ser movida para o service/controller, onde o recurso é carregado e sua associação com `evento_id` pode ser verificada diretamente.

---

### 3.2 F-02 — usuarios-crud: ausência de RBAC no middleware

**Problema:** Rotas `POST /:papel/:id/usuarios` e `PUT /:papel/:id/usuarios/:usuarioId/eventos` sem `rbac`.

**Risco imediato:** Qualquer usuário autenticado (monitor, gestor) pode tentar operações administrativas. Proteção existe somente no controller.

**Recomendação de destino:** Adicionar `rbac('admin')` à cadeia de middlewares em `usuarios-crud.js`, antes de `validate`.

---

### 3.3 F-03 — SSR login sem rate limiting

**Problema:** `POST /login` (rota SSR) sem `loginLimiter`.

**Risco imediato:** Endpoint de autenticação SSR vulnerável a brute force irrestrito.

**Recomendação de destino:** Aplicar o mesmo `loginLimiter` (ou equivalente) a `POST /login` em `routes/auth.js`.

---

### 3.4 F-09 — GET tipos-certificados sem scoping

**Problema:** `GET /tipos-certificados` e `GET /tipos-certificados/:id` sem `scopedEvento`, permitindo acesso a dados de eventos fora do escopo do usuário.

**Risco imediato:** Gestor/monitor pode obter informações de tipos de certificados de outros eventos, violando o isolamento multi-tenant.

**Recomendação de destino:** Para `GET /tipos-certificados`, aplicar `scopedEvento` ou criar um filtro específico de evento no controller. Para `GET /tipos-certificados/:id`, validar que o tipo pertence ao evento do usuário.

---

## 4. Backlog Arquitetural Priorizado

### Curto prazo

- **F-01:** Corrigir lógica de scopedEvento para operações de recurso único — extrair verificação de ownership para service layer ou middleware especializado por domínio.
- **F-02:** Adicionar `rbac('admin')` às rotas de `usuarios-crud.js`.
- **F-03:** Aplicar rate limiting em `POST /login` (SSR).
- **F-05:** Corrigir `POST /eventos` API para usar `rbac('admin')` ao invés de `rbac('monitor')`.
- **F-07:** Adicionar try/catch em `scopedEvento.getEventos()`.
- **F-09:** Aplicar scoping de evento em rotas GET de tipos-certificados.

### Médio prazo

- **F-04:** Unificar contrato de `req.usuario`: ou expor objeto consistente em ambos os fluxos (API e SSR), ou documentar explicitamente as diferenças e garantir que nenhum middleware dependa de campos ausentes no contexto SSR.
- **F-06:** Adicionar validação de `JWT_SECRET` ao startup em `authSSR.js`, independentemente de `auth.js`.
- **F-08:** Corrigir SRS para refletir a rota efetiva `POST /login` ou renomear a rota para `POST /auth/login`.
- **F-14:** Definir política de logout unificado (SSR + API) e implementar se necessário.

### Longo prazo

- **F-12:** Adicionar `isMonitor` ao objeto plain de `authSSR`, alinhar campos com o que está disponível via `auth` (considerar omitir campos sensíveis como `senha`).
- **F-13:** Remover check redundante de monitor em `tiposCertificadosOwnership` (já coberto por `rbac('gestor')` na rota).
- **F-15:** Atualizar comentário JSDoc em `tiposCertificadosOwnership` para refletir que GET routes não passam pelo middleware.
- Avaliação de substituição do RBAC por middleware centralizado com registro declarativo de permissões por rota.

---

## 5. Atualizações Recomendadas no SRS

### 5.1 FR-30 — Divergência de endpoint SSR login

FR-30 especifica: `"(b) SSR: POST /auth/login"`. A implementação registra a rota em `POST /login` (via `app.use('/', authRouter)`). O SRS deve ser atualizado para `POST /login` OR a rota deve ser movida para `/auth/login`.

### 5.2 FR-37 — Comportamento de scopedEvento em operações de recurso único não especificado

FR-37 descreve o comportamento de scoping para listagens (GET sem ID). O comportamento para operações de recurso único (`GET /:id`, `PUT /:id`, `DELETE /:id`) não está explicitado. Deve ser incluída a definição de como o middleware valida ownership do recurso individual (ex.: carregando o recurso e verificando seu `evento_id`).

### 5.3 FR-38 — Ausência de especificação de proteção de rotas de CRUD de usuários

FR-38 especifica que rotas administrativas da API REST devem ser protegidas por `auth + rbac`. As rotas em `usuarios-crud.js` não têm `rbac`. O SRS deve especificar explicitamente que rotas de gerenciamento de usuários (criação, atualização de eventos) requerem `rbac('admin')`.

### 5.4 Ausência de especificação do contrato req.usuario

O SRS não documenta o contrato de `req.usuario` (ou `res.locals.usuario`) — quais campos são garantidos, se é instância Sequelize ou plain object, e se métodos ORM estarão disponíveis. Esta especificação é necessária para garantir consistência arquitetural entre middlewares.

---

## 6. Itens para Validação Humana

### VH-01 — Cookies sem atributo `secure: true` (F-10)

O JWT cookie (`token`) e o cookie de sessão são configurados sem `secure: true`. Em contextos de produção com HTTPS (proxy reverso nginx/cloudflare), isso pode ser aceitável se o proxy removecer requests HTTP. Requer confirmação da configuração de infraestrutura de produção para determinar se é uma vulnerabilidade real.

> **Decisão necessária:** O deployment em produção usa HTTPS obrigatório no proxy reverso? Se sim, há necessidade de `secure: true` explícito no código (app trust proxy)?

### VH-02 — Mock de usuário via header `x-mock-user` (F-11)

O padrão de mock em `authSSR.js` (`if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user'])`) é funcional para testes. O risco só se materializa se `NODE_ENV === 'test'` em ambiente não-teste.

> **Decisão necessária:** Existe processo que garante `NODE_ENV !== 'test'` em produção e staging? O mock de sessão (`req.session.mockUser = mockUser`) é intencional?

### VH-03 — Política de revogação/sincronização de logout (F-14)

O sistema não possui mecanismo de revogação de JWT. Após logout SSR, o token permanece válido por até 1h. Após logout API, o cookie SSR não é limpo.

> **Decisão necessária:** O produto requer logout global (invalidação imediata de token em ambos os fluxos)? Caso positivo, é necessário implementar uma blocklist de tokens ou reduzir o `expiresIn`.

### VH-04 — Ausência de `isMonitor` no contexto SSR

`authSSR` expõe `isAdmin` e `isGestor` mas não `isMonitor`. Isso pode ser intencional (monitor é o perfil padrão, detectado por exclusão) ou inadvertido.

> **Decisão necessária:** Views e helpers Handlebars dependem de `isMonitor`? Se sim, deve ser adicionado.

---

## 7. Iniciativas de Spec (Spec Kit)

### Iniciativa 1 — Padronização do contrato req.usuario

**Objetivo:** Definir e enforçar um contrato único para o objeto `req.usuario` nos dois fluxos de autenticação (API e SSR).

**Justificativa:** A assimetria atual (instância Sequelize vs plain object) cria dependências implícitas entre middlewares e risco latente de erros em extensões futuras.

**Escopo proposto:** Definir uma interface documentada com campos mínimos garantidos (`id`, `nome`, `email`, `perfil`, `isAdmin`, `isGestor`, `isMonitor`), e um adaptador que exponha `getEventos()` em ambos os contextos ou abstraia a consulta de eventos para um middleware dedicado.

---

### Iniciativa 2 — Redesign de scopedEvento para operações de recurso único

**Objetivo:** Corrigir e formalizar o comportamento do `scopedEvento` para todas as operações do pipeline (listagem, criação, acesso/mutação de recurso único).

**Justificativa:** A lógica atual de `req.params.id` como `eventoId` é semanticamente incorreta para todos os recursos cujo `:id` paramétrico não é um `evento_id`.

**Escopo proposto:** Separar claramente as responsabilidades:

1. Para listagens: injeção de filtro `evento_id` (comportamento atual — correto).
2. Para mutações com `req.body.evento_id`: verificação de evento no body (comportamento atual — correto).
3. Para operações por `:id`: delegar ao service/controller verificar se o recurso pertence ao evento do usuário — não é responsabilidade do middleware genérico.

---

### Iniciativa 3 — Centralização do pipeline de middleware por domínio

**Objetivo:** Documentar e enforçar o pipeline padrão para cada tipo de rota.

**Justificativa:** Inconsistências na cadeia (ex.: F-05, F-09) sugerem ausência de convenção documentada.

**Escopo proposto:** Definir pipelines por tipo:

- Rota API administrativa: `auth → rbac(nível mínimo) → scopedEvento (se aplicável) → validate → controller`
- Rota SSR administrativa: `authSSR (global no router) → rbac(nível mínimo) → controller`
- Rota pública: sem middlewares de autenticação

---

## 8. Análise de Problemas Sistêmicos

### 8.1 Padrões de falha de segurança no pipeline HTTP

O padrão de falha mais crítico identificado é a **confusão semântica de parâmetros no `scopedEvento`**. A lógica de fallback para `req.params.id` foi provavelmente introduzida para cobrir rotas de tipo `GET /eventos/:id` (onde `:id` seria o próprio evento), sem considerar que o mesmo middleware é aplicado a rotas de outros domínios (certificados, participantes).

Este padrão de reuso de middleware genérico sem adaptação ao domínio é um antipadrão que gera falsos positivos e negativos no controle de acesso.

### 8.2 Inconsistência estrutural entre SSR e API

| Aspecto                      | API (`auth`)                                         | SSR (`authSSR`)                       |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Tipo de `req.usuario`        | Instância Sequelize                                  | Plain object                          |
| Campos disponíveis           | Todos do modelo                                      | `id, nome, perfil, isAdmin, isGestor` |
| `email` disponível           | Sim                                                  | Não                                   |
| `getEventos()` disponível    | Sim                                                  | Não                                   |
| `isMonitor` disponível       | Via `perfil === 'monitor'`                           | Não (campo ausente)                   |
| Soft-delete treatment        | `paranoid: true` no model — excluído automaticamente | Idem                                  |
| Validação JWT_SECRET no load | Sim (throw at startup)                               | Não (dependência implícita)           |

### 8.3 Dependência excessiva de middleware para segurança com bypasses implícitos

O caso de `POST /eventos` com `rbac('monitor') + scopedEvento` exemplifica um padrão onde o RBAC não é o guardião primário — ele é "decorativo" para o nível de proteção real. A proteção efetiva vem de uma consequência colateral da lógica de `scopedEvento` (ausência de `evento_id` no body). Este padrão é frágil: se `scopedEvento` for refatorado ou removido, a proteção desaparece sem alarme de RBAC.

### 8.4 Fragilidade de autenticação híbrida

O sistema mantém dois mecanismos de autenticação paralelos (JWT Bearer + cookie JWT) sem definição de relação entre eles:

- Logout em um fluxo não invalida o outro.
- A sessão Express é um terceiro estado (usada para flash messages e mocks de teste) que coexiste independentemente dos dois mecanismos JWT.
- A sesão persiste `mockUser` em modo de teste, o que cria um estado de sessão baseado em header HTTP — se o mecanismo de detecção de ambiente falhar, isso se torna uma backdoor de autenticação.

### 8.5 Risco sistêmico de bypass de autorização

A combinação de F-01 (confusão de IDs em scopedEvento) e F-02 (ausência de RBAC em usuarios-crud) representa o maior risco sistêmico de bypass. O primeiro pode permitir acesso cross-evento por coincidência de IDs. O segundo pode permitir criação de usuários com qualquer perfil (incluindo admin) por usuário autenticado de perfil inferior, se o check do controller for contornado ou refatorado sem atenção.

### 8.6 Inconsistência de enforcement multi-tenant

O isolamento multi-evento é aplicado de forma inconsistente:

| Recurso            | API GET lista                     | API GET /:id                         | API POST                               | API PUT/DELETE                       |
| ------------------ | --------------------------------- | ------------------------------------ | -------------------------------------- | ------------------------------------ |
| Certificados       | ✅ scopedEvento (query injection) | ⚠️ scopedEvento (ID confusão — F-01) | ✅ scopedEvento (body evento_id)       | ⚠️ scopedEvento (ID confusão — F-01) |
| Eventos            | ✅ scopedEvento                   | ⚠️ scopedEvento (ID confusão)        | ⚠️ rbac errado (F-05)                  | ⚠️ scopedEvento (ID confusão)        |
| Participantes      | ✅ sem scoping (intencional?)     | ✅ sem scoping (intencional?)        | ✅ sem scoping (participantes globais) | ✅ sem scoping                       |
| Tipos Certificados | ❌ sem scoping (F-09)             | ❌ sem scoping (F-09)                | ✅ ownership check                     | ✅ ownership check                   |
| Usuários (CRUD)    | N/A                               | N/A                                  | ⚠️ sem rbac em rota (F-02)             | ⚠️ sem rbac em rota (F-02)           |

Legenda: ✅ Correto / ⚠️ Com problema identificado / ❌ Ausente

O padrão de inconsistência é claro: operações de listagem têm melhor cobertura do que operações por ID único; o domínio de tipos de certificados tem scoping em mutações mas não em leituras.

---

_Auditoria concluída em 2026-05-10 12:15 (BRT)_
