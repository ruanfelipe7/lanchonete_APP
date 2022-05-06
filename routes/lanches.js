const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Lanche')
const Lanche = mongoose.model("lanches")
const {checarAutenticacao} = require('../config/checarAutenticacao')


function mascaraDePreco(preco) {
    stringPreco = preco.toString().replace('.', ',')
    var i = stringPreco.indexOf(",")
    tamanho = stringPreco.length
    var substringPreco
    if(i == -1){
        stringPreco = stringPreco.concat(",00")
    }else{  
        substringPreco = stringPreco.substr(i+1, tamanho)
        if(substringPreco.length < 2){
            stringPreco = stringPreco.concat("0")
        }
    }
    return stringPreco
}

router.get('/novo', checarAutenticacao, (req, res) => {
    res.render("lanches/addlanche")
})

router.post('/novo', checarAutenticacao, (req, res) => {
    var erros = []
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome do Lanche Inválido"})
    }
    if(!req.body.tipoDePao || typeof req.body.tipoDePao == undefined || req.body.tipoDePao == null){
        erros.push({texto: "Escolha um tipo de Pão"})
    }
    if(!req.body.ingredientes || typeof req.body.ingredientes == undefined || req.body.ingredientes == null){
        erros.push({texto: "Ingredientes inválidos"})
    }
    if(!req.body.preco || typeof req.body.preco == undefined || req.body.preco == null){
        erros.push({texto: "Preço inválido"})
    }
    if(erros.length > 0){
        res.render("lanches/addlanche", {erros: erros})
    }else{
        Lanche.findOne({nome: req.body.nome}).lean().then((lanche) => {
            let chaveLanche = 1
            if(lanche){
                chaveLanche = lanche.chave

                var novoLanche = {
                    nome: req.body.nome,
                    tipoDePao: req.body.tipoDePao,
                    ingredientes: req.body.ingredientes,
                    preco: req.body.preco,
                    chave: chaveLanche
                }
        
                new Lanche((novoLanche)).save().then(() => {
                    req.flash("success_msg", "Lanche adicionado com sucesso")
                    res.redirect("/home")
                }).catch((err) => {
                    req.flash("error_msg", "Erro ao salvar o lanche")
                    res.redirect("/home")
                    console.log(err)
                })
            }else{
                Lanche.countDocuments((err, count) => {
                    chaveLanche = count + 1
                    
                    var novoLanche = {
                        nome: req.body.nome,
                        tipoDePao: req.body.tipoDePao,
                        ingredientes: req.body.ingredientes,
                        preco: req.body.preco,
                        chave: chaveLanche
                    }
            
                    new Lanche((novoLanche)).save().then(() => {
                        req.flash("success_msg", "Lanche adicionado com sucesso")
                        res.redirect("/home")
                    }).catch((err) => {
                        req.flash("error_msg", "Erro ao salvar o lanche")
                        res.redirect("/home")
                        console.log(err)
                    })       
                })
            }
        }).catch((err) => {
            req.flash("error_msg", "Erro ao adicionar o lanche")
            res.redirect("/home")    
        })
        
    }
})


router.get('/cardapio', checarAutenticacao, (req, res) => {
    Lanche.find().sort({chave: "asc"}).lean().then((lanches) => {
        lanches_alterados = []
        let preco
        ctrl = false
        for(const aux of lanches){
            preco = aux.preco
            preco = mascaraDePreco(preco)
            if(ctrl){   
               novos_lanches.preco2 = preco
               ctrl = false
               lanches_alterados.push(novos_lanches)
            }else{
                novos_lanches = {
                    nome: aux.nome,
                    ingredientes: aux.ingredientes,
                    preco: preco,
                    preco2: "0"
                }
                ctrl = true
            }
        }
        res.render("lanches/cardapio", {lanches: lanches_alterados})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar o cardápio")
        res.redirect("/home")
        console.log(err)
    })
})

router.get('/ver-cardapio', (req, res) => {
    Lanche.find().sort({chave: "asc"}).lean().then((lanches) => {
        lanches_alterados = []
        let preco
        ctrl = false
        for(const aux of lanches){
            preco = aux.preco
            preco = mascaraDePreco(preco)
            if(ctrl){   
               novos_lanches.preco2 = preco
               ctrl = false
               lanches_alterados.push(novos_lanches)
            }else{
                novos_lanches = {
                    nome: aux.nome,
                    ingredientes: aux.ingredientes,
                    preco: preco,
                    preco2: "0"
                }
                ctrl = true
            }
        }
        res.render("lanches/cardapio", {lanches: lanches_alterados})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar o cardápio")
        res.redirect("/home")
        console.log(err)
    })
})

router.get('/pesquisa', checarAutenticacao, (req, res) => {
    res.render("lanches/buscalanche")
})

router.post('/pesquisa', checarAutenticacao, (req, res) => {
    opcao = req.body.opcao
    busca = req.body.busca
    novos_lanches = []
    Lanche.find().sort({chave: "asc"}).lean().then((lanches) => {
        for(const aux_lanches of lanches){
            if(opcao == 0){
                if(aux_lanches.nome.toLowerCase().includes(busca)){
                    aux_lanches.preco = mascaraDePreco(aux_lanches.preco)
                    novos_lanches.push(aux_lanches)
                }
            }else if(opcao == 1){
                floatBusca = parseFloat(busca)
                if(aux_lanches.preco == floatBusca){
                    aux_lanches.preco = mascaraDePreco(aux_lanches.preco)
                    novos_lanches.push(aux_lanches)
                }
            }else if(opcao == 2){
                if(aux_lanches.ingredientes.toLowerCase().includes(busca)){
                    aux_lanches.preco = mascaraDePreco(aux_lanches.preco)
                    novos_lanches.push(aux_lanches)
                }
            }    

        } 
        
        res.render("lanches/buscalanche", {lanches: novos_lanches})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar os lanches")
        res.redirect("/home")
        console.log(err)
    })
})

router.post('/editar', checarAutenticacao, (req, res) => {
    Lanche.findOne({_id: req.body.id}).lean().then((lanche) => {
        let tipoDePao = true
        if(lanche.tipoDePao == "Pão Árabe"){
            tipoDePao = false
        }
        res.render("lanches/editlanche", {lanche: lanche, tipoDePao: tipoDePao})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar o lanche")
        res.redirect("/home")
    })
})

router.post('/editLanche', checarAutenticacao, (req, res) => {
    Lanche.findOne({_id: req.body.id}).lean().then((lanche) => {
        let tipoDePao = true
        if(lanche.tipoDePao == "Pão Árabe"){
            tipoDePao = false
        }
        var erros = []
        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
            erros.push({texto: "Nome do Lanche Inválido"})
        }
        if(!req.body.tipoDePao || typeof req.body.tipoDePao == undefined || req.body.tipoDePao == null){
            erros.push({texto: "Escolha um tipo de Pão"})
        }
        if(!req.body.ingredientes || typeof req.body.ingredientes == undefined || req.body.ingredientes == null){
            erros.push({texto: "Ingredientes inválidos"})
        }
        if(!req.body.preco || typeof req.body.preco == undefined || req.body.preco == null){
            erros.push({texto: "Preço inválido"})
        }
        if(erros.length > 0){
            res.render("lanches/editlanche", {erros: erros, lanche: lanche, tipoDePao: tipoDePao })
        }else{
            Lanche.updateOne({_id: req.body.id}, {$set: 
            {nome: req.body.nome,
            tipoDePao: req.body.tipoDePao,
            ingredientes: req.body.ingredientes,
            preco: req.body.preco
            }}).then(() => {
                req.flash("success_msg", "Lanche editado com sucesso")
                res.redirect("/lanches/pesquisa")
            }).catch((err) => {
                req.flash("error_msg", "Erro interno ao editar o lanche")
                res.redirect("/lanches/pesquisa")
                console.log(err)

            })
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao salvar o lanche")
        res.redirect("/home")
    })
    
})

router.post('/deletar', checarAutenticacao, (req, res) => {
    Lanche.findOne({_id: req.body.id}).lean().then((lanche) => {
        res.render("lanches/deletelanche", {lanche: lanche})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao excluir o lanche")
        res.redirect("/home")
    })
})

router.post('/delLanche', checarAutenticacao, (req, res) => {
    Lanche.remove({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Lanche deletado com sucesso")
        res.redirect("/lanches/pesquisa")
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao deletar o lanche")
        res.redirect("/lanches/pesquisa")
    })
})

module.exports = router