# DASH-ADMIN-001 — Adicionar queries de certificados ao dashboardController (admin)

## Identificador
DASH-ADMIN-001

## Feature
dashboard-admin

## Domínio
06 — Dashboard Administrativo

## Prioridade
ALTA

## Pré-requisitos
- Nenhum

## Descrição

Expandir o bloco `if (perfil === 'admin')` em `dashboardController.js` para incluir:
1. `Certificado.count()` — total de certificados ativos
2. `Certificado.count({ where: { status: 'pendente' } })` — pendentes operacionais
3. `Certificado.findAll({ limit: 5, order, include })` — últimos 5 emitidos

---

## Alterações necessárias

### `src/controllers/dashboardController.js`

**Antes (linhas 17–29 atuais):**

```js
const [totalEventos, totalTipos, totalParticipantes, totalUsuarios] =
  await Promise.all([
    Evento.count(),
    TiposCertificados.count(),
    Participante.count(),
    Usuario.count(),
  ])
return res.render('admin/dashboard', {
  layout: 'layouts/admin',
  title: 'Dashboard',
  totalEventos,
  totalTipos,
  totalParticipantes,
  totalUsuarios,
})
```

**Depois:**

```js
const [
  totalEventos,
  totalTipos,
  totalParticipantes,
  totalUsuarios,
  totalCertificados,
  totalCertificadosPendentes,
  ultimosCertificados,
] = await Promise.all([
  Evento.count(),
  TiposCertificados.count(),
  Participante.count(),
  Usuario.count(),
  Certificado.count(),
  Certificado.count({ where: { status: 'pendente' } }),
  Certificado.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    include: [
      { model: Participante, attributes: ['nome'] },
      { model: Evento, attributes: ['nome'] },
      { model: TiposCertificados, attributes: ['nome'] },
    ],
    attributes: ['id', 'codigo', 'status', 'created_at'],
  }),
])
return res.render('admin/dashboard', {
  layout: 'layouts/admin',
  title: 'Dashboard',
  totalEventos,
  totalTipos,
  totalParticipantes,
  totalUsuarios,
  totalCertificados,
  totalCertificadosPendentes,
  ultimosCertificados: ultimosCertificados.map((c) => c.toJSON()),
})
```

**Nota sobre alias:** verificar se o modelo `TiposCertificados` usa `as: 'tipoCertificado'` ou `as: 'tipo'` na associação com `Certificado` antes de implementar, para usar o alias correto no `include`.

---

## Critérios de aceite

- [ ] `totalCertificados` é passado para a view com o valor de `Certificado.count()`.
- [ ] `totalCertificadosPendentes` conta apenas certificados com `status: 'pendente'`.
- [ ] `ultimosCertificados` é um array de até 5 objetos JSON com campos: `id`, `codigo`, `status`, `created_at`, `Participante.nome`, `Evento.nome`, `TiposCertificados.nome`.
- [ ] Nenhuma query existente do bloco admin é removida ou alterada.
- [ ] Testes de rota do dashboard (`GET /admin`) continuam passando.

## Estimativa
P (até 1h)
