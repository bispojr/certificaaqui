// Service para lógica de negócio de Evento
const { Evento } = require('../../src/models')
const { enforceTenantScope } = require('./auth/enforceTenantScope')

module.exports = {
  async findAll({
    page = 1,
    perPage = 20,
    usuario,
    principal = null,
    eventoIds = null,
  } = {}) {
    const offset = (page - 1) * perPage
    const query = {
      offset,
      limit: perPage,
    }

    if (principal) {
      enforceTenantScope({ principal, eventoIds, operationKey: 'evento.read' })
    }

    if (usuario && usuario.perfil !== 'admin') {
      query.include = [
        {
          association: 'usuarios',
          where: { id: usuario.id },
          through: { attributes: [] },
        },
      ]
    }

    const { count, rows } = await Evento.findAndCountAll(query)
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
        requestedEventId: id,
        operationKey: 'evento.read',
      })
    }
    return Evento.findByPk(id)
  },
  async create(data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: data?.id,
        operationKey: 'evento.write',
      })
    }
    return Evento.create(data)
  },
  async update(id, data, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: id,
        operationKey: 'evento.write',
      })
    }
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    return evento.update(data)
  },
  async destroy(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: id,
        operationKey: 'evento.write',
      })
    }
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    return evento.destroy()
  },
  async delete(id, options = {}) {
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    if (options.principal) {
      enforceTenantScope({
        principal: options.principal,
        eventoIds: options.eventoIds,
        requestedEventId: id,
        operationKey: 'evento.write',
      })
    }
    await evento.destroy()
    const { UsuarioEvento } = require('../../src/models')
    await UsuarioEvento.destroy({ where: { evento_id: id } })
    return evento
  },
  async restore(id, { principal = null, eventoIds = null } = {}) {
    if (principal) {
      enforceTenantScope({
        principal,
        eventoIds,
        requestedEventId: id,
        operationKey: 'evento.write',
      })
    }
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    await evento.restore()
    const { UsuarioEvento } = require('../../src/models')
    await UsuarioEvento.restore({ where: { evento_id: id } })
    return evento
  },
}
