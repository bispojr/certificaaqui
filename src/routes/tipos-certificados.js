const express = require('express')
const router = express.Router()
const tiposCertificadosController = require('../controllers/tiposCertificadosController')
const auth = require('../../middleware/auth')
const rbac = require('../middlewares/rbac')
const scopedEvento = require('../middlewares/scopedEvento')

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
