//Carregar Módulos
    const express = require('express')
    const handlebars = require('express-handlebars')
    const bodyParser = require('body-parser')
    const app = express()
    const mongoose = require('mongoose')
    const path = require('path')
    const session = require('express-session')
    const flash = require('connect-flash')
    const passport = require('passport')
    require('./models/Usuario')
    require("./config/autenticacao")(passport)
    const {checarAutenticacao} = require('./config/checarAutenticacao')
    const lanches = require("./routes/lanches")
    const pedidos = require("./routes/pedidos")
    const usuarios = require("./routes/usuarios")
    const receitas = require("./routes/receitas")
    const caixas = require("./routes/caixas")
    const perfil = require("./routes/perfil")
    
    const db = require("./config/db")

//Configurações
    //Sessão
        app.use(session({
            secret: "lanchoneteapp",
            resave: true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())
    //Middleware
        app.use(function(req, res, next){
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash("error")
            res.locals.usuario = req.user || null
            res.locals.contador = 1

            next()
        })   
    //BodyParser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
    //Handlebars
        app.engine('handlebars', handlebars({defaultLayout: 'main'}))
        app.set('view engine', 'handlebars') 
    //Mongoose       
        mongoose.Promise = global.Promise
        mongoose.connect(db.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        }).then(() => {
            console.log("Conectado ao mongo")   
        }).catch((err) => {
            console.log("Erro ao se conectar com o banco de dados mongo: " + err)
        })    
    //Public
        app.use(express.static(path.join(__dirname, "public")))

//Rotas

    app.get('/', (req, res) => {
        res.redirect("login")
    })
    app.get('/login', (req, res) => {
        res.render("login")
    })
    app.post('/login', (req, res, next) => {
        passport.authenticate('local', {
            successRedirect: "/home",
            failureRedirect: "/login",
            failureFlash: true
    
        })(req, res, next)
    })
    app.get('/logout', checarAutenticacao, (req, res) => {
        req.logOut()
        req.flash("success_msg", "Deslogado do sistema")
        res.redirect("/")
    })
    app.get('/home', checarAutenticacao, (req, res) => {
        res.render("home")
    })

    app.use('/lanches', lanches)
    app.use('/pedidos', pedidos)
    app.use('/usuarios', usuarios)
    app.use('/receitas', receitas)
    app.use('/caixas', caixas)
    app.use('/perfil', perfil)
    
const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
    console.log("Servidor Iniciado");
})   

