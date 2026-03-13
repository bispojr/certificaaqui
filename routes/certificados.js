const express = require('express');
const router = express.Router();
const certificadoController = require('../src/controllers/certificadoController');

router.post('/', certificadoController.create);
router.get('/', certificadoController.findAll);
router.get('/:id', certificadoController.findById);
router.put('/:id', certificadoController.update);
router.delete('/:id', certificadoController.delete);
router.post('/:id/restore', certificadoController.restore);
router.post('/:id/cancel', certificadoController.cancel);

module.exports = router;
