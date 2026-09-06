# Auditoria de Domínio — Templates / Assets / Renderização

**Sistema:** Certifique-me  
**Data:** 2026-05-09 20:29 (BRT)  
**Auditor:** Agente Arquitetural Automatizado  
**Escopo:** Templates HTML/PDF, assets físicos, renderização, interpolação, lifecycle do template, segurança, integração R2/storage, geração documental.  
**Fontes analisadas:** `docs/especificacoes.md`, `src/services/pdfService.js`, `src/services/r2Service.js`, `src/services/templateService.js`, `src/services/eventoService.js`, `src/services/certificadoService.js`, `src/controllers/eventoSSRController.js`, `src/controllers/certificadoSSRController.js`, `src/routes/api.js`, `src/routes/public.js`, `src/routes/admin.js`, `src/middlewares/uploadTemplate.js`, `src/middlewares/authSSR.js`, `src/validators/evento.js`, `src/validators/certificado.js`, `src/models/evento.js`, `hbs-helpers.js`, `hbs-helpers-date.js`, `views/layout.hbs`, `views/layouts/admin.hbs`, `views/admin/eventos/form.hbs`, `views/admin/eventos/index.hbs`, `views/admin/certificados/form.hbs`, `views/admin/certificados/detalhe.hbs`, `views/admin/tipos-certificados/form.hbs`, `views/certificados/*.hbs`, `migrations/20260416092527-add-url-template-base-to-eventos.js`, `migrations/20260416201114-add-layout-fields-to-eventos.js`

---

## 1. Escopo Auditado

### Arquivos e módulos

| Componente                    | Localização                                   | Papel no domínio auditado                                                         |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `pdfService.js`               | `src/services/pdfService.js`                  | Geração do PDF: carrega fundo R2, fonte R2, interpola texto, renderiza com PDFKit |
| `templateService.js`          | `src/services/templateService.js`             | Motor de interpolação `${variavel}` sobre `texto_base`                            |
| `r2Service.js`                | `src/services/r2Service.js`                   | Upload, download e remoção de assets no Cloudflare R2                             |
| `eventoSSRController.js`      | `src/controllers/eventoSSRController.js`      | Upload de template SSR: buildTemplateKey, handleTemplateUpload                    |
| `certificadoSSRController.js` | `src/controllers/certificadoSSRController.js` | Detalhe SSR com prévia de texto interpolado                                       |
| `certificadoController.js`    | `src/controllers/certificadoController.js`    | Endpoint REST para geração de PDF indireta                                        |
| `api.js`                      | `src/routes/api.js`                           | Rota pública PDF (`GET /api/certificados/:id/pdf`), validar, listar               |
| `public.js`                   | `src/routes/public.js`                        | SSR público: `/obter`, `/validar`, `/validar/:codigo`                             |
| `admin.js`                    | `src/routes/admin.js`                         | Rotas SSR admin: eventos (upload), certificados                                   |
| `uploadTemplate.js`           | `src/middlewares/uploadTemplate.js`           | multer memória com filtro MIME e limite 2 MB                                      |
| `authSSR.js`                  | `src/middlewares/authSSR.js`                  | Autenticação SSR, popula `req.usuario`                                            |
| `eventoSchema (Zod)`          | `src/validators/evento.js`                    | Validação do campo `url_template_base` na API                                     |
| `certificadoSchema (Zod)`     | `src/validators/certificado.js`               | Validação de criação de certificado na API REST                                   |
| `hbs-helpers.js`              | `hbs-helpers.js`                              | Helpers Handlebars: `json`, `eq`, `toString`, `or`, etc.                          |
| `hbs-helpers-date.js`         | `hbs-helpers-date.js`                         | Helper `formatDatePtBr`                                                           |
| `layout.hbs`                  | `views/layout.hbs`                            | Layout SSR público (Handlebars)                                                   |
| `layouts/admin.hbs`           | `views/layouts/admin.hbs`                     | Layout SSR admin                                                                  |
| `eventos/form.hbs`            | `views/admin/eventos/form.hbs`                | Formulário SSR de upload de template                                              |
| `certificados/form.hbs`       | `views/admin/certificados/form.hbs`           | Formulário SSR com JS inline de campos dinâmicos                                  |
| `tipos-certificados/form.hbs` | `views/admin/tipos-certificados/form.hbs`     | Formulário de edição de `texto_base` com preview JS                               |
| `validar-resultado.hbs`       | `views/certificados/validar-resultado.hbs`    | Exibição pública de dados do certificado                                          |
| `obter-lista.hbs`             | `views/certificados/obter-lista.hbs`          | Listagem pública de certificados por e-mail                                       |
| `Evento` (model)              | `src/models/evento.js`                        | Armazena `url_template_base`, coordenadas de layout PDF                           |
| **R2 / Cloudflare**           | env vars                                      | Storage de templates de imagem e fontes                                           |
| **PDFKit**                    | npm `pdfkit`                                  | Biblioteca de geração de PDF                                                      |
| **Handlebars (hbs)**          | engine do Express                             | Template engine SSR                                                               |

---

## 2. Matriz de Achados

| ID    | Categoria                                                                                                           | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                   | Severidade | Tipo | Evidências                                                                                                                                                               | Requisitos relacionados     | Impacto                                                                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TR-01 | Segurança / XSS potencial                                                                                           | Helper `json` serializa objetos diretamente para dentro do HTML sem `{{{...}}}` escapado; em `form.hbs` do certificado o output `{{{json certificado.valores_dinamicos}}}` usa triple-mustache, injetando JSON não sanitizado literalmente no DOM                                                                                                                                                                                           | Alta       | VU   | `views/admin/certificados/form.hbs` L71: `{{{json certificado.valores_dinamicos}}}`                                                                                      | NFR-1                       | Um `valores_dinamicos` contendo `</script><script>...` pode ser injetado no HTML                                                                                                                                                                                            |
| TR-02 | XSS — form tipos-certificados                                                                                       | `{{{json tipo.dados_dinamicos}}}` usa triple-mustache para injetar JSON no script inline de `tipos-certificados/form.hbs`                                                                                                                                                                                                                                                                                                                   | Alta       | VU   | `views/admin/tipos-certificados/form.hbs` L106: `let dadosDinamicos = {{{json tipo.dados_dinamicos}}};`                                                                  | NFR-1                       | Valor JSONB controlado pelo usuário é emitido bruto em contexto `<script>`, permitindo XSS stored                                                                                                                                                                           |
| TR-03 | Template injection — interpolação                                                                                   | `templateService.interpolate` usa regex `\$\{(\w+)\}` sobre `texto_base` string fornecida pelo gestor. O resultado nunca é sanitizado antes de ser embutido em HTML do detalhe SSR                                                                                                                                                                                                                                                          | Média      | VU   | `src/services/templateService.js` L11–16; `views/admin/certificados/detalhe.hbs` L57: `{{textoInterpolado}}` (double-mustache)                                           | FR-39, NFR-1                | Double-mustache escapa corretamente — sem execução de JS; porém texto com `<`, `>` em `texto_base` pode gerar HTML malformado se futuramente renderizado sem escape                                                                                                         |
| TR-04 | Path traversal na key R2                                                                                            | `buildTemplateKey` no `eventoSSRController` constrói a key R2 a partir de `req.body.nome` e `req.body.ano`. O slug é sanitizado (remove acentos, espaços, caracteres não alfanuméricos). `req.body.ano` é coercido para String sem validação prévia de tipo. Se `ano` for injetado como objeto/array, `String(ano)` produz `"[object Object]"` na key gerando paths inconsistentes — não é traversal mas corrompe o namespace de keys no R2 | Média      | VU   | `eventoSSRController.js` L10–19: `buildTemplateKey(nome, String(ano), ...)`                                                                                              | FR-51, NFR-11               | Keys corrompidas impedem download do template correto no PDF                                                                                                                                                                                                                |
| TR-05 | Ausência de validação de upload na API REST de eventos                                                              | A API REST `PUT /eventos/:id` aceita `url_template_base` como string (URL) via JSON, sem upload real. Porém o schema Zod de evento (`validators/evento.js`) valida `url_template_base` como `z.string().url()`, o que permitiria que um gestor/monitor defina `url_template_base` para qualquer URL arbitrária externa. A key R2 seria substituída por URL de servidor externo                                                              | Alta       | VU   | `src/validators/evento.js` L8: `url_template_base: z.string().url().optional().nullable()`; `src/routes/eventos.js` L163: sem `uploadTemplate` middleware                | FR-44, FR-51, NFR-11        | Um ator malicioso pode apontar `url_template_base` para URL de servidor adversário; `r2Service.getFile` usa essa key diretamente, portanto uma key inválida (URL externa) causa erro no R2, mas a falha de validação permite persistir um valor que nunca funcionará no PDF |
| TR-06 | Acesso público irrestrito ao PDF de qualquer certificado (incluindo cancelados)                                     | `GET /api/certificados/:id/pdf` é público, sem autenticação e sem filtro por status. Certificados com status `"cancelado"` ou `"pendente"` geram PDF normalmente                                                                                                                                                                                                                                                                            | Média      | GI   | `src/routes/api.js` L43: handler sem auth; `src/services/certificadoService.js` sem verificação de status em `findById`                                                  | FR-42, FR-19                | PDF de certificados cancelados é gerado e entregue publicamente, contradizendo o propósito do status                                                                                                                                                                        |
| TR-07 | Rota de detalhe SSR usa link incorreto para PDF                                                                     | `views/admin/certificados/detalhe.hbs` L5: link para `/public/certificados/{{certificado.id}}/pdf` — esse path não existe; a rota correta é `/api/certificados/:id/pdf`                                                                                                                                                                                                                                                                     | Alta       | BR   | `views/admin/certificados/detalhe.hbs` L5: `href="/public/certificados/{{certificado.id}}/pdf"`                                                                          | FR-42                       | Botão "Baixar PDF" no painel admin está quebrado (404)                                                                                                                                                                                                                      |
| TR-08 | `detalhe` SSR usa alias errado ao acessar `TiposCertificado`                                                        | `certificadoSSRController.detalhe` acessa `certificado.TiposCertificado?.texto_base` (singular) mas o include define `as: 'TiposCertificados'` (plural). Resultado: `textoInterpolado` é sempre `''`                                                                                                                                                                                                                                        | Alta       | BR   | `src/controllers/certificadoSSRController.js` L82: `certificado.TiposCertificado?.texto_base`; L15: `as: 'TiposCertificados'`                                            | FR-39                       | Preview de texto interpolado nunca é exibido no detalhe do certificado — funcionalidade completamente inoperante                                                                                                                                                            |
| TR-09 | `pdfService` possui fallback duplo defensivo para alias Sequelize                                                   | `pdfService.js` L71: `certificado.TiposCertificado \|\| certificado.TiposCertificados` para tolerar inconsistência de alias. Embora funcionalmente correto no contexto de PDF, mascara o defeito de aliasing documentado em TR-08                                                                                                                                                                                                           | Baixa      | DT   | `src/services/pdfService.js` L71–72                                                                                                                                      | NFR-6                       | Código defensivo obscurece problema arquitetural; aliasing inconsistente em todo o domínio                                                                                                                                                                                  |
| TR-10 | Ausência de validação de MIME real no upload (apenas mimetype declarado pelo cliente)                               | `uploadTemplate.js` usa `file.mimetype` declarado pelo cliente multipart para filtrar tipos. Não há verificação magic bytes / file signature. Um ator pode enviar arquivo malicioso com `Content-Type: image/png`                                                                                                                                                                                                                           | Média      | VU   | `src/middlewares/uploadTemplate.js` L8–13: `ALLOWED_MIMES.includes(file.mimetype)`                                                                                       | NFR-11                      | Upload de arquivo não-imagem disfarçado de PNG; PDFKit falhará ao processar, mas o arquivo é persistido no R2 antes do uso                                                                                                                                                  |
| TR-11 | Template deletado (soft delete de evento) gera key R2 órfã                                                          | Quando um evento é soft-deletado via `eventoService.delete`, o arquivo no R2 identificado por `url_template_base` **não é removido**. Quando restaurado, `eventoService.restore` não verifica se o arquivo ainda existe no R2                                                                                                                                                                                                               | Média      | GI   | `src/services/eventoService.js` L44–60: `delete` e `restore` não chamam `r2Service.deleteFile` nem `r2Service.getFile`                                                   | FR-9, FR-44                 | Arquivos de template ficam permanentemente no R2 sem referência ativa; não há custo funcional imediato, mas é vazamento de storage                                                                                                                                          |
| TR-12 | Atualização de template de evento não remove arquivo anterior do R2                                                 | Ao atualizar um evento com novo template (`handleTemplateUpload`), a key anterior armazenada em `url_template_base` nunca é excluída do R2. O arquivo antigo fica órfão                                                                                                                                                                                                                                                                     | Média      | GI   | `src/controllers/eventoSSRController.js` L118–135: `atualizar` não lê `evento.url_template_base` antes de sobrescrever                                                   | FR-51                       | Acúmulo de arquivos órfãos no R2 sem mecanismo de limpeza                                                                                                                                                                                                                   |
| TR-13 | buildTemplateKey usa nome e ano do body (não do banco) ao atualizar                                                 | Na operação `atualizar`, `handleTemplateUpload` usa `req.body.nome` e `req.body.ano` para construir a key. Se o usuário alterar nome/ano no mesmo request que faz upload, a key nova é inconsistente com a key anterior — e a key antiga fica órfã                                                                                                                                                                                          | Média      | BR   | `eventoSSRController.js` L25–31: `handleTemplateUpload` usa `req.body.nome` e `req.body.ano` diretamente                                                                 | FR-51                       | Key R2 pode divergir do estado real do evento no banco                                                                                                                                                                                                                      |
| TR-14 | `r2Service.getFile` sem timeout configurado                                                                         | `r2Service.getFile` usa `r2.send(command)` sem timeout explícito. Se o R2 estiver indisponível, a geração de PDF bloqueará indefinidamente                                                                                                                                                                                                                                                                                                  | Média      | DT   | `src/services/r2Service.js` L33–38: sem `requestTimeout`                                                                                                                 | FR-42, FR-47                | Degradação silenciosa — requests de PDF ficam pendurados sem resposta                                                                                                                                                                                                       |
| TR-15 | PDF gerado sem verificação de status do certificado                                                                 | `pdfService.generateCertificadoPdf` não verifica `certificado.status`. PDF de certificado `"cancelado"` é gerado normalmente                                                                                                                                                                                                                                                                                                                | Média      | GI   | `src/services/pdfService.js` L17: verifica apenas `certificado.codigo`; sem checagem de `status`                                                                         | FR-42, FR-19                | PDF de certificados cancelados é entregue publicamente                                                                                                                                                                                                                      |
| TR-16 | Console.log de objeto certificado completo em produção (vazamento de dados)                                         | `pdfService.js` L16: `console.log('PDFService certificado:', certificado)` loga o objeto inteiro incluindo dados do participante (nome, email) em produção                                                                                                                                                                                                                                                                                  | Alta       | VU   | `src/services/pdfService.js` L16                                                                                                                                         | NFR-1 (OWASP A09 — Logging) | Dados pessoais de participantes (nome, email, certificado completo) são logados em claro nos logs do servidor                                                                                                                                                               |
| TR-17 | Rota `/api/certificados/:id/pdf` não valida que ID é inteiro                                                        | `req.params.id` é passado diretamente a `Certificado.findByPk(id)` sem coerção ou validação de formato numérico                                                                                                                                                                                                                                                                                                                             | Baixa      | DT   | `src/routes/api.js` L44: `const { id } = req.params`                                                                                                                     | FR-42                       | Defensivo: Sequelize provavelmente rejeita IDs inválidos, mas sem validação explícita                                                                                                                                                                                       |
| TR-18 | `eventoSchema` Zod valida `url_template_base` como URL externa, mas campo deve conter apenas key R2                 | O Zod schema define `url_template_base: z.string().url()`, porém FR-44 especifica que esse campo armazena a **key** (caminho relativo) dentro do R2 — não uma URL completa. A validação aceita URLs inválidas para keys (ex: `"template/padrao.jpg"` falharia na validação) e aceita URLs externas arbitrárias                                                                                                                              | Alta       | ID   | `src/validators/evento.js` L8: `.url()`; `docs/especificacoes.md` FR-44: "armazena a key (caminho)"                                                                      | FR-44, FR-51                | Divergência entre SRS e implementação; keys R2 não passam na validação Zod, bloqueando criação de eventos via API com key válida                                                                                                                                            |
| TR-19 | API `GET /api/validar/:codigo` não valida formato do código                                                         | Diferente da rota SSR `POST /validar` que usa `CODIGO_CERTIFICADO_REGEX`, a API REST `GET /api/validar/:codigo` aceita qualquer string como `:codigo` sem validação prévia. Isso permite tentativas de enumeração ou payloads maliciosos                                                                                                                                                                                                    | Média      | VU   | `src/routes/api.js` L84: sem regex antes de `Certificado.findOne({ where: { codigo } })`; contraste com `src/routes/public.js` L83–89 que usa `CODIGO_CERTIFICADO_REGEX` | FR-24                       | Inconsistência segurança SSR vs API; facilita enumeração de códigos                                                                                                                                                                                                         |
| TR-20 | `POST /obter` SSR não valida formato de e-mail                                                                      | A rota pública `POST /obter` recebe `email` do body sem validação de formato — apenas verifica se não é falsy. Um e-mail malformado ou string arbitrária é passada diretamente ao `Participante.findOne({ where: { email } })`                                                                                                                                                                                                              | Baixa      | DT   | `src/routes/public.js` L21–24: `if (!email)` apenas                                                                                                                      | FR-25                       | Sequelize usa `WHERE email = 'input'` — sem risco de SQL injection pelo ORM, mas sem feedback útil para inputs inválidos                                                                                                                                                    |
| TR-21 | Validação de upload de template ausente na rota SSR de criação de evento                                            | A rota POST `/admin/eventos` inclui `uploadTemplate` middleware seguido de `eventoSSRController.criar`. O controller usa `req.body.nome` e `req.body.ano` para construir a key antes de qualquer validação estrutural dos dados do evento                                                                                                                                                                                                   | Média      | GI   | `src/routes/admin.js` L91–97; `eventoSSRController.js` L107–119: `handleTemplateUpload(req)` chamado antes de validação                                                  | FR-51, NFR-11               | Upload ao R2 pode ocorrer mesmo se criação do evento falhar depois (ex: violação de unicidade) — gerando arquivo órfão                                                                                                                                                      |
| TR-22 | Fallback de fonte `Helvetica` não é verificado no PDFKit                                                            | `pdfService.js` usa `doc.font('Helvetica')` como fallback. `Helvetica` é uma fonte embutida no PDFKit — correto. Porém, a diferença visual entre Lato-Medium e Helvetica não está documentada e não há alerta ao usuário sobre o fallback                                                                                                                                                                                                   | Baixa      | DT   | `src/services/pdfService.js` L67–70                                                                                                                                      | FR-47b                      | Certificados com fonte fallback têm aparência diferente; sem notificação ao gestor                                                                                                                                                                                          |
| TR-23 | Renderização pública SSR expõe `TiposCertificados.descricao` em `validar-resultado.hbs` sem controle de privacidade | A página pública de validação exibe `certificado.TiposCertificados.descricao` a qualquer visitante. Não há SRS definindo se a descrição do tipo é informação pública                                                                                                                                                                                                                                                                        | Baixa      | AM   | `views/certificados/validar-resultado.hbs` L26: `{{certificado.TiposCertificados.descricao}}`                                                                            | FR-24, FR-25                | Ausência de definição de privacidade dos campos exibidos publicamente                                                                                                                                                                                                       |
| TR-24 | `detalhe.hbs` não lida com `TiposCertificados` ausente (null-safety)                                                | `views/admin/certificados/detalhe.hbs` acessa `{{certificado.TiposCertificados.descricao}}` sem guard. Se o tipo foi soft-deletado, `TiposCertificados` pode ser `null` gerando renderização em branco silenciosa (Handlebars não lança erro, mas perde informação)                                                                                                                                                                         | Baixa      | DT   | `views/admin/certificados/detalhe.hbs` L25                                                                                                                               | FR-39                       | Certificados cujo tipo foi arquivado não exibem tipo no detalhe                                                                                                                                                                                                             |
| TR-25 | Ausência de Content Security Policy (CSP) nas layouts                                                               | `layout.hbs` e `layouts/admin.hbs` não definem `Content-Security-Policy` via meta tag ou header. Scripts inline são amplamente usados nos forms (form.hbs de certificado e tipos-certificados)                                                                                                                                                                                                                                              | Alta       | VU   | `views/layout.hbs` L1–88: sem CSP; `views/layouts/admin.hbs` L1–120: sem CSP; múltiplos `<script>` inline nos forms                                                      | NFR-1 (OWASP A03)           | Ausência de CSP aumenta superfície de exploração de XSS encontrada em TR-01 e TR-02                                                                                                                                                                                         |
| TR-26 | Dados de tipos (incluindo `dados_dinamicos` de todos os tipos) embutidos no JS do formulário de certificado         | `form.hbs` de certificados (linha 74–76) serializa **todos** os tipos com seus `dados_dinamicos` completos no HTML da página: `{{#each tipos}} tiposData['{{{id}}}'] = {{{json dados_dinamicos}}}; {{/each}}`. Todos os schemas de todos os tipos são expostos ao cliente browser                                                                                                                                                           | Média      | VA   | `views/admin/certificados/form.hbs` L74–76                                                                                                                               | NFR-1                       | Exposição de metadados de todos os tipos de certificados (não filtrado por escopo de evento) ao browser do usuário                                                                                                                                                          |
| TR-27 | `eventoService.delete` destrói também registros `UsuarioEvento`, quebrando rastreabilidade                          | Ao deletar (soft delete) um evento, `eventoService.delete` chama `UsuarioEvento.destroy({ where: { evento_id: id } })` sem `individualHooks: true` e sem paranoid. Isso remove **permanentemente** as associações usuário-evento, impossibilitando restauração completa                                                                                                                                                                     | Alta       | BR   | `src/services/eventoService.js` L49–59: `UsuarioEvento.destroy(...)` — não é soft delete                                                                                 | FR-9, NFR-4                 | Restaurar um evento via `eventoService.restore` tenta `UsuarioEvento.restore` sobre registros já deletados permanentemente — operação falha silenciosamente ou não restaura associações                                                                                     |
| TR-28 | `eventoService.restore` chama `UsuarioEvento.restore` mas os registros foram deletados permanentemente              | Como consequência de TR-27, `eventoService.restore` chama `UsuarioEvento.restore({ where: { evento_id: id } })` que nada restaura (registros foram `destroy`-ados de forma permanente)                                                                                                                                                                                                                                                      | Alta       | BR   | `src/services/eventoService.js` L61–69                                                                                                                                   | FR-9, NFR-4                 | Evento restaurado perde todas as vinculações com usuários (gestores/monitores)                                                                                                                                                                                              |
| TR-29 | Coordenadas de layout PDF (`texto_x/y`, `validacao_x/y`) não validadas pela API REST                                | `eventoSchema` Zod (`validators/evento.js`) não inclui os campos `texto_x`, `texto_y`, `validacao_x`, `validacao_y`. A API REST `PUT /eventos/:id` permite alterar esses campos sem validação de tipo ou intervalo, pois passam diretamente ao `evento.update(data)`                                                                                                                                                                        | Média      | GI   | `src/validators/evento.js` L3–9: sem campos de coordenadas; Zod no modo `strip` removeria esses campos — precisaria confirmar se `partial()` também os inclui            | FR-48                       | **Validação Humana:** Se Zod faz strip das coordenadas, elas nunca são atualizadas via API REST                                                                                                                                                                             |
| TR-30 | Ausência de rota API para upload de template (apenas SSR)                                                           | Não existe endpoint REST para upload de template de evento. O upload só é possível via SSR admin. Clientes da API não podem enviar templates sem multipart SSR                                                                                                                                                                                                                                                                              | Baixa      | AM   | `src/routes/eventos.js`: sem `uploadTemplate` middleware; apenas `src/routes/admin.js` L91–97 inclui `uploadTemplate`                                                    | FR-51                       | Ambiguidade de design: FR-51 menciona apenas interface SSR — pode ser intencional                                                                                                                                                                                           |

---

## 3. Vulnerabilidades e Riscos de Segurança

### TR-01 — XSS Stored via `{{{json ...}}}` em contexto `<script>` (form certificado)

**Severidade:** Alta  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
`views/admin/certificados/form.hbs` L71 emite `{{{json certificado.valores_dinamicos}}}` com triple-mustache (sem escape HTML) diretamente dentro de um bloco `<script>`. `valores_dinamicos` é um JSONB contendo dados fornecidos por usuários externos (participantes/gestores). Se o valor contiver `</script><script>alert(1)</script>`, o browser termina o bloco script atual e executa código arbitrário.

**Evidência:**

```hbs
const valoresExistentes = {{{json certificado.valores_dinamicos}}} || {};
```

**Vetor de ataque:** Gestor ou monitor cria certificado com `valores_dinamicos` contendo payload XSS → página de edição do certificado executa script.

**OWASP:** A03:2021 – Injection (XSS)

---

### TR-02 — XSS Stored via `{{{json tipo.dados_dinamicos}}}` em contexto `<script>` (form tipos-certificados)

**Severidade:** Alta  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
`views/admin/tipos-certificados/form.hbs` L106 emite `{{{json tipo.dados_dinamicos}}}` com triple-mustache em contexto `<script>`. `dados_dinamicos` é fornecido pelo gestor na criação do tipo. Um admin ou gestor malicioso pode injetar payload XSS neste campo que será executado para qualquer usuário que editar esse tipo.

**Evidência:**

```hbs
let dadosDinamicos = {{{json tipo.dados_dinamicos}}};
```

---

### TR-10 — Bypass de validação de MIME no upload de template

**Severidade:** Média  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
`uploadTemplate.js` confia exclusivamente no `file.mimetype` declarado pelo browser/formulário sem verificar magic bytes do arquivo. Um atacante pode enviar arquivo EXE/SVG com `Content-Type: image/png`. O arquivo é enviado ao R2 e persistido. Quando `pdfService` tenta usar o arquivo como imagem, PDFKit lançará erro, mas o arquivo malicioso já está no storage.

**Risco adicional:** SVG com JavaScript embutido poderia ser servido do R2 com Content-Type original.

---

### TR-16 — Logging de dados pessoais em produção

**Severidade:** Alta  
**Tipo:** VU — Vulnerabilidade (OWASP A09 – Security Logging and Monitoring Failures)

**Evidência:**

```js
// pdfService.js L16
console.log('PDFService certificado:', certificado)
```

O objeto `certificado` inclui: nome do participante, e-mail, `valores_dinamicos` (que pode conter dados como CPF, matrícula, cargo), código de validação. Qualquer acesso ao PDF loga esses dados.

---

### TR-19 — Ausência de validação de código na API `GET /api/validar/:codigo`

**Severidade:** Média  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
A rota SSR `POST /validar` aplica `CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i` antes de consultar o banco. A API REST `GET /api/validar/:codigo` não aplica nenhuma validação equivalente. Qualquer string de qualquer tamanho é passada diretamente ao `Certificado.findOne({ where: { codigo } })`. Embora o ORM proteja contra SQL injection, permite enumeração sem restrição de formato e possibilita ataques de força bruta não limitados.

---

### TR-25 — Ausência de Content Security Policy

**Severidade:** Alta  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
Nenhum dos layouts (`layout.hbs`, `layouts/admin.hbs`) define CSP. Os formulários SSR contêm extensos blocos `<script>` inline com manipulação de DOM. CSP ausente significa que qualquer XSS encontrado (TR-01, TR-02) pode executar código arbitrário sem restrições de `script-src`.

---

### TR-04 — Path inconsistente na key R2 por injeção de tipo no `ano`

**Severidade:** Média  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
`buildTemplateKey(nome, String(ano), mimetype)` converte `ano` para string sem validar que é número. Formulário HTML envia como string numérica, mas via API REST o campo não é incluído nos validators da rota de upload. Embora não permita traversal (o slug sanitiza a maioria dos caracteres), `String([1, 2])` = `"1,2"` poderia gerar key inesperada se `ano` for array.

---

### TR-05 — Substituição arbitrária de `url_template_base` via API REST

**Severidade:** Alta  
**Tipo:** VU — Vulnerabilidade

**Análise:**  
`eventoSchema` Zod valida `url_template_base` como `z.string().url()`, aceitando qualquer URL externa válida. A API REST `PUT /eventos/:id` permite que qualquer usuário autenticado com acesso de edição aponte `url_template_base` para `"https://servidor-adversario.com/malicioso.jpg"`. O `r2Service.getFile` usa essa key para buscar no R2 — key como URL externa causará erro no S3 SDK, mas o valor persiste no banco e pode causar SSRF futuro se a implementação mudar.

**Nota:** A validação atual com `.url()` contradiz FR-44 que define o campo como key R2 (caminho relativo), não URL. Isso é simultaneamente uma vulnerabilidade e uma inconsistência documental.

---

## 4. Consistência Arquitetural

### 4.1 Separação controller/service

- **Conforme (PDF):** `pdfService` encapsula toda lógica de geração; `api.js` apenas orquestra a chamada. ✓
- **Parcialmente conforme (upload):** Lógica de `buildTemplateKey` e `handleTemplateUpload` está no `eventoSSRController` em vez de no `eventoService`. Lógica de negócio residindo no controller viola NFR-6. ✗
- **Não conforme (validação pública):** Routes `public.js` e `api.js` contêm lógica de negócio diretamente (queries ao banco, formatação de resposta) sem delegação a services. ✗

### 4.2 Responsabilidade da renderização

- `templateService.interpolate` é correto e focado. ✓
- `pdfService` combina responsabilidades de fetch de assets (R2) e renderização PDF — aceitável pela natureza da geração, mas dificulta teste unitário. DT
- Detalhe SSR chama `templateService` diretamente no controller sem encapsular em service. DT

### 4.3 Enforcement de escopo e ownership

- **Crítico:** Upload de template de evento (`SSR POST /admin/eventos`) não verifica ownership: qualquer admin pode modificar template de qualquer evento. Correto pelo design (admins têm acesso irrestrito). ✓
- **Problema:** A rota API REST `PUT /eventos/:id` usa `scopedEvento` que aplica o bug documentado em auditoria 08 (BR-06). Templates de eventos podem ser modificados indevidamente. ✗ (dependência com achado anterior)

### 4.4 Sincronização banco/storage

- **Não sincronizado:** Soft delete de evento não remove arquivo do R2. ✗ (TR-11)
- **Não sincronizado:** Atualização de template não remove arquivo anterior. ✗ (TR-12)
- **Não sincronizado:** Restauração de evento não verifica existência do arquivo no R2. ✗
- Não há transação que garanta atomicidade entre criação/atualização do registro Evento e upload do arquivo R2. Uma falha parcial (upload ok, banco falha, ou banco ok, upload falha) deixa o sistema inconsistente. ✗

### 4.5 Lifecycle físico dos templates

| Operação                            | Banco                          | R2                                         | Status                              |
| ----------------------------------- | ------------------------------ | ------------------------------------------ | ----------------------------------- |
| Criar evento com template           | `url_template_base` salva      | Upload realizado                           | OK se banco não falha após upload   |
| Atualizar template                  | `url_template_base` atualizada | Novo upload                                | Arquivo antigo não removido (TR-12) |
| Soft delete evento                  | `deleted_at` preenchido        | Arquivo permanece                          | Órfão no R2 (TR-11)                 |
| Restaurar evento                    | `deleted_at` zerado            | Arquivo pode ter sido removido manualmente | Sem verificação (GI)                |
| Deletar template sem deletar evento | Não implementado               | —                                          | Feature ausente                     |

### 4.6 Consistência SSR/API

| Funcionalidade                     | SSR                                     | API REST                              | Consistente?     |
| ---------------------------------- | --------------------------------------- | ------------------------------------- | ---------------- |
| Validação de código de certificado | `CODIGO_CERTIFICADO_REGEX` aplicado     | Sem validação                         | ✗ (TR-19)        |
| Upload de template                 | Via multer SSR                          | Campo `url_template_base` como string | ✗ (TR-05, TR-18) |
| Coordenadas PDF                    | Campos no formulário SSR                | Não nos validators Zod                | ✗ (TR-29)        |
| Geração de PDF                     | Botão no painel aponta para path errado | API pública funciona                  | ✗ (TR-07)        |
| Texto interpolado                  | Broken (TR-08)                          | Via PDF (correto)                     | ✗ (TR-08)        |

---

## 5. Divergências com o SRS

| ID   | FR/NFR | Comportamento especificado                                                                      | Comportamento implementado                                                                | Tipo                                        |
| ---- | ------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| D-01 | FR-44  | `url_template_base` armazena **key** (caminho relativo) dentro do R2                            | Zod valida como `.url()` completa, rejeitando keys relativas como `"template/padrao.jpg"` | ID — Inconsistência documental com bug real |
| D-02 | FR-47  | Fallback de template: usa `"template/padrao.jpg"` se `url_template_base` não definido           | Implementado corretamente em `pdfService.js` L35                                          | ✓                                           |
| D-03 | FR-47b | Fonte `Lato-Medium.ttf` do R2; fallback `Helvetica`                                             | Implementado                                                                              | ✓                                           |
| D-04 | FR-47c | PDF A4 landscape com coordenadas configuráveis por evento                                       | Implementado                                                                              | ✓                                           |
| D-05 | FR-47d | Link de validação usa `ENDERECO_VALIDACAO` env var; default `https://certificaaqui.com/validar` | Implementado                                                                              | ✓                                           |
| D-06 | FR-51  | Upload: PNG ou JPEG, máx. 2 MB; key `templates/<slug-nome>/<ano>/base.<ext>`                    | Implementado, mas sem atomicidade e sem remoção do arquivo anterior                       | IP                                          |
| D-07 | FR-42  | PDF gerado sob demanda, sem autenticação                                                        | Implementado, mas sem filtro de status (cancelados geram PDF)                             | GI (TR-06, TR-15)                           |
| D-08 | FR-39  | Placeholders sem correspondência mantidos sem substituição                                      | Implementado em `templateService.interpolate` L15: `return match`                         | ✓                                           |
| D-09 | NFR-6  | Lógica de negócio não deve residir em rotas ou models                                           | `public.js` e `api.js` contêm queries diretas ao banco                                    | VA                                          |
| D-10 | NFR-11 | Uploads restritos a PNG/JPEG, máx. 2 MB (validado por multer)                                   | Validação de MIME baseada em declaração do cliente — sem magic bytes                      | GI/VU (TR-10)                               |

---

## 6. Itens para Validação Humana

| VH-ID | Questão                                                                                                                                                                   | Contexto                                                                                                                        | Área                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| VH-01 | PDF de certificados com status `"cancelado"` ou `"pendente"` deve ser gerado publicamente?                                                                                | FR-42 não restringe por status, mas o modelo de negócio pode exigir que apenas certificados `"emitido"` gerem PDF acessível     | Produto / Regras de negócio       |
| VH-02 | A `url_template_base` deve aceitar apenas keys R2 relativas ou URLs completas?                                                                                            | FR-44 diz "key (caminho)", mas o campo aceita URLs no banco. Definir contrato binário impacta API e validação Zod               | Arquitetura / SRS                 |
| VH-03 | Ao atualizar o template de um evento, o arquivo anterior deve ser removido do R2?                                                                                         | Sem remoção há acúmulo de arquivos órfãos; com remoção há risco de apagar arquivo em uso por CDN/cache                          | Arquitetura / Política de storage |
| VH-04 | Ao deletar (soft) um evento, o template no R2 deve ser removido ou preservado?                                                                                            | Soft delete é reversível — remover o arquivo quebraria a restauração; não remover gera acúmulo                                  | Arquitetura / Ciclo de vida       |
| VH-05 | Quais campos do certificado devem ser exibidos publicamente na página de validação SSR?                                                                                   | `validar-resultado.hbs` exibe nome do participante, e-mail, evento, tipo e status — sem controle de privacidade definido no SRS | Produto / Privacidade             |
| VH-06 | O upload de template deve ser possível via API REST ou apenas via SSR?                                                                                                    | FR-51 menciona "via interface SSR" — se intencional, API deve bloquear atualização de `url_template_base` via JSON              | Produto / Arquitetura             |
| VH-07 | A renderização de dados JSONB (`dados_dinamicos`, `valores_dinamicos`) em contexto `<script>` sem sanitização adicional é aceitável dado o modelo de usuários confiáveis? | Os dados são inseridos por gestores/admins autenticados — mas um compromisso de conta poderia escalar para XSS stored           | Segurança / Política              |
| VH-08 | Deve haver rate limiting na rota pública `GET /api/certificados/:id/pdf`?                                                                                                 | PDF é gerado sob demanda com acesso ao R2 e PDFKit — sem throttling pode ser usado como vetor de DoS                            | Segurança / Performance           |

---

## 7. Problemas Sistêmicos Identificados

### P-01: Triple-mustache em contexto `<script>` — padrão perigoso recorrente

O `helper json` combinado com triple-mustache `{{{json ...}}}` é usado pelo menos em 2 templates para injetar objetos JSON dentro de blocos `<script>`. Esse é um padrão perigoso que requer sanitização explícita ou uso de `JSON.stringify` com escape de `</script>`. O padrão pode se repetir em futuras views seguindo o mesmo modelo.

### P-02: Ausência de atomicidade banco ↔ storage

Em nenhuma operação que envolve tanto banco quanto R2 há controle de transação. Se o upload R2 falha após o `evento.create`, o registro fica sem template. Se o `evento.create` falha após o upload ao R2, o arquivo fica órfão. Esse padrão de "operações duplas sem compensação" é sistêmico e cria estado inconsistente difícil de detectar.

### P-03: Lifecycle de assets R2 não gerenciado

O R2 funciona apenas como destino de upload. Não há: remoção de arquivos antigos, verificação de existência antes de uso, expiração de arquivos, listagem de órfãos. O storage acumula arquivos indefinidamente sem rastreabilidade.

### P-04: Inconsistência SSR vs API em segurança de inputs

A camada SSR aplica validações que a API REST não aplica (`CODIGO_CERTIFICADO_REGEX`, coordenadas de layout, tipo MIME real). As duas interfaces deveriam compartilhar as mesmas regras de validação via validators centralizados.

### P-05: Lógica de negócio em rotas públicas (`public.js`, `api.js`)

Queries ao banco, formatação de dados, e tratamento de erros estão diretamente nas rotas em vez de em services. Isso dificulta testes unitários e pode introduzir divergências comportamentais entre os channels.

### P-06: Aliasing inconsistente de Sequelize em toda a codebase

O alias `TiposCertificados` vs `TiposCertificado` (singular vs plural) causa bugs silenciosos (TR-08) e código defensivo (TR-09). Não há convenção aplicada de forma consistente.

---

## 8. Recomendações de Destinação

| ID            | Achado                                                                     | Destinação                                                              | Prioridade |
| ------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- |
| TR-01         | XSS via `{{{json valores_dinamicos}}}` em `<script>`                       | **Correção imediata**                                                   | Crítica    |
| TR-02         | XSS via `{{{json dados_dinamicos}}}` em `<script>`                         | **Correção imediata**                                                   | Crítica    |
| TR-16         | `console.log` de dados pessoais em pdfService                              | **Correção imediata**                                                   | Alta       |
| TR-07         | Link PDF quebrado no detalhe SSR (`/public/...`)                           | **Correção imediata**                                                   | Alta       |
| TR-08         | Alias errado `TiposCertificado` vs `TiposCertificados` no detalhe SSR      | **Correção imediata**                                                   | Alta       |
| TR-25         | Ausência de Content Security Policy                                        | **Backlog técnico**                                                     | Alta       |
| TR-05         | `url_template_base` via API aceita URLs externas arbitrárias               | **Correção imediata** + **ADR arquitetural** sobre field type           | Alta       |
| TR-18         | `eventoSchema` Zod valida como `.url()` em vez de key R2                   | **Atualização do SRS** + **correção**                                   | Alta       |
| TR-10         | MIME validation sem magic bytes no upload                                  | **Backlog técnico**                                                     | Média      |
| TR-27         | `UsuarioEvento.destroy` permanente em vez de soft delete ao deletar evento | **Correção imediata**                                                   | Alta       |
| TR-28         | `UsuarioEvento.restore` não funciona por causa do TR-27                    | **Correção imediata**                                                   | Alta       |
| TR-11         | Template R2 órfão ao soft delete de evento                                 | **Backlog técnico** + **ADR arquitetural** (lifecycle de assets)        | Média      |
| TR-12         | Arquivo R2 anterior não removido ao atualizar template                     | **Backlog técnico**                                                     | Média      |
| TR-13         | `buildTemplateKey` usa body em vez do banco ao atualizar                   | **Backlog técnico**                                                     | Média      |
| TR-21         | Upload ao R2 antes de validação do evento                                  | **Backlog técnico**                                                     | Média      |
| TR-14         | R2 sem timeout configurado                                                 | **Backlog técnico**                                                     | Média      |
| TR-06 / TR-15 | PDF de certificados cancelados gerado sem restrição                        | **Validação humana** → decisão produto → **backlog**                    | Média      |
| TR-19         | Ausência de regex de validação em `GET /api/validar/:codigo`               | **Backlog técnico**                                                     | Média      |
| TR-26         | Todos os `dados_dinamicos` embutidos no HTML do form certificado           | **Futura spec do Spec Kit** (API endpoint para campos do tipo)          | Média      |
| TR-04         | `ano` não tipado em `buildTemplateKey`                                     | **Backlog técnico**                                                     | Baixa      |
| TR-09         | Fallback duplo de alias em pdfService                                      | **Backlog técnico** (resolver aliasing sistêmico primeiro)              | Baixa      |
| TR-17         | ID sem coerção em rota PDF                                                 | **Backlog técnico**                                                     | Baixa      |
| TR-20         | Ausência de validação de email em `POST /obter`                            | **Backlog técnico**                                                     | Baixa      |
| TR-22         | Fallback de fonte sem notificação                                          | **Backlog técnico**                                                     | Baixa      |
| TR-23         | Privacidade de campos em validar-resultado SSR                             | **Validação humana** → atualização do SRS                               | Baixa      |
| TR-24         | Null-safety ausente para TiposCertificados em detalhe.hbs                  | **Backlog técnico**                                                     | Baixa      |
| TR-29         | Coordenadas PDF não nos validators Zod da API                              | **Validação humana** + **backlog**                                      | Média      |
| TR-30         | Upload de template ausente na API REST                                     | **Atualização do SRS** (clarificar se intencional)                      | Baixa      |
| P-01          | Padrão triple-mustache em `<script>` — recorrente                          | **ADR arquitetural** (política de uso de helpers Handlebars em scripts) | Alta       |
| P-02          | Falta atomicidade banco ↔ R2                                               | **ADR arquitetural** + **futura spec** (transações compensatórias)      | Alta       |
| P-03          | Lifecycle de assets R2 não gerenciado                                      | **ADR arquitetural**                                                    | Média      |
| P-04          | Inconsistência SSR vs API em validação                                     | **Backlog técnico**                                                     | Média      |
| P-05          | Lógica em rotas públicas                                                   | **Dívida técnica** — refatoração gradual                                | Baixa      |
| P-06          | Aliasing inconsistente Sequelize                                           | **Backlog técnico**                                                     | Alta       |

---

## Resumo Executivo

**Data:** 2026-05-09 20:29 (BRT)  
**Domínio auditado:** Templates / Assets / Renderização  
**Total de achados:** 30 (TR-01 a TR-30) + 6 problemas sistêmicos (P-01 a P-06)

### Quantificação

| Tipo                           | Quantidade                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| Vulnerabilidade (VU)           | **7** (TR-01, TR-02, TR-04, TR-05, TR-10, TR-16, TR-19, TR-25) |
| Bug Real (BR)                  | **5** (TR-07, TR-08, TR-13, TR-27, TR-28)                      |
| Gap de Implementação (GI)      | **6** (TR-06, TR-11, TR-12, TR-15, TR-21, TR-29)               |
| Dívida Técnica (DT)            | **7** (TR-09, TR-14, TR-17, TR-20, TR-22, TR-24, TR-30)        |
| Inconsistência Documental (ID) | **2** (TR-03 parcial, TR-18)                                   |
| Violação Arquitetural (VA)     | **2** (TR-26 e D-09)                                           |
| Ambiguidade (AM)               | **2** (TR-23, TR-30)                                           |
| Problemas sistêmicos           | **6**                                                          |

### Vulnerabilidades críticas (correção imediata)

1. **TR-01 / TR-02 — XSS Stored** via `{{{json ...}}}` em contexto `<script>` nos formulários de certificado e tipos-certificados. Dados JSONB do banco emitidos sem escape em HTML.
2. **TR-16 — Logging de dados pessoais** em produção a cada geração de PDF.
3. **TR-25 — Ausência de CSP** que amplia a superfície de exploração de XSS.
4. **TR-05 — Substituição de key R2 por URL externa** via API REST — potencial vetor SSRF futuro.

### Principais riscos de renderização

- PDF gerado sem controle de status (certificados cancelados geram PDF).
- Texto interpolado no detalhe SSR sempre vazio (alias errado).
- Link de download de PDF no painel admin quebrado (404).
- Assets R2 carregados sem timeout — potencial hang em degradação do storage.

### Riscos multi-tenant

- **Não identificados diretamente neste domínio** — templates são atributos de eventos, e o acesso a eventos é controlado pelo RBAC e `scopedEvento`. Os bugs de escopo (BR-01, BR-02 da auditoria 08) afetam indiretamente quais templates são visíveis, mas não há vazamento direto de templates de outros tenants neste domínio.
- **Potencial:** `dados_dinamicos` de todos os tipos de certificados é embutido no HTML do formulário de certificados (TR-26), expondo metadados de tipos não filtrados por escopo ao browser do usuário autenticado.

### Possíveis impactos arquiteturais transversais

1. **Aliasing inconsistente Sequelize** (`TiposCertificado` vs `TiposCertificados`) é um problema raiz que gera bugs em múltiplos domínios (auditoria 08 + este domínio). Deve ser corrigido com rename sistemático.
2. **Ausência de atomicidade banco ↔ R2** é um problema de arquitetura transversal que afeta confiabilidade do sistema em qualquer operação que envolva storage externo.
3. **Padrão `{{{json ...}}}` em `<script>`** pode estar presente em outras views não auditadas — recomenda-se varredura completa do diretório `views/`.
4. **`UsuarioEvento.destroy` permanente** (TR-27/28) afeta a restauração de eventos, comprometendo o invariante NFR-4 (soft delete) em todo o sistema de associações usuário-evento.
