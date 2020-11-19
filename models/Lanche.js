const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Lanche = new Schema({
    nome:{
        type: String,
        required: true
    },
    tipoDePao:{
        type: String,
        required: true
    },
    ingredientes:{
        type: String,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    chave: {
        type: Number,
        required: true
    }
})

mongoose.model("lanches", Lanche)