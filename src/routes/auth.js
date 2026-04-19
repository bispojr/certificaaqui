const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')
const authSSR = require('../middlewares/authSSR')

const JWT_SECRET = process.env.JWT_SECRET

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Exibe formulário de login SSR
 *     tags: [SSR - Auth]
 *     responses:
 *       200:
 *         description: Página HTML com formulário de login
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     summary: Processa login SSR e redireciona
 *     tags: [SSR - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirect para /admin/dashboard (sucesso) ou /auth/login (falha)
 */
// GET /auth/login
router.get('/login', authSSR, (req, res) => {
  if (req.usuario) return res.redirect(`/${req.usuario.perfil}/${req.usuario.id}`)
  res.render('auth/login', { title: 'Login', layout: 'layout' })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario) {
      req.flash('error', 'Credenciais inválidas')
      return res.redirect('/auth/login')
    }
    const valid = await bcrypt.compare(senha, usuario.senha)
    if (!valid) {
      req.flash('error', 'Credenciais inválidas')
      return res.redirect('/auth/login')
    }
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
    return res.redirect(`/${usuario.perfil}/${usuario.id}`)
  } catch {
    req.flash('error', 'Erro interno. Tente novamente.')
    return res.redirect('/auth/login')
  }
})

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Encerra sessão SSR e redireciona para login
 *     tags: [SSR - Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       302:
 *         description: Redirect para /auth/login
 */
// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  return res.redirect('/auth/login')
})

module.exports = router
