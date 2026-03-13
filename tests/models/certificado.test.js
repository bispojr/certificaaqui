const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../../src/models')

describe('Certificado Model', () => {
  let participante, evento, tipoCertificado
  beforeEach(async () => {
    await Certificado.destroy({ where: {}, force: true })
    await Participante.destroy({ where: {}, force: true })
    await Evento.destroy({ where: {}, force: true })
    await TiposCertificados.destroy({ where: {}, force: true })
    participante = await Participante.create({
      nomeCompleto: 'João Silva',
      email: 'joao_certificado@email.com',
      instituicao: 'Universidade Federal',
    })
    evento = await Evento.create({
      nome: 'EduComp 2026',
      codigo_base: 'EDU',
      ano: 2026,
    })
    tipoCertificado = await TiposCertificados.create({
      codigo: 'PA',
      descricao: 'Palestra',
      campo_destaque: 'tema',
      texto_base:
        'Certificamos que ${nome_completo} participou como ${funcao} na palestra.',
      dados_dinamicos: { tema: '', palestrante: '', duracao: '' },
    })
  })

  test('deve criar certificado com dados válidos', async () => {
    const certificadoData = {
      nome: 'Certificado de Minicurso',
      status: 'emitido',
      valores_dinamicos: { instrutor: 'Maria Souza', vagas: 30 },
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipoCertificado.id,
    }
    const certificado = await Certificado.create(certificadoData)
    expect(certificado).toBeDefined()
    expect(certificado.id).toBeDefined()
    expect(certificado.nome).toBe(certificadoData.nome)
    expect(certificado.status).toBe('emitido')
    expect(certificado.valores_dinamicos).toEqual(
      certificadoData.valores_dinamicos,
    )
    expect(certificado.participante_id).toBe(certificadoData.participante_id)
    expect(certificado.created_at).toBeDefined()
    expect(certificado.updated_at).toBeDefined()
  })

  test('não deve criar certificado sem nome', async () => {
    await expect(
      Certificado.create({
        status: 'emitido',
        participante_id: participante.id,
        evento_id: evento.id,
        tipo_certificado_id: tipoCertificado.id,
      }),
    ).rejects.toThrow()
  })

  test('não deve criar certificado com status inválido', async () => {
    await expect(
      Certificado.create({
        nome: 'Certificado de Oficina',
        status: 'invalido',
        participante_id: participante.id,
        evento_id: evento.id,
        tipo_certificado_id: tipoCertificado.id,
      }),
    ).rejects.toThrow()
  })

  test('soft delete deve funcionar', async () => {
    const certificado = await Certificado.create({
      nome: 'Certificado de Palestra',
      status: 'emitido',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipoCertificado.id,
    })
    await certificado.destroy()
    const encontrado = await Certificado.findByPk(certificado.id)
    expect(encontrado).toBeNull()
    const comDeletados = await Certificado.findByPk(certificado.id, {
      paranoid: false,
    })
    expect(comDeletados).toBeDefined()
    expect(comDeletados.deleted_at).not.toBeNull()
  })

  test('deve permitir restaurar certificado deletado', async () => {
    const certificado = await Certificado.create({
      nome: 'Certificado de Arduino',
      status: 'emitido',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipoCertificado.id,
    })
    await certificado.destroy()
    await certificado.restore()
    const restaurado = await Certificado.findByPk(certificado.id)
    expect(restaurado).toBeDefined()
    expect(restaurado.deleted_at).toBeNull()
  })
})
