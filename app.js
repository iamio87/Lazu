const settings = require("./settings");
try {
    const settings = require("./local_settings")
} catch(e){}

const App = (function(){
   
    const http = require('http');
    const express = require("express");
    const app = express();
//    const es6Renderer = require('express-es6-template-engine');
    const Sequelize = require('sequelize');
    const DB = settings.Database;
    const sequelize = new Sequelize(DB.name, DB.user, DB.password, DB.connection);
    const session = require("express-session"),
    bodyParser = require("body-parser"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    passportLocalSequelize = require('passport-local-sequelize');

    app.use(express.static("public"));
    app.use(session({ secret: settings.Hash }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.settings = settings; /// required for workspace/store.js
//    app.engine('html', es6Renderer);
//    app.set('view engine', 'html');
//    const myTemplater = require("./templates/es6render");
//    app.Template = myTemplater;
    const homePage = require("./home/routes").homePage
    var Modules;
    var Models = {};
    app.Models = Models

    async function init (modules){
        console.log('hi')
        const FORCE = true;
        modules.map( (moduleName) => {
            ///// handle model sync
            try {
                var models = require("./"+moduleName+"/models.js");
                Object.keys(models).map(function(modelName){
                    var model = models[modelName];
                    var ORMobject = sequelize.define(modelName, model.fields);
                    Models[modelName] = ORMobject;
                    model.relations.map( (relation) => {
                        if (relation.type == "foreignKey"){
                            Models[relation.model].hasMany(ORMobject, { onDelete: 'cascade', hooks: true, as:relation.name });
                            ORMobject.belongsTo(Models[relation.model]);
                        } else if (relation.type == "M2M"){
                            try {
                                Models[relation.model].belongsToMany(ORMobject, { as:relation.reverse, through:relation.through });
                                ORMobject.belongsToMany(Models[relation.model], { as:relation.name, through:relation.through });
                            } catch(e){
                                console.log('App.js error:', e)
                            }
                        }
                    })
                })
            } catch (e) {}

            //// apply routing
            try {
                const routes = require("./"+moduleName+"/routes");
                app.use("/"+moduleName+"/", routes);
            } catch (e) {  }

            //// apply routing specific for APIs.
            try {
                const routes = require("./"+moduleName+"/api");
                const apiRoute = routes.path || moduleName;
                app.use("/api/"+apiRoute+"/", routes);  
            } catch (e) {  }
        });

        const ModelNames = Object.keys(Models);
        (async function loop() {
            for (let i = 0; i < ModelNames; i++){
                await new Promise( ORMobject.sync({force:FORCE}) );
                if (ModelNames[i] === "User" ){
                    Models["User"].register({
                        username:"thomas",
                        givenName: 'Tom',
                        familyName: 'O\'Reilly',
                        email:'iamio@hotmail.com',

                    }, "enigma", ()=>{});
                }
            }
        })

        ///// Use passport-local-sequelize to glue User model to passport authentication.
        var User = Models["User"];
        passportLocalSequelize.attachToUser(User);
        passport.use(User.createStrategy());
        passport.serializeUser(function(user, done) {
            done(null, user.id);
        });
        passport.deserializeUser(function(id, done) {
            var query = User.findOne({where:{"id":id}});
            query.then((user)=> {
                done(null, user);
            });
            query.catch((err)=> {
                done(err);
            });
        });

        process.env.PORT = '8080';
    
        // Display the startup message.
        function onListen() {
            console.log('Lazu is up and running. http://localhost:%s/', process.env.PORT);
        }
    
        // Start the server.
        http.createServer(app).listen(process.env.PORT, onListen);

        app.use(function(req, res, next){ /// debugging middleware.
//            console.log('same');
            req.app = app; //// attach App to req for use of Models in Views.
//            console.log("req: ", req.url, "\n", req.headers, req.headers.cookie);
            next();
        });
        app.use("/api", function(req, res, next){
            console.log(req.path);
            next()
        })
        app.use('/static', express.static('./static') );

        app.get("/", homePage);
    }

    return {init:init, db:sequelize, express:app, Models:Models}

})();

module.exports = App;

App.init(settings.Modules);