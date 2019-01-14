Outline.HeadingOptionMenu = {}
Outline.HeadingOptionMenu.toggle_options_menu = function(element){
    // handler function                                                   
    function handler(e) {
        // remove this handler                                            
        document.removeEventListener(e.type, arguments.callee);
        setTimeout(function(){
            if ((e.target != element) && (e.target.parentNode != element)){
                element.children[1].removeAttribute('style')
                element.removeAttribute('style')
            }
        }, 10)
    }

    setTimeout(function(){ // must be in timeout, or it may fire on original click?                                                                 
        document.addEventListener('click',handler)
    }, 10)

    $(element).children('ul').toggle(10, function(){
        if ($(this).css('display') == "block") {
            $(this).children('li.new_row').focus()
            // Without this code; the heading_option_list gets displaced down underneath div.content. We want the position to remain constant.
			if (this.children.length > 1){ // We don't want this code to operate on the outline-heading, which works properly without this code.     
		        var parent_height = this.parentNode.parentNode.parentNode.children[1].clientHeight+4
		        this.parentElement.style.position = "relative"
		        this.parentElement.style.bottom = parent_height
			}
        }
        else {
            this.parentElement.removeAttribute('style')
        } 
    })
}


Outline.HeadingOptionMenu.add_listeners_to_outline_heading = function(element){
    var $element = $(element)
//    var element = $element[0]
    var $heading_option_button = $element.children().children('ul').children('.heading_option_button')
/*    $heading_option_button.click(function(){
	Outline.HeadingOptionMenu.toggle_options_menu(this)
    })*/
    $heading_option_button[0].addEventListener("click",function(event){
	Outline.HeadingOptionMenu.toggle_options_menu(this)
    })
    $heading_option_button[0].addEventListener("keypress",function(event){
	if(event.which == 10 || event.which == 13 || event.which == 32) {
	// on keypress "Enter" or "Space Bar", perform action 
	    Outline.HeadingOptionMenu.toggle_options_menu(this)
	}
    })

    var new_row_button = $heading_option_button.children('ul').children('.new_row')
    new_row_button[0].addEventListener("click", function(){
	Outline.create_new_element($element)
	setTimeout(function(){Outline.set_outline_size()},10) // Important when creating first list element in outline.
    })
    new_row_button[0].addEventListener("keypress", function(e){
	if (e.which == 10 || e.which == 13) {
	    Outline.create_new_element(element)
	} else if (e.keyCode == 38 || e.keyCode == 37) {
            $(this).parent().parent().children('span').focus()
	} else if (e.keyCode == 40 || e.keyCode == 39) {
            $(this).next().focus()
	}
    })
}

