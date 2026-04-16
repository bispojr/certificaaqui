const { z } = require('zod')

const eventoSchema = z.object({
  nome: z.string().min(3),
  ano: z.number().int().gte(2000),
  codigo_base: z.string().regex(/^[A-Za-z]{3}$/),
  url_template_base: z.string().url().optional().nullable(),
})

module.exports = eventoSchema
