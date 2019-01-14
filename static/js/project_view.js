var ProjectView = (function(){
	var FRAME = document.createElement("SECTION");
	FRAME.id = 'projectview-container';
	document.body.appendChild(FRAME);

	var Roles = {0:'none',1:'viewer',2:'follower',3:'content editor',4:'project editor',5:"project editor2",6:'manage membership','7':'owner'};
	var Keys = Object.keys(Roles);

	var MembersPanel = (function (){
		var MembersAdmin = document.createElement("DIV");
		MembersAdmin.id = "MembersPanel";
		MembersAdmin.innerHTML = '<h3>Members:</h3><input id="add_group_member"><div id="project_members">';
		var MembersPanelDiv = document.createElement("DIV");
		MembersPanelDiv.id = "project_members";
		MembersAdmin.appendChild(MembersPanelDiv);
		function memberPanel(userID, user){
			if (user.privilege == undefined){
				user.privilege = 0;
			}
			var DIV = document.createElement("DIV");
			DIV.style = "background-color:#E9E9E9";
			if (Lawccess.context.user.permission >= 6) {
				DIV.innerHTML='<form onsubmit="ProjectView.submit_data(event)" username="'+user.username+'" user_id="'+userID+'"><span style="width:150px; display:inline-block;">'+user.username+" - "+ProjectView.Roles[user.privilege]+'</span><input onchange="ProjectView.lambda(this)" style="width:150px;vertical-align:top" type="range" max="'+Lawccess.context.user.permission+'" min="0" value="'+user.privilege+'"><button style="vertical-align:top" disabled="true">Save</button></form>';
			}
			return DIV;
		}
		function createPanel(usersObj){
			if (MembersPanelDiv.children.length){
				return MembersAdmin;
			}
			for (var ID in usersObj){
				MembersPanelDiv.appendChild(memberPanel(ID, usersObj[ID]));
			}
			return MembersAdmin;
		}

		function prependNewMemberPanel(userID, userObj){
			MembersPanelDiv.insertBefore(memberPanel(userID, userObj), MembersPanelDiv.children[0]);
		}
		return {create:createPanel, addMember:prependNewMemberPanel};
	})();

	var StyleSelector = (function(){

	})()

	var fn = (function(){
		var lambda = function(input){
			console.log(input)
			input.nextSibling.disabled = false;
			input.parentNode.children[0].innerHTML = ProjectView.Roles[input.value];
		}

		var get_members_dropdown = function() {
			function split( val ) {
				return val.split( /,\s*/ );
			}
			function extractLast( term ) {
				return split( term ).pop();
			}
		 
			$( "#add_group_member" )
			  // don't navigate away from the field on tab when selecting an item
			  .bind( "keydown", function( event ) {
				if ( event.keyCode === $.ui.keyCode.TAB &&
				    $( this ).autocomplete( "instance" ).menu.active ) {
				  event.preventDefault();
				}
			  })
			  .autocomplete({
				source: function( request, response ) {
				  $.getJSON( Lawccess.site.ajaxURL+"get_users/", {
				    term: extractLast( request.term )
				  }, response );
				},
				search: function() {
				  // custom minLength
				  var term = extractLast( this.value );
				  if ( term.length < 2 ) {
				    return false;
				  }
				},
				focus: function() {
				  // prevent value inserted on focus
				  return false;
				},
				select: function( event, ui ) {
				  var terms = split( this.value );
				  // remove the current input
				  terms.pop();
				  // add the selected item
				  terms.push( ui.item.value );
				  // add placeholder to get the comma-and-space at the end
				  terms.push( "" );
				  this.value = terms.join( ", " );
				  console.log(ui.item);
				  Lawccess.users[ui.item.id] = ui.item;
				  MembersPanel.addMember(ui.item.id, ui.item)
				  return false;
				}
			  });
		}


		var return_project_details = function(){
			var string = '<div id="profile-content"><div><h3>Project Profile</h3><table><tbody><tr><td>Project Name: </td><td id="edit_project_title" name="title">'+Lawccess.project.title+'</td><tr><td>Description: </td><td id="edit_project_description" name="description">'+Lawccess.project.description+'</td></tbody></table>'
			return string
		}

		var recent_edits_div = function(){
			return '<div id="recent_project_edits"><h3>Recent Edits</h3></div>'
		}

		var CSLStyleSelector = function(initial) { ///// Not used yet: possibly in future.
			var select = DropDown(SourceTypeMenu, function(e){
				var id = Lawccess.context.source
				var json = Lawccess.Controller._get_data_set().sources[id]
				var timestamp = Lawccess.data.sources[id]["timestamp"]
				var stylePath = this.getAttribute('value')
				var field = this
				var CSLtype = this.getAttribute('cslType')
				var data = {
					"model":"project",
					"id":id, 
					"field":"passport",
					"subfieldKeys":"style,path",
					"passport":stylePath,
				}
				if (Lawccess.context.editable){
					$.post(Lawccess.context.ajaxURL+"update", data, function(response){
					    Response.updateSelectField(data, field, json, response)
					    Signal.send("CSLstyle","new-style")
					})
				}
			})
			select.setValue(initial)
			return select;
		}


		var style_selection_event = function(){
			Signal.send("styles","load")
		    $.get("/csl/show_styles", function(data){
				var options = JSON.parse(data)
				options.map(function(item){
					option = document.createElement('OPTION');
					option.setAttribute("value",item.path);
					option.text = item.title;
					document.getElementById('style-select').appendChild(option);
					document.getElementById('style-select').value=stylePath;
				})
				document.getElementById('style-select').value = Lawccess.context.passport.style.path;
				document.getElementById('style-select').addEventListener('change', function(e){
					$.get("/"+document.getElementById('style-select').value, function(style){
						try {
							// Instantiate new instance of CSL processor
							citeproc = new CSL.Engine(citeprocSys, style);
//							Source.Bibliography.updateStyle()
							Signal.send('CSLstyle','new-style')
						} catch(e){
//							Signal.send('CSLstyle','invalid-style')
						}
					})
					if (Lawccess.context.editable){
						var json = Lawccess.data.project;
						var field = document.getElementById('style-select');
						var data = {
							"model":"project",
							"id":json.id, 
							"field":"passport",
							"subfieldKeys":"style,path",
							"passport":document.getElementById('style-select').value,
							"timestamp":json.timestamp
						}
						$.post(Lawccess.context.ajaxURL+"update", data, function(response){
							Response.update_style_select(data, field, json, response)
						})
					}
				})
			})
		}

//		var member_permissions_control = function(i, user_info){
//			var user = Lawccess.users[i]
//			if (user == null){
//				user = user_info
//				user.privilege = 0
//			}
//			return member_name_and_role(i, user)+'<div style="background-color:#E9E9E9;"><form onsubmit="ProjectView.submit_data(event)" username="'+user.username+'" user_id="'+i+'"><span style="width:150px; display:inline-block;">'+ProjectView.Roles[user.privilege]+'</span><input onchange="ProjectView.lambda(this)" style="width:150px;vertical-align:top" type="range" max="'+Lawccess.context.user.permission+'" min="0" value="'+user.privilege+'"><button style="vertical-align:top" disabled="true">Save</button></form></div>'
//		}

		var member_name_and_role = function(i, user){
			return '<p><a href="/gallery/user/'+i+'/">'+user.username+'</a> Role: '+ProjectView.Roles[user.privilege]+'</p>';
		}

		var return_members_view = function(){
			return '<h3>Members:</h3><input id="add_group_member"><div id="project_members"></div>';
		}

		var csl_style_selector = function(){
			var select = document.createElement('SELECT');
			select.id = "style-select";
			return select;
		}

		var submit_data = function(event){
			event.preventDefault();
			var value = event.target.children[1].value;
			var user_id = event.target.getAttribute('user_id');
			var username = event.target.getAttribute('username');
			var data = {'permission':value,'model':'project','project':Lawccess.context.project,'user':user_id}
			$.post(Lawccess.site.ajaxURL+'change_permission/', data, function(response){
				if (response ==1){
					if (data.permission == 0){
					delete Lawccess.users[data['user']]
					} else {
						if (Lawccess.users[data.user] == undefined){
							Lawccess.users[data.user] ={};
							Lawccess.users[data.user]["username"] = username;
						}
					Lawccess.users[data.user]["privilege"] = data.permission
					}
				}
			})
		}

		var init = function(){
			FRAME.innerHTML = return_project_details() 
			FRAME.appendChild(csl_style_selector());
			style_selection_event()
			FRAME.appendChild(MembersPanel.create(Lawccess.users));
			get_members_dropdown()

			$("#edit_project_title").editable(function(){ProjectView.update_field(this, "project")})
			$("#edit_project_description").editable(function(){ProjectView.update_field(this, "project")})
/*			Revisions.get_recent_project_edits(Lawccess.project.id, function(response){
				ProjectView.show_more_revisions(response)
			})*/
//			document.getElementById('projectview-container').style.display="block";

		}

		//// public API for 'fn'
		return {
			'lambda':lambda,
			'submit_data':submit_data,
			'init':init,
		}
	})()

	var update_field = function (input_field, model) {
		var field_name = input_field.getAttribute("name");
		//textContent = input_field.textContent
		var value = input_field.textContent
		var data = {
		    "model":"project",
		    "id":Lawccess.project.id,
		    "field":field_name,
		    "timestamp":Lawccess.project.timestamp
		}
		data[field_name]=value
		$.post(Lawccess.context.ajaxURL+"update/", data, function(response){
		    if (response['status'] == "success"){
		        Lawccess.project.timestamp = parseFloat(response["timestamp"])
				Lawccess.project[field_name]=value;
				if (field_name == "title"){
					document.getElementById("list_0").children[0].children[0].children[0].textContent = data.title; //// update Outline Header.
				}
		    } else {
		        Response.update(data, input_field, Lawccess.project, response)
		    }
		})
	}

	var show_more_revisions = function(response){
		for (i in response){
		var revision = response[i]
		var p=document.createElement('P')                             
		p.setAttribute('id','revision_'+i)         
		    p.setAttribute('value',i)
		var user = Lawccess.users[response[i].user_id]
		if (user == null){
			user = {'username':'unknown','user_id':''}
			data={"model":"user","user":response[i].user_id,'z':i}
/*			$.post(Lawccess.context.ajaxURL+"get_members",data, function(response){
			for (var k in response){
				user = response[k]
				document.getElementById('revision_'+data['z']).children[0].innerHTML = user.username
			}
			})*/
		}
		var _p='<a href="/gallery/user/'+revision.user_id+'">'+user.username+'</a> '
		_p=_p+Revisions.format_timestamp(revision.timestamp)+" "    
		_p=_p+revision.action+"d "
		_p=_p+'<span style="cursor:pointer">'+revision.model+revision.item_id+'</span>'                        
		p.innerHTML = _p
		var spans = p.getElementsByTagName('span')
		for (i=0;i< spans.length;i++){
			spans[i].addEventListener('click',function(){
				var id = this.parentNode.getAttribute('value')
				Revisions.set(Revisions.log[id].model, Revisions.log[id].item_id)
			})
		}
//		document.getElementById('recent_project_edits').appendChild(p)
		}
	}

	var createProjectView = function(){
		fn.init()
	}

	//// public API for 'ProjectView'
	return {
		'init':fn.init,
		'update_field':update_field,
		'show_more_revisions':show_more_revisions,
		'Roles':Roles,
		'createProjectView':createProjectView,
		'lambda':fn.lambda,
		'submit_data':fn.submit_data,
	}
})()

