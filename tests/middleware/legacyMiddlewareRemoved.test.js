const fs = require('fs')
const path = require('path')

describe('Remoção dos middlewares legados', () => {
  it('não deve existir mais middleware/auth.js', () => {
    const filePath = path.resolve(__dirname, '../../middleware/auth.js')
    expect(fs.existsSync(filePath)).toBe(false)
  })
  it('não deve existir mais middleware/validate.js', () => {
    const filePath = path.resolve(__dirname, '../../middleware/validate.js')
    expect(fs.existsSync(filePath)).toBe(false)
  })
})
