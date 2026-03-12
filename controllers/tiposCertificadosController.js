const tiposCertificadosService = require('../src/services/tiposCertificadosService');

class TiposCertificadosController {
  async create(req, res) {
    try {
      const tipo = await tiposCertificadosService.create(req.body);
      return res.status(201).json(tipo);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async findAll(req, res) {
    try {
      const tipos = await tiposCertificadosService.findAll();
      return res.status(200).json(tipos);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async findById(req, res) {
    try {
      const tipo = await tiposCertificadosService.findById(req.params.id);
      if (!tipo) {
        return res.status(404).json({ error: 'Tipo de certificado não encontrado' });
      }
      return res.status(200).json(tipo);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const tipo = await tiposCertificadosService.update(req.params.id, req.body);
      return res.status(200).json(tipo);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await tiposCertificadosService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async restore(req, res) {
    try {
      const tipo = await tiposCertificadosService.restore(req.params.id);
      return res.status(200).json(tipo);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new TiposCertificadosController();
