Drag = {}

Drag.allowDrop = function(ev) {
	FormattingEngine.Range.saveRange()
//	console.log(FormattingEngine.Range.showRange())
    if (ev.originalTarget.tagName == "REF"){
        ev.preventDefault()
    } else {
        setTimeout(function(){
            Markup.markup_to_html(ev.target)
			FormattingEngine.Range.restoreRange();
        },300)
    }
}

Drag.dragstart = function(ev) {
    ev.dataTransfer.setData("Text","[["+ev.target.getAttribute('value')+"]]");
}
Drag.dragend = function(ev) {
	Lawccess.context.CitationList=false;
	console.log('hi')
}
Drag.no_drop = function(event) {
    event.preventDefault()
}

Drag.make_droppable = function(element){
    element.addEventListener("drop",function(event){Drag.allowDrop(event)})
}

Drag.updateCitationNodeRelationship=function(ev){
	ev.preventDefault();
	console.log(ev.dataTransfer.getData("Text"), ev);
	var text = ev.dataTransfer.getData("Text");
	if ((text.substr(0,2)=="[[") & (text.substr(-2,2)=="]]")){//// Let's have some assurance we are dropping a citation.
		var citation_id = text.substr(2, (text.length-4))
	}
}
