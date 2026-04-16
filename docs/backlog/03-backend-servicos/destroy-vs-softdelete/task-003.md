# TASK ID: BACK-EVT-003

## Título

Atualizar testes de `eventoService`, `eventoSSRController` e `eventoController` para a nova nomenclatura `softDelete`

## Tipo

teste

## Dependências

- BACK-EVT-001 (`softDelete` criado, `destroy` removido)
- BACK-EVT-002 (controllers atualizados)

## Objetivo

Atualizar os três arquivos de teste que referenciam `eventoService.delete` ou `eventoService.destroy` para usar a nova nomenclatura `softDelete`, e adicionar cobertura para o método `destroy` que foi removido.

## Arquivos envolvidos

- `tests/services/eventoService.test.js` ← renomear bloco `delete` → `softDelete`, remover bloco `destroy`
- `tests/controllers/eventoSSRController.test.js` ← atualizar mocks de `delete`
- `tests/controllers/eventoController.test.js` ← atualizar mock de `delete`

## Passos

### 1. `tests/services/eventoService.test.js`

**Remover** o `describe('destroy', ...)` inteiro (linhas ~115-135 que testam `eventoService.destroy(1)`).

**Renomear** o `describe('delete', ...)` para `describe('softDelete', ...)`.

**Substituir** as chamadas `eventoService.delete(...)` por `eventoService.softDelete(...)` dentro desse bloco:

```js
// Antes:
await eventoService.delete(1)
// Depois:
await eventoService.softDelete(1)

// Antes:
const result = await eventoService.delete(999)
// Depois:
const result = await eventoService.softDelete(999)
```

### 2. `tests/controllers/eventoSSRController.test.js`

Localizar os testes de `deletar` (linhas ~186-200). O mock está como:

```js
eventoService.delete.mockResolvedValue({})
```

Substituir por:

```js
eventoService.softDelete.mockResolvedValue({})
```

Fazer o mesmo para o teste de erro:

```js
eventoService.delete.mockRejectedValue(new Error('erro'))
```

→

```js
eventoService.softDelete.mockRejectedValue(new Error('erro'))
```

### 3. `tests/controllers/eventoController.test.js`

Localizar o teste "deve deletar um evento" (~linha 90):

```js
eventoService.delete.mockResolvedValue()
```

Substituir por:

```js
eventoService.softDelete.mockResolvedValue()
```

## Verificação final

Após as alterações, executar:

```bash
npx jest tests/services/eventoService.test.js \
         tests/controllers/eventoSSRController.test.js \
         tests/controllers/eventoController.test.js
```

Todos devem passar.

Em seguida:

```bash
npm run check
```

## Resultado esperado

- `grep "eventoService.delete\|eventoService.destroy" tests/` retorna zero resultados
- Todos os testes dos três arquivos passam

## Critério de aceite

- Nenhum arquivo de teste referencia `eventoService.delete` ou `eventoService.destroy`
- Os testes de `softDelete` cobrem: sucesso com cascata em `UsuarioEvento` e retorno null quando evento não existe
- `npm run check` passa
