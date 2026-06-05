# Auditoria do Domínio de Certificados

**Data:** 2026-05-09
**Auditor:** GitHub Copilot (GPT-4.1)

---

## Inconsistências encontradas

1. **`scopedEvento` não restringe corretamente certificados na API**
   - Em listagem, injeta `evento_id` na query, mas o service ignora esse filtro.
   - Em rotas com `:id`, trata o id do certificado como se fosse `evento_id`.
   - Resultado: gestores/monitores podem listar/acessar certificados fora do escopo.
   - **Evidências:**
     - [src/middlewares/scopedEvento.js](../../../../src/middlewares/scopedEvento.js#L20-L36)
     - [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L11-L29)
     - [src/routes/certificados.js](../../../../src/routes/certificados.js#L164-L213)

2. **A API remove `valores_dinamicos` no validate e exige `status` no create**
   - Impede cumprir FR-20/FR-54 (campos dinâmicos) e contradiz FR-19 (status padrão `emitido`).
   - **Evidências:**
     - [src/validators/certificado.js](../../../../src/validators/certificado.js#L1-L9)
     - [src/middlewares/validate.js](../../../../src/middlewares/validate.js#L1-L13)
     - [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L45-L56)

3. **`update`/`delete`/`restore`/`cancel` na API não retornam 404 quando o registro não existe**
   - Devolvem 200/204 com `null` ou vazio, apesar do swagger indicar 404.
   - **Evidências:**
     - [src/controllers/certificadoController.js](../../../../src/controllers/certificadoController.js#L39-L73)
     - [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L75-L92)

4. **No SSR, as rotas de certificados não aplicam escopo por evento (apenas `rbac`)**
   - Handlers como detalhe/novo/editar/criar/atualizar/cancelar/deletar/restaurar buscam por id sem validar vínculo do usuário.
   - Gestor/monitor pode operar fora do escopo.
   - **Evidências:**
     - [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L76-L258)
     - [src/routes/admin.js](../../../../src/routes/admin.js#L146-L178)

5. **Em detalhe SSR, o código usa `TiposCertificado` (singular) e tende a gerar texto interpolado vazio**
   - O include é `TiposCertificados` (plural).
   - **Evidência:** [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L85-L90)

6. **API permite `restore` com `rbac('monitor')`, enquanto a spec limita restauração ao admin via SSR**
   - **Evidências:**
     - [src/routes/certificados.js](../../../../src/routes/certificados.js#L201-L213)
     - [src/routes/admin.js](../../../../src/routes/admin.js#L176-L178)

---

## Pontos de atenção

- **Soft delete:** `destroy()` em certificados é lógico (`paranoid`), e o SSR lista arquivados com `paranoid: false` + `deleted_at` não nulo. Implementado, mas precisa alinhamento explícito com a spec.
  - **Evidências:** [src/models/certificado.js](../../../../src/models/certificado.js#L55-L60), [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L50-L55)

- **Geração do código:** usa `count + 1` sem transação; concorrência pode gerar colisão de `codigo` e falha por `unique`.
  - **Evidências:** [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L58-L73), [src/models/certificado.js](../../../../src/models/certificado.js#L29-L33)

- **Soft-deletes e código:** certificados soft-deletados não são considerados no `count`, podendo tentar reutilizar o mesmo `codigo` e conflitar com a `unique`.
  - **Evidências:** [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L63-L73), [src/models/certificado.js](../../../../src/models/certificado.js#L29-L33)

- **Comportamento dos métodos:**
  - `create` usa o service (gera código e valida `dados_dinamicos`)
  - `update` atualiza direto no model sem validação de campos dinâmicos
  - `cancel` só altera `status`
  - `delete` faz soft delete
  - `restore` reativa
  - O comportamento é consistente no código, mas não está explicitado na spec como regra operacional.
  - **Evidências:** [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L30-L92), [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L148-L258)

- **Consultas públicas:** (`/api/certificados?email` e `/api/validar/:codigo`) retornam certificados independente de `status` (inclusive `cancelado`). Não está documentado.
  - **Evidências:** [src/routes/api.js](../../../../src/routes/api.js#L103-L171)

---

## Itens para validação humana

- A consulta pública deve retornar certificados `cancelado`/`pendente`, ou só `emitido`?
- A visão SSR de certificados deve respeitar `scopedEvento` (ou uma regra equivalente) para todos os handlers, não só listagem?
- A API pode permitir `restore` para monitor/gestor, ou deve seguir a mesma restrição do SSR?
- Para API, `status` deve ser opcional (default `emitido`) e `valores_dinamicos` deve ser obrigatório quando o tipo exigir?
- `TiposCertificados` deve ser listado apenas por evento do usuário ou é deliberadamente global no GET?

---

## Sugestões de atualização documental

- Documentar o payload/retorno paginado `{ data, meta }` das listagens de certificados e tipos.
  - **Evidências:** [src/services/certificadoService.js](../../../../src/services/certificadoService.js#L11-L25), [src/services/tiposCertificadosService.js](../../../../src/services/tiposCertificadosService.js#L1-L20)

- Registrar que no SSR o `nome` pode ser auto-preenchido a partir de `participante.nomeCompleto` quando vazio, e que `valores_dinamicos` vem de `valores_dinamicos_json`.
  - **Evidências:** [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L148-L205)

- Especificar o comportamento de soft delete e restauração no painel (listagem de arquivados), já que existe UI para isso.
  - **Evidência:** [src/controllers/certificadoSSRController.js](../../../../src/controllers/certificadoSSRController.js#L50-L55)

- Clarificar se a consulta pública deve filtrar por `status` e se certificados cancelados são “válidos” para download/validação.
  - **Evidências:** [src/routes/api.js](../../../../src/routes/api.js#L103-L171)

- Se for desejado, documentar a validação de formato do código na rota SSR `/validar/:codigo` (regex) e a ausência de validação equivalente na API.
  - **Evidência:** [src/routes/public.js](../../../../src/routes/public.js#L63-L116)

---

> Caso desejado, é possível detalhar cada rota específica com fluxos reais (request/response) e mapear contra os FRs correspondentes.
