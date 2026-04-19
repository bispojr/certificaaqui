
var express = require('express')
var router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const authSSR = require('../middlewares/authSSR')

// Página inicial pública
router.get('/', function (req, res) {
  res.render('index', { layout: false })
})

// Dashboard padronizado por papel e id (restringe papel e id para evitar capturar rotas de outros módulos)
router.get('/:papel(admin|gestor|monitor)/:id(\\d+)', authSSR, dashboardController.dashboard)

module.exports = router
