const express = require('express')
const router = express.Router()
const participanteController = require('../controllers/participanteController')
const auth = require('../middlewares/auth')
const rbac = require('../middlewares/rbac')
const validate = require('../middlewares/validate')
const participanteSchema = require('../validators/participante')

/**
 * @swagger
 * tags:
 *   name: Participantes
 *   description: Gerenciamento de participantes
 */

/**
 * @swagger
 * /participantes:
 *   post:
 *     summary: Cria um novo participante
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Participante'
 *     responses:
 *       201:
 *         description: Participante criado com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /participantes:
 *   get:
 *     summary: Lista todos os participantes
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de participantes
 */

/**
 * @swagger
 * /participantes/{id}:
 *   get:
 *     summary: Busca participante por ID
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Participante encontrado
 *       404:
 *         description: Participante não encontrado
 */

/**
 * @swagger
 * /participantes/{id}:
 *   put:
 *     summary: Atualiza um participante
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/Participante'
 *     responses:
 *       200:
 *         description: Participante atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Participante não encontrado
 */

/**
 * @swagger
 * /participantes/{id}:
 *   delete:
 *     summary: Deleta um participante
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Participante deletado
 *       404:
 *         description: Participante não encontrado
 */

/**
 * @swagger
 * /participantes/{id}/restore:
 *   post:
 *     summary: Restaura um participante deletado
 *     tags: [Participantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Participante restaurado
 *       404:
 *         description: Participante não encontrado
 */

const authorizeUser = require('../middlewares/authorizeUser')

// Novo padrão: /:papel/:id/participantes
router.post(
  '/:papel/:id/participantes',
  auth,
  authorizeUser,
  rbac('monitor'),
  validate(participanteSchema),
  participanteController.create,
)
router.get(
  '/:papel/:id/participantes',
  auth,
  authorizeUser,
  rbac('monitor'),
  participanteController.findAll,
)
router.get(
  '/:papel/:id/participantes/:participanteId',
  auth,
  authorizeUser,
  rbac('monitor'),
  participanteController.findById,
)
router.put(
  '/:papel/:id/participantes/:participanteId',
  auth,
  authorizeUser,
  rbac('monitor'),
  validate(participanteSchema.partial()),
  participanteController.update,
)
router.delete(
  '/:papel/:id/participantes/:participanteId',
  auth,
  authorizeUser,
  rbac('monitor'),
  participanteController.delete,
)
router.post(
  '/:papel/:id/participantes/:participanteId/restore',
  auth,
  authorizeUser,
  rbac('monitor'),
  participanteController.restore,
)

module.exports = router
