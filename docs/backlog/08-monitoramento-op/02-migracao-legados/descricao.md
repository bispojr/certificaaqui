# FEATURE 8.3 — Migração de Arquivos Legados para `src/`

## Objetivo
Mover `middleware/auth.js` e `middleware/validate.js` da raiz do projeto para `src/middlewares/`, atualizando todos os imports afetados de forma atômica para evitar quebras.

## Contexto
-  `middleware/auth.js` — middleware legado na raiz; importado por 5 rotas e 1 arquivo de teste
- `middleware/validate.js` — middleware legado na raiz; importado por 4 rotas (exceto `tipos-certificados` — MON-ZOD-001 vai adicioná-lo)
- `src/middlewares/` já existe com `rbac.js` e `scopedEvento.js`
- O conteúdo de `middleware/auth.js` é idêntico ao necessário — apenas mover + atualizar paths
- A migração deve ser feita atomicamente no mesmo commit para não quebrar testes intermediários
- Após a migração, a pasta `middleware/` (raiz) pode ser removida se estiver vazia

## Tasks

| ID | Arquivo(s) | Descrição |
|----|-----------|-----------|
| MON-LEG-001 | `src/middlewares/auth.js` | Criar auth.js em src/middlewares (cópia do legado) |
| MON-LEG-002 | 5 rotas + test | Atualizar imports de `../../middleware/auth` → `../middlewares/auth` |
| MON-LEG-003 | `src/middlewares/validate.js` | Criar validate.js em src/middlewares (cópia do legado) |
| MON-LEG-004 | 4-5 rotas | Atualizar imports de `../../middleware/validate` → `../middlewares/validate` |
| MON-LEG-005 | `middleware/` (raiz) | Remover pasta legada após todos os imports atualizados |

## Dependências

### Externas
- Nenhuma

### Internas
- **MON-ZOD-001** deve ser executado antes de MON-LEG-004 se quisermos atualizar `tipos-certificados.js` em um único passo (ele vai importar `../../middleware/validate` — que será migrado)
- MON-LEG-001 e MON-LEG-003 devem preceder MON-LEG-002 e MON-LEG-004 respectivamente
- MON-LEG-005 só pode ser executado após MON-LEG-002 e MON-LEG-004

## Status
⬜ 0/5
