# Auditoria 25 — Integridade Relacional

**Data:** 2026-05-10 14:48 (BRT)
**Auditor:** Arquiteto de Software Sênior (IA)
**Sistema:** Certifique-me
**Versão SRS:** 2.0 (2026-04-30)
**Escopo:** Integridade relacional global — consistência entre entidades, FKs, soft delete, JSONB, transações, multi-tenancy e enumerações

---

## Fontes Analisadas

| Fonte                             | Caminho                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| Especificação                     | `docs/especificacoes.md`                                          |
| Models                            | `src/models/*.js`                                                 |
| Migrations                        | `migrations/*.js`                                                 |
| Service Certificado               | `src/services/certificadoService.js`                              |
| Service Evento                    | `src/services/eventoService.js`                                   |
| Service Participante              | `src/services/participanteService.js`                             |
| Service TiposCertificados         | `src/services/tiposCertificadosService.js`                        |
| Service PDF                       | `src/services/pdfService.js`                                      |
| Service Template                  | `src/services/templateService.js`                                 |
| Controller Certificado REST       | `src/controllers/certificadoController.js`                        |
| Controller Certificado SSR        | `src/controllers/certificadoSSRController.js`                     |
| Controller TiposCertificados REST | `src/controllers/tiposCertificadosController.js`                  |
| Controller TiposCertificados SSR  | `src/controllers/tiposCertificadosSSRController.js`               |
| Controller Dashboard              | `src/controllers/dashboardController.js`                          |
| Auditorias anteriores             | `22-soft-delete.md`, `23-constraints.md`, `21-relacionamentos.md` |

---

## 1. Matriz Consolidada de Achados

| ID        | Entidade(s) Envolvidas                                          | Descrição                                                                                                                                                                                                                                                                                                                                                              | Evidências                                                                                                                                                                                                               | Tipo | Severidade                  | Impacto                                                                                                                                                                                                                                                    | Requisitos Violados             | Destino Recomendado                                                                                                                                               |
| --------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **IR-01** | `Certificado`, `TiposCertificados`, `Evento`                    | `certificadoService.create()` não valida que `tipo_certificado_id.evento_id === data.evento_id`. É possível criar um certificado vinculando um tipo de certificado de um evento diferente do `evento_id` informado, quebrando o isolamento relacional entre eventos.                                                                                                   | `certificadoService.js:36-40` — valida existência de `tipo` e `evento` separadamente, mas nunca compara `tipo.evento_id` com `data.evento_id`                                                                            | BR   | **Crítico**                 | Dados de diferentes eventos podem ser misturados em um único certificado; viola multi-tenancy de dados; a query de geração de código usa `evento_id` e `tipo_certificado_id` separados, gerando código correto para o evento mas com tipo de outro evento. | FR-21, FR-45, FR-37             | `certificadoService.create()`: adicionar validação `if (tipo.evento_id !== data.evento_id) throw 422`                                                             |
| **IR-02** | `Certificado`                                                   | `certificadoService.create()` valida tipo e evento, mas **não valida a existência do `participante_id`**. Um ID inexistente ou soft-deleted resulta em FK constraint violation do banco (não tratada), retornando status 500 com mensagem técnica ao invés de 404/422.                                                                                                 | `certificadoService.js:32-78` — ausência de `Participante.findByPk(data.participante_id)`                                                                                                                                | BR   | **Alto**                    | FK violation não tratada expõe stack trace ao cliente; comportamento inconsistente com a validação dos outros entes; participante soft-deleted pode receber FK violation em vez de "não encontrado".                                                       | FR-21, NFR-6                    | Adicionar `Participante.findByPk(data.participante_id)` e lançar 404 se nulo, como é feito para tipo e evento                                                     |
| **IR-03** | `Certificado`, `valores_dinamicos`, `dados_dinamicos`           | `certificadoService.update()` não valida `valores_dinamicos` contra `dados_dinamicos` do tipo de certificado. Um UPDATE pode persistir campos incompletos ou incompatíveis com a estrutura do tipo, quebrando a consistência de dados que foi imposta na criação (FR-54).                                                                                              | `certificadoService.js:84-88` — `certificado.update(data)` sem nenhuma validação de campos dinâmicos                                                                                                                     | GI   | **Alto**                    | Certificados podem ficar com `valores_dinamicos` inconsistentes com o schema do tipo após update; a interpolação do `texto_base` retorna placeholders `${campo}` sem substituição; PDF gerado incorreto.                                                   | FR-54, FR-20                    | Replicar a lógica de validação de campos dinâmicos do `create` no `update`; ou restringir o UPDATE de `valores_dinamicos` apenas via rota dedicada                |
| **IR-04** | `TiposCertificados`, multi-tenancy                              | `TiposCertificadosController.findAll()` (REST API) **não passa `eventoId`** ao service — retorna todos os tipos de todos os eventos sem filtragem. O `scopedEvento` middleware injeta `req.filtro` ou `req.query`, mas o controller ignora completamente esses filtros.                                                                                                | `tiposCertificadosController.js:11-16` — `tiposCertificadosService.findAll({ page, perPage })` sem `eventoId`; compare com `tiposCertificadosSSRController.js` que aplica `eventosIds`                                   | BR   | **Alto**                    | Gestor/Monitor via REST API vê tipos de outros eventos; possível enumeração de templates, campos dinâmicos e estruturas internas de eventos alheios; violação de isolamento multi-tenant.                                                                  | FR-37, FR-46, NFR-1             | Extrair `eventoId` de `req.filtro` ou `req.query.eventoId` e passá-lo ao service em `findAll`                                                                     |
| **IR-05** | `TiposCertificados`, multi-tenancy                              | `tiposCertificadosSSRController.index()` consulta **todos** os tipos sem filtro por `eventosIds` do usuário (query `whereAtivos = {}`). O filtro é aplicado apenas no campo `podeEditar`, não na listagem em si. Gestor/monitor vê tipos de todos os eventos na interface SSR.                                                                                         | `tiposCertificadosSSRController.js:49-52` — `TiposCertificados.findAll({ where: whereAtivos, ... })` sem `evento_id: eventosIds`                                                                                         | BR   | **Alto**                    | Interface SSR expõe estrutura e configuração de tipos de certificados de eventos alheios a gestores/monitores; consistência de dados violada.                                                                                                              | FR-37, FR-46                    | Adicionar `if (eventosIds !== null) whereAtivos.evento_id = eventosIds` antes das queries                                                                         |
| **IR-06** | `Certificado`, `Evento`, `TiposCertificados`, `Participante`    | **Nenhum service** no sistema utiliza `sequelize.transaction()`. Fluxos multi-operação (ex.: criação de certificado: count → create) são executados sem atomicidade. Race condition: duas requisições simultâneas podem gerar o mesmo código incremental; eventoService.delete() pode deixar estado parcial (evento deletado, usuario_eventos não).                    | `grep -r "sequelize.transaction"` — zero ocorrências em `src/`; `certificadoService.js:63-77`; `eventoService.js:43-50`                                                                                                  | DT   | **Alto**                    | Corrupção de dados em cenários de concorrência: dois certificados com o mesmo código tentarão ser criados; se `UsuarioEvento.destroy()` falhar após `evento.destroy()`, evento fica deletado mas vínculos de usuários permanecem ativos.                   | FR-52, NFR-4                    | Implementar `sequelize.transaction()` em ao menos: `certificadoService.create()` e `eventoService.delete()/restore()`                                             |
| **IR-07** | `Evento` → `TiposCertificados`, `Certificado`                   | Soft delete de evento (`eventoService.delete()`) cascateia apenas para `UsuarioEvento`, mas **não para `TiposCertificados` nem `Certificado`**. Após deleção de evento, seus tipos e certificados permanecem listados como ativos, com `evento_id` apontando para evento soft-deleted.                                                                                 | `eventoService.js:43-50` — apenas `UsuarioEvento.destroy(...)` como cascata                                                                                                                                              | GI   | **Médio**                   | `TiposCertificados` de evento deletado aparecem em listagens como ativos; `Certificado` de evento deletado podem ser gerados em PDF com `certificado.Evento = null`, usando defaults silenciosos sem aviso ao usuário.                                     | FR-9, NFR-4                     | Definir política (VH): cascatar soft delete para `TiposCertificados` e `Certificado` ou bloquear o delete se houver dependentes ativos                            |
| **IR-08** | `Participante` → `Certificado`                                  | Soft delete de participante não cascateia para certificados vinculados. Certificados permanecem ativos com `participante_id` de participante soft-deleted. Ao carregar certificado com `include: [Participante]`, o ORM retorna `Participante: null` (paranoid filtra o deletado) — o PDF usa `participante?.nomeCompleto` (ok via `?.`), mas dados ficam incompletos. | `participanteService.js:33` — `participante.destroy()` sem cascata; `pdfService.js:93` — `certificado.nome                                                                                                               |      | participante?.nomeCompleto` | GI                                                                                                                                                                                                                                                         | **Médio**                       | Certificados "vivos" com participante inexistente no contexto ORM; inconsistência de estado; PDF pode ser gerado com nome vazio se `certificado.nome` for nulo.   | FR-4, NFR-4 | VH: definir política de cascata (soft-deletar certificados do participante?) ou bloquear delete se existirem certificados ativos |
| **IR-09** | `Certificado`, status lifecycle                                 | Não há máquina de estados para `status` do certificado. O campo aceita transição livre entre `"emitido"`, `"pendente"` e `"cancelado"` via `update()` sem nenhuma regra de transição. Um certificado `cancelado` pode ser colocado de volta como `emitido` sem nenhuma validação.                                                                                      | `certificadoService.js:84-88` — `certificado.update(data)` sem filtro de campos permitidos; `certificadoSSRController.js:228` — `update({ status: 'cancelado' })` direto                                                 | GI   | **Médio**                   | Certificados cancelados podem ser reemitidos via API REST sem auditoria ou validação de negócio; inconsistência de estado lógico vs comportamento funcional; status `pendente` nunca é definido automaticamente pelo sistema.                              | FR-19                           | Definir no SRS as transições válidas; implementar validação de transição em `certificadoService.update()`                                                         |
| **IR-10** | `TiposCertificados`, `Certificado`                              | Constraint composta `(codigo, evento_id)` de `tipos_certificados` na migration **não é partial index** (`WHERE deleted_at IS NULL`). Após soft delete de um tipo, o mesmo `(codigo, evento_id)` não pode ser recriado, violando FR-11 que exige unicidade excluindo soft-deletados. Referenciado também em auditoria 23 (C-05/C-06).                                   | `migrations/20260418232720-add-evento-id-to-tipos-certificados.js` — `addConstraint` sem cláusula `WHERE`; `src/models/tipos_certificados.js` — `indexes` com `where: { deleted_at: null }` nunca aplicado via migration | IP   | **Médio**                   | Restore de tipo deletado é a única alternativa; impossível criar novo tipo com mesmo código após soft delete, contradizendo o propósito do soft delete.                                                                                                    | FR-11, NFR-4                    | Criar nova migration substituindo `addConstraint` por `addIndex` com `WHERE deleted_at IS NULL` (partial index PostgreSQL)                                        |
| **IR-11** | `Participante`, `Usuario`                                       | Unique constraints de `email` em `participantes` e `usuarios` nas migrations são globais (sem `WHERE deleted_at IS NULL`). Após soft delete, o email fica "ocupado" permanentemente, bloqueando recriação de registro com mesmo email. Referenciado em auditoria 23 (C-07).                                                                                            | `migrations/20260311180742-create-participantes.js` — `email: { unique: true }` simples; idem `create-usuarios.js`                                                                                                       | IP   | **Médio**                   | Email de participante/usuário excluído não pode ser reutilizado; contradiz semântica de soft delete; casos reais: ex-participante retorna ao evento futuro.                                                                                                | FR-2, FR-4, FR-27, FR-33, NFR-4 | Migração adicional: substituir unique simples por partial index `UNIQUE WHERE deleted_at IS NULL`                                                                 |
| **IR-12** | `Certificado.codigo`, geração incremental                       | `certificadoService.create()` usa `Certificado.count({ where: { evento_id, tipo_certificado_id } })` sem `paranoid: false`. Certificados soft-deleted são excluídos do count, causando reuso de número incremental que colide com a constraint UNIQUE em `codigo`. Referenciado em auditorias 22 (BR-01) e 23 (C-01/C-02).                                             | `certificadoService.js:63-68` — `Certificado.count(...)` sem `paranoid: false`                                                                                                                                           | BR   | **Crítico**                 | Após qualquer soft delete de certificado, a emissão de novos certificados do mesmo tipo/evento falha com `UniqueConstraintError` sem mensagem descritiva.                                                                                                  | FR-52, NFR-4                    | `Certificado.count({ where: { ... }, paranoid: false })`                                                                                                          |
| **IR-13** | `pdfService`, `Evento`                                          | `pdfService.generateCertificadoPdf()` usa dados de `certificado.Evento` (associação eager). Se o evento estiver soft-deleted, o include retorna `null` (paranoid). O serviço usa degradação silenciosa com defaults hardcoded (`texto_x=270`, `texto_y=200`, etc.) sem sinalizar a inconsistência.                                                                     | `pdfService.js:91-94` — `const textoX = evento?.texto_x ?? 270`; evento pode ser `null` sem log de erro                                                                                                                  | GI   | **Baixo**                   | PDF de certificado de evento deletado é gerado com layout padrão que pode não corresponder ao template do evento; inconsistência de dados composta é silenciosa.                                                                                           | FR-47c, FR-48                   | Validar existência de `certificado.Evento` antes da geração e lançar erro descritivo; ou usar `paranoid: false` no include do evento                              |
| **IR-14** | `UsuarioEvento`, restore em cascata                             | `eventoService.restore()` restaura **todos** os `UsuarioEvento` soft-deleted daquele evento, incluindo associações removidas antes da exclusão do evento por razões independentes. Ausência de filtro por timestamp de deleção. Referenciado em auditoria 22 (GI-03).                                                                                                  | `eventoService.js:56-61` — `UsuarioEvento.restore({ where: { evento_id: id } })` sem filtro temporal                                                                                                                     | GI   | **Baixo**                   | Restauração de evento restablece vínculos usuario-evento que foram removidos intencionalmente, violando a intenção original do gestor.                                                                                                                     | FR-9, FR-32, NFR-4              | Filtrar por `deleted_at >= evento.deleted_at` ao restaurar `UsuarioEvento`                                                                                        |
| **IR-15** | `certificadoSSRController`, `Participante`, `TiposCertificados` | `certificadoSSRController.novo()` expõe **todos** os participantes e **todos** os tipos de certificados sem filtragem por evento, mesmo para gestores e monitores. A interface apresenta dados de outros eventos.                                                                                                                                                      | `certificadoSSRController.js:novo()` — `Participante.findAll(...)` e `TiposCertificados.findAll(...)` sem filtro por `evento_id`                                                                                         | BR   | **Médio**                   | Monitor pode selecionar participante de outro evento e tipo de outro evento; combinação inválida passa pela UI; tipo pode pertencer a evento diferente do selecionado, acionando IR-01 em seguida.                                                         | FR-37, FR-36                    | Filtrar `tipos` por `evento_id` selecionado (dinâmico via JS ou query param); filtrar `participantes` por evento ou permitir busca livre com validação no service |

---

## 2. Problemas Críticos de Integridade Relacional

### 2.1 Mistura de dados entre eventos (IR-01) — Bug Real / Crítico

**Cenário de falha:**

1. Gestor A cria evento `EDC` com tipo `PA` (evento_id=1, tipos_certificados.id=10)
2. Gestor B cria evento `TEC` com tipo `PA` (evento_id=2, tipos_certificados.id=20)
3. Via API REST, é possível enviar `POST /certificados` com `{ evento_id: 1, tipo_certificado_id: 20 }`
4. O service valida: tipo 20 existe ✓, evento 1 existe ✓ — **nunca compara** `tipo.evento_id (2) === data.evento_id (1)`
5. Certificado é criado com código `EDC-26-PA-1`, mas usando template e campos dinâmicos do tipo do evento `TEC`
6. PDF gerado mistura dados do evento `EDC` com estrutura do evento `TEC`

Este cenário representa a violação mais grave de integridade relacional do sistema.

---

### 2.2 Ausência total de transações (IR-06) — Dívida Técnica / Alto

Nenhuma operação multi-step do sistema é envolvida em `sequelize.transaction()`. Os principais riscos:

| Operação                      | Etapas não atômicas                       | Risco                                              |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `certificadoService.create()` | count → create (2 ops)                    | Dois certificados com mesmo código em concorrência |
| `eventoService.delete()`      | destroy(evento) → UsuarioEvento.destroy() | Evento deletado, vínculos de usuários ativos       |
| `eventoService.restore()`     | restore(evento) → UsuarioEvento.restore() | Evento restaurado, vínculos ainda deletados        |

---

### 2.3 Multi-tenancy quebrado em tipos de certificados (IR-04, IR-05, IR-15)

Três pontos independentes de quebra de isolamento de eventos:

1. **REST API** (`TiposCertificadosController.findAll`): sem filtro de evento, retorna todos os tipos
2. **Interface SSR** (`tiposCertificadosSSRController.index`): query sem cláusula `evento_id`
3. **Formulário de novo certificado SSR** (`certificadoSSRController.novo`): expõe todos os tipos e todos os participantes

Em conjunto, esses três pontos permitem a um gestor ou monitor enxergar e selecionar estruturas de eventos alheios e, combinado com IR-01, persistir essa inconsistência no banco.

---

### 2.4 Orphan records após soft delete (IR-07, IR-08)

| Entidade deletada | Orphans gerados                    | Visibilidade                    | Risco                                                                                                        |
| ----------------- | ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Evento`          | `TiposCertificados`, `Certificado` | Ambos ficam ativos em listagens | PDF usa defaults silenciosos; tipos aparecem sem evento ativo                                                |
| `Participante`    | `Certificado`                      | Certificados ficam ativos       | PDF gerado sem dados do participante; validação pública do certificado funciona, mas dados ficam incompletos |

---

## 3. Backlog Arquitetural

### Curto Prazo (impacto crítico na integridade de dados)

- **[IR-BKL-01]** `certificadoService.create()`: adicionar validação `tipo.evento_id === data.evento_id` com HTTP 422 _(IR-01 — BR, Crítico)_
- **[IR-BKL-02]** `certificadoService.create()`: adicionar validação de existência de `participante_id` com HTTP 404 _(IR-02 — BR, Alto)_
- **[IR-BKL-03]** `certificadoService.create()`: usar `paranoid: false` no `count()` para código incremental _(IR-12 — BR, Crítico; cross-ref 22 BR-01, 23 C-02)_
- **[IR-BKL-04]** `TiposCertificadosController.findAll()`: extrair `eventoId` de `req.filtro`/`req.query` e passá-lo ao service _(IR-04 — BR, Alto)_
- **[IR-BKL-05]** `tiposCertificadosSSRController.index()`: filtrar query por `eventosIds` do usuário autenticado _(IR-05 — BR, Alto)_

### Médio Prazo (integridade de fluxo e coerência multi-entidade)

- **[IR-BKL-06]** `certificadoService.update()`: replicar validação de `valores_dinamicos` vs `dados_dinamicos` do tipo _(IR-03 — GI, Alto)_
- **[IR-BKL-07]** `certificadoService.create()` e `eventoService.delete()/restore()`: envolver operações multi-step em `sequelize.transaction()` _(IR-06 — DT, Alto)_
- **[IR-BKL-08]** Definir política e implementar cascata de soft delete de evento para `TiposCertificados` e `Certificado` _(IR-07 — GI, Médio)_
- **[IR-BKL-09]** Definir política e implementar cascata de soft delete de participante para `Certificado` _(IR-08 — GI, Médio)_
- **[IR-BKL-10]** Criar migration de partial index `(codigo, evento_id) WHERE deleted_at IS NULL` para `tipos_certificados` _(IR-10 — IP, Médio; cross-ref 23 C-05/C-06)_
- **[IR-BKL-11]** Criar migrations de partial index `email WHERE deleted_at IS NULL` para `participantes` e `usuarios` _(IR-11 — IP, Médio; cross-ref 23 C-07)_
- **[IR-BKL-12]** `certificadoSSRController.novo()`: filtrar `TiposCertificados` por evento selecionado e validar cruzamento no service _(IR-15 — BR, Médio)_
- **[IR-BKL-13]** Implementar validação de transições de estado em `certificadoService.update()` _(IR-09 — GI, Médio)_

### Longo Prazo (consistência sistêmica e rastreabilidade)

- **[IR-BKL-14]** `eventoService.restore()`: filtrar `UsuarioEvento` por `deleted_at >= evento.deleted_at` ao restaurar _(IR-14 — GI, Baixo; cross-ref 22 GI-03)_
- **[IR-BKL-15]** `pdfService`: validar existência de `certificado.Evento` e `certificado.Participante` antes da geração, com erro descritivo _(IR-13 — GI, Baixo)_
- **[IR-BKL-16]** Documentar no SRS o comportamento esperado de cascata de soft delete entre entidades (evento → tipos → certificados) como regra formal de integridade _(AM, Baixo)_

---

## 4. Atualizações Recomendadas no SRS

### 4.1 Regra de integridade cross-evento não formalizada

**Situação atual:** FR-21 exige que certificado esteja associado a participante, evento e tipo, mas não exige explicitamente que `tipo_certificado_id.evento_id === certificado.evento_id`.

**Recomendação:** Adicionar ao FR-21 ou como novo FR:

> "O `tipo_certificado_id` informado na criação de um certificado deve pertencer ao mesmo evento (`evento_id`) do certificado. A violação deve resultar em HTTP 422."

---

### 4.2 Ciclo de vida de status de certificado não documentado

**Situação atual:** FR-19 define os valores válidos de `status`, mas não define as transições permitidas entre estados.

**Recomendação:** Adicionar ao FR-19 ou como novo FR:

> "As transições permitidas de status são: `pendente → emitido`, `emitido → cancelado`. A transição de `cancelado → emitido` deve ser explicitamente autorizada (apenas admin) ou proibida. Bloqueio de edição de certificados cancelados deve ser definido."

---

### 4.3 Comportamento de cascata em soft delete entre entidades não formalizado

**Situação atual:** FR-4, FR-9, FR-16, FR-22 definem soft delete por entidade de forma isolada, sem especificar o comportamento em cascata quando entidade pai é deletada.

**Recomendação:** Adicionar seção "Política de cascata de exclusão lógica" ao SRS:

> - Evento deletado: TiposCertificados e Certificados associados devem ser [soft-deletados em cascata | bloqueados se existirem dependentes ativos].
> - Participante deletado: Certificados associados devem ser [soft-deletados | mantidos ativos].
>   Define restauração em cadeia correspondente.

---

### 4.4 Comportamento em geração de PDF após soft delete de entidade relacionada

**Situação atual:** FR-43 e FR-47 não definem o comportamento quando `evento` ou `participante` estão soft-deleted no momento da geração do PDF.

**Recomendação:** Adicionar ao FR-43:

> "A geração de PDF deve falhar com HTTP 422 se o evento ou o participante vinculados ao certificado estiverem soft-deleted. Erro deve indicar qual entidade está indisponível."

---

## 5. Itens para Validação Humana

| ID    | Tema                                    | Decisão Necessária                                                                                                                                                                           |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VH-01 | Cascata de soft delete — Evento         | Ao deletar um evento, seus `TiposCertificados` e `Certificados` devem ser soft-deletados em cascata ou o delete deve ser bloqueado enquanto houver dependentes ativos?                       |
| VH-02 | Cascata de soft delete — Participante   | Ao deletar um participante, seus certificados ativos devem ser soft-deletados ou o delete deve ser bloqueado? Certificados de participante deletado devem continuar acessíveis publicamente? |
| VH-03 | Transições de status de certificado     | Quais transições de status são permitidas? É possível "reemitir" um certificado cancelado? Apenas admin pode fazê-lo?                                                                        |
| VH-04 | JSONB — Update de valores_dinamicos     | Ao atualizar um certificado, deve ser permitido atualizar `valores_dinamicos` sem re-validar contra `dados_dinamicos` do tipo? Ou o update deve ser vetado/validado?                         |
| VH-05 | Restauração em cascata de UsuarioEvento | Ao restaurar um evento, devem ser restaurados apenas os vínculos usuario-evento que foram deletados como consequência da deleção do evento, ou todos os vínculos históricos?                 |
| VH-06 | PDF com evento soft-deleted             | Certificados de eventos deletados devem continuar gerando PDF (usando defaults) ou devem retornar erro?                                                                                      |

---

## 6. Problemas Sistêmicos de Integridade

### 6.1 Ausência de atomicidade transacional em todos os services

O sistema não usa `sequelize.transaction()` em nenhum service. Toda operação multi-step é vulnerável a estados intermediários inválidos em caso de falha de rede, timeout ou concorrência. Isso representa uma fragilidade arquitetural sistêmica, não um bug pontual.

**Fluxos mais críticos sem transação:**

- Criação de certificado (count → create): race condition para código único
- Deleção de evento (destroy evento → destroy usuario_eventos): estado parcial
- Restauração de evento (restore evento → restore usuario_eventos): estado parcial

### 6.2 Multi-tenancy não aplicado uniformemente entre REST e SSR

O isolamento por evento (`scopedEvento`) é aplicado inconsistentemente:

| Camada                      | TiposCertificados listagem      | Certificados listagem | Participantes listagem              |
| --------------------------- | ------------------------------- | --------------------- | ----------------------------------- |
| REST API                    | ❌ sem filtro de evento (IR-04) | ✓ via scopedEvento    | ✓ via scopedEvento                  |
| SSR                         | ❌ sem filtro de evento (IR-05) | ✓ via getEventoIds()  | ✓ via getEventoIds()                |
| Formulário novo certificado | ❌ tipos sem filtro (IR-15)     | —                     | ❌ participantes sem filtro (IR-15) |

A inconsistência resulta em superfície de exposição de dados de outros eventos através de tipos de certificados.

### 6.3 Validação de integridade cross-entidade delegada exclusivamente ao banco

O sistema depende das constraints de FK do banco para detectar incoerências de entidade (ex.: `participante_id` inválido). Erros de FK não são interceptados e tratados como domínio de negócio — retornam como erros 500 com mensagens técnicas do PostgreSQL. A ausência de validação explícita no service antes do `create` impede respostas HTTP semânticas corretas (404/422).

### 6.4 JSONB distribuído sem validação em atualização

A consistência entre `dados_dinamicos` (tipo) e `valores_dinamicos` (certificado) é validada apenas na criação. Após a criação, qualquer UPDATE pode inserir valores incompletos, incompatíveis ou com campos extras sem nenhuma validação. A inconsistência é silenciosa: o certificado é salvo, mas o PDF pode ser gerado com placeholders não substituídos.

### 6.5 Divergência entre constraint real do banco e definição do model

O model `TiposCertificados` define um partial index `WHERE deleted_at IS NULL` no bloco `indexes`, mas esse index nunca é criado via migration (NFR-5 proíbe uso de `sync()`). O banco real possui uma UNIQUE constraint global sem filtro parcial. Documentação do model é enganosa e pode induzir o desenvolvedor a acreditar que o comportamento de soft delete + unicidade está garantido.

---

## Sumário Executivo

| Severidade | Quantidade | IDs                                      |
| ---------- | ---------- | ---------------------------------------- |
| Crítico    | 2          | IR-01, IR-12                             |
| Alto       | 4          | IR-02, IR-03, IR-04, IR-05, IR-06        |
| Médio      | 6          | IR-07, IR-08, IR-09, IR-10, IR-11, IR-15 |
| Baixo      | 3          | IR-13, IR-14                             |

**Achados exclusivos desta auditoria (não cobertos anteriormente):**

- IR-01: Mistura cross-evento em criação de certificado
- IR-02: Ausência de validação de participante na criação
- IR-03: JSONB sem validação em update
- IR-04 / IR-05: Multi-tenancy quebrado em tipos de certificados (REST e SSR)
- IR-06: Ausência sistêmica de transações
- IR-09: Ausência de máquina de estados para status de certificado
- IR-13: PDF silencioso com evento null
- IR-15: Formulário SSR de novo certificado sem filtro de evento

**Cross-referências com auditorias anteriores:**

- IR-07, IR-08, IR-14: cobertos em `22-soft-delete.md` (GI-01, GI-02, GI-03)
- IR-10, IR-11, IR-12: cobertos em `23-constraints.md` (C-05, C-07, C-02)
