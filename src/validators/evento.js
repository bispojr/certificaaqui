const { z } = require('zod')

const eventoSchema = z.object({
  nome: z.string().min(3),
  ano: z.number().int().gte(2000),
  codigo_base: z.string().min(2),
})

module.exports = eventoSchema
