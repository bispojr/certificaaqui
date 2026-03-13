const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const auth = require('../../middleware/auth');

router.post('/login', usuarioController.login);
router.post('/logout', usuarioController.logout);
router.get('/me', auth, usuarioController.me);

module.exports = router;
