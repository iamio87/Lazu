	var MutationObserver= window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	var observer = new MutationObserver(function (mutations) {
		console.log("mutate 1", mutations, undo, history.length);
		if (undo == false){
			history.push(mutations)
		}
		mutations.map(function(mutation){
			if (mutation.type == "characterData"){
				FormattingEngine.Range.saveRange();
				console.log(mutation.target, mutation.oldValue, mutation.target.parentElement, FormattingEngine.Range.showRange())
			}
		})
		undo = false;
	});
	element.observer = observer;
	ShadowDOM.blotFromDOM(element);

	observer.observe(element, {
	    attributes: true,
	    childList: true,
	    characterData: true,
	    characterDataOldValue: true,
	    subtree: true
	});

	var undo;
	var history = [];
	var redo = []

	var restore = function(){
		undo = true;
		var mutations = history.pop();
		redo.splice(0, 0, mutations)
		for (var j = mutations.length -1; j > -1; j--){
			var mutation = mutations[j];
			if (mutation.type == "childList"){
				if (mutation.addedNodes.length) {
					mutation.addedNodes.forEach(function(addedNode){
						mutation.target.removeChild(addedNode);
					})
				} else if (mutation.removedNodes.length) {
					mutation.removedNodes.forEach(function(removedNode){
						mutation.target.insertBefore(removedNode, mutation.nextSibling);
					})
				}
			} else if (mutation.type == "characterData"){
				mutation.target.replaceData(0, mutation.target.length, mutation.oldValue)
			}
		}
	}
