const express = require('express');
const router = express.Router();
const participanteController = require('../controllers/participanteController');
const auth = require('../../middleware/auth');
const rbac = require('../middlewares/rbac');
const scopedEvento = require('../middlewares/scopedEvento');

router.post('/', auth, rbac('monitor'), participanteController.create);
router.get('/', auth, rbac('monitor'), participanteController.findAll);
router.get('/:id', auth, rbac('monitor'), participanteController.findById);
router.put('/:id', auth, rbac('monitor'), participanteController.update);
router.delete('/:id', auth, rbac('monitor'), participanteController.delete);
router.post('/:id/restore', auth, rbac('monitor'), participanteController.restore);

module.exports = router;
