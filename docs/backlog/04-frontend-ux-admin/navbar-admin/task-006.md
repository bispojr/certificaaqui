# TASK ID: FRONT-NAV-006

## Título

Refatorar duplicação admin/gestor na navbar — bloco único com visibilidade condicional por item

## Tipo

código

## Dependências

- FRONT-NAV-002, FRONT-NAV-003, FRONT-NAV-004 (bloco da navbar em estrutura final com ícones e active)

## Objetivo

A navbar atual repete os links "Eventos" e "Tipos de Certificados" em dois blocos separados (`{{#if usuario.isAdmin}}` e `{{#if usuario.isGestor}}`). Qualquer mudança futura (novo ícone, novo atributo `active`, novo label) precisa ser aplicada em dois lugares, gerando risco de divergência silenciosa.

Refatorar para um único bloco de navegação onde cada link tem visibilidade condicional inline.

## Arquivo envolvido

`views/layouts/admin.hbs`

## Situação atual (após FRONT-NAV-002 a 004)

```hbs
<div class='navbar-nav me-auto'>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/dashboard")}}active{{/if}}'
     href='/admin/dashboard'>
    <i class='fa-solid fa-house me-1'></i>Dashboard
  </a>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/certificados")}}active{{/if}}'
     href='/admin/certificados'>
    <i class='fa-solid fa-award me-1'></i>Certificados
  </a>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/participantes")}}active{{/if}}'
     href='/admin/participantes'>
    <i class='fa-solid fa-users me-1'></i>Participantes
  </a>
  {{#if usuario.isAdmin}}
    <a ...>Eventos</a>
    <a ...>Tipos de Certificados</a>
    <a ...>Usuários</a>
  {{/if}}
  {{#if usuario.isGestor}}
    <a ...>Eventos</a>
    <a ...>Tipos de Certificados</a>
  {{/if}}
  <a class='nav-link text-white-50' href='/'>
    <i class='fa-solid fa-globe me-1'></i>Área Pública
  </a>
</div>
```

## Situação desejada

```hbs
<div class='navbar-nav me-auto'>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/dashboard")}}active{{/if}}'
     href='/admin/dashboard'>
    <i class='fa-solid fa-house me-1'></i>Dashboard
  </a>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/certificados")}}active{{/if}}'
     href='/admin/certificados'>
    <i class='fa-solid fa-award me-1'></i>Certificados
  </a>
  <a class='nav-link text-white {{#if (startsWith currentPath "/admin/participantes")}}active{{/if}}'
     href='/admin/participantes'>
    <i class='fa-solid fa-users me-1'></i>Participantes
  </a>
  {{#if (or usuario.isAdmin usuario.isGestor)}}
    <a class='nav-link text-white {{#if (startsWith currentPath "/admin/eventos")}}active{{/if}}'
       href='/admin/eventos'>
      <i class='fa-solid fa-calendar-days me-1'></i>Eventos
    </a>
    <a class='nav-link text-white {{#if (startsWith currentPath "/admin/tipos-certificados")}}active{{/if}}'
       href='/admin/tipos-certificados'>
      <i class='fa-solid fa-tags me-1'></i>Tipos de Certificados
    </a>
  {{/if}}
  {{#if usuario.isAdmin}}
    <a class='nav-link text-white {{#if (startsWith currentPath "/admin/usuarios")}}active{{/if}}'
       href='/admin/usuarios'>
      <i class='fa-solid fa-user-gear me-1'></i>Usuários
    </a>
  {{/if}}
  <a class='nav-link text-white-50' href='/'>
    <i class='fa-solid fa-globe me-1'></i>Área Pública
  </a>
</div>
```

## Requisito adicional — helper `or` em `hbs-helpers.js`

O bloco `{{#if (or usuario.isAdmin usuario.isGestor)}}` requer um helper `or` não existente. Adicionar dentro de `registerHelpers`:

```js
handlebarsInstance.registerHelper('or', function (a, b) {
  return a || b
})
```

**Alternativa sem helper:** permanecer com dois blocos separados mas unificar o conteúdo usando um partial HBS `{{> navbar-item-eventos}}`. Para simplicidade, o helper `or` é preferível.

## Notas de implementação

- Verificar se `usuario.isAdmin` e `usuario.isGestor` são valores booleanos nos locals — se forem strings ou undefined, o `or` funciona igualmente pois é truthy check.
- O helper `or` deve ser adicionado à função `registerHelpers(handlebarsInstance)` para que funcione tanto no app quanto nos testes que usam Handlebars puro.

## Verificação

```bash
grep -c "isGestor" views/layouts/admin.hbs
```

Resultado esperado: **1** (apenas uma ocorrência do `isGestor`, no bloco combinado `or`).

```bash
grep -n "Eventos\|Tipos de Certificados" views/layouts/admin.hbs
```

Resultado esperado: apenas **2** ocorrências (uma para cada link), não 4.

## Critério de aceite

- Bloco `{{#if usuario.isGestor}} ... Eventos ... Tipos ...{{/if}}` removido — substituído por `{{#if (or usuario.isAdmin usuario.isGestor)}}`
- `hbs-helpers.js` contém o helper `or`
- Links "Eventos" e "Tipos de Certificados" aparecem corretamente para admin e gestor
- Monitor (sem `isAdmin` nem `isGestor`) não vê esses links
- `npm run check` passa
