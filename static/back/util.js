jQuery.fn.extend({
    onEdit: function(callback) {
        return this.each(function(){
            // This is the counter function. Even without blurring, the field saves 3 seconds after the last edit.
            var counter = -1;
            function _decrement(callback){
                context = this
                counter = counter-1;
                if (counter > 0) {
                    setTimeout(function(){_decrement.call(context, callback)},1000);
                }
                else if (counter == 0){
					callback.call(this);
					counter=-1;
				} else {
					/// counter == -1 --> callback already fired.
				}
            }

            // Keypress restarts counter for the save function
            this.addEventListener('keypress',function(event){
                if ((event.keyCode != 9)&&(!event.altKey)) {// If not TAB or ALT key
		            if (counter < 1) {
		                counter=3;
		                _decrement.call(this, callback);  
		            }
		            else {
		                counter=3;
		            }
				}
            });
			this.addEventListener('change', function(event){
	            if (counter < 1) {
	                counter=3;
	                _decrement.call(this, callback);  
	            }
	            else {
	                counter=3;
	            }
			})
			this.addEventListener('paste', function(event){
	            if (counter < 1) {
	                counter=3;
	                _decrement.call(this, callback);  
	            }
	            else {
	                counter=3;
	            }
			})

            // Dropping data into the field restarts the counter
            this.addEventListener("drop", function(event){
                if (counter < 1) {
                    counter=3;
                    _decrement.call(this, callback);  
                }
                else {
                    counter=3;
                }
            })

            // Losing focus on the field fires the onedit callback immediately.
            this.addEventListener('blur',function(){
                if (counter > -1) {
            	    callback.call(this); counter=-1; return this;
                }
            })
        })
    }
});

//// This is a convenience method for editing information on profile pages.
jQuery.fn.extend({
    editable: function(callback) {
        return this.each(function(){
            var inputField = this//.onEdit(callback);
            $(this).focus(function(){
                inputField.style = "border-radius:5px;border:1px solid #62F0F0;box-shadow: 0px 0px 3px #62F0F0;"
            })
            $('<img src="'+ Lawccess.site.staticURL+"image/edit-icon.png" +'">').load(function() {
                $(this).width(20).height(20).insertAfter(inputField);
                $(this).click(function(event){
                    inputField.contentEditable = true
                    inputField.focus()
		  			inputField.style.outline=0
                })
            });
            $(inputField).blur(function(event){
                this.style = "border:0px solid transparent";
                this.contentEditable = false;
            })
            $(inputField).onEdit(callback)
        })
    }
})

//// This is a method for editing bibliography information that should not have formattting.
jQuery.fn.extend({
    editField: function(callback) {
        return this.each(function(){
            var inputField = this//.onEdit(callback);
			inputField.contentEditable = true
            $(this).focus(function(){
                inputField.style = "border-radius:5px;border:1px solid #62F0F0;box-shadow: 0px 0px 3px #62F0F0;"
            })
            $(inputField).blur(function(event){
                this.style = "border:0px solid transparent";
                this.contentEditable = false;
            })
            $(inputField).onEdit(callback)
        })
    }
})


jQuery.fn.extend({
    editAreaSimple: function(callback) {
        return this.each(function(){
            var inputField = this//.onEdit(callback);
			inputField.contentEditable = true
/*            $(this).focus(function(){
                inputField.style = "border-radius:5px;border:1px solid #62F0F0;box-shadow: 0px 0px 3px #62F0F0;"
            })
            $(inputField).blur(function(event){
                this.style = "border:0px solid transparent";
                this.contentEditable = false;
            })*/
            $(inputField).onEdit(callback)
        })
    }
})

//// 
jQuery.fn.extend({
    editArea: function(callback) {
		/* editArea() extends onEdit() by allowing rich formatting. */
        return this.each(function(){

			Editor.connect(this); /// Turns Element into lightweight text editor. 
			
			function advCallback(){
				Editor.homogenize(this);
				callback.call(this);
			}
		    $(this).onEdit(advCallback);
			this.update = function(){advCallback.call(this)};/// An API to fire the update function programatically. This is used by citation_popup.js.
	    })
    }
});
jQuery.fn.extend({
    editTitleField: function(callback) {
		/* editArea() extends onEdit() by allowing rich formatting. */
        return this.each(function(){

			Editor.restricted_connect(this); /// Turns Element into lightweight text editor. 
//			Editor.connect(this); /// Turns Element into lightweight text editor.

			function advCallback(){
				Editor.homogenize(this);
				callback.call(this);
			}
		    $(this).onEdit(advCallback);
			this.update = function(){advCallback.call(this)};/// An API to fire the update function programatically. This is used by citation_popup.js.
	    })
    }
});



/*///// This adds an extend() function similar to Python's extend() to javascript arrays
Array.prototype.extend = function(array) {
    for (var i = 0, len = array.length; i < len; ++i) {
        this.push(array[i]);
    };    
}*/

///// sort_by. used for revision.js //////
var sort_by = function(field, reverse, primer){
   var key = primer ?
        function(x) {return primer(x[field])} :
    function(x) {return x[field]};
    reverse = [-1, 1][+!!reverse];
    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
}
