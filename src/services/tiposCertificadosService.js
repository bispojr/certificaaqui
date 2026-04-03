// Service para lógica de negócio de TiposCertificados
const { TiposCertificados } = require('../../src/models')

module.exports = {
  async findAll({ page = 1, perPage = 20 } = {}) {
    const offset = (page - 1) * perPage
    const { count, rows } = await TiposCertificados.findAndCountAll({
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
    return TiposCertificados.findByPk(id)
  },
  async create(data) {
    return TiposCertificados.create(data)
  },
  async update(id, data) {
    const tipo = await TiposCertificados.findByPk(id)
    if (!tipo) return null
    return tipo.update(data)
  },
  async destroy(id) {
    const tipo = await TiposCertificados.findByPk(id)
    if (!tipo) return null
    return tipo.destroy()
  },
  async delete(id) {
    return this.destroy(id)
  },
  async restore(id) {
    const tipo = await TiposCertificados.findByPk(id, { paranoid: false })
    if (!tipo) return null
    return tipo.restore()
  },
}
