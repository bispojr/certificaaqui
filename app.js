// Helpers do Handlebars
require('./hbs-helpers')
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
const session = require('express-session')
const flash = require('connect-flash')

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
var adminRouter = require('./src/routes/admin')
var publicRouter = require('./src/routes/public')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(cookieParser())

// Configuração de sessão e flash (TASK-028-B)
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error(
    'SESSION_SECRET não definido. Defina a variável de ambiente SESSION_SECRET para garantir a segurança da sessão.',
  )
}
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
)
app.use(flash())
app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
  }
  next()
})

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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Participante: {
        type: 'object',
        properties: {
          nomeCompleto: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          instituicao: { type: 'string', minLength: 2 },
        },
        required: ['nomeCompleto', 'email'],
      },
      Evento: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 3 },
          ano: { type: 'integer', minimum: 2000 },
          codigo_base: { type: 'string', pattern: '^[A-Za-z]{3}$' },
        },
        required: ['nome', 'ano', 'codigo_base'],
      },
      Certificado: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 3 },
          status: {
            type: 'string',
            enum: ['emitido', 'pendente', 'cancelado'],
          },
          participante_id: { type: 'integer' },
          evento_id: { type: 'integer' },
          tipo_certificado_id: { type: 'integer' },
        },
        required: [
          'nome',
          'status',
          'participante_id',
          'evento_id',
          'tipo_certificado_id',
        ],
      },
      TipoCertificado: {
        type: 'object',
        properties: {
          codigo: { type: 'string', pattern: '^[A-Za-z]{2}$' },
          descricao: { type: 'string', minLength: 1 },
          campo_destaque: { type: 'string', minLength: 1 },
          texto_base: { type: 'string', minLength: 1 },
          dados_dinamicos: { type: 'object', additionalProperties: true },
        },
        required: ['codigo', 'descricao', 'campo_destaque', 'texto_base'],
      },
      Usuario: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 },
          perfil: { type: 'string', enum: ['admin', 'gestor', 'monitor'] },
          eventos: { type: 'array', items: { type: 'integer' } },
        },
        required: ['nome', 'email', 'senha', 'perfil'],
      },
    },
  },
}

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Anotações nas rotas
}

const swaggerSpec = swaggerJsdoc(options)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/', indexRouter)
// app.use('/users', usersRouter);

const authRouter = require('./src/routes/auth')
app.use('/auth', authRouter)
app.use('/participantes', participantesRouter)
app.use('/eventos', eventosRouter)
// Redireciona GET /certificados para SSR apenas se não houver Bearer token (API)
app.get('/certificados', (req, res, next) => {
  const auth = req.headers['authorization']
  if (auth && auth.startsWith('Bearer ')) return next()
  return res.redirect('/public/pagina/opcoes')
})
app.use('/certificados', certificadosRouter)
app.use('/tipos-certificados', tiposCertificadosRouter)
app.use('/usuarios', usuariosRouter)
app.use('/admin', adminRouter)
app.use('/public', publicRouter)
app.use(healthRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // Sempre passa status e mensagem para o template
  res.locals.message = err.message
  // Garante que error.status estará disponível no template
  res.locals.error = {
    status: err.status || 500,
    stack: req.app.get('env') === 'development' ? err.stack : undefined,
  }
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
