module.exports = {
    checarAdmin: function(req, res, next){

        if(req.isAuthenticated() && req.user.admin == 1){
            return next();
        }
        req.flash("error_msg", "Você deve estar logado como Administrador para entrar aqui")
        res.redirect("/home")

    }
}