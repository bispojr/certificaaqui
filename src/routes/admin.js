const express = require('express')
const router = express.Router()
const authSSR = require('../middlewares/authSSR')
const rbac = require('../middlewares/rbac')
const eventoSSRController = require('../controllers/eventoSSRController')

const dashboardController = require('../controllers/dashboardController')

// Todas as rotas admin exigem sessão SSR válida
router.use(authSSR)

// Dashboard
router.get('/dashboard', dashboardController.dashboard)

// Gestão de eventos (somente admin)
router.get('/eventos', rbac('admin'), eventoSSRController.index)
router.get('/eventos/novo', rbac('admin'), eventoSSRController.novo)
router.get('/eventos/:id/editar', rbac('admin'), eventoSSRController.editar)
router.post('/eventos', rbac('admin'), eventoSSRController.criar)
router.post('/eventos/:id', rbac('admin'), eventoSSRController.atualizar)
router.post('/eventos/:id/deletar', rbac('admin'), eventoSSRController.deletar)
router.post(
  '/eventos/:id/restaurar',
  rbac('admin'),
  eventoSSRController.restaurar,
)

module.exports = router
