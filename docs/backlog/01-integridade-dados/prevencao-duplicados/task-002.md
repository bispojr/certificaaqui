# TASK ID: INTEG-PREV-002

## Título

Adicionar verificação de duplicata em `certificadoService.create()` com erro HTTP 409

## Tipo

backend

## Dependências

nenhuma

## Objetivo

Adicionar uma verificação no início de `certificadoService.create()` que detecta se já existe um certificado ativo com a mesma combinação `(participante_id, evento_id, tipo_certificado_id)` e lança um erro com `statusCode 409` antes de qualquer outra operação.

Esta camada de aplicação é complementar ao índice de banco (`INTEG-PREV-001`): o service entrega uma mensagem amigável ao usuário, e o banco é a garantia final contra race conditions.

## Contexto

Atualmente `certificadoService.create()` em `src/services/certificadoService.js` executa:

1. `TiposCertificados.findByPk`
2. `Evento.findByPk`
3. Validação de campos dinâmicos
4. `Certificado.count` (para código)
5. `Certificado.create`

Não há nenhuma verificação de duplicata. O método deve receber um `findOne` antes do passo 1 para retornar erro controlado antes de qualquer IO desnecessário.

O mock de `Certificado` nos testes unitários (`tests/services/certificadoService.test.js`) não inclui `findOne`. É necessário adicionar `findOne: jest.fn()` ao mock para que os novos testes não quebrem o mock existente.

## Arquivos envolvidos

- `src/services/certificadoService.js` ← editar
- `tests/services/certificadoService.test.js` ← editar

## Passos

1. Em `src/services/certificadoService.js`, no início da função `create(data)`, **antes** da query de `TiposCertificados.findByPk`, adicionar:

```javascript
const duplicata = await Certificado.findOne({
  where: {
    participante_id: data.participante_id,
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
})
if (duplicata) {
  const err = new Error(
    'Já existe um certificado ativo para este participante neste evento e tipo.',
  )
  err.statusCode = 409
  err.code = 'DUPLICATE_CERTIFICADO'
  throw err
}
```

2. Em `tests/services/certificadoService.test.js`, adicionar `findOne: jest.fn()` ao objeto `Certificado` dentro do `jest.mock('../../src/models', ...)`. Localizar o bloco:

```javascript
Certificado: {
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  restore: jest.fn(),
},
```

E adicionar `findOne: jest.fn(),` ao objeto.

3. Adicionar `Certificado.findOne.mockReset()` no `beforeEach` do describe `create`.

4. Adicionar dois novos testes no describe `create`:

   **Teste A:** `findOne` retorna um objeto → `create()` deve lançar erro com `statusCode 409` e `code 'DUPLICATE_CERTIFICADO'`

   **Teste B:** `findOne` retorna `null` → `create()` deve prosseguir normalmente (não lançar erro na etapa de verificação de duplicata)

## Resultado esperado

- `certificadoService.create()` lança erro 409 se já existe certificado ativo com a mesma tripla
- A mensagem de erro é clara e específica
- O mock de testes inclui `findOne`
- `npm run check` passa sem falhas

## Critério de aceite

- O `findOne` é chamado com `{ where: { participante_id, evento_id, tipo_certificado_id } }` exatamente
- O erro lançado tem `statusCode === 409` e `code === 'DUPLICATE_CERTIFICADO'`
- `findOne` **não** usa `paranoid: false` — verifica apenas registros ativos (comportamento padrão do Sequelize com paranoid)
- Dois novos testes unitários cobrem os casos duplicata e não-duplicata
- Todos os testes existentes de `certificadoService` continuam passando
