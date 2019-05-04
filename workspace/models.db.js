var Sequelize = require('sequelize');


module.exports.Permission = {
    fields: {
        id : {
            primaryKey : true,
            autoIncrement : true,
            type : Sequelize.INTEGER
        },
        privilege: {
            type: Sequelize.SMALLINT,
            validate : {
                min : 0,
                max : 7
            }
        }
    },
    relations: [
        /*{
            type: "foreignKey",
            name: "Permissions",
            model: "Project",
        },
        {
            type: "foreignKey",
            name: "Permissions",
            model: "User"
        }   */
    ]
};

module.exports.Project = {
    fields:{
        id : {
            primaryKey      : true,
            autoIncrement   : true,
            type            : Sequelize.INTEGER
        },
        uuid: Sequelize.UUID,
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        passport: Sequelize.JSONB,
        bibliography: Sequelize.JSONB,
        public: Sequelize.BOOLEAN,
        active: Sequelize.BOOLEAN,
        type:Sequelize.STRING
    },
    relations:[
        {
            type: "M2M",
            name: "Permissions",
            reverse: "Permissions",
            model: "User",
            through:"Permission"
        },
        {
            type:"foreignKey",
            model:"user"
        }
    ]
};
  
  
const PRIVILEGE = {
    BLOCK:1,
    NONE:0,
    VIEW:2,
    EDIT:3,
    MANAGE:5,
    OWN:7
}
  

/*
module.exports.Task = {
    fields:{
        id : {
            primaryKey      : true,
            autoIncrement   : true,
            type            : Sequelize.INTEGER
        },
        description: Sequelize.STRING,
        
    },
    relations:[
        {
            type: "foreignKey",
            name: "Tasks",
            model:"User"
        },
        {
            type: "foreignKey",
            name: "Tasks",
            model:"Project"
        }
    ]
}*/