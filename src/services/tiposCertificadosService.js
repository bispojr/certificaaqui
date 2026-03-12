// Service para lógica de negócio de TiposCertificados
const { TiposCertificados } = require('../../models');

module.exports = {
  async findAll() {
    return TiposCertificados.findAll();
  },
  async findById(id) {
    return TiposCertificados.findByPk(id);
  },
  async create(data) {
    return TiposCertificados.create(data);
  },
  async update(id, data) {
    const tipo = await TiposCertificados.findByPk(id);
    if (!tipo) return null;
    return tipo.update(data);
  },
  async destroy(id) {
    const tipo = await TiposCertificados.findByPk(id);
    if (!tipo) return null;
    return tipo.destroy();
  },
  async delete(id) {
    return this.destroy(id);
  },
  async restore(id) {
    const tipo = await TiposCertificados.findByPk(id, { paranoid: false });
    if (!tipo) return null;
    return tipo.restore();
  }
};