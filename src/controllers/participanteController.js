const participanteService = require('../services/participanteService')

class ParticipanteController {
  async create(req, res) {
    try {
      // papel e id disponíveis em req.params
      const { papel, id } = req.params
      // TODO: usar papel/id para lógica de escopo se necessário
      const participante = await participanteService.create(req.body)
      return res.status(201).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findAll(req, res) {
    try {
      const { papel, id } = req.params
      const page = parseInt(req.query.page, 10) || 1
      const perPage = parseInt(req.query.perPage, 10) || 20
      // TODO: usar papel/id para lógica de escopo se necessário
      const result = await participanteService.findAll({ page, perPage })
      return res.status(200).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async findById(req, res) {
    try {
      const { papel, id, participanteId } = req.params
      const participante = await participanteService.findById(participanteId)
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
      const { papel, id, participanteId } = req.params
      const participante = await participanteService.update(
        participanteId,
        req.body,
      )
      return res.status(200).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async delete(req, res) {
    try {
      const { papel, id, participanteId } = req.params
      await participanteService.delete(participanteId)
      return res.status(204).send()
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  async restore(req, res) {
    try {
      const { papel, id, participanteId } = req.params
      const participante = await participanteService.restore(participanteId)
      return res.status(200).json(participante)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
}

module.exports = new ParticipanteController()
