const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const auth = require('../middlewares/auth')
const validate = require('../middlewares/validate')
const usuarioSchema = require('../validators/usuario')

// Rotas protegidas por papel e id — apenas admin pode gerenciar usuários
// Exemplo: POST /admin/42/usuarios
router.post(
  '/:papel/:id/usuarios',
  auth,
  validate(usuarioSchema),
  usuarioController.create,
)
// Exemplo: PUT /admin/42/usuarios/7/eventos
router.put(
  '/:papel/:id/usuarios/:usuarioId/eventos',
  auth,
  validate(usuarioSchema.pick({ eventos: true })),
  usuarioController.updateEventos,
)

module.exports = router
