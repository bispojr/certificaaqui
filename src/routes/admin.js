const express = require('express')
const router = express.Router()
const authSSR = require('../middlewares/authSSR')
const rbac = require('../middlewares/rbac')
const uploadTemplate = require('../middlewares/uploadTemplate')
const eventoSSRController = require('../controllers/eventoSSRController')
const participanteSSRController = require('../controllers/participanteSSRController')
const dashboardController = require('../controllers/dashboardController')
const tiposCertificadosSSRController = require('../controllers/tiposCertificadosSSRController')
const usuarioSSRController = require('../controllers/usuarioSSRController')
const certificadoSSRController = require('../controllers/certificadoSSRController')

// Todas as rotas admin exigem sessão SSR válida
router.use(authSSR)

// Tipos de Certificados (após autenticação SSR)
router.get(
  '/tipos-certificados',
  rbac('gestor'),
  tiposCertificadosSSRController.index,
)
router.get(
  '/tipos-certificados/novo',
  rbac('gestor'),
  tiposCertificadosSSRController.novo,
)
router.post(
  '/tipos-certificados',
  rbac('gestor'),
  tiposCertificadosSSRController.criar,
)
router.get(
  '/tipos-certificados/:id/editar',
  rbac('gestor'),
  tiposCertificadosSSRController.editar,
)
router.post(
  '/tipos-certificados/:id',
  rbac('gestor'),
  tiposCertificadosSSRController.atualizar,
)
router.post(
  '/tipos-certificados/:id/deletar',
  rbac('gestor'),
  tiposCertificadosSSRController.deletar,
)
router.post(
  '/tipos-certificados/:id/restaurar',
  rbac('gestor'),
  tiposCertificadosSSRController.restaurar,
)

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Painel administrativo principal
 *     tags: [SSR - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Página HTML do dashboard
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect para /auth/login se não autenticado
 */
// Dashboard
router.get('/dashboard', dashboardController.dashboard)

// Gestão de eventos (somente admin)
router.get('/eventos', rbac('gestor'), eventoSSRController.index)
router.get('/eventos/novo', rbac('admin'), eventoSSRController.novo)
router.get('/eventos/:id/editar', rbac('admin'), eventoSSRController.editar)
router.post(
  '/eventos',
  rbac('admin'),
  uploadTemplate,
  eventoSSRController.criar,
)
router.post(
  '/eventos/:id',
  rbac('admin'),
  uploadTemplate,
  eventoSSRController.atualizar,
)
router.post('/eventos/:id/deletar', rbac('admin'), eventoSSRController.deletar)
router.post(
  '/eventos/:id/restaurar',
  rbac('admin'),
  eventoSSRController.restaurar,
)

// Gestão de participantes (todos os perfis autenticados)
router.get('/participantes', participanteSSRController.index)
router.get('/participantes/novo', participanteSSRController.novo)
router.get('/participantes/:id/editar', participanteSSRController.editar)
router.post('/participantes', participanteSSRController.criar)
router.post('/participantes/:id', participanteSSRController.atualizar)
router.post('/participantes/:id/deletar', participanteSSRController.deletar)
router.post('/participantes/:id/restaurar', participanteSSRController.restaurar)

// Usuários (apenas admin)
router.get('/usuarios', rbac('admin'), usuarioSSRController.index)
router.get('/usuarios/novo', rbac('admin'), usuarioSSRController.novo)
router.post('/usuarios', rbac('admin'), usuarioSSRController.criar)
router.get('/usuarios/:id/editar', rbac('admin'), usuarioSSRController.editar)
router.post('/usuarios/:id', rbac('admin'), usuarioSSRController.atualizar)
router.post(
  '/usuarios/:id/deletar',
  rbac('admin'),
  usuarioSSRController.deletar,
)
router.post(
  '/usuarios/:id/restaurar',
  rbac('admin'),
  usuarioSSRController.restaurar,
)

/**
 * @swagger
 * /admin/certificados:
 *   get:
 *     summary: Listagem SSR de certificados
 *     tags: [SSR - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Página HTML com lista de certificados
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect para /auth/login se não autenticado
 */
// Certificados
router.get('/certificados', rbac('monitor'), certificadoSSRController.index)
router.get('/certificados/novo', rbac('gestor'), certificadoSSRController.novo)
router.post('/certificados', rbac('gestor'), certificadoSSRController.criar)
router.get(
  '/certificados/:id',
  rbac('monitor'),
  certificadoSSRController.detalhe,
)
router.get(
  '/certificados/:id/editar',
  rbac('gestor'),
  certificadoSSRController.editar,
)
router.post(
  '/certificados/:id',
  rbac('gestor'),
  certificadoSSRController.atualizar,
)
router.post(
  '/certificados/:id/cancelar',
  rbac('gestor'),
  certificadoSSRController.cancelar,
)
router.post(
  '/certificados/:id/deletar',
  rbac('gestor'),
  certificadoSSRController.deletar,
)
router.post(
  '/certificados/:id/restaurar',
  rbac('admin'),
  certificadoSSRController.restaurar,
)

module.exports = router
