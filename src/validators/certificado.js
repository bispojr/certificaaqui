const { z } = require('zod')

const certificadoSchema = z.object({
  nome: z.string().min(3),
  status: z.enum(['emitido', 'pendente', 'cancelado']),
  participante_id: z.number().int(),
  evento_id: z.number().int(),
  tipo_certificado_id: z.number().int(),
})

module.exports = certificadoSchema
