# Task: TEST-USR-SSR-003 — Adicionar testes de `restaurar` e `index?q=` ao `usuarioSSRController`

## Identificador
TEST-USR-SSR-003

## Feature
testes-controllers-ssr

## Prioridade
ALTA

## Contexto

`tests/controllers/usuarioSSRController.test.js` cobre os seguintes blocos `describe`:
- `index` (listagem geral sem filtro)
- `novo` (form de criação)
- `editar` (form de edição)
- `criar` (POST — sucesso)
- `atualizar` (PUT — sucesso)
- `deletar` (soft delete)

**Lacunas confirmadas:**

1. **`restaurar`** — o controller `usuarioSSRController.restaurar()` existe mas não há `describe('restaurar', ...)` nos testes.
2. **`index?q=`** — o bloco `describe('index', ...)` não cobre o filtro de busca textual por nome/email. Essa busca será implementada por FRONT-BUSCA-003.

---

## O que implementar

### 1. Teste de `restaurar` (sucesso)

Adicionar `describe('restaurar', ...)` ao final do arquivo:

```javascript
describe('restaurar', () => {
  it('deve restaurar usuário arquivado e redirecionar', async () => {
    // Arrange
    usuarioService.restore.mockResolvedValueOnce({ id: 1, nome: 'Admin', deletedAt: null })

    // Act
    const res = await request(app)
      .post('/admin/usuarios/1/restaurar')
      .set('x-test-user-id', '1') // admin

    // Assert
    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/admin\/usuarios/)
    expect(usuarioService.restore).toHaveBeenCalledWith('1')
  })
})
```

### 2. Teste de `restaurar` — usuário não encontrado

```javascript
  it('deve exibir erro se usuário não encontrado ao restaurar', async () => {
    // Arrange
    usuarioService.restore.mockResolvedValueOnce(null)

    // Act
    const res = await request(app)
      .post('/admin/usuarios/999/restaurar')
      .set('x-test-user-id', '1')

    // Assert
    expect(res.status).toBe(302)
    // Flash de erro deve ter sido disparado — verificável via redirect location
    expect(res.headers.location).toMatch(/\/admin\/usuarios/)
  })
```

### 3. Teste de `index?q=` (busca textual)

> Este teste só fará sentido após a implementação de FRONT-BUSCA-003 no controller.
> Criar o teste como "pending" ou comentado até que a feature seja implementada.

```javascript
describe('index — busca', () => {
  it.todo('deve filtrar usuários por ?q= via ILIKE em nome e email')
  /*
  Quando implementado, o teste deve:
  - Mockar usuarioService.findAll (ou Usuario.findAll) para retornar resultado filtrado
  - Verificar que a chamada ao modelo inclui where com Op.iLike sobre nome e email
  - Verificar que a view recebe o parâmetro q preenchido (para manter no input de busca)
  */
})
```

### 4. Verificar mock de `usuarioService`

Antes de implementar, verificar se o arquivo atual usa:

```javascript
jest.mock('../../src/services/usuarioService')
```

ou se os testes existentes chamam o banco diretamente. Se o mock não existir, adicionar no topo do arquivo e importar:

```javascript
const usuarioService = require('../../src/services/usuarioService')
jest.mock('../../src/services/usuarioService')
```

### 5. Verificar que `restore` existe em `usuarioService`

Confirmar antes de escrever o teste:

```bash
grep -n "restore\|restaurar" src/services/usuarioService.js
```

Se o método se chama `undelete` ou `restore`, ajustar o mock conforme o nome real.

---

## Arquivo alvo
`tests/controllers/usuarioSSRController.test.js`

## Dependências
- `usuarioService.restore()` deve existir em `src/services/usuarioService.js`
- A rota `POST /admin/usuarios/:id/restaurar` deve estar registrada em `src/routes/admin.js`
- Para o teste de `index?q=`, aguardar FRONT-BUSCA-003

## Critério de conclusão
- `describe('restaurar', ...)` com ao menos 2 cenários passa em `npm run check`
- `it.todo(...)` para o filtro de busca está registrado como lembrete futuro
- Nenhum teste regressivo quebra
