# Auditoria Técnica 07/15 — Rotas Públicas de Certificados (API e SSR)

**Sistema:** Certifique-me  
**Versão do SRS:** 2.0  
**Data da auditoria:** 2026-05-09 23:18 (BRT)  
**Auditor:** Arquiteto de Software Sênior (GitHub Copilot — Claude Sonnet 4.6)  
**Escopo:** Exclusivamente rotas públicas de certificados (API REST e SSR)  
**Status:** Concluída

---

## Fontes analisadas

| Artefato | Caminho |
|----------|---------|
| SRS | `docs/especificacoes.md` |
| Rota pública SSR | `src/routes/public.js` |
| Rota pública API | `src/routes/api.js` |
| Controller SSR (admin) | `src/controllers/certificadoSSRController.js` |
| Controller REST (admin) | `src/controllers/certificadoController.js` |
| Service de certificados | `src/services/certificadoService.js` |
| PDF Service | `src/services/pdfService.js` |
| Template Service | `src/services/templateService.js` |
| Model Certificado | `src/models/certificado.js` |
| Model Participante | `src/models/participante.js` |
| Model Evento | `src/models/evento.js` |
| Views SSR públicas | `views/certificados/*.hbs` |
| Middleware auth | `src/middlewares/auth.js` |
| Middleware rbac | `src/middlewares/rbac.js` |
| App principal | `app.js` |

---

## Contexto arquitetural

O sistema expõe as seguintes rotas públicas (sem autenticação) relativas a certificados:

**API REST (`src/routes/api.js`, montada em `/api`):**
- `GET /api/certificados?email=...` — lista certificados por e-mail (FR-23, FR-53)
- `GET /api/certificados/:id/pdf` — gera PDF por ID interno (FR-42)
- `GET /api/validar/:codigo` — valida certificado por código (FR-24)

**SSR público (`src/routes/public.js`, montada em `/`):**
- `GET /obter` — formulário de busca por e-mail
- `POST /obter` — busca de certificados por e-mail
- `GET /validar` — formulário de validação por código
- `POST /validar` — validação por código
- `GET /validar/:codigo` — validação direta por código via URL

Nenhuma dessas rotas aplica middleware de autenticação (`auth`, `authSSR`) ou autorização (`rbac`), o que é o comportamento intencional conforme FR-25.

---

## 1. Matriz Consolidada de Achados

| ID | Descrição | Evidências | Severidade | Tipo | Impacto | Requisitos Violados | Destino Recomendado |
|----|-----------|------------|------------|------|---------|---------------------|---------------------|
| **A-01** | Ausência total de rate limiting nas rotas públicas de certificados | `src/routes/api.js` e `src/routes/public.js` não aplicam qualquer middleware de rate limiting. O endpoint `GET /api/certificados?email=...` aceita volume ilimitado de requisições. | Crítico | VU | Permite scraping em massa de todos os certificados do sistema via enumeração de e-mails. A rota retorna lista completa (sem paginação) para qualquer e-mail. | NFR-1, FR-55 (por extensão), OWASP A05 | Backlog — Curto Prazo |
| **A-02** | Endpoint `/api/certificados/:id/pdf` aceita ID inteiro sequencial sem controle de acesso ou limite | `src/routes/api.js` linha: `router.get('/certificados/:id/pdf', ...)`. O parâmetro `:id` é um inteiro de banco de dados sequencial, sem validação de formato, sem rate limiting, sem autenticação. | Crítico | VU | Permite enumeração sequencial de PDFs de todos os certificados do sistema (id=1, 2, 3...). Expõe nome do participante, event, tipo e dados dinâmicos interpolados no PDF. | FR-42, NFR-1 | Backlog — Curto Prazo |
| **A-03** | Certificados cancelados aparecem corretamente na listagem `/api/certificados?email=` sem filtro de status | `src/routes/api.js`: `Certificado.findAll({ where: { participante_id: participante.id } })` — não filtra por `status`. Certificados com `status='cancelado'` são retornados normalmente. | Alto | VH | Depende de política: o SRS não especifica se certificados cancelados devem ser omitidos da listagem pública. A resposta JSON expõe o campo `status` com valor `'cancelado'` ao público. | FR-23, FR-25 — comportamento ambíguo | Validação Humana |
| **A-04** | Certificados cancelados aparecem em `POST /obter` (SSR) sem filtro de status | `src/routes/public.js`: `Certificado.findAll({ where: { participante_id: participante.id } })`. Mesmo padrão da API. A view `obter-lista.hbs` exibe badge "secundário" para status diferente de `emitido`, mas o certificado é listado. | Alto | VH | Certificados cancelados visíveis para o participante via SSR. Comportamento de listagem pública diverge dependendo da política desejada — não especificada no SRS. | FR-23, FR-53 — comportamento ambíguo | Validação Humana |
| **A-05** | Certificados cancelados são validados com sucesso via `GET /api/validar/:codigo` e `POST /validar` | `src/routes/api.js`: `Certificado.findOne({ where: { codigo } })` — sem filtro de status. `src/routes/public.js`: mesmo padrão. Um certificado com `status='cancelado'` retorna `{ valido: true, certificado }`. | Alto | BR | Um certificado cancelado é apresentado como válido ao público. O conceito de "cancelado" implica invalidade operacional, mas a rota de validação não diferencia. | FR-24 | Backlog — Curto Prazo |
| **A-06** | A view `validar-resultado.hbs` expõe o campo `status` do certificado publicamente, incluindo `'cancelado'` | `views/certificados/validar-resultado.hbs`: `<dd>{{certificado.status}}</dd>` exibe o campo `status` sem qualquer filtragem. | Médio | IP | O campo `status` é dado interno de negócio. Exibir `'cancelado'` ao público pode gerar confusão ou permitir inferência de estado interno. O SRS não especifica quais campos expor na validação pública. | FR-24 — contrato de resposta não especificado | Backlog — Médio Prazo |
| **A-07** | A rota `GET /api/validar/:codigo` expõe o objeto Sequelize completo (`certificado`) sem serialização controlada | `src/routes/api.js`: `return res.json({ valido: true, certificado })`. O objeto `certificado` é retornado diretamente do `Certificado.findOne(...)` sem `.toJSON()` ou DTO, e inclui os campos `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`, `created_at`, `updated_at` além dos dados de negócio. | Alto | VU | Exposição de IDs internos (`participante_id`, `evento_id`, `tipo_certificado_id`) e metadados de banco (`deleted_at`, `updated_at`) a usuários não autenticados. Facilita mapeamento da estrutura interna do banco. | NFR-1, OWASP A01 | Backlog — Curto Prazo |
| **A-08** | A rota `GET /api/certificados?email=...` retorna lista de certificados sem serialização controlada, expondo IDs internos | `src/routes/api.js` linha: `return res.json({ certificados })`. O array retorna objetos Sequelize brutos com `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`. | Alto | VU | Mesmas implicações do A-07. IDs internos permitem inferência cruzada (email → lista de certificados com IDs → `/api/certificados/:id/pdf` direto). | NFR-1, OWASP A01 | Backlog — Curto Prazo |
| **A-09** | A rota `POST /obter` (SSR) não valida formato de e-mail na camada de servidor | `src/routes/public.js`: apenas verifica `if (!email)`. Qualquer string não-vazia é aceita como e-mail e enviada como `where: { email }` para o banco. Não há validação de formato RFC 5321. | Alto | VU | Possibilita tentativas de injeção ou envio de strings malformadas como critério de busca. Embora o Sequelize parametrize a query (sem SQL injection direta), ausência de validação é uma violação de princípio de defesa em profundidade. | NFR-1, OWASP A03 | Backlog — Curto Prazo |
| **A-10** | A rota `GET /api/certificados?email=...` não valida formato de e-mail | `src/routes/api.js`: apenas verifica `if (!email)`. Mesmo problema do A-09. | Alto | VU | Mesmas implicações do A-09. | NFR-1, OWASP A03 | Backlog — Curto Prazo |
| **A-11** | Inconsistência entre resposta da API e SSR para participante não encontrado | API (`/api/certificados?email=...`): retorna HTTP 404 `{ error: 'Participante não encontrado' }`. SSR (`POST /obter`): retorna HTTP 200 renderizando a view com mensagem `'Nenhum participante encontrado com este e-mail.'`. | Médio | DT | A diferença de comportamento HTTP entre API e SSR para o mesmo caso de negócio é uma inconsistência de contrato. Não é vulnerabilidade direta, mas viola o princípio de coerência de interface. | NFR-6 | Backlog — Médio Prazo |
| **A-12** | A rota `POST /validar` (SSR) não aplica o REGEX de validação de código (`CODIGO_CERTIFICADO_REGEX`) | `src/routes/public.js`: o `GET /validar/:codigo` aplica `CODIGO_CERTIFICADO_REGEX` e retorna 400 se inválido. O `POST /validar` apenas faz `.trim()` e verifica se não está vazio, sem validar o formato. | Médio | IP | Inconsistência de validação: o mesmo input de código é validado em `GET /validar/:codigo` mas não em `POST /validar`. Strings arbitrárias (ex: muito longas, com caracteres especiais) chegam ao banco. | NFR-1 | Backlog — Curto Prazo |
| **A-13** | A rota pública `POST /obter` e `GET /api/certificados?email=` não filtram participantes soft-deletados (`paranoid`) | `Participante.findOne({ where: { email } })` sem `{ paranoid: false }`. O Sequelize com `paranoid: true` exclui automaticamente participantes deletados. Porém se o comportamento esperado é retornar dados de participantes deletados, há gap; se o comportamento é correto, é necessário documentar. | Baixo | VH | Se um participante for soft-deletado mas seus certificados permanecerem, seu e-mail não retorna resultados públicos — mas os certificados ainda existem. A política não está definida no SRS. | FR-23 — comportamento não especificado | Validação Humana |
| **A-14** | A rota `GET /api/certificados/:id/pdf` não valida se o ID é um inteiro válido antes de chamar `findByPk` | `src/routes/api.js`: `const { id } = req.params` é passado diretamente para `Certificado.findByPk(id)`. IDs não inteiros (ex.: `"abc"`, `"1;DROP TABLE"`) chegam ao ORM. | Médio | VU | O Sequelize parametriza a query, evitando SQL injection. Porém, entradas inválidas causam diferença de resposta (500 vs 404) que pode permitir inferência de comportamento interno. A ausência de validação de tipo viola defesa em profundidade. | NFR-1, OWASP A03 | Backlog — Médio Prazo |
| **A-15** | A view `obter-lista.hbs` expõe o `id` interno do certificado em links de PDF públicos | `views/certificados/obter-lista.hbs`: `href='/api/certificados/{{this.id}}/pdf'`. O ID interno do certificado é exposto na interface SSR pública, permitindo que via "Inspecionar Elemento" qualquer usuário obtenha os IDs dos certificados e acesse o endpoint de enumeração `/api/certificados/:id/pdf`. | Alto | VU | Complementa A-02. Combinando SSR (email → lista com IDs) e API (ID → PDF), é possível fazer scraping direcionado. | NFR-1 | Backlog — Curto Prazo |
| **A-16** | A view `validar-resultado.hbs` expõe o e-mail do participante publicamente | `views/certificados/validar-resultado.hbs`: `<dd>{{certificado.Participante.email}}</dd>`. A validação pública de um certificado (que deveria confirmar autenticidade) revela o e-mail do participante para qualquer usuário não autenticado. | Alto | VU | Violação de privacidade: qualquer pessoa com um código de certificado obtém o e-mail do participante. Do e-mail, pode consultar `POST /obter` e obter todos os certificados do participante (encadeamento email → todos os certificados). | NFR-1, OWASP A01 | Backlog — Curto Prazo |
| **A-17** | Duplicação de lógica de busca por código em `POST /validar` e `GET /validar/:codigo` (SSR) | `src/routes/public.js`: os dois handlers implementam a mesma lógica de `Certificado.findOne({ where: { codigo }, include: [...] })` de forma duplicada. Diferença: o `GET` aplica REGEX de validação do código, o `POST` não. | Baixo | DT | Duplicação aumenta risco de divergência futura. | NFR-6 | Backlog — Longo Prazo |
| **A-18** | Duplicação de lógica de busca por código entre API (`GET /api/validar/:codigo`) e SSR (`GET /validar/:codigo` e `POST /validar`) | Lógica idêntica implementada diretamente nas rotas (não usa service layer). API usa `Certificado.findOne` sem `include`. SSR usa `Certificado.findOne` com `include` completo. | Médio | VA | Violação de NFR-6 (separação de camadas). Lógica de negócio duplicada em rotas. Risco de divergência de comportamento. | NFR-6 | Backlog — Médio Prazo |
| **A-19** | A API `GET /api/validar/:codigo` não aplica `include` nas associações enquanto SSR sim | API: `Certificado.findOne({ where: { codigo } })` — sem `include`. SSR: `Certificado.findOne({ where: { codigo }, include: [Participante, Evento, TiposCertificados] })`. | Médio | IP | A resposta JSON da API para validação não inclui dados do Participante, Evento e Tipo. Inconsistência de contrato entre API e SSR para o mesmo dado. Um consumidor da API não obtém as mesmas informações que a interface SSR. | FR-24 — contrato ambíguo | Backlog — Médio Prazo |
| **A-20** | A API `GET /api/validar/:codigo` não valida o formato do código do certificado (REGEX) | `src/routes/api.js`: não há validação de formato do `:codigo`. O SSR `GET /validar/:codigo` valida via `CODIGO_CERTIFICADO_REGEX`. | Médio | IP | Strings arbitrárias chegam ao banco via API pública. Inconsistência de proteção entre endpoints equivalentes. | NFR-1, OWASP A03 | Backlog — Curto Prazo |
| **A-21** | A rota pública `POST /obter` acessa o model `Participante` e `Certificado` diretamente na rota, sem service layer | `src/routes/public.js`: `const participante = await Participante.findOne(...)` e `const certificados = await Certificado.findAll(...)` dentro do handler de rota. Sem uso do `certificadoService`. | Médio | VA | Lógica de negócio (busca por email, hidratação) residindo na camada de rota. Violação de NFR-6. | NFR-6 | Backlog — Médio Prazo |
| **A-22** | A rota pública `GET /api/certificados`:id/pdf não valida o status do certificado antes de gerar o PDF | `src/routes/api.js`: `Certificado.findByPk(id, { include: [...] })` — sem filtro de status. Um certificado cancelado gera PDF normalmente. | Médio | BR | PDF de certificado cancelado pode ser gerado e baixado por qualquer usuário. | FR-42, FR-19 | Backlog — Curto Prazo |
| **A-23** | A rota `POST /obter` (SSR) não inclui dados de Evento e Tipo nos certificados retornados para a view | `src/routes/public.js`: `Certificado.findAll({ where: { participante_id: participante.id } })` sem `include`. A view `obter-lista.hbs` exibe apenas `nome` e `status`, mas o ID é exposto no link de PDF. | Baixo | IP | Dados de Evento e Tipo não são carregados, impedindo exibição de informações complementares que poderiam ser úteis ao participante (ex.: nome do evento). | FR-23 — completude de resposta | Backlog — Médio Prazo |
| **A-24** | A rota SSR pública (`public.js`) não usa nenhum service; toda lógica de busca está na rota | `src/routes/public.js` acessa models Sequelize diretamente: `Participante.findOne`, `Certificado.findAll`, `Certificado.findOne`. | Médio | VA | Violação de NFR-6 em todas as rotas públicas SSR. | NFR-6 | Backlog — Médio Prazo |
| **A-25** | Ausência de paginação na rota `GET /api/certificados?email=...` para participantes com muitos certificados | `src/routes/api.js`: `Certificado.findAll({ where: { participante_id: participante.id } })` retorna todos os registros sem limite. | Médio | GI | Um participante com centenas de certificados retorna tudo em uma única resposta. Risco de performance e vetor para enumeração volumétrica de dados. | FR-23 — escalabilidade não especificada | Backlog — Médio Prazo |
| **A-26** | Inconsistência de comportamento de erro: resposta 500 expõe `detalhe: err.message` no endpoint de PDF | `src/routes/api.js`: `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })`. Mensagens internas de erro são expostas ao usuário não autenticado. | Médio | VU | Pode vazar stack traces, nomes de bibliotecas internas, configurações ou outros dados sensíveis através de erros de runtime. | OWASP A05 | Backlog — Curto Prazo |
| **A-27** | O campo `dados_dinamicos` do tipo de certificado é incluído no `include` de `POST /validar` (SSR) e potencialmente exposto via `toJSON()` | `src/routes/public.js`: o `include` de `POST /validar` carrega `TiposCertificados` com todos os atributos (sem `attributes` restrito). `certificado.toJSON()` é chamado antes de passar para a view. | Baixo | VH | Dependendo do que `dados_dinamicos` contém (estrutura de campos, metadados do tipo), pode haver exposição indevida de informações de configuração interna. Requer validação da política de exposição. | FR-24 — contrato não especificado | Validação Humana |
| **A-28** | A rota `GET /api/validar/:codigo` não aplica `.toJSON()` no objeto Sequelize antes de serializar | `src/routes/api.js`: `return res.json({ valido: true, certificado })`. O objeto retornado é uma instância Sequelize (com métodos). O `res.json()` do Express serializa via `.toJSON()` implicitamente, mas sem controle de exclusão de campos. | Baixo | DT | Sem DTO ou projeção de campos, mudanças no modelo podem alterar silenciosamente a resposta pública. | NFR-6 | Backlog — Longo Prazo |

---

## 2. Correções Críticas Imediatas

### A-01 — Ausência de Rate Limiting nas Rotas Públicas

**Achado:** Nenhuma rota pública aplica rate limiting.  
**Evidência:** `src/routes/api.js` e `src/routes/public.js` — ausência de qualquer middleware de throttling.  
**Impacto:** Scraping em massa de todos os certificados via enumeração de e-mails (`GET /api/certificados?email=...`) ou de IDs (`GET /api/certificados/:id/pdf`).  
**Ação recomendada:** Implementar rate limiting via `express-rate-limit` nas rotas públicas de certificados, especialmente em `GET /api/certificados`, `GET /api/validar/:codigo`, `POST /obter` e `GET /api/certificados/:id/pdf`.

---

### A-02 — Enumeração por ID Sequencial no Endpoint de PDF

**Achado:** `GET /api/certificados/:id/pdf` aceita IDs inteiros sequenciais sem autenticação, sem validação de formato e sem rate limiting.  
**Evidência:** `src/routes/api.js` — `router.get('/certificados/:id/pdf', ...)` sem qualquer proteção.  
**Impacto:** Enumeração trivial de todos os PDFs do sistema (id=1, 2, 3...).  
**Ação recomendada:** Discutir política estrutural — opções incluem exigir o código do certificado ao invés do ID interno, ou adicionar rate limiting severo. Aceitar como risco consciente requer AAD (Aceite Arquitetural Documentado).

---

### A-07 e A-08 — Exposição de IDs Internos via API Pública

**Achado:** Respostas JSON da API pública (`/api/validar/:codigo` e `/api/certificados?email=`) retornam objetos Sequelize brutos com `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`, `updated_at`.  
**Evidência:**  
- `src/routes/api.js` linha `return res.json({ valido: true, certificado })` — sem projeção de campos  
- `src/routes/api.js` linha `return res.json({ certificados })` — sem projeção de campos  
**Impacto:** IDs internos do banco de dados expostos publicamente. Facilita inferência cruzada e potencial enumeração.  
**Ação recomendada:** Implementar serialização explícita (DTO ou `attributes` no `findOne`) para exibir apenas os campos necessários.

---

### A-15 — ID Interno Exposto no HTML da View SSR Pública

**Achado:** `views/certificados/obter-lista.hbs` expõe o `id` do certificado no atributo `href` dos links PDF, permitindo leitura via "Inspecionar Elemento".  
**Evidência:** `href='/api/certificados/{{this.id}}/pdf'`  
**Impacto:** Combinado com A-02, permite scraping direcionado: email → lista de IDs → PDFs.

---

### A-16 — E-mail de Participante Exposto na Validação Pública de Certificado

**Achado:** A view `validar-resultado.hbs` exibe o e-mail do participante para qualquer usuário que possua um código de certificado.  
**Evidência:** `views/certificados/validar-resultado.hbs` — `<dd>{{certificado.Participante.email}}</dd>`  
**Impacto:** Qualquer pessoa com um código de certificado obtém o e-mail do participante. De posse do e-mail, pode listar todos os certificados do participante via `POST /obter`.

---

### A-05 — Certificados Cancelados Validam como Válidos

**Achado:** `GET /api/validar/:codigo` e `POST /validar` (SSR) retornam `valido: true` para certificados com `status='cancelado'`.  
**Evidência:** `src/routes/api.js` e `src/routes/public.js` — query sem filtro de status.  
**Impacto:** Certificados cancelados são apresentados como autênticos ao público.

---

### A-26 — Mensagem de Erro Interno Exposta Publicamente no Endpoint de PDF

**Achado:** Em caso de erro na geração de PDF, a resposta HTTP 500 inclui `detalhe: err.message`.  
**Evidência:** `src/routes/api.js` — `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })`  
**Impacto:** Pode vazar stack traces, nomes de bibliotecas, caminhos de arquivo ou configurações internas.

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo (imediato / P1)

| ID | Título |
|----|--------|
| A-01 | Implementar rate limiting nas rotas públicas de certificados |
| A-02 | Definir política de acesso ao endpoint `/api/certificados/:id/pdf` (ID vs código) |
| A-05 | Filtrar certificados cancelados na validação pública (`/api/validar/:codigo` e `POST /validar`) |
| A-07 | Implementar serialização controlada (DTO) na resposta de `GET /api/validar/:codigo` |
| A-08 | Implementar serialização controlada (DTO) na resposta de `GET /api/certificados?email=` |
| A-09 | Adicionar validação de formato de e-mail no `POST /obter` (SSR) |
| A-10 | Adicionar validação de formato de e-mail no `GET /api/certificados?email=` |
| A-12 | Aplicar `CODIGO_CERTIFICADO_REGEX` no `POST /validar` (SSR) |
| A-15 | Avaliar alternativa ao ID interno nos links de PDF da view `obter-lista.hbs` |
| A-16 | Remover ou ofuscar o e-mail do participante da view `validar-resultado.hbs` |
| A-20 | Aplicar validação de formato de código no `GET /api/validar/:codigo` |
| A-22 | Filtrar certificados cancelados/pendentes no endpoint de geração de PDF |
| A-26 | Remover exposição de `err.message` na resposta 500 do endpoint de PDF |

### Médio Prazo (P2)

| ID | Título |
|----|--------|
| A-06 | Definir e documentar quais campos do certificado são expostos na validação pública |
| A-11 | Padronizar comportamento HTTP para participante não encontrado entre API e SSR |
| A-14 | Adicionar validação de tipo inteiro no parâmetro `:id` do endpoint de PDF |
| A-18 | Extrair lógica de validação por código para `certificadoService` |
| A-19 | Padronizar contrato de resposta entre `GET /api/validar/:codigo` e SSR `validar-resultado` |
| A-21 | Mover lógica de busca de `POST /obter` para service layer |
| A-23 | Incluir dados de Evento na listagem SSR pública (`POST /obter`) |
| A-24 | Remover acesso direto a models nas rotas SSR públicas (mover para service) |
| A-25 | Definir política de paginação para `GET /api/certificados?email=` |

### Longo Prazo (P3)

| ID | Título |
|----|--------|
| A-17 | Unificar handlers de validação por código (`POST /validar` e `GET /validar/:codigo`) |
| A-28 | Implementar DTOs formais para respostas públicas de certificados |

---

## 4. Atualizações Recomendadas no SRS

| Item | Justificativa |
|------|---------------|
| **FR-23 / FR-53** — Definir se certificados cancelados devem aparecer na listagem pública por e-mail | O SRS não especifica. Implementação atual retorna todos os certificados independente de status. |
| **FR-24** — Definir o contrato completo de resposta (campos expostos) na validação pública | O SRS apenas define `{ valido, certificado }`. Não especifica quais campos de `certificado` devem ser retornados, nem se dados de Participante e Evento devem ser incluídos. |
| **FR-24** — Definir comportamento quando certificado está cancelado e é consultado via validação | Certificado cancelado deve retornar `valido: true` ou `valido: false`? O SRS não especifica. |
| **FR-42** — Definir se a geração de PDF deve ser restrita a certificados com status `'emitido'` | O SRS não especifica. Implementação atual gera PDF de certificados cancelados. |
| **NFR-1** (novo item) — Especificar requisito de rate limiting para rotas públicas de certificados | NFR-1 é genérico. As rotas públicas carecem de proteção explícita não coberta pelo requisito atual. |
| **FR-25** (complemento) — Definir política de exposição de dados pessoais em rotas públicas | FR-25 diz apenas "não exige autenticação". Não especifica quais dados pessoais (e-mail, nome completo) podem ser expostos. |

---

## 5. Itens para Validação Humana

| VH | Questão | Motivo |
|----|---------|--------|
| **VH-01** (A-03, A-04) | Certificados cancelados devem aparecer na listagem pública por e-mail (`/api/certificados?email=` e `POST /obter`)? | O SRS (FR-23, FR-53) não determina o comportamento. A implementação atual lista todos os status. |
| **VH-02** (A-05) | Um certificado com status `'cancelado'` deve retornar `valido: false` na rota de validação pública? | O SRS (FR-24) não define o comportamento para certificados cancelados. O conceito de "validade" está associado ao status? |
| **VH-03** (A-13) | Se um participante for soft-deletado, seus certificados devem permanecer acessíveis publicamente? | O SRS define soft delete para participantes (FR-4) mas não define o impacto na visibilidade pública de seus certificados. |
| **VH-04** (A-16) | O e-mail do participante deve ser exibido na view de validação pública de certificado? | Questão de política de privacidade. LGPD pode ser relevante. O SRS não especifica. |
| **VH-05** (A-27) | O objeto completo de `TiposCertificados` (incluindo `dados_dinamicos`) pode ser exposto via SSR na validação pública? | Depende de se `dados_dinamicos` contém apenas estrutura ou também dados sensíveis de configuração. |
| **VH-06** (A-02) | O endpoint de PDF deve usar o ID interno ou o código do certificado como identificador público? | Questão de design de API. Usar código ao invés de ID elimina enumeração sequencial, mas requer decisão arquitetural. |
| **VH-07** (A-25) | É necessário paginar a listagem pública por e-mail? Quantos certificados um participante pode ter? | Depende do volume esperado de certificados por participante. |

---

## 6. Possíveis Iniciativas de Spec (Spec Kit)

### SPEC-PUB-01 — Política de Exposição de Dados em Rotas Públicas de Certificados

**Justificativa:** As rotas públicas expõem dados pessoais (nome, e-mail), IDs internos e dados de negócio (status, valores_dinamicos) sem uma política definida e documentada. A ausência de especificação gera divergência entre API e SSR e impossibilita validação de conformidade com LGPD.

**Escopo sugerido:**
- Definir campos permitidos na resposta pública de listagem (FR-23)
- Definir campos permitidos na resposta pública de validação (FR-24)
- Definir comportamento para certificados cancelados em rotas públicas
- Definir política de exposição de dados pessoais do participante

---

### SPEC-PUB-02 — Proteção Anti-Scraping para Rotas Públicas

**Justificativa:** A combinação de ausência de rate limiting + ID sequencial no PDF + listagem sem paginação cria um vetor trivial de scraping em massa de todo o catálogo de certificados do sistema.

**Escopo sugerido:**
- Definir SLA de rate limiting por IP para rotas públicas
- Definir estratégia de identificação de certificado na URL do PDF (código vs ID)
- Definir se paginação é necessária na listagem pública

---

## 7. Problemas Sistêmicos Observados

### 7.1 Padrão de Exposição em Rotas Públicas

As rotas públicas (`src/routes/api.js` e `src/routes/public.js`) foram implementadas com acesso direto aos models Sequelize, sem service layer e sem DTOs. Esse padrão resulta em:

1. **Objetos Sequelize brutos serializados** para o cliente — expondo campos internos (`deleted_at`, IDs de FK)
2. **Lógica de negócio duplicada** nas rotas (sem reutilização)
3. **Ausência de validação de entrada padronizada** (sem uso do middleware `validate` com Zod)

### 7.2 Risco de Enumeração Cruzada (email → código → PDF)

O sistema cria um encadeamento de enumeração público:

```
email (qualquer string) 
  → POST /obter / GET /api/certificados?email=
      → lista de certificados com IDs internos e status
          → GET /api/certificados/:id/pdf (por ID sequencial)
              → PDF com dados completos do participante e evento

OU

código de certificado (previsível: ex. EDC-26-PT-1, EDC-26-PT-2...)
  → GET /api/validar/:codigo / GET /validar/:codigo
      → dados do participante (nome, e-mail)
          → POST /obter / GET /api/certificados?email=
              → todos os certificados do participante
```

Esse encadeamento permite extrair progressivamente todos os certificados do sistema sem autenticação e sem controle de volume.

### 7.3 Inconsistências entre API e SSR

| Comportamento | API REST | SSR |
|--------------|----------|-----|
| Validação de formato do código | Não presente | Presente (`GET /validar/:codigo`) |
| Filtro de status na validação | Ausente | Ausente |
| Include de associações na validação | Ausente | Presente |
| Validação de formato de e-mail | Ausente | Ausente |
| Serialização de resposta | Bruta (Sequelize instance) | `toJSON()` explícito (SSR) |
| Rate limiting | Ausente | Ausente |

### 7.4 Fragilidade no Modelo de Acesso Público

O modelo atual de acesso público é baseado unicamente na ausência de middleware de autenticação. Não há:

- Rate limiting por IP
- Throttling por e-mail consultado
- Paginação de resultados
- Projeção de campos na resposta
- Identificadores não-sequenciais (UUIDs, slugs ou código certificado) nos endpoints de PDF

### 7.5 Ausência de Proteções Transversais

Nenhum middleware transversal de proteção é aplicado às rotas públicas. O `express-rate-limit` é mencionado apenas no contexto de login (FR-55), mas não é aplicado a nenhuma rota de certificados. Não há evidência de WAF ou throttling configurados a nível de infraestrutura nas configurações analisadas.

### 7.6 Acoplamento Indevido entre Consulta e Exposição

A lógica de consulta (query ao banco) e a lógica de exposição (serialização da resposta) estão fundidas nas rotas públicas, sem camada intermediária. Isso impede reutilização, dificulta testes unitários e torna mudanças de contrato de resposta arriscadas.

---

*Fim da auditoria — 2026-05-09 23:18 (BRT)*
