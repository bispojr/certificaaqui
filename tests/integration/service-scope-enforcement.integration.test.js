const certificadoService = require('../../src/services/certificadoService')

describe('service-scope-enforcement integration', () => {
  it('nega criação fora do escopo do gestor antes de persistir', async () => {
    await expect(
      certificadoService.create(
        {
          evento_id: 999,
          tipo_certificado_id: 1,
          participante_id: 1,
          nome: 'Teste',
          valores_dinamicos: {},
        },
        {
          principal: { role: 'gestor' },
          eventoIds: [1, 2],
        },
      ),
    ).rejects.toThrow('fora do escopo autorizado')
  })

  it('permite criação dentro do escopo do gestor', async () => {
    await expect(
      certificadoService.create(
        {
          evento_id: 2,
          tipo_certificado_id: 1,
          participante_id: 1,
          nome: 'Teste válido',
          valores_dinamicos: {},
        },
        {
          principal: { role: 'gestor' },
          eventoIds: [1, 2],
        },
      ),
    ).rejects.not.toThrow('fora do escopo autorizado')
  })
})
