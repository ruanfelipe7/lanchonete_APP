const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Pedido = new Schema({
    status: {
        type: Boolean,
        required: true,
        default: false
    },
    cliente: {
        type: String,
        required: true
    },
    descricao: {
        type: Object
    },
    extra:{
        type: Object,
    },
    data:{
        type: Date,
        required: true
    },
    total:{
        type: Number,
        required: true
    }
})

mongoose.model("pedidos", Pedido)