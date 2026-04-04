const express = require('express')
const router = express.Router()
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../models')
const pdfService = require('../services/pdfService')
// GET /public/certificados/:id/pdf
router.get('/certificados/:id/pdf', async (req, res) => {
  const { id } = req.params
  try {
    const certificado = await Certificado.findByPk(id, {
      include: [
        { model: Participante },
        { model: Evento },
        { model: TiposCertificados },
      ],
    })
    if (!certificado) {
      return res.status(404).json({ error: 'Certificado não encontrado' })
    }
    const buffer = await pdfService.generateCertificadoPdf(certificado)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename=certificado-${id}.pdf`,
    )
    return res.status(200).send(buffer)
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Erro ao gerar PDF', detalhe: err.message })
  }
})

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
  } catch {
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
  } catch {
    return res.status(500).json({ error: 'Erro ao validar certificado' })
  }
})

// ─── SSR: páginas públicas ────────────────────────────────────────────────────

router.get('/pagina/opcoes', (req, res) => {
  res.render('certificados/opcoes')
})

router.get('/pagina/obter', (req, res) => {
  res.render('certificados/form-obter')
})

router.get('/pagina/validar', (req, res) => {
  res.render('certificados/form-validar')
})

// POST /public/pagina/buscar
router.post('/pagina/buscar', async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.render('certificados/form-obter', {
      mensagem: 'Informe um e-mail válido.',
    })
  }
  try {
    const participante = await Participante.findOne({ where: { email } })
    if (!participante) {
      return res.render('certificados/form-obter', {
        mensagem: 'Nenhum participante encontrado com este e-mail.',
      })
    }
    const certificados = await Certificado.findAll({
      where: { participante_id: participante.id },
    })
    return res.render('certificados/obter-lista', { email, certificados })
  } catch {
    return res.render('certificados/form-obter', {
      mensagem: 'Erro ao buscar certificados. Tente novamente.',
    })
  }
})

// POST /public/pagina/validar
router.post('/pagina/validar', async (req, res) => {
  const { codigo } = req.body
  if (!codigo) {
    return res.render('certificados/form-validar', {
      mensagem: 'Informe o código do certificado.',
    })
  }
  try {
    const certificado = await Certificado.findOne({
      where: { codigo },
      include: [{ model: Participante }, { model: Evento }],
    })
    if (!certificado) {
      return res.render('certificados/validar-resultado', { valido: false })
    }
    return res.render('certificados/validar-resultado', {
      valido: true,
      certificado,
    })
  } catch {
    return res.render('certificados/form-validar', {
      mensagem: 'Erro ao validar certificado. Tente novamente.',
    })
  }
})

module.exports = router
