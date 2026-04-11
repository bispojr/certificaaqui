# DASH-GEST-002 — Adicionar queries de breakdown e últimos certificados ao controller (gestor)

## Identificador
DASH-GEST-002

## Feature
dashboard-gestor

## Domínio
06 — Dashboard Administrativo

## Prioridade
MÉDIA

## Pré-requisitos
- DASH-GEST-001 implementado (`sequelize` importado em `dashboardController.js`)

## Descrição

Expandir o bloco gestor/monitor em `dashboardController.js` para incluir:
1. `porTipo` — agrupamento de certificados por tipo de certificado (count por tipo)
2. `ultimosCertificadosGestor` — 5 certificados mais recentes dentro do escopo do gestor

---

## Alterações necessárias

### `src/controllers/dashboardController.js`

**Antes (linhas 43–50 aproximadas):**

```js
const [totalCertificados, totalParticipantes] = whereEvento
  ? await Promise.all([
      Certificado.count({ where: whereEvento }),
      Certificado.count({
        where: whereEvento,
        distinct: true,
        col: 'participante_id',
      }),
    ])
  : [0, 0]
```

**Depois:**

```js
const [totalCertificados, totalParticipantes, porTipo, ultimosCertificadosGestor] =
  whereEvento
    ? await Promise.all([
        Certificado.count({ where: whereEvento }),
        Certificado.count({
          where: whereEvento,
          distinct: true,
          col: 'participante_id',
        }),
        Certificado.findAll({
          where: whereEvento,
          attributes: [
            'tipo_certificado_id',
            [sequelize.fn('COUNT', sequelize.col('tipo_certificado_id')), 'total'],
          ],
          group: ['tipo_certificado_id', 'TiposCertificado.id'],
          include: [{ model: TiposCertificados, attributes: ['nome'] }],
        }),
        Certificado.findAll({
          where: whereEvento,
          limit: 5,
          order: [['created_at', 'DESC']],
          include: [
            { model: Participante, attributes: ['nome'] },
            { model: TiposCertificados, attributes: ['nome'] },
          ],
          attributes: ['id', 'codigo', 'status', 'created_at'],
        }),
      ])
    : [0, 0, [], []]
```

**Atualizar `res.render` do gestor para incluir as novas variáveis:**

```js
return res.render('admin/dashboard', {
  layout: 'layouts/admin',
  title: 'Dashboard',
  totalCertificados,
  totalParticipantes,
  porTipo: porTipo.map((r) => r.toJSON()),
  ultimosCertificadosGestor: ultimosCertificadosGestor.map((c) => c.toJSON()),
})
```

**Nota sobre o alias `TiposCertificado` no GROUP BY:**  
Sequelize pode gerar o alias da associação como `TiposCertificado` (singular) ou `TiposCertificados` (plural). Verificar o alias real da associação em `src/models/certificado.js` antes de implementar, para ajustar a cláusula `group` conforme necessário.

---

## Critérios de aceite

- [ ] `porTipo` é um array de objetos `{ TiposCertificado: { nome }, total }` ou equivalente.
- [ ] `ultimosCertificadosGestor` é um array de até 5 objetos com `codigo`, `status`, `created_at`, `Participante.nome`, `TiposCertificados.nome`.
- [ ] Quando `whereEvento` é `null` (gestor sem eventos vinculados), ambas são arrays vazios `[]` — sem erro de runtime.
- [ ] Testes de rota do dashboard continuam passando para perfil gestor.

## Estimativa
P (até 1h — incluindo verificação dos aliases do model)
