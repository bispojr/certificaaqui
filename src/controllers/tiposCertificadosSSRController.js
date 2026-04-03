const { TiposCertificados, Certificado } = require('../models')
const { Op } = require('sequelize')

async function index(req, res) {
  try {
    const ativos = await TiposCertificados.findAll({
      include: [{ model: Certificado, as: 'certificados', attributes: ['id'] }],
    })
    const arquivados = await TiposCertificados.findAll({
      paranoid: false,
      where: { deleted_at: { [Op.ne]: null } },
      include: [{ model: Certificado, as: 'certificados', attributes: ['id'] }],
    })
    const mapCount = (list) =>
      list.map((t) => ({
        ...t.toJSON(),
        numCertificados: t.certificados.length,
      }))
    return res.render('admin/tipos-certificados/index', {
      tipos: mapCount(ativos),
      arquivados: mapCount(arquivados),
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function novo(_req, res) {
  return res.render('admin/tipos-certificados/form', {
    tipo: null,
    actionUrl: '/admin/tipos-certificados',
  })
}

async function editar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    const t = tipo.toJSON()
    return res.render('admin/tipos-certificados/form', {
      tipo: t,
      actionUrl: `/admin/tipos-certificados/${t.id}`,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function criar(req, res) {
  try {
    const dados_dinamicos = JSON.parse(req.body.dados_dinamicos_json || '{}')
    await TiposCertificados.create({
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
    await tipo.restore()
    req.flash('success', 'Tipo de certificado restaurado.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

module.exports = { index, novo, editar, criar, atualizar, deletar, restaurar }
