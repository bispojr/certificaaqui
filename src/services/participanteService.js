// Service para lógica de negócio de Participante
const { Participante } = require('../../src/models')
const { enforceTenantScope } = require('./auth/enforceTenantScope')

module.exports = {
  async findAll({
    page = 1,
    perPage = 20,
    principal = null,
    eventoIds = null,
  } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'participante.read',
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

    const { count, rows } = await Participante.findAndCountAll({
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
        operationKey: 'participante.read',
      })
    }
    return Participante.findByPk(id)
  },
  async create(data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: data?.evento_id,
        operationKey: 'participante.write',
      })
    }
    return Participante.create(data)
  },
  async update(id, data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: data?.evento_id,
        operationKey: 'participante.write',
      })
    }
    const participante = await Participante.findByPk(id)
    if (!participante) return null
    return participante.update(data)
  },
  async destroy(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'participante.write',
      })
    }
    const participante = await Participante.findByPk(id)
    if (!participante) return null
    return participante.destroy()
  },
  async delete(id, options = {}) {
    return this.destroy(id, options)
  },
  async restore(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        operationKey: 'participante.write',
      })
    }
    const participante = await Participante.findByPk(id, { paranoid: false })
    if (!participante) return null
    return participante.restore()
  },
}
