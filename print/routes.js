const Route = require("express").Router();
const fs = require("fs");
const Shadow = require("../static/shadow");
const ooxml = require("./ooxml").default;

Route.get('/:projectID', function print (req, res){
//    DB.User.findByPk(req.params['projectID']).then((rez)=>{
//			console.log(66, rez, Object.keys(rez), rez["dataValues"], rez.save);
//    });
console.log(1);
    var doc = 'projects/'+req.params['projectID']+'/log';
    console.log(2);
    var filename = req.params['projectID'];
    var nodeID = req.params['nodeID'] || 0;
    var readStream = fs.createReadStream(doc, 'utf8');
    var STATE = {Node:{
		"0":{
			children:[],
		}
	}};
    let data = '['
    readStream.on('data', function(chunk) {
        console.log(3);
        data += chunk;
    }).on('end', function() {
        data += "]"
        console.log('blueberries');
        JSON.parse(data).map(function(delta){
            Shadow.App.consumeDelta(STATE, delta, true);
        })
        // console.log(44, STATE["Node"], "\n")
        Deltas = Shadow.App.serializeNodes(STATE, nodeID).reduce(function(acc, node){
            // console.log(44, node);
            if (node.heading){
                acc = acc.concat(node.heading);
                acc = acc.concat(node.content);
            }
            return acc;
        },[]);
        var _Deltas = Deltas.filter( (delta)=>{
            if (typeof(delta)!= "undefined"){
                return delta.hasOwnProperty("ins");
            }
            return false;
        })
        console.log('SMH', _Deltas);
        ooxml.print(filename, _Deltas);
        res.send(200, "done!")
    });
});


module.exports = Route;