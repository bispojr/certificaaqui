const express = require('express');
const router = express.Router();
const participanteController = require('../src/controllers/participanteController');

router.post('/', participanteController.create);
router.get('/', participanteController.findAll);
router.get('/:id', participanteController.findById);
router.put('/:id', participanteController.update);
router.delete('/:id', participanteController.delete);
router.post('/:id/restore', participanteController.restore);

module.exports = router;
