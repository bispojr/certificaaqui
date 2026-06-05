# Auditoria 07 — Domínio 3: Segurança e Configuração do Sistema

**Auditado por:** Arquiteto de Software Sênior (auditoria técnica automatizada)  
**Data:** 2026-05-10 12:24 (BRT)  
**Versão SRS:** 2.0 (2026-04-30)  
**Escopo:** Segurança e Configuração do Sistema

---

## Fontes Analisadas

| Arquivo | Finalidade |
|---|---|
| `docs/especificacoes.md` | SRS — requisitos funcionais e NFRs |
| `app.js` | Bootstrap, session, swagger, rotas |
| `config/database.js` | Configuração Sequelize / PostgreSQL |
| `.env.example` | Referência de variáveis de ambiente |
| `src/middlewares/auth.js` | JWT Bearer (API) |
| `src/middlewares/authSSR.js` | Cookie JWT (SSR) |
| `src/middlewares/rbac.js` | Controle de acesso por perfil |
| `src/middlewares/scopedEvento.js` | Restrição de scope por evento |
| `src/middlewares/uploadTemplate.js` | Multer — upload de template |
| `src/services/r2Service.js` | Integração Cloudflare R2 |
| `src/services/pdfService.js` | Geração de PDF |
| `src/models/usuario.js` | Hash bcrypt, hooks |
| `src/routes/usuarios.js` | Rate limiting login API |
| `src/routes/auth.js` | Login/logout SSR |
| `src/controllers/perfilSSRController.js` | Alteração de senha |
| `src/validators/senhaForte.js` | Política de senha forte |
| `docker-compose.yml` | Ambiente de produção |
| `docker-compose.test.yml` | Ambiente de testes |
| `.github/workflows/ci.yml` | Pipeline CI |

---

## 1. Matriz Consolidada de Achados

| ID | Componente / Configuração | Descrição | Evidências | Severidade | Tipo | Impacto | Requisitos Violados | Recomendação de Destino |
|---|---|---|---|---|---|---|---|---|
| **SEC-001** | `docker-compose.yml` — `SESSION_SECRET` | Valor `changeme-em-producao` hardcoded no arquivo de compose de produção commit-tável. Se o arquivo for publicado (repositório público ou acidente), o segredo é exposto. | `docker-compose.yml:22`: `SESSION_SECRET=changeme-em-producao` | **Crítico** | VU | Comprometimento total da integridade das sessões SSR em produção | NFR-3 | Remover valor hardcoded; usar `${SESSION_SECRET}` referenciando variável do host ou secrets manager |
| **SEC-002** | `docker-compose.test.yml` — `JWT_SECRET` | Valor `sua_chave_jwt_super_secreta` hardcoded em ambiente de teste. Valor é fraco (frase previsível) e idêntico ao exemplo do `.env.example`, aumentando risco de reutilização acidental em produção. | `docker-compose.test.yml:43`: `JWT_SECRET=sua_chave_jwt_super_secreta` | **Alto** | VU | Tokens JWT de teste podem ser forjados; risco de vazamento por reutilização | NFR-3, NFR-8 | Usar segredo aleatório forte para testes; garantir isolamento por ambiente |
| **SEC-003** | `docker-compose.yml` — `JWT_SECRET` ausente | O `docker-compose.yml` define `SESSION_SECRET` mas não define `JWT_SECRET`. `auth.js` lança `throw new Error` se `JWT_SECRET` for ausente. A aplicação não inicia sem `JWT_SECRET`, mas isso não é explicitado no compose de produção. | `docker-compose.yml:15-23`: sem `JWT_SECRET`; `src/middlewares/auth.js:5`: `if (!secret) throw new Error(...)` | **Alto** | GI | Startup falhará de forma não-documentada em produção se a variável não for injetada externamente | NFR-3 | Documentar `JWT_SECRET` como variável obrigatória no `docker-compose.yml` (via referência `${JWT_SECRET}`) |
| **SEC-004** | `app.js` — `express-session` sem `cookie.secure` | O cookie de sessão não tem `secure: true` nem condicional `NODE_ENV === 'production'`. Em produção com HTTPS, o cookie pode trafegar em clear text se o browser decidir. | `app.js:48-53`: `session({ secret, resave: false, saveUninitialized: false })` — sem `cookie` definido | **Alto** | IP | Sessão SSR vulnerável a interceptação em trânsito em produção | NFR-1, NFR-3 | Adicionar `cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }` |
| **SEC-005** | `app.js` — `express-session` sem `cookie.httpOnly` explícito | O `cookie.httpOnly` não está configurado explicitamente. O padrão do `express-session` é `httpOnly: true`, mas a ausência de configuração explícita é uma dependência de comportamento padrão da biblioteca, fragilizando o contrato de segurança. | `app.js:48-53`: sem campo `cookie` | **Médio** | DT | Dependência implícita de default da biblioteca; mudança de versão pode alterar comportamento | NFR-1 | Declarar explicitamente `cookie: { httpOnly: true, ... }` |
| **SEC-006** | `app.js` — `express-session` sem `cookie.sameSite` | Ausência de `sameSite` no cookie de sessão. O padrão atual dos navegadores é `Lax`, mas sem configuração explícita o comportamento depende da versão do navegador e da biblioteca. | `app.js:48-53`: sem campo `cookie.sameSite` | **Médio** | DT | Proteção CSRF parcialmente dependente de comportamento de terceiros | NFR-1, NFR-3 | Configurar `sameSite: 'lax'` (ou `'strict'`) explicitamente |
| **SEC-007** | `app.js` — `express-session` sem `cookie.maxAge` | Sessão sem expiração explícita. Sessões são de navegação (session cookies), encerradas ao fechar o browser, mas não têm TTL definido do lado servidor. | `app.js:48-53`: sem `cookie.maxAge` | **Médio** | DT | Sessão potencialmente válida indefinidamente enquanto ativa; sem controle de expiração server-side | NFR-3 | Definir `cookie.maxAge` (ex.: 8 horas) conforme política da aplicação |
| **SEC-008** | `app.js` — `express-session` usando MemoryStore | `express-session` sem store explícita usa MemoryStore (default). MemoryStore vaza memória em produção com muitos usuários e perde sessões em restart. A própria biblioteca emite warning em `NODE_ENV=production`. | `app.js:48-53`: sem `store`; backlog `02-seguranca/sessao-persistente/` confirma pendência | **Alto** | DT | Perda de sessões em restart; negação de serviço por vazamento de memória em produção | NFR-3 | Substituir por `connect-pg-simple` com `DATABASE_URL` |
| **SEC-009** | `src/routes/auth.js` — Login SSR sem rate limiting | `POST /login` (SSR) não aplica rate limiting. Apenas `POST /usuarios/login` (API) tem `loginLimiter`. Ataque de brute force irrestrito via formulário web. | `src/routes/auth.js:58-73`: `router.post('/login', async (req, res) => {...})` — sem `loginLimiter`; `src/routes/usuarios.js:9-16,126`: `loginLimiter` aplicado apenas na API | **Alto** | GI | Autenticação SSR vulnerável a brute force de credenciais | FR-55 (cobre apenas API), NFR-1 |Aplicar `loginLimiter` equivalente (ou o mesmo) ao `POST /login` SSR |
| **SEC-010** | `src/routes/auth.js` — `JWT_SECRET` sem validação de startup | `JWT_SECRET` é lido como `const JWT_SECRET = process.env.JWT_SECRET` mas não há `throw` se for `undefined`. O cookie JWT gerado em login SSR usaria `undefined` como segredo, e o `jwt.sign` com `undefined` pode lançar erro apenas em runtime. | `src/routes/auth.js:8`: `const JWT_SECRET = process.env.JWT_SECRET` — sem guarda | **Alto** | VU | Se `JWT_SECRET` for `undefined` no módulo `auth.js`, o `jwt.sign` em `POST /login` lança erro em runtime (não no startup), dificultando diagnóstico e diferindo do comportamento de `auth.js` e `usuarioController.js` que lançam no módulo load | NFR-3 | Adicionar guarda `if (!JWT_SECRET) throw new Error(...)` em `src/routes/auth.js` |
| **SEC-011** | `src/middlewares/authSSR.js` — Mock de usuário via header em teste | O middleware `authSSR` aceita o header `x-mock-user` com JSON de usuário quando `NODE_ENV === 'test'`. Esse mecanismo de bypass de autenticação, embora isolado a `NODE_ENV=test`, representa risco se `NODE_ENV` não for corretamente isolado entre ambientes. | `src/middlewares/authSSR.js:5-15`: `if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user'])` | **Alto** | VH | Se NODE_ENV='test' vazar para produção por erro de configuração, qualquer requisitor pode injetar qualquer usuário sem senha | NFR-1, NFR-8 | Validação humana: confirmar se isolamento de `NODE_ENV` é garantido; considerar flag adicional para mock de testes |
| **SEC-012** | `src/services/r2Service.js` — Credenciais R2 sem validação de startup | As variáveis `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET` são usadas diretamente em `process.env.*` sem guarda. O `S3Client` é instanciado com `undefined`, falhando silenciosamente apenas no primeiro uso de runtime. | `src/services/r2Service.js:11-19`: credentials sem validação; contraste com `auth.js:5` que lança erro eagerly | **Alto** | GI | Aplicação inicia sem R2 funcional; uploads e geração de PDF falham em runtime sem diagnóstico claro de configuração faltante | FR-47, FR-51, NFR-3 (por analogia) | Adicionar validação de startup para variáveis R2, alinhando com padrão de `JWT_SECRET` e `SESSION_SECRET` |
| **SEC-013** | `src/services/pdfService.js` — `console.log` com objeto certificado completo | Log de debug expõe o objeto `certificado` completo (incluindo dados pessoais do participante como nome, email, e metadados do evento) em qualquer ambiente onde o PDF é gerado. | `src/services/pdfService.js:16`: `console.log('PDFService certificado:', certificado)` | **Alto** | VU | Vazamento de dados pessoais (PII) em logs de produção/staging; violação de privacidade e potencial LGPD | NFR-1 (OWASP A02/logging) | Remover ou restringir log a `NODE_ENV !== 'production'`; nunca logar objeto completo com PII |
| **SEC-014** | `config/database.js` — `ssl: true` sem configuração completa de certificado | Ambiente de produção habilita `ssl: true` no Sequelize, mas sem `dialectOptions.ssl.rejectUnauthorized` configurado. Dependendo da versão do `pg`, pode aceitar certificados inválidos/self-signed silenciosamente. | `config/database.js:55`: `ssl: true` | **Médio** | VH | Conexão de banco com SSL degradado em produção; possível MITM se cert não validado. Comportamento exato depende da versão do `pg` e do provedor. | NFR-1 | Validação humana: confirmar configuração SSL completa (`dialectOptions.ssl: { rejectUnauthorized: true }`) no provedor de produção |
| **SEC-015** | `config/database.js` — Ambiente de teste com mesmo `DB_USER`/`DB_PASSWORD` do desenvolvimento | As credenciais de banco de dados (`DB_USER`, `DB_PASSWORD`) são as mesmas para `development`, `test` e `production`. Sem rotação por ambiente, um vazamento da senha de teste compromete produção. | `config/database.js:20-50`: todos os ambientes usam `requiredEnv('DB_USER')` e `requiredEnv('DB_PASSWORD')` | **Médio** | VH | Sem isolamento de credenciais de banco por ambiente; credencial única exposta em mais contextos | NFR-8 | Validação humana: avaliar política de credenciais separadas por ambiente |
| **SEC-016** | `.env.example` — `SESSION_SECRET` ausente | O arquivo `.env.example` não contém a variável `SESSION_SECRET`, embora ela seja obrigatória (`app.js` lança erro se ausente). Desenvolvedores novos podem não identificar essa dependência. | `.env.example` (conteúdo completo analisado): não contém `SESSION_SECRET`; `app.js:42-46` exige a variável | **Médio** | ID | Onboarding inseguro: desenvolvedor pode tentar rodar sem `SESSION_SECRET`, causando erro não-documentado | NFR-3 | Adicionar `SESSION_SECRET=<valor-de-exemplo>` ao `.env.example` |
| **SEC-017** | `app.js` — Morgan com formato `'dev'` em todos os ambientes | O logger HTTP Morgan está configurado com formato `'dev'` incondicionalmente. Em produção, esse formato é verboso e orientado a terminal (colorizado), não estruturado para ingestão por ferramentas de log. | `app.js:35`: `app.use(logger('dev'))` — sem condicional de ambiente | **Baixo** | DT | Logs não estruturados em produção; dificuldade de correlação e monitoramento; stack traces de Morgan em formato human-readable | NFR (geral de operações) | Usar `logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')` ou logger estruturado |
| **SEC-018** | `app.js` — Swagger exposto em `/api-docs` sem autenticação | O Swagger UI está montado em `/api-docs` sem qualquer restrição de acesso, ambiente ou autenticação. Em produção, a documentação dos endpoints (incluindo endpoints admin com RBAC) é acessível publicamente. | `app.js:176`: `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))` — sem guarda | **Médio** | IP | Exposição de contrato de API em produção; facilita reconhecimento de endpoints por atacantes | NFR-1 (OWASP A01) | Condicionar exposição do Swagger a `NODE_ENV !== 'production'` ou proteger com autenticação |
| **SEC-019** | `src/routes/auth.js` — Cookie JWT sem `secure` flag | O cookie `token` é definido com `httpOnly: true` e `sameSite: 'lax'` mas sem `secure: true`. Em produção com HTTPS, o cookie pode ser enviado também em HTTP, comprometendo a autenticação SSR. | `src/routes/auth.js:65`: `res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })` — sem `secure` | **Alto** | VU | Cookie JWT interceptável em trânsito se acessado por HTTP em produção | NFR-1, NFR-3 | Adicionar `secure: process.env.NODE_ENV === 'production'` ao `res.cookie` |
| **SEC-020** | `docker-compose.test.yml` — `SESSION_SECRET` com valor fraco | Valor `sessao-teste-supersegura` é uma string fraca e previsível. Ainda que seja ambiente de teste, o valor não deve ser semelhante a palavras do dicionário. | `docker-compose.test.yml:44`: `SESSION_SECRET=sessao-teste-supersegura` | **Baixo** | DT | Segredo fraco em teste; hábito que pode se repetir em produção | NFR-8 | Usar valor gerado aleatoriamente (ex.: UUID ou base64 de 256 bits) mesmo em testes |
| **SEC-021** | `config/database.js` — Logging ativado em `development` via `console.log` | O ambiente de desenvolvimento loga todas as queries SQL via `console.log`. Isso pode incluir parâmetros de queries com dados sensíveis (emails, hashes) em logs de terminal compartilhado. | `config/database.js:27`: `logging: console.log` | **Baixo** | DT | Exposição de queries com dados sensíveis em ambiente de desenvolvimento | NFR (observabilidade segura) | Usar logger estruturado com sanitização, ou `false` em desenvolvimento se não necessário |
| **SEC-022** | `src/validators/senhaForte.js` — Política de senha forte ausente da criação de usuário (API) | A validação de senha forte via `senhaForteSchema` é aplicada apenas no fluxo de alteração de senha SSR (`perfilSSRController`). Não há evidência de que a mesma política seja aplicada na criação de usuário via API (`POST /usuarios`). | `src/validators/senhaForte.js`: schema definido; `src/controllers/perfilSSRController.js:20-23`: uso no update; sem evidência em criação via API | **Alto** | IP | Usuário pode ser criado via API com senha fraca (ex.: `123456`), violando FR-57 por inconsistência | FR-57, NFR-2 | Aplicar `senhaForteSchema` na criação e atualização de senha via API REST |
| **SEC-023** | `src/middlewares/authSSR.js` — `JWT_SECRET` lido diretamente do `process.env` sem cache validado | No módulo `authSSR.js`, o `JWT_SECRET` é lido como `process.env.JWT_SECRET` diretamente dentro da função middleware (não no nível do módulo). Se ausente, `jwt.verify` lança erro em runtime (não no startup). | `src/middlewares/authSSR.js:41`: `jwt.verify(token, process.env.JWT_SECRET)` — sem guarda prévia | **Alto** | VU | Comportamento inconsistente de fail-fast: `auth.js` lança na carga do módulo, `authSSR.js` apenas em chamada runtime | NFR-3 | Adicionar leitura e guarda de `JWT_SECRET` no nível do módulo, como em `auth.js` |

---

## 2. Problemas Sistêmicos Transversais

### 2.1 Ausência de padrão uniforme de fail-fast para variáveis críticas

O sistema tem fail-fast implementado corretamente para `SESSION_SECRET` (`app.js`) e `JWT_SECRET` (`auth.js`, `usuarioController.js`), mas:

- `src/routes/auth.js` lê `JWT_SECRET` sem guarda (SEC-010)
- `src/middlewares/authSSR.js` lê `JWT_SECRET` diretamente do `process.env` na chamada (SEC-023)
- `src/services/r2Service.js` instancia `S3Client` com credenciais `undefined` (SEC-012)

O padrão aplicado em parte do sistema não foi uniformizado. Cada módulo decide individualmente quando e como validar variáveis, resultando em comportamento inconsistente entre módulos de mesma criticidade.

### 2.2 Credenciais hardcoded em arquivos versionáveis

Dois segredos de configuração estão hardcoded em arquivos rastreados pelo Git:

- `docker-compose.yml`: `SESSION_SECRET=changeme-em-producao` (SEC-001)
- `docker-compose.test.yml`: `JWT_SECRET=sua_chave_jwt_super_secreta` (SEC-002)

Valores idênticos aparecem no `.env.example`, aumentando o risco de reutilização em produção por operadores inexperientes. O `.env.example` é, por design, destinado a ser versionado — o que é correto — mas o docker-compose de produção não deveria conter valores concretos.

### 2.3 Inconsistência entre mecanismo SSR e API na proteção de autenticação

A autenticação tem dois fluxos (JWT Bearer API + Cookie JWT SSR) com configurações divergentes:

- Rate limiting: presente na API (`POST /usuarios/login`), ausente na SSR (`POST /login`) — SEC-009
- Fail-fast de `JWT_SECRET`: presente em `auth.js` e `usuarioController.js`, ausente em `routes/auth.js` e `authSSR.js` — SEC-010, SEC-023
- Cookie JWT: sem flag `secure` — SEC-019
- Política de senha forte: aplicada no update SSR, não evidenciada na criação via API — SEC-022

Essa assimetria cria vetores de ataque onde o canal SSR é menos protegido que o canal API, contrariando o princípio de paridade de controles entre fluxos.

### 2.4 Session store não persistente em produção

O `express-session` usa MemoryStore (default). Além do vazamento de memória em produção com muitos usuários, a biblioteca emite warning explícito ao detectar `NODE_ENV=production`. Sessões são perdidas em restart da aplicação. Backlog confirma a pendência (SEC-008).

### 2.5 Logs expondo dados sensíveis em produção

`pdfService.js` loga o objeto completo do certificado (`console.log('PDFService certificado:', certificado)`) sem qualquer condicional de ambiente. Esse objeto inclui PII do participante (nome, email) e dados do evento. O Morgan usa formato `'dev'` incondicionalmente (SEC-013, SEC-017).

---

## 3. Correções Críticas Imediatas

| Prioridade | ID | Ação Requerida | Evidência |
|---|---|---|---|
| 1 | SEC-001 | Remover `SESSION_SECRET=changeme-em-producao` do `docker-compose.yml`; usar referência a variável do host | `docker-compose.yml:22` |
| 2 | SEC-019 | Adicionar `secure: process.env.NODE_ENV === 'production'` ao `res.cookie('token', ...)` em `auth.js` | `src/routes/auth.js:65` |
| 3 | SEC-013 | Remover `console.log('PDFService certificado:', certificado)` ou condicionar a `NODE_ENV !== 'production'` | `src/services/pdfService.js:16` |
| 4 | SEC-023 | Adicionar guarda de `JWT_SECRET` no nível do módulo em `authSSR.js` | `src/middlewares/authSSR.js:41` |
| 5 | SEC-010 | Adicionar guarda de `JWT_SECRET` no nível do módulo em `routes/auth.js` | `src/routes/auth.js:8` |
| 6 | SEC-009 | Aplicar rate limiting em `POST /login` (SSR) | `src/routes/auth.js:58` |
| 7 | SEC-008 | Migrar `express-session` de MemoryStore para `connect-pg-simple` | `app.js:48-53` |
| 8 | SEC-012 | Adicionar validação de startup para variáveis R2 (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) | `src/services/r2Service.js:11-19` |
| 9 | SEC-022 | Aplicar `senhaForteSchema` na criação de usuário via API | Sem evidência de uso em criação via API |

---

## 4. Backlog Arquitetural Priorizado

### Curto Prazo

- **SEC-001**: Remover credencial hardcoded em `docker-compose.yml`
- **SEC-019**: Adicionar flag `secure` no cookie JWT SSR
- **SEC-013**: Remover log de PII em `pdfService.js`
- **SEC-010**: Guarda de `JWT_SECRET` em `routes/auth.js`
- **SEC-023**: Guarda de `JWT_SECRET` em `authSSR.js`
- **SEC-009**: Rate limiting em login SSR
- **SEC-016**: Adicionar `SESSION_SECRET` ao `.env.example`
- **SEC-022**: Política de senha forte na criação via API

### Médio Prazo

- **SEC-008**: Session store persistente (`connect-pg-simple`)
- **SEC-004/005/006/007**: Configurar explicitamente `cookie` options na session (`httpOnly`, `secure`, `sameSite`, `maxAge`)
- **SEC-012**: Validação de startup para credenciais R2
- **SEC-018**: Restringir Swagger a ambientes não-produção
- **SEC-002**: Substituir segredos fracos em `docker-compose.test.yml`
- **SEC-003**: Documentar `JWT_SECRET` no `docker-compose.yml`

### Longo Prazo

- **SEC-017**: Substituir Morgan `'dev'` por logger estruturado condicional
- **SEC-021**: Revisar logging de queries SQL em desenvolvimento
- Implementar rotação automática de segredos (secrets manager)
- Avaliar substituição de `express-session` + cookies por estratégia stateless unificada com JWT

---

## 5. Atualizações Recomendadas no SRS

| ID | Seção SRS | Ambiguidade / Lacuna | Recomendação |
|---|---|---|---|
| SRS-UPD-01 | NFR-3 | NFR-3 especifica apenas `JWT_SECRET` e `SESSION_SECRET` como obrigatórios no startup. Credenciais R2 não são mencionadas, criando assimetria com o padrão de fail-fast. | Ampliar NFR-3 para incluir `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET` como variáveis obrigatórias na inicialização quando o sistema usa R2 |
| SRS-UPD-02 | FR-55 | FR-55 especifica rate limiting apenas para `POST /usuarios/login` (API). O endpoint SSR `POST /login` não é mencionado. | Ampliar FR-55 ou criar FR-55b para incluir `POST /login` (SSR) no escopo do rate limiting |
| SRS-UPD-03 | FR-57 | FR-57 define política de senha forte apenas para alteração de senha (update). Criação de usuário (API) não é coberta explicitamente. | Ampliar FR-57 ou criar FR-57b para exigir política de senha forte também na criação de usuário via API |
| SRS-UPD-04 | NFR-3 | Não há especificação sobre `cookie.secure`, `cookie.sameSite` e `cookie.maxAge` para o cookie JWT SSR nem para o cookie de sessão. | Adicionar NFR sobre configuração segura de cookies em produção |
| SRS-UPD-05 | NFR-8 | NFR-8 especifica banco isolado para testes, mas não trata de segredos de teste (JWT_SECRET, SESSION_SECRET, credenciais banco). | Explicitar que ambientes de teste devem usar segredos aleatórios e distintos dos de produção |

---

## 6. Itens para Validação Humana

| ID | Item | Motivo |
|---|---|---|
| VH-01 | **SEC-011** — Mecanismo de mock de usuário via header `x-mock-user` em `authSSR.js` | Decisão arquitetural: manter bypass condicional a `NODE_ENV=test` ou adotar abordagem alternativa (token de teste assinado, fixture de banco). Risco depende da garantia de isolamento de `NODE_ENV` |
| VH-02 | **SEC-014** — `ssl: true` em produção sem `rejectUnauthorized` explícito | Comportamento depende da versão do driver `pg` e do provedor de banco. Confirmar se o provedor (Supabase, RDS, etc.) valida certificados por padrão |
| VH-03 | **SEC-015** — Credenciais de banco de dados únicas entre ambientes | Decisão de política: usar credenciais separadas por ambiente (dev/test/prod) requer infraestrutura adicional. Avaliar custo x benefício |
| VH-04 | Expiração de sessão SSR (`cookie.maxAge`) | Não há definição no SRS para TTL de sessão. Definir política: 8h de trabalho, 24h, ou sessão de navegação (sem maxAge). Impacta UX |
| VH-05 | Política de logs em produção | Não há definição de formato ou nível de log no SRS. Decidir entre Morgan `combined`, `winston`, `pino`, e política de retenção |
| VH-06 | Exposição do Swagger em produção | Decisão de negócio: Swagger é documentação interna ou pública? Se interno, restringir por `NODE_ENV` ou autenticação básica |

---

## 7. Iniciativas de Spec (Spec Kit)

### SPEC-SEG-01: Hardening de Configuração de Segurança

**Escopo:**
- Padronizar fail-fast para todas as variáveis críticas (JWT, Session, R2)
- Unificar configuração de cookie JWT (API + SSR): `httpOnly`, `secure`, `sameSite`, `maxAge`
- Remover credenciais hardcoded de arquivos docker-compose versionados

**Motivação:** SEC-001, SEC-003, SEC-004, SEC-005, SEC-006, SEC-007, SEC-010, SEC-012, SEC-019, SEC-023

---

### SPEC-SEG-02: Autenticação Unificada (API + SSR)

**Escopo:**
- Paridade de controles: rate limiting, guarda de segredos, política de senha entre canal API e SSR
- Revisão de `authSSR.js`: guarda de `JWT_SECRET`, remoção/revisão de mock por header

**Motivação:** SEC-009, SEC-010, SEC-011, SEC-022, SEC-023

---

### SPEC-SEG-03: Session Store Persistente

**Escopo:**
- Migrar `express-session` de MemoryStore para `connect-pg-simple`
- Configurar `cookie` completo: `httpOnly`, `secure`, `sameSite`, `maxAge`
- Migração de testes compatíveis

**Motivação:** SEC-008, SEC-004, SEC-005, SEC-006, SEC-007

---

### SPEC-SEG-04: Logging Seguro

**Escopo:**
- Remover `console.log` com PII em `pdfService.js`
- Condicionar logging Morgan ao ambiente
- Definir padrão de logger estruturado (nível, formato, sanitização)

**Motivação:** SEC-013, SEC-017, SEC-021

---

## 8. Análise de Problemas Sistêmicos

### Padrão: Fail-fast incompleto e não-uniforme

O sistema demonstra consciência do padrão fail-fast (evidenciado pelo `throw new Error` para `SESSION_SECRET` em `app.js` e `JWT_SECRET` em `auth.js`), mas a aplicação é inconsistente. Módulos carregados na mesma bootstrap (`authSSR.js`, `routes/auth.js`) não seguem o mesmo padrão. Isso indica que o padrão foi adotado reativo (por auditoria ou incidente), não por design arquitetural centralizado.

**Risco:** Uma variável crítica ausente pode passar despercebida até ser invocada em produção, especialmente em fluxos menos frequentes (ex.: geração de PDF via R2).

### Padrão: Credenciais de exemplo migram para configuração real

O valor `sua_chave_jwt_super_secreta` aparece simultaneamente em:
- `.env.example` (correto — é exemplo)
- `docker-compose.test.yml` (risco — é configuração usada em CI/CD)

Essa reutilização de valores de exemplo em configurações reais é um anti-padrão de segurança. O CI/CD usa credenciais documentadas publicamente no repositório.

### Padrão: Assimetria SSR vs API na proteção

O sistema tem dois canais de autenticação (SSR + API), e sistematicamente os controles são aplicados na API mas omitidos na SSR:
- Rate limiting
- Guarda de JWT_SECRET
- Política de senha forte
- Secure cookie

Esse padrão sugere que o desenvolvimento dos controles de segurança foi feito sobre a API como referência, sem revisão sistemática do canal SSR.

### Padrão: Dependência de comportamento padrão de bibliotecas para segurança

`express-session` sem `cookie` configurado depende dos defaults da biblioteca. `pg` com `ssl: true` depende do comportamento do driver. Morgan com `'dev'` depende da interpretação do consumidor de logs. Esse padrão de dependência implícita em comportamentos de terceiros fragiliza o contrato de segurança e cria risco de regressão silenciosa em atualização de dependências.

### Risco sistêmico: Exposição de credenciais R2 em logs de debug

O `pdfService.js` loga o objeto certificado completo. Se o objeto incluir qualquer referência a credenciais R2 (via Evento ou configuração embutida), haveria vazamento direto. Mesmo sem credenciais, o log de PII é uma violação de privacidade documentável.

---

*Auditoria concluída em 2026-05-10 12:24 (BRT). Baseada exclusivamente em evidências extraídas do código-fonte e SRS. Nenhuma implementação foi proposta. Achados marcados como VH requerem decisão humana antes de ação técnica.*
