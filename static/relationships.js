Relationships = {}

Relationships._get_relationships = function(data, field, id){
    var relationships = []
    for (i in data){
	if (data[i][field] == id){
	    relationships.push(data[i])
	}
    }
    return relationships
}

Relationships.get_element_citations = function(data_set, id){
    var citations = []
    var relationships = Relationships._get_relationships(data_set.citation_element_relationships, 'outlineelement_id', id)
    for (i in relationships){
	citations.push(data_set.citations[relationships[i]['citation_id']])
    }
    return citations
}

/*Relationships.get_citation_elements_id = function(data_set, id){
    var elements = []
    var relationships = Relationships._get_relationships(data_set['citation_element_relationships'], 'citation_id', id)
    for (i in relationships){
	elements.push(relationships[i]['outlineelement_id'])
    }
    return elements
}*/

Relationships.get_citation_elements = function(data_set, id){
    var elements = []
    var relationships = Relationships._get_relationships(data_set['citation_element_relationships'], 'citation_id', id)
//    J = relationships
    for (i=0;i<relationships.length;i++){
	var outlineelement_id = relationships[i]['outlineelement_id']
	var relationship_id = relationships[i]['id']
	elements.push({e_id:outlineelement_id, id:relationship_id})
    }
    return elements
}
/*
Relationships.remove_relationship = function(data_set, id, model){
    var field = model+"_id"

    for (var i=0; i>data_set['citation_element_relationships'].length; i++){
	if (parseInt(data_set['citation_element_relationships'][i][field]).indexOf(parseInt(id)) != -1){
	    data_set['citation_element_relationships'].pop(i)
	}
    }
}*/

//Relationships.data_set_relationships = function(data_set){
//    return data_set['citation_element_relationships']
//}

Relationships.change=function(outlineElement_id, citation_id, relationship_id){
    if (typeof(relationship_id)=="undefined"){
	action =1 // add
	try { //// If CitationList pane is visible, add to pane.
	    var list = document.getElementById('citations_list_of_element_'+outlineElement_id)
	    var citation = Lawccess.data.citations[citation_id]
	    if (document.getElementById('drag_citation_'+citation_id)==null){
		Outline.CitationList.add_citation(list, citation)
	    }
	} catch(e){}
    } else {
        action =0 // remove
	try {document.getElementById('drag_citation_'+citation_id).remove()} catch(e){}
    }
    if (Lawccess.context.editable){
        $.post(Lawccess.context.ajaxURL+"citation_outlineelement_relationship", {"element":outlineElement_id, "citation":citation_id,'p':action}, function(response){
            if (action==1){
                relationship_id = parseInt(response['id'])
				Lawccess.data.citation_element_relationships[relationship_id] = {'citation_id':parseInt(citation_id),'outlineelement_id':parseInt(outlineElement_id),'id':relationship_id};
				if (Lawccess.data.citations[citation_id].outlineElements == undefined){Lawccess.data.citations[citation_id].outlineElements = []}
                Lawccess.data.citations[citation_id].outlineElements.push(outlineElement_id);
                Source.Citations[citation_id]['outlineElements'][outlineElement_id]=relationship_id;
				
            } else if (action == 0){
                delete Lawccess.data.citation_element_relationships[relationship_id]
                delete Source.Citations[citation_id]['outlineElements'][outlineElement_id]
            }
        })
    }
}


