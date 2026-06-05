# Auditoria Técnica — Domínio: Relacionamentos (ORM Associations)

**Sistema:** Certifique-me  
**Versão SRS:** 2.0  
**Data da auditoria:** 2026-05-10  
**Auditor:** GitHub Copilot (arquiteto sênior)  
**Escopo:** Associações Sequelize, join tables, foreign keys, cardinalidade, aliases, eager loading estrutural

---

## Fontes Analisadas

| Fonte | Lida |
|---|---|
| `docs/especificacoes.md` | ✓ |
| `src/models/certificado.js` | ✓ |
| `src/models/evento.js` | ✓ |
| `src/models/participante.js` | ✓ |
| `src/models/tipos_certificados.js` | ✓ |
| `src/models/usuario.js` | ✓ |
| `src/models/usuario_eventos.js` | ✓ |
| `src/models/index.js` | ✓ |
| `src/services/certificadoService.js` | ✓ |
| `src/services/eventoService.js` | ✓ |
| `src/services/pdfService.js` | ✓ |
| `src/services/participanteService.js` | ✓ |
| `src/services/tiposCertificadosService.js` | ✓ |
| `src/controllers/certificadoController.js` | ✓ |
| `src/controllers/certificadoSSRController.js` | ✓ |
| `src/controllers/dashboardController.js` | ✓ |
| `src/controllers/eventoSSRController.js` | ✓ |
| `src/controllers/participanteSSRController.js` | ✓ |
| `src/controllers/usuarioController.js` | ✓ |
| `src/controllers/usuarioSSRController.js` | ✓ |
| `src/controllers/tiposCertificadosSSRController.js` | ✓ |
| `src/middlewares/auth.js` | ✓ |
| `src/middlewares/authSSR.js` | ✓ |
| `src/middlewares/scopedEvento.js` | ✓ |
| `src/middlewares/tiposCertificadosOwnership.js` | ✓ |
| `src/routes/api.js` | ✓ |
| `src/routes/certificados.js` | ✓ |
| `src/routes/tipos-certificados.js` | ✓ |

---

## Mapa de Relacionamentos Implementados

```
Participante ─── hasMany ──────────────────────► Certificado
                                                      │
Evento ──────── hasMany ──────────────────────► Certificado
                                                      │
TiposCertificados ─ hasMany ─────────────────► Certificado

Certificado ─── belongsTo ───────────────────► Participante
Certificado ─── belongsTo ───────────────────► Evento
Certificado ─── belongsTo (as: 'TiposCertificados') ► TiposCertificados

Evento ──────── hasMany ──────────────────────► TiposCertificados (as: 'tiposCertificados')
TiposCertificados ─ belongsTo (as: 'evento') ► Evento

Evento ──────── belongsToMany ────────────────► Usuario
                (through: UsuarioEvento, as: 'usuarios')
Usuario ─────── belongsToMany ────────────────► Evento
                (through: UsuarioEvento, as: 'eventos')
```

---

## 1. Matriz Consolidada de Achados

| ID | Relacionamento | Descrição | Evidências | Tipo | Severidade | Impacto | Requisitos Violados | Destino Recomendado |
|---|---|---|---|---|---|---|---|---|
| REL-01 | Certificado → TiposCertificados | Alias singular `TiposCertificado` usado em lugar do alias declarado `TiposCertificados` (plural) | `certificadoSSRController.js:110` usa `certificado.TiposCertificado?.texto_base` | BR | Alto | Texto interpolado sempre vazio na interface SSR de detalhe do certificado | FR-39 (interpolação de texto) | Corrigir no curto prazo |
| REL-02 | Certificado → TiposCertificados | `pdfService.js` contém workaround `TiposCertificado \|\| TiposCertificados` como defesa contra ambiguidade de alias | `pdfService.js:79` | IP | Médio | Código defensivo que mascara o bug REL-01 no contexto do PDF; pode gerar falsos negativos | FR-42 (geração de PDF) | Corrigir junto com REL-01 |
| REL-03 | Certificado → Participante / Evento | `Certificado.belongsTo(Participante)` e `Certificado.belongsTo(Evento)` sem alias explícito (`as:`), diferente do padrão usado para `TiposCertificados` | `certificado.js:7-10` | DT | Baixo | Inconsistência de naming: includes com e sem alias na mesma entidade; risco de manutenção | – | Médio prazo |
| REL-04 | Todos | Nenhuma associação ORM define `onDelete`/`onUpdate` | Todos os `belongsTo`/`hasMany` em `*.js` | DT | Médio | Em operações de hard delete (nunca usadas hoje, mas possíveis via migrations/admin), FKs não propagam ação. Risco latente | NFR-4 (soft delete) | Médio prazo |
| REL-05 | Usuario ↔ Evento (UsuarioEvento) | Tabela pivot `usuario_eventos` tem `paranoid: true` (soft delete), comportamento atípico para join tables Sequelize | `usuario_eventos.js:25` | DT | Médio | Queries `belongsToMany` podem incluir/excluir linhas soft-deleted dependendo da versão do Sequelize e configuração; restauração de evento restaura associações automaticamente | FR-32 (vinculação N:N) | Médio prazo (documentar ou remover paranoid da pivot) |
| REL-06 | Usuario ↔ Evento (UsuarioEvento) | `UsuarioEvento.associate()` vazio — join table não declara associações para seus parents | `usuario_eventos.js:8` | ID | Baixo | Impossibilidade de fazer includes a partir de `UsuarioEvento` diretamente; sem impacto funcional hoje | NFR-7 (carregamento explícito) | Longo prazo |
| REL-07 | Participante → Evento (implícito) | Isolamento multi-tenant de Participantes é feito via JOIN implícito através de Certificado, sem associação formal | `participanteSSRController.js:34-41` | DT | Médio | Padrão implícito não óbvio; quebra ao refatorar sem conhecer a dependência; acoplamento escondido | FR-37 (scopedEvento) | Médio prazo (documentar no SRS) |
| REL-08 | Participante ↔ Evento | SRS não explicita cardinalidade entre Participante e Evento; relação é inferida via Certificado | `docs/especificacoes.md` — ausência | ID | Baixo | Ambiguidade para novos desenvolvedores sobre como participantes se relacionam com eventos | – | Atualização do SRS |
| REL-09 | eventoService.restore() | Restauração de evento restaura todas as associações `UsuarioEvento`, mesmo que o usuário vinculado esteja soft-deleted | `eventoService.js:50-55` | IP | Médio | Ghost associations: usuário deletado pode ter vínculo de evento ativo/restaurado → possível leakage de acesso | FR-32, FR-37 | Curto prazo |
| REL-10 | scopedEvento / tiposCertificadosOwnership | Middleware `tiposCertificadosOwnership` usa `usuario.getEventos()` sem fallback para plain objects | `tiposCertificadosOwnership.js:31-33` (hard return 500 se método ausente) | IP | Alto | Se auth mudar para retornar plain object ou em contexto diferente, retorna HTTP 500; middleware `scopedEvento` tem o mesmo padrão | FR-37, FR-38 | Curto prazo |
| REL-11 | Certificado (API pública) | `GET /api/certificados?email=...` retorna certificados sem eager loading de Evento, Participante ou TiposCertificados | `api.js:118-121` | IP | Baixo | Consumidores da API recebem apenas FK IDs sem dados úteis de contexto | FR-53 (consulta pública por email) | Médio prazo |

---

## 2. Problemas Críticos de Relacionamento

### REL-01 — Bug de alias causa exibição vazia na tela de detalhe (Alto)

**Relacionamento:** `Certificado → TiposCertificados` via `as: 'TiposCertificados'`

**Descrição:**

O modelo `Certificado` declara:

```js
Certificado.belongsTo(models.TiposCertificados, {
  foreignKey: 'tipo_certificado_id',
  as: 'TiposCertificados',   // alias = plural
})
```

O `certificadoSSRController.js` (função `detalhe`) faz:

```js
const textoInterpolado = templateService.interpolate(
  certificado.TiposCertificado?.texto_base || '',  // ← singular, ERRADO
  ...
)
```

Como o alias Sequelize é `TiposCertificados` (plural), `certificado.TiposCertificado` será sempre `undefined`. O texto interpolado será sempre string vazia na interface SSR.

**Evidência de reação no código:**

`pdfService.js:79` contém workaround defensivo:
```js
const tipo = certificado.TiposCertificado || certificado.TiposCertificados
```

Esta defesa mascara o problema no PDF, mas não corrige a view SSR.

**Impacto:** Violação do FR-39 (interpolação de texto); exibição incorreta na interface administrativa.

---

### REL-09 — Ghost associations após restauração de evento (Médio/potencial Crítico)

**Relacionamento:** `Evento ↔ Usuario` via `UsuarioEvento` (N:N)

**Descrição:**

`eventoService.restore()`:
```js
await evento.restore()
await UsuarioEvento.restore({ where: { evento_id: id } })
```

Quando um evento é restaurado, todas as associações `UsuarioEvento` para aquele `evento_id` são restauradas indiscriminadamente — incluindo vínculos com usuários que foram **soft-deleted** após a remoção do evento.

**Impacto:** Usuário deletado pode ter acesso restaurado aos dados do evento via `scopedEvento`, quebrando o isolamento de acesso.

**Requisitos violados:** FR-32 (vínculos N:N coerentes), FR-37 (scopedEvento).

---

### REL-10 — Middleware sem fallback causa HTTP 500 em contexto SSR (Alto)

**Relacionamento:** `Usuario → Evento` via `belongsToMany`

**Descrição:**

`tiposCertificadosOwnership.js`:
```js
if (typeof usuario.getEventos !== 'function') {
  return res.status(500).json({ error: 'Usuário sem método getEventos (modelo N:N)' })
}
```

Atualmente, o middleware é usado apenas em rotas API (com `auth.js` que retorna instância Sequelize com `getEventos()`). Porém:

1. Se reutilizado em contexto SSR (onde `authSSR.js` retorna plain object), retornará 500.
2. O `tiposCertificadosSSRController.js` já implementou fallback para esse caso, indicando que o cenário é real.
3. O middleware `scopedEvento` tem o mesmo padrão sem fallback.

**Impacto:** Fragilidade arquitetural; qualquer mudança de contexto de auth quebra os middlewares de ownership.

---

## 3. Backlog Arquitetural

### Curto prazo

- **[REL-01]** Corrigir alias `TiposCertificado` → `TiposCertificados` em `certificadoSSRController.js:110`
- **[REL-02]** Remover workaround dual-alias em `pdfService.js:79` após corrigir REL-01
- **[REL-09]** Adicionar validação em `eventoService.restore()` para não restaurar `UsuarioEvento` de usuários soft-deleted
- **[REL-10]** Adicionar fallback `UsuarioEvento.findAll` em `tiposCertificadosOwnership.js` (padrão do SSR controller)

### Médio prazo

- **[REL-04]** Definir `onDelete: 'RESTRICT'` ou `onDelete: 'CASCADE'` explicitamente em todas as associações ORM para tornar o comportamento auditável
- **[REL-05]** Avaliar remoção de `paranoid: true` da tabela pivot `usuario_eventos` ou documentar explicitamente a decisão arquitetural (ver `docs/decisoes/`)
- **[REL-07]** Documentar no SRS o padrão de filtragem de Participantes por evento via JOIN em Certificado
- **[REL-03]** Padronizar aliases explícitos em todas as associações de `Certificado` (`as: 'Participante'`, `as: 'Evento'`)
- **[REL-11]** Avaliar adição de eager loading na rota pública `GET /api/certificados?email=...` para enriquecer a resposta

### Longo prazo

- **[REL-06]** Adicionar associações explícitas em `UsuarioEvento.associate()` para facilitar queries a partir da join table
- **[REL-08]** Atualizar SRS com diagrama formal de cardinalidade entre todas as entidades

---

## 4. Atualizações Recomendadas no SRS

### 4.1 Cardinalidade Participante ↔ Evento (ID — REL-08)

**Seção sugerida:** Arquitetura do Sistema > Componentes Principais

Adicionar nota explícita:

> Participantes não possuem vínculo direto com Eventos. A associação é inferida através dos Certificados: um Participante pertence ao escopo de um Evento se possuir ao menos um Certificado com aquele `evento_id`. Não há tabela pivot `participante_eventos`.

### 4.2 Comportamento de Restauração de Evento (IP — REL-09)

**Seção sugerida:** FR-9 (remoção lógica de eventos)

Adicionar sub-requisito:

> FR-9a: Ao restaurar um evento, apenas as associações `usuario_eventos` cujos usuários **não estejam soft-deleted** devem ser restauradas.

### 4.3 Soft Delete na Tabela Pivot (DT — REL-05)

**Seção sugerida:** NFR-4 (Soft Delete) ou nova decisão arquitetural

Documentar:

> A tabela `usuario_eventos` possui `paranoid: true`. Vínculos deletados são preservados para auditoria e restauração coordenada com eventos. Decisão arquitetural registrada em `docs/decisoes/`.

---

## 5. Itens para Validação Humana

| Item | Relacionamento | Questão | Risco |
|---|---|---|---|
| VH-01 | UsuarioEvento (paranoid) | É intencional manter `paranoid: true` na tabela pivot? Sequelize pode ter comportamentos sutis em N:N com soft delete na pivot | Médio |
| VH-02 | Participante ↔ Evento | A cardinalidade implícita (Participante→Evento via Certificado) é suficiente ou é necessária uma relação direta N:N para relatórios futuros? | Médio |
| VH-03 | onDelete / onUpdate | Qual é o comportamento esperado se um hard delete for executado diretamente no banco, fora do ORM? FK violation ou cascade? | Alto |
| VH-04 | eventoService.restore() | A restauração automática de vínculos `usuario_eventos` é comportamento desejado ou deve ser manual? | Alto |

---

## 6. Problemas Sistêmicos de Relacionamento

### 6.1 Inconsistência de padrão de alias em Certificado

O modelo `Certificado` define dois `belongsTo` sem alias e um `belongsTo` com alias explícito (`as: 'TiposCertificados'`). Isso cria comportamento inconsistente:

- Includes para `Participante` e `Evento` **não devem** usar `as:` nos includes
- Include para `TiposCertificados` **deve** usar `as: 'TiposCertificados'`

Este padrão misto levou diretamente ao bug REL-01 (acesso via alias errado). A recomendação é padronizar todos com alias explícitos e uniformes.

### 6.2 Dependência de método ORM em middlewares de autenticação

Dois middlewares de segurança críticos (`scopedEvento`, `tiposCertificadosOwnership`) dependem de `req.usuario.getEventos()` — método disponível apenas em instâncias Sequelize. Essa dependência implícita cria acoplamento oculto entre a camada de autenticação e a camada de autorização.

A presença do workaround em `tiposCertificadosSSRController.js` evidencia que o comportamento real diverge do esperado em algum contexto.

### 6.3 Restauração de associações sem validação de estado dos parents

O padrão `eventoService.destroy()` / `eventoService.restore()` gestão coordenada de `UsuarioEvento`, porém sem verificar o estado dos usuários vinculados. Isso pode resultar em referências "zumbi" (associações válidas com usuários deletados), potencialmente comprometendo o isolamento multi-tenant.

### 6.4 Ausência de definição formal de comportamento referencial

Nenhuma associação do ORM define `onDelete` / `onUpdate`. Isso significa que o comportamento referencial é exclusivamente determinado pelo banco de dados (PostgreSQL, via constraints das migrations), sem reflexão na camada ORM. Qualquer desenvolvedor lendo apenas os models não consegue inferir o comportamento referencial completo.

---

## Resumo Executivo

| Categoria | Quantidade |
|---|---|
| Bug Real (BR) | 1 (REL-01) |
| Implementação Parcial (IP) | 3 (REL-02, REL-09, REL-10) |
| Dívida Técnica (DT) | 5 (REL-03, REL-04, REL-05, REL-07, REL-11) |
| Inconsistência Documental (ID) | 2 (REL-06, REL-08) |
| **Total** | **11** |

| Severidade | Quantidade |
|---|---|
| Alto | 2 (REL-01, REL-10) |
| Médio | 5 (REL-02, REL-04, REL-05, REL-07, REL-09) |
| Baixo | 4 (REL-03, REL-06, REL-08, REL-11) |

**Ação imediata recomendada:** Corrigir REL-01 (bug de alias em `certificadoSSRController.js`) e REL-09 (ghost associations na restauração de evento). Ambos têm impacto funcional direto.
