# TASK ID: ADMIN-EVT-002

## Título

Atualizar `eventoService.test.js` para as correções de cascata em `delete` e `restore`

## Objetivo

Atualizar o mock de `UsuarioEvento` de `{ update }` para `{ destroy, restore }`, corrigir o teste de `delete` para verificar `UsuarioEvento.destroy`, e adicionar teste do comportamento de cascata em `restore`.

## Contexto

- `tests/services/eventoService.test.js` linha 13: `UsuarioEvento: { update: jest.fn() }` — após ADMIN-EVT-001, o service usa `destroy` e `restore`, não `update`
- Teste de `delete` (linha 19-33) verifica `eventoMock.destroy` mas NÃO verifica `UsuarioEvento.destroy` — deve ser atualizado
- Teste de `restore` (linhas 81-93) verifica `mockEvento.restore` mas NÃO verifica `UsuarioEvento.restore` — deve ser adicionado
- Executar APÓS ADMIN-EVT-001

## Arquivos envolvidos

- `tests/services/eventoService.test.js`

## Passos

### 1. Atualizar o mock de `UsuarioEvento`:

Substituir:

```js
  UsuarioEvento: {
    update: jest.fn(),
  },
```

Por:

```js
  UsuarioEvento: {
    destroy: jest.fn(),
    restore: jest.fn(),
  },
```

### 2. Atualizar o teste de `delete` para verificar cascata:

Substituir o describe de `delete` existente:

```js
describe('delete', () => {
  it('deve deletar um evento existente', async () => {
    const eventoMock = { destroy: jest.fn() }
    Evento.findByPk.mockResolvedValue(eventoMock)
    await eventoService.delete(1)
    expect(Evento.findByPk).toHaveBeenCalledWith(1)
    expect(eventoMock.destroy).toHaveBeenCalled()
  })

  it('deve retornar null se evento não existir', async () => {
    Evento.findByPk.mockResolvedValue(null)
    const result = await eventoService.delete(999)
    expect(result).toBeNull()
    expect(Evento.findByPk).toHaveBeenCalledWith(999)
  })
})
```

Por:

```js
describe('delete', () => {
  it('deve deletar um evento existente e suas associações N:N', async () => {
    const { UsuarioEvento } = require('../../src/models')
    const eventoMock = { destroy: jest.fn() }
    Evento.findByPk.mockResolvedValue(eventoMock)
    UsuarioEvento.destroy.mockResolvedValue(1)
    await eventoService.delete(1)
    expect(Evento.findByPk).toHaveBeenCalledWith(1)
    expect(eventoMock.destroy).toHaveBeenCalled()
    expect(UsuarioEvento.destroy).toHaveBeenCalledWith({
      where: { evento_id: 1 },
    })
  })

  it('deve retornar null se evento não existir', async () => {
    Evento.findByPk.mockResolvedValue(null)
    const result = await eventoService.delete(999)
    expect(result).toBeNull()
    expect(Evento.findByPk).toHaveBeenCalledWith(999)
  })
})
```

### 3. Atualizar o teste de `restore` para verificar cascata:

Substituir os dois testes de `restore` existentes:

```js
it('restore retorna null se não encontrar', async () => {
  Evento.findByPk.mockResolvedValue(null)
  const result = await eventoService.restore(1)
  expect(result).toBeNull()
})

it('restore chama restore se encontrar', async () => {
  const mockEvento = { restore: jest.fn() }
  Evento.findByPk.mockResolvedValue(mockEvento)
  await eventoService.restore(1)
  expect(mockEvento.restore).toHaveBeenCalled()
})
```

Por:

```js
describe('restore', () => {
  it('deve retornar null se evento não existir', async () => {
    Evento.findByPk.mockResolvedValue(null)
    const result = await eventoService.restore(1)
    expect(result).toBeNull()
  })

  it('deve restaurar o evento e suas associações N:N', async () => {
    const { UsuarioEvento } = require('../../src/models')
    const mockEvento = { restore: jest.fn() }
    Evento.findByPk.mockResolvedValue(mockEvento)
    UsuarioEvento.restore.mockResolvedValue(1)
    await eventoService.restore(1)
    expect(mockEvento.restore).toHaveBeenCalled()
    expect(UsuarioEvento.restore).toHaveBeenCalledWith({
      where: { evento_id: 1 },
    })
  })
})
```

## Resultado esperado

`npm test -- --testPathPattern=eventoService` passa com todos os testes.

## Critério de aceite

- Mock de `UsuarioEvento` usa `destroy` e `restore` (sem `update`)
- Teste de `delete` verifica `UsuarioEvento.destroy` com `{ where: { evento_id: 1 } }`
- Teste de `restore` verifica `UsuarioEvento.restore` com `{ where: { evento_id: 1 } }`
- Nenhum outro teste existente foi removido
