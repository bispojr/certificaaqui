
const express = require('express')
const router = express.Router()
const db = require('../models')

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API e banco conectados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 db:
 *                   type: string
 *                 uptime:
 *                   type: integer
 *       503:
 *         description: Banco de dados indisponível
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 db:
 *                   type: string
 */

router.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate()
    res.json({ status: 'ok', db: 'connected', uptime: Math.floor(process.uptime()) })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

module.exports = router
