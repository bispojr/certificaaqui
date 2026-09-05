# Auditoria Técnica — Domínio: Models (Sequelize / ORM / Entidades)

**Auditoria:** 07 / Domínio 20  
**Data:** 2026-05-10 12:44 (BRT)  
**Auditor:** Arquiteto de Software Sênior (IA)  
**Escopo:** `src/models/*`, `config/database.js`, `src/models/index.js`  
**Fontes:** `docs/especificacoes.md`, `src/models/*`, `src/validators/*`

---

## Resumo Executivo

A análise cobre os seis models do sistema: `Certificado`, `Evento`, `Participante`, `TiposCertificados`, `Usuario` e `UsuarioEvento`. A estrutura geral é sólida — soft delete, timestamps e hooks críticos estão corretamente configurados. O principal problema sistêmico identificado é a **ausência de validações de tamanho mínimo no model layer**, presentes apenas no Zod. Isso é parcialmente mitigado pela arquitetura em camadas, mas cria um gap de proteção real para operações que bypassam a camada de validação (seeders, migrations com `bulkInsert`, inserções programáticas diretas).

Um segundo problema relevante é o `paranoid: true` na tabela de junção `usuario_eventos`, que cria riscos de inconsistência em operações de revinculação.

---

## 1. Matriz Consolidada de Achados

| ID   | Model             | Descrição                                                                                                                                 | Evidências                                                                                              | Tipo | Severidade        | Impacto                                                                                                                              | Requisitos Violados     | Destino Recomendado           |
| ---- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------- |
| M-01 | Evento            | `nome` sem validação de tamanho mínimo (≥3) no model Sequelize                                                                            | `nome: { type: DataTypes.STRING, allowNull: false }` — sem `validate: { len: [3, 255] }`                | GI   | Médio             | Strings vazias ou de 1–2 chars passam direto pelo model; Zod protege apenas na API                                                   | FR-6                    | Backlog — curto prazo         |
| M-02 | Evento            | `ano` sem validação de `>= 2000` no model Sequelize                                                                                       | `ano: { type: DataTypes.INTEGER, allowNull: false }` — sem `validate: { min: 2000 }`                    | GI   | Médio             | Anos inválidos (ex: 0, 1900) podem ser inseridos via seeder ou bulk insert                                                           | FR-7                    | Backlog — curto prazo         |
| M-03 | Evento            | `url_template_base` sem validação de URL no model Sequelize                                                                               | `url_template_base: { type: DataTypes.STRING, allowNull: true }` — sem `validate: { isUrl }`            | GI   | Baixo             | Strings inválidas no campo podem causar falha silenciosa na busca do arquivo no R2                                                   | FR-44                   | Backlog — médio prazo         |
| M-04 | Participante      | `nomeCompleto` sem validação de tamanho mínimo (≥3) no model Sequelize                                                                    | `nomeCompleto: { type: DataTypes.STRING, allowNull: false }` — sem `validate: { len: [3] }`             | GI   | Médio             | Nomes com 1–2 chars passam pelo model sem rejeição                                                                                   | FR-3                    | Backlog — curto prazo         |
| M-05 | Participante      | Campo `instituicao` presente no model mas ausente no SRS                                                                                  | `instituicao: { type: DataTypes.STRING, allowNull: true }` — sem correspondente no SRS                  | ID   | Baixo             | Campo não documentado; pode gerar confusão sobre escopo e obrigatoriedade                                                            | —                       | Atualizar SRS ou remover      |
| M-06 | TiposCertificados | `descricao` com `allowNull: false` mas sem validação `notEmpty` — string vazia `""` passa                                                 | `descricao: { type: DataTypes.STRING, allowNull: false }` — sem `validate: { notEmpty: true }`          | GI   | Alto              | Registro com `descricao: ""` é aceito pelo model, violando FR-12 (min 1 char)                                                        | FR-12                   | Backlog — curto prazo         |
| M-07 | TiposCertificados | `codigo` validate `is` sem mensagem de erro (`msg` ausente), inconsistente com Evento                                                     | `validate: { is: /^[A-Za-z]{2}$/ }` vs Evento com `is: { args: /.../, msg: '...' }`                     | DT   | Baixo             | Mensagem de erro genérica do Sequelize em vez de mensagem descritiva                                                                 | —                       | Backlog — longo prazo         |
| M-08 | Certificado       | `nome` sem validação de tamanho mínimo (≥3) no model Sequelize                                                                            | `nome: { type: DataTypes.STRING, allowNull: false }` — sem `validate: { len: [3, 255] }`                | GI   | Médio             | Nomes com 1–2 chars passam pelo model sem rejeição                                                                                   | FR-18                   | Backlog — curto prazo         |
| M-09 | Usuario           | `nome` sem validação de tamanho mínimo no model Sequelize (Zod define `min(3)`)                                                           | `nome: { type: DataTypes.STRING, allowNull: false }` — sem `validate`                                   | GI   | Médio             | Nomes inválidos passam pelo model direto                                                                                             | FR-26 (implícito)       | Backlog — curto prazo         |
| M-10 | UsuarioEvento     | `paranoid: true` em tabela de junção N:N — soft delete em associação cria risco de inconsistência em revinculações                        | `paranoid: true, deletedAt: 'deleted_at'` em `usuario_eventos.js`                                       | DT   | Alto              | Revinculação usuario+evento após deleção cria novo registro sem remover o soft-deleted anterior, podendo gerar duplicação silenciosa | FR-32                   | Backlog — médio prazo         |
| M-11 | UsuarioEvento     | Sem constraint `UNIQUE` composta em `(usuario_id, evento_id)` no model layer                                                              | Apenas `references` individuais; sem `indexes: [{ unique: true, fields: ['usuario_id', 'evento_id'] }]` | DT   | Médio             | Duplicação de vínculo usuario-evento possível via bulk insert ou race condition                                                      | FR-32                   | Backlog — curto prazo         |
| M-12 | TiposCertificados | Index UNIQUE composto `(codigo, evento_id)` com cláusula `where: { deleted_at: null }` — compatibilidade com Sequelize/PostgreSQL         | `indexes: [{ unique: true, fields: ['codigo', 'evento_id'], where: { deleted_at: null } }]`             | VH   | Médio             | Partial indexes funcionam no PostgreSQL mas podem não ser respeitados por Sequelize `findOrCreate`; requer validação                 | FR-11                   | Validação humana              |
| M-13 | Certificado       | `codigo` com `allowNull: false` no model — geração ocorre no service (FR-52). Dependência implícita — model rejeita `create()` sem código | `codigo: { type: DataTypes.STRING, allowNull: false, unique: true }`                                    | AM   | Baixo             | Se service não gerar código antes de `Certificado.create()`, ocorre erro de DB. Sem proteção/erro amigável no model layer            | FR-52                   | Documentar / validação humana |
| M-14 | Todos os models   | Validações de tamanho mínimo estão SOMENTE no Zod; ausentes no Sequelize. Gap sistemático de proteção na camada de persistência           | Zod: `z.string().min(3)` — Sequelize: sem `validate: { len }` em nenhum campo textual crítico           | GI   | Médio (sistêmico) | Operações que bypassam Zod (seeders, migrations, admin scripts) não têm barreira de validação no model                               | FR-3, FR-6, FR-7, FR-18 | Backlog — médio prazo         |

---

## 2. Problemas Críticos de Modelagem

Nenhum achado de severidade **Crítico** foi identificado. A modelagem estrutural está correta para os requisitos principais: soft delete configurado em todas as entidades, timestamps mapeados, hooks de hashing implementados corretamente, enum de `status` e `perfil` alinhados ao SRS.

Os problemas de maior severidade são:

### M-06 — `descricao` de TiposCertificados aceita string vazia (Alto)

```js
// Atual — aceita ""
descricao: {
  type: DataTypes.STRING,
  allowNull: false,
}

// Corrigido — rejeita ""
descricao: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    notEmpty: {
      msg: 'O campo descricao é obrigatório e não pode ser vazio.',
    },
  },
},
```

### M-10 — `paranoid: true` em tabela de junção (Alto)

A tabela `usuario_eventos` com `paranoid: true` cria registros com `deleted_at` preenchido ao invés de deletar fisicamente. O risco concreto: ao tentar revincular um par `(usuario_id, evento_id)` já soft-deletado, Sequelize pode criar um segundo registro sem limpar o anterior, especialmente em operações `bulkCreate` ou `set/add` nas associações `belongsToMany`. Isso é uma dívida técnica de modelagem que pode evoluir para inconsistência real de dados.

---

## 3. Backlog de Correções

### Curto prazo (imediato)

- [ ] **M-06** — Adicionar `validate: { notEmpty }` em `TiposCertificados.descricao`
- [ ] **M-01** — Adicionar `validate: { len: [3, 255] }` em `Evento.nome`
- [ ] **M-02** — Adicionar `validate: { min: 2000 }` em `Evento.ano`
- [ ] **M-04** — Adicionar `validate: { len: [3, 255] }` em `Participante.nomeCompleto`
- [ ] **M-08** — Adicionar `validate: { len: [3, 255] }` em `Certificado.nome`
- [ ] **M-09** — Adicionar `validate: { len: [3, 255] }` em `Usuario.nome`
- [ ] **M-11** — Adicionar index UNIQUE composto `(usuario_id, evento_id)` em `UsuarioEvento`

### Médio prazo

- [ ] **M-10** — Avaliar remoção de `paranoid` da tabela `usuario_eventos`. Tabelas de junção N:N tipicamente usam deleção física. Se soft delete é necessário para auditoria, adicionar constraint para prevenir duplicação ativa do mesmo par.
- [ ] **M-03** — Adicionar `validate: { isUrl: true }` em `Evento.url_template_base`
- [ ] **M-14** — Revisar estratégia: centralizar validações críticas de tamanho também no Sequelize, especialmente para entidades que podem ser populadas via seeders ou scripts administrativos.

### Longo prazo

- [ ] **M-07** — Padronizar mensagens de erro nos validates de `is` em todos os models (seguir padrão de `Evento` com `{ args, msg }`)
- [ ] **M-05** — Decidir sobre `Participante.instituicao`: documentar no SRS ou remover

---

## 4. Atualizações Recomendadas no SRS

### 4.1 Campo `instituicao` em Participante (M-05)

O campo `instituicao` existe no model `Participante` e no validator Zod (`z.string().min(2).optional()`), mas não é mencionado em nenhum requisito funcional do SRS. Recomenda-se:

> **Adicionar ao SRS:** `FR-3b: O campo \`instituicao\` do participante é opcional. Quando informado, deve ter no mínimo 2 caracteres.`

### 4.2 Validações no model layer vs. Zod (M-14)

O SRS (NFR-6) define que lógica de negócio não deve residir em models. Contudo, validações de integridade de dados (tamanhos mínimos, formatos de campo) são responsabilidade do model layer e não são lógica de negócio no sentido estrito. Recomenda-se aclarar no SRS qual o nível de validação esperado no Sequelize:

> **Proposta de adição:** `NFR-6b: Validações de integridade estrutural (allowNull, tamanho mínimo, formato de campo) devem ser implementadas no Sequelize além de no Zod, para proteger a camada de persistência contra operações que bypassam a API.`

---

## 5. Itens para Validação Humana

### VH-01 — M-12: Partial Index no Sequelize

O index `tipos_certificados_codigo_evento_id_key` usa `where: { deleted_at: null }`, criando um partial index no PostgreSQL (FR-11). Este index funciona corretamente a nível de banco, mas Sequelize pode não respeitar a condição `where` ao fazer `findOrCreate` ou verificações de unicidade via ORM. **Validar:** nos testes de integração, confirmar que dois registros soft-deletados com mesmo `(codigo, evento_id)` não impedem criação de novo registro ativo.

### VH-02 — M-10: Estratégia de soft delete em `usuario_eventos`

Decidir se `usuario_eventos` deve ser `paranoid: true` (auditoria de histórico de vínculos) ou deleção física (simplicidade e integridade). Se mantido `paranoid`, adicionar migration para criar constraint UNIQUE que exclua registros com `deleted_at IS NOT NULL`.

### VH-03 — M-13: Dependência implícita `Certificado.create()` → código gerado no service

Confirmar que todos os fluxos de criação de certificado passam pelo service de geração de código antes de chegar ao `Certificado.create()`. Especificamente verificar: testes unitários de model, seeders e eventuais scripts administrativos.

---

## 6. Problemas Sistêmicos de Modelagem

### 6.1 Gap de defesa em profundidade nas validações (M-14)

O sistema usa Zod para validação na camada de entrada (API) e Sequelize para persistência. Porém, o Sequelize não replica validações de tamanho mínimo presentes no Zod. Isso configura **single layer of defense** nas validações de negócio: qualquer operação que bypasse o middleware `validate` (ex: seeder, script de importação, teste unitário de model) persiste dados inválidos sem erro. A correção é adicionar `validate` no Sequelize para campos com tamanho mínimo definido no SRS.

**Afetados:** `Evento.nome`, `Evento.ano`, `Participante.nomeCompleto`, `Certificado.nome`, `Usuario.nome`, `TiposCertificados.descricao`

### 6.2 Inconsistência de padrão entre models similares

O model `Evento` usa `validate: { is: { args, msg } }` com mensagem descritiva, enquanto `TiposCertificados` usa `validate: { is: /regex/ }` sem mensagem. Outros campos como `Evento.nome` não têm nenhum `validate`. Há pelo menos três padrões distintos de validação no model layer, o que dificulta manutenção.

### 6.3 FKs declaradas inconsistentemente

`TiposCertificados.evento_id` e `UsuarioEvento.usuario_id/evento_id` declaram `references` explícitos no model. Os campos FK de `Certificado` (`participante_id`, `evento_id`, `tipo_certificado_id`) **não declaram** `references`. Embora Sequelize crie as FKs via associações em memória, a ausência de `references` no model pode causar divergência entre o model e a migration se as associações forem refatoradas.

---

## Referência: Cada Model vs. SRS

| Model             | Campos OK                  | Validações ausentes no Sequelize                              | Hooks corretos               | Soft Delete     | Timestamps |
| ----------------- | -------------------------- | ------------------------------------------------------------- | ---------------------------- | --------------- | ---------- |
| Evento            | ✅ Todos presentes         | `nome` (len≥3), `ano` (min≥2000), `url_template_base` (isUrl) | N/A                          | ✅ paranoid     | ✅         |
| Participante      | ✅ + `instituicao` não-SRS | `nomeCompleto` (len≥3)                                        | N/A                          | ✅ paranoid     | ✅         |
| TiposCertificados | ✅ Todos presentes         | `descricao` (notEmpty)                                        | ✅ beforeValidate            | ✅ paranoid     | ✅         |
| Certificado       | ✅ Todos presentes         | `nome` (len≥3)                                                | N/A                          | ✅ paranoid     | ✅         |
| Usuario           | ✅ Todos presentes         | `nome` (len≥3), `senha` (min≥6)                               | ✅ beforeCreate/beforeUpdate | ✅ paranoid     | ✅         |
| UsuarioEvento     | ✅ Todos presentes         | —                                                             | N/A                          | ⚠️ questionável | ✅         |
