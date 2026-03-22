# TASK ID: AUTH-SSR-004

## Título

Registrar rota `/auth` no `app.js`

## Objetivo

Adicionar o import do `authRouter` e registrá-lo em `app.use('/auth', authRouter)` no `app.js`, tornando as rotas de login/logout SSR acessíveis.

## Contexto

**Pré-requisito:** TASK-003 (`src/routes/auth.js`) já executada.

O padrão de registro existente no `app.js` (linhas 13–22 e 151–160):

```js
// imports
var participantesRouter = require('./src/routes/participantes')
// ...
var publicRouter = require('./src/routes/public')

// registros
app.use('/participantes', participantesRouter)
// ...
app.use('/public', publicRouter)
app.use(healthRouter)
```

O `authRouter` deve ser adicionado seguindo o mesmo padrão, preferencialmente junto com os demais imports e registros.

## Arquivos envolvidos

- `app.js` ← editar (2 alterações: import + registro)

## Passos

1. Na seção de imports (entre as linhas de `publicRouter` e a linha em branco seguinte), adicionar:

   ```js
   var authRouter = require('./src/routes/auth')
   ```

2. Na seção de registros de rotas (junto com os demais `app.use`), adicionar antes de `app.use('/public', publicRouter)`:

   ```js
   app.use('/auth', authRouter)
   ```

3. Não alterar nenhuma outra linha do arquivo.

## Resultado esperado

- `app.js` importa `authRouter` de `./src/routes/auth`
- `app.use('/auth', authRouter)` registrado
- `GET /auth/login` está acessível na aplicação

## Critério de aceite

- `app.js` contém `require('./src/routes/auth')`
- `app.js` contém `app.use('/auth', authRouter)`
- `npm run check` passa sem erros
