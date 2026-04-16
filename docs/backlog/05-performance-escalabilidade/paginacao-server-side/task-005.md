# PERF-PAG-005 — Controles de paginação nas views de listagem

## Identificador

PERF-PAG-005

## Feature

paginacao-server-side

## Domínio

05 — Performance e Escalabilidade

## Prioridade

ALTA

## Pré-requisitos

- PERF-PAG-004 implementado (`views/partials/pagination.hbs` criado e helpers `prev`/`next` registrados)

## Descrição

Incluir o partial `{{> pagination}}` nas quatro views de listagem do painel admin. O partial deve ser posicionado:

- **Após a tabela de registros ativos**, antes da seção de registros arquivados/cancelados (se existir).
- **Após a tabela de arquivados**, caso a view tenha seção de arquivados com paginação separada (não obrigatório nesta task — cada tabela usa o mesmo objeto `pagination` da renderização principal).

---

## Alterações necessárias

### 1. `views/admin/certificados/index.hbs`

Inserir após o fechamento `</table>` da tabela de certificados ativos e antes do bloco de arquivados:

```hbs
{{> pagination}}
```

**Ponto de inserção:** imediatamente após `</div>` da div que envolve a tabela ativa (antes do `<h2>Arquivados</h2>` ou equivalente).

---

### 2. `views/admin/participantes/index.hbs`

Inserir após o fechamento `</table>` da tabela de participantes ativos:

```hbs
{{> pagination}}
```

**Ponto de inserção:** antes do bloco de participantes arquivados se existir, ou antes do `</div>` de fechamento da seção principal.

---

### 3. `views/admin/eventos/index.hbs`

Inserir após o fechamento `</table>` da tabela de eventos ativos:

```hbs
{{> pagination}}
```

**Ponto de inserção:** antes do bloco de eventos arquivados.

---

### 4. `views/admin/usuarios/index.hbs`

Inserir após o fechamento `</table>` da tabela de usuários ativos:

```hbs
{{> pagination}}
```

**Ponto de inserção:** antes do bloco de usuários arquivados.

---

## Comportamento esperado

- Quando `pagination.totalPages` for `1` ou `undefined`, o partial **não renderiza nada** (controlado pelo `{{#if pagination.totalPages}}` interno).
- Quando há mais de uma página, o partial renderiza:
  - Contador: `Página 1 de 4 (72 registros)`
  - Botão `← Anterior` desabilitado na página 1
  - Botão `Próxima →` desabilitado na última página
  - Hrefs que preservam os filtros ativos (`?q=`, `?evento_id=`, etc.)

## Critérios de aceite

- [ ] `{{> pagination}}` presente nas 4 views de listagem (certificados, participantes, eventos, usuários).
- [ ] Partial posicionado entre tabela de ativos e seção de arquivados em todas as views.
- [ ] Nenhum teste de views/snapshot quebra após a alteração.
- [ ] Com `pagination.totalPages = 1`, nenhum controle de paginação é exibido (bloco oculto pelo `{{#if}}`).

## Estimativa

P (até 30min)
