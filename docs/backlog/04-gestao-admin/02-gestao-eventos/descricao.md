# Feature: Gestão de Eventos

## Descrição
Cadastro e gerenciamento de eventos com código base único e cascata de soft delete/restore nas associações `usuario_eventos`. Dois bugs de cascata críticos precisam ser corrigidos antes da interface SSR.

## Tasks (alto nível — apenas pendentes)

- **BUG** Corrigir `eventoService.delete` — substituir `UsuarioEvento.update({ deleted_at })` por `UsuarioEvento.destroy(...)` (respeita `paranoid`)
- **BUG** Corrigir `eventoService.restore` — adicionar `UsuarioEvento.restore({ where: { evento_id: id } })` após restaurar o evento
- Atualizar `eventoService.test.js` para refletir as correções de cascata (mock `destroy`/`restore` em vez de `update`)
- Adicionar paginação em `eventoService.findAll` (`findAndCountAll`, resposta `{ data, meta }`) e propagar no controller
- Criar `src/controllers/eventoSSRController.js` com 7 métodos CRUD SSR
- Criar `views/admin/eventos/index.hbs` e `views/admin/eventos/form.hbs`
- Criar `src/routes/admin.js` com `authSSR` + rotas de eventos protegidas por `rbac('admin')`
- Registrar `adminRouter` em `app.js`

## Arquivos base
- `src/services/eventoService.js` (bugs confirmados nas linhas 31-35 e 38-41)
- `tests/services/eventoService.test.js` (mock `UsuarioEvento: { update: jest.fn() }` desatualizado)
- `src/models/evento.js` (campos: `nome`, `codigo_base`, `ano`; `paranoid: true`)
- `src/middlewares/rbac.js` ✅ e `src/middlewares/authSSR.js` (a criar em Domínio 2)

## Dependências

### Externas (de outras features)
- **`02-ssr-cookie` TASK-002** — `src/middlewares/authSSR.js` deve existir antes de ADMIN-EVT-005 (o router admin usa `authSSR` como middleware global)

> Esta feature **cria** `src/routes/admin.js` em ADMIN-EVT-005, desbloqueando as features de participantes, tipos de certificados e usuários do Domínio 4.

### Internas (ordem entre tasks desta feature)
- ADMIN-EVT-001 → ADMIN-EVT-002 — o teste (002) verifica o comportamento corrigido em 001
- ADMIN-EVT-001 → deve ser executado antes de qualquer outra task (bug crítico de cascata)
- ADMIN-EVT-003 → independente (paginação isolada do serviço)
- ADMIN-EVT-004 → independente (apenas views)
- ADMIN-EVT-005 → depende de ADMIN-EVT-004 (controller SSR referencia as views criadas em 004)
- ADMIN-EVT-006 → depende de ADMIN-EVT-005 (registra o router criado em 005 no `app.js`)
