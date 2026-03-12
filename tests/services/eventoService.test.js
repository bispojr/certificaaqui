const eventoService = require('../../src/services/eventoService');
const { Evento } = require('../../models');

jest.mock('../../models', () => ({
  Evento: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  }
}));

describe('eventoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll chama Evento.findAll', async () => {
    await eventoService.findAll();
    expect(Evento.findAll).toHaveBeenCalled();
  });

  it('findById chama Evento.findByPk', async () => {
    await eventoService.findById(1);
    expect(Evento.findByPk).toHaveBeenCalledWith(1);
  });

  it('create chama Evento.create', async () => {
    const data = { nome: 'Evento Teste' };
    await eventoService.create(data);
    expect(Evento.create).toHaveBeenCalledWith(data);
  });

  it('update retorna null se não encontrar', async () => {
    Evento.findByPk.mockResolvedValue(null);
    const result = await eventoService.update(1, {});
    expect(result).toBeNull();
  });

  it('update chama update se encontrar', async () => {
    const mockEvento = { update: jest.fn() };
    Evento.findByPk.mockResolvedValue(mockEvento);
    await eventoService.update(1, { nome: 'Novo' });
    expect(mockEvento.update).toHaveBeenCalledWith({ nome: 'Novo' });
  });

  it('destroy retorna null se não encontrar', async () => {
    Evento.findByPk.mockResolvedValue(null);
    const result = await eventoService.destroy(1);
    expect(result).toBeNull();
  });

  it('destroy chama destroy se encontrar', async () => {
    const mockEvento = { destroy: jest.fn() };
    Evento.findByPk.mockResolvedValue(mockEvento);
    await eventoService.destroy(1);
    expect(mockEvento.destroy).toHaveBeenCalled();
  });

  it('restore retorna null se não encontrar', async () => {
    Evento.findByPk.mockResolvedValue(null);
    const result = await eventoService.restore(1);
    expect(result).toBeNull();
  });

  it('restore chama restore se encontrar', async () => {
    const mockEvento = { restore: jest.fn() };
    Evento.findByPk.mockResolvedValue(mockEvento);
    await eventoService.restore(1);
    expect(mockEvento.restore).toHaveBeenCalled();
  });
});