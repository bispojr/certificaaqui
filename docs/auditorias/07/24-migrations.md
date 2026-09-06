# Auditoria Técnica — Domínio: Migrações Sequelize

**Sistema:** Certifique-me  
**Versão do SRS auditado:** 2.0 (2026-04-30)  
**Data da auditoria:** 2026-05-10  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Escopo:** Migrations Sequelize, evolução de schema, consistência com models e SRS

---

## Migrations analisadas (ordem de execução)

| #   | Arquivo                                                 | Operação                                                                  |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `20260311175950-create-eventos.js`                      | CREATE TABLE eventos                                                      |
| 2   | `20260311180308-create-tipos-certificados.js`           | CREATE TABLE tipos_certificados                                           |
| 3   | `20260311180742-create-participantes.js`                | CREATE TABLE participantes                                                |
| 4   | `20260311180841-create-certificados.js`                 | CREATE TABLE certificados                                                 |
| 5   | `20260312180000-create-usuarios.js`                     | CREATE TABLE usuarios                                                     |
| 6   | `20260313190000-create-usuario_eventos.js`              | CREATE TABLE usuario_eventos                                              |
| 7   | `20260324083059-create-performance-indexes.js`          | CREATE INDEX (múltiplos)                                                  |
| 8   | `20260416092527-add-url-template-base-to-eventos.js`    | ALTER TABLE eventos ADD url_template_base                                 |
| 9   | `20260416201114-add-layout-fields-to-eventos.js`        | ALTER TABLE eventos ADD texto_x/y, validacao_x/y                          |
| 10  | `20260418232720-add-evento-id-to-tipos-certificados.js` | ALTER TABLE tipos_certificados ADD evento_id + refactoring de constraints |

---

## 1. Matriz Consolidada de Achados

| ID   | Migration           | Descrição                                                                                                                                                      | Evidências                                                                                                             | Tipo | Severidade | Impacto                                                                                                                                 | Requisitos Violados              | Destino Recomendado                                                                                                                     |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | `20260418232720`    | Unique constraint composto em `tipos_certificados(codigo, evento_id)` é FULL no banco, mas o model define índice PARCIAL (`WHERE deleted_at IS NULL`)          | Migration usa `addConstraint` (full unique); model usa `indexes: [{ where: { deleted_at: null } }]`                    | BR   | Crítico    | Impede reuso de `codigo` após soft delete de um tipo no mesmo evento                                                                    | FR-11                            | Nova migration: remover constraint full, criar partial index `WHERE deleted_at IS NULL`                                                 |
| M-02 | `20260311180308`    | Migration inicial de `tipos_certificados` cria `unique: true` global em `codigo` — constraint incoerente com o requisito `FR-11` desde o início                | Campo `codigo` com `unique: true` simples; FR-11 exige unicidade composta por evento                                   | BR   | Alto       | Schema historicamente inconsistente com SRS; constraint global usada por semanas/sprints                                                | FR-11                            | Documentar decisão; a migration 10 corrige, mas gap existiu no histórico                                                                |
| M-03 | `20260313190000`    | `usuario_eventos` não possui unique constraint `(usuario_id, evento_id)` — duplicatas silenciosas possíveis                                                    | Migration cria tabela sem qualquer unique constraint; sem índice único                                                 | GI   | Alto       | Mesmo usuário pode ser associado ao mesmo evento múltiplas vezes; comportamento inesperado em RBAC                                      | FR-32                            | Nova migration adicionando `UNIQUE(usuario_id, evento_id)` em `usuario_eventos`                                                         |
| M-04 | `20260311180841`    | FKs de `certificados` para parents soft-deletáveis usam `ON DELETE CASCADE` — hard delete em parent apagaria certificados permanentemente                      | `participante_id`, `evento_id`, `tipo_certificado_id`: todos com `onDelete: 'CASCADE'`                                 | DT   | Alto       | Se parent for deletado diretamente no banco (ou via down migration), certificados são permanentemente perdidos; viola espírito de NFR-4 | NFR-4                            | Avaliar mudança para `ON DELETE RESTRICT` ou `SET NULL` adequado; documentar decisão                                                    |
| M-05 | `20260324083059`    | Índices de performance ausentes para `tipos_certificados.evento_id` e `usuario_eventos.*`                                                                      | Migration cobre somente: `certificados(evento_id, participante_id, status)`, `participantes(email)`, `usuarios(email)` | GI   | Médio      | Queries de escopo por evento em tipos e queries de auth/RBAC em usuario_eventos sem suporte de índice                                   | NFR-5 (implícito de performance) | Nova migration adicionando indexes em `tipos_certificados(evento_id)`, `usuario_eventos(usuario_id)`, `usuario_eventos(evento_id)`      |
| M-06 | `20260312180000`    | Down migration de `usuarios` usa SQL bruto PostgreSQL-específico em vez de `queryInterface.dropTable`                                                          | `queryInterface.sequelize.query('DROP TABLE IF EXISTS "usuarios";')` + `DROP TYPE IF EXISTS "enum_usuarios_perfil"`    | DT   | Médio      | Não-portável; desvia do padrão Sequelize; `DROP TABLE IF EXISTS` sem CASCADE pode ignorar erros silenciosos                             | NFR-5                            | Refatorar down para `queryInterface.dropTable('usuarios')` + remoção explícita de ENUM via `queryInterface.sequelize.query` consistente |
| M-07 | `20260311180841`    | Down migration de `certificados` não remove o ENUM type `enum_certificados_status`                                                                             | `dropTable('certificados', {})` sem drop do tipo ENUM equivalente ao feito em `usuarios`                               | IP   | Médio      | Orphan ENUM type no banco após rollback; inconsistência entre rollbacks de usuarios vs certificados                                     | —                                | Adicionar `DROP TYPE IF EXISTS "enum_certificados_status"` no down de certificados                                                      |
| M-08 | Todas as migrations | Nenhuma constraint `CHECK` em nível de banco para validações de formato: `codigo_base` (3 letras), `codigo` em tipos (2 letras), `ano >= 2000`                 | Validações existem apenas em ORM/validators; DB não as impõe                                                           | GI   | Médio      | Inserts diretos no banco (seeders, scripts de migração, adminPGAdmin) violam regras de negócio sem ser rejeitados                       | FR-7, FR-8, FR-11                | Adicionar migrations com `CHECK` constraints, ao menos para `codigo_base` e `codigo` tipos                                              |
| M-09 | `20260313190000`    | `usuario_eventos` tem `deleted_at` (paranoid), mas NFR-4 não inclui esta tabela na lista de entidades com soft delete obrigatório                              | NFR-4 lista: participantes, eventos, certificados, tipos_certificados, usuarios — não lista usuario_eventos            | AM   | Baixo      | Over-implementation não documentada; comportamento de soft delete em junction table é ambíguo                                           | NFR-4                            | Documentar decisão no SRS ou ADR                                                                                                        |
| M-10 | `20260311175950`    | Migration de `eventos` não define `defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')` em `created_at`/`updated_at`, ao contrário de todas as demais tabelas | Campos sem `defaultValue`; outras migrations (participantes, tipos_certificados, certificados) têm o default           | DT   | Baixo      | Inserts via SQL bruto em `eventos` sem timestamp explícito falham; inconsistência comportamental                                        | —                                | Nova migration/correção ou documentar que ORM sempre provê o valor                                                                      |
| M-11 | `20260313190000`    | `usuario_eventos` define `onDelete: 'CASCADE'` nas FKs mas não `onUpdate: 'CASCADE'`, ao contrário de `certificados` que define ambos                          | FK de `usuario_id` e `evento_id` sem `onUpdate`; certificados tem `onUpdate: 'CASCADE'`                                | DT   | Baixo      | Inconsistência de convenção; `onUpdate` rara em prática mas pode gerar comportamentos inesperados em cenários de migração de IDs        | —                                | Padronizar `onUpdate: 'CASCADE'` em todas as FKs                                                                                        |

---

## 2. Problemas Críticos de Migrations

### M-01 — Drift crítico: unique constraint full vs. partial index em `tipos_certificados`

**Gravidade:** Crítico / Bug Real

**Descrição:**  
A migration `20260418232720` adiciona o campo `evento_id` à tabela `tipos_certificados` e cria uma unique constraint composta `(codigo, evento_id)` via `queryInterface.addConstraint`. Esta é uma constraint FULL no nível do banco de dados — aplica-se a todos os registros, incluindo os soft-deletados.

Porém, o model `src/models/tipos_certificados.js` define:

```js
indexes: [
  {
    unique: true,
    fields: ['codigo', 'evento_id'],
    where: { deleted_at: null },        // PARTIAL — exclui registros soft-deletados
    name: 'tipos_certificados_codigo_evento_id_key',
  },
],
```

O Sequelize `sync()` (em testes) usa a definição do model (com `WHERE`) para criar o índice. A migration de produção cria uma constraint FULL com o mesmo nome. Os dois objetos têm o **mesmo nome mas semântica diferente**.

**Impacto:**

- Em produção: após soft-deletar um `tipo_certificado` com `{codigo: 'PA', evento_id: 1}`, qualquer tentativa de criar um novo com os mesmos valores falha por violação de unique constraint no banco — mesmo o registro deletado "bloqueando" a criação de um substituto.
- Contradiz diretamente FR-11: _"deve ser único dentro do mesmo evento (unicidade composta `codigo + evento_id`, excluindo registros soft-deletados)"_.
- Em testes (com `sync()`): o índice gerado é parcial, cobrindo apenas o cenário correto. O comportamento difere entre produção e testes.

**Correção necessária:**  
Nova migration que:

1. Remove a constraint full `tipos_certificados_codigo_evento_id_key`.
2. Cria um índice parcial PostgreSQL: `CREATE UNIQUE INDEX tipos_certificados_codigo_evento_id_key ON tipos_certificados (codigo, evento_id) WHERE deleted_at IS NULL`.

---

### M-03 — Gap de integridade: ausência de unique constraint em `usuario_eventos(usuario_id, evento_id)`

**Gravidade:** Alto / Gap de Implementação

**Descrição:**  
A tabela `usuario_eventos` (junction N:N entre usuários e eventos) não possui nenhuma restrição de unicidade. FR-32 exige que gestores e monitores estejam vinculados a um ou mais eventos sem ambiguidade. A ausência de unique constraint permite múltiplos registros `(usuario_id=1, evento_id=2)`, o que:

- Duplica associações e quebra queries de RBAC que assumem um resultado único por combinação.
- Não é detectado pelo ORM em operações de inserção normais.

**Correção necessária:**  
Migration adicionando: `UNIQUE(usuario_id, evento_id)` em `usuario_eventos`.

---

### M-04 — Risco de integridade: `ON DELETE CASCADE` em `certificados` com parents soft-deletáveis

**Gravidade:** Alto / Dívida Técnica

**Descrição:**  
Os campos `participante_id`, `evento_id` e `tipo_certificado_id` em `certificados` foram criados com `onDelete: 'CASCADE'`. Como todos os parents usam soft delete (paranoid), hard deletes raramente ocorrem via ORM — mas:

- Down migrations executam `dropTable` nos parents, removendo todas as linhas reais antes de dropar a tabela. Em ambiente de teste com rollback encadeado, isso elimina certificados.
- Qualquer acesso direto ao banco (scripts de manutenção, ferramentas DBA) que delete uma linha de `participantes` ou `eventos` apaga silenciosamente todos os certificados relacionados.
- O correto seria `ON DELETE RESTRICT` para forçar o soft delete e detectar tentativas de hard delete.

---

## 3. Backlog Arquitetural

### Curto Prazo

- [ ] **[Crítico]** Criar migration para corrigir unique constraint em `tipos_certificados`: substituir full constraint por partial index `WHERE deleted_at IS NULL` — corrige M-01.
- [ ] **[Alto]** Criar migration adicionando `UNIQUE(usuario_id, evento_id)` em `usuario_eventos` — corrige M-03.
- [ ] **[Médio]** Adicionar drop de ENUM `enum_certificados_status` no down migration de `certificados` — corrige M-07.

### Médio Prazo

- [ ] **[Alto]** Avaliar e migrar `ON DELETE CASCADE` em `certificados` para `ON DELETE RESTRICT` nas FKs dos parents soft-deletáveis — corrige M-04.
- [ ] **[Médio]** Criar migration com indexes de performance em `tipos_certificados(evento_id)`, `usuario_eventos(usuario_id)` e `usuario_eventos(evento_id)` — corrige M-05.
- [ ] **[Médio]** Adicionar `CHECK` constraints no banco para `codigo_base`, `codigo` de tipos e `ano` — corrige M-08.
- [ ] **[Médio]** Refatorar down migration de `usuarios` para usar `queryInterface.dropTable` + remoção de ENUM padronizada — corrige M-06.

### Longo Prazo

- [ ] **[Baixo]** Corrigir defaultValues de `created_at`/`updated_at` na migration de `eventos` por consistência — corrige M-10.
- [ ] **[Baixo]** Padronizar `onUpdate: 'CASCADE'` em todas as FKs de `usuario_eventos` — corrige M-11.
- [ ] **[Baixo]** Documentar no SRS ou ADR a decisão de soft delete em `usuario_eventos` — corrige M-09.

---

## 4. Atualizações Recomendadas no SRS

### 4.1 — Soft delete em `usuario_eventos` não documentado

A tabela `usuario_eventos` implementa soft delete (campo `deleted_at`, model com `paranoid: true`), mas NFR-4 não menciona esta tabela. O SRS deve esclarecer se a associação usuário-evento deve:

- Ser logicamente removível com recuperação (soft delete intencional), ou
- Ser simplesmente deletada quando a associação é desfeita.

**Recomendação:** Adicionar ao NFR-4 ou criar FR específico documentando o comportamento esperado para a tabela `usuario_eventos`.

### 4.2 — Constraint de formato `codigo_base` e `codigo` em nível de banco

O SRS define regras de formato (FR-7, FR-8, FR-11) que são atualmente validadas apenas no ORM. O SRS deve registrar explicitamente se essas constraints devem ser garantidas também em nível de banco de dados (via `CHECK`), ou se a validação ORM é suficiente por política de arquitetura.

### 4.3 — Comportamento de unicidade `(codigo, evento_id)` após soft delete

FR-11 menciona _"excluindo registros soft-deletados"_ para unicidade, mas não especifica como isso deve ser implementado no banco. Deve-se documentar explicitamente que a implementação exige um partial unique index PostgreSQL e que esta garantia não é universalmente suportada em todos os dialetos SQL.

---

## 5. Itens para Validação Humana

### VH-01 — Decisão de design: `ON DELETE CASCADE` vs `ON DELETE RESTRICT` em `certificados`

A decisão de usar `ON DELETE CASCADE` nas FKs de `certificados` pode ser intencional (simplificar rollbacks em tests e operações dev), mas conflita com a semântica de soft delete em produção. A equipe deve confirmar:

- O `CASCADE` é intencional para facilitar testes?
- Em produção, existe algum mecanismo que impeça hard deletes acidentais nos parents?
- A mudança para `RESTRICT` quebraria algum fluxo existente?

### VH-02 — Decisão de design: soft delete em `usuario_eventos`

A junction table `usuario_eventos` usa `paranoid: true`. Deve ser confirmado:

- Quando uma associação usuário-evento é "desfeita", o registro deve ser soft-deletado (recuperável) ou hard-deletado?
- Existe algum caso de uso de negócio que justifique restaurar uma associação removida?

### VH-03 — Histórico de schema: constraint global `codigo` em `tipos_certificados`

Durante um período (migrations 2 a 10, potencialmente semanas de desenvolvimento), a tabela `tipos_certificados` teve unique global em `codigo` — o que impede o mesmo código (ex.: `PA`) em dois eventos diferentes. Verificar:

- Existem dados em produção cujo `codigo` é duplicado entre eventos diferentes e que foram inseridos após a correção (migration 10)?
- O rollback da migration 10 em produção precisaria de script de migração de dados?

### VH-04 — Performance: necessidade de índices em `usuario_eventos`

A ausência de índices em `usuario_eventos(usuario_id, evento_id)` impacta todas as operações de RBAC/scoped evento. Avaliar:

- O volume de dados justifica índices agora ou é prematuro?
- A query de auth é executada com alta frequência (a cada request autenticado)?

---

## 6. Problemas Sistêmicos de Migrations

### 6.1 — Drift acumulado entre code e banco: unique parcial vs. full (M-01)

O achado M-01 representa um drift sistêmico: o model em `src/models/tipos_certificados.js` e a migration `20260418232720` definem estruturas com o mesmo nome (`tipos_certificados_codigo_evento_id_key`) mas semânticas distintas. Este tipo de drift é especialmente perigoso porque:

- Não gera erro em tempo de desenvolvimento (testes usam `sync()` com o model).
- Só se manifesta em produção, onde a migration real foi executada.
- Qualquer ambiente criado via `db:migrate` terá comportamento diferente de qualquer ambiente criado via `sequelize.sync()`.

**Risco sistêmico:** Testes passam, mas produção falha em fluxos de soft delete + recriação de tipo de certificado.

### 6.2 — Inconsistência de padrão entre migrations (raw SQL vs. queryInterface)

A migration de `usuarios` usa SQL bruto (`queryInterface.sequelize.query`) enquanto todas as demais usam `queryInterface.*`. Esta mistura de padrões indica que diferentes desenvolvedores ou momentos de desenvolvimento produziram código heterogêneo. Sem uma convenção documentada, futuras migrations podem ampliar essa inconsistência.

### 6.3 — Ausência de índices para FKs em `usuario_eventos`

PostgreSQL não cria índices automaticamente para chaves estrangeiras (ao contrário de MySQL). A migration `20260313190000` cria as FKs sem índices correspondentes. O middleware `scopedEvento` e as queries de RBAC fazem joins e filtros por `usuario_id` nessa tabela a cada request autenticado — resultando em sequential scans potencialmente custosos conforme o sistema cresce.

### 6.4 — Risco de divergência produção vs. desenvolvimento com ENUM types

O down migration de `usuarios` limpa o tipo ENUM `enum_usuarios_perfil`, mas o de `certificados` não limpa `enum_certificados_status`. Após um rollback completo seguido de re-execução das migrations, o banco pode ter o ENUM de certificados duplicado ou em estado inconsistente, causando falha na migration de criação de `certificados` em ambientes que já passaram por rollback.

---

## Resumo Executivo

| Severidade | Quantidade | IDs                    |
| ---------- | ---------- | ---------------------- |
| Crítico    | 1          | M-01                   |
| Alto       | 3          | M-02, M-03, M-04       |
| Médio      | 4          | M-05, M-06, M-07, M-08 |
| Baixo      | 3          | M-09, M-10, M-11       |
| **Total**  | **11**     |                        |

**Prioridade imediata:** O achado M-01 (unique full vs. partial) é um bug silencioso que afeta produção diretamente no fluxo de soft delete de tipos de certificados — core do produto. Deve ser corrigido com nova migration na próxima sprint.
