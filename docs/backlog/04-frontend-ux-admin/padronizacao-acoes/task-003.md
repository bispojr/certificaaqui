# TASK ID: FRONT-PAD-003

## Título

Aplicar padrão visual de botões de ação em `participantes/index.hbs`

## Tipo

código

## Dependências

- FRONT-PAD-001 (padrão documentado e aprovado)

## Objetivo

Substituir `btn-warning` (Editar), `btn-danger` (Remover) e `btn-success` (Restaurar) pelos equivalentes `btn-outline-*` em `participantes/index.hbs`, e renomear "Remover" para "Arquivar".

## Arquivo envolvido

`views/admin/participantes/index.hbs`

## Situação atual

```hbs
<a
  href='/admin/participantes/{{id}}/editar'
  class='btn btn-sm btn-warning'
>Editar</a>
<form
  method='POST'
  action='/admin/participantes/{{id}}/deletar'
  class='d-inline'
  onsubmit="return confirm('Remover este participante?')"
>
  <button type='submit' class='btn btn-sm btn-danger'>Remover</button>
</form>
```

## Situação desejada

```hbs
<a
  href='/admin/participantes/{{id}}/editar'
  class='btn btn-sm btn-outline-secondary'
>Editar</a>
<form
  method='POST'
  action='/admin/participantes/{{id}}/deletar'
  class='d-inline'
  onsubmit="return confirm('Arquivar este participante? Esta ação pode ser desfeita.')"
>
  <button type='submit' class='btn btn-sm btn-outline-danger'>Arquivar</button>
</form>
```

**Botão Restaurar** (seção de arquivados, linha ~86):
```hbs
class='btn btn-sm btn-success'
```
→
```hbs
class='btn btn-sm btn-outline-success'
```

**Não alterar:**
- `class='btn btn-outline-secondary'>Buscar` (linha ~15) — botão de formulário de busca
- `class='btn btn-outline-danger'>Limpar` (linha ~17) — **atenção**: este usa `btn-outline-danger` para "Limpar filtro", o que foge do padrão (btn-outline-danger é reservado para soft delete). Ajustar também para `btn-outline-secondary` para evitar conflito semântico

## Verificação

```bash
grep -n "btn-warning\|btn-danger\|btn-success" views/admin/participantes/index.hbs
```

Resultado esperado: zero resultados em botões de ação de tabela.

## Critério de aceite

- "Editar" → `btn-outline-secondary`
- "Arquivar" → `btn-outline-danger`
- "Restaurar" → `btn-outline-success`
- "Limpar filtro" → `btn-outline-secondary`
- `npm run check` passa
