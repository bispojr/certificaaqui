# TASK ID: FRONT-PAD-002

## Título

Aplicar padrão visual de botões de ação em `certificados/index.hbs`

## Tipo

código

## Dependências

- FRONT-PAD-001 (padrão documentado e aprovado)
- FRONT-BUG-002 (form do botão "Remover" já movido para o `<td>` de ações)

## Objetivo

Substituir todas as classes de botão sólidas (`btn-info`, `btn-secondary`, `btn-warning`, `btn-danger`, `btn-success`) pelos equivalentes `btn-outline-*` e renomear "Remover" para "Arquivar" no `<td>` de ações de `certificados/index.hbs`.

## Arquivo envolvido

`views/admin/certificados/index.hbs`

## Substituições necessárias

| Linha | De | Para |
|-------|----|------|
| ~64 | `class="btn btn-sm btn-danger">Remover` | `class="btn btn-sm btn-outline-danger">Arquivar` |
| ~68 | `class="btn btn-sm btn-info">Ver` | `class="btn btn-sm btn-outline-primary">Ver` |
| ~69 | `class="btn btn-sm btn-secondary">Editar` | `class="btn btn-sm btn-outline-secondary">Editar` |
| ~71 | `class="btn btn-sm btn-warning"` (botão Cancelar) | `class="btn btn-sm btn-outline-warning"` |
| ~122 | `class="btn btn-sm btn-success">Restaurar` | `class="btn btn-sm btn-outline-success">Restaurar` |

**Atenção:** O botão "Cancelar" na modal (linha ~100 `class="btn btn-warning">Sim, cancelar`) também deve ser atualizado para `btn-outline-warning` — ele é uma ação reversível (muda status, não deleta).

**Não alterar:**
- `class="btn btn-sm btn-secondary">Filtrar` (linha ~35) — botão de formulário de filtro, não é ação de tabela
- `class="btn btn-sm btn-outline-secondary">Limpar` (linha ~36) — já está correto
- `class="btn btn-secondary" data-bs-dismiss="modal">Não` (linha ~98) — botão de fechar modal, semântica diferente

## Verificação

```bash
grep -n "btn-info\|btn-danger\|btn-success\|btn-warning" views/admin/certificados/index.hbs
```

Resultado esperado: apenas `btn-warning` ou `btn-danger` em badges de status (`<span class="badge">`), nenhum ocorrência em `<button>` ou `<a>`.

## Critério de aceite

- Todos os botões de ação da tabela usam `btn-outline-*`
- O botão de soft delete exibe "Arquivar" (não "Remover")
- `npm run check` passa
