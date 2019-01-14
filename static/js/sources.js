Sources = {}

Sources.createSources = function(data){
	var section = document.getElementById('sources-container')
	section.innerHTML = ""
	new_source_button = document.createElement('BUTTON')
	new_source_button.textContent = "New Source"
	new_source_button.addEventListener('click', function(e){
		Sources.create_new_source()
	})
	section.appendChild(new_source_button);
	var table = document.createElement('TABLE');
	table.setAttribute('id','sources_table');
	table.innerHTML = '<tbody><tr><th class="title">Bibliography</th></tr></tbody>';
	section.appendChild(table);
	
	for (i in data.sources) {
		var row = Sources.add_source_to_table(data.sources[i]);
		table.getElementsByTagName('tbody')[0].appendChild(row);
	}
	table.style.width="100%";
}

Sources.add_source_to_table = function(source){
	var row = document.createElement('tr')
	row.setAttribute('id',"source_"+source.id)
	row.setAttribute('value',source.id)
	row.innerHTML = "<td>:"+easyRender(source.id)+" </td>";
	row.addEventListener('click', function(){
		Lawccess.context.source = this.getAttribute('value')
		Lawccess.Controller.change_context_location('source')
    })
	return row
}

Sources.update_source = function(id){
	try {
		var row = document.getElementById("source_"+id);
		console.log('sources row update', row)
		row.innerHTML = "<td>"+easyRender(id)+"</td>";
	} catch(e) {
		console.log('no row')
		//// row is not displayed in current Sources frame.
	}	
}

Sources.create_new_source = function(){
	if (Lawccess.context.editable){
		$.post(Lawccess.context.ajaxURL+"create/", {"model":"source","project":Lawccess.context.project, "parent_model":"project"}, function(response){
			if (response['status']=="success"){
				Lawccess.data.sources[response.id] = {"id":response.id,'notes':"","timestamp":response.timestamp,'bibliography':{'title':'','year':''}}
				var tbody = document.getElementById('sources-container').getElementsByTagName('TR')[0].parentNode
				tbody.insertBefore(Sources.add_source_to_table(Lawccess.data.sources[response.id]), tbody.children[1])
				Lawccess.context.source = response.id;
				Lawccess.Controller.change_context_location('source')
			}
		})
	}
}
