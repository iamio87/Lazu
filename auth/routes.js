const Route = require("express").Router();
const passport = require("passport");
const db = require("./store"),
bodyParser = require('body-parser'),
jsonParser = bodyParser.json({inflate:true, strict:true, limit:"50kb"}); // create application/json parser

Route.get("/create/", function(req, res){
    res.send(`<html><head></head><body><form action="/auth/create/" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
    <label>Password:</label>
        <input type="password" name="password2"/>
    </div>
    <div>
        <input type="submit" value="Create User"/>
    </div>
    </form></body></html>`);
});

Route.post("/create", jsonParser, function(req, res){
    const post = req.body;
    if (post.password1 === post.password2){
        res.send("passwords don't match!");
    }
    db.User.create(post);
    res.send('nothing yet');
});
/*Route.get("/login", function(req, res){
    res.render(__dirname + "/templates/login", {"locals":{
        url:"/auth/login",
        next:"/auth/"
    }})
});*/

Route.post('/login',
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true 
    })
);

Route.get('/login', function(req, res){
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
Route.all("/logout", function(req, res){
    req.logout();
    res.redirect("/");
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