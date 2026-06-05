# T06 — Triagem Consolidada: Segurança Core (G3)

**Domínios consolidados:**
- Auditoria 17 — Associação Usuário-Evento (N:N via `usuario_eventos`)
- Auditoria 18 — Middlewares Compartilhados
- Auditoria 19 — Segurança e Configuração do Sistema

**Data de triagem:** 2026-05-10 12:35 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Branch:** main  
**Objetivo:** Consolidação e cruzamento de achados dos três domínios; detecção de problemas sistêmicos, conflitos arquiteturais e inconsistências transversais

---

## 1. Matriz Consolidada de Achados

> Achados deduplicados, agrupados e numerados com prefixo `T06-`. Referências internas às auditorias individuais mantidas na coluna "Evidências".

| ID | Domínio Origem | Descrição | Evidências | Tipo | Severidade | Impacto | Requisitos Violados | Destino Recomendado |
|---|---|---|---|---|---|---|---|---|
| **T06-001** | Auditoria 17 (A-01) + Auditoria 18 (F-01) | **Bypass duplo de escopo em certificados via API.** `certificadoService.findAll` ignora `req.query.evento_id` injetado por `scopedEvento`; para operações `GET/PUT/DELETE /certificados/:id`, `scopedEvento` usa `req.params.id` (ID do certificado) como substituto de `evento_id`, gerando falso positivo de acesso cross-evento | `src/controllers/certificadoController.js:15-22`; `src/services/certificadoService.js:9-23`; `src/middlewares/scopedEvento.js:31-40` | VU | **Crítico** | Qualquer gestor/monitor autenticado via JWT pode obter todos os certificados de todos os eventos; para operações por ID, a verificação de escopo é semanticamente incorreta — pode bloquear acesso legítimo ou permitir acesso ilegítimo por coincidência de IDs | FR-37, FR-38, NFR-1 | Backlog segurança — curto prazo |
| **T06-002** | Auditoria 17 (A-02) + Auditoria 18 (F-05) | **Privilege escalation: gestores podem deletar e atualizar eventos via API.** `DELETE /eventos/:id` e `PUT /eventos/:id` usam `rbac('monitor')` (API) vs. `rbac('admin')` (SSR). `POST /eventos` usa `rbac('monitor')` onde deveria ser `rbac('admin')`, com proteção efetiva dependendo colateralmente de `scopedEvento` | `src/routes/eventos.js:router.delete, router.put, router.post`; contraste com `src/routes/admin.js` | VU | **Crítico** | Gestor autenticado via API pode deletar e atualizar eventos dos quais é membro, operação que deveria ser exclusiva de admin; proteção de criação é frágil e não-declarativa | FR-34, FR-37, FR-38 | Backlog segurança — curto prazo |
| **T06-003** | Auditoria 19 (SEC-001) | **`SESSION_SECRET` hardcoded em `docker-compose.yml` de produção.** Valor `changeme-em-producao` comprometível publicamente se o repositório for exposto | `docker-compose.yml:22` | VU | **Crítico** | Comprometimento total da integridade das sessões SSR em produção; um atacante com o segredo pode forjar cookies de sessão | NFR-3 | Backlog segurança — curto prazo (remoção imediata) |
| **T06-004** | Auditoria 18 (F-03) + Auditoria 19 (SEC-009) | **Login SSR (`POST /login`) sem rate limiting.** Apenas o endpoint API `POST /usuarios/login` tem `loginLimiter`; o formulário web de login é vulnerável a brute force irrestrito | `src/routes/auth.js:58-73` (sem `loginLimiter`); `src/routes/usuarios.js:9-16` (com `loginLimiter`) | GI | **Alto** | Endpoint de autenticação SSR vulnerável a ataques de brute force de credenciais via formulário web | FR-55, NFR-1 | Backlog segurança — curto prazo |
| **T06-005** | Auditoria 17 (A-04) + Auditoria 18 (F-04) | **Assimetria crítica do contrato `req.usuario` entre API e SSR.** `auth` (API) retorna instância Sequelize com `getEventos()`; `authSSR` (SSR) retorna plain object sem `getEventos()`, `email`, nem `isMonitor`. Qualquer middleware que exija `getEventos()` em contexto SSR retorna HTTP 500 | `src/middlewares/auth.js` (Sequelize instance); `src/middlewares/authSSR.js:48-55` (plain object); `src/middlewares/scopedEvento.js:8-10` (verifica `getEventos()`) | VA | **Alto** | Risco latente de HTTP 500 se `scopedEvento` ou `tiposCertificadosOwnership` forem aplicados em rotas SSR; controllers SSR mitigam com triplicação da lógica de escopo; `email` e `isMonitor` indisponíveis em SSR | FR-37, NFR-6 | Backlog arquitetural — médio prazo |
| **T06-006** | Auditoria 19 (SEC-010, SEC-023) | **`JWT_SECRET` sem validação de fail-fast em `routes/auth.js` e `authSSR.js`.** Ambos leem `JWT_SECRET` sem guarda; `auth.js` e `usuarioController.js` lançam erro no load do módulo, criando comportamento de startup inconsistente | `src/routes/auth.js:8` (sem guarda); `src/middlewares/authSSR.js:41` (leitura inline em runtime) | VU | **Alto** | Se `JWT_SECRET` for `undefined`, `jwt.sign` e `jwt.verify` lançam erro em runtime (não no startup), dificultando diagnóstico e diferindo do padrão estabelecido no sistema | NFR-3 | Backlog segurança — curto prazo |
| **T06-007** | Auditoria 19 (SEC-019) | **Cookie JWT SSR sem flag `secure`.** `res.cookie('token', ...)` emitido com `httpOnly: true` e `sameSite: 'lax'` mas sem `secure: true`, permitindo transmissão por HTTP | `src/routes/auth.js:65` | VU | **Alto** | Cookie JWT interceptável em trânsito em qualquer conexão não-HTTPS em produção (OWASP A02) | NFR-1, NFR-3 | Backlog segurança — curto prazo |
| **T06-008** | Auditoria 19 (SEC-013) | **`console.log` com objeto certificado completo (PII) em `pdfService.js`.** Log de debug expõe nome, email do participante e metadados do evento em qualquer ambiente | `src/services/pdfService.js:16` | VU | **Alto** | Vazamento de dados pessoais (PII) em logs de produção/staging; violação de privacidade e potencial LGPD | NFR-1 (OWASP A02/logging) | Backlog segurança — curto prazo |
| **T06-009** | Auditoria 18 (F-02) | **Rotas de criação de usuários (`usuarios-crud.js`) sem `rbac` na cadeia de middlewares.** Enforcement realizado apenas no controller, criando risco de privilege escalation em refatorações | `src/routes/usuarios-crud.js:10-19` (sem `rbac`); `src/controllers/usuarioController.js:13-18` (check manual) | VU | **Alto** | Qualquer usuário autenticado (gestor, monitor) pode tentar criar usuários de qualquer perfil (inclusive admin); única proteção é check no controller, violando defense-in-depth | FR-34, FR-38, NFR-1, NFR-6 | Backlog segurança — curto prazo |
| **T06-010** | Auditoria 19 (SEC-022) | **Política de senha forte não aplicada na criação de usuário via API.** `senhaForteSchema` é usada apenas no update SSR (`perfilSSRController`); criação via API pode aceitar senhas fracas | `src/validators/senhaForte.js`; `src/controllers/perfilSSRController.js:20-23`; ausência na criação via `POST /usuarios` | IP | **Alto** | Usuário pode ser criado com senha fraca via API; inconsistência de política entre criação e atualização | FR-57, NFR-2 | Backlog segurança — curto prazo |
| **T06-011** | Auditoria 19 (SEC-008) | **`express-session` usando MemoryStore em produção.** Biblioteca emite warning em `NODE_ENV=production`; sessões perdidas em restart; vazamento de memória com alto volume | `app.js:48-53` (sem `store`); backlog `02-seguranca/sessao-persistente/` confirma pendência | DT | **Alto** | Perda de sessões em restart; degradação de serviço (OOM) em produção com alta carga | NFR-3 | Backlog técnico — médio prazo |
| **T06-012** | Auditoria 17 (A-03) | **Operações SSR por ID de certificado sem verificação de escopo de evento.** `certificadoSSRController`: `detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar` sem verificar `certificado.evento_id` vs. eventos do usuário | `src/controllers/certificadoSSRController.js` (funções de operação por ID) | IP | **Alto** | Gestor/monitor via SSR pode acessar, editar, cancelar e deletar certificados de eventos fora de seu escopo pela URL direta | FR-37, FR-49 | Backlog segurança — curto prazo |
| **T06-013** | Auditoria 19 (SEC-002) | **`JWT_SECRET` fraco e previsível em `docker-compose.test.yml`.** Valor `sua_chave_jwt_super_secreta` é idêntico ao do `.env.example`, documentado publicamente — risco de reutilização em produção | `docker-compose.test.yml:43` | VU | **Alto** | Tokens JWT de teste podem ser forjados por atacante com acesso ao repositório; risco elevado se CI/CD usar repositório público | NFR-3, NFR-8 | Backlog segurança — curto prazo |
| **T06-014** | Auditoria 18 (F-09) + Auditoria 17 (A-08) | **`GET /tipos-certificados` e `GET /tipos-certificados/:id` sem scoping de evento.** Gestores e monitores podem listar e visualizar tipos de certificados de todos os eventos, violando isolamento multi-tenant | `src/routes/tipos-certificados.js:144-145`; `src/controllers/tiposCertificadosSSRController.js:index` | GI | **Médio** | Violação do princípio de isolamento multi-evento; dados de configuração de certificados de terceiros expostos a qualquer autenticado | FR-37 | Backlog segurança — curto prazo |
| **T06-015** | Auditoria 19 (SEC-004/005/006/007) | **Cookie de sessão sem configuração explícita de `secure`, `httpOnly`, `sameSite` e `maxAge`.** Dependência de defaults da biblioteca `express-session`, frágil a atualizações de versão | `app.js:48-53` | DT | **Médio** | Proteção baseada em comportamento default de terceiro; mudança de versão pode alterar contrato de segurança silenciosamente | NFR-1, NFR-3 | Backlog técnico — médio prazo |
| **T06-016** | Auditoria 17 (A-05) | **Ausência de unique constraint de banco em `(usuario_id, evento_id)` na tabela `usuario_eventos`.** Controle de duplicidade existe apenas na camada de aplicação | `migrations/20260313190000-create-usuario_eventos.js`; `migrations/20260324083059-create-performance-indexes.js` (sem índice único) | GI | **Alto** | Inserções diretas, scripts de manutenção ou bugs de concorrência podem gerar vínculos duplicados sem erro de banco | FR-32, NFR-4 | Backlog técnico — médio prazo |
| **T06-017** | Auditoria 19 (SEC-019) + Auditoria 18 (F-10) | **Cookie JWT e de sessão sem `secure: true` explícito.** Ambos os cookies podem ser transmitidos por HTTP se o proxy reverso não enforçar HTTPS | `src/routes/auth.js:65`; `app.js:48-53` | VH | **Médio** | Interceptação de cookies em trânsito se HTTPS não for enforçado na infra; comportamento depende da configuração do proxy reverso | NFR-1 | Validação humana / backlog infra |
| **T06-018** | Auditoria 19 (SEC-011) + Auditoria 18 (F-11) | **Backdoor de autenticação via header `x-mock-user` em `authSSR` para `NODE_ENV=test`.** JSON parse sem validação de schema; sessão persiste `mockUser` | `src/middlewares/authSSR.js:5-14` | AM | **Alto** | Se `NODE_ENV=test` vazar para produção, qualquer requestor pode injetar identidade arbitrária sem autenticação; injection de objeto JSON sem schema | NFR-1, NFR-8 | Validação humana |
| **T06-019** | Auditoria 19 (SEC-018) | **Swagger exposto em `/api-docs` sem autenticação em qualquer ambiente.** Documentação completa dos endpoints (incluindo admin com RBAC) acessível publicamente em produção | `app.js:176` | IP | **Médio** | Facilita reconhecimento de endpoints por atacantes; expõe contrato da API (OWASP A01) | NFR-1 | Backlog — médio prazo |
| **T06-020** | Auditoria 17 (A-09) | **Soft delete de usuário não propaga para `usuario_eventos`.** Vínculos permanecem `deleted_at = NULL` após exclusão lógica do usuário, contrariamente ao comportamento de soft delete de evento | `src/controllers/usuarioSSRController.js:deletar` (sem propagação); `eventoService.delete` (com propagação) | IP | **Médio** | Integridade semântica comprometida; vínculos órfãos ativos para usuário excluído; assimetria de cascata não documentada no SRS | FR-32, NFR-4 | Backlog — médio prazo |
| **T06-021** | Auditoria 17 (A-06) | **`tiposCertificadosOwnership` bloqueia restauração de tipos por gestores.** Branch `if (req.method === 'POST')` captura `POST /:id/restore`; `evento_id` undefined no body resulta em 403 sistemático | `src/middlewares/tiposCertificadosOwnership.js:41-47` | BR | **Médio** | Gestores legítimos não conseguem restaurar seus próprios tipos de certificados via API | FR-35, FR-46 | Backlog — curto prazo |
| **T06-022** | Auditoria 17 (A-07) | **`certificadoSSRController.novo` exibe todos os eventos no dropdown sem filtro de escopo.** Contraste com `participanteSSRController` que aplica filtro de escopo | `src/controllers/certificadoSSRController.js:novo` (sem filtro) | IP | **Médio** | Gestor visualiza eventos de terceiros no formulário; pode criar certificado em evento fora de seu escopo se não houver validação adicional | FR-37, FR-49 | Backlog — curto prazo |
| **T06-023** | Auditoria 19 (SEC-012) | **Credenciais R2 sem validação de startup em `r2Service.js`.** `S3Client` instanciado com `undefined`; falha silenciosa apenas em runtime no primeiro uso | `src/services/r2Service.js:11-19` | GI | **Alto** | Aplicação inicia sem R2 funcional; uploads e geração de PDF falham em runtime sem diagnóstico claro; padrão diverge do fail-fast estabelecido para JWT/Session | NFR-3 | Backlog técnico — médio prazo |
| **T06-024** | Auditoria 19 (SEC-016) | **`SESSION_SECRET` ausente do `.env.example`.** Dependência obrigatória não documentada para onboarding de desenvolvedores | `.env.example` (ausente); `app.js:42-46` (obrigatório) | ID | **Médio** | Desenvolvedor novo pode não identificar a dependência; onboarding inseguro | NFR-3 | Backlog documental — curto prazo |
| **T06-025** | Auditoria 18 (F-08) | **Divergência entre SRS e implementação na rota de login SSR.** FR-30 especifica `POST /auth/login`; implementação registra `POST /login` (via `app.use('/', authRouter)`) | `src/routes/auth.js:40`; `app.js:176` | ID | **Médio** | Confusão em integração, automação de testes e documentação de API | FR-30 | Backlog documental — médio prazo |
| **T06-026** | Auditoria 17 (A-10) | **`eventoService` com dois métodos distintos (`destroy` vs `delete`) com comportamento diferente para `usuario_eventos`.** `destroy` não propaga soft delete; `delete` propaga — código duplicado com semântica divergente | `src/services/eventoService.js` | DT | **Médio** | Invocação direta de `destroy` por mantenedor desavisado não propaga para `usuario_eventos`; risco de órf\u00e3os em manutenções futuras | NFR-6 | Backlog técnico — longo prazo |
| **T06-027** | Auditoria 18 (F-06) | **`authSSR` sem validação de `JWT_SECRET` no carregamento do módulo.** Dependência implícita de `auth.js` ser carregado primeiro | `src/middlewares/authSSR.js` (sem check de env no topo) | DT | **Médio** | Dependência implícita de ordem de carregamento; falha silenciosa em runtime se `auth.js` não for carregado antes | NFR-3 | Backlog técnico — médio prazo |
| **T06-028** | Auditoria 18 (F-12) | **`isMonitor` ausente no objeto `req.usuario` de `authSSR`.** `auth` retorna instância Sequelize completa; `authSSR` omite `isMonitor` | `src/middlewares/authSSR.js:48-55` | DT | **Baixo** | Qualquer view, helper ou middleware que verifique `req.usuario.isMonitor` recebe `undefined` em contexto SSR | — | Backlog técnico — longo prazo |
| **T06-029** | Auditoria 18 (F-07) | **`scopedEvento` sem try/catch ao redor de `req.usuario.getEventos()`.** Falha de banco propagada sem tratamento no handler genérico do Express | `src/middlewares/scopedEvento.js:8` | DT | **Médio** | Falha de banco retorna resposta HTML de erro em rota API JSON; degradação de contrato de resposta | NFR-1 | Backlog técnico — curto prazo |
| **T06-030** | Auditoria 18 (F-14) | **Logout API e SSR não sincronizados.** `POST /logout` SSR limpa cookie JWT mas não invalida o token; `POST /usuarios/logout` API retorna JSON sem limpar cookie SSR | `src/routes/auth.js:69-72`; `src/routes/usuarios.js:130` | VH | **Médio** | Token JWT permanece válido por até 1h após logout SSR; logout API não afeta sessão SSR | FR-30 (implícito) | Validação humana |
| **T06-031** | Auditoria 19 (SEC-014) | **`ssl: true` em `database.js` sem `rejectUnauthorized` explícito.** Comportamento depende da versão do `pg` e do provedor | `config/database.js:55` | VH | **Médio** | Conexão de banco com SSL possivelmente degradado em produção; MITM se cert não validado | NFR-1 | Validação humana |
| **T06-032** | Auditoria 19 (SEC-003) | **`JWT_SECRET` ausente do `docker-compose.yml` de produção.** Aplicação falha ao iniciar se variável não for injetada externamente, sem documentação desse requisito no arquivo | `docker-compose.yml:15-23` | GI | **Alto** | Startup falhará de forma não-documentada em produção se `JWT_SECRET` não for provido externamente | NFR-3 | Backlog técnico — curto prazo |
| **T06-033** | Auditoria 18 (F-13) | **Check redundante de `perfil === 'monitor'` em `tiposCertificadosOwnership`.** Monitor já bloqueado por `rbac('gestor')` antes de chegar ao middleware | `src/middlewares/tiposCertificadosOwnership.js:21-26`; `src/routes/tipos-certificados.js:147-167` | DT | **Baixo** | Lógica duplicada; cria comportamento surpreendente em refatorações de rota | NFR-6 | Backlog técnico — longo prazo |
| **T06-034** | Auditoria 19 (SEC-017) | **Morgan com formato `'dev'` em todos os ambientes.** Formato colorizado e verboso não adequado para ingestão em produção | `app.js:35` | DT | **Baixo** | Logs não estruturados em produção; dificuldade de correlação e monitoramento | — | Backlog técnico — longo prazo |

---

## 2. Correções Críticas Imediatas

> Somente problemas de autenticação, autorização, scoping multi-tenant, bypass de middleware e JWT/session.

### C-01 — `SESSION_SECRET` hardcoded em `docker-compose.yml` (T06-003)

**Achado:** SEC-001  
**Evidência:** `docker-compose.yml:22` — `SESSION_SECRET=changeme-em-producao`  
**Risco:** Comprometimento total das sessões SSR em produção. Qualquer com acesso ao repositório pode forjar cookies de sessão.  
**Ação:** Remover valor hardcoded; substituir por referência `${SESSION_SECRET}` lida do ambiente do host ou de um secrets manager.

---

### C-02 — Bypass de escopo de evento em `GET /certificados` via API (T06-001 parcial)

**Achados:** A-01 (Auditoria 17), F-01 (Auditoria 18)  
**Evidência:** `src/controllers/certificadoController.js:15-22`; `src/services/certificadoService.js:9-23`  
**Risco:** Gestor ou monitor com JWT válido obtém todos os certificados de todos os eventos sem filtro de escopo.  
**Ação:** `certificadoController.findAll` deve propagar `req.query.evento_id` para `certificadoService.findAll`.

---

### C-03 — Confusão de IDs em `scopedEvento` para operações de recurso único (T06-001 parcial)

**Achado:** F-01 (Auditoria 18)  
**Evidência:** `src/middlewares/scopedEvento.js:31-40` — `req.params.id` tratado como `eventoId`  
**Risco:** Para `GET/PUT/DELETE /certificados/:id`, `/eventos/:id`, etc., o middleware compara o ID do recurso com IDs de eventos do usuário. Acesso cross-evento é possível por coincidência de IDs; usuários legítimos podem ser bloqueados por não-coincidência.  
**Ação:** A verificação de ownership para operações de recurso único deve ser movida para o service/controller, onde o recurso é carregado e seu `evento_id` pode ser verificado diretamente.

---

### C-04 — Privilege escalation: gestores deletam e atualizam eventos via API (T06-002)

**Achados:** A-02 (Auditoria 17), F-05 (Auditoria 18)  
**Evidência:** `src/routes/eventos.js` — `router.delete('/:id', auth, rbac('monitor'), scopedEvento, ...)`  
**Risco:** Gestor autenticado pode deletar e atualizar eventos via API REST — operação reservada a admin no SRS e na interface SSR.  
**Ação:** Substituir `rbac('monitor')` por `rbac('admin')` nas rotas `DELETE /eventos/:id`, `PUT /eventos/:id` e `POST /eventos` na API.

---

### C-05 — Login SSR sem rate limiting (T06-004)

**Achados:** F-03 (Auditoria 18), SEC-009 (Auditoria 19)  
**Evidência:** `src/routes/auth.js:58-73` — sem `loginLimiter`  
**Risco:** Endpoint SSR de autenticação vulnerável a brute force de credenciais irrestrito.  
**Ação:** Aplicar o mesmo `loginLimiter` (ou equivalente) ao `POST /login` em `routes/auth.js`.

---

### C-06 — `JWT_SECRET` sem guarda de startup em `authSSR` e `routes/auth.js` (T06-006)

**Achados:** SEC-010, SEC-023 (Auditoria 19)  
**Evidência:** `src/routes/auth.js:8`; `src/middlewares/authSSR.js:41`  
**Risco:** Se `JWT_SECRET` for `undefined`, o módulo inicializa sem erro; falha ocorre apenas em runtime ao primeiro uso — divergindo do padrão de fail-fast estabelecido em `auth.js`.  
**Ação:** Adicionar guarda `if (!JWT_SECRET) throw new Error(...)` no nível do módulo em ambos os arquivos, alinhando com `auth.js`.

---

### C-07 — Cookie JWT SSR sem flag `secure` (T06-007)

**Achado:** SEC-019 (Auditoria 19)  
**Evidência:** `src/routes/auth.js:65`  
**Risco:** Cookie JWT transmitido por HTTP em produção se o proxy não enforçar HTTPS (OWASP A02).  
**Ação:** Adicionar `secure: process.env.NODE_ENV === 'production'` ao `res.cookie('token', ...)`.

---

### C-08 — Ausência de `rbac` na cadeia de rotas de `usuarios-crud.js` (T06-009)

**Achado:** F-02 (Auditoria 18)  
**Evidência:** `src/routes/usuarios-crud.js:10-19`  
**Risco:** Qualquer usuário autenticado pode tentar criar usuário admin; única proteção é check no controller — defense-in-depth ausente.  
**Ação:** Adicionar `rbac('admin')` à cadeia de middlewares em `usuarios-crud.js` antes de `validate`.

---

### C-09 — Log de PII em `pdfService.js` (T06-008)

**Achado:** SEC-013 (Auditoria 19)  
**Evidência:** `src/services/pdfService.js:16`  
**Risco:** Dados pessoais de participantes (nome, email) e metadados de eventos expostos em logs de produção; potencial violação LGPD.  
**Ação:** Remover `console.log('PDFService certificado:', certificado)` ou condicionar a `NODE_ENV !== 'production'`.

---

### C-10 — Bypass de scoping SSR por ID em `certificadoSSRController` (T06-012)

**Achado:** A-03 (Auditoria 17)  
**Evidência:** `src/controllers/certificadoSSRController.js` — funções `detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar` sem verificação de `evento_id`  
**Risco:** Gestor/monitor via SSR pode acessar e manipular certificados de eventos fora de seu escopo pela URL direta.  
**Ação:** Após carregar o certificado por ID, verificar se `certificado.evento_id` está no conjunto de `eventoIds` do usuário autenticado.

---

### C-11 — `JWT_SECRET` fraco/previsível em `docker-compose.test.yml` (T06-013)

**Achado:** SEC-002 (Auditoria 19)  
**Evidência:** `docker-compose.test.yml:43` — `JWT_SECRET=sua_chave_jwt_super_secreta` (idêntico ao `.env.example`)  
**Risco:** Tokens JWT de testes podem ser forjados; risco de reutilização do segredo em produção por erro operacional.  
**Ação:** Substituir por valor aleatório forte (ex.: UUID v4 ou base64 de 256 bits).

---

### C-12 — Política de senha forte não aplicada na criação via API (T06-010)

**Achado:** SEC-022 (Auditoria 19)  
**Evidência:** `src/validators/senhaForte.js`; ausência no fluxo de criação `POST /usuarios`  
**Risco:** Usuários criados via API com senhas fracas; inconsistência entre criação e atualização.  
**Ação:** Aplicar `senhaForteSchema` no validator de criação de usuário via API.

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo

| # | Item | Achados Relacionados | Tipo |
|---|---|---|---|
| BP-01 | Remover `SESSION_SECRET` hardcoded de `docker-compose.yml`; usar referência a variável do host | T06-003 (SEC-001) | VU |
| BP-02 | Corrigir `certificadoController.findAll` para propagar `req.query.evento_id` para o service | T06-001 (A-01) | VU |
| BP-03 | Restringir `DELETE /eventos/:id`, `PUT /eventos/:id` e `POST /eventos` na API a `rbac('admin')` | T06-002 (A-02, F-05) | VU |
| BP-04 | Aplicar rate limiting em `POST /login` (SSR) com o mesmo `loginLimiter` da API | T06-004 (F-03, SEC-009) | GI |
| BP-05 | Adicionar guarda de `JWT_SECRET` no nível do módulo em `authSSR.js` e `routes/auth.js` | T06-006 (SEC-010, SEC-023) | VU |
| BP-06 | Adicionar `secure: process.env.NODE_ENV === 'production'` ao cookie JWT SSR | T06-007 (SEC-019) | VU |
| BP-07 | Adicionar `rbac('admin')` às rotas de `usuarios-crud.js` antes de `validate` | T06-009 (F-02) | VU |
| BP-08 | Remover `console.log` de PII em `pdfService.js` | T06-008 (SEC-013) | VU |
| BP-09 | Adicionar verificação de escopo (`evento_id`) nas operações SSR por ID no `certificadoSSRController` | T06-012 (A-03) | IP |
| BP-10 | Substituir `JWT_SECRET` fraco em `docker-compose.test.yml` por valor aleatório forte | T06-013 (SEC-002) | VU |
| BP-11 | Aplicar `senhaForteSchema` na criação de usuário via API | T06-010 (SEC-022) | IP |
| BP-12 | Corrigir `tiposCertificadosOwnership` para tratar `POST /:id/restore` por ID e não como criação | T06-021 (A-06) | BR |
| BP-13 | Adicionar `scopedEvento` (ou filtro equivalente por evento) nas rotas `GET /tipos-certificados` e `GET /tipos-certificados/:id` | T06-014 (F-09, A-08) | GI |
| BP-14 | Adicionar try/catch em `scopedEvento` ao redor de `req.usuario.getEventos()` | T06-029 (F-07) | DT |
| BP-15 | Adicionar `SESSION_SECRET` ao `.env.example` | T06-024 (SEC-016) | ID |
| BP-16 | Documentar `JWT_SECRET` como variável obrigatória no `docker-compose.yml` (via `${JWT_SECRET}`) | T06-032 (SEC-003) | GI |
| BP-17 | Filtrar eventos por escopo do usuário em `certificadoSSRController.novo` | T06-022 (A-07) | IP |
| BP-18 | Validar credenciais R2 com fail-fast no módulo `r2Service.js` | T06-023 (SEC-012) | GI |

### Médio Prazo

| # | Item | Achados Relacionados | Tipo |
|---|---|---|---|
| BM-01 | Unificar contrato de `req.usuario` entre `auth` (API) e `authSSR` (SSR) — expor interface consistente com `getEventos()` ou helper centralizado | T06-005 (A-04, F-04) | VA |
| BM-02 | Migrar `express-session` de MemoryStore para `connect-pg-simple` | T06-011 (SEC-008) | DT |
| BM-03 | Configurar explicitamente `cookie` options na session (`httpOnly`, `secure`, `sameSite`, `maxAge`) | T06-015 (SEC-004/005/006/007) | DT |
| BM-04 | Adicionar unique constraint de banco em `(usuario_id, evento_id)` na tabela `usuario_eventos` | T06-016 (A-05) | GI |
| BM-05 | Propagar soft delete de `usuario_eventos` ao fazer soft delete de usuário | T06-020 (A-09) | IP |
| BM-06 | Corrigir divergência de rota SSR login: alinhar SRS (`POST /auth/login`) com implementação (`POST /login`) ou migrar rota | T06-025 (F-08) | ID |
| BM-07 | Restringir Swagger a `NODE_ENV !== 'production'` ou proteger com autenticação | T06-019 (SEC-018) | IP |
| BM-08 | Centralizar lógica de resolução de escopo de evento em serviço único (`escopoService.getEventoIds`) | T06-005 (A-04) | DT |
| BM-09 | Corrigir `scopedEvento`: separar responsabilidades para listagem (filtro OK), criação (body OK) e recurso único (delegar ao service) | T06-001, T06-003 parcial (F-01) | VA |
| BM-10 | Adicionar `isMonitor` ao objeto plain de `authSSR` e alinhar campos disponíveis | T06-028 (F-12) | DT |
| BM-11 | Validar comportamento de `ssl: true` sem `rejectUnauthorized` no database.js com o provedor de produção | T06-031 (SEC-014) | VH |
| BM-12 | Substituir `JWT_SECRET` fraco em `docker-compose.test.yml` e `SESSION_SECRET` em `docker-compose.test.yml` por valores randomizados (geração automática no CI) | T06-013, T06-033 | VU/DT |

### Longo Prazo

| # | Item | Achados Relacionados | Tipo |
|---|---|---|---|
| BL-01 | Refatorar `eventoService`: remover `destroy` ou unificar com `delete` para garantir propagação de soft delete | T06-026 (A-10) | DT |
| BL-02 | Remover check redundante de `perfil === 'monitor'` em `tiposCertificadosOwnership` | T06-033 (F-13) | DT |
| BL-03 | Substituir Morgan `'dev'` por logger condicional (combined em produção) ou logger estruturado | T06-034 (SEC-017) | DT |
| BL-04 | Definir e implementar política de logout unificado (JWT + sessão + cookie) | T06-030 (F-14) | VH |
| BL-05 | Avaliar substituição de `express-session` + cookies por estratégia stateless unificada com JWT + blacklist | T06-011, T06-030 | DT |
| BL-06 | Implementar pipeline declarativo de RBAC (registro de permissões por rota) em substituição ao padrão atual de `rbac('perfil')` disperso | T06-002, T06-009 | VA |
| BL-07 | Reestruturar URL de gerenciamento de usuários para padrão RESTful (`/:papel/:id/usuarios` → `/usuarios`) | Auditoria 17 (A-11) | DT |
| BL-08 | Revisar logging de queries SQL em desenvolvimento para evitar exposição de dados sensíveis em terminais compartilhados | Auditoria 19 (SEC-021) | DT |

---

## 4. Atualizações Recomendadas no SRS

> Somente quando há ambiguidade, inconsistência SSR vs. API, scoping não definido ou regra de segurança implícita.

| ID | Seção SRS | Lacuna / Ambiguidade | Recomendação |
|---|---|---|---|
| SRS-T06-01 | FR-34, FR-37 | FR-34 define admin com acesso irrestrito, mas não especifica que criação, atualização e exclusão de eventos são operações exclusivamente de admin via API REST (API permite gestor/monitor) | Adicionar sub-requisito em FR-34 ou FR-5: "Criação, atualização e exclusão de eventos são operações exclusivas do perfil admin, tanto via SSR quanto via API REST" |
| SRS-T06-02 | FR-55 | FR-55 especifica rate limiting apenas para `POST /usuarios/login` (API); endpoint SSR `POST /login` não é coberto | Ampliar FR-55 para incluir `POST /login` (SSR): "Ambos os endpoints de login (API e SSR) devem ter rate limiting de no máximo 10 tentativas por 15 minutos por IP" |
| SRS-T06-03 | FR-57 | FR-57 define política de senha forte apenas para alteração (update); criação de usuário via API não é coberta | Ampliar FR-57: "A política de senha forte se aplica tanto à criação quanto à alteração de senha, em ambos os canais (API e SSR)" |
| SRS-T06-04 | FR-37 | FR-37 descreve comportamento de `scopedEvento` para listagens, mas não define comportamento para operações de recurso único (GET/PUT/DELETE /:id) — lacuna que gera a implementação incorreta de `req.params.id` como fallback | Adicionar cláusula em FR-37: "Para operações de recurso único (por ID), a verificação de isolamento de evento deve ser realizada pela camada de service/controller após carregar o recurso, verificando se `evento_id` do recurso pertence ao conjunto de eventos do usuário" |
| SRS-T06-05 | FR-38, NFR-6 | FR-38 especifica proteção de rotas admin por `auth + rbac`, mas não cita explicitamente as rotas de CRUD de usuários (`usuarios-crud.js`) como sujeitas a `rbac('admin')` | Adicionar em FR-38: "Rotas de criação, atualização e gestão de usuários (incluindo vinculação a eventos) devem ser protegidas por `rbac('admin')`" |
| SRS-T06-06 | FR-32, FR-33 | SRS não especifica comportamento de vínculos `usuario_eventos` ao excluir logicamente um usuário; exclusão de evento propaga (implementado), exclusão de usuário não propaga (implementado de forma assimétrica) | Adicionar em FR-33: "Ao excluir logicamente um usuário, seus vínculos em `usuario_eventos` devem ser correspondentemente soft-deletados. Ao restaurar, devem ser restaurados" |
| SRS-T06-07 | NFR-3 | NFR-3 especifica `JWT_SECRET` e `SESSION_SECRET` como obrigatórios no startup, mas não menciona credenciais R2; cria assimetria com o padrão de fail-fast já estabelecido | Ampliar NFR-3: "As variáveis `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET` são obrigatórias quando o sistema opera com armazenamento em nuvem e devem ser validadas no startup" |
| SRS-T06-08 | NFR-3 | SRS não define configuração obrigatória de cookies (JWT e sessão): `secure`, `httpOnly`, `sameSite`, `maxAge` | Adicionar NFR sobre configuração segura de cookies: "Em produção, cookies de autenticação e sessão devem ter `secure: true`, `httpOnly: true`, `sameSite: 'lax'` e `maxAge` definido conforme política da aplicação" |
| SRS-T06-09 | NFR-8 | NFR-8 isola banco de dados em testes, mas não trata de isolamento de segredos (JWT_SECRET, SESSION_SECRET) entre ambientes | Adicionar em NFR-8: "Ambientes de teste e CI/CD devem usar segredos (JWT_SECRET, SESSION_SECRET) aleatórios e distintos dos de produção; valores de exemplo do `.env.example` não devem ser usados em configurações de CI/CD" |
| SRS-T06-10 | NFR-1 (implícito) | SRS não especifica contrato do objeto `req.usuario` — quais campos são garantidos, se é instância Sequelize ou plain object, e quais métodos ORM estão disponíveis | Adicionar seção de contrato interno: "O objeto `req.usuario` (API e SSR) deve expor minimamente: `id`, `nome`, `email`, `perfil`, `isAdmin`, `isGestor`, `isMonitor`, e um método ou helper para resolução de eventos vinculados" |
| SRS-T06-11 | FR-46, FR-37 | FR-46 permite monitores visualizarem tipos de certificados sem especificar se a visualização é restrita ao escopo do evento do usuário ou global | Clarificar FR-46: "Gestores e monitores podem visualizar somente os tipos de certificados dos eventos aos quais estão vinculados" |
| SRS-T06-12 | FR-30 | FR-30 especifica `POST /auth/login` para SSR; implementação usa `POST /login` | Corrigir FR-30: `"(b) SSR: POST /login"` — ou migrar a rota da implementação para `/auth/login` |

---

## 5. Itens para Validação Humana

| ID | Domínio Origem | Descrição | Decisão Necessária |
|---|---|---|---|
| VH-T06-01 | Auditoria 18 (F-11) + Auditoria 19 (SEC-011) | **Backdoor `x-mock-user` em `authSSR`.** Mecanismo funcional para testes, mas risco se `NODE_ENV=test` vazar para produção | Existe isolamento garantido de `NODE_ENV` em produção e staging? O mock via sessão (`req.session.mockUser`) é intencional? Considerar alternativa (token de teste assinado com segredo de teste) |
| VH-T06-02 | Auditoria 18 (F-10) + Auditoria 19 (SEC-004, SEC-019) | **Cookies sem `secure: true` explícito.** Em produção com HTTPS no proxy, pode ser aceitável — comportamento depende da infra | O deployment em produção usa HTTPS obrigatório no proxy reverso (nginx, Cloudflare, etc.)? Se sim, há `trust proxy` ativado no Express? `secure: true` é necessário no código ou é garantido pelo proxy? |
| VH-T06-03 | Auditoria 18 (F-14) | **Logout SSR não invalida token JWT.** Token permanece válido por até 1h após logout; logout API não limpa cookie SSR | O produto requer logout global imediato (invalidação de token em ambos os fluxos)? Aceita-se TTL residual de até 1h? Se revogação necessária: blacklist de tokens ou redução de `expiresIn`? |
| VH-T06-04 | Auditoria 18 (VH-04) | **`isMonitor` ausente no contexto SSR de `authSSR`.** Pode ser intencional (monitor detectado por exclusão) ou inadvertido | Views e helpers Handlebars dependem de `isMonitor` explícito? Se sim, adicionar a `authSSR`; se detectado por exclusão, documentar convenção |
| VH-T06-05 | Auditoria 17 (VH-01) | **Soft delete de usuário não propaga para `usuario_eventos`.** Comportamento atual não documentado no SRS | Ao excluir logicamente um usuário, seus vínculos devem ser soft-deletados? E ao restaurar, devem ser restaurados automaticamente? |
| VH-T06-06 | Auditoria 17 (VH-02) | **Escopo de visualização de tipos de certificados por gestor/monitor.** FR-46 ambíguo: global read-only vs. restrito ao escopo do evento | A visualização de tipos pelo gestor deve ser restrita ao escopo de seus eventos ou pode ser global (read-only para tipos de terceiros)? |
| VH-T06-07 | Auditoria 17 (VH-03) | **Admins podem ter vínculos em `usuario_eventos`?** FR-32 vincula gestores/monitores; admins não possuem restrição — mas a tabela pode registrá-los para rastreabilidade | Admins devem ou podem ter vínculos em `usuario_eventos`? Isso afeta queries de relatório ou dashboard? |
| VH-T06-08 | Auditoria 19 (SEC-014) + Auditoria 19 (VH-02) | **SSL de banco sem `rejectUnauthorized`.** Comportamento depende da versão do `pg` e do provedor | O provedor de banco (Supabase, RDS, etc.) valida certificados por padrão? Confirmar configuração `dialectOptions.ssl: { rejectUnauthorized: true }` |
| VH-T06-09 | Auditoria 19 (SEC-015) | **Credenciais de banco únicas entre ambientes.** Todos os ambientes usam as mesmas variáveis `DB_USER`/`DB_PASSWORD` | Avaliar política de credenciais separadas por ambiente (dev/test/prod). Custo x benefício de rotação e isolamento |
| VH-T06-10 | Auditoria 19 (VH-04) | **Expiração de sessão SSR (`cookie.maxAge`).** Não há TTL definido — sessões de navegação (encerradas ao fechar o browser) | Qual a política de TTL de sessão: 8h de trabalho, 24h, ou sessão de navegação? Definir e documentar |
| VH-T06-11 | Auditoria 19 (VH-05) | **Política de logs em produção.** Morgan `'dev'` + console.log sem estrutura | Formato e nível de log esperado em produção (Morgan `combined`, `winston`, `pino`)? Política de retenção e PII em logs? |
| VH-T06-12 | Auditoria 19 (VH-06) | **Exposição do Swagger em produção.** `/api-docs` acessível sem restrição | Swagger é documentação interna ou pública? Se interno: restringir por `NODE_ENV` ou autenticação básica? |

---

## 6. Iniciativas de Spec (Spec Kit)

### SPEC-T06-01 — Contrato Unificado de `req.usuario`

**Objetivo:** Definir e enforçar uma interface única para o objeto `req.usuario` em ambos os fluxos (API e SSR), eliminando a assimetria atual.

**Motivação:** T06-005 (A-04, F-04) revela que `auth` retorna instância Sequelize (com `getEventos()`, `email`, todos os campos) enquanto `authSSR` retorna plain object sem `getEventos()`, `email` e `isMonitor`. Qualquer middleware compartilhado entre API e SSR falha ou retorna 500 nesse cenário.

**Achados relacionados:** T06-005, T06-028 (F-12), T06-014 (F-09), BM-01, BM-08

**FRs/NFRs relacionados:** FR-37, FR-38, NFR-6

**Pré-requisitos:** Decisão de VH-T06-04 (campo `isMonitor` intencional ou não?); levantamento de todos os consumers de `req.usuario` em SSR e API

**Proposta de escopo:**
- Definir interface mínima garantida: `{ id, nome, email, perfil, isAdmin, isGestor, isMonitor }`
- Expor adaptador ou helper `getEventoIds(req.usuario)` que funcione em ambos os contextos, encapsulando a query diferente entre instância Sequelize e plain object
- Documentar explicitamente o contrato no SRS (SRS-T06-10)

---

### SPEC-T06-02 — Redesign de `scopedEvento` para Operações de Recurso Único

**Objetivo:** Corrigir a lógica de `scopedEvento` para separar responsabilidades entre listagem, criação e operações por ID, eliminando a confusão semântica de `req.params.id` como `eventoId`.

**Motivação:** T06-001 (F-01) demonstra que para `GET/PUT/DELETE /:id`, o middleware usa o ID do recurso como proxy de `eventoId`, gerando falsos positivos e negativos no controle de acesso. O problema afeta certificados, eventos, e qualquer domínio cujo `:id` paramétrico não seja um `evento_id`.

**Achados relacionados:** T06-001 (A-01, F-01), T06-002 (F-05), BM-09

**FRs/NFRs relacionados:** FR-37, NFR-1

**Pré-requisitos:** SRS-T06-04 (comportamento de `scopedEvento` para operações por ID definido); T06-001 (correção de bypass de listagem de certificados)

**Proposta de escopo:**
1. Para listagens (`GET /`): injeção de filtro `evento_id` em `req.query` — comportamento atual correto, manter
2. Para criação com `req.body.evento_id`: validação de ownership by evento — comportamento atual correto para este caso
3. Para operações por `:id`: delegar verificação ao service/controller — não é responsabilidade do middleware genérico verificar se um recurso de outro domínio pertence ao evento

---

### SPEC-T06-03 — Hardening de Segurança de Configuração

**Objetivo:** Padronizar fail-fast para todas as variáveis críticas, uniformizar configuração de cookies, e remover credenciais hardcoded de arquivos versionáveis.

**Motivação:** T06-003 (SEC-001), T06-006 (SEC-010/023), T06-007 (SEC-019), T06-015 (SEC-004-007), T06-023 (SEC-012) revelam um padrão sistêmico de configuração de segurança incompleta ou inconsistente.

**Achados relacionados:** T06-003, T06-006, T06-007, T06-013, T06-015, T06-023, T06-032

**FRs/NFRs relacionados:** NFR-1, NFR-3, NFR-8

**Pré-requisitos:** Decisão de VH-T06-02 (cookies `secure` e `trust proxy`); decisão de VH-T06-10 (TTL de sessão)

**Proposta de escopo:**
- Adicionar guarda de `JWT_SECRET` no nível do módulo em `authSSR.js` e `routes/auth.js`
- Adicionar validação de startup para credenciais R2
- Remover `SESSION_SECRET=changeme-em-producao` do `docker-compose.yml`
- Configurar explicitamente `cookie: { httpOnly, secure, sameSite, maxAge }` na session
- Adicionar `secure: process.env.NODE_ENV === 'production'` ao cookie JWT SSR

---

### SPEC-T06-04 — Autenticação Unificada: Paridade de Controles API vs. SSR

**Objetivo:** Garantir que os controles de segurança aplicados ao canal API sejam equivalentemente aplicados ao canal SSR, eliminando a assimetria identificada.

**Motivação:** Sistematicamente, controles foram aplicados na API como referência e omitidos no SSR: rate limiting (T06-004), guarda de `JWT_SECRET` (T06-006), política de senha forte (T06-010), cookies seguros (T06-007).

**Achados relacionados:** T06-004, T06-006, T06-007, T06-010, T06-018

**FRs/NFRs relacionados:** FR-55, FR-57, NFR-1, NFR-3

**Pré-requisitos:** Decisões de VH-T06-01 (mock `x-mock-user`), VH-T06-03 (política de logout)

**Proposta de escopo:**
- Rate limiting equivalente em `POST /login` SSR
- Guarda de `JWT_SECRET` em todos os módulos que o consomem
- Política de senha forte aplicada na criação de usuário via API
- Revisão do mecanismo de mock `x-mock-user` com alternativa mais segura

---

### SPEC-T06-05 — Isolamento Multi-Evento: Enforcement Consistente por Domínio

**Objetivo:** Garantir que o isolamento de escopo por evento seja aplicado de forma consistente em todos os domínios (certificados, tipos de certificados, operações SSR por ID) e em ambos os canais (API e SSR).

**Motivação:** T06-001 (certificados via API), T06-012 (certificados SSR por ID), T06-014 (tipos de certificados), T06-022 (formulário de criação SSR) revelam padrão recorrente de enforcement parcial ou ausente.

**Achados relacionados:** T06-001, T06-012, T06-014, T06-022, T06-002

**FRs/NFRs relacionados:** FR-37, FR-46, FR-49, NFR-1

**Pré-requisitos:** SPEC-T06-01 (contrato de `req.usuario`); SPEC-T06-02 (redesign de `scopedEvento`); decisão de VH-T06-06 (escopo de visualização de tipos)

**Proposta de escopo:**
- Centralizar helper de resolução de escopo (`escopoService.getEventoIds`)
- Aplicar scoping em `GET /tipos-certificados` (listagem e por ID)
- Aplicar verificação de `evento_id` nas operações SSR por ID em `certificadoSSRController`
- Filtrar eventos disponíveis no formulário `certificadoSSRController.novo` pelo escopo do usuário

---

## 7. Análise de Problemas Sistêmicos

### 7.1 Falhas estruturais de autenticação

O sistema opera com dois mecanismos de autenticação paralelos e assimétricos:

**JWT Bearer (API):** Implementado em `auth.js` com fail-fast, retorna instância Sequelize completa, protegido por rate limiting no login.

**Cookie JWT (SSR):** Implementado em `authSSR.js` sem fail-fast de `JWT_SECRET`, retorna plain object incompleto, endpoint de login sem rate limiting, cookie sem flag `secure`.

O canal SSR é sistematicamente menos protegido que o canal API em todos os aspetos auditados (fail-fast, rate limiting, política de senha, cookies seguros). O padrão sugere que o desenvolvimento de controles de segurança usou a API como referência e o SSR como extensão não revisada.

Adicionalmente, a sessão Express coexiste como terceiro estado independente, criando um ambiente híbrido não especificado no SRS: JWT (autenticação real) + sessão (flash messages + mock de testes) sem relação formal entre eles.

### 7.2 Inconsistências de autorização (RBAC)

O RBAC é aplicado de forma inconsistente entre os dois canais e dentro do mesmo canal API:

| Operação | SSR | API | Esperado (SRS) |
|---|---|---|---|
| `DELETE /eventos/:id` | `rbac('admin')` ✅ | `rbac('monitor')` ❌ | Admin only |
| `PUT /eventos/:id` | `rbac('admin')` ✅ | `rbac('monitor')` ❌ | Admin only |
| `POST /eventos` | `rbac('admin')` ✅ | `rbac('monitor')` ❌ (proteção por efeito colateral) | Admin only |
| `POST /usuarios` (criar) | N/A | sem `rbac` na rota ❌ | Admin only |
| `GET /tipos-certificados` | N/A | sem scoping ❌ | Scoped por evento |

Em dois casos (`POST /eventos` e `POST /usuarios`), a proteção efetiva não vem do RBAC declarado na rota, mas de efeitos colaterais em outros mecanismos (ausência de `evento_id` no scoped, check no controller). Esse padrão viola o princípio de defense-in-depth: a remoção ou refatoração do mecanismo secundário elimina a proteção sem alarme no RBAC.

### 7.3 Problemas de propagação de identidade do usuário

A identidade do usuário não propaga com consistência entre os contextos do sistema:

- **API → service:** `req.usuario.getEventos()` funciona; controllers SSR substituem por `UsuarioEvento.findAll()` ou helper local
- **SSR → controllers:** `req.usuario` como plain object sem `getEventos()`; cada controller SSR resolve escopo de forma independente (triplicação de lógica)
- **Middleware → service:** `scopedEvento` injeta `req.query.evento_id`, mas `certificadoService.findAll` ignora o parâmetro (falha de contrato implícito)

O resultado é que a identidade do usuário e seu escopo de eventos são materializados de 3 formas diferentes no mesmo sistema, sem contrato explícito, criando inconsistência vertical entre middleware, controller e service.

### 7.4 Riscos de escalonamento de privilégios

Os achados T06-002 e T06-009 representam os dois principais vetores de privilege escalation identificados:

**Vector 1 — Gestores como admins de eventos (T06-002):**  
Via API, um gestor associado a um evento pode deletar e atualizar esse evento (operação admin-only no SRS e SSR). Não é escalada de perfil, mas é escalada de capacidade operacional para além do que o perfil permite.

**Vector 2 — Criação de usuário admin por não-admin (T06-009):**  
As rotas `POST /:papel/:id/usuarios` em `usuarios-crud.js` não têm `rbac` na cadeia. Um monitor ou gestor pode passar pela autenticação e tentar criar um usuário de qualquer perfil. A única defesa é o check manual no controller (`req.usuario.perfil !== 'admin'`). Se esse check for removido ou contornado (ex.: por injeção de payload inesperado ou por refatoração desavisada), a escalada de privilégio é completa.

### 7.5 Fragilidade no modelo multi-tenant

O isolamento multi-evento apresenta falhas estruturais em três camadas:

**Camada de middleware:** `scopedEvento` com semântica incorreta para operações por ID (T06-001) — a proteção existe mas é semanticamente errada.

**Camada de controller:** Controllers SSR aplicam scoping apenas em listagens (`index`), não em operações por ID (`detalhe`, `editar`, etc.) — T06-012.

**Camada de dados:** Ausência de unique constraint de banco em `usuario_eventos` (T06-016) — a integridade do modelo N:N depende exclusivamente da aplicação.

O isolamento é efetivo apenas quando todos os três mecanismos funcionam corretamente e em conjunto. Qualquer falha em uma camada não é detectada pelas outras.

### 7.6 Dependências implícitas entre middlewares

Dois padrões de dependência implícita foram identificados:

**Dependência de tipo de objeto:** `scopedEvento` e `tiposCertificadosOwnership` dependem de `req.usuario.getEventos()` — disponível via `auth` (API), indisponível via `authSSR` (SSR). A dependência não está documentada e falha com HTTP 500, não com mensagem de erro descritiva.

**Dependência de carregamento de módulo:** `authSSR.js` não valida `JWT_SECRET` no carregamento; assume que `auth.js` foi carregado primeiro (que faz a validação). Essa dependência de ordem de carregamento é implícita e não testada.

**Dependência de presença de campo:** `scopedEvento` usa `req.query.evento_id` como filtro injetado — mas nenhum service ou controller documenta que este campo deve ser consumido. O contrato entre middleware e camada de serviço é puramente implícito.

### 7.7 Divergência entre comportamento SSR e API

| Aspecto | API | SSR |
|---|---|---|
| Tipo de `req.usuario` | Instância Sequelize (completa) | Plain object (parcial) |
| Campos disponíveis | Todos do modelo | `id, nome, perfil, isAdmin, isGestor` |
| `getEventos()` | Disponível | Indisponível |
| `isMonitor` | `perfil === 'monitor'` | Campo ausente |
| Rate limiting no login | Sim (`loginLimiter`) | Não |
| Guarda de `JWT_SECRET` | Sim (throw em load) | Não |
| RBAC de eventos | `rbac('monitor')` — incorreto | `rbac('admin')` — correto |
| Scoping de certificados por ID | Via `scopedEvento` (semântica incorreta) | Sem verificação |
| Política de senha na criação | Ausente | Aplicada no update SSR (não na criação) |
| Cookie `secure` | N/A | Ausente |
| Logout invalida token | N/A | Não (JWT válido por até 1h) |

### 7.8 Fragilidade na configuração de segurança

O sistema demonstra consciência do padrão fail-fast (evidenciado pelo `throw new Error` para `SESSION_SECRET` em `app.js` e `JWT_SECRET` em `auth.js`) mas a aplicação é inconsistente — módulos da mesma criticidade (`authSSR.js`, `routes/auth.js`, `r2Service.js`) não seguem o mesmo padrão.

Dois segredos hardcoded em arquivos versionados (`SESSION_SECRET` em `docker-compose.yml`, `JWT_SECRET` em `docker-compose.test.yml`) criam risco de exposição em repositórios públicos ou acidentais.

O padrão de reutilização de valores de exemplo (`sua_chave_jwt_super_secreta` em `.env.example` e em `docker-compose.test.yml`) sugere que operadores inexperientes tendem a reutilizar esses valores em produção.

### 7.9 Padrões recorrentes de erro entre domínios

Três padrões sistêmicos se repetem consistentemente nos três domínios auditados:

**Padrão A — "Proteção pela metade":** Middleware aplica proteção em parte das operações (listagem sim, por ID não; criação sim, update não). Encontrado em: scoping de certificados SSR (T06-012), política de senha (T06-010), tipos de certificados (T06-014).

**Padrão B — "RBAC decorativo":** Proteção real vem de efeito colateral, não do RBAC declarado. Encontrado em: `POST /eventos` com `rbac('monitor')` bloqueado colateralmente por `scopedEvento` (T06-002); criação de usuário com check manual no controller (T06-009).

**Padrão C — "Assimetria API vs. SSR":** Controles implementados na API não são implementados equivalentemente no SSR. Encontrado em: rate limiting (T06-004), RBAC de eventos (T06-002), guarda de JWT (T06-006), scoping de certificados (T06-001 vs T06-012).

---

## 8. Dependências entre Domínios

### 8.1 Impacto de T06-001/T06-012 em Participantes e Certificados

O bypass de escopo em certificados via API (T06-001) e SSR (T06-012) afeta diretamente domínios downstream:

- **Participantes:** participantes são vinculados a eventos; se certificados sem escopo forem acessados, dados de participantes de eventos terceiros são indiretamente expostos via relacionamento `certificado → participante`
- **Geração de PDF:** `pdfService` recebe o certificado completo (com dados do participante) e o loga sem filtro (T06-008); o bypass de scoping significa que o PDF pode ser gerado para certificados de eventos fora do escopo do requestor

### 8.2 Impacto de T06-002 (Privilege escalation de eventos) em Tipos de Certificados e Certificados

Se um gestor pode deletar um evento via API (T06-002), o soft delete propaga para `usuario_eventos` (via `eventoService.delete`), mas não há evidência de propagação para `tipos_certificados` nem para `certificados` vinculados ao evento. O achado não foi auditado nesses domínios nesta triagem, mas a correlação é relevante.

### 8.3 Impacto de T06-003 (SESSION_SECRET hardcoded) em Sessões e Autenticação SSR

A comprometimento da `SESSION_SECRET` afeta a integridade de sessões Express, usadas para:
- Flash messages (feedback UX)
- Mock de usuário em testes (`req.session.mockUser` em T06-018)

A sessão não é usada para autenticação real (que usa JWT via cookie), mas sua comprometimento permite forjar flash messages e, em ambiente de teste, injetar identidades via `mockUser` persistido na sessão.

### 8.4 Impacto de T06-009 (ausência de RBAC em usuarios-crud) em Todos os Domínios

Se um não-admin criar um usuário com perfil `admin` via API, esse usuário teria acesso irrestrito a todos os domínios do sistema — incluindo certificados, eventos, participantes, tipos de certificados e geração de PDF — sem qualquer restrição de scoping. Este é o vetor de impacto mais amplo identificado na triagem.

### 8.5 Impacto de T06-008 (PII em logs de pdfService) em Rotas Públicas

O log de PII em `pdfService` ocorre durante a geração de certificado, que pode ser acionada tanto por usuários autenticados quanto por fluxos de validação pública (dependendo da implementação). Em qualquer caso, os dados pessoais do participante são expostos nos logs sem condicional de ambiente.

### 8.6 Dependência de T06-016 (ausência de unique constraint) em Integridade de Scoping

O scoping multi-evento (FR-37) depende da corretude dos vínculos em `usuario_eventos`. Se vínculos duplicados forem criados (T06-016 — ausência de unique constraint no banco), queries de resolução de escopo (`getEventos()`, `UsuarioEvento.findAll`) podem retornar conjuntos incorretos, potencialmente expandindo ou contraindo o escopo de eventos de um usuário de forma imprevisível.

---

## Resumo Executivo

### Estatísticas de achados

| Métrica | Total |
|---|---|
| Total de achados consolidados | 34 |
| Achados de severidade **Crítica** | 3 (T06-001, T06-002, T06-003) |
| Achados de severidade **Alta** | 13 (T06-004 a T06-013, T06-016, T06-018, T06-023, T06-032) |
| Achados de severidade **Média** | 14 |
| Achados de severidade **Baixa** | 4 |
| Vulnerabilidades (VU) | **9** (T06-001, T06-002, T06-003, T06-006, T06-007, T06-008, T06-009, T06-010, T06-013) |
| Gaps de implementação (GI) | 6 |
| Implementações parciais (IP) | 7 |
| Violações arquiteturais (VA) | 3 |
| Dívidas técnicas (DT) | 9 |
| Inconsistências documentais (ID) | 3 |
| Ambiguidades (AM) | 1 |
| Validação humana (VH) | 3 (T06-017, T06-018, T06-030, T06-031) |
| Bugs reais (BR) | 1 (T06-021) |

### Principais riscos sistêmicos

1. **Assimetria SSR vs. API** — O canal SSR é sistematicamente menos protegido em rate limiting, fail-fast de segredos, RBAC e scoping. Qualquer atacante que priorize o canal SSR tem vantagem estrutural sobre a proteção implementada.

2. **Contrato duplicado de `req.usuario`** — A ausência de interface única para o objeto de usuário entre API e SSR cria dependências implícitas, triplicação de lógica e risco latente de HTTP 500 em extensões futuras.

3. **`scopedEvento` com semântica incorreta para operações por ID** — O fallback para `req.params.id` como substituto de `evento_id` torna a proteção de isolamento multi-evento semanticamente incorreta para todo acesso por ID, podendo bloquear acesso legítimo ou permitir acesso ilegítimo por coincidência de IDs.

4. **Proteção RBAC decorativa** — Em dois casos críticos (`POST /eventos`, criação de usuário), o RBAC declarado na rota não é o mecanismo de proteção efetiva; a proteção real vem de efeitos colaterais frágeis, violando defense-in-depth.

### Principais riscos de escalonamento de privilégio

1. **T06-002 (Crítico):** Gestores podem deletar e atualizar eventos via API — operação reservada a admin. Privilege escalation funcional de capacidade operacional.

2. **T06-009 (Alto):** Usuário não-admin pode tentar criar usuário com perfil admin via API; única defesa é check no controller, facilmente contornável por refatoração desavisada. Privilege escalation de perfil.

3. **T06-018 (Alto):** Se `NODE_ENV=test` vazar para produção, qualquer requestor pode injetar identidade arbitrária (incluindo admin) via header `x-mock-user` sem autenticação. Privilege escalation total.

### Principais riscos de vazamento entre eventos/usuários

1. **T06-001 (Crítico):** Qualquer gestor/monitor com JWT válido obtém todos os certificados de todos os eventos via `GET /certificados` — isolamento multi-tenant inoperante para listagens de certificados via API.

2. **T06-012 (Alto):** Gestor/monitor via SSR pode acessar, editar e deletar certificados de qualquer evento por URL direta, sem verificação de escopo.

3. **T06-014 (Médio):** Tipos de certificados de todos os eventos visíveis para qualquer autenticado via API e SSR, sem filtro de scoping.

4. **T06-008 (Alto):** Dados pessoais de participantes (PII) expostos em logs de produção via `pdfService.js`, sem condicional de ambiente.

---

*Triagem gerada em: 2026-05-10 12:35 (BRT)*  
*Baseada exclusivamente nos achados das Auditorias 17, 18 e 19. Nenhum código foi modificado. Achados não fundamentados em evidências das auditorias foram excluídos. Incertezas marcadas como VH.*
