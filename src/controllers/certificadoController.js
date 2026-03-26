const certificadoService = require('../services/certificadoService')

class CertificadoController {
  async create(req, res) {
    try {
      const certificado = await certificadoService.create(req.body)
      return res.status(201).json(certificado)
    } catch (error) {
      const status = error.statusCode || 400
      const body = { error: error.message }
      if (error.camposFaltantes) body.camposFaltantes = error.camposFaltantes
      return res.status(status).json(body)
    }
  }

  async findAll(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const perPage = parseInt(req.query.perPage, 10) || 10
      const result = await certificadoService.findAll({ page, perPage })
      return res.status(200).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findById(req, res) {
    try {
      const certificado = await certificadoService.findById(req.params.id)
      if (!certificado) {
        return res.status(404).json({ error: 'Certificado não encontrado' })
      }
      return res.status(200).json(certificado)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async update(req, res) {
    try {
      const certificado = await certificadoService.update(
        req.params.id,
        req.body,
      )
      return res.status(200).json(certificado)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async delete(req, res) {
    try {
      await certificadoService.delete(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async restore(req, res) {
    try {
      const certificado = await certificadoService.restore(req.params.id)
      return res.status(200).json(certificado)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async cancel(req, res) {
    try {
      const certificado = await certificadoService.cancel(req.params.id)
      return res.status(200).json(certificado)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
}

module.exports = new CertificadoController()
