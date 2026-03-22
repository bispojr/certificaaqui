# Feature: Testes Unitários de Services (Pendentes)

## Domínio
06 — Qualidade e Testes

## Objetivo
Completar cobertura de testes unitários dos services com: (1) cascata de soft delete/restore em `eventoService`, (2) paginação nos 4 services principais, (3) validação de `valores_dinamicos` em `certificadoService.create`.

## Contexto técnico
- Todos os tests usam `jest.mock('../../src/models', () => ({ ... }))` — sem DB
- `eventoService.test.js`: mock atual tem `UsuarioEvento: { update: jest.fn() }` — desatualizado; deve ser `{ destroy: jest.fn(), restore: jest.fn() }`
- Paginação: todos os 4 services usarão `findAndCountAll` após CERT-API-001, ADMIN-PART-001, ADMIN-EVT-003 e ADMIN-TIPOS-001; contratos de retorno: `{ data: rows, meta: { total, page, perPage, totalPages } }`
- `certificadoService.create` (após CERT-API-003): importa `TiposCertificados`, busca por `tipo_certificado_id`, valida `valores_dinamicos` contra `dados_dinamicos`, lança `{ message, camposFaltantes }` se incompleto

## Estado atual dos arquivos de teste
- `tests/services/eventoService.test.js` — `UsuarioEvento` mock desatualizado; sem teste de cascata; `findAll` testa `findAll` em vez de `findAndCountAll`
- `tests/services/certificadoService.test.js` — mock sem `TiposCertificados`; `findAll` testa `findAll`; nenhum teste de `create` com validação
- `tests/services/participanteService.test.js` — `findAll` testa `findAll` em vez de `findAndCountAll`
- `tests/services/tiposCertificadosService.test.js` — `findAll` testa `findAll` em vez de `findAndCountAll`

## Tasks
- task-001: Corrigir `eventoService.test.js` — mock `UsuarioEvento` + testes de cascata + paginação
- task-002: Atualizar paginação em `participanteService.test.js` e `tiposCertificadosService.test.js`
- task-003: Atualizar `certificadoService.test.js` — paginação + testes de `create` com `TiposCertificados`

## Dependências

### Externas (de outras features)
- **ADMIN-EVT-001** (correção de cascata) — task-001 desta feature valida o comportamento corrigido; deve ser executada após ADMIN-EVT-001
- **CERT-API-001** — paginação de `certificadoService`; task-003 depende da implementação
- **ADMIN-PART-001** — paginação de `participanteService`; task-002 depende da implementação
- **ADMIN-EVT-003** — paginação de `eventoService`; task-001 depende da implementação
- **ADMIN-TIPOS-001** — paginação de `tiposCertificadosService`; task-002 depende da implementação
- **CERT-API-003** — validação de `valores_dinamicos` em `certificadoService.create`; task-003 depende da implementação

### Internas (ordem entre tasks desta feature)
- task-001, 002, 003 → independentes entre si (cada uma modifica um ou dois arquivos distintos)
