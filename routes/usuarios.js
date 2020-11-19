const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('../models/Usuario')
const Usuario = mongoose.model("usuarios")
const {checarAdmin} = require('../config/checarAdmin')

router.get('/novo', checarAdmin, (req, res) => {
    res.render("usuarios/addusuario")
})

router.post('/novo', checarAdmin, (req, res) => {
    var erros = []
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome do Usuário Inválido"})
    }
    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
        erros.push({texto: "E-mail do Usuário Inválido"})
    }
    if(!req.body.tipoDeUsuario || typeof req.body.tipoDeUsuario == undefined || req.body.tipoDeUsuario == null){
        erros.push({texto: "Escolha um tipo de Usuário"})
    }
    if(!req.body.login || typeof req.body.login == undefined || req.body.login == null){
        erros.push({texto: "Nome de Login Inválido"})
    }
    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        erros.push({texto: "Senha Inválida"})
    }
    if(!req.body.senha2 || typeof req.body.senha2 == undefined || req.body.senha2 == null){
        erros.push({texto: "Confirmação de Senha Inválida"})
    }
    if(req.body.senha.length < 5){
        erros.push({texto: "Senha muito curta. Precisa de pelo menos 5 caracteres"})
    }
    if(req.body.senha != req.body.senha2){
        erros.push({texto: "Senhas não correspondem"})
    }
    
    Usuario.findOne({nomeUsuario: req.body.login}).lean().then((usuario) => {
        if(usuario){
            erros.push({texto: "Nome de Login de Usuário já cadastrado"})
        }

        if(erros.length > 0){
            res.render("usuarios/addusuario", {erros: erros})
        }else{
            var novoUsuario = {
                nome: req.body.nome,
                email: req.body.email,
                admin: req.body.tipoDeUsuario,
                nomeUsuario: req.body.login,
            }
                bcrypt.hash(req.body.senha, 10).then((senha) => {  //crtiptografando a senha
                     novoUsuario.senha = senha      //passando para o objeto novoUsuario
                     
                     new Usuario(novoUsuario).save().then(() => {
                        req.flash("success_msg", "Usuário adicionado com sucesso")
                        res.redirect("/home")
                    }).catch((err) => {
                        req.flash("error_msg", "Erro ao salvar o usuário")
                        res.redirect("/home")
                        console.log(err)        
                    })
                    
                }).catch((err) => {
                    req.flash("error_msg", "Erro ao criptografar a senha")
                    res.redirect("/home")
                    console.log(err)    
                })  
            
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao salvar o usuário")
        res.redirect("/home") 
        console.log(err)           
    })

    
})

router.get('/pesquisa', checarAdmin, (req, res) => {
    res.render("usuarios/buscausuario")
})

router.post('/pesquisa', checarAdmin, (req, res) => {
    opcao = req.body.opcao
    busca = req.body.busca
    usuarios_pesquisados = []
    Usuario.find().sort({_id: "asc"}).lean().then((usuarios) => {
        for(const aux_usuarios of usuarios){
            if(opcao == 0){
                if(aux_usuarios.nome.toLowerCase().includes(busca)){
                    aux_usuarios.admin = (aux_usuarios.admin == 1) ? "Administrador" : "Comum"
                    usuarios_pesquisados.push(aux_usuarios)
                }
            }else if(opcao == 1){
                if(aux_usuarios.email.toLowerCase().includes(busca)){
                    aux_usuarios.admin = (aux_usuarios.admin == 1) ? "Administrador" : "Comum"
                    usuarios_pesquisados.push(aux_usuarios)
                }
            }else if(opcao == 2){
                if(aux_usuarios.nomeUsuario.toLowerCase().includes(busca)){
                    aux_usuarios.admin = (aux_usuarios.admin == 1) ? "Administrador" : "Comum"
                    usuarios_pesquisados.push(aux_usuarios)
                }
            }    

        } 
        
        res.render("usuarios/buscausuario", {usuarios: usuarios_pesquisados})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar os usuários")
        res.redirect("/home")
        console.log(err)
    })
})


router.post('/editar', checarAdmin, (req, res) => {
    Usuario.findOne({_id: req.body.id}).lean().then((usuario) => {
        let tipoDeUsuario = true
        if(usuario.admin == 0){
            tipoDeUsuario = false
        }
        res.render("usuarios/editusuario", {usuario: usuario, tipoDeUsuario: tipoDeUsuario})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar o usuário")
        res.redirect("/home")
    })
})

router.post('/editUsuario', checarAdmin, (req, res) => {
    Usuario.findOne({_id: req.body.id}).lean().then((usuario) => {
        let tipoDeUsuario = (usuario.admin == 1) ? true : false
        var erros = []
        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
            erros.push({texto: "Nome do Usuário Inválido"})
        }
        if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
            erros.push({texto: "E-mail do Usuário Inválido"})
        }
        if(!req.body.tipoDeUsuario || typeof req.body.tipoDeUsuario == undefined || req.body.tipoDeUsuario == null){
            erros.push({texto: "Escolha um tipo de Usuário"})
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
                res.render("usuarios/editusuario", {erros: erros, usuario: usuario, tipoDeUsuario: tipoDeUsuario})
            }else{
                Usuario.updateOne({_id: req.body.id}, {$set: 
                    {nome: req.body.nome,
                     email: req.body.email,   
                     admin: req.body.tipoDeUsuario,
                     nomeUsuario: req.body.login,
                     senha: req.body.senha
                    }}).then(() => {
                        req.flash("success_msg", "Usuário editado com sucesso")
                        res.redirect("/usuarios/pesquisa")
                    }).catch((err) => {
                        req.flash("error_msg", "Erro interno ao editar o usuário")
                        res.redirect("/usuarios/pesquisa")
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



router.post('/deletar', checarAdmin, (req, res) => {
    Usuario.findOne({_id: req.body.id}).lean().then((usuario) => {
        res.render("usuarios/deleteusuario", {usuario: usuario})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao excluir o usuário")
        res.redirect("/home")
    })
})

router.post('/delUsuario', checarAdmin, (req, res) => {
    Usuario.remove({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Usuário deletado com sucesso")
        res.redirect("/usuarios/pesquisa")
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao deletar o usuário")
        res.redirect("/usuarios/pesquisa")
    })
})

module.exports = router