# T04 — Triagem Consolidada do Grupo 1: Storage / Templates / PDF

**Sistema:** Certifique-me  
**Data:** 2026-05-09 22:41 (BRT)  
**Auditor:** GitHub Copilot — Arquiteto de Software Sênior  
**Domínios:** Upload / R2 / Arquivos · Templates / Renderização · Geração de PDF  
**Fontes:**
- `docs/especificacoes.md` (SRS v2.0, 2026-04-30)  
- `docs/auditorias/07/10-upload-r2-arquivos.md`  
- `docs/auditorias/07/11-templates-renderizacao.md`  
- `docs/auditorias/07/12-pdf-geracao.md`

---

## Resumo Executivo

| Indicador | Valor |
|---|---|
| **Total de achados consolidados** | 47 |
| **Achados Críticos** | 3 |
| **Achados de Alta Severidade** | 19 |
| **Achados de Média Severidade** | 14 |
| **Achados de Baixa Severidade** | 11 |
| **Vulnerabilidades (VU)** | 16 |
| **Bugs Reais (BR)** | 11 |
| **Gaps de Implementação (GI)** | 9 |
| **Dívidas Técnicas (DT)** | 6 |
| **Inconsistências Documentais (ID)** | 1 |
| **Violações Arquiteturais (VA)** | 4 |
| **Ambiguidades (AM)** | 2 |
| **Implementações Parciais (IP)** | 1 |
| **Maturidade do Subsistema** | **Baixo** |

**Achados críticos:** falha de enforcement multi-tenant affetando acesso cruzado de certificados (scopedEvento), ausência de restrição de escopo nas rotas SSR admin e serviço que retorna todos os certificados do sistema sem filtro de evento.

**Principais riscos de segurança de assets:** XSS stored via JSONB em contexto `<script>`, ausência de CSP, MIME validation sem magic bytes, enumeração de certificados por ID sequencial (IDOR), log de dados pessoais em produção, ausência de validação de credenciais R2 na inicialização.

**Falhas de isolamento entre eventos:** três vetores críticos — scopedEvento com lógica incorreta para recursos secundários, rotas SSR sem escopo de evento, findAll sem filtro de evento_id — permitem que gestores de um evento acessem/modifiquem certificados de qualquer outro evento.

**Riscos no pipeline de PDF:** link de download quebrado no painel admin (404), alias Sequelize errado no controller SSR (previews vazios), race condition na geração de código, arquivos R2 sem timeout, geração de PDF para certificados cancelados sem política definida.

---

# 1. Matriz Consolidada de Achados (Grupo 1)

> Achados repetidos entre as três auditorias foram consolidados em uma entrada única. As referências de origem estão indicadas na coluna Evidência.

| ID | Domínio | Descrição | Severidade | Tipo | Impacto no Sistema | Evidência |
|---|---|---|---|---|---|---|
| **C-01** | Upload + PDF | `scopedEvento` usa `req.params.id` do **certificado** como `evento_id` em rotas de recurso; coincidência numérica de IDs autoriza ou bloqueia incorretamente | Crítica | VU + BR | Quebra de isolamento multi-tenant em todas as operações de leitura/escrita de certificados individuais via API REST | `scopedEvento.js:36-41`; A-09, PDF-01 |
| **C-02** | PDF | Rotas SSR admin de certificados (`GET/POST /admin/certificados/:id`) não aplicam nenhuma verificação de escopo de evento — apenas `rbac` de perfil | Crítica | VU | Gestor de evento A pode visualizar, editar, cancelar e deletar certificados de qualquer evento B via interface SSR | `src/routes/admin.js` (rotas `/certificados/:id`); PDF-02 |
| **C-03** | PDF | `certificadoService.findAll` não filtra por `evento_id`; `certificadoController` não lê `req.query.evento_id` injetado pelo `scopedEvento` | Crítica | VU + BR | `GET /certificados` retorna todos os certificados do sistema para qualquer usuário autenticado | `certificadoController.js`; `certificadoService.js:findAll`; PDF-03 |
| **C-04** | Templates + PDF | XSS stored via `{{{json certificado.valores_dinamicos}}}` (triple-mustache) dentro de bloco `<script>` no formulário SSR de certificados | Alta | VU | Payload JSONB do banco executado como código JS no browser; OWASP A03:2021 | `views/admin/certificados/form.hbs:71`; TR-01 |
| **C-05** | Templates | XSS stored via `{{{json tipo.dados_dinamicos}}}` (triple-mustache) dentro de bloco `<script>` no formulário SSR de tipos-certificados | Alta | VU | Dados JSONB controlados por gestor/admin executados como código JS; OWASP A03:2021 | `views/admin/tipos-certificados/form.hbs:106`; TR-02 |
| **C-06** | Templates + PDF | Ausência de Content Security Policy (CSP) nos layouts `layout.hbs` e `layouts/admin.hbs`; amplifica superfície de XSS (C-04, C-05) | Alta | VU | Qualquer XSS encontrado executa sem restrição de `script-src`; OWASP A03 | `views/layout.hbs`; `views/layouts/admin.hbs`; TR-25 |
| **C-07** | Upload + Templates | Credenciais R2 (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) não validadas na inicialização; aplicação sobe sem R2 funcional | Alta | VU | Uploads e geração de PDF falham apenas em runtime; diagnóstico difícil em produção | `app.js` (ausência de guarda); `r2Service.js:11-19`; A-04 |
| **C-08** | Upload + Templates | Arquivo R2 enviado **antes** da validação/criação do evento; falha posterior no banco gera arquivo órfão imediato | Alta | BR | Arquivos órfãos acumulam no R2 a cada falha de criação de evento com template | `eventoSSRController.js:107-118`; A-08, TR-21 |
| **C-09** | Upload + Templates | Ao atualizar template de evento, o arquivo anterior no R2 nunca é removido; `url_template_base` é sobrescrito sem cleanup | Alta | GI | Acumulação ilimitada de arquivos órfãos no R2; custo crescente sem rastreabilidade | `eventoSSRController.js:118-135`; A-02, TR-12 |
| **C-10** | Upload + PDF | MIME type validado apenas pelo `file.mimetype` declarado pelo cliente; ausência de verificação de magic bytes (file signature) | Alta | VU | Arquivo malicioso disfarçado de imagem passa na validação e é persistido no R2 | `uploadTemplate.js:8-13`; A-01, TR-10 |
| **C-11** | Upload + PDF | `GET /api/certificados/:id/pdf` público aceita qualquer ID inteiro sem autenticação e sem rate limiting; IDs são sequenciais | Alta | VU | Enumeração (IDOR): varredura de IDs baixa PDFs com dados pessoais de todos os participantes | `src/routes/api.js:43`; A-15, PDF-10 |
| **C-12** | Upload + Templates + PDF | `console.log('PDFService certificado:', certificado)` loga o objeto completo com PII (nome, email, valores_dinamicos) a cada geração de PDF | Alta | VU | Dados pessoais expostos nos logs de servidor; OWASP A09 — Security Logging | `pdfService.js:16`; A-10, TR-16, PDF-08 |
| **C-13** | Templates + PDF | `url_template_base` via API REST aceita qualquer URL externa válida pelo validator Zod (`.url()`); SSRF potencial se implementação mudar | Alta | VU | Persistência de URL adversária no banco; `r2Service.getFile` usaria essa key causando erro ou SSRF futuro | `validators/evento.js:8`; `routes/eventos.js:163`; TR-05 |
| **C-14** | Templates | `UsuarioEvento.destroy` executa remoção **permanente** (não soft delete) ao deletar evento; `UsuarioEvento.restore` nada restaura por consequência | Alta | BR | Evento restaurado perde todas as vinculações com gestores/monitores; invariante NFR-4 violado | `eventoService.js:49-59` e `61-69`; TR-27, TR-28 |
| **C-15** | Templates + PDF | Link de download de PDF no painel admin aponta para rota inexistente (`/public/certificados/:id/pdf` não existe; correto: `/api/certificados/:id/pdf`) | Alta | BR | Botão "Baixar PDF" sempre retorna HTTP 404 para usuários autenticados no painel admin | `views/admin/certificados/detalhe.hbs:5`; TR-07, PDF-04 |
| **C-16** | Templates + PDF | Alias `TiposCertificado` (singular) acessado no `certificadoSSRController.detalhe` diverge do alias `TiposCertificados` (plural) definido no `INCLUDES`; texto interpolado nunca exibido | Alta | BR | Card "Texto do Certificado" sempre vazio no detalhe SSR; funcionalidade completamente inoperante | `certificadoSSRController.js:82` vs `15`; TR-08, PDF-05 |
| **C-17** | PDF | Race condition TOCTOU na geração do código de certificado: `count()` + `create` sem transação atômica | Alta | BR | Colisão de `codigo` (campo UNIQUE) → `SequelizeUniqueConstraintError` não tratado → HTTP 500 sob carga concorrente | `certificadoService.js:count()` + `Certificado.create`; PDF-06 |
| **C-18** | PDF | `count()` exclui soft-deletados (model paranoid); incremento `count+1` pode colidir com código de certificado soft-deletado que ainda detém constraint UNIQUE global | Alta | BR | Geração falha com `SequelizeUniqueConstraintError` após soft-deletes; situação não tratada | `certificadoService.js`; PDF-07 |
| **C-19** | Upload + Templates | Slug derivado do nome do evento pode ser vazio (nome com apenas caracteres especiais) gerando key malformada `templates//<ano>/base.ext`; dois eventos com slugs idênticos compartilham e sobrescrevem a mesma key R2 | Média | BR | Key malformada ou sobreescrita silenciosa de template de outro evento no R2 | `eventoSSRController.js:10-18`; A-07, PDF-15, PDF-16 |
| **C-20** | Upload | Key R2 construída com `req.body.ano` sem validação numérica no fluxo SSR; `String(req.body.ano)` aceita arrays ou objetos gerando keys inconsistentes | Média | VU | Key R2 corrompida para `ano` inválido; comportamento de bucket não determinístico | `eventoSSRController.js:22`; A-14, TR-04 |
| **C-21** | Upload + Templates | `buildTemplateKey` usa `req.body.nome` e `req.body.ano` (dados do body) ao atualizar evento; diverge do estado atual do banco se nome/ano mudar simultaneamente ao upload | Média | BR | Key nova inconsistente com key anterior; arquivo antigo fica órfão e key nova não representa o estado do evento | `eventoSSRController.js:25-31`; TR-13 |
| **C-22** | Upload | `GET /api/certificados?email=...` retorna mensagens de erro distintas para e-mail inexistente vs. participante sem certificados; oracle de e-mail | Média | VU | Confirmação de presença de e-mail no sistema sem autenticação; OWASP A01 | `src/routes/api.js:103-118`; A-16 |
| **C-23** | Templates + PDF | `GET /api/validar/:codigo` não aplica `CODIGO_CERTIFICADO_REGEX` enquanto a rota SSR equivalente aplica; strings arbitrárias passam ao banco sem validação | Média | VU | Inconsistência de segurança entre API e SSR; facilita enumeração de códigos sem restrição de formato | `src/routes/api.js:84`; TR-19, PDF-11 |
| **C-24** | Templates + PDF | `valores_dinamicos` não validado por Zod no fluxo SSR; `JSON.parse` direto sem sanitização; XSS potencial se valores interpolados em views sem escape | Média | GI | Dados arbitrários em `valores_dinamicos` via SSR; risco de XSS stored se futura view usar triple-mustache | `certificadoSSRController.js:156-157`; A-17 |
| **C-25** | Upload + Templates | `r2Service.getFile` não possui timeout configurado; indisponibilidade do R2 bloqueia geração de PDF indefinidamente | Média | DT | Hang silencioso em requests de PDF durante degradação do R2; sem circuit breaker ou timeout | `r2Service.js:33-38`; TR-14 |
| **C-26** | Templates | `dados_dinamicos` de **todos** os tipos de certificados (todos os tenants) serializados em JS inline no formulário de certificados | Média | VA | Metadados de tipos de outros eventos expostos ao browser do usuário autenticado | `views/admin/certificados/form.hbs:74-76`; TR-26 |
| **C-27** | PDF | Certificados com `status = 'cancelado'` geram PDF publicamente; `obter-lista.hbs` exibe botão "Baixar PDF" para todos os status; `GET /api/validar/:codigo` retorna `valido: true` para cancelados | Média | GI | Certificados cancelados acessíveis como PDF e aparecendo como válidos; comportamento não definido no SRS | `pdfService.js:17`; `api.js:43`; `obter-lista.hbs`; A-03, TR-06, TR-15, PDF-09, PDF-18, PDF-19 |
| **C-28** | Upload | Template de evento ausente na API REST (`PUT /eventos/:id`); upload só possível via SSR; Zod valida `url_template_base` como URL, bloqueando keys R2 relativas | Média | GI | Clientes da API não podem enviar templates; assimetria funcional entre SSR e API | `routes/eventos.js`; A-05, TR-30 |
| **C-29** | Upload + Templates | FR-44 especifica `url_template_base` como "URL válida" na mesma frase que define o campo como "key (caminho) no R2"; contradição interna gera bug real no validator Zod | Média | ID | Validator Zod rejeita R2 keys relativas válidas; campo semânticamente ambíguo afeta contrato de API | FR-44; A-06, A-19, TR-18, PDF-17 |
| **C-30** | PDF | Ausência de validação de consistência entre `tipo_certificado_id` e `evento_id` do certificado; gestor pode criar certificado cruzando tipo de evento A com evento B | Média | GI | Violação de integridade referencial de negócio; FR-45/FR-46 implícitos mas não enforced | `certificadoService.js`; PDF-22 |
| **C-31** | PDF | Sem rate limiting no endpoint público de geração de PDF (`GET /api/certificados/:id/pdf`), que é CPU-intensivo (PDFKit + 2 chamadas R2) | Média | GI | Endpoint exploitável para exaurir CPU via requisições massivas; vetor de DoS | `src/routes/api.js`; PDF-23 |
| **C-32** | Templates + PDF | Coordenadas de layout PDF (`texto_x`, `texto_y`, `validacao_x`, `validacao_y`) não incluídas nos validators Zod da API REST; possivelmente removidas pelo `.strip()` do Zod | Média | GI | Coordenadas do PDF não atualizáveis via API REST, apenas via SSR | `validators/evento.js`; TR-29 |
| **C-33** | PDF | `certificadoSSRController.cancelar` chama `certificado.update({ status: 'cancelado' })` diretamente no modelo, bypassando `certificadoService.cancel()` | Média | VA | Violation de NFR-6; lógica duplicada; mudanças futuras no service não se propagam para o fluxo SSR | `certificadoSSRController.js:cancelar`; PDF-12 |
| **C-34** | PDF | Lógica de geração de PDF diretamente na rota `api.js` (query ao banco + chamada ao pdfService) sem controller intermediário | Média | VA | Violação de NFR-6; impossibilita reutilização e testabilidade isolada do fluxo de PDF | `src/routes/api.js`; PDF-13 |
| **C-35** | Upload | Lógica de negócio de upload (`buildTemplateKey`, `handleTemplateUpload`) reside em `eventoSSRController` em vez de `eventoService` | Baixa | VA | Violação de NFR-6; lógica de geração de key e upload impossível de testar unitariamente de forma isolada | `eventoSSRController.js:10-30`; A-20, TR (P-02) |
| **C-36** | Templates | `r2Service.test.js` realiza integração real com R2 (sem mock); lê/escreve/deleta arquivos reais no bucket de produção/staging | Baixa | DT | Risco de contaminação do storage real em execução de testes; violação de NFR-8 | `tests/services/r2Service.test.js`; A-18 |
| **C-37** | PDF | `pdfService.js` usa anti-pattern `new Promise(async (resolve, reject) => {...})` | Baixa | DT | Unhandled promise rejections potenciais após `doc.end()`; dificuldade de debugging | `pdfService.js:15`; A-11 |
| **C-38** | PDF | `pdfService` aplica fallback duplo de alias Sequelize (`TiposCertificado || TiposCertificados`) para mascarar inconsistência de aliasing sistêmica | Baixa | DT | Código defensivo obscurece problema arquitetural; aliasing inconsistente em múltiplos domínios | `pdfService.js:71-72`; TR-09 |
| **C-39** | PDF | Lazy `require('./r2Service')` dentro da função `generateCertificadoPdf` em vez de import de módulo; indica dependência circular não resolvida | Baixa | DT | Mocking dificultado nos testes; erros de import detectados apenas em runtime | `pdfService.js:4-5`; PDF-14 |
| **C-40** | Upload | `ENDERECO_VALIDACAO` não documentada no `.env.example`; PDFs em homologação usam fallback apontando para produção | Baixa | GI | Comportamento confuso em homologação; link de validação no PDF aponta para `certificaaqui.com` | `pdfService.js:117-118`; `.env.example`; A-13 |
| **C-41** | Templates + PDF | Null-safety ausente em `detalhe.hbs` para `TiposCertificados` quando tipo foi soft-deletado; Handlebars/acesso silencioso sem erro | Baixa | DT | Certificados cujo tipo foi arquivado exibem campos de tipo em branco no detalhe SSR | `views/admin/certificados/detalhe.hbs:25`; TR-24 |
| **C-42** | Upload | Nenhum cleanup de arquivo R2 ao soft-delete de evento; ao restaurar, arquivo pode ter sido manualmente removido sem verificação | Baixa | GI | Falha silenciosa ao gerar PDF de evento restaurado com template removido manualmente | `eventoService.js:47-59`; A-12, TR-11 |
| **C-43** | Templates | Privacidade de dados indefinida na página SSR pública de validação: exibe nome, e-mail, tipo e status sem SRS definir o que é público | Baixa | AM | Ausência de política de privacidade de campos; exposição potencial de dados indevidos | `views/certificados/validar-resultado.hbs:26`; TR-23 |
| **C-44** | PDF | `campo_destaque` ausente da lista de `attributes` no `INCLUDES` SSR do `certificadoSSRController` | Baixa | IP | Campo não disponível em contextos SSR futuros sem refactor explícito | `certificadoSSRController.js:INCLUDES`; PDF-24 |
| **C-45** | PDF | Dimensões A4 landscape no PDFKit (`[594.96, 841.92]`) levemente divergentes do padrão ISO 216 (`595.28 × 841.89 pt`) | Baixa | DT | Desvio de posicionamento de texto em templates com coordenadas presisas | `pdfService.js`; PDF-20 |
| **C-46** | Templates | Fallback de fonte para `Helvetica` sem notificação ao gestor; aparência do PDF difere silenciosamente | Baixa | DT | Certificados gerados sem Lato-Medium têm aparência diferente sem aviso | `pdfService.js:67-70`; TR-22 |
| **C-47** | Templates | `POST /obter` SSR e `POST /api/certificados?email=...` não validam formato do e-mail antes da consulta ao banco | Baixa | DT | Queries desnecessárias com strings arbitrárias; sem risco de SQL injection (ORM), mas sem feedback de validação | `public.js:21-24`; TR-20, PDF-21 |

---

# 2. Problemas Críticos Transversais

## PCT-01 — Breach de Multi-Tenancy via `scopedEvento` + Rotas SSR

**Evidência:** `scopedEvento.js:36-41`; `src/routes/admin.js`; `certificadoController.js`; C-01, C-02, C-03

**Impacto:** Três vetores independentes permitem que gestores de evento A acessem dados de evento B:
1. `scopedEvento` confunde `req.params.id` do certificado com `evento_id`
2. Rotas SSR admin não aplicam scope de evento
3. `certificadoService.findAll` ignora o filtro de `evento_id`

**Risco Arquitetural:** O enforcement de multi-tenancy é o invariante de segurança mais fundamental do sistema. Sua ausência em três camadas simultaneamente indica ausência de testes de isolamento e ausência de revisão de segurança por camada.

**Requisito Violado:** FR-37, NFR-1 (OWASP A01)

**Severidade:** Crítica

---

## PCT-02 — XSS Stored com Superfície Aumentada por Ausência de CSP

**Evidência:** `form.hbs:71`, `tipos-certificados/form.hbs:106`, `layout.hbs`, `layouts/admin.hbs`; C-04, C-05, C-06

**Impacto:** Dados JSONB controlados por usuários autenticados (gestores/monitores) emitidos sem escape em contexto `<script>` via triple-mustache. Ausência de CSP impede qualquer mitigação em nível de browser. Comprometimento de conta de gestor permite escalada para XSS stored afetando todos os usuários do painel.

**Risco Arquitetural:** O padrão `{{{json ...}}}` em contexto `<script>` pode estar replicado em views não auditadas; sem CSP, uma única instância é suficiente para comprometer toda a sessão admin.

**Requisito Violado:** NFR-1 (OWASP A03, A05)

**Severidade:** Alta

---

## PCT-03 — Pipeline de PDF sem Resiliência e com Dados Sensíveis em Log

**Evidência:** `pdfService.js:16`, `r2Service.js:33-38`, `routes/api.js:43`; C-11, C-12, C-25, C-31

**Impacto:** Quatro fragilidades simultâneas no pipeline de PDF:
- Log de PII completo a cada geração
- Sem timeout no R2 (hang indefinido sob degradação)
- Sem rate limiting (vetor de DoS por CPU)
- IDOR por ID sequencial (exposição de todos os PDFs)

**Risco Arquitetural:** O endpoint de PDF é o único endpoint público com acesso a storage externo e geração CPU-intensiva; a ausência de proteções nele concentra múltiplos vetores de ataque.

**Requisito Violado:** NFR-1 (OWASP A09), FR-42

**Severidade:** Alta

---

## PCT-04 — Ausência de Atomicidade entre Banco e R2

**Evidência:** `eventoSSRController.js:107-118`; C-08, C-09, C-42

**Impacto:** Qualquer operação que envolve banco + R2 pode resultar em estado inconsistente:
- Upload ao R2 antes do `create` no banco → arquivo órfão se create falhar
- `update` sem remoção do arquivo anterior → arquivo anterior órfão
- Soft delete sem cleanup no R2 → template ativo sem referência

**Risco Arquitetural:** Sem mecanismo de compensação (saga, transação distribuída ou background cleanup), o R2 acumula arquivos indefinidamente sem possibilidade de auditoria ou limpeza automática.

**Requisito Violado:** FR-51, NFR-4

**Severidade:** Alta

---

## PCT-05 — Substituição Arbitrária de Template via API REST (SSRF Potencial)

**Evidência:** `validators/evento.js:8`; `routes/eventos.js:163`; C-13, C-29

**Impacto:** A API REST `PUT /eventos/:id` aceita `url_template_base` como URL arbitrária válida (Zod `.url()`). Um gestor malicioso pode apontar o template para URL de servidor adversário. O `r2Service.getFile` usa essa key diretamente; uma URL externa causará erro no S3 SDK mas o valor persiste no banco. Se a implementação de download mudar, torna-se SSRF exploitável.

**Risco Arquitetural:** O campo `url_template_base` não possui contrato claro (URL vs key R2); a ambiguidade no SRS (FR-44) propaga-se para uma vulnerabilidade real no validator.

**Requisito Violado:** FR-44, NFR-11

**Severidade:** Alta

---

# 3. Análise de Contrato entre Domínios

## 3.1 Upload → R2 Storage

**Contrato esperado:** Arquivo enviado via `POST /admin/eventos` é armazenado no R2 com key derivada do slug do nome e ano do evento; `url_template_base` do evento aponta para essa key.

**Quebras de contrato identificadas:**

| Quebra | Evidência | Tipo |
|---|---|---|
| Upload ao R2 ocorre antes da validação do evento no banco | `eventoSSRController.js:107-118` | Sem atomicidade |
| Atualização de template não remove arquivo anterior | `eventoSSRController.js:118-135` | Lifecycle não gerenciado |
| Soft delete não remove arquivo do R2 | `eventoService.js:47-59` | Lifecycle não gerenciado |
| Key gerada a partir de dados do body (não do banco) | `eventoSSRController.js:25-31` | Fonte de dados inconsistente |
| Slug pode ser vazio ou colidir entre eventos | `eventoSSRController.js:10-18` | Key não garante unicidade |
| `url_template_base` via API aceita URL externa (não key R2) | `validators/evento.js:8` | Contrato de tipo quebrado |

---

## 3.2 Evento → `url_template_base`

**Contrato esperado (FR-44):** Campo armazena a key (caminho relativo) no R2; se ausente, fallback para `"template/padrao.jpg"`.

**Inconsistências identificadas:**

| Camada | Comportamento real | Esperado por FR-44 |
|---|---|---|
| Validator Zod | `z.string().url()` — aceita URL completa, rejeita path relativo | Deve aceitar path relativo (key R2) |
| SSR Controller | Armazena como `templates/<slug>/<ano>/base.<ext>` (path relativo correto) | Correto |
| pdfService | Usa `url_template_base` como key R2 diretamente — `r2Service.getFile(key)` | Correto |
| API REST | Aceita qualquer URL externa; armasena no banco sem verificação de existência no R2 | Deveria aceitar somente keys R2 válidas |

**Dependência implícita não documentada:** O `pdfService` assume que o valor em `url_template_base` é uma key R2 válida; se o campo contiver uma URL externa (possível via API REST), o `r2Service.getFile` falha sem mensagem de erro clara ao usuário final.

---

## 3.3 PDF → Consumo de Template e Fonte

**Contrato esperado:** `pdfService.generateCertificadoPdf` obtém imagem de fundo via `url_template_base` do evento e fonte `Lato-Medium.ttf` do R2; interpola `texto_base` com `valores_dinamicos`; renderiza com PDFKit.

**Inconsistências e dependências implícitas:**

| Ponto | Problema | Impacto |
|---|---|---|
| Alias Sequelize inconsistente | `TiposCertificado` vs `TiposCertificados` — fallback defensivo em `pdfService`, mas quebra silenciosa no SSR controller | Preview de texto sempre vazio no SSR |
| Sem verificação de `certificado.status` | PDF gerado para certificados cancelados/pendentes | Comportamento indefinido no SRS |
| Sem verificação de existência de arquivo no R2 | Se arquivo foi removido manualmente, falha em runtime sem mensagem clara | Nenhum fallback documentado |
| Sem timeout no `r2Service.getFile` | Hang indefinido durante degradação do R2 | DoS passivo |
| Log de objeto completo | PII em logs a cada geração | OWASP A09 |
| Dimensões A4 levemente incorretas | `[594.96, 841.92]` vs `595.28 × 841.89` pt | Desvio de posicionamento em templates precisos |

**Ausência de validação de assets:** Nem o `pdfService` nem nenhuma rota verifica previamente se os assets necessários (template e fonte) estão disponíveis no R2 antes de iniciar a geração. A falha é sempre em runtime, ao usuário final.

---

## 3.4 Inconsistências de Key no R2

| Cenário | Key gerada | Problema |
|---|---|---|
| Evento "Simpósio de IA!" + ano 2026 | `templates/simposio-de-ia/2026/base.jpg` | Correto |
| Evento "@#$%&*!" + ano 2026 | `templates//2026/base.jpg` (slug vazio) | Key malformada |
| Evento "CBIE" + ano 2026 e evento "CBIE" + ano 2026 | Mesma key | Sobreescrita silenciosa |
| Atualização com novo nome "CBIE 2027" | Nova key `templates/cbie-2027/2026/base.jpg` | Key antiga jamais removida |
| `ano = "../../config"` via body SSR | `templates/slug/../../config/base.jpg` | Traversal parcial (R2 não é filesystem, mas namespace corrompido) |

---

# 4. Backlog Arquitetural (Grupo 1)

## Curto Prazo — Segurança / Falhas Críticas

| ID | Achado | Descrição da Ação | Prioridade |
|---|---|---|---|
| C-01 | Falsa autorização `scopedEvento` | Redesenhar `scopedEvento` para recursos secundários: buscar o recurso pelo ID e verificar `evento_id` do resultado | Crítica |
| C-02 | SSR sem escopo de evento | Aplicar middleware de verificação de ownership por evento nas rotas SSR admin de certificados | Crítica |
| C-03 | `findAll` sem filtro | Passar `evento_id` do `req.query` até `certificadoService.findAll` e adicionar cláusula `where` | Crítica |
| C-04 | XSS em form certificado | Substituir `{{{json valores_dinamicos}}}` por escape JSON seguro (`JSON.stringify` + `replace` de `</script>`) | Alta |
| C-05 | XSS em form tipos-certificados | Idem para `{{{json dados_dinamicos}}}` nos formulários de tipos | Alta |
| C-06 | Ausência de CSP | Adicionar `Content-Security-Policy` nos layouts que restrinja `script-src` a fontes confiáveis | Alta |
| C-12 | Log de PII em produção | Remover `console.log` de objeto certificado do `pdfService` | Alta |
| C-13 | SSRF potencial via API | Bloquear atualização de `url_template_base` via API REST ou restringir ao formato de key R2 (regex sem scheme HTTP) | Alta |
| C-14 | `UsuarioEvento` permanente | Usar soft delete (paranoid) ou pelo menos restaurar antes de fazer destroy ao deletar evento | Alta |
| C-15 | Link PDF quebrado | Corrigir `detalhe.hbs`: `/public/certificados/:id/pdf` → `/api/certificados/:id/pdf` | Alta |
| C-16 | Alias Sequelize errado | Padronizar alias: usar `TiposCertificados` (plural) em todo o `certificadoSSRController` | Alta |
| C-17 | Race condition no código | Encapsular geração de código em transação atômica ou usar abordagem baseada em UUID/lock otimista | Alta |
| C-18 | Colisão com soft-deletados | Incluir soft-deletados no `count()` ou usar lock de update exclusivo | Alta |

## Médio Prazo — Design / Consistência

| ID | Achado | Descrição da Ação |
|---|---|---|
| C-07 | Slug vazio/colidente | Validar slug não vazio; incluir ID do evento no path da key (`templates/<slug>/<evento_id>/base.<ext>`) |
| C-08 | Upload antes da validação | Inverter ordem: validar e criar evento no banco antes do upload ao R2; rollback do R2 em falha |
| C-09 | Arquivo anterior órfão | Ler `url_template_base` atual antes do update e chamar `r2Service.deleteFile` no arquivo anterior |
| C-10 | MIME sem magic bytes | Implementar verificação de file signature (magic bytes) no buffer antes do upload |
| C-11 | IDOR via ID sequencial | Implementar rate limiting na rota de PDF; considerar UUID externo ou token temporário de download |
| C-19 | Slug colidente | Incluir `evento_id` ou UUID no path da key como tiebreaker |
| C-21 | Key inconsistente no update | Usar dados do banco (não do body) para construir a key ao atualizar; ou tornar a key imutável após criação |
| C-22 | Oracle de e-mail | Retornar resposta uniforme para e-mail inexistente e e-mail sem certificados |
| C-23 | Validação de código na API | Adicionar `CODIGO_CERTIFICADO_REGEX` na rota `GET /api/validar/:codigo` da API REST |
| C-27 | PDF de cancelados | Definir política (ver VH) e implementar filtro de status na geração de PDF e na validação pública |
| C-29 | FR-44 URL vs key | Atualizar SRS e validator Zod para especificar formato de key R2 |
| C-30 | tipo × evento | Validar em `certificadoService.create` que `tipo_certificado_id` pertence ao mesmo `evento_id` |
| C-31 | Sem rate limiting no PDF | Adicionar middleware de rate limiting no endpoint `GET /api/certificados/:id/pdf` |
| C-32 | Coordenadas PDF sem Zod | Incluir `texto_x/y`, `validacao_x/y` nos validators Zod da API de eventos |
| C-33 | SSR cancelar bypassa service | Substituir `certificado.update({ status: 'cancelado' })` por `certificadoService.cancel(id)` no SSR |
| C-34 | Lógica na rota `api.js` | Extrair handler de PDF da rota para controller dedicado |

## Longo Prazo — Arquitetura / Evolução

| ID | Achado | Descrição da Ação |
|---|---|---|
| C-25 | Timeout no R2 | Configurar `requestTimeout` no `S3Client` e/ou implementar circuit breaker para o R2 |
| C-26 | Exposição de todos os tipos | Endpoint REST para buscar `dados_dinamicos` de um tipo específico por ID (filtrado por escopo) |
| C-35 | Lógica no controller | Mover `buildTemplateKey` e `handleTemplateUpload` para `eventoService` ou novo `eventoStorageService` |
| C-36 | Teste integração R2 | Isolar `r2Service.test.js` como E2E explícito; usar mock (S3 local ou `@aws-sdk/s3-request-presigner` stub) |
| C-39 | Dependência circular | Refatorar para eliminar lazy `require` em `pdfService`; reorganizar dependências de módulo |
| C-42 | Lifecycle de assets | Implementar mecanismo de cleanup do R2 (job periódico ou trigger no soft delete/restore) |

---

# 5. Atualizações Recomendadas no SRS

## SRS-01 — FR-44: Contradição entre "URL válida" e "key (caminho) no R2"

**Problema:** FR-44 exige simultaneamente "URL válida" e afirma que o campo armazena uma "key (caminho) no R2". São semânticas opostas: keys R2 são paths relativos (`templates/cbie/2026/base.jpg`), não URLs válidas.

**Impacto:** Bug real no validator Zod: `z.string().url()` rejeita keys R2 relativas válidas e aceita URLs externas arbitrárias, criando uma vulnerabilidade.

**Recomendação:** Remover "URL válida" da especificação. Substituir por: "chave de objeto (key) no bucket R2, formada por segmentos de path separados por `/`, sem prefixo de scheme, não podendo conter `..`, e com comprimento máximo de 512 caracteres."

**Rastreabilidade:** FR-44; C-29, C-13; auditoria A-06, A-19, TR-18, PDF-17

---

## SRS-02 — FR-42 / FR-24: Comportamento para certificados cancelados indefinido

**Problema:** O SRS não define o comportamento esperado quando `GET /api/certificados/:id/pdf` ou `GET /api/validar/:codigo` são chamados sobre certificado com `status = 'cancelado'`.

**Impacto:** Implementação atual gera PDF e retorna `{ valido: true }` para cancelados; comportamento ambíguo com o propósito do campo `status`.

**Recomendação:** Acrescentar ao SRS ao menos uma das seguintes definições: (a) certificados cancelados retornam HTTP 410 Gone na geração de PDF e `{ valido: false }` na validação; (b) geram PDF com marca d'água "CANCELADO"; (c) comportamento atual mantido explicitamente.

**Rastreabilidade:** FR-42, FR-24, FR-19; C-27; VH-01, VH-02

---

## SRS-03 — FR-51: Atomicidade entre upload e criação/atualização de evento

**Problema:** FR-51 especifica o fluxo de upload mas omite o comportamento em caso de falha parcial (upload ok mas banco falha, ou vice-versa).

**Impacto:** Arquivos órfãos gerados a cada falha de criação de evento; impossível detectar ou limpar automaticamente.

**Recomendação:** Acrescentar: "Em caso de falha na persistência do evento após upload bem-sucedido ao R2, o arquivo enviado deve ser removido do bucket (rollback de storage)."

**Rastreabilidade:** FR-51; C-08

---

## SRS-04 — FR-51: Política de lifecycle de arquivo anterior ao atualizar template

**Problema:** FR-51 não especifica o que ocorre com o arquivo anterior ao substituir o template de um evento.

**Impacto:** Arquivos órfãos acumulam no R2 indefinidamente.

**Recomendação:** Acrescentar: "Ao substituir o template de um evento, o arquivo anterior referenciado por `url_template_base` deve ser removido do R2, desde que não seja o template padrão do sistema."

**Rastreabilidade:** FR-51; C-09

---

## SRS-05 — FR-37: Extensão para recursos secundários no `scopedEvento`

**Problema:** FR-37 especifica que `scopedEvento` restringe acesso aos eventos vinculados ao usuário, mas não define o comportamento para recursos secundários (certificados, tipos) onde o ID do path não é o evento.

**Impacto:** Ausência de especificação leva à implementação incorreta atual que usa o ID do recurso como `evento_id`.

**Recomendação:** Acrescentar: "Para rotas de recursos secundários (certificados, tipos de certificados), o middleware deve buscar o recurso pelo ID da rota e verificar o `evento_id` do resultado contra os eventos do usuário antes de autorizar o acesso."

**Rastreabilidade:** FR-37; C-01, C-02, C-03

---

## SRS-06 — NFR-11: Verificação real de conteúdo no upload

**Problema:** NFR-11 especifica validação por `multer`, não distinguindo entre validação de MIME declarado pelo cliente (insuficiente) e verificação de file signature (necessária).

**Impacto:** Arquivos maliciosos com Content-Type declarado como `image/jpeg` passam na validação.

**Recomendação:** Acrescentar: "A validação de tipo de arquivo deve incluir verificação de magic bytes (file signature) no conteúdo do buffer, não apenas o campo `Content-Type` declarado pelo cliente."

**Rastreabilidade:** NFR-11; C-10

---

# 6. Itens para Validação Humana

| VH-ID | Questão | Contexto | Impacto da Decisão |
|---|---|---|---|
| **VH-01** | PDF de certificados cancelados deve ser gerado? Com restrição? Com marca d'água? | FR-42 não restringe por status; model de negócio pode exigir que apenas `"emitido"` gere PDF | Afeta `pdfService`, `api.js`, `obter-lista.hbs` |
| **VH-02** | `GET /api/validar/:codigo` deve retornar `{ valido: false }` ou `{ valido: true, status: 'cancelado' }` para certificados cancelados? | Atualmente retorna `valido: true` para cancelados sem distinção | Afeta `api.js`, `public.js`, `validar-resultado.hbs` |
| **VH-03** | Política de remoção do arquivo R2 anterior ao atualizar template de evento | Sem remoção: acúmulo de órfãos; com remoção: risco de apagar arquivo ativo em cache/CDN | Afeta `eventoSSRController.js` e `eventoService.js` |
| **VH-04** | Template R2 deve ser removido ou preservado ao soft-delete de evento? | Soft delete é reversível — remover quebra restauração sem armazenamento de key; não remover gera acúmulo indefinido | Afeta `eventoService.js` e lifecycle do R2 |
| **VH-05** | Upload de template deve ser possível via API REST ou exclusivamente via SSR? | FR-51 menciona "via interface SSR" — se intencional, API deve bloquear alteração de `url_template_base` via JSON | Afeta `validators/evento.js` e `routes/eventos.js` |
| **VH-06** | Quais campos do certificado devem ser exibidos na página pública de validação SSR? | `validar-resultado.hbs` exibe nome, e-mail, evento, tipo e status sem política de privacidade no SRS | Afeta `validar-resultado.hbs` e pode requerer atualização do SRS |
| **VH-07** | Rate limiting deve ser aplicado no endpoint público `GET /api/certificados/:id/pdf`? Se sim, qual threshold? | Endpoint CPU-intensivo (PDFKit + 2 chamadas R2); sem throttling é vetor de DoS | Afeta `api.js`; requer ADR ou especificação de threshold |
| **VH-08** | O padrão `{{{json ...}}}` em contexto `<script>` é aceitável com sanitização explícita, ou deve ser abandonado em favor de API JSON para dados de formulário? | Atualmente usado em 2+ templates; risco de replicação em views futuras | Afeta política de desenvolvimento de views; pode requerer ADR |

---

# 7. Análise Sistêmica do Grupo 1

## PS-01 — Acoplamento Storage ↔ Rendering sem Camada de Abstração

O `pdfService` acopla diretamente o acesso ao R2 (`r2Service.getFile`) com a renderização PDF (PDFKit). Não há uma camada de abstração de assets que:
- verifique disponibilidade antes de iniciar renderização
- permita fallback gracioso sem falha de request
- abstraia o storage provider (R2 → local → CDN)

Consequência: uma degradação do R2 derruba completamente a geração de PDF sem possibilidade de fallback parcial (ex: PDF sem imagem de fundo).

---

## PS-02 — Dependência Forte e Não Validada do R2 na Inicialização

Credenciais do R2 (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) não são validadas no startup. O sistema sobe sem R2 funcional e falha silenciosamente em runtime. Contrasta com `JWT_SECRET` e `SESSION_SECRET` que lançam erro na inicialização se ausentes.

---

## PS-03 — Ausência de Asset Abstraction Layer

O pipeline de PDF depende de dois assets no R2 (imagem de fundo + fonte) sem nenhuma validação prévia de existência ou disponibilidade. O modelo de fallback (`"template/padrao.jpg"` e `Helvetica`) é implementado de forma ad-hoc no `pdfService` sem política ou contrato documentado. Não há mecanismo de health check de assets.

---

## PS-04 — Inconsistência SSR vs API em Validação de Inputs

A camada SSR aplica validações que a API REST não aplica:

| Validação | SSR | API REST |
|---|---|---|
| Código de certificado (regex) | `CODIGO_CERTIFICADO_REGEX` aplicado | Sem validação |
| MIME de upload | Via multer (declarado pelo cliente) | Não aplicável (sem upload) |
| Coordenadas PDF | Via formulário HTML (tipagem implícita) | Não nos validators Zod |
| `url_template_base` como key R2 | Key construída internamente | Zod aceita URL externa |

As duas interfaces deveriam compartilhar as mesmas regras via validators centralizados (Zod schemas), mas divergem em múltiplos pontos.

---

## PS-05 — Fragilidade do Pipeline de Geração de PDF

O pipeline `GET /api/certificados/:id/pdf` concentra múltiplos pontos únicos de falha:

```
Request → Lookup DB → getFile R2 (sem timeout) → getFile R2 (sem timeout) → PDFKit → Response
```

Falha em qualquer ponto resulta em HTTP 500 sem fallback. Não há:
- circuit breaker para o R2
- timeout configurado
- rate limiting para proteção de CPU
- cache de assets (templates/fontes)
- queue de geração assíncrona

---

## PS-06 — Aliasing Inconsistente de Sequelize em Todo o Domínio

O alias `TiposCertificados` (plural) é definido na associação do model, mas referenciado como `TiposCertificado` (singular) em pelo menos dois controllers (`certificadoSSRController.detalhe`) e potencialmente em outros pontos. O `pdfService` adiciona fallback defensivo para tolerar ambos, mascarando o problema. Este padrão indica ausência de convenção de aliasing aplicada de forma consistente.

---

## PS-07 — Risco de Inconsistência entre Evento e PDF Gerado

O PDF é gerado com dados do evento no momento da geração, não no momento da emissão do certificado. Se:
- `url_template_base` for atualizado após emissão de certificados
- Coordenadas de layout forem alteradas
- Nome do evento for alterado

...certificados previamente emitidos gerarão PDFs com aparência diferente dos originais, quebrando a rastreabilidade e autenticidade esperadas de um certificado digital.

---

# 8. Dependências Arquiteturais

## 8.1 Impacto em Autenticação e Acesso Público a PDFs

O endpoint `GET /api/certificados/:id/pdf` é intencionalmente público (FR-42, FR-25). No entanto, a ausência de qualquer controle de acesso granular (rate limiting, token de acesso temporário, verificação de status) cria uma superfície de exposição que conflita com os objetivos de integridade e rastreabilidade do sistema. A identidade do solicitante é completamente anônima.

## 8.2 RBAC e Escopo de Eventos

O enforcement de scoping de eventos (FR-37) falha em três pontos independentes (C-01, C-02, C-03). Isso significa que o modelo RBAC funciona corretamente em termos de perfil (admin/gestor/monitor), mas o isolamento de dados por evento — que é a propriedade de segurança mais crítica do sistema multi-tenant — está comprometido. O RBAC e o scoping são ortogonais; ambos precisam funcionar.

## 8.3 Integridade de Certificados

A integridade de um certificado depende da imutabilidade do PDF gerado. Atualmente:
- O template pode ser alterado a qualquer momento sem invalidar PDFs anteriormente gerados
- Não há hash ou assinatura do PDF no banco para detecção de tampering
- O código de validação (`FR-24`) verifica apenas existência do registro, não integridade do PDF

## 8.4 Validação Pública

A rota de validação pública (`GET /api/validar/:codigo`) retorna `{ valido: true }` para certificados cancelados, comprometendo a confiabilidade do mecanismo de autenticidade que o sistema promete oferecer. Isso afeta diretamente a proposta de valor central do Certifique-me.

## 8.5 Domínio de Eventos como Âncora de Segurança

O evento é a unidade de isolamento multi-tenant do sistema. Todos os recursos secundários (tipos de certificados, certificados) herdam o escopo de segurança do evento. Os bugs C-01, C-02 e C-03 comprometem essa âncora, tornando o isolamento por evento ineficaz em múltiplas camadas simultaneamente.

---

*Triagem realizada com base em análise documental cruzada das auditorias de domínio 10, 11 e 12 do ciclo 07. Nenhuma implementação foi realizada. Todos os achados possuem rastreabilidade para evidências concretas nas auditorias de origem.*
