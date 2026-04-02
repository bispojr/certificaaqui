// Service para lógica de negócio de Evento
const { Evento } = require('../../src/models')

module.exports = {
  async findAll({ page = 1, perPage = 20 } = {}) {
    const offset = (page - 1) * perPage
    const { count, rows } = await Evento.findAndCountAll({
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
  async findById(id) {
    return Evento.findByPk(id)
  },
  async create(data) {
    return Evento.create(data)
  },
  async update(id, data) {
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    return evento.update(data)
  },
  async destroy(id) {
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    return evento.destroy()
  },
  async delete(id) {
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    await evento.destroy()
    const { UsuarioEvento } = require('../../src/models')
    await UsuarioEvento.destroy({ where: { evento_id: id } })
    return evento
  },
  async restore(id) {
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    await evento.restore()
    const { UsuarioEvento } = require('../../src/models')
    await UsuarioEvento.restore({ where: { evento_id: id } })
    return evento
  },
}
