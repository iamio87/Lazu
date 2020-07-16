var settings = require("./settings");
try {
    settings = require("./local_settings")
} catch(e){}
const DEBUG = true;

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
                console.log(moduleName, routes);
            } catch (e) {
                console.log(e);
            }

            //// apply routing specific for APIs.
            try {
                const routes = require("./"+moduleName+"/api");
                const apiRoute = routes.path || moduleName;
                app.use("/api/"+apiRoute+"/", routes);  
                console.log(moduleName, apiRoute)
            } catch (e) { 
                console.log('Error loading API for ', moduleName, e)
             }
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
//        passport.use(User.createStrategy());
        passport.use(new LocalStrategy(
            (username, password, done) => {
                if (DEBUG){
                    return done(null, {'username':username,'id':1});
                }
                var User = require('./auth/store').User;
                return User.authenticate(username, password)
                .then( (auth) =>{
                    if (auth !== false) {
                        return done(null, auth);
                    } else {
                        return done(null, false);
                    }
                })
            }
        ))

        
        passport.serializeUser(function(user, done) {
            console.log('serialize', user);
            done(null, user.id);
        });

        passport.deserializeUser(function(id, done) {
//            console.log("DU", id, done)
            var User = require('./auth/store').User;
            try {
                var profile = User.get(id);
                done(null, profile)
/*                .catch( (err) =>{
                    console.log('DESERIALIZE ERROR1', err);
                    done(err, null);
                })*/
            } catch(e){
                console.log('DESERIALIZE ERROR', e)
                done(e, null)
            }
        });

        process.env.PORT = '8080';
    
        // Display the startup message.
        function onListen() {
            console.log('Lazu is up and running. http://localhost:%s/', process.env.PORT);
        }
    
        // Start the server.
        http.createServer(app).listen(process.env.PORT, onListen);

        app.use(function(req, res, next){ /// debugging middleware.
            req.app = app; //// attach App to req for use of Models in Views.
//            console.log(req.session, req.sessionID);
            next();
        });
        app.use("/api", function(req, res, next){
            //console.log(req.path);
            next()
        })
        app.use('/static', express.static('./static') );

        app.get("/", homePage);
    }

    return {init:init, db:sequelize, express:app, Models:Models}

})();

module.exports = App;

App.init(settings.Modules);