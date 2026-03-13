const participanteService = require('../services/participanteService')

class ParticipanteController {
  async create(req, res) {
    try {
      const participante = await participanteService.create(req.body)
      return res.status(201).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findAll(req, res) {
    try {
      const participantes = await participanteService.findAll()
      return res.status(200).json(participantes)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findById(req, res) {
    try {
      const participante = await participanteService.findById(req.params.id)
      if (!participante) {
        return res.status(404).json({ error: 'Participante não encontrado' })
      }
      return res.status(200).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async update(req, res) {
    try {
      const participante = await participanteService.update(
        req.params.id,
        req.body,
      )
      return res.status(200).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async delete(req, res) {
    try {
      await participanteService.delete(req.params.id)
      return res.status(204).send()
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async restore(req, res) {
    try {
      const participante = await participanteService.restore(req.params.id)
      return res.status(200).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
}

module.exports = new ParticipanteController()
