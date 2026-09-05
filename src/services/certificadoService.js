// Service para lógica de negócio de Certificado
const { Certificado, TiposCertificados, Evento } = require('../../src/models')
const { enforceTenantScope } = require('./auth/enforceTenantScope')

module.exports = {
  async cancel(id) {
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    // Supondo que existe um campo 'status' para marcar como cancelado
    return certificado.update({ status: 'cancelado' })
  },
  async findAll({
    page = 1,
    perPage = 10,
    principal = null,
    eventoIds = null,
  } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'certificado.read',
      })
    }

    const offset = (page - 1) * perPage
    const where =
      principal &&
      principal.role !== 'admin' &&
      Array.isArray(eventoIds) &&
      eventoIds.length
        ? { evento_id: eventoIds }
        : undefined

    const { count, rows } = await Certificado.findAndCountAll({
      where,
      offset,
      limit: perPage,
    })
    return {
      data: rows,
      meta: {
        total: count,
        page,
        perPage,
        totalPages: Math.ceil(count / perPage),
      },
    }
  },
  async findById(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: null,
        operationKey: 'certificado.read',
      })
    }
    return Certificado.findByPk(id)
  },
  async create(data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: data?.evento_id,
        operationKey: 'certificado.write',
      })
    }

    const tipo = await TiposCertificados.findByPk(data.tipo_certificado_id)
    if (!tipo) {
      const err = new Error('Tipo de certificado não encontrado')
      err.statusCode = 404
      throw err
    }

    const evento = await Evento.findByPk(data.evento_id)
    if (!evento) {
      const err = new Error('Evento não encontrado')
      err.statusCode = 404
      throw err
    }

    const camposEsperados = Object.keys(tipo.dados_dinamicos || {})
    const valoresRecebidos = data.valores_dinamicos || {}
    const camposFaltantes = camposEsperados.filter(
      (c) => !(c in valoresRecebidos),
    )

    if (camposFaltantes.length > 0) {
      const err = new Error('Campos dinâmicos obrigatórios não informados')
      err.statusCode = 422
      err.camposFaltantes = camposFaltantes
      throw err
    }

    // Geração do código de validação
    const eventCode = evento.codigo_base // Ex: 'EDC'
    const year = evento.ano.toString().slice(-2) // Ex: '25'
    const tipoCode = tipo.codigo // Ex: 'PT'
    // Buscar o número incremental
    const count = await Certificado.count({
      where: {
        evento_id: data.evento_id,
        tipo_certificado_id: data.tipo_certificado_id,
      },
    })
    const incremental = count + 1
    const validationCode = `${eventCode}-${year}-${tipoCode}-${incremental}`
    data.codigo = validationCode

    return Certificado.create(data)
  },
  async update(id, data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: data?.evento_id,
        operationKey: 'certificado.write',
      })
    }
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    return certificado.update(data)
  },
  async destroy(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'certificado.write',
      })
    }
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    return certificado.destroy()
  },
  async delete(id, options = {}) {
    return this.destroy(id, options)
  },
  async restore(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'certificado.write',
      })
    }
    const certificado = await Certificado.findByPk(id, { paranoid: false })
    if (!certificado) return null
    return certificado.restore()
  },
}
