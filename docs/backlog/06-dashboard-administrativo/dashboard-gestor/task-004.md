# DASH-GEST-004 — Adicionar card "Total de Participantes Únicos" ao dashboard gestor

## Identificador
DASH-GEST-004

## Feature
dashboard-gestor

## Domínio
06 — Dashboard Administrativo

## Prioridade
MÉDIA

## Pré-requisitos
- DASH-GEST-002 implementado

## Descrição

O controller atual usa `Certificado.count({ distinct: true, col: 'participante_id' })` para calcular participantes únicos, mas a view do gestor exibe "Participantes (seus eventos)" usando `{{totalParticipantes}}` que na verdade é a contagem DISTINCT de `participante_id` nos certificados — não os participantes cadastrados no sistema.

Esta task clarifica o label da view para evitar interpretação errada e adiciona um terceiro card com "Tipos ativos no evento" para completar o contexto operacional.

---

## Alterações necessárias

### 1. `views/admin/dashboard.hbs` — bloco `{{else}}`

**Alterar label do card de participantes** de:
```hbs
<div class='card-title text-muted mt-2'>Participantes (seus eventos)</div>
```
Para:
```hbs
<div class='card-title text-muted mt-2'>Participantes com certificado</div>
```

**Alterar de `col-sm-6` para `col-sm-6 col-lg-4`** nos dois cards existentes para acomodar um terceiro card.

**Adicionar terceiro card** "Tipos de Certificado" após o card de participantes:

```hbs
<div class='col-sm-6 col-lg-4'>
  <a href='/admin/tipos-certificados' class='text-decoration-none'>
    <div class='card text-center border-info h-100'>
      <div class='card-body'>
        <div class='display-4 fw-bold text-info'>{{porTipo.length}}</div>
        <div class='card-title text-muted mt-2'>Tipos com certificados</div>
      </div>
    </div>
  </a>
</div>
```

**Nota:** `{{porTipo.length}}` usa o array já passado pelo controller (DASH-GEST-002). Sem nova query necessária.

---

### 2. `src/controllers/dashboardController.js`

Nenhuma mudança adicional — `porTipo` já é passado à view por DASH-GEST-002.

---

## Critérios de aceite

- [ ] Card "Participantes com certificado" exibe contagem de `participante_id` DISTINCT nos certificados do gestor.
- [ ] Card "Tipos com certificados" exibe o número de tipos que têm ao menos 1 certificado no escopo do gestor (derivado de `porTipo.length`).
- [ ] Layout de 3 cards funciona responsivamente em telas sm e lg (Bootstrap `col-sm-6 col-lg-4`).
- [ ] Label corrigido elimina ambiguidade entre "participantes cadastrados" e "participantes com certificado".

## Estimativa
PP (até 20min)
