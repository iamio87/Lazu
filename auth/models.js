var Sequelize = require('sequelize');

module.exports.User = {
    fields:{
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        hash: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        salt: {
            type: Sequelize.STRING,
            allowNull: false
        },
        activationKey: {
            type: Sequelize.STRING,
            allowNull: true
        },
        resetPasswordKey: {
            type: Sequelize.STRING,
            allowNull: true
        },
        verified: {
            type: Sequelize.BOOLEAN,
            allowNull: true
        },
        givenName: {
          type: Sequelize.STRING
        },
        familyName: {
          type: Sequelize.STRING
        },
        email: {
          type: Sequelize.STRING,
          unique :true,
          allowNull:false,
          validate:{
              isEmail : true
          }
        },
        uuid: Sequelize.UUID
    },
    relations:[]
  };

