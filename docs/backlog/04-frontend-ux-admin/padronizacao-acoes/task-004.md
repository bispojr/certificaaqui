# TASK ID: FRONT-PAD-004

## Título

Aplicar padrão visual de botões de ação em `eventos/index.hbs`

## Tipo

código

## Dependências

- FRONT-PAD-001 (padrão documentado e aprovado)

## Objetivo

Substituir `btn-warning` (Editar), `btn-danger` (Remover) e `btn-success` (Restaurar) pelos equivalentes `btn-outline-*` em `eventos/index.hbs`, e renomear "Remover" para "Arquivar".

## Arquivo envolvido

`views/admin/eventos/index.hbs`

## Situação atual (linhas 20–35)

```hbs
<a href='/admin/eventos/{{id}}/editar' class='btn btn-sm btn-warning'>Editar</a>
<form
  method='POST'
  action='/admin/eventos/{{id}}/deletar'
  class='d-inline'
  onsubmit="return confirm('Remover este evento?')"
>
  <button type='submit' class='btn btn-sm btn-danger'>Remover</button>
</form>
```

## Situação desejada

```hbs
<a
  href='/admin/eventos/{{id}}/editar'
  class='btn btn-sm btn-outline-secondary'
>Editar</a>
<form
  method='POST'
  action='/admin/eventos/{{id}}/deletar'
  class='d-inline'
  onsubmit="return confirm('Arquivar este evento? Participantes associados serão desvinculados.')"
>
  <button type='submit' class='btn btn-sm btn-outline-danger'>Arquivar</button>
</form>
```

**Botão Restaurar** (seção de arquivados, linha ~70):

```hbs
class='btn btn-sm btn-success'
```

→

```hbs
class='btn btn-sm btn-outline-success'
```

## Verificação

```bash
grep -n "btn-warning\|btn-danger\|btn-success" views/admin/eventos/index.hbs
```

Resultado esperado: zero resultados em botões de ação de tabela.

## Notas de implementação

- O texto do `confirm()` foi atualizado para mencionar que "participantes associados serão desvinculados" — isso é relevante dado o comportamento de cascata em `UsuarioEvento` confirmado na auditoria. Isso impede que o gestor arquive um evento sem saber das consequências.
- Se a task BACK-EVT-003 ainda não tiver sido implementada (renomeação para `softDelete`), o `confirm()` é a única forma de comunicar o efeito ao usuário.

## Critério de aceite

- "Editar" → `btn-outline-secondary`
- "Arquivar" → `btn-outline-danger`
- "Restaurar" → `btn-outline-success`
- `confirm()` atualizado com aviso sobre cascata
- `npm run check` passa
