# TASK ID: TEST-UNIT-003

## Título

Atualizar `certificadoService.test.js` — paginação + testes de `create` com validação de `valores_dinamicos`

## Objetivo

(1) Substituir teste de `findAll` pelo contrato paginado. (2) Adicionar `TiposCertificados` ao mock. (3) Criar 3 testes para `certificadoService.create` cobrindo: tipo inexistente, campos faltantes e criação com sucesso.

## Contexto

- `certificadoService.create` após CERT-API-003:
  - Busca `TiposCertificados.findByPk(data.tipo_certificado_id)`
  - Se não encontrar → lança `Error('Tipo de certificado não encontrado')`
  - Compara `Object.keys(dados_dinamicos)` com `Object.keys(valores_dinamicos)`
  - Se houver campos faltantes → lança erro com `{ message, camposFaltantes: string[] }`
  - Se válido → chama `Certificado.create(data)`
- `findAll` atual: `expect(Certificado.findAll).toHaveBeenCalled()` — obsoleto após CERT-API-001

## Arquivos envolvidos

- `tests/services/certificadoService.test.js` ← MODIFICAR

## Passos

### 1. Adicionar `TiposCertificados` ao `jest.mock` e ao destructuring

```js
// No require:
const { Certificado, TiposCertificados } = require('../../src/models')

// No jest.mock:
jest.mock('../../src/models', () => ({
  Certificado: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
  TiposCertificados: {
    findByPk: jest.fn(),
  },
}))
```

### 2. Substituir teste `findAll` pelo contrato paginado

```js
// Antes:
it('findAll chama Certificado.findAll', async () => {
  await certificadoService.findAll()
  expect(Certificado.findAll).toHaveBeenCalled()
})

// Depois:
describe('findAll', () => {
  it('retorna { data, meta } com página padrão', async () => {
    Certificado.findAndCountAll.mockResolvedValue({
      count: 5,
      rows: [{}, {}, {}, {}, {}],
    })
    const result = await certificadoService.findAll()
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    })
    expect(result.data).toHaveLength(5)
    expect(result.meta.total).toBe(5)
    expect(result.meta.page).toBe(1)
  })

  it('aplica offset para page=2, perPage=5', async () => {
    Certificado.findAndCountAll.mockResolvedValue({ count: 10, rows: [] })
    await certificadoService.findAll({ page: 2, perPage: 5 })
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 5,
      limit: 5,
    })
  })
})
```

### 3. Substituir o teste genérico `create chama Certificado.create` por 3 testes de validação

```js
// Remover:
it('create chama Certificado.create', async () => {
  const data = { nome: 'Certificado Teste' }
  await certificadoService.create(data)
  expect(Certificado.create).toHaveBeenCalledWith(data)
})

// Adicionar em um describe:
describe('create', () => {
  it('lança erro se tipo_certificado_id não encontrado', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    await expect(
      certificadoService.create({
        tipo_certificado_id: 99,
        valores_dinamicos: {},
      }),
    ).rejects.toThrow('Tipo de certificado não encontrado')
  })

  it('lança erro com camposFaltantes se valores_dinamicos incompleto', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: { curso: 'Curso', carga_horaria: 'Carga Horária' },
    })
    await expect(
      certificadoService.create({
        tipo_certificado_id: 1,
        valores_dinamicos: { curso: 'Node.js' },
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('campo'),
      camposFaltantes: ['carga_horaria'],
    })
  })

  it('cria certificado quando valores_dinamicos estão completos', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: { curso: 'Curso' },
    })
    const data = {
      nome: 'João',
      tipo_certificado_id: 1,
      valores_dinamicos: { curso: 'Node.js' },
    }
    Certificado.create.mockResolvedValue({ id: 1, ...data })
    const result = await certificadoService.create(data)
    expect(Certificado.create).toHaveBeenCalledWith(data)
    expect(result.id).toBe(1)
  })
})
```

## Resultado esperado

`certificadoService.test.js` passa com `npm run check` após CERT-API-001 e CERT-API-003 implementados.

## Critério de aceite

- `findAll` usa `findAndCountAll` — nenhuma referência a `Certificado.findAll` nos novos testes
- Teste `tipo não encontrado`: `TiposCertificados.findByPk` retorna null → rejeita com mensagem correta
- Teste `campos faltantes`: erro contém `camposFaltantes: ['carga_horaria']`
- Teste de sucesso: `Certificado.create` chamado com os dados corretos
- `TiposCertificados` no mock do `jest.mock` com apenas `findByPk`
