const express = require('express')
const router = express.Router()
const { Certificado, Participante, Evento, TiposCertificados } = require('../models')
const pdfService = require('../services/pdfService')

/**
 * @swagger
 * tags:
 *   name: API
 *   description: API pública de consulta e validação de certificados (sem autenticação)
 */

/**
 * @swagger
 * /api/certificados/{id}/pdf:
 *   get:
 *     summary: Gera e retorna o PDF de um certificado
 *     tags: [API]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do certificado
 *     responses:
 *       200:
 *         description: Arquivo PDF do certificado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificado não encontrado
 *       500:
 *         description: Erro ao gerar PDF
 */
// GET /api/certificados/:id/pdf
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

/**
 * @swagger
 * /api/certificados:
 *   get:
 *     summary: Lista certificados de um participante pelo e-mail
 *     tags: [API]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: E-mail do participante
 *     responses:
 *       200:
 *         description: Lista de certificados do participante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certificados:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Certificado'
 *       400:
 *         description: E-mail não informado
 *       404:
 *         description: Participante não encontrado
 */
// GET /api/certificados?email=...
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

/**
 * @swagger
 * /api/validar/{codigo}:
 *   get:
 *     summary: Valida um certificado pelo código
 *     tags: [API]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código único do certificado (ex. EDU-2026-001)
 *     responses:
 *       200:
 *         description: Resultado da validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                 certificado:
 *                   $ref: '#/components/schemas/Certificado'
 *       404:
 *         description: Certificado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                   example: false
 *                 mensagem:
 *                   type: string
 */
// GET /api/validar/:codigo
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

module.exports = router
