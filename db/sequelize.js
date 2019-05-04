var Sequelize = require('sequelize');
var sequelize = new Sequelize('lazu', 'thomas', 'enigma', {
    host: 'localhost',
    dialect: 'postgres', //'mysql'|'sqlite'|'postgres'|'mssql',                                      

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    // SQLite only                                                                                     
  //  storage: 'path/to/database.sqlite',

    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators            
    operatorsAliases: false
});

const bcrypt = require("bcrypt");

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


var User = sequelize.define('user', {
    id : {
      primaryKey      : true,
      autoIncrement   : true,
      type            : Sequelize.INTEGER
    },
    givenName: {
      type: Sequelize.STRING
    },
    familyName: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING,
      isUnique :true,
      allowNull:false,
      validate:{
          isEmail : true
      }
    },
    uuid: Sequelize.UUID
});

const Project = sequelize.define('project', {
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
    type:Sequelize.STRING,
    User: {
        type:"foreignKey",
        model:"User"
    }
});


const PRIVILEGE = {
    BLOCK:1,
    NONE:0,
    VIEW:2,
    EDIT:3,
    MANAGE:5,
    OWN:7
}

const Permission = sequelize.define('permission', {
    id : {
        primaryKey      : true,
        autoIncrement   : true,
        type            : Sequelize.INTEGER
    },
    project_id:Sequelize.INTEGER,
    user_id:Sequelize.INTEGER,
    privilege: {
        type: Sequelize.SMALLINT,
        validate:{
            min:0,
            max:7
        }
    }
});

function sync() {
  var FORCE = true;
  // force: true will drop the table if it already exists
//  User.hasMany(Permission, {foreignKey:'id'});
//  Project.hasMany(Permission, {foreignKey:'id', targetKey:});                                            
  User.sync({force: FORCE}).then(() => {
    // Table created

    password = await bcrypt.hash("1234", 12)
    if (FORCE){
      return User.create({
        givenName: 'Tom',
        familyName: 'O\'Reilly',
        email:'iamio@hotmail.com',
        passsword:password;
      });
    }                                                                                  
  }).then(() => {
    return Project.sync({force: FORCE});
  }).then(() => {
    Permission.sync({force:FORCE});
  })
};

/*
const AuthToken = sequelize.define('authtoken', {
  id : {
    primaryKey      : true,
    autoIncrement   : true,
    type            : Sequelize.INTEGER
  },
  user: Sequelize.INTEGER,
//  value: 
  email: {
    type    : Sequelize.STRING,
    isUnique :true,
    allowNull:false,
    validate:{
        isEmail : true
    }
  },
  expiry: Sequelize.DATE,
})

*/
const Task = sequelize.define('task', {
  title: Sequelize.STRING,
  project_id:Sequelize.INTEGER
});

Project.hasMany(Task, { onDelete: 'cascade', hooks: true });
Task.belongsTo(Project);


User.hasMany(Task, { onDelete: 'cascade', hooks: true })
Task.belongsTo(User)

Task.sync({force:true});

module.exports = {
  User:User,
  Project:Project,
  Permission:Permission,
  Task:Task,
  sync:sync
}