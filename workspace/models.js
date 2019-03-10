//// Because we have a mix of file and DB storage, the save() logic gets pretty complicated. 
//// routes.js and api.js are supposed to define public URL-accessible endpoints. Adding complicated model logic makes them messy.
//// models.js is supposed to be bare-bones JSON description of models.
//// store.js deals with the permanent storage of model instances. It handles the messiness of having a hybrid file-system/db store.
const fs = require('fs');
const userPath = "MEDIA/users/"


/*function getDir(settings){
    return settings.ProjectPath
    settings.UserPath
    settings.PermissionPath
}*/
const Permission = (function(){
    function create (app, ProjectId, UserId, privilege){
//        const dir = app.settings.ProjectPath+projectID
//        fs.writeFile(dir+"/permissions.json", `{${userID}:${privilege}}`, ()=>{}); //// create Permissions file, which is backup to DB. Not required.
        app.Models.Permission.create({UserId:UserId, ProjectId:ProjectId, privilege:privilege})
        .then( (permission) =>{
            return permission
        })
    }

    function read (app, ProjectId, UserId){
        if (UserId !== undefined){
            return app.Models.Permission.findOne({where:{
                UserId:UserId, ProjectId:ProjectId
            }}).then( (permission) => {return permission})
        } else {
            return app.Models.Permission.findAll({where:{
                ProjectId:ProjectId
            }}).then( (permissions) => {return permissions})
        }
    }

    function update (app, permission, privilege){
        
    }

    function _delete (app, permission) {

    }
    return {create:create, read:read, update:update, delete:_delete}
})();

const Project = (function(){
    function create(app, UserId, projectObj){
        return app.Models.Project.create({title:post.title, description:post.description, UserId:req.session.passport.user})
        .then( (project) => {
            return project
        })
        .catch( async () => { //// if no DB, use file system. TODO: remove?
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
                fs.writeFile(dir+"/meta", init, ()=>{}); //// create meta file
                fs.writeFile(dir+"/log", "", ()=>{}); //// create Project log
                fs.writeFile(dir+"/counter", "1", ()=>{}); //// create object counter
            })
            .then( ()=>{
                fs.symlink(dir, userPath+UserId+"/projects/"+project.id)
            })
            return project;
        })
        .then( (project) => {
            Permission.create(app, UserId, project.id, 7)
            return project
        })
    }

    function read(){

    }

    function update(){

    }

    function _delete() {

    }
    return {create:create, read:read, update:update, delete:_delete}
})();

const User = (function(){
    function create(){

    }

    function read(){

    }

    function update(){

    }

    function _delete() {

    }
    return {create:create, read:read, update:update, delete:_delete}
})();

const Delta = (function(){
    return function update(){

    }
})()