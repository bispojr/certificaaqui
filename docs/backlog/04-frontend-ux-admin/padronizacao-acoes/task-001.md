# TASK ID: FRONT-PAD-001

## Título

Documentar padrão visual de ações e criar comentário de referência no layout admin

## Tipo

documentação + código mínimo

## Dependências

Nenhuma (pode ser executada antes das demais para guiar a implementação)

## Objetivo

Estabelecer e registrar o padrão visual de botões de ação de forma que outros desenvolvedores (ou o próximo agente) possam aplicá-lo de forma consistente sem consultar o backlog. O registro fica visível diretamente no template do layout admin, como comentário de referência.

## Padrão a documentar

| Ação                   | Label     | Classe Bootstrap               | Semântica                    |
| ---------------------- | --------- | ------------------------------ | ---------------------------- |
| Ver / Detalhe          | Ver       | `btn-outline-primary btn-sm`   | leitura                      |
| Editar                 | Editar    | `btn-outline-secondary btn-sm` | atualização                  |
| Cancelar (reversível)  | Cancelar  | `btn-outline-warning btn-sm`   | muda status para 'cancelado' |
| Arquivar (soft delete) | Arquivar  | `btn-outline-danger btn-sm`    | define deleted_at            |
| Restaurar              | Restaurar | `btn-outline-success btn-sm`   | limpa deleted_at             |

## Passos

### 1. Criar `docs/decisoes/009-padrao-botoes-acoes.md`

Registrar como ADR (Architecture Decision Record) o padrão acima, com:

- **Contexto**: inconsistência observada entre pages
- **Decisão**: tabela de padrões acima
- **Consequências**: todas as pages precisam ser atualizadas (tags FRONT-PAD-002 a 006)

### 2. Adicionar bloco de comentário em `views/layouts/admin.hbs`

Inserir antes do `{{{body}}}`, como guia para templates filhos:

```hbs
{{!
  PADRÃO DE BOTÕES DE AÇÃO (atualizar ao adicionar novas ações):
  Ver        → <a class="btn btn-outline-primary btn-sm">Ver</a>
  Editar     → <a class="btn btn-outline-secondary btn-sm">Editar</a>
  Cancelar   → <button class="btn btn-outline-warning btn-sm">Cancelar</button>
  Arquivar   → <button class="btn btn-outline-danger btn-sm">Arquivar</button>
  Restaurar  → <button class="btn btn-outline-success btn-sm">Restaurar</button>
}}
```

## Notas de implementação

- O comentário Handlebars `{{!-- --}}` não é renderizado no HTML da página — é seguro inserir no layout sem afetar o output.
- A ADR `009-padrao-botoes-acoes.md` vai para `docs/decisoes/` seguindo o padrão numérico existente (001 a 008 já estão presentes).

## Critério de aceite

- `docs/decisoes/009-padrao-botoes-acoes.md` existe e contém a tabela de padrões
- `views/layouts/admin.hbs` contém o comentário `{{!-- PADRÃO DE BOTÕES ... --}}`
- `npm run check` passa (arquivos `.hbs` não são validados por lint, mas o check de testes deve continuar verde)
