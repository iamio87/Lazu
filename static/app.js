var App = (function(){

	//// My application is taking a page from quill.js, and using prototype objects with defined API access points to implement functionality.
	//// App is the top-level controller object of the Lazu/Lawccess application.
	//// It is composed of modules Project, Outline, Source, and Citation.
	//// It handles views of "project", "outline", "sources", and "source".

	//// The previous lawcess_data.js controller was very successful. However, this new controller is intended to leverage the features provided by our transition to the Delta format.
	//// In particular, instead of Versions saving complete states at any particular time - we think that delta tranformations are efficient enough to simply save Versions as deltas.
	//// We should keep lawccess_data.js around just in case this assumption proves to not be true.
	//// In addition, data.js is designed specifically for lawccess_data.js. 
	

	//// Modules will no longer talk directly to the server. Instead, they will send their updates through App().
	//// Our design goal is minimize network bandwidth - b/c I know how it feels to have crappy connection
	//// Each communication to the server may receive content updates made by other users.
	//// Modules may not know how to apply updates intended for other modules.
	//// App() has registered modules that know how to apply those updates.
	//// App will also track any state information.

	var STATIC = Shadow.STATIC; //// inherit Delta STATIC definitions.

	var State = {
		'ops':[],
		'undos':[],
	}

	var Modules = (function(){
		return {};
	})(); //// registry of model components of app.

	var editable;

	var Signal; //// = Signal();

	var Send;

	function update(Deltas){
		Deltas.map(function(deltas){
			var target = Shadow.App.getDeltaTarget(deltas[0]);
			var model = target.model;//delta[0][App.STATIC.MODEL];
			Modules[model].update(deltas, target);
		});
	}

	function Receive(){
		if (updates){
			App.undo();
			App.applyUpdates(updates);
		}
	}

	function register(modelName, object){
		Modules[modelName] = object;
	}

	var STATE = {Node:{
		"0":{
			children:[],
		}
	}};
	function init() {
		return $.get("/api/project/"+window.location.pathname.split("/")[2], {}).then(function(response, code){
			Outline.createOutline("Project Title");
			var BytePosition = response.splice(-1).pop()[App.STATIC.LOG];/// get byte position object & remove from deltas array.
			response.map(function(delta){
				var target = Shadow.App.getDeltaTarget(delta[0]);
				var model = target.model; //delta[0][App.STATIC.MODEL];
				if (model === undefined){console.log("delta", delta)}
				var undo = Modules[model].update(delta, target);
				State.ops.push(delta);
				State.undos.push(undo);
			});
			Lawccess.context.logPos = BytePosition;
			Lawccess.context.timestamp = response.slice(-1).pop()[0][App.STATIC.TIMESTAMP];
		}).then(function(response){
			return response;
		});
	}
	
	return {init:init, Modules:Modules, register:register, update:update, applyDeltas:update, STATIC:STATIC, STATE:STATE}

})();


App.register('Node', {
	'update':function(delta, target){
		if (target.verb === "ed"){
			if (target.field == 'heading'){
				var element = document.getElementById("Node.h."+target.id);
			} else {
				var element = document.getElementById("Node.c."+target.id);
			}
			return Shadow.State.update(element, delta);
		} else {
			return Outline.applyDeltas([delta])
		}
	},
});

App.register('Source', {
	'update':function(delta){
		Source.State.update(delta);
	}
})

$(document).ready(function(){
	App.init();
});