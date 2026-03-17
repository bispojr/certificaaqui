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
        const tipo = certificado.TiposCertificados
        const texto = templateService.interpolate(tipo.texto_base, {
          ...participante?.dataValues,
          ...certificado?.dataValues,
          ...evento?.dataValues,
        })

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
