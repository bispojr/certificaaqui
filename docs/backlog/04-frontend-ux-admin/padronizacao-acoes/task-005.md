# TASK ID: FRONT-PAD-005

## Título

Aplicar padrão visual de botões em `usuarios/index.hbs` e `tipos-certificados/index.hbs`

## Tipo

código

## Dependências

- FRONT-PAD-001 (padrão documentado e aprovado)

## Objetivo

Aplicar o padrão `btn-outline-*` nos dois arquivos onde os labels já estão corretos ("Arquivar", "Editar", "Restaurar") mas as classes ainda usam variantes sólidas (`btn-secondary`, `btn-warning`, `btn-success`).

## Arquivos envolvidos

- `views/admin/usuarios/index.hbs`
- `views/admin/tipos-certificados/index.hbs`

---

## `usuarios/index.hbs` — situação atual (linhas ~37, ~47, ~84)

```hbs
<a
  href='/admin/usuarios/{{id}}/editar'
  class='btn btn-sm btn-secondary'
>Editar</a>
<form ...>
  <button
    type='submit'
    class='btn btn-sm btn-warning'
  >Arquivar</button>
</form>
```

Restaurar (~84):
```hbs
class='btn btn-sm btn-success'
```

### Situação desejada

```hbs
<a
  href='/admin/usuarios/{{id}}/editar'
  class='btn btn-sm btn-outline-secondary'
>Editar</a>
<form ...>
  <button
    type='submit'
    class='btn btn-sm btn-outline-danger'
  >Arquivar</button>
</form>
```

Restaurar:
```hbs
class='btn btn-sm btn-outline-success'
```

---

## `tipos-certificados/index.hbs` — situação atual (linhas ~34, ~44, ~82)

```hbs
<a
  href='/admin/tipos-certificados/{{id}}/editar'
  class='btn btn-sm btn-secondary'
>Editar</a>
<form ...>
  <button
    type='submit'
    class='btn btn-sm btn-warning'
  >Arquivar</button>
</form>
```

Restaurar (~82):
```hbs
class='btn btn-sm btn-success'
```

### Situação desejada

```hbs
<a
  href='/admin/tipos-certificados/{{id}}/editar'
  class='btn btn-sm btn-outline-secondary'
>Editar</a>
<form ...>
  <button
    type='submit'
    class='btn btn-sm btn-outline-danger'
  >Arquivar</button>
</form>
```

Restaurar:
```hbs
class='btn btn-sm btn-outline-success'
```

---

## Verificação

```bash
grep -n "btn-secondary\|btn-warning\|btn-success" views/admin/usuarios/index.hbs views/admin/tipos-certificados/index.hbs
```

Resultado esperado: zero resultados em botões de ação de tabela.

## Notas de implementação

- Nos dois arquivos, `btn-warning` já usa o label "Arquivar" — a semântica de label está correta. A mudança é apenas de `btn-warning` → `btn-outline-danger` para uniformizar com as demais páginas.
- Verificar se há botão "Ver" (link para detalhe) em usuarios ou tipos-certificados. Se existir e usar `btn-info`, atualizar para `btn-outline-primary`.

## Critério de aceite

- Ambos os arquivos: "Editar" → `btn-outline-secondary`
- Ambos os arquivos: "Arquivar" → `btn-outline-danger`
- Ambos os arquivos: "Restaurar" → `btn-outline-success`
- `npm run check` passa
