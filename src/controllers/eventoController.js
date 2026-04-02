const eventoService = require('../services/eventoService')

class EventoController {
  async create(req, res) {
    try {
      const evento = await eventoService.create(req.body)
      return res.status(201).json(evento)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findAll(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1
      const perPage = parseInt(req.query.perPage, 10) || 20
      const result = await eventoService.findAll({ page, perPage })
      return res.status(200).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findById(req, res) {
    try {
      const evento = await eventoService.findById(req.params.id)
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' })
      }
      return res.status(200).json(evento)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async update(req, res) {
    try {
      const evento = await eventoService.update(req.params.id, req.body)
      return res.status(200).json(evento)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async delete(req, res) {
    try {
      await eventoService.delete(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async restore(req, res) {
    try {
      const evento = await eventoService.restore(req.params.id)
      return res.status(200).json(evento)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
}

module.exports = new EventoController()
