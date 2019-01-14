DropDown = function(list, callback){

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
    toplevel.id = "widget"
    var visible_button = document.createElement('LI')
    var visible_button_A = document.createElement('A')
    visible_button_A.textContent = "click";
    visible_button.appendChild(visible_button_A); toplevel.appendChild(visible_button)
    visible_button_A['tabIndex']=0
    var level_one = document.createElement('UL')
    level_one.style.display = "none"
    visible_button.appendChild(level_one)
    var list = [{'value':'case','label':'Case'},{'value':'jean','label':'Blove'},{'label':'hope','submenu':[{'value':'love','label':'Love'},{'value':'faith','label':'Faith'},{'label':'hope','submenu':[{'label':'chees','value':'comb'}]}]},{'value':'Casey','label':'Casey'}]

    function add_leaf_listener(LI){
        LI.addEventListener('mouseover', function(e){
            e.target.focus() // Focus on anchor text
        })
        LI.addEventListener('mouseout', function(e){

        })
        LI.addEventListener('keypress',function(e){
            if (this.children[0] == e.target){
                if ((e.keyCode==keys.enter) || (e.charCode==keys.space)){
                    document.addEventListener('click',handler)
                    e.target.click()
                } else if (e.keyCode == keys.down){
                    if (this.nextElementSibling != null){
                        this.nextElementSibling.children[0].focus()
                    }
                } else if (e.keyCode == keys.up){
                    if (this.previousElementSibling != null){
                        this.previousElementSibling.children[0].focus()
                    } else {
                        this.parentElement.parentElement.children[0].focus()
                    }
                } else if (e.keyCode == keys.left){
                   this.parentElement.parentElement.children[0].focus()
                }
            }
        })
    }

    function add_branch_listener(LI){
        var child_ul = LI.children[1]
        LI.children[0].addEventListener('focus', function(e){
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
                    if (this.nextElementSibling != null){
                        this.nextElementSibling.children[0].focus()
                        child_ul.classList.remove('show_menu')
                    } 
                } else if (e.keyCode == keys.right){ // right arrow
                    if (child_ul.children[0] != null){ // sanity check
                        child_ul.classList.add('show_menu') // make sure it's visible.
                        child_ul.children[0].children[0].focus() // Focus on anchor.
                    }
                } else if (e.keyCode == keys.left) { // left arrow
                    this.parentElement.parentElement.children[0].focus()
                    child_ul.classList.remove("show_menu")
                } else if (e.keyCode == keys.up){ // up arrow
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
                LI.value = json['value']
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
                if (this.children[1].style.display == "block"){
                    this.children[1].children[0].children[0].focus()
                } else {
                    document.addEventListener('click',handler)
                    e.target.click()
                    this.children[1].children[0].children[0].focus()
                }
            } else if (e.keyCode==keys.up){
                level_one.style.display="none"
            } else if (e.keyCode==keys.left){
                if (toplevel.previousElementSibling != null){
                    toplevel.previousElementSibling
                }
            } else if (e.keyCode==keys.right){
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
