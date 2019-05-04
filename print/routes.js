const Route = require("express").Router();
const fs = require("fs");
const Shadow = require("../static/shadow");
const ooxml = require("./ooxml").default;

Route.get('/:projectID/:nodeID', function(req, res){
//    DB.User.findByPk(req.params['projectID']).then((rez)=>{
//			console.log(66, rez, Object.keys(rez), rez["dataValues"], rez.save);
//    });
    var doc = 'projects/'+req.params['projectID']+'/log';
    var filename = req.params['projectID'];
    var nodeID = req.params['nodeID'];
    var readStream = fs.createReadStream(doc, 'utf8');
    var STATE = {Node:{
		"0":{
			children:[],
		}
	}};
    let data = '['
    readStream.on('data', function(chunk) {
        data += chunk;
    }).on('end', function() {
        data += "]"
        JSON.parse(data).map(function(delta){
            Shadow.App.consumeDelta(STATE, delta);
        })
        Deltas = Shadow.App.serializeNodes(STATE, nodeID).reduce(function(acc, node){
            if (node.heading){
                acc = acc.concat(node.heading);
                acc = acc.concat(node.content);
            }
            return acc;
        },[]);
        ooxml.print(filename, Deltas);
        res.send(200, "done!")
    });
});

module.exports = Route;