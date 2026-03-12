const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

router.post('/', eventoController.create);
router.get('/', eventoController.findAll);
router.get('/:id', eventoController.findById);
router.put('/:id', eventoController.update);
router.delete('/:id', eventoController.delete);
router.post('/:id/restore', eventoController.restore);

module.exports = router;
