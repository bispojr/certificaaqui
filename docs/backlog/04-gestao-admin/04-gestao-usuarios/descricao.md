# Feature: Gestão de Usuários (Admin)

## Domínio
04 — Gestão de Entidades Administrativas

## Objetivo
Interface SSR no painel admin para CRUD completo de usuários do sistema, com associação de eventos por perfil e soft delete.

## Contexto técnico
- Model: `src/models/usuario.js`
  - Campos: `nome`, `email`, `senha`, `perfil` (ENUM: `admin`/`gestor`/`monitor`)
  - `belongsToMany(Evento, { through: UsuarioEvento, as: 'eventos' })`
  - Hooks `beforeCreate`/`beforeUpdate` hashiam `senha` com bcrypt automaticamente
  - `paranoid: true`, tabela `usuarios`
- Sem `usuarioService.js` — controller SSR opera diretamente nos models
- `usuario.setEventos(Array<id>)` já validado no controller API existente
- Routes protegidas por `rbac('admin')` (somente admin pode gerenciar usuários)
- Flash + redirect pattern (igual demais SSR controllers)

## Estado atual
- `src/controllers/usuarioController.js` tem apenas métodos API: `login`, `logout`, `me`, `create`, `updateEventos`
- Nenhum controller SSR existe
- Nenhuma view `views/admin/usuarios/` existe
- Rotas admin SSR ausentes

## Tasks
- task-001: Criar `src/controllers/usuarioSSRController.js` (7 métodos)
- task-002: Criar `views/admin/usuarios/index.hbs`
- task-003: Criar `views/admin/usuarios/form.hbs` com multi-select de eventos
- task-004: Adicionar 7 rotas em `src/routes/admin.js` com `rbac('admin')`

## Dependências

### Externas (de outras features)
- **`02-ssr-cookie` TASK-002** — `src/middlewares/authSSR.js` deve existir antes de ADMIN-USR-004
- **`02-gestao-eventos` ADMIN-EVT-005** — `src/routes/admin.js` deve existir antes de ADMIN-USR-004
- **`02-gestao-eventos` ADMIN-EVT-006** — `adminRouter` deve estar registrado em `app.js` para que as rotas de usuários sejam acessíveis

### Internas (ordem entre tasks desta feature)
- ADMIN-USR-001, 002, 003 → independentes entre si
- ADMIN-USR-004 → depende de ADMIN-USR-001 (controller SSR), 002 (index.hbs), 003 (form.hbs) e de `src/routes/admin.js` existir
- ADMIN-USR-003 inclui nota sobre helper `includes` que pode precisar ser registrado em `app.js`
