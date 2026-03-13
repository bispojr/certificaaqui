// Service para lógica de negócio de Participante
const { Participante } = require('../../src/models')

module.exports = {
  async findAll() {
    return Participante.findAll()
  },
  async findById(id) {
    return Participante.findByPk(id)
  },
  async create(data) {
    return Participante.create(data)
  },
  async update(id, data) {
    const participante = await Participante.findByPk(id)
    if (!participante) return null
    return participante.update(data)
  },
  async destroy(id) {
    const participante = await Participante.findByPk(id)
    if (!participante) return null
    return participante.destroy()
  },
  async delete(id) {
    return this.destroy(id)
  },
  async restore(id) {
    const participante = await Participante.findByPk(id, { paranoid: false })
    if (!participante) return null
    return participante.restore()
  },
}
