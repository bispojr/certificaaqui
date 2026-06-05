# Auditoria 07 — Domínio: Autenticação e Autorização

**Auditor:** GitHub Copilot (Claude Sonnet 4.6)  
**Data:** 2026-05-09 18:49 (BRT)  
**Escopo:** Login · Logout · Sessão · JWT · Cookies · auth · authSSR · RBAC · roles/perfis · autorização · autenticação API · autenticação SSR · controle de acesso · ownership · proteção de rotas · propagação de identidade · scopedEvento  
**Fontes consultadas:**
- `docs/especificacoes.md`
- `src/middlewares/auth.js`
- `src/middlewares/authSSR.js`
- `src/middlewares/rbac.js`
- `src/middlewares/scopedEvento.js`
- `src/middlewares/tiposCertificadosOwnership.js`
- `src/routes/auth.js`
- `src/routes/usuarios.js`
- `src/routes/usuarios-crud.js`
- `src/routes/admin.js`
- `src/routes/eventos.js`
- `src/routes/certificados.js`
- `src/routes/tipos-certificados.js`
- `src/routes/participantes.js`
- `src/controllers/usuarioController.js`
- `src/controllers/perfilSSRController.js`
- `src/controllers/dashboardController.js`
- `src/controllers/certificadoSSRController.js`
- `src/controllers/tiposCertificadosSSRController.js`
- `src/controllers/usuarioSSRController.js`
- `src/models/usuario.js`
- `src/models/usuario_eventos.js`
- `src/models/index.js`
- `src/validators/usuario.js`
- `src/validators/senhaForte.js`
- `app.js`

---

## Legenda de Tipos

| Código | Significado                  |
|--------|------------------------------|
| BR     | Bug real                     |
| GI     | Gap de implementação         |
| IP     | Implementação parcial        |
| ID     | Inconsistência documental    |
| DT     | Dívida técnica               |
| VU     | Vulnerabilidade              |
| AM     | Ambiguidade                  |
| VA     | Violação arquitetural        |

---

## 1. Matriz de Achados

| ID      | Descrição                                                                 | Severidade | Tipo | Impacto                                                  | Evidência principal                                       | FR/NFR        |
|---------|---------------------------------------------------------------------------|------------|------|----------------------------------------------------------|-----------------------------------------------------------|---------------|
| BR-001  | RBAC incorreto nas rotas de mutação de eventos (API)                      | Alta       | BR   | Gestor/monitor podem atualizar e deletar eventos via API | `src/routes/eventos.js` — `rbac('monitor')` em PUT/DELETE | FR-38, SRS API table |
| BR-002  | `scopedEvento` usa `req.params.id` como `evento_id` para rotas de recurso | Crítica    | BR   | Controle de acesso item-level de certificados é incorreto | `src/middlewares/scopedEvento.js` linha 37                | FR-37, NFR-1  |
| BR-003  | SSR certificado/criar exige `gestor`, mas FR-36 permite `monitor`         | Alta       | BR   | Monitores não conseguem criar certificados via SSR        | `src/routes/admin.js` — `rbac('gestor')` em POST /certificados | FR-36        |
| VU-001  | Cookie JWT sem flag `secure`                                              | Alta       | VU   | Cookie transmitido em HTTP; sujeito a interceptação       | `src/routes/auth.js` — `res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })` | NFR-1, NFR-3 |
| VU-002  | API login vaza existência de usuário via mensagens de erro distintas      | Média      | VU   | Enumeração de usuários cadastrados (OWASP A07)            | `src/controllers/usuarioController.js` linhas 47–50       | NFR-1         |
| GI-001  | SSR login (`POST /login`) sem rate limiting                               | Média      | GI   | Ataques de força bruta irrestrita via formulário SSR      | `src/routes/auth.js` — `router.post('/login', ...)` sem `loginLimiter` | FR-55 (ambíguo) |
| GI-002  | `GET /tipos-certificados` (API) sem `scopedEvento`                        | Média      | GI   | Gestor/monitor visualizam tipos de certificados de todos os eventos | `src/routes/tipos-certificados.js` — sem `scopedEvento` nos GETs | FR-37        |
| GI-003  | SSR certificado — operações de item sem verificação de ownership          | Alta       | GI   | Gestor pode editar/cancelar/deletar certificados de outros eventos via SSR | `src/controllers/certificadoSSRController.js` — `atualizar`, `cancelar`, `deletar`, `detalhe`, `editar` | FR-37, NFR-1 |
| GI-004  | Formulário SSR de criação de certificado expõe todos os eventos/tipos     | Média      | GI   | Gestor/monitor vê dados fora do seu escopo no formulário  | `src/controllers/certificadoSSRController.js` — `novo` usa `Evento.findAll()` sem filtro | FR-37        |
| IP-001  | `authSSR` não valida `JWT_SECRET` na inicialização do módulo             | Baixa      | IP   | NFR-3 não plenamente garantido pelo módulo authSSR        | `src/middlewares/authSSR.js` — ausência de `if (!JWT_SECRET) throw` | NFR-3        |
| IP-002  | `req.usuario` em SSR é POJO sem `getEventos()` e sem `email`             | Média      | IP   | Incompatibilidade estrutural com middlewares que dependem de `getEventos()`; `email` ausente em contexto SSR | `src/middlewares/authSSR.js` — `usuarioData` sem `getEventos` e sem `email` | NFR-6, FR-31 |
| IP-003  | `tiposCertificadosSSRController.index` exibe todos os tipos sem filtrar por evento | Média | IP | Gestor/monitor vê tipos de certificados de outros eventos; escopo apenas visual (`podeEditar`) | `src/controllers/tiposCertificadosSSRController.js` — `whereAtivos = {}` | FR-37        |
| VA-001  | RBAC implementado no controller em vez de middleware para `usuarios-crud` | Média      | VA   | Viola padrão arquitetural fail-fast; autenticação e autorização misturadas na camada controller | `src/routes/usuarios-crud.js` — sem `rbac('admin')`; check em `usuarioController.create` | NFR-6        |
| VA-002  | Padrão de rota `/:papel/:id/usuarios` excessivamente genérico             | Baixa      | VA   | Rota pode capturar caminhos não intencionais no namespace global | `src/routes/usuarios-crud.js` + `app.use('/', usuariosCrudRouter)` | NFR-6        |
| ID-001  | FR-22 ambíguo sobre permissão de restauração de certificado via API       | Baixa      | ID   | Comportamentos diferentes entre API (monitor) e SSR (admin) sem justificativa explícita | FR-22: "apenas admin pode restaurar via SSR"; tabela API: perfil mínimo monitor | FR-22        |
| ID-002  | SRS documenta `/auth/login` mas implementação usa `/login`                | Baixa      | ID   | Documentação de rotas incorreta; desenvolvedores podem referenciar rota errada | SRS tabela SSR-Auth vs `app.use('/', authRouter)` | FR-30        |
| DT-001  | express-session sem `cookie.secure` e sem `cookie.httpOnly`              | Média      | DT   | Cookie de sessão trafega sem atributos de segurança em produção HTTP | `app.js` — `session({ secret, resave: false, saveUninitialized: false })` sem `cookie` config | NFR-1, NFR-3 |
| DT-002  | `src/routes/auth.js` sem guard de `JWT_SECRET` na inicialização          | Baixa      | DT   | Diferente de `auth.js` (middleware), que lança erro na carga do módulo | `const JWT_SECRET = process.env.JWT_SECRET` — sem verificação imediata | NFR-3        |
| DT-003  | Ausência de log de tentativas de autenticação falhas                      | Baixa      | DT   | Sem rastreabilidade de ataques ou falhas de login no servidor | `usuarioController.login` e `src/routes/auth.js POST /login` — sem logging | NFR-1 (implícito) |
| AM-001  | FR-37 não especifica explicitamente quais recursos são cobertos por `scopedEvento` | Baixa | AM | Ambiguidade sobre se tipos-certificados (GET) e participantes devem ser escopados | FR-37 texto vs implementação atual | FR-37        |

---

## 2. Achados Críticos

### BR-002 — `scopedEvento` usa `req.params.id` como `evento_id` (Crítico)

**Localização:** `src/middlewares/scopedEvento.js`, linhas 34–40

**Evidência:**
```js
// Para rotas de consulta/alteração, buscar o evento alvo
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
if (eventoId && eventosIds.includes(Number(eventoId))) {
  return next()
}
return res.status(403).json({ error: 'Acesso restrito ao evento vinculado.' })
```

**Contexto:** Para rotas como `GET /certificados/:id`, `PUT /certificados/:id`, `DELETE /certificados/:id`, `POST /certificados/:id/restore` e `POST /certificados/:id/cancel`, `req.params.id` é o **ID do certificado**, não o ID do evento. O middleware interpreta esse parâmetro como `evento_id` e verifica se está no array de eventos vinculados ao usuário.

**Impacto concreto:** Dado um gestor vinculado aos eventos `[3, 5, 10]`:
- `GET /certificados/3` → **passa** (ID do cert. coincide com ID de evento na lista — acesso não autorizado se o cert. 3 pertence a outro evento)
- `GET /certificados/7` → **bloqueado** (7 não está em [3, 5, 10] — falso negativo se o cert. 7 pertence ao evento 5)
- `GET /certificados/5` → **passa** (ID do cert. coincide com evento 5 — acesso não autorizado se o cert. 5 pertence a outro evento)

O controle de acesso item-level para certificados é **não-determinístico e incorreto**. A verificação correta exigiria carregar o certificado e checar seu `evento_id`.

**FR relacionado:** FR-37 (gestores/monitores só operam dentro dos seus eventos), NFR-1 (controle de acesso).

---

### BR-001 — RBAC incorreto nas mutações de eventos via API (Alta)

**Localização:** `src/routes/eventos.js`

**Evidência:**
```js
router.post(
  '/',
  auth,
  rbac('monitor'),   // ← deveria ser rbac('admin')
  scopedEvento,
  validate(eventoSchema),
  eventoController.create,
)
router.put(
  '/:id',
  auth,
  rbac('monitor'),   // ← deveria ser rbac('admin')
  scopedEvento,
  validate(eventoSchema.partial()),
  eventoController.update,
)
router.delete(
  '/:id',
  auth,
  rbac('monitor'),   // ← deveria ser rbac('admin')
  scopedEvento,
  eventoController.delete,
)
router.post(
  '/:id/restore',
  auth,
  rbac('monitor'),   // ← deveria ser rbac('admin')
  scopedEvento,
  eventoController.restore,
)
```

**Análise por operação:**

| Rota | RBAC atual | Efeito real (não-admin) |
|------|------------|------------------------|
| `POST /eventos` | monitor | `scopedEvento` bloqueia com 403 (não há `evento_id` no body de criação) — resultado correto por acidente, mensagem enganosa |
| `PUT /eventos/:id` | monitor | Gestor/monitor **vinculado a esse evento** passa `scopedEvento` e pode **atualizar o evento** — BUG REAL |
| `DELETE /eventos/:id` | monitor | Gestor/monitor **vinculado a esse evento** passa `scopedEvento` e pode **deletar o evento** — BUG REAL |
| `POST /eventos/:id/restore` | monitor | Gestor/monitor pode **restaurar eventos** sem ser admin — BUG REAL |

**SRS documenta** (tabela API, seção Eventos): `PUT`, `DELETE`, `POST restore` → perfil mínimo: `admin`.

**FR relacionado:** FR-38 ("Rotas administrativas da API REST devem ser protegidas por `auth` (JWT Bearer) e `rbac`"), SRS API table.

---

### VU-001 — Cookie JWT sem flag `secure` (Alta)

**Localização:** `src/routes/auth.js`, linha 61

**Evidência:**
```js
res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
```

**Impacto:** A ausência do atributo `secure: true` permite que o cookie `token` seja transmitido em conexões HTTP não-criptografadas. Em produção HTTP ou em redes intermediadas (ataques MitM), o JWT pode ser capturado, resultando em sequestro de sessão.

**Complementar:** O cookie de sessão do `express-session` configurado em `app.js` também carece de `cookie: { secure: true, httpOnly: true }` (DT-001).

**FR relacionado:** NFR-1 (OWASP A01, A02), NFR-3.

---

### VU-002 — Enumeração de usuários via API login (Média)

**Localização:** `src/controllers/usuarioController.js`, linhas 47–50

**Evidência:**
```js
async login(req, res) {
  const { email, senha } = req.body
  const usuario = await Usuario.findOne({ where: { email } })
  if (!usuario)
    return res.status(401).json({ error: 'Usuário não encontrado' })  // ← vaza existência
  const valid = await bcrypt.compare(senha, usuario.senha)
  if (!valid) return res.status(401).json({ error: 'Senha inválida' })   // ← diferente
  ...
}
```

**Contraste com SSR login** (`src/routes/auth.js`, correto):
```js
req.flash('error', 'Credenciais inválidas')  // ← mensagem unificada
```

**Impacto:** Atacante que chama `POST /usuarios/login` com apenas email pode determinar se o endereço está cadastrado, viabilizando ataques de enumeração (OWASP A07). A superfície SSR trata corretamente com mensagem genérica.

**FR relacionado:** NFR-1 (OWASP A07).

---

### GI-003 — SSR certificado sem ownership em operações de item (Alta)

**Localização:** `src/controllers/certificadoSSRController.js`

**Evidência:** As funções `detalhe`, `editar`, `atualizar`, `cancelar` e `deletar` não verificam se o certificado pertence ao escopo de eventos do usuário autenticado:
```js
async function atualizar(req, res) {
  const certificado = await Certificado.findByPk(req.params.id)
  if (!certificado) { ... }
  // ← sem verificação de evento_id vs eventos do usuário
  await certificado.update({ ... })
}
```

**Contraste com o index SSR** (correto): a função `index` usa `getEventoIds(req)` para filtrar por `evento_id`. Mas as demais operações de item não fazem verificação equivalente.

**Impacto:** Um gestor autenticado pode editar, cancelar ou deletar via SSR qualquer certificado do sistema, independentemente do evento ao qual pertence. O RBAC impede monitores, mas não bloqueia gestores de operações cross-event.

**FR relacionado:** FR-37 (gestores/monitores só operam dentro dos seus eventos), NFR-1.

---

## 3. Problemas Arquiteturais

### PA-01 — Divergência estrutural de `req.usuario` entre `auth` e `authSSR`

Os dois middlewares de autenticação populam `req.usuario` com estruturas incompatíveis:

| Atributo           | `auth.js` (API)         | `authSSR.js` (SSR)       |
|--------------------|-------------------------|--------------------------|
| `id`               | ✅ presente             | ✅ presente              |
| `nome`             | ✅ (via Sequelize)      | ✅ presente              |
| `perfil`           | ✅ (via Sequelize)      | ✅ presente              |
| `email`            | ✅ (via Sequelize)      | ❌ ausente               |
| `getEventos()`     | ✅ (método Sequelize)   | ❌ ausente (POJO)        |
| `isAdmin`          | ❌ ausente              | ✅ computado             |
| `isGestor`         | ❌ ausente              | ✅ computado             |
| Tipo               | Instância Sequelize     | Plain Object             |

**Consequência:** `scopedEvento` e `tiposCertificadosOwnership` verificam `typeof req.usuario.getEventos !== 'function'` e retornam 500 se o método ausente. Ambos os middlewares são usados **apenas em contexto API** (onde `auth.js` garante a instância Sequelize), por isso o sistema funciona no estado atual. Porém qualquer refatoração que misture os contextos provocaria falhas silenciosas ou HTTP 500.

Os controllers SSR que precisam de eventos vinculados (e.g., `tiposCertificadosSSRController.getEventosIds`, `certificadoSSRController.getEventoIds`) foram reescritos para contornar essa limitação, criando duplicidade de lógica.

**Referência:** `src/middlewares/authSSR.js`, `src/middlewares/scopedEvento.js`, `src/controllers/tiposCertificadosSSRController.js`.

---

### PA-02 — Ausência de padrão uniforme de RBAC nas rotas SSR

As rotas SSR em `admin.js` apresentam três padrões de proteção de acesso distintos:

1. **Middleware explícito de RBAC** (maioria das rotas):
   ```js
   router.get('/tipos-certificados', rbac('gestor'), ...)
   router.get('/certificados', rbac('monitor'), ...)
   router.get('/usuarios', rbac('admin'), ...)
   ```

2. **Sem RBAC, apenas authSSR** (participantes e dashboard):
   ```js
   router.get('/participantes', participanteSSRController.index)      // sem rbac
   router.get('/dashboard', dashboardController.dashboard)             // sem rbac
   ```

3. **RBAC no controller** (usuarioController via usuarios-crud):
   ```js
   // route: sem rbac()
   // controller: if (req.usuario.perfil !== 'admin') return 403
   ```

Não existe documentação de qual padrão deve ser adotado. A inconsistência dificulta auditoria e manutenção.

---

### PA-03 — Rota `/:papel/:id/usuarios` com namespace global

A rota `POST /:papel/:id/usuarios` é montada em `app.use('/', usuariosCrudRouter)`, criando um padrão que coincide com qualquer path de 3 segmentos terminado em `/usuarios`. Embora o controller rejeite todas as combinações onde `papel !== 'admin'`, os middlewares `auth` e `validate(usuarioSchema)` são executados para toda requisição correspondente, incluindo chamadas não intencionais.

**Referência:** `src/routes/usuarios-crud.js`, `app.js`.

---

### PA-04 — `scopedEvento` aplicado a `POST /eventos` (create) com semântica incorreta

O middleware `scopedEvento` foi aplicado à rota de criação de evento (`POST /eventos`), onde não existe `evento_id` no corpo nem nos parâmetros. O comportamento resultante é: usuários não-admin recebem HTTP 403 com a mensagem `"Acesso restrito ao evento vinculado."`, que é semanticamente incorreta para uma operação de criação. A rejeição correta seria via `rbac('admin')` antes de `scopedEvento`.

---

## 4. Divergências API vs SSR

| Aspecto                          | API (`auth` + Bearer JWT)                                  | SSR (`authSSR` + Cookie HTTP-only)                         | Avaliação           |
|----------------------------------|------------------------------------------------------------|------------------------------------------------------------|---------------------|
| **Autenticação**                 | `Authorization: Bearer <token>`                            | Cookie `token` com `httpOnly: true`                        | Correto (dois fluxos documentados) |
| **Mensagem de erro login**       | "Usuário não encontrado" / "Senha inválida" (distintas)    | "Credenciais inválidas" (unificada)                        | ⚠️ VU-002 — API vaza informação |
| **Rate limiting no login**       | ✅ `loginLimiter` em `POST /usuarios/login`                | ❌ Ausente em `POST /login`                                | ⚠️ GI-001 |
| **req.usuario**                  | Instância Sequelize (com `getEventos()`, `email`)          | POJO (sem `getEventos()`, sem `email`)                     | ⚠️ IP-002 |
| **Criação de certificado**       | `rbac('monitor')` — monitores podem criar                  | `rbac('gestor')` — monitores NÃO podem criar               | ⚠️ BR-003 — diverge de FR-36 |
| **Ownership de certificado/:id** | `scopedEvento` (incorreto — usa cert ID como evento ID)    | Sem verificação nas operações de item                      | ⚠️ BR-002, GI-003 |
| **Listagem tipos certificados**  | Sem filtro de escopo                                        | Sem filtro de escopo (apenas `podeEditar` na UI)           | ⚠️ GI-002, IP-003 |
| **Eventos — mutações**           | `rbac('monitor')` (incorreto)                              | `rbac('admin')` (correto)                                  | ⚠️ BR-001 — API difere do SSR e do SRS |
| **Restauração de certificado**   | `rbac('monitor')`                                          | `rbac('admin')`                                            | ⚠️ ID-001 — SRS ambíguo para API |
| **Ownership tipos certificados** | `tiposCertificadosOwnership` (middleware)                  | `temOwnership()` (verificação no controller)               | Funcionalmente equivalente, mas arquiteturalmente divergente |
| **Cookie segurança**             | N/A                                                        | Sem `secure: true`                                         | ⚠️ VU-001 |
| **JWT_SECRET guard**             | `auth.js` valida na carga do módulo                        | `authSSR.js` NÃO valida na carga do módulo                 | ⚠️ IP-001 |

---

## 5. Atualizações Recomendadas no SRS

### 5.1 — FR-22: Esclarecer permissão de restauração de certificado via API

**Lacuna:** FR-22 afirma "apenas admin pode restaurar via SSR", mas não especifica o perfil mínimo para restauração via API. A tabela API lista `monitor` como perfil mínimo para `POST /certificados/:id/restore`.

**Recomendação documental:** Especificar explicitamente o perfil mínimo para restauração via API e alinhar com a justificativa de negócio (por que SSR exige admin mas API permite monitor?).

---

### 5.2 — FR-55: Esclarecer se rate limiting se aplica ao SSR login

**Lacuna:** FR-55 menciona exclusivamente `POST /usuarios/login`. O login SSR (`POST /login`) efetua a mesma operação de autenticação mas não está coberto.

**Recomendação documental:** Incluir `POST /login` (SSR) no escopo do requisito FR-55 ou criar FR adicional explicitando a intenção para o fluxo SSR.

---

### 5.3 — FR-30 / Tabela SSR-Auth: Corrigir rota documentada de `/auth/login` para `/login`

**Lacuna:** SRS documenta as rotas SSR de autenticação como `/auth/login` e `/auth/logout`. A implementação monta o router em `app.use('/', authRouter)`, resultando em rotas efetivas `/login` e `/logout`. O redirect em `authSSR` para `/login` está correto em relação à implementação, mas incorreto em relação ao SRS.

**Recomendação documental:** Atualizar a tabela "Interface SSR — Auth" para refletir as rotas reais (`/login`, `/logout`) ou ajustar o mapeamento das rotas na implementação.

---

### 5.4 — FR-37: Especificar quais recursos são cobertos por `scopedEvento`

**Lacuna:** FR-37 descreve `scopedEvento` como garantindo que gestores e monitores "operem exclusivamente dentro dos eventos ao qual estão vinculados", mas não enumera explicitamente quais recursos (certificados, tipos de certificados, participantes, eventos) devem ser filtrados.

**Recomendação documental:** Listar explicitamente os recursos sujeitos a escopo: quais listagens recebem filtro automático de `evento_id`, e quais operações de item requerem validação de ownership.

---

## 6. Itens para Validação Humana

| # | Questão                                                                 | Contexto                                                  |
|---|-------------------------------------------------------------------------|-----------------------------------------------------------|
| 1 | Qual é o perfil mínimo para `POST /certificados/:id/restore` via API? O SRS é ambíguo (FR-22 diz admin via SSR; tabela API diz monitor). | Decide a correção de BR-003 e ID-001 |
| 2 | A listagem `GET /tipos-certificados` via API deve ser filtrada por eventos do usuário? O SRS não especifica. | Define se GI-002 é um gap real ou comportamento intencional |
| 3 | A listagem `GET /participantes` via API deve ser filtrada por eventos do usuário? Participantes são entidades compartilhadas entre eventos. | Define escopo de FR-37 para participantes |
| 4 | O formulário SSR de criação de certificado deve apresentar apenas eventos/tipos do escopo do gestor? | Define se GI-004 é um bug ou comportamento intencional |
| 5 | O cookie de sessão do SSR deve ter `secure: true` configurado explicitamente? O comportamento pode ser controlado por proxy reverso (Nginx), tornando a configuração dupla. | Decide severidade real de VU-001 e DT-001 |
| 6 | A rota SSR de alteração de senha deve exigir re-autenticação explícita (ex.: expirar sessão) além da verificação de senha atual? | Decisão de segurança de sessão |
| 7 | O dashboardController deve ter `rbac('monitor')` explícito, alinhando com o padrão das demais rotas SSR? | Decisão de consistência arquitetural |

---

## 7. Iniciativas Futuras de Spec

### FI-01 — Spec: Item-level Ownership de Certificado

Definir formalmente como o sistema deve verificar que um gestor/monitor só acessa/modifica certificados pertencentes a seus eventos. A spec atual descreve o mecanismo (`scopedEvento`) mas não o algoritmo de resolução para operações de item (busca e verificação de `evento_id` do certificado).

---

### FI-02 — Spec: Contrato de `req.usuario` em ambas as superfícies

Definir um contrato formal (campos obrigatórios e tipo) para o objeto `req.usuario` que deve ser garantido pelos middlewares `auth` e `authSSR`. Isso eliminaria a divergência estrutural documentada em IP-002/PA-01 e permitiria middlewares de autorização reutilizáveis entre superfícies.

---

### FI-03 — Spec: Política de Rate Limiting para todos os endpoints de autenticação

Ampliar FR-55 para cobrir toda superfície de autenticação (SSR e API), definindo janelas e limites por superfície, com possível distinção de configuração.

---

### FI-04 — Spec: Atributos de Segurança de Cookies

Definir explicitamente os atributos obrigatórios para cookies de autenticação (`httpOnly`, `secure`, `sameSite`, `maxAge`) e para cookies de sessão (`httpOnly`, `secure`), separando configuração de desenvolvimento e produção.

---

### FI-05 — Spec: Auditoria e Logging de Eventos de Segurança

Especificar requisito formal de log para eventos de autenticação: tentativas falhas de login, logout, expiração de token, acesso negado por RBAC. Atualmente não existe FR/NFR cobrindo rastreabilidade de segurança.

---

## 8. Conclusão Arquitetural do Domínio

O domínio de Autenticação e Autorização apresenta uma estrutura de base sólida — JWT stateless com expiração de 1h, bcrypt (10 rounds), hierarquia de perfis clara (monitor < gestor < admin), soft delete aplicado a usuários — mas sofre de **falhas de implementação significativas** que comprometem a integridade do controle de acesso.

### Pontos críticos

1. **O achado mais grave (BR-002)** torna o controle de acesso item-level de certificados via API não-determinístico: o parâmetro de rota `req.params.id`, que identifica o certificado, é incorretamente interpretado pelo `scopedEvento` como identificador de evento. O resultado é que o acesso pode ser concedido ou bloqueado por coincidência numérica, não por regra de negócio.

2. **BR-001** permite que gestores e monitores atualizem e deletem eventos via API, violando o princípio de que apenas admins gerenciam eventos. O `scopedEvento` fornece proteção incidental para `POST` (criação sem `evento_id`), mas não para PUT e DELETE, onde o ID de evento existe em `req.params.id`.

3. **BR-003** cria uma assimetria injustificada: monitores criam certificados via API mas não via SSR, violando FR-36.

4. **VU-001 + DT-001** indicam que tanto o cookie JWT quanto o cookie de sessão trafegam sem `secure: true`, o que em produção HTTP expõe ambos a captura.

5. **VU-002** vaza a existência de usuários no sistema via mensagens de erro distintas no endpoint de API, enquanto o SSR implementa corretamente o padrão de mensagem unificada.

### Endividamento estrutural relevante

A ausência de um contrato formal para `req.usuario` (IP-002/PA-01) criou uma bifurcação não documentada entre os dois fluxos de autenticação. Controllers SSR foram reescritos com lógica própria de escopo de evento (`getEventosIds`, `temOwnership`) que duplica e parcialmente diverge da lógica dos middlewares de autorização. Isso aumenta a superfície de manutenção e o risco de divergência progressiva entre superfícies.

### O que funciona corretamente

- Hierarquia RBAC (`rbac` middleware) está correta e funcionalmente testável.
- Fluxo de login SSR usa mensagem genérica (seguro) e emite cookie `httpOnly` (protegido contra XSS).
- `tiposCertificadosOwnership` funciona corretamente na API.
- `tiposCertificadosSSRController` implementa `temOwnership` corretamente no controller, embora com padrão arquitetural divergente.
- Rate limiting em `POST /usuarios/login` está implementado (FR-55).
- Hash bcrypt aplicado por hooks Sequelize (`beforeCreate`, `beforeUpdate`) — correto e consistente.
- `authSSR` protege corretamente todas as rotas `/admin/*` via `router.use(authSSR)`.
- Soft delete implementado em usuários — usuários deletados não conseguem autenticar (paranoid query padrão).
- `perfilSSRController.alterarSenha` — fluxo correto: verifica senha atual, valida senha forte via Zod, aplica hash via hook.

### Recomendação geral

As correções prioritárias são, em ordem: **BR-002** (item-level ownership), **BR-001** (RBAC eventos), **VU-001** (cookie secure), **VU-002** (enumeração de usuários), **BR-003** (RBAC certificado SSR), **GI-003** (ownership certificado SSR). A adoção de um contrato formal para `req.usuario` eliminaria a bifurcação estrutural e reduziria o risco de regressões futuras.
