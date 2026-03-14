
const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const auth = require('../../middleware/auth')
const validate = require('../../middleware/validate')
const usuarioSchema = require('../validators/usuario')

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gerenciamento de usuários e autenticação
 */

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @swagger
 * /usuarios/logout:
 *   post:
 *     summary: Realiza logout do usuário
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Logout realizado
 */

/**
 * @swagger
 * /usuarios/me:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /usuarios/{id}/eventos:
 *   put:
 *     summary: Atualiza eventos associados ao usuário
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventos:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Eventos atualizados
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 */

router.post('/login', usuarioController.login)
router.post('/logout', usuarioController.logout)
router.get('/me', auth, usuarioController.me)
router.post('/', validate(usuarioSchema), usuarioController.create)
router.put('/:id/eventos', validate(usuarioSchema.pick({ eventos: true })), usuarioController.updateEventos)

module.exports = router
