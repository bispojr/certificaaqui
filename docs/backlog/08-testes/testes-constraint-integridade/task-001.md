# Task: TEST-INTEG-001 — Teste de unidade: `create()` lança 409 para certificado duplicado ativo

## Identificador
TEST-INTEG-001

## Feature
testes-constraint-integridade

## Prioridade
ALTA

## Contexto

Após implementação de **INTEG-PREV-002**, `certificadoService.create()` deve verificar se já existe um certificado ativo (`deleted_at IS NULL`) com a mesma tripla `(participante_id, evento_id, tipo_certificado_id)` antes de prosseguir. Se existir, lança `Error` com `status: 409`.

O código atual (linha 30–73 de `src/services/certificadoService.js`) **não** possui essa verificação — o teste a ser criado deve falhar antes de INTEG-PREV-002 ser implementado e passar após.

---

## O que implementar

### Localização
`tests/services/certificadoService.test.js` — dentro do `describe('create', ...)` existente (linha 64).

### Cenário

```javascript
it('deve lançar erro 409 ao criar certificado duplicado ativo', async () => {
  // Arrange — simular que já existe certificado ativo para a mesma combinação
  Certificado.findOne = jest.fn().mockResolvedValueOnce({
    id: 99,
    participante_id: 1,
    evento_id: 1,
    tipo_certificado_id: 1,
    deleted_at: null,
  })

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

  // Act
  const promise = certificadoService.create({
    participante_id: 1,
    evento_id: 1,
    tipo_certificado_id: 1,
    valores_dinamicos: {},
  })

  // Assert
  await expect(promise).rejects.toThrow()
  await expect(promise).rejects.toMatchObject({ status: 409 })
})
```

### Nota sobre o campo de erro

A implementação deve usar `err.status = 409` (não `err.statusCode`). Verificar na implementação de INTEG-PREV-002 qual campo é usado e ajustar o matcher:

- Se usar `status`: `toMatchObject({ status: 409 })`
- Se usar `statusCode`: `toMatchObject({ statusCode: 409 })`

> Alinhar com o padrão já usado em `create()` para os erros 404 e 422 (que usam `statusCode`).

---

## Implementação esperada em `certificadoService.create()` (INTEG-PREV-002)

```javascript
// Logo no início de create(), antes de buscar tipo/evento:
const duplicata = await Certificado.findOne({
  where: {
    participante_id: data.participante_id,
    evento_id: data.evento_id,
    tipo_certificado_id: data.tipo_certificado_id,
  },
  // paranoid: true (padrão) — só busca registros sem deleted_at
})

if (duplicata) {
  const err = new Error('Já existe um certificado ativo para esta combinação de participante, evento e tipo')
  err.status = 409
  throw err
}
```

---

## Arquivo alvo
`tests/services/certificadoService.test.js`

## Dependências
- INTEG-PREV-002 deve ser implementado antes deste teste ser executado com sucesso
- Este teste pode ser criado antes da implementação como base do ciclo TDD

## Critério de conclusão
- O teste falha com o código atual (sem a verificação)
- O teste passa após implementação de INTEG-PREV-002
- Nenhum teste regressivo quebra ao adicionar o novo caso
