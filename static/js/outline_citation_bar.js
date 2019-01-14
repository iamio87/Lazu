Outline.CitationList = {}
Outline.CitationList.__className__ = "citations_list"
Outline.CitationList.fill_CitationList = function(element){
    //     Ok, now let's fill in the citations side-menu
//    var list = Outline.CitationList.__init__()
    var list = document.createElement('div')
    list.setAttribute('class',Outline.CitationList.__className__)
    list.setAttribute('id',"citations_list_of_element_"+element.value)
    var element_id = element.getAttribute('value')
    var citations = Relationships.get_element_citations(Lawccess.data, element_id)
    for (var i in citations){
		Outline.CitationList.add_citation(list, citations[i])
    } // fill in side-menu loop
    return list
}

Outline.CitationList.add_citation=function(list, citation){
    var paragraph = document.createElement('p')
    paragraph.draggable = true;
	paragraph.addEventListener("mousedown", function(e){Lawccess.context.CitationList=true})
    paragraph.addEventListener("dragstart", Drag.dragstart);
	paragraph.addEventListener("dragend", Drag.dragend);
    paragraph.setAttribute('value', citation.id);
    paragraph.setAttribute('id','drag_citation_'+citation.id);
    paragraph.className = "citation";
    paragraph.innerHTML = Markup.markup_to_html(citation.content) + "<br>"+ easyCitation(citation.source_id, citation.locator);
	paragraph.style.border = "1px solid gray";
	paragraph.addEventListener('dblclick', function(e){//// Double Click to go to Source View for that citation.
		Lawccess.context.source = citation.source_id;
		Lawccess.Controller.change_context_location('source');
		setTimeout(function(){
			$("#citation_"+citation.id).children('td').first().focus();}, 500
		)
	});
    list.appendChild(paragraph);
	
}

Outline.CitationList.__init__ = function(){

//    list.style = "border: 1px solid black; width:200px; min-height:1em; display:inline-block;"
//    var focusStealer = document.createElement('input')
 //   focusStealer.style = "height:1px;width:1px;border:1px solid white;"
//    list.appendChild(focusStealer)
    return list
}

Outline.CitationList._insert = function(element){  
    var list = Outline.CitationList.fill_CitationList(element)
    list.style.display="none"
    element.children[0].children[3].insertBefore(list, element.children[0].children[3].children[0])
//    element.children[0].children[3].children[1].style.width = parseInt(element.children[0].children[3].style.width) - 210


//	list.onmouseover = function(e){list.focus()} //// TODO: This is a hack to keep the outline element from collapsing when user clicks on citation to drag when the focus is on div.title or div.description. Unfortunately, the document.activeElement is document.body when dragging a citation from the citation list. I am now using a hack that uses Lawccess.context.CitationList

    $(list).slideDown(300)
}

Outline.CitationList.toggle = function(element){
    if (element.children[0].children[3].style.display == "none"){var hidden = true}
    $(element).children('div').children('div.substance').slideDown(400)
    $(element).children('div').children('div.substance')[0].classList.add('citation_pane')
    try {
		var citation_list = element.children[0].getElementsByClassName(Outline.CitationList.__className__)
    } catch(e) {
		var citation_list = $(element).children('div').children('substance').children("."+Outline.CitationList.__className__).length
    }
    if (citation_list.length == 0){
		Outline.CitationList._insert(element)
    } else {
		if (hidden == true){
			setTimeout(function(){Outline.CitationList._remove(element, citation_list[0])}, 400);
		} else {
			Outline.CitationList._remove(element, citation_list[0])
		}
    }
}

Outline.CitationList._remove = function(element, citation_list){
    $(citation_list).slideUp(300, function(){
	citation_list.parentNode.classList.remove('citation_pane');
	citation_list.remove();
    })
}

Outline.CitationList.update_cite = function(id){
	try {
		var cite = document.getElementById('drag_citation_'+id);
		var citation = Lawccess.data.citations[id];
		cite.innerHTML = Markup.markup_to_html(citation.content) + "<br>"+ easyCitation(citation.source_id, citation.locator);
	} catch(e) {
		//// CitationList is toggled off.
	}
}
