# Task: TEST-CERT-SSR-001 — Adicionar testes de `index` com filtros ao `certificadoSSRController`

## Identificador
TEST-CERT-SSR-001

## Feature
testes-controllers-ssr

## Prioridade
ALTA

## Contexto

O bloco `describe('index', ...)` em `tests/controllers/certificadoSSRController.test.js` contém atualmente um único teste:

```
it('deve renderizar certificados e arquivados para admin')
```

Esse cenário cobre apenas o caminho feliz do perfil admin sem filtros aplicados.

Lacunas identificadas:

1. Sem filtro `?q=` (busca por nome/código)
2. Sem filtro `?evento_id=`
3. Sem filtro `?tipo_id=`
4. Sem filtro `?status=arquivados` (mostrar apenas arquivados)
5. Sem cobertura do perfil gestor (onde `eventoIds` restringe a query)

---

## O que implementar

### 1. `index` com `?q=` (busca textual)

Adicionar ao `describe('index', ...)` existente:

```javascript
it('deve filtrar certificados por ?q= passado na query', async () => {
  // Arrange
  Certificado.findAll
    .mockResolvedValueOnce([{ id: 1, nome: 'João', codigo: 'EVT-001' }]) // ativos
    .mockResolvedValueOnce([]) // arquivados

  // Act
  const res = await request(app)
    .get('/admin/certificados?q=joao')
    .set('x-test-user-id', '1') // admin

  // Assert
  expect(res.status).toBe(200)
  // Verificar que findAll foi chamado com where contendo Op.iLike sobre nome ou codigo
  const chamadaFindAll = Certificado.findAll.mock.calls[0][0]
  expect(chamadaFindAll.where).toBeDefined()
})
```

> Nota: O teste valida que o controller repassa o filtro para o `where`. A implementação real do `ILIKE` é coberta pelo teste do service (FRONT-BUSCA-001).

### 2. `index` com `?evento_id=`

```javascript
it('deve filtrar certificados por ?evento_id=', async () => {
  Certificado.findAll
    .mockResolvedValueOnce([{ id: 2, evento_id: 5 }])
    .mockResolvedValueOnce([])

  const res = await request(app)
    .get('/admin/certificados?evento_id=5')
    .set('x-test-user-id', '1')

  expect(res.status).toBe(200)
  const whereAtivos = Certificado.findAll.mock.calls[0][0].where
  expect(whereAtivos).toMatchObject({ evento_id: '5' })
})
```

### 3. `index` com `?tipo_id=`

```javascript
it('deve filtrar certificados por ?tipo_id=', async () => {
  Certificado.findAll
    .mockResolvedValueOnce([{ id: 3, tipo_certificado_id: 2 }])
    .mockResolvedValueOnce([])

  const res = await request(app)
    .get('/admin/certificados?tipo_id=2')
    .set('x-test-user-id', '1')

  expect(res.status).toBe(200)
  const whereAtivos = Certificado.findAll.mock.calls[0][0].where
  expect(whereAtivos).toMatchObject({ tipo_certificado_id: '2' })
})
```

### 4. `index` com `?status=arquivados`

```javascript
it('deve retornar apenas arquivados quando ?status=arquivados', async () => {
  Certificado.findAll
    .mockResolvedValueOnce([]) // ativos
    .mockResolvedValueOnce([{ id: 4, deleted_at: new Date() }]) // arquivados

  const res = await request(app)
    .get('/admin/certificados?status=arquivados')
    .set('x-test-user-id', '1')

  expect(res.status).toBe(200)
  // Verificar que o segundo findAll (paranoid: false) foi chamado
  expect(Certificado.findAll).toHaveBeenCalledTimes(2)
})
```

### 5. `index` para perfil gestor (escopo restrito)

Adicionar bloco `describe('index — gestor', ...)` separado (ou aninhado):

```javascript
it('deve filtrar certificados pelo eventoIds do gestor', async () => {
  // Arrange — mock do escopo
  UsuarioEvento.findAll.mockResolvedValueOnce([{ evento_id: 3 }])
  Certificado.findAll
    .mockResolvedValueOnce([{ id: 5, evento_id: 3 }])
    .mockResolvedValueOnce([])

  const res = await request(app)
    .get('/admin/certificados')
    .set('x-test-user-id', '2') // gestor (não admin)

  expect(res.status).toBe(200)
  // Verificar que o where contém restrição por evento_id
  const whereAtivos = Certificado.findAll.mock.calls[0][0].where
  expect(whereAtivos).toHaveProperty('evento_id')
})
```

---

## Arquivo alvo
`tests/controllers/certificadoSSRController.test.js`

## Dependências
- O controller já existe e trata `req.query.q`, `req.query.evento_id`, `req.query.tipo_id`, `req.query.status`
- O mecanismo de mock de autenticação via `x-test-user-id` já está configurado em `authSSR.js`
- `Certificado.findAll` e `UsuarioEvento.findAll` já são mockados no arquivo de teste

## Critério de conclusão
- Todos os novos testes passam em `npm run check`
- `Certificado.findAll.mock.calls[0][0].where` reflete os filtros aplicados ao controller
- O teste do gestor valida que `evento_id` está restrito ao escopo do usuário
