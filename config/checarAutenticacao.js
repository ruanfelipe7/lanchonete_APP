module.exports = {
    checarAutenticacao: function(req, res, next){

        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error_msg", "Você deve estar logado para entrar aqui")
        res.redirect("/")

    }
}