$(document).ready(function(){
	if (Lawccess.data == null){
		Signal.send('data','load')
		$.get(Lawccess.context.ajaxURL+"get_project_data/"+Lawccess.context.project, {}, function(response){
			Data.load(response);
			Lawccess.data = Data;
			Lawccess.Controller.launch_application(Data);
			localStorage.setItem(Lawccess.context.project, JSON.stringify( Lawccess.data))
			Signal.send('data','finished')
		})
	} else {
		Lawccess.Controller.launch_application(Lawccess.data)
	}
})
Lawccess.fn = {}
Lawccess.fn.outline = []
Lawccess.fn.updates = []

Lawccess.Controller = {}
Lawccess.Controller.launch_application = function(data){
	if (Lawccess.context.location == "source"){
        Source.createSourcePage(data, Lawccess.context.source)
		Outline.createOutline(data.project.title)
    } else if (Lawccess.context.location == "outline"){
		Outline.createOutline(data.project.title)
    } else if (Lawccess.context.location == "project"){
		Outline.createOutline(data.project.title)
    } else if (Lawccess.context.location == "sources"){
		Sources.createSources(data)
    } else if (Lawccess.context.location == "project"){
		ProjectView.createProjectView(data)
    }
}
Lawccess.Controller.change_context_location = function(new_context){
    var old_context = Lawccess.context.location
	var data = Lawccess.Controller._get_data_set()
	var hash = new_context.split("#")[1] || false;
	new_context = new_context.split("#")[0]
    Lawccess.context.location = new_context
    if (new_context == "outline"){
		document.getElementById('outline-container').setAttribute('class','outline_context')
//		document.getElementById('outline-container').style = ""
		document.getElementById('outline-container').style.display="block"
		document.getElementById('source-container').innerHTML=""
		document.getElementById('sources-container').style.display="none";
		document.getElementById('projectview-container').innerHTML='';
		$('input.citation-outline-relationship').addClass('ignore-this');
		$("section#outline-container")[0].style.position = "";
		Outline.set_outline_size()
		if (hash){
			Outline.go_to_location_hash(hash)
		}
    } else if (new_context == "sources"){
		document.getElementById('outline-container').style.display='none';
		document.getElementById('source-container').innerHTML=""
		document.getElementById('sources-container').style.display="block"
		document.getElementById('projectview-container').innerHTML='';
		if (document.getElementById('sources-container').children.length == 0){
			Sources.createSources(data)
		}
    } else if (new_context == "source"){
		if (hash){
			Lawccess.context.source = hash
		}
		document.getElementById('outline-container').style.display='none';
		document.getElementById('outline-container').setAttribute('class','source_context')
		document.getElementById('sources-container').style.display="none";
		document.getElementById('projectview-container').innerHTML='';
        Source.createSourcePage(data)
		document.getElementById('outline-container').setAttribute('class','source_context');
		$("section#outline-container.source_context")[0].style.width = window.innerWidth-222 +"px";
		$("section#outline-container.source_context")[0].setAttribute("_width",window.innerWidth-222);
		$("section#outline-container.source_context")[0].style.position = "absolute";
		$('input.citation-outline-relationship').removeClass('ignore-this');
    } else if (new_context == "project_details"){
		if (old_context != "project_details"){
			document.getElementById('outline-container').style.display='none';
			document.getElementById('sources-container').style.display='none';
			document.getElementById('source-container').innerHTML = '';
		    ProjectView.createProjectView(Lawccess.data);
		}
    }

// We used to invoke launch_application(), but it would cause the application to keep recreating Outline.
// That means users would lose their place in Outline.
//    Lawccess.Controller.launch_application(Lawccess.Controller._get_data_set())
}
Lawccess.Controller._get_data_set = function(){
    if (Version.current_version == 0){
		return Lawccess.data
    } else {
		return Version.library[Version.current_version]
    }
}
Lawccess.Controller.refresh_data_set = function(){
    $.get(Lawccess.context.ajaxURL+"get_project_data/"+Lawccess.context.project, {}, function(response){
        Lawccess.data = response
		Lawccess.Controller.launch_application(Lawccess.data)
    })
}

Lawccess.Controller.ChangeView = (function(){
	
	function source(id, citation_id){
		var data = Lawccess.Controller._get_data_set()
		document.getElementById('outline-container').style.display='none';
		document.getElementById('outline-container').setAttribute('class','source_context')
		document.getElementById('sources-container').style.display="none";
		document.getElementById('projectview-container').innerHTML='';
		Lawccess.context.location="source";
		Lawccess.context.source = id;
        Source.createSourcePage(data, citation_id)
		$('input.citation-outline-relationship').removeClass('ignore-this');
	}

	function citation(citation_id){
		try {
			var citation = Lawccess.Controller._get_data_set().citations[citation_id]
			var source_id = citation.source_id
			source(source_id, citation_id)
			return 1;
		} catch(e) {
			alert("Source may have been deleted")
			return 0;
		}
	}

	function outlineElement(oe_id){ //// not used yet
		Lawccess.context.location = "outline"
		document.getElementById('outline-container').setAttribute('class','outline_context')
		document.getElementById('outline-container').style.display="block"
		document.getElementById('source-container').innerHTML=""
		document.getElementById('sources-container').style.display="none";
		document.getElementById('projectview-container').innerHTML='';
		$('input.citation-outline-relationship').addClass('ignore-this');
		$("section#outline-container")[0].style.position = "";
		Outline.set_outline_size()
		try {
			Outline.go_to_location_hash(hash)
		} catch (e){
			alert("That outline node may be deleted")
		}
	}

	return {
		citation:citation,
		source:source,
	}

})()
