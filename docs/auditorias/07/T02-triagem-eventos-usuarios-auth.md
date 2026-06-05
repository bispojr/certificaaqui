# T02 — Triagem Arquitetural Consolidada  
## Domínios: Eventos · Usuários · Autenticação/Autorização

**Sistema:** Certifique-me  
**SRS auditado:** v2.0 (2026-04-30)  
**Triagem produzida em:** 2026-05-09 18:59 (BRT)  
**Analista:** GitHub Copilot (Claude Sonnet 4.6)  
**Status:** Concluído

---

# 1. Nota Metodológica

## 1.1 Auditorias-base utilizadas

Esta triagem consolida **exclusivamente** os achados das seguintes auditorias:

| Auditoria | Arquivo | Domínio | Data |
|---|---|---|---|
| 07/03 | `docs/auditorias/07/03-eventos.md` | Eventos | 2026-05-09 |
| 07/04 | `docs/auditorias/07/04-usuarios.md` | Usuários | 2026-05-09 |
| 07/05 | `docs/auditorias/07/05-auth-autorizacao.md` | Autenticação e Autorização | 2026-05-09 |

O SRS utilizado como referência normativa é `docs/especificacoes.md` v2.0.

## 1.2 Limitações

- Esta triagem **não analisou código diretamente**. Todos os achados derivam das auditorias-base e do SRS.
- O raciocínio consolidado é inferencial: deduplicação, detecção de padrões e mapeamento de dependências são realizados sobre os achados já documentados, sem introdução de novos dados.
- Severidades e impactos foram avaliados considerando as evidências descritas pelas auditorias-base. Divergências de severidade entre auditorias foram resolvidas pelo critério mais conservador (maior severidade).

## 1.3 Domínios **não** auditados — sem extrapolação

Os domínios a seguir **não fazem parte** desta triagem. Nenhum comportamento é assumido nem extrapolado para eles:

- Certificados (além das interseções com RBAC/ownership citadas nas auditorias)
- Participantes
- Tipos de Certificados (além das interseções com scope enforcement citadas)
- PDF e Templates
- Upload (Cloudflare R2)
- Dashboard (além da menção pontual à ausência de RBAC explícito)

## 1.4 Metodologia de deduplicação

Achados com evidências sobrepostas entre duas ou mais auditorias foram mesclados em um único item consolidado (C-XX). A rastreabilidade às auditorias de origem é preservada em coluna dedicada.

---

# 2. Matriz Consolidada de Achados

> **Legenda de tipos:** BR = Bug real · GI = Gap de implementação · IP = Implementação parcial · ID = Inconsistência documental · DT = Dívida técnica · VU = Vulnerabilidade · AM = Ambiguidade · VA = Violação arquitetural  
> **Legenda de severidade:** Crítica · Alta · Média · Baixa

| ID | Domínios | Descrição resumida | Sev. | Tipo | Impacto | Auditorias origem | Destino recomendado |
|---|---|---|---|---|---|---|---|
| **C-01** | Auth/Eventos/Certificados | `scopedEvento` usa `req.params.id` (ID do recurso) como `evento_id`, tornando controle de acesso item-level não-determinístico | Crítica | BR | Acesso cross-event por coincidência numérica | 05 (BR-002) | Backlog crítico / ADR |
| **C-02** | Auth/Eventos | RBAC incorreto (`rbac('monitor')`) nas rotas de mutação de eventos via API (PUT, DELETE, restore) | Alta | BR | Gestor/monitor pode atualizar e deletar eventos que não deveriam gerenciar | 03 (EVT-01), 05 (BR-001) | Backlog crítico |
| **C-03** | Auth/Usuários | Cookie JWT sem flag `secure`; cookie de sessão (`express-session`) sem atributos de segurança (`secure`, `httpOnly`) | Alta | VU | Cookies de autenticação transmissíveis por HTTP em produção | 04 (U-03), 05 (VU-001, DT-001) | Backlog crítico |
| **C-04** | Auth/Usuários | API login retorna mensagens distintas: "Usuário não encontrado" vs "Senha inválida" — user enumeration (OWASP A07) | Média | VU | Atacante confirma e-mails cadastrados | 04 (U-01), 05 (VU-002) | Backlog crítico |
| **C-05** | Auth/Usuários | Login SSR (`POST /login`) sem rate limiting; apenas API protegida | Média | GI | Brute-force irrestrito via formulário web | 04 (U-02), 05 (GI-001) | Backlog crítico |
| **C-06** | Auth/Certificados | SSR criação de certificado exige `rbac('gestor')` mas FR-36 especifica `monitor` como perfil mínimo | Alta | BR | Monitores não conseguem criar certificados via SSR; divergência entre superfícies | 05 (BR-003) | Backlog crítico |
| **C-07** | Auth/Eventos/Usuários | `req.usuario` recebe estruturas incompatíveis: `auth` entrega instância Sequelize (com `getEventos()`), `authSSR` entrega POJO sem métodos; `email` ausente no SSR | Alta | VA | Middlewares de autorização (`scopedEvento`, `tiposCertificadosOwnership`) só funcionam na API; qualquer uso em SSR gera HTTP 500 | 03 (EVT-16), 04 (U-14, U-19), 05 (IP-002, PA-01) | Backlog arquitetural / ADR / Spec |
| **C-08** | Usuários | Ausência de `usuarioService.js`: lógica de negócio (JWT, bcrypt, associação N:N) reside no controller | Alta | VA | Violação de NFR-6; CRUD de usuários não reutilizável; inconsistência arquitetural com demais domínios | 04 (U-04, A1) | Backlog arquitetural |
| **C-09** | Auth/Usuários | RBAC de `POST /:papel/:id/usuarios` implementado manualmente no controller (`usuarioController.create`), fora do middleware `rbac` | Alta | VA | RBAC não centralizado; padrão divergente dos demais domínios | 04 (U-05, A2), 05 (VA-001) | Backlog arquitetural |
| **C-10** | Auth/Usuários | URL pattern `/:papel/:id/usuarios` montado globalmente em `app.use('/')`: namespace excessivamente amplo, ID do admin exposto na URL | Alta | VA | Information disclosure + potencial colisão de rotas; padrão REST não convencional | 04 (U-06), 05 (VA-002) | Backlog arquitetural / Spec futura |
| **C-11** | Auth/Eventos | `scopedEvento` aplicado a `POST /eventos` sem `evento_id` no corpo: bloqueia não-admins com mensagem enganosa "Acesso restrito ao evento vinculado" | Média | BR | RBAC acidental sem decisão arquitetural explícita; mensagem incorreta | 03 (EVT-02), 05 (PA-04) | Backlog curto prazo |
| **C-12** | Auth/Eventos/Usuários | `rbac` middleware retorna `JSON 403` em qualquer contexto, inclusive SSR | Média | VA | UX quebrada em SSR: botões de ação resultam em JSON bruto ao invés de redirect/flash | 03 (EVT-10, EVT-11), 04 (U-16), 05 (implícito em PA-02) | Backlog médio prazo |
| **C-13** | Eventos | `eventoSSRController.index` executa queries Sequelize diretamente no controller, bypassando `eventoService` | Média | VA | Lógica de negócio duplicada; violação de NFR-6 | 03 (EVT-08) | Backlog médio prazo |
| **C-14** | Eventos | `scopedEvento` injeta `req.query.evento_id` em listagens, mas `eventoService.findAll` ignora esse campo e aplica escopo próprio via `usuario.id` | Média | VA | Dois mecanismos de escopo coexistentes sem coordenação; divergência futura silenciosa | 03 (EVT-09) | Backlog médio prazo |
| **C-15** | Auth/Tipos | `GET /tipos-certificados` (API) sem `scopedEvento`: gestor/monitor visualiza tipos de todos os eventos | Média | GI | Vazamento de dados de escopo; FR-37 não atendido | 05 (GI-002) | Backlog médio prazo |
| **C-16** | Auth/Tipos | `tiposCertificadosSSRController.index` exibe todos os tipos sem filtro de evento; escopo apenas visual (`podeEditar`) | Média | IP | Mesma violação de FR-37 na superfície SSR | 05 (IP-003) | Backlog médio prazo |
| **C-17** | Auth/Certificados | SSR: operações de item em certificados (`detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`) sem verificação de ownership de evento | Alta | GI | Gestor pode editar/cancelar/deletar certificados de qualquer evento via SSR | 05 (GI-003) | Backlog crítico |
| **C-18** | Auth/Certificados | Formulário SSR de criação de certificado usa `Evento.findAll()` sem filtro de escopo | Média | GI | Gestor/monitor vê todos os eventos e tipos no formulário | 05 (GI-004) | Backlog médio prazo |
| **C-19** | Usuários | API REST de usuários sem CRUD completo (ausentes: `GET /usuarios`, `GET /usuarios/:id`, `PUT /usuarios/:id`, `DELETE/:id`, `POST/:id/restore`) | Alta | GI | FR-26 ("CRUD completo") não atendido na superfície API | 04 (U-07) | Backlog médio prazo / Validação humana |
| **C-20** | Usuários | Criação/edição SSR de usuário sem validação de força de senha; schema Zod da API exige apenas 6 chars | Média | IP | FR-57 (senha forte) só se aplica ao self-service; admin pode criar usuários com senha fraca | 04 (U-09) | Backlog médio prazo / Validação humana |
| **C-21** | Eventos | Campos de layout (`texto_x/y`, `validacao_x/y`) ausentes do schema Zod: stripped antes de chegar ao service | Alta | GI | FR-48 inacessível via API; configuração de layout possível apenas via SSR | 03 (EVT-07) | Backlog médio prazo / Validação humana |
| **C-22** | Eventos | `eventoController.update()` e `.restore()` retornam HTTP 200 com corpo `null` quando evento não existe | Alta | BR | Cliente não distingue sucesso de recurso inexistente; deveria ser HTTP 404 | 03 (EVT-03, EVT-04) | Backlog curto prazo |
| **C-23** | Eventos | `eventoController.delete()` retorna HTTP 204 quando evento inexiste | Média | BR | Cliente não distingue deleção bem-sucedida de recurso inexistente | 03 (EVT-05) | Backlog curto prazo |
| **C-24** | Eventos | Validator Zod valida `url_template_base` como `z.string().url()`, mas campo armazena key R2 (ex.: `templates/cbie/2026/base.jpg`) | Alta | BR | Via API, nenhuma key R2 válida pode ser gravada; campo inutilizável pela API | 03 (EVT-06, EVT-17) | Backlog crítico |
| **C-25** | Eventos | Modelo Sequelize de `Evento` não valida `nome` mínimo 3 chars nem `ano >= 2000` a nível de model | Média | GI | Via SSR (sem Zod), eventos com nome vazio ou ano inválido podem ser gravados | 03 (EVT-15) | Backlog curto prazo |
| **C-26** | Usuários | `usuarioSSRController.criar` e `.atualizar` não validam se eventos informados existem | Média | IP | Associações a eventos inexistentes podem falhar silenciosamente | 04 (U-10, U-11) | Backlog curto prazo |
| **C-27** | Usuários | `usuarioController.login` sem `try/catch`: exceções de banco propagam para handler genérico do Express | Média | BR | Resposta não controlada em falhas de banco; inconsistente com demais controllers | 04 (U-08) | Backlog curto prazo |
| **C-28** | Auth/Usuários | `authSSR` sem validação explícita de `JWT_SECRET` na carga do módulo; `auth.js` valida corretamente | Baixa | IP | NFR-3 não plenamente garantido pelo módulo authSSR | 04 (U-15), 05 (IP-001, DT-002) | Backlog médio prazo |
| **C-29** | Eventos | `eventoService.restore()` restaura todos os registros `UsuarioEvento` do evento, incluindo vínculos removidos individualmente antes do soft-delete | Média | IP | Semântica incorreta: restaurar evento restaura vínculos de usuários desvinculados por razão própria | 03 (EVT-13) | Backlog médio prazo / Validação humana |
| **C-30** | Auth | `express-session` sem configuração de `cookie.secure` e `cookie.httpOnly` | Média | DT | Cookie de sessão sem atributos de segurança em produção HTTP | 05 (DT-001) | Backlog médio prazo |
| **C-31** | Auth | Ausência de logging para tentativas de autenticação falhas | Baixa | DT | Sem rastreabilidade de ataques de brute-force ou falhas de login | 05 (DT-003) | Backlog longo prazo |
| **C-32** | Usuários | `usuario_eventos` paranoid=true com `setEventos()` acumula linhas soft-deleted sem coleta | Baixa | DT | Crescimento indefinido da tabela de junção | 04 (U-17) | Backlog longo prazo |
| **C-33** | Usuários | `usuarioSSRController.index` sem paginação: carrega todos os usuários do banco | Baixa | DT | Degradação de performance com volume elevado | 04 (U-18) | Backlog longo prazo |
| **C-34** | Eventos | `require()` inline dentro de métodos do `eventoService` (antipadrão) | Baixa | DT | Dificulta análise de dependências e mocking em testes | 03 (EVT-14) | Backlog longo prazo |
| **C-35** | Eventos | Método `eventoService.destroy()` órfão (não chamado por nenhum controller) | Baixa | DT | Risco de confusão com `eventoService.delete()` | 03 (EVT-12) | Backlog longo prazo |
| **C-36** | Swagger | Swagger schema `Evento` não documenta campos `url_template_base`, `texto_x/y`, `validacao_x/y`; schema de usuário não reflete rota real | Baixa | DT | Documentação OpenAPI incompleta/incorreta | 03 (EVT-20), 04 (U-13) | Backlog longo prazo |
| **C-37** | ID | FR-44 internamente contraditório: declara "URL válida" mas tabela do modelo define "key (caminho) do R2" | Baixa | ID | Gera implementação divergente entre Zod (URL) e SSR controller (key) | 03 (EVT-17) | Atualização SRS |
| **C-38** | ID | FR-30 documenta `POST /auth/login`; implementação usa `POST /login` | Baixa | ID | Documentação de rota incorreta no SRS | 04 (U-12), 05 (ID-002) | Atualização SRS |
| **C-39** | ID | FR-22 ambíguo sobre permissão de restauração de certificado via API (admin via SSR vs monitor via API) | Baixa | ID | Comportamentos divergentes sem justificativa explícita | 05 (ID-001) | Atualização SRS / Validação humana |
| **C-40** | AM | FR-48 não especifica se campos de layout são configuráveis via API ou apenas via SSR | Baixa | AM | Ausência do Zod pode ser gap ou decisão intencional — não é possível determinar | 03 (EVT-18) | Atualização SRS / Validação humana |
| **C-41** | AM | FR-37 não enumera explicitamente quais recursos são cobertos por `scopedEvento` | Baixa | AM | Ambiguidade sobre tipos-certificados e participantes | 05 (AM-001) | Atualização SRS |
| **C-42** | AM | FR-8 não especifica sensibilidade a maiúsculas de `codigo_base` | Baixa | AM | `EDU` e `edu` podem ser distintos no PostgreSQL | 03 (EVT-19) | Atualização SRS |
| **C-43** | AM | FR-29/FR-57: política de senha forte não especificada para admin criando/editando outro usuário | Baixa | AM | Ambiguidade funcional: self-service tem senha forte; criação por admin não tem requisito | 04 (U-20) | Atualização SRS / Validação humana |

---

# 3. Problemas Críticos Imediatos

## 3.1 — C-01: Controle de Acesso Item-Level Não-Determinístico

**Tipo:** BR — Bug real  
**Domínios:** Auth, Certificados (via scopedEvento)  
**Auditorias:** 05 (BR-002)

O middleware `scopedEvento` resolve `evento_id` como:

```
evento_id = req.body.evento_id || req.params.eventoId || req.params.id
```

Para rotas de recurso como `GET /certificados/:id` e `PUT /certificados/:id`, `req.params.id` contém o **ID do certificado**, não um ID de evento. O middleware compara esse valor contra o array de eventos do usuário. O resultado é:

- Se o ID do certificado coincide numericamente com um evento vinculado → acesso concedido erroneamente
- Se não coincide → acesso bloqueado erroneamente (falso negativo)

**Impacto:** O controle de acesso de certificados (e possivelmente outros recursos item-level) é **determinado por coincidência numérica**, não por regra de negócio. Violation de NFR-1 (OWASP A01).

**Criticidade:** Máxima — falha de controle de acesso que pode conceder ou negar acesso por razões aleatórias.

---

## 3.2 — C-02: Escalada Horizontal de Privilégios via API de Eventos

**Tipo:** BR — Bug real  
**Domínios:** Auth, Eventos  
**Auditorias:** 03 (EVT-01), 05 (BR-001)

Rotas de mutação de eventos (`PUT /eventos/:id`, `DELETE /eventos/:id`, `POST /eventos/:id/restore`) usam `rbac('monitor')`. O SRS especifica `admin` como perfil mínimo para estas operações (tabela API, FR-34 a FR-36). Um gestor ou monitor com token JWT válido e vinculado ao evento pode atualizar ou deletar logicamente esse evento.

**Contraste:** A superfície SSR usa `rbac('admin')` corretamente para as mesmas operações. A API é mais permissiva do que o SRS autoriza.

---

## 3.3 — C-03: Cookies sem Atributo `secure`

**Tipo:** VU — Vulnerabilidade  
**Domínios:** Auth  
**Auditorias:** 04 (U-03), 05 (VU-001, DT-001)

Dois cookies de autenticação carecem do atributo `secure: true`:
1. Cookie JWT (`token`) em `src/routes/auth.js`
2. Cookie de sessão do `express-session` em `app.js`

Em produção HTTPS com proxy reverso (ex.: Nginx), esses cookies ainda podem ser transmitidos em requisições HTTP internas caso o flag não esteja configurado explicitamente, constituindo vector de interceptação (OWASP A02).

---

## 3.4 — C-04: User Enumeration no Login da API

**Tipo:** VU — Vulnerabilidade  
**Domínios:** Auth, Usuários  
**Auditorias:** 04 (U-01), 05 (VU-002)

O endpoint `POST /usuarios/login` retorna mensagens distintas para e-mail inexistente ("Usuário não encontrado") vs senha incorreta ("Senha inválida"). A superfície SSR implementa corretamente a mensagem unificada "Credenciais inválidas". A divergência entre superfícies constitui OWASP A07 (Identification and Authentication Failures).

---

## 3.5 — C-05: Brute-Force Irrestrito no Login SSR

**Tipo:** GI — Gap de implementação  
**Domínios:** Auth, Usuários  
**Auditorias:** 04 (U-02), 05 (GI-001)

FR-55 especifica rate limiting para `POST /usuarios/login` (API). A rota SSR `POST /login` executa a mesma operação de autenticação sem qualquer limitação de tentativas. Um atacante pode contornar o rate limiting da API usando a interface web.

---

## 3.6 — C-06: Monitor Excluído de Criação de Certificado na SSR

**Tipo:** BR — Bug real  
**Domínio:** Auth, Certificados  
**Auditoria:** 05 (BR-003)

FR-36 especifica `monitor` como perfil mínimo para criar certificados. A rota SSR usa `rbac('gestor')`, excluindo monitores da operação na interface web. A API usa `rbac('monitor')` corretamente. Assimetria injustificada entre superfícies.

---

## 3.7 — C-17: SSR Certificados sem Ownership Item-Level

**Tipo:** GI — Gap de implementação  
**Domínio:** Auth, Certificados  
**Auditoria:** 05 (GI-003)

Operações de item em certificados via SSR (`detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`) não verificam se o certificado pertence ao escopo de eventos do usuário. A listagem SSR aplica filtro correto; as operações de item, não. Um gestor autenticado pode realizar essas operações em qualquer certificado do sistema.

---

## 3.8 — C-24: Campo `url_template_base` Inutilizável via API

**Tipo:** BR — Bug real  
**Domínio:** Eventos  
**Auditoria:** 03 (EVT-06, EVT-17)

O validator Zod valida `url_template_base` como `z.string().url()`. O campo armazena uma **key R2** (ex.: `templates/cbie/2026/base.jpg`), que não passa na validação de URL. Nenhuma key R2 válida pode ser gravada via API. Se enviada como URL completa, passaria a validação mas causaria falha no PDF generator (que espera uma key, não uma URL). O SRS (FR-44) é internamente contraditório sobre a natureza do campo (ver C-37).

---

# 4. Problemas Arquiteturais Transversais

## 4.1 — Bifurcação Estrutural de `req.usuario` (C-07)

**Origem:** 03 (EVT-16), 04 (U-14, U-19), 05 (IP-002, PA-01)

Os dois middlewares de autenticação entregam objetos `req.usuario` estruturalmente incompatíveis:

| Atributo | `auth.js` (API) | `authSSR.js` (SSR) |
|---|---|---|
| `id` | ✅ | ✅ |
| `nome` | ✅ | ✅ |
| `perfil` | ✅ | ✅ |
| `email` | ✅ | ❌ ausente |
| `getEventos()` | ✅ (instância Sequelize) | ❌ ausente (POJO) |
| `isAdmin` / `isGestor` | ❌ | ✅ computados |

**Consequência sistêmica:** Os middlewares `scopedEvento` e `tiposCertificadosOwnership` exigem `getEventos()` e falham com HTTP 500 se chamados em contexto SSR. O sistema funciona no estado atual apenas porque esses middlewares não são aplicados a rotas SSR. Qualquer evolução que exija filtro de escopo em rotas SSR falharia imediatamente. Como workaround, controllers SSR reimplementaram lógica de escopo própria (`getEventosIds`, `temOwnership`), criando duplicação divergente da lógica dos middlewares.

**Classificação:** Falha estrutural raiz que gera dependências frágeis e impede reutilização de middlewares de autorização entre superfícies.

---

## 4.2 — Ausência da Camada de Service para Usuários (C-08)

**Origem:** 04 (U-04, A1)

Todos os domínios auditados possuem service dedicado (`eventoService`, `participanteService`, `tiposCertificadosService`, `certificadoService`). O domínio de usuários é a única exceção: autenticação, hash de senha, geração de JWT, associação N:N (usuário↔evento) e validação de existência de eventos residem diretamente no controller.

Violação de NFR-6 (`routes → controllers → services → models`). O controller de usuários acumula responsabilidades de três camadas distintas.

---

## 4.3 — RBAC Não-Centralizado no Domínio de Usuários (C-09)

**Origem:** 04 (U-05, A2), 05 (VA-001)

A rota `POST /:papel/:id/usuarios` não usa o middleware `rbac`. A verificação de perfil `admin` é realizada manualmente dentro do controller, incluindo parâmetros de URL (`req.params.id`, `req.params.papel`) como parte da lógica de autorização. Isso quebra o padrão fail-fast do projeto e dificulta auditoria centralizada de RBAC.

**Contraste:** Todos os demais domínios aplicam `rbac('...')` no nível de rota, antes de qualquer lógica de controller.

---

## 4.4 — Dois Sistemas de Escopo Paralelos e Não Coordenados (C-14)

**Origem:** 03 (EVT-09)

Para listagem de eventos (`GET /eventos`):
- `scopedEvento` injeta `req.query.evento_id`
- `eventoController.findAll` ignora esse campo e passa apenas `req.usuario` para `eventoService.findAll`
- `eventoService.findAll` aplica seu próprio filtro de escopo baseado em `usuario.id`

O resultado final é funcionalmente correto, mas os dois mecanismos coexistem sem contrato. Uma alteração em um sem atualizar o outro pode gerar divergência silenciosa de escopo.

---

## 4.5 — `rbac` Middleware com Resposta JSON em Contexto SSR (C-12)

**Origem:** 03 (EVT-10, EVT-11), 04 (U-16)

O middleware `rbac` retorna sempre `res.status(403).json(...)`, independentemente de ser chamado por rota API ou SSR. Em contexto SSR, a resposta esperada seria redirect com flash message ou renderização de página de erro HTML. O resultado atual é JSON bruto exposto ao usuário na interface web, com botões de ação visíveis que resultam em erro JSON ao serem clicados (C-11 do calendário de view).

---

## 4.6 — Validação em Duas Camadas Sem Coordenação (C-25, C-26)

**Origem:** 03 (EVT-15), 04 (U-10, U-11)

A validação de entrada ocorre via Zod (API) e via Sequelize (ambas as superfícies). Porém:
- O modelo `Evento` Sequelize não valida `nome` mínimo 3 chars nem `ano >= 2000` (restrições presentes apenas no Zod)
- O SSR de usuários não valida existência de eventos antes de criar associações

A ausência de validação no nível de model cria brechas que são exploráveis via qualquer superfície que não passe pelo Zod (principalmente SSR).

---

## 4.7 — Ausência de Contrato Explícito entre `scopedEvento` e Services (C-14)

**Origem:** 03 (EVT-09)

O middleware `scopedEvento` e os services (`eventoService`, possivelmente `certificadoService`) implementam lógica de escopo de forma independente e não coordenada. Não existe contrato documentado definindo qual camada é a fonte de verdade para o filtro de escopo.

---

# 5. Divergências entre API e SSR

| Aspecto | API (Bearer JWT) | SSR (Cookie HTTP-only) | Achado | Conformidade SRS |
|---|---|---|---|---|
| **Autenticação** | JWT Bearer header | Cookie `httpOnly` | Conforme FR-30 | ✅ |
| **Mensagem de erro login** | Distintas por caso | "Credenciais inválidas" | API vaza existência (C-04/VU-002) | ❌ API |
| **Rate limiting no login** | ✅ `loginLimiter` | ❌ Ausente | Gap na SSR (C-05/GI-001) | ❌ SSR |
| **Cookie `secure`** | N/A | ❌ Ausente | Vulnerabilidade (C-03) | ❌ |
| **RBAC mutações de evento** | `rbac('monitor')` ❌ | `rbac('admin')` ✅ | API incorrect (C-02) | ❌ API |
| **Criação de certificado** | `rbac('monitor')` ✅ | `rbac('gestor')` ❌ | SSR incorrect (C-06) | ❌ SSR |
| **Ownership certificado/:id** | `scopedEvento` (incorreto) ❌ | Sem verificação ❌ | Ambas erradas (C-01, C-17) | ❌ Ambas |
| **Listagem tipos-certificados** | Sem filtro de escopo ❌ | Sem filtro de escopo ❌ | Ambas sem escopo (C-15, C-16) | ❌ Ambas |
| **Formulário criação cert.** | N/A | Sem filtro de escopo ❌ | Gap SSR (C-18) | ❌ SSR |
| **`req.usuario` estrutura** | Instância Sequelize | POJO sem métodos | Bifurcação estrutural (C-07) | ❌ Design |
| **Tipo de resposta RBAC negado** | JSON 403 | JSON 403 | JSON em contexto SSR (C-12) | ❌ SSR |
| **CRUD completo de usuários** | Parcial (sem GET/PUT/DELETE) | ✅ Completo via admin | Gap API (C-19) | ❌ API |
| **Validação força de senha (criação)** | Schema 6 chars apenas | Sem validação | Ambas abaixo do FR-57 (C-20) | ❌ Ambas |
| **Campos de layout (`texto_x/y`)** | Stripped pelo Zod | Persistidos corretamente | Gap API (C-21) | ❌ API |
| **`url_template_base` validação** | `z.string().url()` (errado) | Armazena key (correto) | Inconsistência (C-24) | ❌ API |
| **Respostas HTTP (update/restore)** | 200+null quando não encontrado | Redirect com flash | Semântica HTTP incorreta na API | ❌ API |
| **Validação existência de eventos (user)** | ✅ Verificada | ❌ Não verificada | Gap SSR (C-26) | ❌ SSR |
| **Rota SSR de login** | N/A | `/login` (não `/auth/login`) | Diverge SRS (C-38) | ❌ SRS |

---

# 6. Dependências Arquiteturais

## 6.1 Mapa de Dependências entre Achados

```
C-07 (bifurcação req.usuario)
 ├── bloqueia → uso de scopedEvento em rotas SSR
 ├── causa raiz de → C-01 (se scopedEvento fosse corrigido e aplicado a SSR)
 ├── causa raiz de → C-17 (controllers SSR reimplementaram escopo como workaround)
 └── bloqueio para → SPEC-CONTRACT-USUARIO (spec futura)

C-01 (scopedEvento item-level)
 ├── afeta → C-17 (ownership SSR usa caminho diferente por workaround)
 └── depende de → correção de C-07 para funcionar em SSR também

C-08 (ausência usuarioService)
 ├── agrupa → C-09 (RBAC no controller)
 ├── agrupa → C-27 (try/catch ausente)
 └── pré-requisito para → SPEC-U-03 (extração do service)

C-09 (RBAC no controller)
 └── depende de → C-10 (URL pattern) para ser refatorado corretamente
 
C-10 (URL pattern /:papel/:id/usuarios)
 └── bloqueio para → C-19 (CRUD completo de usuários via API)

C-24 (url_template_base validação)
 └── depende de → C-37 (resolução de ambiguidade no SRS FR-44)

C-21 (campos layout ausentes do Zod)
 └── depende de → C-40 (decisão SRS sobre superfície de gestão)
```

## 6.2 Pré-requisitos Arquiteturais

| Pré-requisito | Achado bloqueado | Motivo |
|---|---|---|
| Resolução de C-37 (FR-44 SRS) | C-24 | Sem decisão sobre URL vs key, validator não pode ser corrigido |
| Resolução de C-40 (FR-48 SRS) | C-21 | Sem decisão sobre API access, schema Zod não pode ser atualizado |
| Resolução de C-07 (req.usuario) | Qualquer scope enforcement em SSR | Middlewares de autorização incompatíveis com SSR |
| Criação de C-08 (usuarioService) | C-09, C-27, SPEC-U-01 a U-05 | Refatorações dependem da camada de service existir |
| Resolução de C-10 (URL pattern) | C-09, C-19 | RBAC correto e CRUD completo dependem de URL convencional |
| Resolução de C-41 (FR-37 scope) | C-15, C-16 | Sem definição explicita de escopo, gaps de implementação não podem ser corrigidos |

## 6.3 Necessidades de ADR

| ADR proposto | Motivação | Achados relacionados |
|---|---|---|
| **ADR-XXX: Contrato de `req.usuario`** | Formalizar campos obrigatórios, tipo e origem para API e SSR | C-07, C-01, C-17 |
| **ADR-XXX: Algoritmo de ownership item-level** | Definir como `scopedEvento` deve resolver IDs de recurso vs IDs de evento | C-01, C-17 |
| **ADR-XXX: Cookie security em produção** | Definir configuração de `secure`, `httpOnly`, `sameSite` para ambientes | C-03, C-30 |
| **ADR-XXX: Rate limiting universal de login** | Unificar proteção entre API e SSR | C-05 |

---

# 7. Backlog Arquitetural Priorizado

## Curto Prazo — Correções Críticas de Segurança e Controle de Acesso

| ID | Título | Tipo | Justificativa |
|---|---|---|---|
| C-01 | Corrigir `scopedEvento` para verificar `evento_id` do recurso (não `req.params.id`) | BR | Controle de acesso item-level não-determinístico; risco de acesso cross-event |
| C-02 | Corrigir `rbac('monitor')` → `rbac('admin')` nas mutações de evento via API | BR | Escalada de privilégios — gestor/monitor pode alterar eventos |
| C-03 | Adicionar `secure: true` ao cookie JWT e ao cookie de sessão | VU | OWASP A02 — interceptação de cookie em produção |
| C-04 | Unificar mensagem de login da API: `'Credenciais inválidas'` para ambos os casos | VU | OWASP A07 — user enumeration |
| C-05 | Aplicar `loginLimiter` ao `POST /login` (SSR) | GI | Brute-force irrestrito via formulário web |
| C-06 | Corrigir `rbac('gestor')` → `rbac('monitor')` em `POST /admin/certificados` | BR | Monitor excluído indevidamente de criar certificados via SSR |
| C-17 | Implementar verificação de ownership em operações de item de certificado (SSR) | GI | Gestor pode modificar certificados de outros eventos |
| C-22 | Corrigir HTTP 200+null → HTTP 404 em `update()` e `restore()` quando evento não existe | BR | Semântica HTTP incorreta |
| C-24 | Corrigir validator Zod: `url_template_base` deve aceitar string livre (key R2), não URL | BR | Campo inutilizável via API |

## Médio Prazo — Arquitetura e Enforcement de Escopo

| ID | Título | Tipo | Justificativa |
|---|---|---|---|
| C-07 | Formalizar contrato de `req.usuario` (ADR) e refatorar `authSSR` para incluir `email` e suporte a `getEventos()` ou alternativa | VA | Bifurcação estrutural raiz de múltiplas falhas |
| C-08 | Criar `usuarioService.js` extraindo lógica de negócio do controller | VA | Violação de NFR-6; inconsistência arquitetural |
| C-09 | Mover RBAC de `usuarios-crud` para middleware `rbac('admin')` no nível de rota | VA | RBAC não centralizado |
| C-10 | Refatorar URL pattern `/:papel/:id/usuarios` para padrão REST convencional | VA | Information disclosure + colisão de rotas |
| C-11 | Substituir `scopedEvento` em `POST /eventos` por `rbac('admin')` explícito | BR | RBAC acidental com mensagem enganosa |
| C-12 | Adaptar `rbac` para retornar redirect+flash em contexto SSR | VA | UX quebrada em todas as rotas SSR protegidas |
| C-15 | Aplicar filtro de escopo em `GET /tipos-certificados` (API) | GI | FR-37 não atendido para tipos de certificados |
| C-16 | Aplicar filtro de evento em `tiposCertificadosSSRController.index` | IP | FR-37 não atendido na SSR de tipos |
| C-18 | Filtrar eventos/tipos no formulário SSR de criação de certificado | GI | FR-37 não atendido no formulário |
| C-19 | Implementar CRUD completo de usuários via API (validar com VH-02) | GI | FR-26 parcialmente não atendido |
| C-20 | Aplicar validação de senha forte na criação/edição de usuário por admin | IP | FR-57 parcialmente não atendido |
| C-21 | Adicionar campos de layout ao schema Zod de evento (validar com VH-03) | GI | FR-48 inacessível via API |
| C-23 | Corrigir HTTP 204 → HTTP 404 em `delete()` quando evento não existe | BR | Semântica HTTP incorreta |
| C-25 | Adicionar validações de `nome` e `ano` ao model Sequelize `Evento` | GI | Via SSR, dados inválidos podem ser gravados |
| C-26 | Validar existência de eventos antes de criar associações em `usuarioSSRController` | IP | Associações silenciosamente incorretas |
| C-27 | Adicionar `try/catch` em `usuarioController.login` | BR | Exceções de banco não tratadas |
| C-28 | Adicionar guard de `JWT_SECRET` na carga do módulo `authSSR` | IP | NFR-3 não plenamente garantido |
| C-29 | Corrigir semântica de `eventoService.restore()` para restaurar apenas vínculos deletados com o evento (validar com VH-04) | IP | Vinculos individuais perdidos incorretamente |
| C-30 | Configurar `cookie: { secure, httpOnly }` no `express-session` | DT | Cookie de sessão sem atributos de segurança |

## Longo Prazo — Qualidade, Observabilidade e Consistência

| ID | Título | Tipo | Justificativa |
|---|---|---|---|
| C-31 | Implementar logging de eventos de autenticação (tentativas falhas, logout, token expirado) | DT | Sem rastreabilidade de ataques |
| C-32 | Implementar limpeza periódica de registros `usuario_eventos` soft-deleted | DT | Crescimento indefinido da tabela de junção |
| C-33 | Adicionar paginação à listagem de usuários no SSR admin | DT | Performance com volume elevado |
| C-34 | Mover `require()` de dentro de métodos para o topo do `eventoService` | DT | Antipadrão — dificulta análise e mocking |
| C-35 | Remover ou documentar método órfão `eventoService.destroy()` | DT | Confusão com `eventoService.delete()` |
| C-36 | Atualizar schema Swagger com campos de evento e rota real de usuários | DT | Documentação OpenAPI incompleta |
| C-37 | Atualizar SRS FR-44 com definição clara de URL vs key R2 | ID | Ambiguidade gera implementação contraditória |
| C-38 | Atualizar SRS FR-30 com rota real `/login` (não `/auth/login`) | ID | Documentação incorreta |
| C-39 | Esclarecer FR-22 sobre permissão de restore de certificado via API | ID | Ambiguidade entre superfícies |
| C-40 | Clarificar FR-48 sobre se campos de layout são gerenciáveis via API | AM | Ausência do Zod pode ser gap ou decisão |
| C-41 | Listar explicitamente nos SRS quais recursos cobrem `scopedEvento` | AM | FR-37 insuficientemente específico |
| C-42 | Definir política de case-sensitivity para `codigo_base` no SRS FR-8 | AM | Comportamento indefinido no PostgreSQL |
| C-43 | Definir no SRS se política de senha forte se aplica a criação por admin | AM | FR-29/FR-57 ambíguo |

---

# 8. Atualizações Recomendadas no SRS

## 8.1 — FR-44: Esclarecer natureza de `url_template_base`

**Problema:** FR-44 declara "URL válida", mas a tabela do modelo define "key (caminho) do R2". A implementação SSR armazena key. A implementação Zod valida URL. Contradição interna.

**Recomendação:** Substituir "deve conter uma URL válida" por "deve conter uma key (caminho) válida no Cloudflare R2, no formato `<prefixo>/<slug>/<ano>/base.<ext>`. O campo não armazena uma URL completa." Atualizar também a seção de validação para refletir o formato aceito na API.

---

## 8.2 — FR-5 / Tabela API de Eventos: RBAC explícito para API

**Problema:** O SRS especifica RBAC para SSR (`admin`) mas não declara explicitamente o perfil mínimo para mutações via API de eventos.

**Recomendação:** Adicionar declaração: "O CRUD de eventos via API REST é restrito ao perfil `admin`. Gestores e monitores só podem listar eventos (GET) filtrados aos seus escopos." Atualizar a tabela API de Eventos para refletir `admin` como perfil mínimo nas colunas PUT, DELETE, POST restore.

---

## 8.3 — FR-30 / Tabela SSR-Auth: Corrigir rotas de autenticação SSR

**Problema:** SRS documenta `/auth/login` e `/auth/logout`; implementação usa `/login` e `/logout`.

**Recomendação:** Atualizar tabela "Interface SSR — Auth" para `/login` e `/logout`, alinhando documentação com a implementação real. Alternativamente, decidir migrar a implementação para `/auth/login`.

---

## 8.4 — FR-37: Especificar recursos cobertos por `scopedEvento`

**Problema:** FR-37 descreve `scopedEvento` genericamente sem listar os recursos afetados.

**Recomendação:** Adicionar subcláusula: "O filtro de escopo se aplica a: (a) certificados — listagem e operações de item devem verificar `evento_id` do certificado; (b) tipos de certificados — listagem deve filtrar por `evento_id` do escopo; (c) participantes — [decisão pendente VH-03 da auditoria 05]; (d) eventos — listagem filtrada; criação, edição e exclusão restritas a admin."

---

## 8.5 — FR-48: Declarar acessibilidade de campos de layout via API

**Problema:** FR-48 não especifica se `texto_x/y`, `validacao_x/y` são configuráveis via API REST.

**Recomendação:** Adicionar declaração explícita sobre a superfície de gestão. Exemplo: "Os campos de layout são configuráveis tanto via API REST (JSON) quanto via SSR. O schema de validação da API deve incluí-los."

---

## 8.6 — FR-55: Estender rate limiting ao login SSR

**Problema:** FR-55 cobre apenas `POST /usuarios/login`. A rota SSR `POST /login` realiza a mesma operação sem proteção.

**Recomendação:** Ampliar FR-55: "Ambas as rotas de autenticação — `POST /usuarios/login` (API) e `POST /login` (SSR) — devem ser protegidas por rate limiting: máximo 10 tentativas em 15 minutos por IP."

---

## 8.7 — FR-22: Esclarecer permissão de restore de certificado via API

**Problema:** FR-22 restringe restauração via SSR a admin, mas a tabela API lista `monitor` como perfil mínimo para `POST /certificados/:id/restore`.

**Recomendação:** Declarar explicitamente o perfil mínimo para restauração via API e justificar a diferença em relação à SSR, ou padronizar para o mesmo perfil nas duas superfícies.

---

## 8.8 — FR-26: Declarar quais operações de usuário devem estar na API

**Problema:** FR-26 declara "CRUD completo" sem especificar superfícies. A API atual só oferece login, logout, me, criar e atualizar eventos.

**Recomendação:** Especificar: "O CRUD completo de usuários está disponível via SSR (painel admin). A API REST disponibiliza: login, logout, dados do usuário autenticado e criação de usuários. As operações de listagem, atualização de dados e remoção via API são [incluídas/excluídas — decisão pendente VH-02 da auditoria 04]."

---

## 8.9 — FR-29 / FR-57: Política de senha para admin criando/editando usuário

**Problema:** FR-57 especifica senha forte para self-service. FR-29 especifica hash bcrypt. Nenhum FR cobre força de senha para criação por admin.

**Recomendação:** Adicionar: "A política de senha forte (FR-57) aplica-se a todas as operações de definição de senha, incluindo criação e atualização por admin, não apenas ao self-service." Ou, se a decisão for contrária, declarar explicitamente.

---

## 8.10 — FR-8: Definir policy de case-sensitivity para `codigo_base`

**Problema:** FR-8 define "três letras alfabéticas" sem especificar case.

**Recomendação:** Adicionar: "O campo `codigo_base` deve ser armazenado em letras maiúsculas. A validação de unicidade é case-insensitive: `EDU` e `edu` são equivalentes e não podem coexistir."

---

# 9. Itens para Validação Humana

| VH | Questão | Contexto | Achados relacionados | Impacto da decisão |
|---|---|---|---|---|
| **VH-01** | O controle de acesso de certificados via `scopedEvento` deve ser corrigido para carregar o certificado e verificar seu `evento_id`? | C-01 é o mecanismo correto mas envolve query adicional por requisição | C-01, C-17 | Define o algoritmo de ownership para correção de C-01 e C-17 |
| **VH-02** | CRUD completo de usuários (listagem, atualização, remoção) via API REST é requisito ativo ou a SSR é o único canal admin? | FR-26 declara CRUD, mas API atual é parcial | C-19 | Se ativo: prioridade de implementação; Se não: atualizar SRS |
| **VH-03** | Os campos de layout (`texto_x/y`, `validacao_x/y`) devem ser configuráveis via API REST? | Atualmente só configuráveis via SSR; ausentes do Zod | C-21, C-40 | Se sim: atualizar schema Zod; Se não: atualizar SRS para declarar SSR-only |
| **VH-04** | `url_template_base` armazena uma URL completa ou uma key R2? | FR-44 auto-contraditório | C-24, C-37 | Define se Zod deve usar `.url()` ou string livre/regex de key |
| **VH-05** | A restauração de evento deve restaurar todos os vínculos USER-EVENTO, ou apenas os que foram deletados junto com o evento? | Comportamento atual: restaura todos | C-29 | Define semântica correta e algoritmo de restore seletivo |
| **VH-06** | A política de senha forte (FR-57) deve se aplicar a admin criando/editando usuário, ou apenas ao self-service? | FR-29/FR-57 omissos sobre criação por admin | C-20, C-43 | Define se validação Zod do schema admin deve incluir `senhaForteSchema` |
| **VH-07** | O rate limiting de login deve ser igual em API e SSR (10 tentativas / 15 min), ou parâmetros distintos por superfície? | FR-55 cobre apenas API | C-05 | Define implementação e atualização de FR-55 |
| **VH-08** | O perfil mínimo para restore de certificado via API deve ser `monitor` (atual) ou `admin` (analogia SSR)? | FR-22 restringe SSR a admin mas não cobre API explicitamente | C-39 | Define atualização de FR-22 e possível correção da rota |
| **VH-09** | Gestores e monitores vinculados a um evento devem poder atualizar/deletar esse evento via API? | EVT-01/C-02: SRS especifica admin-only via SSR; API tem monitor | C-02 | Se não: corrigir para `rbac('admin')`; Se sim: atualizar SRS |
| **VH-10** | O padrão de URL `/:papel/:id/usuarios` foi uma decisão arquitetural intencional ou legado a ser substituído? | Padrão incomum com ID do admin na URL | C-10, C-09 | Se legado: priorizar refatoração para URL convencional |
| **VH-11** | O `scopedEvento` deve ser aplicado à rota `GET /tipos-certificados` e `GET /participantes` via API? | FR-37 não enumera recursos; comportamento atual sem filtro | C-15, C-41 | Define se gaps são bugs ou comportamento intencional |
| **VH-12** | O cookie JWT e o cookie de sessão devem ter `secure: true` configurado na aplicação, ou isso é responsabilidade do proxy reverso (Nginx)? | C-03 — flags ausentes no código | C-03, C-30 | Define se correção é na aplicação ou na infra |

---

# 10. Iniciativas Futuras de Spec

## SPEC-01 — Contrato Formal de `req.usuario`

**Objetivo:** Definir e documentar a interface obrigatória do objeto `req.usuario` para ambas as superfícies (API e SSR), eliminando a bifurcação estrutural atual.

**Motivação:** A ausência de contrato gerou dois middlewares de autenticação incompatíveis, impedindo reutilização de middlewares de autorização em contexto SSR e forçando duplicação de lógica de escopo nos controllers SSR.

**Achados relacionados:** C-07, C-01, C-17

**FRs/NFRs relacionados:** NFR-1, NFR-6, FR-37

**Dependências:** Nenhuma — pode ser definida antes de qualquer implementação.

**Conteúdo esperado:**
- Campos obrigatórios: `id`, `nome`, `perfil`, `email`
- Métodos ou alternativas para resolução de eventos vinculados
- Separação clara entre contextos (ou interface unificada)
- Impacto nos middlewares `auth`, `authSSR`, `scopedEvento`, `tiposCertificadosOwnership`

---

## SPEC-02 — Item-Level Ownership para Recursos Escopados

**Objetivo:** Especificar o algoritmo formal de verificação de ownership para operações em recursos individuais (certificados, tipos de certificados) dentro do contexto de escopo de evento.

**Motivação:** `scopedEvento` resolve incorretamente o ID de recurso como ID de evento (C-01). Controllers SSR implementaram workarounds próprios sem padronização (C-17). Não existe algoritmo documentado para o caso de uso de operação de item.

**Achados relacionados:** C-01, C-17, C-07

**FRs/NFRs relacionados:** FR-37, NFR-1

**Dependências:** SPEC-01 (contrato de `req.usuario`)

**Conteúdo esperado:**
- Algoritmo: como determinar o `evento_id` de um recurso e compará-lo ao escopo do usuário
- Quais recursos requerem item-level ownership (certificados, tipos-cert, outros)
- Middleware único ou padrão de verificação reutilizável
- Resposta esperada quando ownership falha (403 com formato correto por superfície)

---

## SPEC-03 — API REST Completa de Usuários

**Objetivo:** Especificar os endpoints REST completos para gerenciamento de usuários, com padrão URL convencional e RBAC no nível de middleware.

**Motivação:** FR-26 declara CRUD completo; a API atual é expressivamente parcial. O padrão URL atípico (`/:papel/:id/usuarios`) e a ausência de `rbac` no nível de rota são bloqueios arquiteturais.

**Achados relacionados:** C-08, C-09, C-10, C-19

**FRs/NFRs relacionados:** FR-26, FR-38, NFR-6

**Dependências:** VH-02 (decisão sobre CRUD via API), VH-10 (decisão sobre URL pattern)

**Conteúdo esperado:**
- Tabela de endpoints convencional (`GET /usuarios`, `GET /usuarios/:id`, etc.)
- RBAC por endpoint
- Escopo de dados retornados por operação
- Contrato de criação de `usuarioService.js`

---

## SPEC-04 — Política Universal de Segurança de Cookies e Sessão

**Objetivo:** Definir formalmente os atributos de segurança obrigatórios para cookies JWT e de sessão em cada ambiente (dev, test, produção).

**Motivação:** `secure`, `httpOnly`, `sameSite`, `maxAge` não estão explicitados para o cookie JWT nem para o cookie de sessão. A decisão de onde configurar `secure` (aplicação vs proxy reverso) não está documentada.

**Achados relacionados:** C-03, C-30

**FRs/NFRs relacionados:** NFR-1, NFR-3, FR-30

**Dependências:** VH-12 (decisão sobre responsabilidade da camada `secure`)

**Conteúdo esperado:**
- Tabela de atributos por ambiente
- Decisão sobre ambiente de produção via Nginx + HTTPS
- Configuração de `maxAge`/`expires` para alinhamento com expiração de JWT (1h)

---

## SPEC-05 — Rate Limiting Universal para Autenticação

**Objetivo:** Ampliar FR-55 para cobrir todas as superfícies de autenticação (API e SSR) com parâmetros explícitos.

**Motivação:** Brute-force via SSR não é coberto por FR-55. A assimetria cria um vetor de ataque não documentado.

**Achados relacionados:** C-05

**FRs/NFRs relacionados:** FR-55, NFR-1

**Dependências:** VH-07 (parametrização por superfície)

**Conteúdo esperado:**
- Limites por superfície (ou unificados)
- Mecanismo de compartilhamento do middleware (ou instâncias independentes)
- Resposta ao limite excedido por superfície (JSON vs redirect+flash)

---

## SPEC-06 — Logging de Eventos de Segurança

**Objetivo:** Especificar requisito formal de rastreabilidade para eventos de autenticação e autorização.

**Motivação:** Ausência de NFR de observabilidade de segurança: tentativas de login falhas, logins bem-sucedidos, logouts, expiração de token, acessos negados por RBAC — nenhum desses eventos é atualmente registrado.

**Achados relacionados:** C-31

**FRs/NFRs relacionados:** NFR-1 (implícito), sem NFR explícito atualmente

**Dependências:** Nenhuma — pode ser especificado independentemente.

**Conteúdo esperado:**
- Lista de eventos a serem registrados
- Campos de cada log entry (timestamp, IP, userId, perfil, resultado)
- Destino de logs (stdout estruturado, arquivo, serviço externo)
- NFR de retenção mínima

---

# 11. Análise Sistêmica Consolidada

## 11.1 Padrões Recorrentes

**1. Assimetria sistemática API ↔ SSR**

A divergência entre as duas superfícies não é isolada: é um padrão transversal observável em pelo menos 8 aspectos distintos (RBAC de eventos, RBAC de certificados, rate limiting do login, mensagem de erro do login, estrutura de `req.usuario`, validação Zod, campos de layout, url_template_base). A causa raiz é a ausência de um mecanismo de compartilhamento de contratos entre as duas superfícies: cada uma foi desenvolvida de forma parcialmente independente, gerando divergências progressivas.

**2. Scoped Enforcement Incompleto**

O design do sistema indica intenção de multi-tenancy (gestores/monitores restritos a seus eventos). Porém, o enforcement é inconsistente: funciona na listagem de certificados (API), falha em operações de item (API e SSR), falha em tipos-certificados (API e SSR), falha em formulários SSR. O padrão observado é: o enforcement foi implementado seletivamente para o caso de listagem, mas não foi extrapolado sistematicamente para operações de item e formulários.

**3. RBAC como Ponto de Falha Múltiplo**

Três classes de falhas de RBAC coexistem: (a) nível errado de rbac (C-02, C-06); (b) RBAC no lugar errado da stack (C-09); (c) ausência de RBAC (C-17, C-15, C-16). Isso indica que o modelo de RBAC foi definido corretamente no SRS mas não foi implementado de forma sistemática — cada domínio implementou à sua maneira, sem validação cruzada.

**4. Middlewares com Contrato Implícito**

`scopedEvento` e `tiposCertificadosOwnership` dependem de `req.usuario.getEventos()` sem declarar explicitamente essa dependência como pré-condição. O resultado é um contrato implícito que falha silenciosamente quando `authSSR` é o middleware de autenticação upstream. Esse padrão de contrato implícito entre middlewares é recorrente e perigoso.

**5. Validação de Dados em Camada Única**

A validação Zod protege adequadamente a API. A SSR depende quase exclusivamente do Sequelize. Isso cria assimetria de proteção: constraints declaradas no SRS apenas no Zod não se aplicam à SSR. Quando o Sequelize não replica essas constraints a nível de model, a superfície SSR fica desprotegida.

## 11.2 Classes de Bugs Encontradas

| Classe | Achados | Descrição |
|---|---|---|
| **Controle de acesso item-level** | C-01, C-17 | Verificação de ownership de recurso individual ausente ou incorreta |
| **RBAC de superfície** | C-02, C-06 | Nível de perfil mínimo incorreto em uma das superfícies |
| **Semântica HTTP** | C-22, C-23 | Respostas com códigos HTTP incorretos para recursos não encontrados |
| **Validação de campo** | C-24 | Validator com tipo errado para natureza do campo |
| **Vazamento de informação** | C-04 | Mensagens de erro distintas revelam estado do sistema |
| **Segurança de sessão** | C-03, C-30 | Atributos de segurança de cookie ausentes |
| **Propagação de identidade** | C-07 | Objeto de usuário incompatível entre os dois fluxos de autenticação |

## 11.3 Nível de Maturidade Arquitetural

O sistema apresenta uma arquitetura **funcionalmente estruturada mas com enforcement inconsistente**:

- **Pontos positivos:** hierarquia RBAC definida e implementada no middleware; bcrypt aplicado por hooks Sequelize; soft delete universal; JWT stateless com expiração; separação em camadas para a maioria dos domínios; ownership de tipos implementado corretamente (API).
- **Pontos críticos:** a bifurcação de `req.usuario` e o `scopedEvento` com semântica incorreta são indicadores de que a evolução das duas superfícies não foi coordenada arquiteturalmente. O domínio de usuários ficou como exceção ao padrão de camadas (sem service), tornando-se o domínio mais frágil.

**Classificação estimada:** Maturidade nível 2 de 5 (implementação funcional com gaps de enforcement e ausência de contratos formais entre camadas).

## 11.4 Riscos Sistêmicos

| Risco | Probabilidade | Impacto | Achados |
|---|---|---|---|
| Acesso cross-event por coincidência numérica | Média | Alto | C-01 |
| Escalada horizontal de privilégios via API | Alta | Alto | C-02 |
| Sequestro de sessão via cookie HTTP | Baixa (requer posição na rede) | Alto | C-03 |
| Enumeração de usuários por atacante | Alta | Médio | C-04 |
| Brute-force via SSR | Alta | Alto | C-05 |
| Gestor modifica certificados fora do escopo via SSR | Alta | Alto | C-17 |
| Divergência silenciosa entre mecanismos de escopo | Média (evolução futura) | Alto | C-14, C-07 |

## 11.5 Impacto no Multi-tenancy

O modelo de multi-tenancy (escopo por evento) está **parcialmente implementado**:
- Listagem de certificados via API: enforcement correto
- Listagem de eventos: enforcement correto (com redundância)
- Operações de item em certificados: enforcement ausente ou incorreto
- Listagem de tipos: sem enforcement
- Formulários SSR: sem filtro de escopo

O risco principal não é que o sistema falhe a questão de multi-tenancy em todos os casos, mas que o enforcement seja inconsistente: um gestor bem-informado pode explorar as lacunas via interface web sem conhecimento técnico avançado.

## 11.6 Impacto no Enforcement de Segurança

Três dos cinco achados críticos (C-01, C-02, C-17) são falhas de controle de acesso que violam diretamente NFR-1 (OWASP A01). Dois (C-03, C-04) são vulnerabilidades de autenticação (OWASP A02, A07). O padrão sugere que o enforcement de segurança foi planejado corretamente no SRS mas não foi verificado sistematicamente na implementação — particularmente nas interações entre superfícies.

---

# 12. Necessidade de Auditorias Futuras

Os domínios a seguir **não foram auditados** nas auditorias-base desta triagem. Baseando-se nos padrões sistêmicos identificados (scoped enforcement inconsistente, bifurcação API/SSR, RBAC por superfície), os seguintes domínios merecem investigação prioritária:

| Domínio | Motivação para auditoria futura | Padrão esperado pela triagem |
|---|---|---|
| **Certificados** (CRUD completo) | C-01 e C-17 são interseções pontuais; o domínio completo (criação, edição, listagem, validação de campos dinâmicos, geração de código) não foi auditado | Possível enforcement de escopo inconsistente; herda falhas de `scopedEvento` |
| **Tipos de Certificados** (CRUD completo) | C-15 e C-16 indicam escopo ausente; o domínio completo (ownership, validação de `campo_destaque`, `dados_dinamicos`) não foi auditado | Possível bypass de ownership em operações de item |
| **Participantes** | Mencionado em auditorias como caso não definido de `scopedEvento`; sem auditoria dedicada | Comportamento de escopo indefinido (VH-11) |
| **Dashboard** | PA-02 indica ausência de `rbac` explícito; lógica de escopo por perfil sem auditoria | Possível vazamento de dados cross-escopo para gestor/monitor |
| **Geração de PDF** | Acesso público (sem autenticação) a recurso que referencia dados de eventos; sem auditoria de limites de acesso | Possível acesso a PDFs sem controle de existência/status |
| **Upload de Template (R2)** | Integração com armazenamento externo; validação de tipo/tamanho e sanitização de key não auditadas | Possível path traversal em geração de key; sanitização do slug não verificada |

> **Nota:** As motivações acima são derivadas de padrões sistêmicos observados nos domínios auditados. Nenhum comportamento desses domínios não auditados é assumido ou extrapolado neste relatório.

---

*Triagem finalizada em 2026-05-09 18:59 (BRT)*  
*Baseada exclusivamente em: `docs/auditorias/07/03-eventos.md`, `docs/auditorias/07/04-usuarios.md`, `docs/auditorias/07/05-auth-autorizacao.md`, `docs/especificacoes.md` v2.0*
