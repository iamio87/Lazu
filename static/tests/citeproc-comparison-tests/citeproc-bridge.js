var easyRender = function(itemID){
	var citeproc = L;
	Lawccess.data.sources[itemID].bibliography.id = itemID;
	var s = Lawccess.data.sources[itemID].bibliography
	s.id = itemID;
	citeproc.Source.add(s)
	return citeproc.bibRender(s);
}

var easyCitation = function(itemID, locator){
	var citeproc = L;
	var locator = locator || "";
	return citeproc.easyCite( {'cites' : [ { "id": parseInt(itemID), "locator": locator } ], 'properties' : {} }, [ ] , [ ] );
//	Lawccess.data.sources[itemID].bibliography.id = itemID;
//	var cite = citeproc.processCitationCluster( {'citationItems' : [ { "id": parseInt(itemID), "locator": locator } ], 'properties' : {} }, [ ] , [ ] )
//	var cite = citeproc.processCitationCluster( {'cites' : [ { "id": parseInt(itemID), "locator": locator } ], 'properties' : {} }, [ ] , [ ] )
//	console.log(cite[1][0][1].length, cite[1][0][1].substring(1,51))
	if (cite[1][0][1].indexOf("[CSL STYLE ERROR:") > -1){
		return "No Citation Yet"
	}
	return cite[1][0][1]
}
