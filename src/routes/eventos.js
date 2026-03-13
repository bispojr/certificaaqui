const express = require('express')
const router = express.Router()
const eventoController = require('../controllers/eventoController')
const auth = require('../../middleware/auth')
const rbac = require('../middlewares/rbac')
const scopedEvento = require('../middlewares/scopedEvento')

router.post('/', auth, rbac('monitor'), scopedEvento, eventoController.create)
router.get('/', auth, rbac('monitor'), scopedEvento, eventoController.findAll)
router.get(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  eventoController.findById,
)
router.put('/:id', auth, rbac('monitor'), scopedEvento, eventoController.update)
router.delete(
  '/:id',
  auth,
  rbac('monitor'),
  scopedEvento,
  eventoController.delete,
)
router.post(
  '/:id/restore',
  auth,
  rbac('monitor'),
  scopedEvento,
  eventoController.restore,
)

module.exports = router
