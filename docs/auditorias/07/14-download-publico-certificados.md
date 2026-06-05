# Auditoria Técnica 14 — Download Público de Certificados (PDF)

**Domínio auditado:** Download público de certificados em PDF  
**Data:** 2026-05-09  
**Hora:** 23:11 (BRT)  
**Auditor:** Arquitetura — Auditoria técnica automatizada  
**Versão do SRS analisada:** 2.0 (2026-04-30)  
**Branch:** main

---

## Fontes Analisadas

| Arquivo | Papel |
|---|---|
| `docs/especificacoes.md` | SRS — fonte de requisitos |
| `src/routes/api.js` | Endpoint `GET /api/certificados/:id/pdf` e `GET /api/certificados` |
| `src/routes/public.js` | SSR `POST /obter`, `GET /validar-resultado` — links de download |
| `src/services/pdfService.js` | Geração de PDF com PDFKit |
| `src/services/r2Service.js` | Integração com Cloudflare R2 (S3-compat) |
| `src/services/templateService.js` | Interpolação de texto_base |
| `src/services/certificadoService.js` | Service de certificados |
| `src/models/certificado.js` | Model Sequelize + soft delete (paranoid) |
| `src/models/evento.js` | Model Sequelize do evento (campos de layout) |
| `src/controllers/certificadoController.js` | Controller autenticado de certificados |
| `src/middlewares/auth.js` | Middleware de autenticação JWT |
| `src/routes/usuarios.js` | Rate limiting (referência — único uso) |
| `views/certificados/obter-lista.hbs` | Template SSR — lista de certificados por e-mail |
| `views/certificados/validar-resultado.hbs` | Template SSR — resultado de validação |
| `views/admin/certificados/detalhe.hbs` | Template SSR admin — detalhe do certificado |
| `tests/routes/public.test.js` | Testes de integração da rota pública de PDF |
| `tests/services/pdfService.test.js` | Testes unitários do pdfService |
| `app.js` | Montagem de rotas e middlewares globais |

---

## Contexto Arquitetural

O sistema expõe o endpoint `GET /api/certificados/:id/pdf` definido em `src/routes/api.js`. A rota é pública (sem autenticação) conforme FR-42.

**Fluxo documentado no SRS:**
```
GET /api/certificados/:id/pdf
  → Certificado.findByPk(id, { include: [Participante, Evento, TiposCertificados] })
  → pdfService.generateCertificadoPdf(certificado)
      → r2Service.getFile(evento.url_template_base)    (imagem de fundo)
      → r2Service.getFile('fontes/Lato-Medium.ttf')    (fonte)
      → templateService.interpolate(texto_base, valores_dinamicos)
      → PDFKit: A4 landscape, texto em (texto_x, texto_y), validação em (validacao_x, validacao_y)
      → Buffer → HTTP 200 Content-Type: application/pdf
```

**Links de download expostos em views SSR:**
- `views/certificados/obter-lista.hbs` — `/api/certificados/{{this.id}}/pdf` (para todos os status)
- `views/certificados/validar-resultado.hbs` — `/api/certificados/{{certificado.id}}/pdf` (para todos os status)
- `views/admin/certificados/detalhe.hbs` — `/public/certificados/{{certificado.id}}/pdf` (rota inexistente)

---

## 1. Matriz Consolidada de Achados

| ID | Descrição | Evidências | Severidade | Tipo | Impacto | Requisitos Violados | Destino Recomendado |
|---|---|---|---|---|---|---|---|
| **VU-001** | Enumeração de PDFs por ID sequencial inteiro sem controle de acesso | `src/routes/api.js` linha 46: `router.get('/certificados/:id/pdf', async (req, res) => {` aceita qualquer integer como `:id`. IDs são auto-incrementais (PK sequencial). Sem rate limiting, sem token, sem validação de escopo. Um atacante pode iterar `GET /api/certificados/1/pdf`, `2/pdf`, `3/pdf`, etc., obtendo PDFs de todos os certificados do sistema sem qualquer restrição | Crítico | VU | Exposição irrestrita de todos os certificados do sistema via acesso sequencial por ID. PDFs contêm nome do participante e dados dinâmicos do certificado. O banco de dados cresce monotonicamente tornando o espaço enumerável previsível | FR-42, NFR-1 | Correção Crítica Imediata |
| **VU-002** | Ausência de rate limiting no endpoint de geração de PDF (`GET /api/certificados/:id/pdf`) | `src/routes/api.js`: nenhum middleware `rateLimit` é aplicado antes do handler de PDF. `src/routes/usuarios.js` é a única rota que importa `express-rate-limit` (disponível em `package.json`). `app.js` não aplica rate limiting global | Crítico | VU | Endpoint CPU-intensivo (PDFKit + 2 chamadas R2 por request) explorável para exaustão de recursos via requisições massivas sem qualquer throttle ou bloqueio por IP. Risco de DoS efetivo sem infraestrutura de proteção | NFR-1 | Correção Crítica Imediata |
| **BR-001** | PDFs de certificados cancelados são gerados e servidos sem restrição | `src/routes/api.js` linhas 49-58: `Certificado.findByPk(id, { include: [...] })` — sem cláusula `where: { status: 'emitido' }` ou equivalente. Model `certificado.js` linhas 22-27 declara ENUM `status: ('emitido', 'pendente', 'cancelado')`. Um certificado com `status: 'cancelado'` retorna PDF idêntico ao original | Alto | BR | Documento oficial (PDF) emitido para certificado cujo status interno é `cancelado`. Participante ou terceiro pode baixar e apresentar PDF de certificado que o sistema internamente considera inválido. Quebra de integridade entre estado persistido e artefato gerado | FR-43, FR-19 | Correção Crítica Imediata |
| **BR-002** | PDFs de certificados com `status: 'pendente'` são gerados sem restrição | `src/routes/api.js` linhas 49-58: mesma ausência de filtro de status. FR-43 valida somente presença de `codigo`, não o campo `status`. Certificados pendentes (`status: 'pendente'`) possuem `codigo` gerado (FR-52 se aplica na criação) e passam pela validação do pdfService | Alto | BR | PDF gerado e servido para certificado que o sistema considera em estado indeterminado (`pendente`). Ausência de definição no SRS sobre comportamento do download para status `pendente` alimenta esse gap | FR-43, FR-19 | Validação Humana |
| **VU-003** | `detalhe: err.message` exposto na resposta HTTP 500 do endpoint de PDF | `src/routes/api.js` linhas 70-73: `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })`. Erros internos do R2 (paths, buckets, endpoints), erros de PDFKit e erros de memória são expostos no corpo da resposta pública | Alto | VU | Vazamento de informações internas: paths de arquivos R2, nomes de bucket, endpoints de storage, erros de inicialização de PDFKit. Permite reconhecimento da infraestrutura de storage (OWASP A05 — Security Misconfiguration) | NFR-1 | Correção Crítica Imediata |
| **BR-003** | Link de download no painel admin aponta para rota inexistente (`/public/certificados/:id/pdf`) | `views/admin/certificados/detalhe.hbs` linha 5: `href="/public/certificados/{{certificado.id}}/pdf"`. Nenhum router registrado em `app.js` corresponde ao path `/public/certificados/*`. A rota correta é `/api/certificados/:id/pdf` desde `app.use('/api', apiRouter)` | Alto | BR | Botão "Baixar PDF" no painel administrativo (detalhe do certificado) sempre resulta em HTTP 404. Funcionalidade de download completamente inoperante para usuários autenticados (admin, gestor, monitor) no fluxo SSR admin | FR-42 | Correção Crítica Imediata |
| **VA-001** | Toda lógica do endpoint de download implementada diretamente na rota, sem controller nem service | `src/routes/api.js` linhas 46-74: handler anônimo faz `Certificado.findByPk(...)`, chama `pdfService.generateCertificadoPdf(...)`, define headers e envia resposta. Sem controller interpolado. `certificadoController.js` não possui método equivalente para download público | Alto | VA | Violação direta de NFR-6 (routes → controllers → services → models). Lógica de negócio irreproduzível via controller; ausência de ponto central de extensão para adicionar validações (status, rate limit, log de auditoria) sem modificar a rota | NFR-6 | Backlog Arquitetural — curto prazo |
| **VU-004** | `console.log('PDFService certificado:', certificado)` expõe PII em logs de produção | `src/services/pdfService.js` linha 14: `console.log('PDFService certificado:', certificado)` — loga o objeto completo do certificado incluindo `valores_dinamicos` (dados pessoais/acadêmicos do participante), `nome`, `codigo` e associações | Alto | VU | PII e dados sensíveis gravados em stdout/logs de produção a cada geração de PDF. Risco OWASP A09 (Security Logging and Monitoring Failures). O log é executado antes de qualquer validação, disparado mesmo em requisições inválidas | NFR-1 | Correção Crítica Imediata |
| **GI-001** | `obter-lista.hbs` e `validar-resultado.hbs` expõem botão "Baixar PDF" para certificados cancelados | `views/certificados/obter-lista.hbs` linhas 19-26: link `/api/certificados/{{this.id}}/pdf` renderizado para todos os status sem filtro condicional. `views/certificados/validar-resultado.hbs` linhas 33-41: idem. HBS helper `eq` está disponível (verificado em `hbs-helpers.js`) mas não é utilizado para condicionar a exibição do botão | Médio | GI | Interface pública convida o participante a baixar PDF de certificado cancelado. Embora o backend gere o PDF sem restrição (BR-001), a UI poderia suprimir a opção. Compromete a percepção de integridade do sistema | FR-19, FR-43 | Backlog Arquitetural — curto prazo |
| **GI-002** | Ausência de `Content-Security-Policy` e `Cache-Control` nos headers de resposta do PDF | `src/routes/api.js` linhas 63-68: apenas `Content-Type: application/pdf` e `Content-Disposition: inline; filename=certificado-${id}.pdf` são definidos. Nenhum header de cache (`Cache-Control`, `Pragma`, `Expires`) ou de segurança é adicionado | Médio | GI | Comportamento de cache indefinido — navegadores e proxies intermediários podem cachear o PDF indefinidamente. `Content-Disposition: inline` (não `attachment`) exibe o PDF no navegador, expondo o conteúdo a extensões e add-ons do browser com acesso à página | FR-42 | Backlog Arquitetural — médio prazo |
| **GI-003** | `Content-Disposition` expõe o ID interno do banco no nome do arquivo PDF | `src/routes/api.js` linha 65: `filename=certificado-${id}.pdf` — o ID inteiro sequencial do banco é incorporado no nome do arquivo servido. Confirma ao usuário o valor exato do PK do registro | Médio | GI | Facilita a enumeração sequencial mencionada em VU-001. O participante que baixar seu certificado conhece o ID do seu registro e pode derivar IDs adjacentes para enumerar certificados de terceiros | FR-42 | Backlog Arquitetural — curto prazo |
| **IP-001** | FR-43 validado no `pdfService` mas ausente na camada de rota/controller do endpoint público | FR-43: "A geração do documento PDF só é permitida se o certificado possuir um código (`codigo`) válido." `pdfService.js` linha 17: `if (!certificado.codigo) return reject(new Error('Código de validação obrigatório'))`. Porém: (a) a validação ocorre dentro da Promise, depois do findByPk já executado; (b) não há filtro na rota para excluir registros sem `codigo` antes de chamar o service | Médio | IP | A validação existe mas é aplicada após consulta ao banco e alocação de recursos. Certificado sem `codigo` só é rejeitado dentro do pdfService, retornando HTTP 500 genérico ao invés de HTTP 422 semanticamente correto | FR-43 | Backlog Arquitetural — curto prazo |
| **DT-001** | `new Promise(async (resolve, reject))` anti-pattern em `pdfService.generateCertificadoPdf` | `src/services/pdfService.js` linha 13: `return new Promise(async (resolve, reject) => {`. O uso de `async` dentro de `new Promise` é um anti-pattern reconhecido: erros assíncronos lançados após o primeiro `await` dentro do construtor podem não ser capturados pelo `reject` | Médio | DT | Possibilidade de unhandled promise rejection silenciosa em erros que ocorram em determinados pontos do fluxo async. Dificulta rastreamento e mocking em testes isolados | — | Backlog Arquitetural — médio prazo |
| **DT-002** | `require('./r2Service')` lazy (inline) para "evitar dependência circular" dentro de `pdfService` | `src/services/pdfService.js` linhas 11-12: `const r2Service = require('./r2Service')` dentro do corpo da função async, com comentário "Lazy require para evitar dependência circular". A dependência circular não é resolvida arquiteturalmente — apenas postergada | Baixo | DT | Dependência circular latente entre `pdfService` e `r2Service`. O require inline não é resolvido em tempo de módulo, impedindo detecção estática de erros de import e dificultando o mocking em testes (o jest.mock de r2Service em `pdfService.test.js` requer hoisting explícito) | NFR-6 | Backlog Arquitetural — longo prazo |
| **IP-002** | Soft delete (paranoid) do modelo `Certificado` funciona corretamente, mas não há teste explícito de que certificados soft-deletados não geram PDF | `src/models/certificado.js`: `paranoid: true`. Sequelize com `paranoid: true` exclui registros com `deleted_at IS NOT NULL` nas queries `findByPk` e `findAll` por padrão. `tests/routes/public.test.js` linhas 84-96: testa geração de PDF para certificado `emitido`, mas não cobre cenário de certificado soft-deletado | Baixo | IP | Comportamento de soft delete aplicado implicitamente pelo ORM está correto, mas não verificado por teste. Uma mudança inadvertida na configuração do model (remoção de `paranoid: true`) tornaria certificados deletados geráveis sem cobertura de teste que detecte o problema | FR-22, NFR-4 | Backlog Arquitetural — médio prazo |
| **AM-001** | SRS não define comportamento de download para certificados com `status: 'pendente'` | FR-42: "O sistema deve gerar o PDF do certificado sob demanda via `GET /api/certificados/:id/pdf`, sem exigir autenticação." FR-43: valida somente presença de `codigo`. FR-19 define `status` como ENUM mas não relaciona status ao comportamento de download. Nenhum FR restringe ou permite download para status `pendente` | Médio | AM | Ambiguidade que alimenta BR-002. Implementação atual permite geração de PDF para qualquer certificado com `codigo`, independente do status. Política não definida | FR-42, FR-43, FR-19 | Atualizações Recomendadas no SRS |
| **AM-002** | SRS não define comportamento de download para certificados restaurados após soft delete | FR-22: "La remoção de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados." Após restauração, o certificado retorna ao estado anterior (`status` permanece como estava, e.g., `cancelado`). Nenhum FR especifica se o download deve ser permitido ou bloqueado após restauração | Médio | AM | Comportamento após restauração de certificado cancelado é indeterminado. O sistema atualmente: (1) retorna certificado nas queries (paranoid correto após restore), (2) gera PDF sem verificar status. Política de download pós-restauração inexistente no SRS | FR-22, FR-42 | Atualizações Recomendadas no SRS |
| **AM-003** | FR-47 especifica key R2 padrão como `"template/padrao.jpg"`, mas o asset não é validado antes do uso | FR-47: "Se não definido, usa `'template/padrao.jpg'` como key padrão." `pdfService.js` linhas 38-48: tenta buscar a key do R2 e captura erros com `console.warn`. Não há validação de existência do asset antes da geração. O SRS não define o que acontece se o template padrão também não existir no R2 | Baixo | AM | PDF pode ser gerado sem imagem de fundo (fallback silencioso) quando o template padrão não existe no R2, sem qualquer indicação ao usuário ou admin. Comportamento de fallback não especificado no SRS | FR-47 | Atualizações Recomendadas no SRS |
| **VH-001** | Política de cache de PDFs (geração sob demanda vs. persistência) não está definida | SRS não menciona cache de PDFs, TTL de buffers, persistência de PDFs gerados ou invalidação. ADR `docs/decisoes/008-pdf-on-the-fly.md` (referenciado na auditoria 12) indica geração sob demanda, mas não define política de cache HTTP. Implementação gera novo PDF a cada request sem headers de cache | Médio | VH | Sem definição de cache: (a) cada request ao `GET /api/certificados/:id/pdf` dispara PDFKit + 2 calls R2; (b) dados dinâmicos do certificado poderiam ser atualizados entre downloads gerando PDFs divergentes do estado atual (sem cache isso não ocorre, mas a ausência de definição deixa a decisão implícita) | FR-42 | Aguarda Validação Humana |
| **VH-002** | Comportamento de download para certificados `pendente` aguarda definição explícita no SRS | FR-43 define que certificados sem `codigo` são rejeitados. Certificados `pendente` são criados com `codigo` (gerado na criação via FR-52). A política de acesso ao PDF para o status `pendente` não está explicitada: deve ser bloqueado, permitido, ou tratado como `emitido`? | Médio | VH | Aguarda definição humana de regra de negócio | FR-43, FR-19 | Aguarda Validação Humana |
| **VH-003** | Ausência de headers `Cache-Control: no-store` pode permitir que proxies ou CDN cacheiem PDFs de certificados cancelados | Sem `Cache-Control: no-store` ou `Cache-Control: private` no response do PDF, um proxy HTTP ou CDN intermediário pode cachear o PDF gerado. Se o certificado for cancelado após o cache, o PDF cacheado continua acessível. Não foi possível confirmar se há proxy/CDN na infraestrutura de produção | Médio | VH | Impacto depende da infraestrutura de deploy (proxy reverso, CDN). Aguarda validação da topologia de produção | FR-42 | Aguarda Validação Humana |

---

## 2. Correções Críticas Imediatas

### CCI-01 — Ausência de rate limiting no endpoint de geração de PDF (VU-002)

**Endpoint afetado:** `GET /api/certificados/:id/pdf` (`src/routes/api.js`)

**Evidência:** `express-rate-limit` está disponível em `package.json` e em uso em `src/routes/usuarios.js`. O endpoint de PDF não possui nenhum middleware limitador.

**Risco:** Endpoint CPU-intensivo (PDFKit + 2 I/O calls ao R2) explorável para exaustão de recursos. Cada request inicia alocação de PDFKit, duas conexões S3, carregamento de imagem e fonte na memória.

**Ação necessária:** Adicionar middleware de rate limiting (instância específica) ao handler de `GET /api/certificados/:id/pdf` antes do handler assíncrono.

---

### CCI-02 — Enumeração de certificados por ID sequencial (VU-001)

**Endpoint afetado:** `GET /api/certificados/:id/pdf` (`src/routes/api.js`)

**Evidência:** `:id` é o PK auto-incremental do banco. `Content-Disposition: filename=certificado-${id}.pdf` confirma ao usuário o valor do ID.

**Risco:** Qualquer pessoa pode baixar PDFs de todos os certificados do sistema iterando IDs. O espaço de IDs é totalmente enumerável e determinístico.

**Ação necessária:** (a) Avaliar uso de código público do certificado (`codigo`) como identificador de download no lugar do ID interno; (b) Enquanto o ID for mantido, rate limiting (CCI-01) é condição mínima necessária mas não suficiente; (c) Validar se o acesso por código via validação pública seria preferível a expor o ID.

---

### CCI-03 — PDF de certificados cancelados gerado sem restrição (BR-001)

**Endpoint afetado:** `GET /api/certificados/:id/pdf` (`src/routes/api.js`)

**Evidência:** `Certificado.findByPk(id, { include: [...] })` sem cláusula `where: { status: 'emitido' }`. `pdfService.js` valida apenas `certificado.codigo` (FR-43), não `certificado.status`.

**Risco:** PDF oficial emitido para certificado cancelado pelo sistema. Quebra de integridade entre estado interno e artefato público.

**Ação necessária:** Definir política de status permitida para download (aguarda VH-002 para `pendente`). Para `cancelado`: adicionar verificação de status antes de chamar `pdfService`, retornando HTTP 422 ou 403 com mensagem adequada.

---

### CCI-04 — Vazamento de detalhes internos no HTTP 500 do endpoint de PDF (VU-003)

**Endpoint afetado:** `GET /api/certificados/:id/pdf` (`src/routes/api.js`)

**Evidência:** `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })` — `err.message` pode conter paths R2, nomes de bucket, endpoints de storage ou erros de procesamento PDFKit.

**Ação necessária:** Remover o campo `detalhe` da resposta pública. O erro interno deve ser logado no servidor (sem PII) mas não exposto ao cliente.

---

### CCI-05 — `console.log` com PII completo do certificado em cada geração de PDF (VU-004)

**Localização:** `src/services/pdfService.js` linha 14

**Evidência:** `console.log('PDFService certificado:', certificado)` — loga o objeto completo incluindo `valores_dinamicos`, `nome`, associações.

**Ação necessária:** Remover o `console.log` de produção. Se necessário para debug, substituir por logger condicional (`process.env.NODE_ENV !== 'production'`) sem PII.

---

### CCI-06 — Link de download no painel admin aponta para rota inexistente (BR-003)

**Localização:** `views/admin/certificados/detalhe.hbs` linha 5

**Evidência:** `href="/public/certificados/{{certificado.id}}/pdf"` — a rota corrreta é `/api/certificados/:id/pdf`.

**Ação necessária:** Corrigir o href para `/api/certificados/{{certificado.id}}/pdf`.

---

## 3. Backlog Arquitetural Priorizado

### Curto prazo

| Prioridade | Achado | Descrição |
|---|---|---|
| 1 | VU-001 | Migrar identificador público de download do ID sequencial para o `codigo` do certificado (ou token não-sequencial), eliminando a superfície de enumeração |
| 2 | VA-001 | Extrair lógica do handler de PDF para um controller dedicado (`certificadoController.downloadPdf`) e delegá-la ao `certificadoService` com validação de status |
| 3 | BR-001 | Adicionar filtro de `status: 'emitido'` na query de busca do certificado antes da geração de PDF |
| 4 | GI-001 | Condicionar exibição do botão "Baixar PDF" em `obter-lista.hbs` e `validar-resultado.hbs` ao status `emitido` |
| 5 | GI-003 | Substituir `filename=certificado-${id}.pdf` por `filename=certificado-${codigo}.pdf` para não expor o ID interno no nome do arquivo |
| 6 | IP-001 | Mover validação de presença de `codigo` para a camada de rota/controller, retornando HTTP 422 em vez de HTTP 500 genérico |

### Médio prazo

| Prioridade | Achado | Descrição |
|---|---|---|
| 1 | GI-002 | Adicionar headers `Cache-Control: no-store`, `Pragma: no-cache` e `X-Content-Type-Options: nosniff` na resposta do PDF |
| 2 | DT-001 | Refatorar `pdfService.generateCertificadoPdf` eliminando o anti-pattern `new Promise(async ...)`, convertendo para `async/await` nativo |
| 3 | IP-002 | Adicionar teste explícito cobrindo que `GET /api/certificados/:id/pdf` retorna 404 para certificado soft-deletado |

### Longo prazo

| Prioridade | Achado | Descrição |
|---|---|---|
| 1 | DT-002 | Resolver dependência circular entre `pdfService` e `r2Service` arquiteturalmente (injeção de dependência ou reorganização de módulos), eliminando o `require` inline |

---

## 4. Atualizações Recomendadas no SRS

### SRS-01 — FR-42 e FR-43: Definir comportamento de download por status

**Status atual:** FR-42 define geração pública sem restrição de status. FR-43 valida apenas presença de `codigo`.

**Lacuna:** Nenhum FR especifica se certificados `cancelado` ou `pendente` podem ter PDF gerado.

**Atualização recomendada:**
> FR-42 deve ser complementado com: "A geração de PDF via `GET /api/certificados/:id/pdf` somente é permitida para certificados com `status: 'emitido'`. Certificados `cancelado` devem retornar HTTP 403. Certificados `pendente` devem [definir comportamento após VH-002]."

---

### SRS-02 — FR-42: Definir headers HTTP obrigatórios na resposta de PDF

**Status atual:** SRS menciona `Content-Type: application/pdf` no fluxo arquitetural, mas não formaliza requisito de headers de cache ou segurança.

**Atualização recomendada:**
> FR-42 deve especificar: "A resposta deve incluir `Content-Type: application/pdf`, `Content-Disposition: attachment; filename=certificado-{codigo}.pdf`, `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`."

---

### SRS-03 — NFR-1 ou novo FR-55b: Rate limiting em endpoint de geração de PDF

**Status atual:** FR-55 cobre apenas `POST /usuarios/login`. Não existe FR que cubra rate limiting no endpoint público de geração de PDF.

**Atualização recomendada:**
> Adicionar requisito: "O endpoint `GET /api/certificados/:id/pdf` deve ser protegido por rate limiting com limite máximo de N requisições por janela de M minutos por IP" (valores a definir em VH-001).

---

### SRS-04 — FR-42: Definir identificador público de download (ID vs. código)

**Status atual:** A especificação descreve o endpoint como `GET /api/certificados/:id/pdf` usando o ID interno, mas não explicita se o ID deve ser sequencial ou se o `codigo` deveria ser o identificador público.

**Atualização recomendada:**
> Definir explicitamente se o endpoint de download deve usar o ID interno (PK) ou o `codigo` público do certificado como parâmetro de rota, com justificativa de segurança para a escolha.

---

### SRS-05 — FR-47: Definir comportamento quando template padrão não existe no R2

**Status atual:** FR-47 especifica `"template/padrao.jpg"` como key de fallback, mas não define o comportamento quando essa key também não existe.

**Atualização recomendada:**
> FR-47 deve especificar: "Se o template padrão (`template/padrao.jpg`) não estiver disponível no R2, o PDF deve ser gerado sem imagem de fundo (fallback para fundo branco), sem retornar erro ao usuário."

---

## 5. Itens para Validação Humana

### VH-001 — Política de cache de PDFs gerados sob demanda

**Questão:** O SRS e as ADRs indicam geração sob demanda (sem persistência de PDF), mas não definem a política de cache HTTP. Deve-se cachear o PDF no lado do cliente/CDN? Se sim, por quanto tempo? Se não, headers `Cache-Control: no-store` devem ser adicionados.

**Impacto de negócio:** Se o conteúdo do certificado for atualizado (e.g., nome corrigido via update), um PDF cacheado no browser continuaria exibindo a versão anterior. Geração sem cache garante sempre o estado atual, mas aumenta carga no servidor.

**Decisão requerida:** Product Owner / Arquitetura.

---

### VH-002 — Comportamento de download para certificados com `status: 'pendente'`

**Questão:** Certificados `pendente` possuem `codigo` válido (gerado na criação). FR-43 não restringe o download por status. Deve o sistema gerar PDF para certificados `pendente`?

**Opções:** (a) Bloquear download para `pendente` (retornar 403); (b) Permitir, pois o código já existe; (c) Redirecionar para tela de validação.

**Decisão requerida:** Product Owner.

---

### VH-003 — Impacto de proxy/CDN no cache de PDFs de certificados cancelados

**Questão:** Sem header `Cache-Control: no-store`, um proxy reverso (nginx, Cloudflare) ou CDN intermediário pode cachear o PDF. Se a infraestrutura de produção inclui proxy com cache habilitado, PDFs de certificados cancelados podem continuar sendo servidos após o cancelamento.

**Decisão requerida:** Equipe de Infraestrutura — confirmar topologia de produção e configuração de cache no proxy.

---

## 6. Possíveis Iniciativas de Spec (Spec Kit)

### SPEC-01 — Controle de acesso ao download por código público

**Motivação:** A enumeração por ID interno (VU-001) e a exposição do ID no nome do arquivo (GI-003) podem ser eliminadas substituindo `:id` por `:codigo` no endpoint de download. Isso alinharia o identificador de download com o responsável pela autenticidade do certificado (FR-52, FR-24).

**Escopo proposto:**
- Redesenhar o endpoint `GET /api/certificados/:id/pdf` para `GET /api/certificados/:codigo/pdf`
- Atualizar links em `obter-lista.hbs`, `validar-resultado.hbs` e `validar-resultado` SSR
- Atualizar `Content-Disposition` para usar `:codigo` no nome do arquivo
- Atualizar testes de integração

---

### SPEC-02 — Camada de abstração transversal para geração e cache de PDFs

**Motivação:** VA-001 e DT-001 indicam ausência de controller/service layer para o fluxo de download. A geração sob demanda sem cache gera custo de I/O repetitivo (2 calls R2 por request). Uma camada de abstração poderia centralizar: rate limiting, validação de status, geração, headers e, opcionalmente, cache de curta duração.

**Escopo proposto:**
- Criar `certificadoController.downloadPdf()` ou equivalente SSR
- Centralizar validação de status antes da geração
- Definir política de headers HTTP uniforme
- Definir se e como cachear buffers de PDF (em memória, Redis ou armazenamento temporário)

---

## 7. Problemas Sistêmicos Observados

### P-01 — Identificador de exposição pública inadequado

O endpoint `GET /api/certificados/:id/pdf` usa o PK auto-incremental do banco como identificador público de um recurso sensível. Este padrão cria risco sistêmico de enumeração presente em qualquer endpoint público que use IDs sequenciais. O código do certificado (`codigo`) foi projetado (FR-52) precisamente como identificador de autenticidade pública, mas não é usado como parâmetro de download.

### P-02 — Ausência de proteção transversal (rate limit) em todos os endpoints públicos exceto login

O rate limiting está exclusivamente aplicado ao `POST /usuarios/login` (FR-55). Todos os outros endpoints públicos — `GET /api/certificados/:id/pdf`, `GET /api/certificados?email`, `GET /api/validar/:codigo` — operam sem qualquer controle de taxa. O pacote `express-rate-limit` está disponível e funcional, indicando que a ausência é uma lacuna de requisito, não de capacidade técnica.

### P-03 — Vias de exposição de dados sensíveis em logs de produção

`pdfService.js` expõe dados completos do certificado (incluindo PII) via `console.log`. A ausência de um logger estruturado com redação de dados sensíveis é um risco transversal que afeta qualquer domínio que acesse dados de participantes. Os `console.warn` de falhas R2 no mesmo arquivo expõem detalhes de erros de infraestrutura.

### P-04 — Divergência entre identificador exposto em views e endpoint correto

A view `views/admin/certificados/detalhe.hbs` aponta para `/public/certificados/:id/pdf` (inexistente), enquanto as views públicas apontam corretamente para `/api/certificados/:id/pdf`. Esta divergência indica ausência de uma fonte de verdade centralizada para a construção de URLs de download. Se a rota mudar, múltiplos pontos de referência precisarão ser atualizados manualmente.

### P-05 — Violação sistemática de NFR-6 nos endpoints públicos

`api.js` contém integralmente a lógica de busca, geração e resposta para o PDF — sem controller nem service intermediário. `public.js` contém lógica de busca direta ao modelo para validação e listagem. Nenhuma rota em `api.js` ou `public.js` delega a controllers ou services existentes. Isso é uma violação sistemática de NFR-6 concentrada nos endpoints públicos do sistema.

### P-06 — Acoplamento entre geração e download sem separação de responsabilidades

O endpoint de download (`GET /api/certificados/:id/pdf`) é simultaneamente responsável por: (1) buscar o certificado no banco, (2) validar existência, (3) gerar o PDF via pdfService, (4) definir headers e (5) enviar a resposta. Esta concentração impede evolução independente de cada responsabilidade (e.g., adicionar validação de status sem tocar na lógica de geração).

---

*Auditoria gerada em 2026-05-09 às 23:11 (BRT). Baseada exclusivamente em evidências encontradas nos arquivos fonte listados na seção "Fontes Analisadas". Nenhum dado foi extrapolado ou assumido sem evidência direta.*
