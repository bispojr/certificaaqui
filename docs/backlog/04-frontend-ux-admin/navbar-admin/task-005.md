# TASK ID: FRONT-NAV-005

## Título

Adicionar separador visual entre navegação e bloco de conta do usuário na navbar

## Tipo

código

## Dependências

- FRONT-NAV-002 (bloco da navbar em estrutura final)

## Objetivo

Introduzir um separador visual que delimite claramente o grupo de links de navegação (à esquerda) do bloco de conta (nome do usuário + botão Sair), à direita. A ausência desse separador faz com que os elementos pareçam pertencer ao mesmo grupo.

## Arquivo envolvido

`views/layouts/admin.hbs`

## Situação atual (linhas ~41–50)

```hbs
      </div>  {{!-- fecha .navbar-nav.me-auto --}}
      <div class='navbar-nav'>
        <span class='navbar-text text-white me-3'>{{usuario.nome}}
          ({{usuario.perfil}})</span>
        <form action='/auth/logout' method='POST' class='d-inline'>
          <button type='submit' class='btn btn-sm btn-outline-light'>
            Sair
          </button>
        </form>
      </div>
```

## Situação desejada

```hbs
      </div>  {{!-- fecha .navbar-nav.me-auto --}}
      <div class='navbar-nav align-items-center gap-2'>
        <span class='text-white-50'>|</span>
        <span class='navbar-text text-white'>{{usuario.nome}}
          <small class='text-white-50'>({{usuario.perfil}})</small>
        </span>
        <form action='/auth/logout' method='POST' class='d-inline'>
          <button type='submit' class='btn btn-sm btn-outline-light'>
            <i class='fa-solid fa-right-from-bracket me-1'></i>Sair
          </button>
        </form>
      </div>
```

## Mudanças incluídas

1. **Separador** `<span class='text-white-50'>|</span>` entre os dois grupos
2. **`align-items-center gap-2`** na div de conta — alinha verticalmente e espaça os elementos
3. **Perfil em `<small>`** com `text-white-50` — hierarquia visual: nome em destaque, perfil menor
4. **Ícone no botão Sair** — `fa-right-from-bracket` reforça a ação de logout

## Alternativa de separador

Ao invés do `|` literal, pode-se usar um `<div class='vr' style='opacity: 0.3'></div>` do Bootstrap 5 que renderiza uma linha vertical (vertical rule). Escolher conforme preferência visual:

```hbs
<div class='vr' style='opacity: 0.3; align-self: stretch'></div>
```

## Verificação

Inspecionar visualmente a navbar em qualquer página admin — deve haver uma separação clara entre os links de navegação e o bloco "nome (perfil) | Sair".

## Critério de aceite

- Separador visual (`|` ou `vr`) está presente entre os grupos
- Botão "Sair" tem ícone Font Awesome (requer FRONT-NAV-001)
- `npm run check` passa
