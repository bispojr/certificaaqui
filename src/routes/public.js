const express = require('express')
const router = express.Router()
const { Certificado, Participante, Evento } = require('../models')

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
      include: [{ model: Participante }, { model: Evento }],
    })
    if (!certificado) {
      return res.render('certificados/validar-resultado', { valido: false })
    }
    // Log para depuração do objeto certificado e seus relacionamentos
    console.log('DEBUG certificado:', JSON.stringify(certificado, null, 2))
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

router.get('/pagina/validar', (req, res) => {
  res.render('certificados/form-validar')
})


// POST /public/pagina/validar - REMOVIDO

module.exports = router
