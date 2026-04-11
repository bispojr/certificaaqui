# Feature: Enriquecimento do Dashboard Gestor/Monitor

## Identificador da feature
dashboard-gestor

## Domínio
06 — Dashboard Administrativo

## Prioridade
MÉDIA

## Problema

O dashboard gestor/monitor atual exibe apenas 2 cards:
- **Certificados (seus eventos):** `Certificado.count({ where: whereEvento })`
- **Participantes (seus eventos):** `Certificado.count({ where: whereEvento, distinct: true, col: 'participante_id' })`

Falta granularidade por tipo de certificado e visibilidade de atividade recente — informações essenciais para um gestor de evento acompanhar o progresso.

---

## Estado atual confirmado (via leitura do código)

**`dashboardController.js` — bloco gestor/monitor (linhas 33–57):**

```js
const dbUsuario = await Usuario.findByPk(req.usuario.id, {
  include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
})
const eventoIds = (dbUsuario.eventos || []).map((e) => e.id)
const whereEvento = eventoIds.length ? { evento_id: eventoIds } : null

const [totalCertificados, totalParticipantes] = whereEvento
  ? await Promise.all([
      Certificado.count({ where: whereEvento }),
      Certificado.count({ where: whereEvento, distinct: true, col: 'participante_id' }),
    ])
  : [0, 0]
```

**`views/admin/dashboard.hbs` — bloco `{{else}}` (linhas 49–77):**
- 2 cards side-by-side (`col-sm-6`): "Certificados (seus eventos)" e "Participantes (seus eventos)"
- Sem tabela de atividade recente
- Sem breakdown por tipo

---

## Estratégia de solução

### Novas queries no bloco gestor

```js
const [totalCertificados, totalParticipantes, porTipo, ultimosCertificados] = whereEvento
  ? await Promise.all([
      Certificado.count({ where: whereEvento }),
      Certificado.count({ where: whereEvento, distinct: true, col: 'participante_id' }),
      Certificado.findAll({
        where: whereEvento,
        attributes: [
          'tipo_certificado_id',
          [sequelize.fn('COUNT', sequelize.col('tipo_certificado_id')), 'total'],
        ],
        group: ['tipo_certificado_id', 'TiposCertificado.id'],
        include: [{ model: TiposCertificados, attributes: ['nome'] }],
        raw: false,
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

**Nota:** `sequelize` precisa ser importado de `'../models'` (já disponível via `require('../models')`). Verificar se `sequelize` é exportado de `src/models/index.js`.

### Layout visual final

**Row 1:** 2 cards existentes  
**Row 2 (nova):** Tabela "Certificados por tipo"  
**Row 3 (nova):** Tabela "Últimos 5 certificados emitidos"

---

## Escopo desta feature

1. `src/controllers/dashboardController.js` — adicionar 2 queries ao bloco gestor/monitor
2. `views/admin/dashboard.hbs` — adicionar tabela por tipo e tabela de últimos 5 no bloco `{{else}}`

---

## Critérios de aceite

- [ ] Dashboard gestor exibe tabela "Certificados por tipo" com nome do tipo e contagem.
- [ ] Tabela "Últimos 5 certificados" exibe participante, tipo e data, escopados ao(s) evento(s) do gestor.
- [ ] Quando `eventoIds` está vazio, ambas as tabelas ficam ocultas (sem quebrar a view).
- [ ] Admin não vê as novas seções gestor (estão dentro do bloco `{{else}}`).
