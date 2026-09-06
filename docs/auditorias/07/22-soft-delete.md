# Auditoria 22 — Soft Delete (Remoção Lógica, Recuperação e Ciclo de Vida)

**Data:** 2026-05-10 12:58 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Sistema:** Certifique-me  
**Versão SRS:** 2.0  
**Escopo:** Soft delete, paranoid, deleted_at, restore, cascata, queries, services e controllers de deleção/restauração

---

## 1. Matriz Consolidada de Achados

| ID        | Entidade / Camada                                     | Descrição                                                                                                                                                                                                                                                                 | Evidências                                                                                                                 | Tipo | Severidade | Impacto                                                                                                                                                                                        | Requisitos Violados | Destino Recomendado                                                                                                      |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **BR-01** | `Certificado` / `certificadoService`                  | Contagem para geração de código incremental **exclui soft-deleted** (`paranoid: true` implícito no `count`). Ao recriar certificado após soft delete, o novo código colide com o deletado, resultando em erro de unicidade sem mensagem descritiva.                       | `certificadoService.js:64` — `Certificado.count({ where: { evento_id, tipo_certificado_id } })` sem `paranoid: false`      | BR   | Alto       | Após um soft delete de certificado, a criação de novos certificados do mesmo tipo/evento falha com violação de unicidade sem contexto. Usuário não sabe a causa.                               | FR-52, NFR-4        | Corrigir: usar `Certificado.count({ where: {...}, paranoid: false })`                                                    |
| **VU-01** | `Participante` / rota REST API                        | `DELETE /participantes/:id` e `POST /participantes/:id/restore` usam `rbac('monitor')` — monitores podem deletar e restaurar participantes via API REST. O SRS não concede essa permissão a monitores.                                                                    | `src/routes/participantes.js:140,150` — `rbac('monitor')` em rotas de delete e restore                                     | VU   | Alto       | Violação de princípio de menor privilégio (OWASP A01). Monitor pode remover participantes de qualquer evento (sem filtro extra de scopedEvento).                                               | FR-36, NFR-1        | Elevar para `rbac('gestor')` no mínimo; avaliar se admin-only para restore                                               |
| **VU-02** | `Evento` / rota REST API                              | `DELETE /eventos/:id` e `POST /eventos/:id/restore` usam `rbac('monitor')`. SSR restringe corretamente a `admin`. Divergência entre camadas.                                                                                                                              | `src/routes/eventos.js` — `rbac('monitor')` em delete e restore; `admin.js:97,100` — `rbac('admin')`                       | VU   | Alto       | Monitor pode excluir e restaurar eventos via API REST. Operação crítica acessível além do esperado.                                                                                            | FR-36, NFR-1        | Elevar para `rbac('admin')` para alinhamento com SSR                                                                     |
| **IP-01** | `Certificado` / rota REST API vs SSR                  | Restore de certificado: API REST usa `rbac('monitor')`; SSR usa `rbac('admin')` (FR-22 especifica "apenas admin pode restaurar via SSR"). Política inconsistente entre interfaces.                                                                                        | `src/routes/certificados.js:218` — `rbac('monitor')`; `admin.js:175` — `rbac('admin')`                                     | IP   | Alto       | Atacante com token de monitor pode restaurar certificados cancelados/deletados via API REST, contornando a restrição da interface SSR.                                                         | FR-22, NFR-1        | Definir política no SRS e uniformizar; sugestão: `rbac('gestor')` ou `rbac('admin')` na API                              |
| **IP-02** | `Participante` / rota SSR                             | Rotas SSR de delete e restore de participantes **sem middleware `rbac()`**. Qualquer usuário autenticado (monitores) pode deletar/restaurar participantes via SSR.                                                                                                        | `src/routes/admin.js:88-89` — ausência de `rbac()` nas rotas `/participantes/:id/deletar` e `/participantes/:id/restaurar` | IP   | Alto       | Monitor autenticado via SSR pode deletar/restaurar participantes de qualquer evento sem restrição.                                                                                             | FR-36, NFR-1        | Adicionar `rbac('gestor')` mínimo nas rotas SSR de delete e restore de participantes                                     |
| **GI-01** | `Participante` → `Certificado`                        | Soft delete de participante **não cascateia** para certificados associados. Certificados do participante deletado permanecem ativos e acessíveis.                                                                                                                         | `participanteService.js:33` — `participante.destroy()` sem tratamento de certificados                                      | GI   | Médio      | Integridade lógica comprometida: certificados ficam "órfãos" de participante ativo. PDF e validação pública continuam funcionando via certificado.participante_id (FK física existe no banco). | FR-4, NFR-4         | Validar com stakeholder (VH). Definir: soft-deletar certificados em cascata ou bloquear delete se certificados existirem |
| **GI-02** | `Evento` → `TiposCertificados` / `Certificado`        | Soft delete de evento cascateia para `UsuarioEvento` mas **não para `TiposCertificados` nem `Certificado`**. Após delete de evento, seus tipos e certificados permanecem visíveis.                                                                                        | `eventoService.js:43-50` (método `delete`) — apenas `UsuarioEvento.destroy(...)` cascateia                                 | GI   | Médio      | TiposCertificados e Certificados de evento deletado continuam listados e editáveis. Ausência de cascata pode levar a inconsistências graves.                                                   | FR-9, NFR-4         | Validar com stakeholder (VH). Definir política de cascata no SRS                                                         |
| **GI-03** | `Evento` / `UsuarioEvento` — restore                  | `eventoService.restore` executa `UsuarioEvento.restore({ where: { evento_id } })` sem filtrar por data de deleção — restaura **todos** os UsuarioEvento soft-deleted daquele evento, incluindo os que foram removidos antes do delete do evento por razões independentes. | `eventoService.js:56-61` — ausência de filtro `deleted_at >= evento.deleted_at`                                            | GI   | Médio      | Restauração de evento pode reabilitar associações usuário-evento que foram desfeitas manualmente, violando intenção original da remoção.                                                       | FR-9, NFR-4         | Filtrar por `deleted_at` aproximado ao timestamp do evento ao restaurar                                                  |
| **DT-01** | `eventoService`                                       | Método `destroy` duplicado (não cascateia para `UsuarioEvento`) ao lado de `delete` (que cascateia). Método `destroy` é dead code, mas pode ser chamado acidentalmente sem cascata.                                                                                       | `eventoService.js:43-50` — dois métodos: `destroy(id)` e `delete(id)` com comportamentos diferentes                        | DT   | Baixo      | Confusão de manutenção. Se `destroy` for invocado no futuro (ex.: refactoring), UsuarioEvento não será cascateado.                                                                             | NFR-4, NFR-6        | Remover ou documentar `destroy`; centralizar em `delete`                                                                 |
| **AM-01** | `Participante` / rota pública `GET /api/certificados` | Participante soft-deletado não é encontrado na consulta pública por email (`paranoid: true` implícito). Seus certificados existem no banco mas ficam inacessíveis publicamente. Política não definida no SRS.                                                             | `src/routes/api.js:103` — `Participante.findOne({ where: { email } })` sem `paranoid: false`                               | AM   | Baixo      | Participantes desativados perdem acesso público a certificados, mas a regra de negócio não está documentada.                                                                                   | FR-23, FR-53        | Definir no SRS: certificados de participante deletado devem ou não ser acessíveis publicamente                           |

---

## 2. Problemas Críticos de Soft Delete

### 2.1 Bypass / Violação de Exclusão Lógica

Nenhum bypass de exclusão lógica foi detectado. Todas as entidades principais (`participantes`, `eventos`, `certificados`, `tipos_certificados`, `usuarios`, `usuario_eventos`) usam `paranoid: true` com `deletedAt: 'deleted_at'` consistentemente.

Não foram encontrados usos de `force: true` em código de produção. Os usos de `force: true` estão restritos a testes (`afterEach`/`beforeEach`) para limpeza de dados, o que é aceitável.

### 2.2 Hard Delete Indevido

Nenhum hard delete indevido detectado em código de produção. Todos os `destroy()` sem `{ force: true }` resultam em soft delete (via `paranoid: true`).

### 2.3 Falhas de Restauração

**GI-03** representa uma falha de restauração: a restauração de evento restaura UsuarioEvento de forma abrangente demais, podendo reabilitar associações que foram removidas antes da exclusão do evento.

### 2.4 Vazamento de Dados Deletados

**Risco identificado (IP-01 + VU-01 + VU-02):** Através de endpoints REST com controle de acesso insuficiente, usuários com perfil `monitor` podem restaurar entidades (participantes, eventos, certificados) sem ter permissão legítima. Isso não expõe dados deletados diretamente, mas permite sua restauração não autorizada.

**AM-01** é um caso inverso: certificados de participante deletado ficam _inacessíveis_ publicamente. Dependendo da política de negócio, pode ser ou não um dado que deveria ser visível.

### 2.5 Inconsistência Multi-tenant

O sistema não é estritamente multi-tenant, mas `scopedEvento` isola gestores/monitores por evento. Nos cenários de restore via API REST (VU-01, VU-02), o `scopedEvento` middleware **é aplicado** nos eventos e certificados mas **não em participantes**, agravando VU-01: um monitor pode restaurar participante de qualquer evento sem restrição.

---

## 3. Backlog Arquitetural

### Curto Prazo (crítico — impacta integridade e segurança)

- **[BKL-01]** Corrigir `certificadoService.create`: usar `paranoid: false` no `count` para gerar código incremental incluindo soft-deleted. _(BR-01)_
- **[BKL-02]** Elevar `rbac('monitor')` para `rbac('gestor')` (ou `rbac('admin')`) nas rotas REST de `DELETE` e `POST .../restore` de participantes. _(VU-01)_
- **[BKL-03]** Elevar `rbac('monitor')` para `rbac('admin')` nas rotas REST de `DELETE` e `POST .../restore` de eventos. _(VU-02)_
- **[BKL-04]** Adicionar `rbac('gestor')` (ou `rbac('admin')`) nas rotas SSR de delete/restore de participantes em `admin.js`. _(IP-02)_
- **[BKL-05]** Rever e uniformizar a política de restore de certificados entre API REST e SSR (atualmente `monitor` vs `admin`), após decisão no SRS. _(IP-01)_

### Médio Prazo (qualidade e integridade)

- **[BKL-06]** Definir e implementar política de cascata: ao deletar um Evento, devem ser soft-deletados também seus `TiposCertificados` e `Certificados`? Registrar decisão arquitetural. _(GI-02)_
- **[BKL-07]** Definir e implementar política de cascata: ao deletar um Participante, devem ser soft-deletados também seus `Certificados`? Registrar decisão arquitetural. _(GI-01)_
- **[BKL-08]** Corrigir `eventoService.restore` para filtrar `UsuarioEvento` por timestamp de deleção próximo ao do evento, evitando restauração de associações deletadas independentemente. _(GI-03)_

### Longo Prazo (dívida técnica e clareza)

- **[BKL-09]** Remover ou tornar privado o método `destroy` do `eventoService`, centralizando a lógica no método `delete` (com cascata). _(DT-01)_
- **[BKL-10]** Documentar no SRS o comportamento esperado de consulta pública quando o participante é soft-deletado (seus certificados devem ou não ser visíveis por email?). _(AM-01)_

---

## 4. Atualizações Recomendadas no SRS

### 4.1 Cascata de Soft Delete (não definida)

O SRS não define o comportamento de cascata entre entidades. Adicionar:

> **FR-4b:** A remoção lógica de um participante deve definir explicitamente o comportamento dos certificados associados: (a) soft-deletar em cascata os certificados do participante, ou (b) bloquear a remoção se existirem certificados ativos.

> **FR-9b:** A remoção lógica de um evento deve soft-deletar em cascata os `TiposCertificados` e `Certificados` associados ao evento, além das associações `UsuarioEvento`.

> **FR-16b:** A remoção lógica de um tipo de certificado não deve cascatear para certificados emitidos com esse tipo (certificados existentes permanecem). Esta regra deve ser documentada explicitamente.

### 4.2 Política de Restore de Certificados via API REST (ambígua)

FR-22 menciona "apenas admin pode restaurar via SSR" — mas não especifica a política para a API REST. Adicionar:

> **FR-22b:** A restauração de certificados via API REST requer perfil mínimo `[gestor|admin]`. Certificados deletados não podem ser restaurados por monitores.

### 4.3 Consulta Pública de Participante Deletado (não coberta)

O SRS não define se certificados de participante soft-deleted devem ser retornados na consulta pública por email. Adicionar:

> **FR-23b:** A consulta pública de certificados por email (`GET /api/certificados?email=`) deve/não deve retornar certificados de participantes soft-deletados. [Definir com stakeholder.]

---

## 5. Itens para Validação Humana

| ID        | Questão                                                                                                                                                 | Contexto                                                                                                                              | Impacto da Decisão                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **VH-01** | Ao soft-deletar um **Evento**, seus `TiposCertificados` e `Certificados` devem ser soft-deletados em cascata?                                           | Atualmente não são cascateados. Certificados de eventos deletados continuam visíveis e editáveis.                                     | Define necessidade de BKL-06. Se sim: implementar cascata. Se não: documentar no SRS.           |
| **VH-02** | Ao soft-deletar um **Participante**, seus `Certificados` devem ser soft-deletados em cascata?                                                           | Atualmente não são cascateados. Certificados de participantes deletados continuam acessíveis (inclusive via PDF público pelo código). | Define necessidade de BKL-07. Impacta FR-23.                                                    |
| **VH-03** | Certificados de participante soft-deletado devem ser **acessíveis publicamente** via consulta por email?                                                | Atualmente inacessíveis: `Participante.findOne` com `paranoid: true` não encontra o participante deletado.                            | Define comportamento de AM-01. Se sim: usar `paranoid: false` na busca pública do participante. |
| **VH-04** | O restore de certificados via API REST deve ser restrito a `admin` (como na SSR) ou permitido a `gestor`?                                               | FR-22 diz "apenas admin via SSR", mas não define para API. Atualmente API permite `monitor`.                                          | Define correção de IP-01 e BKL-05.                                                              |
| **VH-05** | Ao restaurar um Evento, toda associação `UsuarioEvento` historically deletada deve ser restaurada, ou apenas as que foram deletadas junto com o evento? | Atualmente sistema restaura todas as UsuarioEvento deletadas do evento, sem distinguir o motivo.                                      | Define correção de GI-03 e BKL-08.                                                              |

---

## 6. Problemas Sistêmicos de Soft Delete

### 6.1 Inconsistência de Controle de Acesso entre API REST e SSR

O padrão de autorização para operações de delete/restore é **inconsistente** entre as duas interfaces:

| Operação                 | API REST (`rbac`) | SSR (`rbac`)     | SRS define             |
| ------------------------ | ----------------- | ---------------- | ---------------------- |
| Delete evento            | `monitor`         | `admin`          | não explícito          |
| Restore evento           | `monitor`         | `admin`          | não explícito          |
| Delete participante      | `monitor`         | nenhum (authSSR) | não explícito          |
| Restore participante     | `monitor`         | nenhum (authSSR) | não explícito          |
| Delete certificado       | `monitor`         | `gestor`         | não explícito          |
| Restore certificado      | `monitor`         | `admin`          | "apenas admin via SSR" |
| Delete tipo certificado  | `gestor`          | `gestor`         | ✓ consistente          |
| Restore tipo certificado | `gestor`          | `gestor`         | ✓ consistente          |
| Delete usuário           | não exposto       | `admin`          | FR-33 implícito        |
| Restore usuário          | não exposto       | `admin`          | FR-33 implícito        |

A consistência existe apenas em `TiposCertificados` e `Usuários`. Para todas as demais entidades, a API REST é substancialmente mais permissiva que a SSR.

### 6.2 Ausência de Política de Cascata Documentada

Nenhuma das entidades principais define cascata explícita de soft delete no nível de application logic (service layer):

- `Participante.destroy()` → sem cascata para `Certificado`
- `Evento.delete()` → cascata apenas para `UsuarioEvento`; sem cascata para `TiposCertificados` e `Certificado`
- `TiposCertificados.destroy()` → sem cascata para `Certificado`

Isso é uma ausência sistêmica de definição do ciclo de vida de entidades dependentes.

### 6.3 Falha de Ciclo de Vida: Código de Certificado Pós-Soft-Delete

O gerador de código incremental (`certificadoService.create`) não contabiliza soft-deleted records, quebrando a garantia de unicidade de código em cenários de delete + recriação. Embora a constraint `UNIQUE` no banco impeça duplicatas físicas, o erro resultante é opaco para o usuário/sistema.

### 6.4 Divergência entre API e SSR — Exposição Diferenciada de Dados Deletados

Na listagem SSR de participantes, certificados, eventos, tipos e usuários, registros soft-deleted são exibidos separadamente na interface ("Arquivados"). Na API REST não existe endpoint equivalente para listar registros deletados — gestores e monitores não têm como ver o que foi deletado via API. Isso não é necessariamente um problema, mas cria uma experiência assimétrica e pode dificultar reconciliação.

---

## 7. Conformidade por Entidade

| Entidade            | `paranoid: true` | `deleted_at` | Service destroy | Service restore |  REST delete   |  REST restore  | SSR delete  | SSR restore |
| ------------------- | :--------------: | :----------: | :-------------: | :-------------: | :------------: | :------------: | :---------: | :---------: |
| `Participante`      |        ✅        |      ✅      |       ✅        |       ✅        |  ⚠️ `monitor`  |  ⚠️ `monitor`  | ⚠️ sem rbac | ⚠️ sem rbac |
| `Evento`            |        ✅        |      ✅      | ✅ (2 métodos)  |  ✅ (parcial)   |  ⚠️ `monitor`  |  ⚠️ `monitor`  | ✅ `admin`  | ✅ `admin`  |
| `Certificado`       |        ✅        |      ✅      |       ✅        |       ✅        |  ⚠️ `monitor`  |  ⚠️ `monitor`  | ✅ `gestor` | ✅ `admin`  |
| `TiposCertificados` |        ✅        |      ✅      |       ✅        |       ✅        |  ✅ `gestor`   |  ✅ `gestor`   | ✅ `gestor` | ✅ `gestor` |
| `Usuario`           |        ✅        |      ✅      |        —        |        —        | ❌ não exposto | ❌ não exposto | ✅ `admin`  | ✅ `admin`  |
| `UsuarioEvento`     |        ✅        |      ✅      | ✅ (via evento) | ✅ (via evento) |       —        |       —        |      —      |      —      |

**Legenda:** ✅ correto/adequado · ⚠️ problema identificado · ❌ ausente/incorreto

---

## 8. Conclusão

O sistema implementa `paranoid: true` de forma consistente em todos os modelos e não possui hard deletes indevidos em produção. A camada de modelo está correta.

Os principais riscos encontrados são **de autorização** (VU-01, VU-02, IP-01, IP-02): a API REST é sistematicamente mais permissiva que a SSR para operações de delete/restore, permitindo que monitores realizem operações destrutivas que a interface administrativa restringe a gestor ou admin.

O segundo risco crítico é o **bug no gerador de código de certificado** (BR-01): a contagem que define o número incremental exclui soft-deleted records, podendo gerar colisão de código após um ciclo de delete + create.

Por fim, a **ausência de política de cascata documentada** (GI-01, GI-02) é uma dívida arquitetural que requer decisão dos stakeholders.
