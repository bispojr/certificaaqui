# Auditoria Técnica — Constraints e Validações de Domínio

**Domínio auditado:** Constraints (restrições de domínio, regras de unicidade, validações estruturais e regras de integridade)  
**Data:** 2026-05-10 14:00 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Versão do SRS analisada:** 2.0 (2026-04-30)

---

## Fontes Analisadas

| Fonte | Caminho |
|---|---|
| Especificação | `docs/especificacoes.md` |
| Model Participante | `src/models/participante.js` |
| Model Evento | `src/models/evento.js` |
| Model TiposCertificados | `src/models/tipos_certificados.js` |
| Model Certificado | `src/models/certificado.js` |
| Model Usuario | `src/models/usuario.js` |
| Model UsuarioEvento | `src/models/usuario_eventos.js` |
| Validator Participante | `src/validators/participante.js` |
| Validator Evento | `src/validators/evento.js` |
| Validator TiposCertificados | `src/validators/tipos_certificados.js` |
| Validator Certificado | `src/validators/certificado.js` |
| Validator Usuario | `src/validators/usuario.js` |
| Validator SenhaForte | `src/validators/senhaForte.js` |
| Service Certificado | `src/services/certificadoService.js` |
| Service Evento | `src/services/eventoService.js` |
| Service Participante | `src/services/participanteService.js` |
| Service TiposCertificados | `src/services/tiposCertificadosService.js` |
| Migration create-eventos | `migrations/20260311175950-create-eventos.js` |
| Migration create-tipos-certificados | `migrations/20260311180308-create-tipos-certificados.js` |
| Migration create-participantes | `migrations/20260311180742-create-participantes.js` |
| Migration create-certificados | `migrations/20260311180841-create-certificados.js` |
| Migration create-usuarios | `migrations/20260312180000-create-usuarios.js` |
| Migration create-usuario_eventos | `migrations/20260313190000-create-usuario_eventos.js` |
| Migration add-url-template-base | `migrations/20260416092527-add-url-template-base-to-eventos.js` |
| Migration add-layout-fields | `migrations/20260416201114-add-layout-fields-to-eventos.js` |
| Migration add-evento-id-tipos | `migrations/20260418232720-add-evento-id-to-tipos-certificados.js` |
| Migration performance-indexes | `migrations/20260324083059-create-performance-indexes.js` |

---

## 1. Matriz Consolidada de Achados

| ID | Constraint | Descrição | Evidências | Tipo | Severidade | Impacto | Requisitos Violados | Destino Recomendado |
|---|---|---|---|---|---|---|---|---|
| C-01 | Unicidade do `codigo` de certificado via contador incremental | A geração do código de certificado usa `count()` para calcular o próximo N, mas essa operação não é atômica. Duas requisições concorrentes podem obter o mesmo `count=N` e ambas tentar criar o código `N+1`, resultando em `UniqueConstraintError` sem retry. | `certificadoService.js` — `const count = await Certificado.count(...)` seguido de `Certificado.create(data)` sem transação ou lock | BR | **Crítico** | Falha na criação de certificado em condições de concorrência; sem mecanismo de retry, a requisição falha com 500 | FR-52 | `certificadoService.create()` — envolver em transação serializada ou usar sequence/lock de banco |
| C-02 | Contador incremental exclu soft-deleted, causando colisão de código | O `count()` com `paranoid: true` exclui registros soft-deleted. Após a exclusão lógica de um certificado, o próximo gerado pode ter o mesmo código que um certificado ativo (ex.: 5 criados → 1 deletado → próximo conta 4+1=5 → colide com cert 5). | `certificadoService.js` — `Certificado.count({ where: {...} })` com paranoid padrão excluindo deleted | BR | **Crítico** | `UniqueConstraintError` ao criar novo certificado após qualquer soft-delete do mesmo evento/tipo; serviço de emissão inoperante | FR-52 | Usar `paranoid: false` no `count()` ou buscar o MAX do índice N via regex no campo `codigo` |
| C-03 | Política de senha fraca na criação de usuário | `usuarioSchema` valida `senha: z.string().min(6)`, mas FR-57 exige política forte (mín. 8 chars, maiúscula, minúscula, dígito, especial). `senhaForteSchema` existe mas não é aplicado na criação/atualização via API/SSR. | `src/validators/usuario.js` — `senha: z.string().min(6)` vs `src/validators/senhaForte.js` | IP | **Alto** | Senhas fracas como `"abc123"` passam pela validação de criação; viola NFR-2 e FR-57 | FR-57, NFR-2 | Substituir `z.string().min(6)` por `senhaForteSchema` no `usuarioSchema` ou aplicar `senhaForteSchema` adicionalmente |
| C-04 | `status` obrigatório no Zod contradiz `defaultValue` no model | `certificadoSchema` define `status: z.enum([...])` sem `.optional()` ou `.default()`. O model Sequelize tem `defaultValue: 'emitido'`. Um cliente que não envia `status` recebe erro de validação Zod, contradizendo a intenção de default. | `src/validators/certificado.js` — `status: z.enum(...)` sem default; `src/models/certificado.js` — `defaultValue: 'emitido'` | BR | **Médio** | Clientes precisam sempre enviar `status` explicitamente, mesmo que o SRS preveja default; comportamento divergente entre API e criação interna | FR-19 | Adicionar `.default('emitido')` ao campo `status` no `certificadoSchema` |
| C-05 | Constraint composta `(codigo, evento_id)` de TiposCertificados não é partial index | A migration `20260418232720` cria a constraint via `addConstraint` (UNIQUE CONSTRAINT), que não suporta cláusula `WHERE`. Registros soft-deleted continuam ocupando o slot de unicidade, impedindo a criação de novo tipo com o mesmo `(codigo, evento_id)` após um soft-delete. O model define `where: { deleted_at: null }` no index, mas esse index nunca é aplicado via migration. | `migrations/20260418232720-add-evento-id-to-tipos-certificados.js` — `addConstraint` sem filtro partial; `src/models/tipos_certificados.js` — index com `where: { deleted_at: null }` | IP | **Médio** | Após soft-delete de um tipo de certificado, o mesmo `(codigo, evento_id)` não pode ser recriado; inconsistência entre NFR-4 (soft delete + restore) e unicidade | FR-11, NFR-4 | Substituir `addConstraint` por `addIndex` com cláusula `WHERE deleted_at IS NULL` na migration |
| C-06 | Index do model Sequelize para TiposCertificados nunca é aplicado via migration | O model define `indexes: [{ unique: true, fields: [...], where: { deleted_at: null } }]`, mas NFR-5 exige gestão exclusiva via migrations. O index parcial do model só seria criado via `sequelize.sync()`, não usado em produção. | `src/models/tipos_certificados.js` — bloco `indexes` com `where: { deleted_at: null }`; NFR-5 | ID | **Médio** | O partial index definido no model é inerte; a constraint real no banco não filtra soft-deleted; documentação do model é enganosa | NFR-5 | Criar migration explícita com `addIndex` + `WHERE deleted_at IS NULL` e remover o bloco `indexes` do model |
| C-07 | Unique constraints de `email` em participantes e usuários não são parciais | As migrations `create-participantes` e `create-usuarios` criam `unique: true` simples em `email`, sem `WHERE deleted_at IS NULL`. Participante/usuário soft-deleted bloqueia criação de outro com mesmo email. | `migrations/20260311180742-create-participantes.js` e `migrations/20260312180000-create-usuarios.js` — `unique: true` em `email` | IP | **Médio** | Impossível criar novo participante/usuário com email de registro previamente deletado; viola a finalidade do soft-delete | FR-2, FR-4, FR-27, FR-33, NFR-4 | Criar migrations adicionando índice parcial `UNIQUE WHERE deleted_at IS NULL` para `email` em ambas tabelas |
| C-08 | Unique constraint de `codigo` em certificados não é partial index | Migration `create-certificados` cria `unique: true` simples em `codigo`. Certificado soft-deleted bloqueia a reutilização da chave de código por qualquer futuro certificado. | `migrations/20260311180841-create-certificados.js` — `codigo: { unique: true }` | IP | **Baixo** | Em teoria, o código nunca é reutilizado (incremental), mas a constraint global cria limitações para restaurações e dificulta testes de scenario | FR-22, NFR-4 | Avaliar conversão para partial index `WHERE deleted_at IS NULL` |
| C-09 | Validações de tamanho mínimo ausentes na camada Sequelize | Vários campos têm `min(N)` no Zod mas nenhuma validação equivalente no model: `nomeCompleto` (min 3), `nome` de evento (min 3), `nome` de certificado (min 3), `nome` de usuário (min 3). Se o validate middleware for bypassado (ex.: scripts de seed, uso direto do service), valores inválidos são persistidos. | `src/validators/participante.js` — `min(3)`; `src/models/participante.js` — ausente; idem para evento, certificado, usuario | IP | **Baixo** | Dados inválidos persistidos se o middleware Zod for bypassado; inconsistência de proteção entre layers | FR-3, FR-6, FR-18 | Adicionar `validate: { len: [3, ...] }` nos models Sequelize para campos com restrição de tamanho mínimo documentada |
| C-10 | Validação de `ano >= 2000` ausente no model Sequelize | FR-7 exige `ano >= 2000`. O Zod valida com `.gte(2000)` mas o model Sequelize não tem nenhum `validate` para este campo. | `src/validators/evento.js` — `ano: z.number().int().gte(2000)`; `src/models/evento.js` — sem validate em `ano` | IP | **Baixo** | Ano inválido (ex.: 0, negativos, anos futuros absurdos) pode ser persistido se Zod for bypassado | FR-7 | Adicionar `validate: { min: 2000 }` em `ano` no model Evento |
| C-11 | Campos de coordenadas de layout ausentes do Zod schema de evento | FR-48 define `texto_x`, `texto_y`, `validacao_x`, `validacao_y` como campos opcionais do evento. O `eventoSchema` Zod não os inclui, portanto não valida que sejam inteiros quando enviados via API. | `src/validators/evento.js` — schema não contém campos de coordenadas; FR-48 | GI | **Baixo** | Strings ou floats podem ser aceitas via Zod e persistidas como NULL ou causar erro no model; coordenadas inválidas quebram layout do PDF | FR-48 | Adicionar campos opcionais `.int().optional()` ao `eventoSchema` |
| C-12 | `url_template_base` sem validação de URL no model Sequelize | FR-44 exige URL válida ou null. O Zod valida com `.url()`, mas o model Sequelize não tem nenhuma validação para este campo — armazena qualquer string. | `src/validators/evento.js` — `url_template_base: z.string().url().optional().nullable()`; `src/models/evento.js` — `allowNull: true` sem validate | DT | **Baixo** | URLs malformadas podem ser persistidas se Zod for bypassado (ex.: formulário SSR sem validate) | FR-44 | Adicionar validação de URL no model ou documentar que validação é exclusivamente Zod |
| C-13 | Formato do código de certificado sem constraint no banco ou model | O formato `CODIGO_BASE-YY-TIPO-N` é gerado e garantido apenas pelo service. Nenhum `validate` ou constraint no model/banco impede valor em formato incorreto por UPDATE direto ou uso interno indevido. | `src/models/certificado.js` — `codigo: { unique: true }` sem regex; `src/services/certificadoService.js` — formato definido apenas por code generation | DT | **Baixo** | Risk de integridade referencial para validação pública caso código seja alterado manualmente | FR-52 | Adicionar `validate: { is: /regex/ }` no model Certificado para o formato de código |
| C-14 | `descricao` de TiposCertificados: Zod min(1) sem `notEmpty` no model | Zod valida `descricao: z.string().min(1)`. O model tem `allowNull: false` mas sem `validate: { notEmpty: true }`. String vazia `""` passa pelo model mas violaria a intenção do FR-12. | `src/validators/tipos_certificados.js` — `min(1)`; `src/models/tipos_certificados.js` — sem notEmpty em `descricao` | IP | **Baixo** | String vazia persistida se Zod bypassado; `texto_base` tem `notEmpty`, `descricao` não — inconsistência intra-model | FR-12 | Adicionar `validate: { notEmpty: true }` em `descricao` no model TiposCertificados |
| C-15 | Validação cross-field de `campo_destaque` ausente no Zod | A regra de que `campo_destaque` deve ser `"nome"` ou chave de `dados_dinamicos` está apenas no hook `beforeValidate` do Sequelize. O Zod valida somente `min(1)`. A regra de domínio mais importante deste campo não está expressa na camada de entrada. | `src/validators/tipos_certificados.js` — `campo_destaque: z.string().min(1)`; `src/models/tipos_certificados.js` — hook `beforeValidate` | VA | **Médio** | Inconsistência de profundidade de validação; erros de domínio retornam como erros 500 (Sequelize) em vez de 422 (validação de entrada) | FR-14 | Adicionar refinement Zod (`.superRefine`) para validação cross-field de `campo_destaque` com `dados_dinamicos` no validator, ou mover para o service com HTTP 422 |
| C-16 | Migration original de tipos_certificados criou unique global em `codigo` | A migration `20260311180308-create-tipos-certificados.js` criou `codigo: { unique: true }` globalmente. A migration `20260418232720` faz remoção condicional deste índice antes de criar o composto. Se a remoção falhar silenciosamente (ex.: nome diferente), o índice global pode coexistir com o composto, causando falsos positivos de unicidade. | `migrations/20260311180308-create-tipos-certificados.js` — `unique: true` em `codigo`; `migrations/20260418232720...` — remoção condicional por nome fixo `tipos_certificados_codigo_key` | ID | **Médio** | Em ambientes onde o índice global persiste, nenhum tipo com mesmo `codigo` pode existir em eventos diferentes, contrariando FR-11 | FR-11 | Verificar no banco de produção/test se o índice global foi removido; incluir check explícito na migration |

---

## 2. Problemas Críticos de Constraints

### 2.1 Colisão de código de certificado após soft-delete (C-02) — Bug Real / Crítico

**Cenário de falha:**
1. 5 certificados criados para o tipo `PT` do evento `EDC-26`: códigos `EDC-26-PT-1` a `EDC-26-PT-5`
2. Certificado `EDC-26-PT-3` é soft-deleted
3. `count()` com `paranoid: true` retorna `4` (exclui o deletado)
4. Próximo incremental = `4 + 1 = 5`
5. Gera código `EDC-26-PT-5` → colide com certificado existente → `UniqueConstraintError`

**Consequência:** O serviço de emissão de certificados se torna inoperante para qualquer tipo de certificado que tenha tido ao menos um registro soft-deleted.

---

### 2.2 Race condition na geração de código (C-01) — Bug Real / Crítico

**Cenário de falha:**
1. Duas requisições simultâneas para o mesmo `evento_id` e `tipo_certificado_id`
2. Ambas executam `count()` e obtêm `count = N`
3. Ambas calculam `incremental = N + 1` e geram código idêntico
4. Uma falha com `UniqueConstraintError` sem retry — resposta 500 sem explicação clara ao cliente

**Consequência:** Falha de integridade em condições normais de uso com múltiplos usuários simultaneamente.

---

### 2.3 Inconsistência entre partial index no model e constraint real no banco (C-05, C-06)

O model `TiposCertificados` declara um índice parcial com `where: { deleted_at: null }`, mas:
- A migration usa `addConstraint` (não `addIndex`), que **não suporta cláusula partial**
- Conforme NFR-5, o banco é gerenciado exclusivamente por migrations
- O índice declarado no model **nunca é aplicado ao banco**

A constraint real no banco inclui registros soft-deleted no escopo de unicidade, violando a semântica de NFR-4 (soft delete + restore).

---

### 2.4 Ausência de validação de senha forte na criação de usuário (C-03)

A policy de senha forte (`senhaForteSchema`) está implementada mas não é aplicada ao criar ou atualizar usuário via `usuarioSchema`. O validator usa `z.string().min(6)`, que aceita senhas como `"abc123"` ou `"password1"`.

---

### 2.5 Unique de email sem filtro de soft-delete — bloqueio de restauração (C-07)

Tanto participantes quanto usuários soft-deleted mantêm seu `email` ocupando o slot do índice único global. Isso impede:
- Criação de novo participante/usuário com o mesmo email
- Restauração de registros excluídos se outro com o mesmo email foi criado depois

Viola o fluxo esperado de NFR-4.

---

## 3. Backlog Arquitetural

### Curto Prazo (urgente — risco de integridade em produção)

- **[C-01]** Tornar a geração de código de certificado atômica: envolver `count + create` em uma transação `SERIALIZABLE` ou usar pessimistic locking
- **[C-02]** Corrigir o `count()` para incluir soft-deleted: `Certificado.count({ where: {...}, paranoid: false })` — ou preferir buscar o maior índice incremental atual pelo campo `codigo` via `MAX` ou regex
- **[C-03]** Aplicar `senhaForteSchema` na criação e atualização de usuário (substituir ou compor com `usuarioSchema`)

### Médio Prazo (risco de integridade latente)

- **[C-04]** Adicionar `.default('emitido')` no `certificadoSchema.status` para alinhar comportamento Zod × model
- **[C-05, C-06]** Criar migration substituindo `addConstraint` por `addIndex` com cláusula `WHERE deleted_at IS NULL` para a constraint composta de TiposCertificados; remover bloco `indexes` do model (NFR-5)
- **[C-07]** Criar migrations adicionando partial unique indexes `WHERE deleted_at IS NULL` para `email` em `participantes` e `usuarios`
- **[C-15]** Mover validação cross-field de `campo_destaque` para o layer de entrada (refinement Zod ou validação no service com HTTP 422)
- **[C-16]** Verificar e documentar estado do índice global de `codigo` em TiposCertificados; adicionar check na migration

### Longo Prazo (melhoria de robustez e consistência)

- **[C-08]** Avaliar se unique de `codigo` em certificados deve ser partial `WHERE deleted_at IS NULL`
- **[C-09]** Adicionar `validate: { len: [3, ...] }` nos models para campos com restrição `min(N)` documentada no SRS
- **[C-10]** Adicionar `validate: { min: 2000 }` em `ano` do model Evento
- **[C-11]** Incluir coordenadas de layout no `eventoSchema` como inteiros opcionais
- **[C-12]** Documentar explicitamente que `url_template_base` é validada apenas no Zod; ou adicionar validação no model
- **[C-13]** Adicionar `validate: { is: /regex/ }` ao campo `codigo` do model Certificado
- **[C-14]** Adicionar `validate: { notEmpty: true }` em `descricao` do model TiposCertificados

---

## 4. Atualizações Recomendadas no SRS

| Item | Justificativa |
|---|---|
| FR-52 deve especificar comportamento em caso de soft-delete no contador | A spec não define se o contador é baseado em registros ativos ou totais; a implementação usa ativos (paranoid), o que cria colisão — comportamento esperado deve ser explicitado |
| FR-57 deve referenciar também a criação de usuário, não apenas alteração de senha | A spec define senha forte apenas para `POST /admin/perfil/alterar-senha`, mas a criação de usuário deve igualmente aplicar a política |
| FR-11 deve especificar comportamento de unicidade composta com registros soft-deleted | Não fica claro se `(codigo, evento_id)` de tipo deletado bloqueia a criação de novo tipo com o mesmo par — a intenção de NFR-4 implica que não deve bloquear |
| FR-8 / FR-11 devem especificar o comportamento de unicidade de `codigo_base` e `(codigo, evento_id)` com soft-delete | Análogo ao item acima para eventoService |

---

## 5. Itens para Validação Humana

| VH | Questão | Contexto |
|---|---|---|
| VH-01 | O campo `campo_destaque` deve ser validado pela camada Zod antes de chegar ao hook Sequelize? | A falha atual retorna erro 500 (Sequelize) em vez de HTTP 422 — a decisão de onde validar tem impacto na UX da API |
| VH-02 | O `dados_dinamicos` deve aceitar objetos aninhados ou apenas campos planos (chave → valor)? | `z.record(z.any())` aceita qualquer estrutura; se houver restrição de profundidade, deve ser documentada no SRS |
| VH-03 | O contador incremental do código de certificado deve incluir ou excluir soft-deleted? | A escolha afeta a semântica de sequência; incluir soft-deleted resolve C-02 mas muda o comportamento esperado |
| VH-04 | A constraint `(codigo, evento_id)` de TiposCertificados deve permitir recriar um tipo após restauração do soft-deleted? | Define se o partial index é necessário ou se restaurar é o fluxo esperado |
| VH-05 | A política de senha forte deve aplicar-se a todos os usuários (incluindo admin criado por seed) ou apenas a self-service? | Impacto no processo de provisionamento inicial e nos seeds de banco |

---

## 6. Problemas Sistêmicos de Constraints

### 6.1 Inconsistência entre camadas de validação (Zod vs Sequelize)

Há um padrão recorrente de **validações presentes no Zod mas ausentes no model Sequelize**:

| Campo | Regra no Zod | Presente no Model |
|---|---|---|
| `nomeCompleto` (participante) | `min(3)` | ✗ |
| `nome` (evento) | `min(3)` | ✗ |
| `ano` (evento) | `gte(2000)` | ✗ |
| `nome` (certificado) | `min(3)` | ✗ |
| `nome` (usuario) | `min(3)` | ✗ |
| `descricao` (tipo) | `min(1)` | ✗ (sem notEmpty) |
| `url_template_base` (evento) | URL válida | ✗ |

O Zod é sempre a primeira linha de defesa, mas **nenhuma das regras de tamanho mínimo possui fallback no model**. Qualquer bypass do middleware `validate` (seed scripts, testes de service, uso interno) resulta em persistência de dados inválidos.

---

### 6.2 Duplicação/ausência de regras entre criação e atualização

O validator Zod é único e se aplica igualmente a `create` e `update`. Isso cria problemas:
- Em `update` de certificado, `status` sempre precisará ser enviado (Zod obrigatório)
- Em `update` de tipos_certificados, `campo_destaque` e `dados_dinamicos` precisam ser enviados juntos para o hook funcionar corretamente — mas não há validação de coerência no Zod

---

### 6.3 Fragilidade no mecanismo de geração de código de certificado

O design atual de geração de código (C-01 + C-02) tem dupla fragilidade:
1. **Race condition** por ausência de atomicidade
2. **Colisão após soft-delete** por exclusão de deletados no count

O mecanismo correto seria uma das alternativas:
- Sequence PostgreSQL dedicado por `(evento_id, tipo_certificado_id)` — garante atomicidade e inclui todos os registros
- `MAX` sobre o sufixo incremental do código via SQL (inclui soft-deleted) em transação SERIALIZABLE
- Tabela de controle de sequência por tipo/evento

---

### 6.4 Divergência entre banco real e definição de model

O model `TiposCertificados` define um partial index que **nunca foi criado no banco** (NFR-5 proíbe uso de `sync()`). O banco real tem uma UNIQUE CONSTRAINT simples sem filtro `WHERE`. Isso cria uma **falsa sensação de segurança** na leitura do código.

---

*Auditoria concluída em 2026-05-10 14:00 (BRT)*
