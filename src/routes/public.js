const express = require('express')
const router = express.Router()
const { Certificado, Participante } = require('../models')

// GET /public/certificados?email=...
router.get('/certificados', async (req, res) => {
  const { email } = req.query
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' })
  }
  try {
    const participante = await Participante.findOne({ where: { email } })
    if (!participante) {
      return res.status(404).json({ error: 'Participante não encontrado' })
    }
    const certificados = await Certificado.findAll({
      where: { participante_id: participante.id },
    })
    return res.json({ certificados })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar certificados' })
  }
})

// GET /public/validar/:codigo
router.get('/validar/:codigo', async (req, res) => {
  const { codigo } = req.params
  try {
    const certificado = await Certificado.findOne({ where: { codigo } })
    if (!certificado) {
      return res
        .status(404)
        .json({ valido: false, mensagem: 'Certificado não encontrado' })
    }
    return res.json({ valido: true, certificado })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao validar certificado' })
  }
})

module.exports = router
