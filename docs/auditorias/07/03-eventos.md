# Auditoria 07 — Domínio: Eventos

**Sistema:** Certifique-me  
**Auditor:** GitHub Copilot (Claude Sonnet 4.6)  
**Data:** 2026-05-09 18:23 (BRT)  
**Escopo:** Domínio de Eventos — CRUD, APIs, SSR, RBAC, Escopo/Multi-tenant, Relacionamentos

---

## Fontes investigadas

| Camada | Arquivos |
|---|---|
| Routes (API) | `src/routes/eventos.js` |
| Routes (SSR) | `src/routes/admin.js` (seção eventos) |
| Controllers (API) | `src/controllers/eventoController.js` |
| Controllers (SSR) | `src/controllers/eventoSSRController.js` |
| Service | `src/services/eventoService.js` |
| Model | `src/models/evento.js`, `src/models/usuario_eventos.js`, `src/models/index.js` |
| Middlewares | `src/middlewares/auth.js`, `src/middlewares/authSSR.js`, `src/middlewares/rbac.js`, `src/middlewares/scopedEvento.js`, `src/middlewares/uploadTemplate.js` |
| Validators | `src/validators/evento.js` |
| Migrations | `20260311175950-create-eventos.js`, `20260416092527-add-url-template-base-to-eventos.js`, `20260416201114-add-layout-fields-to-eventos.js`, `20260313190000-create-usuario_eventos.js` |
| Views | `views/admin/eventos/index.hbs`, `views/admin/eventos/form.hbs` |
| Tests | `tests/routes/eventos.test.js`, `tests/routes/eventos.gestor.test.js`, `tests/services/eventoService.test.js`, `tests/routes/adminEntidades.test.js` |
| SRS | `docs/especificacoes.md` |

---

# 1. Matriz de Achados

| ID | Descrição | Severidade | Tipo | Impacto | Evidência Principal | FR/NFR |
|---|---|---|---|---|---|---|
| EVT-01 | `rbac('monitor')` em rotas de mutação de eventos via API permite gestor e monitor alterar eventos | Crítica | VU | Gestor/monitor podem atualizar, deletar e restaurar eventos sem autorização | `src/routes/eventos.js` linhas 140–169 | FR-34, FR-35, FR-36 |
| EVT-02 | `scopedEvento` bloqueia efetivamente criação de eventos por não-admin via API (por ausência de `evento_id` no body) com mensagem enganosa | Alta | BR | `POST /eventos` retorna 403 para qualquer non-admin, mas a rota declara `rbac('monitor')` sugerindo que seria permitido | `src/middlewares/scopedEvento.js` linhas 36–40; `src/routes/eventos.js` linha 139 | FR-34, FR-37 |
| EVT-03 | `eventoController.update()` retorna HTTP 200 com corpo `null` quando o evento não é encontrado | Alta | BR | Cliente não recebe 404 em recurso inexistente; detecta falha apenas por corpo vazio | `src/controllers/eventoController.js` linhas 37–44; `src/services/eventoService.js` linhas 36–40 | NFR-6 |
| EVT-04 | `eventoController.restore()` retorna HTTP 200 com corpo `null` quando o evento não é encontrado | Alta | BR | Mesmo problema de EVT-03 para a rota de restauração | `src/controllers/eventoController.js` linhas 51–57; `src/services/eventoService.js` linhas 52–57 | NFR-6 |
| EVT-05 | `eventoController.delete()` retorna HTTP 204 quando o evento não existe | Média | BR | Cliente não consegue distinguir deleção bem-sucedida de recurso inexistente | `src/controllers/eventoController.js` linhas 44–50; `src/services/eventoService.js` linhas 43–52 | NFR-6 |
| EVT-06 | Zod valida `url_template_base` como URL (`z.string().url()`), mas FR-44 e o modelo de dados especificam que o campo armazena uma _key_ (caminho) do R2 | Alta | BR | Via API, nenhuma key R2 válida pode ser gravada nesse campo (falharia na validação Zod); formato diverge da SSR que armazena key corretamente | `src/validators/evento.js` linha 7; `src/controllers/eventoSSRController.js` linhas 12–21 | FR-44 |
| EVT-07 | Campos de layout (`texto_x`, `texto_y`, `validacao_x`, `validacao_y`) ausentes do schema Zod; Zod remove campos desconhecidos | Alta | GI | FR-48 é inacessível via API — coordenadas de layout do PDF não podem ser configuradas por essa superfície | `src/validators/evento.js`; comentário de `eventoSSRController.js` que converte esses campos | FR-48 |
| EVT-08 | `eventoSSRController.index` consulta `Evento.findAll()` e `Evento.findAll()` com paranoid:false diretamente, bypassando a camada de service | Média | VA | Lógica de negócio duplicada entre service e controller SSR; violação de NFR-6 | `src/controllers/eventoSSRController.js` linhas 37–74 | NFR-6 |
| EVT-09 | `scopedEvento` injeta `req.query.evento_id` na listagem mas `eventoService.findAll` ignora completamente esse campo e aplica seu próprio filtro via `usuario.id` | Média | VA | Middleware e service aplicam filtro de escopo de maneiras independentes e redundantes; qualquer divergência futura entre os dois pode causar bugs de multi-tenant | `src/middlewares/scopedEvento.js` linhas 24–30; `src/services/eventoService.js` linhas 9–20 | FR-37 |
| EVT-10 | `rbac` middleware retorna JSON 403 em qualquer contexto, inclusive SSR | Média | VA | Gestors que clicam em "Editar" / "Remover" na SSR recebem JSON bruto em vez de uma página de erro adequada | `src/middlewares/rbac.js` linhas 17–19; `src/routes/admin.js` linhas 68-78 | FR-49 |
| EVT-11 | View `eventos/index.hbs` exibe botões "Editar", "Remover" e "+ Novo Evento" para todos os gestors autenticados, mas as respectivas rotas requerem `rbac('admin')` | Média | VA | Gestor vê botões de ação que resultam em 403 JSON ao serem clicados; experiência de usuário confusa | `views/admin/eventos/index.hbs` linhas 33–46 e 1–5; `src/routes/admin.js` linhas 68–78 | FR-49 |
| EVT-12 | `eventoService.destroy()` é método órfão (não chamado por nenhum controller) que não inclui cascade para `UsuarioEvento` | Baixa | DT | Risco de confusão com `eventoService.delete()` que tem comportamento diferente (inclui cascade) | `src/services/eventoService.js` linhas 42–46 | NFR-6 |
| EVT-13 | `eventoService.restore()` restaura TODOS os registros `UsuarioEvento` do evento, incluindo vínculos removidos individualmente antes do soft-delete do evento | Média | IP | Semântica incorreta: restaurar um evento também restaura vínculos de usuários que tinham sido desvinculados do evento por razão própria | `src/services/eventoService.js` linhas 52–57 | FR-9, FR-32 |
| EVT-14 | `require('../../src/models')` inline dentro dos métodos `delete` e `restore` do service | Baixa | DT | Antipadrão: imports implícitos dentro de funções dificultam análise de dependências e mocking em testes | `src/services/eventoService.js` linhas 48–50, 56–57 | NFR-6 |
| EVT-15 | Modelo Sequelize `Evento` não valida `nome` mínimo de 3 caracteres nem `ano >= 2000` a nível de model | Média | GI | Via SSR (sem Zod), eventos podem ser criados com nome vazio/curto ou ano inválido (ex: `ano=1999`) | `src/models/evento.js` linhas 26–30, 34–38; `src/validators/evento.js` apenas na API | FR-6, FR-7 |
| EVT-16 | `authSSR` popula `req.usuario` como objeto simples sem o método `getEventos()` da instância Sequelize | Média | VA | Qualquer uso futuro de `scopedEvento` em rotas SSR retornaria HTTP 500 imediato | `src/middlewares/authSSR.js` linhas 47–55; `src/middlewares/scopedEvento.js` linhas 4–9 | NFR-1, FR-37 |
| EVT-17 | FR-44 é internamente ambíguo: declara `url_template_base` como "URL válida" mas a seção de modelo de dados especifica "key (caminho) do Cloudflare R2" | Baixa | ID | Gera implementação contraditória entre o validator Zod (valida como URL) e o controller SSR (armazena key) | `docs/especificacoes.md` FR-44 e tabela `eventos` | FR-44 |
| EVT-18 | SRS não especifica o comportamento do API para campos de layout (FR-48) — se são setáveis via API ou exclusivamente via SSR | Baixa | AM | Não é possível determinar por especificação se a ausência no schema Zod é intencional ou omissão | `docs/especificacoes.md` FR-48 | FR-48 |
| EVT-19 | SRS não especifica a sensibilidade a maiúsculas/minúsculas na unicidade de `codigo_base` | Baixa | AM | PostgreSQL usa unicidade case-sensitive por default; `EDU` e `edu` seriam tratados como diferentes, mas o comportamento esperado não está documentado | `src/models/evento.js` linhas 31–41; migration `20260311175950` | FR-8 |
| EVT-20 | Swagger schema `Evento` em `app.js` não documenta os campos `url_template_base`, `texto_x`, `texto_y`, `validacao_x`, `validacao_y` | Baixa | DT | Documentação da API incompleta para campos introduzidos nas migrations `20260416*` | `app.js` linhas 114–128 | FR-44, FR-48 |

---

# 2. Achados Críticos

## EVT-01 — Violação de RBAC: mutações de evento via API com `rbac('monitor')`

**Evidência:**

```javascript
// src/routes/eventos.js
router.put('/:id', auth, rbac('monitor'), scopedEvento, validate(eventoSchema.partial()), eventoController.update)
router.delete('/:id', auth, rbac('monitor'), scopedEvento, eventoController.delete)
router.post('/:id/restore', auth, rbac('monitor'), scopedEvento, eventoController.restore)
```

A especificação estabelece que apenas admin deve gerir eventos (FR-34 a FR-36). O SRS confirma isso com a SSR:

```javascript
// src/routes/admin.js
router.post('/eventos/:id', rbac('admin'), uploadTemplate, eventoSSRController.atualizar)
router.post('/eventos/:id/deletar', rbac('admin'), eventoSSRController.deletar)
router.post('/eventos/:id/restaurar', rbac('admin'), eventoSSRController.restaurar)
```

Um gestor ou monitor com token JWT válido e vinculado ao evento alvo pode chamar:
- `PUT /eventos/:id` e alterar `nome`, `codigo_base`, `ano`
- `DELETE /eventos/:id` e deletar logicamente um evento inteiro
- `POST /eventos/:id/restore` e reativar um evento arquivado

O `scopedEvento` não impede isso — ele somente garante que o usuário está vinculado ao evento, não que seja admin.

**Impacto:** Escalada horizontal de privilégios. Gestor ou monitor pode alterar ou destruir dados de evento ao qual está vinculado, sem autorização administrativa.

---

## EVT-02 — `scopedEvento` bloqueia `POST /eventos` para não-admins com semântica enganosa

**Evidência:**

```javascript
// src/middlewares/scopedEvento.js — linha 36
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
// Para POST /eventos: nenhum desses campos existe no body (eventos não têm evento_id)
// eventoId = undefined → condicional abaixo é falsa → retorna 403

if (eventoId && eventosIds.includes(Number(eventoId))) {
  return next()
}
return res.status(403).json({ error: 'Acesso restrito ao evento vinculado.' })
```

A rota declara `rbac('monitor')`, sugerindo que qualquer usuário autenticado pode criar eventos via API. Porém, `scopedEvento` bloqueia todos os não-admins com `HTTP 403 "Acesso restrito ao evento vinculado"` — mensagem incorreta para o contexto de criação. Na prática, apenas admins podem criar eventos via API.

**Impacto funcional:** O endpoint `POST /eventos` efetivamente é admin-only, mas por comportamento acidental do middleware, não por decisão arquitetural explícita. A mensagem de erro também é incorreta.

---

## EVT-06 — Zod valida `url_template_base` como URL quando o campo armazena uma key R2

**Evidência:**

```javascript
// src/validators/evento.js
url_template_base: z.string().url().optional().nullable()
```

```javascript
// src/controllers/eventoSSRController.js — buildTemplateKey
return `templates/${slug}/${ano}/base.${ext}`
// Exemplo: "templates/cbie-2026/2026/base.jpg"
// Este valor NÃO passa na validação z.string().url()
```

A SSR armazena keys corretamente. Via API, qualquer tentativa de setar `url_template_base` com uma key válida falhará na validação Zod com HTTP 400. Se enviada como URL completa, passaria a validação mas o PDF generator tentaria usar uma URL onde espera uma key, causando falha na busca no R2.

---

# 3. Problemas Arquiteturais

## 3.1 — `eventoSSRController` como pseudo-service (EVT-08)

O `eventoSSRController.index` executa queries Sequelize diretamente no controller, replicando lógica de negócio que deveria residir no service layer:

```javascript
// src/controllers/eventoSSRController.js — linhas 37–74
if (req.usuario.perfil === 'admin') {
  eventos = await Evento.findAll()                    // Query direta no controller
  arquivados = await Evento.findAll({ paranoid: false, ... })
} else if (req.usuario.perfil === 'gestor') {
  eventos = await Evento.findAll({ include: [...] }) // Query direta no controller
  ...
}
```

O `eventoService.findAll` já possui lógica equivalente de escopo por usuário. A duplicação cria risco de divergência e viola NFR-6 (routes → controllers → services → models).

## 3.2 — Desconexão entre `scopedEvento` e `eventoService.findAll` (EVT-09)

Para `GET /eventos`, o `scopedEvento` injeta `req.query.evento_id` e `eventoController.findAll` nunca o consome:

```javascript
// src/controllers/eventoController.js
async findAll(req, res) {
  const page = parseInt(req.query.page, 10) || 1
  const perPage = parseInt(req.query.perPage, 10) || 20
  const usuario = req.usuario
  const result = await eventoService.findAll({ page, perPage, usuario })
  // req.query.evento_id injetado pelo scopedEvento não é passado ao service
}
```

O service implementa seu próprio escopo via `usuario.id`. O resultado final é correto, mas os dois mecanismos coexistem sem coordenação — qualquer mudança em um sem atualizar o outro pode gerar divergência silenciosa.

## 3.3 — `rbac` retorna JSON em contexto SSR (EVT-10)

O middleware `rbac` não detecta o contexto (API vs SSR) e sempre retorna `res.status(403).json(...)`. Um gestor navegando pela interface web que tenta acessar `/admin/eventos/novo` ou clicar em "Editar" recebe uma resposta JSON bruta em vez de um redirect ou página de erro. Isso viola a expectativa comportamental da interface SSR.

## 3.4 — `authSSR` popula `req.usuario` como objeto plano (EVT-16)

```javascript
// src/middlewares/authSSR.js — linhas 47–55
const usuarioData = {
  id: usuario.id,
  nome: usuario.nome,
  perfil: usuario.perfil,
  isAdmin: usuario.perfil === 'admin',
  isGestor: usuario.perfil === 'gestor',
}
req.usuario = usuarioData  // Objeto simples, sem métodos Sequelize
```

O `scopedEvento` exige `req.usuario.getEventos()`, disponível apenas em instâncias Sequelize:

```javascript
// src/middlewares/scopedEvento.js
if (typeof req.usuario.getEventos !== 'function') {
  return res.status(500).json({ error: 'Usuário sem método getEventos (modelo N:N)' })
}
```

Qualquer adição de `scopedEvento` a uma rota SSR resultará em HTTP 500 imediato. A proteção existe, mas a causa raiz não.

---

# 4. Divergências API vs SSR

| Operação | API (`src/routes/eventos.js`) | SSR (`src/routes/admin.js`) | Divergência |
|---|---|---|---|
| Criar evento | `rbac('monitor')` + `scopedEvento` | `rbac('admin')` + `uploadTemplate` | RBAC diferente; SSR suporta upload de template, API não |
| Listar eventos | `rbac('monitor')` + `scopedEvento` + paginação | `rbac('gestor')` — monitor não acessa | Roles diferentes; SSR nega monitor, API permite |
| Atualizar evento | `rbac('monitor')` + `scopedEvento` | `rbac('admin')` | Gestor/monitor podem editar via API, não via SSR |
| Deletar evento | `rbac('monitor')` + `scopedEvento` | `rbac('admin')` | Gestor/monitor podem deletar via API, não via SSR |
| Restaurar evento | `rbac('monitor')` + `scopedEvento` | `rbac('admin')` | Mesma divergência |
| Validação de payload | Schema Zod (inclui `url_template_base` como URL) | Sem Zod — Sequelize apenas | API valida formato URL; SSR armazena key sem validação de formato |
| Campos de layout | Stripped pelo Zod (ausentes do schema) | Convertidos e persistidos corretamente | Configuração de layout possível apenas via SSR |
| Resposta 404 (update/restore) | HTTP 200 com `null` | Redirect com flash de erro | Comportamento HTTP inconsistente por superfície |

---

# 5. Atualizações Recomendadas no SRS

## 5.1 — FR-44: Esclarecer natureza do campo `url_template_base`

**Ambiguidade atual:**  
> FR-44: "deve conter uma URL válida (ou ser null)"  
> Modelo de dados: "armazena a **key** (caminho) do arquivo de template-base no Cloudflare R2"

**Recomendação:** O SRS deve decidir se `url_template_base` armazena uma URL completa ou uma key R2, e documentar isso de forma consistente em todas as seções. A decisão impacta a validação do campo na API.

## 5.2 — FR-48: Especificar acessibilidade da API para campos de layout

**Gap atual:** FR-48 descreve os campos `texto_x/y` e `validacao_x/y` mas não define se esses campos são gerenciáveis via API REST ou exclusivamente via SSR.

**Recomendação:** Incluir declaração explícita sobre a superfície de gestão. Exemplo: "Os campos de layout são configuráveis via API REST (JSON) e via SSR com os mesmos valores. A API deve incluí-los no schema de validação."

## 5.3 — FR-5 / FR-34-38: Esclarecer quem pode criar/editar/deletar eventos via API

**Gap atual:** O SRS especifica RBAC para operações SSR (admin-only) mas não declara explicitamente o RBAC para a API REST de eventos.

**Recomendação:** Adicionar declaração como: "O CRUD de eventos via API REST é restrito ao perfil **admin**. Gestores e monitores podem apenas listar os eventos aos quais estão vinculados."

## 5.4 — FR-8: Esclarecer sensibilidade a maiúsculas no `codigo_base`

**Gap atual:** FR-8 define apenas que deve ter "três letras alfabéticas". Não especifica se `EDU` e `edu` são equivalentes.

**Recomendação:** Definir a política. Sugestão: "O `codigo_base` deve ser armazenado em maiúsculas; a validação deve ser case-insensitive para fins de unicidade."

---

# 6. Itens para Validação Humana

| ID | Questão | Contexto | Impacto da Decisão |
|---|---|---|---|
| VH-01 | Gestores vinculados a um evento devem poder atualizar/deletar esse evento via API? | EVT-01 — O SRS não declara isso explicitamente para a superfície API | Define se `rbac('admin')` ou `rbac('gestor')` deve ser usado nas rotas de mutação da API |
| VH-02 | O campo `url_template_base` armazena uma key R2 ou uma URL completa? | EVT-06/EVT-17 — SRS auto-contraditório em FR-44 | Define se o validator Zod deve usar `.url()` ou aceitar string livre (ou regex de key) |
| VH-03 | Os campos de layout (`texto_x/y`, `validacao_x/y`) devem ser configuráveis via API? | EVT-07 — Ausentes do schema Zod; presentes na SSR | Se sim, o schema Zod precisa ser atualizado |
| VH-04 | A restauração de um evento deve restaurar todos os vínculos user-evento `UsuarioEvento`, incluindo os que foram removidos individualmente antes do soft-delete do evento? | EVT-13 — comportamento atual: restaura tudo indiscriminadamente | Define se o restore de UsuarioEvento deve ser seletivo (apenas registros deletados junto com o evento) |
| VH-05 | Gestores devem ver botões de Editar/Remover na SSR de eventos, mesmo sem autorização para usá-los? | EVT-11 — view não condiciona botões ao perfil do usuário | Define se a view deve usar `{{#if isAdmin}}` para ocultar ações restritas |
| VH-06 | O `codigo_base` deve ser tratado como case-insensitive para fins de unicidade? | EVT-19 — comportamento do PostgreSQL é case-sensitive por padrão | Pode exigir índice `LOWER(codigo_base)` ou normalização na camada de service/model |

---

# 7. Iniciativas Futuras de Spec

## SPEC-EVT-A: Padronização do RBAC de Eventos na API

Criar spec formal que declare as permissões de CRUD de eventos na superfície API, alinhando-as com as permissões SSR ou documentando divergência intencional.

## SPEC-EVT-B: Gestão de Layout de Eventos via API

Spec para definir se e como os campos de layout (`texto_x/y`, `validacao_x/y`) são gerenciáveis pela API REST, incluindo schematização e validação.

## SPEC-EVT-C: Semântica de Restauração com Relacionamentos N:N

Spec para definir a semântica completa do restore de entidades que possuem vínculos N:N em tabela com soft-delete (`usuario_eventos`): restauração total vs restauração seletiva.

## SPEC-EVT-D: Contexto de Resposta por Superfície no RBAC

Spec para padronizar respostas de autorização negada por superfície: API retorna JSON 403, SSR retorna redirect ou renderização de página de erro.

## SPEC-EVT-E: Unificação da Estratégia de Scoping entre Middleware e Service

Spec para eliminar a dualidade entre `scopedEvento.req.query.evento_id` (ignorado por `eventoService.findAll`) e o filtro interno do service baseado em `usuario.id`.

---

# 8. Conclusão Arquitetural do Domínio

O domínio de Eventos apresenta **implementação parcialmente funcional** com problemas sérios concentrados em três áreas:

## Área crítica 1 — RBAC inconsistente entre superfícies

A superfície SSR implementa corretamente a restrição de CRUD de eventos apenas para admin (`rbac('admin')`). A superfície API usa `rbac('monitor')` para todas as operações de mutação, criando uma escalada de privilégios horizontal onde gestores e monitores vinculados a um evento podem alterá-lo ou deletá-lo via API sem autorização. Este achado (EVT-01) é o de maior severidade do domínio.

## Área crítica 2 — Validação inconsistente entre superfícies

O schema Zod para eventos é incompleto em dois aspectos distintos: (a) valida `url_template_base` como URL quando o campo armazena uma key de objeto R2, tornando o campo inoperável via API (EVT-06); (b) omite os campos de layout do FR-48, que são silenciosamente descartados pelo parser Zod (EVT-07). A SSR contorna ambos os problemas porque não usa o schema Zod, mas cria formatos incompatíveis entre superfícies.

## Área crítica 3 — Tratamento de erro HTTP no controller API

O `eventoController` não trata retornos `null` do service para operações de atualização e restauração, emitindo HTTP 200 com corpo nulo quando o recurso não existe (EVT-03, EVT-04). Apenas a operação de listagem e a de `findById` têm tratamento correto de 404.

## Aspectos positivos

- O soft-delete de eventos com cascade de `UsuarioEvento` está implementado corretamente
- O escopo de listagem da API funciona corretamente (service usa `usuario.id`)
- A migration de criação de eventos é consistente com o modelo Sequelize
- Os testes unitários do service cobrem os cenários de delete e restore com mocks adequados
- A SSR de gestão de eventos (criar, editar, deletar via `rbac('admin')`) está corretamente protegida
- O middleware `uploadTemplate` valida MIME type e tamanho conforme FR-51/NFR-11

## Risco residual

O domínio possui vulnerabilidade de escalada de privilégios horizontal (EVT-01) explorável por qualquer gestor ou monitor com token JWT válido e vínculo ao evento-alvo. O risco é mitigado apenas pelo fato de que gestores e monitores raramente possuem acesso ao token JWT diretamente (interface SSR usa cookie), mas a API já existe e é documentada via Swagger.
