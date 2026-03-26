const express = require('express')
const router = express.Router()
const tiposCertificadosController = require('../controllers/tiposCertificadosController')
const auth = require('../middlewares/auth')
const rbac = require('../middlewares/rbac')
const scopedEvento = require('../middlewares/scopedEvento')

/**
 * @swagger
 * tags:
 *   name: TiposCertificados
 *   description: Gerenciamento de tipos de certificados
 */

/**
 * @swagger
 * /tipos-certificados:
 *   post:
 *     summary: Cria um novo tipo de certificado
 *     tags: [TiposCertificados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TipoCertificado'
 *     responses:
 *       201:
 *         description: Tipo de certificado criado com sucesso
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /tipos-certificados:
 *   get:
 *     summary: Lista todos os tipos de certificados
 *     tags: [TiposCertificados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de certificados
 */

/**
 * @swagger
 * /tipos-certificados/{id}:
 *   get:
 *     summary: Busca tipo de certificado por ID
 *     tags: [TiposCertificados]
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
 *         description: Tipo de certificado encontrado
 *       404:
 *         description: Tipo de certificado não encontrado
 */

/**
 * @swagger
 * /tipos-certificados/{id}:
 *   put:
 *     summary: Atualiza um tipo de certificado
 *     tags: [TiposCertificados]
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
 *             $ref: '#/components/schemas/TipoCertificado'
 *     responses:
 *       200:
 *         description: Tipo de certificado atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Tipo de certificado não encontrado
 */

/**
 * @swagger
 * /tipos-certificados/{id}:
 *   delete:
 *     summary: Deleta um tipo de certificado
 *     tags: [TiposCertificados]
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
 *         description: Tipo de certificado deletado
 *       404:
 *         description: Tipo de certificado não encontrado
 */

/**
 * @swagger
 * /tipos-certificados/{id}/restore:
 *   post:
 *     summary: Restaura um tipo de certificado deletado
 *     tags: [TiposCertificados]
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
 *         description: Tipo de certificado restaurado
 *       404:
 *         description: Tipo de certificado não encontrado
 */

router.post(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.create,
)
router.get(
  '/',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.findAll,
)
router.get(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.findById,
)
router.put(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.update,
)
router.delete(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.delete,
)
router.post(
  '/:id/restore',
  auth,
  rbac('monitor'),
  scopedEvento,
  tiposCertificadosController.restore,
)

module.exports = router
