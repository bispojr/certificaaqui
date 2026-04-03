# Feature: Gestão de Tipos de Certificados

## Descrição

Criação e edição de modelos de certificados com campos dinâmicos JSONB (`dados_dinamicos`), template de texto com interpolação (`texto_base`) e campo destaque configurável.

## Tasks (alto nível — apenas pendentes)

✅ Adicionar paginação em `tiposCertificadosService.findAll` (`findAndCountAll`, resposta `{ data, meta }`) e propagar no controller
✅ Criar `src/controllers/tiposCertificadosSSRController.js` — `JSON.parse` de `dados_dinamicos` vindo do form hidden e contagem de certificados emitidos por tipo
- Criar `views/admin/tipos-certificados/index.hbs` — tabela com coluna de contagem e seção de arquivados
- Criar `views/admin/tipos-certificados/form.hbs` — editor dinâmico de campos JSONB via JS, `campo_destaque` atualizado via JS e preview ao vivo do `texto_base`
- Adicionar rotas SSR de tipos em `src/routes/admin.js` protegidas por `rbac('gestor')`

## Arquivos base

- `src/services/tiposCertificadosService.js` (findAll sem paginação)
- `src/controllers/tiposCertificadosController.js` (findAll retorna array puro)
- `src/models/tipos_certificados.js` (campos: `codigo`, `descricao`, `campo_destaque`, `texto_base`, `dados_dinamicos: JSONB`; `hasMany(Certificado, { as: 'certificados' })`)
- `src/routes/admin.js` (existe desde ADMIN-EVT-005)

## Dependências

### Externas (de outras features)

- **`02-ssr-cookie` TASK-002** — `src/middlewares/authSSR.js` deve existir antes de ADMIN-TIPOS-005
- **`02-gestao-eventos` ADMIN-EVT-005** — `src/routes/admin.js` deve existir antes de ADMIN-TIPOS-005

### Internas (ordem entre tasks desta feature)

- ADMIN-TIPOS-001, 002, 003, 004 → independentes entre si
- ADMIN-TIPOS-005 → depende de ADMIN-TIPOS-002 (controller SSR), 003 (index.hbs), 004 (form.hbs) e de `src/routes/admin.js` existir
- ADMIN-TIPOS-004 inclui nota sobre helper `{{json}}` que pode precisar ser registrado em `app.js`
