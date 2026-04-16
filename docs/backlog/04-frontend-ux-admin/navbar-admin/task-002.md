# TASK ID: FRONT-NAV-002

## Título

Adicionar ícone Font Awesome a cada item de navegação da navbar admin

## Tipo

código

## Dependências

- FRONT-NAV-001 (Font Awesome disponível no layout)

## Objetivo

Adicionar um `<i class="fa-solid fa-...">` antes de cada label de texto na navbar. Melhora o scan visual e reduz ambiguidade quando o painel é visitado em telas estreitas.

## Arquivo envolvido

`views/layouts/admin.hbs`

## Mapeamento de ícones

| Item                              | Ícone FA6                   |
| --------------------------------- | --------------------------- |
| Dashboard                         | `fa-solid fa-house`         |
| Certificados                      | `fa-solid fa-award`         |
| Participantes                     | `fa-solid fa-users`         |
| Eventos                           | `fa-solid fa-calendar-days` |
| Tipos de Certificados             | `fa-solid fa-tags`          |
| Usuários                          | `fa-solid fa-user-gear`     |
| Área Pública (task FRONT-NAV-003) | `fa-solid fa-globe`         |

## Situação atual (trecho da navbar, linhas ~15–40)

```hbs
<a class='nav-link text-white' href='/admin/dashboard'>Dashboard</a>
<a class='nav-link text-white' href='/admin/certificados'>Certificados</a>
<a class='nav-link text-white' href='/admin/participantes'>Participantes</a>
{{#if usuario.isAdmin}}
  <a class='nav-link text-white' href='/admin/eventos'>Eventos</a>
  <a class='nav-link text-white' href='/admin/tipos-certificados'>Tipos</a>
  <a class='nav-link text-white' href='/admin/usuarios'>Usuários</a>
{{/if}}
{{#if usuario.isGestor}}
  <a class='nav-link text-white' href='/admin/eventos'>Eventos</a>
  <a class='nav-link text-white' href='/admin/tipos-certificados'>Tipos</a>
{{/if}}
```

## Situação desejada

```hbs
<a class='nav-link text-white' href='/admin/dashboard'>
  <i class='fa-solid fa-house me-1'></i>Dashboard
</a>
<a class='nav-link text-white' href='/admin/certificados'>
  <i class='fa-solid fa-award me-1'></i>Certificados
</a>
<a class='nav-link text-white' href='/admin/participantes'>
  <i class='fa-solid fa-users me-1'></i>Participantes
</a>
{{#if usuario.isAdmin}}
  <a class='nav-link text-white' href='/admin/eventos'>
    <i class='fa-solid fa-calendar-days me-1'></i>Eventos
  </a>
  <a class='nav-link text-white' href='/admin/tipos-certificados'>
    <i class='fa-solid fa-tags me-1'></i>Tipos de Certificados
  </a>
  <a class='nav-link text-white' href='/admin/usuarios'>
    <i class='fa-solid fa-user-gear me-1'></i>Usuários
  </a>
{{/if}}
{{#if usuario.isGestor}}
  <a class='nav-link text-white' href='/admin/eventos'>
    <i class='fa-solid fa-calendar-days me-1'></i>Eventos
  </a>
  <a class='nav-link text-white' href='/admin/tipos-certificados'>
    <i class='fa-solid fa-tags me-1'></i>Tipos de Certificados
  </a>
{{/if}}
```

**Nota:** Esta task aproveita para expandir "Tipos" para "Tipos de Certificados" em ambas as ocorrências, antecipando a task FRONT-NAV-003, ou ficará como task separada — a implementação simultânea é preferível para evitar dois passes no mesmo bloco.

## Notas de implementação

- `me-1` é a classe Bootstrap de margem direita mínima, que separa o ícone do texto.
- Os `<i>` não precisam de `aria-hidden="true"` neste contexto pois são decorativos e o label de texto já descreve o link.

## Critério de aceite

- `grep -c "fa-solid" views/layouts/admin.hbs` retorna ≥ 6
- Cada item de navegação exibe ícone antes do label
- `npm run check` passa
