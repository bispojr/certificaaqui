
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

// Swagger/OpenAPI
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

var indexRouter = require('./src/routes/index')
// var usersRouter = require('./routes/users');
var participantesRouter = require('./src/routes/participantes')
var eventosRouter = require('./src/routes/eventos')
var certificadosRouter = require('./src/routes/certificados')
var tiposCertificadosRouter = require('./src/routes/tipos-certificados')
var usuariosRouter = require('./src/routes/usuarios')
var healthRouter = require('./src/routes/health')


var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))


// Swagger config
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Certifique-me API',
    version: '1.0.0',
    description: 'Documentação da API Certifique-me',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
}

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Anotações nas rotas
}

const swaggerSpec = swaggerJsdoc(options)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/', indexRouter)
// app.use('/users', usersRouter);
app.use('/participantes', participantesRouter)
app.use('/eventos', eventosRouter)
app.use('/certificados', certificadosRouter)
app.use('/tipos-certificados', tiposCertificadosRouter)
app.use('/usuarios', usuariosRouter)
app.use(healthRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
