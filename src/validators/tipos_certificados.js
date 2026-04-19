const { z } = require('zod')

const tiposCertificadosSchema = z.object({
  evento_id: z.number().int().positive(),
  codigo: z.string().regex(/^[A-Za-z]{2}$/),
  descricao: z.string().min(1),
  campo_destaque: z.string().min(1),
  texto_base: z.string().min(1),
  dados_dinamicos: z.record(z.any()).optional(),
})

module.exports = tiposCertificadosSchema
