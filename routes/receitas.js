const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Receita')
const Receita = mongoose.model("receitas")
const {checarAdmin} = require('../config/checarAdmin')

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

function mascaraData(data){
    partesData = data.split("-")
    var novaData
    
    if(partesData[0].length == 1){
        novaData = "0" + partesData[0]
    }else{
        novaData = partesData[0]
    }

    novaData = novaData + "/"

    if(partesData[1].length == 1){
        novaData = novaData + "0" + partesData[1]         
    }else{
        novaData = novaData + partesData[1]
    }

    novaData = novaData + "/" + partesData[2]
    return novaData
}

router.get('/novo', checarAdmin, (req, res) => {
    res.render("receitas/addReceita")
})

router.post('/novo', checarAdmin, (req, res) => {
    var erros = []
    if(!req.body.data || typeof req.body.data == undefined || req.body.data == null){
        erros.push({texto: "Data Inválida"})
    }
    if(!req.body.descricao || typeof req.body.descricao == undefined || req.body.descricao == null){
        erros.push({texto: "Descrição Inválida"})
    }
    if(!req.body.valor || typeof req.body.valor == undefined || req.body.valor == null){
        erros.push({texto: "Valor de Receita Inválido"})
    }
    if(!req.body.tipoDeReceita || typeof req.body.tipoDeReceita == undefined || req.body.tipoDeReceita == null){
        erros.push({texto: "Tipo de Receita Inválido"})
    }
    if(erros.length > 0){
        res.render("receitas/addReceita", {erros: erros})
    }else{
        let d = new Date();
        let data = new Date(d.valueOf() - d.getTimezoneOffset() * 60000)
        let dataFormulario = Date.parse(req.body.data)
        let dataReceita = new Date(dataFormulario)
        
        data.setDate(dataReceita.getDate()+1)
        data.setMonth(dataReceita.getMonth())
        data.setFullYear(dataReceita.getFullYear())

        var novaReceita = {
            data: data,
            descricao: req.body.descricao,
            tipo: req.body.tipoDeReceita,
            valor: req.body.valor
        }
        new Receita(novaReceita).save().then(() => {
            req.flash("success_msg", "Receita adicionada com sucesso")
            res.redirect("/home")
        }).catch((err) => {
            req.flash("error_msg", "Erro ao salvar a receita")
            res.redirect("/home")
            console.log(err)
        })
    }
})

router.get('/pesquisa', checarAdmin, (req, res) => {
    res.render("receitas/buscaReceita")
})


router.post('/pesquisa', checarAdmin, (req, res) => {
    opcao = req.body.opcao
    busca = req.body.busca
    receitas_pesquisadas = []
    Receita.find().sort({data: "desc"}).lean().then((receitas) => {
        for(const aux_receitas of receitas){

            dia = aux_receitas.data.getDate()
            mes = aux_receitas.data.getMonth() + 1
            ano = aux_receitas.data.getFullYear()
            dataDaReceita = dia+"-"+mes+"-"+ano
            dataDaReceita = mascaraData(dataDaReceita)

            if(opcao == 0){
                if(dataDaReceita.includes(busca)){
                    aux_receitas.valor = mascaraDePreco(aux_receitas.valor)
                    aux_receitas.data = dataDaReceita
                    aux_receitas.tipo = (aux_receitas.tipo == 1) ? "Lucro (+)" : "Despesa (-)"
                    receitas_pesquisadas.push(aux_receitas)
                }
            }else if(opcao == 1){
                if(aux_receitas.descricao.toLowerCase().includes(busca)){
                    aux_receitas.valor = mascaraDePreco(aux_receitas.valor)
                    aux_receitas.data = dataDaReceita
                    aux_receitas.tipo = (aux_receitas.tipo == 1) ? "Lucro (+)" : "Despesa (-)"
                    receitas_pesquisadas.push(aux_receitas)
                }
            }else if(opcao == 2){
                if(aux_receitas.tipo == 1){
                    aux_receitas.valor = mascaraDePreco(aux_receitas.valor)
                    aux_receitas.data = dataDaReceita
                    aux_receitas.tipo = (aux_receitas.tipo == 1) ? "Lucro (+)" : "Despesa (-)"
                    receitas_pesquisadas.push(aux_receitas)
                }
            }else if(opcao == 3){
                if(aux_receitas.tipo == 0){
                    aux_receitas.valor = mascaraDePreco(aux_receitas.valor)
                    aux_receitas.data = dataDaReceita
                    aux_receitas.tipo = (aux_receitas.tipo == 1) ? "Lucro (+)" : "Despesa (-)"
                    receitas_pesquisadas.push(aux_receitas)
                }
            }    

        } 
        
        res.render("receitas/buscaReceita", {receitas: receitas_pesquisadas})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar as receitas")
        res.redirect("/home")
        console.log(err)
    })
})

router.post('/deletar', checarAdmin, (req, res) => {
    Receita.findOne({_id: req.body.id}).lean().then((receita) => {
        mes = receita.data.getMonth() + 1
        data = receita.data.getDate() + "-" + mes + "-" + receita.data.getFullYear()
        receita.data = mascaraData(data) 
        receita.valor = mascaraDePreco(receita.valor)
        receita.tipo = (receita.tipo == 1) ? "Lucro (+)" : "Despesa (-)"
          
        res.render("receitas/deleteReceita", {receita: receita})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao excluir a receita")
        res.redirect("/receitas/pesquisa")
    })
})

router.post('/delReceita', checarAdmin, (req, res) => {
    Receita.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Receita deletada com sucesso")
        res.redirect("/receitas/pesquisa")
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao deletar a receita")
        res.redirect("/receitas/pesquisa")
    })
})

module.exports = router