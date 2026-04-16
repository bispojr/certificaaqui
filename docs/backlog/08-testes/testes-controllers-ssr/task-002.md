# Task: TEST-CERT-SSR-002 — Teste de `criar` com erro 409 no `certificadoSSRController`

## Identificador

TEST-CERT-SSR-002

## Feature

testes-controllers-ssr

## Prioridade

ALTA

## Contexto

O bloco `describe('criar', ...)` em `tests/controllers/certificadoSSRController.test.js` (linha 109) cobre apenas o caso de sucesso:

```
it('deve criar certificado e redirecionar')
```

O controller `certificadoSSRController.criar()` chama `certificadoService.create()`, que após a implementação de INTEG-PREV-002 lança um erro com `status: 409` quando já existe um certificado ativo para a mesma combinação `(participante_id, evento_id, tipo_certificado_id)`.

O comportamento esperado do controller nesse caso:

1. Captura o erro 409 no bloco `catch`
2. Registra `req.flash('error', mensagem)`
3. Redireciona para `/admin/certificados/novo` (ou de volta ao formulário)

Esse caminho não está coberto nos testes atuais.

---

## O que implementar

### 1. Teste de `criar` com conflito 409

Adicionar ao `describe('criar', ...)` existente no `certificadoSSRController.test.js`:

```javascript
it('deve exibir flash de erro e redirecionar quando certificado já existe (409)', async () => {
  // Arrange
  const erroConflito = new Error('Certificado já existe para esta combinação')
  erroConflito.status = 409
  certificadoService.create.mockRejectedValueOnce(erroConflito)

  // Act
  const res = await request(app)
    .post('/admin/certificados')
    .set('x-test-user-id', '1')
    .send({
      participante_id: '1',
      evento_id: '1',
      tipo_certificado_id: '1',
    })

  // Assert
  expect(res.status).toBe(302)
  expect(res.headers.location).toMatch(
    /\/admin\/certificados\/novo|\/admin\/certificados/,
  )
})
```

> Nota: O `req.flash` não é diretamente verificável via supertest sem sessão persistente. Verificar o redirect é suficiente para garantir que o controller não retorna 500 nem trava.

### 2. Teste de `criar` com erro genérico (500)

Adicionar também o caso de erro não-409 para garantir que o controller trata erros inesperados sem expor stack trace:

```javascript
it('deve redirecionar com erro genérico quando o service lança exceção não-409', async () => {
  // Arrange
  certificadoService.create.mockRejectedValueOnce(
    new Error('Erro inesperado do banco'),
  )

  // Act
  const res = await request(app)
    .post('/admin/certificados')
    .set('x-test-user-id', '1')
    .send({
      participante_id: '1',
      evento_id: '1',
      tipo_certificado_id: '1',
    })

  // Assert — o controller não deve deixar o processo travar (status 5xx sem tratamento)
  expect([302, 500]).toContain(res.status)
  // Se 302: controller tratou e redirecionou com flash
  // Se 500: erro chegou ao handler global — documentar comportamento atual
})
```

### 3. Verificar arquivo `certificadoSSRController.create.test.js`

O arquivo `tests/controllers/certificadoSSRController.create.test.js` também existe. Antes de duplicar testes, verificar se o caso 409 já está coberto nele via:

```bash
grep -n "409\|conflito\|duplicata\|Rejected" tests/controllers/certificadoSSRController.create.test.js
```

Se coberto no arquivo separado, dispensar os testes no arquivo principal e documentar referência cruzada.

---

## Arquivo alvo (primário)

`tests/controllers/certificadoSSRController.test.js`

## Arquivo alvo (secundário — verificar antes)

`tests/controllers/certificadoSSRController.create.test.js`

## Dependências

- `certificadoService.create` precisa lançar `{ status: 409 }` — implementado em INTEG-PREV-002
- O mock `jest.mock('../../src/services/certificadoService')` já está presente no arquivo de teste

## Critério de conclusão

- `criar` com 409 resulta em redirect (não 500)
- O erro não vaza stack trace na resposta
- Todos os testes passam em `npm run check`
