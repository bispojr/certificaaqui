const express = require('express')
const router = express.Router()
const eventoController = require('../controllers/eventoController')
const auth = require('../middlewares/auth')
const rbac = require('../middlewares/rbac')
const scopedEvento = require('../middlewares/scopedEvento')
const authorizeUser = require('../middlewares/authorizeUser')
const validate = require('../middlewares/validate')
const eventoSchema = require('../validators/evento')

/**
 * @swagger
 * tags:
 *   name: Eventos
 *   description: Gerenciamento de eventos
 */

/**
 * @swagger
 * /eventos:
 *   post:
 *     summary: Cria um novo evento
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Evento'
 *     responses:
 *       201:
 *         description: Evento criado com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /eventos:
 *   get:
 *     summary: Lista todos os eventos
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos
 */

/**
 * @swagger
 * /eventos/{id}:
 *   get:
 *     summary: Busca evento por ID
 *     tags: [Eventos]
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
 *         description: Evento encontrado
 *       404:
 *         description: Evento não encontrado
 */

/**
 * @swagger
 * /eventos/{id}:
 *   put:
 *     summary: Atualiza um evento
 *     tags: [Eventos]
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
 *             $ref: '#/components/schemas/Evento'
 *     responses:
 *       200:
 *         description: Evento atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Evento não encontrado
 */

/**
 * @swagger
 * /eventos/{id}:
 *   delete:
 *     summary: Deleta um evento
 *     tags: [Eventos]
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
 *         description: Evento deletado
 *       404:
 *         description: Evento não encontrado
 */

/**
 * @swagger
 * /eventos/{id}/restore:
 *   post:
 *     summary: Restaura um evento deletado
 *     tags: [Eventos]
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
 *         description: Evento restaurado
 *       404:
 *         description: Evento não encontrado
 */

// Novo padrão: /:papel/:id/eventos
router.post(
  '/:papel/:id/eventos',
  auth,
  authorizeUser,
  rbac('admin'),
  scopedEvento,
  validate(eventoSchema),
  eventoController.create,
)
router.get(
  '/:papel/:id/eventos',
  auth,
  authorizeUser,
  rbac('monitor'),
  scopedEvento,
  eventoController.findAll,
)
router.get(
  '/:papel/:id/eventos/:eventoId',
  auth,
  authorizeUser,
  rbac('monitor'),
  scopedEvento,
  eventoController.findById,
)
router.put(
  '/:papel/:id/eventos/:eventoId',
  auth,
  authorizeUser,
  rbac('monitor'),
  scopedEvento,
  validate(eventoSchema.partial()),
  eventoController.update,
)
router.delete(
  '/:papel/:id/eventos/:eventoId',
  auth,
  authorizeUser,
  rbac('monitor'),
  scopedEvento,
  eventoController.delete,
)
router.post(
  '/:papel/:id/eventos/:eventoId/restore',
  auth,
  authorizeUser,
  rbac('monitor'),
  scopedEvento,
  eventoController.restore,
)

module.exports = router
