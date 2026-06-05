# ADR 010 — Modelo de Scoping de Participantes sem Associação Direta com Evento

**Data:** 2026-05-16  
**Autor:** Arquiteto de Software Principal  
**Contexto de origem:** Super Triagem Arquitetural Final — Rodada 07 (STF-004, STF-037, STF-038, PST-01)  
**Dependente de:** ADR-009 (Estratégia Canônica de Enforcement Multi-tenant)

---

## Status

Aprovado

---

## Contexto

O Certifique-me é um sistema multi-tenant implícito onde gestores e monitores operam dentro do escopo de eventos específicos (FR-37). A ADR-009 definiu que o enforcement de multi-tenancy deve ocorrer na camada de service, com `eventoIds` passado explicitamente pelos controllers.

No entanto, a ADR-009 identificou explicitamente um bloqueador para o domínio de participantes: **o model `Participante` não possui `evento_id`**. Participantes são entidades globais no schema atual — sua relação com eventos é indireta, mediada exclusivamente pela tabela `certificados`.

O schema atual do banco apresenta o seguinte relacionamento:

```
participantes  ←──────  certificados  ───────→  eventos
   (id, ...)             (participante_id,        (id, ...)
                          evento_id, ...)
```

Não existe vínculo direto entre `participantes` e `eventos`. Toda associação passa por `certificados`.

O sistema possui dois perfis de usuário com escopo restrito a eventos (FR-35, FR-36): **gestor** e **monitor**. Ambos precisam — segundo FR-36 e FR-37 — operar sobre participantes `dos seus eventos`. Por ausência de `evento_id` em `participantes`, essa restrição não pode ser expressa como `WHERE evento_id IN [...]` diretamente na tabela de participantes.

A implementação atual contornou esse problema com um JOIN em `certificados` na listagem SSR, o que produziu o achado STF-038: **participantes sem certificados desaparecem da listagem do gestor/monitor**, violando FR-36 e FR-49. A listagem via API (STF-004) não aplica filtro algum — expõe todos os participantes de todos os tenants.

---

## Problema

O modelo de dados atual cria uma tensão arquitetural irreconciliável com os requisitos de escopo:

### Tensão 1 — Participante como entidade global vs. requisito de scoping

FR-36 e FR-37 exigem que gestores/monitores visualizem e gerenciem apenas participantes dos seus eventos. O model `Participante` não carrega `evento_id`, logo:

- **Scoping via JOIN em `certificados`** (implementação atual): exclui participantes sem certificados. Um participante cadastrado, mas ainda não certificado em nenhum evento do gestor, torna-se invisível. STF-038 documenta o impacto direto de FR-36 e FR-49.
- **Sem scoping** (listagem API atual): todos os participantes de todos os tenants são expostos. STF-004 documenta vazamento massivo de PII (nome, e-mail, instituição).

Qualquer solução parcial produz um comportamento incorreto: ou exclui participantes legítimos ou vaza dados de outros tenants.

### Tensão 2 — Operações por ID sem âncora de evento

Para operações SSR por ID (editar, atualizar, deletar, restaurar), o STF-037 documenta ausência total de verificação de escopo. Sem `evento_id` em `participantes`, a única forma de verificar ownership é via JOIN em `certificados` — o que, novamente, exclui participantes sem certificados e introduz semântica inconsistente: um participante sem certificados em um evento não pode ser editado pelo gestor daquele evento, mas pode ser visto via outro mecanismo.

### Tensão 3 — Ambiguidade de ownership conceitual

O SRS não define explicitamente o conceito de "participante de um evento". FR-1-FR-4 tratam participantes como entidade independente (CRUD global). FR-36 declara que monitores "listam e visualizam certificados e participantes dos seus eventos" — mas não define formalmente o que constitui "participante do evento" em termos de schema.

Essa ambiguidade é a raiz do problema: o sistema não tomou uma decisão de produto sobre se um participante pertence a um evento pela existência de um certificado, por cadastro explícito no evento, ou se participantes são genuinamente globais.

---

## Decisão

**Adotar a Alternativa A** — tabela de junção `participante_eventos` com vínculo explícito entre participante e evento.

Decisão confirmada pelo stakeholder de produto em 2026-05-16. As três questões de produto foram respondidas e registradas:

| Questão | Decisão do produto |
|---------|-------------------|
| Participante sem certificado é visível na listagem do gestor/monitor? | **Sim** — visibilidade via `participante_eventos`, independente de certificados |
| Gestor/monitor vincula o participante ao evento no momento da criação? | **Sim** — vínculo explícito em `participante_eventos` é criado na criação do participante; o lookup por e-mail é o mecanismo: se participante já existe, cria apenas o vínculo; se não existe, cria o participante e o vínculo |
| Exclusão de participante por gestor remove o quê? | **Apenas o vínculo** (`participante_eventos`) — o participante permanece globalmente; certificados em outros eventos não são afetados |

**Justificativa da escolha:**

- É a única alternativa que resolve simultaneamente STF-004, STF-037 e STF-038.
- Participante é entidade global (e-mail único no sistema), reutilizável entre eventos — o vínculo contextual fica em `participante_eventos`.
- O vínculo é o registro de responsabilidade LGPD: o gestor que cria o vínculo declara ter base legal para tratar aqueles dados naquele evento.
- Exclusão restrita ao vínculo preserva dados de responsabilidade de outros gestores — alinhada com LGPD.
- Segue o padrão N:N já estabelecido no projeto via `usuario_eventos` (ADR-005).

---

## Alternativas Consideradas

### Alternativa A — Criar tabela de junção `participante_eventos` (recomendada)

Adicionar tabela `participante_eventos` com colunas `participante_id` e `evento_id`, analogamente à tabela `usuario_eventos` (ADR-005). O vínculo explícito seria criado no momento do cadastro do participante em um evento.

**Trade-offs positivos:**
- Permite `WHERE evento_id IN [...]` via JOIN em `participante_eventos` sem depender de certificados.
- Participantes sem certificados são visíveis ao gestor/monitor do evento ao qual foram vinculados.
- Consistência semântica: o conceito de "participante do evento" tem representação direta no schema.
- Alinhamento com o padrão já adotado no projeto para vínculos N:N (ADR-005).
- Permite metadados adicionais no vínculo futuramente (ex.: `papel_no_evento`, `carga_horaria`).

**Trade-offs negativos:**
- Impacto em migrações: nova tabela `participante_eventos`, nova migration.
- Impacto no model `Participante` e model `Evento`: novos relacionamentos `BelongsToMany`.
- Impacto em controllers e services: operações de criação de participante precisam registrar o vínculo; operações de listagem precisam JOIN na nova tabela.
- Impacto em testes existentes: fixtures e testes de participante precisam incluir vínculos.
- Ambiguidade de ownership ao criar participante via API diretamente (sem contexto de evento explícito no request).

**Condição de viabilidade:** O fluxo de criação de participante precisa definir em qual evento o participante está sendo cadastrado. Para gestores/monitores, isso pode ser derivado dos seus `eventoIds`. Para admins, o `evento_id` precisaria ser fornecido explicitamente.

---

### Alternativa B — Aceitar participantes como entidade global; scoping apenas em certificados

Manter o schema atual sem `evento_id` em `participantes`. Definir formalmente que gestores/monitores visualizam participantes que possuem **ao menos um certificado em seus eventos**. O scoping é aplicado via JOIN em `certificados`.

**Trade-offs positivos:**
- Não requer migração de schema.
- Semanticamente simples: "participante do evento" = "participante com certificado no evento".
- Nenhum impacto em models ou migrations além de corrigir a query de listagem.

**Trade-offs negativos:**
- **Viola FR-36 e FR-49**: participantes cadastrados sem certificados são invisíveis na listagem do gestor/monitor.
- **Viola STF-038**: o bug documentado pela triagem seria aceitado como comportamento esperado — requer decisão explícita de produto para descartar FR-36 e FR-49 como entendidos atualmente.
- Operações por ID (editar, deletar) permanecem sem âncora de scoping confiável: um participante pode ter certificados em múltiplos eventos, tornando ambíguo quem tem ownership.
- Cria inconsistência entre o que o gestor pode listar e o que pode editar.
- Não resolve STF-004 (listagem API sem filtro) sem alterar a query do service de qualquer forma.

**Condição de viabilidade:** Requer decisão explícita de produto de que participantes sem certificados não compõem o escopo de visibilidade de gestores/monitores — aceitando FR-36 como parcialmente insatisfeito.

---

### Alternativa C — Adicionar coluna `evento_id` diretamente em `participantes`

Adicionar uma FK `evento_id` nullable na tabela `participantes`, definindo um "evento principal" para o participante.

**Trade-offs positivos:**
- Permite `WHERE evento_id IN [...]` diretamente em `participantes`.
- Scoping simples e direto no service, análogo a outros domínios.

**Trade-offs negativos:**
- **Semanticamente incorreto para o domínio**: um participante real pode participar de múltiplos eventos. FK única implica que um participante pertence a exatamente um evento, o que contradiz a existência de múltiplos certificados por participante em eventos distintos.
- `NULL` para participantes não vinculados gera ambiguidade de scoping: admins veem todos, gestores veem apenas os seus, mas participantes `NULL` ficam em limbo.
- Não segue o padrão N:N adotado no projeto (ADR-005) para vínculos usuário-evento.
- Semanticamente equivalente a uma versão degradada da Alternativa A sem suporte a N:N.

**Rejeitada** por ser inferior à Alternativa A em flexibilidade e correção semântica.

---

### Alternativa D — Row-Level Security no PostgreSQL

Aplicar políticas RLS na tabela `participantes` usando um JOIN implícito com `participante_eventos` ou `certificados`.

**Rejeitada** pelos mesmos motivos da ADR-009: incompatível com o modelo de pool único do Sequelize; complexidade operacional desproporcional; não resolve as ambiguidades semânticas de ownership.

---

## Consequências

### Positivas (Alternativa A — recomendada)

- Resolve STF-004 (listagem API sem filtro de evento) de forma definitiva.
- Resolve STF-037 (operações SSR por ID sem verificação de escopo).
- Resolve STF-038 (participantes sem certificados invisíveis na listagem).
- Participantes sem certificados passam a ser visíveis e gerenciáveis no contexto de seu evento.
- Modelo de dados coerente com o padrão N:N já estabelecido no projeto.
- `participanteService.findAll()` e operações por ID podem usar `WHERE evento_id IN [...]` via JOIN em `participante_eventos`, alinhando-se com o contrato de `eventoIds` da ADR-009.

### Negativas (Alternativa A — recomendada)

- Impacto transversal em migrations, models, services, controllers (API e SSR) e testes.
- A criação de participante precisa ser contextualizada por evento — mudança de contrato da operação `POST /participantes`.
- Participantes globais (sem vínculo a evento, criados por admin) podem existir no estado atual do banco — a migration de normalização precisa tratar registros existentes com critério claro.
- A semântica de `email` único global (FR-2) não é afetada, mas participantes com o mesmo e-mail não podem mais ser silenciosamente reutilizados entre eventos sem decisão explícita.

---

## Impactos Arquiteturais

### Camada de Models

Se adotada a Alternativa A:
- Novo model `ParticipanteEvento` com colunas `participante_id` e `evento_id`, soft delete (`paranoid: true`).
- `Participante.belongsToMany(Evento, { through: 'participante_eventos' })` e recíproco em `Evento`.
- A tabela `participante_eventos` precisa de constraint `UNIQUE(participante_id, evento_id)` com `WHERE deleted_at IS NULL` (alinhado com NFR-4).

### Camada de Services

Se adotada a Alternativa A:
- `participanteService.findAll()` passa a incluir `eventoIds` como parâmetro explícito (alinhado com ADR-009), com JOIN em `participante_eventos`.
- `participanteService.findById()` (e variantes) valida que o participante possui vínculo em um dos `eventoIds` antes de retornar ou modificar.
- `participanteService.create()` precisa aceitar `eventoId` como parâmetro para registrar o vínculo na criação.

### Camada de Controllers

Se adotada a Alternativa A:
- Controllers API e SSR de participantes passam a repassar `eventoIds` para o service (alinhado com ADR-009).
- O controller de criação (`POST /participantes`) precisa derivar `eventoId` do contexto: para gestor/monitor com único evento vinculado, pode ser derivado automaticamente; para admin ou multi-evento, requer parâmetro explícito no request.

### Camada de Migrations

Se adotada a Alternativa A:
- Nova migration para criação de `participante_eventos`.
- Potencial migration de normalização para registros existentes, dependendo de como o produto decide tratar participantes já cadastrados.

### Impacto em STF abertos

| STF | Descrição resumida | Resolvido por esta ADR? |
|-----|--------------------|------------------------|
| STF-004 | Listagem API expõe todos os participantes | Sim (Alternativa A) |
| STF-037 | Operações SSR por ID sem verificação de escopo | Sim (Alternativa A) |
| STF-038 | Participantes sem certificados invisíveis | Sim (Alternativa A); NÃO (Alternativa B — decisão de produto) |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|----------|
| Produto decide que participantes sem certificados não têm visibilidade para gestor/monitor | Média | Alto — STF-038 permanece como comportamento aceito; FR-36 e FR-49 precisam ser revisados no SRS | Validação explícita com stakeholder do produto antes de iniciar implementação |
| Migration de normalização cria registros `participante_eventos` incorretos para participantes existentes | Alta | Alto — dados de produção corrompidos ou vínculos ausentes | Definir critério claro de migração; testar em ambientes de staging com dados reais |
| Controller omite `eventoId` ao criar participante | Média | Alto — participante criado sem vínculo, invisível para gestor/monitor | Validação no service: criação sem `eventoId` por gestor/monitor resulta em erro 400 |
| Participante com certificados em múltiplos eventos: ownership ambíguo em operações destrutivas | Média | Médio — gestor de evento A pode não conseguir deletar participante com certificado em evento B | Documentar: soft delete de participante deleta vínculo `participante_eventos`, não o participante global |
| Alternativa B adotada sem revisão explícita dos requisitos FR-36 e FR-49 | Baixa | Alto — violação silenciosa de requisito funcional | Registrar formalmente no SRS qualquer revisão de comportamento esperado |

---

## Dependências

| ADR / Decisão | Relação | Motivo |
|---------------|---------|--------|
| **ADR-009** (Enforcement Multi-tenant) | **Pré-requisito** | O contrato de `eventoIds` passado pelos controllers para services é o mecanismo base; esta ADR especifica como `participanteService` implementa esse contrato dado o schema sem `evento_id` direto |
| **ADR-005** (Vínculo Usuário-Evento N:N) | Referência de padrão | A tabela `usuario_eventos` é o precedente arquitetural para `participante_eventos`; o padrão N:N é o padrão do projeto para vínculos contextuais |
| **ADR-001** (ORM Sequelize) | Existente — mantida | `BelongsToMany` via Sequelize é o mecanismo de implementação; `Op.in` para filtros de `eventoIds` |
| **ADR-AUTH-01** (Contrato unificado de `req.usuario`) | Dependência indireta | A extração de `eventoIds` em contexto SSR depende da resolução do contrato de `req.usuario` entre API e SSR (STF-020) |

Esta ADR é **pré-requisito** para:
- Resolução de STF-004 (listagem API de participantes sem filtro)
- Resolução de STF-037 (operações SSR de participantes sem verificação de escopo)
- Resolução de STF-038 (participantes invisíveis na listagem)
- Qualquer spec de enforcement de participantes em FR-36

---

## Relação com SRS

| Requisito | Relação |
|-----------|---------|
| **FR-1** | Define CRUD de participantes como entidade global. A Alternativa A não contradiz FR-1, mas adiciona o conceito de vínculo contextual com evento. A ambiguidade entre "participante global" e "participante do evento" precisa ser resolvida no SRS. |
| **FR-2** | Unicidade de `email` de participante permanece global — não é afetada pela adoção de `participante_eventos`. |
| **FR-4** | Soft delete de participante mantido. Com `participante_eventos`, o soft delete do vínculo e do participante precisam de semântica distinta e documentada. |
| **FR-36** | Requisito central afetado. Monitor "lista e visualiza [...] participantes dos seus eventos" — requer definição de o que é "participante do evento". Esta ADR documenta a tensão e propõe resolução via Alternativa A. |
| **FR-37** | Scoping de gestor/monitor por evento. O enforcement de scoping do domínio de participantes é o problema central desta ADR. |
| **FR-49** | Interface SSR completa inclui gerenciamento de participantes. Participantes invisíveis por ausência de certificado (STF-038) violam FR-49. |
| **FR-56** | Dashboard mostra "participantes únicos filtrados por seus eventos" para gestor/monitor. Sem scoping correto do domínio de participantes, FR-56 não pode ser satisfeito com precisão. |
| **NFR-4** | Soft delete e restauração preservados. `participante_eventos` com `paranoid: true` mantém conformidade com NFR-4. |
| **NFR-5** | Schema gerenciado exclusivamente via migrations. Nova migration de `participante_eventos` é mandatória. |
| **NFR-6** | Arquitetura em camadas. O vínculo de escopo é responsabilidade do service, não de rotas ou middlewares isolados. |

**Ambiguidade identificada no SRS:**
FR-1 trata participantes como entidade global sem menção a evento. FR-36 implica que participantes pertencem a eventos, mas não define o mecanismo. Essa contradição interna no SRS é a origem arquitetural deste problema. A resolução desta ADR requer que o SRS seja atualizado para definir formalmente se participantes são entidades globais com vínculos contextuais (suporte à Alternativa A) ou se a visibilidade por evento é derivada exclusivamente da existência de certificados (suporte à Alternativa B).

---

## Observações

**Pontos resolvidos pela decisão de produto (2026-05-16):**

1. ~~**Decisão de produto obrigatória**~~ — **Resolvido.** Participante sem certificado é visível. Alternativa A adotada.

2. **Tratamento de dados existentes:** Participantes já cadastrados no banco não possuem vínculos em `participante_eventos`. A migration de normalização deve criar vínculos baseados nos certificados existentes (`participante_id` + `evento_id` extraídos de `certificados`). Participantes sem nenhum certificado permanecem no sistema sem vínculo — visíveis apenas para admin até que um gestor os vincule explicitamente.

3. ~~**Contrato de criação**~~ — **Resolvido.** O mecanismo é lookup por e-mail: `POST /participantes` recebe `email` + `evento_id`. Se participante com aquele e-mail já existe, cria apenas o vínculo em `participante_eventos`; se não existe, cria o participante e o vínculo. O campo `evento_id` é obrigatório no request para gestores/monitores.

4. ~~**Semântica de soft delete**~~ — **Resolvido.** Exclusão por gestor/monitor realiza soft delete apenas em `participante_eventos` (o vínculo). O registro em `participantes` permanece intacto. Admin pode realizar soft delete global em `participantes`.

5. **Dependência de ADR-AUTH-01 para SSR:** A extração de `eventoIds` em contexto SSR permanece bloqueada por ADR-AUTH-01. Implementação em fases: API primeiro.

6. **Relação com STF-064:** `certificadoSSRController.novo()` deve filtrar participantes via `participante_eventos` do evento atual — dependente desta ADR.

7. **Implicação LGPD registrada:** O vínculo em `participante_eventos` é o registro de responsabilidade LGPD. O gestor que cria o vínculo declara ter base legal para tratar os dados daquele participante naquele evento. Esta responsabilidade deve ser formalizada por termo de aceite no sistema (novo FR — ver SRS). Revisão jurídica do termo é necessária antes de produção.

**Esta ADR não cobre:**
- A implementação detalhada das queries de `participanteService`.
- O formato exato da migration de `participante_eventos`.
- A definição do contrato de `req.usuario` entre API e SSR (ADR-AUTH-01).
- A estratégia de enforcement em outros domínios (ADR-009).
- RBAC de participantes (STF-015 — `DELETE /participantes/:id` com `rbac('monitor')` incorreto).
