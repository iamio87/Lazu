Data = (function(data){

	var public = {sources:{},outline:{}, project:{}, citations:{}, outlineElements:{}, citation_element_relationships:{}};
	

	var States = (function(){
		var self = this;
		var states = {"current":{}};

		function switchDataStore(name){
			var state = states[name];
			self.sources = state.sources;
			self.citations = state.citations;
			self.project = state.project;
			self.outlineElements = state.outlineElements;
			self.outline = state.outline;
			self.citation_element_relationships = state.citation_element_relationships;
		}

		function loadState(data, name){
			if (name == undefined){name= "current"}
			states[name].project = data.project;
			states[name].outline = data.outline;
			states[name].outlineElements = data.outlineElements;
			states[name].sources = data.sources;
			states[name].citation_element_relationships = data.citation_element_relationships;
			states[name].citations = data.citations;

			var keys = Object.keys(states[name].outlineElements);
			var elements = states[name].outlineElements;
			states[name].outline.order = states[name].outline.order.split(',');
//			setTimeout(function(){
				keys.map(function(key){
					if (elements[key].order.length == 0){
						elements[key].order = []
					} else {
						elements[key].order = elements[key].order.split(',');
					}
				})
//			})
			Object.keys(data.citation_element_relationships).map(function(key){
				var rel = data.citation_element_relationships[key];
				if (states[name].citations[rel.citation_id].outlineElements == undefined){states[name].citations[rel.citation_id].outlineElements=[];}
				states[name].citations[rel.citation_id].outlineElements.push(rel.outlineelement_id);
			})
			switchDataStore(name);

		}
		return {
			switchDataStore:switchDataStore,
			loadState:loadState,
		}
	}).call(public)

	public["load"] = States.loadState;


	return public;
})()
