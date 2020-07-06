var Sequelize = require('sequelize');
//var settings = require(".settings");
var fsPromises = require("fs").promises;
const settings = require("../settings");
const DB = settings.Database;
const sequelize = new Sequelize(DB.name, DB.user, DB.password, DB.connection);


const Query = (function(){
    async function findProjectsbyUser(userID){
        
    }
    return {};
})();


function createUser(userObj, password){


}

function getPermission(req) {

}

async function getProject(req){


}

async function createProject(req){


}

    
module.exports = DB;

//module.exports = sequelize;
