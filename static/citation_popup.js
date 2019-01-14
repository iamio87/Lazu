
CitationPopup = (function(){

    var counter = -1;
	var citationID = 0;
	var dirty = false;
	var clientElement
	var prefixDOM
	var suffixDOM

	var createCitationPane= function(){
		var citation_pane = document.createElement('citation_pane') //// Creating a custom html element. This is the floating box when user hovers over <ref> elements
		//// Attaches citation_pane to document body.
		window.addEventListener("load", function(){
			document.body.appendChild(citation_pane)
		})
		citation_pane.style.display="none"
		citation_pane.addEventListener("mouseout", function(event){
		    x = parseInt(this.style.left, 10); y=parseInt(this.style.top,10);
		    if ((event.clientX <= x) || (event.clientX >= x+this.clientWidth) || (event.clientY <= y) || (event.clientY >= y+this.clientHeight)){
				timerReset();				
		    }        	
		})
		citation_pane.addEventListener("mouseenter",function(e){
			counter = -1;
		})
		var citationContent = document.createElement('DIV');
		var prefixField = document.createElement('SPAN');
		prefixField.contentEditable = true;
		prefixField.addEventListener('keypress', function(e){
			var field = this
			setTimeout(function(){
				dirty = true;
				prefixDOM.textContent = field.textContent;
			}, 20)
		})
		var suffixField = document.createElement('SPAN');
		suffixField.contentEditable = true;
		suffixField.addEventListener('keypress', function(e){
			var field = this
			setTimeout(function(){
				dirty = true;
				suffixDOM.textContent = field.textContent;
			}, 20)
		})
		var citationField = document.createElement('SPAN');
		citationContent.appendChild(prefixField); citationContent.appendChild(citationField);
		citationContent.appendChild(suffixField); citation_pane.appendChild(citationContent);
		return citation_pane
	}

	var timerReset = function(){
		if (counter < 1) {
			counter = 2;
			decrement.call();
		} else {
			counter = 2;
		}
	}
	var timerStop = function(){
		counter = -1;
	}
    var decrement = function() {//// Loosely imitating the counter function of util.js onEdit()
        counter = counter-1;
        if (counter > 0) {
            setTimeout(function(){decrement()},1000);
        }
        else if (counter == 0) {
			counter=-1;
			if (dirty){
				getEditorNode(clientElement).update()
				dirty = false;
			}
			CitationPopup.citationPane.style.display="none";
			return
		}
		else {
			return
		}
    }

	var getEditorNode = function(element) {
		if (element.parentNode['contentEditable'] == "true"){
			return element.parentNode;
		} else if (element.tagName == "BODY"){
			return false;
		} else {
			return getEditorNode(element.parentNode);
		}
	}

    var show_balloon = function(RefNode, event){
		//// Format citations
//		var id = RefNode.getAttribute('ref')//// OLD model of <ref>
		var IDField = RefNode.getElementsByTagName('ref-id')[0]
		var id = IDField.textContent
//		var prefix = " ", suffix = " ";
		if (RefNode.getElementsByTagName('PREFIX').length == 0){
			RefNode.insertBefore(document.createElement('PREFIX'), IDField);
		}
		if (RefNode.getElementsByTagName('SUFFIX').length == 0){
			RefNode.insertBefore(document.createElement('SUFFIX'), IDField.nextSibling);
		}
		BB = RefNode;
		prefixDOM = RefNode.getElementsByTagName('prefix')[0];
		var prefix = prefixDOM.textContent;
		suffixDOM = RefNode.getElementsByTagName('suffix')[0];
		var suffix = suffixDOM.textContent;
		if (typeof(Lawccess.data.citations[id])=="undefined"){var content = "<em>deleted</em>"} else {
			var citation = Lawccess.data.citations[id]
			var source = Lawccess.data.sources[citation["source_id"]]
			Lawccess.data.sources[citation["source_id"]].bibliography['id'] = citation['source_id']
			var locator = citation["locator"]
			var relatedElements = citation["outlineElements"]
			var content = easyCitation(citation["source_id"], locator)
		}
		
		//// Create floating citation pane
		var citation_pane = CitationPopup.citationPane;
		var x = event.clientX+3; var y=event.clientY+5;
//// TODO: Make this more sensible
		if ((window.innerWidth - x) < 350){
			x = x-(window.innerWidth-x);
		}
		if ((window.innerHeight - y) < 150){
			y = y - 150;
		}
		citation_pane.style.left = x+"px";
		citation_pane.style.top = y+"px";
		citation_pane.style.display = "block";
		citation_pane.children[0].children[1].innerHTML = content; /// Clears old content & adds new.
		citation_pane.children[0].children[0].textContent = prefix; 
		citation_pane.children[0].children[2].textContent = suffix; 
//		citation_pane.children[0].children[0].
//		citation_pane.children[0].children[2]


		if (citation_pane.children.length==2){
			citation_pane.children[1].remove();
		}
		citationPane.appendChild(createButtonsPane(RefNode, id));
    }

	var createButtonsPane = function(refNode, citation_id){
		var p1= document.createElement('P');
		var removeButton = document.createElement('BUTTON');
		removeButton.textContent = "Remove cite"
		removeButton.addEventListener('click',function(e){
			var editorNode = getEditorNode(refNode.parentNode)
			refNode.remove()
			editorNode.update() //// Custom DOM method for contentEditable elements
			CitationPopup.citationPane.style.display="none";

		})
		var br = document.createElement('BR');
		var GoToSourceButton = document.createElement('BUTTON');
		GoToSourceButton.textContent = "Go to Citation"
		GoToSourceButton.addEventListener('click',function(e){
			Lawccess.Controller.ChangeView.citation(citation_id)
			CitationPopup.citationPane.style.display="none";
		})
		GoToSourceButton.style.display = "block";
		p1.appendChild(removeButton);p1.appendChild(br);p1.appendChild(GoToSourceButton);
		return p1;
	}

	var citationPane=createCitationPane()
    var timer;

	var add=function(RefNode){
		[].slice.call(RefNode.children).map(function(child){
			child.addEventListener("mouseenter", function(event){
				timerStop();
			});
		})
		//// When Popup is being displayed
		RefNode.addEventListener("mouseenter", function(event){
			timerStop();
			//// When Popup is being displayed
		    if (CitationPopup.citationPane.style.display != "none"){ 
		        if (clientElement == this){ //// On re-entering <ref> tag. no need to update.
		            return ;
		        } else { //// On entering a new <ref> tag
				    clientElement = this;
				}
		    }                  
		    show_balloon(this, event)
		})
		
		RefNode.addEventListener("mouseout", function(e){
			timerReset();
		})
	}

	return {
		citationPane:citationPane,
		add:add,
		timer:timer,
	}
})()
