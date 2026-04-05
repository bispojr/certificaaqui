const hbs = require('hbs')

hbs.registerHelper('json', function (context) {
  return JSON.stringify(context || {})
})

hbs.registerHelper('eq', function (a, b) {
  return a === b
})

hbs.registerHelper('selected', function (value, expected) {
  return value === expected ? 'selected' : ''
})

hbs.registerHelper('ifSelected', function (val) {
  return val ? 'selected' : ''
})

hbs.registerHelper('toString', function (val) {
  return String(val ?? '')
})

// Para testes unitários:
if (process.env.NODE_ENV === 'test') {
  const Handlebars = require('handlebars')
  Handlebars.registerHelper('json', hbs.handlebars.helpers.json)
  Handlebars.registerHelper('eq', hbs.handlebars.helpers.eq)
  Handlebars.registerHelper('toString', hbs.handlebars.helpers.toString)
  // Permitir acesso a propriedades herdadas (toString)
  Handlebars.compile = (function (origCompile) {
    return function (template, options) {
      options = options || {}
      options.allowProtoPropertiesByDefault = true
      return origCompile.call(this, template, options)
    }
  })(Handlebars.compile)
  Handlebars.registerHelper('lookup', function (obj, field) {
    return obj && obj[field]
  })
}

hbs.registerHelper('isSelected', function (a, b) {
  return String(a) === String(b) ? 'selected' : ''
})

// Adicione outros helpers aqui se necessário
hbs.registerHelper('getPerfilBadgeClass', function (perfil) {
  if (perfil === 'admin') return 'bg-danger'
  if (perfil === 'gestor') return 'bg-warning text-dark'
  return 'bg-info text-dark'
})
