# TASK ID: AUTH-JWT-001

## Título

Aplicar rate limiting em `POST /usuarios/login`

## Objetivo

Instalar `express-rate-limit` e aplicar o middleware diretamente na rota `POST /usuarios/login` para limitar tentativas de login a 10 requisições por IP em janela de 15 minutos, retornando 429 ao exceder.

## Contexto

A rota de login existe em `src/routes/usuarios.js`. Atualmente não há qualquer rate limiting aplicado.
O pacote `express-rate-limit` não está instalado (`package.json` não contém a dependência).

Comportamento esperado pelo `express-rate-limit`:

- Ao exceder o limite, retorna automaticamente HTTP 429 com mensagem configurável
- O limite deve ser aplicado apenas em `POST /usuarios/login`, não em outras rotas

Padrão de uso do `express-rate-limit`:

```js
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})
```

A rota de login atual em `src/routes/usuarios.js` é:

```js
router.post('/login', usuarioController.login)
```

Após a alteração deverá ser:

```js
router.post('/login', loginLimiter, usuarioController.login)
```

## Arquivos envolvidos

- `src/routes/usuarios.js` ← editar (adicionar import + aplicar middleware na rota)

## Passos

1. Instalar o pacote:

   ```bash
   npm install express-rate-limit
   ```

2. Em `src/routes/usuarios.js`, adicionar o import no topo do arquivo (após os imports existentes):

   ```js
   const rateLimit = require('express-rate-limit')
   ```

3. Logo após os imports, definir o limiter:

   ```js
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 10,
     message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
     standardHeaders: true,
     legacyHeaders: false,
   })
   ```

4. Localizar a linha `router.post('/login', usuarioController.login)` e inserir `loginLimiter` como segundo argumento:

   ```js
   router.post('/login', loginLimiter, usuarioController.login)
   ```

5. Executar `npm run check` para confirmar que os testes passam.

## Resultado esperado

- `express-rate-limit` instalado e listado em `dependencies` do `package.json`
- `POST /usuarios/login` retorna 429 após 10 tentativas em 15 minutos
- Nenhuma outra rota é afetada

## Critério de aceite

- `package.json` contém `express-rate-limit` em `dependencies`
- `src/routes/usuarios.js` importa `rateLimit` e aplica `loginLimiter` em `POST /login`
- `loginLimiter` não está aplicado em nenhuma outra rota do arquivo
- `npm run check` passa sem erros
