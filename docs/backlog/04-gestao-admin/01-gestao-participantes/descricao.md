# Feature: Gestão de Participantes

## Descrição

CRUD de participantes com paginação na listagem REST e painel SSR administrativo com busca por nome/email e contagem de certificados vinculados.

## Tasks (alto nível — apenas pendentes)

✅ Adicionar paginação em `participanteService.findAll` usando `findAndCountAll` com resposta `{ data, meta }` e propagar no controller via `req.query.page`/`perPage`
- Criar `src/controllers/participanteSSRController.js` com busca `?q=` (`Op.iLike`) e contagem de certificados por participante
- Criar `views/admin/participantes/index.hbs` — tabela com busca, coluna `numCertificados` e seção colapsável de arquivados
- Criar `views/admin/participantes/form.hbs` — formulário criar/editar compartilhado
- Adicionar rotas SSR de participantes em `src/routes/admin.js` protegidas por `authSSR`

## Arquivos base

- `src/services/participanteService.js` (findAll sem paginação)
- `src/controllers/participanteController.js` (findAll retorna array puro)
- `src/models/participante.js` (campos: `nomeCompleto`, `email`, `instituicao`; `hasMany` Certificado as `certificados`)
- `src/routes/admin.js` (existe desde TASK-031-C — Domínio 5)

## Dependências

### Externas (de outras features)

- **`02-ssr-cookie` TASK-002** — `src/middlewares/authSSR.js` deve existir antes de ADMIN-PART-005 (usado nas rotas admin)
- **`02-gestao-eventos` ADMIN-EVT-005** — `src/routes/admin.js` deve existir antes de ADMIN-PART-005 (as rotas de participantes são adicionadas a esse arquivo)

### Internas (ordem entre tasks desta feature)

- ADMIN-PART-001, 002, 003, 004 → independentes entre si (podem ser executadas em qualquer ordem)
- ADMIN-PART-005 → depende de ADMIN-PART-002 (controller SSR), 003 (index.hbs), 004 (form.hbs) e de `src/routes/admin.js` existir
