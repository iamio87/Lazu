Lawccess.fn = {
    'outline':[],
    'updates':[]
    //movement_add:function()()
}

Response = {}

Response._clear_old_msg = function(){
	try {
		document.getElementById('ajax_msg').remove()
	}
		catch(e){
	}    
}
Response._alert_msg = function(html){
	var div = document.createElement('div');
	div.innerHTML = html
	div.className = 'ui-state-error'
	div.style.position = "fixed"
	div.style.bottom = "80px"
	div.style.padding = "12px"
	div.style.borderRadius = "5px"
	div.style.opacity = "0.9"
	div.onclick = function(event){div.remove()}
	div.id='ajax_msg'
	document.body.appendChild(div)
}

Response.Diff = {}
Response.Diff.update = function(data, diffs, element, json, response){
	if (response['s'] == 1){
		if (data.M == "source"){ // save to source.bibliography field
			if (data.hasOwnProperty('subfields')){
				var subfields = data['subfields'].split(',')
				var field = json[data['F']][subfields[0]][subfields[1]]
				field = Diff.patch(field, diffs)
			} else {
				var fields = data['F'].split(' ')
				for (i in fields){
					json.bibliography[fields[i]] = data[fields[i]]
				}
			}
			Source.Bibliography.updateRender(data.id)
		} else if (data.M == "project" && data.F == "passport"){
			var subfields = data['subfields'].split(',')
			var field = json.passport[subfields[0],subfields[1]]
			field = Diff.patch(field, diffs)
		} else { // else save to model field.
			json[data.F] = Diff.patch(json[data.F], diffs)
		}
		json.timestamp = parseFloat(response["t"]);
		json.user_id = parseInt(Lawccess.context.user.id);
		Lawccess.context.logPos = response["l"];
		Signal.send(data.model, "update", data.id);
	}
}

Response.Diff.MoveNode = function(diff, response){
    Response._clear_old_msg()
	Lawccess.context.logPos = response["l"];
	var updates = response["u"];
    if (response['s'] == 1){
        Lawccess.data.outlineElements[diff.val].parent_id = diff['to'];
        if (diff.from != "0"){
	        Lawccess.data.outlineElements[diff.from]['order'].splice(diff.del, 1);
        } else {
			Lawccess.data.outline.order.slice(diff.del, 1);
		}
        if (diff.to != "0"){
			Lawccess.data.outlineElements[diff.to]['order'].splice(diff.ins, 0, diff.val);
        } else {
            Lawccess.data.outline.order.slice(diff.ins, 0, diff.val);
		}
    }
    else if (response['s'] == 2){ /// order conflict
      Response._alert_msg(response['order_conflict']+'. Please wait while program resyncs.')
		Outline.moveNode(Diff.revert(diff))
    }
    else if (response['s'] == 0){
      Response._alert_msg(response['Permission Denied'])
    }
    Lawccess.fn.outline.shift()
    if (Lawccess.fn.outline.length > 0){
      setTimeout(function(){Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])},25)
    }
}
Response.Diff.Create = function(data, diff, element, json, response){
    Response._clear_old_msg()
	Lawccess.context.logPos = response["l"];
	var updates = response["u"];
}
Response.Diff.CreateNode  = function(data, element, response){
    Response._clear_old_msg()
	Lawccess.context.logPos = response["l"];
	var updates = response["u"];
    if (response['s'] == 1){
        var id = response['id'];
        var timestamp = parseFloat(response['t']);
        element.setAttribute('value',id);
        element.setAttribute("id","list_"+id);
        element.children[1].setAttribute('value',id); /// set value on relationship checkbox.
		BB = element;
        var parent_id = data['p']
        Lawccess.data.outlineElements[id] = {"parent_id":parent_id,"order":[],"heading":"","content":"", "timestamp":timestamp}
        if (parent_id != 0){
           var json = Lawccess.data.outlineElements[parent_id]
        }
        else {
            var json = Lawccess.data.outline
        }
		if (!Array.isArray(json.order)){
			var order = json.order.split(',')
		} else { order = json.order}
		order.splice(data['ins'], 0, ""+id)
        Lawccess.fn.outline.shift()
        setTimeout(function(){
            if (Lawccess.fn.outline.length > 0){
                Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
            }
        }, 25)
    }
}

Response.updateSelectField = function(data, element, json, response){
	Response._clear_old_msg()
	var fields = data['field'].split(' ')
	var subfields
	if (data.hasOwnProperty('subfieldKeys')) {
		var subfields = data['subfieldKeys'].split(',')
	}
	if (response['status'] == "success"){
		if (data.model == "source"){ // save to source.bibliography field
			if (subfields){ //// DatePartSelector.source.js
				json.bibliography[fields[0]][subfields[0]][subfields[1]] = data[fields[0]];
			} else {  //// SourceTypeSelector.source.js
				fields.map(function(fieldName){
				  json.bibliography[fieldName] = data[fieldName];
				})
				Source.Bibliography.update_bibliography_sourcetype(json);
				Source.Bibliography.updateRender(data.id)
			}
		} else { // else save to model field.
			for (i in fields){
				json[fields[i]] = data[fields[i]]
			}
		}
		json.timestamp = parseFloat(response["timestamp"])
		json.user_id = parseInt(Lawccess.context.user.id)
	} else if (response['status'] == "conflict") {
		alert("response.js: Unhandled exception")
	}
}

Response.update = function(data, element, json, response){
  Response._clear_old_msg()
  var fields = data['field'].split(',')
  if (response['status'] == "success"){
		console.log(data.model, data.fields, data.title)
		if (data.model == "source"){ // save to source.bibliography field
			for (i in fields){
				json.bibliography[fields[i]] = data[fields[i]]
			}
			Source.Bibliography.updateRender(data.id)
		} else { // else save to model field.
	    	for (i in fields){
				json[fields[i]] = data[fields[i]];
			}
		}
		json.timestamp = parseFloat(response["timestamp"]);
		console.log(json)
		json.user_id = parseInt(Lawccess.context.user.id);
//		console.log(Signal)
		Signal.send(data.model, "update", data.id);
	} else if (response['status'] == "notice") {
		$("#server_msg").addClass("ui-state-error").html(response["timestamp_error"])
	} else if (response['status'] == "conflict"){
		var field = data['field'];
		if (json[field] == response['serverState'][field]){ //// check server data against original data
			Object.keys(response['serverState']).map(function(key){
				json[key] = response['serverState'][key]
			})
    	    $.post(Lawccess.context.ajaxURL+"update", data, function(response){
    	        Response.update(data, element, json, response)
    	    })
		}
		var html = "";
		if (json[field] != response['serverState'][field]){
			html = html + '<tr><td>'+data['field']+'</td><td>'+json[data['field']]+'</td><td>'+data[data['field']]+'</td><td>'+response['serverState'][data["field"]]+'</td></tr>';
//			console.log(html);
		}
		if (html != ""){
		html = '<table><tbody><tr><th>Field</th><th>Original</th><th>Your Changes</th><th>Server Changes<th></tr>'+ html + "</tbody><table>"
		Response._alert_msg(response[response["warning"]] + html);
		} else {
			data.timestamp = response['serverState']['timestamp']
			$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				Response.update(data, element, json, response)
			})
		}
	} else if (response['status'] == "error"){ }
}

Response.update_complex_field = function(data, element, json, response){
	//// Complex Fields
    Response._clear_old_msg()
    var _field = data['field'];
    var subfieldkeys = data['subfieldKeys'].split(',');
    if (response['status'] == "success"){
		if (data.model == "source"){ // save to source.bibliography field
			if (typeof(json.bibliography[_field])=="undefined"){
				json.bibliography[_field]={}
			}
			if (typeof(json.bibliography[_field][subfieldkeys[0]])=="undefined"){
				json.bibliography[_field][subfieldkeys[0]]={}
			}
	 	    json.bibliography[_field][subfieldkeys[0]][subfieldkeys[1]] = data[_field]
			Source.Bibliography.updateRender(data.id)
		} else { // else save to model field.
			//// We only have to worry about bibliography fields at this point.
		}
    	json.timestamp = parseFloat(response["timestamp"])
		json.user_id = parseInt(Lawccess.context.user.id)
		Signal.send(data.model, "update-complex", data.id);
    }
    else if (response['status'] == "conflict") {
//// We must account for the every bibliography field, because any bibliography information could be out of sync.
//// For complex fields, there may be extra fields or removed fields. Ugh.
//// The only reasonable path is to remove entire bibliography frame and rebuild it.

    $("#server_msg").addClass("ui-state-error").html(response["timestamp_error"])
		var keys = data['keys'].split(',');
		if (response['serverState']['bibliography'][data['field']][keys[0]][keys[1]] == json['bibliography'][data['field']][keys[0]][keys[1]]) {
			Lawccess.data["sources"][data['id']].bibliography = response['serverState']['bibliography'];
			Lawccess.data["sources"][data['id']].timestamp = response['serverState']['timestamp'];
			response['serverState']['bibliography'][data['field']][keys[0]][keys[1]] = data[data['field']];
			data['timestamp'] = response['serverState']['timestamp']
			$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				Response.update_complex_field(data, element, json, response);
			})
		} else {
			Lawccess.data["sources"][data['id']].bibliography = response['serverState']['bibliography'];
			Lawccess.data["sources"][data['id']].timestamp = response['serverState']['timestamp'];
		}
		var sourcetype = response['serverState']['bibliography']['sourcetype']
		bibtable = document.getElementById('source_info')
		var bibfields = Source.Bibliography.SourceTypeFields[sourcetype]
		bibtable.children[1].innerHTML="";/// remove old out-of-date rows
		Source.Bibliography.fn.add_fields_to_table(bibtable.children[1], bibfields, response['serverState']); /// rebuild rows
    }
}

Response.update_style_select = function(data, element, json, response){
	//// selector to choose CSL style
    Response._clear_old_msg()
    var _field = data['field'];
    var subfieldkeys = data['subfieldKeys'].split(',');
    if (response['status'] == "success"){
 	    json[_field][subfieldkeys[0]][subfieldkeys[1]] = data[_field]		
		Lawccess.context.passport[subfieldkeys[0]][subfieldkeys[1]] = data[_field]
    	json.timestamp = parseFloat(response["timestamp"])
		json.user_id = parseInt(Lawccess.context.user.id)
		Signal.send(data.model, "update-complex", data.id);
    }
    else if (response['status'] == "conflict") {
		var keys = data['keys'].split(',');
		if (response['serverState'][data['field']][keys[0]][keys[1]] == json[data['field']][keys[0]][keys[1]]) {
			Lawccess.data["sources"][data['id']].bibliography = response['serverState']['bibliography'];
			Lawccess.data["sources"][data['id']].timestamp = response['serverState']['timestamp'];
			response['serverState']['bibliography'][data['field']][keys[0]][keys[1]] = data[data['field']];
			data['timestamp'] = response['serverState']['timestamp']
			$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				Response.update_style_select(data, element, json, response);
			})
		} else {
			Lawccess.data["field"][data['id']] = response['serverState'];
//			Lawccess.data["field"][data['id']].timestamp = response['serverState']['timestamp'];
		    $("#server_msg").addClass("ui-state-error").html(response["timestamp_error"])
		}
    }
}

Response.create = function(element, json, response){
	Response._clear_old_msg()
	if (response['status'] == "success"){
		json[response['id']] = {"timestamp":response["timestamp"]}
		element.setAttribute("id","list_"+id)
		element.setAttribute('value',response['id'])
	}
}

Response.updateHeading = function(data, response){
    Response._clear_old_msg()
    if (response['status'] == "success"){
        //// Set the timestamp of the child element
        Lawccess.data.outlineElements[data.item].timestamp=response['child_timestamp']
        Lawccess.data.outlineElements[data.item].parent_id=data['new_parent_id']

        //// Set the timestamp of the old parent element
        if (response['old_parent_timestamp'] != ""){
            if (data['old_parent_id'] != ""){
                Lawccess.data.outlineElements[data.old_parent_id]['timestamp'] = parseFloat(response["old_parent_timestamp"])
		        Lawccess.data.outlineElements[data.old_parent_id]['order'] = data['old_parent_children']
            }
            else {
                Lawccess.context.outline.timestamp = parseFloat(response["new_parent_timestamp"])
	            Lawccess.context.outline.order = data.old_parent_children
            }
        }
        //// Set the timestamp of the new parent element
        if (data['new_parent_id'] != ""){
          Lawccess.data.outlineElements[data.new_parent_id]['timestamp'] = parseFloat(response["new_parent_timestamp"])
   	    	Lawccess.data.outlineElements[data.new_parent_id]['order'] = data['new_parent_children']
        }
        else {
          Lawccess.context.outline.timestamp = parseFloat(response["new_parent_timestamp"])
	    		Lawccess.context.outline.order = data['new_parent_children']
        }
    }
    else if (response['status'] == "order_conflict"){
      Response._alert_msg(response['order_conflict']+'. Please wait while program resyncs.')
			Update.get_server_updates()
    }
    else if (response['status'] == "error"){
      Response._alert_msg(response['error'])
    }
    Lawccess.fn.outline.shift()
    if (Lawccess.fn.outline.length > 0){
      setTimeout(function(){Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])},25)
    }
}

Response.createHeading = function(element, data, json, response){
    Response._clear_old_msg()
    if (response['status'] == "success"){
        var id = response['id']
        var timestamp = response['timestamp']
        element.setAttribute('value',id);
        element.setAttribute("id","list_"+id)
        var parent_id = data['new_parent_id']
        json[id] = {"parent_id":parent_id,"order":"","heading":"", "timestamp":timestamp}
        if (parent_id != ""){
            json[parent_id].timestamp = response['parent_timestamp']
        }
        else {
            Lawccess.context.outline.timestamp = response['parent_timestamp']
        }
//        console.log(Lawccess.fn.outline)
        Lawccess.fn.outline.shift()
//        console.log(Lawccess.fn.outline)
        setTimeout(function(){
            if (Lawccess.fn.outline.length > 0){
                Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
            }
        }, 25)
    }
}
