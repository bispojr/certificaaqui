# Auditoria Técnica — Domínio: Geração de PDF

**Sistema:** Certifique-me  
**Versão SRS auditada:** 2.0 (2026-04-30)  
**Data da auditoria:** 2026-05-09  
**Auditor:** GitHub Copilot (Claude Sonnet 4.6) — análise estática  
**Escopo:** Geração de PDF, renderização de certificados, fluxo público e autenticado, templates, interpolação, integridade, segurança multi-tenant, persistência

---

## Fontes Analisadas

| Arquivo                                         | Tipo               |
| ----------------------------------------------- | ------------------ |
| `docs/especificacoes.md`                        | SRS                |
| `docs/decisoes/004-pdfkit-gerador-pdf.md`       | ADR                |
| `docs/decisoes/008-pdf-on-the-fly.md`           | ADR                |
| `src/services/pdfService.js`                    | Implementação      |
| `src/services/templateService.js`               | Implementação      |
| `src/services/r2Service.js`                     | Implementação      |
| `src/services/certificadoService.js`            | Implementação      |
| `src/controllers/certificadoController.js`      | Implementação      |
| `src/controllers/certificadoSSRController.js`   | Implementação      |
| `src/controllers/eventoSSRController.js`        | Implementação      |
| `src/routes/api.js`                             | Implementação      |
| `src/routes/certificados.js`                    | Implementação      |
| `src/routes/public.js`                          | Implementação      |
| `src/routes/admin.js`                           | Implementação      |
| `src/middlewares/scopedEvento.js`               | Implementação      |
| `src/middlewares/tiposCertificadosOwnership.js` | Implementação      |
| `src/middlewares/uploadTemplate.js`             | Implementação      |
| `src/middlewares/rbac.js`                       | Implementação      |
| `src/models/certificado.js`                     | Implementação      |
| `src/models/evento.js`                          | Implementação      |
| `src/models/tipos_certificados.js`              | Implementação      |
| `src/validators/certificado.js`                 | Implementação      |
| `views/certificados/obter-lista.hbs`            | Template SSR       |
| `views/certificados/validar-resultado.hbs`      | Template SSR       |
| `views/certificados/form-obter.hbs`             | Template SSR       |
| `views/certificados/form-validar.hbs`           | Template SSR       |
| `views/admin/certificados/detalhe.hbs`          | Template SSR admin |
| `views/admin/certificados/index.hbs`            | Template SSR admin |
| `tests/services/pdfService.test.js`             | Testes             |
| `tests/routes/certificados.test.js`             | Testes             |

---

## 1. Matriz Consolidada de Achados

| ID     | Descrição                                                                                                                                               | Evidências                                                                                                                                                                                                                                                                                                          | Severidade | Tipo    | Impacto                                                                                                                                                                                              | Requisitos Violados | Destino               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------- |
| PDF-01 | `scopedEvento` usa o ID do certificado (`req.params.id`) como se fosse `evento_id` em rotas API `/certificados/:id`                                     | `scopedEvento.js` linha: `const eventoId = req.body.evento_id \|\| req.params.eventoId \|\| req.params.id` — em `GET/PUT/DELETE /certificados/:id`, `req.params.id` é o PK do certificado, não do evento. A comparação contra `eventosIds` é semanticamente incorreta, permitindo acesso cruzado entre tenants      | Crítico    | VU + BR | Gestor de evento A pode acessar, atualizar e deletar certificados de evento B enquanto o middleware incorretamente aprova ou nega acessos com base em coincidência de IDs                            | FR-37, NFR-1        | Correção imediata     |
| PDF-02 | Rotas SSR admin de certificados não aplicam restrição de escopo de evento                                                                               | `src/routes/admin.js`: `router.get('/certificados/:id', rbac('monitor'), ...)`, `router.post('/certificados/:id', rbac('gestor'), ...)`, `router.post('/certificados/:id/cancelar', ...)`, `router.post('/certificados/:id/deletar', ...)` — nenhuma dessas rotas aplica `scopedEvento` ou verificação de ownership | Crítico    | VU      | Gestor vinculado ao evento A pode visualizar detalhes, editar, cancelar e deletar certificados de qualquer evento B por acesso direto via `/admin/certificados/:id`                                  | FR-37, NFR-1        | Correção imediata     |
| PDF-03 | `certificadoService.findAll` ignora filtro de `evento_id` injetado por `scopedEvento`                                                                   | `certificadoController.js`: `certificadoService.findAll({ page, perPage })` — `evento_id` injetado em `req.query` pelo `scopedEvento` não é passado ao service. `certificadoService.findAll` faz `Certificado.findAndCountAll()` sem cláusula `where`                                                               | Crítico    | VU + BR | Gestor/monitor acessa via API `GET /certificados` e recebe **todos** os certificados do sistema, sem filtro por evento                                                                               | FR-37, NFR-1        | Correção imediata     |
| PDF-04 | `detalhe.hbs` (admin) aponta para rota inexistente `/public/certificados/:id/pdf`                                                                       | `views/admin/certificados/detalhe.hbs` linha 5: `href="/public/certificados/{{certificado.id}}/pdf"` — a rota correta é `/api/certificados/:id/pdf`. A rota `/public/certificados/*` não existe em nenhum router registrado em `app.js`                                                                             | Alto       | BR      | Botão "Baixar PDF" na tela de detalhe do certificado no painel admin sempre resulta em HTTP 404. Funcionalidade de download quebrada para usuários autenticados                                      | FR-42               | Correção imediata     |
| PDF-05 | Alias `TiposCertificado` (singular) na função `detalhe` do SSR Controller diverge do alias `TiposCertificados` (plural) usado no `INCLUDES`             | `certificadoSSRController.js`: `INCLUDES` usa `as: 'TiposCertificados'`, mas `detalhe()` acessa `certificado.TiposCertificado?.texto_base` — o optional chaining nunca resolve (é `undefined`), resultando em `textoInterpolado = ''` sempre                                                                        | Alto       | BR      | Painel admin: o card "Texto do Certificado" nunca é exibido na tela de detalhe. A interpolação de texto é silenciosamente ignorada                                                                   | FR-39               | Backlog curto prazo   |
| PDF-06 | Race condition na geração do código de certificado (`TOCTOU`)                                                                                           | `certificadoService.js`: `count = await Certificado.count({...})` seguido de `Certificado.create({ codigo: count+1 })` — sem transação atômica ou lock. Duas requisições simultâneas podem gerar o mesmo código                                                                                                     | Alto       | BR      | Colisão de `codigo` (campo `UNIQUE`) → `SequelizeUniqueConstraintError` não tratado → HTTP 500 exposto ao cliente, sem fallback ou retry                                                             | FR-52               | Backlog curto prazo   |
| PDF-07 | `count()` exclui soft-deletados, podendo gerar código incremental que colide com código de certificado soft-deletado                                    | `certificadoService.js`: `Certificado.count()` com modelo `paranoid: true` exclui registros soft-deletados. Após soft-delete de N certificados, o próximo `count+1` pode coincidir com o código de um certificado deletado (que ainda detém a chave `UNIQUE` global sem filtro parcial)                             | Alto       | BR      | Geração falha com `SequelizeUniqueConstraintError` ao tentar criar código que coincide com registro soft-deletado; situação não tratada no service                                                   | FR-52, NFR-4        | Backlog curto prazo   |
| PDF-08 | `console.log('PDFService certificado:', certificado)` expõe dados sensíveis em logs de produção                                                         | `pdfService.js` linha 12: `console.log('PDFService certificado:', certificado)` — loga o objeto completo do certificado incluindo `valores_dinamicos` (dados pessoais/acadêmicos) e dados do participante                                                                                                           | Médio      | VU      | Exposição de PII e dados sensíveis nos logs de produção/stdout; risco GDPR e OWASP A09                                                                                                               | NFR-1               | Correção imediata     |
| PDF-09 | Certificados com `status = 'cancelado'` geram PDF sem restrição                                                                                         | `src/routes/api.js`: `router.get('/certificados/:id/pdf', ...)` — faz `Certificado.findByPk(id, {...})` sem filtro de status. FR-43 valida apenas a presença de `codigo`, não o `status` do certificado                                                                                                             | Médio      | AM      | PDF de certificado cancelado pode ser gerado e baixado; `obter-lista.hbs` exibe botão "Baixar PDF" para certificados cancelados. Comportamento não especificado no SRS                               | FR-43               | Validação humana (VH) |
| PDF-10 | Endpoint público `GET /api/certificados/:id/pdf` sujeito a enumeração por ID sequencial                                                                 | A rota aceita qualquer integer como `:id`. IDs são auto-incrementais. Sem rate limiting, sem payload mínimo de autenticação                                                                                                                                                                                         | Médio      | VU      | Atacante pode iterar IDs sequencialmente para baixar PDFs de todos os certificados do sistema, extraindo dados de participantes e conteúdo de certificados                                           | FR-25, NFR-1        | Backlog médio prazo   |
| PDF-11 | `GET /api/validar/:codigo` no router `api.js` não valida formato do código, enquanto `GET /validar/:codigo` SSR aplica regex `CODIGO_CERTIFICADO_REGEX` | `api.js`: `const { codigo } = req.params` + `Certificado.findOne({ where: { codigo } })` — sem validação. `public.js`: `if (!CODIGO_CERTIFICADO_REGEX.test(codigo)) return res.status(400)...`                                                                                                                      | Médio      | GI      | Inconsistência entre validação API e SSR; a API aceita strings arbitrárias como código (inclusive com caracteres especiais)                                                                          | FR-24               | Backlog curto prazo   |
| PDF-12 | SSR `cancelar` em `certificadoSSRController.js` bypassa `certificadoService.cancel()` e lógica de serviço                                               | `certificadoSSRController.js` função `cancelar`: `await certificado.update({ status: 'cancelado' })` diretamente no modelo. O service layer equivalente (`certificadoService.cancel(id)`) não é chamado                                                                                                             | Médio      | VA      | Violação de NFR-6 (routes → controllers → services → models). Lógica duplicada; mudanças futuras no service não seriam refletidas no fluxo SSR                                                       | NFR-6               | Backlog curto prazo   |
| PDF-13 | Lógica de geração de PDF implementada diretamente na rota `api.js` sem delegação a controller                                                           | `api.js`: o handler de `GET /certificados/:id/pdf` chama `Certificado.findByPk(...)` e `pdfService.generateCertificadoPdf(...)` diretamente na função anônima da rota, sem controller intermediário                                                                                                                 | Médio      | VA      | Violação de NFR-6. Ausência de controller para o fluxo de geração de PDF; impossibilita reutilização, testabilidade isolada e organização consistente                                                | NFR-6               | Backlog médio prazo   |
| PDF-14 | Lazy `require('./r2Service')` dentro de `pdfService.generateCertificadoPdf`                                                                             | `pdfService.js` linha 4-5: `const r2Service = require('./r2Service')` dentro do corpo da função async. Comentário: "evitar dependência circular"                                                                                                                                                                    | Baixo      | DT      | Indica possível dependência circular não resolvida arquiteturalmente; o require inline não é resolvido em tempo de módulo, dificultando mocking nos testes e detecção de erros de import             | —                   | Backlog longo prazo   |
| PDF-15 | Template key R2 de evento pode colidir entre eventos com nomes similares após slugificação                                                              | `eventoSSRController.js` função `buildTemplateKey`: nome "Evento ABC" e "Evento-ABC" produzem o mesmo slug `evento-abc`, gerando key idêntica `templates/evento-abc/2026/base.jpg`                                                                                                                                  | Médio      | BR      | Upload do segundo evento sobrescreve silenciosamente o template do primeiro. O campo `url_template_base` aponta para a mesma key; ambos os eventos passam a usar o template do último que fez upload | FR-44, FR-51        | Backlog curto prazo   |
| PDF-16 | Slug vazio na geração de template key R2 quando nome do evento produz nenhum caractere alfanumérico                                                     | `buildTemplateKey`: cadeia de `replace` pode resultar em slug `""` → key `templates//<ano>/base.<ext>` com segmento duplo de barra                                                                                                                                                                                  | Baixo      | BR      | Key malformada enviada ao R2; o comportamento do bucket com path inválido não é determinístico (pode sobreescrever um objeto raiz ou falhar silenciosamente)                                         | FR-51               | Backlog médio prazo   |
| PDF-17 | FR-44 especifica que `url_template_base` deve ser "URL válida", mas a implementação armazena e usa o campo como R2 key (path relativo, não URL)         | SRS FR-44: "deve conter uma URL válida (ou ser `null`)". Implementação em `eventoSSRController.js` armazena strings como `templates/meu-evento/2026/base.jpg` (path sem scheme HTTP)                                                                                                                                | Baixo      | ID      | Nenhuma validação de URL é aplicada ao campo (nem model, nem service, nem validator). A denominação "url" no campo gera confusão; o comportamento real é de um R2 object key                         | FR-44               | Atualização SRS       |
| PDF-18 | `obter-lista.hbs` exibe "Baixar PDF" para certificados com status `cancelado` e `pendente` sem distinção visual nem bloqueio                            | `views/certificados/obter-lista.hbs`: botão `<a href='/api/certificados/{{this.id}}/pdf'>Baixar PDF</a>` exibido para todos os status sem filtro                                                                                                                                                                    | Baixo      | GI      | Participante pode baixar PDF de certificado que foi cancelado, sem indicação de que o documento pode não ser mais válido                                                                             | FR-43, FR-19        | Validação humana (VH) |
| PDF-19 | `validar-resultado.hbs` SSR e `GET /api/validar/:codigo` exibem certificado cancelado como `valido: true`                                               | `public.js` e `api.js`: `Certificado.findOne({ where: { codigo } })` sem filtro `status != 'cancelado'`; certificado encontrado sempre retorna `valido: true`                                                                                                                                                       | Médio      | GI      | Um certificado cancelado aparece como válido na consulta pública. O participante e terceiros recebem informação equivocada sobre a validade do documento                                             | FR-24, FR-19        | Validação humana (VH) |
| PDF-20 | Dimensões A4 landscape passadas ao PDFKit inconsistentes com o padrão ISO 216                                                                           | `pdfService.js`: `size: [594.96, 841.92]` com `layout: 'landscape'` — o padrão A4 é 595.28 × 841.89 pt. Com `layout: 'landscape'`, PDFKit pode manter ou inverter as dimensões fornecidas, gerando resultados dependentes da versão da biblioteca                                                                   | Baixo      | DT      | PDF gerado com dimensões ligeiramente incorretas (desvio < 1pt); pode causar discrepâncias de alinhamento de texto para templates de fundo com posicionamento preciso                                | FR-47c              | Backlog longo prazo   |
| PDF-21 | `POST /obter` SSR não valida formato do e-mail antes da consulta ao banco                                                                               | `public.js`: `const { email } = req.body; if (!email) { ... }; Participante.findOne({ where: { email } })` — apenas valida presença; qualquer string é enviada ao banco                                                                                                                                             | Baixo      | GI      | Strings arbitrárias geram consultas desnecessárias ao banco; nenhum risco de SQL injection (ORM parametrizado), mas reduz qualidade de validação                                                     | FR-25               | Backlog longo prazo   |
| PDF-22 | `certificadoSSRController` no fluxo de `criar` e `atualizar` SSR não aplica restrição de evento ao tipo de certificado selecionado                      | `certificadoSSRController.js` funções `criar` e `atualizar`: delega a `certificadoService.create()` e `certificado.update()`, respectivamente, que não verificam se `tipo_certificado_id` pertence ao `evento_id` informado                                                                                         | Médio      | GI      | Gestor pode criar certificado cruzando tipo de evento A com evento B se souber os IDs correspondentes; não há validação de consistência tipo × evento na camada de service/SSR                       | FR-45, FR-46        | Backlog curto prazo   |
| PDF-23 | Ausência de mecanismo de rate limiting no endpoint público de geração de PDF                                                                            | `api.js`: `GET /api/certificados/:id/pdf` — sem middleware de rate limiting. O endpoint `POST /usuarios/login` tem rate limiting (FR-55), mas o endpoint de PDF (CPU-intensivo) não                                                                                                                                 | Médio      | GI      | Endpoint de geração de PDF (PDFKit + 2 chamadas R2) pode ser explorado para exaurir CPU via requisições massivas sem controle de taxa                                                                | NFR-1               | Backlog médio prazo   |
| PDF-24 | `INCLUDES` em `certificadoSSRController.js` omite atributo `campo_destaque` do `TiposCertificados`                                                      | `certificadoSSRController.js` constante `INCLUDES`: `attributes: ['id', 'descricao', 'texto_base', 'dados_dinamicos']` — `campo_destaque` ausente                                                                                                                                                                   | Baixo      | IP      | Dados de `campo_destaque` não são disponibilizados em contextos SSR que usam este `INCLUDES`; se necessário em views futuras, exigirá refactor explícito                                             | FR-14               | Backlog longo prazo   |

---

## 2. Correções Críticas Imediatas

### PDF-01 — `scopedEvento` com lógica incorreta para rotas de certificado

**Arquivo:** `src/middlewares/scopedEvento.js`

**Evidência concreta:**

```js
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
```

Para `GET /certificados/:id`, `PUT /certificados/:id`, `DELETE /certificados/:id`, o `req.params.id` é o **ID do certificado** (PK), não o `evento_id`. O middleware compara este valor com os eventos do usuário, produzindo:

- **Falso acesso (bypass):** certificado ID=5 → usuário em evento 5 → middleware aprova mesmo que o certificado pertença ao evento 12
- **Falsa negação:** certificado ID=8 → usuário em evento 10 → middleware bloqueia acesso legítimo

**Impacto:** Violação de isolamento multi-tenant em todas as operações de leitura/escrita de certificados individuais via API REST.

---

### PDF-02 — Rotas SSR admin sem restrição de escopo de evento

**Arquivo:** `src/routes/admin.js`

**Evidência concreta:**

```js
router.get(
  '/certificados/:id',
  rbac('monitor'),
  certificadoSSRController.detalhe,
)
router.post(
  '/certificados/:id',
  rbac('gestor'),
  certificadoSSRController.atualizar,
)
router.post(
  '/certificados/:id/cancelar',
  rbac('gestor'),
  certificadoSSRController.cancelar,
)
router.post(
  '/certificados/:id/deletar',
  rbac('gestor'),
  certificadoSSRController.deletar,
)
```

Nenhuma das rotas aplica verificação de ownership de evento. Um gestor autenticado pode interagir com **qualquer** certificado do sistema fornecendo o ID correspondente.

**Impacto:** Violação crítica de multi-tenancy na interface SSR.

---

### PDF-03 — `certificadoService.findAll` ignora escopo de evento

**Arquivo:** `src/services/certificadoService.js` e `src/controllers/certificadoController.js`

**Evidência concreta:**

```js
// certificadoController.js
const result = await certificadoService.findAll({ page, perPage })

// certificadoService.js
async findAll({ page = 1, perPage = 10 } = {}) {
  const { count, rows } = await Certificado.findAndCountAll({ offset, limit: perPage })
}
```

O `scopedEvento` injeta `req.query.evento_id`, mas o controller não lê `req.query.evento_id` e o service não aceita parâmetro de filtro. Resultado: todos os certificados são retornados para qualquer usuário autenticado.

---

### PDF-04 — Link de PDF na tela de detalhe admin aponta para rota inexistente

**Arquivo:** `views/admin/certificados/detalhe.hbs`

**Evidência concreta:**

```hbs
<a
  href='/public/certificados/{{certificado.id}}/pdf'
  class='btn btn-outline-primary'
  target='_blank'
>Baixar PDF</a>
```

A rota `/public/certificados/:id/pdf` não existe em `app.js`. Rota correta: `/api/certificados/:id/pdf`.

**Impacto:** Funcionalidade crítica de download de PDF quebrada no painel admin.

---

### PDF-08 — Log de dados sensíveis em produção

**Arquivo:** `src/services/pdfService.js`

**Evidência concreta:**

```js
console.log('PDFService certificado:', certificado)
```

Executa a cada geração de PDF, imprimindo o objeto completo incluindo `valores_dinamicos`, `nome`, dados do `Participante` (e-mail, `nomeCompleto`), dados do `Evento` e do `TiposCertificados`.

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo

| ID     | Achado                                                                                                     | Esforço estimado |
| ------ | ---------------------------------------------------------------------------------------------------------- | ---------------- |
| PDF-01 | Corrigir lógica de `scopedEvento` para rotas de certificados (buscar cert e verificar `evento_id` do cert) | Alto             |
| PDF-02 | Aplicar restrição de escopo nas rotas SSR admin de certificados                                            | Médio            |
| PDF-03 | Passar filtro `evento_id` até `certificadoService.findAll` e aplicar cláusula `where`                      | Médio            |
| PDF-04 | Corrigir URL no `detalhe.hbs` para `/api/certificados/:id/pdf`                                             | Baixo            |
| PDF-05 | Padronizar alias `TiposCertificados` em todo o controller SSR (eliminar referência singular)               | Baixo            |
| PDF-06 | Encapsular geração de código em transação atômica ou usar lock otimista com retry                          | Alto             |
| PDF-07 | Incluir soft-deletados no `count()` ou usar índice único parcial que exclua deletados                      | Médio            |
| PDF-08 | Remover `console.log` de dados do certificado do `pdfService`                                              | Baixo            |
| PDF-11 | Adicionar validação de formato (`CODIGO_CERTIFICADO_REGEX`) na rota `GET /api/validar/:codigo`             | Baixo            |
| PDF-12 | Substituir `certificado.update({ status: 'cancelado' })` direto por `certificadoService.cancel(id)` no SSR | Baixo            |
| PDF-15 | Adicionar verificação de key existente antes do upload ou usar ID do evento no path da key                 | Médio            |
| PDF-22 | Validar que `tipo_certificado_id` pertence ao `evento_id` informado na criação/atualização via SSR         | Médio            |

### Médio Prazo

| ID     | Achado                                                                                     | Esforço estimado |
| ------ | ------------------------------------------------------------------------------------------ | ---------------- |
| PDF-10 | Implementar rate limiting no endpoint `GET /api/certificados/:id/pdf`                      | Baixo            |
| PDF-13 | Extrair lógica de geração de PDF da rota `api.js` para um controller dedicado              | Médio            |
| PDF-16 | Tratar slug vazio na geração de template key R2                                            | Baixo            |
| PDF-19 | Definir comportamento de validação pública de certificados cancelados e implementar filtro | Médio            |
| PDF-23 | Aplicar rate limiting global em endpoints públicos de geração/consulta de certificados     | Médio            |

### Longo Prazo

| ID     | Achado                                                                                    | Esforço estimado |
| ------ | ----------------------------------------------------------------------------------------- | ---------------- |
| PDF-14 | Resolver dependência circular entre `pdfService` e `r2Service` para eliminar lazy require | Alto             |
| PDF-20 | Corrigir dimensões A4 landscape no PDFKit para valores exatos ISO 216                     | Baixo            |
| PDF-21 | Adicionar validação de formato de e-mail em `POST /obter` SSR                             | Baixo            |
| PDF-24 | Incluir `campo_destaque` na lista de atributos do `INCLUDES` SSR                          | Baixo            |

---

## 4. Atualizações Recomendadas no SRS

### PDF-17 — FR-44: Renomear semântica de `url_template_base`

**Situação atual:**

> FR-44: "o campo `url_template_base` do evento é opcional e, quando informado, deve conter uma **URL válida** (ou ser `null`). Esse campo armazena a **key** (caminho) do arquivo de template-base no Cloudflare R2."

**Inconsistência:** O FR-44 exige "URL válida" mas descreve que armazena uma "key" (caminho relativo no R2, ex: `templates/evento/2026/base.jpg`). As palavras "URL válida" e "key/caminho" são contraditórias. A implementação trata o campo como R2 key sem qualquer validação de formato URL.

**Recomendação:** Remover a exigência de "URL válida" e especificar formato de R2 key válido (e.g., não pode ser vazio, não pode conter `..`, máximo de N caracteres).

---

### PDF-09 / PDF-19 — FR-42 / FR-24: Comportamento de PDF e validação para certificados cancelados não especificado

O SRS não define o comportamento esperado para:

1. `GET /api/certificados/:id/pdf` quando o certificado tem `status = 'cancelado'`
2. `GET /api/validar/:codigo` quando o certificado tem `status = 'cancelado'`

Recomenda-se especificar se certificados cancelados devem:

- Ser rejeitados com código HTTP específico (ex. 410 Gone)
- Gerar PDF com marca d'água "CANCELADO"
- Ser retornados como `valido: false` na validação
- Seguir comportamento atual (sem distinção de status)

---

### PDF-22 — Ausência de especificação sobre consistência tipo × evento

O SRS especifica em FR-45 que cada tipo de certificado está vinculado a um evento, e em FR-46 que gestores operam apenas em seus eventos. Contudo, não há FR explícito que exija que `tipo_certificado_id` em um certificado pertença ao mesmo `evento_id` do certificado. Esta regra de integridade referencial de negócio está implícita mas não especificada.

---

## 5. Itens para Validação Humana

### VH-01 — Geração de PDF para certificados cancelados (PDF-09)

**Questão:** O comportamento de geração de PDF para certificados com `status = 'cancelado'` não está definido no SRS. Atualmente, PDFs são gerados normalmente.

**Decisão necessária:** Bloquear geração? Gerar com marca d'água? Manter comportamento atual?

**Impacto da decisão:** Afeta `pdfService`, rota `api.js` e template `obter-lista.hbs`.

---

### VH-02 — Resultado de validação pública para certificados cancelados (PDF-19)

**Questão:** `GET /api/validar/:codigo` e `POST /validar` retornam `valido: true` para certificados cancelados. Não existe FR definindo este comportamento.

**Decisão necessária:** Certificado cancelado deve retornar `{ valido: false }` ou `{ valido: true, status: 'cancelado' }`?

**Impacto da decisão:** Afeta rotas `api.js` e `public.js`, e template `validar-resultado.hbs`.

---

### VH-03 — Rate limiting em endpoints públicos de PDF e validação (PDF-10, PDF-23)

**Questão:** O endpoint `GET /api/certificados/:id/pdf` é CPU-intensivo (PDFKit + 2 chamadas R2) e não tem rate limiting. Existe decisão técnica sobre volume esperado de acessos?

**Contexto:** ADR-008 menciona que "volumes de requisição esperados (eventos acadêmicos) não justificam cache", mas não aborda rate limiting.

---

### VH-04 — Exibição de link de download em `obter-lista.hbs` para certificados não-emitidos (PDF-18)

**Questão:** A lista pública de certificados de um participante exibe o botão "Baixar PDF" para todos os status, incluindo `cancelado` e `pendente`.

**Decisão necessária:** Deve-se ocultar ou desabilitar o link de download para certificados não-emitidos?

---

## 6. Possíveis Iniciativas de Spec (Spec Kit)

### SPEC-PDF-01 — Iniciativa: Política de acesso a certificados cancelados

**Problema transversal:** A ausência de política sobre certificados cancelados afeta múltiplos pontos do sistema:

- Geração de PDF (api.js, pdfService)
- Validação pública (api.js, public.js)
- Interface SSR pública (obter-lista.hbs, validar-resultado.hbs)
- Interface admin (index.hbs — falta botão de download no admin?)

Recomenda-se spec (feature) dedicada para definir o ciclo de vida de certificados cancelados incluindo impacto em PDF e validação pública.

---

### SPEC-PDF-02 — Iniciativa: Redesign de scopedEvento para suportar recursos secundários

**Problema transversal:** O middleware `scopedEvento` foi projetado para operar sobre recursos onde o ID do path é o próprio ID do evento (ex: `/eventos/:id`). Ao ser aplicado em recursos secundários como `/certificados/:id`, a lógica de `req.params.id` como event ID quebra o enforcement multi-tenant.

O middleware precisa ser redesenhado para suportar **lookup intermediário** — buscar o recurso pelo ID e então verificar o `evento_id` do resultado. Isso afeta potencialmente todas as rotas de recursos secundários (certificados, tipos de certificados).

---

### SPEC-PDF-03 — Iniciativa: Estratégia de naming de templates R2

**Problema transversal:** A geração de R2 keys para templates de evento baseada em slug de nome cria risco de colisão silenciosa entre eventos. Uma estratégia baseada em ID de evento ou UUID eliminaria esse risco.

---

## 7. Problemas Sistêmicos Observados

### PS-01 — `scopedEvento` não é adequado como middleware horizontal para recursos secundários

O middleware `scopedEvento` foi implementado com a premissa de que `req.params.id` representa o ID de um evento. Quando aplicado a rotas onde o `:id` representa um recurso secundário (certificado, tipo de certificado), a lógica de verificação falha semanticamente. Este é um padrão recorrente que pode afetar outros domínios que usem o mesmo middleware no futuro.

### PS-02 — Ausência de enforcement de escopo na camada SSR admin

Diferente das rotas API REST (que aplicam `scopedEvento`), as rotas SSR admin dependem exclusivamente do `rbac` para controle de acesso. O `rbac` verifica apenas o **perfil** (admin/gestor/monitor), não o **escopo de evento**. Como resultado, o enforcement de multi-tenancy está ausente em toda a interface SSR para operações em certificados individuais.

### PS-03 — Inconsistência de alias de associação `TiposCertificados` vs `TiposCertificado`

A associação `Certificado.belongsTo(TiposCertificados, { as: 'TiposCertificados' })` usa alias plural. No entanto, referências no código acessam ora `TiposCertificado` (singular), ora `TiposCertificados` (plural). O `pdfService` resolve isso defensivamente com `certificado.TiposCertificado || certificado.TiposCertificados`. O `certificadoSSRController` (detalhe) acessa singular sem fallback, quebrando silenciosamente. Este padrão de inconsistência de alias é transversal ao domínio.

### PS-04 — Ausência de validação de consistência entre `tipo_certificado_id` e `evento_id`

O service `certificadoService.create` valida a existência do tipo e do evento separadamente, mas não verifica se o tipo pertence ao evento. Essa regra de integridade transversal está implícita no SRS mas não enforced em código.

### PS-05 — Geração de código incremental `count()`-based sem proteção a concorrência

A estratégia de geração de código via `count() + 1` sem transação é suscetível a race conditions em ambientes concorrentes. Combinado com a `UNIQUE constraint` global (sem filtro para soft-delete), o sistema pode falhar silenciosamente sob carga ao tentar reutilizar incrementos de registros deletados. Este padrão está centralizado em `certificadoService.create` mas afeta toda a rastreabilidade dos certificados (FR-52).

---

_Auditoria realizada com base em análise estática do código-fonte. Não foram executados testes de penetração, análise dinâmica ou avaliação de infraestrutura de runtime._
