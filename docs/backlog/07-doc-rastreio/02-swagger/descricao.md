# FEATURE 7.3 — Documentação de API (Swagger/OpenAPI)

## Objetivo
Completar a cobertura Swagger das rotas restantes: `public.js` (imediato) e rotas SSR `auth.js` + `admin.js` (bloqueadas pelos Domínios 2 e 5).

## Contexto
- Swagger já configurado: `swagger-jsdoc` + `swagger-ui-express`, interface em `GET /api-docs`
- Padrão adotado: comentários `/** @swagger */` diretamente nos arquivos de rota em `src/routes/`
- Rotas REST já documentadas: participantes, eventos, tipos-certificados, certificados, usuarios, health
- `public.js` tem 3 rotas GET sem anotações: `/certificados`, `/validar/:codigo`, `/certificados/:id/pdf`
- Rotas SSR não têm documentação OpenAPI (são HTML — convenção é documentar como referência, não como contrato de API)

## Tasks

| ID | Arquivo | Descrição |
|----|---------|-----------|
| DOC-SWAGGER-001 | `src/routes/public.js` | Adicionar anotações `@swagger` nas 3 rotas GET |
| DOC-SWAGGER-002 | `src/routes/auth.js` (futura) | Anotações nas rotas SSR `/auth/login` e `/auth/logout` — **BLOQUEADO** por FEAT-SSR-002 |

## Dependências

### Externas
- Nenhuma para DOC-SWAGGER-001

### Internas
- **DOC-SWAGGER-001**: sem dependências — `public.js` já existe
- **DOC-SWAGGER-002**: bloqueado por FEAT-SSR-002 (authSSR.js — Domínio 2) e ADMIN-EVT-005 (admin.js — Domínio 4)

## Status
⬜ 0/2 — DOC-SWAGGER-001 desbloqueado; DOC-SWAGGER-002 bloqueado
