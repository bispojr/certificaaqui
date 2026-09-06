# Triagem Arquitetural Consolidada — Participantes, Tipos e Dashboard

**Sistema:** Certifique-me  
**SRS auditado:** v2.0 (2026-04-30)  
**Data da triagem:** 2026-05-09 19:58 (BRT)  
**Analista:** GitHub Copilot (Claude Sonnet 4.6)  
**Auditorias-base consumidas:**

- `docs/auditorias/07/06-participantes.md` (2026-05-09 19:14 BRT)
- `docs/auditorias/07/08-tipos-templates.md` (2026-05-09 19:37 BRT)
- `docs/auditorias/07/09-dashboard-relatorios.md` (2026-05-09 19:49 BRT)

**Triagens anteriores referenciadas (apenas para dependências):**

- `docs/auditorias/07/T01-triagem-certificados-rbac.md`
- `docs/auditorias/07/T02-triagem-eventos-usuarios-auth.md`
- `docs/auditorias/07/02-rbac-escopo.md`

---

## Nota Metodológica

Esta triagem consolida **exclusivamente** os achados das três auditorias-base listadas acima.  
Nenhum achado foi extrapolado para domínios não auditados (e.g., PDF, R2, autenticação isolada).  
Achados duplicados entre as auditorias-base foram mesclados em item único com rastreabilidade explícita.  
Achados já registrados em T01 ou T02 são referenciados na Seção 8 como dependências arquiteturais — não reauditados.  
Hipóteses sem confirmação de código são sinalizadas como **Validação Humana**.

---

## Legenda de Tipos

| Código | Significado               |
| ------ | ------------------------- |
| BR     | Bug real                  |
| GI     | Gap de implementação      |
| IP     | Implementação parcial     |
| ID     | Inconsistência documental |
| DT     | Dívida técnica            |
| VU     | Vulnerabilidade           |
| AM     | Ambiguidade               |
| VA     | Violação arquitetural     |

---

## 1. Matriz Consolidada de Achados

### 1.1 Achados Transversais (dois ou mais domínios)

| ID    | Domínio                           | Descrição                                                                                                                                                                                      | Severidade | Tipo | Impacto                                                                                                                     | Destino Recomendado     |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| TS-01 | Participantes · Tipos · Dashboard | `authSSR` retorna plain object sem métodos Sequelize: `scopedEvento`, `tiposCertificadosOwnership` inaplicáveis em SSR; `isMonitor` ausente; controllers reimplementam lógica de escopo ad hoc | Crítica    | VA   | Reutilização de middlewares impossível em SSR; lógica de ownership duplicada; flag `isMonitor` nunca verdadeira em produção | ADR + Backlog crítico   |
| TS-02 | Participantes · Tipos             | `scopedEvento` resolve `evento_id` como `req.params.id` em rotas de recurso: controle de acesso item-level determinado por coincidência numérica                                               | Crítica    | BR   | Acesso concedido ou negado por razão aleatória (ID do recurso ≠ ID do evento); enforcement multi-tenant não-determinístico  | Correção imediata       |
| TS-03 | Participantes · Tipos · Dashboard | Services (`participanteService`, `tiposCertificadosService`, `certificadoService`, `dashboardController`) ignoram filtros de evento injetados: `scopedEvento` não produz efeito real           | Crítica    | VA   | Proteção multi-tenant via middleware é ilusória; escopo nunca é aplicado na camada de dados                                 | ADR + Correção imediata |
| TS-04 | Participantes · Tipos · Dashboard | Divergência sistemática de RBAC entre API e SSR: monitores ora têm acesso negado (SSR criar certificado), ora têm a mais (SSR participantes sem rbac), ora correto (API)                       | Alta       | VA   | Sem superfície segura e confiável; surface SSR ignora completamente RBAC em participantes                                   | Correção imediata       |
| TS-05 | Participantes · Tipos             | HTTP 200/204 com payload nulo para recursos inexistentes em operações de `update`, `delete` e `restore`                                                                                        | Média      | BR   | Clientes API não detectam falha em operações sobre IDs inexistentes; integração incorreta                                   | Backlog curto prazo     |
| TS-06 | Participantes · Tipos             | Índice `UNIQUE` sem cláusula `WHERE deleted_at IS NULL`: soft-delete bloqueia re-cadastro de email (participante) e colisão após restore (tipos-certificados e código de certificado)          | Média      | BR   | Re-cadastro impossível após exclusão lógica; restore pode falhar com constraint violation                                   | Backlog curto prazo     |

---

### 1.2 Achados do Domínio de Participantes

| ID    | Domínio       | Descrição                                                                                                                                                      | Severidade | Tipo | Impacto                                                                                                     | Destino Recomendado   |
| ----- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | ----------------------------------------------------------------------------------------------------------- | --------------------- |
| PA-01 | Participantes | `GET /participantes` (API) lista todos os participantes do sistema sem qualquer filtro de evento: gestor/monitor acessa PII de participantes de outros eventos | Crítica    | VU   | Vazamento massivo de PII (nome, email, instituição) entre tenants; violação FR-37                           | Correção imediata     |
| PA-02 | Participantes | Todas as rotas SSR de participantes sem middleware `rbac()`: monitor pode criar, editar, deletar e restaurar participantes pela interface web                  | Crítica    | VU   | Escalada de privilégio funcional direta para monitor; violação FR-35, FR-36, FR-38, NFR-1                   | Correção imediata     |
| PA-03 | Participantes | SSR: operações por `:id` (`editar`, `atualizar`, `deletar`, `restaurar`) sem verificação de escopo por evento                                                  | Alta       | VU   | Gestor/monitor pode editar ou deletar participante de outro evento via SSR                                  | Correção imediata     |
| PA-04 | Participantes | SSR: participantes sem certificado vinculado ao evento do usuário ficam invisíveis para gestor/monitor (efeito colateral do JOIN em `Certificado`)             | Alta       | GI   | Participantes registrados mas sem certificados somem da listagem SSR para não-admins; violação FR-36, FR-49 | Backlog crítico       |
| PA-05 | Participantes | SSR: ausência de validação server-side de `nomeCompleto.min(3)` em criação e edição                                                                            | Média      | GI   | Participantes com nome de 1–2 caracteres podem ser criados via SSR; violação FR-3                           | Backlog curto prazo   |
| PA-06 | Participantes | API: ausência de busca textual (`?q=`): integrações não podem filtrar participantes por nome ou email                                                          | Média      | GI   | API sem paridade funcional com SSR; FR-49 parcialmente atendido                                             | Backlog médio prazo   |
| PA-07 | Participantes | Busca pública por email (`GET /api/certificados?email=`) é case-sensitive: `joao@TESTE.com` ≠ `joao@teste.com`                                                 | Baixa      | DT   | Usuário não encontra certificados por variação de capitalização; violação FR-23, FR-53                      | Backlog médio prazo   |
| PA-08 | Participantes | SSR: filtro `?q=` não é aplicado à seção de participantes arquivados                                                                                           | Baixa      | BR   | Busca filtra ativos mas exibe todos os arquivados; inconsistência de UX                                     | Backlog curto prazo   |
| PA-09 | Participantes | `PUT /participantes/:id` usa `schema.partial()`: aceita corpo vazio `{}` como válido; semântica PATCH implementada via PUT                                     | Baixa      | DT   | Divergência da semântica REST; FR-1 parcialmente atendido                                                   | Backlog longo prazo   |
| PA-10 | Participantes | Duplicação de métodos `destroy` e `delete` no `participanteService` com mesma implementação                                                                    | Baixa      | DT   | Risco de divergência futura; manutenção dupla                                                               | Backlog longo prazo   |
| PA-11 | Participantes | Modelo `Participante` sem associação direta com `Evento`: impossibilidade ORM de filtrar participantes por evento sem JOIN em certificados                     | Alta       | VA   | Impossibilidade arquitetural de aplicar `scopedEvento` ao domínio; raiz do PA-04; violação FR-37            | ADR / Backlog crítico |

---

### 1.3 Achados do Domínio de Tipos de Certificados

| ID    | Domínio              | Descrição                                                                                                                                                                               | Severidade | Tipo               | Impacto                                                                                                                | Destino Recomendado |
| ----- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- | ------------------- |
| TC-01 | Tipos · Certificados | Validator Zod de criação de certificado remove `valores_dinamicos` silenciosamente (campo não declarado); service detecta todos os campos como faltantes e retorna HTTP 422 permanente  | Crítica    | BR                 | Emissão de certificados com campos dinâmicos impossível via API; caso de uso central corrompido; violação FR-20, FR-54 | Correção imediata   |
| TC-02 | Tipos · Certificados | Service de emissão não valida que `tipo_certificado_id` pertence ao mesmo `evento_id` do certificado                                                                                    | Alta       | BR                 | Certificado pode ser criado vinculando tipo de evento A com evento B; violação FR-21, FR-45                            | Correção imediata   |
| TC-03 | Tipos                | SSR `index`: `whereAtivos = {}` — `eventosIds` obtido mas nunca usado na cláusula `where`; gestor/monitor vê tipos de todos os eventos                                                  | Alta       | BR                 | Isolamento multi-tenant violado na listagem SSR; violação FR-37, FR-46                                                 | Correção imediata   |
| TC-04 | Tipos                | SSR `index` de tipos arquivados também sem filtro de evento: gestores veem todos os soft-deletados do sistema                                                                           | Média      | IP                 | Extensão de TC-03 para a seção de arquivados; violação FR-37                                                           | Backlog curto prazo |
| TC-05 | Tipos                | `tiposCertificadosOwnership` é executado **antes** do validator Zod: `evento_id` pode ser null/inválido ao atingir o middleware de ownership                                            | Média      | BR                 | Body não validado é usado no enforcement de autorização; risco de comportamento imprevisível                           | Backlog curto prazo |
| TC-06 | Tipos · Certificados | Migration `20260418232720` cria constraint `UNIQUE(codigo, evento_id)` sem cláusula `WHERE deleted_at IS NULL`: restore de tipo cujo código foi recriado falha com constraint violation | Alta       | BR                 | FR-11 especifica unicidade parcial; migration diverge do SRS; restore potencialmente inutilizável                      | Correção imediata   |
| TC-07 | Tipos · Certificados | SSR detalhe de certificado acessa `certificado.TiposCertificado?.texto_base` (singular) mas include usa alias `TiposCertificados` (plural): `textoInterpolado` sempre vazio             | Alta       | BR                 | Texto interpolado nunca exibido no detalhe SSR; violação FR-39                                                         | Correção imediata   |
| TC-08 | Tipos · Certificados | API `POST /:id/restore` de certificados usa `rbac('monitor')`: monitor pode restaurar qualquer certificado soft-deletado via API                                                        | Alta       | BR                 | Contradiz FR-22 ("apenas admin pode restaurar via SSR"); API mais permissiva sem justificativa; violação RBAC          | Backlog crítico     |
| TC-09 | Tipos · Certificados | SSR `POST /admin/certificados` usa `rbac('gestor')`: monitor fica bloqueado de criar certificados pela interface web                                                                    | Alta       | IP                 | Contradiz FR-36 ("monitor pode criar certificados"); divergência API/SSR injustificada                                 | Backlog crítico     |
| TC-10 | Tipos                | API PUT de tipos permite alterar `evento_id` sem validar novo ownership do escopo de destino                                                                                            | Média      | GI                 | Gestor pode mover tipo para evento fora do seu escopo; violação FR-45, FR-46                                           | Backlog curto prazo |
| TC-11 | Tipos                | `scopedEvento` ausente em `GET /tipos-certificados` e `GET /tipos-certificados/:id` via API: gestor/monitor recebe todos os tipos sem filtro                                            | Alta       | GI                 | API não aplica escopo em leitura de tipos; violação FR-37, FR-46                                                       | Backlog crítico     |
| TC-12 | Tipos · Certificados | Formulários SSR de novo/editar certificado carregam todos os tipos sem filtro de evento do usuário                                                                                      | Média      | GI                 | Gestor/monitor vê tipos de outros eventos no seletor do formulário; violação FR-37, FR-45                              | Backlog curto prazo |
| TC-13 | Tipos                | Lógica de ownership (`getEventosIds`, `temOwnership`) duplicada independentemente no `tiposCertificadosSSRController` e no middleware `tiposCertificadosOwnership`                      | Média      | DT                 | Regras de negócio mantidas em dois lugares; BR-02/TC-03 é evidência de divergência já ocorrida; violação NFR-6         | Backlog médio prazo |
| TC-14 | Tipos                | Validação cross-field de `campo_destaque` implementada em hook `beforeValidate` do model Sequelize                                                                                      | Média      | VA                 | Lógica de domínio no model; hook lança `Error` genérico (não `ValidationError`); violação NFR-6                        | Backlog médio prazo |
| TC-15 | Tipos                | `dados_dinamicos` não tem estrutura formal documentada no SRS: UI assume `{chave: rótulo}`, validator aceita `z.record(z.any())`                                                        | —          | AM                 | Clientes da API sem contrato formal sobre o formato; risco de implementação divergente                                 | Atualização SRS     |
| TC-16 | Tipos                | Preview do `texto_base` no formulário SSR usa o rótulo do campo como valor de substituição, não como valor real de exemplo                                                              | —          | AM                 | Preview não representa o output final; pode confundir durante configuração de tipos                                    | Validação humana    |
| TC-17 | Tipos                | Services de tipos usam caminho de import `../../src/models` em vez de `../models`                                                                                                       | Baixa      | DT                 | Funciona apenas pela estrutura atual; frágil ante reorganização de diretórios                                          | Backlog longo prazo |
| TC-18 | Tipos                | `pdfService.js` usa duplo fallback de alias `TiposCertificado                                                                                                                           |            | TiposCertificados` | Baixa                                                                                                                  | DT                  | Código defensivo que obscurece a inconsistência de aliasing (ver TC-07) em vez de corrigi-la | Backlog longo prazo |
| TC-19 | Tipos                | `JSON.parse` de `dados_dinamicos_json` no SSR sem tratamento: mensagem de erro bruta exposta ao usuário via flash                                                                       | Baixa      | DT                 | UX degradada em erro de input; possível information disclosure                                                         | Backlog médio prazo |

---

### 1.4 Achados do Domínio de Dashboard

| ID    | Domínio   | Descrição                                                                                                                                                                                                    | Severidade | Tipo | Impacto                                                                                                                                   | Destino Recomendado                   |
| ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| DB-01 | Dashboard | Três cards (`totalTipos`, `totalCertificadosPendentes`, `totalEventos`) renderizados em view para perfis que não os computam: gestor e/ou monitor veem valores vazios para todas as três métricas            | Alta       | BR   | Dois terços dos perfis internos recebem dashboard sem dados; FR-56 ~33% atendido para gestor/monitor                                      | Correção imediata                     |
| DB-02 | Dashboard | Flag `isMonitor` nunca definida em `authSSR.js`: qualquer `{{#if usuario.isMonitor}}` no template nunca é ativado em produção                                                                                | Média      | BR   | Lógica de view específica de monitor inefetiva; assimetria com `isAdmin` e `isGestor`; testes simulam estado irreal                       | Backlog curto prazo                   |
| DB-03 | Dashboard | `ultimosCertificados` computado pelo controller e passado ao `res.render`, mas `dashboard.hbs` (107 linhas) não contém nenhum `{{#each ultimosCertificados}}` nem tabela correspondente                      | Crítica    | IP   | FR-56 ("5 certificados mais recentes") não atendido na UI; query executada a cada request sem uso; overhead desnecessário; violação FR-56 | Correção imediata                     |
| DB-04 | Dashboard | Backlog `DASH-ADMIN-003` marcado `[x] concluída em 2026-05-08 09:45 (BRT)` mas view não contém a tabela: rastreabilidade de progresso comprometida                                                           | Crítica    | ID   | Stakeholders acreditam que FR-56 está completamente implementado; estado de entrega incorreto documentado                                 | Correção imediata (backlog)           |
| DB-05 | Dashboard | `totalParticipantes` tem semântica dupla: admin recebe `Participante.count()` (total cadastrado); gestor/monitor recebe `Certificado.count({ distinct: 'participante_id' })` (com certificado) — mesma label | Média      | DT   | Decisões baseadas em dado mal interpretado; FR-56 semanticamente ambíguo                                                                  | Atualização SRS + Backlog médio prazo |
| DB-06 | Dashboard | Template de backlog `DASH-ADMIN-003` usa `{{this.Participante.nome}}` mas atributo real do modelo é `nomeCompleto`; quando implementada, a coluna será renderizada vazia                                     | Média      | ID   | Implementação futura baseada no backlog incorreto resultará em coluna vazia sem erro visível                                              | Correção imediata (backlog)           |
| DB-07 | Dashboard | Ausência total de endpoint REST API para métricas/dashboard                                                                                                                                                  | Baixa      | GI   | Sem mecanismo para integração externa com dados agregados; FR-49 mencionado como SSR mas sem decisão explícita                            | Validação humana                      |
| DB-08 | Dashboard | `GET /admin/dashboard` sem middleware `rbac()` explícito; SRS define perfil mínimo "monitor" para essa rota                                                                                                  | Baixa      | VA   | Inconsistência arquitetural com demais rotas SSR; funcionalmente inofensivo mas diverge do padrão declarativo do projeto                  | Backlog longo prazo                   |
| DB-09 | Dashboard | FR-56 não especifica quais status compõem `totalCertificados` nem `ultimosCertificados`                                                                                                                      | Baixa      | AM   | Ambiguidade sobre inclusão de cancelados; decisão de negócio não documentada                                                              | Atualização SRS                       |
| DB-10 | Dashboard | Queries de agregação pesadas (até 7 paralelas) residem diretamente no controller sem `dashboardService.js`                                                                                                   | Baixa      | DT   | Violação de NFR-6 (routes → controllers → services → models)                                                                              | Backlog longo prazo                   |
| DB-11 | Dashboard | SRS declara perfil mínimo "monitor" para `/admin/dashboard`; código não aplica `rbac('monitor')`                                                                                                             | Baixa      | ID   | Divergência documental menor; sem impacto de segurança                                                                                    | Atualização SRS                       |

---

## 2. Lista de Correções Críticas Imediatas

> Critério de inclusão: RBAC, autenticação, escopo multi-tenant, vazamento de dados, privilege escalation, bypass de autorização, falhas de ownership, inconsistências graves API/SSR, agregações incorretas por falta de escopo, emissão impossível de certificados.

---

### CC-01 — Vazamento Multi-tenant Irrestrito na API de Participantes (PA-01)

**Domínio:** Participantes  
**Tipo:** VU — Vulnerabilidade crítica  
**Evidências:**

- `src/routes/participantes.js:L151` — sem `scopedEvento`
- `src/services/participanteService.js:L6-L16` — `findAndCountAll` sem cláusula `WHERE` de escopo
- `tests/routes/protectedManagementRoutes.test.js` — teste valida e aceita o comportamento como correto

**FR violados:** FR-37, NFR-1 (OWASP A01)  
**Explicação:** A rota `GET /participantes` retorna todos os participantes do sistema sem filtro de evento. Qualquer gestor ou monitor autenticado com token JWT válido obtém nome completo, email e instituição de todos os participantes do sistema, independentemente do seu escopo.  
**Risco:** Vazamento massivo de PII entre tenants. Constitui violação direta do isolamento multi-tenant e da OWASP A01 (Broken Access Control).  
**Classificação:** Vulnerabilidade crítica.

---

### CC-02 — Escalada de Privilégio via SSR de Participantes sem RBAC (PA-02)

**Domínio:** Participantes  
**Tipo:** VU — Vulnerabilidade crítica  
**Evidências:**

- `src/routes/admin.js:L89-L98` — comentário explícito "todos os perfis autenticados", sem `rbac()` em nenhuma rota
- Contraste: `src/routes/admin.js:L68` — `POST /certificados` usa `rbac('gestor')`

**FR violados:** FR-35, FR-36, FR-38, NFR-1  
**Explicação:** Todas as rotas SSR de participantes (`/novo`, `/:id/editar`, `POST /`, `POST /:id`, `POST /:id/deletar`, `POST /:id/restaurar`) carece de middleware `rbac()`. Um usuário com perfil `monitor` pode criar, editar, deletar (soft) e restaurar participantes via interface web sem qualquer restrição.  
**Risco:** Privilege escalation funcional direta. Monitor passa a ter capacidade operacional equivalente a gestor ou admin no domínio de participantes.  
**Classificação:** Vulnerabilidade crítica.

---

### CC-03 — SSR de Participantes: Operações por `:id` sem Verificação de Escopo (PA-03)

**Domínio:** Participantes  
**Tipo:** VU — Vulnerabilidade  
**Evidências:**

- `src/controllers/participanteSSRController.js:L79-L168` — `editar`, `atualizar`, `deletar`, `restaurar` usam `participanteService.findById(req.params.id)` sem checar evento

**FR violados:** FR-37, NFR-1  
**Explicação:** A listagem SSR implementa escopo via JOIN, mas operações individuais por `:id` não verificam se o participante pertence ao escopo de eventos do usuário. Um gestor do evento `EDU-2026` pode acessar `/admin/participantes/42/editar` onde `42` é participante do evento `CMP-2026` e modificar seus dados.  
**Risco:** Bypass de ownership em operações de escrita. Violação de isolamento multi-tenant via SSR.  
**Classificação:** Vulnerabilidade de alta severidade.

---

### CC-04 — `valores_dinamicos` Removido pelo Zod: Emissão de Certificados Impossível (TC-01)

**Domínio:** Tipos · Certificados  
**Tipo:** BR — Bug crítico funcional  
**Evidências:**

- `src/validators/certificado.js:L4-L9` — `valores_dinamicos` ausente do schema Zod
- `src/middlewares/validate.js:L4` — `req.body = schema.parse(req.body)` (modo strip silencioso)
- `src/services/certificadoService.js:L49-L55` — detecta campos como faltantes e retorna HTTP 422

**FR violados:** FR-20, FR-54  
**Explicação:** O schema Zod de criação de certificado não declara `valores_dinamicos`. O middleware `validate` usa `schema.parse()` no modo padrão (strip), removendo silenciosamente campos não declarados. O service recebe `valores_dinamicos = {}` e detecta todos os campos do tipo como faltantes, sempre retornando HTTP 422.  
**Risco:** Qualquer tipo de certificado com `dados_dinamicos` preenchido torna **impossível** a emissão de certificados via API REST. O sistema é funcionalmente corrompido para o caso de uso primário.  
**Classificação:** Bug crítico — bloqueador de funcionalidade central.

---

### CC-05 — `scopedEvento` Usa ID do Recurso como ID de Evento (TS-02)

**Domínio:** Participantes · Tipos · Certificados (transversal)  
**Tipo:** BR + VU  
**Evidências:**

- `src/middlewares/scopedEvento.js:L32-L36` — `const eventoId = req.body.evento_id || req.params.eventoId || req.params.id`
- Para `DELETE /certificados/5`: `req.params.id = '5'`; middleware verifica se gestor gerencia o **evento** 5, não o certificado 5

**FR violados:** FR-37, NFR-1  
**Explicação:** Em rotas que operam sobre recursos por `:id` (`PUT /certificados/:id`, `DELETE /certificados/:id`, `DELETE /tipos-certificados/:id`), o middleware `scopedEvento` usa o ID do **recurso** como ID de **evento**. O resultado é não-determinístico: acesso concedido se o ID do recurso coincide numericamente com um evento do usuário, negado caso contrário — por razão aleatória.  
**Risco:** Falso positivo (acesso indevido) e falso negativo (bloqueio indevido) de autorização. Enforcement de multi-tenant não-confiável.  
**Classificação:** Bug crítico com implicação de segurança.

---

### CC-06 — Services Ignoram Filtros de Escopo Injetados: Multi-tenant Ilusório (TS-03)

**Domínio:** Participantes · Tipos · Dashboard (transversal)  
**Tipo:** VA — Violação arquitetural crítica  
**Evidências:**

- `src/services/participanteService.js:L5-L17` — `findAndCountAll({ offset, limit })` sem `evento_id`
- `src/controllers/tiposCertificadosController.js:L14-L19` — `req.query.evento_id` injetado mas ignorado antes de chegar ao service
- `dashboardController.js:L57-L90` — lógica de scoping inline no controller, fora do middleware

**FR violados:** FR-37, NFR-1, NFR-6  
**Explicação:** O `scopedEvento` injeta `evento_id` em `req.query`. Nenhum service de participante, tipo de certificado ou certificado consome esse campo. O middleware representa uma camada de segurança que nunca produz efeito real na camada de dados. O dashboard replica a lógica de scoping ad hoc no controller.  
**Risco:** Todas as proteções de multi-tenancy declaradas no SRS são ineficazes nos domínios auditados. Qualquer gestor ou monitor obtém dados globais independentemente do escopo vinculado.  
**Classificação:** Violação arquitetural crítica — mesma classe de risco que CC-01.

---

### CC-07 — migration UNIQUE(codigo, evento_id) sem Índice Parcial: Restore Impossível (TC-06)

**Domínio:** Tipos · Certificados  
**Tipo:** BR  
**Evidências:**

- `migrations/20260418232720-add-evento-id-to-tipos-certificados.js:L39-L44` — constraint sem `WHERE deleted_at IS NULL`
- `docs/especificacoes.md` FR-11 — exige unicidade `(codigo, evento_id) WHERE deleted_at IS NULL`

**FR violados:** FR-11, FR-16  
**Explicação:** A migration cria a constraint `UNIQUE(codigo, evento_id)` sem a cláusula parcial. FR-11 especifica explicitamente unicidade parcial excluindo registros soft-deletados. Se um tipo soft-deletado tem combinação `(codigo, evento_id)` que foi recriada, o restore falha com constraint violation, tornando a restauração inutilizável.  
**Risco:** FR-16 (soft delete com restore garantido) não atendido; dados irrecuperáveis em cenários de uso normal.  
**Classificação:** Bug de alta severidade.

---

### CC-08 — Dashboard Admin: FR-56 ~43% Não Atendido (DB-01 + DB-03)

**Domínio:** Dashboard  
**Tipo:** BR + IP  
**Evidências:**

- `dashboardController.js:L68-L85` — branch gestor/monitor computa apenas `totalCertificados` e `totalParticipantes`
- `dashboard.hbs:L46, L63, L24-L36` — variáveis `totalCertificadosPendentes`, `totalEventos`, `totalTipos` renderizadas sem guarda de perfil
- `dashboardController.js:L30-L41` — `ultimosCertificados` computado e passado ao `res.render`
- `views/admin/dashboard.hbs` (107 linhas) — sem `{{#each ultimosCertificados}}`

**FR violados:** FR-56  
**Explicação:** Simultaneamente: (1) Três cards visíveis a gestor/monitor exibem valores vazios porque as variáveis não são computadas no branch não-admin. (2) A tabela "5 certificados mais recentes" é computada pelo controller (query executada a cada request) mas a view não a exibe — FR-56 não atendido na UI, com overhead de query desnecessário.  
**Risco:** Dashboard operacionalmente inútil para dois terços dos perfis internos. FR-56 ~57% atendido para admin e ~33% para gestor/monitor.  
**Classificação:** Implementação parcial crítica de requisito funcional explícito.

---

### CC-09 — `authSSR` Plain Object: Middlewares de Autorização Inaplicáveis em SSR (TS-01)

**Domínio:** Participantes · Tipos · Dashboard (transversal)  
**Tipo:** VA  
**Evidências:**

- `src/middlewares/authSSR.js:L50-L59` — `req.usuario` é objeto literal sem métodos Sequelize
- `src/middlewares/scopedEvento.js:L4-L7` — `if (typeof req.usuario.getEventos !== 'function') return HTTP 500`
- `src/middlewares/tiposCertificadosOwnership.js:L29-L32` — mesma verificação

**FR violados:** FR-37, NFR-1, NFR-6  
**Explicação:** Os middlewares de autorização `scopedEvento` e `tiposCertificadosOwnership` exigem `req.usuario.getEventos()`, disponível apenas em instâncias Sequelize. `authSSR` entrega POJO. Qualquer aplicação desses middlewares em rotas SSR retornaria HTTP 500. Como consequência, os controllers SSR reimplementam scoping individualmente (e incorretamente), enquanto a flag `isMonitor` nunca é definida.  
**Risco:** Impossibilidade estrutural de aplicar enforcement de autorização uniforme entre API e SSR. Código de segurança fragmentado e divergente.  
**Classificação:** Falha arquitetural raiz que propaga os demais problemas de multi-tenancy no SSR.

---

## 3. Backlog Arquitetural Priorizado

### 3.1 Curto Prazo — Correções Críticas (antes de qualquer novo desenvolvimento)

| Prioridade | ID            | Descrição                                                                                                     | Justificativa                            |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1          | CC-04 / TC-01 | Corrigir schema Zod de certificado: incluir `valores_dinamicos`, tornar `status` opcional com default         | Bloqueador de funcionalidade central     |
| 2          | CC-01 / PA-01 | Aplicar escopo de evento na API de participantes (service deve receber `eventoIds`)                           | PII exposure crítica                     |
| 3          | CC-02 / PA-02 | Adicionar `rbac()` em todas as rotas SSR de participantes                                                     | Privilege escalation crítica             |
| 4          | CC-03 / PA-03 | Implementar verificação de ownership em operações SSR de participante por `:id`                               | ACL bypass crítico                       |
| 5          | CC-05 / TS-02 | Corrigir `scopedEvento`: usar fetch + verificação de ownership em vez de `req.params.id` para rotas com `:id` | Controle de acesso não-determinístico    |
| 6          | CC-07 / TC-06 | Corrigir migration para constraint `UNIQUE(codigo, evento_id) WHERE deleted_at IS NULL`                       | Restore inutilizável                     |
| 7          | CC-08 / DB-03 | Implementar tabela `ultimosCertificados` na view `dashboard.hbs`                                              | FR-56 não atendido                       |
| 8          | DB-01         | Adicionar variáveis faltantes (`totalTipos`) ao branch gestor ou adicionar guards de perfil na view           | Dashboard inoperante para gestor/monitor |
| 9          | TC-02         | Validar que `tipo_certificado_id` pertence ao mesmo `evento_id` na emissão de certificado                     | Integridade de dados inter-domínios      |
| 10         | TC-03         | Corrigir SSR `index` de tipos: aplicar `WHERE evento_id IN (...)` usando `eventosIds` já obtidos              | Multi-tenant SSR violado                 |
| 11         | TC-05         | Reordenar middlewares: `validate` antes de `tiposCertificadosOwnership`                                       | Body inválido usado para autorização     |
| 12         | TC-07         | Corrigir alias `TiposCertificado` → `TiposCertificados` no `certificadoSSRController`                         | Texto interpolado sempre vazio no SSR    |
| 13         | DB-04         | Corrigir status do backlog DASH-ADMIN-003 para refletir estado real (view sem tabela)                         | Rastreabilidade comprometida             |
| 14         | DB-06         | Corrigir template de backlog: `Participante.nome` → `Participante.nomeCompleto`                               | Implementação futura defeituosa          |
| 15         | TS-06         | Corrigir índice de email em participantes para `WHERE deleted_at IS NULL`                                     | Re-cadastro bloqueado após soft-delete   |
| 16         | PA-05         | Adicionar validação `nomeCompleto.min(3)` nas rotas SSR de participantes                                      | FR-3 não atendido no SSR                 |
| 17         | PA-08         | Aplicar filtro `textWhere` à seção de arquivados no SSR de participantes                                      | Inconsistência de busca                  |

---

### 3.2 Médio Prazo — Incrementais (após estabilização das correções críticas)

| ID            | Descrição                                                                                                                                                                  | Justificativa                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| CC-09 / TS-01 | Refatorar `authSSR` para popular `req.usuario` com instância Sequelize (ou wrapper compatível): unificar contratos de `req.usuario` entre API e SSR, incluindo `isMonitor` | Elimina a raiz dos problemas de autorização SSR |
| CC-06 / TS-03 | Definir estratégia de enforcement de escopo no service layer: controllers devem propagar `eventoIds` aos services; documentar contrato no SRS                              | Elimina a classe de bugs multi-tenant           |
| TC-08         | Corrigir RBAC de restauração de certificados na API: alinhar com FR-22 (apenas admin) ou documentar divergência intencional                                                | Consistência de RBAC                            |
| TC-09         | Corrigir RBAC de criação de certificados via SSR: `rbac('monitor')` conforme FR-36                                                                                         | Blockeio indevido de monitor                    |
| TC-10         | Bloquear alteração de `evento_id` via API PUT de tipos ou validar novo scopo de ownership                                                                                  | Violação de ownership                           |
| TC-11         | Aplicar `scopedEvento` ou filtro equivalente em `GET /tipos-certificados` via API                                                                                          | Escopo não aplicado na leitura                  |
| TC-12         | Filtrar tipos disponíveis nos formulários SSR de certificado pelo escopo do usuário                                                                                        | Multi-tenant no formulário                      |
| TC-04         | Aplicar filtro de evento à seção de arquivados no SSR de tipos                                                                                                             | Extensão de TC-03                               |
| DB-02         | Adicionar `isMonitor: usuario.perfil === 'monitor'` no `authSSR`                                                                                                           | Flag ausente invalida lógica de view            |
| DB-05         | Documentar semântica de `totalParticipantes` por perfil no SRS e na label da view                                                                                          | Ambiguidade de dado                             |
| TC-13         | Centralizar lógica de ownership de tipos em único ponto compartilhado (middleware ou service)                                                                              | Eliminação de duplicação divergente             |
| TC-14         | Mover validação de `campo_destaque` para service ou validator Zod                                                                                                          | Violação de camada arquitetural                 |
| PA-04         | Resolver modelo de scoping de participantes (decisão humana): associação direta a eventos ou aceitar escopo via certificados documentado                                   | Participantes sem certificado invisíveis        |
| PA-06         | Implementar busca textual `?q=` na API de participantes                                                                                                                    | Paridade funcional com SSR                      |
| PA-11         | ADR: definir se `Participante` terá associação direta com `Evento` ou se o scoping via JOIN é a estratégia formal                                                          | Raiz arquitetural do domínio                    |
| TC-19         | Adicionar `try/catch` em `JSON.parse` de `dados_dinamicos_json` no SSR                                                                                                     | UX e information disclosure                     |
| TS-05         | Retornar HTTP 404 em `update`, `delete`, `restore` quando registro não existe (participantes e tipos)                                                                      | Contrato de API                                 |
| PA-07         | Normalizar email para lowercase antes da busca pública                                                                                                                     | Case-sensitivity                                |

---

### 3.3 Longo Prazo — Estratégicos e Dívidas Técnicas

| ID    | Descrição                                                                  | Justificativa            |
| ----- | -------------------------------------------------------------------------- | ------------------------ |
| DB-10 | Criar `dashboardService.js` com a lógica de agregação                      | Conformidade com NFR-6   |
| DB-08 | Adicionar `rbac('monitor')` explícito em `GET /admin/dashboard`            | Conformidade declarativa |
| PA-09 | Corrigir semântica de `PUT /participantes/:id`: remover `schema.partial()` | Contrato REST correto    |
| PA-10 | Unificar `destroy` e `delete` no `participanteService`                     | Eliminação de duplicação |
| TC-17 | Corrigir caminhos de import em services de tipos                           | Fragilidade estrutural   |
| TC-18 | Corrigir alias no `pdfService` para `TiposCertificados` (plural)           | Eliminação de workaround |
| DB-07 | Definir e avaliar necessidade de endpoint REST para métricas               | Integração externa       |
| DB-11 | Sincronizar declaração de `rbac('monitor')` no dashboard SSR com o SRS     | Consistência documental  |

---

## 4. Atualizações Recomendadas no SRS

### SRS-T03-01 — FR-37: Contrato entre middleware e service layer

**Situação atual:** FR-37 especifica que `scopedEvento` injeta `evento_id` para listagens. Não define como o service consome esse filtro nem como rotas com `:id` validam ownership.  
**Problema:** Spec não define o contrato, permitindo implementações que ignoram os filtros injetados (TS-03) e o uso incorreto de `req.params.id` como `evento_id` (TS-02).  
**Ação recomendada:** Adicionar ao FR-37: "Controllers são responsáveis por propagar o `evento_id` ou `eventoIds` injetados pelo `scopedEvento` aos services. Para operações por `:id`, o sistema deve verificar se o recurso pertence ao evento do usuário após fetch, retornando HTTP 403 em caso de violação."  
**Rastreabilidade:** FR-37, NFR-1, TS-02, TS-03, CC-05, CC-06.

---

### SRS-T03-02 — FR-36: Restrição explícita de monitor para modificação de participantes

**Situação atual:** FR-36 afirma que monitor "pode listar e visualizar certificados e participantes dos seus eventos". A omissão de criação/edição/remoção de participantes não é proibição explícita.  
**Problema:** Implementação atual permite que monitores realizem todas as operações de participante via SSR (CC-02) amparada pela ambiguidade do FR-36.  
**Ação recomendada:** Adicionar ao FR-36: "O perfil `monitor` não possui permissão para criar, editar, remover ou restaurar participantes. Essas operações requerem perfil `gestor` ou `admin`."  
**Rastreabilidade:** FR-36, PA-02, CC-02.

---

### SRS-T03-03 — FR-3: Esclarecer que validação se aplica a ambas as superfícies

**Situação atual:** FR-3 define comprimento mínimo de `nomeCompleto` mas não especifica que se aplica a API e SSR.  
**Problema:** Implementação atual aplica apenas via Zod (API); SSR sem validação server-side equivalente (PA-05).  
**Ação recomendada:** Adicionar ao FR-3: "A validação de comprimento mínimo de campos do participante deve ser aplicada em ambas as superfícies (API REST e interface SSR)."  
**Rastreabilidade:** FR-3, PA-05.

---

### SRS-T03-04 — FR-4 / FR-11 / FR-52: Unicidade com soft-delete

**Situação atual:** FRs de soft-delete não especificam comportamento dos índices únicos em cenário de registros excluídos logicamente.  
**Problema:** O índice único global de email (participante) bloqueia re-cadastro após soft-delete. O índice único `(codigo, evento_id)` (tipo) e o código de certificado gerado por `count` podem colidir com restore.  
**Ação recomendada:** Adicionar a FR-4, FR-11 e FR-52: "Índices de unicidade sobre campos de entidades com soft-delete devem ser implementados como índices parciais `WHERE deleted_at IS NULL`, garantindo que registros excluídos logicamente não bloqueiem a criação de novos registros com os mesmos valores."  
**Rastreabilidade:** FR-4, FR-11, FR-52, TS-06, TC-06.

---

### SRS-T03-05 — FR-15: Estrutura formal de `dados_dinamicos`

**Situação atual:** FR-15 afirma que `dados_dinamicos` "define a estrutura dos campos específicos do tipo de certificado" sem especificar o formato.  
**Problema:** UI assume `{chave: rótulo}`, validator aceita `z.record(z.any())` sem contrato formal (TC-15, AM-01).  
**Ação recomendada:** Expandir FR-15: "`dados_dinamicos` é um objeto JSONB cujas chaves são identificadores dos campos dinâmicos (snake_case, usados como placeholders em `texto_base` via `${chave}` e como chaves em `valores_dinamicos`) e cujos valores são strings descritivas (rótulos) exibidas na UI durante preenchimento."  
**Rastreabilidade:** FR-13, FR-15, TC-15.

---

### SRS-T03-06 — FR-56: Definição completa e semântica das métricas do dashboard

**Situação atual:** FR-56 descreve quais métricas são exibidas mas não define: (a) quais status de certificados compõem o total; (b) semântica de "participantes" para gestor/monitor; (c) se tabela de últimos certificados inclui cancelados.  
**Problema:** Ambiguidades geram implementações divergentes e métricas de interpretação incerta (DB-05, DB-09).  
**Ação recomendada:** Expandir FR-56 com três cláusulas: "(a) `totalCertificados` inclui certificados de qualquer status exceto soft-deletados. `totalCertificadosPendentes` inclui exclusivamente `status = 'pendente'`. (b) Para gestor/monitor, `totalParticipantes` representa o número de `participante_id` distintos nos certificados dos eventos do usuário (não o total cadastrado no sistema). (c) A tabela `ultimosCertificados` exibe certificados com `status IN ('emitido', 'pendente')` — **Validação humana:** confirmar se cancelados devem ser excluídos."  
**Rastreabilidade:** FR-56, DB-05, DB-09.

---

### SRS-T03-07 — FR-22: Esclarecer RBAC de restauração de certificados na API

**Situação atual:** FR-22 diz "apenas admin pode restaurar via SSR". Não define restrição para a API.  
**Problema:** API usa `rbac('monitor')` para restore, SSR usa `rbac('admin')` — comportamento divergente (TC-08, CERT-07 em T01).  
**Ação recomendada:** Explicitar: "A restauração de certificados soft-deletados é restrita ao perfil `admin` em ambas as superfícies (API REST e interface SSR)." — ou — "A restrição de admin para restauração aplica-se apenas à interface SSR; a API permite restauração por `[gestor/monitor]`."  
**Rastreabilidade:** FR-22, TC-08.

---

### SRS-T03-08 — UF-19 (authSSR): Documentar ausência de `isMonitor`

**Situação atual:** A documentação de `authSSR` não define o comportamento de `isMonitor`.  
**Problema:** `isMonitor` nunca definida, testes simulam estado irreal, guard `{{#if usuario.isMonitor}}` nunca ativa em produção (DB-02).  
**Ação recomendada:** Documentar explicitamente: "Monitor é identificado por `!isAdmin && !isGestor`. A flag `isMonitor` não é definida pelo `authSSR`. Templates devem usar `{{#unless usuario.isAdmin}}{{#unless usuario.isGestor}}...` para lógica específica de monitor." — ou — adicionar `isMonitor: usuario.perfil === 'monitor'` ao objeto e documentar.  
**Rastreabilidade:** DB-02, TS-01.

---

## 5. Itens para Validação Humana

### VH-T03-01 — Modelo de scoping de participantes: global vs. por evento

**Contexto:** Participantes não possuem `evento_id` direto. O scoping via JOIN em certificados (SSR) exclui participantes sem certificado (PA-04). Criar associação direta exigiria refatoração significativa (PA-11).  
**Questão:** Qual é o modelo de visibilidade desejado para participantes?  
**Opção A:** Participantes são globais — qualquer usuário autenticado pode ver todos (simplifica arquitetura; requer atualização do SRS e FR-37).  
**Opção B:** Scoping via certificados é formal — participantes sem certificado são invisíveis para gestores/monitores (documentar como comportamento intencional em FR-37).  
**Opção C:** Criar associação direta `participante ↔ evento` (nova tabela ou `evento_id` em `participante`) para scoping nativo.  
**Impacto:** Define se PA-01, PA-04, PA-11 são bugs a corrigir ou limitações aceitáveis.  
**Rastreabilidade:** FR-37, PA-01, PA-04, PA-11.

---

### VH-T03-02 — Permissão de monitor para modificar participantes via SSR

**Contexto:** FR-36 é ambíguo. Sem RBAC no SSR (PA-02), monitores têm acesso completo a participantes pela interface web.  
**Questão:** Monitor deve poder criar e editar participantes?  
**Opção A:** Não — implementar `rbac('gestor')` em criação/edição/exclusão (atualizar FR-36).  
**Opção B:** Sim — atualizar FR-36 para refletir permissão de criação/edição por monitor.  
**Rastreabilidade:** FR-36, PA-02, CC-02.

---

### VH-T03-03 — Backlog DASH-ADMIN-003: status real e implementação

**Contexto:** Backlog marcado `[x] concluída em 2026-05-08` mas view não contém a tabela (DB-03, DB-04).  
**Questão:** A view precisa ser implementada (tarefa ainda pendente), ou o backlog deve ser revertido para `[ ]`?  
**Impacto:** Determina se DB-03 é correção imediata ou rastreabilidade de backlog.  
**Rastreabilidade:** FR-56, DB-03, DB-04.

---

### VH-T03-04 — `totalCertificados` no dashboard deve excluir cancelados?

**Contexto:** `Certificado.count()` sem filtro inclui emitidos, pendentes e cancelados. Label da view não especifica (DB-09).  
**Questão:** `totalCertificados` deve incluir cancelados? `ultimosCertificados` deve incluir cancelados?  
**Rastreabilidade:** FR-56, DB-09.

---

### VH-T03-05 — `isMonitor`: adicionar a `authSSR` ou documentar ausência como padrão

**Contexto:** `isAdmin` e `isGestor` são definidos; `isMonitor` não (DB-02, TS-01).  
**Questão:** Adotar `isMonitor: usuario.perfil === 'monitor'` para simetria, ou documentar que monitor é identificado por `!isAdmin && !isGestor`?  
**Rastreabilidade:** DB-02, TS-01.

---

### VH-T03-06 — Endpoint REST de métricas/dashboard: lacuna ou decisão de design?

**Contexto:** Não existe `GET /api/dashboard` ou equivalente (DB-07).  
**Questão:** A ausência é decisão intencional (dashboard puramente SSR) ou lacuna a preencher para suportar integrações externas?  
**Rastreabilidade:** FR-49, DB-07.

---

### VH-T03-07 — `campo_destaque = "nome"`: refere-se a `certificado.nome` ou `participante.nomeCompleto`?

**Contexto:** FR-14 especifica `"nome"` como valor permitido. FR-39 define que `nome` é injetado como `certificado.nome` ou `participante.nomeCompleto` como fallback. Qual valor é o "campo destaque" exibido proeminentemente no certificado?  
**Decisão:** Confirmar semântica exata e verificar se outros campos fixos do sistema (`evento`, `data`) devem ser permitidos como campo destaque.  
**Rastreabilidade:** FR-14, FR-39, TC-15.

---

### VH-T03-08 — `evento_id` de tipo de certificado deve ser imutável após criação?

**Contexto:** `PUT /tipos-certificados/:id` permite alterar `evento_id` sem validar escopo do evento de destino (TC-10). Formulário SSR omite o campo na edição.  
**Questão:** `evento_id` deve ser imutável após criação? Se sim, deve ser enforced na API?  
**Rastreabilidade:** FR-45, TC-10.

---

## 6. Iniciativas de Spec Recomendadas (Spec Kit)

### SPEC-T03-01 — Estratégia de Enforcement Multi-tenant no Service Layer

**Objetivo:** Definir e implementar uma estratégia única de enforcement de escopo por evento no service layer para participantes, tipos de certificados e certificados.  
**Motivação:** A classe de vulnerabilidades mais crítica encontrada nos três domínios (CC-01, CC-03, CC-06, TS-03) deriva da ausência de enforcement real abaixo da camada de middleware. Qualquer correção pontual sem uma decisão arquitetural formal resultará em novas divergências.  
**Achados relacionados:** TS-03, CC-01, CC-02, CC-03, CC-06, PA-01, TC-03, TC-11.  
**FRs relacionados:** FR-37, NFR-1, NFR-6.  
**Pré-requisitos:** Resolução de VH-T03-01 (modelo de scoping de participantes); refinamento de FR-37 (SRS-T03-01).

---

### SPEC-T03-02 — Unificação do Contrato de `req.usuario` entre API e SSR

**Objetivo:** Eliminar a bifurcação estrutural entre `auth` (instância Sequelize) e `authSSR` (POJO) para que middlewares de autorização sejam aplicáveis em ambas as superfícies.  
**Motivação:** TS-01 e CC-09 evidenciam que a raiz dos problemas de autorização SSR é a incompatibilidade estrutural de `req.usuario`. Sem unificação, qualquer novo middleware de segurança falhará em SSR.  
**Achados relacionados:** TS-01, CC-09, TC-13, DB-02.  
**FRs relacionados:** FR-37, FR-38, NFR-1, NFR-6.  
**Pré-requisitos:** ADR descrevendo a abordagem (wrapper compatível vs. carregamento de instância Sequelize completa no SSR).

---

### SPEC-T03-03 — Dashboard Gestor/Monitor Enriquecido

**Objetivo:** Definir formalmente, em extensão de FR-56, o comportamento completo do dashboard para gestor e monitor.  
**Motivação:** IP-02 e DB-01 evidenciam que o dashboard para não-admins está em estado mínimo (2 métricas com cards vazios para 3 outros). Backlog DASH-GEST-001 a DASH-GEST-004 define itens pendentes mas sem spec formal.  
**Achados relacionados:** DB-01, DB-02, DB-03, DB-05.  
**FRs relacionados:** FR-56, FR-36.  
**Pré-requisitos:** Resolução de VH-T03-03 (status DASH-ADMIN-003); VH-T03-04 (semântica de totalCertificados).

---

### SPEC-T03-04 — Scoping e Associação de Participantes por Evento

**Objetivo:** Definir formalmente o modelo de vínculo entre participante e evento, e como o escopo multi-tenant é aplicado ao domínio de participantes.  
**Motivação:** PA-11 e VH-T03-01 expõem que a ausência de `evento_id` direto no modelo `Participante` é a raiz arquitetural de PA-01, PA-04, PA-09 e TS-02.  
**Achados relacionados:** PA-01, PA-04, PA-11, TS-02, TS-03.  
**FRs relacionados:** FR-37, FR-1, FR-4.  
**Pré-requisitos:** Resolução de VH-T03-01.

---

### SPEC-T03-05 — Auditoria de Alterações em Tipos de Certificados

**Objetivo:** Definir imutabilidade parcial ou versionamento de tipos de certificados após existência de certificados vinculados.  
**Motivação:** Alterações em `texto_base`, `campo_destaque` ou `dados_dinamicos` afetam retroativamente a renderização de todos os certificados do tipo. Não existe soft-versioning ou histórico.  
**Achados relacionados:** TC-14, TC-15, TC-16.  
**FRs relacionados:** FR-10, FR-13, FR-14, FR-15.  
**Pré-requisitos:** VH-T03-08 (imutabilidade de `evento_id`).

---

### SPEC-T03-06 — Preview Server-side de Texto de Certificado

**Objetivo:** Definir endpoint `POST /tipos-certificados/preview` para renderização server-side do `texto_base` com `valores_dinamicos` de exemplo usando o `templateService` real.  
**Motivação:** O preview atual no formulário SSR substitui placeholders por rótulos (não por valores reais), induzindo o usuário a acreditar que os campos serão substituídos pelos rótulos no certificado final (TC-16, AM-02).  
**Achados relacionados:** TC-16, TC-15.  
**FRs relacionados:** FR-13, FR-39.  
**Pré-requisitos:** Resolução de VH-T03-07 (semântica de campo_destaque); definição formal de dados_dinamicos (SRS-T03-05).

---

## 7. Análise de Problemas Sistêmicos

### PS-01 — Bifurcação Arquitetural API/SSR como Raiz dos Problemas de Segurança

**Padrão:** Os três domínios auditados apresentam o mesmo padrão de falha: comportamento correto na API, incorreto no SSR (ou vice-versa), com raiz em `authSSR` retornando POJO incompatível com os middlewares de autorização.

**Evidências transversais:**

- Participantes: API com `rbac('monitor')` aplicado; SSR sem RBAC algum
- Tipos: API com `tiposCertificadosOwnership` funcional (instância Sequelize); SSR reimplementação ad hoc com bug na listagem
- Dashboard: Controller reimplementa scoping de evento (segunda query ao banco) em vez de usar `scopedEvento`
- Certificados (T01): Mesma bifurcação em RBAC de restore (monitor vs admin)

**Consequência sistêmica:** Cada domínio desenvolveu seu próprio workaround para a incompatibilidade, gerando: duplicação de lógica de escopo em 4 controllers SSR diferentes, testes simulando estado irreal (`isMonitor: true`), e flag `isMonitor` ausente em produção.

**Risco estrutural:** Qualquer novo domínio SSR replicará o mesmo padrão de workaround, acumulando dívida técnica e riscos de segurança até que a raiz seja endereçada (SPEC-T03-02).

---

### PS-02 — Middleware `scopedEvento` sem Enforcement Real na Camada de Dados

**Padrão:** `scopedEvento` é aplicado em rotas, injeta `evento_id` em `req.query`, mas nenhum service dos três domínios auditados consome esse campo. O middleware existe como decoração sem efeito funcional.

**Evidências:**

- `participanteService.findAll()`: assinatura `{ page, perPage }`, sem `evento_id`
- `tiposCertificadosController.findAll()`: recebe `req.query.evento_id` mas não o propaga ao service
- `dashboardController`: reimplementa scoping manualmente com segunda query ao banco
- T01/CERT-15: mesma observação para `certificadoService`

**Consequência sistêmica:** A camada de middleware como "boundary de segurança" para multi-tenancy é architecturally invalid para todos os domínios. O SRS descreve FR-37 como se o middleware fosse suficiente, mas o enforcement real exigiria contrato com os services.

**Risco:** Um desenvolvedor que aplicar `scopedEvento` a uma nova rota acreditará ter implementado o escopo corretamente, quando na prática nenhum dado está filtrado.

---

### PS-03 — Inconsistência Sistemática de Contrato HTTP para Recursos Inexistentes

**Padrão:** Operações de `update`, `delete` e `restore` nos domínios de participantes e tipos de certificados retornam HTTP 200/204 com payload nulo quando o recurso não existe, em vez de HTTP 404.

**Evidências:**

- `participanteController.js`: `update` → HTTP 200 null; `delete` → HTTP 204; `restore` → HTTP 200 null
- `tiposCertificadosController.js`: `update` → HTTP 200 null; `delete` → HTTP 204
- T02/C-22, C-23: mesma inconsistência em `eventoController`

**Consequência sistêmica:** O padrão de contrato HTTP incorreto é replicado em pelo menos três domínios (eventos, participantes, tipos). Qualquer cliente da API que confie em códigos de status para detectar falhas receberá falso positivo de sucesso.

---

### PS-04 — Soft Delete sem Índice Parcial: Padrão Recorrente

**Padrão:** Múltiplas entidades com soft-delete (`paranoid: true`) possuem índices `UNIQUE` globais que bloqueiam re-cadastro de registros excluídos logicamente.

**Evidências:**

- `participante.email`: índice único global bloqueia re-cadastro após soft-delete (PA-07 via F17)
- `tipos_certificados (codigo, evento_id)`: constraint sem `WHERE deleted_at IS NULL` (TC-06)
- `certificado.codigo`: geração por `count` (sem paranoid) pode colidir após restore (T01/CERT-12)

**Consequência sistêmica:** O padrão de soft-delete foi adotado sem o ajuste correspondente nos índices de unicidade. NFR-4 ("nenhuma entidade deve ser removida permanentemente") entra em conflito com índices que impedem a recriação de dados equivalentes.

---

### PS-05 — Rastreabilidade de Backlog Comprometida

**Padrão detectado:** Backlog items marcados como `[x] concluídos` sem a implementação correspondente.

**Evidência:** DASH-ADMIN-003 marca `[x] concluída em 2026-05-08 09:45 (BRT)`. A view `dashboard.hbs` (107 linhas) não contém nenhuma referência a `ultimosCertificados`. O template de referência do backlog também contém campo incorreto (`Participante.nome` em vez de `nomeCompleto`).

**Risco sistêmico:** Stakeholders e desenvolvedores que consultam o backlog como fonte de verdade do estado de implementação tomam decisões baseadas em estado incorreto. FR-56 aparenta estar atendido quando ~43% não está.

---

### PS-06 — RBAC Inconsistente como Padrão entre Superfícies

**Padrão:** Para a mesma operação, perfis diferentes são exigidos em API e SSR, sem justificativa explícita no SRS.

| Operação               | API                                     | SSR                        | FR violado   |
| ---------------------- | --------------------------------------- | -------------------------- | ------------ |
| Criar certificado      | `rbac('monitor')` ✅                    | `rbac('gestor')` ❌        | FR-36        |
| Restaurar certificado  | `rbac('monitor')` ❌                    | `rbac('admin')` ✅         | FR-22        |
| Modificar participante | `rbac('monitor')` ❌ (muito permissivo) | sem rbac ❌ (sem controle) | FR-35, FR-36 |
| Listar participantes   | Auth apenas ❌                          | Auth apenas ❌             | FR-37        |

**Consequência:** Um ator mal-intencionado pode escolher a superfície que lhe concede mais permissão para cada operação. O RBAC perde valor como controle de acesso quando as superfícies diferem.

---

## 8. Dependências Entre Triagens

> Esta seção relaciona dependências arquiteturais com T01, T02 e 02-rbac-escopo.md.  
> Os domínios dessas triagens NÃO foram reauditados. Apenas dependências com evidência documentada são registradas.

---

### DEP-01 — TS-01 / CC-09 depende de C-07 (T02)

**Achado T02:** `C-07` — "Bifurcação Estrutural de `req.usuario`": `auth` entrega instância Sequelize; `authSSR` entrega POJO sem métodos.  
**Relação:** TS-01 e CC-09 (desta triagem) são as manifestações dos mesmos problemas nos domínios de Participantes, Tipos e Dashboard. A raiz documentada em C-07 (T02) é compartilhada.  
**Importância:** A correção de TS-01/CC-09 (SPEC-T03-02) depende da decisão arquitetural registrada em C-07 (T02). Não corrigir a raiz em T02 invalida qualquer correção pontual nos domínios desta triagem.

---

### DEP-02 — TS-02 / CC-05 depende de C-01 (T02) / CERT-01 (T01)

**Achado T01/02:** `CERT-01` e `C-01` — "`scopedEvento` usa `req.params.id` como `evento_id`" já documentado para o domínio de certificados.  
**Relação:** TS-02 desta triagem é a mesma falha estrutural manifestada nos domínios de Participantes e Tipos de Certificados. A correção deve ser centralizada no middleware `scopedEvento.js`, não domínio por domínio.  
**Importância:** Qualquer correção de TS-02 deve ser coordenada com a correção de CERT-01 (T01) para evitar divergência no middleware compartilhado.

---

### DEP-03 — TS-03 / CC-06 depende de CERT-15 (T01)

**Achado T01:** `CERT-15` — "Padrão arquitetural: middleware injeta filtros que services ignoram" — já documentado para certificados e participantes na T01.  
**Relação:** TS-03 desta triagem estende o mesmo padrão para o domínio de Tipos de Certificados e Dashboard, confirmando que o problema é sistêmico e não isolado.  
**Importância:** A SPEC-T03-01 ("Enforcement Multi-tenant no Service Layer") é a iniciativa que endereça CERT-15 (T01) e TS-03 desta triagem conjuntamente. Devem ser tratadas como uma única iniciativa arquitetural.

---

### DEP-04 — TC-08 / TC-09 dependem de CERT-07 (T01) / C-06 (T02)

**Achados anteriores:** `CERT-07` (T01) e `C-06` (T02) já documentaram a divergência de RBAC para criação e restauração de certificados entre API e SSR.  
**Relação:** TC-08 (monitor restaura via API) e TC-09 (monitor bloqueado de criar via SSR) são instâncias do mesmo padrão sistêmico PS-06, já identificado em T01 e T02.  
**Importância:** A recomendação SRS-T03-07 deve ser coordenada com SRS-01 (T01) para evitar atualização conflitante de FR-22.

---

### DEP-05 — PA-01 / CC-01 dependem de CERT-04 (T01)

**Achado T01:** `CERT-04` — "Participantes API sem nenhum escopo" — já documentado em T01 como achado crítico.  
**Relação:** PA-01 desta triagem reproduz o mesmo achado com evidências adicionais (teste que valida o comportamento como aceito).  
**Importância:** PA-01 e CERT-04 são o mesmo problema. A correção deve ser única. Esta triagem contribui o contexto adicional do teste aceitando o comportamento.

---

### DEP-06 — TC-06 relaciona-se com Spec de Índices Parciais (T01/T02)

**Achados anteriores:** T02 documentou `C-03` (cookies sem `secure`) e outros problemas relacionados a configuração. T01 documentou `CERT-12` (código de certificado sem count de paranoid).  
**Relação:** TC-06 (migration sem índice parcial) e TS-06 (padrão sistêmico de unicidade com soft-delete) confirmam que o problema de índices parciais é transversal a pelo menos três entidades (participante, tipos-certificados, certificado).  
**Importância:** SRS-T03-04 (desta triagem) deve ser coordenada para cobrir todas as migrações afetadas.

---

### DEP-07 — PS-05 (Rastreabilidade de Backlog) não tem precedente em T01/T02

**Observação:** O problema de backlog item marcado incorretamente como concluído (DB-04, PS-05) não foi identificado nas triagens anteriores.  
**Natureza:** Não é um problema de código ou arquitetura técnica, mas de processo de desenvolvimento e rastreabilidade de entrega. A sua resolução depende de processo, não de código.  
**Recomendação:** Considerar adoção de critério de aceite formal para marcar itens como concluídos (e.g., teste de aceitação ou checklist de verificação na view).

---

## Resumo Executivo Final

**Data:** 2026-05-09 19:58 (BRT)  
**Domínios analisados:** Participantes, Tipos de Certificados, Dashboard  
**Achados totais nesta triagem:** 46 (incluindo 6 transversais, 11 de Participantes, 19 de Tipos de Certificados, 10 de Dashboard)

---

### Quantidade de Achados por Categoria

| Categoria                      | Crítica | Alta   | Média  | Baixa  | Sem severidade |
| ------------------------------ | ------- | ------ | ------ | ------ | -------------- |
| VU (Vulnerabilidade)           | 2       | 1      | —      | —      | —              |
| BR (Bug real)                  | 2       | 7      | 6      | 1      | —              |
| VA (Violação arquitetural)     | 3       | 2      | 2      | —      | —              |
| GI (Gap de implementação)      | 1       | 5      | 3      | 2      | —              |
| IP (Implementação parcial)     | 1       | 3      | 2      | —      | —              |
| DT (Dívida técnica)            | —       | —      | 5      | 6      | —              |
| ID (Inconsistência documental) | 1       | —      | 2      | 2      | —              |
| AM (Ambiguidade)               | —       | —      | 1      | 2      | 3              |
| **Total**                      | **10**  | **18** | **21** | **13** | **3**          |

**Achados críticos totais:** 10  
**Correções críticas imediatas identificadas (CC-01 a CC-09):** 9  
**Problemas sistêmicos identificados:** 6  
**Itens para validação humana:** 8  
**Specs futuras recomendadas:** 6  
**Atualizações SRS recomendadas:** 8

---

### Principais Riscos Arquiteturais

1. **Multi-tenancy não enforced** (PS-01, PS-02): A proteção de escopo por evento é ilusória nos três domínios. Qualquer usuário autenticado com perfil gestor ou monitor pode acessar dados de outros eventos via API de participantes (CC-01) e visualizar tipos de certificados de outros eventos (TC-03, TC-11).

2. **Emissão de certificados com campos dinâmicos impossível** (TC-01, CC-04): O caso de uso central do sistema está corrompido. Validator Zod remove `valores_dinamicos` silenciosamente, bloqueando toda emissão via API quando tipos possuem `dados_dinamicos` preenchido.

3. **RBAC sem superfície confiável** (PS-06, TS-04): As superfícies API e SSR aplicam RBAC inconsistente para as mesmas operações. Um ator mal-intencionado explora a diferença escolhendo a superfície com menor restrição.

4. **`authSSR` como raiz arquitetural dos problemas SSR** (PS-01, TS-01, CC-09): A bifurcação estrutural de `req.usuario` impede o reuso dos middlewares de autorização em SSR, forçando reimplementações ad hoc que divergem entre si.

5. **Rastreabilidade de entrega comprometida** (PS-05, DB-04): FR-56 aparenta estar completamente implementado conforme o backlog, mas ~43% não está entregue na UI. Decisões baseadas no backlog estão em risco.

---

### Possíveis Blockers para Evolução Futura

| Blocker                                                                 | Impacto                                                                                                | Domínios afetados                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `authSSR` retornando POJO — incompatível com middlewares de autorização | Qualquer nova feature de segurança SSR falhará imediatamente; mais workarounds ad hoc serão acumulados | Todos os domínios SSR             |
| `scopedEvento` ineficaz como boundary de segurança                      | Expansão do sistema a novos domínios replicará falsos positivos de proteção multi-tenant               | Todos os novos recursos com scope |
| Modelo `Participante` sem `evento_id` direto                            | Impossibilidade de aplicar scoping nativo a participantes sem refatoração de modelo e migrations       | Participantes                     |
| Migration de índice parcial ausente                                     | Restore de registros soft-deletados pode falhar sem alerta até que a colisão ocorra em produção        | Tipos de Certificados             |
| Validator Zod removendo `valores_dinamicos`                             | Uso do sistema em produção para a funcionalidade principal é bloqueado                                 | Certificados / Tipos              |

---

_Triagem produzida em 2026-05-09 19:58 (BRT)_  
_Próxima triagem recomendada: análise de PDF, R2 e consultas públicas (domínios ainda não cobertos pela auditoria 07)_
