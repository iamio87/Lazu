var Revisions = (function(){
	var OutlineElements = {};
	var Citations = {};
	var Sources = {};
	var Projects = {};
	var state = {}
	var log = []

	var fn = {}
	fn["OutlineElement"] = function(element){
		var div = document.createElement('DIV')
		div.setAttribute('class','outline-element mjs-nestedSortable-leaf')
		div.style.width = "100%"
		div.innerHTML = '<div><div class="title">'+element.title+'</div><div class="content"><div class="description">'+element.description+'</div></div></div>'
		Markup.markup_to_html(div.children[0].children[0])
		Markup.markup_to_html(div.children[0].children[1].children[0])
//		Markup.markup_to_html(div.children[0].children[1].children[0])
		return div
	}

	fn["Source"] = function(source){
		var sourcetype=source.bibliography.sourcetype;
		dropdown = DropDown(Source.Bibliography.SourceTypeMenu,function(){});
		dropdown.setValue(sourcetype);

		var sourceTypeLabel = dropdown.children[0].children[0].textContent;
		var table = ""
		table = '<thead><tr><th>Label</th><th>Content</th></tr></thead><tbody>';
		table = table + "<tr><td>Source Type</td><td>"+sourceTypeLabel+"</td></tr>";
		for (i in source.bibliography){
			if (i != "sourcetype"){
				if (typeof(Source.Bibliography.VariableFields.types[sourcetype][i])!= "undefined"){
					table = table + "<tr><td>"+Source.Bibliography.VariableFields.types[sourcetype][i].label+"</td><td>"+source.bibliography[i]+"</td></tr>";
				}
			}
		}
		table = table + "</tbody>"
		var tableOBJ = document.createElement('TABLE');
		tableOBJ.setAttribute('class','source_info');
		Source.Bibliography.revision_frame.call(tableOBJ, source, true)
		return tableOBJ
	}
	fn["Citation"] = function(citation){
		var table = document.createElement('TABLE')
		table.setAttribute('class','source_info')
		table.innerHTML = '<tbody><tr><th class="content">Citation</th><th class="pincite">Cite Location</th><th class="notes">Notes</th></tr><tr class="citation"><td class="content">'+Markup.markup_to_html(citation.content)+'</td><td class="locator">'+Markup.markup_to_html(citation.locator)+'</td><td class="note">'+Markup.markup_to_html(citation.note)+'</td></tbody>'
		return table
	}
	fn["Project"] = function(project){
		var div = document.createElement('DIV')
		div.innerHTML = "<p><b>Title:</b> "+Markup.markup_to_html(project.title)+"</p><p><b>Description:</b><br>"+Markup.markup_to_html(project.description)+"</p>"
		return div
	}

	var get_history = function(model, id){
		$.get("/versioning/history/"+model.toLowerCase()+"/"+id+"/",function(response){
			Revisions[model+'s'][id]=response.sort(sort_by('timestamp',true))
			set_display_navigation(model, id)
		})
	}

	var set_display_content=function(model, revision){
		var ol = fn[model](revision)
		document.getElementById('revision_content').innerHTML = ""
		document.getElementById('revision_content').appendChild(ol)
		var formattedTime = format_timestamp(revision.timestamp)
		var action = revision.action
		try {
		var user = '<a class="revision_user" href="/gallery/user/'+revision.user_id+'">'+Lawccess.users[revision.user_id].username+'</a>'
		} catch(e){
		var user = '<em class="revision_user">unknown</em>'
		}
		if (Lawccess.context.location == "project_details"){ /// For recent edit page, create link to go directly to appropriate view.
			if (model == "OutlineElement"){
				Lawccess.Controller.change_context_location("outline#"+revision.item_id)
			} else if (model == "Source") {
	//			Lawccess.context.source = revision.item_id
				Lawccess.Controller.change_context_location("source"+revision.item_id)
			}
		}
		document.getElementById('revision_meta').innerHTML = user+": <span style='color:green'>"+formattedTime+"</span> <span>"+action+"</span>"
	}

	var format_timestamp=function(timestamp){
		days = ['Sunday','Monday', 'Tuesday', 'Wednesday','Thursday','Friday','Saturday']
	// create a new javascript Date object based on the timestamp
	// multiplied by 1000 so that the argument is in milliseconds, not seconds
		var date = new Date(timestamp*1000);
	// hours part from the timestamp
		var hours = date.getHours();
	// minutes part from the timestamp
		var minutes = "0" + date.getMinutes();
	// seconds part from the timestamp
		var seconds = "0" + date.getSeconds();

		var year = parseInt(date.getYear())+1900;
	// will display time in 10:30:23 format
		var formattedTime = year+'-'+date.getMonth() +'-'+date.getDate()+' '+hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
		return formattedTime
	}

	var set_display_navigation = function(model, id){
		var display = document.getElementById('revision-container')
		display.style.display = "block"
		display.style.marginLeft = 60
		display.style.width = $(window).width()-260
		var pl_model = model+'s'
		var index = Revisions[pl_model][id].length-1
		Revisions['index'] = index
		if (index < 1){
		document.getElementById('revision_nav').children[0].disabled=true
		} else {
		document.getElementById('revision_nav').children[0].disabled=false
		}
		document.getElementById('revision_nav').children[1].disabled=true
		Revisions['model'] = model
		Revisions['id'] = id
		set_display_content(model, Revisions[pl_model][id][index])
	}
	

	var set = function(model, id){

		if (typeof(Revisions[model+'s'][id]) == "undefined"){
			get_history(model, id)
		} else {
		set_display_navigation(model, id)
		}
	}

	var close_button = function(){
		var section = document.getElementById('revision-container')
		var button = document.createElement('div')
		button.setAttribute('id','close_revision')
		section.insertBefore(button, section.children[0])
		button.addEventListener('click', function(){
		    $("#revision-container").toggle()
		})
	}

	var Display = function(){
		var display = document.createElement('div')
		display.id = "revision-container"
		display.innerHTML = '<div><p>Citation Popups reflect the current citation; it may not reflect the citation state at the time of the edit. For authoritative information on a previous state of the project, use the Version system. This revision system is best utilized to track user edits.</p></div><div id="revision_nav"><button>backward</button><button disabled="true">forward</button><span id="revision_meta"></span></div><div id="revision_content"></div>'
		display.style.display="none"
		window.addEventListener('resize',function(){
			display.style.marginLeft = 60
			display.style.width = $(window).width()-260
		})
		display.children[1].children[0].addEventListener('click', function(){
			model = Revisions['model'];id = Revisions['id'];index = parseInt(Revisions['index']) -1;
			this.nextSibling.disabled=false
			if (index == 0){
				this.disabled=true
			}
			Revisions.index = index
			set_display_content(model, Revisions[model+'s'][id][index])
		})
		display.children[1].children[1].addEventListener('click', function(){
			model = Revisions['model'];id = Revisions['id'];index = parseInt(Revisions['index']) +1;
			this.parentNode.children[0].disabled=false
			if (index == (Revisions[model+'s'][id].length -1 )){
				this.disabled = true//index = Revisions[model][id].length-1
			}
			Revisions.index = index
			set_display_content(model, Revisions[model+'s'][id][index])
		})

		$(document).ready(function(){
			document.body.appendChild(display)
			close_button()
		})
		return display
	}()

	var get_recent_project_edits = function(project_id, callback){    
		$.get("/versioning/recent_project_edits/"+project_id+"/",function(response){
			var div = document.createElement('div')
			response.sort(sort_by('timestamp',false))
			for (i in response){
				Revisions.log.push(response[i])
			}
			callback(response)
		})
	}

	//// Public API for "Revisions"
	return {
		'OutlineElements':OutlineElements,
		'Citations':Citations,
		'Sources':Sources,
		'Projects':Projects,
		'state':state,
		"log":log,
		"Display":Display,
		"get_recent_project_edits":get_recent_project_edits,
		"set":set,
		"format_timestamp":format_timestamp,
	}
})()


