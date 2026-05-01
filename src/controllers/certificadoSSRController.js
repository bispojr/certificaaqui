const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  UsuarioEvento,
} = require('../models')
const certificadoService = require('../services/certificadoService')

const INCLUDES = [
  { model: Participante, attributes: ['id', 'nomeCompleto', 'email'] },
  { model: Evento, attributes: ['id', 'nome'] },
  {
    model: TiposCertificados,
    attributes: ['id', 'descricao', 'texto_base', 'dados_dinamicos'],
  },
]

async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null // null = sem filtro
  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: req.usuario.id },
  })
  return associacoes.map((a) => a.evento_id)
}

async function index(req, res) {
  try {
    const { status, evento_id, tipo_id } = req.query
    const eventoIds = await getEventoIds(req)

    // eventoIds === null → admin (sem filtro); === [] → gestor sem eventos (retorna nada)
    if (eventoIds !== null && eventoIds.length === 0) {
      const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
      const tipos = await TiposCertificados.findAll({
        attributes: ['id', 'descricao'],
      })
      return res.render('admin/certificados/index', {
        layout: 'layouts/admin',
        certificados: [],
        arquivados: [],
        eventos,
        tipos,
        filtros: { status, evento_id, tipo_id },
      })
    }

    const where = {}
    if (status) where.status = status
    if (evento_id) where.evento_id = Number(evento_id)
    else if (eventoIds) where.evento_id = eventoIds

    if (tipo_id) where.tipo_certificado_id = Number(tipo_id)

    const certificados = await Certificado.findAll({ where, include: INCLUDES })
    const arquivados = await Certificado.findAll({
      paranoid: false,
      where: { ...where, deleted_at: { [require('sequelize').Op.ne]: null } },
      include: INCLUDES,
    })

    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const tipos = await TiposCertificados.findAll({
      attributes: ['id', 'descricao'],
    })

    return res.render('admin/certificados/index', {
      layout: 'layouts/admin',
      certificados,
      arquivados,
      eventos,
      tipos,
      filtros: { status, evento_id, tipo_id },
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function detalhe(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, {
      include: INCLUDES,
    })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const templateService = require('../services/templateService')
    const textoInterpolado = templateService.interpolate(
      certificado.TiposCertificado?.texto_base || '',
      certificado.valores_dinamicos || {},
      certificado.nome,
    )
    return res.render('admin/certificados/detalhe', {
      layout: 'layouts/admin',
      certificado,
      textoInterpolado,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function novo(req, res) {
  const participantes = await Participante.findAll({
    attributes: ['id', 'nomeCompleto', 'email'],
  })
  const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
  const tipos = await TiposCertificados.findAll({
    attributes: ['id', 'descricao', 'dados_dinamicos'],
  })
  return res.render('admin/certificados/form', {
    layout: 'layouts/admin',
    certificado: null,
    participantes,
    eventos,
    tipos,
  })
}

async function editar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, {
      include: INCLUDES,
    })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const participantes = await Participante.findAll({
      attributes: ['id', 'nomeCompleto', 'email'],
    })
    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const tipos = await TiposCertificados.findAll({
      attributes: ['id', 'descricao', 'dados_dinamicos'],
    })
    return res.render('admin/certificados/form', {
      layout: 'layouts/admin',
      certificado: certificado.toJSON(),
      participantes,
      eventos,
      tipos,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function criar(req, res) {
  try {
    const valores_dinamicos = JSON.parse(
      req.body.valores_dinamicos_json || '{}',
    )
    let nome = req.body.nome
    // Se não houver campos dinâmicos, preenche nome com nomeCompleto do participante
    if (!nome || nome.trim() === '') {
      const participante = await Participante.findByPk(
        Number(req.body.participante_id),
      )
      if (participante) {
        nome = participante.nomeCompleto
      }
    }
    await certificadoService.create({
      nome,
      status: req.body.status || 'emitido',
      participante_id: Number(req.body.participante_id),
      evento_id: Number(req.body.evento_id),
      tipo_certificado_id: Number(req.body.tipo_certificado_id),
      valores_dinamicos,
    })
    req.flash('success', 'Certificado criado com sucesso.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados/novo')
  }
}

async function atualizar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id)
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const valores_dinamicos = JSON.parse(
      req.body.valores_dinamicos_json || '{}',
    )
    // Preenche nome automaticamente se não informado
    let nome = req.body.nome
    if (!nome || nome.trim() === '') {
      const participante = await Participante.findByPk(
        Number(req.body.participante_id),
      )
      if (participante) {
        nome = participante.nomeCompleto
      }
    }
    await certificado.update({
      nome,
      status: req.body.status,
      participante_id: Number(req.body.participante_id),
      evento_id: Number(req.body.evento_id),
      tipo_certificado_id: Number(req.body.tipo_certificado_id),
      valores_dinamicos,
    })
    req.flash('success', 'Certificado atualizado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/certificados/${req.params.id}/editar`)
  }
}

async function cancelar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id)
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    await certificado.update({ status: 'cancelado' })
    req.flash('success', 'Certificado cancelado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function restaurar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, {
      paranoid: false,
    })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    await certificado.restore()
    req.flash('success', 'Certificado restaurado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function deletar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id)
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    await certificado.destroy()
    req.flash('success', 'Certificado removido (soft delete).')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

module.exports = {
  index,
  detalhe,
  novo,
  editar,
  criar,
  atualizar,
  cancelar,
  restaurar,
  deletar,
}
