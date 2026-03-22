# TASK ID: TEST-UNIT-001

## Título
Corrigir `eventoService.test.js` — mock UsuarioEvento + testes de cascata + paginação

## Objetivo
Atualizar o mock de `UsuarioEvento` de `{ update }` para `{ destroy, restore }`, adicionar testes de cascata (soft delete e restore propagam para `UsuarioEvento`) e substituir o teste de `findAll` pelo contrato paginado `{ data, meta }`.

## Contexto
- Mock atual: `UsuarioEvento: { update: jest.fn() }` — obsoleto após ADMIN-EVT-001
- Após ADMIN-EVT-001: `eventoService.delete` chama `UsuarioEvento.destroy({ where: { evento_id: id } })`
- Após ADMIN-EVT-001: `eventoService.restore` chama `UsuarioEvento.restore({ where: { evento_id: id } })`
- Após ADMIN-EVT-003: `eventoService.findAll({ page, perPage })` usa `Evento.findAndCountAll` e retorna `{ data, meta }`
- Teste de `findAll` atual: `expect(Evento.findAll).toHaveBeenCalled()` — deve ser substituído

## Arquivos envolvidos
- `tests/services/eventoService.test.js` ← MODIFICAR

## Passos

### 1. Atualizar mock `UsuarioEvento` no `jest.mock`
```js
// Antes:
UsuarioEvento: {
  update: jest.fn(),
},
// Depois:
UsuarioEvento: {
  destroy: jest.fn(),
  restore: jest.fn(),
},
```

### 2. Substituir describe `delete` — adicionar cascata
```js
describe('delete', () => {
  it('deve deletar um evento existente e cascatear UsuarioEvento', async () => {
    const eventoMock = { destroy: jest.fn() }
    Evento.findByPk.mockResolvedValue(eventoMock)
    await eventoService.delete(1)
    expect(eventoMock.destroy).toHaveBeenCalled()
    expect(UsuarioEvento.destroy).toHaveBeenCalledWith({ where: { evento_id: 1 } })
  })

  it('deve retornar null se evento não existir', async () => {
    Evento.findByPk.mockResolvedValue(null)
    const result = await eventoService.delete(999)
    expect(result).toBeNull()
  })
})
```

### 3. Adicionar describe `restore` com cascata
```js
describe('restore', () => {
  it('deve restaurar um evento e cascatear UsuarioEvento', async () => {
    const eventoMock = { restore: jest.fn() }
    Evento.findByPk.mockResolvedValue(eventoMock)
    await eventoService.restore(1)
    expect(eventoMock.restore).toHaveBeenCalled()
    expect(UsuarioEvento.restore).toHaveBeenCalledWith({ where: { evento_id: 1 } })
  })

  it('deve retornar null se evento não existir', async () => {
    Evento.findByPk.mockResolvedValue(null)
    const result = await eventoService.restore(999)
    expect(result).toBeNull()
  })
})
```

### 4. Substituir teste `findAll` pelo contrato paginado
```js
// Antes:
it('findAll chama Evento.findAll', async () => {
  await eventoService.findAll()
  expect(Evento.findAll).toHaveBeenCalled()
})

// Depois:
describe('findAll', () => {
  it('retorna { data, meta } com página padrão', async () => {
    Evento.findAndCountAll.mockResolvedValue({ count: 3, rows: [{}, {}, {}] })
    const result = await eventoService.findAll()
    expect(Evento.findAndCountAll).toHaveBeenCalledWith({ offset: 0, limit: 20 })
    expect(result.data).toHaveLength(3)
    expect(result.meta.total).toBe(3)
    expect(result.meta.totalPages).toBe(1)
  })

  it('calcula offset corretamente para page=2', async () => {
    Evento.findAndCountAll.mockResolvedValue({ count: 10, rows: [] })
    await eventoService.findAll({ page: 2, perPage: 5 })
    expect(Evento.findAndCountAll).toHaveBeenCalledWith({ offset: 5, limit: 5 })
  })
})
```

### 5. Adicionar `findAndCountAll` ao mock do `Evento`
```js
Evento: {
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  restore: jest.fn(),
},
```

### 6. Adicionar `UsuarioEvento` ao destructuring do `require`
```js
const { Evento, UsuarioEvento } = require('../../src/models')
```

## Resultado esperado
Todos os testes de `eventoService.test.js` passam com `npm run check`.

## Critério de aceite
- Mock `UsuarioEvento` tem apenas `destroy` e `restore` (sem `update`)
- Teste de `delete` verifica `UsuarioEvento.destroy` com `{ where: { evento_id: id } }`
- Teste de `restore` verifica `UsuarioEvento.restore` com `{ where: { evento_id: id } }`
- `findAll` usa `findAndCountAll` e retorna `{ data, meta }`
- `jest.clearAllMocks()` no `beforeEach` já existente cobre os novos mocks
