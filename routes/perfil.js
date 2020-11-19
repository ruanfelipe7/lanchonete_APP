const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model("usuarios")
const {checarAutenticacao} = require('../config/checarAutenticacao')


router.get('/editar', checarAutenticacao, (req, res) => {
    res.render("perfil/editPerfil", {usuario: req.user})
})

router.post('/editPerfil', checarAutenticacao, (req, res) => {
    Usuario.findOne({_id: req.body.id}).lean().then((usuario) => {
        let tipoDeUsuario = (usuario.admin == 1) ? true : false
        var erros = []
        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
            erros.push({texto: "Nome do Usuário Inválido"})
        }
        if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
            erros.push({texto: "E-mail do Usuário Inválido"})
        }
        if(!req.body.login || typeof req.body.login == undefined || req.body.login == null){
            erros.push({texto: "Nome de Login Inválido"})
        }
        Usuario.findOne({nomeUsuario: req.body.login}).lean().then((usuario2) => {
            if(usuario2){
                if(usuario._id.toString() != usuario2._id.toString()){
                    erros.push({texto: "Nome de Login de Usuário já cadastrado"})
                }
            }

            if(erros.length > 0){
                res.render("perfil/editPerfil", {erros: erros, usuario: usuario})
            }else{
                Usuario.updateOne({_id: req.body.id}, {$set: 
                    {nome: req.body.nome,
                     email: req.body.email,   
                     nomeUsuario: req.body.login,
                    }}).then(() => {
                        req.flash("success_msg", "Perfil do Usuário editado com sucesso")
                        res.redirect("/home")
                    }).catch((err) => {
                        req.flash("error_msg", "Erro interno ao editar o perfil do usuário")
                        res.redirect("/home")
                        console.log(err)
        
                    })  
                
            }
        }).catch((err) => {
            req.flash("error_msg", "Erro interno ao salvar o usuário")
            res.redirect("/home") 
            console.log(err)           
        })

    }).catch((err) => {
        req.flash("error_msg", "Erro ao salvar o usuário")
        res.redirect("/home")
    })
    
    
})

module.exports = router