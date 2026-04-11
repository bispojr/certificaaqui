# TASK ID: FRONT-NAV-001

## Título

Adicionar Font Awesome 6 via CDN no `<head>` do layout admin.hbs

## Tipo

código

## Dependências

Nenhuma (pré-requisito para todas as demais tasks de ícones)

## Objetivo

Disponibilizar a biblioteca de ícones Font Awesome 6 em todas as páginas do painel admin, adicionando o CDN no `<head>` de `views/layouts/admin.hbs`.

## Arquivo envolvido

`views/layouts/admin.hbs`

## Modificação

Adicionar após a tag `<link>` do Bootstrap existente:

```hbs
<link
  rel='stylesheet'
  href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
  integrity='sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plq7G5tGm0rU+1SPhVotteLpBERwTkA=='
  crossorigin='anonymous'
  referrerpolicy='no-referrer'
/>
```

### Situação atual (linhas 6–9 de `admin.hbs`)

```hbs
<link
  rel='stylesheet'
  href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
/>
```

### Situação desejada

```hbs
<link
  rel='stylesheet'
  href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
/>
<link
  rel='stylesheet'
  href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
  integrity='sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plq7G5tGm0rU+1SPhVotteLpBERwTkA=='
  crossorigin='anonymous'
  referrerpolicy='no-referrer'
/>
```

## Notas de implementação

- O CDN do `cdnjs.cloudflare.com` inclui atributos `integrity` e `crossorigin` para Subresource Integrity (SRI) — importante para segurança (OWASP A08: Security Misconfiguration).
- Alternativa: usar `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css` se preferir o mesmo CDN do Bootstrap (consistência de fornecedor).
- Verificar o hash SRI correto no site oficial: https://cdnjs.com/libraries/font-awesome

## Verificação

Acessar qualquer página do painel admin e inspecionar o `<head>` — deve conter o link do Font Awesome.

Testar renderização: `<i class="fa-solid fa-house"></i>` deve aparecer como ícone.

## Critério de aceite

- `grep "fontawesome\|font-awesome" views/layouts/admin.hbs` retorna pelo menos uma ocorrência
- Ícone Font Awesome renderiza corretamente em qualquer página do painel admin
- `npm run check` passa
