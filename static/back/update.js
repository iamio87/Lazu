//// This file is closely tied to ajax_msg.js or response.js /////
//// This system is designed to apply updates from server to client with a refresh ////
//// The goal is for seemless real-time collaboration ////


Update = {}
Update.NewElementContainer = null
Update.make_container = function(){
	var div = document.createElement('DIV')
	div.style.display="none"
	$(document).ready(function(){
		document.body.appendChild(div)
		Update.NewElementContainer = div
	})
}()
//// set updates to sessionStorage ////
////set localStorage, then clear localStorage of item after expiration.

//// get updates from sessionStorage ////
//// localStorage.events

//// get updates from Server ////
Update.get_server_updates = function(){
    var data = {'timestamp':Lawccess.data.update_timestamp, 'project':Lawccess.context.project}
    //// get updates by other users after timestamp of most recent update
    $.post(Lawccess.context.ajaxURL+'get_updates/'+Lawccess.context.project, data, function(response){
		objs ={}
		Lawccess.data.outline = response.outline
//		objs.elements = response.outlineElements
		Update.update_outlineElements(response.outlineElements)
		Update.update_sources(response.sources)
		Update.update_citations(response.citations)
		Lawccess.data.update_timestamp = response.update_timestamp
		Update.update_project(response.project)
    })	
}

//// handle updates from Response where there is state-conflict.
Update.update_outlineElements = function(outlineElements){
	deleted_elements = []
	for (var i in outlineElements){
		var old_element_data = Lawccess.data.outlineElements[i]
		var new_element_data = outlineElements[i]
		if (typeof(old_element_data) == "undefined"){
			var element = Outline.nestedListRow(new_element_data.id, new_element_data)
			Outline.add_listeners_to_outline_rows(element)
			Update.NewElementContainer.appendChild(element)
		} else {
			var element = document.getElementById('list_'+i)
			Update.NewElementContainer.appendChild(element)
		}
		if (outlineElements[i].deleted == true){
			delete Lawccess.data.outlineElements[i]
			deleted_elements.push(i)
		} else {
			Lawccess.data.outlineElements[i] = outlineElements[i]
//			console.log('k',i, element, new_element_data, old_element_data, 	Lawccess.data.outlineElements[i])
			element.children[0].children[1].innerHTML = new_element_data.title
			Markup.markup_to_html(element.children[0].children[1])
			var descrip = $(element).children('div').children('div.content').children('div.description')[0]
			descrip.innerHTML = new_element_data.description
			Markup.markup_to_html(descrip)		
		}
	}
	Outline.add_elements_to_outline(Lawccess.data.outline.order.split(','), Lawccess.data, true)
	setTimeout(function(deleted_elements){
		for (i in deleted_elements){
			var id = deleted_elements[i]
			try {
				document.getElementById('list_'+id).remove()
			} catch(e){}
		}
	}, 1000)
}


Update.update_sources = function(sources){
	for (i in sources){
		var old_source_data = Lawccess.data.sources[i]
//		var new_source_data = sources[i]
		var source = document.getElementById('source_'+i)
		if (sources[i].deleted == true){
			delete Lawccess.data.sources[i]
			if (source != null){
				source.remove()
			}
			if (i == Lawccess.context.source){
				var row = document.getElementById('source_info').children[0].children[1]
				for (k=0; k<row.children.length;k++){
					field = row.children[k]
					field.innerHTML = 'deleted'
/*					field.innerHTML = sources[i][field.className]
					Markup.markup_to_html(field)*/
				}
			}
		} else {
			Lawccess.data.sources[i] = sources[i]
			if (source != null){
				for (j=0;j<source.children.length;j++){
					var field = source.children[j]
					field.innerHTML = sources[i][field.className]
					Markup.markup_to_html(field)
				}
			}
			if (i == Lawccess.context.source){
				var row = document.getElementById('source_info').children[0].children[1]
				for (k=0; k<row.children.length;k++){
					field = row.children[k]
					field.innerHTML = sources[i][field.className]
					Markup.markup_to_html(field)
				}
			}
		}
	}
}

Update.update_citations = function(citations){
	for (i in citations){
		var old_citation_data = Lawccess.data.citations[i]
		var new_citation_data = citations[i]
		Lawccess.data.citations[i] = citations[i]
		if (citations[i].source_id == Lawccess.context.source){
			if (citations[i].deleted == false){
				var citation = document.getElementById('citation_'+i)
				if (citation != null){
					for (j=0; j<(citation.children.length-1); j++){
						var field = citation.children[j]
						field.innerHTML = citations[i][field.className]
						Markup.markup_to_html(field)
					}
				} else if (citation == null) {
					console.log('null')
					Source.add_citation_row(citations[i])
				}
			} else if (citations[i].deleted == true){
				delete Lawccess.data.citations[i]
				document.getElementById('citation_'+i).remove()
			}
		}
	}
}

//// Apply get updates to appropriate contexts ////

Update.update_project = function(project){
	try {
		document.getElementById('edit_project_title').innerHTML = Markup.markup_to_html(project.title)
		document.getElementById('edit_project_description').innerHTML = Markup.markup_to_html(project.description)
	} catch(e){}
	document.getElementById('list_0').children[0].children[0].innerHTML = '<b>'+Markup.markup_to_html(project.title)+'</b>'
}
