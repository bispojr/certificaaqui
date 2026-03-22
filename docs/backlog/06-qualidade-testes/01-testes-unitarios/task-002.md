# TASK ID: TEST-UNIT-002

## Título

Atualizar paginação em `participanteService.test.js` e `tiposCertificadosService.test.js`

## Objetivo

Substituir o teste de `findAll` que chama `findAll` (sem paginação) pelo contrato `findAndCountAll` com `{ data, meta }` em ambos os arquivos.

## Contexto

- `participanteService.test.js` linha atual: `expect(Participante.findAll).toHaveBeenCalled()` — obsoleto após ADMIN-PART-001
- `tiposCertificadosService.test.js` linha atual: `expect(TiposCertificados.findAll).toHaveBeenCalled()` — obsoleto após ADMIN-TIPOS-001
- Ambos os mocks precisam de `findAndCountAll: jest.fn()` adicionado

## Arquivos envolvidos

- `tests/services/participanteService.test.js` ← MODIFICAR
- `tests/services/tiposCertificadosService.test.js` ← MODIFICAR

## Passos

### Em `participanteService.test.js`

#### 1. Adicionar `findAndCountAll` ao mock

```js
Participante: {
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  restore: jest.fn(),
},
```

#### 2. Substituir o teste `findAll`

```js
// Antes:
it('findAll chama Participante.findAll', async () => {
  await participanteService.findAll()
  expect(Participante.findAll).toHaveBeenCalled()
})

// Depois:
describe('findAll', () => {
  it('retorna { data, meta } com página padrão', async () => {
    Participante.findAndCountAll.mockResolvedValue({ count: 2, rows: [{}, {}] })
    const result = await participanteService.findAll()
    expect(Participante.findAndCountAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    })
    expect(result.data).toHaveLength(2)
    expect(result.meta.total).toBe(2)
    expect(result.meta.totalPages).toBe(1)
  })

  it('calcula offset para page=3, perPage=10', async () => {
    Participante.findAndCountAll.mockResolvedValue({ count: 30, rows: [] })
    await participanteService.findAll({ page: 3, perPage: 10 })
    expect(Participante.findAndCountAll).toHaveBeenCalledWith({
      offset: 20,
      limit: 10,
    })
  })
})
```

---

### Em `tiposCertificadosService.test.js`

#### 1. Adicionar `findAndCountAll` ao mock

```js
TiposCertificados: {
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  restore: jest.fn(),
},
```

#### 2. Substituir o teste `findAll`

```js
// Antes:
it('findAll chama TiposCertificados.findAll', async () => {
  await tiposCertificadosService.findAll()
  expect(TiposCertificados.findAll).toHaveBeenCalled()
})

// Depois:
describe('findAll', () => {
  it('retorna { data, meta } com página padrão', async () => {
    TiposCertificados.findAndCountAll.mockResolvedValue({
      count: 4,
      rows: [{}, {}, {}, {}],
    })
    const result = await tiposCertificadosService.findAll()
    expect(TiposCertificados.findAndCountAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    })
    expect(result.data).toHaveLength(4)
    expect(result.meta.total).toBe(4)
    expect(result.meta.totalPages).toBe(1)
  })

  it('calcula totalPages corretamente', async () => {
    TiposCertificados.findAndCountAll.mockResolvedValue({ count: 11, rows: [] })
    const result = await tiposCertificadosService.findAll({
      page: 1,
      perPage: 5,
    })
    expect(result.meta.totalPages).toBe(3)
  })
})
```

## Resultado esperado

Ambos os arquivos passam com `npm run check`.

## Critério de aceite

- `findAll` não mais referencia `findAll` do model — usa `findAndCountAll`
- `{ offset, limit }` calculados corretamente a partir de `page`/`perPage`
- `meta.totalPages = Math.ceil(count / perPage)`
- `jest.clearAllMocks()` no `beforeEach` já existente funciona para `findAndCountAll`
