DropDown = function(list, callback, emptyVal){
    var keys = {
	tab:    9,
	enter:  13,
	esc:    27,
	space:  32,
	left:   37,
	up:     38,
	right:  39,
	down:   40
    };
    var toplevel = document.createElement('UL')
    toplevel.setAttribute('class', "widget")
    toplevel.setAttribute('value',"")
    var visible_button = document.createElement('LI')
    var visible_button_text = document.createElement('A')
	if (typeof(emptyVal) == "undefined"){
	    visible_button_text.textContent = "click";
	} else {
		visible_button_text.textContent = emptyVal;
	}
    toplevel.setAttribute('text','click')
    visible_button.appendChild(visible_button_text);
    toplevel.appendChild(visible_button)
    visible_button_text['tabIndex']=0
    var level_one = document.createElement('UL')
    level_one.style.display = "none"
    visible_button.appendChild(level_one)

	// Create the event.
	var event = document.createEvent('Event');
	// Define that the event name is 'build'.
	event.initEvent('selection', true, true);
	// target can be any Element or other EventTarget.
//	elem.dispatchEvent(event);

    toplevel.setValue = function(value){ //// API, set initial value.		 
			var options = toplevel.getElementsByTagName('li')
			for (i=0;i<options.length;i++){
				var option = options[i]
				if (option.hasAttribute('value')){ //// branches sometimes have no "value"
					if (option.getAttribute('value') == value){ //// there is a option with that value
						[].map.call(option.attributes, function(attr) {
							toplevel.setAttribute( attr.name , attr.value )
						})
/*						option.getAttributeNames().map(function(attr){
							toplevel.setAttribute( attr , option.getAttribute(attr) )
						})*/
						visible_button_text.textContent = option.children[0].textContent
						return true // success
					}
				}
			}
			return false // no success: value did not match any options.
    }
	toplevel.updateValue = function(value){ //// API, update value and execute callback
		if (toplevel.setValue(value)) {
			toplevel.dispatchEvent(event)
			callback.call(toplevel)
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
	    LI.addEventListener('mouseover', function(e){
				e.target.focus() // Focus on anchor text
	    })
	    LI.addEventListener('mouseout', function(e){

	    })
      LI.addEventListener('click',function(e){
//	    	toplevel.setAttribute('value',LI.getAttribute('value'))
/*			if (LI.hasAttribute('cslType')){
				toplevel.setAttribute('cslType',LI.getAttribute('cslType'))
			}*/
			toplevel.setAttribute('text',LI.textContent)
			visible_button_text.textContent = LI.textContent;
			[].map.call(LI.attributes, function(attr) {
				toplevel.setAttribute( attr.name , attr.value )
			})
			toplevel.dispatchEvent(event)
			callback.call(toplevel)

		})
      LI.addEventListener('keypress',function(e){
            if (this.children[0] == e.target){
                if ((e.keyCode==keys.enter) || (e.charCode==keys.space)){
/*		    toplevel.setAttribute('value',LI.getAttribute('value'))
				if (LI.hasAttribute('cslType')){
					toplevel.setAttribute('cslType',LI.getAttribute('cslType'))
				}
		    toplevel.setAttribute('text',LI.textContent)
		    visible_button_text.textContent = LI.textContent
			toplevel.dispatchEvent(event)
		    callback.call(toplevel)*/
                 e.target.click()
                } else if (e.keyCode == keys.down){
                    e.preventDefault()
                    if (this.nextElementSibling != null){
                        this.nextElementSibling.children[0].focus()
                    }
                } else if (e.keyCode == keys.up){
                    e.preventDefault()
                    if (this.previousElementSibling != null){
                        this.previousElementSibling.children[0].focus()
                    } else {
                        this.parentElement.parentElement.children[0].focus()
                    }
                } else if (e.keyCode == keys.left){
                    e.preventDefault()
                   this.parentElement.parentElement.children[0].focus()
                } else if (e.keyCode == keys.right){
                    e.preventDefault()
                }
            }
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
            e.target.focus()
        })
        LI.addEventListener('mouseout', function(e){
            child_ul.classList.remove("show_menu")
        })
        LI.addEventListener('keypress',function(e){
            if (this.children[0] == e.target){
                if (e.keyCode == keys.down) { // down arrow
                    e.preventDefault()
                    if (this.nextElementSibling != null){
                        this.nextElementSibling.children[0].focus()
                        child_ul.classList.remove('show_menu')
                    } 
                } else if (e.keyCode == keys.right){ // right arrow
                    e.preventDefault()
                    if (child_ul.children[0] != null){ // sanity check
                        child_ul.classList.add('show_menu') // make sure it's visible.
                        child_ul.children[0].children[0].focus() // Focus on anchor.
                    }
                } else if (e.keyCode == keys.left) { // left arrow
                    e.preventDefault()
                    this.parentElement.parentElement.children[0].focus()
                    child_ul.classList.remove("show_menu")
                } else if (e.keyCode == keys.up){ // up arrow
                    e.preventDefault()
                    if (this.previousElementSibling != null){
                        this.previousElementSibling.children[0].focus()
                        child_ul.classList.remove('show_menu')
                    } else {
                      this.parentElement.parentElement.children[0].focus()
                    }
                }
            }
        })
    }

    function build_menu(parent, list){
        for (var i=0; i<list.length; i++){
            var json = list[i]
            var LI = document.createElement('LI')
/*			if (json.hasOwnProperty('divider')){
				var v = document.createElement('HR')
				LI.appendChild(v)
				console.log(v)
			} */
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
				for (var prop in json) {
					if (json.hasOwnProperty(prop)){
		                LI.setAttribute(prop, json[prop])
					}
				}
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

    visible_button.addEventListener('keypress',function(e){
        if (this.children[0] == e.target){
            if ((e.keyCode==keys.enter) || (e.charCode==keys.space)){
                document.addEventListener('click',handler)
                e.target.click()
            } else if (e.keyCode==keys.down){
                e.preventDefault()
                if (this.children[1].style.display == "block"){
                    this.children[1].children[0].children[0].focus()
                } else {
                    document.addEventListener('click',handler)
                    e.target.click()
                    this.children[1].children[0].children[0].focus()
                }
            } else if (e.keyCode==keys.up){
                e.preventDefault()
                level_one.style.display="none"
            } else if (e.keyCode==keys.left){
                e.preventDefault()
                if (toplevel.previousElementSibling != null){
                    toplevel.previousElementSibling
                }
            } else if (e.keyCode==keys.right){
                e.preventDefault()
                if (toplevel.nextElementSibling != null){
                    toplevel.nextElementSibling.focus()
                }
            }
        }
    })

    function preventDefaultAction(toplevel){
        handler.call(element)
        callback.call(element)
    }
    return toplevel
}
