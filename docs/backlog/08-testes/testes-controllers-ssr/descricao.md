# Feature: Complemento de Cobertura nos Testes de Controllers SSR

## Identificador da feature
testes-controllers-ssr

## Domínio
08 — Testes

## Prioridade
ALTA

## Situação real

Os controllers SSR **já possuem testes** criados em `/tests/controllers/`. O item do backlog original estava incorreto ao afirmar ausência total.

Cobertura existente confirmada:

| Controller | Funções cobertas |
|---|---|
| `certificadoSSRController` | index (admin), detalhe, novo, editar, criar, atualizar, cancelar, deletar |
| `usuarioSSRController` | index, novo, editar, criar, atualizar, deletar |
| `eventoSSRController` | index, novo, editar, criar, atualizar, deletar, restaurar |
| `participanteSSRController` | (verificar escopo atual) |

---

## Lacunas identificadas

### `certificadoSSRController.test.js`

1. **`index` com filtros ativos** — o teste existente cobre apenas admin sem filtros. Faltam cenários com `?q=`, `?evento_id=`, `?tipo_id=`, `?status=`.
2. **`index` para gestor escopado** — sem teste do caminho gestor (onde `eventoIds` limita a query).
3. **`criar` com erro de duplicata (409)** — `certificadoService.create` pode lançar erro 409; o controller deve exibir flash de erro e redirecionar de volta ao formulário.

### `usuarioSSRController.test.js`

4. **`index` com busca `?q=`** — o teste existente não cobre o fluxo de busca por texto (após implementação de FRONT-BUSCA-003).
5. **`restaurar`** — ausente nos testes existentes (confirmado pelos `describe` listados).

### `participanteSSRController.test.js`

6. **Verificar cobertura atual** — `tests/controllers/participanteSSRController.test.js` existe; fazer audit dos cenários cobertos, comparar com o controller real e identificar gaps.

---

## Escopo desta feature

1. Adicionar testes de filtros ao `certificadoSSRController.test.js`
2. Adicionar teste de criar com conflito 409 ao `certificadoSSRController.test.js` (ou ao arquivo separado `certificadoSSRController.create.test.js` que já existe)
3. Adicionar testes de `restaurar` e `index?q=` ao `usuarioSSRController.test.js`
4. Auditar `participanteSSRController.test.js` e cobrir gaps

---

## Critérios de aceite

- [ ] `certificadoSSRController` tem testes para `index` com filtros e para gestor escopado.
- [ ] `certificadoSSRController.criar` tem teste para o caminho de erro 409.
- [ ] `usuarioSSRController` tem testes para `restaurar` e para `index?q=`.
- [ ] `participanteSSRController` auditado e gaps documentados/cobertos.
- [ ] `npm run check` passa após todos os novos testes.
