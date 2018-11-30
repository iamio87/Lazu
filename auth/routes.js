const Route = require("express").Router();
const passport = require("passport");

Route.get("/create", function(req, res){

});
Route.post("/create", function(req, res){

});
/*Route.get("/login", function(req, res){
    res.render(__dirname + "/templates/login", {"locals":{
        url:"/auth/login",
        next:"/auth/"
    }})
});*/
Route.post("login", function(req, res){

});

Route.post('/login',
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true 
    })
);
Route.get('/login',function(req, res){
    res.send(`<html><head></head><body><form action="/auth/login" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="Log In"/>
    </div>
    </form></body></html>`)
});
Route.all("logout", function(req, res){

});
Route.get("passwordReset", function(req, res){

});
Route.post("passwordReset", function(req, res){

});
Route.get("passwordChange", function(req, res){

});
Route.post("passwordChange", function(req, res){

});
Route.all("/", function(req, res){
    res.send("baller");
})

module.exports = Route;