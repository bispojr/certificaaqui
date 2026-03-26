const {
  Evento,
  TiposCertificados,
  Participante,
  Usuario,
  Certificado,
} = require('../models')

async function dashboard(req, res) {
  try {
    if (!req.usuario) {
      return res.redirect('/auth/login')
    }
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
          Certificado.count({
            where: whereEvento,
            distinct: true,
            col: 'participante_id',
          }),
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
