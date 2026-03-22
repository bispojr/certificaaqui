## DOMÍNIO 1: INFRAESTRUTURA E CONFIGURAÇÃO

**Descrição:**
Fundação técnica do sistema — schema de banco, configurações de ambiente, containerização e tooling de qualidade de código.

---

**FEATURE: Gerenciamento de Schema (Migrations)**

Descrição:
Controle versionado do schema do banco de dados via Sequelize migrations, substituindo `sync({ force: true })`.

TASKS:
- Criar migrations Sequelize para todos os modelos (`participantes`, `eventos`, `tipos_certificados`, `certificados`, `usuarios`)
- Criar migration de tabela de associação `usuario_eventos` (N:N)
- Criar migration de índices de performance (`certificados`, `participantes`, `usuarios`)
- Atualizar setup.js para rodar `db:migrate` em vez de `sync`

---

**FEATURE: Configuração de Ambiente**

Descrição:
Padronização de variáveis de ambiente, remoção de credenciais hard-coded e documentação de setup.

TASKS:
- Criar .env.example com todas as variáveis necessárias
- Remover fallbacks inseguros em database.js e middlewares JWT
- Garantir que variáveis obrigatórias lançam erro explícito se ausentes
- Adicionar .env ao .gitignore

---

**FEATURE: Containerização e Isolamento de Ambientes**

Descrição:
Separação de infraestrutura Docker por ambiente (produção vs. testes).

TASKS:
- Separar docker-compose.yml (produção) de docker-compose.test.yml (testes)
- Garantir que o banco de testes é isolado do banco de desenvolvimento

---

**FEATURE: Tooling de Qualidade de Código**

Descrição:
ESLint, Prettier e configuração de package.json para padronização e manutenibilidade.

TASKS:
- Configurar ESLint com `eslint:recommended`
- Configurar Prettier (aspas simples, sem ponto-e-vírgula, 2 espaços)
- Adicionar scripts `lint` e `format` ao package.json
- Corrigir metadados do package.json (`name`, `description`, `author`)

---

---

## DOMÍNIO 2: AUTENTICAÇÃO E CONTROLE DE ACESSO

**Descrição:**
Identidade e autorização no sistema — autenticação JWT para a API JSON, autenticação via cookie para SSR, RBAC por perfil e escopo por evento.

---

**FEATURE: Autenticação JWT (API)**

Descrição:
Login/logout via endpoint JSON com geração e validação de tokens JWT.

TASKS:
- Criar model `Usuario` com campos `nome`, `email`, `senha` (bcrypt), `perfil`
- Criar `src/middlewares/auth.js` validando JWT e populando `req.usuario`
- Criar usuarioController.js com `login`, `logout`, `me`
- Criar usuarios.js com endpoints de autenticação
- Unificar `JWT_SECRET` sem fallbacks inseguros
- Aplicar rate limiting em `POST /usuarios/login`

---

**FEATURE: Autenticação SSR (Cookie-based)**

Descrição:
Login via formulário web, token armazenado em cookie httpOnly, redirecionamento após autenticação.

TASKS:
- Criar `src/middlewares/authSSR.js` lendo cookie `token` e populando `res.locals.usuario`
- Criar `src/routes/auth.js` com rotas `GET/POST /auth/login` e `POST /auth/logout`
- Configurar `express-session` e `connect-flash` em app.js
- Registrar rota `/auth` no app.js

---

**FEATURE: Controle de Acesso por Perfil (RBAC)**

Descrição:
Middleware de autorização que restringe acesso a rotas com base nos perfis `admin`, `gestor` e `monitor`.

TASKS:
- Criar rbac.js verificando `req.usuario.perfil`
- Proteger todas as rotas administrativas com `auth` + `rbac`
- Garantir que monitor não acessa rotas exclusivas de gestor/admin
- Garantir que gestor não acessa rotas exclusivas de admin

---

**FEATURE: Escopo de Evento (scopedEvento)**

Descrição:
Middleware que restringe gestores e monitores a operar exclusivamente dentro do(s) evento(s) vinculado(s).

TASKS:
- Corrigir `scopedEvento.js` para usar relação N:N via `req.usuario.getEventos()`
- Garantir que admin passa sem restrição
- Garantir que usuário sem evento vinculado recebe 403
- Atualizar testes de `scopedEvento` para o modelo N:N

---

---

## DOMÍNIO 3: GESTÃO DE CERTIFICADOS

**Descrição:**
Core do sistema — emissão, ciclo de vida, interpolação de template, geração de PDF e consulta/validação pública de certificados.

---

**FEATURE: API REST de Certificados**

Descrição:
Endpoints JSON para emissão, consulta, cancelamento, restauração e listagem paginada de certificados.

TASKS:
- Criar certificadoService.js com operações de CRUD + cancel + restore
- Criar certificadoController.js delegando ao service
- Criar certificados.js com rotas REST completas
- Adicionar paginação (`findAndCountAll`) com resposta `{ data, meta }`
- Validar `valores_dinamicos` contra `dados_dinamicos` do tipo antes de criar

---

**FEATURE: Interpolação de Template**

Descrição:
Substituição de variáveis do `texto_base` com `valores_dinamicos` do certificado para gerar o texto final.

TASKS:
- Criar templateService.js com interpolação via regex `\$\{(\w+)\}`
- Criar testes unitários do `templateService`
- Integrar `templateService` ao `certificadoService` e ao controller de detalhe SSR

---

**FEATURE: Geração de PDF**

Descrição:
Geração on-the-fly de PDF do certificado via PDFKit, devolvido diretamente no corpo da resposta HTTP.

TASKS:
- Instalar `pdfkit`
- Criar pdfService.js retornando `Promise<Buffer>`
- Adicionar rota `GET /public/certificados/:id/pdf` retornando o buffer com `Content-Type: application/pdf`
- Rejeitar geração para certificados sem `codigo` válido
- Criar smoke tests do `pdfService`

---

**FEATURE: Consulta e Validação Pública**

Descrição:
Rotas públicas (sem autenticação) para participantes buscarem e validarem certificados.

TASKS:
- Criar public.js com `GET /public/certificados?email=` e `GET /public/validar/:codigo`
- Adicionar rotas SSR públicas (`/public/pagina/opcoes`, `/public/pagina/obter`, `/public/pagina/validar`)
- Criar views Handlebars do fluxo público (`opcoes.hbs`, `form-obter.hbs`, `form-validar.hbs`, `obter-lista.hbs`, `validar-resultado.hbs`)

---

## DOMÍNIO 4: GESTÃO DE ENTIDADES ADMINISTRATIVAS

**Descrição:**
CRUD das entidades principais do sistema — participantes, eventos, tipos de certificados e usuários — acessíveis via API REST e interface web administrativa.

---

**FEATURE: Gestão de Participantes**

Descrição:
Cadastro, consulta, atualização e remoção lógica de participantes, com busca por nome/email e contagem de certificados vinculados.

TASKS:
- Criar participanteService.js com CRUD + soft delete + restore
- Criar participanteController.js com paginação
- Criar participantes.js com rotas REST completas
- Criar `src/controllers/participanteSSRController.js` com busca `?q=` e contagem de certificados
- Criar views `admin/participantes/index.hbs` e `admin/participantes/form.hbs`
- Adicionar rotas SSR de participantes em `src/routes/admin.js`

---

**FEATURE: Gestão de Eventos**

Descrição:
Cadastro e gerenciamento de eventos com código base único, incluindo cascata de soft delete/restore nas associações `usuario_eventos`.

TASKS:
- Criar eventoService.js com CRUD + soft delete + restore com cascata em `usuario_eventos`
- Criar eventoController.js com paginação
- Criar eventos.js com rotas REST completas
- Corrigir `eventoService.delete` para usar `UsuarioEvento.destroy` (paranoid)
- Corrigir `eventoService.restore` para restaurar associações `UsuarioEvento`
- Criar `src/controllers/eventoSSRController.js` com listagem de arquivados
- Criar views `admin/eventos/index.hbs` e `admin/eventos/form.hbs`
- Adicionar rotas SSR de eventos em `src/routes/admin.js`

---

**FEATURE: Gestão de Tipos de Certificados**

Descrição:
Criação e edição de modelos de certificados parametrizáveis com campos dinâmicos JSONB, template de texto e campo destaque.

TASKS:
- Criar tiposCertificadosService.js com CRUD + soft delete + restore
- Criar tiposCertificadosController.js com paginação
- Criar tipos-certificados.js com rotas REST completas
- Corrigir validação cross-field de `campo_destaque` via hook `beforeValidate`
- Criar `src/controllers/tiposCertificadosSSRController.js` com parse de `dados_dinamicos` JSON
- Criar views `admin/tipos-certificados/index.hbs` e `admin/tipos-certificados/form.hbs` (editor dinâmico com preview ao vivo)
- Adicionar rotas SSR de tipos em `src/routes/admin.js`

---

**FEATURE: Gestão de Usuários (Admin)**

Descrição:
CRUD de usuários com controle de perfil, hash de senha, vinculação a eventos via relação N:N e gestão de soft delete.

TASKS:
- Criar `src/services/usuarioService.js` com CRUD + soft delete + restore
- Criar usuarioController.js com `login`, `logout`, `me`, CRUD admin
- Criar vinculação N:N usuário-evento via `UsuarioEvento` (migration + model)
- Criar `src/controllers/usuarioSSRController.js` com `setEventos` e exibição de eventos vinculados
- Criar views `admin/usuarios/index.hbs` e `admin/usuarios/form.hbs` (checkbox de eventos, campo senha opcional em edição)
- Adicionar rotas SSR de usuários em `src/routes/admin.js`

---

---

## DOMÍNIO 5: INTERFACE WEB (SSR / Handlebars)

**Descrição:**
Camada de apresentação server-side rendered — layouts, fluxo público de certificados, painel administrativo e dashboard com métricas por perfil.

---

**FEATURE: Layouts e Estrutura Base**

Descrição:
Layout público com Bootstrap 5 e navbar, layout administrativo com sidebar condicional por perfil, e página de erro estilizada.

TASKS:
- Atualizar layout.hbs com Bootstrap 5 via CDN, navbar pública e slot de flash messages
- Criar admin.hbs com navbar administrativa, links condicionais por perfil e botão de logout
- Atualizar error.hbs com Bootstrap e botão "Voltar ao início"
- Registrar `express-session` e `connect-flash` no app.js

---

**FEATURE: Dashboard Administrativo**

Descrição:
Painel inicial pós-login exibindo métricas de contagem condicionais ao perfil do usuário autenticado.

TASKS:
- Criar `src/controllers/dashboardController.js` com contagens por perfil (admin: 4 cards; gestor/monitor: 2 cards)
- Criar `views/admin/dashboard.hbs` com cards Bootstrap condicionais
- Criar `src/routes/admin.js` com rota `GET /admin/dashboard` protegida por `authSSR`
- Registrar rota `/admin` no app.js

---

**FEATURE: Fluxo Público de Certificados (SSR)**

Descrição:
Páginas web para o participante buscar certificados por e-mail e validar autenticidade por código, sem necessidade de login.

TASKS:
- Criar views estáticas do fluxo (`opcoes.hbs`, `form-obter.hbs`, `form-validar.hbs`)
- Criar views de resultado (`obter-lista.hbs`, `validar-resultado.hbs`)
- Adicionar rotas SSR em public.js (GET de páginas + POST de formulários)
- Integrar formulário de busca com spinner de loading

---

**FEATURE: Painel Administrativo — Views de Gestão**

Descrição:
Conjunto completo de views CRUD para todas as entidades no painel admin, com filtros, seções de arquivados, modais de confirmação e formulários dinâmicos.

TASKS:
- Criar views de gestão de eventos (`index.hbs`, `form.hbs`)
- Criar views de gestão de participantes com busca `?q=` e coluna de contagem de certificados
- Criar views de gestão de certificados com filtros por evento/status/tipo e modal de cancelamento Bootstrap
- Criar view de detalhe de certificado com texto interpolado e link de PDF
- Criar view de formulário de certificado com campos dinâmicos carregados via `fetch`
- Criar views de gestão de tipos de certificados com editor JSONB e preview ao vivo
- Criar views de gestão de usuários com checkboxes de eventos e campo senha opcional em edição

---

---

## DOMÍNIO 6: QUALIDADE E TESTES

**Descrição:**
Cobertura de testes em todos os níveis — unitários de service, integração de controller/rota, migração de schema e E2E de interface com Playwright.

---

**FEATURE: Testes Unitários (Services e Validators)**

Descrição:
Testes isolados da lógica de negócio sem acesso ao banco, usando mocks dos models Sequelize.

TASKS:
- Criar testes para `templateService` (interpolação, campos ausentes, `valores_dinamicos` vazio)
- Criar testes para `pdfService` (buffer não-vazio, assinatura `%PDF`, rejeição sem `codigo`)
- Criar testes para `certificadoService.create` com validação de `valores_dinamicos` vs `dados_dinamicos`
- Criar testes de paginação para todos os services (`findAndCountAll`, formato `{ data, meta }`)
- Criar testes para `eventoService.delete` e `restore` com cascata de `UsuarioEvento`

---

**FEATURE: Testes de Integração (Controllers e Rotas)**

Descrição:
Testes de rotas HTTP com banco de testes dedicado, cobrindo casos de sucesso, validação (400/422) e not found (404).

TASKS:
- Criar testes de rota para todos os recursos REST (`participantes`, `eventos`, `certificados`, `tipos-certificados`, `usuarios`)
- Criar testes de autenticação e RBAC (401, 403)
- Criar testes de `scopedEvento` para modelo N:N
- Criar testes de rotas públicas (`/public/certificados`, `/public/validar/:codigo`)
- Criar testes de `auth.js` middleware (token válido, inválido, ausente)

---

**FEATURE: Testes de Migração**

Descrição:
Verificação de que todas as migrations `up`/`down` executam sem erros e produzem o schema esperado.

TASKS:
- Criar testes de migration para `certificados`, `participantes`, `eventos`, `tipos_certificados`, `usuarios`
- Verificar que `down` desfaz corretamente cada migration
- Verificar que índices são criados e removidos pela migration de performance

---

**FEATURE: Testes E2E com Playwright**

Descrição:
Testes de interface browser automatizados cobrindo os três fluxos principais: público, autenticação/RBAC e administração.

TASKS:
- Instalar e configurar `@playwright/test` com `playwright.config.js`
- Criar seed E2E (`tests/e2e/setup/seed.js`) com dados mínimos por perfil
- Criar helpers `loginAs` e `createViaApi` para reutilização entre suites
- Criar `publico.spec.js` — UC-P01 a UC-P10 (fluxo público de certificados)
- Criar `auth.spec.js` — UC-A01 a UC-A11 (login, logout, RBAC por perfil)
- Criar `admin.spec.js` — UC-AD01 a UC-AD10 (CRUD completo via painel admin)

---

---

## DOMÍNIO 7: DOCUMENTAÇÃO E RASTREABILIDADE

**Descrição:**
Documentação técnica do sistema — especificações, ADRs, guias de desenvolvimento/deploy e documentação de API.

---

**FEATURE: Documentação de Arquitetura (ADRs)**

Descrição:
Registros de decisões arquiteturais explicando o porquê das escolhas técnicas mais relevantes.

TASKS:
- Criar ADR-001: escolha do ORM Sequelize
- Criar ADR-002: soft delete via `paranoid`
- Criar ADR-003: uso de JSONB para `dados_dinamicos`
- Criar ADR-004: engine de geração de PDF (PDFKit vs. Puppeteer)
- Criar ADR-005: vínculo usuário-evento N:N via `usuario_eventos`
- Criar ADR-006: estratégia de paginação offset-based
- Criar ADR-007: onde validar `valores_dinamicos` (service vs. model vs. validator)
- Criar ADR-008: armazenamento de PDFs (on-the-fly vs. S3/disco)

---

**FEATURE: Documentação Técnica Geral**

Descrição:
Guias de referência para desenvolvedores e operadores do sistema.

TASKS:
- Criar visao-geral.md — descrição, stakeholders, glossário
- Criar arquitetura.md — diagramas C4 em Mermaid
- Criar modulos.md — entidades, campos, regras
- Criar desenvolvimento.md — setup local, variáveis, como rodar testes
- Criar deploy.md — Docker, migrations em produção

---

**FEATURE: Documentação de API (Swagger/OpenAPI)**

Descrição:
Interface interativa de documentação dos endpoints REST disponível em `/api-docs`.

TASKS:
- Instalar `swagger-jsdoc` e `swagger-ui-express`
- Adicionar anotações `@swagger` (JSDoc) em todas as rotas
- Expor interface em `GET /api-docs`

---

---

## DOMÍNIO 8: MONITORAMENTO E OPERAÇÕES

**Descrição:**
Observabilidade e operações da aplicação em produção — health check, validação de entrada e migração de arquivos legados.

---

**FEATURE: Health Check**

Descrição:
Endpoint de monitoramento que reporta status da aplicação e conectividade com o banco de dados.

TASKS:
- Criar `GET /health` retornando `{ status, db, uptime }`
- Retornar HTTP 503 quando o banco estiver indisponível
- Criar testes de rota para o health check

---

**FEATURE: Validação de Entrada (Zod)**

Descrição:
Schemas de validação aplicados nas rotas `POST`/`PUT` para rejeitar payloads malformados antes de chegar ao controller.

TASKS:
- Criar schemas Zod em validators para cada recurso
- Criar middleware de validação `src/middlewares/validate.js`
- Aplicar middleware nas rotas de criação e atualização
- Garantir que erros retornam 400 com lista de campos inválidos

---

**FEATURE: Migração de Arquivos Legados**

Descrição:
Reorganização de arquivos de middleware e rotas do diretório raiz para src, removendo código legado.

TASKS:
- Criar `src/middlewares/auth.js` substituindo auth.js
- Atualizar todos os imports de `auth` em rotas e testes
- Remover auth.js após migração completa
- Substituir carregamento dinâmico em `models/index.js` por registro explícito

---