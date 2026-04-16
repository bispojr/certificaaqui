# Task: TEST-INTEG-004 — Teste: geração de código via `MAX` não repete incremento após restore

## Identificador

TEST-INTEG-004

## Feature

testes-constraint-integridade

## Prioridade

ALTA

## Contexto

**Problema atual** (`src/services/certificadoService.js`, linhas 63–70):

```javascript
const count = await Certificado.count({
  where: {
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
})
const incremental = count + 1
const validationCode = `${eventCode}-${year}-${tipoCode}-${incremental}`
```

Com `count` usando o padrão `paranoid: true`, certificados soft-deleted **não são contados**. Isso cria o seguinte problema:

1. Certificados 1, 2 e 3 são criados → códigos `EVT-26-PT-1`, `EVT-26-PT-2`, `EVT-26-PT-3`
2. Certificado 3 é soft-deleted
3. Novo certificado é criado → `count = 2`, portanto `incremental = 3` → **colisão com o código do certificado deletado**

**Solução correta** (INTEG-PREV-003): usar `MAX` em vez de `COUNT`:

```javascript
const max = await Certificado.max('incremento', {
  where: { evento_id, tipo_certificado_id },
  paranoid: false, // incluir soft-deleted para não reutilizar o número
})
const incremental = (max || 0) + 1
```

> Nota: Requer que o campo `incremento` seja armazenado separadamente do código composto, ou que o `MAX` seja extraído do campo `codigo` via regex/substring. A decisão de design deve ser feita em INTEG-PREV-003.

---

## O que implementar

### Localização

`tests/services/certificadoService.test.js` — novo `describe` ou dentro do `describe('create', ...)`.

### Cenário com mock

```javascript
it('não deve reutilizar incremento de certificado soft-deleted (usa MAX, não COUNT)', async () => {
  // Arrange
  // Simular que existem 2 certificados ativos e 1 soft-deleted (total histórico: 3)
  // Com COUNT (paranoid): retornaria 2 → código seria PT-3 (colisão)
  // Com MAX (paranoid: false): retornaria 3 → código seria PT-4 (correto)

  TiposCertificados.findByPk = jest.fn().mockResolvedValueOnce({
    id: 1,
    codigo: 'PT',
    dados_dinamicos: {},
  })
  Evento.findByPk = jest.fn().mockResolvedValueOnce({
    id: 1,
    codigo_base: 'EVT',
    ano: 2026,
  })
  Certificado.findOne = jest.fn().mockResolvedValueOnce(null) // sem duplicata ativa

  // Mock do MAX que inclui o soft-deleted (paranoid: false)
  Certificado.max = jest.fn().mockResolvedValueOnce(3) // máximo histórico é 3
  Certificado.create = jest
    .fn()
    .mockResolvedValueOnce({ id: 10, codigo: 'EVT-26-PT-4' })

  // Act
  const resultado = await certificadoService.create({
    participante_id: 2, // participante diferente para não colidir com a verificação de duplicata
    evento_id: 1,
    tipo_certificado_id: 1,
    valores_dinamicos: {},
  })

  // Assert — o código deve usar o incremento 4 (max 3 + 1), não 3 (count 2 + 1)
  expect(Certificado.create).toHaveBeenCalledWith(
    expect.objectContaining({
      codigo: expect.stringMatching(/EVT-26-PT-4/),
    }),
  )
})
```

### Cenário complementar — sem certificados anteriores

```javascript
it('deve gerar incremento 1 quando não existem certificados anteriores (MAX retorna null)', async () => {
  TiposCertificados.findByPk = jest.fn().mockResolvedValueOnce({
    id: 1,
    codigo: 'PT',
    dados_dinamicos: {},
  })
  Evento.findByPk = jest.fn().mockResolvedValueOnce({
    id: 1,
    codigo_base: 'EVT',
    ano: 2026,
  })
  Certificado.findOne = jest.fn().mockResolvedValueOnce(null)
  Certificado.max = jest.fn().mockResolvedValueOnce(null) // nenhum certificado anterior
  Certificado.create = jest
    .fn()
    .mockResolvedValueOnce({ id: 1, codigo: 'EVT-26-PT-1' })

  await certificadoService.create({
    participante_id: 1,
    evento_id: 1,
    tipo_certificado_id: 1,
    valores_dinamicos: {},
  })

  expect(Certificado.create).toHaveBeenCalledWith(
    expect.objectContaining({
      codigo: expect.stringMatching(/EVT-26-PT-1/),
    }),
  )
})
```

---

## Nota sobre dependência de design

A implementação de `MAX` pode ser feita de duas formas:

**Opção A** — `MAX` sobre campo `codigo` com extração do incremento por substring:

```javascript
// Frágil — depende do formato do código
```

**Opção B** — Adicionar coluna `incremento INTEGER` na tabela `certificados` e usar `MAX('incremento', { paranoid: false })`:

```javascript
// Mais robusto — o incremento é armazenado explicitamente
```

A decisão deve ser registrada em **INTEG-PREV-003**. Os mocks do teste assumem a Opção B (usando `Certificado.max`).

---

## Arquivo alvo

`tests/services/certificadoService.test.js`

## Dependências

- INTEG-PREV-003 (geração de código via `MAX`) deve ser implementado antes dos testes passarem
- O design da coluna `incremento` deve ser definido em INTEG-PREV-003

## Critério de conclusão

- Teste com MAX retornando 3 gera código com sufixo `-4`
- Teste com MAX retornando `null` gera código com sufixo `-1`
- Os testes existentes de geração de código continuam passando (compatibilidade retroativa)
