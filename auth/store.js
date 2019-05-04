const PATH = "MEDIA/users/";
const UserNamePath = "MEDIA/usernames/"
const counterFile = PATH+"counter";
const fs = require("fs");
const fsPromises = require('fs').promises;
const bcrypt = require('bcrypt');
const saltRounds = 11;
const lockFile = require('proper-lockfile');
const userFile = "/auth.json";

var User = (function(){
    function verifyPassword(password){
        if (password == "password123"){
            return false;
        } else {
            return true;
        }
    }
    
    async function counterLock(filePath){
        return lockFile.lock(filePath)
        .then( ()=> {
            return fsPromises.readFile(filePath, "utf8")
            .then( (file)=>{return file})
            .catch((err)=>{
                lockFile.unlock(filePath)
            })
        })
        .then( (counter) => {
            if (counter === ""){
                counter = "1";
            }
            return counter;
        })
        .then( (counter) => {
            fs.writeFile(filePath, parseInt(counter)+1, ()=>{ }) /// increment counter for next cycle.
            lockFile.unlock(filePath)
            return counter;
        })
        .catch( (err) =>{
            lockFile.unlock(filePath)
        })
    }
    
    async function create(post){
        var {username, password, password2, email} = post;
        if (password !== password2){
            console.log(2)
            return ["passwords don't match."]
        }
        if (!verifyPassword(password)){
            console.log(3)
            return ["password does not meet criteria."];
        }
        if (/^[a-z0-9]+$/i.test(username) === false){ //// SANITIZE
            console.log(4)
            return ["username must be alphanumeric characters without spaces."]
        }
        fs.readdir(UserNamePath+username, async (err, files)=>{
            if (err === null){
                console.log(5);
                return ["username already exists."]
            }
            console.log(6)
            var hash = await bcrypt.hash(password, saltRounds)
            .catch( (err) =>{
                console.log(err);
            })

            var newID = await counterLock(counterFile)
            .catch( (err) =>{ console.log("lock error", err) })

            const dir = PATH + newID;
            fsPromises.mkdir(dir)
            .then( () => {
                const timestamp = Date.now();
                //// note, we don't user the project.id for "mk" and "ed" attributes. we don't want unnecessary dependency. Numeric ID of project should not matter to internal state of project.
                const init = `[{"mk":"User.${newID}", "T":${timestamp}},{"ed":"User.${newID}.pw", "set":"${hash}"}]`;
                fs.writeFile(dir+userFile, 
                    `{"id":"${newID}",\n"pw":"${hash}",\n"username":"${username}",\n"email":"${email||""}"}`
                    , ()=>{}
                ); //// create Permissions file.
            })
            .then( () =>{
                fs.symlink("../users/"+ newID, "./"+UserNamePath+username, "dir", (err)=>{
                    if (err){

                    }
                })
            })
            .then( ()=>{
                fs.mkdir(dir+"/projects");
            })
            .catch( (err) => {
                console.log("some error", err);
            })
        })
    }

    async function getByUsername(username){
        fs.readFile(UserNamePath+username, (err, file)=>{
            if (err){
                return null;
            } else {
                return JSON.parse(file);
            }
        })
    }

    async function get(id){
        if (/[0-9]+$/i.test(id) === false){
            return null;
        }
        return fs.readFile(PATH+id+userFile, (err, file)=>{
            if (err===null){
                return null, JSON.parse(file);
            } else {
                console.log('get Read File', err, PATH+id);
                return err, null;
            }
        })
    }
    
    async function projectPermission(userID, delta){
        dir = PATH + userID;
        fsPromises.readFile("permissions.json")
        .then( (fi))
    }
    
    async function authenticate(username, pw){
        return fsPromises.readFile(UserNamePath + username+userFile)
        .then( (data)=>{
            const userProfile = JSON.parse(data.toString());
            return bcrypt.compare(pw, userProfile.pw)
            .then( (res) => {console.log('hell', res); if (res){return userProfile} else {return false} })
            .catch( (e) =>{ return false})
        }).catch( (e) =>{
            return false
        })
    }
    
    async function setPassword(userID, pw){
        
    }
    return {create:create, authenticate:authenticate, get:get}
})()


exports.User = User;