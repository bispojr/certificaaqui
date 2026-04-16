# TASK ID: BACK-EVT-002

## Título

Atualizar `eventoSSRController.js` e `eventoController.js` para chamar `softDelete()`

## Tipo

código

## Dependências

- BACK-EVT-001 (`eventoService.softDelete` existe)

## Objetivo

Substituir todas as chamadas a `eventoService.delete()` por `eventoService.softDelete()` nos dois controllers.

## Contexto

Callers confirmados via grep:

| Arquivo                                  | Linha | Chamada atual                               |
| ---------------------------------------- | ----- | ------------------------------------------- |
| `src/controllers/eventoSSRController.js` | ~108  | `await eventoService.delete(req.params.id)` |
| `src/controllers/eventoController.js`    | ~47   | `await eventoService.delete(req.params.id)` |

## Arquivos envolvidos

- `src/controllers/eventoSSRController.js` ← alterar
- `src/controllers/eventoController.js` ← alterar

## Passos

### `eventoSSRController.js`

Localizar o método `deletar`:

```js
async deletar(req, res) {
  try {
    await eventoService.delete(req.params.id)
```

Substituir por:

```js
async deletar(req, res) {
  try {
    await eventoService.softDelete(req.params.id)
```

### `eventoController.js`

Localizar a chamada equivalente:

```js
await eventoService.delete(req.params.id)
```

Substituir por:

```js
await eventoService.softDelete(req.params.id)
```

## Resultado esperado

- `grep "eventoService.delete" src/controllers/` retorna zero resultados
- `grep "eventoService.softDelete" src/controllers/` retorna 2 resultados (um por arquivo)
- A lógica de soft delete com cascata em `UsuarioEvento` continua funcionando

## Critério de aceite

- Nenhum controller chama `eventoService.delete()` ou `eventoService.destroy()`
- Ambos os controllers chamam `eventoService.softDelete()`
- `npm run check` pode ainda falhar até BACK-EVT-003 (mocks de testes) ser aplicada
