# Task: TEST-PART-SSR-004 — Adicionar testes de CRUD ao `participanteSSRController`

## Identificador
TEST-PART-SSR-004

## Feature
testes-controllers-ssr

## Prioridade
ALTA

## Contexto

`tests/controllers/participanteSSRController.test.js` cobre apenas operações de **listagem**:

| Cobertura existente | Linha |
|---|---|
| `GET /admin/participantes` — gestor (escopo restrito) | 125 |
| `GET /admin/participantes` — monitor (escopo restrito) | 140 |
| `GET /admin/participantes` — admin (todos) | 162 |
| `GET /admin/participantes` — admin (ativos + arquivados separados) | 176 |
| `GET /admin/participantes?q=joao` — admin com filtro | 200 |

**Lacunas confirmadas** (nenhum `describe` para as operações de escrita):

- `GET /admin/participantes/novo` — formulário de criação
- `POST /admin/participantes` — criar participante
- `GET /admin/participantes/:id/editar` — formulário de edição
- `PUT /admin/participantes/:id` — atualizar participante
- `DELETE /admin/participantes/:id` — soft delete (deletar)
- `POST /admin/participantes/:id/restaurar` — restaurar arquivado

---

## O que implementar

O arquivo `tests/controllers/participanteSSRController.test.js` usa `supertest` + banco de teste real (não mocks por model). Manter o mesmo padrão ao adicionar os novos descrtibes.

### 1. `novo` — formulário de criação

```javascript
describe('Admin SSR — Participante: novo', () => {
  it('GET /admin/participantes/novo deve renderizar o formulário', async () => {
    const res = await request(app)
      .get('/admin/participantes/novo')
      .set('x-test-user-perfil', 'admin')

    expect(res.status).toBe(200)
    expect(res.text).toContain('nomeCompleto') // campo do formulário
  })
})
```

### 2. `criar` — POST com sucesso

```javascript
describe('Admin SSR — Participante: criar', () => {
  it('POST /admin/participantes deve criar participante e redirecionar', async () => {
    const res = await request(app)
      .post('/admin/participantes')
      .set('x-test-user-perfil', 'admin')
      .send({
        nomeCompleto: 'Novo Participante',
        email: 'novo@email.com',
        instituicao: 'UFSM',
      })

    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/admin\/participantes/)

    // Verificar persistência no banco
    const criado = await Participante.findOne({ where: { email: 'novo@email.com' } })
    expect(criado).not.toBeNull()
    expect(criado.nomeCompleto).toBe('Novo Participante')
  })

  it('POST /admin/participantes deve rejeitar payload inválido (sem email)', async () => {
    const res = await request(app)
      .post('/admin/participantes')
      .set('x-test-user-perfil', 'admin')
      .send({ nomeCompleto: 'Sem Email' })

    // Controller deve redirecionar ou retornar 400/422 — documentar comportamento atual
    expect([302, 400, 422]).toContain(res.status)
  })
})
```

### 3. `editar` — formulário de edição

```javascript
describe('Admin SSR — Participante: editar', () => {
  it('GET /admin/participantes/1/editar deve renderizar o formulário preenchido', async () => {
    const res = await request(app)
      .get('/admin/participantes/1/editar')
      .set('x-test-user-perfil', 'admin')

    expect(res.status).toBe(200)
    expect(res.text).toContain('João da Silva') // nome do participante criado no setupDb
  })
})
```

### 4. `atualizar` — PUT com sucesso

```javascript
describe('Admin SSR — Participante: atualizar', () => {
  it('PUT /admin/participantes/1 deve atualizar participante e redirecionar', async () => {
    const res = await request(app)
      .put('/admin/participantes/1')
      .set('x-test-user-perfil', 'admin')
      .send({
        nomeCompleto: 'João Atualizado',
        email: 'joao@email.com',
        instituicao: 'UFRGS',
      })

    expect(res.status).toBe(302)

    const atualizado = await Participante.findByPk(1)
    expect(atualizado.nomeCompleto).toBe('João Atualizado')
    expect(atualizado.instituicao).toBe('UFRGS')
  })
})
```

### 5. `deletar` — soft delete

```javascript
describe('Admin SSR — Participante: deletar', () => {
  it('DELETE /admin/participantes/1 deve arquivar participante (soft delete)', async () => {
    const res = await request(app)
      .delete('/admin/participantes/1')
      .set('x-test-user-perfil', 'admin')

    expect(res.status).toBe(302)

    const arquivado = await Participante.findOne({
      where: { id: 1 },
      paranoid: false,
    })
    expect(arquivado.deletedAt).not.toBeNull()
  })
})
```

### 6. `restaurar` — restore

```javascript
describe('Admin SSR — Participante: restaurar', () => {
  it('POST /admin/participantes/2/restaurar deve restaurar participante arquivado', async () => {
    // Participante id=2 foi criado com deleted_at no setupDb
    const res = await request(app)
      .post('/admin/participantes/2/restaurar')
      .set('x-test-user-perfil', 'admin')

    expect(res.status).toBe(302)

    const restaurado = await Participante.findByPk(2, { paranoid: false })
    expect(restaurado.deletedAt).toBeNull()
  })
})
```

---

## Observações de implementação

- O arquivo usa `setupDb()` com `beforeEach` ou `beforeAll` — garantir que os participantes `id: 1` e `id: 2` estão disponíveis nos testes de `editar`, `atualizar`, `deletar` e `restaurar`. Se `setupDb` for chamado com `beforeAll`, os testes de escrita devem ser sequenciais e considerar mudanças de estado.
- Verificar como o mecanismo de autenticação SSR está configurado neste arquivo: pode usar `x-test-user-id` ou `x-test-user-perfil`. Manter consistência com o padrão existente no arquivo.
- Checar se a rota `restaurar` usa `POST` ou `PATCH`. Confirmar com:
  ```bash
  grep -n "restaurar" src/routes/admin.js
  ```

---

## Arquivo alvo
`tests/controllers/participanteSSRController.test.js`

## Dependencies
- `setupDb()` já cria participantes id=1 (ativo) e id=2 (arquivado) — reutilizar
- Rota `DELETE /admin/participantes/:id` deve estar registrada
- Rota `POST /admin/participantes/:id/restaurar` deve estar registrada

## Critério de conclusão
- Os 6 novos `describe` blocos passam em `npm run check`
- Soft delete de participante se reflete no banco (`deletedAt` não nulo)
- Restore de participante se reflete no banco (`deletedAt` nulo)
- Nenhum teste regressivo quebra
