# FEATURE: Padronização do Sistema de Ações nas Tabelas

## Domínio

04 — Frontend / UX Admin

## Identificador

FRONT-PAD

## Prioridade

ALTA

## Descrição

A mesma operação semântica (ex.: soft delete) usa labels e classes Bootstrap diferentes em cada página do painel admin, tornando o comportamento imprevisível para o usuário:

| Página                | Botão soft delete | Cor atual     |
| --------------------- | ----------------- | ------------- |
| Certificados          | "Remover"         | `btn-danger`  |
| Participantes         | "Remover"         | `btn-danger`  |
| Eventos               | "Remover"         | `btn-danger`  |
| Usuários              | "Arquivar"        | `btn-warning` |
| Tipos de Certificados | "Arquivar"        | `btn-warning` |

Além disso, botões de visualização e edição usam `btn-info` e `btn-secondary` em algumas páginas e variações em outras.

## Padrão alvo

| Ação                   | Label     | Classe Bootstrap        | Semântica         |
| ---------------------- | --------- | ----------------------- | ----------------- |
| Ver / Detalhe          | Ver       | `btn-outline-primary`   | leitura           |
| Editar                 | Editar    | `btn-outline-secondary` | atualização       |
| Cancelar (reversível)  | Cancelar  | `btn-outline-warning`   | status reversível |
| Arquivar (soft delete) | Arquivar  | `btn-outline-danger`    | soft delete       |
| Restaurar              | Restaurar | `btn-outline-success`   | restore           |

**Nota sobre "Cancelar" vs "Arquivar"**: Em certificados existe um estado de negócio "cancelado" distinto do soft delete. Nesse caso:

- `Cancelar` = mudar status para `'cancelado'` → `btn-outline-warning`
- `Arquivar` = soft delete (`deleted_at`) → `btn-outline-danger`

Nas demais entidades, o soft delete não tem estado de negócio intermediário, portanto usa "Arquivar" diretamente.

## Arquivos de view envolvidos

- `views/admin/certificados/index.hbs`
- `views/admin/participantes/index.hbs`
- `views/admin/eventos/index.hbs`
- `views/admin/usuarios/index.hbs`
- `views/admin/tipos-certificados/index.hbs`

## Tasks

- `task-001.md` — FRONT-PAD-001: Documentar e aprovar padrão visual de ações no código-fonte
- `task-002.md` — FRONT-PAD-002: Aplicar padrão em `certificados/index.hbs`
- `task-003.md` — FRONT-PAD-003: Aplicar padrão em `participantes/index.hbs`
- `task-004.md` — FRONT-PAD-004: Aplicar padrão em `eventos/index.hbs`
- `task-005.md` — FRONT-PAD-005: Aplicar padrão em `usuarios/index.hbs` e `tipos-certificados/index.hbs`
- `task-006.md` — FRONT-PAD-006: Unificar label do soft delete para "Arquivar" em todas as páginas

## Critério de aceite global

- `grep -rn "btn-danger\|btn-warning\|btn-info\|btn-success" views/admin/` retorna somente ocorrências em badges/spans de status, não em botões de ação
- Todas as ações de tabela usam variantes `btn-outline-*`
- O label "Remover" não aparece em nenhum botão de ação — substituído por "Arquivar"
- `npm run check` passa
