Source = (function(){
	var CURRENT_CITATION = 0 //CURRENT_CITATION tracks which citation to relate to outline-elements in 'section#outline'
	var Citations = {}
	
	var newSource = false; ////
	var issue_buttons = {}
	issue_buttons.active_color = "#AABBDD"
	issue_buttons.inactive_color = "#eddde2"
	
	var Citation = (function(){
		var create_citation = function(){
			var source_id = Lawccess.context.source;
			var $citationTable = $("table#citations");  // Get the citation table for that case
			var $lastRow = $citationTable.children().children("tr:last"); // find the last row in the table
			var $rule_column = $lastRow.children(".content");                           // find the first cell in the last row
			var rule_column = $rule_column.html().trim();                               // Remove the whitespace from the first cell
			if (rule_column.length == 0 || rule_column == "<br>" || !Lawccess.context.editable){ // If this cell is empty return focus to it.
				$rule_column.focus();
			}
			else if (Lawccess.context.editable) {  // If the cell had get an id number for the next citation and add a new row.
				$.post(Lawccess.context.ajaxURL+"create/", {"model":"citation","source":source_id, "parent_model":"source"}, function(response){
					if (response['status']=="success"){
						var id = response.id
						var citation= {"id":id,"content":"","note":"","locator":"","outlineElements":[],"source_id":source_id,"timestamp":parseFloat(response["timestamp"])}
						Lawccess.data.citations[id] = citation;
						add_citation_row(citation); // add the new row after the old row
						var $newLastRow = $citationTable.children().children("tr:last");// put new row in jquery object
						if (newSource == false){
							$newLastRow.children(".content").focus(); // focus on first cell in new row.
						} else {
							newSource = false
						}
					}
				})
			} else {
				var citation= {"id":Date.now(),"content":"","note":"","locator":"","outlineElements":[],"source_reference":"","timestamp":Date.now()}
				add_citation_row(citation); // add the new row after the old row
				var $newLastRow = $citationTable.children().children("tr:last"); // put new row in jquery object
				if (newSource == false){
					$newLastRow.children(".content").focus(); // focus on first cell in new row.
				} else {
					newSource = false
				}
			}
		}

		var update_field = function(field) {
			var row = field.parentNode
			var id = row.getAttribute("value")//.parent().parent().parent().attr('id');
			var model = row.getAttribute("class");
			var field_name = field.getAttribute('class');
			var json = Lawccess.data.citations[id];
			var timestamp = json.timestamp;
			var data = {
			   "model":model,
				"id":id, 
				"field":field_name,
				"timestamp":timestamp
			}
			data[field_name] = Markup.html_to_markup(field)//.replace(/<br>/g," ")
			if (Lawccess.context.editable){
				$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				    Response.update(data, field, json, response)
				})
			}
		}

		var update_locator = function(field){
			var row = field.parentNode
			var id = row.getAttribute("value")//.parent().parent().parent().attr('id');
			var model = row.getAttribute("class");
			var field_name = field.getAttribute('class');
			var json = Lawccess.data.citations[id];
			var timestamp = json.timestamp;
			var data = {
			   "model":model,
				"id":id, 
				"field":field_name,
				"timestamp":timestamp
			}
			var value =[]
			for (i=0;i<field.children.length;i++){
				value.push(field.children[i].textContent)
			}
			data[field_name] = value.join('|')
			if (Lawccess.context.editable){
				$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				    Response.update(data, field, json, response)
				})
			}

		}

		var update_row = function(id) {
			try {
				var row = document.getElementById('citation_'+id);
				var citation = Lawccess.data.citations[id]
				row.children[0].innerHTML = Markup.markup_to_html(citation.content);
				row.children[1].innerHTML = Markup.markup_to_html(citation.locator)
				row.children[2].innerHTML = Markup.markup_to_html(citation.note)
			} catch (e) {

			}
		}

		var add_citation_row = function(citation){
			var id = citation.id
			var outlineElements = Relationships.get_citation_elements(Lawccess.data, id)
			Source.Citations[citation.id]={}
			Source.Citations[citation.id]['outlineElements']={}
			for (i in outlineElements){
				Source.Citations[citation.id]['outlineElements'][outlineElements[i]['e_id']] = outlineElements[i]['id'];
			}
			var timestamp = citation["timestamp"]
			row = document.createElement('TR')
			row.setAttribute('class','citation');row.setAttribute('value',id);
			row.setAttribute('id','citation_'+id);
			["content","locator","note"].map(function(name, index){
				var cell = document.createElement('DIV')
				cell.style.display = "table-cell"
				cell.setAttribute('class',name)
				if (index== 1){
					var type =  Lawccess.data.sources[Lawccess.context.source].bibliography['styletype'] || Lawccess.data.sources[Lawccess.context.source].bibliography['type']
					try {
						var locatorContainer = Lawccess.context.style.locators[type]
						var count = Lawccess.data.sources[citation.source_id].bibliography[locatorContainer].length
					} catch(e){
						var count = 1;
					}				
					var locator = citation['locator'].split('|')
					for (i=0; i < count; i++){
						var x = document.createElement('SPAN');
						x.textContent = locator[i];
						x.style["min-width"]=25;
						x.style["min-height"]=25;
						x.style.border="1px solid gray";
						x.contentEditable = true;
						x.style.display="inline-block";
						cell.appendChild(x)
					}
					$(cell).onEdit(function(e){
						update_locator.call(e, this)
					})
				} else {
					cell.innerHTML = Markup.markup_to_html(citation[name])
					$(cell).editArea(function(){Source.Citation.update_field(this)})
				}
				row.appendChild(cell)
			})
			var issue_button_cell = document.createElement('DIV')
			issue_button_cell.style.display="table-cell"
			issue_button_cell.setAttribute('class','issue')
			var issue_button = document.createElement('BUTTON')
			issue_button.setAttribute('class','issue_button')
			issue_button.textContent = "Issues"

			row.appendChild(issue_button_cell)
			issue_button_cell.appendChild(issue_button)
			issue_button_listener(issue_button)
			document.getElementById('citations').children[0].appendChild(row)
		}

		var issue_button_listener = function(issue_button){
			minimizeOutline = function (e){
				if (e.keyCode == 27){
					$("button.issue_button").css({"background-color":Source.issue_buttons.inactive_color});
					Source.CURRENT_CITATION = 0;
					$("input.citation-outline-relationship").prop('checked',false)
					$("#outline-container").toggle()
					document.body.removeEventListener('keypress', minimizeOutline)
				}					
			}
			issue_button.addEventListener('click', function(e){
				var active_color = Source.issue_buttons.active_color; var inactive_color = Source.issue_buttons.inactive_color;
				var window_pos = $(window).scrollTop()
				var new_pos = window_pos +10
				$("#outline-container").css({top:new_pos})

				var issue_button_id = this.parentNode.parentNode.getAttribute("value")
				if (Source.CURRENT_CITATION == 0) { ///// When Outline Overlay is closed.
					$(this).css({"background-color":Source.issue_buttons.active_color});
					Source.CURRENT_CITATION = issue_button_id;
					$("#outline-container").toggle(function(){
					    //Outline.set_content_div_width($("li.outline-element"))
				setTimeout(function(){Outline.set_outline_size()},15)
					});
					var headings = Source.Citations[Source.CURRENT_CITATION]["outlineElements"]
					for (i in headings) {
					    heading = i//headings[i];
					    $("#list_"+heading).children("input").prop('checked', true)
					}
					document.body.addEventListener('keypress', minimizeOutline)
				} else if (Source.CURRENT_CITATION == issue_button_id) { ///// When pressing the Issue button for the citation that is already activated
					$(this).css({"background-color":Source.issue_buttons.inactive_color});
					Source.CURRENT_CITATION = 0;
					$("input.citation-outline-relationship").prop('checked',false)
					$("#outline-container").toggle()
					document.body.removeEventListener('keypress', minimizeOutline)
				} else { //// When pressing the issue button for a citation that is not activated, but Outline Overlay is open.
					$(".issue_button").css({"background-color":Source.issue_buttons.inactive_color});
					$(this).css({"background-color":Source.issue_buttons.active_color});
					Source.CURRENT_CITATION = issue_button_id;
					$("input.citation-outline-relationship").prop('checked',false)
					var headings = Source.Citations[Source.CURRENT_CITATION]["outlineElements"]
					for (i in headings) {
					    heading = i
					    $("#list_"+heading).children("input").prop('checked', true)
					}
				}
			})
		}

		var create_table = function(data, citation_id) {
			try {
				document.getElementById('citations').remove()
			} catch(e){
				//// try to remove table if it already exists. Updating the sourcetype may change how the citation table should render the locator field, so this is useful.
			}
			var table = document.createElement('TABLE')
			table.setAttribute('id','citations')
			table.setAttribute('class','source_info')
			table.innerHTML = '<tbody><tr><th class="content">Citation</th><th class="locator">Cite Location</th><th class="notes">Notes</th><th class="issue">Issues</th></tr></tbody>'
			document.getElementById('source-container').appendChild(table)
			var new_row_button = document.createElement('BUTTON')
//			new_row_button.setAttribute('class','issue_button')
			new_row_button.setAttribute('z-index',0)
			new_row_button.textContent = "New Row"
			new_row_button.addEventListener('focus',function(){
				Source.Citation.create_citation()
			})
			document.getElementById('source-container').appendChild(new_row_button)
			add_citations(data, function(){focus_last_row_on_load(citation_id)})
			add_listeners_and_format_tables()
		}

		var focus_last_row_on_load = function(citation_id){
			if (typeof(citation_id) == "undefined"){
				var elem = $("#citations tr:last");
				elem.children(".content").focus();
			} else if (citation_id == false) {
				document.getElementById('bib_table').getElementsByTagName('input')[0].focus()
			} else {
				var elem = document.getElementById("citation_"+citation_id)
				elem.children[0].focus()
			}
		}	

		var add_citations = function(citations, callback){
			var _count = 0
			for (citation_id in citations) {
				var citation = citations[citation_id]
				if (citation["source_id"].toString() == Lawccess.context.source.toString()) {
				    add_citation_row(citation)
				    var _count = _count+1
				}
			}
			if (_count == 0) {
				Source.Citation.create_citation()
			}
			callback()
		}

		/* Public API for Source.Citation */
		return {
			update_field:update_field,
			create_citation:create_citation,
			create_table:create_table,
			update_row:update_row,
		}
	})()

	var Bibliography = (function(){
		var VariableFields
		var SourceTypeMenu
		var MonthSelect = [{"value":"","label":"Month/Season"}]
		var DaySelect = [{"value":"","label":"Day"},{"value":"24","label":"1st"}]

		function updateStyle(){
			var styleData = L.FormUtility.retrieve()
//			Lawccess.context.style = styleData;
			Bibliography.VariableFields = styleData['fields'];
			Bibliography.SourceTypeMenu = styleData['styletypemenu'] || styleData['cslmenu'];
			var MonthSelectData = styleData['dateSelect']["months"];
			var SeasonSelectData = styleData['dateSelect']["seasons"];
			MonthSelectData.map(function(monthObj){
				var key = Object.keys(monthObj)[0];
				MonthSelect.push({"value":key,"label":monthObj[key]})
//				MonthSelect.push({"value":key,"label":monthObj[key]["long"]})
			})
			MonthSelect.push({'divider':'true'})
			SeasonSelectData.map(function(monthObj){
				var key = Object.keys(monthObj)[0]
				MonthSelect.push({"value":key,"label":monthObj[key]})
//				MonthSelect.push({"value":key,"label":monthObj[key]["long"]})
			})
		}

		function countPreviousSiblings(element){
			for (i=0;i<element.parentElement.childElementCount;i++){
				if (element.parentElement.children[i] == element){
					return i;
				}
			}
		}

		var SourceTypeSelector = function(source_data) {
			var select = DropDown(Bibliography.SourceTypeMenu, function(e){
				var id = Lawccess.context.source
				var json = Lawccess.Controller._get_data_set().sources[id]
				var timestamp = Lawccess.data.sources[id]["timestamp"]
				var styletype = this.getAttribute('value')
				var field = this
				var CSLtype = this.getAttribute('csltype')
				var data = {
					"model":"source",
					"id":id, 
					"field":"styletype csltype type",
					"timestamp":timestamp,
					"csltype":CSLtype,
					"type":CSLtype,
					"styletype":styletype
				}
				if (Lawccess.context.editable){
					$.post(Lawccess.context.ajaxURL+"update", data, function(response){
						Response.updateSelectField(data, field, json, response);
						Citation.create_table(Lawccess.Controller._get_data_set().citations, false)
						resizeTables();
					})
				}
			})
			select.setValue(source_data.bibliography['styletype'])
			return select;
		}

		var revision_frame = function(source_data){
			fill_bibliography_frame.call(this, source_data, true)
		}

		var fill_bibliography_frame = function(source_data, readonly=false){
			var table = document.createElement('TABLE');
			table.setAttribute('id','bib_table');
			table.setAttribute('class','bib_table');
			var thead = document.createElement('THEAD');
			var table_body = document.createElement('TBODY');
			table.appendChild(thead);
			table.appendChild(table_body);
			var source_type = source_data.bibliography['styletype'];
			var csl_type = source_data.bibliography['csltype'];
			if ((typeof(source_type)=="undefined") || source_type==""){
				source_type="default";
			}
			if (typeof(Bibliography.VariableFields['styletypes'][source_type]) == "undefined"){// changing styles can result in incompatible subtypes.
				var fields = Bibliography.VariableFields['types'][csl_type]
				console.log(1, csl_type, Bibliography.VariableFields['types'][csl_type])
			} else {
				var fields = Bibliography.VariableFields['styletypes'][source_type];
				console.log(2,Bibliography.VariableFields['styletypes'][source_type])
			}
			if (typeof(source_data.bibliography.type) != "undefined"){
				add_fields_to_table(table_body, fields, source_data, readonly)
			}
			try {this.children[1].remove()} catch(e) {}
			this.appendChild(table)
		}

		var create_bibliography_frame = function(source_data){
			var div = document.createElement('DIV');
			div.id = 'bibliography';
			var sourceContainer = document.getElementById('source-container');
			sourceContainer.insertBefore(div, sourceContainer.children[0]);
			var menu_div = document.createElement('DIV');
			div.appendChild(menu_div);
			menu_div.appendChild(SourceTypeSelector(source_data));
			var cite_frame = document.createElement('SPAN');
			cite_frame.setAttribute('id','bibliographic-render');
			menu_div.appendChild(cite_frame);
			updateRender(Lawccess.context.source);
			var revisions = document.createElement("BUTTON")
			revisions.textContent = "See Revision History";
			revisions.addEventListener('click', function(e){
			    Revisions.set('Source', Lawccess.context.source);
			})
			menu_div.appendChild(revisions)
			fill_bibliography_frame.call(div, source_data);
		}

		var update_bibliography_frame = function(source_data){
			document.getElementById('bibliography').remove();
			create_bibliography_frame(source_data);
		}

		var update_bibliography_sourcetype = function(source_data){
			try {
			document.getElementById('bib_table').remove();
			} catch(e){}
			fill_bibliography_frame.call(document.getElementById('bibliography'), source_data);
		}


		var DatePartSelector = function(field, data, time) {
			var year = data['year'] || ""
			var month = data['month'] || ""
			var day = data['day'] || ""
			var daysInMonth 
			if (time=="month"){
				var ListElements = MonthSelect;
			} else if (time == "day"){
				daysInMonth = new Date(year, month.split("month-")[1], 0).getDate() //Get number of days in month for year
				if (daysInMonth.toString() == "NaN"){ //// If the month-part is a season or undefined, set days to 0.
					daysInMonth = 0;
				}
				ListElements = Array(daysInMonth).fill().map(function(_,i){return {"value":i+1,"label":i+1} })
				ListElements.unshift({"value":"","label":"Select Date"})
			}

			function updateSibling(){
				this.parentElement.insertBefore(DatePartSelector(field, data, "day"), this.nextSibling)
				this.nextSibling.nextSibling.remove()
			}
			var select = DropDown(ListElements, function(e){
				var id = Lawccess.context.source
				var value = this.getAttribute('value')
				var field = this
				var field_name = this.getAttribute('name').split('_')[0]
				var subfield_name = this.getAttribute('name').split('_')[1]
				var pos = countPreviousSiblings(field.parentElement.parentElement); //// find relative position of field frame. Relative position indicates relative importance, and acts as ID for the frame.
				var json = Lawccess.data.sources[id]
				var timestamp = Lawccess.data.sources[id]["timestamp"]
				var data = {
					"model":"source",
					"id":id, 
					"field":field_name,
					"timestamp":timestamp,
					"subfieldKeys":""+pos+","+subfield_name,
				}
				data[field_name]= value;
				if (Lawccess.context.editable){
					$.post(Lawccess.context.ajaxURL+"update", data, function(response){
						Response.updateSelectField(data, field, json, response)
						if (subfield_name== "month"){
							updateSibling.call(field);
						}
					})
				}
			})
			select.setAttribute('name', field.fieldName + "_" + time);
			if (daysInMonth) {
				if (daysInMonth === 0){
					select.setValue("")
				} else if (parseInt(day) > daysInMonth) {
					select.setValue("") //// updateValue executes update callback					
				} else {
					select.setValue(data[time])
				}
			} else if (typeof(data[time]) == "undefined") {
				select.setValue("")
			} else {
				select.setValue(data[time])
			}
			return select;
		}

		var addSubFields = function(field, data, readonly){
			var subfields = field['subfields']
			var parent = this;
			if (field.datatype == "date"){
				var subfield_div_top = document.createElement('DIV');
				subfield_div_top.style.display = "table-row";
				subfields.map(function(subfield){
					if (subfield.datatype == "date-month") {
						var subfield_div_input = DatePartSelector(field, data, "month")
					} else if (subfield.datatype == "date-day") {
						var subfield_div_input = DatePartSelector(field, data, "day")
					} else {
						var subfield_div_input = document.createElement('INPUT')
						subfield_div_input.style.width="100";
						subfield_div_input.name = subfield.fieldName;
						if (!(readonly)){
							$(subfield_div_input).onEdit(function(e){
								update_complex_field(this);
							})
						}
						if (typeof(data[subfield.fieldName]) == "undefined"){
							subfield_div_input.value = "";
						} else {
							subfield_div_input.value = data[subfield.fieldName];
						}
					}
					subfield_div_input.name = subfield.fieldName;
					subfield_div_input.classList.add('entry_field');
					subfield_div_input.style.display = "table-cell";
					if (readonly){
						subfield_div_input.classList.add('revision_input_field');
					}
					subfield_div_top.appendChild(subfield_div_input);
				})
				parent.appendChild(subfield_div_top);
			} else {
				subfields.map(function(subfield){
					var subfield_div = document.createElement('DIV');
					subfield_div.style.display = "table-row";
					var subfield_div_label = document.createElement('SPAN')
					subfield_div_label.classList.add('subfield_label');
					subfield_div_label.style.display = "table-cell";
					subfield_div_label.textContent = subfield.label;
					if (typeof(subfield.description)!="undefined"){
						subfield_div_label.title = subfield.description;
					} else {
//						subfield_div_label.title = CSLVariableDescriptions[subfield.fieldName]
					}

					var subfield_div_input = document.createElement('INPUT')
					if (!(readonly)){
						$(subfield_div_input).onEdit(function(e){
							update_complex_field(this);
						})
					}
					if (typeof(data[subfield.fieldName]) == "undefined"){
						subfield_div_input.value = "";
					} else {
						subfield_div_input.value = data[subfield.fieldName];
					}
					subfield_div_input.name = subfield.fieldName;
					subfield_div_input.classList.add('entry_field');
					subfield_div_input.style.display = "table-cell";
					if (readonly){
						subfield_div_input.classList.add('revision_input_field');
					}
					subfield_div.appendChild(subfield_div_label);
					subfield_div.appendChild(subfield_div_input);
					parent.appendChild(subfield_div);
				})
			}
		}


		var buildSerialField = function(row, field, serials_data, readonly) {
			if (typeof(serials_data)=="undefined"){serials_data=[]}
			else if (typeof(serials_data)=="string"){serials_data=[]}
//			var serial_keys = Object.keys(serials_data); //// get the keys for the serial sources. Key 0 is the primary location for the source (such as the official reporter for a case).
			var td1 = document.createElement('TD');
			td1.textContent = field.label;
			if (typeof(field.description)!="undefined"){
				td1.title = field.description;
			}
			td1.classList.add('field_label');
			var td2 = document.createElement('TD');
			td2.setAttribute('field_name', field.fieldName);
			serials_data.map(function(data){ //// We allow parallel citations when a source can be found in more than one location. Loop through them.
				var main_serial_div = document.createElement('DIV'); //// Create frame that will hold the complex field.
				main_serial_div.setAttribute('ordering',i); //// This matches the frame to the serial data. Lawccess.data.source.bibliography.serial[serial #i]
				td2.appendChild(main_serial_div);
				//// Another loop. I'm sorry to future self. It's just more efficient.
				//// Each subfield in the complex field must be built and added.
				addSubFields.call(main_serial_div, field, data, readonly)
			})
			if (!(readonly)){
				var add_button = document.createElement('button')
				add_button.textContent = "Add";
				td2.appendChild(add_button);
				add_button.addEventListener('click',function(e){
					var count = countPreviousSiblings(this);
					var main_serial_div = document.createElement('DIV'); //// Create frame that will hold the complex field.
					main_serial_div.setAttribute('ordering',i);
					this.parentNode.insertBefore(main_serial_div, this);
					addSubFields.call(main_serial_div, field, [], readonly)
				});
				var delete_button = document.createElement('button')
				delete_button.textContent = "Remove Last";
				td2.appendChild(delete_button);
				delete_button.addEventListener('click',function(e){
					var count = countPreviousSiblings(this);
					if (count > 2){
						var last_field_pos = count-2;
						this.parentNode.children[last_field_pos].remove()
						update_entire_complex_field(this.parentNode)
					}
				})
			}	
			row.appendChild(td1); row.appendChild(td2)
		}

		var buildEditField = function(row, field, source_data, readonly) {
			var td1 = document.createElement('TD');
			td1.innerHTML = field.label;
			if (typeof(field.description) != "undefined"){
				td1.title = field.description;
			}
			td1.classList.add('field_label');
			var td2 = document.createElement('INPUT')
			td2.value = source_data.bibliography[field.fieldName] || ""
			td2.classList.add('entry_field');
			td2.name = field.fieldName;
			if (readonly == false){
				$(td2).editField(function(){
					update_simple_field(this)
				})
			}
			row.appendChild(td1); row.appendChild(td2);
		}

		var add_fields_to_table = function(table_body, fields, source_data, readonly){
			fields.map(function(field){
//				if (typeof(source_data.bibliography[field.fieldName]) != "undefined"){
					var row = document.createElement('TR')
					row.setAttribute('class','source')
					row.setAttribute('value',source_data.id)
					if (field.datatype == "containers") {
						buildSerialField(row, field, source_data.bibliography[field.fieldName], readonly);
					} else if (field.datatype == "names"){
						buildSerialField(row, field, source_data.bibliography[field.fieldName], readonly);
					} else if (field.datatype == "date"){
						if (typeof(source_data.bibliography[field.fieldName])=="string"){
							var date = new Date(source_data.bibliography[field.fieldName])
							if (date.toString() == "Invalid Date") {
								buildSerialField(row, field, "", readonly);
							} else {
								buildSerialField(row, field, [{'year':date.getFullYear(),'month':date.getMonth()+1,'day':date.getDate()+1}], readonly);
							}
						} else {
							buildSerialField(row, field, source_data.bibliography[field.fieldName], readonly);
						}
					} else {
						buildEditField(row, field, source_data, readonly);
					}
					table_body.appendChild(row);
//				}
			})

		}

		var updateRender = function(id){
			document.getElementById("bibliographic-render").innerHTML = easyRender(id);
		}

		var update_simple_field = function(field){ 
			var row = field.parentNode;
			var id = row.getAttribute("value")//.parent().parent().parent().attr('id');
			var model = "source"
			var field_name = field.getAttribute("name");
			var timestamp
			var json
			if (model == 'source') {
				json = Lawccess.Controller._get_data_set().sources[id]
				timestamp = Lawccess.data.sources[id]["timestamp"]
			}
			var data = {
			   "model":model,
				"id":id, 
				"field":field_name,
				"timestamp":timestamp
			}
//			updateRender(id)
			data[field_name] = field.value;//Markup.html_to_markup(field)//.replace(/<br>/g," ")
			if (Lawccess.context.editable){
				$.post(Lawccess.context.ajaxURL+"update", data, function(response){
				    Response.update(data, field, json, response)
				})
			}
// TODO:
		}

		var update_complex_field = function(field){ //// Updates a complex field, where the field has sub-fields. //Expects <td> element.
			//// Complex Fields are complicated. We need to pass the normal parameters:
			//// Model, ID, Field name, timestamp, value. However, "value" is not actually
			//// the value for the Field name; it's actually a value for a subfield within the complex
			//// field name. Which subfield does value pertain to? That is identified by a new parameter: keys.
			//// keys is a stringified list in descending order of all identifiers needed to identify the field.
			var row = field.parentNode.parentNode.parentNode.parentNode;
			var id = row.getAttribute("value")//.parent().parent().parent().attr('id');
			var model = row.getAttribute("class");//"model"
			var field_name = field.parentNode.parentNode.parentNode.getAttribute('field_name')
			var timestamp
			var json
			if (model == 'source') {
				json = Lawccess.data.sources[id]
				timestamp = Lawccess.data.sources[id]["timestamp"]
			}
			var data = {
			  "model":model,
				"id":id, 
				"field":field_name,
				"timestamp":timestamp
			}
			var keys=[]
			keys[0] = countPreviousSiblings(field.parentElement.parentElement); //// find relative position of field frame. Relative position indicates relative importance, and acts as ID for the frame.
			keys[1] = field.name;
			data['subfieldKeys']= ""+keys[0]+","+keys[1];
			data[field_name]= field.value;
			if (Lawccess.context.editable){
				$.post(Lawccess.context.ajaxURL+"update", data, function(response){
					Response.update_complex_field(data, field, json, response);
					updateRender(Lawccess.context.source)
					if (keys[1] == "year"){
						field.nextSibling.nextSibling.remove()
						field.parentElement.insertBefore(DatePartSelector(field_name, json.bibliography[field_name][keys[0]], "day"), field.nextSibling.nextSibling)
					}
				})
			}
		}

		var update_entire_complex_field = function(field){
			function serializeFields(field){
				var ret=[]
				for (var i =0; i < field.children.length-2; i++){
					var serial = field.children[i];
					ret.push({})
					var subfields = serial.getElementsByTagName('input')
					for (var j=0;j<subfields.length;j++){
						var subfield = subfields[j]
						ret[i][subfield.name] = subfield.value
					}
				}
				return JSON.stringify(ret)
			}
			var row = field.parentNode;
			var id = row.getAttribute("value")//.parent().parent().parent().attr('id');
			var model = row.getAttribute("class");//"model"
			var field_name = field.getAttribute('field_name')
			var timestamp
			var json
			if (model == 'source') {
				json = Lawccess.data.sources[id]
				timestamp = Lawccess.data.sources[id]["timestamp"]
			}
			var data = {
			   "model":model,
				"id":id, 
				"field":field_name,
				"timestamp":timestamp
			}
			var value = serializeFields(field)
			data[field_name]= value;
		//    data[field_name] = JSON.stringify(subdata);//Markup.html_to_markup(field)//.replace(/<br>/g," ")
			if (Lawccess.context.editable){
				$.post(Lawccess.context.ajaxURL+"update", data, function(response){
					Response.update_complex_field(data, field, json, response);
				})
			}
		}

		//// Public API
		return {
			MonthSelect:MonthSelect,
			SourceTypeMenu:SourceTypeMenu,
//			SeasonSelect:SeasonSelect,
			updateRender:updateRender,
			VariableFields:VariableFields,
			updateStyle:updateStyle,
			revision_frame:revision_frame,
			create_bibliography_frame:create_bibliography_frame,
			update_bibliography_frame:update_bibliography_frame,
			update_bibliography_sourcetype:update_bibliography_sourcetype,
		}
	})()


	var createSourcePage = function(data, citation_id) {
		var source_data = data.sources[Lawccess.context.source]
		document.getElementById('source-container').innerHTML = "" // Clears section.
		Source.Citations = {}// reset Citations list
		Bibliography.create_bibliography_frame(source_data)
		if (typeof(source_data.bibliography.type) != "undefined"){
			Citation.create_table(data.citations, citation_id)
		}
	}


	function resizeTables(){
		try {
			document.getElementById("bib_table").style.width = window.innerWidth-130 +"px"
			document.getElementById("citations").style.width = window.innerWidth-50 +"px"
		} catch(e) {}
		
	}
	var add_listeners_and_format_tables = function(){
		document.getElementById("bib_table").style.width = window.innerWidth-130 +"px"
		document.getElementById("citations").style.width = window.innerWidth-50 +"px"
		window.onresize=function(){
			resizeTables();
		}
	}



	/* Public API */
	return {
		CURRENT_CITATION:CURRENT_CITATION,
		Bibliography:Bibliography,
		createSourcePage: createSourcePage,
//		updateSource, updateSource,
		Citation: Citation,
		Citations: Citations,
		issue_buttons: issue_buttons,
	}
})()
