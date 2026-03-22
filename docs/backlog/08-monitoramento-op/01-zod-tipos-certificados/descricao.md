# FEATURE 8.2 — Validação de Entrada (Zod) — Pendência em tipos-certificados

## Objetivo
Aplicar o middleware `validate` com o schema Zod `tiposCertificadosSchema` nas rotas `POST /` e `PUT /:id` de `tipos-certificados.js`, alinhando com o padrão já adotado em `participantes`, `eventos`, `certificados` e `usuarios`.

## Contexto
- `src/validators/tipos_certificados.js` já existe com schema Zod completo
- `middleware/validate.js` já existe e é usado pelas outras 4 rotas
- `tipos-certificados.js` importa `auth`, `rbac` e `scopedEvento` mas não importa `validate` nem o schema
- Solução: adicionar 2 imports + inserir `validate(tiposCertificadosSchema)` nas rotas POST e PUT

## Tasks

| ID | Arquivo | Descrição |
|----|---------|-----------|
| MON-ZOD-001 | `src/routes/tipos-certificados.js` | Importar `validate` + schema e aplicar em POST e PUT |

## Dependências

### Externas
- Nenhuma

### Internas
- `src/validators/tipos_certificados.js` — schema já existe ✅
- `middleware/validate.js` — middleware já existe ✅

## Status
⬜ 0/1
