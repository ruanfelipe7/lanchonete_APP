const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Receita = new Schema({
    data:{
        type: Date,
        required: true
    },
    descricao:{
        type: String,
        required: true
    },
    tipo:{
        type: Number,  //0 - Débito ; 1 - Crédito
        required: true
    },
    valor: {
        type: Number,
        required: true
    }
})

mongoose.model("receitas", Receita)