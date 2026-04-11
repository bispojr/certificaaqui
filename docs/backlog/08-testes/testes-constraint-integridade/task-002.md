# Task: TEST-INTEG-002 — Teste de unidade: `create()` prossegue quando duplicata está soft-deleted

## Identificador
TEST-INTEG-002

## Feature
testes-constraint-integridade

## Prioridade
ALTA

## Contexto

A regra de negócio correta é:

- Certificado duplicado **ativo** (`deleted_at IS NULL`) → **bloquear com 409**
- Certificado com a mesma tripla, mas **soft-deleted** (`deleted_at IS NOT NULL`) → **permitir criar novo**

Este comportamento decorre da query usando `paranoid: true` (padrão do Sequelize), que filtra automaticamente registros com `deleted_at` preenchido.

O teste complementa o TEST-INTEG-001 e valida que a verificação **não é excessivamente restritiva**.

---

## O que implementar

### Localização
`tests/services/certificadoService.test.js` — dentro do `describe('create', ...)` existente (linha 64), logo após o teste de 409 (TEST-INTEG-001).

### Cenário

```javascript
it('deve criar normalmente quando certificado com mesma combinação está soft-deleted', async () => {
  // Arrange — findOne retorna null (Sequelize paranoid exclui o soft-deleted automaticamente)
  Certificado.findOne = jest.fn().mockResolvedValueOnce(null)

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
  Certificado.count = jest.fn().mockResolvedValueOnce(1) // já existe 1 (soft-deleted conta por MAX)
  Certificado.create = jest.fn().mockResolvedValueOnce({ id: 100, codigo: 'EVT-26-PT-2' })

  // Act
  const resultado = await certificadoService.create({
    participante_id: 1,
    evento_id: 1,
    tipo_certificado_id: 1,
    valores_dinamicos: {},
  })

  // Assert
  expect(resultado).toBeDefined()
  expect(resultado.id).toBe(100)
  expect(Certificado.create).toHaveBeenCalledTimes(1)
})
```

### Por que `findOne` retorna `null` para soft-deleted

Com `paranoid: true` (padrão do modelo `Certificado`), a query:

```javascript
Certificado.findOne({
  where: { participante_id: 1, evento_id: 1, tipo_certificado_id: 1 }
})
```

adiciona automaticamente `AND "deleted_at" IS NULL` ao SQL gerado. Se o certificado existente tiver `deleted_at` preenchido, o Sequelize não o retorna — portanto `findOne` retorna `null` e a criação prossegue normalmente.

Este teste confirma que **o mock correto para esse cenário é `findOne` retornando `null`**, não um objeto com `deleted_at` preenchido.

---

## Relação com TEST-INTEG-001

| Cenário | `findOne` retorna | Esperado |
|---|---|---|
| Duplicata ativa | objeto com `deleted_at: null` | lança 409 |
| Duplicata soft-deleted | `null` (paranoid filtra) | cria normalmente |
| Sem duplicata | `null` | cria normalmente |

---

## Arquivo alvo
`tests/services/certificadoService.test.js`

## Dependências
- INTEG-PREV-002 implementado (verificação de duplicata na `create()`)
- O modelo `Certificado` deve ter `paranoid: true` (já confirmado)

## Critério de conclusão
- Teste passa com a implementação de INTEG-PREV-002
- `Certificado.create` é chamado exatamente 1 vez
- Nenhum erro é lançado quando `findOne` retorna `null`
