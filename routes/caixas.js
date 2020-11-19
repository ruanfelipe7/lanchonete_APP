const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Caixa')
require('../models/Receita')
const Caixa = mongoose.model("caixas")
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

router.get('/caixa_do_dia', checarAdmin, (req, res) => {
    Receita.find().sort({ _id: "asc" }).lean().then((receitas) => {
        let date = new Date()
        let dia = date.getDate()
        let mes = date.getMonth() + 1
        let ano = date.getFullYear()
        var data_de_hoje = dia + "-" + mes + "-" + ano
        var receitas_hoje = []
        var totalValor = {
            lucro: 0.00,
            despesa: 0.00,
            saldo: 0.00
        }
        var total = {
            lucro: "0",
            despesa: "0",
            saldo: "0"
        }
    
        
        for (const aux_receitas of receitas) {
            var mes_aux = aux_receitas.data.getMonth() + 1
            var dataReceita = aux_receitas.data.getDate() + "-" + mes_aux + "-" + aux_receitas.data.getFullYear()
            if (dataReceita == data_de_hoje) {
                
                if(aux_receitas.tipo == 1){
                    totalValor.lucro += aux_receitas.valor
                    aux_receitas.tipoDeReceita = true
                    aux_receitas.tipo = "Lucro (+)"
                }else{
                    totalValor.despesa += aux_receitas.valor
                    aux_receitas.tipoDeReceita = false
                    aux_receitas.tipo = "Despesa (-)"
                }

                aux_receitas.data = mascaraData(dataReceita)
                aux_receitas.valor = mascaraDePreco(aux_receitas.valor)
                receitas_hoje.push(aux_receitas)
            }
        }

        totalValor.saldo = totalValor.lucro - totalValor.despesa

        total.lucro = mascaraDePreco(totalValor.lucro)
        total.despesa = mascaraDePreco(totalValor.despesa)
        total.saldo = mascaraDePreco(totalValor.saldo)
        
        data_de_hoje = mascaraData(data_de_hoje)
        res.render("caixas/caixa_do_dia", {receitas: receitas_hoje, data_de_hoje: data_de_hoje, total: total, totalValor: totalValor})


    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar as receitas de hoje")
        res.redirect("/home")
        console.log(err)
    })
})

router.post('/finalizar', checarAdmin, (req, res) => {
    let d = new Date();
    let data_de_hoje = new Date(d.valueOf() - d.getTimezoneOffset() * 60000)
    var lucroTotal = parseFloat(req.body.lucroTotal)
    var despesaTotal = parseFloat(req.body.despesaTotal)
    var saldoTotal = parseFloat(req.body.saldoTotal)
    var caixaJaRegistrado = false
    var idAuxiliar = 0
    Caixa.find().sort({data: "desc" }).lean().then((caixas) => {
        for(aux_caixas of caixas){
            var mes = aux_caixas.data.getMonth() + 1
            var data_aux = aux_caixas.data.getDate() + "-" + mes + "-" + aux_caixas.data.getFullYear()
            mes = data_de_hoje.getMonth() + 1
            var dataHojeAuxiliar = data_de_hoje.getDate() + "-" + mes + "-" + data_de_hoje.getFullYear()
            if(dataHojeAuxiliar == data_aux){
                idAuxiliar = aux_caixas._id
                caixaJaRegistrado = true
            } 
        }

        if(caixaJaRegistrado){
            Caixa.updateOne({_id: idAuxiliar}, {$set:
                {
                    data: data_de_hoje,
                    lucroTotal: lucroTotal,
                    despesaTotal: despesaTotal,
                    saldoTotal: saldoTotal
                
                }}).then(() => {
                    req.flash("success_msg","Caixa atualizado com sucesso")
                    res.redirect("/home")
                }).catch((err) => {
                    req.flash("error_msg", "Erro interno ao atualizar o caixa")
                    res.redirect("/home")
                })
        }else{

            var novoCaixa = {
                data: data_de_hoje,
                lucroTotal: lucroTotal,
                despesaTotal: despesaTotal,
                saldoTotal: saldoTotal
            }
            new Caixa(novoCaixa).save().then(() => {
                req.flash("success_msg", "Caixa adicionado com sucesso")
                res.redirect("/home")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao salvar o caixa")
                res.redirect("/home")
                console.log(err)
            })
        }

    }).catch((err) => {
        req.flash("error_msg", "Erro ao finalizar o caixa de hoje")
        res.redirect("/home")
        console.log(err)
    })
})

router.get('/pesquisa', checarAdmin, (req, res) => {
    res.render("caixas/buscaCaixa", {busca: false})
})

router.post('/pesquisa', checarAdmin, (req, res) => {
    let data = Date.parse(req.body.dataInicio)
    let dataInicial = new Date(data)
    let dataInicialAuxiliar = new Date(data)
    dataInicialAuxiliar.setDate(dataInicialAuxiliar.getDate()+1) 
    data = Date.parse(req.body.dataFinal)
    let dataFinal = new Date(data)
    dataFinal.setDate(dataFinal.getDate()+1)
    caixas_pesquisados = []
    var total = {
        lucro: 0.00,
        despesa: 0.00,
        saldo: 0.00
    }
    Caixa.find().sort({data: "asc"}).lean().then((caixas) => {
        
        for(const aux_caixas of caixas){
            dataDoCaixa = aux_caixas.data
            
            if(dataDoCaixa <= dataFinal && dataDoCaixa >= dataInicial){
                var mes = dataDoCaixa.getMonth()+1
                data = dataDoCaixa.getDate() + "-" + mes + "-" + dataDoCaixa.getFullYear()

                total.lucro += aux_caixas.lucroTotal
                total.despesa += aux_caixas.despesaTotal
                    

                aux_caixas.data = mascaraData(data)
                aux_caixas.lucroTotal = mascaraDePreco(aux_caixas.lucroTotal)
                aux_caixas.despesaTotal = mascaraDePreco(aux_caixas.despesaTotal)
                aux_caixas.saldoTotal = mascaraDePreco(aux_caixas.saldoTotal)
                caixas_pesquisados.push(aux_caixas)
            }
        }

        total.saldo = total.lucro - total.despesa
        
        total.lucro = mascaraDePreco(total.lucro)
        total.despesa = mascaraDePreco(total.despesa)
        total.saldo = mascaraDePreco(total.saldo)

        var dia = dataInicialAuxiliar.getDate()
        var mes = dataInicialAuxiliar.getMonth()+1
        var ano = dataInicialAuxiliar.getFullYear()
        dataInicio = dia + "-" + mes + "-" + ano

        mes = dataFinal.getMonth() + 1
        dataFim = dataFinal.getDate() + "-" + mes + "-" + dataFinal.getFullYear()

        var datas = {
            dataInicial: mascaraData(dataInicio),
            dataFinal: mascaraData(dataFim)
        }
        
        res.render("caixas/buscaCaixa", {busca: true, caixas: caixas_pesquisados, total: total, datas: datas})
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao pesquisar os caixas")
        res.redirect("/home")
    })


})

module.exports = router