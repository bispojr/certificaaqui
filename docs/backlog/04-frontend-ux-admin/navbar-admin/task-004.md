# TASK ID: FRONT-NAV-004

## Título

Implementar classe `active` no item de navegação correspondente à rota atual

## Tipo

código

## Dependências

- FRONT-NAV-002 (ícones adicionados — bloco da navbar em formato final)

## Objetivo

Destacar visualmente o item de navegação que corresponde à seção em que o usuário está, adicionando a classe `active` Bootstrap dinamicamente. O `active` altera a aparência do link (texto branco sólido vs. semi-transparente).

## Estratégia

Expor `req.path` via `res.locals.currentPath` em um middleware global no `app.js`, e comparar no template Handlebars usando o helper `eq` já registrado em `hbs-helpers.js`.

### 1. Adicionar middleware em `app.js`

Inserir após o bloco de `res.locals.flash` (linhas ~54–61):

```js
// Expor path atual para templates SSR
app.use((req, res, next) => {
  res.locals.currentPath = req.path
  next()
})
```

**Posição exata:** após o `app.use((req, res, next) => { res.locals.flash = ... })` existente.

### 2. Adicionar helper `startsWith` em `hbs-helpers.js`

O helper `eq` existente faz comparação exata, mas as rotas admin têm subpaths (ex.: `/certificados` e `/certificados/novo` devem ambas marcar "Certificados" como ativo). Adicionar um helper `startsWith`:

```js
handlebarsInstance.registerHelper('startsWith', function (str, prefix) {
  return typeof str === 'string' && str.startsWith(prefix)
})
```

Inserir dentro da função `registerHelpers(handlebarsInstance)` em `hbs-helpers.js`, junto com os demais helpers.

### 3. Modificar a navbar em `admin.hbs`

Substituir `class='nav-link text-white'` por expressão condicional:

```hbs
<a
  class='nav-link text-white {{#if (startsWith currentPath "/admin/dashboard")}}active{{/if}}'
  href='/admin/dashboard'
>
  <i class='fa-solid fa-house me-1'></i>Dashboard
</a>
<a
  class='nav-link text-white {{#if (startsWith currentPath "/admin/certificados")}}active{{/if}}'
  href='/admin/certificados'
>
  <i class='fa-solid fa-award me-1'></i>Certificados
</a>
<a
  class='nav-link text-white {{#if (startsWith currentPath "/admin/participantes")}}active{{/if}}'
  href='/admin/participantes'
>
  <i class='fa-solid fa-users me-1'></i>Participantes
</a>
{{#if usuario.isAdmin}}
  <a
    class='nav-link text-white {{#if (startsWith currentPath "/admin/eventos")}}active{{/if}}'
    href='/admin/eventos'
  >
    <i class='fa-solid fa-calendar-days me-1'></i>Eventos
  </a>
  <a
    class='nav-link text-white {{#if (startsWith currentPath "/admin/tipos-certificados")}}active{{/if}}'
    href='/admin/tipos-certificados'
  >
    <i class='fa-solid fa-tags me-1'></i>Tipos de Certificados
  </a>
  <a
    class='nav-link text-white {{#if (startsWith currentPath "/admin/usuarios")}}active{{/if}}'
    href='/admin/usuarios'
  >
    <i class='fa-solid fa-user-gear me-1'></i>Usuários
  </a>
{{/if}}
```

Idem para o bloco `{{#if usuario.isGestor}}`.

## Notas de implementação

- `currentPath` contém apenas o `pathname` (sem query string), então `/admin/certificados?status=emitido` resulta em `currentPath = '/admin/certificados'` — comparação via `startsWith` funciona corretamente.
- O middleware `currentPath` deve ser adicionado **antes** do roteamento (`app.use('/admin', adminRouter)`) para garantir que esteja disponível em todos os templates SSR.
- O helper `startsWith` é adicionado à mesma função `registerHelpers` usada pelos testes — a cobertura de testes do helper pode ser adicionada opcionalmente, mas não é blocker desta task.

## Verificação

Acessar `/admin/certificados` → somente o item "Certificados" deve ter aparência destacada.
Acessar `/admin/certificados/1` → "Certificados" ainda deve estar ativo (`startsWith`).

## Critério de aceite

- `hbs-helpers.js` contém o helper `startsWith`
- `app.js` contém `res.locals.currentPath = req.path`
- O item de navegação correspondente à rota atual tem classe `active` em páginas admin
- `npm run check` passa
