# FEATURE: Melhoria da Navbar Administrativa

## Domínio

04 — Frontend / UX Admin

## Identificador

FRONT-NAV

## Prioridade

BAIXA

## Descrição

A navbar do painel admin (`views/layouts/admin.hbs`) apresenta múltiplos problemas de usabilidade:

1. **Puramente textual, sem ícones** — dificulta scan visual rápido, especialmente em telas menores
2. **Sem indicação de item ativo** — o usuário não sabe em qual seção está (todos os links têm `class='nav-link text-white'` estático)
3. **Label "Tipos" truncado** — o real significado é "Tipos de Certificados"; o label curto gera ambiguidade
4. **Sem link para a área pública** — o admin/gestor não consegue navegar para `/` sem editar a URL manualmente
5. **Sem separador visual** entre o bloco de navegação e o bloco de conta (nome + botão Sair)

## Situação atual do `admin.hbs` (navbar, linhas ~12–48)

```hbs
<nav class='navbar navbar-expand-lg navbar-dark bg-dark'>
  <div class='container-fluid'>
    <a class='navbar-brand' href='/admin/dashboard'>Certifique-me Admin</a>
    <div class='navbar-nav me-auto'>
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
    </div>
    <div class='navbar-nav'>
      <span class='navbar-text text-white me-3'>{{usuario.nome}} ({{usuario.perfil}})</span>
      <form action='/auth/logout' method='POST' class='d-inline'>
        <button type='submit' class='btn btn-sm btn-outline-light'>Sair</button>
      </form>
    </div>
  </div>
</nav>
```

## Arquivos envolvidos

- `views/layouts/admin.hbs` — único arquivo da navbar
- `app.js` ou middleware global — para expor `req.path` via `res.locals.currentPath` (necessário para classe `active`)

## Tasks

- `task-001.md` — FRONT-NAV-001: Adicionar Font Awesome 6 via CDN
- `task-002.md` — FRONT-NAV-002: Adicionar ícone a cada item de navegação
- `task-003.md` — FRONT-NAV-003: Expandir "Tipos" para "Tipos de Certificados" e adicionar link "Área Pública"
- `task-004.md` — FRONT-NAV-004: Implementar classe `active` no item de navegação atual
- `task-005.md` — FRONT-NAV-005: Adicionar separador visual entre grupos de navegação e conta do usuário
- `task-006.md` — FRONT-NAV-006: Refatorar duplicação admin/gestor na navbar com bloco único

## Critério de aceite global

- Font Awesome 6 disponível em todas as páginas do painel admin
- Cada item de navegação exibe ícone FA ao lado do label
- O item correspondente à rota atual tem classe `active` (visual destacado)
- Label "Tipos" substituído por "Tipos de Certificados"
- Link "Área Pública" visível para todos os perfis
- Separador visual entre navegação e bloco de conta
- `npm run check` passa
