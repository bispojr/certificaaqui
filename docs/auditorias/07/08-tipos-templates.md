# Auditoria 07/08 — Domínio: Tipos de Certificados e Templates

**Sistema:** Certifique-me  
**Data:** 2026-05-09 19:37 (BRT)  
**Auditor:** Agente Arquitetural Automatizado  
**Escopo:** Tipos de certificados, templates, campos dinâmicos, placeholders, renderização, associação tipo ↔ evento ↔ certificado, RBAC e multi-tenant  
**Fontes:** `docs/especificacoes.md`, `src/routes/`, `src/controllers/`, `src/services/`, `src/middlewares/`, `src/validators/`, `src/models/`, `migrations/`, `views/admin/tipos-certificados/`

---

## 1. Matriz de Achados

| ID    | Descrição                                                                                                                                              | Severidade | Tipo | Impacto                                                                                                               | Evidência Principal                                                                                                                            | FR/NFR       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-01 | Controller `findAll` ignora `req.query.evento_id` injetado pelo `scopedEvento`                                                                         | Alta       | BR   | Gestores/monitores recebem todos os tipos via API mesmo com filtro de escopo injetado                                 | `tiposCertificadosController.js` L14–19; `tiposCertificadosService.js` L6                                                                      | FR-37, FR-46 |
| BR-02 | SSR `index` de tipos-certificados não filtra por escopo de evento do usuário                                                                           | Alta       | BR   | Gestores/monitores veem **todos** os tipos de todos os eventos no painel                                              | `tiposCertificadosSSRController.js` L44–52: `whereAtivos = {}`                                                                                 | FR-37, FR-46 |
| BR-03 | `valores_dinamicos` ignorado pelo validador Zod do certificado: sempre removido de `req.body`                                                          | Crítica    | BR   | Toda emissão de certificado com campos dinâmicos falha com HTTP 422 permanente                                        | `validators/certificado.js` L4–9; `middlewares/validate.js` L4                                                                                 | FR-20, FR-54 |
| BR-04 | Emissão de certificado não valida que `tipo_certificado_id` pertence ao mesmo `evento_id`                                                              | Alta       | BR   | Certificado pode ser criado associando tipo de evento A com evento B                                                  | `certificadoService.js` L30–55: nenhuma verificação cruzada                                                                                    | FR-21, FR-45 |
| BR-05 | Algoritmo de geração de código de certificado pode produzir código duplicado após soft delete                                                          | Alta       | BR   | `Certificado.count` com paranoid exclui deletados, causando colisão na constraint `unique` do código                  | `certificadoService.js` L57–68; modelo `certificado.js` L28: `unique: true` sem where                                                          | FR-52        |
| BR-06 | `scopedEvento` usa `req.params.id` (ID do recurso) como ID de evento em operações sem body                                                             | Crítica    | BR   | Para DELETE/POST-by-id, o escopo é verificado contra o ID numérico do recurso em vez do evento                        | `scopedEvento.js` L32–36: `req.body.evento_id \|\| req.params.eventoId \|\| req.params.id`                                                     | FR-37        |
| BR-07 | SSR `detalhe` de certificado usa alias errado `TiposCertificado` (singular) em vez de `TiposCertificados`                                              | Alta       | BR   | `textoInterpolado` é sempre string vazia no detalhe SSR de certificados                                               | `certificadoSSRController.js` L80: `certificado.TiposCertificado?.texto_base`                                                                  | FR-39        |
| BR-08 | API REST permite que monitores restaurem certificados (rota sem restrição adequada de RBAC)                                                            | Alta       | BR   | Monitor pode restaurar qualquer certificado soft-deletado via API, violando FR-22                                     | `routes/certificados.js` L202: `rbac('monitor')` em restore                                                                                    | FR-22, FR-36 |
| BR-09 | `tiposCertificadosController.update` retorna HTTP 200 com corpo `null` quando tipo não encontrado                                                      | Média      | BR   | Cliente recebe resposta de sucesso com body nulo para tipos inexistentes                                              | `tiposCertificadosController.js` L41–48: retorna `res.status(200).json(tipo)` sem checar null                                                  | FR-10        |
| BR-10 | `tiposCertificadosController.delete` retorna HTTP 204 mesmo quando tipo não existe                                                                     | Média      | BR   | DELETE aparece como sucesso para tipos inexistentes; sem feedback de 404                                              | `tiposCertificadosController.js` L51–56: `await delete(id); res.status(204)`                                                                   | FR-10, FR-16 |
| BR-11 | `tiposCertificadosOwnership` é executado **antes** do validador Zod no POST de tipos                                                                   | Média      | BR   | Body não validado (evento_id pode ser null/string) é usado no middleware de ownership                                 | `routes/tipos-certificados.js` L133–141: `tiposCertificadosOwnership` antes de `validate`                                                      | FR-46        |
| BR-12 | Migration `20260418232720` cria constraint `UNIQUE(codigo, evento_id)` sem cláusula `WHERE deleted_at IS NULL`                                         | Alta       | BR   | Restaurar tipo soft-deletado cuja combinação `(codigo, evento_id)` já foi recriada viola a constraint                 | `migrations/20260418232720-add-evento-id-to-tipos-certificados.js` L39–44                                                                      | FR-11, FR-16 |
| GI-01 | `scopedEvento` ausente em rotas GET de tipos-certificados (REST API)                                                                                   | Alta       | GI   | `GET /tipos-certificados` e `GET /tipos-certificados/:id` não filtram por escopo do usuário                           | `routes/tipos-certificados.js` L128–129                                                                                                        | FR-37, FR-46 |
| GI-02 | `novo` e `editar` de certificados (SSR) carregam **todos** os tipos sem filtro de evento                                                               | Média      | GI   | Formulário expõe tipos de outros eventos ao criar/editar certificado via painel                                       | `certificadoSSRController.js` L100–105, L123–127                                                                                               | FR-37, FR-45 |
| GI-03 | API REST PUT de tipos-certificados permite alterar `evento_id` sem validar novo escopo de ownership                                                    | Média      | GI   | Gestor pode mover tipo para outro evento dentro do seu escopo sem validação da nova associação                        | `tiposCertificadosService.js` L28: `tipo.update(data)` inclui `evento_id`; `tiposCertificadosOwnership.js` L51–62 valida apenas o evento atual | FR-45, FR-46 |
| IP-01 | Monitor não pode criar certificados via SSR (SSR exige `rbac('gestor')`), contradizendo FR-36                                                          | Alta       | IP   | Monitor só pode criar certificados via API, funcionalidade SSR bloqueada para este perfil                             | `routes/admin.js` L68: `rbac('gestor')` em `POST /certificados`                                                                                | FR-36, FR-49 |
| IP-02 | SSR lista de tipos **arquivados** também não filtra por escopo de evento                                                                               | Média      | IP   | Tipos soft-deletados de qualquer evento são exibidos a todos os gestores/monitores                                    | `tiposCertificadosSSRController.js` L53–61: `whereArquivados` sem filtro de evento_id                                                          | FR-37        |
| DT-01 | Services usam caminho de import `../../src/models` em vez de `../models`                                                                               | Baixa      | DT   | Caminho funciona apenas pela estrutura atual de diretórios; pode quebrar com reorganização                            | `tiposCertificadosService.js` L2; `certificadoService.js` L2                                                                                   | NFR-6        |
| DT-02 | `pdfService.js` usa duplo fallback de alias `TiposCertificado \|\| TiposCertificados`                                                                  | Baixa      | DT   | Código defensivo obscurece a inconsistência de aliasing existente no domínio                                          | `pdfService.js` L71–72                                                                                                                         | NFR-6        |
| DT-03 | Lógica de ownership de tipo (`getEventosIds`, `temOwnership`) duplicada no SSR controller                                                              | Média      | DT   | Regras de negócio de ownership mantidas em dois lugares independentes                                                 | `tiposCertificadosSSRController.js` L14–37 vs `tiposCertificadosOwnership.js`                                                                  | NFR-6        |
| DT-04 | Falha de `JSON.parse` em `dados_dinamicos_json` no SSR expõe mensagem bruta ao usuário                                                                 | Baixa      | DT   | Mensagem de erro genérica do runtime chega via `req.flash('error', error.message)`                                    | `tiposCertificadosSSRController.js` L165: `JSON.parse(req.body.dados_dinamicos_json \|\| '{}')`                                                | NFR-6        |
| VA-01 | `authSSR` retorna plain object sem métodos Sequelize; middlewares `scopedEvento` e `tiposCertificadosOwnership` falhariam com HTTP 500 em contexto SSR | Alta       | VA   | Impede reuso correto dos middlewares de escopo/ownership no canal SSR; forçou reimplementação no controller           | `authSSR.js` L46–54: plain object; `scopedEvento.js` L5–8; `tiposCertificadosOwnership.js` L29–32                                              | NFR-6        |
| VA-02 | Regra de negócio de validação de `campo_destaque` implementada em hook Sequelize `beforeValidate`                                                      | Média      | VA   | Lógica de domínio no model viola camada correta (service/validator); hook lança `Error` não-Sequelize ValidationError | `tipos_certificados.js` L75–82                                                                                                                 | NFR-6, FR-14 |
| ID-01 | FR-46 especifica restrição de mutações para gestor mas não define escopo de visualização para monitores                                                | —          | ID   | Ambiguidade se monitores devem ver apenas tipos dos seus eventos ou todos os tipos do sistema                         | `docs/especificacoes.md` FR-46 vs FR-37                                                                                                        | FR-46, FR-37 |
| ID-02 | FR-11 define unicidade `(codigo, evento_id) WHERE deleted_at IS NULL` mas migration não implementa cláusula WHERE                                      | —          | ID   | Divergência entre especificação formal e implementação na migration                                                   | `docs/especificacoes.md` FR-11; `migrations/20260418232720-add-evento-id-to-tipos-certificados.js`                                             | FR-11        |
| AM-01 | Estrutura interna de `dados_dinamicos` (chave → rótulo) não está formalmente documentada no SRS                                                        | —          | AM   | Clientes da API não têm contrato formal sobre o formato esperado; UI assume `{chave: rotulo}`                         | `views/admin/tipos-certificados/form.hbs` L93–97 vs `validators/tipos_certificados.js` L8: `z.record(z.any())`                                 | FR-15        |
| AM-02 | Preview do `texto_base` no formulário SSR usa o rótulo do campo como valor de substituição                                                             | —          | AM   | Preview não representa fielmente o conteúdo interpolado real; pode confundir durante configuração                     | `views/admin/tipos-certificados/form.hbs` L128: `obj[chave] = '[${rotulo \|\| chave}]'`                                                        | FR-13        |

---

## 2. Achados Críticos

### BR-03 — `valores_dinamicos` sempre removido pelo validador Zod no create de certificado

**Severidade:** Crítica  
**Tipo:** Bug Real

**Evidência:**

```js
// src/validators/certificado.js
const certificadoSchema = z.object({
  nome: z.string().min(3),
  status: z.enum(['emitido', 'pendente', 'cancelado']),
  participante_id: z.number().int(),
  evento_id: z.number().int(),
  tipo_certificado_id: z.number().int(),
  // ← valores_dinamicos AUSENTE
})
```

```js
// src/middlewares/validate.js
req.body = schema.parse(req.body) // Zod no modo padrão strip: remove campos não declarados
```

```js
// src/services/certificadoService.js  L49–55
const valoresRecebidos = data.valores_dinamicos || {} // sempre {} após strip do Zod
const camposFaltantes = camposEsperados.filter((c) => !(c in valoresRecebidos))
if (camposFaltantes.length > 0) {
  /* HTTP 422 */
}
```

**Impacto:** Qualquer tipo de certificado com `dados_dinamicos` preenchido torna **impossível** a emissão via API REST. O cliente envia `valores_dinamicos`, o Zod remove o campo antes de atingir o service, e o service detecta todos os campos como faltantes, retornando HTTP 422 permanentemente. O sistema é funcionalmente quebrado para o caso de uso principal FR-20 e FR-54.

**FR afetado:** FR-20, FR-54

---

### BR-06 — `scopedEvento` confunde ID do recurso com ID do evento

**Severidade:** Crítica  
**Tipo:** Bug Real / Vulnerabilidade

**Evidência:**

```js
// src/middlewares/scopedEvento.js  L32–36
const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
if (eventoId && eventosIds.includes(Number(eventoId))) {
  return next()
}
return res.status(403).json({ error: 'Acesso restrito ao evento vinculado.' })
```

Para `DELETE /certificados/5`:

- `req.body.evento_id` → `undefined` (DELETE não tem body)
- `req.params.eventoId` → `undefined`
- `req.params.id` → `'5'` (ID do **certificado**, não do evento)

O middleware passa se `eventosIds.includes(5)`, ou seja, se o gestor/monitor gerencia o evento de ID 5 — independente de qual evento o certificado ID 5 pertence.

**Impacto dual:**

1. **Falsos negativos de acesso:** Um gestor do evento 1 não consegue deletar o certificado 5 (se 5 não está em seus eventos), mesmo que pertença ao seu evento. Operações de remoção tornam-se praticamente não funcionais para gestores/monitores em casos onde o ID do certificado não coincide com o ID do evento.
2. **Falsos positivos de acesso:** Um gestor do evento 5 pode tentar deletar o certificado 5 mesmo que esse certificado pertença ao evento 1.

**FR afetado:** FR-37, NFR-1

---

### BR-02 — SSR `index` de tipos-certificados expõe todos os tipos a qualquer usuário

**Severidade:** Alta  
**Tipo:** Bug Real (Violação Multi-tenant)

**Evidência:**

```js
// src/controllers/tiposCertificadosSSRController.js  L40–61
async function index(req, res) {
  const eventosIds = await getEventosIds(req.usuario)  // retorna [1, 2] para gestor
  const whereAtivos = {}                               // ← NUNCA usa eventosIds
  const whereArquivados = { deleted_at: { [Op.ne]: null } }

  const ativos = await TiposCertificados.findAll({
    where: whereAtivos,  // ← consulta sem filtro de evento
    ...
  })
```

`eventosIds` é obtido mas **nunca usado** na cláusula `where` da consulta. O gestor do evento A vê os tipos do evento B (e de todos os demais), violando o isolamento multi-tenant.

**FR afetado:** FR-37, FR-46, NFR-1

---

### BR-07 — Detalhe SSR de certificado sempre exibe texto interpolado vazio

**Severidade:** Alta  
**Tipo:** Bug Real

**Evidência:**

```js
// src/controllers/certificadoSSRController.js  L79–83
const textoInterpolado = templateService.interpolate(
  certificado.TiposCertificado?.texto_base || '', // ← alias SINGULAR (errado)
  certificado.valores_dinamicos || {},
  certificado.nome,
)
```

O include definido na mesma classe usa o alias correto:

```js
// L13–17
{
  model: TiposCertificados,
  as: 'TiposCertificados',   // ← alias PLURAL
  attributes: ['id', 'descricao', 'texto_base', 'dados_dinamicos'],
}
```

O Sequelize popula `certificado.TiposCertificados` (plural), mas o código acessa `certificado.TiposCertificado` (singular), que é sempre `undefined`. Resultado: `textoInterpolado` é sempre `''` no painel SSR.

**FR afetado:** FR-39

---

### BR-08 — API REST permite que monitor restaure certificados (deve ser exclusivo ao admin)

**Severidade:** Alta  
**Tipo:** Bug Real (Violação de RBAC)

**Evidência:**

```js
// src/routes/certificados.js  L200–207
router.post(
  '/:id/restore',
  auth,
  rbac('monitor'), // ← monitor pode restaurar
  scopedEvento,
  certificadoController.restore,
)
```

SSR (comportamento correto):

```js
// src/routes/admin.js  L196–199
router.post(
  '/certificados/:id/restaurar',
  rbac('admin'), // ← apenas admin
  certificadoSSRController.restaurar,
)
```

**FR afetado:** FR-22 ("apenas admin pode restaurar via SSR")

---

## 3. Problemas Arquiteturais

### VA-01 — `authSSR` retorna plain object; middlewares de domínio assumem instância Sequelize

**Evidência:**

```js
// src/middlewares/authSSR.js  L46–54
const usuarioData = {
  id: usuario.id,
  nome: usuario.nome,
  perfil: usuario.perfil,
  isAdmin: usuario.perfil === 'admin',
  isGestor: usuario.perfil === 'gestor',
}
req.usuario = usuarioData // ← plain object, SEM métodos Sequelize
```

```js
// src/middlewares/tiposCertificadosOwnership.js  L29–32
if (typeof usuario.getEventos !== 'function') {
  return res
    .status(500)
    .json({ error: 'Usuário sem método getEventos (modelo N:N)' })
}
```

A **consequência arquitetural** é que `tiposCertificadosOwnership` e `scopedEvento` **só podem ser usados em rotas API** (onde `auth.js` carrega a instância Sequelize completa). Para rotas SSR, é necessário reimplementar a mesma lógica no controller (ver `getEventosIds`/`temOwnership` em `tiposCertificadosSSRController.js`). Isso resulta em duplicação de regra de negócio, testabilidade reduzida e risco de divergência.

**NFR afetado:** NFR-6

---

### VA-02 — Validação cross-field (`campo_destaque`) em hook Sequelize model

**Evidência:**

```js
// src/models/tipos_certificados.js  L74–82
TiposCertificados.addHook('beforeValidate', (instance) => {
  const value = instance.campo_destaque
  if (value === 'nome') return
  const dados = instance.dados_dinamicos || {}
  if (!Object.keys(dados).includes(value)) {
    throw new Error(
      'campo_destaque deve ser "nome" ou uma chave de dados_dinamicos',
    )
  }
})
```

O hook lança `Error` genérico (não `Sequelize.ValidationError`), o que:

1. Viola a arquitetura em camadas (NFR-6): lógica de domínio no model em vez de no service ou validator;
2. Produz mensagens de erro com formato inconsistente (o restante das validações Sequelize usa `ValidationError`);
3. O erro é capturado no controller como `error.message` e retornado como HTTP 400 sem distinção clara.

**NFR afetado:** NFR-6

---

### Problema arquitetural transversal — Duplicação da lógica de ownership em dois locais

A regra "gestor só acessa tipos do seu evento" existe em:

- `src/middlewares/tiposCertificadosOwnership.js` (para API)
- `src/controllers/tiposCertificadosSSRController.js`: funções `getEventosIds()` e `temOwnership()` (para SSR)

Essas duas implementações são independentes e não compartilham código. Qualquer mudança de regra precisa ser replicada em ambos os lugares. BR-02 é evidência de que as duas implementações já divergiram: o middleware SSR implementa corretamente o ownership para editar/deletar individualmente mas omite o filtro na listagem geral.

---

## 4. Divergências API vs SSR

| Comportamento                                 | API REST                                            | SSR Admin                                                    | Conformidade FR                                                          |
| --------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Visualização de tipos-certificados (listagem) | Sem filtro de escopo (sem `scopedEvento`)           | Sem filtro de escopo (`whereAtivos = {}`)                    | Ambos violam FR-37                                                       |
| Criação de certificados por monitor           | Permitida (`rbac('monitor')` em POST /certificados) | **Bloqueada** (`rbac('gestor')` em POST /admin/certificados) | API conforme FR-36; SSR viola FR-36                                      |
| Restauração de certificados                   | Monitor pode restaurar (`rbac('monitor')`)          | Somente admin (`rbac('admin')`)                              | API viola FR-22; SSR conforme FR-22                                      |
| Cancelamento de certificados                  | Monitor pode cancelar (`rbac('monitor')`)           | Gestor pode cancelar (`rbac('gestor')`)                      | API mais permissiva (sem FR explícito para nível mínimo de cancelamento) |
| Texto interpolado no detalhe do certificado   | Não exposto diretamente pela API                    | Sempre vazio (bug BR-07)                                     | SSR viola FR-39                                                          |
| Tipo de certificado incluso no PDF            | `as: 'TiposCertificados'` (plural)                  | N/A (pdf via API)                                            | Funcional para geração PDF                                               |
| Scoping de visualização por evento            | Service aceita `eventoId` mas controller não passa  | Index não aplica filtro                                      | Ambos violam FR-37                                                       |

---

## 5. Atualizações Recomendadas no SRS

### 5.1 Clarificar escopo de visualização de tipos-certificados para monitores

**Lacuna em:** FR-46, FR-37

FR-46 define apenas restrições de **mutação** para gestores e monitores. FR-37 define comportamento de `scopedEvento` mas não referencia explicitamente o recurso `tipos-certificados`. **Ambiguidade:** Monitores devem ver somente tipos dos eventos aos quais estão vinculados, ou todos os tipos do sistema?

**Sugestão:** Adicionar FR-46a: "Gestores e monitores só podem visualizar tipos de certificados vinculados aos eventos do seu escopo."

---

### 5.2 Definir formalmente a estrutura de `dados_dinamicos`

**Lacuna em:** FR-15

FR-15 afirma que `dados_dinamicos` define a estrutura de campos do tipo, mas não especifica o formato do objeto JSONB. A UI assume `{ chave: rótulo }` (string → string). Nada no SRS documenta isso.

**Sugestão:** Expandir FR-15 para especificar: `dados_dinamicos` é um objeto JSONB cujas chaves são identificadores dos campos dinâmicos (usados como placeholders em `texto_base` e como chaves em `valores_dinamicos`) e cujos valores são os rótulos descritivos exibidos durante o preenchimento do certificado.

---

### 5.3 Definir RBAC de cancelamento de certificados via API

**Lacuna em:** FR-35, FR-36

FR-35 diz que gestores podem "cancelar certificados". FR-36 diz que monitores podem "criar certificados". Nenhum FR define explicitamente o nível mínimo de RBAC para o cancelamento via API REST. A implementação atual (`rbac('monitor')`) é mais permissiva que a SSR.

**Sugestão:** Adicionar à seção de RBAC: nível mínimo para cancelar via API é `gestor`.

---

### 5.4 Esclarecer comportamento de código de certificado após soft delete

**Lacuna em:** FR-52

FR-52 define o formato do código mas não especifica o que acontece quando certificados são deletados e novos são criados. A implementação usa `COUNT` (paranoid) + 1, o que pode colidir com códigos de registros soft-deletados.

**Sugestão:** Adicionar cláusula: "O número incremental N é calculado sobre o total de certificados existentes (incluindo soft-deletados) de modo a garantir unicidade do código."

---

### 5.5 Definir comportamento de restauração de `tipos_certificados` com conflito de código

**Lacuna em:** FR-16, FR-11

FR-11 exige unicidade `(codigo, evento_id) WHERE deleted_at IS NULL`. FR-16 garante que tipos podem ser restaurados. Não há especificação do comportamento quando o restore falha por conflito de código.

**Sugestão:** Adicionar: "Ao restaurar um tipo de certificado cujo `(codigo, evento_id)` já exista em um registro ativo, o sistema deve retornar HTTP 409 com mensagem descritiva."

---

## 6. Itens para Validação Humana

### H-01 — `campo_destaque` deve aceitar apenas chaves de `dados_dinamicos` ou também `nomeCompleto`?

FR-14 diz que `campo_destaque` deve ser `"nome"` ou uma chave de `dados_dinamicos`. O campo `nome` no certificado é preenchido a partir de `certificado.nome` OR `participante.nomeCompleto` (FR-39). Existe lógica no PDF que interpola `nome` como `certificado.nome || participante.nomeCompleto`. Porém: o `campo_destaque` `"nome"` refere-se literalmente ao campo `nome` do certificado ou ao `nomeCompleto` do participante? Isso afeta qual valor é exibido em destaque no certificado.

**Decisão requerida:** Confirmar a semântica exata de `campo_destaque = "nome"` — e se outros campos fixos do sistema (ex.: `evento`) devem ser permitidos como campo destaque.

---

### H-02 — Monitores devem poder ver tipos de outros eventos via SSR?

Conforme identificado em BR-02 e GI-01, a listagem não filtra por escopo. Antes de corrigir, é necessária confirmação de regra de negócio:

**Decisão requerida:** Monitores e gestores devem ver SOMENTE tipos dos seus eventos, ou qualquer usuário autenticado pode ver TODOS os tipos (para fins de referência, por exemplo)?

---

### H-03 — `restore` de tipos-certificados deve ser permitido ao gestor ou somente ao admin?

A rota SSR `/tipos-certificados/:id/restaurar` exige `rbac('gestor')`. A API `POST /tipos-certificados/:id/restore` também exige `rbac('gestor')`. Existe consistência entre SSR e API, mas FR não especifica explicitamente esse nível de permissão para restore de tipos. Para certificados, FR-22 restringe restore ao admin via SSR.

**Decisão requerida:** Confirmar se gestores podem restaurar tipos soft-deletados, ou se isso deve ser restrito ao admin.

---

### H-04 — O preview do `texto_base` no formulário SSR deve usar valores reais ou placeholders?

O preview em `form.hbs` substitui `${campo}` pelo rótulo do campo (`[rotulo]`), não por um valor real. Isso pode induzir o usuário a acreditar que os campos são substituídos pelo rótulo em vez do valor real em tempo de emissão.

**Decisão requerida:** Confirmar se o comportamento atual do preview (usando rótulo como valor de exemplo) é intencional ou se deve usar valores de exemplo distintos dos rótulos.

---

### H-05 — O `evento_id` de um tipo-certificado deve ser imutável após criação?

FR-45 diz que `evento_id` é obrigatório e define o contexto. A API PUT permite alterar `evento_id` (passado no body, validado pelo Zod, aplicado no update). O formulário SSR omite o campo evento na edição. Há uma inconsistência de design não especificada:

**Decisão requerida:** Confirmar se `evento_id` de um tipo deve ser imutável após criação, e se houver intenção de imutabilidade, se deve ser enforced na API.

---

## 7. Iniciativas Futuras de Spec

### Spec-Future-01 — Sistema de preview de certificado em tempo real

O formulário SSR para `texto_base` possui um preview rudimentar baseado em JavaScript cliente. Uma iniciativa futura poderia especificar um endpoint de preview server-side (`POST /tipos-certificados/preview`) que recebe `texto_base` + `valores_dinamicos` de exemplo e retorna o texto interpolado pelo `templateService` real — garantindo fidelidade 100% entre preview e output.

---

### Spec-Future-02 — Validação formal de placeholders em `texto_base`

Atualmente, placeholders do tipo `${campo_inexistente}` em `texto_base` passam silenciosamente sem substituição (FR-39: "Placeholders sem correspondência são mantidos sem substituição"). Uma iniciativa futura poderia definir um endpoint ou hook de validação que alerte o criador do tipo quando `texto_base` contém placeholders não definidos em `dados_dinamicos` ou que não são campos reservados (`nome`, `evento`).

---

### Spec-Future-03 — Registro de auditoria de mudanças em tipos de certificados

Alterações em `texto_base`, `campo_destaque` ou `dados_dinamicos` de um tipo afetam retroativamente a renderização de **todos** os certificados emitidos com esse tipo. Não existe soft-versioning ou histórico. Uma iniciativa futura poderia especificar imutabilidade de tipos após uso (ao existirem certificados vinculados) ou versionamento de tipos.

---

### Spec-Future-04 — Índice parcial `WHERE deleted_at IS NULL` na migration

Os modelos Sequelize definem índices parciais (`where: { deleted_at: null }`) mas as migrations não reproduzem essa cláusula. Uma iniciativa futura deveria especificar um padrão de migration para índices parciais com paranoid, aplicável a todos os modelos com soft delete.

---

### Spec-Future-05 — Spec de template injection e sanitização de `valores_dinamicos`

`valores_dinamicos` é JSONB com `z.record(z.any())` — qualquer tipo de valor é aceito. Para geração PDF, o `templateService` interpola diretamente valores sem sanitização. Uma spec futura poderia definir: tipos permitidos para valores dinâmicos (ex.: apenas strings), tamanho máximo de cada campo e lista de caracteres proibidos para evitar degradação do layout PDF.

---

## 8. Conclusão Arquitetural do Domínio

O domínio de **tipos de certificados e templates** apresenta uma implementação parcialmente funcional com **dois bugs críticos** que comprometem funcionalidades centrais do sistema:

1. **A emissão de certificados com campos dinâmicos é permanentemente impossível via API** (BR-03 — `valores_dinamicos` removido pelo Zod) — impacta diretamente FR-20 e FR-54, casos de uso centrais do sistema;
2. **O middleware `scopedEvento` é estruturalmente incorreto para operações DELETE/POST-by-id**, confundindo ID de recurso com ID de evento (BR-06) — compromete toda a estratégia de isolamento multi-tenant definida em FR-37.

Do ponto de vista arquitetural, o domínio apresenta um **problema sistêmico de dualidade de superfícies API/SSR** sem estratégia unificada de ownership/scoping:

- `authSSR` retorna plain object incompatível com os middlewares de ownership;
- A lógica de ownership é duplicada no controller SSR;
- O filtro de escopo por evento existe em alguns pontos mas é ignorado em outros (listagem geral);
- As duas superfícies (API e SSR) divergem em RBAC (restore, create por monitor) sem especificação clara.

O modelo de datos `TiposCertificados` está corretamente estruturado (paranoid, índice composto, hook `beforeValidate`), mas a **migration correspondente não implementa o índice parcial `WHERE deleted_at IS NULL`** especificado em FR-11, criando uma discrepância entre o schema do ORM e o schema real do banco.

A camada de serviços é funcionalmente simples mas **apresenta dívida técnica de caminhos de import** e **ausência de validação cruzada entre tipo e evento** na emissão de certificados (BR-04).

O domínio necessita de correções em **5 bugs de alta prioridade** (BR-01 a BR-08 excluindo os já listados como críticos) e da resolução dos 2 bugs críticos antes de estar em conformidade com os FRs documentados.

---

_Relatório gerado em 2026-05-09 19:37 (BRT)_
