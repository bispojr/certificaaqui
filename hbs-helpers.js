const hbs = require('hbs')

function registerHelpers(handlebarsInstance) {
  handlebarsInstance.registerHelper('json', function (context) {
    return JSON.stringify(context || {})
  })
  handlebarsInstance.registerHelper('eq', function (a, b) {
    return a === b
  })
  handlebarsInstance.registerHelper('selected', function (value, expected) {
    return value === expected ? 'selected' : ''
  })
  handlebarsInstance.registerHelper('ifSelected', function (val) {
    return val ? 'selected' : ''
  })
  handlebarsInstance.registerHelper('toString', function (val) {
    return String(val ?? '')
  })
}

// Registra helpers no hbs (usado pela aplicação)
registerHelpers(hbs.handlebars)

// Se Handlebars puro estiver disponível (usado em testes), registra também
try {
  const Handlebars = require('handlebars')
  registerHelpers(Handlebars)
} catch (e) {
  // Handlebars puro não está disponível, ignora
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
