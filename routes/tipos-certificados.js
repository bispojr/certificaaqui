const express = require('express');
const router = express.Router();
const tiposCertificadosController = require('../src/controllers/tiposCertificadosController');

router.post('/', tiposCertificadosController.create);
router.get('/', tiposCertificadosController.findAll);
router.get('/:id', tiposCertificadosController.findById);
router.put('/:id', tiposCertificadosController.update);
router.delete('/:id', tiposCertificadosController.delete);
router.post('/:id/restore', tiposCertificadosController.restore);

module.exports = router;
