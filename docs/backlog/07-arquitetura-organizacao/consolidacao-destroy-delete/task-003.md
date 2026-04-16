# ARQ-DEL-003 — Atualizar testes de `eventoService` e `eventoSSRController`

## Identificador

ARQ-DEL-003

## Feature

consolidacao-destroy-delete

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

ALTA

## Pré-requisitos

- ARQ-DEL-001 e ARQ-DEL-002 implementados

## Descrição

Atualizar os arquivos de teste que referenciam os métodos renomeados/removidos.

---

## Arquivos a atualizar

### 1. `tests/services/eventoService.test.js`

**Renomear o `describe('delete', ...)` para `describe('softDelete', ...)`:**

```js
// ANTES:
describe('delete', () => {
  it('deve deletar um evento existente e soft-delete nas associações', async () => {
    // ...
    await eventoService.delete(1)
    // ...
  })
  it('deve retornar null se o evento não existir', async () => {
    // ...
    const result = await eventoService.delete(999)
    // ...
  })
})

// DEPOIS:
describe('softDelete', () => {
  it('deve fazer soft delete do evento e das associações UsuarioEvento', async () => {
    // ...
    await eventoService.softDelete(1)
    // ...
  })
  it('deve retornar null se o evento não existir', async () => {
    // ...
    const result = await eventoService.softDelete(999)
    // ...
  })
})
```

**Verificar e atualizar os testes de `destroy`** (linhas 122–132 aproximadas):

- Os testes `it('destroy retorna null...')` e `it('destroy chama destroy...')` referem-se ao método removido.
- **Opção A:** Remover esses testes — o método não existe mais.
- **Opção B:** Converter em teste negativo: verificar que `eventoService.destroy` não está definido.

**Recomendação: Opção A** — remover os testes de `destroy` junto com o método, mantendo apenas o teste do `softDelete` com cascata.

---

### 2. `tests/controllers/eventoSSRController.test.js`

**Linha 136 — atualizar mock de `delete` para `softDelete`:**

```js
// ANTES:
eventoService.delete.mockResolvedValue({})

// DEPOIS:
eventoService.softDelete.mockResolvedValue({})
```

**Linha 145 — atualizar mock de rejeição:**

```js
// ANTES:
eventoService.delete.mockRejectedValue(new Error('erro'))

// DEPOIS:
eventoService.softDelete.mockRejectedValue(new Error('erro'))
```

---

## Critérios de aceite

- [ ] `tests/services/eventoService.test.js` contém `describe('softDelete', ...)` com testes de cascata em `UsuarioEvento`.
- [ ] Testes de `destroy` removidos de `eventoService.test.js`.
- [ ] `tests/controllers/eventoSSRController.test.js` usa `eventoService.softDelete.mockResolvedValue`.
- [ ] `npm run check` passa sem erros após todas as atualizações.

## Estimativa

P (até 30min)
