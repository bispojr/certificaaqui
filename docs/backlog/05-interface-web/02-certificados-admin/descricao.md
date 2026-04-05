# Feature: Gestão de Certificados Admin (SSR)

## Domínio

05 — Interface Web (SSR / Handlebars)

## Objetivo

Interface SSR no painel admin para visualizar, criar, editar, cancelar e restaurar certificados, com filtros por evento/status/tipo, texto interpolado na view de detalhe e campos dinâmicos carregados via `fetch` no formulário.

## Contexto técnico

- Model `Certificado`: campos `nome`, `status` (ENUM: `emitido`/`pendente`/`cancelado`), `codigo`, `valores_dinamicos: JSONB`
  - `belongsTo(Participante)`, `belongsTo(Evento)`, `belongsTo(TiposCertificados)`
  - `paranoid: true`
- `certificadoService.js` (API): `cancel(id)` → `update({ status: 'cancelado' })`; `restore(id)`; sem paginação ainda
- `templateService.interpolate(textoBase, valoresDinamicos)` → substitui `${chave}` no `texto_base`
- `pdfService.js` existe para geração de PDF (link `/public/certificados/:id/pdf`)
- Escopo por perfil no controller SSR:
  - admin: vê todos os certificados
  - gestor/monitor: filtro implícito por `evento_id ∈ eventoIds` (re-busca via `usuario.getEventos()`)
- `rbac('monitor')` libera os 3 perfis; `rbac('gestor')` bloqueia monitor em writes
- Flash + redirect pattern (igual demais SSR controllers)

## Estado atual

- `src/controllers/certificadoSSRController.js` NÃO existe
- `views/admin/certificados/` NÃO existe
- Nenhuma rota SSR de certificados em `src/routes/admin.js`

## Tasks

✅ task-001: Criar `src/controllers/certificadoSSRController.js` (7 métodos)
✅ task-002: Criar `views/admin/certificados/index.hbs` com filtros e modal de cancelamento

✅ task-003: Criar `views/admin/certificados/detalhe.hbs` com texto interpolado e link de PDF
✅ task-004: Criar `views/admin/certificados/form.hbs` com campos dinâmicos via `fetch`

- task-005: Adicionar rotas SSR de certificados em `src/routes/admin.js`

## Dependências

### Externas (de outras features)

- **`02-ssr-cookie` TASK-002** — `authSSR.js` deve existir antes de CERT-ADMIN-005
- **`02-gestao-eventos` ADMIN-EVT-005** — `src/routes/admin.js` deve existir antes de CERT-ADMIN-005
- **`03-gestao-certificados/01-api-rest-certificados` CERT-API-003** — validação de `valores_dinamicos` no service; o form de criar (CERT-ADMIN-004) envia `valores_dinamicos` que o service valida

### Internas (ordem entre tasks desta feature)

- CERT-ADMIN-001, 002, 003, 004 → independentes entre si
- CERT-ADMIN-005 → depende de CERT-ADMIN-001 (controller), 002, 003, 004 (views) e de `src/routes/admin.js` existir
