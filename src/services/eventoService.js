// Service para lógica de negócio de Evento
const { Evento } = require('../../src/models')

module.exports = {
  async findAll() {
    return Evento.findAll()
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
    // Soft delete do evento
    const evento = await Evento.findByPk(id)
    if (!evento) return null
    await evento.destroy()
    // Soft delete das associações N:N
    const { UsuarioEvento } = require('../../src/models')
    await UsuarioEvento.update(
      { deleted_at: new Date() },
      { where: { evento_id: id } }
    )
    return evento
  },
  async restore(id) {
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    return evento.restore()
  },
}
