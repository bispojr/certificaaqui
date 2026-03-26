# Feature: Migração de Arquivos Legados

## Descrição

Mover os middlewares `auth.js` e `validate.js` do diretório raiz `middleware/` para `src/middlewares/`,
corrigindo o caminho de import de models e atualizando todos os arquivos que os referenciam.

Após a migração, os arquivos legados em `middleware/` devem ser removidos.

## Estado atual do repositório

Arquivos legados existentes:

- `middleware/auth.js` — usa `require('../src/models')` (path errado para a nova localização)
- `middleware/validate.js` — sem dependência de path relativo

Arquivos que importam do caminho legado:
| Arquivo | Imports legados |
|---|---|
| `src/routes/participantes.js` | `../../middleware/auth` + `../../middleware/validate` |
| `src/routes/eventos.js` | `../../middleware/auth` + `../../middleware/validate` |
| `src/routes/certificados.js` | `../../middleware/auth` + `../../middleware/validate` |
| `src/routes/tipos-certificados.js` | `../../middleware/auth` |
| `src/routes/usuarios.js` | `../../middleware/auth` + `../../middleware/validate` |
| `tests/middleware/auth.test.js` | `../../middleware/auth` |

## Tasks pendentes

- ✅ [TASK-001] Criar `src/middlewares/auth.js` e `src/middlewares/validate.js` (novos arquivos corrigidos)
- ✅ [TASK-002] Atualizar imports de `auth` e `validate` em `participantes.js` e `eventos.js`
- ✅ [TASK-003] Atualizar imports de `auth` e `validate` em `certificados.js` e `tipos-certificados.js`
- ✅ [TASK-004] Atualizar imports em `usuarios.js` e `auth.test.js`
- ⬜ [TASK-005] Remover `middleware/auth.js` e `middleware/validate.js` após validar `npm run check`

## Dependências

### Externas (de outras features)

Nenhuma — esta feature não depende de outras.

### Internas (ordem entre tasks desta feature)

- 001 → 002 → 003 → 004 → 005 (sequencial estrito)
- Cada task assume que as anteriores já foram aplicadas; executar fora de ordem quebra imports.
