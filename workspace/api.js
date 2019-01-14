const fs = require("fs"),
lockFile = require('proper-lockfile'),
Route = require("express").Router(),
bodyParser = require('body-parser'),
jsonParser = bodyParser.json({inflate:true, strict:true, limit:"50kb"}), // create application/json parser
settings = require("../settings"),
ProjectPath = settings.ProjectPath,
projectCounter = ProjectPath+"counter",
fsPromises = require('fs').promises;
Route.path = "project";
const Model = require("../static/models.js");

const {Project, Permission, User} = require("./store");


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

function getAuthorization(PrivilegeLevel){
    return async function _getAuthorization(req, res, next) {
        if (req.params.hasOwnProperty('projectID') ){
            var userID
            if (req.hasOwnProperty('session')){
                if (req.session.hasOwnProperty("passport")){
                    userID = req.session.passport.user;
                }
            }
            if (userID === undefined){
                res.status(403);
                res.send("Please login to access.");
                return;
            }
            const projectID = req.params["projectID"];
            if (req.session.passport.hasOwnProperty("user")) {
                if (!req.session.passport.hasOwnProperty("projects")) {
                    req.session.passport.projects = {};
                }
                if (!req.session.passport.projects.hasOwnProperty(projectID)) {
                    req.app.Models.Permission.findOne({
                        where:{
                            UserId : userID,
                            ProjectId : projectID
                        }
                    }).then( (permission) => {
                        req.session.passport.projects[projectID] = permission.privilege;
                    }).catch( () => {
                        req.session.passport.projects[projectID] = 0;
                    })
/*                    const path = ProjectPath+projectID+"/permissions.json"
                    fsPromises.readFile(path).then( (data) => {
                        const permissions = JSON.parse(data);
                        req.session.passport.projects[projectID] = permissions[userID] || 0; //
                    }).catch( (err) => {
                        console.log(err);
                        next(err);
                        return ;
                    }); //// load Permissions JSON.*/
                }
            }
            if (req.session.passport.projects[projectID] < PrivilegeLevel) {
                res.status(403);
                res.send("You are not authorized.");
                return;
            }
        }
        next();
        return;
    }
}

async function counterLock(filePath){
    const release = await lockFile.lock(filePath);
    return fsPromises.readFile(filePath, "utf8")
    .then( (counter) => {
        if (counter === ""){
            counter = "1";
        }
        return counter;
    })
    .then( (counter) => {
        fs.writeFile(filePath, parseInt(counter)+1, ()=>{ }) /// increment counter for next cycle.
        release();
        return counter;
    })
    .catch( (err) =>{
        release();
    })
}

Route.use("/delta/:projectID", getAuthorization(4)); //// for POST of deltas to project - requires write permission
Route.use("/:projectID(\\d+)", getAuthorization(3)); //// for GET of entire project history - requires read permission

Route.get('/:projectID', async function (req, res) {
    var doc = 'projects/'+req.params['projectID']+'/log';
    const stats = fs.statSync(doc);
    const fileSizeInBytes = stats.size;
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

Route.post('/delta/:projectID', jsonParser, async function  (req, res) {
    var post = req.body;
    const dir = ProjectPath+req.params['projectID']+'/'
    const path = ProjectPath+req.params['projectID']+'/log';
    const bytePosition = Number(post[STATIC.LOG]);
    var deltas = post[STATIC.DELTA];
    const userID = 1; // req.session.user /// TODO
    deltas[0][STATIC.USER] = userID;
    var newDeltas = [deltas];
    var newID;

    var release = await lockFile.lock(path);
    if (deltas[0].hasOwnProperty(STATIC.MAKE)) { ///// MK Delta
        const MODEL = deltas[0][STATIC.MODEL];
        const file = dir+"counter";
        const ID = await counterLock(file).catch( (err) =>{ console.log(15, err)});

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
    }
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
            const stats = fs.statSync(path);
            release(); //// release lock on Log file --> allow other threads to edit.
            const fileSizeInBytes = stats.size;
            res.writeHead(200, {'Content-Type':'application/json','Connection':"close"});
            res.write('{"'+STATIC.TIMESTAMP+'":'+deltas[0][STATIC.TIMESTAMP]+',"'+STATIC.LOG+'":'+fileSizeInBytes);
            if (newID){ //// for "MK" operations.
                res.write(',"'+STATIC.MAKE+'":'+newID);
            }
            newDeltas.splice(0,1);
            res.write(',"'+STATIC.DELTA+'":'+ JSON.stringify(oldDeltas.concat(newDeltas)) +'}'); /// return all deltas, except the delta sent in req.
            res.end();
        })
        .catch( (err) => {
            release();
            console.log(err);
            err();
        })
    });
    stream.on('error', (err) => {
        release();
        console.log(6, err);
        err();
    });
});

Route.get("/", function (req, res){
    res.send('clear blue sky');
});

Route.post("/", jsonParser, async function (req, res){
    console.log('brewster')
    const post = req.body;
//    res.send('hello'); return;
    req.app.Models.Project.create(req.app, req.session.passport.user, post)
/*    req.app.Models.Project.create({title:post.title, description:post.description, UserId:req.session.passport.user})
    .then( (project) => {
        return project
    })
    .catch( async () => { //// if no DB, use file system
        const ID = await counterLock(file).catch( (err) =>{ console.log(44, err)});
        project = {id:ID, title:post.title, description:post.description, UserId:req.session.passport.user};
        return project;
    })
    .then( (project) => {
        const dir = ProjectPath+project.id
        fsPromises.mkdir(dir)
        .then( () => {
            const timestamp = Date.now();
            //// note, we don't user the project.id for "mk" and "ed" attributes. we don't want unnecessary dependency. Numeric ID of project should not matter to internal state of project.
            const init = `[{"M": "Project", "mk":true, "u":${req.session.passport.user}, "T":${timestamp}}],
                [{"M": "Project", "F": "title", "ed":true, "u": ${req.session.passport.user}, "T": ${timestamp}}, {"ins": ${project.title}}],
                [{"M": "Project", "F": "description", "ed":true, "u": ${req.session.passport.user}, "T": ${timestamp}}, {"ins": ${project.description}}],\n`
            fs.writeFile(dir+"/log", init, ()=>{}); //// create Project log
            fs.writeFile(dir+"/counter", "1", ()=>{}); //// create object counter
            fs.writeFile(dir+"/permissions.json", `{${request.session.passport.user}:7}`, ()=>{}); //// create Permissions file, which is backup to DB. Not required.
        })
        return project;
    })*/
    .then( (project) => {
        res.status(200);
        res.send(project.id);
    })
    .catch( () => {
        res.send('error');
    })
});

Route.delete("/:projectID", async function (req, res){
    const post = req.body;
    Permission.read(req.app, req.params.projectID, req.sessions.passport.user)
    .then( (permission) => {
        if (permission.privilege < 7){
            throw({});
        }
    })
    .catch( () => {
        res.status(403);
        res.send("Unsufficient privilege.");
    })
    .then( () => {
        return Project.delete(req.app, req.sessions.passport.user, req.params.projectID )
    })
    .then( () => {
        res.send(true);
    })
    .catch( () => {
        res.send('error');
    })
});

module.exports = Route;
//module.exports = counterLock;