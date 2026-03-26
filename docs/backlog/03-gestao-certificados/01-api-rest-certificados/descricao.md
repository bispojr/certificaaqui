# Feature: API REST de Certificados

## Descrição

Endpoints JSON para emissão, consulta, cancelamento, restauração e listagem paginada de certificados.
O service base já existe. Faltam paginação na listagem e validação de `valores_dinamicos` na criação.

## Tasks (alto nível — apenas pendentes)

✅ Adicionar paginação em `certificadoService.findAll` usando `findAndCountAll` com resposta `{ data, meta }` e propagar no controller via `req.query.page`/`perPage`
✅ Atualizar teste unitário de `certificadoService.findAll` para o novo contrato paginado

✅ Validar `valores_dinamicos` contra `dados_dinamicos` do `TiposCertificados` em `certificadoService.create`, lançando erro com `camposFaltantes` se houver campos faltando
✅ Propagar `statusCode` (422) e `camposFaltantes` no `certificadoController.create`

- Criar testes de `certificadoService.create` cobrindo tipo inexistente, campos faltantes e criação com sucesso

## Arquivos base

- `src/services/certificadoService.js`
- `src/controllers/certificadoController.js`
- `tests/services/certificadoService.test.js`
- `src/models/certificado.js` (campo `valores_dinamicos: JSONB`)
- `src/models/tipos_certificados.js` (campo `dados_dinamicos: JSONB` — chaves = campos exigidos)

## Dependências

### Externas (de outras features)

Nenhuma — os models `certificado`, `tipos_certificados` e `participante` já existem.

### Internas (ordem entre tasks desta feature)

- CERT-API-001 → CERT-API-002 — o teste paginado (002) verifica o contrato `{ data, meta }` introduzido em 001
- CERT-API-003 → CERT-API-004 — a propagação de `statusCode 422` (004) depende do erro com `camposFaltantes` lançado em 003
- CERT-API-003 → CERT-API-005 — os testes de create (005) cobrem a validação implementada em 003
- 001 e 003 podem ser executadas em paralelo
