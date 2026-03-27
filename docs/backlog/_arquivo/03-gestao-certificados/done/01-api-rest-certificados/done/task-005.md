# TASK ID: CERT-API-005

## Título

Criar testes unitários de `certificadoService.create` com validação de `valores_dinamicos`

## Objetivo

Adicionar `TiposCertificados` ao mock de modelos e criar 4 testes cobrindo: tipo não encontrado, tipo sem `dados_dinamicos`, campos faltantes e criação com sucesso.

## Contexto

- `tests/services/certificadoService.test.js`: mock atual só inclui `Certificado` — precisa de `TiposCertificados`
- Após CERT-API-003, o service importa e usa `TiposCertificados.findByPk`
- O teste existente `it('create chama Certificado.create', ...)` testa o path feliz — deve ser MANTIDO e expandido com os novos cenários
- Executar APÓS CERT-API-003 e CERT-API-004

## Arquivos envolvidos

- `tests/services/certificadoService.test.js`

## Passos

### 1. Adicionar `TiposCertificados` ao `jest.mock`:

Substituir o bloco `jest.mock('../../src/models', ...)` para incluir:

```js
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

### 2. Atualizar o import no topo do test (se necessário):

```js
const { Certificado, TiposCertificados } = require('../../src/models')
```

### 3. Adicionar bloco `describe('create com validação de valores_dinamicos', ...)` após os testes existentes:

```js
describe('create com validação de valores_dinamicos', () => {
  const dadoBase = {
    tipo_certificado_id: 1,
    valores_dinamicos: { carga_horaria: '8h', local: 'Online' },
  }

  it('lança erro 404 se tipo não existir', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    await expect(certificadoService.create(dadoBase)).rejects.toMatchObject({
      message: 'Tipo de certificado não encontrado',
      statusCode: 404,
    })
    expect(Certificado.create).not.toHaveBeenCalled()
  })

  it('lança erro 422 com camposFaltantes se campos ausentes', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: {
        carga_horaria: 'string',
        local: 'string',
        data: 'string',
      },
    })
    const data = {
      tipo_certificado_id: 1,
      valores_dinamicos: { carga_horaria: '8h' },
    }
    await expect(certificadoService.create(data)).rejects.toMatchObject({
      statusCode: 422,
      camposFaltantes: expect.arrayContaining(['local', 'data']),
    })
    expect(Certificado.create).not.toHaveBeenCalled()
  })

  it('cria normalmente se tipo sem dados_dinamicos', async () => {
    TiposCertificados.findByPk.mockResolvedValue({ dados_dinamicos: null })
    Certificado.create.mockResolvedValue({ id: 1, ...dadoBase })
    const result = await certificadoService.create(dadoBase)
    expect(Certificado.create).toHaveBeenCalledWith(dadoBase)
    expect(result).toMatchObject({ id: 1 })
  })

  it('cria normalmente se todos os campos presentes', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: { carga_horaria: 'string', local: 'string' },
    })
    Certificado.create.mockResolvedValue({ id: 2, ...dadoBase })
    const result = await certificadoService.create(dadoBase)
    expect(Certificado.create).toHaveBeenCalledWith(dadoBase)
    expect(result).toMatchObject({ id: 2 })
  })
})
```

## Resultado esperado

`npm test -- --testPathPattern=certificadoService` passa com 4+ testes novos além dos existentes.

## Critério de aceite

- 4 novos testes passando
- `TiposCertificados.findByPk` mocado corretamente
- Teste de `camposFaltantes` usa `expect.arrayContaining` para ordem independente
- Nenhum teste existente foi alterado ou removido

## Metadados

- Completado em: 26/03/2026 17:06 ✅
