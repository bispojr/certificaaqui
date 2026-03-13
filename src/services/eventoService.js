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
    return this.destroy(id)
  },
  async restore(id) {
    const evento = await Evento.findByPk(id, { paranoid: false })
    if (!evento) return null
    return evento.restore()
  },
}
