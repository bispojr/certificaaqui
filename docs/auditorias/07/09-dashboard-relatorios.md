# Auditoria 07/09 — Domínio: Dashboard, Relatórios e Métricas

**Sistema:** Certifique-me  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Data da auditoria:** 2026-05-09  
**Horário:** 19:49 (BRT)  
**Auditor:** GitHub Copilot (Claude Sonnet 4.6)  
**Escopo:** Dashboard administrativo, métricas, KPIs, contadores, estatísticas, queries agregadas, visibilidade por perfil

---

## Fontes Revisadas

| Fonte                   | Arquivo                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Especificação           | `docs/especificacoes.md`                                                                                                                    |
| Controller SSR          | `src/controllers/dashboardController.js`                                                                                                    |
| Rota SSR                | `src/routes/admin.js`                                                                                                                       |
| View SSR                | `views/admin/dashboard.hbs`                                                                                                                 |
| Middleware auth         | `src/middlewares/authSSR.js`                                                                                                                |
| Middleware RBAC         | `src/middlewares/rbac.js`                                                                                                                   |
| Middleware scopedEvento | `src/middlewares/scopedEvento.js`                                                                                                           |
| Modelos                 | `src/models/usuario.js`, `src/models/certificado.js`, `src/models/evento.js`, `src/models/participante.js`, `src/models/usuario_eventos.js` |
| Testes de controller    | `tests/controllers/dashboardController.test.js`                                                                                             |
| Testes de rota          | `tests/routes/adminDashboard.test.js`                                                                                                       |
| Testes de view          | `tests/views/admin/dashboard.hbs.markers.test.js`                                                                                           |
| Backlog domínio         | `docs/backlog/06-dashboard-administrativo/`                                                                                                 |

---

## 1. Matriz de Achados

| ID        | Descrição                                                                                                                                                                                                        | Severidade | Tipo | Impacto                                                                                                                          | Evidência                                                                                                                                                                               | FR/NFR              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **BR-01** | `{{totalEventos}}` renderizado para TODOS os perfis na seção "Gestão de eventos", mas só computado para admin                                                                                                    | Alta       | BR   | Gestor/monitor vê card "Eventos" com valor vazio                                                                                 | `dashboardController.js` L57–90 (branch gestor não computa `totalEventos`); `dashboard.hbs` L63 (`{{totalEventos}}` sem condicional de perfil)                                          | FR-56               |
| **BR-02** | `{{totalCertificadosPendentes}}` visível a TODOS os perfis na seção "Certificação", mas só computado para admin                                                                                                  | Alta       | BR   | Gestor/monitor vê card "Pendentes" com valor vazio                                                                               | `dashboardController.js` L26 (só branch admin); `dashboard.hbs` L46 (`{{totalCertificadosPendentes}}` sem condicional)                                                                  | FR-56               |
| **BR-03** | `{{totalTipos}}` condicional para admin+gestor (`{{#if (or usuario.isAdmin usuario.isGestor)}}`), mas só computado para admin                                                                                    | Alta       | BR   | Gestor vê card "Tipos" com valor vazio                                                                                           | `dashboardController.js` L22 (só branch admin); `dashboard.hbs` L24–36                                                                                                                  | FR-56               |
| **BR-04** | Flag `isMonitor` nunca definida em `authSSR.js`; qualquer condicional `{{#if usuario.isMonitor}}` sempre falsa em produção                                                                                       | Média      | BR   | Lógica condicional de view específica para monitor nunca é ativada                                                               | `authSSR.js` L52–58 (somente `isAdmin` e `isGestor` são definidos); `dashboard.hbs.markers.test.js` L49 (passa `isMonitor: true`, estado irreal)                                        | FR-36, UF-19        |
| **BR-05** | Card "Certificados" exibe label sem qualificador "(seus eventos)" para monitor, mas o count É escopado aos eventos do monitor                                                                                    | Baixa      | BR   | Inconsistência de UX: gestor vê "(seus eventos)", monitor não vê, embora ambos recebam o mesmo scoping                           | `dashboard.hbs` L14 (condicional `{{#if usuario.isGestor}}`); `dashboardController.js` L57 (branch gestor/monitor unificado)                                                            | FR-56               |
| **IP-01** | `ultimosCertificados` computado pelo controller para admin e passado ao contexto da view, mas a view **não contém** nenhum `{{#each ultimosCertificados}}` ou tabela correspondente                              | Crítica    | IP   | FR-56 ("os 5 certificados mais recentes") não atendido na UI; DASH-ADMIN-003 marcado como concluído mas não implementado na view | `dashboardController.js` L30–41 (computa e passa `ultimosCertificados`); `dashboard.hbs` (107 linhas, ausência total de tabela); backlog `dashboard-admin/task-003.md` ([x] 2026-05-08) | FR-56               |
| **IP-02** | Dashboard gestor/monitor exibe somente 2 métricas (`totalCertificados`, `totalParticipantes`); sem breakdown por tipo e sem últimos certificados escopados                                                       | Média      | IP   | Visibilidade operacional mínima para gestores; funcionalidades previstas no backlog não implementadas                            | `dashboardController.js` L57–90 (apenas 2 contagens no branch gestor/monitor); backlog DASH-GEST-002 e DASH-GEST-003 pendentes                                                          | FR-56 (spec mínima) |
| **GI-01** | FR-56 exige explicitamente "os 5 certificados mais recentes" no dashboard admin; dado gerado mas não exibido                                                                                                     | Crítica    | GI   | Requisito funcional explícito não entregue ao usuário final                                                                      | `docs/especificacoes.md` FR-56; `dashboardController.js` L30–41; `dashboard.hbs` (sem tabela)                                                                                           | FR-56               |
| **GI-02** | Ausência total de endpoint REST API para métricas/dashboard                                                                                                                                                      | Baixa      | GI   | Sem mecanismo para integrações externas consumirem dados agregados                                                               | Nenhum arquivo em `src/routes/` expõe `/api/dashboard` ou `/api/metrics`                                                                                                                | FR-49, FR-56        |
| **VA-01** | `GET /admin/dashboard` sem middleware `rbac()` explícito; padrão do projeto requer declaração explícita de perfil mínimo                                                                                         | Baixa      | VA   | Inconsistência arquitetural com o restante das rotas SSR                                                                         | `admin.js` L77: `router.get('/dashboard', dashboardController.dashboard)` vs todas as outras rotas com `rbac(...)`                                                                      | FR-38, NFR-1        |
| **DT-01** | Semântica dual de `totalParticipantes`: admin usa `Participante.count()` (participantes cadastrados); gestor usa `Certificado.count({ distinct: true, col: 'participante_id' })` (participantes com certificado) | Média      | DT   | Mesma label/variável com semânticas opostas entre perfis; risco de decisão baseada em dado mal interpretado                      | `dashboardController.js` L23 (admin: `Participante.count()`); L70–72 (gestor: `Certificado.count` distinct)                                                                             | FR-56               |
| **DT-02** | Lógica de scoping do evento implementada inline no controller (carrega `eventoIds` manualmente) em vez de reutilizar `scopedEvento`                                                                              | Baixa      | DT   | Duplicação de responsabilidade; lógica de scoping dispersa entre middleware e controller                                         | `dashboardController.js` L57–65; `scopedEvento.js` (middleware dedicado não aplicado ao dashboard)                                                                                      | NFR-6               |
| **DT-03** | Queries de agregação do dashboard residem diretamente no controller; ausência de `dashboardService.js`                                                                                                           | Baixa      | DT   | Viola moderadamente o padrão routes → controllers → services → models para lógica agregada complexa                              | `dashboardController.js` (totalmente autossuficiente sem chamar serviços)                                                                                                               | NFR-6               |
| **ID-01** | Spec define perfil mínimo "monitor" para `/admin/dashboard` na tabela de rotas; código não aplica `rbac('monitor')`                                                                                              | Baixa      | ID   | Especificação e implementação divergem quanto à declaração explícita de controle de acesso                                       | `docs/especificacoes.md` L537; `admin.js` L77                                                                                                                                           | FR-38               |
| **ID-02** | Backlog DASH-ADMIN-003 marcado `[x] concluída em 2026-05-08 09:45 (BRT)`, mas view dashboard.hbs não contém a tabela de últimos certificados                                                                     | Crítica    | ID   | Estado do backlog diverge do estado real do código; rastreabilidade comprometida                                                 | `dashboard-admin/task-003.md` (status [x]); `dashboard.hbs` (107 linhas, sem tabela)                                                                                                    | FR-56               |
| **ID-03** | Template da task DASH-ADMIN-003 referencia `{{this.Participante.nome}}`, mas atributo real do modelo é `nomeCompleto` (field: `nome_completo`)                                                                   | Média      | ID   | Referência de campo incorreta irá causar renderização vazia quando a tabela for implementada                                     | `dashboard-admin/task-003.md` (template HBS com `.nome`); `src/models/participante.js` L12 (`nomeCompleto`)                                                                             | FR-56               |
| **AM-01** | Label "Participantes (seus eventos)" para gestor mede DISTINCT `participante_id` em certificados, não participantes cadastrados no sistema                                                                       | Média      | AM   | Ambiguidade semântica confirmada; gestor pode interpretar o número como total de participantes registrados                       | `dashboard.hbs` L82 (label "Participantes..."); `dashboardController.js` L70–72; `dashboard-gestor/task-004.md` (registra ambiguidade)                                                  | FR-56               |
| **AM-02** | `totalCertificados` (admin) inclui status "emitido", "pendente" e "cancelado"; spec não especifica quais status compõem o total                                                                                  | Baixa      | AM   | Sem definição explícita, "total de certificados" é ambíguo quanto à inclusão de cancelados                                       | `dashboardController.js` L25 (`Certificado.count()` sem filtro de status); `docs/especificacoes.md` FR-56                                                                               | FR-56               |
| **AM-03** | Para monitor, o card "Certificados" não exibe o qualificador "(seus eventos)" mesmo o valor sendo escopado; para gestor, o qualificador aparece                                                                  | Baixa      | AM   | Especificação não define comportamento diferenciado de label entre gestor e monitor para o mesmo scoping                         | `dashboard.hbs` L14 (`{{#if usuario.isGestor}} (seus eventos){{/if}}`); `docs/especificacoes.md` FR-56                                                                                  | FR-56               |

---

## 2. Achados Críticos

### IP-01 / GI-01 / ID-02 — Tabela "Últimos 5 Certificados" (FR-56): controlador gera, view não exibe, backlog mente

**Severidade:** Crítica  
**Tipo:** IP + GI + ID  
**FR:** FR-56

**Descrição:**  
O FR-56 exige explicitamente que o dashboard admin exiba "os 5 certificados mais recentes". O controller implementa isso corretamente:

```js
// dashboardController.js — branch admin
ultimosCertificados: Certificado.findAll({
  limit: 5,
  order: [['created_at', 'DESC']],
  include: [
    { model: Participante, attributes: ['nomeCompleto'] },
    { model: Evento, attributes: ['nome'] },
    {
      model: TiposCertificados,
      as: 'TiposCertificados',
      attributes: ['descricao'],
    },
  ],
  attributes: ['id', 'codigo', 'status', 'created_at'],
})
```

O dado é passado ao `res.render('admin/dashboard', { ..., ultimosCertificados, ... })`. No entanto, a view `views/admin/dashboard.hbs` (107 linhas totais) não contém nenhum `{{#each ultimosCertificados}}`, tabela ou referência à variável.

**Agravante:** O backlog item `docs/backlog/06-dashboard-administrativo/dashboard-admin/task-003.md` está marcado com `[x] concluída em 2026-05-08 09:45 (BRT)`. Isso significa que a sincronização estado do backlog ↔ código está comprometida. A tarefa foi marcada concluída sem que a implementação na view fosse realizada.

**Impacto concreto:**

1. FR-56 não atendido na interface de usuário
2. Dado gerado (query executada no banco em toda requisição do dashboard admin) sem uso — overhead desnecessário
3. Rastreabilidade de progresso do backlog inválida

**Risco adicional identificado em ID-03:**  
Quando a tabela for implementada, o template de referência no backlog usa `{{this.Participante.nome}}`. O modelo `Participante` expõe o atributo como `nomeCompleto` (`field: 'nome_completo'`). A query no controller inclui `attributes: ['nomeCompleto']`. Portanto, o campo seria acessado como `this.Participante.nomeCompleto`, não `this.Participante.nome`. A implementação direta do template do backlog resultará em coluna renderizada vazia.

---

### BR-01 / BR-02 / BR-03 — Cards com valores vazios para gestor/monitor

**Severidade:** Alta  
**Tipo:** BR (×3)  
**FR:** FR-56

**Descrição:**  
A view `dashboard.hbs` é um template unificado que serve os três perfis (admin, gestor, monitor) com blocos condicionais mínimos. Três cards visíveis a perfis não-admin recebem variáveis que o controller nunca computa para esses perfis:

| Card        | Variável HBS                     | Visível para                                       | Computado para |
| ----------- | -------------------------------- | -------------------------------------------------- | -------------- |
| "Tipos"     | `{{totalTipos}}`                 | admin + gestor (guard `#if (or isAdmin isGestor)`) | Somente admin  |
| "Pendentes" | `{{totalCertificadosPendentes}}` | todos os perfis (sem guard)                        | Somente admin  |
| "Eventos"   | `{{totalEventos}}`               | todos os perfis (sem guard)                        | Somente admin  |

**Evidência direta (controller — branch gestor/monitor):**

```js
// dashboardController.js linhas 68–85
const [totalCertificados, totalParticipantes] = whereEvento
  ? await Promise.all([
      Certificado.count({ where: whereEvento }),
      Certificado.count({
        where: whereEvento,
        distinct: true,
        col: 'participante_id',
      }),
    ])
  : [0, 0]

return res.render('admin/dashboard', {
  layout: 'layouts/admin',
  title: 'Dashboard',
  totalCertificados,
  totalParticipantes, // ← somente estes dois são passados
  resourceMeta,
  // totalTipos, totalCertificadosPendentes, totalEventos NÃO passados
})
```

**Evidência direta (view — sem guards):**

```hbs
<!-- dashboard.hbs L46 — sem {{#if usuario.isAdmin}} -->
<div class="card-value text-warning">{{totalCertificadosPendentes}}</div>

<!-- dashboard.hbs L63 — sem {{#if usuario.isAdmin}} -->
<div class="card-value text-primary">{{totalEventos}}</div>
```

**Impacto:** Gestor e monitor visualizam cards com valor vazio, transmitindo zero informação e degradando a experiência do usuário. O card "Pendentes" com valor vazio pode ser interpretado como "nenhum certificado pendente" (falso) em vez de "dado não disponível para este perfil".

---

### BR-04 — Flag `isMonitor` ausente no `authSSR`

**Severidade:** Média  
**Tipo:** BR  
**FR:** FR-36, UF-19

**Descrição:**  
O middleware `authSSR.js` popula `req.usuario` e `res.locals.usuario` com objeto que contém apenas duas flags booleanas de perfil:

```js
// authSSR.js linhas 52–58
const usuarioData = {
  id: usuario.id,
  nome: usuario.nome,
  perfil: usuario.perfil,
  isAdmin: usuario.perfil === 'admin',
  isGestor: usuario.perfil === 'gestor',
  // isMonitor: AUSENTE
}
```

O teste `dashboard.hbs.markers.test.js` cobre o perfil monitor passando `{ usuario: { isMonitor: true } }`, porém esse estado jamais é gerado pelo authSSR em produção. Para um monitor real, `isAdmin === false` e `isGestor === false`. Qualquer template que use `{{#if usuario.isMonitor}}` nunca será ativado em produção.

**Impacto:** Testes da view simulam estado irreal. Se futuramente o template precisar usar `{{#if usuario.isMonitor}}` para exibir conteúdo específico de monitor, o guard seria inefetivo em produção sem correção no `authSSR`.

---

## 3. Problemas Arquiteturais

### VA-01 — Ausência de `rbac()` na rota `/admin/dashboard`

**Evidência:**

```js
// admin.js linha 77
router.get('/dashboard', dashboardController.dashboard)
// vs padrão de todas as outras rotas do painel:
router.get('/participantes', participanteSSRController.index) // sem rbac (mesma inconsistência)
router.get('/certificados', rbac('monitor'), certificadoSSRController.index) // com rbac
router.get('/eventos', rbac('gestor'), eventoSSRController.index) // com rbac
```

A spec estabelece na tabela de rotas que `/admin/dashboard` requer perfil mínimo "monitor". O padrão de declaração explícita é usado nas rotas com restrição. A ausência de `rbac('monitor')` no dashboard é funcionalmente inofensiva (todos autenticados são no mínimo monitor), mas representa divergência arquitetural e pode gerar confusão em manutenção futura.

---

### DT-02 — Scoping de evento duplicado entre middleware e controller

O middleware `scopedEvento.js` encapsula a lógica de carregar eventos vinculados ao usuário:

```js
// scopedEvento.js
const eventos = await req.usuario.getEventos()
const eventosIds = eventos.map((e) => Number(e.id))
```

O controller replica a mesma responsabilidade em sua própria abordagem:

```js
// dashboardController.js linhas 57–65
const dbUsuario = await Usuario.findByPk(req.usuario.id, {
  include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
})
const eventoIds = (dbUsuario.eventos || []).map((e) => e.id)
```

As duas implementações cumprem o mesmo propósito (obter IDs dos eventos do usuário), porém com APIs diferentes (`getEventos()` via instância Sequelize vs `findByPk + include`). A lógica de scoping não está centralizada.

Observação: a diferença de API (`getEventos()` vs `findByPk`) existe porque `authSSR` popula `req.usuario` como POJO — sem métodos Sequelize — enquanto o middleware `auth` (API REST) retorna a instância completa do modelo. O controller contorna isso com a segunda query, introduzindo um acesso adicional ao banco em toda requisição do dashboard para perfis não-admin.

---

### DT-03 — Controller com lógica agregada pesada sem camada de service

O `dashboardController.js` executa até 7 queries paralelas (`Promise.all`) diretamente no controller para o branch admin:

```js
await Promise.all([
  Evento.count(),
  TiposCertificados.count(),
  Participante.count(),
  Usuario.count(),
  Certificado.count(),
  Certificado.count({ where: { status: 'pendente' } }),
  Certificado.findAll({ limit: 5, order: ... include: ... }),
])
```

NFR-6 estabelece routes → controllers → services → models. A lógica de composição e agregação de múltiplas queries é considerada lógica de negócio e deveria residir em um `dashboardService.js`, mantendo o controller como orquestrador.

---

## 4. Divergências API vs SSR

| Aspecto                  | SSR (`GET /admin/dashboard`)              | API REST                                           |
| ------------------------ | ----------------------------------------- | -------------------------------------------------- |
| **Existência**           | Implementado                              | **Inexistente** — nenhum endpoint REST de métricas |
| **Autenticação**         | Cookie JWT HTTP-only via `authSSR`        | —                                                  |
| **Escopo**               | Filtro por perfil aplicado no controller  | —                                                  |
| **Dados admin**          | 7 métricas + 5 últimos certs (controller) | —                                                  |
| **Dados gestor/monitor** | 2 métricas escopadas                      | —                                                  |
| **Formato**              | HTML renderizado (Handlebars)             | —                                                  |

**GI-02 — Ausência de API REST para dashboard:**  
Não existe nenhum endpoint `GET /api/dashboard`, `GET /api/metrics` ou equivalente. O domínio de métricas/dashboard é exclusivamente SSR. Para qualquer integração externa que precise de dados agregados (ex.: sistema de BI, app mobile), não há caminho disponível.  
FR-49 menciona "incluindo dashboard" no contexto SSR. A ausência de endpoint REST pode ser decisão de design deliberada, porém não está explicitamente documentada como tal.

---

## 5. Atualizações Recomendadas no SRS

### 5.1 Clarificação de FR-56 — Definição exata de `totalCertificados`

**Lacuna:** FR-56 não especifica quais status de certificados compõem o total exibido. O campo `totalCertificados` retornado por `Certificado.count()` inclui "emitido", "pendente" e "cancelado".

**Texto sugerido a adicionar ao FR-56:**

> O contador `totalCertificados` inclui certificados de todos os status (`emitido`, `pendente`, `cancelado`) exceto soft-deletados. O contador `totalCertificadosPendentes` exibe exclusivamente certificados com `status = 'pendente'`.

---

### 5.2 Clarificação de FR-56 — Semântica de `totalParticipantes` por perfil

**Inconsistência documental (AM-01):** FR-56 usa o termo "participantes únicos" para o contexto gestor/monitor, mas não define se são participantes cadastrados no sistema ou participantes que possuem ao menos um certificado nos eventos do gestor.

**Texto sugerido a adicionar ao FR-56:**

> Para gestor/monitor, o indicador de "participantes" representa o número de `participante_id` distintos existentes nos certificados dos eventos do usuário (i.e., participantes que possuem ao menos um certificado dentro do escopo), e não o total de participantes cadastrados no sistema.

---

### 5.3 Clarificação de UF-19 — flags de perfil em `res.locals.usuario`

**Lacuna (BR-04):** UF-19 documenta que `authSSR` popula `res.locals.usuario` com flags `isAdmin` e `isGestor`. A ausência de `isMonitor` não é documentada como decisão.

**Texto sugerido em UF-19:**

> `authSSR` define `isAdmin` e `isGestor` como atalhos booleanos. `isMonitor` não é definido; perfil monitor é identificado pela ausência das outras flags (`!isAdmin && !isGestor`).

---

### 5.4 Clarificação de FR-56 — qualificador de label para monitor

**Ambiguidade (AM-03):** FR-56 descreve o comportamento do dashboard para "gestor/monitor" conjuntamente, sem especificar diferença de rótulo de card entre os perfis.

---

## 6. Itens para Validação Humana

**VAL-DASH-01 — Backlog DASH-ADMIN-003: concluída ou pendente?**  
O backlog marca `[x] concluída em 2026-05-08`. A view não contém a tabela. Decisão necessária:

- A view precisa ser atualizada para exibir a tabela?
- Ou o backlog deve ser revertido para `[ ]`?

**VAL-DASH-02 — Tabela `ultimosCertificados` para admin inclui certificados cancelados?**  
O controller usa `Certificado.findAll` sem filtro de status. A tabela exibirá certificados cancelados. É o comportamento desejado, ou deve filtrar apenas `status IN ('emitido', 'pendente')`?

**VAL-DASH-03 — `totalCertificados` (admin) deve excluir cancelados?**  
O card "Certificados" exibe a contagem bruta (`Certificado.count()` sem WHERE de status). Decisão necessária sobre se cancelados devem compor o total "de certificados" ou se devem existir contagens separadas.

**VAL-DASH-04 — API REST para métricas: escopo intencional ou lacuna?**  
Não existe endpoint `/api/dashboard` ou similar. Confirmar se a ausência é intencional (dashboard puramente SSR) ou se há demanda de integração que torna necessário um endpoint REST de métricas.

**VAL-DASH-05 — Flag `isMonitor` em `authSSR`: adotar ou documentar ausência?**  
Decisão entre:  
(a) adicionar `isMonitor: usuario.perfil === 'monitor'` ao objeto em authSSR.js para simetria;  
(b) documentar explicitamente que monitor é identificado por `!isAdmin && !isGestor` (padrão atual implícito).

**VAL-DASH-06 — Dashboard `/admin/dashboard` deve declarar `rbac('monitor')` explicitamente?**  
Todos perfis autenticados têm acesso (funcional). A declaração explícita de `rbac('monitor')` alinharia com o padrão do projeto. Confirmar se a adição é desejada.

---

## 7. Iniciativas Futuras de Spec

### SPEC-DASH-01 — Especificação de Dashboard Gestor/Monitor Enriquecido

Derivado de: IP-02, backlog DASH-GEST-001 a DASH-GEST-004

Definir formalmente, em novo FR ou extensão de FR-56, o comportamento esperado do dashboard para gestor/monitor:

- Breakdown de certificados por tipo de certificado
- Últimos N certificados emitidos no escopo do gestor
- Label correto de "Participantes com certificado" vs "Participantes cadastrados"
- Número de tipos de certificado com ao menos 1 certificado emitido

---

### SPEC-DASH-02 — Especificação de API REST de Métricas

Derivado de: GI-02

Caso haja demanda de integração, formalizar:

- `GET /api/admin/metrics` (requer auth Bearer + rbac admin)
- Payload JSON com as mesmas métricas do dashboard SSR para admin
- `GET /api/metrics` no contexto do usuário autenticado (gestor/monitor vê métricas escopadas)

---

### SPEC-DASH-03 — Especificação de Dashboard de Auditoria/Atividade

Derivado de: MS-6 (spec existente)

Definir formalmente:

- Registro e visualização de ações (emissão, cancelamento, edição de certificados) por usuário
- Período de retenção de log de atividade
- Visibilidade por perfil (admin vê tudo; gestor vê apenas eventos seus)

---

## 8. Conclusão Arquitetural do Domínio

### Estado geral

O domínio de Dashboard, Relatórios e Métricas está **parcialmente implementado** e com **múltiplas inconsistências** entre a especificação (FR-56) e a implementação real.

A estrutura fundamental está estabelecida: existe um `dashboardController.js` com bifurcação por perfil (admin vs gestor/monitor), protegido por `authSSR`, exposto em `GET /admin/dashboard`. Os dados são agregados corretamente no banco com suporte a paralelismo (`Promise.all`) e escopo multi-tenant para não-admins.

### Principais riscos identificados

**Risco 1 — Discrepância backlog/código (ID-02, IP-01):**  
DASH-ADMIN-003 marcada como concluída mas não implementada. A rastreabilidade de progresso está comprometida. Qualquer stakeholder que leia o backlog acreditará que FR-56 está completamente atendido.

**Risco 2 — Cards vazios para gestor/monitor (BR-01, BR-02, BR-03):**  
Três cards visíveis a gestores e monitores exibem valor vazio por ausência das variáveis no contexto de renderização. Impacto imediato na qualidade da interface para 2 dos 3 perfis internos do sistema.

**Risco 3 — Semântica dual de métricas (DT-01, AM-01):**  
`totalParticipantes` tem dois significados distintos dependendo do perfil de quem acessa. Sem documentação clara, relatórios e decisões baseadas nesse dado podem ser incorretos.

**Risco 4 — Flag `isMonitor` ausente (BR-04):**  
O objeto de usuário populado pelo `authSSR` não inclui `isMonitor`, criando uma assimetria com as flags `isAdmin` e `isGestor`. Qualquer view que futuramente precisar de lógica específica de monitor usará um guard que nunca é verdadeiro.

### Conformidade com FR-56

| Requisito de FR-56              | Admin                               | Gestor/Monitor                                  |
| ------------------------------- | ----------------------------------- | ----------------------------------------------- |
| Total de eventos                | ✅                                  | ❌ (dado ausente no contexto)                   |
| Total de tipos de certificados  | ✅                                  | ❌ (dado ausente, card vazio para gestor)       |
| Total de participantes          | ✅ (global)                         | ✅ (mas semântica diferente: distinct por cert) |
| Total de usuários               | ✅                                  | N/A                                             |
| Total de certificados           | ✅                                  | ✅ (escopado)                                   |
| Total de certificados pendentes | ✅                                  | ❌ (dado ausente no contexto)                   |
| 5 certificados mais recentes    | ❌ (dado gerado mas view não exibe) | N/A (spec não requer)                           |

**FR-56 conformidade global: ~57% para admin, ~33% para gestor/monitor**

### Recomendações de prioridade

1. **Imediato:** Corrigir BR-01, BR-02, BR-03 — adicionar variables faltantes ao contexto de renderização do branch gestor/monitor, ou adicionar guards de condicional na view
2. **Imediato:** Resolver ID-02 — corrigir status do backlog DASH-ADMIN-003 para refletir o estado real do código
3. **Alta prioridade:** Implementar GI-01 / IP-01 — adicionar tabela de `ultimosCertificados` na view para admin (conforme FR-56)
4. **Média prioridade:** Corrigir BR-04 — adicionar `isMonitor` ao `authSSR` ou documentar ausência
5. **Planejamento:** Priorizar backlog DASH-GEST-001 a DASH-GEST-004 para enriquecimento do dashboard gestor/monitor
