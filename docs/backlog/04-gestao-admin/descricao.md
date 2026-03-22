## DOMÍNIO: GESTÃO DE ENTIDADES ADMINISTRATIVAS

**Descrição:**
CRUD das entidades principais — participantes, eventos, tipos de certificados e usuários — via API REST e interface web administrativa SSR.

---

**FEATURE: Gestão de Participantes**

Descrição:
Cadastro, consulta, atualização e remoção lógica de participantes, com paginação na API e busca por nome/email no painel admin.

TASKS:
- ✅ participanteService.js com `findAll`, `findById`, `create`, `update`, `delete`, `restore`
- ✅ participanteController.js com os métodos REST
- ✅ participantes.js com rotas REST completas
- ⬜ Adicionar paginação em `participanteService.findAll` (`findAndCountAll`, resposta `{ data, meta }`)
- ⬜ Propagar paginação no `participanteController.findAll` (ler `req.query.page`/`perPage`)
- ⬜ Criar `src/controllers/participanteSSRController.js` com busca `?q=` (`Op.iLike`) e contagem de certificados por participante
- ⬜ Criar `views/admin/participantes/index.hbs` — tabela com busca, coluna de contagem e seção de arquivados
- ⬜ Criar `views/admin/participantes/form.hbs` — formulário criar/editar compartilhado
- ⬜ Adicionar rotas SSR de participantes em `src/routes/admin.js`

---

**FEATURE: Gestão de Eventos**

Descrição:
Cadastro e gerenciamento de eventos com código base único e cascata de soft delete/restore nas associações `usuario_eventos`.

TASKS:
- ✅ eventoService.js com `findAll`, `findById`, `create`, `update`, `delete`, `restore`
- ✅ eventoController.js com os métodos REST
- ✅ eventos.js com rotas REST completas
- ⬜ Corrigir `eventoService.delete` — substituir `UsuarioEvento.update({ deleted_at })` por `UsuarioEvento.destroy(...)` (respeita `paranoid`)
- ⬜ Corrigir `eventoService.restore` — adicionar `UsuarioEvento.restore({ where: { evento_id: id } })` após restaurar o evento
- ⬜ Adicionar paginação em `eventoService.findAll` (`findAndCountAll`, resposta `{ data, meta }`)
- ⬜ Propagar paginação no `eventoController.findAll`
- ⬜ Atualizar testes de `eventoService.delete` e `restore` para as correções de cascata
- ⬜ Criar `src/controllers/eventoSSRController.js` com listagem de ativos e arquivados separados
- ⬜ Criar `views/admin/eventos/index.hbs` — tabela com ações e seção `<details>` de arquivados
- ⬜ Criar `views/admin/eventos/form.hbs` — campos `nome`, `codigo_base` (`pattern="[A-Za-z]{3}"`), `ano`
- ⬜ Criar `src/routes/admin.js` e adicionar rotas de eventos protegidas por `rbac('admin')`

---

**FEATURE: Gestão de Tipos de Certificados**

Descrição:
Criação e edição de modelos de certificados com campos dinâmicos JSONB, template de texto com interpolação e campo destaque.

TASKS:
- ✅ tiposCertificadosService.js com `findAll`, `findById`, `create`, `update`, `delete`, `restore`
- ✅ `tiposCertificadosController.js` com os métodos REST
- ✅ tipos-certificados.js com rotas REST completas
- ✅ Validação cross-field de `campo_destaque` implementada via hook `beforeValidate`
- ⬜ Adicionar paginação em `tiposCertificadosService.findAll` (`findAndCountAll`, resposta `{ data, meta }`)
- ⬜ Propagar paginação no `tiposCertificadosController.findAll`
- ⬜ Criar `src/controllers/tiposCertificadosSSRController.js` — faz `JSON.parse` de `dados_dinamicos` vindo do form hidden e conta certificados emitidos por tipo
- ⬜ Criar `views/admin/tipos-certificados/index.hbs` — tabela com coluna de contagem e seção de arquivados
- ⬜ Criar `views/admin/tipos-certificados/form.hbs` — editor JSONB dinâmico ("+ Adicionar campo"), `campo_destaque` atualizado via JS e preview ao vivo do `texto_base`
- ⬜ Adicionar rotas SSR de tipos em `src/routes/admin.js` protegidas por `rbac('gestor')`

---

**FEATURE: Gestão de Usuários (Admin)**

Descrição:
CRUD de usuários com controle de perfil, hash de senha, vinculação a eventos via N:N e soft delete.

TASKS:
- ✅ Model `Usuario` com `nome`, `email`, `senha` (bcrypt), `perfil`, `paranoid`
- ✅ Model `UsuarioEvento` com associação N:N
- ✅ usuarioController.js com `login`, `logout`, `me`, `create`, `updateEventos`
- ✅ usuarios.js com endpoints de autenticação e CRUD básico
- ⬜ Criar `src/controllers/usuarioSSRController.js` — `index` carrega `Usuario.findAll({ include: 'eventos' })`, derivando `eventosVinculados` e `perfilBadge`; `criar`/`atualizar` chamam `usuario.setEventos(eventoIds)`; edição só atualiza senha se campo não estiver vazio
- ⬜ Criar `views/admin/usuarios/index.hbs` — tabela com colunas `nome`, `email`, `perfil` (badge), `eventosVinculados` e seção de arquivados
- ⬜ Criar `views/admin/usuarios/form.hbs` — campo senha opcional em edição, `<select>` de perfil com `toggleEventos()` que oculta checkboxes de eventos quando perfil `admin`
- ⬜ Adicionar rotas SSR de usuários em `src/routes/admin.js` protegidas por `rbac('admin')`

---

**Status resumido:**

| Feature | Progresso |
|---|---|
| Gestão de Participantes | 3/10 tasks — paginação e SSR totalmente pendentes |
| Gestão de Eventos | 3/13 tasks — correção de cascata, paginação e SSR pendentes |
| Gestão de Tipos de Certificados | 4/11 tasks — paginação e SSR pendentes |
| Gestão de Usuários (Admin) | 4/8 tasks — SSR Controller e views pendentes |