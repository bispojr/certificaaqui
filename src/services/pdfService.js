const PDFDocument = require('pdfkit')
const templateService = require('./templateService')

module.exports = {
  /**
   * Gera o PDF de um certificado.
   * @param {Object} certificado - Certificado com associações já carregadas (TiposCertificados, Participante, Evento)
   * @returns {Promise<Buffer>} Buffer do PDF gerado
   */
  generateCertificadoPdf(certificado) {
    return new Promise((resolve, reject) => {
      try {
        // Log para depuração
        console.log('PDFService certificado:', certificado)
        if (!certificado.codigo) {
          return reject(new Error('Código de validação obrigatório'))
        }
        const doc = new PDFDocument()
        const buffers = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          resolve(Buffer.concat(buffers))
        })

        // Dados principais
        const evento = certificado.Evento
        const participante = certificado.Participante
        // Corrige para aceitar tanto TiposCertificados (plural) quanto TiposCertificado (singular)
        const tipo =
          certificado.TiposCertificado || certificado.TiposCertificados
        if (!tipo || !tipo.texto_base) {
          return reject(
            new Error('Tipo de certificado inválido ou sem texto_base'),
          )
        }
        let texto
        try {
          texto = templateService.interpolate(tipo.texto_base, {
            ...participante?.dataValues,
            ...certificado?.dataValues,
            ...evento?.dataValues,
          })
        } catch (err) {
          return reject(new Error(err.message || 'Erro de interpolação'))
        }

        // Layout simples
        doc.fontSize(20).text(evento?.nome || 'Evento', { align: 'center' })
        doc.moveDown()
        doc.fontSize(14).text(texto, { align: 'left' })
        doc.moveDown()
        doc.fontSize(10).text(`Código de validação: ${certificado.codigo}`, {
          align: 'right',
        })

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  },
}
