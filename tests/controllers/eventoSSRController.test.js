const eventoSSRController = require('../../src/controllers/eventoSSRController')
const eventoService = require('../../src/services/eventoService')
const { Evento } = require('../../src/models')
const { Op } = require('sequelize')

jest.mock('../../src/services/eventoService')
jest.mock('../../src/models', () => ({
  Evento: {
    findAll: jest.fn(),
  },
}))

describe('eventoSSRController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('index renderiza eventos e arquivados', async () => {
    const req = { flash: jest.fn(), usuario: { perfil: 'admin' } }
    const res = { render: jest.fn(), redirect: jest.fn(), flash: jest.fn(), locals: {} }
    const eventos = [{ toJSON: () => ({ id: 1, nome: 'Ativo' }) }]
    const arquivados = [{ toJSON: () => ({ id: 2, nome: 'Arq' }) }]
    Evento.findAll
      .mockResolvedValueOnce(eventos)
      .mockResolvedValueOnce(arquivados)
    await eventoSSRController.index(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/eventos/index',
      expect.objectContaining({
        eventos: [{ id: 1, nome: 'Ativo' }],
        arquivados: [{ id: 2, nome: 'Arq' }],
      }),
    )
  })

  it('index redireciona em erro', async () => {
    const req = { flash: jest.fn(), usuario: { perfil: 'admin' } }
    const res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
      locals: {},
    }
    Evento.findAll.mockRejectedValueOnce(new Error('fail'))
    await eventoSSRController.index(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('novo renderiza form vazio', () => {
    const req = {}
    const res = { render: jest.fn() }
    eventoSSRController.novo(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/eventos/form',
      expect.objectContaining({
        title: 'Novo Evento',
        action: '/admin/eventos',
      }),
    )
  })

  it('editar renderiza form com evento', async () => {
    const req = { params: { id: 1 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    const evento = { toJSON: () => ({ id: 1, nome: 'Edit' }) }
    eventoService.findById.mockResolvedValue(evento)
    await eventoSSRController.editar(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/eventos/form',
      expect.objectContaining({ evento: { id: 1, nome: 'Edit' } }),
    )
  })

  it('editar redireciona se evento não encontrado', async () => {
    const req = { params: { id: 2 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.findById.mockResolvedValue(null)
    await eventoSSRController.editar(req, res)
    expect(req.flash).toHaveBeenCalledWith('error', 'Evento não encontrado.')
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('criar redireciona ao criar com sucesso', async () => {
    const req = { body: { nome: 'Novo' }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.create.mockResolvedValue({})
    await eventoSSRController.criar(req, res)
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Evento criado com sucesso.',
    )
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('criar renderiza form com erro', async () => {
    const req = { body: { nome: 'Novo' }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.create.mockRejectedValue(new Error('erro'))
    await eventoSSRController.criar(req, res)
    expect(req.flash).toHaveBeenCalledWith('error', 'erro')
    expect(res.render).toHaveBeenCalledWith(
      'admin/eventos/form',
      expect.objectContaining({ evento: { nome: 'Novo' } }),
    )
  })

  it('atualizar redireciona ao atualizar com sucesso', async () => {
    const req = { params: { id: 1 }, body: { nome: 'Edit' }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.update.mockResolvedValue({})
    await eventoSSRController.atualizar(req, res)
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Evento atualizado com sucesso.',
    )
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('atualizar redireciona com erro', async () => {
    const req = { params: { id: 1 }, body: { nome: 'Edit' }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.update.mockRejectedValue(new Error('erro'))
    await eventoSSRController.atualizar(req, res)
    expect(req.flash).toHaveBeenCalledWith('error', 'erro')
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos/1/editar')
  })

  it('deletar redireciona ao deletar com sucesso', async () => {
    const req = { params: { id: 1 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.delete.mockResolvedValue({})
    await eventoSSRController.deletar(req, res)
    expect(req.flash).toHaveBeenCalledWith('success', 'Evento removido.')
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('deletar redireciona com erro', async () => {
    const req = { params: { id: 1 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.delete.mockRejectedValue(new Error('erro'))
    await eventoSSRController.deletar(req, res)
    expect(req.flash).toHaveBeenCalledWith('error', 'erro')
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('restaurar redireciona ao restaurar com sucesso', async () => {
    const req = { params: { id: 1 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.restore.mockResolvedValue({})
    await eventoSSRController.restaurar(req, res)
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Evento restaurado com sucesso.',
    )
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })

  it('restaurar redireciona com erro', async () => {
    const req = { params: { id: 1 }, flash: jest.fn() }
    const res = { render: jest.fn(), redirect: jest.fn() }
    eventoService.restore.mockRejectedValue(new Error('erro'))
    await eventoSSRController.restaurar(req, res)
    expect(req.flash).toHaveBeenCalledWith('error', 'erro')
    expect(res.redirect).toHaveBeenCalledWith('/admin/eventos')
  })
})
