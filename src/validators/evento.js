const { z } = require('zod')

const eventoSchema = z.object({
  nome: z.string().min(3),
  ano: z.number().int().gte(2000),
  codigo_base: z.string().regex(/^[A-Za-z]{3}$/),
  url_template_base: z.string().url().optional().nullable(),
  validacao_rotacao: z.number().int().optional().default(0),
  texto_tamanho_fonte: z.number().int().optional().nullable(),
  template_certificado: z
    .enum(['padrao', 'nome-destaque'])
    .optional()
    .default('padrao'),
})

module.exports = eventoSchema
