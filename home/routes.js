const Route = require("express").Router();
const fs = require("fs");
//const template = require('../templates/es6render');
const render = require("./templates");
function compile_template(s, params) {//// accepts string and array of parameter names (as strings).
    return Function(...params, "return `"+s+"`"); //// converts string to template literal.
}
const homePageTemplate = compile_template( fs.readFileSync("./home/home_template.html"), ["projects"]);


Route.get('/:projectID', function(req, res){
    const stream = fs.createReadStream(__dirname+'/templates/workspace.html');
    res.writeHead(200, {'Content-Type': 'text/html'} )
    stream.pipe(res);
});

async function homePage (req, res){
    if (req.session.passport){
        const userID = req.session.passport.user;
/*        fs.readdir('projects', (err,files)=>{
            var projects = await files.reduce( (acc, fileName)=>{
                acc.push(JSON.parse( fs.readFile('projects/'+fileName) ) );
                return acc;
            }, [])
            res.send(homePageTemplate(projects) );
        })*/
        fs.readFile("MEDIA/users/"+userID+"/projects.json", (err, file)=>{
            if (err === null){
                const projects = JSON.parse(file);
                console.log(projects);
                res.send(homePageTemplate(projects) );
            } else {
//                req.session.passport["projects"] = {};
                    res.send(homePageTemplate([]) );
            }
            
        })
/*        req.app.Models.Permission.findAll({
            where:{
                UserId:req.session.passport.user
            }
        }).then( (permissions) =>{
            return permissions.reduce( (acc, permission) => {
                if (permission.privilege > 1){
                    acc.push( permission.ProjectId );
                    return acc;
                }
            }, [])
        }).then( (permittedProjects) =>{
            return req.app.Models.Project.findAll({
                where:{
                    id:permittedProjects
                }
            })
        }).then( (projects) => {*/

//        }).catch( (err) =>{
//            res.send("error");
//        })
    } else {
        return res.send("not logged in");
    }
}

Route.get('/', homePage);

Route.homePage = homePage;
module.exports = Route;