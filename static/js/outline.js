var DEBUG;
Outline = (function(){
	//// Note: Node position starts at position 0. Because the very first node is a special, non-interactive Title node, it does not count. Therefore,
	//// top-level nodes will have canonical position that is 1 less than its actual position in the DOM.


	var InitNestedSortable = function(OutlineList){
		$(OutlineList).nestedSortable({
		    distance: 4,
		    forcePlaceholderSize: true,
		    handle: 'div.disclose',
		    helper: 'clone',
		    items: 'li.outline-element',
		    opacity: .6,
		    placeholder: 'placeholder',
		    revert: 250,
		    tabSize: 25,
		    tolerance: 'pointer',
		    toleranceElement: '> div',
		    connectWith: "ol.sortable",
		    maxLevels: 250,
		    isTree: true,
		    expandOnHover: 700,
		    startCollapsed: true,
		    activate: function(event, ui){
		        Outline.activeElement = ui.item[0].parentNode.parentNode
		    },
		    update: function(event, ui){
		        ui.sender = Outline.activeElement;
		        Outline.movement_update(ui);
		    },
		    receive: function(event, ui) {
		    }
		})
	}

	var OutlineHeader = function(title) {
		var ol = document.createElement('OL')
		ol.setAttribute('class','sortable')
		ol.innerHTML = '<li id="list_0" value="0" class="outline-head"><div><div class="outline_title"><b>'+title+'</b></div><ul class="outline-element-options"><li class="heading_option_button"><span tabindex="0" class="heading_option_button_span">+</span><ul class="heading_option_list"><li class="new_row" tabindex="0">New Row</li></ul></li></ul></div>'
		return ol
	}

	function transmit (delta, VALIDATOR){ //// VALIDATOR is usually a timestamp or hash.
		var dict = {'c':'content','h':'heading'};
		var canvas = this;
		var ID = canvas.getAttribute("id").substr(7); /// #
		var MODEL = canvas.getAttribute("id").substr(0,4); /// "node"
		var FIELD = canvas.getAttribute("id").substr(5,1); /// "content", "heading"
		delta.splice(0, 0, {'ed':MODEL +"."+ ID+"."+dict[FIELD]});
		return $.post('/api/project/delta/'+Lawccess.context.project, JSON.stringify({'L':Lawccess.context.logPos, 'D':delta}))
		.then(function(response){
			delta[0]['T'] = response['T'];
			Lawccess.context.logPos = response['L'];
			if (response.hasOwnProperty('D')){
				return response['D'];
			} else {
				return [];
			}
		});
	}

	var nestedListRow = function(id, data){
		var heading, bodyText
		data = data || {};
		var li = document.createElement('LI')
		li.setAttribute('id','list_'+id)
		li.setAttribute('class','outline-element')
		li.setAttribute('value',id)
		li.innerHTML = '<div><div class="disclose"><span></span></div><div class="heading"></div><ul class="outline-element-options"><li class="heading_option_button"><span tabindex="0" class="heading_option_button_span">+</span></li></ul><div class="substance"><div class="content" ></div><!-- div.content --></div><!-- .substance --></div><input name="citation-outline-relationship" class="citation-outline-relationship" type="checkbox" value="'+id+'">';
		Shadow.connect(li.children[0].children[3].children[0], transmit);
		li.children[0].children[3].children[0].setAttribute("id","Node.c."+id);
		Shadow.connect(li.children[0].children[1], transmit);
		li.children[0].children[1].setAttribute("id","Node.h."+id);
		add_listeners_to_outline_row(li);

		///// end deltas support /////

		return li
	}

	var set_element_width = function(element){
		if (typeof(element)== "undefined"){element = "li.outline-element";}
		inputs = [];
		$(element).each(function(){
			var $this = $(this);
			var width = this.parentNode.parentNode.getAttribute('_width')-25;
			this.style.width=width;
			this.children[0].style.width = width-25;
			this.setAttribute("_width",width); // The '_width' attribute allows us set the right width for elements that are hidden when this function is called.
			$this.children('div').children('div.heading').width(width-80); //// for div.heading
			$this.children('div').children('div.substance').width(width-50); /// for div.substance
			inputs.push(this.children[1]);
		})
	}

	var _delete_child_elements_data = function(order){
		var next_generation = [];
		if ((order[0] == "") && (order.length==1)){
			return
		} else {
			for (i in order){
				var id = order[i]
				var children = Lawccess.data.outlineElements[id].order.split(',')
				for (i in children){
					if (children[i] != ""){
						next_generation.push(children[i])
					}
				}
				delete Lawccess.data.outlineElements[id]
			}
		}
		if (next_generation.length > 0){
			Outline._delete_child_elements_data(next_generation)
		}
	}

/*	var delete_element = function(element) {
		var _lambda = function(element){
		    if (element.getAttribute('value') == "*replaceME*"){
		        setTimeout(function(){lambda(element)}, 250)
		    } else {
		        var element_id = element.getAttribute('value')
		        $.post(Lawccess.site.diffURL+"delete",{"m":"outlineElement","id":element_id,"l":Lawccess.context.logPos,"t":Lawccess.data.outlineElements[element_id].timestamp,"parent":Lawccess.data.outlineElements[element_id].parent_id}, function(response){
		            if (response != "1") {console.log('error')}
		            else {
//				Outline._delete_child_elements_data(Lawccess.data.outlineElements[element_id].order.split(','))
						Outline._delete_child_elements_data(Lawccess.data.outlineElements[element_id].order)
						delete Lawccess.data.outlineElements[element_id]
					}
		        })
		        Lawccess.fn.outline.shift()
		        if (Lawccess.fn.outline.length>0){
		            Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
		        }
		    }
		}
		if (Lawccess.context.editable){
		    Lawccess.fn.outline.push([_lambda, element])
		    if (Lawccess.fn.outline.length == 1){
		        Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
		    }
		}
		var $element = $(element)
		$element.prev().children('div').children('.heading').focus()
		$element.remove()
		if ($element.parent('ol').html() == ""){$element.parent('ol').remove();}
		try {$element.prev().focus();}
		catch(e){$element.parent().parent().focus();}
	}*/

	function delete_row(element) {
		var position = Array.from(element.parentElement.children).indexOf(element);
		var parentID = getParentID(element);
		var ID = element.getAttribute('value');
		var user = Lawccess.context.user;
		var delta = [{"rm":"Node."+ID, "u":user}];
		var VALIDATOR = 0;
		if (element.previousSibling){
//			element.previousSibling.focus();
		} else {
//			element.parentElement.parentElement.focus();
		}
		return $.post('/api/project/delta/'+Lawccess.context.project, JSON.stringify({'L':Lawccess.context.logPos,'V':VALIDATOR, 'D':delta})).then(function(response){
			delta[0]['T'] = response['T'];
			Lawccess.context.logPos = response['L'];
			API.rm(delta[0], true);
			if (response.hasOwnProperty('D')){
				return response['D'];
			} else {
				return [];
			}
		});
	}
	var delete_element = delete_row;

	var collapse_element = function(element){
		setTimeout(function(){
			var Childz = element.children[0].getElementsByTagName('*');
			var focused;
			for (i=0; i<Childz.length; i++){
				if (document.activeElement == Childz[i]){
					focused = true;
				}
			}
			if (document.activeElement.parentElement.parentElement == CitationPopup.citationPane){
				focused = true; //// Hitting a button on the CitationPopup should not make the element collapse. The CitationPopup will put the focus back on the element.
			}
			else if (document.activeElement.parentElement == document.getElementById('editorButtons')){
				focused = true; //// Hitting a button on the Formatting toolbar should not make the element collapse.
			}
			else if (Lawccess.context.CitationList){
				focused=true;
			}
			if (focused != true){
				 $(element).children('div').children('div.substance').slideUp(400)
			}
		}, 100)
	}

/*	var create_new_element = function(element){
		var lambda = function(data){
		    var element = data.element
		    var parent_id  = data.parent.getAttribute('value')
		    if (parent_id == null){parent_id=""}
		    var siblings = data.siblings;
		    _siblings = [];
		    for (i in siblings){
		        _siblings.push(siblings[i].getAttribute('value'))
		    };
			var position = _siblings.indexOf("*replaceME*")
			_siblings.splice(position,1)
            var data = {
                "ins":position,
                "p":parent_id,
                "sibs":HashList(_siblings),
				"l":Lawccess.context.logPos,
				"m":"node",
            }
			if (parent_id == ""){
				data["p"] = 0;
			}
		    if (Lawccess.context.editable){
		        $.post(Lawccess.site.diffURL+"create", data, function(response){
		            Response.Diff.CreateNode(data, element, response)
		            ///// Code for handling Lawccess.fn.creation_queue
		        })
		    } else {
		        Response.createHeading(new_row, data, Lawccess.data.outlineElements, {'status':'success','id':Math.floor(Math.random() * (1,000 - 1 + 1)) + 1})
		        Lawccess.fn.outline.shift()
		    }
		}
		var $current_row = $(element)
		Outline.collapse_element(element)
		var new_row = Outline.nestedListRow();

		element.parentElement.insertBefore(new_row, element.nextSibling);
//		$current_row.after(Outline.nestedListRow()) // create new row in DOM. It is the same level as $current_row.
//		var $new_row = $current_row.next()
	////// Set the width of 'div.heading'.
		Outline.set_element_width(new_row)
		var siblings = [];
		var outline_header = document.getElementById('list_0');
		for (i=0; i<new_row.parentNode.children.length; i++){
		    if (new_row.parentNode.children[i] != outline_header){
		        siblings.push(new_row.parentNode.children[i])
		    }
		}
		var data = {
		    "element":new_row,
		    "parent":new_row.parentNode.parentNode,
		    "siblings":siblings
		}
		Lawccess.fn.outline.push([lambda, data])
		if (Lawccess.fn.outline.length == 1){
		    Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
		}

		setTimeout(function(){
			new_row.children[0].children[1].focus(); /// TODO: validate.
//		$new_row.children().children('.heading').focus()
		}, 300)
	}*/

	function create_new_row (element){
		var position = Array.from(element.parentElement.children).indexOf(element);
		//var parentID = getParentID(element);
		var user = Lawccess.context.user;
		var parentId = element.parentNode.parentNode.getAttribute('value') || 0;
		var position = Array.from(element.parentNode.children).indexOf(element);
		if (parentId !== 0){ 
			position ++; //// insert AFTER current node. 
			//// b/c top-level nodes must be decremented any to convert from actual position to canonical position, just skip increment.
		}
		var delta = {"mk":"Node", "ptg":parentId, "pos":position, "u":user}; //// "mk" is set to 0, so server knows to give us an ID.
		Outline.collapse_element(element);
		return $.post('/api/project/delta/'+Lawccess.context.project, JSON.stringify({'L':Lawccess.context.logPos, 'D':[delta]})).then(function(response){
			delta['T'] = response['T'];
			delta['mk'] = response['mk'];
			Lawccess.context.logPos = response['L'];
			API.mk(delta, true);
			if (response.hasOwnProperty('D')){
				return response['D'];
			} else {
				return [];
			}
		}).then(function(Deltas){
			App.applyDeltas(Deltas);
			return Deltas;
		});
	}
	var create_new_element = create_new_row;

	var add_listeners_to_outline_row = function(LI){
		var element = LI;
		var $element = $(element);
		var disclose = LI.children[0].children[0];
		var heading = LI.children[0].children[1];
		var optionMenu = LI.children[0].children[2];
		var substance = LI.children[0].children[3];
		var contentEditor = substance.getElementsByClassName('content')[0];

		function showSubstance (substanceField){
		    $(substanceField).slideDown(400)
		}

		element.children[0].children[0].addEventListener('click', function(e){
			if (LI.classList.contains('mjs-nestedSortable-branch')){
				if (LI.classList) { 
					LI.classList.toggle("mjs-nestedSortable-collapsed");
					LI.classList.toggle("mjs-nestedSortable-expanded");
				} else {
					// For IE9
					var classes = LI.className.split(" ");
					var i = classes.indexOf("mjs-nestedSortable-collapsed");
					if (i >= 0) {
						classes.splice(i, 1);
						classes.push("mjs-nestedSortable-expanded");
					} else {
						classes.splice(classes.indexOf("mjs-nestedSortable-expanded"), 1);
						classes.push("mjs-nestedSortable-collapsed");
					}
					LI.className = classes.join(" "); 
				}
			}
		})

		heading.addEventListener('focus', function(e){
			showSubstance(substance);
		})
		heading.addEventListener('blur', function(e){
		})
		Drag.make_droppable(contentEditor);
		contentEditor.addEventListener("focus", function(e){
		    this.style.border="1px solid #62F0F0";
		    this.style['box-shadow']= "0px 0px 3px #62F0F0";
			Signal.send("editor","focus");
		});

		contentEditor.addEventListener("blur", function(){
		    this.style.border="1px solid #d4d4d4";
		    this.style['box-shadow']= "0px 0px 0px transparent";            
			Signal.send("editor","blur");
		});

		$(element).children('div').children().each(function(){
		    $(this).blur(function(event){
		        Outline.collapse_element(element)
		    })
		});

		$(element).children('div').children().children().each(function(){
		    $(this).blur(function(event){
		        Outline.collapse_element(element)
		    })
		});

		var heading_option_button = $element.children().children('ul').children('.heading_option_button')
		Outline.OptionMenu.__init__(heading_option_button[0])

		add_keyboard_shortcuts(element)

		$(element).children("input.citation-outline-relationship").click(function(e){
			var checked = this.checked;
		    var outlineElement_id = this.value;
			var citation_id = Source.CURRENT_CITATION;
			var relationship_id = Source.Citations[citation_id]['outlineElements'][outlineElement_id]
			if ((checked == true)&&(typeof(relationship_id)) != "undefined"){
				this.checked = false;
			}
			else if ((checked == false) && (typeof(relationship_id) == "undefined")){
				this.checked = true;
			} else {
				Relationships.change(outlineElement_id, citation_id, relationship_id);
			}
		})

	///// Citation Popup
		refs= element.getElementsByTagName('REF');
		for (i=0; i<refs.length;i++){
		    CitationPopup.add(refs[i])
		}
	}

	 var set_outline_size = function() {
		if (Lawccess.context.location == "outline"){
	//        body_width = $(window).width() * .95
		    var project_width = $(window).width()-40;
		}
		else if (Lawccess.context.location == "source") {
			var project_width = $(window).width()-120;
		}
		document.getElementById("outline-container").style.width = project_width
		document.getElementById("outline-container").setAttribute("_width", project_width)
		document.getElementById("list_0").style.width = project_width-48;
		Outline.set_element_width()
	}


	var get_parent_order = function(pk){
		if ((pk == 0) || (pk=="0")){
			return Lawccess.Controller._get_data_set().outline.order;
		} else {
			return Lawccess.Controller._get_data_set().outlineElements[pk].order;
		}
	}

/*
	var movement_update = function(ui){
		var element = ui.item[0]
		var _new_siblings = element.parentNode.children
		var new_parent = element.parentNode.parentNode
		var old_parent =  ui.sender
		var _old_siblings = old_parent.getElementsByTagName('ol')[0].children
		var new_siblings = []
		var old_siblings = []
		//// Converting html collections to normal arrays
		for (i=0;i<_new_siblings.length;i++){new_siblings.push(_new_siblings[i])}
		for (i=0;i<_old_siblings.length;i++){old_siblings.push(_old_siblings[i])}
		
		Outline.set_element_width()
		if (ui.item.attr('id') == "list_0"){ // Disables helper <li> from being moved. 0 never conflicts with db id's.
		    
		    var empty_ol = ui.item.parent('ol')
		    $('ol.sortable').nestedSortable('cancel');
		    if (empty_ol.html() == "") {
		        empty_ol.parent().toggleClass('mjs-nestedSortable-branch mjs-nestedSortable-leaf');
		        empty_ol.parent().removeClass('mjs-nestedSortable-expanded')
		        empty_ol.remove()
		    }
		    ui.item.width(ui.item.parent().width()) // Make sure it returns to proper size upon return after being cancelled.
		} else if (ui.item.parent('ol').parent().attr('id') == "list_0") { // Disables helper <li> from accepting children.
	// When we cancel the children; we have to do some manual house-cleaning
	// to remove the branch classes with the leaf class, and remove the empty
	// ordered list.
		    var empty_ol = ui.item.parent('ol')
		    empty_ol.parent().toggleClass('mjs-nestedSortable-branch mjs-nestedSortable-leaf');
		    empty_ol.parent().removeClass('mjs-nestedSortable-expanded')
		    $('ol.sortable').nestedSortable('cancel');
		    empty_ol.remove()
		    ui.item.width(ui.item.parent().width()) // Make sure it returns to proper size upon return.
		} else if (ui.item.next().attr('id') == "list_0") { // No placing elements above #list_0.
		    $('ol.sortable').nestedSortable('cancel');
		    ui.item.width(ui.item.parent().width()) // Make sure it returns to proper size upon return.
		} else { //// All conditions are satisfied.
		    var lambda = function(elements){
		        var updateHeading = function(elements){
		            var _new_siblings = []
		            var _old_siblings = []
		            var old_parent_id = "0"
		            var new_parent_id = "0"
		            var outline_header = document.getElementById('list_0')
		            var element_id = elements.element.getAttribute('value')
		            for (i in elements.new_siblings){
		                if (elements.new_siblings[i] != outline_header){
		                    _new_siblings.push(elements.new_siblings[i].getAttribute('value'))        
		                }
		            }
		            for (i in elements.old_siblings){
		                if (elements.old_siblings[i] != outline_header){
		                    _old_siblings.push(elements.old_siblings[i].getAttribute('value'))
		                }
		            }
		            if (elements.new_parent != document.getElementById('outline-container')){
			            new_parent_id = elements.new_parent.getAttribute('value')    
		            }
		            if (elements.old_parent != document.getElementById('outline-container')){
			            old_parent_id = elements.old_parent.getAttribute('value')    
		            }
		            if (element_id.indexOf('*replaceME*') != -1){
		                setTimeout(function(){updateHeading(elements)},100)
		            } else if (new_parent_id.indexOf('*replaceME*') != -1){
		                setTimeout(function(){updateHeading(elements)}, 100)
		            } else if (_new_siblings.indexOf('*replaceME*') != -1){
		                setTimeout(function(){updateHeading(elements)}, 100)
		            } else if (_old_siblings.indexOf('*replaceME*') != -1){
		                setTimeout(function(){updateHeading(elements)}, 100)
		            } else if (old_parent_id.indexOf('*replaceME*') != -1){
		                setTimeout(function(){updateHeading(elements)}, 100)
		            } else {
		                var diff = {
		                    "val":element_id,
		                    "to":new_parent_id,
							"ins":_new_siblings.indexOf(element_id),
		                    "to_siblings":HashList(_new_siblings),
		                    "from":old_parent_id,
		                    "from_siblings":HashList(_old_siblings),
							"l":Lawccess.context.logPos
		                }
//						var diff = {"val":element_id, "to":new_parent_id, "from":old_parent_id}
//						diff["ins"] = new_siblings.indexOf(elements.element);
//						console.log(get_parent_order(old_parent_id), element_id);
						diff["del"] = get_parent_order(old_parent_id).indexOf(element_id);
//						data["del"] = diff["del"];
		                $.post(Lawccess.site.diffURL+"heading",diff, function(response){
		                    Response.Diff.MoveNode(diff, response)
		                })
		            }
		        }
		        Lawccess.fn.outline.push([updateHeading, elements])
		        if (Lawccess.fn.outline.length==1){
		            Lawccess.fn.outline[0][0](Lawccess.fn.outline[0][1])
		        }
		    }// lambda(). Lambda() is actually important. see ~line 576
		    var elements = {"element":element,"new_parent":new_parent,"new_siblings":new_siblings,"old_parent":old_parent,"old_siblings":old_siblings}
		    lambda(elements)
		    //////////////// This section adjust the width of move elements, so they inherit from their new parent ////////////////////             
		    ui.item.width(ui.item.parent().width()) // corrects width when moved

	/////////////// This is a little gimmicky workaround. Sortable() interferes with proper focus() behavior on moved contenteditable elements. When moved, contenteditable element's focus moves to document.body. We can't transfer focus from document.body to a contenteditable div, so we use an invisible input as an intermediary link.
		    if (document.body == document.activeElement) {
		        $("#focusStealer").focus() // #focus_stealer is invisible text input directly after section#outline_container.
		        ui.item.children().children('.heading').focus()
		    }
		    Outline.set_element_width()
		}
	}*/

	function movement_update (ui){
		var element = ui.item[0]
		var _new_siblings = element.parentNode.children;
		var new_parent_id = element.parentNode.parentNode.getAttribute("value") || 0;
		var old_parent =  ui.sender;
		var position = Array.from(element.parentElement.children).indexOf(element);
		var VALIDATOR = 0;
		if (new_parent_id === 0){ //// b/c of Title Row, we have to adjust
			position --;
		}
		var delta = {
            "mv":"Node." + element.getAttribute('value'),
            "ptg":new_parent_id,
			"pos":position,
        }
	    ui.item.width(ui.item.parent().width()) // corrects width when moved
	/////////////// This is a little gimmicky workaround. Sortable() interferes with proper focus() behavior on moved contenteditable elements. When moved, contenteditable element's focus moves to document.body. We can't transfer focus from document.body to a contenteditable div, so we use an invisible input as an intermediary link.
	    if (document.body == document.activeElement) {
			//$("#focusStealer").focus(); // #focus_stealer is invisible text input directly after section#outline_container.
			//ui.item.children().children('.heading').focus();
			setTimeout(function(){
				element.children[0].children[1].focus();
			}, 10);
	    }
	    Outline.set_element_width();
		return $.post('/api/project/delta/'+Lawccess.context.project, JSON.stringify({'L':Lawccess.context.logPos,'V':VALIDATOR, 'D':[delta]}))
		.then(function(response){
			delta['T'] = response['T'];
			Lawccess.context.logPos = response['L'];
			if (response.hasOwnProperty('D')){
				return response['D'];
			} else {
				return [];
			}
		});
	};
//	movement_update = movement_update1;
/*
	var add_elements_to_outline = function(order, data, parent, depth=0){
		order.map(function(pk, index, array){
			var element = Outline.nestedListRow(pk, data.outlineElements[pk])
			add_listeners_to_outline_rows(element)
			parent.appendChild(element)
		    if (data.outlineElements[pk].order != ""){
		        element.appendChild(document.createElement('OL'))
				if (element.getAttribute('class') != "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded"){
					element.setAttribute('class','outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed')
				}
				try {
					var new_order = data.outlineElements[pk].order.split(',')
				} catch(e){
					var new_order = data.outlineElements[pk].order;
				}
				if (new_order.indexOf(pk) > -1){ /// sanity check for corrupt data causing infinite loop
					new_order.splice(new_order.indexOf(pk), 1)
				}
				Outline.add_elements_to_outline(new_order, data, element.children[2], depth+1)
		    } else {
				element.setAttribute('class','outline-element mjs-nestedSortable-leaf')
			}
		})
		if (depth==0){ // quick hack: depth is undefined in initial loop --> ensures outline is complete.
		    Outline.set_outline_size()
//		    InitNestedSortable();
			var active_outline_element =$(document.activeElement).parentsUntil('li.outline-element').last().parent()[0]
			if (active_outline_element.className == "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed"){
				Outline.go_to_location_hash(active_outline_element.getAttribute('value'))
			} else {
			    Outline.go_to_location_hash()
			}
		}
	}*/

	var go_to_location_hash = function(id){
		// we only go to hash location if it is a sorted list element.
		if (id != null){
			var element_id = "#list_"+id
		} else {
			var id = location.hash.substr(1)
			var element_id = "#list_"+ id
		}
		var parent_list = $(element_id).parentsUntil("ol.sortable").toArray().reverse() // returns all parent elements until the highest <ol>. Then casts the jquery object to array. We reverse the order of the array, so that the DOM objects can be accessed in descending order.
		var v=[] // empty list outside of the scope of the following for loop.
		if (parent_list.length == 0){//If TOP-LEVEL
		setTimeout(function(){$(element_id).children('div').children('div.heading').click()}, 400)
		}
		for (i in parent_list){
	//// We want to click the .disclose div on <li> elements; we don't care about the <ol> parents. All <li> elements have class "outline-element".
		    if ("outline-element" == parent_list[i].classList[0]){
	//// the value of i will be overwritten by the time setTimeout's inner function is called. Therefore, we pass i into array v, so that its value remains accessible & in the proper order.
		        v.push(i);
	//// The browser needs time to display hidden element. Without setTimeout, we would be clicking hidden elements.
		        setTimeout(function(){
	//// array v contains the proper sequence of i values. Use the first value in the array, then remove it the array.
		            k=v[0];
		            v.splice(0,1);
	//// Click the .disclose div so unhide the child <ol>. 
					if (parent_list[k].getAttribute('class') == 'outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed'){
			            parent_list[k].childNodes[0].childNodes[0].click(); // Click the div.disclose
					}
		            if (v.length == 0){
						//// we call "click()" twice, because sometimes the Lawccess.Controller.change_context_location doesn't work properly without it in FF.
		                setTimeout(function(){$("#list_"+id).children('div').children('div.heading').click();$("#list_"+id).children('div').children('div.heading').click();},300)} 
		        }, i*300); // sets the timeout between expanding each row. Note that var i still has the proper value in this closure.
		    }
		}
	}


	//// Adds keyboard shortcuts for the outline elements
	var add_keyboard_shortcuts = function(element){
		element.addEventListener('keypress',function(e){
		    // e.target is either div.heading, or div.substance. After the DOM operation, the target element loses focus, so we reset focus manually
		    if (e.altKey && e.keyCode == 37){
		        e.preventDefault();
		        moveLeft(element, e.target);
		    }
		    else if (e.altKey && e.keyCode == 39){
		        e.preventDefault();
		        moveRight(element, e.target);
		    }
		    else if (e.altKey && e.keyCode == 38){
		        e.preventDefault();
		        moveUp(element, e.target);
		    }
		    else if (e.altKey && e.keyCode == 40){
		        e.preventDefault();
		        moveDown(element, e.target);
		    }
		    else if (e.ctrlKey && e.charCode == 32){
		        e.preventDefault()
		        if (e.target.parentElement.parentElement == element){
		            if (element.className == "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed"){
		               element.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded"
		            }
		            else if (element.className == "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded"){
		               element.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed"
		            }
		        }
		    }
		    else if (e.ctrlKey && e.keyCode == 40){
		        e.preventDefault()
		        if (e.target.parentElement.parentElement == element){
		            if (element.nextSibling != null){
		                element.nextSibling.children[0].children[1].focus()
		            }
		        }
		    }
		    else if (e.ctrlKey && e.keyCode == 38){
		        e.preventDefault()
		        if (e.target.parentElement.parentElement == element){
		            if (element.previousSibling != null){
		                element.previousSibling.children[0].children[1].focus()
		            }
		        }
		    }
		    else if (e.ctrlKey && e.charCode == 46){
		        e.preventDefault()
		        if (e.target.parentElement.parentElement == element){
		            if (element.className != "outline-element mjs-nestedSortable-leaf"){
		                element.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded"
		                element.children[2].children[0].children[0].children[1].focus()
		            }
		        }
		    }
		    else if (e.ctrlKey && e.charCode == 44){
		        e.preventDefault()
		        if (e.target.parentElement.parentElement == element){
		            if (element.parentElement.parentElement.getAttribute('id') != "outline-container"){
		                element.parentElement.parentElement.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed"
		                element.parentElement.parentElement.children[0].children[1].focus()
		            }
		        }
		    }
		})
	}

	var moveLeft = function(element, target){
		var sender = element.parentNode.parentNode
		var parent = element.parentElement.parentElement
		if (parent.getAttribute('id') == "outline-container"){
		    return ;
		}
		if (element.children[0].contains(target)){ // The event listener bubbles. This hack destroys the bubbling behavior for now.
		    parent.parentElement.insertBefore(element, parent) // bring element to parent level.
		    parent.parentElement.insertBefore(parent, element) // place element behind old parent in list.
		    setTimeout(function(){target.focus()},5)
		    var ui = {'item':$(element),'sender':sender}
		    Outline.movement_update(ui)
		    if (parent.children[2].children.length == 0){parent.className = "outline-element mjs-nestedSortable-leaf"}
		}
	}

	var moveRight = function(element, target){
		var sender = element.parentNode.parentNode;
		var sibling = element.previousSibling;
		if (element.children[0].contains(target)){ // The event listener bubbles. This hack destroys the bubbling behavior for now.
		    if (sibling != null){ // Must have a preceding sibling to nest under
		        if (sibling.getAttribute('id') != "list_0"){ // Cannot nest under the Outline Header.
		            if (sibling.children.length == 2){ // Create an ordered list if it doesn't exist already.
		                var _ol = document.createElement('ol')
		                sibling.appendChild(_ol)
		            }
		            sibling.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded" // puts arrow in the right state.
		            ol = sibling.children[2]
		            ol.appendChild(element)
		            element.child
		            var ui = {'item':$(element),'sender':sender}
		            setTimeout(function(){target.focus()},5)
		            Outline.movement_update(ui);

		        }
		    }
		}
	}

	var moveUp = function(element, target){
		var sender = element.parentNode.parentNode;
		var sibling = element.previousSibling;
		if (element.children[0].contains(target)){ // The event listener bubbles. This hack destroys the bubbling behavior for now.
		    if (sibling != null){ // Must have a preceding sibling to insert before
		        if (sibling.getAttribute('id') != "list_0"){ // Cannot move above the Outline Header.
		            sibling.parentElement.insertBefore(element, sibling)
		            setTimeout(function(){target.focus()},5)
		            var ui = {'item':$(element),'sender':sender}
		            Outline.movement_update(ui)
		        }
		    }
		}
	}

	var moveDown = function(element, target){
		var sender = element.parentNode.parentNode;
		var sibling = element.nextSibling;
		if (element.children[0].contains(target)){ // The event listener bubbles. This hack destroys the bubbling behavior for now.
		    if (sibling != null){ // Must have a following sibling to insert after
		        sibling.parentElement.insertBefore(sibling, element)
		        setTimeout(function(){target.focus()},5)
		        var ui = {'item':$(element),'sender':sender}
		        Outline.movement_update(ui)
		    }
		}
	}


	var moveNode = function(diff){
		var child = document.getElementById("list_"+String(diff.val))
		var newParent = document.getElementById("list_"+String(diff["new"]))
		if (child.contains(newParent)){
			return false
		}
		var index = diff['ins']
		if (diff["to"] != 0){
			if (newParent.children.length < 3){
				var OL = document.createElement("OL")
				newParent.appendChild(OL)
				newParent.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded"
			} else {
				var OL = newParent.children[2]
			}
		} else {
			var OL = newParent.parentElement;
			index += 1
		}
		if ((diff["to"] == diff["from"]) && (diff["del"] < diff["ins"])){
			OL.insertBefore(child, OL.children[index+1])
		} else {
			OL.insertBefore(child, OL.children[index]) // insert element at position diff['ins']
		}
		Outline.set_element_width(child)
		return true;
	}

	var close_button = function(){
		var section = document.getElementById('outline-container')
		var button = document.createElement('div')
		button.setAttribute('id','close_outline')
		section.insertBefore(button, section.children[0])
	
		$(button).click(function(){
			var inactive_color = Source.issue_buttons.inactive_color
			$(".issue_button").css({"background-color":inactive_color});
			Source.CURRENT_CITATION = 0;
			$("input.citation-outline-relationship").prop('checked',false)
			$("#outline-container").toggle()
		})
	}

	var createOutline = function(outlineName){
	// Creates Header for the nested list. (first list entry)
		var outline = document.getElementById("outline-container");
		outline.innerHTML="";
		outline.setAttribute("_width", window.innerWidth-25);
		var outline_ol = OutlineHeader(outlineName);
		outline_ol.classList.add('sortable');
		outline.appendChild(outline_ol);
		Outline.set_element_width(outline_ol.children[0]);
		Outline.HeadingOptionMenu.add_listeners_to_outline_heading($(outline).children('ol').children("li#list_0"));
		Outline.close_button();
	    InitNestedSortable(outline_ol);
		//// If there are child elements to the outline, let's add them now.
//		if (data.outline.order != ""){
//		    Outline.add_elements_to_outline(data.outline.order, data, outline.children[1])
//		}
	}

	function getParentID(node){
		var parentID = node.parentElement.parentElement.getAttribute('id');
/*		if (parentID.substr(0,4) === "list_") {
			parentID = oldParentID.substr(4);
		} else {
			parentID = 0;
		}*/
		var parentID = node.parentElement.parentElement.getAttribute('value') || 0;
		return parentID;
	}

	var API = (function(){

		function mv (delta){ //// move()
			var id = Shadow.App.getDeltaTarget(delta).id || String(delta['mv']);
			var child = document.getElementById("list_"+id);
			var newParent = document.getElementById("list_"+String(delta["ptg"]));
			var oldParentID = getParentID(child);
			var oldList = child.parentElement;
			var oldPosition = Array.from(child.parentElement.children).indexOf(child);
			if (child.contains(newParent)){ //// Can't move a node to one of its child nodes
				return false;
			}
			var index = delta['pos'];
			if (delta["ptg"] != 0){
				if (newParent.children.length < 3){
					var OL = document.createElement("OL");
					newParent.appendChild(OL);
					newParent.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed";
				} else {
					var OL = newParent.children[2];
				}
			} else {
				var OL = newParent.parentElement;
				index += 1; //// b/c of Title Row, we have to adjust. (cmp. w/ movement_update() ).
			}
			
			child.remove(); // actually important if moving child to different position with same parent.
			OL.insertBefore(child, OL.children[index]); // insert element at position index
			Outline.set_element_width(child);
			if (oldList.children.length === 0){ //// remove empty lists and change class name to remove toggle arrow.
				oldList.parentElement.className = "outline-element mjs-nestedSortable-leaf";
				oldList.remove();
			}
			return {'mv':delta['mv'], 'ptg':oldParentID, 'pos':oldPosition};
		}

		function mk (delta, focus){ ///// make()
			var id = Shadow.App.getDeltaTarget(delta).id || String(delta['mk']);
			var child = nestedListRow(id);
			var newParent = document.getElementById("list_"+String(delta["ptg"]));
			var index = delta['pos'];
			if (delta["ptg"] != 0){
				if (newParent.children.length < 3){
					var OL = document.createElement("OL");
					newParent.appendChild(OL);
					newParent.className = "outline-element mjs-nestedSortable-branch mjs-nestedSortable-expanded";
				} else {
					var OL = newParent.children[2];
				}
			} else {
				var OL = newParent.parentElement;
				index += 1;
			}
			OL.insertBefore(child, OL.children[index]); // insert element at position diff['ins']
			Outline.set_element_width(child);
			if (focus){
				setTimeout(function(){
					child.children[0].children[1].focus();
				}, 300)
			}
			return {'rm':delta['mk'], 'ptg':delta['ptg']};
		}

		function rm (delta){ //// remove()
			var id = Shadow.App.getDeltaTarget(delta).id || String(delta['rm']);
			var child = document.getElementById("list_"+id);
//			var child = document.getElementById("list_"+String(delta['rm']));
			var parentList = child.parentElement;
			var parentID = getParentID(child);
			var position = Array.from(parentList.children).indexOf(child);
			child.remove();
			if (parentList.children.length === 0){
				parentList.remove();
			}
			return {'mk':delta['rm'], 'pos':position, 'ptg': parentID};
		}

		return {'mk':mk,'rm':rm,'mv':mv};
	})();

	var Transform = (function() {

		return {};
	})();

	var Delta = (function(){

		function mergeDeltas(){


		};

		return {mergeDeltas:mergeDeltas};
	})();

	function applyDeltas (Deltas){
		return Deltas.map(function(deltas) {
			return deltas.map(function(delta) {
				if (delta.hasOwnProperty('mv') ){
					return API.mv(delta);
				} else if (delta.hasOwnProperty('mk') ){
					return API.mk(delta);
				} else if (delta.hasOwnProperty('rm') ){
					return API.rm(delta);
				} else {
					//// TODO: HANDLE ERROR
				}
			});
		});
	}

	return {
		nestedListRow:nestedListRow, /// used for revision.js
		set_element_width:set_element_width, /// used for updates
		delete_element:delete_element, 
		collapse_element:collapse_element,
		create_new_element:create_new_element,
		set_outline_size:set_outline_size, 
		movement_update:movement_update,
//		add_elements_to_outline:add_elements_to_outline,
		go_to_location_hash:go_to_location_hash,
		moveNode:moveNode,
		close_button:close_button,
		createOutline:createOutline,
		get_order:get_parent_order,/// response.js
		API:API,
		applyDeltas:applyDeltas,
	}
})()



$(window).resize(function(){
	Outline.set_outline_size()
})



/*
Outline.update_outline = function(){
    $.post("/ajax/get_timestamps/"+Lawccess.context.project, function(response){
        var timestamps = JSON.parse(response)
        if (timestamps.status == "success"){
            var citations = timestamps.citations
            var elements = timestamps.elements
            var outline = timestamps.outline
            var project = timestamps.project
            var sources = timestamps.sources

            if (outline.timestamp != Lawccess.context.outline.timestamp){
                $.get(Lawccess.context.ajaxURL+"get_outline/"+Lawccess.context.outline.id, function(response){
                    Lawccess.context.outline = response
                })
            }

            var missing_keys = []
            var matching_keys = []
  //          console.log(citations)
            for (var key in citations){
                if (typeof(Lawccess.data.citations[key]) == "undefined"){
                    missing_keys.push(key)
                }
                else if (citations[key] != Lawccess.data.citations[key].timestamp){
                    missing_keys.push(key)
                    matching_keys.push(key)
                }
                else if (citations[key] == Lawccess.data.citations[key].timestamp){
                    matching_keys.push(key)
                }
            }
            //// look for citations that may have been deleted
            //// NOTE: citations currently cannot be deleted.
            for (key in Lawccess.data.citations){
                if (matching_keys.indexOf(key) == -1){
                    console.log("Citations to be deleted:", key)
                }
            }
            if (missing_keys.length >0){
                $.get(Lawccess.context.ajaxURL+"get_citations/", {"citations":missing_keys.toString()}, function(response){
                    for (key in response){
                        Lawccess.data.citations[key] = response[key]
                    }
                })
            }
            missing_keys=[]
            matching_keys = []
            for (var key in elements){
//                console.log(elements[key].toString(), Lawccess.data.outlineElements[key].timestamp)
                if (typeof(Lawccess.data.outlineElements[key]) == "undefined"){ //// A new outline Element
                    missing_keys.push(key)
                }
                else if (elements[key].toString() != Lawccess.data.outlineElements[key].timestamp){ //// A changed outline Element
                    missing_keys.push(key)
                    matching_keys.push(key)
                }
                else if (elements[key].toString() == Lawccess.data.outlineElements[key].timestamp){ //// An unchanged outline Element
                    matching_keys.push(key)
                }
            }
            for (key in Lawccess.data.outlineElements){ 
                if (matching_keys.indexOf(key) == -1){ ///// A deleted outline Element
                    delete Lawccess.data.outlineElements[key]
                    var list_id = "list_"+key
                    var element = document.getElementById(list_id)
                    var parent = element.parentElement
                    element.remove()
                    if (parent.children.length == 0){
                        parent.parentElement.setAttribute('class','outline-element mjs-nestedSortable-leaf')
                    }
                }
            }
            if (missing_keys.length >0){
                $.get(Lawccess.context.ajaxURL+"get_outline_elements/", {"elements":missing_keys.toString()}, function(response){
                    for (key in response){
                        Lawccess.data.outlineElements[key] = response[key]
                    }
                    for (key in response){
                        var list_element
                        try { // See if the element already exists in the outline.
                            list_element = document.getElementById('list_'+key)
                            var parent = list_element.parentElement.parentElement
                            //// Title div
							var title_div = $(list_element).children('div').children('div.heading')[0]
                            title_div.innerHTML = Markup.markup_to_html(Lawccess.data.outlineElements[key].heading);
                            Markup.markup_to_html(title_div)
                            //// Description div
							var description_div = $(list_element).children('div').children('div.substance').children('div.content')[0]
                            description_div.innerHTML = Markup.markup_to_html(Lawccess.data.outlineElements[key].content);
                            Markup.markup_to_html(description_div)
                        } catch(e) { // Else we create the element, and hide it away for now.
                            var row = Outline.nestedListRow(key, Lawccess.data.outlineElements[key])
                            Outline.add_listeners_to_outline_rows(row)
                            temp_ol.appendChild(row) 
                        }
                    }

                    //// Dealing with changed outline order
                    var _order =Lawccess.context.outline.order.split(',') 
                    for (key in _order){
                        var pk = _order[key]
                        var list_id = 'list_'+pk
                        var element = document.getElementById(list_id)
                        document.getElementById('outline-container').getElementsByTagName('ol')[0].appendChild(element)
                    }
                    for (key in response){
                        var parent = document.getElementById("list_"+key)
                        if (Lawccess.data.outlineElements[key].order != ""){
                            var parent_order = Lawccess.data.outlineElements[key].order.split(',')
                            if (parent.getElementsByTagName('ol').length == 0){
                                parent.appendChild(document.createElement('ol'))
                            }
                            for (var key_2 in parent_order){
                                var pk = parent_order[key_2]
                                parent.getElementsByTagName('ol')[0].appendChild(document.getElementById('list_'+pk))
                            }
                            if (parent.getAttribute('class') == "outline-element mjs-nestedSortable-leaf"){ //// Make sure that class changes
                                parent.setAttribute('class', "outline-element mjs-nestedSortable-branch mjs-nestedSortable-collapsed")
                            }
                        }
                        else {
                            parent.setAttribute('class', "outline-element mjs-nestedSortable-leaf")
                        }
                    }
                })
            }
            missing_keys=[]
            matching_keys=[]
            for (var key in sources){
                if (typeof(Lawccess.data.sources[key])=="undefined"){
                    missing_keys.push(key)
                }
                else if (sources[key] != Lawccess.data.sources[key].timestamp){
                    missing_keys.push(key)
                    matching_keys.push(key)
                }
                else if (sources[key].toString() == Lawccess.data.sources[key].timestamp){
                    matching_keys.push(key)
                }
            }
            for (key in Lawccess.data.sources){
                if (matching_keys.indexOf(key) == -1){
//                    console.log("Sources to be deleted:", key)
                }
            }
            if (missing_keys.length >0){
                $.get(Lawccess.context.ajaxURL+"get_sources/", {"sources":missing_keys.toString()}, function(response){
//                    console.log(response)
                })
            }
        }
    })
    //localStorage.setItem(Lawccess.project.id, JSON.stringify(Lawccess))
}
*/
////////// Build the rest of the Nested List after the header has been created. /////////////


