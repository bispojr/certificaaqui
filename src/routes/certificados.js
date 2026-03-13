const express = require('express');
const router = express.Router();
const certificadoController = require('../controllers/certificadoController');
const auth = require('../../middleware/auth');
const rbac = require('../middlewares/rbac');
const scopedEvento = require('../middlewares/scopedEvento');

router.post('/', auth, rbac('monitor'), scopedEvento, certificadoController.create);
router.get('/', auth, rbac('monitor'), scopedEvento, certificadoController.findAll);
router.get('/:id', auth, rbac('monitor'), scopedEvento, certificadoController.findById);
router.put('/:id', auth, rbac('monitor'), scopedEvento, certificadoController.update);
router.delete('/:id', auth, rbac('monitor'), scopedEvento, certificadoController.delete);
router.post('/:id/restore', auth, rbac('monitor'), scopedEvento, certificadoController.restore);
router.post('/:id/cancel', auth, rbac('monitor'), scopedEvento, certificadoController.cancel);

module.exports = router;
