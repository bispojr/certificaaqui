# ARQ-ESC-004 — Testes unitários de `getScopedEventoIds`

## Identificador

ARQ-ESC-004

## Feature

helper-escopo-evento

## Domínio

07 — Arquitetura e Organização de Código

## Prioridade

ALTA

## Pré-requisitos

- ARQ-ESC-001 implementado

## Descrição

Cobrir `getScopedEventoIds` com testes unitários que mockam `UsuarioEvento.findAll`, garantindo os 3 casos de uso sem dependência de banco de dados.

---

## Arquivo a criar

**`tests/utils/getScopedEventoIds.test.js`**

```js
'use strict'

jest.mock('../../src/models', () => ({
  UsuarioEvento: {
    findAll: jest.fn(),
  },
}))

const { UsuarioEvento } = require('../../src/models')
const { getScopedEventoIds } = require('../../src/utils/getScopedEventoIds')

describe('getScopedEventoIds', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna null quando usuario é null', async () => {
    const result = await getScopedEventoIds(null)
    expect(result).toBeNull()
    expect(UsuarioEvento.findAll).not.toHaveBeenCalled()
  })

  it('retorna null para perfil admin', async () => {
    const result = await getScopedEventoIds({ id: 1, perfil: 'admin' })
    expect(result).toBeNull()
    expect(UsuarioEvento.findAll).not.toHaveBeenCalled()
  })

  it('retorna array de IDs para gestor com eventos', async () => {
    UsuarioEvento.findAll.mockResolvedValue([
      { evento_id: 10 },
      { evento_id: 20 },
    ])

    const result = await getScopedEventoIds({ id: 5, perfil: 'gestor' })

    expect(UsuarioEvento.findAll).toHaveBeenCalledWith({
      where: { usuario_id: 5 },
      attributes: ['evento_id'],
    })
    expect(result).toEqual([10, 20])
  })

  it('retorna array vazio para gestor sem eventos vinculados', async () => {
    UsuarioEvento.findAll.mockResolvedValue([])

    const result = await getScopedEventoIds({ id: 7, perfil: 'gestor' })

    expect(result).toEqual([])
  })

  it('retorna array de IDs para perfil monitor', async () => {
    UsuarioEvento.findAll.mockResolvedValue([{ evento_id: 99 }])

    const result = await getScopedEventoIds({ id: 3, perfil: 'monitor' })

    expect(result).toEqual([99])
  })
})
```

---

## Critérios de aceite

- [ ] `tests/utils/getScopedEventoIds.test.js` existe e todos os 5 testes passam.
- [ ] `UsuarioEvento.findAll` não é chamado para perfil `admin` ou `null`.
- [ ] Para gestor/monitor, `findAll` é chamado com `{ where: { usuario_id: X }, attributes: ['evento_id'] }`.
- [ ] Testes são isolados (jest.mock — sem banco de dados).
- [ ] O arquivo é detectado pelo runner de testes existente (padrão `tests/**/*.test.js`).

## Estimativa

P (até 30min)
