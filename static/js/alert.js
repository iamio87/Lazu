Signal.register({"subject":"CSLstyle","event":"invalid-style","fn":(function(id, state){
	(function(){
		var frame = document.createElement('DIV');
		frame.setAttribute('id', "alert-box");
		frame.innerHTML = "<p>Hello, you have to select a citation style to make use of the application. You should only be seeing this message when you have started a new project. If you are getting this message at any other time, please let us know at veritaswebservices@gmail.com.</p>";
		document.body.appendChild(frame);


		frame.appendChild(document.getElementById('style-select'))
		})()
	})
})
Signal.register({"subject":"CSLstyle","event":"new-style","fn":(function(id, state){
		try {
			var select = document.getElementById('style-select');
			var sibling = document.getElementById('recent_project_edits');
			sibling.parentNode.insertBefore(select, sibling);
			document.getElementById('alert-box').remove()
		} catch(e){

		}
	})
})
