Diff = (function(){

	function applyDiff(diff){
		var cursor = 0;
		var content = a.textContent
		var output = []
		diff.map(function(item, index){
			if (item.ins == true){
				output.push(item.value)
			} else if (item.del == true){
				cursor = cursor + item.value.length;
			} else {
				output.push(content.slice(cursor, cursor+item.value.length))
				cursor = cursor + item.value.length;
			}
		})
		return output.join('');
	}
	function patchList(List, diff){
		diff.map(function(item){
			if (item.del >= 0){
				List.slice(item.del, 1);
			}
			if (item.ins >= 0){
				List.slice(item.ins, 0, item.val);
			}
		})
		return List;
	}

	function minimalDiff(content, diff){
		var counter = 0;
		var output = []
		diff.map(function(item, index){
			delete item.count;
			if (item.ins == true){
				output.push({"val":item.value,"i":counter,"a":"ins"})
			} else if (item.del == true){
				output.push({"val":item.value,"i":counter,"a":"del"})
				counter += item.value.length
			} else { //// no insert or delete - unchanged content.
				counter += item.value.length;
			}
		})
		return output;
	}

	function LazuDiff(a, b){
		return minimalDiff(a, JsDiff["diffWords"](a, b));
	}

	function applyMinDiff(content, diff){
		var position = 0
		var output = []
		diff.map(function(item, index){
			output.push(content.slice(position, item.i))
			if (item.a == "ins"){
				position = item.i
				output.push(item.val)
			} else if (item.a == "del"){
				position = item.i + item.val.length;
			}
		})
		output.push(content.slice(position, content.length))
		return output.join('');
	}

	function applyMinDiffPretty(content, diff){
		var position = 0
		diff.map(function(item, index){
			var node = document.createTextNode(content.slice(position, item.i))
			fragment.appendChild(node)
			if (item.a == "ins"){
				node = document.createElement('ins');
				node.appendChild(document.createTextNode(item.val));
				position = item.i
			} else if (item.a == "del"){
//				item.val = content.slice(item.i, item.i+item.val.length) //// just in case we decide to remove val from "del" transformations.
				node = document.createElement('del');
				node.appendChild(document.createTextNode(item.val));
				position = item.i + item.val.length
			}
			fragment.appendChild(node)
		})
		var node = document.createTextNode(content.slice(position, content.length))
		fragment.appendChild(node)
		return fragment;
	}

	function parseUpdateToJSON(string){
		var result = []
		string.split('\n').map(function(item, index, array){
			var output = {}
			item.split(', ').map(function(pair){
				var key, val
				[key, val] = pair.split(":")
				output[key]=val
			})
			if (item.substr(-5) == "D:" || "S:") /// "D" for Diff or Delta,"S" is for State.
			output["diff"] = array.splice(index+1, 1) //// Next line is content - not key values.
		})

	}

	function revert(diffs){ //// handles arrays of tier1, arrays of tier2, or tier2 object.
		var tags = ["ins","del","new","old"]; 
		var revers = {"ins":"del","del":"ins","new":"old","old":"new"};
		function tier2(diff){
			var output = {}
//			console.log(Object.keys(diff), diff)
			Object.keys(diff).map(function(key){
				if (tags.indexOf(key) < 0) {
					output[key] = diff[key]
				} else {
					output[revers[key]] = diff[key]
				}
//				console.log(output)
			})
//			console.log(output)
			return output;
		}
		function tier1(diff){
			var output = {}
			Object.keys(diff).map(function(key){
				if (key == "D"){
					output["D"] = tier2(diff["D"]);
				} else if (key == "S"){
					output["S"] = tier2(diff["S"]);
				} else {
					output[key] = diff[key];
				}
			})
			return output
		}
		try {		
			return diffs.map(function(diff){
				if (diff.hasOwnProperty("D")){
					return tier1(diff);
				} else if (tier1.hasOwnProperty("S")){
					return tier1(diff);
				} else {
					return tier2(diff);
				}
			})
		} catch(e) {
			return tier2(diffs);
		}
	}

	return {
		diff:LazuDiff,
		patch:applyMinDiff,
		patchElement:applyMinDiffPretty,
		parseUpdate:parseUpdateToJSON,
		revert:revert,
		patchList:patchList,
	}

})()
