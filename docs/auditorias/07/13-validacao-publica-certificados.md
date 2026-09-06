# Auditoria Técnica 13 — Validação Pública de Certificados por Código

**Domínio auditado:** Validação pública de certificado por código  
**Data:** 2026-05-09  
**Hora:** 22:56 (BRT)  
**Auditor:** Arquitetura — Auditoria técnica automatizada  
**Versão do SRS analisada:** 2.0 (2026-04-30)  
**Branch:** main

---

## Fontes Analisadas

| Arquivo                                    | Papel                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `docs/especificacoes.md`                   | SRS — fonte de requisitos                                                |
| `src/routes/api.js`                        | Endpoint `GET /api/validar/:codigo`                                      |
| `src/routes/public.js`                     | SSR `POST /validar`, `GET /validar/:codigo`, `GET /obter`, `POST /obter` |
| `src/models/certificado.js`                | Model Sequelize de certificados                                          |
| `src/models/participante.js`               | Model Sequelize de participantes                                         |
| `src/models/index.js`                      | Registro de models                                                       |
| `src/services/certificadoService.js`       | Service de certificados                                                  |
| `src/controllers/certificadoController.js` | Controller de certificados (rotas autenticadas)                          |
| `src/middlewares/auth.js`                  | Middleware de autenticação JWT                                           |
| `app.js`                                   | Montagem de rotas e middlewares globais                                  |
| `views/certificados/validar-resultado.hbs` | Template de resultado da validação SSR                                   |
| `views/certificados/form-validar.hbs`      | Formulário SSR de validação                                              |
| `tests/routes/publicSSR.test.js`           | Testes da superfície SSR pública                                         |

---

## Contexto Arquitetural

O sistema expõe duas superfícies distintas para validação pública de certificados por código:

**API JSON (`src/routes/api.js`):**

- `GET /api/validar/:codigo` → resposta `{ valido: true/false, certificado }` ou HTTP 404

**SSR (`src/routes/public.js`):**

- `GET /validar` → formulário de validação
- `POST /validar` → processa código digitado no formulário
- `GET /validar/:codigo` → valida código diretamente pela URL, renderiza `validar-resultado.hbs`

Ambas as superfícies são montadas sem autenticação. Nenhum middleware de autenticação é aplicado às rotas de `api.js` ou `public.js` para os endpoints de validação.

O formato do código de certificado é definido em FR-52: `CODIGO_BASE-YY-TIPO-N` (ex.: `EDC-26-PT-3`).

---

## 1. Matriz Consolidada de Achados

| ID         | Descrição                                                                                       | Evidência                                                                                                                                                                                                                                                                                                                                                                                                      | Severidade | Tipo | Impacto                                                                                                                                                                                                                                                                         | Requisitos Violados              | Destino Recomendado                |
| ---------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| **VU-001** | Ausência total de rate limiting em todos os endpoints de validação pública                      | `api.js` linha 160: `router.get('/validar/:codigo', async (req, res) => {` — sem middleware limitador. `public.js` linhas 46 e 77: `router.post('/validar', ...)` e `router.get('/validar/:codigo', ...)` — sem limitador. Nenhum `require('express-rate-limit')` em `api.js` ou `public.js`. O pacote `express-rate-limit` só é importado em `src/routes/usuarios.js`                                         | Crítico    | VU   | Permite brute force irrestrito de códigos de validação. Um atacante pode varrer sistematicamente o espaço de códigos `CODIGO_BASE-YY-TIPO-N` sem qualquer limitação de velocidade ou bloqueio por IP                                                                            | MS-4 (sugestão não elevada a FR) | Correção Crítica Imediata          |
| **BR-001** | Certificados cancelados retornam `valido: true` na API e no SSR                                 | `api.js` linha 161: `Certificado.findOne({ where: { codigo } })` — sem cláusula `status`. `public.js` linhas 55 e 90: `Certificado.findOne({ where: { codigo }, include: [...] })` — sem cláusula `status`. Model `certificado.js` linhas 22-27: `status: ENUM('emitido', 'pendente', 'cancelado')`. Um certificado com `status: 'cancelado'` é retornado com `valido: true` nas três superfícies de validação | Alto       | BR   | Certificados cancelados são validados publicamente como autênticos. Comprometem a integridade da validação — o estado interno de cancelamento não é refletido na resposta pública                                                                                               | FR-24, FR-19                     | Correção Crítica Imediata          |
| **VU-002** | `GET /api/validar/:codigo` aceita qualquer string como código sem validação de formato          | `api.js` linhas 159-168: `const { codigo } = req.params` passado diretamente a `Certificado.findOne({ where: { codigo } })` sem validação de formato, comprimento ou charset. SSR `GET /validar/:codigo` em `public.js` linha 79 aplica `CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i` e retorna HTTP 400. A mesma proteção está ausente na API                                                             | Alto       | VU   | Aceita strings de comprimento e charset arbitrários. Embora o ORM Sequelize mitigue SQL injection via prepared statements, strings contendo caracteres especiais, unicode, payloads de SSRF ou strings excessivamente longas são encaminhadas ao banco sem sanitização          | FR-24                            | Correção Crítica Imediata          |
| **VU-003** | Exposição pública do e-mail do participante no resultado de validação SSR                       | `views/certificados/validar-resultado.hbs` linhas 20-21: `<dt>E-mail</dt><dd>{{certificado.Participante.email}}</dd>` renderizado publicamente para qualquer visitante que informe um código válido                                                                                                                                                                                                            | Alto       | VU   | Qualquer pessoa com acesso ao código de certificado pode descobrir o e-mail pessoal do participante. Combinado com a previsibilidade dos códigos (VU-004), permite scraping sistemático de e-mails de participantes de eventos via varredura de códigos                         | FR-25, LGPD/privacidade          | Correção Crítica Imediata          |
| **VU-004** | Código de certificado com formato sequencial e previsível permitindo enumeração sistemática     | FR-52 define formato `CODIGO_BASE-YY-TIPO-N` onde: `CODIGO_BASE` são 3 letras públicas do evento, `YY` são 2 dígitos do ano público, `TIPO` são 2 letras do tipo de certificado e `N` é um contador incremental a partir de 1. `certificadoService.js` linhas 64-70: `const count = await Certificado.count(...)` + `const incremental = count + 1`. Todos os componentes do código são deduzíveis ou públicos | Alto       | VU   | Qualquer atacante que conheça o `codigo_base` de um evento (disponível na interface pública) pode enumerar sistematicamente todos os certificados emitidos para aquele evento, iterando `N` de 1 a qualquer valor. Problema agravado pela ausência de rate limiting (VU-001)    | FR-52                            | Backlog Arquitetural — curto prazo |
| **VU-005** | Exposição do ID interno do banco de dados (`certificado.id`) na resposta pública SSR            | `views/certificados/validar-resultado.hbs` linha 40: `href='/api/certificados/{{certificado.id}}/pdf'`. O ID inteiro sequencial do banco é exposto publicamente. Endpoint `GET /api/certificados/:id/pdf` em `api.js` não requer autenticação e aceita qualquer ID inteiro                                                                                                                                     | Médio      | VU   | Permite enumeração de PDFs por ID sequencial. Um atacante pode iterar `GET /api/certificados/1/pdf`, `GET /api/certificados/2/pdf`, etc., baixando certificados de terceiros sem conhecer os códigos                                                                            | FR-42, FR-25                     | Correção Crítica Imediata          |
| **VA-001** | Lógica de busca por código diretamente na rota, sem controller nem service                      | `api.js` linhas 159-168: toda a lógica de validação (query ao banco, construção da resposta, tratamento de erro) está inline no handler da rota. Não há controller nem chamada a `certificadoService`. `public.js` linhas 46-70 e 77-110: mesma situação para o SSR. O `certificadoService.js` existente não possui método `findByCodigo` ou similar                                                           | Alto       | VA   | Violação direta de NFR-6 (routes → controllers → services → models). Lógica de negócio duplicada entre SSR e API sem compartilhamento de código. Dificulta manutenção, testes unitários isolados e evolução da regra de validação                                               | NFR-6                            | Backlog Arquitetural — curto prazo |
| **GI-001** | Inconsistência de validação de input entre as três superfícies de validação                     | SSR `GET /validar/:codigo` em `public.js` linha 79: aplica `CODIGO_CERTIFICADO_REGEX` e retorna HTTP 400. SSR `POST /validar` em `public.js` linha 48: apenas valida string vazia (`if (!codigo)`), sem validação de formato. API `GET /api/validar/:codigo` em `api.js` linha 159: sem qualquer validação de formato. Três tratos distintos para o mesmo input                                                | Alto       | GI   | Superfícies de validação com contratos de segurança diferentes. API e `POST /validar` são exploráveis com inputs que o `GET /validar/:codigo` SSR rejeitaria. Complexidade de manutenção                                                                                        | FR-24                            | Backlog Arquitetural — curto prazo |
| **GI-002** | `GET /api/validar/:codigo` expõe objeto Sequelize bruto sem serialização controlada             | `api.js` linha 167: `return res.json({ valido: true, certificado })` — `certificado` é a instância Sequelize direta de `Certificado.findOne()`. Expõe implicitamente campos internos: `participante_id`, `evento_id`, `tipo_certificado_id`, `deleted_at`, `created_at`, `updated_at`, `valores_dinamicos`. Sem DTO, sem projeção de campos, sem filtro                                                        | Médio      | GI   | Vaza estrutura interna do banco (IDs de FK, timestamps de soft-delete, dados dinâmicos). Contrariamente ao SSR, que usa `certificado.toJSON()` com includes de associações, a API retorna somente o objeto flat sem joins. Contrato de resposta inconsistente e não documentado | FR-24                            | Backlog Arquitetural — médio prazo |
| **GI-003** | API `GET /api/validar/:codigo` não inclui associações (Participante, Evento, TiposCertificados) | `api.js` linha 162: `Certificado.findOne({ where: { codigo } })` — sem cláusula `include`. SSR `GET /validar/:codigo` em `public.js` linhas 83-90: inclui Participante, Evento e TiposCertificados. SSR `POST /validar` em `public.js` linhas 55-62: idem. Swagger em `api.js` referencia `$ref: '#/components/schemas/Certificado'` que não define associações                                                | Médio      | GI   | Resposta da API incompleta para um consumidor legítimo que precise validar um certificado e obter dados do participante/evento. Inconsistência de contrato entre JSON e HTML impede uso uniforme da API em integrações                                                          | FR-24                            | Backlog Arquitetural — médio prazo |
| **IP-001** | `POST /validar` SSR não valida formato do código de certificado                                 | `public.js` linha 48: `const codigo = req.body.codigo ? req.body.codigo.trim() : ''` — apenas valida vazio. Sem aplicação de `CODIGO_CERTIFICADO_REGEX`. Strings com SQL chars, espaços, unicode ou comprimento excessivo são aceitas e encaminhadas ao ORM                                                                                                                                                    | Médio      | IP   | Inconsistência interna na superfície SSR. O formulário `GET /validar/:codigo` rejeita códigos inválidos com 400, mas `POST /validar` aceita os mesmos inputs. Implementação parcial da mesma regra de segurança                                                                 | FR-24                            | Backlog Arquitetural — curto prazo |
| **AM-001** | FR-24 não define comportamento de validação para certificados com `status: 'cancelado'`         | FR-24: `GET /api/validar/:codigo` retorna `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }`. Não menciona o estado `cancelado`. FR-19 define o campo `status` mas não relaciona status a resultado de validação pública. Implementação atual: certificados cancelados retornam `valido: true` (evidência: ausência de filtro de status em todas as queries de validação)               | Alto       | AM   | Ambiguidade que resultou em BR-001. Sem definição explícita, o comportamento para certificados cancelados é implementação-dependente e sem garantia de consistência                                                                                                             | FR-24, FR-19                     | Atualizações Recomendadas no SRS   |
| **AM-002** | FR-25 não define quais campos do certificado/participante podem ser expostos publicamente       | FR-25: "As rotas de consulta pública não devem exigir autenticação." Não define escopo de dados permitidos na resposta pública. Nenhum requisito restringe ou permite a exposição de e-mail, dados dinâmicos (`valores_dinamicos`) ou timestamps na resposta pública                                                                                                                                           | Médio      | AM   | Ausência de definição cria risco de exposição não intencional de dados pessoais (e-mail do participante, outros dados do `valores_dinamicos`). A view atual expõe e-mail publicamente sem suporte explícito no SRS                                                              | FR-25                            | Atualizações Recomendadas no SRS   |
| **VH-001** | Comportamento de certificados restaurados na validação pública não está documentado             | FR-22: "A remoção de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados." NFR-4 confirma soft delete. Quando um certificado é restaurado (`deleted_at` volta a `null`), Sequelize o retorna nas queries. Se estiver `status: 'cancelado'`, seria retornado como `valido: true`. Não há FR que defina o estado esperado após restauração na validação pública                 | Médio      | VH   | Aguarda Validação Humana                                                                                                                                                                                                                                                        |
| **VH-002** | Política de campos expostos na validação pública não está definida no SRS                       | O e-mail do participante está exposto em `validar-resultado.hbs`. `valores_dinamicos` (dados específicos do tipo de certificado) seria exposto via JSON da API. A política de privacidade dos dados exibidos publicamente não está documentada no SRS                                                                                                                                                          | Médio      | VH   | Aguarda Validação Humana                                                                                                                                                                                                                                                        |
| **DT-001** | Ausência de controller e service layer para o endpoint de validação pública                     | `api.js` e `public.js` contêm acesso direto ao model Sequelize sem passar por controller ou service. `certificadoService.js` não possui método `findByCodigo`, `validateByCodigo` ou equivalente                                                                                                                                                                                                               | Baixo      | DT   | Código duplicado e de teste difícil. Não compartilhável entre superfícies                                                                                                                                                                                                       | NFR-6                            | Backlog Arquitetural — curto prazo |
| **ID-001** | MS-4 do SRS menciona rate limiting para rotas públicas mas não há FR correspondente             | `docs/especificacoes.md` seção Melhorias Sugeridas, MS-4: "Rate limiting nas rotas públicas `/public/validar/:codigo` e `/public/certificados?email=...`." Permanece como sugestão, não elevada a requisito funcional. Apenas FR-55 cobre rate limiting e é restrito a `POST /usuarios/login`                                                                                                                  | Baixo      | ID   | A sugestão MS-4 foi identificada e não implementada. A ausência de um FR correspondente torna a lacuna estruturalmente invisível                                                                                                                                                | —                                | Atualizações Recomendadas no SRS   |

---

## 2. Correções Críticas Imediatas

### CCI-01 — Ausência de rate limiting nos endpoints de validação pública (VU-001)

**Endpoints afetados:**

- `GET /api/validar/:codigo` (`src/routes/api.js`)
- `POST /validar` (`src/routes/public.js`)
- `GET /validar/:codigo` (`src/routes/public.js`)

**Evidência:**

```js
// api.js — sem middleware de rate limiting
router.get('/validar/:codigo', async (req, res) => { ... })

// public.js — sem middleware de rate limiting
router.post('/validar', async (req, res) => { ... })
router.get('/validar/:codigo', async (req, res) => { ... })
```

O pacote `express-rate-limit@^8.3.1` está disponível no `package.json` e é utilizado em `src/routes/usuarios.js` para `POST /usuarios/login`. Não há equivalente aplicado às rotas de validação pública.

**Risco:** Brute force irrestrito de códigos de certificado por IP, possibilitando varredura completa do espaço de códigos `CODIGO_BASE-YY-TIPO-N`.

---

### CCI-02 — Certificados cancelados validados como autênticos (BR-001)

**Endpoints afetados:**

- `GET /api/validar/:codigo`
- `POST /validar`
- `GET /validar/:codigo`

**Evidência:**

```js
// api.js — findOne sem filtro de status
const certificado = await Certificado.findOne({ where: { codigo } })
if (!certificado) {
  return res
    .status(404)
    .json({ valido: false, mensagem: 'Certificado não encontrado' })
}
return res.json({ valido: true, certificado }) // retornado mesmo com status: 'cancelado'
```

```js
// public.js — mesma ausência em POST /validar e GET /validar/:codigo
const certificado = await Certificado.findOne({
  where: { codigo },
  include: [...]
})
if (!certificado) {
  return res.render('certificados/validar-resultado', { valido: false })
}
return res.render('certificados/validar-resultado', { valido: true, certificado: ... })
// retornado mesmo com status: 'cancelado'
```

O model `certificado.js` define `status: ENUM('emitido', 'pendente', 'cancelado')`. Nenhuma das três queries de validação filtra por status.

**Risco:** Certificados cancelados são apresentados ao público como válidos e autênticos — comprometimento direto da integridade da validação.

---

### CCI-03 — Ausência de validação de formato do código na API (VU-002)

**Endpoint afetado:** `GET /api/validar/:codigo` (`src/routes/api.js`)

**Evidência:**

```js
// api.js — sem validação de formato
router.get('/validar/:codigo', async (req, res) => {
  const { codigo } = req.params  // string arbitrária aceita
  try {
    const certificado = await Certificado.findOne({ where: { codigo } })
    ...
  }
})

// public.js — validação presente no GET SSR
const CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i
router.get('/validar/:codigo', async (req, res) => {
  const codigo = req.params.codigo
  if (!CODIGO_CERTIFICADO_REGEX.test(codigo)) {
    return res.status(400).render('certificados/form-validar', {
      mensagem: 'Código inválido. Use apenas letras, números e hífens.',
    })
  }
  ...
})
```

A validação existe no SSR e é testada por `tests/routes/publicSSR.test.js` (linhas 138-155), mas está completamente ausente na API JSON.

---

### CCI-04 — Exposição do e-mail do participante na validação pública SSR (VU-003)

**Evidência:**

```hbs
{{! views/certificados/validar-resultado.hbs }}
<dt class='col-sm-4'>E-mail</dt>
<dd class='col-sm-8'>{{certificado.Participante.email}}</dd>
```

O e-mail do participante é renderizado publicamente para qualquer visitante que informe um código válido. Combinado com a previsibilidade dos códigos (VU-004) e ausência de rate limiting (VU-001), permite scraping de e-mails de todos os participantes de um evento por varredura sequencial de `N`.

---

### CCI-05 — Exposição do ID interno via link de PDF na resposta pública SSR (VU-005)

**Evidência:**

```hbs
{{! views/certificados/validar-resultado.hbs }}
<a
  href='/api/certificados/{{certificado.id}}/pdf'
  class='btn btn-success'
  target='_blank'
>
  Baixar PDF
</a>
```

`certificado.id` é o ID inteiro sequencial do banco de dados exposto publicamente. O endpoint `GET /api/certificados/:id/pdf` em `api.js` não requer autenticação, permitindo que um atacante itere sequencialmente por todos os IDs para baixar PDFs de certificados sem necessitar do código de validação.

---

## 3. Backlog Arquitetural Priorizado

### Curto Prazo

| ID    | Item                                                                                              | Justificativa                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| BA-01 | Implementar rate limiting em `GET /api/validar/:codigo`, `POST /validar` e `GET /validar/:codigo` | Mitigação de VU-001 (brute force) — pacote já disponível no projeto                                                                      |
| BA-02 | Adicionar filtro `status != 'cancelado'` (ou `status: 'emitido'`) nas queries de validação        | Correção de BR-001 (certificados cancelados validados como autênticos) — requer definição humana do comportamento para status `pendente` |
| BA-03 | Adicionar validação de formato `CODIGO_CERTIFICADO_REGEX` no endpoint `GET /api/validar/:codigo`  | Homogeneização com o SSR — mitigação de VU-002                                                                                           |
| BA-04 | Adicionar validação de formato no `POST /validar` SSR                                             | Correção de IP-001 — consistência interna do SSR                                                                                         |
| BA-05 | Criar método `certificadoService.findByCodigo(codigo)` e refatorar os três endpoints para usá-lo  | Correção de VA-001 e DT-001 — elimina duplicação e centraliza regra de validação                                                         |

### Médio Prazo

| ID    | Item                                                                                    | Justificativa                                                     |
| ----- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| BA-06 | Definir e implementar DTO de resposta pública da validação API                          | Correção de GI-002 — elimina exposição de campos internos no JSON |
| BA-07 | Adicionar `include` de associações na resposta da API `GET /api/validar/:codigo`        | Correção de GI-003 — consistência de contrato entre API e SSR     |
| BA-08 | Rever dados exibidos na view `validar-resultado.hbs` (remoção ou proteção do e-mail)    | Mitigação de VU-003 — requer decisão de política de dados         |
| BA-09 | Substituir link de PDF por `/validar/:codigo/pdf` em vez de `/api/certificados/:id/pdf` | Mitigação de VU-005 — ocultar ID interno, acessar PDF pelo código |

### Longo Prazo

| ID    | Item                                                                                             | Justificativa                                                          |
| ----- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| BA-10 | Avaliar randomização ou ofuscação do componente `N` do código de certificado                     | Mitigação de VU-004 — reduz previsibilidade do espaço de códigos       |
| BA-11 | Implementar máquina de estados explícita para `status` do certificado com semântica de validação | Formaliza comportamento de validação por status (AM-001 + MS-7 do SRS) |

---

## 4. Atualizações Recomendadas no SRS

### SRS-01 — FR-24: Definir comportamento de validação por status do certificado (AM-001)

**Texto atual:**

> FR-24: O sistema deve disponibilizar uma rota pública JSON `GET /api/validar/:codigo` que retorna `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }`.

**Lacuna:** Não define o tratamento de certificados com `status: 'cancelado'` ou `status: 'pendente'`. A implementação atual retorna `valido: true` para qualquer status, o que é inconsistente com o conceito de cancelamento.

**Texto sugerido:**

> FR-24: O sistema deve disponibilizar uma rota pública JSON `GET /api/validar/:codigo` que: (a) se o código existir e o status for `"emitido"`, retorna HTTP 200 `{ valido: true, certificado }`; (b) se o código existir mas o status for `"cancelado"`, retorna HTTP 200 `{ valido: false, mensagem: "Certificado cancelado" }`; (c) se o código não existir, retorna HTTP 404 `{ valido: false, mensagem: "Certificado não encontrado" }`. Certificados com `status: "pendente"` devem ter comportamento explicitamente definido (sugestão: tratar como inválidos até emissão).

---

### SRS-02 — FR-25: Definir escopo de dados expostos na validação pública (AM-002)

**Texto atual:**

> FR-25: As rotas de consulta pública não devem exigir autenticação.

**Lacuna:** Não especifica quais campos do certificado e do participante podem ser expostos publicamente. A view atual expõe nome completo, e-mail e outros dados sem base em requisito explícito.

**Texto sugerido:**

> FR-25: As rotas de consulta pública não devem exigir autenticação. A resposta de validação pública deve expor apenas: nome do certificado, código, nome completo do participante, nome do evento, tipo de certificado e status. Dados pessoais adicionais (e-mail, instituição) não devem ser expostos na resposta pública de validação sem consentimento explícito.

---

### SRS-03 — Novo FR: Rate limiting no endpoint de validação pública

**Lacuna:** MS-4 identifica a necessidade mas permanece como sugestão. FR-55 cobre apenas `POST /usuarios/login`.

**Texto sugerido:**

> FR-58: Os endpoints públicos de validação de certificados (`GET /api/validar/:codigo`, `POST /validar`, `GET /validar/:codigo`) devem ser protegidos por rate limiting: máximo [N] tentativas em [T] minutos por IP. HTTP 429 quando excedido.

---

### SRS-04 — Novo FR: Comportamento de certificados restaurados na validação pública

**Lacuna:** FR-22 define que certificados podem ser restaurados, mas não define a semântica de validação após restauração.

**Texto sugerido:**

> FR-59: Certificados restaurados (via restore após soft delete) recuperam seu status anterior à exclusão lógica. A resposta de validação pública deve refletir o status atual após restauração — se `"cancelado"`, deve retornar `valido: false`; se `"emitido"`, deve retornar `valido: true`.

---

## 5. Itens para Validação Humana

### VH-001 — Comportamento de certificados restaurados na validação pública

**Questão:** Quando um certificado é restaurado via `certificadoService.restore(id)`, ele recupera o `status` que tinha antes de ser soft-deletado. Se estava `"cancelado"`, a restauração mantém `status: 'cancelado'`. O comportamento esperado na validação pública (valido: true ou false) não está definido em nenhum FR.

**Evidência:** `certificadoService.js` linhas 94-97: `certificado.restore()` — restaura sem alterar status.

**Decisão necessária:** Restaurar um certificado cancelado dever produzir qual resultado na validação pública? Retornar `valido: false` (cancelado é cancelado, independente do soft-delete)? Ou a restauração implica reverter para `"emitido"`?

---

### VH-002 — Política de exposição de e-mail do participante na validação pública

**Questão:** A view `validar-resultado.hbs` exibe o e-mail do participante publicamente. Não existe FR que autorize ou proíba essa exposição. FR-25 menciona apenas ausência de autenticação, não escopo de dados.

**Evidência:** `views/certificados/validar-resultado.hbs` linha 20: `<dd>{{certificado.Participante.email}}</dd>`.

**Decisão necessária:** O e-mail do participante deve ser exibido na validação pública? É dado pessoal sensível e pode conflitar com políticas de privacidade (LGPD — dados pessoais não devem ser expostos sem base legal).

---

### VH-003 — Tratamento de certificados `pendente` na validação pública

**Questão:** FR-19 define `status: 'pendente'` como valor válido. FR-24 define apenas dois resultados: `valido: true` (encontrado) ou `valido: false` (não encontrado). Um certificado `"pendente"` existe no banco (não é soft-deletado) e seria retornado como `valido: true` na implementação atual.

**Decisão necessária:** Certificados com `status: 'pendente'` devem ser considerados válidos, inválidos, ou ter resposta diferenciada na validação pública?

---

## 6. Possíveis Iniciativas de Spec (Spec Kit)

### SK-01 — Proteção Anti-Brute-Force e Anti-Enumeração de Certificados

**Motivação:** Achados VU-001, VU-004, e ausência de FR correspondente ao MS-4. O espaço de codigos `CODIGO_BASE-YY-TIPO-N` é finito e previsível, sem qualquer mecanismo de proteção.

**Escopo proposto:**

- Definir rate limiting por IP no endpoint de validação (FR-58)
- Avaliar randomização do componente `N` do código ou adição de sufixo aleatório para dificultar enumeração
- Definir política de resposta uniforme para evitar diferenciação por status (evitar que um atacante distinga entre "não existe", "cancelado" e "pendente" pela resposta)

---

### SK-02 — Padronização do Contrato Público de Resposta de Validação

**Motivação:** GI-002, GI-003. API retorna objeto Sequelize bruto sem associações. SSR renderiza com joins completos. Sem DTO definido.

**Escopo proposto:**

- Definir o contrato explícito da resposta `GET /api/validar/:codigo` no SRS (campos permitidos, campos proibidos)
- Implementar serialização controlada via DTO ou método `toPublicJSON()` no model
- Garantir paridade de informação entre API JSON e SSR HTML

---

## 7. Problemas Sistêmicos Observados

### PS-01 — Superfície de Enumeração Estrutural por Código Previsível

O formato `CODIGO_BASE-YY-TIPO-N` é intrinsecamente enumerável. Os componentes `CODIGO_BASE`, `YY` e `TIPO` são todos dados públicos extraíveis da interface do sistema. O componente `N` é sequencial a partir de 1. Sem rate limiting e sem aleatoriedade no código, o sistema permite que um atacante determine com precisão o intervalo válido de `N` para qualquer combinação de evento/tipo/ano e enumere todos os certificados emitidos.

**Impacto composto:** VU-001 (sem rate limiting) + VU-004 (código previsível) + VU-003 (e-mail exposto na validação) + VU-005 (ID exposto no PDF link) formam uma cadeia de exploração que permite:

1. Enumerar todos os códigos válidos de um evento
2. Para cada código válido, obter nome e e-mail do participante via SSR
3. Baixar o PDF de qualquer certificado sem código, apenas com o ID sequencial

### PS-02 — Ausência de Proteções Transversais nas Rotas Públicas

Todos os endpoints públicos (`api.js` e `public.js`) operam sem rate limiting, sem validação uniforme de input, sem monitoramento de abuso. O `express-rate-limit` está instalado e configurado apenas para `POST /usuarios/login`. A assimetria de proteção entre rotas autenticadas e públicas é estrutural.

### PS-03 — Duplicação de Lógica de Validação Entre API e SSR

A lógica de "buscar certificado por código" está implementada três vezes de forma independente:

1. `api.js GET /api/validar/:codigo` — inline, sem includes
2. `public.js POST /validar` — inline, com includes, sem validação de formato
3. `public.js GET /validar/:codigo` — inline, com includes, com validação de formato

Nenhuma das três utiliza `certificadoService`. Qualquer mudança de regra de negócio (ex: filtrar por status) precisa ser aplicada manualmente em três lugares. A divergência atual (BR-001) já é consequência direta dessa duplicação.

### PS-04 — Inconsistência de Contrato Entre API JSON e SSR HTML

A API `GET /api/validar/:codigo` e o SSR `GET /validar/:codigo` representam o mesmo recurso com contratos diferentes:

- API: sem includes (apenas IDs de FK), sem validação de formato, retorna instância Sequelize bruta
- SSR: com includes (Participante, Evento, TiposCertificados), com validação de formato por regex, renderiza HTML

Um consumidor que interaja com ambas as superfícies receberá estruturas de dados diferentes para o mesmo certificado, com diferentes garantias de segurança de input.

### PS-05 — Ausência de Semântica de Validação por Status

O campo `status` existe no model, na spec, e é gerenciável por perfis autenticados. Porém, a validação pública ignora completamente o status. A lacuna de AM-001 (ausência de definição no SRS) resultou diretamente em BR-001. A ausência de semântica explícita de validação por status é um problema sistêmico de especificação que contaminou a implementação.

---

_Auditoria gerada em 2026-05-09 22:56 (BRT)_
