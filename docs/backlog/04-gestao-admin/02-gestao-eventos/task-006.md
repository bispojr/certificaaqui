# TASK ID: ADMIN-EVT-006

## Título
Registrar `adminRouter` em `app.js` e atualizar teste de `eventoService.findAll`

## Objetivo
Adicionar o registro de `adminRouter` em `app.js` para ativar o painel `/admin`, e atualizar o teste de `findAll` em `eventoService.test.js` para o novo contrato paginado do ADMIN-EVT-003.

## Contexto
- `app.js`: `adminRouter` NÃO está registrado — `src/routes/admin.js` foi criado em ADMIN-EVT-005 mas ainda não importado
- `tests/services/eventoService.test.js` linha 39: `it('findAll chama Evento.findAll', ...)` usa `findAll` no mock, que foi substituído por `findAndCountAll` no ADMIN-EVT-003

## Arquivos envolvidos
- `app.js`
- `tests/services/eventoService.test.js`

## Passos

### 1. `app.js` — adicionar import do adminRouter no bloco de require das rotas:
Localizar as linhas de import de rotas (ex: linha com `var publicRouter`):
```js
var publicRouter = require('./src/routes/public')
```
Adicionar após:
```js
var adminRouter = require('./src/routes/admin')
```

### 2. `app.js` — registrar no bloco de app.use (após as rotas existentes, antes do handler de erros):
Localizar:
```js
app.use('/public', publicRouter)
```
Adicionar após:
```js
app.use('/admin', adminRouter)
```

### 3. `tests/services/eventoService.test.js` — atualizar mock e teste de findAll:

#### 3a. Adicionar `findAndCountAll` ao mock de `Evento`:
No objeto `jest.mock`, no bloco de `Evento`, adicionar a chave:
```js
findAndCountAll: jest.fn(),
```

#### 3b. Substituir o teste legado de findAll:
Substituir:
```js
  it('findAll chama Evento.findAll', async () => {
    await eventoService.findAll()
    expect(Evento.findAll).toHaveBeenCalled()
  })
```
Por:
```js
  describe('findAll', () => {
    it('chama findAndCountAll com offset e limit corretos', async () => {
      Evento.findAndCountAll.mockResolvedValue({ count: 10, rows: [] })
      await eventoService.findAll({ page: 2, perPage: 5 })
      expect(Evento.findAndCountAll).toHaveBeenCalledWith({ offset: 5, limit: 5 })
    })

    it('retorna { data, meta } com estrutura correta', async () => {
      const rows = [{ id: 1 }, { id: 2 }]
      Evento.findAndCountAll.mockResolvedValue({ count: 8, rows })
      const result = await eventoService.findAll({ page: 1, perPage: 10 })
      expect(result).toEqual({
        data: rows,
        meta: { total: 8, page: 1, perPage: 10, totalPages: 1 },
      })
    })

    it('usa page=1 e perPage=20 como defaults', async () => {
      Evento.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
      await eventoService.findAll()
      expect(Evento.findAndCountAll).toHaveBeenCalledWith({ offset: 0, limit: 20 })
    })
  })
```

## Resultado esperado
- `GET /admin/dashboard` sem cookie → redireciona para `/auth/login`
- `GET /admin/dashboard` com cookie válido → renderiza `admin/dashboard`
- `npm run check` passa sem erros

## Critério de aceite
- `app.use('/admin', adminRouter)` presente em `app.js`
- `var adminRouter = require('./src/routes/admin')` presente em `app.js`
- `Evento.findAndCountAll` no mock e 3 novos testes de `findAll` passando
- Nenhum teste existente removido
