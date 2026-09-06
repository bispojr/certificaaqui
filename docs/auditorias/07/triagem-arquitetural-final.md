# Super Triagem Arquitetural Final — Certifique-me

**Sistema:** Certifique-me  
**Data:** 2026-05-10 15:15 (BRT)  
**Auditor:** Arquiteto de Software Principal (GitHub Copilot — Claude Sonnet 4.6)  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Escopo:** Consolidação definitiva de todas as auditorias e triagens da rodada 07  
**Status:** Concluída

---

## Fontes consolidadas

| Triagem | Domínios                                                                  | Achados de origem                      |
| ------- | ------------------------------------------------------------------------- | -------------------------------------- |
| T01     | Certificados, RBAC/Escopo                                                 | CERT-01 a CERT-17                      |
| T02     | Eventos, Usuários, Autenticação/Autorização                               | C-01 a C-43                            |
| T03     | Participantes, Tipos de Certificados, Dashboard                           | PA-01–11, TC-01–19, DB-01–11, TS-01–06 |
| T04     | Upload/R2/Arquivos, Templates, Geração de PDF                             | C-01 a C-47                            |
| T05     | Acesso público (validação, download, consulta)                            | T05-VU-001 a T05-VH-006                |
| T06     | Associação Usuário-Evento, Middlewares, Segurança Core                    | T06-001 a T06-034                      |
| T07     | Models, Relacionamentos, Soft Delete, Constraints, Migrações, Integridade | T07-01 a T07-35                        |

Auditorias individuais suportando as triagens: 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25.

---

# 1. Sumário Executivo Arquitetural

## Estado geral do sistema

O Certifique-me encontra-se em **estado de risco operacional elevado**. A implementação cobre a maior parte dos fluxos funcionais definidos no SRS, mas falha sistematicamente em três invariantes arquiteturais fundamentais: **isolamento multi-tenant**, **controle de acesso (RBAC)** e **integridade transacional de dados**. Essas três falhas não são incidentes isolados — são padrões estruturais reproduzíveis em múltiplos domínios que comprometem a confiabilidade geral do sistema.

## Maturidade arquitetural

**Baixa-Média.** A estrutura em camadas (routes → controllers → services → models) existe nominalmente, mas é violada em múltiplos pontos críticos. Middlewares de segurança (`scopedEvento`, `tiposCertificadosOwnership`) estão presentes mas não produzem enforcement real. O service layer é incompleto (`usuarioService` ausente; lógica de negócio inline em rotas e controllers SSR). Validators Zod existem mas possuem bugs que bloqueiam fluxos centrais.

## Confiabilidade do enforcement

**Não confiável.** O enforcement de multi-tenancy via `scopedEvento` é semanticamente incorreto para operações de recurso único — usa o ID do recurso no lugar do `evento_id`, tornando o controle de acesso não-determinístico. Os services de certificados e participantes ignoram os filtros injetados pelo middleware. As proteções RBAC divergem sistematicamente entre API REST e SSR, com a API sendo consistentemente mais permissiva sem justificativa documentada.

## Principais riscos

1. **Vazamento total de multi-tenancy**: qualquer gestor ou monitor autenticado pode acessar dados de todos os eventos do sistema via API.
2. **Privilege escalation via API**: gestores podem deletar e atualizar eventos; monitores podem deletar participantes e restaurar certificados.
3. **XSS stored em painel admin**: dados JSONB renderizados sem escape em contexto `<script>` sem CSP.
4. **Enumeração pública irrestrita**: PDFs enumeráveis por ID sequencial, códigos de certificado previsíveis, sem rate limiting em qualquer rota pública.
5. **Integridade transacional ausente**: zero uso de `sequelize.transaction()`; race condition na geração de código de certificado; colisão de código após soft delete.
6. **Credencial hardcoded**: `SESSION_SECRET=changeme-em-producao` em `docker-compose.yml`.

## Principais fragilidades

- Contrato de `req.usuario` incompatível entre API (`auth`, instância Sequelize) e SSR (`authSSR`, POJO sem métodos), inviabilizando reuso de middlewares de autorização em SSR.
- Validator Zod de criação de certificado remove `valores_dinamicos` silenciosamente — criação de certificados com campos dinâmicos **completamente impossível** via API.
- Alias Sequelize incorreto (`TiposCertificado` vs `TiposCertificados`) causa exibição vazia do texto do certificado no painel SSR.
- Link de PDF no painel admin aponta para rota inexistente — download sempre retorna HTTP 404 para usuários autenticados.
- Dashboard mostra dados incorretos para gestor/monitor; coluna "5 últimos certificados" não está renderizada.

## Principais blockers arquiteturais

1. A estratégia de enforcement de escopo multi-tenant é arquiteturalmente incorreta — qualquer nova funcionalidade que dependa de isolamento por evento herda a falha.
2. A assimetria de `req.usuario` entre API e SSR impede reutilização de middlewares de autorização e força duplicação de lógica em controllers SSR.
3. A ausência de `sequelize.transaction()` em operações compostas expõe o sistema a estados intermediários inválidos cronicamente.

## Avaliação de risco operacional

**Crítico.** O sistema não deve ser promovido a ambiente de produção multiusuário no estado atual. As falhas de multi-tenancy e RBAC permitem acesso irrestrito entre tenants. As vulnerabilidades públicas permitem enumeração massiva de dados pessoais. A integridade transacional ausente pode corromper dados silenciosamente sob carga concorrente.

---

# 2. Panorama Consolidado de Achados

> Achados consolidados e deduplicados de todas as triagens. IDs prefixados com `STF-` (Super Triagem Final).
> Rastreabilidade: coluna "Origem" referencia IDs nas triagens de origem.

| ID          | Domínio                           | Descrição                                                                                                                                                                                               | Sev.    | Tipo | Impacto                                                                                                         | Requisitos Violados            | Origem                                                              | Status Arq.          |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------- | -------------------- |
| **STF-001** | Multi-tenant / Middleware         | `scopedEvento` compara `req.params.id` (ID do recurso) com `evento_id` do usuário em rotas de item único — acesso concedido ou negado por coincidência numérica                                         | Crítico | BR   | Controle de acesso não-determinístico em todos os domínios                                                      | FR-37, NFR-1, OWASP A01        | T01/CERT-15, T02/C-01, T03/TS-02, T04/C-01, T06/T06-001             | Blocker              |
| **STF-002** | Multi-tenant / Services           | Services de certificados e participantes ignoram filtros injetados por `scopedEvento` em listagens — middleware de segurança sem efeito real                                                            | Crítico | VA   | Multi-tenancy ilusório: `GET /certificados` e `GET /participantes` retornam todos os registros do sistema       | FR-37, NFR-1, NFR-6            | T01/CERT-01, T02/C-14, T03/TS-03, T04/C-03, T06/T06-001, T07/T07-05 | Blocker              |
| **STF-003** | Multi-tenant / SSR                | Handlers SSR de certificados (`detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar`) sem verificação de ownership de evento                                                              | Crítico | VU   | Gestor/monitor acessa e altera certificados de qualquer evento via URL direta                                   | FR-37, NFR-1                   | T01/CERT-02, T02/C-17, T04/C-02, T06/T06-012                        | Blocker              |
| **STF-004** | Multi-tenant / Participantes API  | `GET /participantes` lista todos os participantes do sistema sem filtro de evento                                                                                                                       | Crítico | VU   | Vazamento massivo de PII (nome, email, instituição) entre todos os tenants                                      | FR-37, NFR-1, OWASP A01        | T01/CERT-04, T03/PA-01                                              | Blocker              |
| **STF-005** | Integridade / Validator           | Validator Zod de criação de certificado remove `valores_dinamicos` silenciosamente; service rejeita a criação com HTTP 422 — fluxo central de emissão inoperante via API                                | Crítico | BR   | Emissão de certificados com campos dinâmicos impossível via API REST                                            | FR-20, FR-54, NFR-6            | T01/CERT-08, T03/TC-01                                              | Blocker              |
| **STF-006** | Segurança / Configuração          | `SESSION_SECRET=changeme-em-producao` hardcoded em `docker-compose.yml`                                                                                                                                 | Crítico | VU   | Comprometimento total de sessões SSR; qualquer actor com acesso ao repo pode forjar cookies de sessão           | NFR-3, OWASP A05               | T06/T06-003                                                         | Emergencial          |
| **STF-007** | RBAC / API                        | `DELETE /eventos/:id`, `PUT /eventos/:id` e `POST /eventos` usam `rbac('monitor')` na API — SSR restringe corretamente a `rbac('admin')`                                                                | Crítico | VU   | Gestores e monitores podem deletar e atualizar eventos via API REST sem autorização                             | FR-34, NFR-1                   | T02/C-02, T06/T06-002, T07/T07-08                                   | Emergencial          |
| **STF-008** | Integridade / Certificados        | `certificadoService.create()` não valida que `tipo.evento_id === data.evento_id` — certificado pode cruzar tipo de evento A com evento B                                                                | Crítico | BR   | Mistura de estrutura de dados entre eventos distintos; PDF gerado com schema incorreto                          | FR-21, FR-45                   | T03/TC-02, T07/T07-01                                               | Emergencial          |
| **STF-009** | Integridade / Certificados        | `count()` com `paranoid: true` exclui soft-deletados; próximo código incremental colide com certificado ativo após qualquer soft delete; simultâneo-concorrente gera colisão                            | Crítico | BR   | `UniqueConstraintError` após soft delete; serviço de emissão inoperante em cenários reais                       | FR-52, NFR-4                   | T01/CERT-12, T04/C-17-C-18, T07/T07-02-T07-04                       | Emergencial          |
| **STF-010** | Segurança / XSS                   | `{{{json certificado.valores_dinamicos}}}` e `{{{json tipo.dados_dinamicos}}}` emitidos sem escape em contexto `<script>` via triple-mustache; ausência de CSP                                          | Crítico | VU   | XSS stored executável no painel admin; comprometimento de sessão de qualquer usuário autenticado                | NFR-1, OWASP A03, A05          | T04/C-04-C-05-C-06                                                  | Emergencial          |
| **STF-011** | Público / Rate Limiting           | Ausência total de rate limiting em todas as seis rotas públicas de certificados (API e SSR)                                                                                                             | Crítico | VU   | Brute force irrestrito, scraping de e-mails, enumeração de PDFs, DoS por geração intensiva de PDF               | NFR-1, MS-4 (sem FR)           | T05/T05-VU-001                                                      | Emergencial          |
| **STF-012** | Público / IDOR                    | `GET /api/certificados/:id/pdf` aceita qualquer ID sequencial sem autenticação; IDs são PKs auto-incrementais                                                                                           | Crítico | VU   | Enumeração completa de todos os PDFs do sistema por iteração sequencial (IDOR)                                  | FR-42, NFR-1, OWASP A01        | T04/C-11, T05/T05-VU-003                                            | Emergencial          |
| **STF-013** | Autenticação / Segurança          | Cookie JWT SSR sem flag `secure`; cookie de sessão sem `secure`, `httpOnly`, `sameSite` explícitos                                                                                                      | Alto    | VU   | Cookies transmitíveis por HTTP em produção; interceção em trânsito (OWASP A02)                                  | NFR-1, NFR-3                   | T02/C-03, T06/T06-007-T06-015                                       | Emergencial          |
| **STF-014** | Autenticação / RBAC               | Login SSR (`POST /login`) sem rate limiting; apenas API protegida                                                                                                                                       | Alto    | GI   | Endpoint de autenticação web vulnerável a brute force irrestrito                                                | FR-55, NFR-1                   | T02/C-05, T06/T06-004                                               | Emergencial          |
| **STF-015** | RBAC / API                        | `DELETE /participantes/:id` e `POST /participantes/:id/restore` com `rbac('monitor')`; SSR sem rbac algum                                                                                               | Alto    | VU   | Monitores deletam e restauram participantes; rotas SSR sem proteção de perfil                                   | FR-35, FR-36, NFR-1            | T03/PA-02, T07/T07-07-T07-10                                        | Emergencial          |
| **STF-016** | RBAC / API                        | `POST /certificados/:id/restore` usa `rbac('monitor')` na API; SSR exige `rbac('admin')` — contradiz FR-22                                                                                              | Alto    | IP   | Monitores restauram certificados cancelados via API contornando restrição da SSR                                | FR-22, NFR-1                   | T01/CERT-07, T03/TC-08, T07/T07-09                                  | Emergencial          |
| **STF-017** | RBAC / SSR                        | SSR `POST /admin/certificados` usa `rbac('gestor')`, bloqueando monitores de criar certificados                                                                                                         | Alto    | IP   | Monitores não podem criar certificados pela interface web; contradiz FR-36                                      | FR-36                          | T02/C-06, T03/TC-09                                                 | Emergencial          |
| **STF-018** | Segurança / PII                   | `console.log('PDFService certificado:', certificado)` expõe PII completo em logs de produção a cada geração de PDF                                                                                      | Alto    | VU   | Dados pessoais em stdout/logs; violação LGPD e OWASP A09                                                        | NFR-1, OWASP A09               | T04/C-12, T05/T05-VU-009, T06/T06-008                               | Emergencial          |
| **STF-019** | Público / Certificados cancelados | Endpoints de validação pública retornam `valido: true` para certificados `cancelado`; download de PDF não é bloqueado                                                                                   | Alto    | BR   | Certificados cancelados apresentados como autênticos ao público                                                 | FR-24, FR-42, FR-19            | T05/T05-VU-002                                                      | Emergencial          |
| **STF-020** | Segurança / Autenticação          | `req.usuario` tem contratos incompatíveis entre API (instância Sequelize com `getEventos()`) e SSR (POJO sem métodos); `email` e `isMonitor` ausentes no SSR                                            | Alto    | VA   | Middlewares de autorização não reutilizáveis em SSR; HTTP 500 latente; `isMonitor` nunca verdadeiro em produção | FR-37, NFR-6                   | T01/CERT-16, T02/C-07, T03/TS-01, T06/T06-005                       | Blocker              |
| **STF-021** | Constraint / Migrations           | Constraint `UNIQUE(codigo, evento_id)` em `tipos_certificados` é FULL na migration mas partial no model — drift entre produção e testes; restauração após soft delete bloqueia por constraint violation | Crítico | BR   | FR-11 violado em produção; restauração de tipos inoperante                                                      | FR-11, NFR-4, NFR-5            | T03/TC-06, T07/T07-03                                               | Emergencial          |
| **STF-022** | Integridade / Transações          | Zero uso de `sequelize.transaction()` em qualquer service; operações compostas são não-atômicas                                                                                                         | Alto    | DT   | Estados intermediários inválidos em falhas; race conditions sistêmicas                                          | NFR-4                          | T07/T07-18                                                          | Blocker              |
| **STF-023** | Público / Vazamento               | E-mail do participante exposto na view SSR de resultado de validação pública; combinado com código previsível permite scraping                                                                          | Alto    | VU   | Coleta massiva de e-mails de participantes sem autenticação; LGPD                                               | NFR-1, FR-25, LGPD             | T05/T05-VU-005                                                      | Emergencial          |
| **STF-024** | Público / Resposta HTTP           | `detalhe: err.message` exposto em respostas HTTP 500 do endpoint público de PDF                                                                                                                         | Alto    | VU   | Vaza paths R2, nomes de bucket, endpoints de storage; reconhecimento de topologia interna                       | NFR-1, OWASP A05               | T05/T05-VU-008                                                      | Emergencial          |
| **STF-025** | Arquitetura / Usuário             | `usuarioService.js` ausente; toda a lógica de usuário (JWT, bcrypt, associação N:N) reside no controller                                                                                                | Alto    | VA   | Violação de NFR-6; CRUD de usuários não reutilizável; único domínio sem service                                 | NFR-6                          | T02/C-08                                                            | Blocker              |
| **STF-026** | Multi-tenant / Tipos SSR          | `tiposCertificadosSSRController.index()` usa `whereAtivos = {}` — `eventosIds` obtido mas nunca aplicado; listagem exibe tipos de todos os eventos                                                      | Alto    | BR   | Isolamento multi-tenant violado na listagem de tipos via SSR                                                    | FR-37, FR-46                   | T03/TC-03, T07/T07-06                                               | Emergencial          |
| **STF-027** | Multi-tenant / Tipos API          | `TiposCertificadosController.findAll()` ignora `req.filtro.eventoId` — tipos de todos os eventos retornados via API                                                                                     | Alto    | BR   | Isolamento multi-tenant violado na listagem de tipos via API                                                    | FR-37, FR-46, NFR-1            | T02/C-15, T03/TC-11, T07/T07-05, T06/T06-014                        | Emergencial          |
| **STF-028** | UI / Bug                          | Link de download PDF no painel admin (`/public/certificados/:id/pdf`) aponta para rota inexistente; correto: `/api/certificados/:id/pdf`                                                                | Alto    | BR   | Download de PDF sempre HTTP 404 para usuários autenticados no painel admin                                      | FR-42                          | T04/C-15, T05/T05-BR-001                                            | Emergencial          |
| **STF-029** | UI / Bug                          | Alias Sequelize `TiposCertificado` (singular) no `certificadoSSRController.detalhe` diverge do alias `TiposCertificados` (plural) declarado no model; texto interpolado sempre vazio                    | Alto    | BR   | Texto do certificado nunca exibido no detalhe SSR; FR-39 não atendido                                           | FR-39                          | T01/CERT-10, T03/TC-07, T04/C-16, T07/T07-11                        | Emergencial          |
| **STF-030** | Validator / URL                   | `url_template_base` validado como `z.string().url()` por Zod, mas campo armazena key R2 relativa (ex: `templates/cbie/2026/base.jpg`) — nenhuma key válida passa pela API                               | Alto    | BR   | Upload de template e configuração de R2 impossíveis via API REST                                                | FR-44                          | T02/C-24, T04/C-29                                                  | Emergencial          |
| **STF-031** | Segurança / Configuração          | `JWT_SECRET` ausente do `docker-compose.yml` de produção; `SESSION_SECRET` ausente do `.env.example`                                                                                                    | Alto    | GI   | Startup falha de forma não documentada; onboarding inseguro                                                     | NFR-3                          | T06/T06-032, T06/T06-024                                            | Emergencial          |
| **STF-032** | Segurança / RBAC                  | Rotas de criação de usuários (`usuarios-crud.js`) sem `rbac` na cadeia de middlewares; enforcement apenas no controller                                                                                 | Alto    | VU   | Qualquer usuário autenticado pode tentar criar usuário admin violando defense-in-depth                          | FR-34, FR-38, NFR-1, NFR-6     | T06/T06-009                                                         | Emergencial          |
| **STF-033** | Autenticação / Enumeração         | Login API retorna mensagens distintas: "Usuário não encontrado" vs. "Senha inválida" — user enumeration (OWASP A07)                                                                                     | Médio   | VU   | Atacante confirma quais e-mails estão cadastrados sem autenticação                                              | NFR-1, OWASP A07               | T02/C-04                                                            | Backlog curto prazo  |
| **STF-034** | Segurança / Senha                 | Política de senha forte (`senhaForteSchema`) aplicada apenas em self-service; criação de usuário via API aceita senhas fracas                                                                           | Alto    | IP   | FR-57 e NFR-2 não cumpridos na criação via API                                                                  | FR-57, NFR-2                   | T02/C-20, T06/T06-010, T07/T07-14                                   | Emergencial          |
| **STF-035** | Dashboard / Bug                   | `ultimosCertificados` computado e enviado ao template, mas não há `{{#each}}` no `dashboard.hbs` — feature ausente na view; backlog marcado como concluído equivocadamente                              | Crítico | IP   | FR-56 não atendido; dados processados sem uso; backlog com estado incorreto                                     | FR-56                          | T03/DB-03, T03/DB-04                                                | Emergencial          |
| **STF-036** | Dashboard / Bug                   | `isMonitor` nunca definido em `authSSR.js`; toda lógica condicional de view baseada em `{{usuario.isMonitor}}` inefetiva                                                                                | Médio   | BR   | Interface de monitor não diferenciada; testes simulam estado irreal                                             | -                              | T03/DB-02                                                           | Backlog curto prazo  |
| **STF-037** | Multi-tenant / Participantes SSR  | Operações SSR de participantes por ID (editar, atualizar, deletar, restaurar) sem verificação de escopo de evento                                                                                       | Alto    | VU   | Gestor/monitor edita ou deleta participante de outro evento via SSR                                             | FR-37, NFR-1                   | T03/PA-03                                                           | Emergencial          |
| **STF-038** | UX / Bug                          | JOIN em `Certificado` na listagem SSR de participantes torna invisíveis participantes sem certificados do evento do usuário                                                                             | Alto    | GI   | Violação de FR-36 e FR-49; participantes cadastrados desaparecem da listagem                                    | FR-36, FR-49                   | T03/PA-04                                                           | Backlog curto prazo  |
| **STF-039** | Constraints / Email               | Índice UNIQUE de `email` em `participantes` e `usuarios` sem `WHERE deleted_at IS NULL`; recriação de usuário/participante com mesmo e-mail após soft delete impossível                                 | Médio   | IP   | Contradiz semântica de NFR-4 (soft delete + restauração)                                                        | FR-2, FR-27, NFR-4             | T07/T07-20                                                          | Backlog curto prazo  |
| **STF-040** | Integridade / FK                  | FK `ON DELETE CASCADE` em `certificados` para entidades soft-deletáveis; hard delete de parent (por script DBA) apagaria certificados permanentemente                                                   | Alto    | DT   | NFR-4 vulnerável a operações fora do ORM                                                                        | NFR-4                          | T07/T07-16                                                          | Backlog médio prazo  |
| **STF-041** | Integridade / Cascade             | Soft delete de evento não cascateia para `TiposCertificados` e `Certificado`; entidades filhas permanecem ativas                                                                                        | Médio   | GI   | Tipos e certificados de evento deletado aparecem como ativos                                                    | FR-9, NFR-4                    | T07/T07-23                                                          | Backlog médio prazo  |
| **STF-042** | Integridade / Cascade             | Soft delete de participante não cascateia para certificados; certificados ficam com participante nulo no ORM; PDF gerado pode ter nome vazio                                                            | Médio   | GI   | Violação de integridade semântica                                                                               | FR-4, NFR-4                    | T07/T07-24                                                          | Backlog médio prazo  |
| **STF-043** | Integridade / Cascade             | `eventoService.restore()` restaura todos os `UsuarioEvento` soft-deletados do evento, incluindo vínculos de usuários removidos intencionalmente e usuários já soft-deletados                            | Médio   | GI   | Ghost access reestabelecido; violação de integridade semântica                                                  | FR-32, NFR-4                   | T06/T06-020, T07/T07-21-T07-31                                      | Backlog médio prazo  |
| **STF-044** | Constraints / usuario_eventos     | Ausência de constraint UNIQUE `(usuario_id, evento_id)` no banco; duplicatas silenciosas possíveis por concorrência ou scripts                                                                          | Alto    | GI   | RBAC assume unicidade por combinação; vínculos duplos quebram scoping                                           | FR-32                          | T06/T06-016, T07/T07-15                                             | Backlog médio prazo  |
| **STF-045** | Segurança / Session               | `express-session` usando MemoryStore em produção; biblioteca emite warning; sessões perdidas em restart                                                                                                 | Alto    | DT   | OOM com alta carga; perda de sessões em restart de pod                                                          | NFR-3                          | T06/T06-011                                                         | Backlog médio prazo  |
| **STF-046** | Arquitetura / Rotas               | Lógica de busca pública (validação, consulta, PDF) implementada diretamente nas rotas `api.js` e `public.js` sem controller ou service                                                                  | Alto    | VA   | Violação de NFR-6; duplicação de lógica em três handlers; impossibilidade de aplicar regras transversais        | NFR-6                          | T05/T05-VA-001                                                      | Backlog curto prazo  |
| **STF-047** | Arquitetura / Rotas               | Lógica de geração de PDF inline na rota `api.js` e `certificadoSSRController.cancelar` bypassando `certificadoService.cancel()` diretamente no model                                                    | Médio   | VA   | Violação de NFR-6; duplicação; mudanças no service não propagadas                                               | NFR-6                          | T04/C-33-C-34                                                       | Backlog médio prazo  |
| **STF-048** | Arquitetura / RBAC                | RBAC de eventos (`POST /eventos`) sem `rbac('admin')`; proteção colateral dependente de `scopedEvento` — não-declarativa e frágil                                                                       | Médio   | VA   | Proteção de criação de evento não-determinística; violação de defense-in-depth                                  | FR-34, NFR-6                   | T02/C-11, T06/T06-002                                               | Backlog curto prazo  |
| **STF-049** | Segurança / Swagger               | Swagger exposto em `/api-docs` sem autenticação em qualquer ambiente, incluindo produção                                                                                                                | Médio   | IP   | Facilita reconhecimento de endpoints admin por atacantes; OWASP A01                                             | NFR-1                          | T06/T06-019                                                         | Backlog médio prazo  |
| **STF-050** | Público / Código previsível       | Código de certificado (`CODIGO_BASE-YY-TIPO-N`) é sequencial e previsível; permite enumeração sistemática                                                                                               | Alto    | VU   | Varredura de todos os certificados de um evento por iteração de N; combina com STF-011 e STF-023                | FR-52, NFR-1                   | T05/T05-VU-004                                                      | Backlog curto prazo  |
| **STF-051** | Público / GI                      | `GET /api/validar/:codigo` não inclui associações (Participante, Evento, Tipos) enquanto SSR inclui; contratos divergentes para mesma operação                                                          | Médio   | GI   | API pública de validação semanticamente incompleta                                                              | FR-24                          | T05/T05-GI-003                                                      | Backlog médio prazo  |
| **STF-052** | Público / GI                      | Respostas públicas de validação e consulta retornam objetos Sequelize brutos com IDs internos, `deleted_at`, FKs                                                                                        | Alto    | GI   | Vaza estrutura interna do banco; IDs permitem mapeamento de outros endpoints admin                              | FR-24, FR-23, NFR-1, OWASP A01 | T05/T05-GI-001-T05-GI-002                                           | Backlog curto prazo  |
| **STF-053** | Upload / Storage                  | Upload de arquivo R2 realizado antes da validação do evento; falha posterior gera arquivo órfão imediato; arquivos anteriores nunca removidos ao atualizar template                                     | Alto    | BR   | Acumulação ilimitada de arquivos órfãos no R2                                                                   | FR-51                          | T04/C-08-C-09                                                       | Backlog curto prazo  |
| **STF-054** | Upload / Segurança                | Validação de MIME type por `file.mimetype` (declarado pelo cliente); ausência de verificação de magic bytes                                                                                             | Alto    | VU   | Arquivo malicioso disfarçado de imagem passa na validação e é persistido no R2                                  | NFR-11, OWASP A04              | T04/C-10                                                            | Backlog curto prazo  |
| **STF-055** | Upload / R2                       | Credenciais R2 sem validação de startup; aplicação sobe sem R2 funcional; falha silenciosa apenas em runtime                                                                                            | Alto    | GI   | Diagnóstico difícil; diverge do padrão fail-fast estabelecido para JWT_SECRET                                   | NFR-3                          | T04/C-07, T06/T06-023                                               | Backlog curto prazo  |
| **STF-056** | Upload / Slug                     | Slug derivado do nome do evento pode ser vazio; dois eventos com nome similar compartilham e sobrescrevem key R2                                                                                        | Médio   | BR   | Sobreescrita silenciosa de template de outro evento                                                             | FR-51                          | T04/C-19                                                            | Backlog curto prazo  |
| **STF-057** | Público / Validação               | `GET /api/validar/:codigo` não valida formato do código; SSR aplica REGEX; inconsistência de defesa em profundidade                                                                                     | Alto    | VU   | Strings arbitrárias chegam ao ORM via API                                                                       | NFR-1, OWASP A03               | T05/T05-VU-006                                                      | Backlog curto prazo  |
| **STF-058** | Público / Validação               | `POST /validar` (SSR) não aplica `CODIGO_CERTIFICADO_REGEX` definido no mesmo arquivo; API e SSR com POST aceitam formatos rejeitados pelo GET                                                          | Médio   | IP   | Inconsistência interna na mesma superfície                                                                      | NFR-1, FR-24                   | T05/T05-IP-001                                                      | Backlog curto prazo  |
| **STF-059** | Autenticação / Backdoor           | Backdoor `x-mock-user` em `authSSR` para `NODE_ENV=test`; JSON parse sem validação de schema                                                                                                            | Alto    | AM   | Identidade forjável sem autenticação se `NODE_ENV=test` vazar para produção                                     | NFR-1, NFR-8                   | T06/T06-018                                                         | Validação Humana     |
| **STF-060** | Autenticação / JWT                | `JWT_SECRET` sem validação de fail-fast em `routes/auth.js` e `authSSR.js`; falha ocorre apenas em runtime                                                                                              | Alto    | VU   | Startup sem erro; falha em runtime no primeiro uso de JWT                                                       | NFR-3                          | T06/T06-006                                                         | Emergencial          |
| **STF-061** | Autenticação / JWT                | `JWT_SECRET` fraco/previsível no `docker-compose.test.yml` (idêntico ao `.env.example`)                                                                                                                 | Alto    | VU   | Tokens JWT de testes forjáveis; risco de reutilização em produção                                               | NFR-3, NFR-8                   | T06/T06-013                                                         | Backlog curto prazo  |
| **STF-062** | Autenticação / Logout             | Logout API e SSR não sincronizados; token JWT permanece válido até 1h após logout SSR                                                                                                                   | Médio   | VH   | JWT inválido logicamente continua válido tecnicamente                                                           | FR-30 (implícito)              | T06/T06-030                                                         | Validação Humana     |
| **STF-063** | Autenticação / Ownership          | `tiposCertificadosOwnership` captura `POST /:id/restore` como criação; `evento_id` undefined → HTTP 403 sistemático para restauração                                                                    | Médio   | BR   | Gestores legítimos não conseguem restaurar tipos via API                                                        | FR-35, FR-46                   | T06/T06-021                                                         | Backlog curto prazo  |
| **STF-064** | Integridade / Participante        | `certificadoSSRController.novo()` lista todos os eventos, todos os tipos e todos os participantes sem filtro de escopo                                                                                  | Médio   | BR   | Monitor/gestor pode selecionar combinação inválida; ativa STF-008                                               | FR-37, FR-45                   | T01/CERT-03, T03/TC-12, T06/T06-022, T07/T07-22                     | Backlog curto prazo  |
| **STF-065** | Integridade / Update              | `certificadoService.update()` não revalida `valores_dinamicos` contra `dados_dinamicos` do tipo — update pode persistir campos faltantes                                                                | Alto    | GI   | Certificados com campos dinâmicos incompletos; PDF com placeholders não substituídos                            | FR-54, FR-20                   | T07/T07-17                                                          | Backlog médio prazo  |
| **STF-066** | Integridade / FK                  | `certificadoService.create()` não valida existência de `participante_id`; ID inexistente gera FK violation com HTTP 500 e stack trace exposto                                                           | Alto    | BR   | Exposição de erro técnico ao cliente                                                                            | FR-21, NFR-6                   | T07/T07-13                                                          | Backlog curto prazo  |
| **STF-067** | Integridade / Status              | Ausência de máquina de estados para `status` do certificado; qualquer transição aceita (cancelado → emitido) sem validação                                                                              | Médio   | GI   | Certificados cancelados podem ser reemitidos sem auditoria                                                      | FR-19                          | T07/T07-25                                                          | Backlog médio prazo  |
| **STF-068** | SRS / Ambiguidade                 | FR-44 internamente contraditório: "URL válida" vs "key no R2"; ambiguidade gerou bug real no validator Zod (STF-030)                                                                                    | Médio   | ID   | Implementação divergente entre API (URL) e SSR (key relativa)                                                   | FR-44                          | T02/C-37, T04/C-29                                                  | Atualização SRS      |
| **STF-069** | SRS / Ambiguidade                 | FR-24 não define comportamento de validação pública para certificados `cancelado` e `pendente`; ambiguidade gerou BR (STF-019)                                                                          | Alto    | AM   | Comportamento de certificados cancelados indeterminado sem decisão de produto                                   | FR-24, FR-19                   | T05/T05-AM-001                                                      | Atualização SRS + VH |
| **STF-070** | SRS / Duplicação                  | FR-23 e FR-53 são duplicatas sem diferenciação semântica                                                                                                                                                | Baixo   | ID   | Rastreabilidade comprometida                                                                                    | FR-23, FR-53                   | T05/T05-AM-003                                                      | Atualização SRS      |
| **STF-071** | SRS / Lacuna                      | FR-30 documenta `POST /auth/login`; implementação usa `POST /login`                                                                                                                                     | Baixo   | ID   | Documentação de rota incorreta no SRS                                                                           | FR-30                          | T02/C-38, T06/T06-025                                               | Atualização SRS      |
| **STF-072** | SRS / Lacuna                      | MS-4 menciona rate limiting para rotas públicas sem FR correspondente; lacuna é invisível no backlog formal                                                                                             | Baixo   | ID   | Vulnerabilidade STF-011 sem FR rastreável                                                                       | -                              | T05/T05-ID-001                                                      | Atualização SRS      |
| **STF-073** | DT / Migrations                   | Down migration de `certificados` não remove ENUM `enum_certificados_status`; orphan type em rollback                                                                                                    | Médio   | IP   | Inconsistência entre ambientes após rollback                                                                    | NFR-5                          | T07/T07-33                                                          | Backlog médio prazo  |
| **STF-074** | DT / Arquitetura                  | Lógica de ownership (`getEventosIds`, `temOwnership`) duplicada no `tiposCertificadosSSRController` e no middleware `tiposCertificadosOwnership`                                                        | Médio   | DT   | Regras de negócio em dois lugares; divergência já ocorrida                                                      | NFR-6                          | T03/TC-13                                                           | Backlog médio prazo  |
| **STF-075** | DT / Model                        | `campo_destaque` validado por hook `beforeValidate` no Sequelize (lança `Error` genérico não `ValidationError`); Zod valida apenas `min(1)`                                                             | Médio   | VA   | Validação de entrada retorna erro de persistência; UX degradada; violação NFR-6                                 | FR-14, NFR-6                   | T03/TC-14, T07/T07-26                                               | Backlog médio prazo  |
| **STF-076** | DT / PDF                          | Anti-pattern `new Promise(async (resolve, reject) => {...})` em `pdfService`; lazy `require('./r2Service')` para evitar dependência circular                                                            | Médio   | DT   | Possibilidade de unhandled promise rejection silenciosa; dependência circular latente                           | -                              | T04/C-37-C-39, T05/T05-DT-002-T05-DT-003                            | Backlog longo prazo  |
| **STF-077** | DT / R2                           | `r2Service.getFile` sem timeout; indisponibilidade do R2 causa hang indefinido na geração de PDF                                                                                                        | Médio   | DT   | Requests pendentes acumulam sob degradação do R2; sem circuit breaker                                           | -                              | T04/C-25                                                            | Backlog médio prazo  |
| **STF-078** | DT / Migração                     | Migration `20260418232720` remove constraint global de `tipos_certificados.codigo` por nome fixo; se nome diferir no banco, constraint global persiste junto ao composto                                | Médio   | ID   | Em certos ambientes, dois tipos com mesmo código em eventos distintos são bloqueados                            | FR-11                          | T07/T07-27                                                          | Backlog curto prazo  |
| **STF-079** | DT / Histórico                    | `eventoService.destroy()` é método órfão com semântica divergente de `eventoService.delete()`; não é chamado por nenhum controller                                                                      | Baixo   | DT   | Risco de confusão em manutenção                                                                                 | NFR-6                          | T02/C-35, T06/T06-026                                               | Backlog longo prazo  |
| **STF-080** | DT / Sessão                       | Cookie de sessão sem configuração explícita de `secure`, `httpOnly`, `sameSite`, `maxAge`; dependência de defaults da biblioteca                                                                        | Médio   | DT   | Proteção baseada em comportamento default de terceiro; frágil a atualizações                                    | NFR-1, NFR-3                   | T06/T06-015                                                         | Backlog médio prazo  |

---

# 3. Problemas Sistêmicos Transversais

## PST-01 — Estratégia de Enforcement de Multi-Tenancy Semanticamente Incorreta

**Domínios afetados:** Certificados (API e SSR), Participantes (API e SSR), Tipos de Certificados (API e SSR), Eventos, Dashboard

**Auditorias:** T01/CERT-15, T02/C-01-C-14, T03/TS-02-TS-03, T04/C-01-C-02-C-03, T06/T06-001, T07/T07-05-T07-06

**Descrição:**

O sistema utiliza o middleware `scopedEvento` como o único mecanismo de isolamento multi-tenant. Este middleware apresenta **dois defeitos arquiteturais simultâneos**:

**Defeito 1 — Confusão de IDs em rotas de recurso único:** Para rotas como `GET /certificados/:id`, `PUT /certificados/:id`, `DELETE /participantes/:id`, o `scopedEvento` resolve `evento_id` como `req.params.id` — que contém o ID **do recurso**, não do evento. O middleware compara esse valor contra o array de `evento_id`s do usuário. O resultado é: acesso concedido erroneamente se o ID do recurso coincide com um evento vinculado ao usuário; acesso bloqueado erroneamente se não coincide. O controle de acesso item-level é determinado por **coincidência numérica**, não por regra de negócio.

**Defeito 2 — Services ignoram filtros de listagem:** O middleware injeta `evento_id` em `req.query` para listagens. Os services (`certificadoService.findAll`, `participanteService.findAll`, `tiposCertificadosService.findAll`) **não consomem esse campo**. A "proteção" de escopo em listagens é completamente ilusória.

**Impacto:** As proteções de multi-tenancy declaradas no SRS e implementadas como middleware não produzem enforcement real em nenhum dos domínios auditados. Qualquer gestor ou monitor autenticado pode acessar dados de qualquer evento do sistema.

---

## PST-02 — Assimetria Estrutural de `req.usuario` entre API e SSR

**Domínios afetados:** Autenticação, Certificados, Participantes, Tipos, Dashboard, Eventos

**Auditorias:** T01/CERT-16, T02/C-07, T03/TS-01, T06/T06-005, T06/T06-028

**Descrição:**

O middleware `auth` (API) popula `req.usuario` com uma **instância Sequelize** que inclui métodos como `getEventos()`, o campo `email` e `isMonitor`. O middleware `authSSR` (SSR) popula `req.usuario` como um **plain object (POJO)** sem métodos, sem `email` e sem `isMonitor`.

Consequências documentadas:

- `scopedEvento` e `tiposCertificadosOwnership` dependem de `req.usuario.getEventos()` — inaplicáveis em SSR; qualquer uso em SSR gera HTTP 500.
- Controllers SSR reimplementam a lógica de escopo ad hoc via `UsuarioEvento.findAll()` diretamente, triplicando a lógica de domínio.
- `isMonitor` nunca é verdadeiro em produção SSR — toda lógica condicional de view baseada nesse flag é inefetiva.
- O campo `email` é inacessível em contexto SSR.

**Impacto:** Impossibilidade arquitetural de reutilizar middlewares de autorização entre API e SSR. Controllers SSR mantêm cópias de lógica de escopo com risco crescente de divergência.

---

## PST-03 — RBAC Assimétrico e Inconsistente entre API REST e SSR

**Domínios afetados:** Eventos, Certificados, Participantes, Tipos, Usuários

**Auditorias:** T01/CERT-07, T02/C-02-C-06, T03/PA-02-TC-08-TC-09, T06/T06-002, T07/T07-07-T07-10

**Descrição:**

Para as mesmas operações, a API REST aplica perfis RBAC sistematicamente mais permissivos que a SSR, sem justificativa documentada no SRS:

| Operação                     | API REST         | SSR          | SRS/Correto       |
| ---------------------------- | ---------------- | ------------ | ----------------- |
| DELETE/PUT/POST eventos      | `monitor`        | `admin`      | `admin`           |
| DELETE/restore participantes | `monitor`        | _(sem rbac)_ | `gestor`          |
| Restore certificados         | `monitor`        | `admin`      | `admin` (FR-22)   |
| Criar certificados           | `monitor`        | `gestor`     | `monitor` (FR-36) |
| Listar/criar usuários        | sem rbac na rota | `admin`      | `admin`           |

A API é sistematicamente mais permissiva onde deveria ser equivalente ou mais restritiva. A SSR tem falhas opostas: rotas de participantes sem nenhum `rbac()`, criação de certificados bloqueando monitors.

**Impacto:** Privilege escalation via API REST em múltiplos domínios. Monitores inadvertidamente bloqueados de operações autorizadas pelo SRS via SSR.

---

## PST-04 — Ausência de Atomicidade Transacional

**Domínios afetados:** Certificados, Eventos, Participantes

**Auditorias:** T07/T07-18, T07/T07-02-T07-04, T07/T07-21

**Descrição:**

O sistema possui **zero chamadas a `sequelize.transaction()`** em qualquer service. Operações compostas como:

- Geração de código + criação de certificado (race condition → colisão de `codigo`)
- Soft delete de evento + soft delete de `UsuarioEvento`
- Restore de evento + restore de `UsuarioEvento`

...são executadas como operações independentes sem garantia de atomicidade.

**Impacto:** Estados intermediários inválidos em falhas; race conditions determinísticas sob carga concorrente; código de certificado colide após soft delete (STF-009); restauração cria vínculos ghost (STF-043).

---

## PST-05 — Lógica de Negócio Residindo em Rotas e Controllers

**Domínios afetados:** PDF, Autenticação, Dashboard, Usuários, Templates

**Auditorias:** T02/C-08, T03/DB-10, T04/C-34-C-35, T05/T05-VA-001, T06/T06-009

**Descrição:**

Múltiplos domínios violam NFR-6 (routes → controllers → services → models):

- Lógica de PDF e busca pública inline em `routes/api.js` e `routes/public.js`
- `usuarioService.js` ausente; lógica de JWT, bcrypt e associação N:N no controller
- Lógica de upload e geração de key R2 em `eventoSSRController`
- Queries de agregação pesadas diretamente no `dashboardController`
- RBAC implementado manualmente em `usuarioController.create()` fora do middleware

**Impacto:** Impossibilidade de aplicar regras transversais sem duplicação; lógica de negócio não testável isoladamente; divergências de comportamento entre superfícies decorrentes de implementações independentes.

---

## PST-06 — Cadeia de Enumeração Pública por Encadeamento de Endpoints

**Domínios afetados:** Validação pública, Download, Consulta, Participantes

**Auditorias:** T05/T05-VU-001 a T05-VU-005, T05/PST-02

**Descrição:**

O sistema expõe três vetores de enumeração encadeáveis sem qualquer rate limiting:

**Vetor 1 — Código previsível:**
`código previsível (CODIGO_BASE-YY-TIPO-N, incremental)` → `GET /validar/:codigo` → e-mail do participante na view SSR → `GET /api/certificados?email=` → lista de IDs internos → `GET /api/certificados/:id/pdf` (IDOR)

**Vetor 2 — ID sequencial:**
`id=1,2,3,...` → `GET /api/certificados/:id/pdf` → PDF com nome e dados do evento

**Vetor 3 — E-mail arbitrário:**
`GET /api/certificados?email=` → lista de certificados com IDs internos → PDFs via IDOR

Os três vetores se intersectam, permitindo scraping sistemático de todos os participantes e certificados do sistema sem autenticação e sem obstáculo técnico.

---

# 4. Matriz de Dependências Arquiteturais

## 4.1 Dependências entre Problemas

```
STF-001 (scopedEvento não-determinístico)
  ├─ resolve → STF-002 (services ignoram filtros)  [ambos devem ser corrigidos juntos]
  ├─ bloqueia → STF-003 (SSR sem ownership)         [mesmo domínio — enforcement ausente]
  ├─ bloqueia → STF-004 (participantes sem escopo)  [mesmo padrão — service sem filtro]
  └─ bloqueia → STF-027 (tipos API sem escopo)      [mesma causa raiz]

STF-020 (req.usuario assimétrico)
  ├─ causa → STF-003 (middlewares inaplicáveis em SSR)
  ├─ causa → STF-036 (isMonitor nunca verdadeiro)
  └─ bloqueia → qualquer middleware de autorização em SSR

STF-022 (ausência de transações)
  ├─ causa → STF-009 (colisão de código de certificado)
  └─ expõe → STF-043 (ghost access em restore)

STF-005 (validator remove valores_dinamicos)
  └─ bloqueia → STF-008 (mistura de dados entre eventos)
     └─ depende de → STF-021 (constraint drift tipos)

STF-010 (XSS stored)
  └─ amplificado por → ausência de CSP (mesma evidência)
```

## 4.2 Dependências entre Specs

| Spec Necessária                         | Dependências                             | Bloqueada por                     |
| --------------------------------------- | ---------------------------------------- | --------------------------------- |
| Spec de Enforcement Multi-tenant        | ADR sobre estratégia de scoping          | STF-001, STF-002, STF-020         |
| Spec de Correção RBAC                   | Decisão sobre perfil mínimo por operação | STF-007, STF-015-STF-017, STF-032 |
| Spec de Integridade Transacional        | ADR de transações                        | STF-022                           |
| Spec de Segurança de Endpoints Públicos | VH sobre política de dados expostos      | STF-011, STF-012, STF-050         |
| Spec de Contrato de `req.usuario`       | ADR de autenticação unificada            | STF-020                           |
| Spec de SRS (url_template_base)         | Clarificação do FR-44                    | STF-068                           |

## 4.3 Dependências entre ADRs

```
ADR-MT (Multi-tenancy)
  └─ depende de → ADR-AUTH (contrato req.usuario)
     └─ desbloqueia → todas as specs de scoping

ADR-RBAC (definição canônica de perfis por operação)
  └─ desbloqueia → specs corretivas de RBAC
  └─ elimina → divergências API vs SSR

ADR-TX (transações)
  └─ desbloqueia → spec de integridade de certificados

ADR-PUBLICO (política de exposição pública)
  └─ depende de → VH-01 (comportamento de cancelados)
  └─ desbloqueia → specs de endpoints públicos
```

## 4.4 Dependências entre Domínios

```
Autenticação (STF-020)
  └─ bloqueia → Certificados SSR, Tipos SSR, Participantes SSR, Dashboard

Multi-tenant (STF-001-STF-002)
  └─ bloqueia → Certificados API, Participantes API, Tipos API

Constraints (STF-021, STF-039, STF-044)
  └─ bloqueia → Integridade de dados, Soft delete confiável

Transações (STF-022)
  └─ bloqueia → Emissão de certificados confiável sob carga

Validator (STF-005, STF-030)
  └─ bloqueia → Emissão de certificados via API, Upload de template via API
```

---

# 5. Vulnerabilidades e Riscos Críticos

## 5.1 Multi-tenant

| ID      | Achado                                  | Severidade | Evidência                                                   |
| ------- | --------------------------------------- | ---------- | ----------------------------------------------------------- |
| STF-001 | `scopedEvento` semanticamente incorreto | Crítico    | `scopedEvento.js:31-40`                                     |
| STF-002 | Services ignoram filtros de listagem    | Crítico    | `certificadoService.js:9-23`, `participanteService.js:5-23` |
| STF-003 | SSR sem ownership em operações por ID   | Crítico    | `certificadoSSRController.js:82-269`                        |
| STF-004 | API de participantes sem escopo         | Crítico    | `participanteController.js:13-31`                           |
| STF-026 | Tipos SSR sem filtro de evento          | Alto       | `tiposCertificadosSSRController.js:49-52`                   |
| STF-027 | Tipos API sem filtro de evento          | Alto       | `tiposCertificadosController.js:11-16`                      |
| STF-037 | Participantes SSR por ID sem escopo     | Alto       | `admin.js:88-98`                                            |

## 5.2 RBAC

| ID      | Achado                                            | Severidade | Evidência                             |
| ------- | ------------------------------------------------- | ---------- | ------------------------------------- |
| STF-007 | Gestores/monitores deletam eventos via API        | Crítico    | `routes/eventos.js:router.delete/put` |
| STF-015 | Monitores deletam participantes; SSR sem proteção | Alto       | `routes/participantes.js:140,150`     |
| STF-016 | Monitores restauram certificados via API          | Alto       | `routes/certificados.js:218`          |
| STF-017 | Monitors bloqueados de criar certificados via SSR | Alto       | `routes/admin.js:68`                  |
| STF-032 | Criação de usuário sem `rbac` na rota             | Alto       | `routes/usuarios-crud.js:10-19`       |

## 5.3 Ownership

| ID      | Achado                                                               | Severidade | Evidência                             |
| ------- | -------------------------------------------------------------------- | ---------- | ------------------------------------- |
| STF-008 | Certificado pode cruzar tipo de evento A com evento B                | Crítico    | `certificadoService.js:36-40`         |
| STF-063 | Gestores não conseguem restaurar tipos via API                       | Médio      | `tiposCertificadosOwnership.js:41-47` |
| STF-064 | Formulário SSR de novo certificado lista todos os eventos sem filtro | Médio      | `certificadoSSRController.js:novo()`  |

## 5.4 Integridade

| ID      | Achado                                                  | Severidade | Evidência                            |
| ------- | ------------------------------------------------------- | ---------- | ------------------------------------ |
| STF-009 | Colisão de código após soft delete e em concorrência    | Crítico    | `certificadoService.js:63-77`        |
| STF-021 | Constraint drift: full vs partial em tipos_certificados | Crítico    | `migrations/20260418232720` vs model |
| STF-022 | Ausência total de transações                            | Alto       | grep zero ocorrências                |
| STF-005 | Validator remove `valores_dinamicos`                    | Crítico    | `validators/certificado.js`          |

## 5.5 Vazamento de dados / Informações

| ID      | Achado                                                          | Severidade | Evidência                     |
| ------- | --------------------------------------------------------------- | ---------- | ----------------------------- |
| STF-018 | PII em logs a cada geração de PDF                               | Alto       | `pdfService.js:16`            |
| STF-023 | E-mail do participante na view pública de validação             | Alto       | `validar-resultado.hbs:20-21` |
| STF-024 | `err.message` em resposta HTTP 500 pública de PDF               | Alto       | `routes/api.js:70-73`         |
| STF-052 | Objetos Sequelize brutos com IDs internos em respostas públicas | Alto       | `routes/api.js:121,167`       |

## 5.6 PDFs públicos e enumeração

| ID      | Achado                                                    | Severidade | Evidência                           |
| ------- | --------------------------------------------------------- | ---------- | ----------------------------------- |
| STF-012 | IDOR via ID sequencial em `GET /api/certificados/:id/pdf` | Crítico    | `routes/api.js:43`                  |
| STF-050 | Código de certificado previsível e enumerável             | Alto       | `certificadoService.js:63-70`       |
| STF-011 | Ausência de rate limiting em todas as rotas públicas      | Crítico    | `routes/api.js`, `routes/public.js` |

## 5.7 Upload e Storage

| ID      | Achado                                        | Severidade | Evidência                        |
| ------- | --------------------------------------------- | ---------- | -------------------------------- |
| STF-054 | Validação MIME sem magic bytes                | Alto       | `uploadTemplate.js:8-13`         |
| STF-053 | Arquivos órfãos no R2 por ausência de cleanup | Alto       | `eventoSSRController.js:107-135` |
| STF-055 | Credenciais R2 sem validação de startup       | Alto       | `r2Service.js:11-19`             |

## 5.8 Autenticação

| ID      | Achado                                                   | Severidade | Evidência                           |
| ------- | -------------------------------------------------------- | ---------- | ----------------------------------- |
| STF-006 | `SESSION_SECRET` hardcoded em docker-compose.yml         | Crítico    | `docker-compose.yml:22`             |
| STF-013 | Cookie JWT sem `secure`; sessão sem atributos explícitos | Alto       | `routes/auth.js:65`, `app.js:48-53` |
| STF-014 | Login SSR sem rate limiting                              | Alto       | `routes/auth.js:58-73`              |
| STF-060 | `JWT_SECRET` sem fail-fast em authSSR e routes/auth.js   | Alto       | `authSSR.js:41`, `routes/auth.js:8` |
| STF-033 | User enumeration no login API                            | Médio      | `usuarioController.js:login`        |

## 5.9 SSR (específico)

| ID      | Achado                                                           | Severidade | Evidência                                        |
| ------- | ---------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| STF-010 | XSS stored via triple-mustache sem CSP                           | Crítico    | `form.hbs:71`, `tipos-certificados/form.hbs:106` |
| STF-028 | Link PDF no painel admin aponta para rota inexistente            | Alto       | `detalhe.hbs:5`                                  |
| STF-029 | Alias TiposCertificado errado; texto do certificado sempre vazio | Alto       | `certificadoSSRController.js:82`                 |
| STF-035 | `ultimosCertificados` não renderizado na view do dashboard       | Crítico    | `dashboard.hbs`                                  |
| STF-036 | `isMonitor` nunca verdadeiro em authSSR                          | Médio      | `authSSR.js:48-55`                               |

---

# 6. ADRs Necessários

## ADR-MT-01 — Estratégia Canônica de Enforcement Multi-tenant

**Problema arquitetural:** O sistema não possui uma estratégia definida e implementada de isolamento multi-tenant. O middleware atual (`scopedEvento`) injeta filtros que não são consumidos pelos services.

**Contexto:** O SRS declara FR-37 como requisito explícito de isolamento. A implementação atual é semanticamente incorreta para rotas de recurso único e inefetiva para listagens.

**Impacto:** Todos os domínios que operam sobre dados escopados por evento.

**Alternativas implícitas:**

1. Services recebem `eventoIds` explicitamente dos controllers como parâmetro de chamada.
2. Camada de autorização separada no service layer que verifica ownership antes de executar a operação.
3. Row-level security no banco de dados.

**Domínios afetados:** Certificados, Participantes, Tipos de Certificados, Eventos, Dashboard.

**Criticidade:** Crítica — bloqueia qualquer estabilização de segurança.

---

## ADR-MT-02 — Modelo de Scoping de Participantes sem Associação Direta com Evento

**Problema arquitetural:** O model `Participante` não possui associação direta com `Evento`. A relação existe indiretamente via `Certificado`. Impossível aplicar `scopedEvento` ao domínio de participantes sem JOIN em certificados, o que exclui participantes sem certificados (STF-038).

**Contexto:** FR-37 exige que gestores/monitores operem exclusivamente em seus eventos. Sem associação direta, o único mecanismo de filtro é via certificados — que exclui participantes não certificados.

**Impacto:** Arquitetura do domínio de participantes.

**Alternativas implícitas:**

1. Criar tabela de junção `participante_eventos` (impacto em migrações e modelo).
2. Aceitar que participantes são globais e aplicar escopo apenas na listagem por certificados (decisão de produto).

**Criticidade:** Alta — determina a arquitetura de ownership do domínio de participantes.

---

## ADR-AUTH-01 — Contrato Unificado de `req.usuario` entre API e SSR

**Problema arquitetural:** `auth` e `authSSR` populam `req.usuario` com contratos incompatíveis — instância Sequelize vs. POJO. Middlewares dependentes (`scopedEvento`, `tiposCertificadosOwnership`) funcionam apenas em API.

**Contexto:** A assimetria é deliberada (SSR usa cookie, API usa Bearer), mas o contrato de `req.usuario` pode ser unificado sem alterar o mecanismo de autenticação.

**Alternativas implícitas:**

1. `authSSR` busca no banco e retorna instância Sequelize completa (impacto de performance por request).
2. Ambos os middlewares retornam POJO com interface explícita; middlewares dependentes recebem helper para buscar eventos do usuário.
3. Helper centralizado `getUserEventos(req.usuario.id)` chamado sob demanda nos services.

**Domínios afetados:** Todos os domínios com controle de acesso.

**Criticidade:** Alta — bloqueia reutilização de middlewares de autorização.

---

## ADR-RBAC-01 — Definição Canônica de Perfis Mínimos por Operação

**Problema arquitetural:** Para as mesmas operações de negócio, API REST e SSR aplicam perfis RBAC diferentes sem justificativa documentada.

**Contexto:** O SRS define papéis (admin, gestor, monitor) mas não mapeia explicitamente cada operação ao perfil mínimo para cada superfície. A tabela de requisitos implica que a superfície não deveria influenciar o perfil mínimo.

**Alternativas implícitas:**

1. Perfil unificado por operação de negócio, independente da superfície.
2. Perfis distintos por superfície, documentados explicitamente no SRS com justificativa.

**Domínios afetados:** Todos.

**Criticidade:** Alta — determina a correção de todos os bugs de RBAC documentados.

---

## ADR-TX-01 — Política de Transações em Operações Compostas

**Problema arquitetural:** Zero uso de `sequelize.transaction()`. Operações compostas (geração de código + criação de certificado; soft delete + cascata; restore + cascata) são expostas a race conditions e estados inválidos.

**Contexto:** Três bugs críticos decorrem diretamente desta ausência (STF-009, STF-043, STF-022).

**Alternativas implícitas:**

1. `sequelize.transaction()` em todas as operações compostas no service layer.
2. Transações somente em operações de escrita críticas (certificados, vínculos usuarios-eventos).
3. Uso de sequências de banco de dados para geração de código (elimina race condition sem transação).

**Criticidade:** Alta — requisito para integridade de dados em produção.

---

## ADR-PUBLICO-01 — Política de Dados Expostos em Endpoints Públicos

**Problema arquitetural:** FR-25 define que rotas públicas não exigem autenticação mas **não define quais campos de dados pessoais podem ser expostos**. A implementação expõe e-mail na view SSR, IDs internos na API JSON e `valores_dinamicos` completos sem projeção.

**Contexto:** Sem definição de produto e jurídico (LGPD), não é possível determinar o escopo correto dos dados públicos.

**Alternativas implícitas:**

1. Definir DTO mínimo para respostas públicas (somente campos de validação: código, nome do tipo, status, data).
2. Permitir acesso a nome e tipo mas não a e-mail e `valores_dinamicos`.

**Criticidade:** Alta — determina a correção de múltiplos achados públicos.

---

# 7. Specs Necessárias (Spec Kit)

## SPEC-SEC-01 — Correção de Sessão e Autenticação

**Tipo:** Corretiva / Emergencial  
**Objetivo:** Eliminar todas as vulnerabilidades de configuração de autenticação.  
**Motivação:** SESSION_SECRET hardcoded (STF-006), cookie JWT sem secure (STF-013), JWT_SECRET sem fail-fast (STF-060), login SSR sem rate limiting (STF-014).  
**Domínios afetados:** Autenticação, Auth SSR, Docker Compose.  
**Dependências:** Nenhuma.  
**Criticidade:** Emergencial.

---

## SPEC-MT-01 — Enforcement de Multi-tenancy por Domínio

**Tipo:** Corretiva / Blocker  
**Objetivo:** Implementar isolamento multi-tenant funcional em certificados (API e SSR), participantes (API e SSR) e tipos de certificados (API e SSR).  
**Motivação:** PST-01 documenta a falha sistêmica. STF-001 a STF-004, STF-026, STF-027, STF-037.  
**Domínios afetados:** Certificados, Participantes, Tipos de Certificados.  
**Dependências:** ADR-MT-01, ADR-AUTH-01.  
**Criticidade:** Crítica — blocker arquitetural.

---

## SPEC-RBAC-01 — Correção e Unificação de RBAC

**Tipo:** Corretiva  
**Objetivo:** Alinhar RBAC da API REST com o SRS; adicionar `rbac()` ausentes em rotas SSR; corrigir assimetrias API/SSR.  
**Motivação:** STF-007, STF-015, STF-016, STF-017, STF-032, PST-03.  
**Domínios afetados:** Eventos, Certificados, Participantes, Tipos, Usuários.  
**Dependências:** ADR-RBAC-01.  
**Criticidade:** Crítica.

---

## SPEC-CERT-01 — Correção de Integridade do Serviço de Certificados

**Tipo:** Corretiva  
**Objetivo:** Corrigir geração de código (race condition + colisão pós soft-delete), validação de cross-evento, validação de participante_id, validator Zod com valores_dinamicos.  
**Motivação:** STF-005, STF-008, STF-009, STF-066.  
**Domínios afetados:** Certificados.  
**Dependências:** ADR-TX-01.  
**Criticidade:** Crítica.

---

## SPEC-CONSTRAINT-01 — Correção de Constraints de Banco

**Tipo:** Corretiva  
**Objetivo:** Nova migration para partial index `(codigo, evento_id) WHERE deleted_at IS NULL` em tipos_certificados; partial indexes de email para participantes e usuarios; unique constraint em usuario_eventos.  
**Motivação:** STF-021, STF-039, STF-044.  
**Domínios afetados:** Migrações, Models.  
**Dependências:** Nenhuma.  
**Criticidade:** Alta.

---

## SPEC-PUBLICO-01 — Segurança de Endpoints Públicos

**Tipo:** Corretiva / Blocker  
**Objetivo:** Rate limiting em rotas públicas; remoção de PII do log; remoção de err.message de resposta HTTP 500 pública; DTO mínimo para respostas JSON; filtro de certificados cancelados.  
**Motivação:** STF-011, STF-012, STF-018, STF-019, STF-023, STF-024, STF-052.  
**Domínios afetados:** API pública, Rotas públicas SSR.  
**Dependências:** ADR-PUBLICO-01 (para filtro de cancelados e política de campos expostos).  
**Criticidade:** Crítica.

---

## SPEC-XSS-01 — Correção de XSS Stored e Adição de CSP

**Tipo:** Corretiva  
**Objetivo:** Substituir triple-mustache por double-mustache ou serialização segura; adicionar Content Security Policy nos layouts.  
**Motivação:** STF-010.  
**Domínios afetados:** Views admin, Templates Handlebars.  
**Dependências:** Nenhuma.  
**Criticidade:** Crítica.

---

## SPEC-AUTH-01 — Unificação do Contrato de `req.usuario`

**Tipo:** Arquitetural / Blocker  
**Objetivo:** Definir e implementar interface unificada de `req.usuario` entre API e SSR, incluindo `email`, `isMonitor`, e método ou helper equivalente a `getEventos()`.  
**Motivação:** PST-02, STF-020.  
**Domínios afetados:** Middlewares de autenticação, todos os controllers SSR.  
**Dependências:** ADR-AUTH-01.  
**Criticidade:** Alta.

---

## SPEC-TX-01 — Transações em Operações Compostas

**Tipo:** Arquitetural  
**Objetivo:** Implementar `sequelize.transaction()` em `certificadoService.create()`, `eventoService.delete()`, `eventoService.restore()`.  
**Motivação:** STF-022, PST-04.  
**Domínios afetados:** Certificados, Eventos.  
**Dependências:** ADR-TX-01.  
**Criticidade:** Alta.

---

## SPEC-UPLOAD-01 — Segurança e Consistência do Pipeline de Upload

**Tipo:** Corretiva  
**Objetivo:** Validação de magic bytes no upload; ordenação correta (validação → persistência); cleanup de arquivo anterior ao atualizar; validação de startup de credenciais R2; timeout em `r2Service.getFile`.  
**Motivação:** STF-053, STF-054, STF-055, STF-077.  
**Domínios afetados:** Upload, R2, Eventos.  
**Dependências:** Nenhuma.  
**Criticidade:** Alta.

---

## SPEC-SRS-01 — Atualização do SRS (especificacoes.md)

**Tipo:** Documental / Transversal  
**Objetivo:** Corrigir FR-44 (URL vs key R2), definir FR para rate limiting público, remover FR-53 (duplicata de FR-23), corrigir FR-30 (rota de login), definir campos expostos nas rotas públicas, definir comportamento de validação para certificados cancelados/pendentes.  
**Motivação:** STF-068, STF-069, STF-070, STF-071, STF-072.  
**Domínios afetados:** SRS, todos.  
**Dependências:** Validações humanas VH-01 a VH-04.  
**Criticidade:** Alta.

---

# 8. Atualizações Necessárias no SRS

| #      | FR/NFR        | Problema                                                                                                         | Tipo | Ação Recomendada                                                                                                           |
| ------ | ------------- | ---------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| SRS-01 | FR-44         | "URL válida" e "key (caminho) no R2" são internamente contraditórios — Zod implementou URL, SSR implementou key  | ID   | Definir explicitamente: o campo armazena a **key R2 relativa** (não URL); remover validação Zod como URL                   |
| SRS-02 | FR-24         | Não define comportamento de validação pública para `status = 'cancelado'` ou `'pendente'` — gerou BR diretamente | AM   | Explicitar: certificado `cancelado` retorna `{ valido: false }` ou omite? Definir formalmente                              |
| SRS-03 | FR-25         | Não define quais campos pessoais podem ser expostos em rotas públicas — gerou exposição de e-mail e IDs internos | AM   | Definir DTO público mínimo (código, nome do tipo, evento, data de emissão) e excluir explicitamente campos não autorizados |
| SRS-04 | FR-23 / FR-53 | Duplicata semântica exata; ambos descrevem `GET /api/certificados?email=`                                        | ID   | Remover FR-53; manter FR-23; adicionar link a qualquer especificação ampliada                                              |
| SRS-05 | FR-30         | Documenta `POST /auth/login`; implementação usa `POST /login` via `app.use('/')`                                 | ID   | Atualizar para `POST /login` ou documentar o caminho efetivo de montagem                                                   |
| SRS-06 | NFR-1 / MS-4  | Rate limiting para rotas públicas documentado apenas como "Melhoria Sugerida" sem FR                             | ID   | Elevar a FR explícito com limites definidos (ex.: 60 req/min por IP para validação, 10/min para geração de PDF)            |
| SRS-07 | FR-37         | Não enumera explicitamente quais recursos e operações são cobertos pelo `scopedEvento`                           | AM   | Listar explicitamente: certificados (todas as ops), participantes (?), tipos de certificados (?), eventos (?)              |
| SRS-08 | FR-22         | Ambíguo sobre restauração de certificado via API (admin via SSR) — gerou divergência entre superfícies           | AM   | Definir: restauração de certificado é exclusiva de admin independente da superfície                                        |
| SRS-09 | FR-56         | Não especifica quais status compõem `totalCertificados` e `ultimosCertificados`                                  | AM   | Definir: inclui cancelados? Inclui pendentes?                                                                              |
| SRS-10 | FR-48         | Não especifica se coordenadas de layout são configuráveis via API ou apenas via SSR                              | AM   | Definir explicitamente qual superfície gerencia cada campo do evento                                                       |
| SRS-11 | FR-8          | Não especifica sensibilidade a maiúsculas de `codigo_base`                                                       | AM   | Acrescentar: `codigo_base` é armazenado em maiúsculas; validação é case-insensitive                                        |
| SRS-12 | FR-43 / FR-52 | Não define comportamento quando `count + 1` colide — gap de integridade que gerou BR                             | AM   | Documentar mecanismo de geração de código como atômico; especificar comportamento em colisão                               |

---

# 9. Itens para Validação Humana

| ID        | Decisão                                                                                     | Contexto                                                                                                                                | Impacto se não decidido                                                                     |
| --------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **VH-01** | Comportamento de certificados `cancelado` e `pendente` na validação pública                 | FR-24 não define; implementação atual retorna `valido: true` para todos os status                                                       | STF-019 permanece como bug sem definição de produto; spec corretiva não pode ser escrita    |
| **VH-02** | Comportamento de cascata de soft delete de evento sobre `TiposCertificados` e `Certificado` | FR-9 define soft delete de evento, mas não especifica cascata para tipos e certificados                                                 | STF-041 permanece como GI; implementação atual deixa tipos ativos após deletar evento       |
| **VH-03** | Comportamento de cascata de soft delete de participante sobre `Certificado`                 | FR-4 define soft delete de participante sem cascata; certificados ficam com participante nulo                                           | STF-042 indefinido; PDF pode ser gerado com nome vazio                                      |
| **VH-04** | Campos expostos em respostas públicas de validação e consulta                               | FR-25 não define escopo de dados; e-mail e IDs internos atualmente expostos                                                             | STF-023, STF-052 sem baseline normativo; compliance LGPD indeterminado                      |
| **VH-05** | Política de exibição de certificados cancelados na listagem pública por e-mail              | FR-23 não especifica se cancelados aparecem; view atual exibe com badge distinto                                                        | STF-019 (parcial); comportamento intencional indeterminado                                  |
| **VH-06** | Participantes como entidade global ou escopada por evento                                   | PA-11: model sem associação direta com evento; filtrar participantes por evento requer JOIN em certificados, excluindo não-certificados | ADR-MT-02 não pode ser implementado sem decisão de produto                                  |
| **VH-07** | RBAC unificado por operação de negócio vs RBAC por superfície                               | A API é sistematicamente mais permissiva; pode ser intencional (acesso programático) ou bug                                             | ADR-RBAC-01 não pode ser especificado sem decisão arquitetural                              |
| **VH-08** | Política de exibição do e-mail do participante na view de validação pública                 | E-mail exposto na view SSR de resultado; pode ser intencional para o participante verificar o certificado                               | Sem decisão, STF-023 não pode ser corrigido sem risco de quebrar funcionalidade intencional |
| **VH-09** | Backdoor `x-mock-user` em authSSR para `NODE_ENV=test` deve ser mantido ou removido         | Facilita testes de integração; risco se `NODE_ENV=test` vazar para produção                                                             | STF-059 aguarda decisão técnica de testabilidade                                            |
| **VH-10** | Política de cache HTTP para PDFs gerados sob demanda                                        | Sem `Cache-Control`, navegadores e proxies podem cachear PDF de certificado cancelado                                                   | Comportamento de cache indefinido; depende de topologia de infraestrutura                   |

---

# 10. Roadmap Arquitetural de Estabilização

## Fase 0 — Emergencial (antes de qualquer acesso multiusuário real)

> Objetivo: eliminar vulnerabilidades críticas que permitem acesso cross-tenant, privilege escalation, XSS e credenciais comprometidas.

| #     | Item                                                                                                                | ID      | Criticidade | Dependência         | Risco Mitigado                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------- | ----------- | ------------------- | ----------------------------------------------- |
| F0-01 | Remover `SESSION_SECRET` hardcoded de `docker-compose.yml`                                                          | STF-006 | Crítico     | Nenhuma             | Sessões SSR forjáveis                           |
| F0-02 | Corrigir `rbac` em DELETE/PUT/POST eventos na API (`monitor` → `admin`)                                             | STF-007 | Crítico     | Nenhuma             | Escalada de privilégio                          |
| F0-03 | Adicionar `rbac('admin')` na cadeia de rotas de `usuarios-crud.js`                                                  | STF-032 | Alto        | Nenhuma             | Criação de admin por qualquer autenticado       |
| F0-04 | Corrigir cookie JWT SSR: adicionar `secure: true` em produção                                                       | STF-013 | Alto        | Nenhuma             | Interceção de cookie por HTTP                   |
| F0-05 | Aplicar rate limiting em `POST /login` SSR (mesmo `loginLimiter` da API)                                            | STF-014 | Alto        | Nenhuma             | Brute force no formulário web                   |
| F0-06 | Remover/condicionar `console.log` de PII em `pdfService.js`                                                         | STF-018 | Alto        | Nenhuma             | PII em logs de produção                         |
| F0-07 | Remover `detalhe: err.message` de resposta HTTP 500 pública de PDF                                                  | STF-024 | Alto        | Nenhuma             | Reconhecimento de topologia                     |
| F0-08 | Adicionar `JWT_SECRET` como fail-fast em `authSSR.js` e `routes/auth.js`                                            | STF-060 | Alto        | Nenhuma             | Falha silenciosa em runtime                     |
| F0-09 | Substituir `JWT_SECRET` fraco em `docker-compose.test.yml`                                                          | STF-061 | Alto        | Nenhuma             | JWT de testes forjável                          |
| F0-10 | Corrigir validator Zod de certificado: manter `valores_dinamicos`, tornar `status` optional com default `"emitido"` | STF-005 | Crítico     | Nenhuma             | Emissão de certificados impossível via API      |
| F0-11 | Corrigir constraint de tipos_certificados: nova migration com partial index                                         | STF-021 | Crítico     | Nenhuma             | Restauração de tipos inoperante                 |
| F0-12 | Corrigir colisão de código: `count(paranoid: false)` no serviço de emissão                                          | STF-009 | Crítico     | Nenhuma             | UniqueConstraintError após soft delete          |
| F0-13 | Validar `tipo.evento_id === data.evento_id` em `certificadoService.create()`                                        | STF-008 | Crítico     | Nenhuma             | Mistura de dados entre eventos                  |
| F0-14 | Corrigir alias Sequelize: `TiposCertificado` → `TiposCertificados` em SSR                                           | STF-029 | Alto        | Nenhuma             | Texto do certificado sempre vazio               |
| F0-15 | Corrigir link de PDF no painel admin: `/api/certificados/:id/pdf`                                                   | STF-028 | Alto        | Nenhuma             | Download sempre HTTP 404 no painel admin        |
| F0-16 | Adicionar rate limiting mínimo nas rotas públicas de certificados                                                   | STF-011 | Crítico     | Nenhuma             | DoS por geração de PDF; scraping                |
| F0-17 | Corrigir XSS stored: substituir `{{{json ...}}}` por serialização segura em `<script>`                              | STF-010 | Crítico     | Nenhuma             | Execução de código no painel admin              |
| F0-18 | Adicionar Content Security Policy nos layouts `layout.hbs` e `layouts/admin.hbs`                                    | STF-010 | Crítico     | F0-17               | Amplificação de XSS sem restrição               |
| F0-19 | Aplicar `rbac('monitor')` → `rbac('gestor')` ou `rbac('admin')` em delete/restore de participantes                  | STF-015 | Alto        | ADR-RBAC-01 (VH-07) | Escalada de privilégio de monitor               |
| F0-20 | Corrigir `POST /certificados/:id/restore`: uniformizar para `rbac('admin')` ou `gestor`                             | STF-016 | Alto        | VH-07               | Monitor restaura certificados                   |
| F0-21 | Corrigir criação de certificados SSR: `rbac('gestor')` → `rbac('monitor')`                                          | STF-017 | Alto        | Nenhuma             | Monitor bloqueado de criar certificados por SSR |

---

## Fase 1 — Estabilização Arquitetural

> Objetivo: contratos consistentes entre camadas; enforcement real de multi-tenancy e RBAC; integridade transacional.

| #     | Item                                                                                                              | ID               | Criticidade | Dependência           | Risco Mitigado                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------------- | ----------- | --------------------- | ------------------------------------------------------- |
| F1-01 | Implementar ADR-AUTH-01: unificar contrato de `req.usuario` entre API e SSR                                       | STF-020          | Alto        | ADR-AUTH-01           | Middlewares inaplicáveis em SSR; isMonitor sempre falso |
| F1-02 | Implementar ADR-MT-01: services recebem `eventoIds` de controllers; `scopedEvento` corrigido                      | STF-001, STF-002 | Crítico     | ADR-MT-01, F1-01      | Multi-tenancy ilusório                                  |
| F1-03 | Aplicar enforcement de escopo em todas as operações SSR de certificados por ID                                    | STF-003          | Crítico     | F1-01                 | Acesso cross-tenant via SSR                             |
| F1-04 | Aplicar filtro de escopo em `GET /participantes` API                                                              | STF-004          | Crítico     | ADR-MT-01, VH-06      | Vazamento de PII                                        |
| F1-05 | Aplicar escopo em operações SSR de participantes por ID                                                           | STF-037          | Alto        | F1-01                 | Edição cross-tenant via SSR                             |
| F1-06 | Aplicar filtro de escopo em `GET /tipos-certificados` API e SSR                                                   | STF-026, STF-027 | Alto        | F1-02                 | Metadados de tipos expostos entre tenants               |
| F1-07 | Implementar ADR-TX-01: `sequelize.transaction()` em `create()`, `delete()`, `restore()` de certificados e eventos | STF-022          | Alto        | ADR-TX-01             | Race condition em emissão; estados inválidos            |
| F1-08 | Adicionar validação de `participante_id` em `certificadoService.create()`                                         | STF-066          | Alto        | Nenhuma               | FK violation exposta ao cliente                         |
| F1-09 | Criar `usuarioService.js`; mover lógica de JWT/bcrypt/associação N:N do controller                                | STF-025          | Alto        | Nenhuma               | Violação de NFR-6; CRUD de usuários não reutilizável    |
| F1-10 | Implementar partial indexes de email em `participantes` e `usuarios` (migration)                                  | STF-039          | Médio       | Nenhuma               | Recriação após soft delete impossível                   |
| F1-11 | Adicionar unique constraint `(usuario_id, evento_id)` em `usuario_eventos` (migration)                            | STF-044          | Alto        | Nenhuma               | Duplicatas silenciosas e RBAC quebrado                  |
| F1-12 | Corrigir `tiposCertificadosOwnership` para tratar restore por ID corretamente                                     | STF-063          | Médio       | Nenhuma               | Gestores não conseguem restaurar tipos                  |
| F1-13 | Filtrar eventos, tipos e participantes no formulário SSR de novo certificado                                      | STF-064          | Médio       | F1-02                 | Combinação inválida entre eventos no formulário         |
| F1-14 | Aplicar `senhaForteSchema` na criação de usuário via API                                                          | STF-034          | Alto        | Nenhuma               | Senhas fracas em criação via API                        |
| F1-15 | Mover lógica de busca pública de rotas para controllers e services                                                | STF-046          | Alto        | Nenhuma               | Violação de NFR-6; duplicação de lógica                 |
| F1-16 | Adicionar validação de formato de código em `GET /api/validar/:codigo`                                            | STF-057          | Alto        | Nenhuma               | Strings arbitrárias chegam ao ORM                       |
| F1-17 | Definir e implementar DTO mínimo para respostas públicas (pós ADR-PUBLICO-01)                                     | STF-052          | Alto        | ADR-PUBLICO-01, VH-04 | IDs internos expostos publicamente                      |

---

## Fase 2 — Consolidação Estrutural

> Objetivo: eliminar duplicação de lógica; padronizar transversais; resolver issues de cascade e session.

| #     | Item                                                                                            | ID                | Criticidade | Dependência  | Risco Mitigado                                         |
| ----- | ----------------------------------------------------------------------------------------------- | ----------------- | ----------- | ------------ | ------------------------------------------------------ |
| F2-01 | Substituir MemoryStore do `express-session` por store persistente                               | STF-045           | Alto        | Nenhuma      | OOM e perda de sessões em produção                     |
| F2-02 | Adicionar timeout em `r2Service.getFile`; circuit breaker ou fallback em geração de PDF         | STF-077           | Médio       | Nenhuma      | Hang indefinido sob degradação do R2                   |
| F2-03 | Implementar cleanup de arquivo R2 ao atualizar template; atomicidade upload→persist             | STF-053           | Alto        | Nenhuma      | Arquivos órfãos no R2                                  |
| F2-04 | Adicionar validação de magic bytes no upload de template                                        | STF-054           | Alto        | Nenhuma      | Arquivo malicioso persistido no R2                     |
| F2-05 | Validar credenciais R2 com fail-fast no startup                                                 | STF-055           | Alto        | Nenhuma      | Falha silenciosa em tempo de execução                  |
| F2-06 | Corrigir slug de evento: garantir não-vazio; evitar colisão de keys R2                          | STF-056           | Médio       | Nenhuma      | Sobreescrita de template de outro evento               |
| F2-07 | Adicionar `scopedEvento` ou filtro equivalente a `GET /api/certificados?email=` (pós VH-04)     | STF-052           | Alto        | VH-04        | Exposição irrestrita de IDs internos                   |
| F2-08 | Corrigir `validação de certificados cancelados` na view SSR: ocultar botão PDF para cancelados  | STF-019 (parcial) | Alto        | VH-01, VH-05 | UX convidando download de PDF cancelado                |
| F2-09 | Revalidar `valores_dinamicos` em `certificadoService.update()`                                  | STF-065           | Alto        | Nenhuma      | Dados parciais persistidos em atualização              |
| F2-10 | Mover validação cross-field de `campo_destaque` para Zod (refinement) com HTTP 422              | STF-075           | Médio       | Nenhuma      | Erro de persistência retornado para erro de entrada    |
| F2-11 | Consolidar lógica de ownership de tipos em ponto único (remover duplicação)                     | STF-074           | Médio       | F1-06        | Divergência futura silenciosa                          |
| F2-12 | Adicionar `isMonitor`, `email` ao contrato de `req.usuario` no authSSR                          | STF-036           | Médio       | F1-01        | isMonitor nunca verdadeiro; e-mail indisponível em SSR |
| F2-13 | Definir e implementar cascata de soft delete de evento → tipos e certificados (pós VH-02)       | STF-041           | Médio       | VH-02        | Tipos ativos após deletar evento                       |
| F2-14 | Definir e implementar cascata de soft delete de participante → certificados (pós VH-03)         | STF-042           | Médio       | VH-03        | PDF com nome vazio                                     |
| F2-15 | Corrigir `eventoService.restore()`: filtrar vínculos por data e excluir usuários soft-deletados | STF-043           | Médio       | Nenhuma      | Ghost access reestabelecido                            |
| F2-16 | Adicionar `Swagger` com autenticação ou restrito a ambientes não-produção                       | STF-049           | Médio       | Nenhuma      | Reconhecimento de endpoints admin                      |
| F2-17 | Renderizar `ultimosCertificados` no `dashboard.hbs`; corrigir backlog                           | STF-035           | Crítico     | Nenhuma      | FR-56 não atendido; backlog incorreto                  |
| F2-18 | Implementar máquina de estados para `status` do certificado                                     | STF-067           | Médio       | Nenhuma      | Transições inválidas (cancelado → emitido)             |
| F2-19 | Corrigir validator `url_template_base`: aceitar key R2 relativa (não URL)                       | STF-030, STF-068  | Alto        | SRS-01       | Upload via API completamente bloqueado                 |
| F2-20 | Adicionar campos de layout (`texto_x/y`, `validacao_x/y`) ao schema Zod de evento               | T07/T07-35        | Baixo       | SRS-10       | Coordenadas não atualizáveis via API                   |
| F2-21 | Resolver down migration do ENUM `enum_certificados_status`                                      | STF-073           | Médio       | Nenhuma      | Orphan type após rollback                              |
| F2-22 | Adicionar `SESSION_SECRET` ao `.env.example`                                                    | STF-031           | Médio       | Nenhuma      | Onboarding inseguro                                    |
| F2-23 | Documentar `JWT_SECRET` como obrigatório em `docker-compose.yml`                                | STF-031           | Alto        | Nenhuma      | Startup falha de forma não documentada                 |

---

## Fase 3 — Evolução Segura

> Objetivo: otimizações, hardening adicional, capacidade de evolução.

| #     | Item                                                                                                 | ID             | Criticidade | Dependência           |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------- | ----------- | --------------------- |
| F3-01 | Avaliar enumeração de certificados: considerar código não-previsível (UUID parcial ou hash)          | STF-050        | Alto        | VH-01, ADR-PUBLICO-01 |
| F3-02 | Implementar logging estruturado para tentativas de autenticação falhas                               | T02/C-31       | Médio       | Nenhuma               |
| F3-03 | Resolver dependência circular entre `pdfService` e `r2Service`                                       | STF-076        | Médio       | Nenhuma               |
| F3-04 | Substituir `new Promise(async (resolve, reject))` por async/await puro em `pdfService`               | STF-076        | Médio       | F3-03                 |
| F3-05 | Limpar método `eventoService.destroy()` órfão                                                        | STF-079        | Baixo       | Nenhuma               |
| F3-06 | Configurar Morgan com formato estruturado distinto por ambiente                                      | T06/T06-034    | Baixo       | Nenhuma               |
| F3-07 | Considerar paginação em `GET /api/certificados?email=`                                               | T05/T05-GI-002 | Médio       | F2-07                 |
| F3-08 | Adicionar CRUD API completo de usuários (FR-26 não atendido)                                         | T02/C-19       | Alto        | F1-09, VH-07          |
| F3-09 | Normalizar busca de e-mail (case-insensitive) em endpoint público                                    | T03/PA-07      | Médio       | Nenhuma               |
| F3-10 | Adicionar headers HTTP de segurança (`X-Content-Type-Options`, `Cache-Control`) nas respostas de PDF | T05/T05-GI-004 | Médio       | Nenhuma               |

---

# 11. Avaliação Final da Arquitetura

## Robustez

**Baixa.** O sistema apresenta múltiplos pontos de falha críticos que afetam fluxos centrais:

- Emissão de certificados com campos dinâmicos via API é impossível (STF-005).
- Download de PDF no painel admin sempre retorna 404 (STF-028).
- Colisão de código após soft delete inviabiliza re-emissão em eventos com histórico (STF-009).
- Race condition na geração de código pode causar HTTP 500 em uso concorrente normal (STF-009).
- Zero uso de transações expõe operações compostas a estados inválidos (STF-022).

## Manutenibilidade

**Média-Baixa.** A estrutura em camadas existe nominalmente mas é violada em pontos críticos:

- `usuarioService.js` ausente (STF-025); lógica de domínio espalhada.
- Lógica de busca pública inline em rotas (STF-046); duplicada em três handlers.
- Lógica de ownership duplicada em controller e middleware (STF-074).
- Alias Sequelize divergente em múltiplos pontos sem ADR resolvendo (STF-029).
- `authSSR` e `auth` com contratos incompatíveis forçam triplicação de lógica de escopo em controllers SSR (PST-02).

## Segurança

**Crítica — não apta para produção multiusuário.** Falhas de severidade crítica ativas:

- Multi-tenancy completamente ilusório (STF-001-STF-004, PST-01).
- Privilege escalation via API em múltiplos domínios (STF-007, STF-015, STF-016, STF-032).
- XSS stored com superfície ampliada por ausência de CSP (STF-010).
- Enumeração irrestrita de PDFs e e-mails de participantes (STF-011, STF-012, STF-023, STF-050).
- SESSION_SECRET hardcoded (STF-006).
- IDOR em endpoint público de PDF (STF-012).

## Confiabilidade

**Baixa.** Integridade de dados não garantida:

- Sem transações em operações compostas (STF-022).
- Constraint drift entre migration e model (STF-021).
- Colisão de código de certificado determinística após soft delete (STF-009).
- Cascatas de soft delete incompletas e inconsistentes entre domínios (STF-041, STF-042, STF-043).
- FK violation não tratada exposta como HTTP 500 (STF-066).

## Isolamento Multi-tenant

**Falho.** O invariante de segurança mais fundamental do sistema não está implementado de forma funcional. O middleware `scopedEvento` é semanticamente incorreto e os services ignoram os filtros injetados. O isolamento visível nos testes unitários (que mocam escopo) não existe em produção.

## Consistência Estrutural

**Inconsistente.** Divergências sistemáticas entre API e SSR em RBAC, scoping, geração de resposta e contratos de dados. A mesma operação de negócio tem comportamentos, erros e proteções distintas dependendo da superfície.

## Capacidade de Evolução

**Comprometida.** Qualquer nova funcionalidade que dependa de isolamento multi-tenant herda automaticamente a falha arquitetural de PST-01. A assimetria de `req.usuario` (PST-02) impede reutilização de qualquer middleware de autorização em SSR. Sem ADRs para multi-tenant e autenticação, o sistema continuará acumulando implementações divergentes.

---

# 12. Conclusão Executiva

## Maiores riscos do sistema

O Certifique-me possui três categorias de risco imediato que o impedem de operar com segurança em ambiente de produção multiusuário:

**1. Falha sistêmica de isolamento multi-tenant**
O enforcement de isolamento entre eventos — o invariante de segurança central do sistema — não está implementado de forma funcional. Qualquer gestor ou monitor autenticado pode listar certificados de todos os eventos, acessar PII de todos os participantes e manipular dados de eventos aos quais não está vinculado. As proteções existem no código mas não produzem efeito real (PST-01).

**2. Privilege escalation via API REST**
A API é sistematicamente mais permissiva que a SSR para operações críticas. Gestores podem deletar e atualizar eventos via API; monitores podem deletar participantes e restaurar certificados. A proteção correta existe apenas na interface SSR, tornando a API REST o vetor de ataque natural (PST-03).

**3. Vulnerabilidades de segurança críticas não mitigadas**
XSS stored ativo no painel admin, IDOR irrestrito no endpoint público de PDF, ausência total de rate limiting em rotas públicas, SESSION_SECRET hardcoded e PII em logs compõem um conjunto de vulnerabilidades que, em combinação, permitem scraping massivo de dados e comprometimento de sessões de administradores.

## O que bloqueia evolução segura

**Arquiteturalmente:** A falta de contrato unificado de `req.usuario` (STF-020/PST-02) bloqueia qualquer tentativa de reutilizar middlewares de autorização em SSR. Sem resolução desse contrato, toda nova funcionalidade SSR exige reimplementação de lógica de escopo no controller, acumulando divergências. A estratégia de enforcement multi-tenant (ADR-MT-01) depende diretamente desse contrato.

**Estruturalmente:** A ausência de transações (STF-022) expõe o sistema a corrupção silenciosa de dados em operações compostas. Qualquer nova funcionalidade que envolva múltiplas entidades herda essa fragilidade.

**Documentalmente:** FR-44 (URL vs key R2), FR-24 (comportamento de cancelados) e FR-25 (escopo de dados públicos) são ambiguidades no SRS que geraram bugs reais. Sem atualização do SRS com as decisões das validações humanas (VH-01 a VH-10), specs corretivas não podem ser escritas com baseline normativo.

## O que deve ser resolvido primeiro

**Fase 0 obrigatória antes de qualquer ambiente de produção multiusuário:**

1. `SESSION_SECRET` hardcoded — risco operacional imediato (F0-01).
2. RBAC da API em eventos, participantes e usuários — privilege escalation direto (F0-02, F0-03, F0-19, F0-20).
3. XSS stored + CSP — comprometimento de contas admin (F0-17, F0-18).
4. Rate limiting em rotas públicas — DoS e scraping (F0-16).
5. Emissão de certificados via API (validator Zod) — fluxo central do sistema inoperante (F0-10).
6. Colisão de código de certificado — serviço de emissão inoperante em uso real (F0-12).
7. Bugs de UI bloqueantes: link PDF 404, alias errado, ultimosCertificados não renderizado (F0-14, F0-15, F2-17).

**Fase 1 obrigatória antes de qualquer uso com dados reais entre múltiplos clientes:**

8. Resolução dos ADRs de multi-tenancy e contrato de `req.usuario`.
9. Enforcement real de multi-tenancy em todos os domínios.

## Prioridade arquitetural real do projeto

O projeto deve priorizar **estabilidade de segurança e integridade antes de qualquer nova funcionalidade**. A dívida arquitetural acumulada — especialmente o multi-tenancy ilusório e o RBAC assimétrico — não é um conjunto de bugs isolados, mas um padrão estrutural que invalida o valor de qualquer funcionalidade adicionada sobre essa base.

O roadmap emergencial (Fase 0) pode ser executado sem ADRs. A estabilização arquitetural (Fase 1) requer decisão explícita sobre a estratégia de scoping multi-tenant e o contrato de autenticação — decisões que devem preceder qualquer implementação de novos domínios.

O sistema possui fundação técnica para evolução (estrutura de camadas, migrations, validators, testes automatizados), mas essa fundação só será confiável após a resolução dos problemas de Fase 0 e Fase 1. Novas funcionalidades adicionadas antes dessa estabilização herdarão as falhas estruturais documentadas nesta triagem.

---

_Triagem produzida por: Arquiteto de Software Principal (GitHub Copilot — Claude Sonnet 4.6)_  
_Data: 2026-05-10 15:15 (BRT)_  
_Baseada exclusivamente em evidências documentadas nas auditorias 07/02 a 07/25 e triagens T01 a T07._
