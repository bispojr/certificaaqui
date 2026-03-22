# Feature: Fluxo Público de Certificados (SSR)

## Domínio
05 — Interface Web (SSR / Handlebars)

## Objetivo
Views e rotas SSR para o participante buscar seus certificados por e-mail e validar um certificado por código. Inclui spinner de loading nos formulários de busca.

## Contexto técnico
- Views em `views/certificados/`
- Rotas em `src/routes/public.js`, montadas em `/public` no `app.js`
- Layout: `layout.hbs` (público)
- `form-obter.hbs`: spinner já implementado ✅
- `form-validar.hbs`: spinner ausente ⬜

## Estado atual
- ✅ `views/certificados/opcoes.hbs` — tela de opções
- ✅ `views/certificados/form-obter.hbs` — formulário com spinner
- ✅ `views/certificados/form-validar.hbs` — formulário SEM spinner
- ⬜ `views/certificados/obter-lista.hbs` — coberta por CERT-SSR-001 (Domínio 3)
- ⬜ `views/certificados/validar-resultado.hbs` — coberta por CERT-SSR-002 (Domínio 3)
- ⬜ Rotas GET/POST em `public.js` — cobertas por CERT-SSR-003/004 (Domínio 3)
- ⬜ Atualização de form actions + redirect — coberta por CERT-SSR-005 (Domínio 3)

## Tasks
- task-001: Adicionar spinner de loading em `views/certificados/form-validar.hbs`

## Dependências

### Externas (de outras features)
Nenhuma — `form-validar.hbs` já existe e é view estática pública.

### Internas (ordem entre tasks desta feature)
Nenhuma — há apenas TASK-001.
