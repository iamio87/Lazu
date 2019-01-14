var Toolbar = (function(){

	function dispatch(){
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		evt.target = this;
		this.dispatchEvent(evt);
	}

	var ToolbarDropDown = function(list, callback){ //// Stripped down version of DropDown widget. 
		//// This version removes keyboard navigation, because the toolbar should never accept focus off of the text editor.
		var toplevel = document.createElement('UL')
		toplevel.setAttribute('class', "widget")
		toplevel.setAttribute('value',"")
		var visible_button = document.createElement('LI')
		var visible_button_text = document.createElement('A')
		visible_button_text.textContent = "click";
		toplevel.setAttribute('text','click')
		visible_button.appendChild(visible_button_text);
		toplevel.appendChild(visible_button)
		visible_button_text['tabIndex']=0
		var level_one = document.createElement('UL')
		level_one.style.display = "none"
		visible_button.appendChild(level_one)

		toplevel.setValue = function(value){
			var b = toplevel.getElementsByTagName('li')
			for (i=0; i<b.length; i++){
				if (b[i].hasAttribute('value')){
					if (b[i].getAttribute('value') == value){
						toplevel.setAttribute('value',value)
						visible_button_text.textContent = b[i].children[0].textContent
					}
				}
			}
		}

		function close_all(){
		    var uls = level_one.getElementsByTagName('UL')
		    for (i=0;i<uls.length;i++){
		        uls[i].classList.remove('show_menu')
		    }
		}
		
		function close_siblings(LI){
		    parent_ul = LI.parentNode
		    var uls = parent_ul.getElementsByTagName('UL')
		    for (i=0;i<uls.length;i++){
		        uls[i].classList.remove('show_menu')
		    }
		}

		function add_leaf_listener(LI){
		    LI.children[0].addEventListener('focus', function(e){
		        close_siblings(LI)
		    })
		    LI.addEventListener('click',function(e){
			toplevel.setAttribute('value',LI.getAttribute('value'))
			toplevel.setAttribute('text',LI.textContent)
			visible_button_text.textContent = LI.textContent
		        callback.call(toplevel)
		    })
		}

		function add_branch_listener(LI){
		    var child_ul = LI.children[1]
		    LI.children[0].addEventListener('focus', function(e){
		        close_siblings(LI)
		        child_ul.classList.add('show_menu')
		    })
		    LI.addEventListener('mouseover', function(e){
		        child_ul.classList.add('show_menu')
		    })
		    LI.addEventListener('mouseout', function(e){
		        child_ul.classList.remove("show_menu")
		    })
		}

		function build_menu(parent, list){
		    for (var i=0; i<list.length; i++){
		        var json = list[i]
		        var LI = document.createElement('LI')
		        LI.setAttribute('role','menuitem')
		        var a = document.createElement('A')
		        a.textContent = json['label']
		        LI.appendChild(a)
		        a.tabIndex = -1
		        if (json.hasOwnProperty('submenu')){
		            var UL = document.createElement('UL')
		            UL.setAttribute('aria-hidden',true)
		            UL.setAttribute('role','menu')
		            LI.appendChild(UL)
		            LI.setAttribute('aria-haspopup',true)
		            build_menu(UL, json['submenu'])
		            add_branch_listener(LI)
		        } else {
		            LI.setAttribute('value', json['value'])
		            add_leaf_listener(LI)
		        }
		        parent.appendChild(LI)
		    }
		    return
		}

		build_menu(level_one, list)

		function handler(e) {   
		    if (level_one.style.display == "none"){
		        level_one.style.display = "block"
		    } else if (level_one.style.display == "block"){
		        level_one.style.display = "none"
		        close_all()
		        document.removeEventListener(e.type, arguments.callee);
		    }
		}

		toplevel.addEventListener('click', function(e){
		     document.addEventListener('click',handler)
		})

		function preventDefaultAction(toplevel){
		    handler.call(element)
		    callback.call(element)
		}
		return toplevel
	}

	var OL_options = [
		{"value":"1.", "label":"1."},
		{"value":"a.", "label":"a."},
		{"value":"A.", "label":"A."},
		{"value":"i.", "label":"i."},
		{value:"I.",label:"I."},
		{value:"greek.",label:"α."},
		{"value":"(1)", "label":"(1)"},
		{"value":"(a)", "label":"(a)"},
		{"value":"(A)", "label":"(A)"},
		{"value":"(i)", "label":"(i)"},
		{value:"(I)",label:"(I)"},
		{value:"(greek)",label:"(α)"},
	]

	var toolbarObj = {
		"buttons": [
			{
				"action":"bold",
				"appearance":"<b>B</b>"
			},
			{
				"action":"italicize",
				"appearance":"<i>I</i>"
			},
			{
				"action":"underline",
				"appearance":"<u>U</u>"
			},
			{
				"action":"insertOrderedList",
				"appearance":"1."
			},
			{
				"action":"insertUnorderedList",
				"appearance":"&middot;"
			},
			{
				"action":"indent",
				"appearance":"&middot;&gt;"
			},
			{
				"action":"outdent",
				"appearance":"&lt;&middot;"
			}
		]
	}

	function elementDraggable(element){
		var x 
		var y 
		function elementMove(e){
			var difX = x - e.clientX;
			var difY = y - e.clientY;
			x = e.clientX;
			y = e.clientY;
			element.style.left = element.offsetLeft-difX
			element.style.top = element.offsetTop-difY
		}

		element.addEventListener('mousedown',function(e){
			x = e.clientX;
			y = e.clientY;
			document.addEventListener('mousemove', elementMove, false);
		})
		element.addEventListener('mouseup',function(e){
			document.removeEventListener('mousemove', elementMove, false);

		})
	}

	function init(ToolbarContainer){
		if (typeof(ToolbarContainer) == "string"){
			var ToolbarContainer = document.getElementById(ToolbarContainer);
		}

		for (var i = 0; i < toolbarObj.buttons.length; i++){
			var button = document.createElement("BUTTON");
			button.setAttribute('class','editor-btn')
			ToolbarContainer.appendChild(button);
			button.innerHTML = toolbarObj.buttons[i].appearance;
			button.name = toolbarObj.buttons[i].action;
			button.addEventListener('click', function(e){
				var action = e.target.name;
				var canvas = document.activeElement;
				var activeFormat = canvas.shadow.range.inlineFormat;
				var range = canvas.shadow.range;
				range.format = activeFormat;
				Shadow.Canvas.Actions[action](canvas, e, range);
				dispatch.call(document.activeElement); //// dispatch 'change' event so eventlisteners will know.
			})
			button.setAttribute('class',button.name)
		}

		var subMenu = ToolbarDropDown(OL_options, function(e){ 
			var value = this.getAttribute('value');
			FormattingEngine.API('styleListLevel', value)
		});
		subMenu.addEventListener('mousedown', function(e){
			e.preventDefault(); //// stops button from taking focus.
		})
		subMenu.childNodes[0].childNodes[1].addEventListener('click',function(e){
			dispatch.call(document.activeElement)
		})
		subMenu.setAttribute('name','list-type-select')
		subMenu.setAttribute('class','list-type-select')
		ToolbarContainer.appendChild(subMenu)
		ToolbarContainer.addEventListener('mousedown', function(e){
			e.preventDefault(); //// stops button from taking focus.
		})
		elementDraggable(ToolbarContainer)
		
	}

	return {
		"init":init,
	}
})()

setTimeout(function(){
	Toolbar.init('editorButtons');
}, 500)
