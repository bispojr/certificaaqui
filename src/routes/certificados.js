
const express = require('express')
const router = express.Router()
const certificadoController = require('../controllers/certificadoController')
const auth = require('../../middleware/auth')
const rbac = require('../middlewares/rbac')
const scopedEvento = require('../middlewares/scopedEvento')
const validate = require('../../middleware/validate')
const certificadoSchema = require('../validators/certificado')

/**
 * @swagger
 * tags:
 *   name: Certificados
 *   description: Gerenciamento de certificados
 */

/**
 * @swagger
 * /certificados:
 *   post:
 *     summary: Emite um novo certificado
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Certificado'
 *     responses:
 *       201:
 *         description: Certificado emitido com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /certificados:
 *   get:
 *     summary: Lista todos os certificados
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de certificados
 */

/**
 * @swagger
 * /certificados/{id}:
 *   get:
 *     summary: Busca certificado por ID
 *     tags: [Certificados]
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
 *         description: Certificado encontrado
 *       404:
 *         description: Certificado não encontrado
 */

/**
 * @swagger
 * /certificados/{id}:
 *   put:
 *     summary: Atualiza um certificado
 *     tags: [Certificados]
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
 *             $ref: '#/components/schemas/Certificado'
 *     responses:
 *       200:
 *         description: Certificado atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Certificado não encontrado
 */

/**
 * @swagger
 * /certificados/{id}:
 *   delete:
 *     summary: Deleta um certificado
 *     tags: [Certificados]
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
 *         description: Certificado deletado
 *       404:
 *         description: Certificado não encontrado
 */

/**
 * @swagger
 * /certificados/{id}/restore:
 *   post:
 *     summary: Restaura um certificado deletado
 *     tags: [Certificados]
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
 *         description: Certificado restaurado
 *       404:
 *         description: Certificado não encontrado
 */

/**
 * @swagger
 * /certificados/{id}/cancel:
 *   post:
 *     summary: Cancela um certificado
 *     tags: [Certificados]
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
 *         description: Certificado cancelado
 *       404:
 *         description: Certificado não encontrado
 */

router.post(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  validate(certificadoSchema),
  certificadoController.create,
)
router.get(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  certificadoController.findAll,
)
router.get(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  certificadoController.findById,
)
router.put(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  validate(certificadoSchema.partial()),
  certificadoController.update,
)
router.delete(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  certificadoController.delete,
)
router.post(
  '/:id/restore',
  auth,
  rbac('monitor'),
  scopedEvento,
  certificadoController.restore,
)
router.post(
  '/:id/cancel',
  auth,
  rbac('monitor'),
  scopedEvento,
  certificadoController.cancel,
)

module.exports = router
