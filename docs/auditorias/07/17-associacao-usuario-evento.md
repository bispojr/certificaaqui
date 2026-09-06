# Auditoria 17 — Associação Usuário-Evento (N:N via `usuario_eventos`)

**Data de auditoria:** 2026-05-10  
**Hora:** 12:09 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Branch:** main

---

## Fontes analisadas

| Fonte                                     | Caminho                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| SRS                                       | `docs/especificacoes.md`                                  |
| Model UsuarioEvento                       | `src/models/usuario_eventos.js`                           |
| Model Usuario                             | `src/models/usuario.js`                                   |
| Model Evento                              | `src/models/evento.js`                                    |
| Migration usuario_eventos                 | `migrations/20260313190000-create-usuario_eventos.js`     |
| Migration indexes                         | `migrations/20260324083059-create-performance-indexes.js` |
| Middleware scopedEvento                   | `src/middlewares/scopedEvento.js`                         |
| Middleware auth                           | `src/middlewares/auth.js`                                 |
| Middleware authSSR                        | `src/middlewares/authSSR.js`                              |
| Middleware rbac                           | `src/middlewares/rbac.js`                                 |
| Middleware tiposCertificadosOwnership     | `src/middlewares/tiposCertificadosOwnership.js`           |
| Controller usuarioController              | `src/controllers/usuarioController.js`                    |
| Controller usuarioSSRController           | `src/controllers/usuarioSSRController.js`                 |
| Controller certificadoController          | `src/controllers/certificadoController.js`                |
| Controller certificadoSSRController       | `src/controllers/certificadoSSRController.js`             |
| Controller eventoController               | `src/controllers/eventoController.js`                     |
| Controller eventoSSRController            | `src/controllers/eventoSSRController.js`                  |
| Controller tiposCertificadosSSRController | `src/controllers/tiposCertificadosSSRController.js`       |
| Controller dashboardController            | `src/controllers/dashboardController.js`                  |
| Controller participanteSSRController      | `src/controllers/participanteSSRController.js`            |
| Service certificadoService                | `src/services/certificadoService.js`                      |
| Service eventoService                     | `src/services/eventoService.js`                           |
| Route certificados                        | `src/routes/certificados.js`                              |
| Route eventos                             | `src/routes/eventos.js`                                   |
| Route usuarios                            | `src/routes/usuarios.js`                                  |
| Route usuarios-crud                       | `src/routes/usuarios-crud.js`                             |
| Route tipos-certificados                  | `src/routes/tipos-certificados.js`                        |
| Route admin SSR                           | `src/routes/admin.js`                                     |
| Models index                              | `src/models/index.js`                                     |
| Validator usuario                         | `src/validators/usuario.js`                               |

---

## 1. Matriz Consolidada de Achados

| ID   | Descrição                                                                                                                                   | Evidências                                                                                                                                                                                                                                                                         | Severidade  | Tipo | Impacto                                                                                                                                                                                                                                            | Requisitos Violados | Recomendação             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------ |
| A-01 | `certificadoService.findAll` ignora filtro de evento injetado pelo `scopedEvento`                                                           | `certificadoController.js:15-22` — chama `certificadoService.findAll({ page, perPage })` sem `evento_id`; `certificadoService.js:9-23` — query sem filtro `evento_id`; route `certificados.js` confirma uso de `scopedEvento`                                                      | **Crítico** | VU   | Qualquer gestor ou monitor autentica via API e obtém TODOS os certificados de TODOS os eventos sem restrição de escopo                                                                                                                             | FR-37, FR-38, NFR-1 | Backlog crítico imediato |
| A-02 | API `DELETE /eventos/:id` e `PUT /eventos/:id` acessíveis a gestores e monitores via `scopedEvento`                                         | `eventos.js:router.delete('/:id', auth, rbac('monitor'), scopedEvento, ...)` — `scopedEvento` permite DELETE se `req.params.id` estiver no escopo do usuário; SSR usa `rbac('admin')` para as mesmas operações (`admin.js:router.post('/eventos/:id/deletar', rbac('admin'),...)`) | **Alto**    | VU   | Gestor pode deletar e atualizar eventos dos quais é membro via API. Inconsistência direta entre SSR (admin-only) e API (gestor/monitor)                                                                                                            | FR-34, FR-37        | Backlog crítico imediato |
| A-03 | Operações por ID no `certificadoSSRController` sem verificação de escopo de evento                                                          | `certificadoSSRController.js`: funções `detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar` — nenhuma verifica se `certificado.evento_id` pertence ao usuário; contraste com `index` que usa `getEventoIds` para filtrar a listagem                                | **Alto**    | IP   | Gestor/monitor autenticado via SSR pode editar, cancelar, deletar e restaurar certificados de eventos fora de seu escopo pelo acesso direto via ID                                                                                                 | FR-37, FR-49        | Backlog prioritário      |
| A-04 | `authSSR` popula `req.usuario` como plain object sem método `getEventos()` — incompatível com `scopedEvento` e `tiposCertificadosOwnership` | `authSSR.js:53-61` — cria `usuarioData = { id, nome, perfil, isAdmin, isGestor }`; `scopedEvento.js:8-10` — verifica `typeof req.usuario.getEventos !== 'function'` e retorna 500; `tiposCertificadosOwnership.js:30-33` — mesma verificação                                       | **Alto**    | VA   | Se `scopedEvento` ou `tiposCertificadosOwnership` forem usados em rotas SSR, retornam HTTP 500 em vez de 403; actualmente as rotas SSR não usam `scopedEvento` diretamente, mas o risco de regressão é alto se novos middlewares forem adicionados | FR-37, FR-38, NFR-6 | Backlog prioritário      |
| A-05 | Ausência de constraint de unicidade a nível de banco em `(usuario_id, evento_id)` na tabela `usuario_eventos`                               | Migration `20260313190000-create-usuario_eventos.js` — sem `unique constraint`; indexes `20260324083059` — sem índice único em `usuario_eventos`; model `usuario_eventos.js` — sem validação de unicidade                                                                          | **Alto**    | GI   | Inserções diretas (fora do ORM) ou bugs de concorrência podem gerar vínculos duplicados sem qualquer proteção de banco de dados                                                                                                                    | FR-32, NFR-4        | Backlog prioritário      |
| A-06 | `tiposCertificadosOwnership` usa branch de `POST (criação)` para `POST /:id/restore`, bloqueando sempre restauração por gestores            | `tiposCertificadosOwnership.js:41-47` — `if (req.method === 'POST')` → verifica `req.body.evento_id`; restore não envia `evento_id` no body; `Number(undefined) = NaN`, `!NaN = true` → sempre retorna 403 para gestores                                                           | **Médio**   | BR   | Gestores não conseguem restaurar seus próprios tipos de certificados via API, mesmo sendo proprietários do evento                                                                                                                                  | FR-35, FR-46        | Backlog                  |
| A-07 | `certificadoSSRController.novo` exibe todos os eventos no formulário, sem filtro por escopo do usuário                                      | `certificadoSSRController.js:novo` — `Evento.findAll({ attributes: ['id', 'nome'] })` sem filtro por `usuario_id`; contraste com `participanteSSRController` que aplica filtro                                                                                                     | **Médio**   | IP   | Gestor visualiza eventos de terceiros no dropdown de criação de certificado; pode criar certificado em evento fora de seu escopo se não houver validação adicional no `criar`                                                                      | FR-37, FR-49        | Backlog                  |
| A-08 | `tiposCertificadosSSRController.index` lista todos os tipos sem filtro de escopo, expondo dados de eventos de terceiros                     | `tiposCertificadosSSRController.js:index` — `whereAtivos = {}` sem filtro por evento; `podeEditar` controla visibilidade do botão mas não a exposição dos dados                                                                                                                    | **Médio**   | IP   | Gestor/monitor visualiza tipos de certificados de eventos fora de seu escopo na listagem SSR                                                                                                                                                       | FR-37, FR-49        | Backlog                  |
| A-09 | Soft delete de usuário não propaga para `usuario_eventos` — vínculos ficam ativos para usuários excluídos logicamente                       | `usuarioSSRController.js:deletar` — chama apenas `usuario.destroy()` sem tocar `usuario_eventos`; `eventoService.delete` propaga para `usuario_eventos` (inconsistente); `UsuarioEvento` é `paranoid: true` mas não há mecanismo de cascata via ORM para usuário                   | **Médio**   | IP   | Vínculos `usuario_eventos` ficam com `deleted_at = NULL` após soft delete do usuário; integridade semântica comprometida; usuário restaurado recupera vínculos corretamente, mas vínculos de usuário deletado existem na tabela sem corresponding  | FR-32, NFR-4        | Backlog                  |
| A-10 | `eventoService` tem dois métodos distintos (`destroy` e `delete`) com comportamento diferente para `usuario_eventos`                        | `eventoService.js:destroy` — só faz `evento.destroy()`; `eventoService.js:delete` — `evento.destroy()` + `UsuarioEvento.destroy()`; `delete` chama internamente a mesma lógica de `destroy` mas com step adicional — código duplicado                                              | **Médio**   | DT   | Se `eventoService.destroy` for invocado diretamente (não via rotas), os vínculos `usuario_eventos` não são soft-deletados; risco de órfãos em manutenções futuras                                                                                  | NFR-6               | Backlog                  |
| A-11 | URL pattern não-RESTful em API de gerenciamento de usuários: `/:papel/:id/usuarios`                                                         | `usuarios-crud.js:router.post('/:papel/:id/usuarios', ...)` — admin deve incluir próprio `papel` e `id` na URL; verificação: `req.usuario.id !== Number(id)` — acoplamento entre identity do requestor e parâmetro de URL                                                          | **Baixo**   | DT   | Padrão frágil; se admin alterar ID (improvável mas teórico) ou houver URL crafting, lógica de autorização baseada em URL pode ser eludida; não-idiomático, dificulta manutenção                                                                    | NFR-6               | Backlog                  |
| A-12 | `usuarioSchema` Zod valida campos obrigatórios (`nome`, `email`, `senha`, `perfil`) para `updateEventos`, que só deveria validar `eventos`  | `validators/usuario.js` — schema base com todos os campos obrigatórios; `usuarios-crud.js` usa `validate(usuarioSchema.pick({ eventos: true }))` para `updateEventos` — `pick` resolve, mas `create` usa schema completo sem validação de duplicidade de eventos                   | **Baixo**   | DT   | Sem impacto de segurança direto; inconsistência documental menor                                                                                                                                                                                   | —                   | Backlog                  |

---

## 2. Problemas Sistêmicos Transversais

### 2.1 Dissociação entre middleware `scopedEvento` e serviços

O middleware `scopedEvento` injeta `req.query.evento_id` para filtrar listagens, mas os services de domínio (`certificadoService.findAll`, `participanteService`) **não consomem esse parâmetro**. O middleware cumpre sua função de injetar o filtro, mas a camada de serviço ignora o resultado. Isso torna o enforcement de escopo **virtualmente inoperante para listagens de certificados via API REST**.

**Padrão de falha:** `scopedEvento` → query modificada → controller não repassa → service não aplica filtro → dados de todos os eventos retornados.

### 2.2 Dualidade de `req.usuario` entre API e SSR

O `auth` middleware (API) retorna instância Sequelize completa com `getEventos()`. O `authSSR` middleware (SSR) retorna plain object sem métodos de associação. Isso cria **dois contratos de `req.usuario`** no sistema:

- API: `req.usuario.getEventos()` disponível → `scopedEvento` e `tiposCertificadosOwnership` funcionam
- SSR: `req.usuario.getEventos` é `undefined` → esses middlewares retornam 500

Os controllers SSR mitigam isso com helpers locais (`getEventosIds`, `getEventoIds`, query direta via `UsuarioEvento.findAll`), criando triplicação de lógica de resolução de escopo.

### 2.3 Inconsistência entre SSR e API para controle de eventos

| Operação                | SSR (`/admin`)                           | API REST                                                                                           |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DELETE /eventos/:id`   | `rbac('admin')` — bloqueado a não-admins | `rbac('monitor')` + `scopedEvento` — acessível a gestores!                                         |
| `PUT /eventos/:id`      | `rbac('admin')` — bloqueado a não-admins | `rbac('monitor')` + `scopedEvento` — acessível a gestores!                                         |
| `POST /eventos` (criar) | `rbac('admin')` — bloqueado a não-admins | `rbac('monitor')` + `scopedEvento` — bloqueado indiretamente (sem `evento_id` no body), mas frágil |

Essa inconsistência indica que a camada de autorização da API REST não foi alinhada com as regras de negócio definidas no SRS para operações de gestão de eventos.

### 2.4 Fragilidade do modelo N:N sem constraint de banco

A tabela `usuario_eventos` não possui unique constraint em nível de banco para `(usuario_id, evento_id)`. O controle de duplicidade existe apenas em parte da camada de aplicação (`usuarioController.create` e `updateEventos` verificam duplicatas; `usuarioSSRController` não verifica). Concorrência ou acesso direto ao banco pode gerar vínculos duplicados sem detecção.

### 2.5 Cascata de soft delete assimétrica entre usuário e evento

- **Soft delete de evento** → propaga para `usuario_eventos` (via `eventoService.delete`)
- **Soft delete de usuário** → NÃO propaga para `usuario_eventos`
- **Restore de evento** → restaura `usuario_eventos` (via `eventoService.restore`)
- **Restore de usuário** → restaura usuário, vínculos `usuario_eventos` nunca foram deletados (portanto recuperados de forma implícita)

Essa assimetria é tecnicamente funcional no cenário atual, mas semanticamente inconsistente e não está documentada no SRS.

---

## 3. Correções Críticas Imediatas

### C-01 — Bypass de escopo em `GET /certificados` (API)

**Achado:** A-01  
**Evidência:** `src/controllers/certificadoController.js:findAll` + `src/services/certificadoService.js:findAll`

O `certificadoController.findAll` chama `certificadoService.findAll({ page, perPage })` sem propagar `req.query.evento_id`. O `scopedEvento` injeta o filtro em `req.query`, mas ele nunca chega ao service. Qualquer gestor ou monitor com JWT válido pode obter todos os certificados de todos os eventos com uma única requisição `GET /certificados`.

**Criticidade:** Violação direta de FR-37 (isolamento de escopo por evento) e NFR-1 (controle de acesso).

---

### C-02 — Gestores podem deletar e atualizar eventos via API

**Achado:** A-02  
**Evidência:** `src/routes/eventos.js:router.delete('/:id', auth, rbac('monitor'), scopedEvento, ...)`

A rota `DELETE /eventos/:id` usa `rbac('monitor')` como requisito mínimo. O `scopedEvento` valida apenas se o `req.params.id` está na lista de eventos do usuário — o que é verdadeiro para qualquer gestor associado ao evento. Assim, gestores podem deletar seus próprios eventos via API, violando FR-34 (acesso irrestrito somente para admin).

O mesmo se aplica a `PUT /eventos/:id`.

---

### C-03 — Bypass de escopo em operações SSR por ID de certificado

**Achado:** A-03  
**Evidência:** `src/controllers/certificadoSSRController.js`: `detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar`

Essas funções recebem `req.params.id`, buscam o certificado por PK e operam sem verificar se `certificado.evento_id` pertence aos eventos do usuário autenticado. Contrariamente, a função `index` aplica filtro via `getEventoIds`. Um gestor autenticado via SSR pode acessar diretamente `GET /admin/certificados/:id` para qualquer certificado.

---

## 4. Backlog Arquitetural Priorizado

### Curto prazo

| #    | Item                                                                                                                                                                | Achados Relacionados |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| B-01 | Fazer `certificadoController.findAll` propagar `req.query.evento_id` para `certificadoService.findAll`                                                              | A-01                 |
| B-02 | Restringir `DELETE /eventos/:id` e `PUT /eventos/:id` da API a `rbac('admin')` (alinhando com SSR)                                                                  | A-02                 |
| B-03 | Adicionar verificação de escopo de evento nas operações por ID do `certificadoSSRController` (`detalhe`, `editar`, `atualizar`, `cancelar`, `deletar`, `restaurar`) | A-03                 |
| B-04 | Corrigir `tiposCertificadosOwnership` para tratar `POST /:id/restore` como operação de mutação por ID (não como criação)                                            | A-06                 |
| B-05 | Filtrar eventos por escopo do usuário no `certificadoSSRController.novo`                                                                                            | A-07                 |

### Médio prazo

| #    | Item                                                                                                                                                        | Achados Relacionados |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| B-06 | Adicionar unique constraint de banco em `(usuario_id, evento_id)` na tabela `usuario_eventos` (nova migration)                                              | A-05                 |
| B-07 | Unificar contrato de `req.usuario` entre `auth` e `authSSR` (retornar instância Sequelize com `getEventos()`, ou centralizar helper em módulo independente) | A-04                 |
| B-08 | Aplicar soft delete de `usuario_eventos` ao fazer soft delete de usuário                                                                                    | A-09                 |
| B-09 | Filtrar lista de tipos de certificados no SSR por eventos do usuário (`tiposCertificadosSSRController.index`)                                               | A-08                 |

### Longo prazo

| #    | Item                                                                                                                                                              | Achados Relacionados |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| B-10 | Refatorar `eventoService`: remover `destroy` ou torná-lo equivalente a `delete` para garantir propagação de soft delete para `usuario_eventos`                    | A-10                 |
| B-11 | Centralizar lógica de resolução de escopo de evento em um serviço único, evitando triplicação de helpers (`getEventosIds`, `getEventoIds`, `query UsuarioEvento`) | A-04, A-08, A-09     |
| B-12 | Reestruturar URL de gerenciamento de usuários para padrão RESTful convencional sem `/:papel/:id` na URL                                                           | A-11                 |

---

## 5. Atualizações Recomendadas no SRS

### SRS-01 — Comportamento de cascade de soft delete para usuário

**Seção:** FR-33 / FR-32  
**Problema:** O SRS define soft delete para usuários (FR-33) e vínculo N:N via `usuario_eventos` (FR-32), mas não especifica o que deve acontecer com os vínculos quando o usuário é excluído logicamente.

**Recomendação:** Incluir sub-requisito em FR-33 ou FR-32: "Ao excluir logicamente um usuário, seus vínculos em `usuario_eventos` devem ser correspondentemente excluídos de forma lógica. Ao restaurar um usuário, seus vínculos devem ser restaurados."

---

### SRS-02 — Escopo de visualização de tipos de certificados para gestor/monitor

**Seção:** FR-46 / FR-37  
**Problema:** FR-46 indica que "monitores podem apenas visualizá-los", sem especificar se a visualização é restrita ao escopo do evento do usuário ou é global. FR-37 foca em filtragem automática para listagens, mas não cita explicitamente `tipos_certificados`.

**Recomendação:** Adicionar clareza em FR-46: "Gestores e monitores podem visualizar somente os tipos de certificados dos eventos aos quais estão vinculados."

---

### SRS-03 — Restrição de CRUD de eventos via API

**Seção:** FR-34 / FR-37  
**Problema:** FR-34 estabelece que admin tem acesso irrestrito. FR-37 descreve `scopedEvento` para gestores/monitores. Não há especificação explícita de que operações de criação, atualização e exclusão de eventos são restritas a admin via API REST.

**Recomendação:** Adicionar nota em FR-34 ou FR-5: "Criação, atualização e exclusão de eventos são operações exclusivas do perfil admin, tanto via SSR quanto via API REST."

---

## 6. Itens para Validação Humana

### VH-01 — Comportamento esperado dos vínculos `usuario_eventos` ao excluir um usuário

**Contexto:** O SRS não define se um soft delete de usuário deve propagar para `usuario_eventos`. A implementação atual NÃO propaga (vínculos ficam ativos para usuário excluído). A exclusão de eventos SI propaga para `usuario_eventos`.

**Decisão necessária:** Ao excluir logicamente um usuário, seus vínculos devem ser soft-deletados? E ao restaurar o usuário, esses vínculos devem ser restaurados automaticamente?

**Impacto:** Afeta implementação de B-08.

---

### VH-02 — Gestores devem visualizar todos os tipos de certificados ou somente os de seus eventos?

**Contexto:** A listagem SSR de tipos de certificados (`/admin/tipos-certificados`) exibe todos os tipos sem filtro de escopo. A flag `podeEditar` controla a edição, mas não a visualização. FR-46 não é conclusivo sobre o escopo de visualização.

**Decisão necessária:** A visualização de tipos pelo gestor deve ser restrita ao escopo de seus eventos, ou pode ser global (read-only para tipos de terceiros)?

**Impacto:** Afeta implementação de B-09.

---

### VH-03 — Comportamento de admin ao criar/associar eventos

**Contexto:** FR-32 diz que gestores e monitores devem estar vinculados a eventos via `usuario_eventos`. Admins não possuem essa restrição. Não está definido se um admin pode ser vinculado a eventos para fins de rastreabilidade.

**Decisão necessária:** Admins podem ter vínculos em `usuario_eventos`? Se sim, isso afeta alguma query de auditoria ou relatório?

---

## 7. Iniciativas de Spec (Spec Kit)

### SPEC-01 — Centralização de lógica de escopo de evento

**Motivação:** Achados A-01, A-03, A-04, A-08 revelam que a resolução do escopo de eventos para um usuário está triplicada no código: via `req.usuario.getEventos()` (API), via query direta `UsuarioEvento.findAll` (SSR controllers), via join `include: 'usuarios'` (eventoService). Não há service centralizado de escopo.

**Proposta de spec:** Criar serviço `escopoService.getEventoIds(usuarioId, perfil)` que encapsule a lógica de resolução e retorne `null` para admin ou `[...ids]` para outros perfis.

---

### SPEC-02 — Formalização de cascade `usuario_eventos` em delete/restore

**Motivação:** Achados A-09 e VH-01 identificam assimetria de comportamento entre soft delete de usuário vs. evento em relação à tabela `usuario_eventos`.

**Proposta de spec:** Definir formalmente o comportamento de cascata para operações de delete e restore tanto para usuários quanto para eventos, especificando o comportamento esperado da tabela de junção em cada cenário.

---

## 8. Análise de Problemas Sistêmicos

### 8.1 Falhas de isolamento por evento

O sistema possui dois mecanismos de enforcement de escopo:

1. **Via middleware `scopedEvento`** (API): Injeta filtros em `req.query` pré-controlador
2. **Via helpers locais no controller** (SSR): Cada controller SSR implementa sua própria lógica de filtragem

O mecanismo 1 falha no caso de **certificados** porque o controller não propaga o filtro para o service. O mecanismo 2 é inconsistente: `certificadoSSRController` aplica scoping apenas na listagem (`index`), não nas operações por ID.

### 8.2 Inconsistências de escopo entre camadas

| Recurso                           | API (JWT)                                                       | SSR (Cookie)                             |
| --------------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Listagem de certificados          | `scopedEvento` injeta filtro, mas service ignora (FALHA)        | Filtrado via `getEventoIds` (funcional)  |
| Acesso por ID a certificado       | `scopedEvento` verifica `req.params.id` vs. eventos (funcional) | SEM verificação de escopo (FALHA)        |
| Deleção/atualização de evento     | `rbac('monitor')` — acessível a gestor (FALHA)                  | `rbac('admin')` (correto)                |
| Listagem de tipos de certificados | `rbac('monitor')`, sem scoping de evento                        | Mostra todos, sem filtro (FALHA parcial) |

### 8.3 Fragilidade estrutural do N:N sem constraint de banco

A integridade referencial do relacionamento N:N depende exclusivamente da camada ORM. A ausência de unique constraint em `(usuario_id, evento_id)` significa que:

- Qualquer operação direta no banco (backup restore, scripts de manutenção, bugs de concorrência) pode criar vínculos duplicados sem erro
- A aplicação não tem mecanismo de detecção de vínculos duplicados nas consultas de escopo

### 8.4 Dependência excessiva de middleware para enforcement de autorização

O middleware `scopedEvento` foi desenhado como ponto central de enforcement, mas sua efetividade depende de que os controllers downstream **consumam** os parâmetros injetados. Sem contrato explícito entre middleware e service, a proteção é ilusória para listagens: o middleware executa sem erro, o controller processa normalmente, mas o filtro não é aplicado.

### 8.5 Risco sistêmico de escalonamento de privilégios

O achado A-02 demonstra que via API, um gestor autenticado pode deletar eventos (operação admin-only no SRS). Isso constitui um **privilege escalation** funcional: o sistema não executa a operação como admin, mas permite a um gestor executar uma operação reservada a admin sem que o sistema a bloqueie na camada de autorização da API REST.

### 8.6 Inconsistência entre associação e autorização efetiva

O campo `perfil` define o conjunto de operações permitidas pelo RBAC. A tabela `usuario_eventos` define o escopo de dados. Esses dois mecanismos deveriam ser ortogonais e complementares. O problema identificado é que:

1. O RBAC de rotas de API para eventos (`rbac('monitor')`) não reflete as regras de negócio do SRS
2. O `scopedEvento` cobre o QUAIS dados, mas não o QUAIS operações são permitidas por perfil sobre esses dados
3. A verificação de QUAL operação é permitida por perfil está implícita nos dois sistemas sem unificação

---

_Auditoria gerada em: 2026-05-10 12:09 (BRT)_
