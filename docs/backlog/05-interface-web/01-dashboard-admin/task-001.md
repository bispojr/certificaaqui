# TASK ID: DASH-001

## Título
Criar `src/controllers/dashboardController.js`

## Objetivo
Implementar controller que busca contagens de entidades e renderiza `views/admin/dashboard`, adaptando os dados ao perfil do usuário autenticado.

## Contexto
- `req.usuario` vem de `authSSR.js`: `{ id, nome, email, perfil, isAdmin, isGestor }`
- **admin**: conta todos os registros ativos em `Evento`, `TiposCertificados`, `Participante`, `Usuario`
- **gestor/monitor**: re-busca o usuário do DB com `include: [Evento as 'eventos']` para obter `eventoIds`; conta `Certificado` e participantes distintos filtrados por `evento_id: eventoIds`
- Contagens usam `Model.count()` do Sequelize (ignora `deleted_at` automaticamente)
- Participantes de gestor/monitor: contagem distinta via `Certificado.count({ distinct: true, col: 'participante_id' })`

## Arquivos envolvidos
- `src/controllers/dashboardController.js` ← CRIAR

## Passos

### Criar `src/controllers/dashboardController.js`

```js
const { Evento, TiposCertificados, Participante, Usuario, Certificado } = require('../models')

async function dashboard(req, res) {
  try {
    const { perfil } = req.usuario

    if (perfil === 'admin') {
      const [totalEventos, totalTipos, totalParticipantes, totalUsuarios] =
        await Promise.all([
          Evento.count(),
          TiposCertificados.count(),
          Participante.count(),
          Usuario.count(),
        ])
      return res.render('admin/dashboard', {
        title: 'Dashboard',
        totalEventos,
        totalTipos,
        totalParticipantes,
        totalUsuarios,
      })
    }

    // gestor ou monitor — escopo por eventos vinculados
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

    return res.render('admin/dashboard', {
      title: 'Dashboard',
      totalCertificados,
      totalParticipantes,
    })
  } catch (error) {
    return res.status(500).render('error', { message: error.message })
  }
}

module.exports = { dashboard }
```

## Resultado esperado
Controller sem erros de importação que diferencia admin de gestor/monitor.

## Critério de aceite
- admin recebe `{ totalEventos, totalTipos, totalParticipantes, totalUsuarios }`
- gestor/monitor recebe `{ totalCertificados, totalParticipantes }` filtrados pelos seus eventos
- Se `eventoIds` for vazio: `[0, 0]` (sem chamar `Certificado.count` desnecessariamente)
- Erros renderizam `error` com status 500
