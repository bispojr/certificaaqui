# T05 — Triagem Consolidada: Domínios de Acesso Público

**Sistema:** Certifique-me  
**Versão do SRS:** 2.0 (2026-04-30)  
**Data da triagem:** 2026-05-09 23:41 (BRT)  
**Auditor:** Arquiteto de Software Sênior (GitHub Copilot — Claude Sonnet 4.6)  
**Escopo:** Consolidação de achados dos domínios públicos (Auditorias 07/13, 07/14, 07/15, 07/16)  
**Status:** Concluída

---

## Auditorias consolidadas

| Auditoria | Domínio | Arquivo |
|-----------|---------|---------|
| 07/13 | Validação pública de certificados por código | `docs/auditorias/07/13-validacao-publica-certificados.md` |
| 07/14 | Download público de certificados (PDF) | `docs/auditorias/07/14-download-publico-certificados.md` |
| 07/15 | Rotas públicas de certificados (API e SSR) | `docs/auditorias/07/15-rotas-publicas-certificados.md` |
| 07/16 | Consulta pública de certificados | `docs/auditorias/07/16-consulta-publica.md` |

---

## 1. Matriz Consolidada de Achados

Cada achado recebe um ID único de triagem (`T05-XXX`). Quando o achado repete um item de auditoria individual, a coluna "Origem" rastreia para a(s) auditoria(s) de origem.

| ID | Domínio(s) Afetado(s) | Descrição | Evidências | Severidade | Tipo | Impacto | Requisitos Violados | Origem | Destino Recomendado |
|----|----------------------|-----------|-----------|------------|------|---------|---------------------|--------|---------------------|
| **T05-VU-001** | Validação, Download, Rotas Públicas, Consulta | Ausência total de rate limiting em todas as rotas públicas de certificados — API e SSR | `src/routes/api.js` e `src/routes/public.js`: nenhum middleware `rateLimit` em nenhum endpoint público de certificados. `express-rate-limit` está instalado e ativo apenas em `src/routes/usuarios.js` (POST /login). MS-4 do SRS identifica a necessidade mas não foi elevada a FR. | Crítico | VU | Permite brute force irrestrito de códigos, scraping massivo por e-mail, enumeração de IDs de PDF e potencial DoS via geração intensiva de PDFs (PDFKit + 2 chamadas R2 por request) sem qualquer mecanismo de throttle ou bloqueio por IP. | MS-4 (sem FR), NFR-1 | 13/VU-001, 14/VU-002, 15/A-01, 16/VU-001 | **Correção Crítica Imediata** |
| **T05-VU-002** | Validação, Download, Consulta | Certificados cancelados retornam `valido: true` e geram PDF sem restrição em todos os endpoints | `api.js` (`GET /api/validar/:codigo`): `Certificado.findOne({ where: { codigo } })` — sem filtro de `status`. `public.js` (`POST /validar`, `GET /validar/:codigo`): mesmo padrão. `api.js` (`GET /api/certificados/:id/pdf`): `Certificado.findByPk(id, { include: [...] })` — sem filtro de `status`. Model `certificado.js`: `status: ENUM('emitido', 'pendente', 'cancelado')`. | Alto | BR | Certificados cancelados são apresentados ao público como válidos e autênticos em todas as três superfícies de validação. O mesmo certificado cancelado também gera PDF sem restrição, produzindo documento oficial inconsistente com o estado interno. Quebra de integridade entre estado persistido e artefato público exposto. | FR-24, FR-42, FR-19 | 13/BR-001, 14/BR-001, 15/A-05, 15/A-22, 16/VU-002, 16/IP-003 | **Correção Crítica Imediata** |
| **T05-VU-003** | Download, Rotas Públicas, Consulta | Enumeração de PDFs por ID sequencial interno sem autenticação ou controle de escopo | `src/routes/api.js` (linha ~46): `router.get('/certificados/:id/pdf', ...)` aceita qualquer inteiro como `:id`. IDs são PKs auto-incrementais (sequenciais). Views `obter-lista.hbs` e `validar-resultado.hbs` expõem o ID interno nos links: `href='/api/certificados/{{this.id}}/pdf'`. Nenhum rate limiting, nenhuma validação de propriedade. | Crítico | VU | Qualquer pessoa pode iterar `GET /api/certificados/1/pdf`, `2/pdf`, `3/pdf`, etc., obtendo PDFs de todos os certificados do sistema. PDFs contêm nome do participante, evento e dados dinâmicos. O espaço de IDs é totalmente enumerável e determinístico. Agravado pela ausência de T05-VU-001. | FR-42, NFR-1, OWASP A01 | 13/VU-005, 14/VU-001, 15/A-02, 15/A-15, 16/VU-005 | **Correção Crítica Imediata** |
| **T05-VU-004** | Validação, Consulta | Código de certificado com formato sequencial e previsível (`CODIGO_BASE-YY-TIPO-N`) permite enumeração sistemática | FR-52: formato `CODIGO_BASE-YY-TIPO-N`. `certificadoService.js` (linhas 63–70): código gerado como `${codigo_base}-${ano_2d}-${tipo_codigo}-${count+1}`. Todos os componentes são públicos ou deduzíveis: `codigo_base` visível na interface, `ano` inferível, `codigo_tipo` presente no certificado emitido. Contador `N` é sequencial a partir de 1 por evento+tipo. | Alto | VU | Atacante que conheça `codigo_base`, ano e código do tipo pode iterar `N=1,2,3,...` para enumerar todos os certificados emitidos para aquele evento e tipo. Combinado com T05-VU-001 (sem rate limiting), o espaço é varrível sem obstáculo. Permite extrair e-mails de todos os participantes do evento via T05-VU-005. | FR-52, NFR-1 | 13/VU-004, 16/VU-004 | Backlog Arquitetural — Curto Prazo |
| **T05-VU-005** | Validação, Rotas Públicas, Consulta | Exposição pública do e-mail do participante na view SSR de resultado de validação | `views/certificados/validar-resultado.hbs` (linhas 20–21): `<dt>E-mail</dt><dd>{{certificado.Participante.email}}</dd>` — renderizado para qualquer visitante que informe um código de certificado válido, sem autenticação. | Alto | VU | Qualquer pessoa com acesso a um código válido obtém o e-mail pessoal do participante. Combinado com T05-VU-004 (códigos previsíveis) e T05-VU-001 (sem rate limiting), permite scraping sistemático de e-mails: varrer `N=1,2,...` → obter e-mail de cada participante. Do e-mail, `POST /obter` retorna todos os certificados desse participante. | FR-25, NFR-1, LGPD | 13/VU-003, 15/A-16, 16/VU-003 | **Correção Crítica Imediata** |
| **T05-VU-006** | Validação, Rotas Públicas, Consulta | `GET /api/validar/:codigo` na API não valida formato do código; inconsistência com SSR que valida via REGEX | `src/routes/api.js`: `const { codigo } = req.params` passado diretamente a `Certificado.findOne({ where: { codigo } })` sem qualquer validação de charset, comprimento ou formato. `src/routes/public.js` (`GET /validar/:codigo`): aplica `CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i` e retorna HTTP 400 se inválido. `POST /validar`: apenas valida string vazia. | Alto | VU | Strings de charset e comprimento arbitrários chegam ao ORM via API. Embora Sequelize mitigue SQL injection via prepared statements, a ausência de validação viola defesa em profundidade (OWASP A03). Mesmo input rejeitado pelo SSR é aceito pela API. | NFR-1, OWASP A03, FR-24 | 13/VU-002, 15/A-20, 16/VU-006 | Backlog Arquitetural — Curto Prazo |
| **T05-VU-007** | Rotas Públicas, Consulta | `POST /obter` (SSR) e `GET /api/certificados?email=` não validam formato de e-mail | `src/routes/public.js` (`POST /obter`): apenas `if (!email)`. `src/routes/api.js` (`GET /api/certificados`): apenas `if (!email)`. Qualquer string não-vazia é aceita e encaminhada como critério de busca ao banco via `Participante.findOne({ where: { email } })`. | Alto | VU | Strings malformadas como critério de busca. ORM parametriza a query (sem SQL injection), mas ausência de validação viola defesa em profundidade. | NFR-1, OWASP A03 | 15/A-09, 15/A-10, 16/VU-007 | Backlog Arquitetural — Curto Prazo |
| **T05-VU-008** | Download, Rotas Públicas, Consulta | `detalhe: err.message` exposto em respostas HTTP 500 públicas no endpoint de geração de PDF | `src/routes/api.js` (linhas ~70–73): `res.status(500).json({ error: 'Erro ao gerar PDF', detalhe: err.message })`. Erros internos do R2 (paths, buckets, endpoints), erros de PDFKit e mensagens de exceção são incluídos na resposta pública. | Alto | VU | Vazamento de paths de arquivos R2, nomes de bucket, endpoints de storage, erros de biblioteca. Permite reconhecimento da topologia interna (OWASP A05 — Security Misconfiguration). | NFR-1, OWASP A05 | 14/VU-003, 15/A-26, 16/VU-008 | **Correção Crítica Imediata** |
| **T05-VU-009** | Download | `console.log('PDFService certificado:', certificado)` expõe PII completo do certificado em logs de produção | `src/services/pdfService.js` (linha 14): `console.log('PDFService certificado:', certificado)` — loga o objeto completo incluindo `valores_dinamicos` (dados pessoais/acadêmicos do participante), `nome`, `codigo` e associações antes de qualquer validação. | Alto | VU | PII e dados sensíveis gravados em stdout/logs de produção a cada geração de PDF, inclusive para requests inválidos. OWASP A09 (Security Logging and Monitoring Failures). | NFR-1, OWASP A09 | 14/VU-004 | **Correção Crítica Imediata** |
| **T05-GI-001** | Validação, Rotas Públicas, Consulta | `GET /api/validar/:codigo` retorna objeto Sequelize bruto sem serialização controlada, expondo IDs internos e metadados | `src/routes/api.js` (linha ~167): `return res.json({ valido: true, certificado })`. O objeto contém `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`, `created_at`, `updated_at`, `valores_dinamicos` sem qualquer projeção ou filtro de campos. SSR utiliza `.toJSON()` com associações explícitas. | Alto | GI | Vaza estrutura interna do banco (IDs de FK, timestamp de soft-delete, dados dinâmicos do participante) para qualquer consumidor da API pública. IDs internos permitem mapeamento cruzado: `evento_id` → outros endpoints admin. | FR-24, NFR-1, OWASP A01 | 13/GI-002, 15/A-07, 16/GI-002 | Backlog Arquitetural — Curto Prazo |
| **T05-GI-002** | Rotas Públicas, Consulta | `GET /api/certificados?email=` retorna lista de certificados sem serialização controlada e sem paginação | `src/routes/api.js` (linha ~121): `return res.json({ certificados })`. Array retorna objetos Sequelize brutos com `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`. Sem `limit`, sem `offset`, sem DTO. | Alto | GI | Expõe IDs internos e metadados de banco. Sem paginação, participante com muitos certificados retorna payload irrestrito. IDs internos combinados com T05-VU-003 permitem scraping direcionado: `email → lista de IDs → PDFs`. | FR-23, FR-53, NFR-1, OWASP A01 | 14 (contexto), 15/A-08, 15/A-25, 16/GI-003, 16/GI-005 | Backlog Arquitetural — Curto Prazo |
| **T05-GI-003** | Validação, Rotas Públicas | `GET /api/validar/:codigo` não inclui associações (Participante, Evento, TiposCertificados), enquanto SSR inclui | `src/routes/api.js` (linha ~162): `Certificado.findOne({ where: { codigo } })` — sem `include`. `src/routes/public.js` (`GET /validar/:codigo` e `POST /validar`): incluem Participante, Evento e TiposCertificados. | Médio | GI | Resposta JSON da API pública de validação é incompleta para um consumidor legítimo que precise verificar autenticidade e obter dados contextuais. Inconsistência de contrato: mesma operação retorna dados diferentes dependendo da superfície. | FR-24 | 13/GI-003, 15/A-19, 16/GI-004 | Backlog Arquitetural — Médio Prazo |
| **T05-IP-001** | Validação, Rotas Públicas, Consulta | `POST /validar` (SSR) não aplica `CODIGO_CERTIFICADO_REGEX` definido no mesmo arquivo | `src/routes/public.js`: `CODIGO_CERTIFICADO_REGEX` definido no topo e aplicado em `GET /validar/:codigo`, mas `POST /validar` apenas faz `.trim()` e verifica vazio — sem validação de formato. Mesma rota, mesmo arquivo, regra aplicada em um handler mas ausente no outro. | Médio | IP | Inconsistência interna na superfície SSR. O formulário de validação aceita via POST strings que seriam rejeitadas via GET pelo mesmo sistema. | NFR-1, FR-24 | 13/IP-001, 15/A-12, 16/IP-001 | Backlog Arquitetural — Curto Prazo |
| **T05-IP-002** | Download, Rotas Públicas, Consulta | Views públicas exibem botão "Baixar PDF" para certificados cancelados sem distinção condicional | `views/certificados/obter-lista.hbs`: link `/api/certificados/{{this.id}}/pdf` renderizado para todos os status sem filtro condicional. Helper `eq` disponível em `hbs-helpers.js` mas não utilizado para condicionar exibição por status. `views/certificados/validar-resultado.hbs`: idem com botão de download sempre visível. | Médio | IP | Interface pública convida explicitamente o participante a baixar PDF de certificado cancelado, comprometendo a percepção de integridade. O backend gera o PDF sem restrição (T05-VU-002). | FR-19, FR-43 | 14/GI-001, 16/IP-002 | Backlog Arquitetural — Curto Prazo |
| **T05-BR-001** | Download | Link de download no painel admin aponta para rota inexistente (`/public/certificados/:id/pdf`) | `views/admin/certificados/detalhe.hbs` (linha 5): `href="/public/certificados/{{certificado.id}}/pdf"`. Nenhum router registrado em `app.js` corresponde ao path `/public/certificados/*`. A rota correta é `/api/certificados/:id/pdf` via `app.use('/api', apiRouter)`. | Alto | BR | Botão "Baixar PDF" no painel administrativo (detalhe do certificado) resulta em HTTP 404. Funcionalidade de download é completamente inoperante para usuários autenticados (admin, gestor, monitor) no fluxo SSR admin. | FR-42 | 14/BR-003 | **Correção Crítica Imediata** |
| **T05-VA-001** | Validação, Download, Rotas Públicas, Consulta | Toda a lógica de busca pública implementada diretamente nas rotas — sem controller nem service | `src/routes/api.js`: handlers anônimos com `Certificado.findOne`, `Participante.findOne`, `Certificado.findAll` e `pdfService.generateCertificadoPdf` inline. `src/routes/public.js`: idem. `certificadoService.js` não possui métodos `findByCodigo`, `findByEmail`, `validateByCodigo`. | Alto | VA | Violação direta de NFR-6 (routes → controllers → services → models). Lógica duplicada sem compartilhamento. Impossível aplicar regras transversais (rate limit, filtro de status, DTO) em ponto central sem duplicar a modificação em múltiplos handlers. A divergência de comportamento entre superfícies (T05-VU-006, T05-GI-003) é consequência direta. | NFR-6 | 13/VA-001, 13/DT-001, 14/VA-001, 15/A-18, 15/A-21, 15/A-24, 16/VA-001 | Backlog Arquitetural — Curto Prazo |
| **T05-DT-001** | Validação, Rotas Públicas, Consulta | Lógica de "buscar certificado por código" duplicada em três handlers distintos com contratos diferentes | `src/routes/api.js` (`GET /api/validar/:codigo`): sem includes, sem validação de formato. `src/routes/public.js` (`GET /validar/:codigo`): com includes, com REGEX. `src/routes/public.js` (`POST /validar`): com includes, sem REGEX. Três implementações independentes da mesma operação de negócio. | Médio | DT | Duplicação triplica o custo de qualquer mudança de regra de negócio (ex: filtrar por status). A divergência de contratos (T05-GI-003, T05-IP-001) é consequência estrutural dessa triplicação. | NFR-6 | 13/DT-001, 15/A-17, 15/A-18, 16/DT-001, 16/DT-002 | Backlog Arquitetural — Médio Prazo |
| **T05-DT-002** | Download | Anti-pattern `new Promise(async (resolve, reject))` em `pdfService.generateCertificadoPdf` | `src/services/pdfService.js` (linha 13): `return new Promise(async (resolve, reject) => {`. Uso de `async` dentro de `new Promise` é anti-pattern reconhecido: erros assíncronos ocorridos após o primeiro `await` podem não ser capturados pelo `reject`. | Médio | DT | Possibilidade de unhandled promise rejection silenciosa em determinados pontos do fluxo async. Dificulta rastreamento de erros e mocking em testes isolados. | — | 14/DT-001 | Backlog Arquitetural — Médio Prazo |
| **T05-DT-003** | Download | `require('./r2Service')` lazy inline para "evitar dependência circular" dentro de `pdfService` | `src/services/pdfService.js` (linhas 11–12): `const r2Service = require('./r2Service')` dentro do corpo da função async, com comentário explicativo. A dependência circular não é resolvida arquiteturalmente. | Baixo | DT | Dependência circular latente entre `pdfService` e `r2Service`. O require inline impede detecção estática de erros de import e dificulta mocking em testes. | NFR-6 | 14/DT-002 | Backlog Arquitetural — Longo Prazo |
| **T05-GI-004** | Download | `Content-Disposition: inline` e ausência de `Cache-Control` e `X-Content-Type-Options` na resposta de PDF | `src/routes/api.js` (linhas 63–68): apenas `Content-Type: application/pdf` e `Content-Disposition: inline; filename=certificado-${id}.pdf` definidos. Sem headers de cache (`Cache-Control`, `Pragma`) ou de segurança. | Médio | GI | Comportamento de cache indefinido — navegadores e proxies podem cachear o PDF. `inline` exibe no navegador e expõe o conteúdo a extensões. O `filename` expõe o ID interno no nome do arquivo baixado (confirmando o PK ao usuário). | FR-42 | 14/GI-002, 14/GI-003 | Backlog Arquitetural — Médio Prazo |
| **T05-AM-001** | Validação, Download, Consulta | FR-24 não define comportamento de validação pública para certificados `cancelado` e `pendente` | FR-24: retorna `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }` — sem menção ao campo `status`. FR-19 define o ENUM de status mas não o relaciona ao resultado de validação pública. Implementação atual: todos os status retornam `valido: true`. | Alto | AM | Ambiguidade que gerou diretamente T05-VU-002 (BR). Sem definição explícita, o comportamento para certificados cancelados ou pendentes é implementação-dependente. | FR-24, FR-19, FR-42 | 13/AM-001, 14/AM-001, 15/A-03, 15/A-04, 16/AM-001 | **Atualizações Recomendadas no SRS** |
| **T05-AM-002** | Validação, Rotas Públicas, Consulta | FR-25 não define quais campos do certificado/participante podem ser expostos publicamente | FR-25: "As rotas de consulta pública não devem exigir autenticação." Não define escopo de dados permitidos. Nenhum FR restringe ou autoriza a exposição de e-mail, `valores_dinamicos`, timestamps internos ou IDs de FK. | Médio | AM | Ausência de definição gerou exposição não intencional de e-mail pessoal (T05-VU-005) e de IDs internos/metadados de banco (T05-GI-001, T05-GI-002). Sem definição formal, não é possível determinar se a exposição atual é bug ou feature. | FR-25 | 13/AM-002, 15/A-06, 16/AM-002 | **Atualizações Recomendadas no SRS** |
| **T05-AM-003** | Consulta | FR-23 e FR-53 são requisitos duplicados sem diferenciação semântica | FR-23: "rota pública JSON para listar certificados por e-mail (`GET /api/certificados?email=...`)". FR-53: "rota pública `GET /api/certificados?email=...` que, dado o e-mail de um participante, lista todos os seus certificados." Texto e destino idênticos. | Baixo | AM | Duplicação de requisito no SRS. Dificulta rastreabilidade e geração de cobertura de testes. | FR-23, FR-53 | 16/AM-003 | **Atualizações Recomendadas no SRS** |
| **T05-ID-001** | Validação, Consulta | MS-4 do SRS menciona rate limiting para rotas públicas, mas permanece como sugestão sem FR correspondente | `docs/especificacoes.md` seção Melhorias Sugeridas, MS-4: "Rate limiting nas rotas públicas `/public/validar/:codigo` e `/public/certificados?email=...`." FR-55 cobre apenas `POST /usuarios/login`. Nenhum FR cobre rate limiting nas rotas de certificados. | Baixo | ID | A lacuna de rate limiting (T05-VU-001) é estruturalmente invisível no backlog por ausência de FR correspondente. | — | 13/ID-001, 16/ID-001 | **Atualizações Recomendadas no SRS** |
| **T05-VH-001** | Validação, Consulta | Política de exibição de certificados cancelados na listagem pública não está definida no SRS | FR-23/FR-53 definem a rota mas não especificam se certificados `cancelados` devem ser omitidos. View `obter-lista.hbs` exibe todos com badge visual distinto para status ≠ `emitido`. | Alto | VH | Comportamento intencional depende de decisão de produto. Sem definição, implementação atual expõe certificados cancelados à listagem pública. | FR-23 | 15/VH-01, 16/VH-001 | **Validação Humana** |
| **T05-VH-002** | Validação, Download, Consulta | Comportamento de certificados `pendente` na validação pública e no download aguarda definição explícita | FR-19 define `status: 'pendente'`. FR-24 e FR-42 não definem comportamento para esse status. Certificados pendentes possuem `codigo` gerado (FR-52) e retornam `valido: true` / geram PDF normalmente na implementação atual. | Médio | VH | Política de acesso ao conteúdo de certificados pendentes é indeterminada. | FR-24, FR-42, FR-19 | 13/VH-003, 14/BR-002, 14/VH-002, 15/A-04 | **Validação Humana** |
| **T05-VH-003** | Validação, Download | Comportamento de certificados restaurados após soft-delete na validação pública e no download não está definido | FR-22: "a remoção de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados." Após restauração, `certificado.status` permanece como estava (ex: `cancelado`). Nenhum FR define o comportamento esperado na validação pública após restauração. | Médio | VH | Se um certificado cancelado for restaurado, a validação pública continua retornando `valido: true` (sem filtro de status) ou `valido: false` (se filtro for implementado). Comportamento esperado não definido. | FR-22, FR-24, FR-42 | 13/VH-001, 14/AM-002 | **Validação Humana** |
| **T05-VH-004** | Validação, Consulta | Política de privacidade dos dados do participante expostos publicamente não está definida | O e-mail do participante é exibido em `validar-resultado.hbs`. `valores_dinamicos` (dados pessoais/acadêmicos) é exposto via API JSON sem projeção. FR-25 não especifica quais campos de dados pessoais podem ser expostos publicamente. | Médio | VH | Sem definição de produto e jurídico (LGPD), não é possível determinar conformidade ou corrigir exposições sem risco de conflitar com requisitos implícitos. | FR-25, LGPD | 13/VH-002, 15/VH-04, 15/VH-05, 16/VH-002 | **Validação Humana** |
| **T05-VH-005** | Consulta | Comportamento de participantes soft-deletados na consulta pública por e-mail não está definido | `Participante.findOne({ where: { email } })` com `paranoid: true` (padrão): participante soft-deletado não é encontrado, mesmo que seus certificados existam. Política não definida no SRS. | Baixo | VH | Participante soft-deletado tem seus certificados inacessíveis via consulta pública por e-mail, mesmo que os certificados não tenham sido excluídos. | FR-23 | 15/VH-03, 16/VH-003 | **Validação Humana** |
| **T05-VH-006** | Download | Política de cache de PDFs gerados sob demanda (HTTP Cache-Control) não está definida | SRS não menciona cache de PDFs, TTL ou invalidação. Geração sob demanda sem `Cache-Control: no-store` pode resultar em proxies cacheando PDF de certificado cancelado após o cancelamento. | Médio | VH | Impacto depende da topologia de infraestrutura (proxy reverso, CDN). Confirmação requerida sobre configuração de cache no ambiente de produção. | FR-42 | 14/VH-001, 14/VH-003 | **Validação Humana** |

---

## 2. Problemas Sistêmicos Transversais

### PST-01 — Ausência estrutural de proteção nas rotas públicas (Rate Limiting)

**Domínios afetados:** Todos (validação, download, rotas públicas, consulta)

A proteção via rate limiting está implementada exclusivamente no endpoint de login (`POST /usuarios/login`, FR-55). Todas as seis rotas públicas de certificados operam sem qualquer throttle. O pacote `express-rate-limit` está instalado e funcional — a ausência é lacuna de requisito, não de capacidade técnica.

MS-4 do SRS identifica o problema como sugestão há pelo menos desde a versão 2.0, mas não existe FR correspondente. O achado T05-VU-001 é transversal a todos os quatro domínios públicos e potencializa todos os outros riscos de enumeração e scraping.

---

### PST-02 — Cadeia de Enumeração por Encadeamento de Endpoints Públicos

**Domínios afetados:** Validação, Rotas Públicas, Consulta

O sistema expõe dois vetores de enumeração independentes que se interligam:

**Vetor 1 — Por código previsível:**
```
código (previsível: CODIGO_BASE-YY-TIPO-N, incremental)
  → GET /api/validar/:codigo / POST /validar / GET /validar/:codigo
      → e-mail do participante exposto na view SSR (T05-VU-005)
          → POST /obter / GET /api/certificados?email=
              → todos os certificados do participante (com IDs internos)
                  → GET /api/certificados/:id/pdf (por ID sequencial)
```

**Vetor 2 — Por ID sequencial:**
```
id=1, id=2, id=3, ...
  → GET /api/certificados/:id/pdf
      → PDF com nome do participante e dados do evento
```

**Vetor 3 — Encadeamento completo:**
```
email (qualquer string)
  → GET /api/certificados?email= / POST /obter
      → lista de certificados com IDs internos
          → GET /api/certificados/:id/pdf (por ID sequencial)
              → PDF com dados completos
```

Sem T05-VU-001 (rate limiting), qualquer dos três vetores permite varredura irrestrita, ilimitada e não autenticada de todo o catálogo de certificados do sistema.

---

### PST-03 — Inconsistência Sistêmica entre API JSON e SSR Pública

**Domínios afetados:** Validação, Rotas Públicas, Consulta

As duas superfícies públicas do sistema expõem o mesmo domínio com contratos radicalmente diferentes:

| Comportamento | API REST | SSR |
|--------------|----------|-----|
| Validação de formato do código | Ausente | Presente (`GET /validar/:codigo`) |
| Filtro de status na validação | Ausente | Ausente |
| Include de associações na validação | Ausente | Presente |
| Validação de formato de e-mail | Ausente | Ausente |
| Serialização de resposta | Objeto Sequelize bruto | `.toJSON()` + includes |
| Rate limiting | Ausente | Ausente |
| Exposição de IDs internos | Presente | Presente (via links HTML) |

A inconsistência é estrutural e deriva diretamente de T05-VA-001: sem service layer compartilhado, cada handler reinventou o contrato de forma independente.

---

### PST-04 — Lógica Duplicada sem Service Layer em Todos os Endpoints Públicos

**Domínios afetados:** Todos

A totalidade da lógica de acesso público (busca por código, busca por e-mail, geração de PDF) está implementada inline nas rotas (`api.js` e `public.js`), sem controllers nem services intermediários. O `certificadoService.js` não possui nenhum método orientado a consulta pública (`findByCodigo`, `findByEmail`, `validateByCodigo`).

A mesma operação de "buscar certificado por código" está implementada três vezes com contratos distintos (T05-DT-001). A divergência de comportamento entre as superfícies (T05-VU-006, T05-GI-003, T05-IP-001) é consequência estrutural dessa duplicação.

---

### PST-05 — Ausência de Governança de Dados em Superficie Pública

**Domínios afetados:** Validação, Rotas Públicas, Consulta

Não existe DTO, projeção de campos ou política formal de quais dados podem ser expostos nas rotas públicas:
- A API retorna objetos Sequelize brutos com `deleted_at`, `participante_id`, `evento_id`, `tipo_certificado_id` (T05-GI-001, T05-GI-002)
- A view SSR expõe o e-mail pessoal do participante sem base em FR explícito (T05-VU-005)
- O `Content-Disposition` do PDF expõe o ID interno do banco no nome do arquivo (T05-GI-004)

FR-25 ("as rotas de consulta pública não devem exigir autenticação") é o único FR sobre política de acesso público — não define o que pode ser exposto, apenas que não exige autenticação.

---

### PST-06 — Fragilidade de Multi-Tenancy na Superfície Pública

**Domínios afetados:** Rotas Públicas, Consulta

As rotas autenticadas utilizam o middleware `scopedEvento` para isolar acesso por `evento_id`. As rotas públicas consultam certificados exclusivamente por `participante_id` (busca por e-mail) ou por `codigo` (validação), sem qualquer filtro ou contexto de `evento_id`.

Consequências observadas:
- `GET /api/certificados?email=` retorna todos os certificados de um participante de todos os eventos, sem distinção de contexto
- `GET /api/certificados/:id/pdf` permite acesso a qualquer certificado de qualquer evento por ID sequencial, sem validação de pertencimento ao evento

Não há violação de multi-tenancy nos achados confirmados (o acesso público por definição não tem tenant autenticado), mas a ausência de filtro opcional de `evento_id` nas rotas públicas e a exposição de IDs sequenciais sem controle de escopo criam superfície para extração cross-evento sem autenticação.

---

## 3. Correções Críticas Imediatas

| ID | Achados | Endpoints/Arquivos Afetados | Risco | Ação |
|----|---------|----------------------------|-------|------|
| **CCI-01** | T05-VU-001 | `GET /api/validar/:codigo`, `GET /api/certificados`, `GET /api/certificados/:id/pdf`, `POST /obter`, `POST /validar`, `GET /validar/:codigo` | Crítico — brute force, scraping, DoS | Adicionar instâncias de `express-rate-limit` nas seis rotas públicas de certificados. O pacote já está instalado e funcional no projeto. |
| **CCI-02** | T05-VU-002 | Queries de validação em `api.js` e `public.js`; query de PDF em `api.js` | Alto — certificados cancelados validados como autênticos e geradores de PDF | Adicionar filtro `status: 'emitido'` (ou equivalente definido após T05-VH-002) nas queries de `findOne` e `findByPk` de todos os endpoints de validação e PDF. |
| **CCI-03** | T05-VU-003 | `GET /api/certificados/:id/pdf` em `api.js`; views `obter-lista.hbs` e `validar-resultado.hbs` | Crítico — enumeração de todos os PDFs por ID sequencial | Avaliar substituição de `:id` por `:codigo` no endpoint de download (requer decisão T05-VH-006 sobre identificador público). Enquanto pendente, aplicar rate limiting severo (CCI-01) como mitigação de curto prazo. |
| **CCI-04** | T05-VU-005 | `views/certificados/validar-resultado.hbs` linha 20–21 | Alto — exposição de e-mail pessoal do participante; LGPD | Remover ou condicionar a exibição de `{{certificado.Participante.email}}` na view pública. Aguarda decisão T05-VH-004. Como mitigação imediata, remover o campo até decisão definitiva. |
| **CCI-05** | T05-VU-008 | `src/routes/api.js` linhas ~70–73 | Alto — vazamento de detalhes de infraestrutura interna | Remover o campo `detalhe: err.message` da resposta HTTP 500. Erro interno deve ser logado no servidor (sem PII) mas não exposto ao cliente. |
| **CCI-06** | T05-VU-009 | `src/services/pdfService.js` linha 14 | Alto — PII em logs de produção (OWASP A09) | Remover o `console.log('PDFService certificado:', certificado)`. Se necessário para debug, substituir por logger condicional sem PII. |
| **CCI-07** | T05-BR-001 | `views/admin/certificados/detalhe.hbs` linha 5 | Alto — download inoperante no painel admin | Corrigir href de `/public/certificados/{{certificado.id}}/pdf` para `/api/certificados/{{certificado.id}}/pdf`. |

---

## 4. Backlog Arquitetural Priorizado

### Curto Prazo

| ID | Item | Achado(s) | Justificativa |
|----|------|-----------|---------------|
| BA-01 | Implementar rate limiting nas seis rotas públicas de certificados (`express-rate-limit`) | T05-VU-001 | Mitigação crítica de brute force, scraping e DoS. Pacote já disponível. |
| BA-02 | Adicionar filtro de `status: 'emitido'` nas queries de validação e geração de PDF | T05-VU-002 | Correção de bug crítico de integridade — certificados cancelados validados como autênticos. |
| BA-03 | Centralizar validação de formato de código (`CODIGO_CERTIFICADO_REGEX`) nas três superfícies de validação | T05-VU-006, T05-IP-001 | Eliminar inconsistência de proteção entre `POST /validar`, `GET /validar/:codigo` e `GET /api/validar/:codigo`. |
| BA-04 | Adicionar validação de formato de e-mail (RFC 5321) em `POST /obter` e `GET /api/certificados?email=` | T05-VU-007 | Defesa em profundidade para os endpoints de consulta por e-mail. |
| BA-05 | Implementar serialização controlada (DTO ou projeção de campos) nas respostas da API pública | T05-GI-001, T05-GI-002 | Eliminar exposição de IDs internos (`participante_id`, `evento_id`, `deleted_at`) nas respostas JSON públicas. |
| BA-06 | Substituir exposição do ID interno nas views de download pelo `codigo` do certificado | T05-VU-003, T05-GI-004 | Eliminar enumeração por ID interno nos links de PDF das views públicas. Requer decisão arquitetural sobre endpoint (ver BA-07). |
| BA-07 | Avaliar redesign do endpoint de PDF de `GET /api/certificados/:id/pdf` para `GET /api/certificados/:codigo/pdf` | T05-VU-003 | Eliminar enumeração sequencial por PK. O `codigo` é um identificador público já existente (FR-52) e não é sequencial visivelmente. |
| BA-08 | Extrair lógica de busca pública para `certificadoService.js` (métodos `findByCodigo`, `findByEmail`) | T05-VA-001, T05-DT-001 | Centralizar regras de negócio; eliminar triplicação de lógica; permitir aplicação uniforme de filtros e DTOs. |
| BA-09 | Condicionar exibição do botão "Baixar PDF" ao `status: 'emitido'` nas views públicas | T05-IP-002 | Eliminar convite ao download de certificados cancelados na interface. |

### Médio Prazo

| ID | Item | Achado(s) | Justificativa |
|----|------|-----------|---------------|
| BA-10 | Padronizar resposta de `GET /api/validar/:codigo` para incluir associações (Participante, Evento, TiposCertificados) | T05-GI-003 | Consistência de contrato entre API JSON e SSR para a mesma operação de validação. |
| BA-11 | Adicionar paginação a `GET /api/certificados?email=` | T05-GI-002 | Limitar tamanho de payload; eliminar potencial DoS por resposta irrestrita. |
| BA-12 | Adicionar headers `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` na resposta de PDF | T05-GI-004 | Prevenção de cache indevido em proxies/CDN para certificados cancelados após a decisão de T05-VH-006. |
| BA-13 | Refatorar `pdfService.generateCertificadoPdf` — eliminar anti-pattern `new Promise(async ...)` | T05-DT-002 | Prevenir unhandled promise rejection silenciosa. |
| BA-14 | Padronizar comportamento HTTP para "participante não encontrado" entre API (404) e SSR (200 com mensagem) | T05 (PST-03) | Consistência de contrato entre superfícies para o mesmo caso de negócio. |
| BA-15 | Mover validação de presença de `codigo` para a camada de rota/controller no endpoint de PDF, retornando HTTP 422 | 14/IP-001 | Resposta semanticamente correta para certificado sem código; evita consumo desnecessário do pdfService. |

### Longo Prazo

| ID | Item | Achado(s) | Justificativa |
|----|------|-----------|---------------|
| BA-16 | Avaliar adição de componente não-previsível ao formato do código de certificado (sufixo aleatório) | T05-VU-004 | Dificultar enumeração sistemática por varredura de `N`. Requer decisão de produto e arquitetura sobre retrocompatibilidade. |
| BA-17 | Resolver dependência circular entre `pdfService` e `r2Service` arquiteturalmente | T05-DT-003 | Eliminar `require` inline; permitir mocking estático em testes; resolver dependência circular definitivamente. |
| BA-18 | Criar controller público dedicado para endpoints de certificados públicos | T05-VA-001 | Completar separação de camadas e alinhar superfície pública ao padrão arquitetural do restante do sistema. |

---

## 5. Atualizações Recomendadas no SRS

### SRS-01 — FR-24: Definir comportamento de validação por status do certificado (T05-AM-001)

**Lacuna:** FR-24 define apenas `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }`. Não menciona `status: 'cancelado'` ou `status: 'pendente'`. A implementação atual retorna `valido: true` para qualquer status.

**Texto sugerido:**
> FR-24 deve especificar: "(a) se o código existir e `status = 'emitido'`, retorna HTTP 200 `{ valido: true, certificado }`; (b) se o código existir mas `status = 'cancelado'`, retorna HTTP 200 `{ valido: false, mensagem: 'Certificado cancelado' }`; (c) se o código não existir, retorna HTTP 404 `{ valido: false, mensagem: 'Certificado não encontrado' }`. Certificados com `status: 'pendente'` devem ter comportamento explicitamente definido (sugestão: tratar como inválidos até emissão formal)."

---

### SRS-02 — FR-25: Definir escopo de dados pessoais expostos nas rotas públicas (T05-AM-002)

**Lacuna:** FR-25 ("As rotas de consulta pública não devem exigir autenticação") não define quais campos podem ser expostos. Ausência que gerou exposição de e-mail pessoal e IDs internos sem base em requisito.

**Texto sugerido:**
> FR-25 deve ser complementado com: "A resposta de consulta e validação pública deve expor apenas os seguintes campos: `nome` do certificado, `codigo`, `status`, `nomeCompleto` do participante, `nome` do evento, `descricao` do tipo de certificado. Dados pessoais adicionais (e-mail, instituição), identificadores internos de banco (`id`, `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`) e dados de configuração interna (`valores_dinamicos` não sanitizados) **não devem** ser expostos nas respostas públicas."

---

### SRS-03 — FR-42 e FR-43: Restringir geração de PDF por status (T05-AM-001, T05-VU-002)

**Lacuna:** FR-42 define geração pública sem restrição de status. FR-43 valida apenas presença de `codigo`. Nenhum FR restringe PDF para certificados cancelados.

**Texto sugerido:**
> FR-42 deve ser complementado com: "A geração de PDF via `GET /api/certificados/:id/pdf` somente é permitida para certificados com `status: 'emitido'`. Certificados com `status: 'cancelado'` devem retornar HTTP 403. Certificados com `status: 'pendente'` devem [definir comportamento explicitamente após revisão de negócio]."
>
> FR-42 deve também especificar: "A resposta deve incluir headers `Cache-Control: no-store`, `Content-Disposition: attachment; filename=certificado-{codigo}.pdf` e `X-Content-Type-Options: nosniff`."

---

### SRS-04 — Novo FR: Rate limiting em rotas públicas de certificados (T05-VU-001, T05-ID-001)

**Lacuna:** MS-4 permanece como sugestão sem FR correspondente. FR-55 cobre apenas `POST /usuarios/login`.

**Texto sugerido:**
> "Novo FR-58 (ou extensão de NFR-1): Os endpoints públicos de certificados (`GET /api/validar/:codigo`, `GET /api/certificados`, `GET /api/certificados/:id/pdf`, `POST /obter`, `POST /validar`, `GET /validar/:codigo`) devem ser protegidos por rate limiting: máximo [N] tentativas em [T] minutos por IP. HTTP 429 deve ser retornado quando o limite for excedido."

---

### SRS-05 — Eliminar duplicata entre FR-23 e FR-53 (T05-AM-003)

**Lacuna:** FR-23 e FR-53 descrevem a mesma rota com texto praticamente idêntico, sem diferenciação semântica.

**Ação:** Consolidar em um único FR com redação unificada. Remover o duplicado com nota de rastreabilidade.

---

### SRS-06 — Definir comportamento de listagem pública para certificados cancelados (T05-VH-001)

**Lacuna:** FR-23/FR-53 não especificam se certificados cancelados devem ser incluídos ou filtrados na listagem pública por e-mail.

**Ação:** Adicionar cláusula explícita na listagem: "Certificados com `status: 'cancelado'` [devem | não devem] ser retornados na listagem pública por e-mail." Decisão de produto necessária antes da redação final.

---

## 6. Itens para Validação Humana

| ID | Domínio(s) | Questão | Impacto da Decisão | Achados Relacionados |
|----|-----------|---------|-------------------|---------------------|
| **VH-01** | Validação, Consulta | Certificados cancelados devem aparecer na listagem pública por e-mail (`GET /api/certificados?email=` e `POST /obter`)? | Define filtro de `status` na query de listagem pública e label visual nas views. | T05-VH-001, 15/VH-01, 16/VH-001 |
| **VH-02** | Validação, Download | Certificado com `status: 'pendente'` deve retornar `valido: false` na validação e bloquear download de PDF? | Define filtro de status nas queries de validação e PDF; impacta FR-24 e FR-42. | T05-VH-002, 13/VH-003, 14/VH-002 |
| **VH-03** | Validação, Download | Certificado restaurado após soft-delete que estava `cancelado` deve ser retornado como `valido: true` ou `valido: false`? | Define comportamento pós-restauração na validação pública; impacta semântica de FR-22 combinada com FR-24. | T05-VH-003, 13/VH-001, 14/AM-002 |
| **VH-04** | Validação, Consulta | Quais campos do participante e do certificado podem ser exibidos a usuários não autenticados? (e-mail, `valores_dinamicos`, instituição) | Define escopo de DTO de resposta pública; impacta conformidade com LGPD. Decisão produto + jurídico. | T05-VH-004, T05-AM-002, 13/VH-002, 15/VH-04 |
| **VH-05** | Consulta | Participante soft-deletado: seus certificados devem permanecer acessíveis via consulta pública por e-mail? | Define uso de `{ paranoid: false }` na query de `Participante` nas rotas públicas. | T05-VH-005, 15/VH-03, 16/VH-003 |
| **VH-06** | Download | O endpoint de PDF deve usar o ID interno (PK sequencial) ou o código do certificado como identificador público? | Decisão arquitetural que elimina ou mantém o vetor de enumeração por ID (T05-VU-003). Impacta endpoint, views e `Content-Disposition`. | T05-VU-003, 15/VH-06, 14/SPEC-01 |
| **VH-07** | Download | Política de cache HTTP para PDFs gerados sob demanda: `Cache-Control: no-store` ou permitir cache? | Define headers de resposta do endpoint de PDF; impacto depende da topologia com proxy reverso/CDN produção. | T05-VH-006, 14/VH-001, 14/VH-003 |
| **VH-08** | Consulta | É necessário paginar a listagem pública `GET /api/certificados?email=`? Quantos certificados um participante pode ter? | Define implementação de paginação em BA-11 e impacto de payload em resposta irrestrita. Decisão de produto/arquitetura. | 15/VH-07, 16/GI-005 |

---

## 7. Iniciativas de Spec (Spec Kit)

### SPEC-PUB-01 — Política de Segurança e Privacidade para Consulta Pública de Certificados

**Motivação:** Os achados T05-VU-001, T05-VU-004, T05-VU-005, T05-AM-001, T05-AM-002 e T05-ID-001 revelam ausência transversal de uma política formal de segurança e privacidade para as rotas públicas. Todos os achados críticos derivam da mesma lacuna estrutural: o SRS não define os limites de exposição das rotas públicas.

**Escopo sugerido:**
- Definição formal de campos públicos vs. privados (DTO canônico público)
- Política de rate limiting para endpoints públicos (thresholds, janelas, comportamento de bloqueio)
- Comportamento explícito para certificados cancelados, pendentes e restaurados em cada endpoint público
- Política de exposição de dados pessoais do participante (e-mail, `valores_dinamicos`)
- Mecanismo de proteção contra enumeração sistêmica (código sequencial + ID sequencial)

---

### SPEC-PUB-02 — Proteção Anti-Enumeração e Anti-Scraping para Rotas Públicas

**Motivação:** T05-VU-001 (sem rate limiting), T05-VU-003 (ID sequencial no PDF), T05-VU-004 (código previsível), T05-VU-005 (e-mail exposto), PST-02 (cadeia de enumeração) formam uma superfície de ataque estrutural que permite varredura irrestrita de todos os certificados do sistema.

**Escopo sugerido:**
- Rate limiting por IP em todos os endpoints públicos (limite, janela, resposta HTTP 429)
- Definição de estratégia de identificação de certificado no endpoint de PDF (código vs. ID)
- Avaliação de aleatorização/ofuscação do componente `N` do código de certificado
- Definição de paginação e limites de resposta

---

### SPEC-PUB-03 — Redesign da Camada de Consulta Pública (Service Layer e DTOs)

**Motivação:** T05-VA-001, T05-DT-001, PST-03, PST-04 revelam que toda a lógica de consulta pública está inline nas rotas, sem service layer compartilhado, com múltiplas duplicações e contratos inconsistentes entre API e SSR.

**Escopo sugerido:**
- Criação de `certificadoPublicoService.js` com métodos `findByCodigo`, `findByEmail`, `validateByCodigo`
- Definição de DTO canônico para respostas públicas (campos permitidos)
- Centralização de validação de inputs (e-mail, código, id)
- Paginação padronizada para listagem
- Alinhamento de contratos entre API JSON e SSR HTML (T05-GI-003, PST-03)

---

## 8. Análise de Problemas Sistêmicos

### 8.1 Inconsistência como Padrão Estrutural

A ausência de service layer compartilhado (T05-VA-001, PST-04) gerou inconsistências estruturais em cada aspecto do domínio público:

- **Validação de formato de código:** presente no `GET /validar/:codigo` SSR, ausente na API e no `POST /validar`
- **Includes de associações:** presentes no SSR, ausentes na API
- **Serialização de resposta:** `.toJSON()` no SSR, objeto Sequelize bruto na API
- **Filtro de status:** ausente em todos (mas deveria existir em todos com contratos consistentes)

Cada inconsistência representa um ponto independente de falha de segurança ou de contrato. A correção isolada de cada item é menos eficaz do que a correção estrutural via SPEC-PUB-03.

---

### 8.2 Assimetria de Proteção entre Endpoints Públicos e Autenticados

O sistema aplica rate limiting apenas ao login e RBAC + `scopedEvento` às rotas autenticadas. As rotas públicas não recebem nenhum mecanismo de proteção equivalente. A assimetria não é consequência de design consciente — é lacuna de requisito (T05-ID-001): MS-4 nunca foi elevada a FR.

O resultado prático é que os endpoints mais acessíveis externamente (as rotas públicas) são os menos protegidos contra abuso.

---

### 8.3 Dupla Superfície de Enumeração com Espaços de Chave Diferentes

Os dois vetores de enumeração do sistema (código sequencial via validação e ID sequencial via PDF) têm propriedades distintas:

| Vetor | Espaço de chave | Previsibilidade | Barreira atual |
|-------|----------------|-----------------|----------------|
| Código `CODIGO_BASE-YY-TIPO-N` | Finito por evento+tipo+ano | Alta (N incremental a partir de 1) | Nenhuma |
| ID sequencial no endpoint de PDF | Global, monotônico | Total (inteiro sequencial) | Nenhuma |

A coexistência dos dois vetores sem qualquer proteção cria redundância de exploração: se um vetor for bloqueado, o outro continua disponível. A correção de um vetor sem o outro (ex: só implementar rate limiting no PDF) não elimina a enumeração.

---

### 8.4 Cadeia de Exploração de Alta Severidade

Os achados individuais ganham severidade composta quando combinados:

```
T05-VU-004 (código previsível)
+ T05-VU-001 (sem rate limiting)
+ T05-VU-005 (e-mail exposto na validação)
+ T05-GI-002 (IDs expostos na listagem por e-mail)
+ T05-VU-003 (enumeração de PDF por ID)
= varredura completa de todos os certificados e e-mails do sistema
```

Nenhum dos achados isolados é suficiente para a exploração completa, mas a cadeia completa exige apenas: conhecimento do `CODIGO_BASE` de um evento (informação pública) e tempo de processamento irrestrito (sem rate limiting).

---

### 8.5 Fragilidade Estrutural pela Ausência de DTO Público

A exposição de campos internos (T05-GI-001, T05-GI-002) e de dados pessoais (T05-VU-005) deriva da ausência de um DTO canônico para respostas públicas. O mesmo objeto Sequelize que trafega internamente (com `deleted_at`, IDs de FK, `valores_dinamicos`) é serializado diretamente para o cliente público.

Qualquer evolução futura do modelo de dados que adicione campos sensíveis implicará exposição automática nas rotas públicas sem nenhuma barreira de filtragem.

---

*Triagem gerada em 2026-05-09 às 23:41 (BRT). Baseada exclusivamente nos achados das auditorias 07/13, 07/14, 07/15 e 07/16 e nas evidências de código-fonte e SRS referenciadas nessas auditorias. Nenhum dado foi extrapolado ou assumido sem evidência nas fontes citadas.*
