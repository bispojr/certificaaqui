const { z } = require('zod')

const usuarioSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  perfil: z.enum(['admin', 'gestor', 'monitor']),
  evento_id: z.number().int().optional().nullable(),
})

module.exports = usuarioSchema
