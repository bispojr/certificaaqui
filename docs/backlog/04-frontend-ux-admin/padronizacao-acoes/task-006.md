# TASK ID: FRONT-PAD-006

## Título

Verificação final de padronização: grep global e ajuste de `confirm()` faltantes

## Tipo

verificação + código (ajustes residuais apenas)

## Dependências

- FRONT-PAD-002, FRONT-PAD-003, FRONT-PAD-004, FRONT-PAD-005 (todas concluídas)

## Objetivo

Executar verificação global para garantir que nenhum botão de ação de tabela usa classes sólidas fora do padrão, e corrigir quaisquer ocorrências residuais não cobertas pelas tasks anteriores. Também garantir que todas as mensagens de `confirm()` de soft delete usam o verbo "Arquivar" em vez de "Remover".

## Passos

### 1. Verificar classes sólidas em botões de ação

```bash
grep -rn "btn btn-sm btn-danger\|btn btn-sm btn-warning\|btn btn-sm btn-info\|btn btn-sm btn-success\|btn btn-sm btn-secondary" views/admin/
```

Resultado esperado: **zero resultados** (exceto se houver badges com `btn-sm` por engano — improvável).

Se houver resultados, corrigir para o equivalente `btn-outline-*`.

### 2. Verificar mensagens de `confirm()` com "Remover"

```bash
grep -rn "confirm.*Remover\|confirm.*remover" views/admin/
```

Resultado esperado: **zero resultados** — todas as mensagens de confirmação de soft delete devem usar "Arquivar".

Se houver resultados, atualizar para o padrão:
- `"Arquivar este [entidade]? Esta ação pode ser desfeita."` 
- Para eventos: `"Arquivar este evento? Participantes associados serão desvinculados."`

### 3. Verificar `btn-outline-danger` usado em botões que não são soft delete

```bash
grep -rn "btn-outline-danger" views/admin/
```

Verificar que não há `btn-outline-danger` em botões "Limpar filtro" ou outros atalhos não-destrutivos. Mover para `btn-outline-secondary` se encontrado (foi identificado em `participantes/index.hbs` linha ~17).

### 4. Smoke test visual (opcional)

Acessar `/admin/certificados`, `/admin/participantes`, `/admin/eventos`, `/admin/usuarios`, `/admin/tipos-certificados` em ambiente de desenvolvimento e confirmar visualmente que os botões têm aparência consistente.

## Verificação final

```bash
grep -rn "btn btn-sm btn-danger\|btn btn-sm btn-warning\|btn btn-sm btn-info\|btn btn-sm btn-success" views/admin/
```

**Resultado esperado:** zero resultados.

```bash
grep -rn "confirm.*[Rr]emover" views/admin/
```

**Resultado esperado:** zero resultados.

## Critério de aceite

- Nenhum botão de ação de tabela usa variante sólida de Bootstrap
- Todas as mensagens de `confirm()` para soft delete usam "Arquivar"
- `btn-outline-danger` aparece apenas em botões de soft delete (não em "Limpar filtro")
- `npm run check` passa
