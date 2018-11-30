const fs = require("fs"),
lockFile = require('proper-lockfile'),
Route = require("express").Router(),
bodyParser = require('body-parser'),
jsonParser = bodyParser.json({inflate:true, strict:true, limit:"50kb"}), // create application/json parser
fsPromises = require('fs').promises;
Route.path = "project";

const STATIC = {
    LOG:"L",
    TIMESTAMP:"T",
    DELTA:"D",
    MODEL:"M",
    FIELD:"F",
    MAKE:"mk",
    EDIT:"ed",
    USER:"u"
}
//var LOG = "L"; //// TODO: reference Delta.js

Route.get('/:projectID', function (req, res) {
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

Route.get('/delta/:projectID', function(req, res){
    res.send("Cannot serve Get Request")
})
Route.post('/delta/:projectID', jsonParser, function  (req, res) {
    var post = req.body
    const dir = 'projects/'+req.params['projectID']+'/'
    const path = 'projects/'+req.params['projectID']+'/log';
    const bytePosition = Number(post[STATIC.LOG]);
//			const validator = post[STATIC.VALIDATOR];
    var deltas = post[STATIC.DELTA];
    const userID = 1; // req.session.user /// TODO
    deltas[0][STATIC.USER] = userID;
    var newDeltas = [deltas];
    var newID;
    console.log("clear blue skies2");
    lockFile.lock(path) ///// lock Log file --> edits must occur in order.
    .then((release) => {
        console.log("clear blue skies3");
        if (deltas[0].hasOwnProperty(STATIC.MAKE)) { ///// MK Delta
            const MODEL = deltas[0][STATIC.MODEL];
            const file = dir+"counter";
            return fsPromises.readFile(file, "utf8")
            .then( (counter) => {
                console.log("clear blue skies4");
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

Route.get("/", function (req, res){
    res.send('clear blue sky');
});

Route.post("/", function (req, res){
    //// TODO: make project
    res.send('clear blue sky');
});
module.exports = Route;