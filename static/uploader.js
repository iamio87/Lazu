
FileUploader = function(element, url, callback){
    var input_name = element.getAttribute('name') || element.getAttribute('id')
    var button_text = element.textContent
    var iframe_name = input_name+'-hidden-frame'
    var form = document.createElement('FORM')
    form.setAttribute('enctype','multipart/form-data')
    form.action = url
    form.setAttribute('method','post')
    form.setAttribute('target',iframe_name)
    form.style.display="inline-block"
    form.style.border = "1px dotted #aacc33"
    element.parentNode.insertBefore(form, element)
    element.remove()
    var csrf_middleware_token = document.createElement('INPUT')
    csrf_middleware_token.setAttribute('type','hidden')
    csrf_middleware_token.setAttribute('value',window.csrftoken)
    csrf_middleware_token.setAttribute('name','csrfmiddlewaretoken')
    form.appendChild(csrf_middleware_token)
    var error_div = document.createElement('DIV')
    error_div.style.font.size=".7em"
    form.appendChild(error_div)
    var input = document.createElement('INPUT')
    input.setAttribute('name',input_name)
    input.type='file'
	var label = document.createElement('LABEL')
	label.textContent = "Label"
	label.setAttribute('for',input_name);
	input.appendChild(label)
//	console.log(input.children)
    form.appendChild(input)
    var button = document.createElement('BUTTON')
    button.textContent=button_text
    form.appendChild(button)
    //create iframe//
    iframe = document.createElement('IFRAME')
    iframe.setAttribute('name',iframe_name)
    form.appendChild(iframe)

    iframe.style.display="none"

    ////Logic////
    button.addEventListener('click', function(e){
	if (e.target.getAttribute('disabled')==true){e.preventDefault()}
	else {setTimeout(function(){e.target.disabled = true}, 100)}
	var check_for_response = function(){
	    var iframe = document.getElementsByName(iframe_name)[0]
	    var iframeDocument = iframe.contentDocument || 	iframe.contentWindow.document;
	    var ibody = iframeDocument.children[0].children[1]
	    var serverResponse = ibody.innerHTML
	    if (serverResponse == ""){
		setTimeout(function(){check_for_response()}, 6000)
	    }
	    else {
		ibody.innerHTML=""
		error_div.innerHTML=""
		e.target.disabled=false
		console.log(serverResponse)
		var data = JSON.parse(serverResponse)
		if (data.status == "error"){
		    error_div.innerHTML=data.error
		}
		else {
		    e.target.parentNode.reset()
		    callback(data)
		}
	    }
	}
	setTimeout(function(){check_for_response()},500)
    })
}
