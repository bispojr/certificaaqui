const {
  Evento,
  TiposCertificados,
  Participante,
  Usuario,
  Certificado,
} = require('../models')

async function dashboard(req, res) {
  try {
    // Suporte ao novo padrão de rota: /:papel/:id
    const papelParam = req.params.papel || req.usuario?.perfil
    const idParam = req.params.id || req.usuario?.id

    if (!req.usuario) {
      return res.redirect('/auth/login')
    }

    // Validação de acesso
    if (
      req.usuario.perfil !== papelParam ||
      req.usuario.id !== Number(idParam)
    ) {
      // Admin pode acessar qualquer dashboard
      if (req.usuario.perfil !== 'admin') {
        return res.status(403).render('error', { message: 'Acesso negado' })
      }
    }

    const perfil = papelParam

    if (perfil === 'admin') {
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
            { model: Participante, attributes: ['nomeCompleto'] },
            { model: Evento, attributes: ['nome'] },
            { model: TiposCertificados, attributes: ['descricao'] },
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
        ultimosCertificados,
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
      layout: 'layouts/admin',
      title: 'Dashboard',
      totalCertificados,
      totalParticipantes,
    })
  } catch (error) {
    return res.status(500).render('error', { message: error.message })
  }
}

module.exports = { dashboard }
