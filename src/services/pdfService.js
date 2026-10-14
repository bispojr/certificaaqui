const PDFDocument = require('pdfkit')
const templateService = require('./templateService')

module.exports = {
  /**
   * Transmite o PDF de um certificado diretamente para um stream gravável.
   * @param {Object} certificado - Certificado com associações já carregadas (TiposCertificados/TiposCertificado, Participante, Evento)
   * @param {import('stream').Writable} writableStream - Stream de destino para o PDF (ex: res do Express ou PassThrough)
   * @returns {Promise<void>} Resolve quando a geração e transmissão forem concluídas com sucesso
   */
  async streamCertificadoPdf(certificado, writableStream) {
    if (!writableStream || typeof writableStream.write !== 'function') {
      throw new Error('Writable stream inválido ou não fornecido')
    }

    // Log para depuração
    console.log('Gerando certificado:', {
      id: certificado?.id,
      codigo: certificado?.codigo,
      nome: certificado?.nome,
    })
    if (!certificado || !certificado.codigo) {
      throw new Error('Código de validação obrigatório')
    }

    // Corrige para aceitar tanto TiposCertificados (plural) quanto TiposCertificado (singular)
    const tipo = certificado.TiposCertificado || certificado.TiposCertificados
    if (!tipo || !tipo.texto_base) {
      throw new Error('Tipo de certificado inválido ou sem texto_base')
    }

    // Dados principais
    const evento = certificado.Evento
    const participante = certificado.Participante

    let texto
    try {
      // Monta objeto de interpolação priorizando nome do certificado/participante
      const valores = {
        ...certificado.valores_dinamicos,
        nome: certificado.nome || participante?.nomeCompleto,
        evento: evento?.nome,
        // Adicione outros campos se necessário
      }
      texto = templateService
        .interpolate(tipo.texto_base, valores, valores.nome)
        .trim()
    } catch (err) {
      throw new Error(err.message || 'Erro de interpolação')
    }

    // Lazy require para evitar dependência circular
    const r2Service = require('./r2Service')

    // --- Buscar imagem de fundo do R2 ---
    const backgroundKey = evento?.url_template_base || 'template/padrao.jpg'
    let bgBuffer = null
    try {
      const bgResult = await r2Service.getFile(backgroundKey)
      if (bgResult && bgResult.Body) {
        bgBuffer = bgResult.Body
      }
    } catch (err) {
      console.warn('Não foi possível carregar o background do R2:', err.message)
    }

    // --- Buscar fonte Lato-Medium do R2 ---
    let fontBuffer = null
    try {
      const fontResult = await r2Service.getFile('fontes/Lato-Medium.ttf')
      if (fontResult && fontResult.Body) {
        fontBuffer = fontResult.Body
      }
    } catch (err) {
      console.warn(
        'Não foi possível carregar a fonte do R2, usando fonte padrão:',
        err.message,
      )
    }

    if (writableStream.destroyed || writableStream.writableEnded) {
      throw new Error('Stream encerrado antes do início da geração do PDF')
    }

    return new Promise((resolve, reject) => {
      let isSettled = false

      // Layout: paisagem, tamanho A4 (em pontos)
      const doc = new PDFDocument({
        layout: 'landscape',
        size: [594.96, 841.92], // A4 landscape em pontos
      })
      doc.page.margins.bottom = 0

      const cleanup = () => {
        writableStream.removeListener('finish', onFinish)
        writableStream.removeListener('close', onClose)
        writableStream.removeListener('error', onError)
        doc.removeListener('error', onError)
      }

      const onFinish = () => {
        if (isSettled) return
        isSettled = true
        cleanup()
        resolve()
      }

      const onError = (err) => {
        if (isSettled) return
        isSettled = true
        cleanup()
        if (!doc.destroyed) {
          doc.destroy()
        }
        reject(err)
      }

      const onClose = () => {
        if (isSettled) return
        isSettled = true
        cleanup()
        if (!doc.destroyed) {
          doc.destroy()
        }
        reject(new Error('Stream fechado prematuramente'))
      }

      writableStream.once('finish', onFinish)
      writableStream.once('close', onClose)
      writableStream.once('error', onError)
      doc.once('error', onError)

      try {
        doc.pipe(writableStream)

        // Inserir imagem de fundo se disponível
        if (bgBuffer) {
          doc.image(bgBuffer, 0, 0, {
            width: doc.page.width,
            height: doc.page.height,
          })
        }

        const setFont = () => {
          if (fontBuffer) {
            doc.font(fontBuffer)
          } else {
            doc.font('Helvetica')
          }
        }

        // Layout detalhado inspirado no obterArquivo

        // Coordenadas do texto-base (configuráveis por evento)
        const textoX = evento?.texto_x ?? 270
        const textoY = evento?.texto_y ?? 200

        // Tamanho da fonte configurável por evento com fallback dinâmico
        const tamanhoFonte =
          evento?.texto_tamanho_fonte && evento.texto_tamanho_fonte > 0
            ? evento.texto_tamanho_fonte
            : texto.length > 400
              ? 10
              : 14

        // Texto base interpolado
        doc.fontSize(tamanhoFonte)
        setFont()
        doc.text(texto, textoX, textoY, { width: 480, align: 'justify' })

        // Coordenadas e rotação da validação (configuráveis por evento)
        const validacaoX = evento?.validacao_x ?? 145
        const validacaoY = evento?.validacao_y ?? 545
        const validacaoRotacao = evento?.validacao_rotacao ?? 0

        doc.save()
        doc.rotate(validacaoRotacao, { origin: [validacaoX, validacaoY] })

        // Código de validação e link
        const endereco_validacao =
          process.env.ENDERECO_VALIDACAO || 'https://certificaaqui.com/validar'
        doc.fontSize(9.5)
        setFont()
        doc
          .fillColor('black')
          .text(
            `Use o código ${certificado.codigo} para validar o certificado em: `,
            validacaoX,
            validacaoY,
            { continued: true, align: 'left' },
          )
        doc.fillColor('blue').text(`${endereco_validacao}`, {
          link: endereco_validacao,
          underline: true,
          continued: false,
        })
        doc.fillColor('black')

        doc.restore()

        doc.end()
      } catch (err) {
        onError(err)
      }
    })
  },
}
