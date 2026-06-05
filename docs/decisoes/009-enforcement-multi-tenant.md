# ADR 009 — Estratégia Canônica de Enforcement Multi-tenant

**Data:** 2026-05-10  
**Autor:** Arquiteto de Software Principal  
**Contexto de origem:** Super Triagem Arquitetural Final — Rodada 07 (STF-001, STF-002, STF-003, STF-004, STF-026, STF-027, STF-037, PST-01)

---

## Status

Aprovado

---

## Contexto

O Certifique-me é um sistema multi-tenant implícito: gestores e monitores são vinculados a um ou mais eventos via tabela de junção `usuario_eventos` (N:N — ver ADR-005). FR-37 determina que esses perfis devem operar **exclusivamente dentro do escopo dos eventos ao qual estão vinculados**. Administradores têm acesso irrestrito.

A implementação atual delega todo o enforcement ao middleware `scopedEvento` (`src/middlewares/scopedEvento.js`). Esse middleware é o único ponto declarado de isolamento entre tenants.

O sistema possui duas superfícies distintas:

- **API REST** — autenticação via JWT Bearer; `req.usuario` populado pelo middleware `auth` como instância Sequelize com método `getEventos()`.
- **SSR (Handlebars)** — autenticação via cookie JWT; `req.usuario` populado pelo middleware `authSSR` como POJO sem métodos Sequelize.

A tabela de junção `usuario_eventos` armazena os vínculos. Os services (`certificadoService`, `participanteService`, `tiposCertificadosService`) são a camada que efetivamente executa as queries ao banco.

---

## Problema

A implementação atual do middleware `scopedEvento` apresenta **dois defeitos arquiteturais simultâneos e independentes** que tornam o enforcement multi-tenant semanticamente incorreto e operacionalmente inefetivo:

### Defeito 1 — Confusão de IDs em rotas de recurso único (STF-001)

Para rotas como `GET /certificados/:id`, `PUT /certificados/:id` e equivalentes, o middleware executa:

```js
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
```

Em rotas de recurso único com `req.params.id`, esse campo contém o **ID do recurso** (certificado, participante, tipo), não o `evento_id`. O middleware então compara esse valor inteiro com o array de `evento_id`s do usuário. O resultado é:

- Acesso **concedido erroneamente** se o ID do recurso coincide numericamente com um evento vinculado ao usuário.
- Acesso **negado erroneamente** se o ID do recurso não coincide, mesmo que o recurso pertença ao evento do usuário.

O controle de acesso item-level é determinístico por **coincidência numérica de ID**, não por regra de negócio.

### Defeito 2 — Services ignoram filtros de listagem (STF-002)

Para rotas de listagem (`GET` sem `req.params.id`), o middleware injeta `evento_id` em `req.query`:

```js
req.query.evento_id = eventosIds.length === 1 ? eventosIds[0] : eventosIds
```

No entanto, os services (`certificadoService.findAll`, `participanteService.findAll`, `tiposCertificadosService.findAll`) **não consomem `req.query.evento_id`**. As queries ao banco são executadas sem filtro de `evento_id`. A proteção de escopo em listagens é **completamente ilusória**: qualquer gestor ou monitor autenticado recebe todos os registros do sistema.

### Defeito 3 — Inaplicabilidade em SSR (STF-020, dependência estrutural)

O middleware `scopedEvento` depende de `req.usuario.getEventos()` — método disponível apenas em instâncias Sequelize (contexto API). O `authSSR` popula `req.usuario` como POJO sem esse método. Qualquer uso de `scopedEvento` em rotas SSR resulta em HTTP 500. Controllers SSR reimplementam lógica de escopo ad hoc via `UsuarioEvento.findAll()` diretamente, triplicando a lógica de domínio sem garantia de consistência.

### Impacto consolidado

- STF-001: controle de acesso não-determinístico em rotas de item único (todos os domínios)
- STF-002: multi-tenancy ilusório em listagens de certificados e participantes
- STF-003: handlers SSR de certificados por ID sem verificação de ownership
- STF-004: `GET /participantes` expõe todos os participantes do sistema sem filtro
- STF-026: listagem SSR de tipos exibe tipos de todos os eventos
- STF-027: listagem API de tipos ignora `eventoId` do filtro
- STF-037: operações SSR de participantes por ID sem verificação de escopo

---

## Decisão

**Adotar enforcement multi-tenant na camada de service, com `eventoIds` passado explicitamente pelos controllers.**

O contrato de isolamento é implementado diretamente nas queries dos services, que recebem `eventoIds` como parâmetro explícito em vez de depender de injeção via `req.query`. O middleware `scopedEvento` passa a ter responsabilidade restrita: **extrair e validar `eventoIds` do usuário autenticado e disponibilizá-los ao controller**, sem responsabilidade de injetar filtros em `req.query` ou realizar verificações de ownership por conta própria para rotas de item único.

A verificação de ownership em operações de recurso único (GET/PUT/DELETE por `:id`) é responsabilidade do **service**, que valida que o recurso buscado pertence a um dos eventos autorizados antes de retornar ou modificar os dados.

**Justificativa da escolha:**

- Localidade: a query de banco já está no service; o filtro de `evento_id` aplicado no `WHERE` é natural nessa camada.
- Testabilidade: o service pode ser testado unitariamente com `eventoIds` arbitrário, sem depender de `req` ou instância Sequelize.
- Consistência API/SSR: o contrato `eventoIds: number[]` é agnóstico ao mecanismo de autenticação — aplicável em ambas as superfícies.
- Sem dependência de método Sequelize: elimina a dependência de `req.usuario.getEventos()` no middleware, desbloqueando SSR.
- Clareza semântica: controllers controlam o fluxo de autorização explicitamente; services controlam o acesso aos dados.

---

## Alternativas Consideradas

### Alternativa A — Manter `scopedEvento` como middleware de enforcement (status quo corrigido)

O middleware seria corrigido para distinguir rotas de listagem de rotas de item único, e os services seriam adaptados para consumir `req.query.evento_id`.

**Rejeitada porque:**

- A dependência de `req.usuario.getEventos()` mantém a inaplicabilidade em SSR (STF-020 não resolvido).
- Injeção via `req.query` é um canal de comunicação implícito entre middleware e service — viola NFR-6 e dificulta teste unitário do service.
- A semântica de `req.query` como filtro do usuário final mistura-se com filtro de segurança, gerando ambiguidade.
- Não resolve o problema de ownership em operações por ID — o middleware precisaria buscar o recurso no banco para verificar `evento_id`, duplicando a query do service.

### Alternativa B — Services recebem `eventoIds` explicitamente dos controllers (DECISÃO ADOTADA)

Controllers obtêm `eventoIds` do usuário autenticado (via helper centralizado ou payload do token) e passam explicitamente para os services. Services aplicam `WHERE evento_id IN [...]` nas queries.

**Adotada porque:** resolve STF-001, STF-002 e a inaplicabilidade em SSR (STF-020) sem dependência de instância Sequelize no middleware. Ver seção "Decisão".

### Alternativa C — Camada de autorização separada no service layer

Cada service implementa um método `assertOwnership(id, eventoIds)` que verifica ownership antes de executar a operação, lançando exceção se não autorizado.

**Avaliada, porém não adotada como padrão primário porque:**

- Para listagens, o mecanismo natural é `WHERE evento_id IN [...]`, não uma verificação pós-fetch.
- Para operações por ID, o `assertOwnership` exigiria fetch adicional seguido de verificação — o mesmo que incluir `WHERE id = :id AND evento_id IN [...]` na query principal, que é mais eficiente.
- Pode ser adotado como complemento defensivo, especialmente em operações de escrita, mas não substitui o filtro explícito na query.

### Alternativa D — Row-Level Security (RLS) no PostgreSQL

Políticas RLS no banco de dados impõem que queries em `certificados`, `participantes` e `tipos_certificados` filtrem automaticamente por `evento_id` com base no usuário da sessão de banco.

**Rejeitada porque:**

- Requer um usuário de banco por tenant ou variável de sessão (`SET app.current_evento_ids = '...'`) — mecanismo não suportado pela configuração atual do Sequelize.
- Complexidade operacional alta: migrations de política, testes de integração com políticas ativas, risco de falha silenciosa em operações de admin.
- Incompatível com o modelo de conexão de pool único do Sequelize sem adaptação significativa de infraestrutura.
- O volume de dados e o número de tenants do sistema não justificam essa complexidade no contexto atual.

---

## Consequências

### Positivas

- **Enforcement real e verificável:** queries ao banco incluem `WHERE evento_id IN [...]` explicitamente; o isolamento é verificável por inspeção do SQL gerado.
- **Testabilidade aumentada:** services podem ser testados unitariamente com `eventoIds` arbitrários, sem necessidade de instância Sequelize com método associativo.
- **Aplicável em API e SSR:** o contrato `eventoIds: number[]` não depende do mecanismo de autenticação nem de método Sequelize.
- **Eliminação da ambiguidade de `req.query`:** filtros de usuário (ex.: `?email=...`) e filtros de segurança (por evento) são canais distintos.
- **Controllers explicitam o fluxo de autorização:** a intenção de quem autoriza e o que está sendo autorizado é legível no código do controller.

### Negativas

- **Refatoração transversal:** todos os services afetados (`certificadoService`, `participanteService`, `tiposCertificadosService` e potencialmente `eventoService`) precisam atualizar suas assinaturas de método para aceitar `eventoIds`.
- **Todos os controllers afetados:** controllers API e SSR precisam extrair e repassar `eventoIds` explicitamente. Controllers SSR que reimplementam lógica ad hoc precisam ser consolidados.
- **Risco de omissão:** o contrato de passar `eventoIds` é uma convenção, não uma restrição de tipo forte. Um controller que esqueça de passar `eventoIds` não será detectado em tempo de compilação (JavaScript sem TypeScript).
- **Mudança de interface pública dos services:** qualquer consumidor atual dos services (incluindo testes existentes) precisará ser atualizado.

---

## Impactos Arquiteturais

### Camada de Middlewares

O middleware `scopedEvento` tem sua responsabilidade reduzida: extrai `eventoIds` do usuário autenticado e os disponibiliza no objeto `req` (ex.: `req.eventoIds`) para consumo pelo controller. Não mais responsável por injetar filtros em `req.query` nem por verificar ownership de recursos individuais.

A dependência de `req.usuario.getEventos()` (instância Sequelize) deve ser eliminada do middleware. A extração de `eventoIds` deve usar uma abstração compatível com ambas as superfícies de autenticação. A definição dessa abstração é dependência da ADR-011 (ver **Dependências**).

### Camada de Controllers

Controllers de API e SSR passam a ser responsáveis por:

1. Verificar a presença de `eventoIds` (via `req.eventoIds` ou helper equivalente).
2. Repassar `eventoIds` para os services nas chamadas de listagem e de operação por ID.
3. Controllers SSR que atualmente reimplementam lógica de escopo ad hoc são consolidados para usar o mesmo canal.

Para perfil `admin`, `eventoIds` é passado como `null` ou sentinela especial; os services interpretam `null` como ausência de restrição de escopo.

### Camada de Services

Services afetados (`certificadoService`, `participanteService`, `tiposCertificadosService`) têm suas assinaturas de método atualizadas para aceitar `eventoIds` como parâmetro explícito. As queries de listagem incluem `WHERE evento_id IN [...]` quando `eventoIds` não é nulo. As queries de item único incluem `WHERE id = :id AND evento_id IN [...]` ou verificação equivalente post-fetch.

### Domínio de Participantes

**Ponto pendente de validação arquitetural (ver ADR-010):** O model `Participante` não possui `evento_id`. A relação com eventos é indireta via `Certificado`. Aplicar filtro `WHERE evento_id IN [...]` diretamente em `participantes` requer JOIN com `certificados`, o que **exclui participantes sem certificados**. A decisão sobre a arquitetura de ownership do domínio de participantes é bloqueador para a resolução de STF-004 e STF-038 e deve ser tomada em ADR separada (ADR-010).

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|----------|
| Controller omite repasse de `eventoIds` | Média | Crítico — acesso cross-tenant silencioso | Testes de integração cobrindo cada endpoint com usuário de escopo restrito |
| Adoção incompleta da abstração de `eventoIds` definida pela ADR-011 em fluxos SSR | Alta | Blocker de implementação | Implementar em fases: API primeiro; SSR após convergência total ao contrato da ADR-011 |
| Participantes sem scoping real enquanto ADR-010 não for decidida | Alta | Alto — STF-004 permanece aberto | Documentar explicitamente como limitação conhecida até a decisão |
| Testes existentes com assinaturas antigas de service | Alta | Falhas de regressão | Atualizar testes junto com a refatoração do service |
| Admin com `eventoIds = null` não tratado em todos os services | Média | Queries sem filtro retornam todos os registros — correto para admin, mas requer cobertura explícita | Definir convenção e testar caminho do admin em cada service |

---

## Dependências

| ADR / Decisão | Relação | Motivo |
|---------------|---------|--------|
| **ADR-011** (Contrato unificado de `req.usuario`) | **Pré-requisito para SSR** | A extração de `eventoIds` no middleware requer contrato unificado para funcionar em SSR sem dependência de `getEventos()` |
| **ADR-010** (Scoping de Participantes sem associação direta com Evento) | **Pré-requisito para domínio de participantes** | Sem decisão sobre a arquitetura de ownership de participantes, STF-004 não pode ser corrigido |
| **ADR-005** (Vínculo Usuário-Evento N:N) | Existente — mantida | A tabela `usuario_eventos` permanece como fonte de verdade dos vínculos |
| **ADR-001** (ORM Sequelize) | Existente — mantida | Services continuam usando Sequelize para queries; o filtro `WHERE evento_id IN [...]` usa `Op.in` do Sequelize |

A implementação desta ADR **bloqueia** as seguintes specs identificadas na triagem:
- SPEC-MT-01 (Enforcement de Multi-tenancy por Domínio) — dependente desta ADR e da ADR-011
- SPEC-CERT-01 (Correção de Integridade do Serviço de Certificados) — parcialmente bloqueada por esta ADR

---

## Relação com SRS

| Requisito | Relação |
|-----------|---------|
| **FR-37** | Requisito central. FR-37 foi reescrito no SRS (2026-05-16) para descrever o comportamento esperado — gestores e monitores operam exclusivamente sobre dados dos eventos aos quais estão vinculados, em toda operação — sem mencionar o mecanismo de implementação. Esta ADR implementa esse comportamento pelo enforcement no service layer. |
| **FR-62** | Novo FR adicionado ao SRS (2026-05-16): listagem de eventos retorna apenas os eventos vinculados ao gestor/monitor autenticado. Admin visualiza todos. Resolve a pendência da Observação 3 desta ADR. |
| **FR-34** | Admin tem acesso irrestrito — preservado. Services interpretam `eventoIds = null` como ausência de restrição. |
| **FR-35, FR-36** | Gestor e monitor operam dentro de seus eventos — o enforcement desta ADR implementa esse isolamento para ambos. |
| **FR-46** | Gestores operam apenas sobre tipos de certificados de seus eventos — enforcement desta ADR inclui `tiposCertificadosService`. |
| **NFR-1** | Segurança — Controle de Acesso. Esta ADR é requisito para conformidade com NFR-1 em todos os domínios escopados. |
| **NFR-6** | Arquitetura em camadas. A decisão de aplicar o enforcement no service mantém lógica de negócio fora das rotas e controllers, alinhada com NFR-6. |

**~~Ambiguidade identificada no SRS~~ — Resolvida (2026-05-16):**
FR-37 foi reescrito para descrever o comportamento esperado (isolamento de dados por evento em todas as operações), sem mencionar o mecanismo de implementação. FR-62 foi adicionado definindo o escopo de listagem de eventos para gestor/monitor.

---

## Observações

**Ambiguidades de fronteira resolvidas (2026-06-05):**

1. **Sentinela para admin:** a convenção canônica é `eventoIds = null` para escopo global. Services devem interpretar `null` como ausência de restrição de escopo por evento.

2. **Canal canônico de escopo no request:** o resultado de resolução de escopo deve ser exposto como `req.contextoAutorizacao.eventoIds`, desacoplado de `req.query` e de capacidades ORM.

3. **Fonte de resolução de escopo:** a resolução de `eventoIds` deve depender do vínculo usuário-evento (`usuario_eventos`) e do contrato canônico do principal autenticado definido na ADR-011, e não de método de instância ORM em `req.usuario`.

**Pontos remanescentes de validação arquitetural antes da implementação:**

4. ~~**Domínio de Eventos**~~ — **Resolvido (2026-05-16).** FR-62 adicionado ao SRS: gestores/monitores visualizam apenas os eventos vinculados a eles; admins visualizam todos. O `eventoService.findAll()` deve aplicar filtro `WHERE id IN [eventoIds]` para gestores/monitores.

5. **Dashboard:** o `dashboardController` executa queries de agregação diretamente, sem passar por services com `eventoIds`. O enforcement de escopo no dashboard é afetado por esta ADR mas requer tratamento específico.

6. **Compatibilidade com paginação:** a integração com `findAndCountAll` (ADR-006) deve preservar o filtro `WHERE evento_id IN [...]` ao lado de filtros de paginação e busca. Verificar precedência de `Op.and` em queries compostas.

7. **Coexistência com `tiposCertificadosOwnership`:** o middleware `tiposCertificadosOwnership` também realiza verificações de ownership de forma ad hoc. Sua relação com o novo padrão de enforcement deve ser explicitada — se mantido, deve ser refatorado para usar o mesmo canal de `eventoIds`.

**Esta ADR não cobre:**
- A definição do contrato canônico de `req.usuario` entre API e SSR (ADR-011).
- A decisão de ownership do domínio de participantes (ADR-010).
- Rate limiting em rotas públicas (SPEC-PUBLICO-01).
- RBAC assimétrico entre API e SSR (ADR-RBAC-01).
