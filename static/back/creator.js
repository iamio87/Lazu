var Creator = (function(){

	function applyAttributes(element, json){
		for (var attr in json){
			if (attr == "listeners"){
				/// "listeners" property must contain a child list
				json.attr.map(function(func){
					/// elements of the list must be objects with an 'event' property and 'fn' property.
					element.addEventListener(func.event, func.fn)
				})
			} else {
				/// assumes that json.attr is a text value.
				element.setAttribute(attr, json.attr)
			}
		}	
	}

	function addCell(json){
		var cell = document.createElement("TD")
		if (json.hasOwnProperty('attrs')){
			if (json.attrs.hasOwnProperty('input')){
				cell = document.createElement("INPUT")
				cell.style.display="table-cell";
				cell.value = json.content
			}
			applyAttributs(cell, json.attrs)
		}
		if (typeof(json.content)=="string"){
			cell.innerHTML = json.content
		} else if (json.hasOwnProperty("DOMobject")){
			cell.appendChild(json.content)
		}
		this.appendChild(cell)
	}

	function addRow(json){
		var row = document.createElement("TR")
		if (json.hasOwnProperty('attrs')){
			applyAttributs(row, json.attrs)
		}
		if (json.hasOwnProperty('children')){
			json.children.map(function(child){
				addCell.call(row, json.child)
			})
		}
		this.appendChild(row)
	}

	function createTable(data){
		if (typeof(data) == "undefined"){
			data = {}
		}
// example: {table:{class:className,name:nameName,listeners:[{event:event1,fn:fn1},{event:event2,fn,fn2}]}}
		var table= document.createElement('TABLE')
		if (data.hasOwnProperty('table')){
			if (data.hasOwnProperty('attrs')){
				applyAttributes(table, data.table.attrs)
			}
		}
		if (data.hasOwnProperty('header')){
			if (data.header.hasOwnProperty('children')){
				var thead = document.createElement('THEAD')
				data.header.children.map(function(row){
					addRow.call(thead, data.header)
				})
				table.appendChild(thead)			
			}
		}
		var tbody = document.createElement('TBODY')
		if (data.hasOwnProperty('body')){
			if (data.body.hasOwnProperty('children')){
				data.body.children.map(function(row){
					addRow.call(tbody, row)
				})
			}
		}
		table.appendChild(tbody)
		return table
	}

	return {
		table:createTable
	}
})()
