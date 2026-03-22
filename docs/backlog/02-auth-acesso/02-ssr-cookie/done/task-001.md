# TASK ID: AUTH-SSR-001

## Título

Criar `views/auth/login.hbs` — formulário de login

## Objetivo

Criar a view Handlebars do formulário de login SSR, exibindo campos `email` e `senha`, mensagens de erro via flash e usando o layout público (`layout.hbs`).

## Contexto

O layout público existe em `views/layout.hbs` e já possui:

- Bootstrap 5 via CDN
- Slot de flash messages (`{{#if flash.error}}`)
- Navbar pública

A rota `POST /auth/login` (criada na TASK-003) vai redirecionar de volta para `GET /auth/login` com `req.flash('error', '...')` em caso de credenciais inválidas.

O formulário deve fazer `POST /auth/login`.

## Arquivos envolvidos

- `views/auth/login.hbs` ← criar (novo arquivo, novo diretório)

## Passos

1. Criar o diretório `views/auth/` (se não existir).
2. Criar `views/auth/login.hbs` com o conteúdo:

```hbs
<div class='row justify-content-center mt-5'>
  <div class='col-md-4'>
    <div class='card shadow-sm'>
      <div class='card-body'>
        <h4 class='card-title mb-4 text-center'>Entrar</h4>

        {{#if flash.error}}
          {{#each flash.error}}
            <div class='alert alert-danger'>{{this}}</div>
          {{/each}}
        {{/if}}

        <form action='/auth/login' method='POST'>
          <div class='mb-3'>
            <label for='email' class='form-label'>E-mail</label>
            <input
              type='email'
              class='form-control'
              id='email'
              name='email'
              required
              autocomplete='email'
            />
          </div>
          <div class='mb-3'>
            <label for='senha' class='form-label'>Senha</label>
            <input
              type='password'
              class='form-control'
              id='senha'
              name='senha'
              required
              autocomplete='current-password'
            />
          </div>
          <div class='d-grid'>
            <button type='submit' class='btn btn-primary'>Entrar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
```

## Resultado esperado

- `views/auth/login.hbs` criado com formulário Bootstrap 5
- Exibe mensagens de erro flash quando presentes
- Envia `POST /auth/login` com campos `email` e `senha`

## Critério de aceite

- Arquivo existe em `views/auth/login.hbs`
- Contém `<form action='/auth/login' method='POST'>`
- Contém `{{#if flash.error}}` para exibição de erros
- `npm run check` passa sem erros

## Metadados
- Completado em: 22/03/2026 19:05 ✅