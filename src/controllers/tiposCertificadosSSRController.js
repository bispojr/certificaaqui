const { TiposCertificados, Certificado, Evento } = require('../models')
const { Op } = require('sequelize')

/**
 * Retorna os IDs dos eventos vinculados ao usuário.
 * Admin retorna null (sem restrição).
 * Gestor/monitor retorna array de IDs.
 */
async function getEventosIds(usuario) {
  if (usuario.perfil === 'admin') return null
  if (typeof usuario.getEventos !== 'function') return []
  const eventos = await usuario.getEventos()
  return eventos.map((e) => Number(e.id))
}

/**
 * Verifica se o usuário tem ownership sobre um tipo de certificado.
 * Admin sempre tem. Gestor/monitor só se tipo.evento_id ∈ seus eventos.
 */
async function temOwnership(usuario, tipo) {
  if (usuario.perfil === 'admin') return true
  const ids = await getEventosIds(usuario)
  return ids.includes(Number(tipo.evento_id))
}

async function index(req, res) {
  try {
    const eventosIds = await getEventosIds(req.usuario)
    const whereAtivos = {}
    const whereArquivados = { deleted_at: { [Op.ne]: null } }

    const ativos = await TiposCertificados.findAll({
      where: whereAtivos,
      include: [
        { model: Certificado, as: 'certificados', attributes: ['id'] },
        { model: Evento, as: 'evento', attributes: ['id', 'nome'] },
      ],
    })
    const arquivados = await TiposCertificados.findAll({
      paranoid: false,
      where: whereArquivados,
      include: [
        { model: Certificado, as: 'certificados', attributes: ['id'] },
        { model: Evento, as: 'evento', attributes: ['id', 'nome'] },
      ],
    })

    const mapCount = (list) =>
      list.map((t) => {
        const json = t.toJSON()
        return {
          ...json,
          numCertificados: t.certificados.length,
          podeEditar:
            req.usuario.perfil === 'admin' ||
            (eventosIds && eventosIds.includes(Number(json.evento_id))),
        }
      })

    return res.render('admin/tipos-certificados/index', {
      layout: 'layouts/admin',
      tipos: mapCount(ativos),
      arquivados: mapCount(arquivados),
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function novo(req, res) {
  try {
    const eventosIds = await getEventosIds(req.usuario)
    const whereEvento = eventosIds ? { id: eventosIds } : {}
    const eventos = await Evento.findAll({
      where: whereEvento,
      attributes: ['id', 'nome'],
    })
    return res.render('admin/tipos-certificados/form', {
      layout: 'layouts/admin',
      tipo: null,
      actionUrl: '/admin/tipos-certificados',
      opcoesCampoDestaque: [{ value: 'nome', selected: true }],
      opcoesEvento: eventos.map((e) => ({ value: e.id, label: e.nome })),
    })
  } catch (error) {
    req.flash('error', error.message)
    return res
      .status(500)
      .send('Erro ao renderizar formulário: ' + error.message)
  }
}

async function editar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    if (!(await temOwnership(req.usuario, tipo))) {
      req.flash(
        'error',
        'Acesso restrito: você não gerencia este tipo de certificado.',
      )
      return res.redirect('/admin/tipos-certificados')
    }
    const t = tipo.toJSON()
    const campoDestaque = t.campo_destaque || 'nome'
    const opcoes = Object.keys(t.dados_dinamicos || {}).map((key) => ({
      value: key,
      selected: key === campoDestaque,
    }))
    return res.render('admin/tipos-certificados/form', {
      layout: 'layouts/admin',
      tipo: t,
      actionUrl: `/admin/tipos-certificados/${t.id}`,
      opcoesCampoDestaque: [
        { value: 'nome', selected: campoDestaque === 'nome' },
        ...opcoes,
      ],
      opcoesEvento: [],
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function criar(req, res) {
  try {
    const dados_dinamicos = JSON.parse(req.body.dados_dinamicos_json || '{}')
    const eventoId = Number(req.body.evento_id)

    // Verifica ownership antes de criar
    const eventosIds = await getEventosIds(req.usuario)
    if (eventosIds !== null && !eventosIds.includes(eventoId)) {
      req.flash('error', 'Acesso restrito: evento não pertence ao seu escopo.')
      return res.redirect('/admin/tipos-certificados/novo')
    }

    await TiposCertificados.create({
      evento_id: eventoId,
      codigo: req.body.codigo,
      descricao: req.body.descricao,
      campo_destaque: req.body.campo_destaque,
      texto_base: req.body.texto_base,
      dados_dinamicos,
    })
    req.flash('success', 'Tipo de certificado criado com sucesso.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados/novo')
  }
}

async function atualizar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    if (!(await temOwnership(req.usuario, tipo))) {
      req.flash(
        'error',
        'Acesso restrito: você não gerencia este tipo de certificado.',
      )
      return res.redirect('/admin/tipos-certificados')
    }
    const dados_dinamicos = JSON.parse(req.body.dados_dinamicos_json || '{}')
    await tipo.update({
      codigo: req.body.codigo,
      descricao: req.body.descricao,
      campo_destaque: req.body.campo_destaque,
      texto_base: req.body.texto_base,
      dados_dinamicos,
    })
    req.flash('success', 'Tipo de certificado atualizado com sucesso.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/tipos-certificados/${req.params.id}/editar`)
  }
}

async function deletar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    if (!(await temOwnership(req.usuario, tipo))) {
      req.flash(
        'error',
        'Acesso restrito: você não gerencia este tipo de certificado.',
      )
      return res.redirect('/admin/tipos-certificados')
    }
    await tipo.destroy()
    req.flash('success', 'Tipo de certificado arquivado.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function restaurar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id, {
      paranoid: false,
    })
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    if (!(await temOwnership(req.usuario, tipo))) {
      req.flash(
        'error',
        'Acesso restrito: você não gerencia este tipo de certificado.',
      )
      return res.redirect('/admin/tipos-certificados')
    }
    await tipo.restore()
    req.flash('success', 'Tipo de certificado restaurado.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

module.exports = { index, novo, editar, criar, atualizar, deletar, restaurar }
