# TASK ID: FRONT-BUG-001

## Título

Remover blocos de flash duplicados das views filhas do painel admin

## Tipo

código

## Dependências

Nenhuma

## Objetivo

O layout `views/layouts/admin.hbs` já exibe `flash.success` e `flash.error` globalmente. Remover os blocos locais das 7 views filhas que repetiam o mesmo bloco, eliminando a mensagem dupla visível ao usuário.

## Arquivos envolvidos

| Arquivo | Linhas a remover |
|---------|-----------------|
| `views/admin/certificados/index.hbs` | linhas 6–7 |
| `views/admin/certificados/detalhe.hbs` | linhas 11–12 |
| `views/admin/certificados/form.hbs` | linha 4 |
| `views/admin/usuarios/index.hbs` | linhas 6–11 |
| `views/admin/usuarios/form.hbs` | linhas 3–5 |
| `views/admin/tipos-certificados/index.hbs` | linhas 7–11 |
| `views/admin/tipos-certificados/form.hbs` | linhas 4–6 |

## Passos

Para cada arquivo da lista acima, remover o bloco completo de flash local.

### Padrão a remover (variações de formatação):

**Bloco completo (success + error) — formato inline:**
```hbs
  {{#if flash.success}}<div class="alert alert-success">{{flash.success}}</div>{{/if}}
  {{#if flash.error}}<div class="alert alert-danger">{{flash.error}}</div>{{/if}}
```

**Bloco completo (success + error) — formato multiline:**
```hbs
{{#if flash.success}}
  <div class='alert alert-success'>{{flash.success}}</div>
{{/if}}
{{#if flash.error}}
  <div class='alert alert-danger'>{{flash.error}}</div>
{{/if}}
```

**Apenas error:**
```hbs
{{#if flash.error}}
  <div class='alert alert-danger'>{{flash.error}}</div>
{{/if}}
```

**Verificar** que `views/layouts/admin.hbs` renderiza flash corretamente para ambos os casos (success e error). Se o layout usar `{{#each flash.success}}` (array), verificar se os controllers ainda usam `req.flash('success', msg)` compatível com o formato de array.

### Verificação

```bash
grep -r "flash.success\|flash.error" views/admin/
```

Resultado esperado: zero resultados (ou apenas comentários HTML).

## Notas de implementação

- As views de `eventos/` e `participantes/` não apareceram nos resultados do grep — não precisam ser modificadas, mas confirme antes de finalizar.
- Não remover o bloco de flash do `views/layouts/admin.hbs` — esse é o único ponto legítimo.
- Não alterar o layout `views/layouts/admin.hbs`.

## Critério de aceite

- `grep -rn "flash.success\|flash.error" views/admin/` = zero resultados
- Flash de sucesso e erro continuam sendo exibidos normalmente após qualquer ação (criar, editar, deletar) — apenas uma vez por request
- `npm run check` passa
