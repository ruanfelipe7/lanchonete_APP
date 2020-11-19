const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Caixa = new Schema({
    data:{
        type: Date,
        required: true
    },
    lucroTotal:{
        type: Number,
        required: true
    },
    despesaTotal:{
        type: Number,  
        required: true
    },
    saldoTotal: {
        type: Number,
        required: true
    }
})

mongoose.model("caixas", Caixa)