const Route = require("express").Router();
const fs = require("fs");

Route.get('/:projectID', function(req, res){
    req.session["user"] = 1;
//    DB.User.findByPk(req.params['projectID']).then((rez)=>{
//			console.log(66, rez, Object.keys(rez), rez["dataValues"], rez.save);
//    });
    const stream = fs.createReadStream(__dirname+'/templates/workspace.html');
    res.writeHead(200, {'Content-Type': 'text/html'} )
    stream.pipe(res);
});

Route.get('/', function(req, res){
    res.send("cleanser");
});

module.exports = Route;