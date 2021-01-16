const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const {checarAutenticacao} = require('../config/checarAutenticacao')
require('../models/Pedido')
require('../models/Lanche')
require('../models/Receita')
const Pedido = mongoose.model("pedidos")
const Lanche = mongoose.model("lanches")
const Receita = mongoos.model("receitas")

function mascaraDePreco(preco) {
    stringPreco = preco.toString().replace('.', ',')
    var i = stringPreco.indexOf(",")
    tamanho = stringPreco.length
    var substringPreco
    if (i == -1) {
        stringPreco = stringPreco.concat(",00")
    } else {
        substringPreco = stringPreco.substr(i + 1, tamanho)
        if (substringPreco.length < 2) {
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

router.get('/novo', checarAutenticacao, (req, res) => {
    Lanche.find().sort({ chave: "asc" }).lean().then((lanches) => {
        res.render("pedidos/addpedido", { lanches: lanches })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar o formulario de pedido")
        res.redirect("/home")
    })
})

router.post('/novoPedido', checarAutenticacao, (req, res) => {
    var descricaoPedido = req.body.descricao_anterior
    var extraPedido = req.body.extraPedido
    var objDescricao = []
    var objExtra = []
    var cont = 1

    if (descricaoPedido != "") {
        var partesPedido = descricaoPedido.split(";")

        for (const auxPedido of partesPedido) {
            var parteDaPartesPedido = auxPedido.split("\\")
            var auxDescricao

            if (parteDaPartesPedido[5] == "") {
                auxDescricao = {
                    idDescricao: cont,
                    idLanche: parteDaPartesPedido[0],
                    nomeLanche: parteDaPartesPedido[1],
                    tipoDePao: parteDaPartesPedido[2],
                    subtotal: parteDaPartesPedido[3],
                    quantidade: parteDaPartesPedido[4]
                }
            } else {
                auxDescricao = {
                    idDescricao: cont,
                    idLanche: parteDaPartesPedido[0],
                    nomeLanche: parteDaPartesPedido[1],
                    tipoDePao: parteDaPartesPedido[2],
                    subtotal: parteDaPartesPedido[3],
                    quantidade: parteDaPartesPedido[4],
                    observacoes: parteDaPartesPedido[5]
                }
            }
            objDescricao.push(auxDescricao)
            cont += 1
        }
    
    }
    cont = 1
    if (extraPedido != "") {
        var partesExtra = extraPedido.split("\\")
        for (const auxExtra of partesExtra) {
            var partesDaPartesExtra = auxExtra.split("&")
            var auxExtraPedido
            auxExtraPedido = {
                idExtra: cont,
                extra: partesDaPartesExtra[0],
                valorExtra: parseFloat(partesDaPartesExtra[1])
            }
            objExtra.push(auxExtraPedido)
            cont += 1
        }
    }

    let d = new Date();
    let data = new Date(d.valueOf() - d.getTimezoneOffset() * 60000)

    var novoPedido = {
        cliente: req.body.clienteNome,
        total: parseFloat(req.body.total),
        data: data
    }

    if (objDescricao.length > 0) {
        novoPedido.descricao = objDescricao
    }

    if (objExtra.length > 0) {
        novoPedido.extra = objExtra
    }

    new Pedido(novoPedido).save().then(() => {
        req.flash("success_msg", "Pedido adicionado com sucesso")
        res.redirect("/home")
    }).catch((err) => {
        req.flash("error_msg", "Erro ao salvar o pedido")
        res.redirect("/home")
        console.log(err)
    })
})

router.get('/pedidos_do_dia', checarAutenticacao, (req, res) => {
    Pedido.find().sort({ _id: "asc" }).lean().then((pedidos) => {
        let d = new Date();
        let date = new Date(d.valueOf() - d.getTimezoneOffset() * 60000) 
        let dia = date.getDate()
        let mes = date.getMonth() + 1
        let ano = date.getFullYear()
        var data_de_hoje = dia + "-" + mes + "-" + ano
        var pedidos_hoje = []
        
        for (const aux_pedidos of pedidos) {
            var mes_aux = aux_pedidos.data.getMonth() + 1
            var data_aux = aux_pedidos.data.getDate() + "-" + mes_aux + "-" + aux_pedidos.data.getFullYear()
            if (data_aux == data_de_hoje) {
                if(aux_pedidos.descricao){
                    for(var i = 0; i < aux_pedidos.descricao.length; i++){
                        aux_pedidos.descricao[i].subtotal = mascaraDePreco(aux_pedidos.descricao[i].subtotal)
                    }
                }
                if(aux_pedidos.extra){
                    for(var i = 0; i < aux_pedidos.extra.length; i++){
                        aux_pedidos.extra[i].valorExtra = mascaraDePreco(aux_pedidos.extra[i].valorExtra)
                    }
                }
                
                aux_pedidos.total = mascaraDePreco(aux_pedidos.total)
                pedidos_hoje.push(aux_pedidos)
            }
        }


        res.render("pedidos/pedidos_do_dia", {pedidos: pedidos_hoje, data_de_hoje: mascaraData(data_de_hoje)})


    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar os pedidos")
        res.redirect("/home")
        console.log(err)
    })
})

router.post('/deletar', checarAutenticacao, (req, res) => {
    Pedido.findOne({_id: req.body.id}).lean().then((pedido) => {
        const mes = pedido.data.getMonth() + 1
        const data = pedido.data.getDate() + "-" + mes + "-" + pedido.data.getFullYear()
        pedido.data = mascaraData(data) 
        pedido.total = mascaraDePreco(pedido.total)
        if(pedido.descricao){
            for(var i = 0; i < pedido.descricao.length; i++){
                pedido.descricao[i].subtotal = mascaraDePreco(pedido.descricao[i].subtotal)
            }    
        }
        if(pedido.extra){
            for(var i = 0; i < pedido.extra.length; i++){
                pedido.extra[i].valorExtra = mascaraDePreco(pedido.extra[i].valorExtra)
            }
        }
        res.render("pedidos/deletePedido", {pedido: pedido})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao excluir o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })
})

router.post('/delPedido', checarAutenticacao, (req, res) => {
    Pedido.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Pedido deletado com sucesso")
        res.redirect("/pedidos/pedidos_do_dia")
    }).catch((err) => {
        req.flash("error_msg", "Erro interno ao deletar o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })
})

router.post('/editar', checarAutenticacao, (req, res) => {
    var descricoes = ""
    var extras = ""
    Pedido.findOne({_id: req.body.id}).lean().then((pedido) => {
        Lanche.find().sort({ chave: "asc" }).lean().then((lanches) => {
            if(pedido.descricao){
                for(const auxDescricao of pedido.descricao){
                    if(descricoes == "")
                        descricoes = auxDescricao.idDescricao
                    else    
                        descricoes = descricoes + ";" + auxDescricao.idDescricao
                }
            }
            if(pedido.extra){
                for(const auxExtra of pedido.extra){
                    if(extras == "")
                        extras = auxExtra.idExtra
                    else    
                        extras = extras + ";" + auxExtra.idExtra
                }
            }
            
            res.render("pedidos/editPedido", {pedido: pedido, lanches: lanches, idDescricoes: descricoes, idExtras: extras})     
        }).catch((err) => {
            req.flash("error_msg", "Erro ao carregar os lanches para editar o pedido")
            res.redirect("/pedidos/pedidos_do_dia")
        })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })
})

router.post('/editPedido', checarAutenticacao, (req, res) => {
    var descricoes = ""
    var extras = ""
    Pedido.findOne({_id: req.body.idPedido}).lean().then((pedido) => {
        Lanche.find().sort({ chave: "asc" }).lean().then((lanches) => {
            const total = parseFloat(req.body.total)
            var erros = []
            if(total == 0){
                erros.push({texto: "O total não pode ser zero"})
            }
            if(erros.length > 0){
                if(pedido.descricao){
                    for(const auxDescricao of pedido.descricao){
                        if(descricoes == "")
                            descricoes = auxDescricao.idDescricao
                        else    
                            descricoes = descricoes + ";" + auxDescricao.idDescricao
                    }
                }
                if(pedido.extra){
                    for(const auxExtra of pedido.extra){
                        if(extras == "")
                            extras = auxExtra.idExtra
                        else    
                            extras = extras + ";" + auxExtra.idExtra
                    }
                }
                
                    
                res.render("pedidos/editPedido", {pedido: pedido, lanches: lanches, idDescricoes: descricoes, idExtras: extras, erros: erros})     
            }else{
        
                //cuidando das descrições anteriores
                var descricoesAnteriores = req.body.descricaoAnterior
                var novaDescricao = []
                if(descricoesAnteriores != ""){
                    var idDescricoesAnteriores = descricoesAnteriores.split(";")
                    for(const auxDescricao of pedido.descricao){
                        for(const auxIdDescricoesAnteriores of idDescricoesAnteriores){
                            if(auxDescricao.idDescricao == auxIdDescricoesAnteriores){
                                novaDescricao.push(auxDescricao)
                            }
                        }
                    }
                }

                //novas descrições adicionadas
                if(pedido.descricao != null){
                    var cont = pedido.descricao.length + 1
                    var descricaoAdicional = req.body.descricaoAdicional
                    if (descricaoAdicional != "") {
                        var partesPedido = descricaoAdicional.split(";")
                
                        for (const auxPedido of partesPedido) {
                            var parteDaPartesPedido = auxPedido.split("\\")
                            var auxDescricao
                
                            if (parteDaPartesPedido[5] == "") {
                                auxDescricao = {
                                    idDescricao: cont,
                                    idLanche: parteDaPartesPedido[0],
                                    nomeLanche: parteDaPartesPedido[1],
                                    tipoDePao: parteDaPartesPedido[2],
                                    subtotal: parteDaPartesPedido[3],
                                    quantidade: parteDaPartesPedido[4]
                                }
                            } else {
                                auxDescricao = {
                                    idDescricao: cont,
                                    idLanche: parteDaPartesPedido[0],
                                    nomeLanche: parteDaPartesPedido[1],
                                    tipoDePao: parteDaPartesPedido[2],
                                    subtotal: parteDaPartesPedido[3],
                                    quantidade: parteDaPartesPedido[4],
                                    observacoes: parteDaPartesPedido[5]
                                }
                            }
                            novaDescricao.push(auxDescricao)
                            cont += 1
                        }
                    }
    
                }
                
                //cuidando dos extras anteriores
                var extrasAnteriores = req.body.extraAnterior
                var novoExtra = []
                if(extrasAnteriores != ""){
                    var idExtrasAnteriores = extrasAnteriores.split(";")
                    for(const auxExtra of pedido.extra){
                        for(const auxIdExtrasAnteriores of idExtrasAnteriores){
                            if(auxExtra.idExtra == auxIdExtrasAnteriores){
                                novoExtra.push(auxExtra)
                            }
                        }
                    }
                }
                
                //novos extras
                if(pedido.extra != null){
                    cont = pedido.extra.length + 1
                    var extraAdicional = req.body.extraAdicional
                    if(extraAdicional != ""){
                        var partesExtra = extraAdicional.split("\\")
                        for (const auxExtra of partesExtra) {
                            var partesDaPartesExtra = auxExtra.split("&")
                            var auxExtraPedido
                            auxExtraPedido = {
                                idExtra: cont,
                                extra: partesDaPartesExtra[0],
                                valorExtra: parseFloat(partesDaPartesExtra[1])
                            }
                            novoExtra.push(auxExtraPedido)
                            cont += 1
                        }
                    }
                }
                

                //salvando dados
                Pedido.updateOne({_id: req.body.idPedido}, {$set:
                {
                    cliente: req.body.clienteNome,
                    descricao: novaDescricao,
                    extra: novoExtra,
                    total: total
                }}).then(() => {
                    req.flash("success_msg","Pedido editado com sucesso")
                    res.redirect("/home")
                }).catch((err) => {
                    req.flash("error_msg", "Erro interno ao editar o pedido")
                    res.redirect("/home")
                })
                
            }
            

        }).catch((err) => {
            req.flash("error_msg", "Erro ao carregar os lanches para editar o pedido")
            res.redirect("/pedidos/pedidos_do_dia")
            console.log(err)
        })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })
})


router.get('/pesquisa', checarAutenticacao, (req, res) => {
    res.render("pedidos/buscaPedido")
})

router.post('/pesquisa', checarAutenticacao, (req, res) => {
    opcao = req.body.opcao
    busca = req.body.busca
    pedidos_pesquisados = []
    var mes_aux
    var dataDoPedido
    //Buscando Pedidos
    Pedido.find().sort({data: "desc"}).lean().then((pedidos) => {
        for(const aux_pedidos of pedidos){

            dia = aux_pedidos.data.getDate()
            mes = aux_pedidos.data.getMonth() + 1
            ano = aux_pedidos.data.getFullYear()
            dataDoPedido = dia+"-"+mes+"-"+ano
            dataDoPedido = mascaraData(dataDoPedido)

            if(opcao == 0){   //Buscando por nome do cliente
                if(aux_pedidos.cliente.toLowerCase().includes(busca)){
                    if(aux_pedidos.descricao){
                        for(var i = 0; i < aux_pedidos.descricao.length; i++){
                            aux_pedidos.descricao[i].subtotal = mascaraDePreco(aux_pedidos.descricao[i].subtotal)
                        }    
                    }
    
                    if(aux_pedidos.extra){
                        for(var i = 0; i < aux_pedidos.extra.length; i++){
                            aux_pedidos.extra[i].valorExtra = mascaraDePreco(aux_pedidos.extra[i].valorExtra)
                        }
                    }

                    aux_pedidos.data = dataDoPedido
                    aux_pedidos.total = mascaraDePreco(aux_pedidos.total)
                    pedidos_pesquisados.push(aux_pedidos)
                }
            }else if(opcao == 1){     //Buscando pela data do pedido
                if(dataDoPedido.includes(busca)){
                    if(aux_pedidos.descricao){
                        for(var i = 0; i < aux_pedidos.descricao.length; i++){
                            aux_pedidos.descricao[i].subtotal = mascaraDePreco(aux_pedidos.descricao[i].subtotal)
                        }    
                    }
    
                    if(aux_pedidos.extra){
                        for(var i = 0; i < aux_pedidos.extra.length; i++){
                            aux_pedidos.extra[i].valorExtra = mascaraDePreco(aux_pedidos.extra[i].valorExtra)
                        }
                    }
                    aux_pedidos.data = dataDoPedido
                    aux_pedidos.total = mascaraDePreco(aux_pedidos.total)
                    pedidos_pesquisados.push(aux_pedidos)
                }
            }else if(opcao == 2){      //Buscando pelo preço total do pedido
                busca_total = parseFloat(busca)
                if(busca_total == aux_pedidos.total){
                    if(aux_pedidos.descricao){
                        for(var i = 0; i < aux_pedidos.descricao.length; i++){
                            aux_pedidos.descricao[i].subtotal = mascaraDePreco(aux_pedidos.descricao[i].subtotal)
                        }    
                    }
                    
                    if(aux_pedidos.extra){
                        for(var i = 0; i < aux_pedidos.extra.length; i++){
                            aux_pedidos.extra[i].valorExtra = mascaraDePreco(aux_pedidos.extra[i].valorExtra)
                        }
                    }
                    aux_pedidos.data = dataDoPedido
                    aux_pedidos.total = mascaraDePreco(aux_pedidos.total)
                    pedidos_pesquisados.push(aux_pedidos)
                }
            }    

        } 
        
        res.render("pedidos/buscaPedido", {pedidos: pedidos_pesquisados})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao buscar os pedidos")
        res.redirect("/home")
        console.log(err)
    })
})

router.post('/concluir', checarAutenticacao, (req, res) => {
    Pedido.findOne({_id: req.body.id}).lean().then((pedido) => {
        const mes = pedido.data.getMonth() + 1
        const data = pedido.data.getDate() + "-" + mes + "-" + pedido.data.getFullYear()
        pedido.data = mascaraData(data) 
        pedido.total = mascaraDePreco(pedido.total)
        if(pedido.descricao){
            for(var i = 0; i < pedido.descricao.length; i++){
                pedido.descricao[i].subtotal = mascaraDePreco(pedido.descricao[i].subtotal)
            }    
        }
        if(pedido.extra){
            for(var i = 0; i < pedido.extra.length; i++){
                pedido.extra[i].valorExtra = mascaraDePreco(pedido.extra[i].valorExtra)
            }
        }
        res.render("pedidos/concluirPedido", {pedido: pedido})
    }).catch((err) => {
        req.flash("error_msg", "Erro ao concluir o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })
})

router.post('/concluirPedido', checarAutenticacao, (req, res) => {
    Pedido.findOne({_id: req.body.id}).lean().then((pedido) => {
        var novaReceita = {
            data: pedido.data,
            descricao: "Venda de sanduíches - " + pedido.cliente,
            tipo: 1,  //Lucro
            valor: pedido.total    
        }
        new Receita(novaReceita).save().then(() => {
            //atualizando status do pedido
            Pedido.updateOne({_id: req.body.id}, {$set:
                {
                    status: true
                
                }}).then(() => {
                    req.flash("success_msg","Pedido Finalizado / Receita Adicionada")
                    res.redirect("/home")
                }).catch((err) => {
                    req.flash("error_msg", "Erro interno ao atualizar o pedido")
                    res.redirect("/home")
                })


        }).catch((err) => {
            req.flash("error_msg", "Erro ao criar a receita")
            res.redirect("/home")
            console.log(err)
        })
        
    }).catch((err) => {
        req.flash("error_msg", "Erro ao concluir o pedido")
        res.redirect("/pedidos/pedidos_do_dia")
    })


})

module.exports = router