describe('TASK-028-A: dependências connect-flash e express-session', () => {
  it('deve importar connect-flash e express-session sem erro', () => {
    expect(() => require('connect-flash')).not.toThrow()
    expect(() => require('express-session')).not.toThrow()
  })
})
