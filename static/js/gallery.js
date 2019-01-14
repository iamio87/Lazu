

$(function() {
    function split( val ) {
 	     return val.split( /,\s*/ );
    }
    function extractLast( term ) {
    	  return split( term ).pop();
    }
 	
    input_field = $("#add_group_member")
      // don't navigate away from the field on tab when selecting an item
    input_field
      .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
          event.preventDefault();
        }
      })
      .autocomplete({
        source: function( request, response ) {
          $.getJSON( Lawccess.ajaxURL+"get_users/", {
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
///////////// Enables submitting more than one username at a time //////////////        
// /*
        select: function( event, ui ) {
          var terms = split( this.value );
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( ", " );
          return false;
        }//*/
    });
});

function update_field(input_field, model) {
    field_name = input_field.getAttribute("name");
    //textContent = input_field.textContent
    var data = {
  	"model":model, 
  	"id":Lawccess[model],
  	"field":field_name,
	"timestamp":Lawccess.timestamp
    }
    data[field_name]=input_field.textContent
    $.post(Lawccess.ajaxURL+"update/", data, function(response){
        if (response['status'] == "success"){
	    Lawccess.timestamp = parseFloat(response["timestamp"])
	    console.log('hey', Lawccess.timestamp, parseFloat(response["timestamp"]))
        } else {
	    Response.update(data, input_field, Lawccess, response)
        }
    }) 
}

function remove_member(element, id) {
	  parent_model = Lawccess.context //$("#group_members").attr("parentModel")
    if (parent_model == "user"){parent_model = "profile"}
	  role = $("#group_members").attr("role")
	  data = {
	  "parent_model":parent_model,		"model":"user",		"role":role,		"user":id}
	  data[parent_model] = Lawccess[parent_model]
	  $.post(Lawccess.ajaxURL+"remove_MTM_child_from_parent/", data, function(response){
		    element.parentElement.parentElement.remove()
	})
}

$(document).ready(function(){
	$("#new_team_button").click(function(){
		dialog = document.getElementById("dialog")
		dialog.style.display = "inline-block";
		Lawccess.dialog.fn = function(title, description){
			data = {"model":"team","title":title,"description":description,"parent_model":"organization","organization":Lawccess.organization}
			$.post(Lawccess.ajaxURL+"create_team/", data, function(response){
        console.log($("#teams"),$("#teams").children('tbody'))
			    $("#teams").children('tbody').prepend("<tr value='"+response+"'><td><abbr title='"+description+"'><a href='/gallery/team/"+response+"'>"+title+"</a></abbr></td><td><button class='delete_team' onclick='delete_team(this)'>Delete</button></td></tr>")
            })
		}
	})
})

$(document).ready(function(){
	FileUploader(document.getElementById("file_upload"), '/ajax/new_project_from_file/', function(e){console.log(e)})
	$("#new_project_button").click(function(){
		dialog = document.getElementById("dialog")
		dialog.style.display = "inline-block";
		console.log(dialog)
		Lawccess.dialog.fn = function(title, description){
			data = {"model":"project","title":title,"description":description,"parent_model":Lawccess.context}
			data[Lawccess.context] = Lawccess[Lawccess.context]
			$.post(Lawccess.ajaxURL+"create/", data, function(response){
			    $("#projects").children('tbody').prepend("<tr><td><a href='/project/" + response + "'>"+title+"</a></td><td><button onclick='archive(this, "+response['id']+")'>Archive</button></td></tr>")
			})
		}
	})
})


//////// This code assumes that the dialog.style.display == "inline-block" //////////////
//////// Pressing the "Save" button will submit the information and hide the dialog window.
$(document).ready(function(){
	var dialog = document.getElementById("dialog")
	if (dialog != null){
  	dialog.lastElementChild.addEventListener("click",function(e){
		title = dialog.children[1].children[1].value; dialog.children[1].children[1].value="";
		description = dialog.children[3].children[0].value; dialog.children[3].children[0].value="";
		dialog.style.display = "none";
		Lawccess.dialog.fn(title, description)
  	})
//////// Clicking the "x" button will hide the dialog window
  	dialog.firstElementChild.addEventListener("click",function(e){
  		dialog.children[1].children[1].value="";
  		dialog.children[3].children[0].value="";
		dialog.style.display = "none";
  	})
/////// Pressing the Escape key will hide the dialog window
  	document.addEventListener("keypress", function(e){
  		if (e.keyCode == "27") {
	  		dialog.children[1].children[1].value="";
	  		dialog.children[3].children[0].value="";
			dialog.style.display = "none";
  		}
  	})
  	}
})



$(document).ready(function(){
	$("#add_member_button").click(function(){
		parent_model = Lawccess.context //$("#group_members").attr("parentModel")
    if (parent_model == "user"){parent_model = "profile"}
		role = $("#group_members").attr("role")
		data = {
			"parent_model":parent_model,
			"model":"user",
			"role":role,
			"user":document.getElementById("add_group_member").value.replace(/\ /g,'').replace(/,$/, ''),// User ids. we remove any whitespaces and remove the trailing comma.
		}
		data[parent_model]=Lawccess[parent_model]
		$.post(Lawccess.ajaxURL+"add_MTM_child_to_parent/", data, function(response){
      document.getElementById("add_group_member").value=""
			document.getElementById("add_member_errors").innerHTML =response.errors
			for (i in response[role]) {
				if ($("#member-"+i).length == 0) {
					var $tbody = $("#group_members").children("tbody").prepend("<tr id='member-"+i+"' value='"+i+"'><td><a href='/gallery/user/"+i+"'>"+response[role][i].username+"</a></td><td><button onclick='remove_member(this, "+i+")'>Remove</button></td></tr>")
          if (Lawccess.context != "user"){ //// If a user is adding a contact, then there is no adminstrator functionality. Only add button in team.html and organization.html
            console.log($tbody.children('tr').first().append("<td><button onclick='promote_to_admin(this)'>Promote To Admin</button></td>"))
          }
				}
			}
		})
	})

})


/*function delete_team(element, id){
	data = {"model":"team","team":id}
	$.post(Lawccess.ajaxURL+"delete/",data, function(response){
		element.parentElement.parentElement.remove()
	})
}*/


function archive(element, id){
  data={"model":"project","project":id}
  data[Lawccess.context] = Lawccess[Lawccess.context]
	$.post(Lawccess.ajaxURL+'deactivate/', data, function(response){
		$("#projects-archived").children('tbody').prepend($(element).parent().parent())
		string = "<td value='"+id+"'><button onclick='restore(this, "+id+")'>Restore</button></td><td><button onclick='delete_project(this)'>Delete</button></td>"
		$(element).parent().replaceWith(string)
	})
}


function restore(element, id){
	data = {"model":"project","project":id,"parent_model":Lawccess.context}
	data[Lawccess.context] = Lawccess[Lawccess.context]
	$.post(Lawccess.ajaxURL+'activate/'+id, data, function(response){
		$("#projects").children('tbody').append($(element).parent().parent())
		string = '<td><button onclick="archive(this, '+id+')">Archive</button></td>'
		$(element).parent().next().remove()
		$(element).parent().replaceWith(string)
	})
}

$(document).ready(function(){
	$("button#new_organization_button").click(function(){
		dialog = document.getElementById("dialog")
		dialog.style.display = "inline-block";
		console.log(dialog)
		Lawccess.dialog.fn = function(title, description){
			data = {"model":"organization","title":title,"description":description,"parent_model":"owners","owners":Lawccess.user}
			$.post(Lawccess.ajaxURL+"create_org/", data, function(response){
			    $("#organizations").children('tbody').prepend("<tr value='"+response+"'><td><a href='/gallery/organization/"+response+"'' title='"+description+"'>"+title+"</a></td><td><button onclick='abdicate_organization(this)'>Resign as Owner</button></td></tr>")
			})
		}
	})
})


function delete_project(element){
    confirmation = confirm("Deleting this project will all outlines, documents, tasks, and sources associated with this project. Are you sure you want to continue?")
    if (confirmation == true){
        projectRow = $(element).parentsUntil("tr").parent()[0]
        $.post(Lawccess.ajaxURL+"delete/",{"model":"project","project":projectRow.getAttribute("value")}, function(response)
        {
            if (response == 1){
                projectRow.remove()
            }
        })
    }
}

function delete_team(element){
    console.log(element)
    confirmation = confirm("Deleting this team will erase all projects assigned to this team. Are you sure you want to continue?")
    if (confirmation == true){
        Row = $(element).parentsUntil("tr").parent()[0]
        $.post(Lawccess.ajaxURL+"delete/",{"model":"team","team":Row.getAttribute("value")}, function(response)
        {
            if (response == 1){
                Row.remove()
            }
        })
    }
}


function leave_team(element){
    model = Lawccess.context
    instance = Lawccess[model]
    confirmation = confirm("Resigning from this team will disable your access to the team's projects. Do you wish to continue?")
    if (confirmation == true){
        Row = $(element).parentsUntil('tr').parent()[0]
        $.post(Lawccess.ajaxURL+"leave_role/",{"model":"team","team":Row.getAttribute("value"),"role":"members"}, function(response){
            if (response == 1){
                Row.remove()
            }
        })
    }
}

//// This function is unique, because a user has elevated privileges sole purpose of relinquishing
//// their authority to access. 
//// The function applies to admins and members roles.
//// The function is called from user.html, team.html, and organization.html. "user.html" logic is significantly different
////// from team.html and organization.html
function resign_from_role(element){
    //// Getting the relevant variable values
    if (Lawccess.context == "user"){
      //console.log($(element).parentsUntil('table').parent()[0])
      model = $(element).parentsUntil('table').parent()[0].getAttribute('model')
      id = $(element).parentsUntil('tr').parent()[0].getAttribute("value")
      role = element.getAttribute('role')
      console.log(model, id, role)
    }
    else if (Lawccess.context == "team"){
      role = $(element).parentsUntil('table').parent()[0].getAttribute("role")
      model = "team"
      id = Lawccess.team
    }
    else if (Lawccess.context == "organization"){
      role = $(element).parentsUntil('table').parent()[0].getAttribute("role")
      model = "organization"
      id = Lawccess.organization
    }
    Row = $(element).parentsUntil('tr').parent()[0]

    //// Set the text for the confirmation prompt
    if (role == "members"){
        confirmation_text = "Resigining from this "+model+" will disable your access to the "+model+"'s projects. Do you wish to continue?"
    }
    else if (role == "admins"){
        confirmation_text = "Resigning as admin will disable your ability to manage the "+model+". However, you will still be able to work on "+model+" projects. Do you wish to continue?"
    }
    confirmation = confirm(confirmation_text)
    if (confirmation == true){
        data = {"model":model,"role":role}
        data[model] = id
        console.log(data)
        $.post(Lawccess.ajaxURL+"leave_role/", data, function(response){
            if (response ){
                console.log(Row, role)
                if (role=="admins"){
                    if (Lawccess.context != "user"){
                        name = Row.children[0].textContent
                        myUserId = Row.getAttribute("value")
                        Row.remove()
                        $("#group_members").children('tbody').prepend("<tr><td><a href='/gallery/user/"+myUserId+"'>"+name+'</a></td><td><button role="members" onclick="resign_from_role(this)">Leave '+model+'</button></td></tr>')
                    }
                    else { //// where Lawccess.context == "user"
                        if (model == "organization"){element.textContent = "Leave Organization"}
                        if (model == "team"){element.textContent = "Leave Team"}
                        element.setAttribute("role","members")
                        element.onclick = function(){resign_from_role(element)}
                    }
//                  element.parentElement.innerHTML='<button role="members" onclick="resign_from_role(this)">Leave '+model+'</button>'
                }
                else if (role=="members") {
                  Row.remove()
                }
            }
        })
    }
}

function resign_as_team_admin(element){
    confirmation = confirm("Resigning as admin will disable your ability to manage the team. You will still be able to work on team projects. Do you wish to continue?")
    if (confirmation == true){

        Row = $(element).parentsUntil('tr').parent()[0]
        if (typeof(Row.getAttribute("value")) != "undefined") {teamID = Row.getAttribute("value")}
        else {teamID = Lawccess[Lawccess.context]}
        $.post(Lawccess.ajaxURL+"leave_role/",{"model":"team","team":teamID,"role":"admins"}, function(response){
            if (response == 1){
                Row.remove()
            }
        })
    }
}


function remove_from_team(element){
//    confirmation = confirm("Resigning from this team will disable your access to the team's projects. Do you wish to continue?")
//    if (confirmation == true){
        Row = $(element).parentsUntil("tr").parent()[0]
        $.post(Lawccess.ajaxURL+"remove_MTM_child_from_parent/",{"parent_model":"team","team":Lawccess.team,"user":Row.getAttribute("value"),"model":"user","role":"members"}, function(response)
        {
            if (response == 1){
                Row.remove()
            }
        })
//    }
}

function promote_to_admin(element){
    Row = $(element).parentsUntil("tr").parent()[0]
    context = Lawccess.context
    id = Row.getAttribute("value")
    data={"parent_model":context,"user":id,"model":"user","role":"admins"}
    data[context] = Lawccess[context]
    console.log(data)
    confirmation = confirm("Are you sure you want to make this user an admin? Once this user is an admin, she cannot be removed by other admins of this group. Continue?")
    if (confirmation == true){
        $.post(Lawccess.ajaxURL+"add_MTM_child_to_parent/",data, function(response){
            username = response["admins"][id]["username"]
            first_name = response["admins"][id]["first_name"]
            last_name = response["admins"][id]["last_name"]
            $("#group_admins").children('tbody').prepend('<tr value="'+id+'"><td><a href="/gallery/user/'+id+'">'+Row.children[0].textContent+'</a></td><td><button onclick="demote_admin(this, '+id+')">Demote</button></td></tr>')
            Row.remove()
        })
    }
}

function demote_admin(element){
    Row = $(element).parentsUntil("tr").parent()[0]
    context = Lawccess.context
    id = Row.getAttribute("value")
    data={"parent_model":context,"user":id,"model":"user","role":"admins"}
    data[context] = Lawccess[context]
    console.log(data)
    $.post(Lawccess.ajaxURL+"remove_MTM_child_from_parent/",data, function(response)
        {
                $("#group_members").children('tbody').prepend('<tr value="'+id+'"><td><a href="/gallery/user/'+id+'">'+Row.children[0].textContent+'</a></td><td><button onclick="remove_member(this, '+id+')">Remove</button></td><td><button onclick="promote_to_admin(this)">Make admin</button></td></tr>')
                Row.remove()
        })
}

function abdicate_organization(element){
    Row = $(element).parentsUntil('tr')[0].parentElement
    organization_id = Row.getAttribute('value')
    document.getElementById('audiotag1').play();
    confirmation = confirm("You are resigning of owner of this organization. If you are the last owner of the organization, leaving will delete the organization. People might cry about you ruining their work. Continue?")
      if (confirmation == true){
                  element.textContent = "Resign as Admin"
                  element.setAttribute("role","admins")
                  element.onclick = function(){resign_from_role(element)}
          $.post(Lawccess.URL+"gallery/organization/abdicate/"+organization_id, function(response){
              if (response=="deleted"){
                  Row.remove()
              }
          })
      }
}

//$(document).ready(function(){
  //console.log($("#accordian"))
//})
