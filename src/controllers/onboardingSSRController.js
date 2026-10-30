const jwt = require('jsonwebtoken')
const { z } = require('zod')
const senhaForteSchema = require('../validators/senhaForte')
const onboardingService = require('../services/adminOnboardingService')

const JWT_SECRET = process.env.JWT_SECRET

const onboardingSchema = z.object({
  nome: z.string().trim().min(1, 'O nome é obrigatório.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
})

function redirectWithError(req, res, message) {
  req.flash('error', message)
  return res.redirect('/onboarding')
}

async function formulario(req, res) {
  if (await onboardingService.existsAdmin()) {
    return res.redirect('/login')
  }

  return res.render('auth/onboarding', {
    title: 'Onboarding inicial',
    layout: 'layout',
  })
}

async function criarPrimeiroAdmin(req, res) {
  if (await onboardingService.existsAdmin()) {
    return res.redirect('/login')
  }

  const nome = req.body.nome?.trim() || ''
  const email = req.body.email?.trim().toLowerCase() || ''
  const senha = req.body.senha || ''
  const confirmarSenha = req.body.confirmarSenha || ''

  const parsed = onboardingSchema.safeParse({ nome, email })
  if (!parsed.success) {
    parsed.error.errors
      .map((error) => error.message)
      .forEach((message) => req.flash('error', message))
    return res.redirect('/onboarding')
  }

  if (senha !== confirmarSenha) {
    return redirectWithError(req, res, 'A confirmação de senha não coincide.')
  }

  const strongPasswordResult = senhaForteSchema.safeParse(senha)
  if (!strongPasswordResult.success) {
    strongPasswordResult.error.errors
      .map((error) => error.message)
      .forEach((message) => req.flash('error', message))
    return res.redirect('/onboarding')
  }

  const result = await onboardingService.createFirstAdmin({
    nome,
    email,
    senha,
  })

  if (!result.created) {
    if (result.reason === 'admin_exists') {
      return res.redirect('/login')
    }
    return redirectWithError(req, res, 'Já existe um usuário com este e-mail.')
  }

  const token = jwt.sign(
    { id: result.usuario.id, perfil: result.usuario.perfil },
    JWT_SECRET,
    { expiresIn: '1h' },
  )

  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
  req.flash('success', 'Administrador inicial criado com sucesso.')
  return res.redirect('/admin/dashboard')
}

module.exports = {
  formulario,
  criarPrimeiroAdmin,
}
