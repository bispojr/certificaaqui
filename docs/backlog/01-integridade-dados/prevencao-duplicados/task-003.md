# TASK ID: INTEG-PREV-003

## Título

Corrigir geração de código em `certificadoService.create()` para incluir registros soft-deleted no contador

## Tipo

backend

## Dependências

- INTEG-PREV-002

## Objetivo

Substituir a query `Certificado.count({ where: { evento_id, tipo_certificado_id } })` por uma versão com `paranoid: false` para que registros soft-deleted sejam contados, eliminando colisões de código ao restaurar certificados previamente deletados.

## Contexto

O gerador de código atual em `src/services/certificadoService.js` usa:

```javascript
const count = await Certificado.count({
  where: {
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
})
const incremental = count + 1
```

O Sequelize com `paranoid: true` exclui registros soft-deleted por padrão. Isso cria o seguinte cenário de colisão:

1. Certificado `EDU-25-PT-1` é emitido → `count = 0`, `incremental = 1`
2. Certificado `EDU-25-PT-1` é soft-deletado
3. Novo certificado é criado → `count = 0` novamente → `incremental = 1`
4. Sistema tenta inserir código `EDU-25-PT-1` → falha com erro de UNIQUE constraint no campo `codigo`

A solução é adicionar `paranoid: false` ao `count` para incluir todos os registros (ativos + deletados) no contador. O número nunca retrocede, garantindo unicidade mesmo com soft deletes e restaurações.

Esta abordagem é mais simples que o `MAX` sobre o campo `codigo` (que exigiria parsing de string e `sequelize.query` raw) e mantém compatibilidade com a estrutura de mock existente nos testes.

## Arquivos envolvidos

- `src/services/certificadoService.js` ← editar (1 linha)
- `tests/services/certificadoService.test.js` ← editar (ajustar mock + ajuste do beforeEach)

## Passos

1. Em `src/services/certificadoService.js`, localizar o bloco de geração de código (após a validação de campos dinâmicos) e adicionar `paranoid: false` ao `count`:

```javascript
// ANTES:
const count = await Certificado.count({
  where: {
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
})

// DEPOIS:
const count = await Certificado.count({
  where: {
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
  paranoid: false,
})
```

2. Em `tests/services/certificadoService.test.js`, adicionar `count: jest.fn()` ao objeto `Certificado` dentro do `jest.mock('../../src/models', ...)`. O mock atual não inclui `count` de forma estática — ele é atribuído com `Certificado.count = jest.fn()` inline no teste. Mover para o objeto de mock junto com os demais métodos.

3. No `beforeEach` do describe `create`, garantir que `Certificado.count.mockReset()` já é chamado (atualmente feito como `Certificado.count && Certificado.count.mockReset && Certificado.count.mockReset()` — simplificar para `Certificado.count.mockReset()` após o passo 2).

4. No teste existente `it('incrementa corretamente o número no código de validação')`:
   - Remover as linhas `Certificado.count = jest.fn()` e `Certificado.create = jest.fn()` (não mais necessárias pois estarão no mock estático)
   - Adicionar `Certificado.findOne.mockResolvedValue(null)` no `beforeEach` do describe `create` (pré-requisito da verificação de duplicata adicionada em INTEG-PREV-002)
   - Verificar que o teste ainda passa: o comportamento de contagem não muda, apenas o `paranoid: false` é adicionado internamente

5. Adicionar um novo teste que verifica que o `count` é chamado com `paranoid: false`:

```javascript
it('conta registros incluindo soft-deleted ao gerar o código', async () => {
  TiposCertificados.findByPk.mockResolvedValue({
    dados_dinamicos: {},
    codigo: 'PT',
  })
  Evento.findByPk.mockResolvedValue({ codigo_base: 'EDC', ano: 2025 })
  Certificado.findOne.mockResolvedValue(null)
  Certificado.count.mockResolvedValue(0)
  Certificado.create.mockResolvedValue({ id: 1, codigo: 'EDC-25-PT-1' })

  await certificadoService.create({
    tipo_certificado_id: 1,
    evento_id: 2,
    valores_dinamicos: {},
  })

  expect(Certificado.count).toHaveBeenCalledWith(
    expect.objectContaining({ paranoid: false }),
  )
})
```

## Resultado esperado

- `certificadoService.create()` conta certificados incluindo soft-deleted
- Restaurar um certificado deletado não causa colisão: o próximo código gerado usa o `MAX` implícito do counter
- Mock de `Certificado.count` é estático no jest.mock em vez de reassignado inline

## Critério de aceite

- `Certificado.count` é chamado com `{ where: {...}, paranoid: false }`
- O teste de incremento existente continua passando sem alterações de lógica
- O novo teste verifica explicitamente o `paranoid: false`
- `npm run check` passa sem falhas
