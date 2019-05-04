Log = (function(){
	var registry;
	var states;
	var cursor;
	var timelines = (function(){
		var Tlines = {};

		function createTimeline(name){
			Tlines[name]= {"states":{},"registry":[]};
			return Tlines[name]
		}
		function switchToTimeline(name){
			if (Tlines.hasOwnProperty(name)){
				registry = Tlines[name].registry;
				states = Tlines[name].states;
				return true;
			}
			return false;
		}
		createTimeline("log")
		switchToTimeline("log")

		return {
			createTimeline:createTimeline,
			switchToTimeline:switchToTimeline,
		}
	})()

	function append(updates){
		var state = "";
		if (Array.isArray(updates)){
			updates.map(function(update){
				if (update.T != undefined){
					state = update.T;
					if (registry.indexOf(state) == -1){
						registry.push(state)
						states[state] = []
					} else {
						state += "-A";
						registry.push(state)
						states[state] = []
					}
				}
				states[state].push(update)
			})
		} else if (updates.hasOwnProperty("T")){
			state = update.T
			if (registry.indexOf(state) == -1){
				registry.push(state)
				states[state] = []
			} else {
				state += "-A";
				registry.push(state)
				states[state] = []
			}
			states[state].push(update)		
		}
	}

	function prepend(updates){
		var state = "";
		var oldstate = "";
		if (Array.isArray(updates)){
			updates.map(function(update){
				if (update.T != undefined){
					state = update.T;
					if (registry.indexOf(state) == -1){
						var index = registry.indexOf(oldstate);
						registry.splice(index+1, 0, state);
						states[state] = [];
					} else {
						var index = registry.indexOf(state);
						registry.splice(index+1, 0, state+"-A");
						states[state+"-A"] = [];
					}
				}
				states[state].push(update);
				oldstate = state;
			})
		} else if (updates.hasOwnProperty("T")){
			state = update.T
			if (registry.indexOf(state) == -1){
				registry.splice(0,0,state)
				states[state] = []
			} else {
				var index = registry.indexOf(state);
				state += "-A";
				registry.splice(index, 0, state)
				states[state] = []
			}
			states[state].push(update)		
		}
	}

	function next(){
		if (cursor == undefined){
			cursor = 0;
		}
		var state = registry[cursor+1];
		return states[state];
	}

	function prev(){
		if (cursor == undefined){
			cursor = registry.length-1;
		}
		var state = registry[cursor-1];
		return states[state];
	}
	
	return {
		append:append,
		preprend:prepend,
		next:next,
		prev:prev,
		registry:registry,
		timelines:timelines,
	}

})()
