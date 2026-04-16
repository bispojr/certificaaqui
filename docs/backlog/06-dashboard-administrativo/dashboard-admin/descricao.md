# Feature: Enriquecimento do Dashboard Admin

## Identificador da feature

dashboard-admin

## Domínio

06 — Dashboard Administrativo

## Prioridade

ALTA

## Problema

O dashboard admin atual exibe 4 cards de contagem (`totalEventos`, `totalTipos`, `totalParticipantes`, `totalUsuarios`), mas **não mostra nenhuma informação sobre certificados** — a entidade central do sistema.

Estado atual confirmado (via leitura do código):

**`dashboardController.js` — bloco admin (linhas 17–30):**

```js
const [totalEventos, totalTipos, totalParticipantes, totalUsuarios] =
  await Promise.all([
    Evento.count(),
    TiposCertificados.count(),
    Participante.count(),
    Usuario.count(),
  ])
```

**`views/admin/dashboard.hbs` — bloco `{{#if usuario.isAdmin}}`:**

- 4 cards: Eventos (azul), Tipos de Certificados (verde), Participantes (amarelo), Usuários (vermelho)
- Nenhum card de certificados
- Nenhuma tabela de atividade recente

---

## Estratégia de solução

### Novas queries no `Promise.all` do admin

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
```

### Layout visual final (Bootstrap 5)

**Row 1:** 5 cards (col-sm-6 col-lg) — Eventos, Tipos, Participantes, Usuários, **Certificados**
**Row 2:** 1 card alerta — Certificados Pendentes (badge `bg-warning`)
**Row 3:** Tabela "Últimos 5 certificados emitidos" com colunas: Participante | Evento | Tipo | Código | Data

---

## Escopo desta feature

1. `src/controllers/dashboardController.js` — adicionar 3 novas queries ao `Promise.all` do admin
2. `views/admin/dashboard.hbs` — adicionar card de certificados, card de pendentes e tabela de últimos 5

---

## Critérios de aceite

- [ ] Card "Total de Certificados" exibe `Certificado.count()` no dashboard admin.
- [ ] Card "Certificados Pendentes" exibe contagem com destaque visual (borda/texto warning).
- [ ] Tabela "Últimos 5 certificados" exibe nome do participante, nome do evento, tipo e data de criação.
- [ ] Testes existentes do dashboardController não quebram (cobertura mínima de renderização).

---

## Riscos

- `Certificado.findAll({ limit: 5, include: [...] })` faz 1 query com JOINs — aceitável; não adicionar paginação neste contexto.
- Nome da associação `TiposCertificados` ou alias — verificar no model antes de implementar para evitar erro de alias desconhecido.
