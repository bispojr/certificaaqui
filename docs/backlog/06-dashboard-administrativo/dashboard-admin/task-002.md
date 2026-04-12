# [x] DASH-ADMIN-002 — Card "Total de Certificados" e card "Pendentes" no dashboard admin — concluída em 2026-04-11 21:30 (BRT)

## Identificador
DASH-ADMIN-002

## Feature
dashboard-admin

## Domínio
06 — Dashboard Administrativo

## Prioridade
ALTA

## Pré-requisitos
- DASH-ADMIN-001 implementado (controller passa `totalCertificados` e `totalCertificadosPendentes` para a view)

## Descrição

Adicionar dois novos cards ao bloco `{{#if usuario.isAdmin}}` em `views/admin/dashboard.hbs`:

1. **Card "Total de Certificados"** — estilo `border-info`, contador `totalCertificados`, link para `/admin/certificados`.
2. **Card "Certificados Pendentes"** — estilo `border-warning`, contador `totalCertificadosPendentes`, link para `/admin/certificados?status=pendente`.

---

## Alterações necessárias

### `views/admin/dashboard.hbs`

**Estado atual:** 4 cards em `row g-3` com `col-sm-6 col-lg-3`.

**Alteração:** trocar `col-lg-3` por `col-lg` nos 4 cards existentes e adicionar os 2 novos cards na mesma row, para distribuição automática em 6 colunas iguais (Bootstrap `col` sem número).

**Estrutura final da row:**

```hbs
<div class='row g-3'>
  {{! card Eventos — existente }}
  <div class='col-sm-6 col-lg'>
    <a href='/admin/eventos' class='text-decoration-none'>
      <div class='card text-center border-primary h-100'>
        <div class='card-body'>
          <div class='display-4 fw-bold text-primary'>{{totalEventos}}</div>
          <div class='card-title text-muted mt-2'>Eventos</div>
        </div>
      </div>
    </a>
  </div>

  {{! card Tipos — existente }}
  {{! card Participantes — existente }}
  {{! card Usuários — existente }}

  {{! card Certificados — NOVO }}
  <div class='col-sm-6 col-lg'>
    <a href='/admin/certificados' class='text-decoration-none'>
      <div class='card text-center border-info h-100'>
        <div class='card-body'>
          <div class='display-4 fw-bold text-info'>{{totalCertificados}}</div>
          <div class='card-title text-muted mt-2'>Certificados</div>
        </div>
      </div>
    </a>
  </div>

  {{! card Pendentes — NOVO }}
  <div class='col-sm-6 col-lg'>
    <a href='/admin/certificados?status=pendente' class='text-decoration-none'>
      <div class='card text-center border-warning h-100'>
        <div class='card-body'>
          <div class='display-4 fw-bold text-warning'>{{totalCertificadosPendentes}}</div>
          <div class='card-title text-muted mt-2'>Pendentes</div>
        </div>
      </div>
    </a>
  </div>
</div>
```

**Nota:** substituir `col-lg-3` por `col-lg` em todos os 4 cards existentes para manter a distribuição uniforme com 6 itens.

---

## Critérios de aceite

- [ ] Dashboard admin exibe 6 cards na mesma row (Eventos, Tipos, Participantes, Usuários, Certificados, Pendentes).
- [ ] Card "Certificados" usa `border-info` e exibe `{{totalCertificados}}`.
- [ ] Card "Pendentes" usa `border-warning` e exibe `{{totalCertificadosPendentes}}`.
- [ ] Clique em "Certificados" navega para `/admin/certificados`.
- [ ] Clique em "Pendentes" navega para `/admin/certificados?status=pendente`.
- [ ] Layout não quebra em telas sm (Bootstrap responsivo).

## Estimativa
PP (até 30min)
