const hbs = require('hbs')

hbs.registerHelper('eq', function (a, b) {
  return a === b
})

hbs.registerHelper('selected', function (value, expected) {
  return value === expected ? 'selected' : ''
})

hbs.registerHelper('ifSelected', function (val) {
  return val ? 'selected' : ''
})

// Adicione outros helpers aqui se necessário
