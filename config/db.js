const { mongo } = require("mongoose");

if(process.env.NODE_ENV == "production"){
    module.exports = {mongoURI: "mongodb+srv://ruan_felipe07:sitedalanchoneteapppassword0728@cluster0.p4eke.mongodb.net/lanchonete_app?retryWrites=true&w=majority"}
}else{
    module.exports = {mongoURI: "mongodb://localhost/lanchoneteAPP"}
}