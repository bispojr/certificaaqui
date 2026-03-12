const certificadoService = require('../../src/services/certificadoService');
const { Certificado } = require('../../models');

jest.mock('../../models', () => ({
  Certificado: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  }
}));

describe('certificadoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll chama Certificado.findAll', async () => {
    await certificadoService.findAll();
    expect(Certificado.findAll).toHaveBeenCalled();
  });

  it('findById chama Certificado.findByPk', async () => {
    await certificadoService.findById(1);
    expect(Certificado.findByPk).toHaveBeenCalledWith(1);
  });

  it('create chama Certificado.create', async () => {
    const data = { nome: 'Certificado Teste' };
    await certificadoService.create(data);
    expect(Certificado.create).toHaveBeenCalledWith(data);
  });

  it('update retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null);
    const result = await certificadoService.update(1, {});
    expect(result).toBeNull();
  });

  it('update chama update se encontrar', async () => {
    const mockCertificado = { update: jest.fn() };
    Certificado.findByPk.mockResolvedValue(mockCertificado);
    await certificadoService.update(1, { nome: 'Novo' });
    expect(mockCertificado.update).toHaveBeenCalledWith({ nome: 'Novo' });
  });

  it('destroy retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null);
    const result = await certificadoService.destroy(1);
    expect(result).toBeNull();
  });

  it('destroy chama destroy se encontrar', async () => {
    const mockCertificado = { destroy: jest.fn() };
    Certificado.findByPk.mockResolvedValue(mockCertificado);
    await certificadoService.destroy(1);
    expect(mockCertificado.destroy).toHaveBeenCalled();
  });

  it('restore retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null);
    const result = await certificadoService.restore(1);
    expect(result).toBeNull();
  });

  it('restore chama restore se encontrar', async () => {
    const mockCertificado = { restore: jest.fn() };
    Certificado.findByPk.mockResolvedValue(mockCertificado);
    await certificadoService.restore(1);
    expect(mockCertificado.restore).toHaveBeenCalled();
  });
});