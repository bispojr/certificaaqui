const express = require('express')
const router = express.Router()
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../models')

// Aceita apenas letras (A-Z), números e hífens — protege contra SQL injection e entradas maliciosas
const CODIGO_CERTIFICADO_REGEX = /^[A-Z0-9-]{1,60}$/i

// ─── SSR: páginas públicas ────────────────────────────────────────────────────

// GET /obter
router.get('/obter', (req, res) => {
  res.render('certificados/form-obter')
})

// GET /validar
router.get('/validar', (req, res) => {
  res.render('certificados/form-validar')
})

// POST /obter
router.post('/obter', async (req, res) => {
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

// POST /validar
router.post('/validar', async (req, res) => {
  const codigo = req.body.codigo ? req.body.codigo.trim() : ''
  if (!codigo) {
    return res.render('certificados/form-validar', {
      mensagem: 'Informe o código do certificado.',
    })
  }
  try {
    const certificado = await Certificado.findOne({
      where: { codigo },
      include: [
        { model: Participante },
        { model: Evento },
        { model: TiposCertificados, as: 'TiposCertificados' },
      ],
    })
    if (!certificado) {
      return res.render('certificados/validar-resultado', { valido: false })
    }
    return res.render('certificados/validar-resultado', {
      valido: true,
      certificado:
        typeof certificado.toJSON === 'function'
          ? certificado.toJSON()
          : certificado,
    })
  } catch {
    return res.render('certificados/form-validar', {
      mensagem: 'Erro ao validar certificado. Tente novamente.',
    })
  }
})

// GET /validar/:codigo — valida certificado diretamente pela URL
router.get('/validar/:codigo', async (req, res) => {
  const codigo = req.params.codigo

  if (!CODIGO_CERTIFICADO_REGEX.test(codigo)) {
    return res.status(400).render('certificados/form-validar', {
      mensagem: 'Código inválido. Use apenas letras, números e hífens.',
    })
  }

  try {
    const certificado = await Certificado.findOne({
      where: { codigo },
      include: [
        { model: Participante },
        { model: Evento },
        { model: TiposCertificados, as: 'TiposCertificados' },
      ],
    })
    if (!certificado) {
      return res.render('certificados/validar-resultado', { valido: false })
    }
    return res.render('certificados/validar-resultado', {
      valido: true,
      certificado:
        typeof certificado.toJSON === 'function'
          ? certificado.toJSON()
          : certificado,
    })
  } catch {
    return res.render('certificados/form-validar', {
      mensagem: 'Erro ao validar certificado. Tente novamente.',
    })
  }
})

module.exports = router
