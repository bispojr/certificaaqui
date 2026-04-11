# TASK ID: FRONT-NAV-003

## Título

Expandir "Tipos" para "Tipos de Certificados" e adicionar link "Área Pública" na navbar

## Tipo

código

## Dependências

- FRONT-NAV-001 (Font Awesome disponível — para o ícone do link público)

## Objetivo

Duas mudanças de conteúdo na navbar:

1. Substituir o label truncado "Tipos" por "Tipos de Certificados" em ambos os blocos admin/gestor
2. Adicionar um link "Área Pública" apontando para `/` (página inicial pública), visível para todos os perfis

## Arquivo envolvido

`views/layouts/admin.hbs`

## Modificação 1 — Label "Tipos" → "Tipos de Certificados"

Localizar todas as ocorrências de `>Tipos</a>` no bloco da navbar e substituir por `>Tipos de Certificados</a>`.

Se FRONT-NAV-002 já foi executada, o trecho a alterar é:
```hbs
<i class='fa-solid fa-tags me-1'></i>Tipos
```
→
```hbs
<i class='fa-solid fa-tags me-1'></i>Tipos de Certificados
```

Se FRONT-NAV-002 ainda não foi executada, o trecho é:
```hbs
>Tipos</a>
```
→
```hbs
>Tipos de Certificados</a>
```

Há duas ocorrências: uma dentro de `{{#if usuario.isAdmin}}` e outra dentro de `{{#if usuario.isGestor}}`.

## Modificação 2 — Link "Área Pública"

Adicionar antes do fechamento de `<div class='navbar-nav me-auto'>`, ao final dos links de navegação, visível para todos os perfis (fora dos blocos `{{#if}}`):

```hbs
<a class='nav-link text-white-50' href='/'>
  <i class='fa-solid fa-globe me-1'></i>Área Pública
</a>
```

**Nota:** `text-white-50` (branco com opacidade 50%) diferencia visualmente o link de "saída" dos links de navegação interna, sem quebrar o visual da navbar dark.

Se preferir manter mesma cor, usar `text-white` como os demais.

## Verificação

```bash
grep -n "Tipos" views/layouts/admin.hbs
```

Resultado esperado: zero ocorrências da string literal `>Tipos<` — apenas `>Tipos de Certificados<`.

```bash
grep -n "Área Pública\|href='/'" views/layouts/admin.hbs
```

Resultado esperado: pelo menos uma ocorrência.

## Critério de aceite

- `grep ">Tipos<" views/layouts/admin.hbs` = zero resultados (label expandido)
- Link "Área Pública" com `href='/'` está presente na navbar
- `npm run check` passa
