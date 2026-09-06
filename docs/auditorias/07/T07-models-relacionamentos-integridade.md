# Triagem Arquitetural Consolidada — Persistência e Integridade de Dados

**Triagem:** T07  
**Data:** 2026-05-10 15:08 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Domínios consolidados:** Models (07/20) · Relacionamentos (07/21) · Soft Delete (07/22) · Constraints (07/23) · Migrações (07/24) · Integridade Relacional (07/25)  
**Versão SRS:** 2.0 (2026-04-30)

---

## Resumo Executivo

A triagem consolidada identifica **35 achados ativos** distribuídos em 6 domínios de persistência. Quatro bugs reais de severidade **Crítica** e três de severity **Alta** colocam o sistema em risco imediato de integridade de dados:

1. **Mistura de dados entre eventos** — certificado pode ser criado com tipo de outro evento (IR-01 / Crítico)
2. **Colisão de código incremental após soft delete** — emissão de certificados falha com `UniqueConstraintError` após qualquer delete no mesmo tipo/evento (IR-12 / Crítico)
3. **Constraint de unicidade full vs. partial (tipos_certificados)** — drift entre migration real e model causa bloqueio indevido de restauração (M-01 / Crítico)
4. **Race condition na geração de código** — duas emissões simultâneas do mesmo tipo/evento resultam em código duplicado e erro 500 (C-01 / Crítico)
5. **Multi-tenancy quebrado em tipos de certificados** — API REST e SSR expõem tipos de todos os eventos a gestores/monitores (IR-04, IR-05 / Alto)
6. **Controle de acesso insuficiente em operações de soft delete** — monitores podem deletar e restaurar eventos e participantes via API (VU-01, VU-02 / Alto)

O sistema possui **zero usos de `sequelize.transaction()`**, expondo todas as operações multi-step a race conditions e estados intermediários inválidos.

---

## 1. Matriz Consolidada de Achados

| ID         | Domínio                         | Descrição                                                                                                                                                                                              | Evidências                                                                                                                | Sev     | Tipo | Impacto                                                                                                                            | Req Violados                    |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **T07-01** | Integridade Relacional          | `certificadoService.create()` não valida `tipo.evento_id === data.evento_id` — certificado pode ser criado cruzando tipo de um evento com evento de outro                                              | `certificadoService.js:36-40` — valida tipo e evento separadamente, nunca compara os dois                                 | Crítico | BR   | Mistura de dados de eventos distintos em um único certificado; PDF contém estrutura de evento errado                               | FR-21, FR-45, FR-37             |
| **T07-02** | Constraints / Integridade       | `Certificado.count()` com `paranoid: true` (padrão) exclui soft-deleted do cálculo incremental → próximo código colide com certificado ativo                                                           | `certificadoService.js:63-68` — `count({ where: ... })` sem `paranoid: false`                                             | Crítico | BR   | `UniqueConstraintError` após qualquer soft delete no mesmo tipo/evento; serviço de emissão inoperante                              | FR-52, NFR-4                    |
| **T07-03** | Migrações / Constraints         | Constraint composta `(codigo, evento_id)` em `tipos_certificados` na migration é FULL (inclui soft-deleted); model define partial index `WHERE deleted_at IS NULL` — drift produção vs. testes         | `migrations/20260418232720` — `addConstraint` sem WHERE; `src/models/tipos_certificados.js` — `indexes[].where`           | Crítico | BR   | Soft-delete de tipo bloqueia recriação com mesmos `(codigo, evento_id)`; contradiz FR-11 explicitamente                            | FR-11, NFR-4                    |
| **T07-04** | Constraints                     | Race condition: duas emissões simultâneas do mesmo tipo/evento obtêm o mesmo `count=N` e geram código idêntico `N+1`                                                                                   | `certificadoService.js:63-77` — `count` + `create` sem transação ou lock                                                  | Crítico | BR   | `UniqueConstraintError` em condições de concorrência; falha silenciosa com HTTP 500                                                | FR-52                           |
| **T07-05** | Integridade / Multi-tenancy     | `TiposCertificadosController.findAll()` ignora `req.filtro` injetado pelo `scopedEvento` — retorna tipos de todos os eventos                                                                           | `tiposCertificadosController.js:11-16` — `findAll({ page, perPage })` sem `eventoId`                                      | Alto    | BR   | Gestor/monitor via REST API enumera templates e campos dinâmicos de eventos alheios                                                | FR-37, FR-46, NFR-1             |
| **T07-06** | Integridade / Multi-tenancy     | `tiposCertificadosSSRController.index()` usa `whereAtivos = {}` sem filtro por `eventosIds` — listagem sem isolamento de evento                                                                        | `tiposCertificadosSSRController.js:49-52` — `TiposCertificados.findAll({ where: whereAtivos })` sem `evento_id`           | Alto    | BR   | Interface SSR expõe tipos de certificados de outros eventos a gestor/monitor                                                       | FR-37, FR-46                    |
| **T07-07** | Soft Delete / RBAC              | `DELETE /participantes/:id` e `POST /participantes/:id/restore` com `rbac('monitor')` — monitores não devem ter esse acesso                                                                            | `src/routes/participantes.js:140,150` — `rbac('monitor')`                                                                 | Alto    | VU   | Violação de menor privilégio (OWASP A01); monitor pode remover participantes de qualquer evento sem filtro                         | FR-36, NFR-1                    |
| **T07-08** | Soft Delete / RBAC              | `DELETE /eventos/:id` e `POST /eventos/:id/restore` com `rbac('monitor')` na API REST; SSR restringe corretamente a `admin`                                                                            | `src/routes/eventos.js` — `rbac('monitor')` vs `admin.js:97,100` — `rbac('admin')`                                        | Alto    | VU   | Monitor pode excluir e restaurar eventos via API REST; operação crítica superexpostea                                              | FR-36, NFR-1                    |
| **T07-09** | Soft Delete / RBAC              | API REST restaura certificados com `rbac('monitor')`; SSR restringe a `rbac('admin')` (FR-22: "apenas admin via SSR")                                                                                  | `src/routes/certificados.js:218` — `rbac('monitor')` vs `admin.js:175` — `rbac('admin')`                                  | Alto    | IP   | Monitor pode restaurar certificados cancelados via API contornando restrição da SSR                                                | FR-22, NFR-1                    |
| **T07-10** | Soft Delete / RBAC              | Rotas SSR de delete e restore de participantes sem nenhum middleware `rbac()`                                                                                                                          | `src/routes/admin.js:88-89` — ausência de `rbac()` em `/participantes/:id/deletar` e `/participantes/:id/restaurar`       | Alto    | IP   | Qualquer usuário autenticado (incluindo monitor) pode deletar/restaurar participantes via SSR                                      | FR-36, NFR-1                    |
| **T07-11** | Relacionamentos                 | Alias `TiposCertificado` (singular) usado em `certificadoSSRController.detalhe` vs alias `TiposCertificados` (plural) declarado no model                                                               | `certificadoSSRController.js:110` — `certificado.TiposCertificado?.texto_base`; modelo usa `as: 'TiposCertificados'`      | Alto    | BR   | Texto interpolado sempre vazio na tela de detalhe SSR; `pdfService` tem workaround que mascara o bug no PDF                        | FR-39                           |
| **T07-12** | Relacionamentos / Multi-tenancy | Middleware `tiposCertificadosOwnership` usa `usuario.getEventos()` sem fallback para plain object; se auth retornar objeto simples, retorna HTTP 500                                                   | `tiposCertificadosOwnership.js:31-33`                                                                                     | Alto    | IP   | Falha silenciosa de middleware em qualquer contexto que retorne plain object; impacto em FR-37 e FR-38                             | FR-37, FR-38                    |
| **T07-13** | Integridade Relacional          | `certificadoService.create()` não valida existência de `participante_id`; ID inexistente/soft-deleted gera FK violation → HTTP 500 com stack trace                                                     | `certificadoService.js:32-78` — ausência de `Participante.findByPk(data.participante_id)`                                 | Alto    | BR   | Exposição de erro técnico ao cliente; comportamento inconsistente com validação dos outros entes                                   | FR-21, NFR-6                    |
| **T07-14** | Constraints                     | `usuarioSchema` valida `senha: z.string().min(6)`; `senhaForteSchema` existe mas não é aplicado em criação/atualização de usuário                                                                      | `src/validators/usuario.js` — `min(6)` vs `src/validators/senhaForte.js`; FR-57 exige política forte                      | Alto    | IP   | Senhas como `"abc123"` passam; viola NFR-2 e FR-57                                                                                 | FR-57, NFR-2                    |
| **T07-15** | Migrações                       | `usuario_eventos` sem unique constraint `(usuario_id, evento_id)` — duplicatas silenciosas possíveis                                                                                                   | `migrations/20260313190000` — tabela criada sem qualquer unique; model sem `indexes` composto                             | Alto    | GI   | Mesmo usuário associado duas vezes ao mesmo evento; quebra RBAC que assume unicidade por combinação                                | FR-32                           |
| **T07-16** | Migrações / Constraints         | FKs de `certificados` para parents soft-deletáveis usam `ON DELETE CASCADE` — hard delete em parent apagaria certificados permanentemente                                                              | `migrations/20260311180841` — `participante_id`, `evento_id`, `tipo_certificado_id` com `onDelete: 'CASCADE'`             | Alto    | DT   | Down migrations e scripts DBA podem eliminar permanentemente certificados                                                          | NFR-4                           |
| **T07-17** | Integridade Relacional          | `certificadoService.update()` não revalida `valores_dinamicos` contra `dados_dinamicos` do tipo → update pode persistir campos incompletos/inválidos                                                   | `certificadoService.js:84-88` — `certificado.update(data)` sem validação dinâmica                                         | Alto    | GI   | Certificados com campos dinâmicos incoerentes com schema do tipo; PDF com placeholders não substituídos                            | FR-54, FR-20                    |
| **T07-18** | Integridade Relacional          | Nenhum service usa `sequelize.transaction()` — operações multi-step são não-atômicas                                                                                                                   | `grep sequelize.transaction src/ → zero ocorrências`; `certificadoService.js`, `eventoService.js`                         | Alto    | DT   | Estado intermediário inválido em falhas: evento deletado com vínculos de usuários ativos; código de certificado duplicado          | FR-52, NFR-4                    |
| **T07-19** | Constraints                     | `certificadoSchema.status` é obrigatório no Zod sem default; model Sequelize tem `defaultValue: 'emitido'`                                                                                             | `src/validators/certificado.js` — `z.enum(...)` sem `.default()`; `src/models/certificado.js` — `defaultValue: 'emitido'` | Médio   | BR   | Clientes devem sempre enviar `status` mesmo que SRS preveja default automático; comportamento divergente API vs. criação interna   | FR-19                           |
| **T07-20** | Constraints / Integridade       | Unique constraints de `email` em `participantes` e `usuarios` são globais (sem `WHERE deleted_at IS NULL`) — email de registro deletado bloqueia criação de novo                                       | `migrations/20260311180742` e `20260312180000` — `email: { unique: true }` simples                                        | Médio   | IP   | Recriação de usuário/participante após soft-delete com mesmo email impossível; contradiz semântica de NFR-4                        | FR-2, FR-4, FR-27, FR-33, NFR-4 |
| **T07-21** | Relacionamentos                 | Ghost associations: `eventoService.restore()` restaura todos os `UsuarioEvento` soft-deleted do evento, incluindo os deletados antes do evento por razões independentes                                | `eventoService.js:56-61` — `UsuarioEvento.restore({ where: { evento_id } })` sem filtro temporal                          | Médio   | GI   | Associações usuario-evento removidas intencionalmente são reestabelecidas ao restaurar o evento                                    | FR-9, FR-32, NFR-4              |
| **T07-22** | Integridade Relacional          | `certificadoSSRController.novo()` expõe todos os participantes e todos os tipos sem filtro por evento                                                                                                  | `certificadoSSRController.js:novo()` — `findAll` sem event scope                                                          | Médio   | BR   | Monitor seleciona participante/tipo de outro evento via UI; combinação inválida ativa T07-01 em seguida                            | FR-37, FR-36                    |
| **T07-23** | Integridade Relacional          | Soft delete de evento não cascateia para `TiposCertificados` nem `Certificado`                                                                                                                         | `eventoService.js:43-50` — cascata apenas para `UsuarioEvento`                                                            | Médio   | GI   | Tipos e certificados de evento deletado aparecem ativos; PDF gerado usa defaults silenciosos                                       | FR-9, NFR-4                     |
| **T07-24** | Integridade Relacional          | Soft delete de participante não cascateia para certificados vinculados; `include: [Participante]` retorna null (paranoid)                                                                              | `participanteService.js:33` — `participante.destroy()` sem cascata                                                        | Médio   | GI   | Certificados "vivos" sem participante no contexto ORM; PDF pode ser gerado com nome vazio                                          | FR-4, NFR-4                     |
| **T07-25** | Integridade Relacional          | Ausência de máquina de estados: `status` do certificado aceita qualquer transição (cancelado → emitido) sem validação                                                                                  | `certificadoService.js:84-88` — `update(data)` sem regra de transição                                                     | Médio   | GI   | Certificados cancelados podem ser reemitidos sem auditoria; `pendente` nunca é definido automaticamente                            | FR-19                           |
| **T07-26** | Constraints                     | `campo_destaque` validado por hook `beforeValidate` no Sequelize; Zod valida apenas `min(1)` — erro de domínio retorna como 500 (Sequelize) em vez de 422                                              | `src/validators/tipos_certificados.js` — `min(1)`; `src/models/tipos_certificados.js` — hook `beforeValidate`             | Médio   | VA   | Violação arquitetural: validação de entrada retorna erro de persistência; UX degradada                                             | FR-14                           |
| **T07-27** | Migrações                       | Migration `20260418232720` remove distinct global em `tipos_certificados.codigo` por nome fixo `tipos_certificados_codigo_key`; se o nome diferir no banco, o índice global persiste junto ao composto | `migrations/20260418232720-add-evento-id-to-tipos-certificados.js` — remoção condicional por nome                         | Médio   | ID   | Em ambientes onde o índice global persiste, dois tipos com mesmo `codigo` em eventos distintos são bloqueados, contradizendo FR-11 | FR-11                           |
| **T07-28** | Models                          | `TiposCertificados.descricao` com `allowNull: false` sem `validate: { notEmpty: true }` — string vazia `""` é aceita                                                                                   | `src/models/tipos_certificados.js` — sem `notEmpty` em `descricao`                                                        | Alto    | GI   | String vazia persiste se Zod for bypassado; viola FR-12 (mínimo 1 char)                                                            | FR-12                           |
| **T07-29** | Models                          | `UsuarioEvento` com `paranoid: true` — soft delete em tabela de junção cria risco de inconsistência em revinculações                                                                                   | `src/models/usuario_eventos.js:25` — `paranoid: true`                                                                     | Médio   | DT   | Revinculação após deleção: novo registro criado sem limpar o soft-deleted anterior; duplicação silenciosa                          | FR-32                           |
| **T07-30** | Models                          | Gap sistêmico: validações de tamanho mínimo apenas no Zod; Sequelize sem `validate: { len }` em campos críticos                                                                                        | `Evento.nome`, `Participante.nomeCompleto`, `Certificado.nome`, `Usuario.nome` — sem `len` no model                       | Médio   | GI   | Valores inválidos persistem se middleware Zod for bypassado (seeders, testes de service, admin scripts)                            | FR-3, FR-6, FR-18               |
| **T07-31** | Relacionamentos                 | `eventoService.restore()` restaura `UsuarioEvento` de usuário soft-deleted — ghost access reestabelecido                                                                                               | `eventoService.js:56-61` — `UsuarioEvento.restore` sem filtro por status do usuário vinculado                             | Médio   | IP   | Usuário deletado pode ter acesso restaurado aos dados do evento via `scopedEvento`                                                 | FR-32, FR-37                    |
| **T07-32** | Migrações                       | `ON DELETE CASCADE` em `certificados` conflita com soft delete universal; hard delete de parent via scripts DBA elimina certificados                                                                   | `migrations/20260311180841`                                                                                               | Alto    | DT   | Duplicado de T07-16 — severidade reforçada por cross-domain                                                                        | NFR-4                           |
| **T07-33** | Migrações                       | Down migration de `certificados` não remove ENUM `enum_certificados_status`; orphan type permanece no banco após rollback                                                                              | `migrations/20260311180841` — sem `DROP TYPE` no down                                                                     | Médio   | IP   | Rollback parcial; inconsistência entre banco de diferentes ambientes                                                               | NFR-5                           |
| **T07-34** | Migrações                       | `usuarios` usa SQL bruto PostgreSQL-específico no down migration em vez de `queryInterface.dropTable`                                                                                                  | `migrations/20260312180000`                                                                                               | Médio   | DT   | Não-portável; `DROP TABLE IF EXISTS` sem `CASCADE` pode ignorar erros silenciosos                                                  | NFR-5                           |
| **T07-35** | Constraints                     | Coordenadas de layout (`texto_x/y`, `validacao_x/y`) ausentes do `eventoSchema` Zod — strings ou floats aceitos sem validação                                                                          | `src/validators/evento.js` — campos não incluídos; FR-48 exige inteiros                                                   | Baixo   | GI   | Coordenadas inválidas persistidas podem quebrar layout do PDF sem erro descritivo                                                  | FR-48                           |

---

## 2. Correções Críticas Imediatas

> Somente problemas com potencial de perda de integridade de dados, quebra de relacionamento, inconsistência de FK, soft delete incorreto, violação de multi-tenancy ou corrupção de dados.

### CC-01 — Mistura de dados entre eventos (T07-01) 🔴 Crítico

**Problema:** `certificadoService.create()` valida a existência de `tipo_certificado_id` e `evento_id` separadamente, mas nunca verifica que `tipo.evento_id === data.evento_id`. Qualquer usuário com acesso à API pode criar um certificado cruzando dados de eventos distintos.

**Correção necessária:** Após buscar o tipo de certificado, adicionar validação:

```
se tipo.evento_id !== data.evento_id → HTTP 422 "Tipo de certificado não pertence ao evento informado"
```

**Refs:** IR-01 (Auditoria 25)

---

### CC-02 — Colisão de código de certificado pós-soft-delete (T07-02 + T07-04) 🔴 Crítico

**Problema:** O `count()` com `paranoid: true` exclui registros soft-deleted. Após um soft delete, o contador regride e gera número incremental já existente em registro ativo → `UniqueConstraintError`. Em concorrência, dois `count()` simultâneos retornam o mesmo valor → mesmo código gerado duas vezes.

**Correção necessária:**

1. Usar `Certificado.count({ where: { ... }, paranoid: false })` para incluir soft-deleted no cálculo incremental
2. Envolver `count → create` em transação serializada (ou usar `SELECT ... FOR UPDATE` no mesmo bloco transacional)

**Refs:** IR-12 (Auditoria 25), BR-01 (Auditoria 22), C-01/C-02 (Auditoria 23)

---

### CC-03 — Drift de constraint em tipos_certificados: full vs. partial (T07-03) 🔴 Crítico

**Problema:** A migration `20260418232720` cria uma constraint UNIQUE FULL em `(codigo, evento_id)` sem cláusula `WHERE`. O model define um partial index com `where: { deleted_at: null }`. Em produção o banco usa a constraint FULL; em testes (`sync()`) usa o partial index do model. Comportamentos divergem: produção bloqueia recriação de tipo após soft delete, contrariando FR-11 explicitamente.

**Correção necessária:** Nova migration que:

1. Remove a constraint `tipos_certificados_codigo_evento_id_key`
2. Cria: `CREATE UNIQUE INDEX tipos_certificados_codigo_evento_id_key ON tipos_certificados (codigo, evento_id) WHERE deleted_at IS NULL`
3. Remove o bloco `indexes` do model (NFR-5: schema gerenciado exclusivamente por migrations)

**Refs:** M-01 (Auditoria 24), C-05/C-06 (Auditoria 23), IR-10 (Auditoria 25)

---

### CC-04 — Multi-tenancy quebrado: tipos de certificados sem isolamento por evento (T07-05 + T07-06 + T07-22) 🔴 Alto

**Problema:** Três pontos independentes de quebra de isolamento:

1. `TiposCertificadosController.findAll()` ignora `req.filtro.eventoId` — retorna todos os tipos via API REST
2. `tiposCertificadosSSRController.index()` não filtra por `eventosIds` — listagem sem escopo via SSR
3. `certificadoSSRController.novo()` expõe todos os participantes e todos os tipos sem filtrar por evento

Em conjunto, gestores/monitores veem estruturas de eventos alheios e podem selecionar combinações inválidas que, combinadas com T07-01, persistem dados cruzados no banco.

**Refs:** IR-04, IR-05, IR-15 (Auditoria 25)

---

### CC-05 — Controle de acesso insuficiente em operações de soft delete (T07-07 a T07-10) 🔴 Alto

**Problema:** API REST usa `rbac('monitor')` para delete/restore de participantes e eventos. A SSR restringe as mesmas operações a `admin`. Rotas SSR de delete/restore de participantes não têm nenhum `rbac()`.

| Operação                             | API REST  | SSR        | Deveria ser         |
| ------------------------------------ | --------- | ---------- | ------------------- |
| Delete/restore evento                | `monitor` | `admin`    | `admin`             |
| Delete/restore participante          | `monitor` | _(nenhum)_ | `gestor` ou `admin` |
| Delete/restore certificado (restore) | `monitor` | `admin`    | `gestor` ou `admin` |

**Refs:** VU-01, VU-02, IP-01, IP-02 (Auditoria 22)

---

### CC-06 — Bug de alias TiposCertificado causa texto vazio na exibição SSR (T07-11) 🔴 Alto

**Problema:** Model declara `as: 'TiposCertificados'` (plural). `certificadoSSRController.detalhe` acessa `certificado.TiposCertificado` (singular) → sempre `undefined` → texto interpolado sempre vazio.

**Correção necessária:** Corrigir `certificadoSSRController.js` para usar o alias plural correto `TiposCertificados` em todos os acessos.

**Refs:** REL-01 (Auditoria 21)

---

### CC-07 — FK violation não tratada ao criar certificado sem participante válido (T07-13) 🔴 Alto

**Problema:** `certificadoService.create()` valida tipo e evento, mas não valida `participante_id`. ID inexistente ou soft-deleted gera FK constraint violation no banco → HTTP 500 com stack trace exposto.

**Refs:** IR-02 (Auditoria 25)

---

### CC-08 — Unique constraints de email sem filtro de soft-delete bloqueiam recriação (T07-20) 🟡 Médio

**Problema:** Índices `UNIQUE email` em `participantes` e `usuarios` são globais — email de registro soft-deleted bloqueia criação de novo registro com o mesmo email. Contradiz a finalidade do soft delete (NFR-4).

**Correção necessária:** Migrations convertendo os índices simples em partial indexes `UNIQUE WHERE deleted_at IS NULL`.

**Refs:** C-07 (Auditoria 23), IR-11 (Auditoria 25)

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo (sprint atual — integridade em risco)

| ID Tarefa | Achado               | Ação                                                                                                                                                            |
| --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BKL-01    | T07-01 (IR-01)       | `certificadoService.create()`: validar `tipo.evento_id === data.evento_id`, HTTP 422 se divergir                                                                |
| BKL-02    | T07-02 (BR-01, C-02) | `certificadoService.create()`: usar `paranoid: false` no `count()` do código incremental                                                                        |
| BKL-03    | T07-04 (C-01)        | `certificadoService.create()`: envolver `count → create` em transação serializada ou pessimistic lock                                                           |
| BKL-04    | T07-03 (M-01, C-05)  | Nova migration: substituir `addConstraint` por `addIndex WHERE deleted_at IS NULL` em `tipos_certificados(codigo, evento_id)`; remover bloco `indexes` do model |
| BKL-05    | T07-05 (IR-04)       | `TiposCertificadosController.findAll()`: extrair `eventoId` de `req.filtro` e passá-lo ao service                                                               |
| BKL-06    | T07-06 (IR-05)       | `tiposCertificadosSSRController.index()`: adicionar filtro `evento_id: eventosIds` na query                                                                     |
| BKL-07    | T07-07 (VU-01)       | Elevar `rbac` de delete/restore de participantes na API de `monitor` para `gestor`                                                                              |
| BKL-08    | T07-08 (VU-02)       | Elevar `rbac` de delete/restore de eventos na API de `monitor` para `admin`                                                                                     |
| BKL-09    | T07-09 (IP-01)       | Uniformizar política de restore de certificados: elevar de `monitor` para `gestor` na API REST                                                                  |
| BKL-10    | T07-10 (IP-02)       | Adicionar `rbac('gestor')` nas rotas SSR de delete/restore de participantes em `admin.js`                                                                       |
| BKL-11    | T07-11 (REL-01)      | Corrigir alias em `certificadoSSRController.js`: `TiposCertificado` → `TiposCertificados`                                                                       |
| BKL-12    | T07-13 (IR-02)       | `certificadoService.create()`: adicionar `Participante.findByPk(data.participante_id)` com HTTP 404                                                             |
| BKL-13    | T07-14 (C-03)        | Aplicar `senhaForteSchema` na criação e atualização de usuário                                                                                                  |
| BKL-14    | T07-15 (M-03)        | Nova migration: `UNIQUE(usuario_id, evento_id)` em `usuario_eventos`                                                                                            |
| BKL-15    | T07-22 (IR-15)       | `certificadoSSRController.novo()`: filtrar `TiposCertificados` por `evento_id` selecionado                                                                      |
| BKL-16    | T07-28 (M-06)        | Adicionar `validate: { notEmpty: true }` em `TiposCertificados.descricao` no model                                                                              |

### Médio Prazo (próximas sprints — integridade de fluxo)

| ID Tarefa | Achado                          | Ação                                                                                                                              |
| --------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| BKL-17    | T07-17 (IR-03)                  | `certificadoService.update()`: replicar validação de `valores_dinamicos` vs `dados_dinamicos`                                     |
| BKL-18    | T07-18 (IR-06)                  | Implementar `sequelize.transaction()` em `certificadoService.create()`, `eventoService.delete()` e `eventoService.restore()`      |
| BKL-19    | T07-19 (C-04)                   | Adicionar `.default('emitido')` ao campo `status` no `certificadoSchema`                                                          |
| BKL-20    | T07-20 (C-07, IR-11)            | Migrations: partial index `email WHERE deleted_at IS NULL` para `participantes` e `usuarios`                                      |
| BKL-21    | T07-21 / T07-31 (REL-09, GI-03) | `eventoService.restore()`: filtrar `UsuarioEvento` por `deleted_at >= evento.deleted_at` e excluir usuários soft-deleted          |
| BKL-22    | T07-23 (IR-07)                  | Definir (VH-01) e implementar política de cascata de soft delete de evento para `TiposCertificados` / `Certificado`               |
| BKL-23    | T07-24 (IR-08)                  | Definir (VH-02) e implementar política de cascata de soft delete de participante para `Certificado`                               |
| BKL-24    | T07-25 (IR-09)                  | Implementar validação de transições de status em `certificadoService.update()` após decisão do SRS                                |
| BKL-25    | T07-26 (C-15)                   | Mover validação cross-field de `campo_destaque` para layer de entrada (refinement Zod ou service com HTTP 422)                    |
| BKL-26    | T07-27 (C-16, M-02)             | Verificar no banco de produção/teste se índice global `tipos_certificados_codigo_key` foi corretamente removido pela migration 10 |
| BKL-27    | T07-16 / T07-32 (M-04)          | Avaliar e migrar `ON DELETE CASCADE` para `ON DELETE RESTRICT` nas FKs de `certificados`                                          |
| BKL-28    | T07-33 (M-07)                   | Adicionar `DROP TYPE IF EXISTS "enum_certificados_status"` no down migration de `certificados`                                    |
| BKL-29    | T07-12 (REL-10)                 | Adicionar fallback em `tiposCertificadosOwnership` e `scopedEvento` para contextos com plain objects                              |

### Longo Prazo (débito técnico e consistência)

| ID Tarefa | Achado        | Ação                                                                                                               |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| BKL-30    | T07-29 (M-10) | Avaliar remoção de `paranoid` de `usuario_eventos` (ou adicionar constraint para prevenir duplicação ativa do par) |
| BKL-31    | T07-30 (M-14) | Adicionar `validate: { len }` nos models para campos com `min(N)` documentado no SRS                               |
| BKL-32    | T07-34 (M-06) | Refatorar down migration de `usuarios` para usar `queryInterface.dropTable` ao invés de SQL bruto                  |
| BKL-33    | T07-35 (C-11) | Incluir coordenadas de layout (`texto_x/y`, `validacao_x/y`) no `eventoSchema` como inteiros opcionais             |
| BKL-34    | —             | Padronizar mensagens de erro nos `validate.is` de todos os models (seguir padrão de `Evento` com `{ args, msg }`)  |

---

## 4. Atualizações Recomendadas no SRS

### SRS-01 — Integridade cross-evento na criação de certificado (de IR-01)

**Situação:** FR-21 exige associação a participante, evento e tipo, mas não exige explicitamente que o tipo pertença ao mesmo evento do certificado.

**Proposta:**

> "FR-21b: O `tipo_certificado_id` informado na criação de um certificado deve pertencer ao mesmo evento (`evento_id`) do certificado. Caso contrário, o sistema deve retornar HTTP 422 com mensagem descritiva."

---

### SRS-02 — Comportamento do contador incremental de código com soft-deleted (de C-02)

**Situação:** FR-52 define o formato `CODIGO_BASE-YY-TIPO-N` mas não especifica se `N` é baseado em registros ativos ou total (incluindo soft-deleted).

**Proposta:**

> "FR-52b: O número incremental `N` na geração do código de certificado deve ser calculado incluindo certificados soft-deletados do mesmo evento e tipo, garantindo que o código nunca colida com um existente no banco."

---

### SRS-03 — Política de senha forte na criação de usuário (de C-03)

**Situação:** FR-57 exige política de senha forte apenas na alteração de senha via SSR. A criação de usuário usa validação `min(6)`.

**Proposta:**

> "FR-57b: A política de senha forte (mín. 8 caracteres, ao menos uma maiúscula, uma minúscula, um dígito e um caractere especial) deve ser aplicada também na criação de usuários e na atualização de senha via API REST."

---

### SRS-04 — Unicidade `(codigo, evento_id)` com soft-deleted em tipos_certificados (de FR-11)

**Situação:** FR-11 menciona "excluindo registros soft-deletados" mas não especifica o mecanismo de banco.

**Proposta:**

> "FR-11b: A garantia de unicidade de `(codigo, evento_id)` deve ser implementada por partial unique index PostgreSQL excluindo `deleted_at IS NOT NULL`. A restrição não deve bloquear a criação de um tipo com o mesmo par após o soft delete do anterior."

---

### SRS-05 — Política de cascata em soft delete entre entidades (de IR-07, IR-08)

**Situação:** FR-4, FR-9, FR-16, FR-22 definem soft delete por entidade isolada, sem política de cascata entre elas.

**Proposta:**

> "FR-9b: A remoção lógica de um evento deve soft-deletar em cascata os `TiposCertificados` e `Certificados` associados, além das `UsuarioEvento`. A restauração deve restaurar as mesmas entidades em cascata, exceto vínculos com usuários que já estavam deletados antes da exclusão do evento."
>
> "FR-4b: A remoção lógica de um participante deve definir explicitamente o comportamento dos certificados: (a) soft-deletar em cascata, ou (b) bloquear a remoção se existirem certificados ativos."

---

### SRS-06 — Máquina de estados de status do certificado (de IR-09)

**Situação:** FR-19 define valores válidos de `status` sem definir transições permitidas.

**Proposta:**

> "FR-19b: As transições de status permitidas são: `pendente → emitido`, `emitido → cancelado`. A reversão de `cancelado → emitido` só é permitida com perfil `admin`. O sistema deve rejeitar transições inválidas com HTTP 422."

---

### SRS-07 — Comportamento de geração de PDF com entidade relacionada soft-deleted (de IR-13)

**Situação:** FR-43 e FR-47 não definem comportamento quando `evento` ou `participante` estão soft-deleted.

**Proposta:**

> "FR-43b: A geração de PDF deve retornar HTTP 422 se o evento ou o participante vinculados ao certificado estiverem soft-deleted, indicando qual entidade está indisponível."

---

### SRS-08 — Soft delete em `usuario_eventos` não documentado (de M-09)

**Situação:** NFR-4 lista entidades com soft delete obrigatório mas não inclui `usuario_eventos`.

**Proposta:**

> "NFR-4b: A associação `usuario_eventos` deve manter histórico de vínculos via soft delete (`paranoid: true`), permitindo restauração ao restaurar o evento associado. A restauração deve preservar apenas os vínculos que foram soft-deletados como consequência direta da deleção do evento."

---

### SRS-09 — Unicidade de email com soft-delete (de C-07, IR-11)

**Situação:** FR-2, FR-27 definem unicidade de email mas não especificam comportamento com soft-deleted.

**Proposta:**

> "FR-2b: A unicidade de `email` em participantes deve excluir registros soft-deletados, permitindo que um novo registro seja criado com o mesmo email após a remoção lógica do anterior. Idem para `usuarios` (FR-27b)."

---

## 5. Itens para Validação Humana

| ID        | Tema                                      | Pergunta                                                                                                                                                                                                                  | Impacto da Decisão                                |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| VH-T07-01 | Cascata de soft delete — Evento           | Ao deletar um evento, seus `TiposCertificados` e `Certificados` devem ser soft-deletados em cascata ou o delete deve ser bloqueado enquanto houver dependentes ativos?                                                    | Define BKL-22 e SRS-05                            |
| VH-T07-02 | Cascata de soft delete — Participante     | Ao deletar um participante, seus certificados devem ser soft-deletados ou o delete deve ser bloqueado se existirem certificados ativos? Certificados de participante deletado devem continuar acessíveis via PDF público? | Define BKL-23 e SRS-05                            |
| VH-T07-03 | Máquina de estados do certificado         | Quais transições de status são permitidas? É possível reemitir um certificado cancelado? Apenas admin pode fazê-lo?                                                                                                       | Define BKL-24 e SRS-06                            |
| VH-T07-04 | Restore de certificados via API REST      | O restore de certificados deve ser restrito a `admin` (como na SSR) ou permitido a `gestor`? Monitor pode restaurar?                                                                                                      | Define BKL-09 e SRS (adição de FR-22b)            |
| VH-T07-05 | Restauração em cascata de `UsuarioEvento` | Ao restaurar um evento, devem ser restaurados apenas os vínculos deletados junto com o evento ou todos os históricos soft-deleted? Vínculos com usuários soft-deleted devem ser restaurados?                              | Define BKL-21 e SRS-08                            |
| VH-T07-06 | PDF com evento/participante soft-deleted  | Certificados de eventos ou participantes deletados devem continuar gerando PDF (com dados defaults) ou devem retornar erro?                                                                                               | Define BKL comportamento de `pdfService` e SRS-07 |
| VH-T07-07 | Soft delete em `usuario_eventos`          | A associação usuario-evento desfeita deve ser recuperável (soft delete) ou simplesmente removida (hard delete)? Existe caso de negócio para restaurar uma associação removida?                                            | Define BKL-30 e SRS-08                            |
| VH-T07-08 | ON DELETE CASCADE em `certificados`       | O `ON DELETE CASCADE` nas FKs de certificados é intencional (para facilitar testes) ou um erro de design? Em produção, existe mecanismo que impeça hard deletes nos parents?                                              | Define BKL-27                                     |
| VH-T07-09 | Consulta pública de participante deletado | Certificados de participante soft-deleted devem ser acessíveis via `GET /api/certificados?email=...`? Atualmente não são, pois `Participante.findOne` usa `paranoid: true`                                                | Define comportamento de AM-01 (Auditoria 22)      |
| VH-T07-10 | Contador incremental com soft-deleted     | O número `N` no código de certificado deve ser calculado incluindo soft-deleted (sem reutilização de número) ou apenas ativos (com possível reuso)?                                                                       | Define BKL-02 e SRS-02                            |

---

## 6. Iniciativas de Spec Kit

### SPEC-01 — Política de Cascata Relacional em Soft Delete

**Motivação:** A ausência de política documentada de cascata entre entidades (evento → tipos → certificados; participante → certificados) é recorrente em 4 auditorias distintas (22, 23, 24, 25). A implementação atual é inconsistente e parcial.

**Spec proposta:** Definir formalmente as políticas de ciclo de vida relacional para todas as entidades do sistema: o que acontece com as dependentes quando a entidade pai é soft-deletada, restaurada ou permanentemente removida.

---

### SPEC-02 — Padronização de Constraints de Unicidade com Soft Delete (Partial Indexes)

**Motivação:** O sistema tem 3 pontos de unicidade que ignoram registros soft-deleted (`tipos_certificados(codigo, evento_id)`, `participantes(email)`, `usuarios(email)`), resultando em bloqueio indevido de recriação. O padrão correto (partial index `WHERE deleted_at IS NULL`) não está adotado de forma consistente.

**Spec proposta:** Especificar que todas as constraints `UNIQUE` em tabelas com soft delete devem ser implementadas como partial indexes PostgreSQL excluindo registros com `deleted_at IS NOT NULL`. Criar migration padrão de referência.

---

### SPEC-03 — Geração Atômica de Código de Certificado

**Motivação:** A geração de código (count → format → create) é um mecanismo crítico sem atomicidade, propenso a race conditions e colisões pós-soft-delete. A lógica de geração precisa ser redesenhada com garantias transacionais.

**Spec proposta:** Redesenhar o mecanismo de geração de código: considerar sequence PostgreSQL dedicada por `(evento_id, codigo_tipo)` ou pesimistic lock via transação serializada, garantindo unicidade e correção mesmo sob concorrência.

---

### SPEC-04 — Camada de Transações no Service Layer

**Motivação:** A ausência total de `sequelize.transaction()` no sistema (zero ocorrências) é uma fragilidade arquitetural sistêmica, não um bug pontual. Toda operação multi-step está sujeita a estados intermediários inválidos.

**Spec proposta:** Definir quais operações do service layer requerem atomicidade transacional e criar padrão de implementação. Prioridade: `certificadoService.create()`, `eventoService.delete()`, `eventoService.restore()`.

---

### SPEC-05 — Unificação da Política de Controle de Acesso para Operações Destrutivas

**Motivação:** O sistema apresenta uma assimetria sistêmica de autorização entre API REST e SSR para operações de delete/restore. A divergência afeta 4 entidades (participantes, eventos, certificados, usuários) e representa vulnerabilidades reais de acesso.

**Spec proposta:** Criar uma tabela de autorização centralizada definindo o perfil mínimo por operação (`create`, `update`, `delete`, `restore`) para cada entidade, aplicável uniformemente em REST e SSR.

---

## 7. Problemas Sistêmicos

### PS-01 — Assimetria de autorização entre API REST e SSR (impacta 5 entidades)

O sistema possui dois fluxos de interface (API REST com JWT + SSR com cookie) com políticas de autorização inconsistentes para operações destrutivas. A API REST é sistematicamente mais permissiva:

| Operação             | API REST  | SSR             | Delta      |
| -------------------- | --------- | --------------- | ---------- |
| Delete evento        | `monitor` | `admin`         | 2 níveis   |
| Restore evento       | `monitor` | `admin`         | 2 níveis   |
| Delete participante  | `monitor` | _(nenhum rbac)_ | indefinido |
| Restore participante | `monitor` | _(nenhum rbac)_ | indefinido |
| Delete certificado   | `monitor` | `gestor`        | 1 nível    |
| Restore certificado  | `monitor` | `admin`         | 2 níveis   |

Este padrão não é accidental — sugere que as rotas REST foram implementadas com `rbac('monitor')` como padrão e nunca revisadas em relação às restrições da SSR.

---

### PS-02 — Ausência de defesa em profundidade nas validações (Zod vs. Sequelize)

Há um padrão recorrente em todos os models: validações de negócio (tamanhos mínimos, formatos, restrições de valor) existem apenas no Zod e nunca no Sequelize. Qualquer operação que bypasse o middleware `validate` (seeders, testes unitários de model, scripts administrativos, migrations de dados) persiste valores inválidos silenciosamente.

**Campos afetados sem fallback no model:**

| Campo                         | Regra Zod   | Model          |
| ----------------------------- | ----------- | -------------- |
| `Participante.nomeCompleto`   | `min(3)`    | sem `validate` |
| `Evento.nome`                 | `min(3)`    | sem `validate` |
| `Evento.ano`                  | `gte(2000)` | sem `validate` |
| `Certificado.nome`            | `min(3)`    | sem `validate` |
| `Usuario.nome`                | `min(3)`    | sem `validate` |
| `TiposCertificados.descricao` | `min(1)`    | sem `notEmpty` |

---

### PS-03 — Multi-tenancy não aplicado uniformemente em tipos de certificados

O isolamento por evento (`scopedEvento`) é o mecanismo central de controle de acesso no sistema. Contudo, `TiposCertificados` — a entidade que define a estrutura dos certificados de cada evento — tem o isolamento completamente ausente em três pontos:

1. API REST (`TiposCertificadosController.findAll`) — sem filtro de evento
2. SSR (`tiposCertificadosSSRController.index`) — sem filtro de evento
3. Formulário de criação de certificado SSR — expõe todos os tipos e todos os participantes

Isso configura um padrão de falha recorrente, não um bug isolado: o isolamento foi implementado para certificados e participantes, mas esquecido para tipos de certificados.

---

### PS-04 — Zero transações em operações multi-step críticas

O sistema não possui nenhuma chamada a `sequelize.transaction()`. Essa ausência é sistêmica e não resulta de uma decisão arquitetural documentada. Os 3 fluxos mais críticos sem transação:

| Fluxo             | Etapas não atômicas                          | Consequência de falha parcial                               |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------- |
| Criar certificado | `count → format → create`                    | Race condition → código duplicado; estado inválido no banco |
| Deletar evento    | `destroy(evento) → destroy(usuario_eventos)` | Evento deletado com vínculos de usuários ativos             |
| Restaurar evento  | `restore(evento) → restore(usuario_eventos)` | Evento restaurado com vínculos inconsistentes               |

---

### PS-05 — Drift de código entre model e banco (partial index vs. constraint full)

O drift entre a definição do model `tipos_certificados.js` (partial index `WHERE deleted_at IS NULL`) e a migration real (constraint FULL) cria um cenário onde:

- **Testes** usam `sync()` → comportamento correto (partial index)
- **Produção** usa migrations → comportamento incorreto (constraint full)

Este drift silencioso invalida os testes como prova de comportamento de produção para o fluxo de soft delete + recriação de tipo. A causa raiz é estrutural: NFR-5 proíbe `sync()` em produção, mas permite seu uso em testes — criando dois contextos com semanticas de schema divergentes.

---

## Índice de Rastreabilidade

| ID Triagem | Auditoria Origem    | ID Original            |
| ---------- | ------------------- | ---------------------- |
| T07-01     | 07/25               | IR-01                  |
| T07-02     | 07/22, 07/23, 07/25 | BR-01, C-02, IR-12     |
| T07-03     | 07/24, 07/23, 07/25 | M-01, C-05/C-06, IR-10 |
| T07-04     | 07/23, 07/25        | C-01, IR-06            |
| T07-05     | 07/25               | IR-04                  |
| T07-06     | 07/25               | IR-05                  |
| T07-07     | 07/22               | VU-01                  |
| T07-08     | 07/22               | VU-02                  |
| T07-09     | 07/22               | IP-01                  |
| T07-10     | 07/22               | IP-02                  |
| T07-11     | 07/21               | REL-01                 |
| T07-12     | 07/21               | REL-10                 |
| T07-13     | 07/25               | IR-02                  |
| T07-14     | 07/23               | C-03                   |
| T07-15     | 07/24               | M-03                   |
| T07-16     | 07/24               | M-04                   |
| T07-17     | 07/25               | IR-03                  |
| T07-18     | 07/25               | IR-06                  |
| T07-19     | 07/23               | C-04                   |
| T07-20     | 07/23, 07/25        | C-07, IR-11            |
| T07-21     | 07/22, 07/25        | GI-03, IR-14           |
| T07-22     | 07/25               | IR-15                  |
| T07-23     | 07/22, 07/25        | GI-02, IR-07           |
| T07-24     | 07/22, 07/25        | GI-01, IR-08           |
| T07-25     | 07/25               | IR-09                  |
| T07-26     | 07/23               | C-15                   |
| T07-27     | 07/24, 07/23        | M-02/M-16, C-16        |
| T07-28     | 07/20               | M-06                   |
| T07-29     | 07/20, 07/21        | M-10, REL-05           |
| T07-30     | 07/20, 07/23        | M-14, C-09             |
| T07-31     | 07/21, 07/22        | REL-09, GI-03          |
| T07-32     | 07/24               | M-04                   |
| T07-33     | 07/24               | M-07                   |
| T07-34     | 07/24               | M-06                   |
| T07-35     | 07/23               | C-11                   |
