var Signal = (function(){
	var functions = {};

	var register = function(dictionary){
		if (typeof(functions[dictionary.subject]) == "undefined"){
			functions[dictionary.subject] = {};
		}
		if (typeof(functions[dictionary.subject][dictionary.event]) == "undefined"){
			functions[dictionary.subject][dictionary.event] = [];
		}
		functions[dictionary.subject][dictionary.event].push(dictionary.fn);
	}

	var unregister = function(dictionary){
		if (typeof(functions[dictionary.subject]) == "undefined"){
			functions[dictionary.subject] = {};
			functions[dictionary.subject][dictionary.event] = []
		}
		functions[dictionary.subject][dictionary.event].pop(dictionary.fn)
	}

	var send = function(subject, event, id, state){
		if (functions[subject] && functions[subject][event]){
			functions[subject][event].map(function(fn){
				fn(id, state);
			})
		}
	}

	var msg = (function(){
		var letter = document.createElement('DIV')
		letter.setAttribute('class','signal-msg')
		return letter;
	})()

	var show_msg = function(message){
		var div = document.createElement('div');
		div.innerHTML = message
		div.className = 'ui-state-error'
		div.style.position = "fixed"
		div.style.bottom = "80px"
		div.style.padding = "12px"
		div.style.borderRadius = "5px"
		div.style.opacity = "0.9"
		div.style["z-index"]=55;
		div.onclick = function(event){div.remove()}
		div.id='ajax_msg'
		document.body.appendChild(div)
	}

	var hide_msg = function(){
		document.removeChild(msg);
	}

	//// Public API
	return {
		"register":register,
		"subscribe":register,
		"unregister":unregister,
		"functions":functions,
		"send":send,
		"publish":send,
		"show":show_msg,
		"hide":hide_msg,
	}
})()

Signal.register({"subject":"data","event":"load","fn":(function(id, state){
		console.log('loading Project Data')
	})
})
Signal.register({"subject":"data","event":"finished","fn":(function(id, state){
		console.log('Finished loading Project Data')
	})
})


Signal.register({"subject":"application","event":"finished","fn":(function(id, state){
		Signal.register({"subject":"source","event":"update","fn":(function(id, state){
				Sources.update_source(id);
				Outline.CitationList.update_cite(id);
				if (Lawccess.context.location == "source"){
					if (state == "conflict"){
						Source.Bibliography.update_bibliography_frame()
					}
				}
			})
		});
		Signal.register({"subject":"source","event":"update-complex","fn":(function(id, state){
				Sources.update_source(id);
				Outline.CitationList.update_cite(id);
				if (Lawccess.context.location == "source"){
					if (state == "conflict"){
						Source.Bibliography.update_bibliography_frame()
					}
				}
			})
		})
		Signal.register({"subject":"citation","event":"update","fn":(function(id, state){
				Outline.CitationList.update_cite(id);
				if (Lawccess.context.location == "source"){
					if (state == "conflict") {
						Source.Citation.update_row(id);
					}
				}
			})
		})
		Signal.register({"subject":"page","event":"finished","fn":(function(id, state){
				console.log('page loaded')
			})
		})
	})
})

