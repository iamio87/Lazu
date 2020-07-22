Outline.OptionMenu = {}

setTimeout(function(){
    var ul = document.createElement('ul');
    ul.setAttribute('class','heading_option_list');
	// ul.style.display="inline:block";
    ul.innerHTML = '<li class="new_row" tabindex="0">New Row</li><li class="delete_row" tabindex="0">Delete</li><li class="history" tabindex="0">Revisions</li><li class="citation_list" tabindex="0">Toggle Citations</li>';
    Outline.OptionMenu.Menu = ul;
    Outline.OptionMenu.navigate_options(Outline.OptionMenu.Menu);
//    delete ul;
})
/*
Outline.OptionMenu.toggle_heading_menu = function(button){
    var ul = document.createElement('ul')
    ul.setAttribute('class','heading_option_list')
    ul.display="inline:block"
    ul.innerHTML = '<li class="new_row" tabindex="0">New Row</li>'
    Outline.OptionMenu.HeadingMenu = ul
    Outline.OptionMenu.navigate_options(Outline.OptionMenu.HeadingMenu)
    delete ul
    console.log(button.children[0])
    Outline.OptionMenu.__init__(button.children[0])
}
*/
Outline.OptionMenu.__init__ = function(button){
	button.addEventListener('click',function(e){/// Open Menu on click
		Outline.OptionMenu.menu_toggle(e)
    })
    button.addEventListener('keypress', function(e){
	if ((e.keyCode == 13) || (e.charCode == 32)){ //Open Menu on SPACE or ENTER
	    Outline.OptionMenu.menu_toggle(e)
	}
	if (e.target.getAttribute('class') == "heading_option_button_span"){ // prevents firing by menu options, who also trigger the this listener.
	    if ((e.keyCode == 39) || (e.keyCode == 40)){ // Focus on opened menu on DOWN or RIGHT keypress if the menu is opened.
		if (e.target.nextElementSibling != null){
		    e.target.nextElementSibling.firstChild.focus() // TODO: Throws warning in FIREBUG. Check for issues.
		}
	    }
	}
    })
}

Outline.OptionMenu._set_option_menu_position = function(menu){
	var parent_height = menu.parentNode.parentNode.children[1].clientHeight+7
	menu.parentNode.style.position = "relative"
	menu.parentNode.style.bottom = parent_height
    }

Outline.OptionMenu.close_menu = function(callback, param){
    if (Outline.OptionMenu.Menu.parentElement != null){// If menu is open
	Outline.OptionMenu.Menu.parentElement.parentElement.removeAttribute('style')
	Outline.OptionMenu.Menu.remove()
    }
    document.removeEventListener('click', Outline.OptionMenu.close_menu);
    if (typeof(callback) == "function"){
	setTimeout(function(){callback(param)},5)
    }
}

Outline.OptionMenu.open_menu = function(parent){
	parent.appendChild(Outline.OptionMenu.Menu)
	// Outline.OptionMenu.Menu.style.display="inline-block";
    Outline.OptionMenu._set_option_menu_position(parent)
    Outline.OptionMenu.Menu.children[0].focus()
    setTimeout(function(){ // Must be in timeout, or it may fire on origial click.
		document.addEventListener('click', Outline.OptionMenu.close_menu)
    }, 10)
}

Outline.OptionMenu.menu_toggle = function(e){
    if (e.target.getAttribute('class')=="heading_option_button_span"){
	if (Outline.OptionMenu.Menu.parentNode != null){// if Menu is open
	    if (e.target.parentNode != Outline.OptionMenu.Menu.parentNode){// Menu is opened by another element
		if (e.type == "keypress"){   
	//	    setTimeout(function(element){
		    Outline.OptionMenu.close_menu(Outline.OptionMenu.open_menu, e.target.parentNode)
	//	    },5, e.target.parentNode)
		} else if (e.type == "click"){
		    setTimeout(function(element){Outline.OptionMenu.open_menu(element)},5, e.target.parentNode)
		}
	    } else {
		Outline.OptionMenu.close_menu()
	    }
	} else { // if Menu is closed
	    Outline.OptionMenu.open_menu(e.target.parentNode)
	}
    } else if (e.type == "keypress"){ // anything other than heading_option_button_span closes menu
	// For example: selecting an option by keypress from the menu will close the menu
	// There is already a global listener for clicks
	Outline.OptionMenu.close_menu()
    }
}

Outline.OptionMenu.navigate_options = function(ul){ // navigate options with keyboard AND select options by mouse or keyboard
    for (var i=0; i<ul.childElementCount; i++){ // for every item in menu:
	var child = ul.children[i]
	child.addEventListener('keypress', function(e){
	    if ((e.keyCode == 39) || (e.keyCode == 40)){//Right or Down
		//If last sibling, go to first sibling
		if (e.target.nextElementSibling == null){
		    e.target.parentNode.firstChild.focus()
		} else {
		    e.target.nextElementSibling.focus()
		}
	    }
	    if ((e.keyCode == 37) || (e.keyCode == 38)){//Left or Up
		//If first sibling, go to parent
		if (e.target.previousElementSibling == null){
		    e.target.parentNode.parentNode.firstChild.focus()
		} else {
		    e.target.previousElementSibling.focus()
		}
	    }
	    //ENTER or SPACE to Select option
	    if ((e.keyCode == 13)||(e.keyCode==32)){
		//press_to_close_menu(e)
		Outline.OptionMenu.fn[e.target.getAttribute('class')](e.target.parentNode)
	    }
	})
	// CLICK to Select option
	child.addEventListener('click', function(e){
	    Outline.OptionMenu.fn[e.target.getAttribute('class')](e.target.parentNode)
	})
    }
}

Outline.OptionMenu.fn = {}
Outline.OptionMenu.fn['new_row'] = function(e){
    Outline.create_new_element(e.parentNode.parentNode.parentNode.parentNode)
}
Outline.OptionMenu.fn['delete_row'] = function(e){
    Outline.delete_element(e.parentNode.parentNode.parentNode.parentNode)
}
Outline.OptionMenu.fn['history'] = function(e){
    Revisions.set('OutlineElement', e.parentNode.parentNode.parentNode.parentNode.value)
}
Outline.OptionMenu.fn['citation_list'] = function(e){
    Outline.CitationList.toggle(e.parentNode.parentNode.parentNode.parentNode)
}
