# TASK ID: CERT-API-002

## Título

Atualizar teste unitário de `certificadoService.findAll` para formato paginado

## Objetivo

Adaptar o teste existente de `findAll` para o novo contrato: mock usa `findAndCountAll`, resultado validado como `{ data, meta }`.

## Contexto

- `tests/services/certificadoService.test.js` contém: `it('findAll chama Certificado.findAll', ...)`
- Após CERT-API-001, o service usa `Certificado.findAndCountAll` — o mock atual tem `findAll: jest.fn()` mas não tem `findAndCountAll`
- Deve-se:
  1. Adicionar `findAndCountAll` ao mock de `Certificado` no `jest.mock`
  2. Reescrever o teste `findAll` para verificar o novo contrato

## Arquivos envolvidos

- `tests/services/certificadoService.test.js`

## Passos

### 1. Atualizar o objeto mock de `Certificado` dentro de `jest.mock`:

Adicionar a chave `findAndCountAll` ao mock existente:

```js
jest.mock('../../src/models', () => ({
  Certificado: {
    findAll: jest.fn(), // manter (usado em outros testes se houver)
    findAndCountAll: jest.fn(), // adicionar esta linha
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
}))
```

### 2. Substituir o teste de `findAll`:

Substituir:

```js
it('findAll chama Certificado.findAll', async () => {
  await certificadoService.findAll()
  expect(Certificado.findAll).toHaveBeenCalled()
})
```

Por:

```js
describe('findAll', () => {
  it('chama findAndCountAll com offset e limit corretos', async () => {
    Certificado.findAndCountAll.mockResolvedValue({ count: 20, rows: [] })
    await certificadoService.findAll({ page: 2, perPage: 5 })
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 5,
      limit: 5,
    })
  })

  it('retorna { data, meta } com estrutura correta', async () => {
    const rows = [{ id: 1 }, { id: 2 }]
    Certificado.findAndCountAll.mockResolvedValue({ count: 12, rows })
    const result = await certificadoService.findAll({ page: 1, perPage: 10 })
    expect(result).toEqual({
      data: rows,
      meta: { total: 12, page: 1, perPage: 10, totalPages: 2 },
    })
  })

  it('usa page=1 e perPage=10 como defaults', async () => {
    Certificado.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await certificadoService.findAll()
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 10,
    })
  })
})
```

## Resultado esperado

`npm test -- --testPathPattern=certificadoService` passa sem erros.

## Critério de aceite

- Nenhum teste usa `Certificado.findAll` para testar `findAll` do service
- 3 casos cobertos: paginação com parâmetros, estrutura de resposta, defaults
