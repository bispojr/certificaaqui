// Service para lógica de negócio de Certificado
const { Certificado } = require('../../src/models')

module.exports = {
  async cancel(id) {
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    // Supondo que existe um campo 'status' para marcar como cancelado
    return certificado.update({ status: 'cancelado' })
  },
  async findAll({ page = 1, perPage = 10 } = {}) {
    const offset = (page - 1) * perPage
    const { count, rows } = await Certificado.findAndCountAll({
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
    return Certificado.findByPk(id)
  },
  async create(data) {
    return Certificado.create(data)
  },
  async update(id, data) {
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    return certificado.update(data)
  },
  async destroy(id) {
    const certificado = await Certificado.findByPk(id)
    if (!certificado) return null
    return certificado.destroy()
  },
  async delete(id) {
    return this.destroy(id)
  },
  async restore(id) {
    const certificado = await Certificado.findByPk(id, { paranoid: false })
    if (!certificado) return null
    return certificado.restore()
  },
}
