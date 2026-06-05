# Auditoria de Domínio — Upload / R2 / Arquivos

**Data:** 2026-05-09 20:12 (BRT)  
**Auditor:** GitHub Copilot — Arquiteto de Software Sênior  
**Versão do SRS auditada:** 2.0 (2026-04-30)  
**Branch:** main

---

## 1. Escopo Auditado

### Arquivos de Código

| Arquivo | Papel |
|---|---|
| `src/services/r2Service.js` | Integração com Cloudflare R2 (upload, download, delete) |
| `src/services/pdfService.js` | Geração de PDF usando assets do R2 |
| `src/services/templateService.js` | Interpolação de texto_base com valores_dinamicos |
| `src/services/eventoService.js` | CRUD de eventos (inclui update com url_template_base) |
| `src/services/certificadoService.js` | Geração de código de validação e criação de certificado |
| `src/middlewares/uploadTemplate.js` | multer — validação de MIME e tamanho de arquivo |
| `src/controllers/eventoSSRController.js` | Orquestração de upload SSR: `buildTemplateKey`, `handleTemplateUpload` |
| `src/controllers/eventoController.js` | Controller REST de eventos (sem upload) |
| `src/controllers/certificadoSSRController.js` | JSON.parse de valores_dinamicos no SSR |
| `src/routes/admin.js` | Rotas SSR admin — upload via `uploadTemplate` middleware |
| `src/routes/eventos.js` | Rotas REST de eventos — sem suporte a upload |
| `src/routes/certificados.js` | Rotas REST de certificados |
| `src/routes/api.js` | Rotas públicas: PDF, busca por e-mail, validação por código |
| `src/routes/tipos-certificados.js` | Rotas de tipos de certificados |
| `src/models/evento.js` | Model Evento — campo `url_template_base` (STRING, allowNull: true) |
| `src/models/certificado.js` | Model Certificado — `valores_dinamicos` (JSONB) |
| `src/validators/evento.js` | Zod schema evento — validação de `url_template_base` |
| `src/validators/certificado.js` | Zod schema certificado |
| `src/middlewares/scopedEvento.js` | Enforcement de escopo multi-tenant |
| `src/middlewares/tiposCertificadosOwnership.js` | Ownership de tipos por gestor |
| `src/middlewares/authSSR.js` | Autenticação SSR (cookie JWT) |
| `migrations/20260416092527-add-url-template-base-to-eventos.js` | Migration: coluna url_template_base |
| `migrations/20260416201114-add-layout-fields-to-eventos.js` | Migration: campos de layout de PDF |
| `.env.example` | Variáveis de ambiente documentadas |
| `app.js` | Inicialização e validação de variáveis de ambiente |
| `tests/services/r2Service.test.js` | Teste de integração real com R2 |
| `tests/services/pdfService.test.js` | Testes unitários de pdfService |

### Integrações e Providers

- **Cloudflare R2** via AWS SDK S3-compatible (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`)
- **multer** (`memoryStorage`) para recepção de arquivos em memória
- **PDFKit** para geração de PDF com assets do R2

### Rotas Relevantes

| Método | Rota | Autenticação |
|---|---|---|
| POST | `/admin/eventos` | authSSR + rbac(admin) + uploadTemplate |
| POST | `/admin/eventos/:id` | authSSR + rbac(admin) + uploadTemplate |
| PUT | `/eventos/:id` | auth (JWT Bearer) + rbac(monitor) + scopedEvento |
| GET | `/api/certificados/:id/pdf` | **Pública — sem autenticação** |
| GET | `/api/certificados?email=...` | **Pública — sem autenticação** |
| GET | `/api/validar/:codigo` | **Pública — sem autenticação** |

---

## 2. Matriz de Achados

| ID | Categoria | Descrição | Severidade | Tipo | Evidências | Requisitos Relacionados | Impacto |
|---|---|---|---|---|---|---|---|
| A-01 | Segurança — Validação de Upload | O middleware `uploadTemplate.js` valida o MIME type **apenas** pelo campo `file.mimetype` reportado pelo cliente (header `Content-Type` do multipart). Não há verificação de magic bytes no servidor. Um atacante pode renomear um arquivo malicioso (ex: `.php`, `.js`, `.exe`) para `.jpg`, definir `Content-Type: image/jpeg` e submeter ao endpoint. O arquivo é armazenado no R2 sem validação real de conteúdo. | Alta | VU | `src/middlewares/uploadTemplate.js:10` — `ALLOWED_MIMES.includes(file.mimetype)` — nenhuma leitura de bytes do arquivo; `req.file.buffer` está disponível mas não é inspecionado | NFR-11, FR-51 | Upload de arquivos com conteúdo arbitrário: malware, scripts, binários disfarçados de imagem |
| A-02 | Lifecycle — Arquivo Órfão no R2 ao Atualizar Evento | Quando um evento é atualizado com novo template (`POST /admin/eventos/:id`), o controller faz upload do novo arquivo ao R2 e atualiza `url_template_base`, mas **nunca chama `r2Service.deleteFile`** para remover o arquivo anterior. O arquivo antigo permanece indefinidamente no bucket sem referência no banco. | Alta | GI | `src/controllers/eventoSSRController.js:140-147` — `atualizar()` chama `handleTemplateUpload()` sem ler o `url_template_base` anterior; nenhuma chamada a `r2Service.deleteFile` em todo o controller | FR-51 | Acumulação ilimitada de arquivos órfãos no R2; custo crescente de armazenamento; impossibilidade de auditar uso de storage |
| A-03 | Segurança — PDF Gerado sem Verificar Status do Certificado | A rota pública `GET /api/certificados/:id/pdf` gera PDF para **qualquer certificado existente**, independentemente do status (`cancelado`, `pendente`, `emitido`). Um certificado cancelado continua sendo acessível como PDF. | Alta | VU | `src/routes/api.js:46-66` — busca `Certificado.findByPk(id)` e checa apenas existência, sem verificar `status`; `src/services/pdfService.js` não verifica status | FR-43, FR-42 | Certificados cancelados continuam acessíveis publicamente como PDF; violação de integridade de dados |
| A-04 | Configuração — Variáveis R2 sem Validação na Inicialização | `JWT_SECRET` e `SESSION_SECRET` são validados com `throw new Error()` na inicialização da aplicação. As variáveis `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET` **não são validadas**. Se ausentes, o `S3Client` é instanciado com valores `undefined`, e falhas só ocorrem em runtime durante o primeiro uso do R2 (upload ou geração de PDF). | Alta | VU | `app.js` — valida apenas `SESSION_SECRET`; `src/middlewares/auth.js:5` — valida apenas `JWT_SECRET`; `src/services/r2Service.js:11-19` — `process.env.R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, etc. sem guarda; `NFR-3` menciona somente JWT e SESSION | NFR-3, FR-51, FR-47 | Erro de startup silencioso: aplicação inicia sem R2, uploads e PDFs falham apenas em runtime; difícil diagnóstico em produção |
| A-05 | Inconsistência API vs SSR — Upload de Template Ausente na API REST | A API REST (`PUT /eventos/:id`) não inclui o middleware `uploadTemplate` nem lógica de upload. Templates só podem ser enviados via interface SSR. O validator Zod aceita `url_template_base` como `z.string().url()`, mas a API não expõe o fluxo de upload multipart. | Média | GI | `src/routes/eventos.js:159-165` — `router.put('/:id', auth, rbac, scopedEvento, validate, eventoController.update)` — sem `uploadTemplate`; `src/routes/admin.js:89-94` — somente SSR tem `uploadTemplate` | FR-51, NFR-6 | Gestores que usam a API REST não conseguem atualizar o template de um evento; assimetria funcional entre os dois modos de consumo |
| A-06 | Inconsistência — Validator Zod Trata `url_template_base` Como URL, Mas o Campo É uma Key R2 | O validator `src/validators/evento.js` define `url_template_base: z.string().url()`. Porém, FR-44 especifica que esse campo armazena a **key** (caminho) do arquivo no R2 (ex: `templates/meu-evento/2026/base.jpg`), **não uma URL**. A validação da API REST rejeitaria um path de key R2 como inválido por não ser uma URL. | Média | ID | `src/validators/evento.js:7` — `z.string().url()`; FR-44 — "armazena a **key** (caminho) do arquivo de template-base no Cloudflare R2"; `src/controllers/eventoSSRController.js:29` — a key gerada é `templates/slug/ano/base.ext` | FR-44, NFR-6 | Via API REST, não é possível atribuir uma key R2 válida ao campo; violação semântica do SRS |
| A-07 | Geração de Key — Slug Pode Ser Vazio ou Colidente | A função `buildTemplateKey` em `eventoSSRController.js` gera o slug do nome do evento removendo acentos, espaços e caracteres especiais. Se o nome contiver **apenas caracteres especiais ou dígitos**, o slug resultante pode ser vazio (`""`), produzindo uma key inválida: `templates//2026/base.jpg`. Adicionalmente, dois eventos com nomes diferentes mas slugs iguais ao ano compartilhariam a mesma key R2, causando sobreescrita silenciosa. | Média | BR | `src/controllers/eventoSSRController.js:10-18` — `slug = nome.toLowerCase().normalize('NFD').replace(...)...replace(/[^a-z0-9-]/g, '')` — sem validação de slug vazio; sem detecção de colisão de key | FR-51 | Key malformada no R2; sobreescrita de template de outro evento sem aviso |
| A-08 | Lifecycle — Upload ao R2 Antes da Validação do Evento | Em `handleTemplateUpload`, o arquivo é enviado ao R2 **antes** de `eventoService.create(data)` ser chamado. Se a criação do evento falhar (ex: `codigo_base` duplicado, validação Sequelize falha), o arquivo já foi persistido no R2 sem registro correspondente no banco de dados — arquivo órfão imediato. | Alta | BR | `src/controllers/eventoSSRController.js:107-118` — sequência: `urlTemplateBase = await handleTemplateUpload(req)` → `await eventoService.create(data)` — sem transação ou rollback do R2 | FR-51 | Arquivo órfão criado a cada falha de criação de evento com template; impossível detectar ou limpar automaticamente |
| A-09 | Multi-tenant — scopedEvento Usa `req.params.id` Como `evento_id` em Rotas de Recurso | O middleware `scopedEvento` extrai o ID de: `req.body.evento_id || req.params.eventoId || req.params.id`. Para rotas como `PUT /certificados/:id`, `req.params.id` contém o **ID do certificado**, não o ID do evento. Se o ID do certificado coincidir numericamente com o ID de um evento do qual o gestor é responsável, o middleware autoriza incorretamente o acesso. Se não coincidir, bloqueia legitimamente. Isso gera comportamento não determinístico de autorização. | Alta | VU | `src/middlewares/scopedEvento.js:36-41` — `const eventoId = req.body.evento_id || req.params.eventoId || req.params.id`; `src/routes/certificados.js:183-197` — PUT e DELETE usam `scopedEvento` passando apenas `:id` do certificado | FR-37, NFR-1 | Falha de enforcement de escopo multi-tenant: acesso pode ser concedido ou negado incorretamente com base em coincidência numérica de IDs |
| A-10 | Segurança — Vazamento de Dados de Certificado em Log | `pdfService.js` possui um `console.log('PDFService certificado:', certificado)` que loga o objeto certificado completo (incluindo `valores_dinamicos`, participante, dados do evento) antes de qualquer sanitização. | Média | VU | `src/services/pdfService.js:16` — `console.log('PDFService certificado:', certificado)` — chamada sem proteção de ambiente | NFR-1, NFR-2 | Vazamento de dados pessoais em logs de servidor (OWASP A09); especialmente crítico em ambiente de produção |
| A-11 | Anti-pattern — `new Promise(async ...)` no pdfService | `pdfService.js` usa o padrão `new Promise(async (resolve, reject) => {...})`. Este anti-pattern pode causar unhandled promise rejections se exceções forem lançadas após o `doc.end()` ou em callbacks assíncronos, pois o `reject` exterior pode nunca ser chamado. | Baixa | DT | `src/services/pdfService.js:15` — `return new Promise(async (resolve, reject) => {` — o async dentro do construtor do Promise é o anti-pattern clássico | NFR-6 | Potencial unhandled promise rejection em erros de borda; dificuldade de debugging |
| A-12 | Lifecycle — Nenhum Cleanup de Arquivo ao Soft-Delete de Evento | Quando um evento é soft-deletado, o arquivo de template no R2 continua existindo (sem referência ativa). Quando restaurado, o campo `url_template_base` ainda aponta para a key original — o que pode ser correto, mas o arquivo pode ter sido manualmente removido do R2 no intervalo. Não há verificação de existência no R2 antes de usar a key. | Baixa | GI | `src/services/eventoService.js:47-59` — `delete` e `restore` não interagem com R2; `src/services/pdfService.js:36` — usa a key diretamente sem verificar disponibilidade | FR-9, FR-51 | Eventual falha silenciosa ao gerar PDF de certificado de evento soft-deletado e restaurado onde o arquivo foi removido manualmente do R2 |
| A-13 | Configuração — `ENDERECO_VALIDACAO` Ausente do `.env.example` | O `pdfService.js` usa `process.env.ENDERECO_VALIDACAO` com fallback para `'https://certificaaqui.com/validar'`. Essa variável não está documentada no `.env.example`, impossibilitando a configuração para outros ambientes de homologação/produção. | Baixa | GI | `src/services/pdfService.js:117-118`; `.env.example` — `ENDERECO_VALIDACAO` ausente | FR-47d | PDFs gerados em homologação conterão link apontando para produção (`certificaaqui.com`); comportamento confuso para auditoria |
| A-14 | Segurança — Key R2 Derivada de Input do Usuário sem Proteção Contra Path Traversal | A key R2 é construída com `req.body.nome` e `req.body.ano` (dados do formulário). Embora o slug seja sanitizado, `ano` é usado sem transformação após `String(ano)`. Um valor como `ano = "../../config"` poderia ser injetado se a validação Zod falhar. No momento, o validator Zod valida `ano` como `z.number().int().gte(2000)` no fluxo API REST, mas no fluxo SSR o `req.body.ano` chega como string (formulário HTML) e `String(ano)` não faz validação numérica. | Média | VU | `src/controllers/eventoSSRController.js:22` — `return \`templates/${slug}/${ano}/base.${ext}\`` com `ano = String(req.body.ano)` sem `parseInt`/validação numérica prévia no fluxo SSR; `buildTemplateKey` não valida `ano` | FR-51, NFR-11 | Path traversal parcial na key R2 — embora R2 não seja um filesystem local, keys malformadas podem contornar políticas de bucket e criar ambiguidade de acesso |
| A-15 | Segurança — Enumeração de IDs de Certificado na Rota de PDF | A rota pública `GET /api/certificados/:id/pdf` aceita qualquer ID inteiro e gera PDF sem autenticação. Um ator malicioso pode varrer IDs sequencialmente (1, 2, 3...) para enumerar e baixar todos os certificados do sistema. | Alta | VU | `src/routes/api.js:44-66` — rota pública sem rate limiting, sem autenticação, sem restrição de acesso; IDs são inteiros incrementais | FR-42, NFR-1 | Exposição de todos os certificados emitidos via varredura de IDs; dados pessoais de participantes em PDFs acessíveis publicamente |
| A-16 | Segurança — Enumeração via Email na Rota Pública | A rota `GET /api/certificados?email=...` retorna 404 `{"error": "Participante não encontrado"}` quando o e-mail não existe, e 200 com lista de certificados quando existe. Isso permite confirmar se um e-mail está cadastrado no sistema (OWASP A01: Broken Access Control / Information Disclosure). | Média | VU | `src/routes/api.js:106-118` — mensagens de erro diferenciadas para participante inexistente vs. ausência de certificados | FR-53, FR-25 | Oracle de e-mail: permite descobrir se um e-mail é participante do sistema sem autenticação |
| A-17 | Integridade — `valores_dinamicos` Não Validado no Fluxo SSR por Schema Zod | No fluxo SSR (`criar`, `atualizar` em `certificadoSSRController.js`), `valores_dinamicos` é obtido via `JSON.parse(req.body.valores_dinamicos_json || '{}')` sem validação de schema Zod. A validação dos campos dinâmicos ocorre apenas no service (`certificadoService.create`), que verifica campos faltantes. Mas estrutura inválida e XSS em valores não são detidos. | Média | GI | `src/controllers/certificadoSSRController.js:156-157` — JSON.parse direto sem validação de tipos/estrutura; `src/services/certificadoService.js:45-51` — verifica apenas campos faltantes, não tipos ou sanitização | FR-54, NFR-6 | Dados arbitrários inseridos em `valores_dinamicos` via SSR; potencial XSS se interpolados em views sem sanitização |
| A-18 | Integridade — `r2Service.test.js` É Teste de Integração Real sem Isolamento | O arquivo `tests/services/r2Service.test.js` conecta-se ao R2 real (não usa mock), requer as variáveis de ambiente de produção/staging e escreve/lê/deleta arquivos reais no bucket. Isso viola NFR-8 (banco/storage dedicado para testes). | Média | DT | `tests/services/r2Service.test.js:1-30` — `require('dotenv').config()`, `r2Service.uploadFile(...)` — sem mock; Jest config provavelmente exclui isso por ser E2E, mas não está documentado | NFR-8, NFR-9 | Risco de contaminação do storage de produção em execução de testes; dependência de credenciais reais |
| A-19 | Ambiguidade — SRS Especifica `url_template_base` Como "URL válida" em FR-44 Mas Como "Key" na Descrição | FR-44 diz: "deve conter uma URL válida (ou ser null). Esse campo armazena a **key** (caminho) do arquivo de template-base no Cloudflare R2." Há contradição interna: URL válida vs. key/caminho. O campo pode ser uma URL pública R2 ou apenas o caminho interno. O comportamento do código armazena como key (caminho), não como URL. | Média | AM | FR-44 — "URL válida" e "key (caminho)" no mesmo requisito; `src/validators/evento.js:7` — `z.string().url()` segue a semântica "URL válida"; `src/controllers/eventoSSRController.js:29` — armazena como key | FR-44 | Ambiguidade que causa bug real no validator (A-06); necessita decisão de produto: URL pública ou key interna? |
| A-20 | Violação Arquitetural — Lógica de Upload no Controller SSR em Vez de Service | A função `handleTemplateUpload` e `buildTemplateKey` residem em `eventoSSRController.js` — um controller de apresentação. Lógica de negócio (geração de key R2, upload) deve residir em services segundo NFR-6 (camadas: routes → controllers → services). | Baixa | VA | `src/controllers/eventoSSRController.js:10-30` — funções `buildTemplateKey` e `handleTemplateUpload` com lógica de negócio R2 no controller SSR; nenhuma abstração em service | NFR-6 | Lógica de negócio duplicável e não testável unitariamente de forma isolada; acoplamento direto controller-R2 |

---

## 3. Vulnerabilidades e Riscos de Segurança

### 3.1 Validação de Upload (MIME Type / Extensão)

**Severidade: Alta | Tipo: VU**

O filtro de MIME type é executado apenas pelo campo `file.mimetype` do multer, que reflete o header `Content-Type` enviado pelo cliente no payload multipart. Não há validação de magic bytes (file signature) server-side.

**Vetor:**
```
POST /admin/eventos (multipart)
Content-Disposition: form-data; name="template_base"; filename="webshell.php.jpg"
Content-Type: image/jpeg

<?php system($_GET['cmd']); ?>
```

O arquivo passa na validação do middleware e é enviado ao R2 com `ContentType: image/jpeg`. Se o R2 servir arquivos com o tipo informado sem revalidação, e se houver alguma rota de download que sirva o arquivo com execução, isso se torna exploitável.

**Evidência:** `src/middlewares/uploadTemplate.js:10`

---

### 3.2 Enumeração de Certificados via PDF Público (IDOR)

**Severidade: Alta | Tipo: VU**

A rota `GET /api/certificados/:id/pdf` é pública, sem autenticação e sem rate limiting. IDs são números inteiros sequenciais. Um atacante pode varrer todos os IDs para obter PDFs de todos os certificados do sistema, expondo dados pessoais de participantes.

**Vetor:** `for i in {1..10000}; do curl -o cert_$i.pdf http://target/api/certificados/$i/pdf; done`

**Evidência:** `src/routes/api.js:44-66`

---

### 3.3 PDF Disponível para Certificados Cancelados

**Severidade: Alta | Tipo: VU**

Certificados com `status: 'cancelado'` continuam sendo gerados e servidos via `GET /api/certificados/:id/pdf`. O lifecycle de cancelamento não afeta a disponibilidade do PDF.

**Evidência:** `src/routes/api.js:46-56` (sem filtro de status); `src/services/pdfService.js:18` (verifica apenas presença de `codigo`)

---

### 3.4 Path Traversal Parcial na Key R2

**Severidade: Média | Tipo: VU**

A key R2 é construída a partir de `req.body.ano` sem validação numérica no fluxo SSR. O slug é sanitizado, mas o componente `ano` é injetado diretamente como string.

**Evidência:** `src/controllers/eventoSSRController.js:11-22`

---

### 3.5 Oracle de E-mail via Rota Pública

**Severidade: Média | Tipo: VU**

A rota `GET /api/certificados?email=...` retorna mensagens de erro distintas para e-mail inexistente vs. participante sem certificados, permitindo confirmar existência de e-mails cadastrados.

**Evidência:** `src/routes/api.js:103-118`

---

### 3.6 Variáveis de Credenciais R2 sem Validação de Startup

**Severidade: Alta | Tipo: VU**

Ausência de verificação de `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET` na inicialização. A aplicação sobe sem R2 funcional e falha silenciosamente em runtime.

**Evidência:** `src/services/r2Service.js:11-19`; `app.js` (ausência de guarda para R2)

---

### 3.7 Vazamento de Dados em Log de Produção

**Severidade: Média | Tipo: VU**

`console.log('PDFService certificado:', certificado)` imprime o objeto completo do certificado — incluindo dados do participante e valores dinâmicos — em logs de servidor sem proteção de ambiente.

**Evidência:** `src/services/pdfService.js:16`

---

## 4. Consistência Arquitetural

### 4.1 Separação Controller / Service

| Ponto | Avaliação |
|---|---|
| `eventoSSRController.js` hospeda `buildTemplateKey()` e `handleTemplateUpload()` | **Violação**: lógica de negócio e chamada a serviço externo (R2) num controller SSR |
| `eventoController.js` (API REST) não tem upload | **Consistente** com escopo limitado SSR-only do FR-51, mas cria assimetria funcional |
| `certificadoSSRController.js` faz `JSON.parse` e chama `certificadoService.create` | **Parcialmente correto** — parse no controller é aceitável, mas ausência de validação adicional é gap |

### 4.2 Responsabilidade do Middleware

| Middleware | Avaliação |
|---|---|
| `uploadTemplate.js` | Função correta (recepção + filtro MIME), mas validação insuficiente (sem magic bytes) |
| `scopedEvento.js` | **Bug de lógica** em rotas de recurso: confunde `req.params.id` do recurso com `evento_id` (A-09) |
| `tiposCertificadosOwnership.js` | Correto — verifica ownership pelo `evento_id` do tipo, não pelo `:id` de rota |

### 4.3 Consistência SSR / API

| Funcionalidade | SSR | API REST | Consistência |
|---|---|---|---|
| Upload de template de evento | ✅ Suportado | ❌ Ausente | **Inconsistente** |
| Validação de `url_template_base` | Armazena como key | Valida como URL | **Inconsistente** |
| Criação de evento | Inclui upload + key | JSON puro | **Diferença de contrato** |
| Listagem de certificados públicos | `/obter` + SSR | `/api/certificados?email=` | Suportado em ambos |
| Download de PDF | Via rota pública `/api/` | Mesma rota, sem SSR específico | **Consistente** |

### 4.4 Lifecycle de Arquivos no R2

| Evento | Comportamento | Problema |
|---|---|---|
| Upload novo template (criação de evento) | Arquivo sobe ao R2, key salva no banco | Arquivo órfão se evento falhar (A-08) |
| Upload novo template (atualização de evento) | Arquivo sobe ao R2, key nova salva no banco | Arquivo antigo **nunca removido** (A-02) |
| Soft-delete de evento | Arquivo R2 **não é tocado** | Referência mantida no banco, mas pode divergir |
| Restauração de evento | Arquivo R2 **não é verificado** | Key pode apontar para arquivo inexistente |
| Delete de bucket manual | Sistema não detecta | PDF falha silenciosamente na geração |

### 4.5 Sincronização Banco / Storage

Não existe nenhum mecanismo de reconciliação entre as keys armazenadas em `url_template_base` e os objetos reais no bucket R2. Não há endpoint de healthcheck de storage, não há job de limpeza, não há listagem de objetos órfãos.

---

## 5. Divergências com o SRS

| ID | Requisito | Descrição da Divergência |
|---|---|---|
| D-01 | FR-44 | O campo `url_template_base` é descrito como "URL válida" e como "key (caminho)" no mesmo requisito — contradição interna que levou ao bug A-06 no validator |
| D-02 | FR-51 | Não especifica o que ocorre com o arquivo antigo no R2 quando o template é substituído — gap que resulta em arquivos órfãos (A-02) |
| D-03 | FR-51 | Não especifica o comportamento quando slug do evento resulta em colisão ou string vazia (A-07) |
| D-04 | FR-43 | Especifica que "geração do PDF só é permitida se o certificado possuir código válido", mas não menciona restrição por `status`. Certificados cancelados possuem código e geram PDF (A-03) |
| D-05 | FR-47d | `ENDERECO_VALIDACAO` é mencionado no SRS mas ausente do `.env.example` e sem guarda de inicialização (A-13) |
| D-06 | NFR-3 | Especifica que `JWT_SECRET` e `SESSION_SECRET` devem ter guarda de startup obrigatória. Credenciais R2 (`R2_ENDPOINT`, etc.) não são mencionadas em NFR-3, criando assimetria no padrão de segurança |
| D-07 | NFR-11 | Especifica "validado por multer", mas não exige validação de magic bytes. A implementação segue a letra do NFR mas não seu espírito de segurança |
| D-08 | FR-42 | Permite download de PDF **sem autenticação**. O SRS é explícito nesse ponto, mas não trata enumeração por ID sequencial (A-15) — gap de especificação |

---

## 6. Itens para Validação Humana

| ID | Decisão Necessária | Contexto |
|---|---|---|
| VH-01 | **`url_template_base` deve ser key R2 ou URL pública do objeto?** | A ambiguidade do FR-44 causa o bug A-06. Se for URL pública, o armazenamento atual está incorreto. Se for key, o validator está incorreto. Decisão de produto/arquitetura. |
| VH-02 | **Certificados cancelados devem ter PDF gerado?** | O SRS (FR-43) filtra apenas pela ausência de código, não pelo status. É uma decisão de produto se o PDF deve ser bloqueado para status `cancelado` e `pendente`. |
| VH-03 | **A rota de PDF pública deve ter rate limiting ou autenticação opcional?** | O acesso público por ID sequencial expõe todos os certificados (A-15). Decisão de política de segurança: manter totalmente público ou adicionar proteção. |
| VH-04 | **Templates de evento antigos devem ser removidos do R2 ao substituir?** | Decisão de política de retenção de arquivos: manter histórico de templates ou limpar o anterior (A-02). |
| VH-05 | **A chave R2 deve ser construída pelo ID do evento (imutável) ou pelo nome (mutable)?** | O slug atual usa o nome do evento, que pode mudar. Se o nome for editado, a próxima atualização de template cria uma nova key, tornando a antiga órfã. Decisão arquitetural. |
| VH-06 | **Deve haver rate limiting na rota de PDF e em `/api/certificados?email=`?** | Questão de política de segurança: proteção contra varredura automatizada. |
| VH-07 | **`r2Service.test.js` deve ser classificado como integration/E2E e separado dos testes unitários?** | Decisão de arquitetura de testes: o teste atual requer credenciais reais e interage com storage externo, violando NFR-8. |

---

## 7. Problemas Sistêmicos Identificados

### 7.1 Ausência Total de Gerenciamento de Lifecycle de Arquivos

O sistema não possui qualquer mecanismo para gerenciar o ciclo de vida de arquivos no R2. Uploads acontecem, mas remoções nunca ocorrem automaticamente. Não existe:
- Remoção do arquivo antigo ao substituir template
- Remoção do arquivo ao soft-delete de evento
- Verificação de existência antes de usar a key
- Job de reconciliação banco ↔ storage
- Endpoint de auditoria de storage

Este é o padrão mais perigoso detectado neste domínio: o R2 é tratado como **write-only storage** sem lifecycle.

### 7.2 Falta de Atomicidade Banco / Storage

As operações de upload ao R2 e persistência no banco **não são atômicas**. Se o upload R2 suceder e a criação do evento falhar (ou vice-versa), o sistema entra em estado inconsistente sem mecanismo de rollback. Isso é agravado por R2 não suportir transações.

### 7.3 Validação de Upload Client-side Only

Toda a validação de tipo de arquivo depende do MIME type fornecido pelo cliente. Não há segunda linha de defesa server-side (magic bytes, scanning de conteúdo). Qualquer bypass de MIME type contorna completamente a proteção.

### 7.4 Variáveis de Ambiente de Storage não Governadas

Enquanto há um padrão estabelecido de validação obrigatória em startup para algumas variáveis (`JWT_SECRET`, `SESSION_SECRET`), as credenciais R2 seguem o padrão oposto: silenciosamente ausentes. Isso cria inconsistência de governança de configuração.

### 7.5 `scopedEvento` com Lógica de Fallback Perigosa

O middleware usa `req.params.id` como fallback para `evento_id` quando nem `req.body.evento_id` nem `req.params.eventoId` estão presentes. Para rotas de recursos (certificados, participantes) onde `:id` é o ID do recurso, o comportamento de autorização torna-se dependente de coincidência numérica de IDs.

---

## 8. Recomendações de Destinação

| ID Achado | Descrição | Destinação | Prioridade |
|---|---|---|---|
| A-01 | Validação de upload por MIME client-side only | **Correção imediata** (vulnerabilidade) | Crítica |
| A-02 | Arquivo R2 órfão ao atualizar template | **Backlog técnico** (requer decisão VH-04 antes) | Alta |
| A-03 | PDF gerado para certificados cancelados | **Correção imediata** (bug real + gap de spec) | Alta |
| A-04 | Variáveis R2 sem guarda de startup | **Correção imediata** (vulnerabilidade operacional) | Alta |
| A-05 | Upload de template ausente na API REST | **Backlog técnico** (gap de funcionalidade) | Média |
| A-06 | Validator Zod trata key R2 como URL | **Correção imediata** (bug real — bloqueia API) | Alta |
| A-07 | Slug vazio ou colisão de key R2 | **Backlog técnico** | Média |
| A-08 | Upload ao R2 antes da validação do evento | **Backlog técnico** (requer redesign transacional) | Alta |
| A-09 | `scopedEvento` usa `req.params.id` como `evento_id` | **Correção imediata** (vulnerabilidade de autorização) | Crítica |
| A-10 | `console.log` com dados de certificado | **Correção imediata** (vazamento de dados) | Alta |
| A-11 | Anti-pattern `new Promise(async...)` | **Backlog técnico** | Baixa |
| A-12 | Lifecycle indefinido ao soft-delete/restore | **Futura spec do Spec Kit** | Baixa |
| A-13 | `ENDERECO_VALIDACAO` ausente do `.env.example` | **Correção imediata** (documentação + gap config) | Baixa |
| A-14 | Path traversal parcial em key R2 via `ano` | **Correção imediata** (validação numérica) | Média |
| A-15 | Enumeração de certificados por ID | **ADR arquitetural** + validação VH-03 | Alta |
| A-16 | Oracle de e-mail via rota pública | **Backlog técnico** (mensagem de erro unificada) | Média |
| A-17 | `valores_dinamicos` não validado por Zod no SSR | **Backlog técnico** | Média |
| A-18 | `r2Service.test.js` sem isolamento de storage | **Backlog técnico** + validação VH-07 | Média |
| A-19 | Ambiguidade FR-44 (URL vs. key) | **Atualização do SRS** + validação VH-01 | Alta |
| A-20 | Lógica de upload no controller SSR (violação arquitetural) | **ADR arquitetural** | Baixa |

---

## Resumo Executivo

**Auditoria de Domínio:** Upload / R2 / Arquivos / Storage  
**Data:** 2026-05-09 20:12 (BRT)

### Quantitativos

| Tipo | Quantidade |
|---|---|
| Vulnerabilidades (VU) | **7** |
| Bugs reais (BR) | **2** |
| Gaps de implementação (GI) | **6** |
| Inconsistências documentais (ID) | **1** |
| Dívidas técnicas (DT) | **2** |
| Ambiguidades (AM) | **1** |
| Violações arquiteturais (VA) | **1** |
| **Total de achados** | **20** |

### Problemas Críticos

| Severidade | Quantidade |
|---|---|
| Alta (incluindo Crítica) | **9** |
| Média | **8** |
| Baixa | **3** |

### Principais Riscos de Segurança

1. **[CRÍTICO] Enumeração de certificados por ID** (A-15): todos os PDFs do sistema acessíveis publicamente sem autenticação via varredura de IDs sequenciais.
2. **[CRÍTICO] `scopedEvento` com lógica de fallback para `req.params.id`** (A-09): enforcement de multi-tenant não determinístico em rotas de resource.
3. **[ALTA] Validação de MIME type exclusivamente client-side** (A-01): upload de conteúdo arbitrário disfarçado de imagem.
4. **[ALTA] PDF gerado para certificados cancelados** (A-03): violação de integridade de cycle de vida.
5. **[ALTA] Variáveis de credencial R2 sem guarda de startup** (A-04): falha silenciosa em produção.
6. **[ALTA] `console.log` com dados completos de certificado** (A-10): vazamento de dados pessoais em logs.
7. **[ALTA] Upload ao R2 antes da validação do evento** (A-08): arquivos órfãos criados a cada falha de validação.

### Riscos Multi-tenant

- **A-09** é o risco multi-tenant mais grave: o `scopedEvento` pode incorretamente autorizar ou bloquear gestores em operações de recurso baseadas em coincidência numérica de IDs.
- **A-16**: oracle de e-mail via rota pública — permite confirmar pertencimento de qualquer e-mail ao sistema sem autenticação.
- Não foi identificado vazamento direto de dados de um tenant para outro, mas a lógica de `scopedEvento` é suficientemente frágil para criar cenários de bypass dependentes de dados.

### Possíveis Impactos Arquiteturais Transversais

- **Ausência de gerenciamento de lifecycle de storage** (Seção 7.1) afeta qualquer futuro módulo que use R2: fontes tipográficas, logos, documentos adicionais. O padrão write-only é estruturalmente perigoso.
- **Falta de atomicidade banco/R2** (Seção 7.2) impede garantias de consistência e é difícil de corrigir sem uma camada de compensação (padrão Saga ou queue).
- **Validação de upload client-side** (Seção 7.3) precisará ser resolvida em `uploadTemplate.js` para impactar todos os tipos de upload futuros.
- A ambiguidade FR-44 (A-19/D-01) é necessariamente uma decisão de produto antes que A-06 possa ser corrigido.
