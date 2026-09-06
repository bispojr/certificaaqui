# Auditoria 07 — Domínio de Participantes

**Sistema:** Certifique-me  
**Data da auditoria:** 2026-05-09 19:14 (BRT)  
**Escopo:** Domínio de Participantes — CRUD, API REST, SSR, associações, RBAC, escopo multi-tenant  
**Fontes auditadas:**

- `docs/especificacoes.md` (SRS v2.0, 2026-04-30)
- `src/routes/participantes.js`
- `src/routes/admin.js` (seção de participantes)
- `src/controllers/participanteController.js`
- `src/controllers/participanteSSRController.js`
- `src/services/participanteService.js`
- `src/middlewares/auth.js`, `authSSR.js`, `rbac.js`, `scopedEvento.js`, `validate.js`
- `src/models/participante.js`, `certificado.js`, `usuario.js`, `usuario_eventos.js`
- `src/validators/participante.js`
- `src/routes/api.js`, `src/routes/public.js`
- `views/admin/participantes/index.hbs`, `form.hbs`
- `migrations/20260311180742-create-participantes.js`
- `migrations/20260324083059-create-performance-indexes.js`
- `tests/controllers/participanteController.test.js`
- `tests/controllers/participanteSSRController.test.js`
- `tests/routes/participantes.test.js`
- `tests/routes/protectedManagementRoutes.test.js`
- `tests/routes/adminEntidades.test.js`
- `tests/services/participanteService.test.js`
- `tests/services/participante.test.js`
- `tests/models/participante.test.js`
- `tests/validators/participante.test.js`

---

## 1. Matriz de Achados

| ID  | Descrição                                                                                  | Severidade | Tipo | Impacto                                                                                        | Evidência Principal                                                                                                                                                                                       | FR/NFR Relacionado         |
| --- | ------------------------------------------------------------------------------------------ | ---------- | ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| F01 | API `GET /participantes` retorna todos os participantes sem filtro de evento               | Crítica    | VU   | Vazamento multi-tenant: gestor/monitor vê participantes de outros eventos                      | `src/routes/participantes.js:L151` — sem `scopedEvento`; `src/services/participanteService.js:L6-L16` — `findAndCountAll` sem filtro                                                                      | FR-37, NFR-1               |
| F02 | API `PUT /participantes/:id` retorna HTTP 200 com `null` para participante inexistente     | Alta       | BR   | Resposta HTTP semânticamente inválida; cliente não detecta falha                               | `src/controllers/participanteController.js:L37-L44`; `src/services/participanteService.js:L23-L26`                                                                                                        | FR-1                       |
| F03 | API `DELETE /participantes/:id` retorna HTTP 204 para participante inexistente             | Média      | BR   | Exclusão silenciosa de ID inexistente; falsa confirmação de sucesso                            | `src/controllers/participanteController.js:L46-L52`; `src/services/participanteService.js:L27-L33`                                                                                                        | FR-1, FR-4                 |
| F04 | API `POST /participantes/:id/restore` retorna HTTP 200 com `null` para inexistente         | Alta       | BR   | Restauração silenciosa sem confirmação real                                                    | `src/controllers/participanteController.js:L54-L60`; `src/services/participanteService.js:L38-L43`                                                                                                        | FR-4                       |
| F05 | SSR: rotas de participantes sem middleware RBAC                                            | Crítica    | VU   | Monitor pode criar, editar, deletar e restaurar participantes via SSR                          | `src/routes/admin.js:L89-L98` — comentário "todos os perfis autenticados", sem `rbac()` em nenhuma rota                                                                                                   | FR-35, FR-36, FR-38, NFR-1 |
| F06 | SSR: operações por `:id` sem verificação de escopo por evento                              | Alta       | VU   | Gestor/monitor pode editar ou deletar participante de outro evento via SSR                     | `src/controllers/participanteSSRController.js:L79-L168` — nenhuma verificação de `evento_id` nas funções `editar`, `atualizar`, `deletar`, `restaurar`                                                    | FR-37, NFR-1               |
| F07 | SSR: flash de sucesso exibido mesmo quando participante não existe                         | Baixa      | BR   | Falsa confirmação de sucesso ao usuário em operações sobre ID inexistente                      | `src/controllers/participanteSSRController.js:L120-L128` (`atualizar`), L130-L139 (`deletar`) — service retorna `null` sem lançar exceção                                                                 | FR-1                       |
| F08 | SSR: sem validação server-side de `nomeCompleto.min(3)` ao criar/atualizar                 | Média      | GI   | Participantes com nome de 1-2 caracteres podem ser criados via SSR                             | `src/routes/admin.js:L92-L96` — sem `validate(participanteSchema)`; modelo Sequelize sem validação de comprimento                                                                                         | FR-3                       |
| F09 | SSR: participantes sem certificado são invisíveis para gestor/monitor                      | Alta       | GI   | Participantes registrados mas ainda sem certificados somem da listagem para gestores/monitores | `src/controllers/participanteSSRController.js:L35-L46` — `required: eventoIds ? true : false` gera INNER JOIN para não-admins                                                                             | FR-36, FR-49               |
| F10 | SSR: filtro `?q=` não é aplicado à seção de arquivados                                     | Baixa      | BR   | Pesquisa por nome/email filtra ativos, mas todos os arquivados aparecem                        | `src/controllers/participanteSSRController.js:L48-L58` — `arquivados` não inclui `textWhere`                                                                                                              | FR-49                      |
| F11 | `scopedEvento` middleware incompatível semanticamente com rotas de participante            | Alta       | VA   | Middleware não pode proteger participantes pois usa `req.params.id` como `evento_id`           | `src/middlewares/scopedEvento.js:L33` — `const eventoId = req.body.evento_id \|\| req.params.eventoId \|\| req.params.id`                                                                                 | FR-37                      |
| F12 | Estratégias de escopo divergentes entre API e SSR para participantes                       | Alta       | VA   | API não aplica escopo; SSR usa JOIN em certificados — comportamentos opostos                   | API: `src/routes/participantes.js` (sem scope); SSR: `src/controllers/participanteSSRController.js:L19-L58`                                                                                               | FR-37, NFR-6               |
| F13 | `authSSR` retorna objeto plano: `getEventos()` ausente — `scopedEvento` inaplicável no SSR | Alta       | VA   | Impossiblidade arquitetural de usar o middleware `scopedEvento` em rotas SSR                   | `src/middlewares/authSSR.js:L50-L59` — `req.usuario` é objeto literal; `src/middlewares/scopedEvento.js:L4-L7` — exige `getEventos()`                                                                     | FR-37, NFR-6               |
| F14 | `participanteService.findAll()` sem suporte a filtros de evento                            | Alta       | GI   | Nenhuma forma de obter participantes filtrados por evento via serviço                          | `src/services/participanteService.js:L5-L17` — assinatura `{ page, perPage }` sem `evento_id`                                                                                                             | FR-37                      |
| F15 | `PUT /participantes/:id` usa `schema.partial()` — semântica PATCH via PUT                  | Baixa      | DT   | Aceita corpo vazio `{}` como válido; diverge da semântica REST                                 | `src/routes/participantes.js:L148-L151` — `validate(participanteSchema.partial())`                                                                                                                        | FR-1                       |
| F16 | Duplicação de métodos `destroy` e `delete` no service                                      | Baixa      | DT   | Manutenção dupla e risco de divergência futura                                                 | `src/services/participanteService.js:L27-L36` — `destroy` e `delete` com mesma implementação                                                                                                              | —                          |
| F17 | Unicidade de email sem índice parcial: soft-delete bloqueia re-cadastro                    | Média      | AM   | Após soft-delete, email fica bloqueado para novos cadastros                                    | `migrations/20260311180742-create-participantes.js:L15` — `unique: true` sem filtro parcial; `migrations/20260324083059-create-performance-indexes.js:L30` — índice `idx_participantes_email` sem `where` | FR-4                       |
| F18 | Busca pública por email é case-sensitive                                                   | Baixa      | DT   | Busca de "joao@TESTE.com" falha para "joao@teste.com"                                          | `src/routes/public.js:L29` — `Participante.findOne({ where: { email } })` sem `Op.iLike` ou normalização                                                                                                  | FR-23, FR-53               |
| F19 | API sem capacidade de busca textual (`?q=`)                                                | Média      | GI   | Integrações via API não podem filtrar participantes por nome ou email                          | `src/controllers/participanteController.js:L12-L19` — apenas `page` e `perPage`; sem `q`                                                                                                                  | FR-49                      |
| F20 | Modelo `Participante` sem associação direta a `Evento`                                     | Alta       | VA   | Impossibilidade de filtrar participantes por evento diretamente via ORM                        | `src/models/participante.js:L6-L10` — apenas `hasMany(Certificado)`, sem relação com `Evento`                                                                                                             | FR-37                      |

---

## 2. Achados Críticos

### F01 — API `GET /participantes`: Multi-tenant Leak irrestrito

**Severidade:** Crítica | **Tipo:** VU

**Descrição:**  
A rota `GET /participantes` da API REST lista todos os participantes do sistema sem qualquer filtro de evento. O middleware `scopedEvento` não é aplicado, e `participanteService.findAll()` executa `findAndCountAll({ offset, limit })` sem nenhuma cláusula `WHERE` de escopo.

**Evidências:**

```js
// src/routes/participantes.js — linha 151
router.get('/', auth, rbac('monitor'), participanteController.findAll)
// ^^ sem scopedEvento

// src/services/participanteService.js — linha 6-16
async findAll({ page = 1, perPage = 20 } = {}) {
  const offset = (page - 1) * perPage
  const { count, rows } = await Participante.findAndCountAll({
    offset,
    limit: perPage,
    // sem filtro de evento_id
  })
  ...
}
```

O teste `protectedManagementRoutes.test.js` confirma e **valida** esse comportamento como aceito:

```js
test('gestor de outro evento ainda acessa lista de participantes (sem restrição por evento)', async () => {
  ...
  expect(res.status).toBe(200)  // ← aceita o vazamento
})
```

**Impacto:**  
Um gestor ou monitor do evento `EDU-2026` pode usar a API para listar **todos os participantes do sistema**, incluindo os de eventos concorrentes. Isso viola isolamento de dados multi-tenant e expõe PII (nome completo, email, instituição) de participantes fora do seu escopo.

**FR violado:** FR-37 — "O middleware `scopedEvento` deve garantir que gestores e monitores operem exclusivamente dentro dos eventos ao qual estão vinculados."

---

### F05 — SSR: Rotas de Participantes sem RBAC

**Severidade:** Crítica | **Tipo:** VU

**Descrição:**  
Todas as rotas SSR de participantes administradas em `/admin/participantes/*` carecem completamente de middleware `rbac()`. O comentário no código é explícito: `"todos os perfis autenticados"`. Isso contradiz FR-36 que restringe o perfil `monitor` a apenas listar e visualizar participantes.

**Evidências:**

```js
// src/routes/admin.js — linhas 89-98
// Gestão de participantes (todos os perfis autenticados)
router.get('/participantes', participanteSSRController.index)
router.get('/participantes/novo', participanteSSRController.novo) // sem rbac
router.get('/participantes/:id/editar', participanteSSRController.editar) // sem rbac
router.post('/participantes', participanteSSRController.criar) // sem rbac
router.post('/participantes/:id', participanteSSRController.atualizar) // sem rbac
router.post('/participantes/:id/deletar', participanteSSRController.deletar) // sem rbac
router.post('/participantes/:id/restaurar', participanteSSRController.restaurar) // sem rbac
```

**Impacto:**  
Um usuário com perfil `monitor` pode, via interface web:

- Criar participantes
- Editar dados de participantes (nome, email, instituição)
- Deletar (soft delete) participantes
- Restaurar participantes deletados

Nenhum desses é permitido por FR-36. Trata-se de escalada de privilégio funcional direta. O contraste com a API é revelador: mesmo a API aplica `rbac('monitor')` (que ao menos exige autenticação com perfil mínimo), enquanto o SSR aplica apenas `authSSR` sem camada de perfil.

**FR violado:** FR-35, FR-36, FR-38, NFR-1.

---

### F06 — SSR: Sem Escopo de Evento em Operações por `:id`

**Severidade:** Alta | **Tipo:** VU

**Descrição:**  
A listagem SSR (`index`) implementa lógica de escopo via JOIN em certificados, mas as operações individuais (`editar`, `atualizar`, `deletar`, `restaurar`) não verificam se o participante acessado pertence ao escopo de eventos do usuário autenticado.

**Evidências:**

```js
// src/controllers/participanteSSRController.js
async editar(req, res) {
  const participante = await participanteService.findById(req.params.id)
  // ^^^ busca por PK sem verificar evento associado
  if (!participante) { ... }
  return res.render('admin/participantes/form', { ... })
}

async atualizar(req, res) {
  await participanteService.update(req.params.id, req.body)
  // ^^^ atualiza por PK sem verificar evento associado
  ...
}
```

**Impacto:**  
Um gestor do evento `EDU-2026` pode acessar `/admin/participantes/42/editar` (onde ID 42 é participante do evento `CMP-2026`) e modificar seus dados sem qualquer restrição. Violação direta de isolamento multi-tenant via SSR.

---

## 3. Problemas Arquiteturais

### PA01 — `scopedEvento` incompatível com o domínio de Participantes (F11 + F20)

O middleware `scopedEvento` foi projetado para entidades que possuem `evento_id` diretamente (`req.body.evento_id`, `req.params.eventoId`) ou cujo `:id` é o próprio ID do evento. Participantes não têm relação direta com eventos — apenas indireta via `certificados`.

```js
// src/middlewares/scopedEvento.js:33
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
```

Para `PUT /participantes/5`, o middleware usaria `5` como `evento_id` para validar o escopo — o que é semanticamente errado (5 é o participante, não o evento).

O modelo `Participante` (src/models/participante.js) não define associação com `Evento`:

```js
static associate(models) {
  Participante.hasMany(models.Certificado, { foreignKey: 'participante_id', as: 'certificados' })
  // sem Participante.belongsToMany(models.Evento, ...)
}
```

Isso significa que `scopedEvento` simplesmente não pode ser aplicado ao domínio de participantes sem refatoração. A consequência direta é que nenhuma rota de participante (API ou SSR) usa o middleware de escopo oficial do sistema.

---

### PA02 — `authSSR` retorna objeto plano, tornando `scopedEvento` permanentemente inaplicável no SSR (F13)

```js
// src/middlewares/authSSR.js:50-59
const usuarioData = {
  id: usuario.id,
  nome: usuario.nome,
  perfil: usuario.perfil,
  isAdmin: usuario.perfil === 'admin',
  isGestor: usuario.perfil === 'gestor',
}
req.usuario = usuarioData // ← objeto literal, não instância Sequelize
```

```js
// src/middlewares/scopedEvento.js:4-7
if (typeof req.usuario.getEventos !== 'function') {
  return res
    .status(500)
    .json({ error: 'Usuário sem método getEventos (modelo N:N)' })
}
```

O middleware `scopedEvento` exige `req.usuario.getEventos()`, que só existe em instâncias Sequelize. Em rotas SSR, `req.usuario` é um objeto plano sem esse método. Consequência: qualquer tentativa de usar `scopedEvento` em rotas SSR retornará HTTP 500. O `participanteSSRController` contorna esse problema re-consultando o usuário com eventos a cada request:

```js
// src/controllers/participanteSSRController.js:19-23
const usuarioComEventos = await Usuario.findByPk(req.usuario.id, {
  include: 'eventos',
})
eventoIds = (usuarioComEventos?.eventos || []).map((e) => e.id)
```

Isso é um workaround de N+1 que expõe a incompatibilidade arquitetural entre as camadas API e SSR.

---

### PA03 — Ausência de estratégia unificada de escopo multi-tenant para participantes (F12)

As duas superfícies (`API REST` e `SSR`) implementam estratégias completamente divergentes de escopo:

| Superfície      | Estratégia de Escopo                              | Resultado                                    |
| --------------- | ------------------------------------------------- | -------------------------------------------- |
| API REST        | Nenhuma (sem `scopedEvento`)                      | Sem escopo — todos os participantes visíveis |
| SSR (listagem)  | JOIN com `Certificado` WHERE `evento_id IN [...]` | Escopo indireto via certificados             |
| SSR (`:id` ops) | Nenhuma                                           | Sem escopo — qualquer participante acessível |

Não existe uma estratégia comum. O escopo via JOIN em certificados usado pelo SSR cria uma dependência funcional indireta e não explícita entre participante e evento. A API não implementa nada equivalente.

---

## 4. Divergências API vs SSR

| Aspecto                               | API REST (`/participantes`)                                           | SSR Admin (`/admin/participantes`)                           |
| ------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Autenticação**                      | `auth` (JWT Bearer, instância Sequelize)                              | `authSSR` (cookie JWT, objeto plano)                         |
| **RBAC**                              | `rbac('monitor')` em todas as rotas                                   | Nenhum `rbac()` em nenhuma rota                              |
| **Escopo por evento (listagem)**      | Nenhum — retorna todos os participantes                               | Gestor/monitor: JOIN em Certificado por `evento_id`          |
| **Escopo por evento (ops por `:id`)** | Nenhum                                                                | Nenhum                                                       |
| **Busca textual**                     | Inexistente (`?page` e `?perPage` apenas)                             | `?q=` com `iLike` em `nomeCompleto` e `email`                |
| **Participantes arquivados**          | `POST /:id/restore` disponível                                        | Seção `<details>` na listagem + `POST /:id/restaurar`        |
| **Validação de input**                | Zod (`validate` middleware) aplicado em POST e PUT                    | Sem validação server-side além de Sequelize (sem min length) |
| **Resposta para `:id` inexistente**   | `update`: HTTP 200 null; `delete`: HTTP 204; `restore`: HTTP 200 null | Flash de sucesso sem verificação de existência               |
| **Acesso do monitor a modificações**  | Permitido (rbac('monitor'))                                           | Permitido (sem rbac)                                         |
| **Paginação**                         | Sim (`page`, `perPage`)                                               | Não (retorna todos de uma vez)                               |

---

## 5. Atualizações Recomendadas no SRS

### 5.1 FR-3 — Acrescentar escopo de aplicação da regra

**Lacuna identificada:** FR-3 define que `nomeCompleto` deve ter mínimo 3 caracteres, mas não explicita que essa restrição deve ser aplicada em **ambas as superfícies** (API e SSR). A implementação atual aplica a regra apenas via Zod (API), ignorando o SSR.

**Adição sugerida ao FR-3:**

> "A validação de formato e comprimento mínimo de todos os campos do participante deve ser aplicada em todas as superfícies de entrada (API REST e interface SSR)."

---

### 5.2 FR-36 — Explicitar que monitor não pode modificar participantes

**Ambiguidade identificada:** FR-36 diz que monitor "pode listar e visualizar certificados e participantes dos seus eventos". A frase não proíbe explicitamente que monitores modifiquem participantes; apenas omite essa permissão.

**Adição sugerida ao FR-36:**

> "O perfil `monitor` não possui permissão para criar, editar, remover ou restaurar participantes."

---

### 5.3 FR-37 — Explicitar que o escopo é aplicável via JOIN quando sem `evento_id` direto

**Lacuna identificada:** FR-37 descreve que o filtro de `evento_id` é "injetado automaticamente" pelo `scopedEvento`, mas não aborda entidades que não possuem `evento_id` diretamente (como participantes, cuja vinculação a eventos é indireta via certificados). O SRS não é claro sobre qual estratégia deve ser usada nesses casos.

**Adição sugerida ao FR-37:**

> "Para entidades sem `evento_id` direto (e.g., participantes), o escopo multi-tenant deve ser definido explicitamente: o sistema deve especificar se o escopo é inferido via certificados ou via associação direta. Na ausência de definição explícita, participantes são considerados globais e acessíveis a todos os usuários autenticados."

---

### 5.4 FR-4 — Esclarecer comportamento de email após soft-delete

**Ambiguidade identificada:** FR-4 garante que registros de participantes podem ser restaurados, mas não define o comportamento de `email` (campo único) quando participante é soft-deletado: se o mesmo email pode ser re-cadastrado antes da restauração.

**Adição sugerida ao FR-4:**

> "O campo `email` de um participante soft-deletado deve permanecer reservado, impedindo o cadastro de novo participante com o mesmo email até que o registro original seja permanentemente removido ou restaurado."  
> — **OU** —  
> "O campo `email` de um participante soft-deletado não deve bloquear o cadastro de novos participantes. A unicidade deve ser garantida por índice parcial que exclua registros com `deleted_at IS NOT NULL`."

---

### 5.5 FR-53 — Esclarecer comportamento para participante soft-deletado

**Lacuna identificada:** A rota pública `GET /api/certificados?email=...` e `POST /obter` buscam participante com `Participante.findOne({ where: { email } })`. Se o participante estiver soft-deletado (paranoid: true filtrará), a resposta será 404 mesmo que certificados ainda existam. O SRS não define o comportamento esperado neste caso.

---

## 6. Itens para Validação Humana

### VH01 — Qual o modelo de escopo desejado para participantes?

**Questão:** Participantes não têm `evento_id` direto. O scoping via JOIN em certificados (adotado pelo SSR) exclui participantes **sem certificado** do escopo de gestores/monitores (F09). Isso é intencional?

**Opções:**

1. Participantes são **globais** (sem escopo por evento) — qualquer usuário autenticado pode ver qualquer participante.
2. Participantes pertencem ao escopo via **certificados** — apenas participantes com pelo menos um certificado no evento do usuário são visíveis.
3. Criar associação direta `participante ↔ evento` (via nova tabela ou campo `evento_id` em participante) para permitir scoping nativo.

**Impacto da decisão:** Define se F01, F09 e F12 são bugs ou limitações aceitáveis.

---

### VH02 — Nível de permissão de monitor para gestão de participantes

**Questão:** FR-36 permite monitor "listar e visualizar". A ausência de RBAC no SSR (F05) permite que monitores criem e editem participantes. Isso é uma falha ou uma concessão deliberada de operação?

**Opção A:** Monitor pode apenas listar/visualizar — implementar `rbac('gestor')` em criação/edição/exclusão.  
**Opção B:** Monitor também pode criar e editar participantes — atualizar FR-36 para refletir essa permissão.

---

### VH03 — Comportamento do email único após soft-delete (F17)

**Questão:** A unicidade sem índice parcial impede re-cadastro do participante com o mesmo email após exclusão lógica. Isso é comportamento desejado ou limitação a corrigir?

**Cenário real:** Um participante cancela inscrição (soft-delete) e depois quer se inscrever novamente no próximo ano — atualmente impossível sem restaurar o registro anterior.

---

### VH04 — Restauração de participante por monitor

**Questão:** A rota API `POST /participantes/:id/restore` usa `rbac('monitor')` — qualquer perfil autenticado pode restaurar. O SSR não tem restrição. É intencional que monitores possam restaurar participantes?

---

### VH05 — Comportamento da busca pública para participante soft-deletado

**Questão:** Se um participante é soft-deletado, sua busca por email em `/obter` retorna "participante não encontrado", mas seus certificados ainda existem no banco. Os certificados continuam acessíveis via código de validação direto (`/validar/:codigo`). É o comportamento esperado?

---

## 7. Iniciativas Futuras de Spec

### IFS01 — Especificação de Scoping de Participantes por Evento

Criar uma spec formal que defina:

- Se participantes devem ter `evento_id` direto ou manter relação apenas via certificados
- Como o `scopedEvento` middleware deve ser adaptado para entidades sem FK direta de evento
- Consenso sobre quais perfis veem quais participantes

### IFS02 — Especificação de RBAC Granular para Participantes

Criar uma spec que explicite o mapeamento completo de permissões para participantes:

| Operação                    | admin | gestor     | monitor    |
| --------------------------- | ----- | ---------- | ---------- |
| Listar participantes        | ✓     | ✓ (escopo) | ✓ (escopo) |
| Visualizar participante     | ✓     | ?          | ?          |
| Criar participante          | ✓     | ?          | ✗          |
| Editar participante         | ✓     | ?          | ✗          |
| Deletar (soft) participante | ✓     | ?          | ✗          |
| Restaurar participante      | ✓     | ?          | ✗          |

### IFS03 — Especificação de Busca/Filtro de Participantes na API

A API REST atualmente oferece apenas paginação. Definir se a API deve suportar:

- Busca por `?q=` (nome/email)
- Filtro por `?evento_id=`
- Ordenação e paginação cursor-based

### IFS04 — Spec de Unicidade de Email com Soft Delete

Definir a semântica da unicidade de email em cenários de soft delete, com impacto nas migrations (índice parcial vs. global).

---

## 8. Conclusão Arquitetural do Domínio

O domínio de Participantes apresenta **déficit arquitetural sistêmico** concentrado em três vetores:

### Vetor 1: Ausência de escopo multi-tenant na API

A API REST de participantes não aplica nenhuma restrição de escopo por evento. O middleware `scopedEvento` existe no sistema, mas a arquitetura do modelo (sem `evento_id` direto) torna sua aplicação incompatível sem refatoração. O resultado é que a API expõe todos os participantes a qualquer usuário autenticado, independentemente do perfil, violando FR-37 de forma estrutural.

### Vetor 2: Divergência profunda entre API e SSR

As duas superfícies implementam RBAC e escopo de maneiras radicalmente diferentes: a API aplica `rbac('monitor')` em todas as rotas mas sem escopo; o SSR não aplica RBAC algum mas implementa escopo parcial via JOIN em certificados (somente na listagem). A raiz técnica dessa divergência é que `authSSR` não retorna instâncias Sequelize (incompatível com `scopedEvento`), enquanto `auth` sim. Isso inviabiliza o compartilhamento do middleware de escopo entre as superfícies.

### Vetor 3: Contrato HTTP inconsistente no controller REST

O `participanteController` não trata o retorno `null` do service para as operações `update`, `delete` e `restore` quando o participante não existe. As respostas HTTP resultantes (200 null, 204 sem deleção real, 200 null) violam a semântica REST e prejudicam a integração de clientes da API.

**Achados críticos:** 2 (F01 e F05)  
**Achados de alta severidade:** 7 (F02, F04, F06, F09, F11, F12, F14)  
**Total de achados:** 20

O domínio requer priorização de correção dos achados F01 e F05 antes de qualquer expansão funcional, pois ambos representam vetores de acesso não autorizado a dados de outros eventos (violação multi-tenant e escalada de privilégio via SSR).
