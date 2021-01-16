const mongoose = require("mongoose")
const Schema = mongoose.Schema
const bcrypt = require("bcryptjs")



//Configurando o mongoose
    mongoose.Promise = global.Promise
    mongoose.connect("mongodb://localhost/lanchoneteAPP", {
        useNewUrlParser: true
    }).then(() => {
        console.log("Conecatado ao banco de dados com sucesso");
        
    }).catch((err) => {
        console.log("Houve um erro ao se conectar ao mongoDB: " +err);
        
    })

//Model - Usuarios

const Usuario = new Schema({
    nome:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    admin:{
        type: Number,
        default: 1
    },
    nomeUsuario: {
        type: String,
        required: true
    },
    senha:{
        type: String,
        required: true
    }
})

//Collection
mongoose.model('usuarios', Usuario)
const Usuario2 = mongoose.model("usuarios")

//Novo usuario
var novoUsuario = {
    nome: "Administrador",
    email: "admin@admin",
    nomeUsuario: "admin",
    senha: "12345"
}

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if(erro){
				console.log("ERRO 1")
                        }else{
                            novoUsuario.senha = hash
                            new Usuario2(novoUsuario).save().then(() => {
                                console.log("Usuario criado com sucesso")
                            }).catch((err) => {
				console.log("Erro 2")
                            })
                        }
                    })
                })

