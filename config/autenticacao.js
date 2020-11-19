const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

//Model de usuário
require('../models/Usuario')
const Usuario = mongoose.model("usuarios")

module.exports = function(passport){
    
    passport.use(new localStrategy({usernameField: 'nomeUsuario', passwordField: 'senha'}, (nomeUsuario, senha, done) => {

        Usuario.findOne({nomeUsuario: nomeUsuario}).lean().then((usuario) => {
            if(!usuario){
                return done(null, false, {message: "Esta conta não existe"})
            }

            bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                
                if(batem){
                    return done(null, usuario)
                }else{
                    return done(null, false, {message: "Senha incorreta"})
                }

            })


        }).catch((err) => {
           console.log(err) 
        })

    }))

    passport.serializeUser((usuario, done) => {
    
        done(null, usuario)
    
    })

    passport.deserializeUser((usuario, done) => {
        
        done(null, usuario)

    })   
}