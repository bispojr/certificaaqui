# Auditoria Técnica 07/16 — Consulta Pública de Certificados

**Sistema:** Certifique-me  
**Versão do SRS:** 2.0 (2026-04-30)  
**Data da auditoria:** 2026-05-09 23:30 (BRT)  
**Auditor:** Arquiteto de Software Sênior (GitHub Copilot — Claude Sonnet 4.6)  
**Escopo:** Exclusivamente o domínio de consulta pública de certificados  
**Status:** Concluída

---

## Fontes Analisadas

| Artefato                | Caminho                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| SRS                     | `docs/especificacoes.md`                                                                    |
| Rota pública API        | `src/routes/api.js`                                                                         |
| Rota pública SSR        | `src/routes/public.js`                                                                      |
| Service de certificados | `src/services/certificadoService.js`                                                        |
| Controller REST (admin) | `src/controllers/certificadoController.js`                                                  |
| Controller SSR (admin)  | `src/controllers/certificadoSSRController.js`                                               |
| Model Certificado       | `src/models/certificado.js`                                                                 |
| Model Participante      | `src/models/participante.js`                                                                |
| Views SSR públicas      | `views/certificados/obter-lista.hbs`, `views/certificados/validar-resultado.hbs`            |
| Middlewares             | `src/middlewares/auth.js`, `src/middlewares/validate.js`, `src/middlewares/scopedEvento.js` |
| App principal           | `app.js`                                                                                    |
| Auditoria anterior 13   | `docs/auditorias/07/13-validacao-publica-certificados.md`                                   |
| Auditoria anterior 14   | `docs/auditorias/07/14-download-publico-certificados.md`                                    |
| Auditoria anterior 15   | `docs/auditorias/07/15-rotas-publicas-certificados.md`                                      |

---

## Contexto Arquitetural

O sistema expõe as seguintes rotas públicas (sem autenticação) de consulta de certificados:

**API REST (`src/routes/api.js`, montada em `/api`):**

- `GET /api/certificados?email=...` — lista certificados por e-mail do participante (FR-23, FR-53)
- `GET /api/validar/:codigo` — valida certificado por código único (FR-24)
- `GET /api/certificados/:id/pdf` — gera PDF do certificado por ID interno (FR-42)

**SSR público (`src/routes/public.js`, montada em `/`):**

- `GET /obter` — formulário de busca por e-mail
- `POST /obter` — processa busca por e-mail; renderiza `obter-lista.hbs`
- `GET /validar` — formulário de validação por código
- `POST /validar` — processa código digitado; renderiza `validar-resultado.hbs`
- `GET /validar/:codigo` — valida código diretamente pela URL; renderiza `validar-resultado.hbs`

Nenhuma dessas rotas aplica middleware de autenticação (`auth`, `authSSR`) ou autorização (`rbac`), conforme FR-25.

**Formato do código de certificado (FR-52):** `CODIGO_BASE-YY-TIPO-N`  
Exemplo: `EDC-26-PT-3` (3 letras do evento, 2 dígitos do ano, 2 letras do tipo, contador incremental)

---

## 1. Matriz Consolidada de Achados

| ID         | Descrição                                                                                             | Evidências                                                                                                                                                                                                                                                                                                                                   | Severidade | Tipo | Impacto                                                                                                                                                                                                                                                               | Requisitos Violados                 | Destino Recomendado              |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| **VU-001** | Ausência total de rate limiting em todos os endpoints de consulta pública                             | `src/routes/api.js`: nenhum `rateLimit` aplicado em `GET /api/certificados`, `GET /api/validar/:codigo`, `GET /api/certificados/:id/pdf`. `src/routes/public.js`: nenhum `rateLimit` em `POST /obter`, `POST /validar`, `GET /validar/:codigo`. O pacote `express-rate-limit` só é importado em `src/routes/usuarios.js`.                    | Crítico    | VU   | Permite scraping massivo, brute force de códigos e enumeração irrestrita de e-mails ou IDs de certificados sem qualquer mecanismo de throttle ou bloqueio por IP. MS-4 do SRS identifica a necessidade mas não foi elevada a FR.                                      | MS-4 (sem FR correspondente), NFR-1 | Correção Crítica Imediata        |
| **VU-002** | Certificados cancelados retornam `valido: true` em todos os endpoints de validação                    | `src/routes/api.js` linha ~162: `Certificado.findOne({ where: { codigo } })` sem filtro de `status`. `src/routes/public.js` linhas ~55 e ~90: mesmo padrão. O campo `status` do model é ENUM com valores `'emitido'`, `'pendente'`, `'cancelado'`. Nenhuma das três superfícies filtra por status antes de retornar o resultado.             | Alto       | BR   | Um certificado com `status: 'cancelado'` é apresentado publicamente como válido. Quebra de integridade entre estado interno e resposta pública.                                                                                                                       | FR-24, FR-19                        | Correção Crítica Imediata        |
| **VU-003** | Exposição do e-mail do participante na view SSR de validação pública                                  | `views/certificados/validar-resultado.hbs` linhas 20-21: `<dt>E-mail</dt><dd>{{certificado.Participante.email}}</dd>` — renderizado para qualquer visitante que informe um código de certificado válido, sem autenticação.                                                                                                                   | Alto       | VU   | Qualquer pessoa com acesso a um código de certificado obtém o e-mail do participante. Combinado com VU-004, permite scraping sistemático de e-mails de participantes por varredura de códigos previsíveis. Violação de privacidade.                                   | FR-25, NFR-1                        | Correção Crítica Imediata        |
| **VU-004** | Formato de código de certificado sequencial e previsível permite enumeração sistemática               | FR-52 e `src/services/certificadoService.js` linhas 63-70: código gerado como `${codigo_base}-${ano_2d}-${tipo_codigo}-${count+1}`. Todos os componentes são públicos ou deduzíveis: `codigo_base` visível, `ano` visível, `codigo` do tipo visível no certificado gerado. O contador `N` é sequencial a partir de 1.                        | Alto       | VU   | Um atacante que conheça `codigo_base`, ano e código do tipo pode iterar `N` de 1 a qualquer valor para enumerar todos os certificados emitidos para aquele evento e tipo. O problema é amplificado pela ausência de rate limiting (VU-001).                           | FR-52, NFR-1                        | Backlog — Curto Prazo            |
| **VU-005** | `GET /api/certificados/:id/pdf` permite enumeração sequencial de PDFs por ID interno de banco         | `src/routes/api.js` linha ~46: `router.get('/certificados/:id/pdf', ...)` aceita qualquer inteiro como `:id`. IDs são sequenciais (PK auto-incremento). Sem validação de entidade proprietária, sem rate limiting. A view `obter-lista.hbs` expõe o ID interno nos links: `href='/api/certificados/{{this.id}}/pdf'`.                        | Crítico    | VU   | Um atacante pode iterar `GET /api/certificados/1/pdf`, `2/pdf`, `3/pdf`, etc., obtendo PDFs de todos os certificados do sistema. PDFs contêm nome do participante e dados dinâmicos.                                                                                  | FR-42, NFR-1                        | Correção Crítica Imediata        |
| **VU-006** | `GET /api/validar/:codigo` não valida o formato do código, aceitando strings arbitrárias              | `src/routes/api.js` linhas ~159-168: `const { codigo } = req.params` passado diretamente a `Certificado.findOne({ where: { codigo } })` sem qualquer validação de charset, comprimento ou formato. A rota SSR equivalente `GET /validar/:codigo` em `public.js` aplica `CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i` e retorna HTTP 400. | Alto       | VU   | Strings de comprimento e charset arbitrários chegam ao ORM. Embora o Sequelize mitigue SQL injection via prepared statements, ausência de validação de entrada viola defesa em profundidade (OWASP A03).                                                              | NFR-1, OWASP A03                    | Backlog — Curto Prazo            |
| **VU-007** | `POST /obter` (SSR) e `GET /api/certificados?email=` não validam formato de e-mail                    | `src/routes/public.js` (`POST /obter`): apenas `if (!email)`. `src/routes/api.js` (`GET /api/certificados`): apenas `if (!email)`. Qualquer string não-vazia é encaminhada como critério de busca ao banco.                                                                                                                                  | Alto       | VU   | Strings malformadas como critério de busca. O ORM parametriza a query (sem SQL injection direta), mas a ausência de validação viola defesa em profundidade.                                                                                                           | NFR-1, OWASP A03                    | Backlog — Curto Prazo            |
| **VU-008** | `detalhe: err.message` exposto em respostas HTTP 500 públicas do endpoint de PDF                      | `src/routes/api.js` linhas ~70-73: `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })`. Erros internos do R2 (paths, buckets, endpoints), erros de PDFKit e mensagens de exceção são expostos na resposta pública.                                                                                                  | Alto       | VU   | Vazamento de informações de infraestrutura interna em erros: paths de arquivos R2, nomes de bucket, endpoints de storage, erros de inicialização do PDFKit. Permite reconhecimento da topologia interna (OWASP A05).                                                  | NFR-1, OWASP A05                    | Correção Crítica Imediata        |
| **VA-001** | Toda lógica de busca pública implementada diretamente nas rotas, sem controller nem service           | `src/routes/api.js`: handlers anônimos com `Certificado.findOne`, `Participante.findOne`, `Certificado.findAll` e `pdfService.generateCertificadoPdf` inline. `src/routes/public.js`: idem com includes adicionais. `certificadoService.js` não possui métodos `findByCodigo`, `findByEmail`, `validateByCodigo`.                            | Alto       | VA   | Violação direta de NFR-6 (routes → controllers → services → models). Lógica de negócio duplicada entre SSR e API sem compartilhamento de código. Impossível aplicar regras transversais (rate limit, status filter, DTO) em ponto central sem duplicar a modificação. | NFR-6                               | Backlog — Curto Prazo            |
| **GI-001** | Inconsistência de validação de formato de código entre as três superfícies público                    | SSR `GET /validar/:codigo`: aplica `CODIGO_CERTIFICADO_REGEX`, retorna HTTP 400 se inválido. SSR `POST /validar`: apenas valida string vazia; aceita qualquer charset e comprimento. API `GET /api/validar/:codigo`: sem qualquer validação de formato. Três contratos distintos para o mesmo input.                                         | Alto       | GI   | Superfícies de validação com garantias de segurança diferentes. API e `POST /validar` são exploráveis com inputs que `GET /validar/:codigo` rejeitaria.                                                                                                               | FR-24                               | Backlog — Curto Prazo            |
| **GI-002** | `GET /api/validar/:codigo` retorna objeto Sequelize bruto sem serialização controlada                 | `src/routes/api.js` linha ~167: `return res.json({ valido: true, certificado })`. O objeto retornado contém `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`, `created_at`, `updated_at`, `valores_dinamicos` sem qualquer projeção ou filtro de campos.                                                                  | Médio      | GI   | Vaza estrutura interna do banco (IDs de FK, timestamps de soft-delete, dados dinâmicos do participante) para qualquer consumidor da API pública. Contrato de resposta inconsistente com o SSR que usa `.toJSON()` com includes.                                       | FR-24                               | Backlog — Médio Prazo            |
| **GI-003** | `GET /api/certificados?email=` retorna lista de certificados sem serialização controlada              | `src/routes/api.js` linha ~121: `return res.json({ certificados })`. Array retorna objetos Sequelize brutos com `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`. Sem paginação, sem DTO, sem limite de resultados.                                                                                                       | Alto       | GI   | Expõe IDs internos e metadados de banco. Sem paginação, um participante com muitos certificados retorna todos de uma vez. IDs internos permitem mapeamento cruzado: email → lista de IDs → `/api/certificados/:id/pdf`.                                               | FR-23, FR-53                        | Backlog — Curto Prazo            |
| **GI-004** | `GET /api/validar/:codigo` não inclui associações (Participante, Evento, TiposCertificados)           | `src/routes/api.js` linha ~162: `Certificado.findOne({ where: { codigo } })` sem `include`. SSR `GET /validar/:codigo` e `POST /validar` incluem Participante, Evento e TiposCertificados. Resposta JSON incompleta para integração.                                                                                                         | Médio      | GI   | Inconsistência de contrato: API pública de validação não retorna dados de contexto (participante, evento, tipo) que o SSR retorna. Um consumidor legítimo da API não obtém dados equivalentes à interface web.                                                        | FR-24                               | Backlog — Médio Prazo            |
| **GI-005** | Ausência de controle de paginação em `GET /api/certificados?email=`                                   | `src/routes/api.js`: `Certificado.findAll({ where: { participante_id: participante.id } })` sem `limit`, `offset` ou parâmetros de paginação. Retorna todos os certificados do participante em uma única resposta.                                                                                                                           | Médio      | GI   | Participante com grande volume de certificados retorna payload irrestrito. Potencial vetor de DoS por resposta excessivamente grande.                                                                                                                                 | FR-23, FR-53                        | Backlog — Médio Prazo            |
| **IP-001** | `POST /validar` (SSR) não aplica o `CODIGO_CERTIFICADO_REGEX` disponível na mesma rota                | `src/routes/public.js`: `CODIGO_CERTIFICADO_REGEX` é definido no topo do arquivo e aplicado em `GET /validar/:codigo`, mas `POST /validar` apenas faz `.trim()` e verifica vazio, sem validar o formato.                                                                                                                                     | Médio      | IP   | Implementação parcial da mesma regra de validação dentro do mesmo arquivo. Inconsistência interna na superfície SSR para o mesmo recurso.                                                                                                                             | NFR-1                               | Backlog — Curto Prazo            |
| **IP-002** | View `obter-lista.hbs` exibe botão "Baixar PDF" para certificados cancelados sem distinção visual     | `views/certificados/obter-lista.hbs`: link `/api/certificados/{{this.id}}/pdf` renderizado para todos os status. O helper `eq` está disponível mas não é utilizado para condicionar a exibição do botão de download baseado em `status`.                                                                                                     | Médio      | IP   | Interface pública convida explicitamente o participante a baixar PDF de certificado cancelado.                                                                                                                                                                        | FR-19, FR-43                        | Backlog — Curto Prazo            |
| **IP-003** | A rota `GET /api/certificados/:id/pdf` não verifica o `status` do certificado antes de gerar o PDF    | `src/routes/api.js`: `Certificado.findByPk(id, { include: [...] })` sem cláusula `where: { status: 'emitido' }`. PDF de certificado cancelado ou pendente é gerado normalmente.                                                                                                                                                              | Alto       | BR   | Documento oficial (PDF) emitido para certificados cujo status interno é `cancelado`. Participante ou terceiro pode apresentar PDF de certificado que o sistema considera inválido.                                                                                    | FR-42, FR-19                        | Correção Crítica Imediata        |
| **DT-001** | Duplicação de lógica de busca por código entre `POST /validar` e `GET /validar/:codigo` (SSR)         | `src/routes/public.js`: dois handlers implementam `Certificado.findOne({ where: { codigo }, include: [...] })` de forma duplicada com diferença apenas na validação de formato de input.                                                                                                                                                     | Baixo      | DT   | Duplicação aumenta risco de divergência futura. Manutenção exige modificação em dois pontos.                                                                                                                                                                          | NFR-6                               | Backlog — Longo Prazo            |
| **DT-002** | Duplicação de lógica de busca por código entre API (`GET /api/validar/:codigo`) e SSR (dois handlers) | Lógica idêntica implementada em três lugares distintos nas rotas sem compartilhamento via service.                                                                                                                                                                                                                                           | Médio      | DT   | Violação de NFR-6. Risco de divergência de comportamento entre superfícies.                                                                                                                                                                                           | NFR-6                               | Backlog — Médio Prazo            |
| **AM-001** | FR-24 não define comportamento para certificados com `status: 'cancelado'` na validação pública       | FR-24: retorna `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }`. Não define o comportamento para `status: 'cancelado'`. FR-19 define o campo mas não o relaciona ao resultado de validação pública. Implementação atual: certificados cancelados retornam `valido: true`.                                           | Alto       | AM   | Ambiguidade que resultou no bug VU-002/IP-003. Sem definição explícita, o comportamento para certificados cancelados é implementação-dependente.                                                                                                                      | FR-24, FR-19                        | Atualizações Recomendadas no SRS |
| **AM-002** | FR-25 não define quais campos do certificado/participante podem ser expostos publicamente             | FR-25: "As rotas de consulta pública não devem exigir autenticação." Não define escopo de dados permitidos na resposta. Nenhum requisito restringe ou permite a exposição de e-mail, `valores_dinamicos` ou timestamps internos.                                                                                                             | Médio      | AM   | Ausência de definição criou exposição não intencional de e-mail pessoal na view SSR pública e de IDs internos e metadados via API JSON.                                                                                                                               | FR-25                               | Atualizações Recomendadas no SRS |
| **AM-003** | FR-23 e FR-53 são duplicados sem diferenciação                                                        | FR-23: "rota pública JSON para listar certificados por e-mail (`GET /api/certificados?email=...`)" e FR-53: "rota pública `GET /api/certificados?email=...` que, dado o e-mail de um participante, lista todos os seus certificados." São requisitos com texto e destino idênticos.                                                          | Baixo      | AM   | Duplicação de requisito no SRS sem diferenciação semântica.                                                                                                                                                                                                           | FR-23, FR-53                        | Atualizações Recomendadas no SRS |
| **ID-001** | MS-4 do SRS menciona rate limiting para rotas públicas, mas não há FR correspondente                  | `docs/especificacoes.md` seção Melhorias Sugeridas, MS-4: "Rate limiting nas rotas públicas `/public/validar/:codigo` e `/public/certificados?email=...`." Apenas FR-55 cobre rate limiting e é restrito a `POST /usuarios/login`.                                                                                                           | Baixo      | ID   | A sugestão MS-4 não foi elevada a requisito funcional, tornando a lacuna estruturalmente invisível no backlog.                                                                                                                                                        | —                                   | Atualizações Recomendadas no SRS |
| **VH-001** | Política de exibição de certificados cancelados na listagem pública não está definida no SRS          | FR-23/FR-53: definem a rota mas não especificam se certificados `cancelados` devem ser omitidos. A view `obter-lista.hbs` exibe todos com badge visual diferente para status ≠ `'emitido'`.                                                                                                                                                  | Alto       | VH   | O comportamento intencional depende de decisão de produto. Sem definição, a implementação atual expõe certificados cancelados na listagem pública.                                                                                                                    | FR-23                               | Validação Humana                 |
| **VH-002** | Política de privacidade de dados do participante expostos publicamente não está definida              | O e-mail do participante é exibido na view `validar-resultado.hbs`. `valores_dinamicos` (dados pessoais/acadêmicos) é exposto via API JSON. A política de quais campos podem ser exibidos para o público não autenticado não está documentada.                                                                                               | Médio      | VH   | Sem definição de produto sobre quais campos são intencionalmente públicos, não é possível corrigir a exposição sem risco de conflitar com requisitos implícitos.                                                                                                      | FR-25                               | Validação Humana                 |
| **VH-003** | Comportamento de participantes soft-deletados na consulta pública por e-mail não está definido        | `POST /obter` e `GET /api/certificados?email=`: `Participante.findOne({ where: { email } })` com `paranoid: true` (default). Participante soft-deletado → nenhum certificado retornado, mesmo que os certificados existam.                                                                                                                   | Baixo      | VH   | Se um participante for soft-deletado mas seus certificados permanecerem, a consulta por e-mail não retorna resultados. A política não está definida no SRS.                                                                                                           | FR-23                               | Validação Humana                 |

---

## 2. Correções Críticas Imediatas

### CCI-01 — Ausência de rate limiting em todos os endpoints de consulta pública (VU-001)

**Endpoints afetados:**

- `GET /api/certificados?email=...` (`src/routes/api.js`)
- `GET /api/validar/:codigo` (`src/routes/api.js`)
- `GET /api/certificados/:id/pdf` (`src/routes/api.js`)
- `POST /obter` (`src/routes/public.js`)
- `POST /validar` (`src/routes/public.js`)
- `GET /validar/:codigo` (`src/routes/public.js`)

**Problema:** Nenhum dos endpoints de consulta pública possui rate limiting. O pacote `express-rate-limit` já está disponível no projeto (utilizado em `src/routes/usuarios.js`) mas não é aplicado às rotas públicas de certificados.

**Risco:** Brute force irrestrito de códigos de certificado, enumeração de e-mails, scraping massivo de PDFs, e potencial DoS via geração intensiva de PDFs (PDFKit + duas chamadas R2 por requisição).

---

### CCI-02 — Certificados cancelados retornados como válidos em todos os endpoints (VU-002, IP-003)

**Endpoints afetados:**

- `GET /api/validar/:codigo` — retorna `{ valido: true, certificado }` para certificados cancelados
- `POST /validar` (SSR) — renderiza "Certificado Válido" para certificados cancelados
- `GET /validar/:codigo` (SSR) — idem
- `GET /api/certificados/:id/pdf` — gera PDF de certificado cancelado normalmente

**Problema:** Nas três superfícies de validação e no endpoint de PDF, a query não filtra por `status`. Um certificado com `status: 'cancelado'` é tratado como válido e gera PDF sem qualquer restrição.

**Evidências:**

- `api.js`: `Certificado.findOne({ where: { codigo } })` — sem `status`
- `public.js`: `Certificado.findOne({ where: { codigo }, include: [...] })` — sem `status`
- `api.js`: `Certificado.findByPk(id, { include: [...] })` — sem `status`

**Nota:** O comportamento correto depende da decisão definida em VH-001 (ver Seção 5). Enquanto a política não for definida, este achado permanece como Bug Real com severidade Alto.

---

### CCI-03 — Enumeração de PDFs por ID sequencial interno (VU-005)

**Endpoint afetado:** `GET /api/certificados/:id/pdf`

**Problema:** O endpoint aceita qualquer inteiro como `:id` sem validação de escopo ou propriedade. IDs são PKs auto-incrementais, tornando o espaço completamente enumerável. A view SSR `obter-lista.hbs` expõe os IDs internos nos links de download.

**Risco:** Qualquer usuário pode obter PDFs de todos os certificados do sistema iterando IDs sequencialmente, independente do evento ou participante.

---

### CCI-04 — Exposição de e-mail do participante na validação pública (VU-003)

**Endpoint afetado:** `GET /validar/:codigo` (SSR), `POST /validar` (SSR)

**Problema:** `views/certificados/validar-resultado.hbs` exibe `{{certificado.Participante.email}}` publicamente para qualquer visitante que informe um código de certificado válido.

**Risco:** Combina com VU-004 (códigos previsíveis) para permitir scraping sistemático de e-mails: varredura de códigos via `N=1,2,3,...` → extração de e-mail do participante.

---

### CCI-05 — Exposição de detalhes de erro interno na resposta HTTP 500 do endpoint de PDF (VU-008)

**Endpoint afetado:** `GET /api/certificados/:id/pdf`

**Problema:** `src/routes/api.js`: `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })` — a mensagem de exceção interna é incluída na resposta pública.

**Risco:** Vazamento de paths de arquivos R2, nomes de bucket, endpoints de storage e erros de biblioteca em respostas públicas (OWASP A05).

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo

1. **[VU-001]** Implementar rate limiting nas seis rotas públicas de certificados usando `express-rate-limit` (já disponível no projeto).
2. **[VU-006, GI-001, IP-001]** Centralizar e aplicar uniformemente o `CODIGO_CERTIFICADO_REGEX` nas três superfícies de validação por código.
3. **[VU-007]** Adicionar validação de formato de e-mail (RFC 5321) em `POST /obter` e `GET /api/certificados?email=`.
4. **[GI-003]** Substituir exposição de ID interno por `codigo` nos links de download nas views SSR (`obter-lista.hbs`, `validar-resultado.hbs`).
5. **[VA-001]** Extrair lógica de busca pública por e-mail para `certificadoService.js`, eliminando acesso direto ao model nas rotas.
6. **[IP-002]** Condicionar o botão "Baixar PDF" na view `obter-lista.hbs` ao status `'emitido'` usando o helper `eq` disponível.
7. **[GI-001]** Unificar validação de código entre `POST /validar` e `GET /api/validar/:codigo`.

### Médio Prazo

1. **[GI-002]** Implementar DTO para respostas de `GET /api/validar/:codigo`, projetando apenas campos públicos (sem IDs internos, `deleted_at`, `valores_dinamicos` não sanitizados).
2. **[GI-004]** Padronizar resposta de `GET /api/validar/:codigo` para incluir associações (Participante, Evento, TiposCertificados) equivalentes à resposta SSR.
3. **[GI-005]** Adicionar paginação a `GET /api/certificados?email=`.
4. **[DT-002]** Centralizar lógica de busca por código em `certificadoService.js`, eliminando as três implementações duplicadas nas rotas.
5. **[AM-002]** Definir e documentar a política de campos públicos no SRS, implementar DTO de resposta baseado nela.

### Longo Prazo

1. **[VU-004]** Avaliar a adição de componente não-previsível ao formato do código de certificado para dificultar enumeração sistemática (decisão de produto e arquitetura).
2. **[DT-001]** Consolidar as duas implementações duplicate dentro de `public.js` (`POST /validar` e `GET /validar/:codigo`) em um handler compartilhado.
3. **[VA-001]** Migrar toda a lógica de consulta pública para controllers/services dedicados, alinhando ao padrão arquitetural do restante do sistema.

---

## 4. Atualizações Recomendadas no SRS

### SRS-01 — Elevar MS-4 a FR obrigatório (ID-001)

**Motivação:** A seção "Melhorias Sugeridas" do SRS menciona MS-4 ("Rate limiting nas rotas públicas `/public/validar/:codigo` e `/public/certificados?email=...`"), mas permanece como sugestão sem FR correspondente. A ausência de um FR torna a lacuna estruturalmente invisível no backlog.

**Proposta:** Criar FR específico para rate limiting em rotas públicas de certificados, com thresholds explícitos (ex.: X requisições por minuto por IP).

---

### SRS-02 — Definir comportamento de certificados cancelados na validação pública (AM-001)

**Motivação:** FR-24 define apenas os casos `valido: true` e HTTP 404 `valido: false`. Não especifica o comportamento para certificados com `status: 'cancelado'`. A implementação atual retorna `valido: true` para certificados cancelados, o que pode ser intencional ou um bug, dependendo do requisito.

**Proposta:** Adicionar cláusula em FR-24: "Certificados com `status: 'cancelado'` devem retornar `{ valido: false, mensagem: '...' }` com HTTP 404" OU "devem retornar `{ valido: true, certificado }` com o campo `status` incluído para que o consumidor possa interpretar".

---

### SRS-03 — Definir escopo de dados expostos nas respostas públicas (AM-002)

**Motivação:** FR-25 apenas define que as rotas públicas não requerem autenticação, sem especificar quais campos de certificado, participante e evento podem ser expostos. A ausência de especificação criou exposição não intencional de e-mail pessoal e IDs internos.

**Proposta:** Adicionar sub-requisito em FR-25 ou criar FR específico listando explicitamente os campos permitidos na resposta pública (ex.: `nome`, `codigo`, `status`, `nomeCompleto` do participante, `nome` do evento, `descricao` do tipo — excluindo `email`, `valores_dinamicos`, IDs internos, timestamps).

---

### SRS-04 — Definir comportamento de listagem pública para certificados cancelados (AM-001 / VH-001)

**Motivação:** FR-23/FR-53 definem a rota `GET /api/certificados?email=...` sem especificar se certificados cancelados devem ser incluídos ou filtrados.

**Proposta:** Adicionar cláusula explícita: "Certificados com `status: 'cancelado'` [devem | não devem] ser retornados na listagem pública."

---

### SRS-05 — Eliminar duplicata entre FR-23 e FR-53 (AM-003)

**Motivação:** FR-23 e FR-53 têm texto e destino idênticos (a mesma rota `GET /api/certificados?email=...`), sem qualquer diferenciação semântica.

**Proposta:** Consolidar em um único FR e remover o duplicado.

---

## 5. Itens para Validação Humana

### VH-001 — Política de exibição de certificados cancelados na listagem pública

**Questão:** Certificados com `status: 'cancelado'` devem aparecer na listagem pública `GET /api/certificados?email=` e `POST /obter` (SSR)?

**Contexto:** A view `obter-lista.hbs` exibe todos os certificados com badges visuais distintos (verde para `emitido`, cinza para outros). FR-23/FR-53 não especificam filtro por status.

**Decisão necessária:** Produto.

---

### VH-002 — Política de privacidade dos campos de participante expostos publicamente

**Questão:** Quais campos do participante e do certificado podem ser exibidos a usuários não autenticados na validação pública?

**Contexto:** Atualmente o e-mail do participante é exibido na view SSR de resultado de validação (`validar-resultado.hbs`). A API expõe `valores_dinamicos` e IDs internos.

**Decisão necessária:** Produto + Jurídico (LGPD/privacidade).

---

### VH-003 — Comportamento de participantes soft-deletados na consulta pública por e-mail

**Questão:** Se um participante for soft-deletado (`deleted_at IS NOT NULL`), seus certificados devem ainda ser acessíveis via consulta pública por e-mail?

**Contexto:** Com `paranoid: true` no model `Participante`, a query `Participante.findOne({ where: { email } })` não encontrará o participante soft-deletado, retornando "nenhum participante encontrado" mesmo que os certificados existam.

**Decisão necessária:** Produto + Arquitetura.

---

## 6. Possíveis Iniciativas de Spec (Spec Kit)

### SPEC-01 — Política de Segurança e Privacidade para Consulta Pública de Certificados

**Motivação:** Os achados VU-001, VU-003, VU-004, VU-005, AM-001, AM-002 e VH-001/VH-002 revelam ausência transversal de uma política formal de segurança e privacidade para as rotas públicas. Todos os achados críticos derivam da mesma lacuna: o SRS não define os limites de exposição das rotas públicas.

**Escopo sugerido:**

- Definição formal de campos públicos vs. privados na resposta de consulta/validação
- Política de rate limiting para endpoints públicos (thresholds, janelas, comportamento de bloqueio)
- Comportamento para certificados cancelados, pendentes e restaurados
- Política de exibição de e-mail e dados pessoais do participante
- Mecanismo de proteção contra enumeração (código e ID)

---

### SPEC-02 — Redesign da Camada de Consulta Pública (Separação de Responsabilidades)

**Motivação:** Os achados VA-001, DT-001, DT-002, GI-001, GI-002, GI-003, GI-004 revelam que toda a lógica de consulta pública está inline nas rotas, sem controller, sem service, com múltiplas duplicações e contratos inconsistentes entre API e SSR.

**Escopo sugerido:**

- Criação de `certificadoPublicoService.js` com métodos `findByCodigo`, `findByEmail`, `validate`
- Criação de controller público dedicado
- DTO padronizado para respostas públicas
- Validação centralizada de inputs (email, código)
- Paginação padronizada

---

## 7. Problemas Sistêmicos Observados

### 7.1 Ausência de camada de proteção centralizada para rotas públicas

O sistema implementa rate limiting apenas para `POST /usuarios/login` (FR-55). As seis rotas de consulta pública de certificados não possuem qualquer mecanismo de throttle. O padrão de proteção aplicado à autenticação não foi estendido às rotas públicas de maior volume de acesso.

**Padrão recorrente:** Rate limiting pontual (login) vs. ausência total (todas as rotas públicas de certificados).

---

### 7.2 Lógica de negócio duplicada em três camadas de rota distintas

A mesma lógica de "buscar certificado por código" está implementada em:

1. `src/routes/api.js` — `GET /api/validar/:codigo` (sem includes, sem validação de formato)
2. `src/routes/public.js` — `GET /validar/:codigo` (com includes, com validação de formato via REGEX)
3. `src/routes/public.js` — `POST /validar` (com includes, sem validação de formato)

Cada implementação tem contrato diferente. O mesmo padrão ocorre para busca por e-mail (API e SSR). Violação transversal de NFR-6.

---

### 7.3 Inconsistência estrutural entre API JSON e SSR pública

As duas superfícies públicas do sistema expõem o mesmo domínio com contratos radicalmente diferentes:

- Validação de formato de código: presente no SSR, ausente na API
- Includes de associações: presentes no SSR, ausentes na API
- Serialização da resposta: `.toJSON()` no SSR, objeto Sequelize bruto na API
- Filtro de status: ausente em ambas

O consumidor da API obtém dados estruturalmente diferentes (e potencialmente mais arriscados) do que o usuário do SSR.

---

### 7.4 Exposição de identificadores internos como vetor de enumeração

O sistema expõe dois identificadores distintos em rotas públicas que permitem enumeração:

1. **ID sequencial de banco** (`/api/certificados/:id/pdf`) — enumeração direta por inteiro
2. **Código previsível** (`CODIGO_BASE-YY-TIPO-N`) — enumeração por componentes deduzíveis

Ambos estão expostos sem rate limiting (VU-001) e sem qualquer mecanismo de proteção contra varredura sistemática. O código sequencial `N` é incrementado monotonicamente por evento+tipo, tornando o espaço completamente enumerável para eventos conhecidos.

---

### 7.5 Fragilidade de multi-tenancy na consulta pública

O modelo de dados possui isolamento por `evento_id` nas rotas autenticadas (via `scopedEvento`). No entanto, as rotas públicas consultam certificados apenas por `participante_id` (busca por e-mail) ou por `codigo` (validação), sem qualquer filtro de `evento_id`. Um participante inscrito em múltiplos eventos tem todos os seus certificados retornados de uma vez, sem distinção de contexto de evento. Isso não é necessariamente incorreto (o participante pode querer ver todos os seus certificados), mas a ausência de filtro opcional por evento pode expor dados de eventos que o participante preferiria manter separados.

**Validação Humana necessária:** O comportamento multi-evento na consulta pública é intencional?

---

_Auditoria realizada com base exclusivamente em evidências de código-fonte e documentação. Nenhuma suposição foi elevada a achado sem evidência concreta. Itens com dúvida foram classificados como Validação Humana (VH)._
