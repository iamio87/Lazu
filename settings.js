module.exports = {
    "Database": {
        "name":"lazu",
        "user": "thomas",
        "password": "enigma",
        "connection":{
            "host": "localhost",
            "dialect": "postgres",
            "pool": {
                "max": 5,
                "min": 0,
                "acquire": 30000,
                "idle": 10000
            },
            "logging":false
        }
    },
    "Modules":[
	"auth","workspace","home", "print"
    ],
    "Hash":"I02nwQ0HIvpBfaeB1Jbq",
    "ProjectPath":"./projects/",
    "UserPath":"./users/"
}
