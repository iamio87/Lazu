/*jslint node: true, es5: true, nomen: true*/
(function () {
    'use strict';

    var app,
        bodyParser,
        express,
		fs,
		fsPromises,
        http,
        routes,
        session,
        sessionConfig,
        timeout;

    // Require application dependencies.
	fs = require('fs');
	fsPromises = require('fs').promises;
    http = require('http');
	// routes = require('./server/routes');
    express = require('express');
    session = require('express-session');
//    timeout = require('connect-timeout');
	bodyParser = require('body-parser');
	const Model = require("./static/models.js");
	const STATIC = require("./static/static-vars.json"); //// Some definitions to standardize Delta operations
	const DB = require("./db/index");
	const Delta = require("./static/delta.js").default;
	console.log('db', DB);

    // If deployed in our demo site, we store the sessions using Redis.
    // Locally, we store the sessions in memory.
    sessionConfig = {
        resave: false,
        saveUninitialized: true,
        secret: '+rEchas&-wub24dR'
    };

    // Create our application and register its dependencies
	app = express();
    app.use(bodyParser.json());
    app.use(session(sessionConfig));
//    app.use(timeout('30s'));

    // Register our OAUTH2 routes.
/*    app.get('/auth/authenticated', routes.auth.getAuthenticated);
    app.get('/auth/login', routes.auth.getLogin);
    app.get('/auth/callback', routes.auth.getCallback);
    app.get('/auth/logout', routes.auth.getLogout);

    // Register our SKY API routes.
    app.get('/api/constituents/:constituentId', routes.auth.checkSession, routes.api.getConstituent);
    app.get('/api/gifts/:giftId', routes.auth.checkSession, routes.api.getGift);*/

    // Lazu-specific routes
    app.use('/static', express.static('./static') )
    app.get('/workspace/:projectID', function(req, res){
//x		console.log(11, req.session);
		req.session["user"] = 1;
//		DB.User.findByPk(req.params['projectID']).then((rez)=>{
//			console.log(66, rez, Object.keys(rez), rez["dataValues"], rez.save);
//		});
		const stream = fs.createReadStream(__dirname+'templates/workspace.html');
		res.writeHead(200, {'Content-Type': 'text/html'} )
		stream.pipe(res);
    });
    app.get('/project/:projectID', function (req, res) {
		var doc = 'projects/'+req.params['projectID']+'/log';
		const stats = fs.statSync(doc)
		const fileSizeInBytes = stats.size
		const stream = fs.createReadStream(doc);
		res.writeHead(200, {'Content-Type':'application/json'});
		res.write('[');
		stream.on("data", function(chunk) {
			res.write(chunk);
		});
		stream.on('end', function(){
			res.write(',{"'+STATIC.LOG+'":"'+fileSizeInBytes+'"}]');
			res.end();
		});
    })

    app.post('/delta/:projectID', function  (req, res) {
		var body = '';
		var post
		const lockFile = require('proper-lockfile');
        req.on('data', function (data) {
            body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) {
                req.connection.destroy();
	  		}
		});
		
        req.on('end', function () {
			post = JSON.parse(body);
			const dir = 'projects/'+req.params['projectID']+'/'
			const path = 'projects/'+req.params['projectID']+'/log';
			const bytePosition = Number(post[STATIC.LOG]);
//			const validator = post[STATIC.VALIDATOR];
			var deltas = post[STATIC.DELTA];
			const userID = 1; // req.session.user /// TODO
			deltas[0][STATIC.USER] = userID;
			var newDeltas = [deltas];
			var newID;
			lockFile.lock(path) ///// lock Log file --> edits must occur in order.
			.then((release) => {
				if (deltas[0].hasOwnProperty(STATIC.MAKE)) { ///// MK Delta
					const MODEL = deltas[0][STATIC.MODEL];
					const file = dir+"counter";
					return fsPromises.readFile(file, "utf8")
					.then( (counter) => {
						if (counter === ""){
							counter = "1";
						}
						fs.writeFile(file, parseInt(counter)+1, ()=>{}); /// increment counter for next cycle. TODO: am I introducing a race condition by not using fsPromises?
						newID = counter;
						return counter;
					})
					.then( (ID) => { //// accepts counter as ID for new instance of Model.
						deltas[0][STATIC.MAKE] = ID;
						for (var PROPERTY in Model.Model[MODEL].properties){
							if (Model.Model[MODEL].properties[PROPERTY].required){
								var newMetaDelta = {};
								newMetaDelta[STATIC.MODEL] = MODEL;
								newMetaDelta[STATIC.FIELD] = PROPERTY; //// Note Loopback "PROPERTY" == Lazu "FIELD"
								newMetaDelta[STATIC.USER] = userID;
								newMetaDelta[STATIC.EDIT] = ID;
								//// create timestamp only after file lock.
								var newDelta = Model.Model[MODEL].properties[PROPERTY].default;
								newDeltas.push([newMetaDelta, newDelta])
							}
						}
						return release;
					})
					.then( (release)=> {
						return release;
					})
					.catch( (err, bug) => {
						console.log(err);
						return release;
					})
				} else {
					return release;
				}
			})
			.then( (release) => {
				const stream = fs.createReadStream(path, {'start':bytePosition});
				const timestamp = Date.now();
				var oldDeltas = "";
				stream.on('data', function (data) {
					oldDeltas = oldDeltas + data.toString();
					stream.destroy();
				});
				stream.on('none', () => {
					console.log('hi');
				});
				stream.on('close', () => {
					//// TODO: merge Deltas
					//if (oldDeltas.length){
						oldDeltas = JSON.parse("["+oldDeltas+"]");
//						Delta.patchDeltas(oldDeltas, newDeltas); //// TODO: patchDeltas assumes same MODEL & FIELD instance.
					//}

					const mergedDeltas = newDeltas.reduce(function(acc, delta){ JSON.stringify(delta);
						delta[0][STATIC.TIMESTAMP] = timestamp;
						return acc + ",\n" + JSON.stringify(delta);
					}, ""); //// apply timestamp & pretty stringify.
					fsPromises.appendFile(path, mergedDeltas)
					.then( () => {
//						console.log("The file was saved!");
						const stats = fs.statSync(path);
						release(); //// release lock on Log file --> allow other threads to edit.
						const fileSizeInBytes = stats.size;
						res.writeHead(200, {'Content-Type':'application/json'});
						res.write('{"'+STATIC.TIMESTAMP+'":'+deltas[0][STATIC.TIMESTAMP]+',"'+STATIC.LOG+'":'+fileSizeInBytes);
						if (newID){ //// for "MK" operations.
							res.write(',"'+STATIC.MAKE+'":'+newID);
						}
						newDeltas.splice(0,1);
						res.write(',"'+STATIC.DELTA+'":'+ JSON.stringify(oldDeltas.concat(newDeltas)) +'}'); /// return all deltas, except the delta sent in req.
						res.end();
					})
				});
				stream.on('error', (err) => {
					release();
					console.log(err);
					err();
				});
			}).catch(function(err, bug){
				release();
				console.log(err, bug);
				return err
			});
		});
	});
	
	app.post("project", function(req, res){
		//// TODO: authenication & register project in database.
	})
    
    // Register our front-end UI routes.
//    app.use('/', express.static(__dirname + '/ui'));

    // Every route requires authorization.
/*    app.get('/', routes.auth.checkSession, function (request, response) {
        response.json({
            access_token: request.session.ticket
        });
    });*/

    process.env.PORT = '8080';
    
    // Display the startup message.
    function onListen() {
        console.log('Lazu is up and running. http://localhost:%s/', process.env.PORT);
    }

    // Start the server.
    http.createServer(app).listen(process.env.PORT, onListen);
}());
