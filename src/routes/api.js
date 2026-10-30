const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
  Usuario,
} = require('../models')
const pdfService = require('../services/pdfService')
const logger = require('../utils/logger')
const { createConcurrencyLimiter } = require('../utils/concurrencyLimiter')
const {
  resolveAuthorizationScope,
} = require('../services/auth/resolveAuthorizationScope')
const STATUS_PUBLICO_CERTIFICADO = 'emitido'

const rawPdfMaxConcurrency = Number.parseInt(
  process.env.PDF_STREAM_MAX_CONCURRENCY,
  10,
)
const pdfMaxConcurrency =
  Number.isInteger(rawPdfMaxConcurrency) && rawPdfMaxConcurrency > 0
    ? rawPdfMaxConcurrency
    : 4
const pdfDownloadLimiter = createConcurrencyLimiter(pdfMaxConcurrency)

function readAccessToken(req) {
  const authHeader = req.headers?.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return req.cookies?.token || null
}

async function resolveAuthenticatedUser(req) {
  const token = readAccessToken(req)
  if (!token || !process.env.JWT_SECRET) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.id) {
      return null
    }

    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      return null
    }

    const contextoAutorizacao = await resolveAuthorizationScope({
      usuario,
      principal: { role: usuario.perfil },
      strict: false,
    })

    return {
      perfil: usuario.perfil,
      contextoAutorizacao,
    }
  } catch {
    return null
  }
}

function canDownloadPendingCertificado(authorizationContext, eventoId) {
  if (!authorizationContext) {
    return false
  }

  if (authorizationContext.perfil === 'admin') {
    return true
  }

  if (authorizationContext.perfil !== 'gestor') {
    return false
  }

  const eventoIds = authorizationContext.contextoAutorizacao?.eventoIds
  if (!Array.isArray(eventoIds)) {
    return false
  }

  return eventoIds.includes(Number(eventoId))
}

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
    const certificado = await Certificado.findOne({
      where: { id },
      include: [
        { model: Participante },
        { model: Evento },
        { model: TiposCertificados, as: 'TiposCertificados' },
      ],
    })

    if (!certificado) {
      return res.status(404).json({
        error: 'Certificado não encontrado ou indisponível publicamente',
      })
    }

    if (certificado.status !== STATUS_PUBLICO_CERTIFICADO) {
      const authorizationContext = await resolveAuthenticatedUser(req)
      const pendingDownloadAllowed = canDownloadPendingCertificado(
        authorizationContext,
        certificado.evento_id,
      )

      if (!pendingDownloadAllowed) {
        return res.status(404).json({
          error: 'Certificado não encontrado ou indisponível publicamente',
        })
      }
    }

    res.on('close', () => {
      if (!res.writableEnded) {
        // Conexão encerrada prematuramente pelo cliente
      }
    })

    const releasePdfSlot = pdfDownloadLimiter.tryAcquire()
    if (!releasePdfSlot) {
      logger.warn('pdf.stream.rejected_by_concurrency_limit', {
        requestId: req.requestId,
        certificadoId: id,
        limiter: pdfDownloadLimiter.getState(),
      })
      return res.status(503).json({
        error:
          'Serviço temporariamente sobrecarregado. Tente novamente em instantes.',
      })
    }

    try {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `inline; filename=certificado-${id}.pdf`,
      )

      await pdfService.streamCertificadoPdf(certificado, res, {
        requestId: req.requestId,
      })
    } finally {
      releasePdfSlot()
    }
  } catch (err) {
    logger.error('pdf.stream.request_failed', {
      requestId: req.requestId,
      certificadoId: id,
      error: err,
    })

    if (res.headersSent || res.writableEnded || res.destroyed) {
      if (!res.destroyed && !res.writableEnded) {
        res.destroy(err)
      }
      return
    }
    res.removeHeader('Content-Disposition')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(500).json({ error: 'Erro ao gerar PDF' })
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
      where: {
        participante_id: participante.id,
        status: STATUS_PUBLICO_CERTIFICADO,
      },
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
    const certificado = await Certificado.findOne({
      where: {
        codigo,
        status: STATUS_PUBLICO_CERTIFICADO,
      },
    })
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
