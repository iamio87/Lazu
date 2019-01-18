var Shadow = (function(){

	//// STATIC variables for delta objects. 
	//// TODO: Is shaving a few characters of each delta worth it?
	var profile = 'lazu';
	if (profile === 'quill'){
		var INSERT = 'insert';
		var DELETE = 'delete';
		var RETAIN = 'retain';
		var ATTRIBUTES = 'attributes';
		var RANGE = 'range'
		var EDITOR = 'quill';
	} else { //// profile === 'lazu'
		var INSERT = 'ins';
		var DELETE = 'del';
		var RETAIN = 'retain';
		var ATTRIBUTES = 'attr';
		var EDITOR = 'shadow';
		var RANGE = 'range';
	}

	var PARCHMENT = "blots";
	var NUMBERING = "numbering";


	var STATIC = {
		BOLD:'B',
		ITALIC:'I',
		UNDERLINE:'U',
		RANGE:'range',
	};

	/* Shadow Editor Core */
	//// Editor
		//// Core
			//// Delta - Module for creating, analyzing, modifying deltas.
			//// Blot - which defines Blot types and Blot creation methods.
			//// Parchment - the internal state of the editor-canvas in Parchment format. (depends on Blot);
				//// blots are atomic units of a Parchment.
				//// blots mapped to Canvas DOM elements.
				//// Accepts blots array as first parameter
			//// Transformation - applies delta operations to Parchment & Canvas. (The module of change)
				//// can also apply deltas without Canvas element.
				//// considered the Bridge to Canvas.
				//// depends on Parchment
				//// _Delta module - utility methods for Blot attributes.
					//// Loops through blots and applies appropriate methods for delta operation and blot.type.
				//// DOM module - utility methods for navigating Canvas DOM
					//// methods only accept DOM nodes as parameters
				//// _Blot module - depends on DOM & Attr
					//// methods expects canvas and a blot object as parameters
				//// Normalize module
				//// History module --- TODO
		//// Canvas - the DOM element of the editor
			//// Core can mutate DOM by using deltas without Canvas; Canvas is designed to capture input and generate deltas.
			//// connects element to Core
			//// KeyBoard (depends on Canvas & Functions)
				//// adds eventlisteners to enable basic functionality like cursor movement & character processing.
				//// API for registering keyboard shortcuts
			//// Range (depends on Keyboard & Canvas)
				//// selection module --> maps Canvas elements back to Parchment blots, ranges, & active attributes.
				//// provides context awareness messages to Toolbar
			//// Shortcuts (depends on Range, Keyboard, & Canvas)
				//// Additional eventListeners. Keyboard Shortcuts can be modified by the user.
				//// Comprehensive "actions."
			//// Toolbar (depends on Shortcuts, Canvas, Range)
				//// attach shortcut functions to toolbar buttons.
				//// contextual buttons provided by Range module.

	function safeClone(obj){ //// Important utility function used throughout editor.
		/// preserves references to functions in lists.
		if (Array.isArray(obj)){
			return obj.map(function(child){
				return safeClone(child);
			})
		} else if (typeof(obj)=="object"){
			var ret = {}
			Object.keys(obj).map(function(key, index){
				ret[key] = safeClone(obj[key])
			})
			return ret;
		} else {
			return obj;
		}
	}

	var STATIC = {
		"MODEL":"M",
		"FIELD":"F",
		"USER":"U",
		"TIMESTAMP":"T",
		"LOG":"L",
		"VALIDATOR":"V",
		"DELTA":"D",
		"ID":"ID",
	
		"EDIT":"ed",
		"MAKE":"mk",
		"MOVE":"mv",
		"REMOVE":"rm",
	
		"PARENT":"ptg",
		"POSITION":"pos",
		"INDEX":"pos",
	
		"SET":"set",
		"VALUE":"val",
		"INSERT":"ins",
		"DELETE":"del",
		"RETAIN":"ret"
	};

	var Delta = (function(){ 

		//// Parchment is an open standard of representing a document & transformation history using flat JSON.
		//// In Parchment, an operation is a transformation on a text document. (From operational tranformation)
		//// Operations are represented by an object called a "delta".
		//// There are 3 types of operations -- "retain", "insert", and "delete"
		//// "operation" is interchangable with "transformation".
		//// A delta is a JSON object with represents a unit of 1 of the 3 operations.
		//// a Parchment "document" represents the state of a document with "insert" deltas - it cannot have "retain" or "delete"

		var Attr = (function(){

			function mergeAttr (primary, secondary, preserveFalseValue){
				primary = primary || {}
				secondary = secondary || {};
				if (typeof(secondary) != "object"){
					var ret = {}
				} else {
					var ret = Object.keys(secondary).reduce(function(acc, key){
						acc[key] = secondary[key];
						return acc;
					}, {})
				}
				return Object.keys(primary).reduce(function(acc, key){
					if (!primary[key]){ //// if key has falsey value, delete key
						if (preserveFalseValue) { //// however, some methods do want falsey keys preserved, so let's make sure
							acc[key] = primary[key]
						} else { 
							delete acc[key];
						}
					} else {
						acc[key] = primary[key];
					}
					return acc;
				}, ret)
			}

			function diffAttr (primary, secondary) {
				primary = primary || {};
				secondary = secondary || {};
				return Object.keys(primary).concat(Object.keys(secondary)).reduce(function(acc, key){
					if (!secondary.hasOwnProperty(key)){
						acc[key] = primary[key];
					} else if ((!secondary[key]) &&  (!primary[key])) {
						//// do nothing
					} else if (secondary[key] != primary[key]){
						acc[key] = (primary[key] || false);
					} 
					return acc
				}, {})
			}

			function undoAttr (oldAttr, newAttr) {
				return diffAttr( oldAttr, mergeAttr(oldAttr, newAttr, true) ); //// merge attributes, keeping falsey values for INSERT
			}

			function check_attr_equality (A, B){ //// not recursive! Looser comparison for functional equivalency. see Test module check_equality for a strict comparison.
				var keys = []
				A = A || {};
				B = B || {};
				Object.keys(A).reduce(function(keys, key){
					if (keys.indexOf(key) == -1){
						keys.push(key);
					}
					return keys;
				}, keys);
				Object.keys(B).reduce(function(keys, key){
					if (keys.indexOf(key) == -1){
						keys.push(key);
					}
					return keys;
				}, keys);
				return keys.reduce(function(ret, key){
					if (!ret){
						return ret
					} else {
						if ((A[key] || false) == (B[key] || false)){ //// any falsey value is ok.
							return true;
						} else {
							return false
						}
					}
				},true)
			}
			function check_attr_equality_strict (A, B){ //// similar to check_attr_equality(), but attributes with falsey values are considered. Corresponds to 'preserveFalseValue' parameter in mergeAttr().
				var keys = []
				A = A || {};
				B = B || {};
				Object.keys(A).reduce(function(keys, key){
					if (keys.indexOf(key) == -1){
						keys.push(key);
					}
					return keys;
				}, keys);
				Object.keys(B).reduce(function(keys, key){
					if (keys.indexOf(key) == -1){
						keys.push(key);
					}
					return keys;
				}, keys);
				return keys.reduce(function(ret, key){
					if (!ret){
						return ret
					} else {
						if (A[key] === B[key]){ ////  undefined properties are NOT equal to false properties in strict comparison
							return true;
						} else {
							return false
						}
					}
				},true)
			}

			function getAttr (blot) { // simple utility, helpful for comparing attrs even if the blot doesn't have an attr.
				if (blot.attr){
					return blot.attr;
				}
				return {};
			}

			return {mergeAttr:mergeAttr, diffAttr:diffAttr, check_attr_equality:check_attr_equality, check_attr_equality_strict:check_attr_equality_strict, undoAttr:undoAttr, getAttr:getAttr}; //// Delta.Attr API
		})()

		function createDelta (property, value, attr){  //// method for creating deltas that are consistent with the quill or lazu profile.
			var delta = {};
			delta[property] = value;
			if (attr && Object.keys(attr).length ) {
				delta[ATTRIBUTES] = safeClone(attr);
			}
			return delta; 
		}

		function normalizeDeltas (deltas) {
			for (var index = 0; index < deltas.length-1; index) {
				var delta = deltas[index];
				var nextDelta = deltas[index+1];
				if ( delta.hasOwnProperty(DELETE) ){ //// combine all adjacent deletes by adding their values together
					if ( nextDelta.hasOwnProperty(DELETE) ) {
						delta[DELETE] = delta[DELETE] + nextDelta[DELETE];
						deltas.splice(index+1, 1);
						continue; /// if successful, try to match current delta with delta after nextDelta.
					}
				} else if ( delta.hasOwnProperty(INSERT) ){ /// combine adjacent inserts with loosely matching attributes
					if ( nextDelta.hasOwnProperty(INSERT) ) {
						if ( (typeof(delta[INSERT]) === "string") && (typeof(nextDelta[INSERT]) === "string") ){
							if ( Attr.check_attr_equality(delta.attr, nextDelta.attr) ) {
								delta[INSERT] = delta[INSERT] + nextDelta[INSERT];
								deltas.splice(index+1, 1);
								continue; 
							}
						}
					}
				} else if ( delta.hasOwnProperty(RETAIN) ){ //// combine adjacent retains with strictly matching attributes
					if ( nextDelta.hasOwnProperty(RETAIN) ) {
						if ( Attr.check_attr_equality_strict(delta.attr, nextDelta.attr) ) {
							delta[RETAIN] = delta[RETAIN] + nextDelta[RETAIN];
							deltas.splice(index+1, 1);
							continue;
						}
					}
				}
				index ++; /// no successful merges --> go to next.
			};
			return deltas;
		}

		function splitNewLineDeltas (deltas) { //// This method breaks out newlines from deltas in standard Parchment format. This is used to create Blots that are useful for the editor.
			return deltas.reduce(function (acc, delta){
				if (delta.hasOwnProperty(INSERT) ) {
					if (typeof(delta[INSERT]) === "string") {
						var splitDeltas = delta[INSERT].split('\n');
						if (splitDeltas.length > 1) {
							splitDeltas.map(function(splitDelta, index) {
								if (index !== 0) {
									acc.push( Delta.createDelta(INSERT, '\n', delta.attr) );
								}
								if (splitDelta.length){
									acc.push( Delta.createDelta(INSERT, splitDelta, delta.attr) )
								}
							});
							return acc;
						}
					} else { 
						//// delta is an embed object --> no operation. 
					}
				}
				acc.push(delta);
				return acc;
			}, []);
		}

		////// BEGIN internal helper methods ///////
		function getDeltaPriorityAndLength(delta){
			if (!delta){
				return [0, 0];
			} if (delta.hasOwnProperty(DELETE)) { //// DELETE operations have highest priority. 
				return [3, delta[DELETE]];
			} else if (delta.hasOwnProperty(INSERT) ) { //// INSERT operations have medium priority. 
				if ( typeof(delta[INSERT]) === "string") {
					return [2, delta[INSERT].length]
				}
				return [2, 1];
			} else if (delta.hasOwnProperty(RETAIN) ) { //// RETAIN operations have lowest priority. 
				return [1, delta[RETAIN] ];
			} else {
				return [0, 0]
			}
		}

		function cutDelta(delta, length){
			if (delta[DELETE]){
				delta[DELETE] = delta[DELETE] - length;
			}
			if (delta[INSERT]){
				if ( typeof(delta[INSERT]) === "string") {
					delta[INSERT] = delta[INSERT].substr(length);
				} else { //// It's an embed object --> change it to empty string to empty the object.
					delta[INSERT] = ""; 
				}
			}
			if (delta[RETAIN]){
				delta[RETAIN] = delta[RETAIN] - length;
			}
		}
		///// END internal helper methods //////


		function batchMerge (Deltas) {
			//// TODO: add support for undos if needed.
			return Deltas.reduce( function(acc, deltas) {
				acc = mergeDeltas(acc, deltas)[0];
				return acc;
			}, []);
		}

		function mergeDeltas (deltas1, deltas2){
			deltas1 = safeClone(deltas1); //// don't hurt original objects with our mutations. Without mutations, we would be handling nightmarish indeces & offsets.
			deltas2 = safeClone(deltas2);
			var result = [];
			var undo = [];
			while (deltas1.length && deltas2.length) {
				var delta1 = deltas1[0];
				var delta2 = deltas2[0];
				var p1, p2, l1, l2
				[p1, l1] = getDeltaPriorityAndLength(delta1);
				[p2, l2] = getDeltaPriorityAndLength(delta2);
				//// cycle through deltas in both stacks
				if (l2 === 0){ 
					deltas2 = deltas2.slice(1); /// non-destructive
					continue;
				} else if (l1 === 0) {
					deltas1 = deltas1.slice(1); /// non-destructive
					continue;
				}
				var length = Math.min(l1, l2);
				if (p1 === p2){ //// both operations have equal priority --> no overwriting.
					if (p1 === 1) { /// both deltas are RETAINs
						var newAttr = Attr.mergeAttr(delta2[ATTRIBUTES], delta1[ATTRIBUTES], true); //// merge attributes, keeping falsey values for RETAIN
						result.push( Delta.createDelta(RETAIN, length, newAttr ) );
						cutDelta(delta1, length); cutDelta(delta2, length);
					} else { /// both deltas are DELETEs or both INSERTs
						result.push(delta2); //// ---> insert later deltas first.
						deltas2 = deltas2.slice(1); /// insert original object, then slice from array -> instead of cloning then cutting
						if (delta2.ins){ //// Logically, must both be INSERTS, so the undo is a DELETE.
							undo.push( Delta.createDelta(DELETE, (delta2.ins.length || 1) ) );
						}
					}
				} else if (p2 > p1) { /// Later operation overwrites earlier operation, 
					if (p2 === 2){ //// (INS injects into RET)
						result.push(delta2);
						deltas2 = deltas2.slice(1); /// insert original object, then slice from array -> instead of cloning then cutting
					} else { //// (later DEL overwrites earlier INS & RET) --> no insertion
						if ( p1 === 1 ){
							result.push( Delta.createDelta(DELETE, length) );
						} else if (typeof(delta1.ins) === 'string') {
							undo.push( Delta.createDelta(INSERT, delta1.ins.substr(0, length), delta1.attr ) );
						} else { //// insert embed
							undo.push( Delta.createDelta(INSERT, safeClone(delta1.ins), delta1.attr ) );
						}
						cutDelta(delta2, length); cutDelta(delta1, length);
					}

				} else if (p1 > p2) {
					if (p1 === 3) {
						result.push(delta1);
						deltas1 = deltas1.slice(1); /// insert original object, then slice from array -> instead of cloning then cutting
					} else { //// p1 == INSERT, p2 == RETAIN --> apply new formatting to previous text
						var newAttr = Attr.mergeAttr(delta2[ATTRIBUTES], delta1[ATTRIBUTES], false); //// merge attributes, discarding falsey values for INSERT
						if ( typeof(delta1[INSERT]) === "string") {
							var newDelta = Delta.createDelta(INSERT, delta1[INSERT].substr(0, length), newAttr)
						} else { //// embed type
							var newDelta = Delta.createDelta(INSERT, delta1[INSERT], newAttr)
						}
						result.push( newDelta );
						if (undo) {
							undo.push( Delta.createDelta(RETAIN, length, Attr.diffAttr(delta1.attr, newAttr) ) );
						}
						cutDelta(delta2, length); cutDelta(delta1, length);
					}
				}
			}
			while (deltas1.length){//// for leftover deltas in 1st array
				var p, l, d
				d = deltas1.splice(0,1)[0];
				[p, l] = getDeltaPriorityAndLength(d); /// continue guaranteeing that deltas are meaningful.
				if (l !==0 ){
					result.push(d);
				}
			}
			while (deltas2.length){//// for leftover deltas in 2nd array
				var p, l, d
				d = deltas2.splice(0,1)[0];
				[p, l] = getDeltaPriorityAndLength(d); /// continue guaranteeing that deltas are meaningful.
				if (l !== 0 ){
					if (d[INSERT]){ ///// if undo history is relevant, it is only relevant for 'ins' operations.
						undo.push( Delta.createDelta(DELETE, l ) );
					}
					result.push(d);
				}
			}

			normalizeDeltas(result);
			return [result, undo];
		}

		function patchDeltas (deltas1, deltas2, preferDelta2Insert) { 
			//// A collaborative editor must merge changes that diverge from a common a state.
			//// Even though we are "merging" changes into the document; we don't want to actually call mergeDeltas().
			//// mergeDeltas() is designed to merge deltas from a single user. They are sequential - each delta is aware of the state changes made by earlier deltas.
			//// Using mergeDeltas would create a confusing change history when merging changes from different users --> attribution would be muddled, and undo's would have unexpected transformations.
			//// patchDeltas() is designed to merged deltas from different users.
			//// The deltas are unaware of the changes in state made by the other deltas.
			//// in patchDeltas(), we modify one of the deltas, so that it is becomes aware of the state changes made by the other deltas.
			//// This allows mergeDeltas() to be called.

			//// In our editor, the server add's timestamps to deltas, so that earlier deltas have priority over later deltas. --> later deltas are modified to have knowledge of earlier deltas.

			//// Take 2 deltas that diverge from an ancestor state. deltas1 has higher priority than deltas2.
			deltas1 = safeClone(deltas1); //// don't hurt original objects with our mutations. Without mutations, we would be handling nightmarish indeces & offsets.
			deltas2 = safeClone(deltas2);
			var result = [];
//			var undo = []; /// don't need to worry about Undos, b/c undos will be created later. we don't have enough info to make meaningful undos.
			while (deltas1.length && deltas2.length) {
				var delta1 = deltas1[0];
				var delta2 = deltas2[0];
				var p1, p2, l1, l2
				[p1, l1] = getDeltaPriorityAndLength(delta1);
				[p2, l2] = getDeltaPriorityAndLength(delta2);
				//// cycle through deltas in both stacks
				if (l2 === 0){ 
					deltas2 = deltas2.slice(1); /// non-destructive
					continue;
				} else if (l1 === 0) {
					deltas1 = deltas1.slice(1); /// non-destructive
					continue;
				}
				var length = Math.min(l1, l2);
				if (p1 === 1) { //// if retain;	 return delta2
					if (p2 === 1){
						var newAttr = Attr.mergeAttr(delta2[ATTRIBUTES], delta1[ATTRIBUTES], true); //// merge attributes, keeping falsey values for RETAIN
						result.push( Delta.createDelta(RETAIN, length, newAttr ) );
						cutDelta(delta1, length); cutDelta(delta2, length);
					} else if (p2 === 2) {
						result.push(delta2); //// ---> insert later deltas first.
						deltas2 = deltas2.slice(1); /// insert original object, then slice from array -> instead of cloning then cutting
					} else if (p2 === 3) {
						result.push( Delta.createDelta(DELETE, length ) );
						cutDelta(delta1, length); cutDelta(delta2, length);
					}
				} else if (p1 === 2) { //// an INSERT operation throws off index for deltas2 --> add a retain operation to correct index
					///// TODO: It is not clear which INSERT should occur first, if 2 deltas insert at the same index. It is the one case
					if (p2 === 2 && preferDelta2Insert){
						result.push(delta2); //// ---> insert later deltas first.
						deltas2 = deltas2.slice(1); /// insert original object, then slice from array -> instead of cloning then cutting
					} else {
						result.push( Delta.createDelta(RETAIN, (delta1.ins.length || 1) ) );
						deltas1 = deltas1.slice(1);
					}
				} else if (p1 === 3) { //// a DELETE operation throws off the index, but it should not affect INSERT operations in deltas2
					if (p2 === 2) {
						result.push(delta2);
						deltas2 = deltas2.slice(1); 
					} else { //// overwrite RETAIN and redundant DELETE ops in deltas2.
						cutDelta(delta1, length); cutDelta(delta2, length); /// remove length --> do not add to result.
					}
				}
			}

			while (deltas2.length){//// for leftover deltas in 2nd array
				var p, l, d
				d = deltas2.splice(0,1)[0];
				[p, l] = getDeltaPriorityAndLength(d); /// continue guaranteeing that deltas are meaningful.
				if (l !== 0 ){
					result.push(d);
				}
			}

			normalizeDeltas(result);
			return result;
		}

		function mergeUndoDeltas(Deltas){ //// small utility function that explains how undo deltas should be merged.
			return batchMerge(Deltas.reverse());
		}

		return {Attr:Attr, createDelta:createDelta, normalizeDeltas:normalizeDeltas, mergeDeltas:mergeDeltas, patchDeltas:patchDeltas, splitNewLineDeltas:splitNewLineDeltas, batchMerge:batchMerge}; //// Delta API
	})();

	//// Check if Server or Client
	if (typeof(exports) !== "undefined") {
		return {Delta:Delta, STATIC:STATIC}
	} else {
		// Disable resizing in Firefox
		document.addEventListener("DOMContentLoaded", function () {
		document.execCommand("enableObjectResizing", false, false);
	  });
	}

	var Blot = (function(){
		//// Blots are simply an extension of Deltas.
		//// Blots are deltas with DOM nodes.
		//// Blots represent discrete nodes of the editor document.
		//// Normalization() treats blots as the authoritative state of the document.
		//// Unlike Deltas, Blots do not guarantee only 1 possible, concise representation of a document. This is a design choice to allow advanced change-tracking features.

		//// Blots are comparable Quill.js blots. Quill.js blots are inheritable objects that represent an element with methods that define the behavior for that element. Our blots are much simpler.
		//// Unlike Quill, editor behavior is not defined in Blot.methods - Chasing down code through quill's inheritance tree is quite a chore.
		//// See the Transform() module for the basic methods of editor behavior. Blots are the currency of Transform methods.

		//// BLOT TYPES:
		//// Documents are complex. There is text, formatting, lists, tables, images, citations, 
		//// Quill.js provided the insight that all Document elements can be categorized in 4 different categories
		//// * Inline Elements - the text content of the document, as well as basic text formatting.
		//// * Embed Elements - This is the non-text content of the document, such as images, citations, 
		//// * Block Elements - Blocks hold Inline and Embed Elements. Block elements are not content - they simply separate content. Paragraphs, List items, and Table cells
		//// * Container Elements - Containers hold Block Elements. May only have Block elements as child elements. Lists, Table Rows, and Tables.

		//// Blot objects have the following properties
		//// * INSERT property holds the content of the Blot. Block and Container blots are signified by '\n'.
		//// * ATTRIBUTE propery holds the delta attributes, which usually pertain to formatting.
		//// * "type" property signifies which type of Blot - whether Inline (1), Embed (2), Block (4), or Container (5)
		//// * "position" property indicates which array position the blot occupies in the parchment array.
		//// * "node" property points to the corresponding DOM node in the canvas. Points to lowest possible node: Inline element nodes only point to textNodes.
		//// * "child" property points to the highest level DOM element of an Inline or Embed blot. (It is for convenience)
		//// * "parent" property only exists on Container blots. The container blot "node" points to a block element, and "parent" points to the direct parent of the block element. (It is for convenience)

		var FIRST_LEVEL_LIST_INDENT = 0;

		function createNodeFromAttr (attr, textNode){
			if (!attr){
				return textNode;
			}
			var keys = Object.keys(attr).sort(); //// sorting is only important for testing purposes.
			if (keys.length == 0){
				return textNode;
			}
			var elements = keys.reduce(function(acc, key){
				if (Blot.Inline.tags.indexOf(key) > -1){
					if (attr[key] == false){return acc;}
					var element = document.createElement(key)
					acc.push(element);
				}
				return acc;
			}, []);
			if (elements.length == 0){ //// If no tags are specified, <span> is the default inline container
				var parent = document.createElement('SPAN');
			} else {
				var parent = elements[0];
			}
			var inlineAttributes = false
			keys.map(function(key){
				if (Blot.Inline.inlineAttributes.indexOf(key) > -1){
					parent.setAttribute(key, attr[key]);
					if (elements.length == 0){ //// check if we need to add span placeholder.
						elements.push(parent);
					}
				}
			})
			elements.push(textNode);
			/* /////// TODO: switch to more robust attribute setter.
				keys.map(function(key){ //// set attributes 
					if (inlineAttributes.indexOf(key) > -1){ //// add general attributes
						elements[0].setAttribute(key, attr[key]);
					} else if (inlineAttributes.indexOf(key) > -1) { //// add style properties
						elements[0].style.setProperty(key, attr[key]);
					} else if (inlineAttributes.indexOf(key) > -1) { //// add class
						if (attr[key] == false){
							elements[0].classList.remove(key);
						} else {
						elements[0].classList.add(key);
						}
					}
				})
			*/
			elements.map(function(element, index, array){
				if (index !=0){
					array[index-1].appendChild(element)
				}
			})

	//		elements.slice(-1)[0].appendChild(textNode);/// add textNode to bottom-most element.
			return elements[0];
		}

		function createBlot(text, attr) {
			text = text || '\n'; //// default to newline for now.
			attr = attr || {}; //// need to have a normalized attr object.
			var blob = {'ins':text, length:text.length, type:this.type, attr:attr}
			var keys = Object.keys(attr);
			var tag = this.defaultTag; //// default tagName
			var AttributeWhiteList = this.AttributeWhiteList
			for (var i = 0; i < keys.length; i++){
				var key = keys[i];
				if (this.tags.indexOf(key) > -1){
					tag = key; //// explicit tagName;
					break;
				}
			}
			var node = document.createElement(tag);
			keys.map(function(key){
				if (AttributeWhiteList[tag].indexOf(key) > -1){
					node.setAttribute(key, attr[key]);
				}
			})
			blob.node = node
			if (keys.length == 0){ delete blob.attr; } /// remove extraneous attr to make it cleaner.
			return blob;
		}

		var types = {'INLINE':1,'EMBED':2,'EMBED-CONTAINER':3,'BLOCK':4,'CONTAINER':5};
		var attributeTypes = {}
		
		var Container = (function(){
			var type = types['CONTAINER'];
			var ranges = ['table','tr','text','list'];
			var childTags = {'list':'LI','ol':'LI','ul':'LI','table':'TR','tr':'TD','text':'P','OL':'LI','UL':'LI','TABLE':'TR','TR':'TD','DIV':'P'};
			var tags = ['OL','UL','TABLE','TR','TBODY',
				"DETAILS", ///// collapsible details box HTML5
				"DL" ///// Description List
			]; /// important for creating blobs from existing DOM.
			var _tags = {'list':'OL','ol':'OL','ul':'UL','table':'TABLE','tr':'TR','text':null};
			var AttributeWhiteList = {'list':['indent','ordered'],'ol':['indent'],'ul':['indent'],'text':[],'table':[],'tr':[] };
			var ContainerAttributes = ["indent","numbering","range"]
			function getTag(attr){
				var attrToTag = {
					"decimal":"OL",
					"bullet":"UL",
					"table":"TABLE",
					"tr":"TR",
					"text":null
				}
				if (attr[RANGE] === "list"){
					return attrToTag[attr["numbering"] || "decimal"]
				} else {
					return attrToTag[attr[RANGE]]
				}
			}
			function create (attr){
				if (!attr){
					attr = {'range':'text'}
					var range = "text"
				} else {
					var range = attr[RANGE] || "text"
				}
				var tag = getTag(attr);
//				var tag = _tags[range];
/*				var blot = {'ins':text, length:text.length, type: type, attr:attr}
				if (tag){
					var node = document.createElement(tag);
					blot.node = node;
				}
				var keys = Object.keys(attr);
				keys.map(function(key){
					if (key == 'range'){return };
					if (AttributeWhiteList[attr.range].indexOf(key) > -1){
						node.setAttribute(key, attr[key]);
					}
				})*/
				var blot = Block.create((tag || "text"), attr);
				blot.type = type;
				if (tag) {
					blot.parent = document.createElement(tag);
					blot.parent.appendChild(blot.node);
				}
				return blot;
			}
			function createNode(attr){
				var tag = getTag(attr); //_tags[attr.range];
				if (tag) {
					return document.createElement(tag);
				}
				return null;
			}

			function parseDOM (DOM){
				var Attr = {
					"OL":{"range":"list"},
					"UL":{"range":"list","numbering":"bullet"},
					"DL":{"range":"list","numbering":"description"},
					"TR":{"range":"tr"},
					"TABLE":{},
					"DIV":{"range":"text"}
				}
				return Attr[DOM.tagName];
			}

			function isEqual(attr1, attr2){
				if (attr1[RANGE] === "list") {
					return ( ( (attr1[NUMBERING] || "decimal") == (attr2[NUMBERING] || "decimal") ) && ( (attr1["indent"] || 0) == (attr2["indent"] || 0) ) );
				} else {
					return attr1[RANGE] === attr2[RANGE];
				}
			}
			return {create:create, type:type, ranges:ranges, childTags:childTags, tags:tags, _tags:_tags, AttributeWhiteList:AttributeWhiteList, createNode:createNode, parseDOM:parseDOM, isEqual:isEqual, ContainerAttributes:ContainerAttributes};
		})();

		var Block = (function(){
			var type = types['BLOCK'];
			var defaultTag = 'P';
			var tags = [
				'P','LI',
				'TD','CAPTION',
				'CODE','BLOCKQUOTE',
				"SUMMARY"
			];
			var defaultChild = {'P':'BR','LI':'BR','TD':'BR','CODE':'BR','BLOCKQUOTE':'BR'};
			var AttributeWhiteList = {'text':['range'],'ol':['range','indent'],'ul':['range','indent'],'tr':['range'],'table':['range'],'row':['range'],'list':['range','numbering','indent']};
			var disallowedAttributes = {'text':['numbering','indent'],'tr':['numbering','indent'],'table':['numbering','indent'],'row':['numbering','indent'],'list':[]};
			var defaultParent = {'LI':'OL','TD':'TR','SUMMARY':'DETAILS'};
			var ret = {defaultTag:defaultTag,tags:tags,defaultChild:defaultChild,AttributeWhiteList:AttributeWhiteList,type:type,defaultParent:defaultParent};
			var create = createBlot.bind(ret);

			function cleanAttr(blot){
				var ret = {};
				var flag = false
				Object.keys(blot.attr || {}).map(function(key){
					if (blot.attr.range) {
						if (AttributeWhiteList[blot.attr.range].indexOf(key) === -1){ //// remove attributes that are not appropriate to the range type.
							flag = true;
							ret[key] = blot.attr[key];
							delete blot.attr[key];
						}
					} else if (Container.ContainerAttributes.indexOf(key) > -1){ //// remove "indent" and "numbering" attributes if it is no longer a container block.
						flag = true;
						ret[key] = blot.attr[key];
						delete blot.attr[key];
					}
				});
				if (Object.keys(blot.attr || {}).length ===0){
					delete blot.attr;
				}
				if (flag){
					return ret;
				} else {
					return null;
				}
			}

			function createBlock(containerType, attr){
				var tag = Container.childTags[containerType];
				var node = document.createElement(tag);
				//console.log('attr', attr);
				var blot = {'ins':'\n', length:1, type: type, node:node};
				if (Object.keys(attr).length > 0){
					blot[ATTRIBUTES] = attr;
				}
				var keys = Object.keys(attr || {});
				keys.map(function(key){
//					if (AttributeWhiteList[attr.range].indexOf(key) > -1){
//						delete attr[key];
//						node.setAttribute(key, attr[key]);
//					}
				})
				return blot;
			}
			function createBlockNode(containerType) {
				var tag = Container.childTags[containerType] || 'P';
				return document.createElement(tag);
			}

			function parseDOM(DOM){
				return {};
/*				var Attr = {
					"OL":{"range":"list"},
					"UL":{"range":"list","numbering":"bullet"},
					"DL":{"range":"list","numbering":"description"},
					"TR":{"range":"tr"},
					"TABLE":{},
					"DIV":{"range":"text"}
				}
				return Attr[DOM.tagName];*/
			}

			ret["cleanAttr"] = cleanAttr;
			ret['create'] = createBlock;
			ret['createNode'] = createBlockNode;
			ret['parseDOM'] = parseDOM;
			return ret;
		})();

		var EmbedContainer = (function(){
			var defaultTag = 'SOURCECLUSTER';
			var tags = ["REFS","SVG","PICTURE","FIGURE"];
			return {};
		})();


		var Embed = (function(){
			var type = types['EMBED'];
			var defaultTag = 'REF';
			var tags = ['REF','IMG','VIDEO','AUDIO','TRACK','BR'];
			var defaultChild = {'REF':'ref','IMG':'src','VIDEO':'src','AUDIO':'src','TRACK':'src'};
			var AttributeWhiteList = {'REF':[],'IMG':['width'],'VIDEO':[],'AUDIO':[],'TRACK':[]};
			var _tags = {'BR':'BR','br':'BR','img':'IMG','IMG':'IMG','video':'VIDEO','VIDEO':'VIDEO'}
			var create = function createEmbedBlot(text, attr){
				text = text || {}; //// default to newline for now.
				attr = attr || {}; //// need to have a normalized attr object.
				var blot = {'ins':text, length:1, type:type, attr:attr};
				var keys = Object.keys(attr);
				var tag = Object.keys(text)[0];
				if (tag == undefined){
					blot.length = 0;
					return blot;
				}
				var node = document.createElement(_tags[tag]);
				node.setAttribute(defaultChild[tag], text[tag]); //// set "src" or "ref-id";
				keys.map(function(key){ //// non-essential attributes
					if (AttributeWhiteList[tag].indexOf(key) > -1){
						node.setAttribute(key, attr[key]);
					}
				})
				blot.node = node;
				blot.child = createNodeFromAttr(attr, node);
				if (keys.length == 0){ delete blot.attr; } /// remove extraneous attr to make it cleaner.
				return blot;
			}

			function parseDOM (DOM){
				var Attr = {
					"IMG":{"IMG":DOM.getAttribute('src')},
				}
				if (DOM.tagName === "BR"){ //// make sure that this is not a placeholder
					if (DOM.parentElement.firstChild === DOM){
						return null;
					}
				}
				return Attr[DOM.tagName];
			}

			function parseDOMstyle (DOM){
				var ret = {}
				var flag = false
				var items = DOM.getAttributeNames();
				items.map(function(attribute) {
					if (AttributeWhiteList[DOM.tagName].indexOf(attribute) > -1){
						flag = true;
						ret[attribute] = DOM.getAttribute(attribute);
					}
				});
				if (flag){
					return ret;
				}
				return null;
			}


			return {defaultTag:defaultTag,tags:tags,defaultChild:defaultChild,AttributeWhiteList:AttributeWhiteList,create:create,type:type, parseDOM:parseDOM, parseDOMstyle:parseDOMstyle}
		})();

		var Inline = (function(){
			var type = types['INLINE'];
			var defaultTag = 'SPAN';
			var tags = ['B','EM','STRIKE','U','A','DEL','INS','MARK','I',
				"RUBY","RT", //// Ruby annotations
				"CITE","SAMP","KBD","VAR", //// computer code tags
				"SMALL","BIG","DFN", /// Marks the defining instance of a term
				"SUB","SUP",
			];
			var inlineAttributes = [];
			var styleAttributes = ['uppercase'];
			var classAttributes = [];

			var AttributeWhiteList = {'B':[],'EM':[],'STRIKE':[],'U':[],'A':[]};
			var ret = {defaultTag:defaultTag,tags:tags,inlineAttributes:inlineAttributes,styleAttributes:styleAttributes,classAttributes:classAttributes,type:type};
			var create = function createInlineBlot(text, attr){
				if (text.nodeType){
					var textNode = text;
					text = textNode.nodeValue;
				} else if (typeof(text) == "string") {
					var textNode = document.createTextNode(text);
				}
				var blot = {'ins':text, node:textNode, length:text.length, type:type};
				blot.child = createNodeFromAttr(attr, textNode);
				if (attr && (Object.keys(attr).length > 0) ){
					blot['attr'] = attr;
				}
				return blot;
			}

			function parseDOM (DOM){
				var Attr = {
					"B":{"b":true},
					"I":{"i":true},
					"EM":{"i":true},
					"U":{"u":true},
					"STRIKE":{"s":true},
					"S":{"s":true},
					"A":{"href":DOM.getAttribute('href')},
					"MARK":{"mark":true},
					"SUP":{"wup":true},
					"SUB":{"sub":true},
					"SMALL":{"small":true},
					"BIG":{"big":true},
				}
				return Attr[DOM.tagName];
			}

			ret['create'] = create;
			ret['parseDOM'] = parseDOM;
			return ret;
		})();

		function create(type, text, attr){
			if (type==types.CONTAINER){return Container.create(attr);}
			else if (type==types.BLOCK){return Block.create(text,attr);}
			else if (type==types.EMBED){return Embed.create(text,attr);}
			else if (type==types.INLINE){return Inline.create(text,attr);}
		}

		function blotFromDelta (canvas, delta, blot) {
			if (typeof(delta.ins) == "object") {
				return Embed.create(delta.ins, delta.attr);
			}
			if (delta.ins == "\n"){
				if (!blot){ return Container.create(delta.attr); } //// bootstrap
				if (delta.attr && delta.attr.range) {
					return Block.create(delta.attr.range, delta.attr || {});
				}
				var container = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position);
				var block= Block.create(container.attr.range, delta.attr || {});
				return block
			}
			return Inline.create(delta.ins, delta.attr);
		}

		function parseDOM (DOM, blots, context){
			if (blots.length){
				var lastBlot = blots.slice(-1)[0];
				var startIndex = lastBlot.index + lastBlot.length;
			} else {
				var startIndex = 0;
			}
			if (Block.tags.indexOf(DOM.tagName) > -1){ //// BLOCK or CONTAINER ---> check for child CONTAINERs
				var childNodes = Array.from(DOM.childNodes).filter(function(_child){ if (Container.tags.indexOf(_child.tagName) == -1) {return _child} });
				var childContainers = Array.from(DOM.childNodes).filter(function(_child){ if (Container.tags.indexOf(_child.tagName) > -1) {return _child} });
			} else {
				var childNodes = DOM.childNodes;
				var childContainers = [];
			}
			var blot
			if (DOM.nodeType == 3){  //// TextNode
				blot = { 'ins': DOM.nodeValue, 'length':DOM.nodeValue.length, 'index': startIndex, 'node': DOM, 'position':blots.length, 'child':DOM, 'type':Blot.types.INLINE };
				blots.push(blot);
				return blot;
			} else if (Blot.Embed.tags.indexOf(DOM.tagName) > -1){ //// EMBED
				blot = { 'ins':Blot.Embed.parseDOM(DOM), 'length':1, 'index':startIndex, 'node':DOM, 'position':blots.length, 'child':DOM, 'type':Blot.types.EMBED};
				var attr = Blot.Embed.parseDOMstyle(DOM);
				if (blot[INSERT] === null){
					return ; //// do nothing - the DOM object is just a <BR> placeholder.
				}
				if (attr) { blot.attr = attr; }
				blots.push(blot);
				return blot;
			} else if (Blot.Inline.tags.indexOf(DOM.tagName) > -1) { //// INLINE
				var ret = [];
				childNodes.forEach(function(child){
					var childBlot = parseDOM(child, blots, context);
					if ( Array.isArray(childBlot) ){ //// Array to accommodate non-standard HTML - can't assumed its standardized.
						childBlot.map(function(_childBlot){
							ret.push(_childBlot);
						})
					} else { //// Object 
						ret.push(childBlot)
					}
				})
				var newAttr = Inline.parseDOM(DOM)
				ret.map(function(childBlot){
					childBlot.child = DOM;
					childBlot["attr"] = Delta.Attr.mergeAttr(newAttr, (childBlot.attr || {}) );
				})
				return ret;
			} else if (Blot.Block.tags.indexOf(DOM.tagName) > -1) { //// BLOCK
				var ret = [];
				childNodes.forEach(function(child){
					parseDOM(child, blots, context);
				})
				blot = { 'ins': '\n', 'length':1, 'index': startIndex, 'node': DOM, "type":Blot.types.BLOCK, "position":blots.length };
				var attr = Block.parseDOM(DOM);
				if (Object.keys(attr).length){
					blot["attr"] = attr;
				}
				blots.push(blot);
				if (childContainers.length){
					blot.type = Container.type;
					if ( ["LI","TD"].indexOf(DOM.tagName) > -1 ) {
						blot.parent = DOM.parentElement;
						blot.attr = Delta.Attr.mergeAttr(Container.parseDOM(DOM.parentElement), blot.attr);
						if (context.indent > 0){ //// if Indent is greater than 0, 
							blot.attr.indent = context.indent;
						}
					}
				}
				childContainers.forEach(function(child){
					parseDOM(child, blots, context);
				})
				return blots
			} else if (Blot.Container.tags.indexOf(DOM.tagName) > -1){ //// CONTAINER
				context['NonTextRanges'] = true;
				if (blots.length){ 
					var precedingBlock = blots.slice(-1)[0]
					if (precedingBlock.type === Block.type){ ///// HANDLES when "text" RANGE ends
						precedingBlock.type = Container.type;
						precedingBlock[ATTRIBUTES] = precedingBlock[ATTRIBUTES] || {};
						precedingBlock[ATTRIBUTES]["range"] = "text";
					}
				}
				var _context = safeClone(context);
				if ( ["OL","UL","DL"].indexOf(DOM.tagName) > -1){
					_context.indent = context.indent+1;
				} else {
					context.indent = -1; _context.indent = -1;
				}
				childNodes.forEach(function(child){
					blots = parseDOM(child, blots, _context);
				})
				var lastBlot = blots.slice(-1)[0];
				if (lastBlot.type != Container.type) {
					lastBlot.type = Container.type;
					lastBlot.attr = Container.parseDOM(DOM);
					lastBlot.parent = DOM;
					if (_context.indent > 0){ ///// if Indent is greater than 0.
						lastBlot.attr.indent = _context.indent;
					}
				}
				return blots;
			}  else {
				return;
			}
		}
		function blotsFromDOM (canvas){
			canvas.normalize(); //// tells browser to normalize elements on Canvas Element
			var blots = []
			var context = {'indent':-1, 'NonTextRanges':false}
			canvas.childNodes.forEach(function(child){
				blots = parseDOM(child, blots, context);
			});
			var index = 0;
			blots.map(function(blot, pos){
				blot.index = index;
				index = index + blot.length;
				blot.position = pos;
			});
			var lastBlot = blots.slice(-1)[0]; //// if document ends with 'text' range, ensure that appropriate 'range' attr is set.
			if (!Delta.Attr.getAttr(lastBlot)[RANGE]){
//				if (context['NonTextRanges'] === true){ //// OPTION: TODO: if document only has 1 text range, we might skip the last 'range' attribute for compatability reasons with quill.js.
					lastBlot.attr = lastBlot.attr || {};
					lastBlot.attr[RANGE] = 'text'; 
					lastBlot.type = Blot.Container.type; //// make blot CONTAINER type. 	
//				}
			}

			return blots;
		}

		return {types:types,Container:Container,Block:Block,Embed:Embed,Inline:Inline,create:create, blotFromDelta:blotFromDelta, createNodeFromAttr:createNodeFromAttr, blotsFromDOM:blotsFromDOM}
	})();

	var Parchment = (function(){
		//// Parchment is a representation of a Document state as an array of blots.
		//// The Parchment Module presents methods that pertain to navigating or directly modifying the parchment array.

		function init (canvas) {
			canvas[EDITOR][PARCHMENT] = [];
		}

		function getPreviousBlot (blots, position){
			if (position > 0){
				return blots[position-1];
			}
			return null; //// no previous blots
		}

		function insertBlot (blots, blot, position){
			blots.splice(position, 0, blot);
			blot.position = position;
			if (blot.type === Blot.types.INLINE){ ///// All other blot types have a length of 1.
				blot.length = blot.ins.length;
			}
			if (position > 0){
				var prevBlot = blots[position-1];
				blot.index = prevBlot.index + prevBlot.length;
			} else {
				blot.index = 0;
			}
			if (position < blots.length -1){
				var nextBlot = blots[position+1];
				nextBlot.position = position+1;
				nextBlot.index = blot.index+blot.length;
			} 
		}

		function mergeBlot (blots, blot1, blot2) {
			if (blot1) {
				if (blot2) {
					if (blot1.type + blot2.type === 2){
						if (Delta.Attr.check_attr_equality(blot1.attr, blot2.attr) ) {
							if (blot1.child.nextSibling == blot2.child){
								if (blot2.child){
									blot2.child.remove()
								} else {
									blot2.node.remove();
								}
								blot1.node.replaceData(blot1.node.length, 0, blot2.node.nodeValue);
								blot1.ins = blot1.node.nodeValue;
								blot1.length = blot1.ins.length;
								blots.splice(blot2.position, 1);
								return blot1;
							}
						}
					}
				}
			}
			return null

//			if ((blot2) && Delta.Attr.check_attr_equality(blot1.attr, blot2.attr) && (blot2.type + blot1.type === 2) && (blot2.child.nextSibling == blot1.child)){
//			} else {return null}
/*			if (blot1.node.nodeType == 3) {
				if (blot2.child){
					blot2.child.remove()
				} else {
					blot2.node.remove();
				}
				blot1.node.replaceData(blot1.node.length, 0, blot2.node.nodeValue);
				blot1.ins = blot1.node.nodeValue;
				blot1.length = blot1.ins.length;
				blots.splice(blot2.position, 1);
				return blot1;
			} else {
				return null;
			}*/
		}

		function getNextInlineBlot (blots, position) {
			for (var i = position; i < blots.length; i++) {
				var blot = blots[i];
//				blot.position = i; //// insertBlot() relies on applyDelta() to fix blot position. Uncomment this if we need blot.position to be accurate before applyDelta().
				if (blot.type < Blot.types.BLOCK){
					return blot;
				}
			}
			return null; //// no subsequent inline blots
		}

		function getPreviousInlineBlot(blots, position){
			for (var i = position; i >= 0; i--) {
				var blot = blots[i];
				if (blot.type < Blot.types.BLOCK){
					return blot;
				}
			}
			return null; //// no previous inline blots
		}

		function getChildInlineBlot (blots, position){
			if (position > 0){
				var blot = blots[position-1];
				if (blot.type < Blot.types.BLOCK){
					return blot;
				}
			}
			return null; //// Block Blot has no child blots.
		}

		function getNextBlockBlot (blots, position){ ///// TODO: CURRENTLY UNUSED.
			for (var i = position; i < blots.length; i++) {
				var blot = blots[i];
//				blot.position = i; //// insertBlot() relies on applyDelta() to fix blot position. Uncomment this if we need blot.position to be accurate before applyDelta().
				if (blot.type == Blot.types.BLOCK){
					return blot;
				} else if (blot.type == Blot.types.CONTAINER) { /// there are no following blocks in container
					return null;
				}
			}
			return null;
		}

		function getNextBlockOrContainerBlot (blots, position) {
			for (var i = position; i < blots.length; i++) {
				var blot = blots[i];
//				blot.position = i; //// insertBlot() relies on applyDelta() to fix blot position. Uncomment this if we need blot.position to be accurate before applyDelta().
				if (blot.type >= Blot.types.BLOCK){
					return blot;
				}
			}
			return null;
		}

		function getPreviousBlockOrContainerBlot (blots, position) { ///// Used by Range.
			for (var i = position; i >= 0; i--) {
				var blot = blots[i];
				if (blot.type >= Blot.types.BLOCK){
					return blot;
				}
			}
			return null;
		}

		function getPreviousBlockBlot (blots, position){
			for (var i = position; i >= 0; i--) {
				var blot = blots[i];
				if (blot.ins == '\n'){
					if (blot.type == Blot.types.CONTAINER) { /// there are no more blocks in current container
						return null;
					}
					return blot;
				}
			}
			return null;
		}

		function getContainerBlot (blots, position){
			for (var i = position, len = blots.length; i < len; i++) {
				blots[i].position = i; ///// updates position for blots --> required for Transform.Blot.insertBlockBlot(), since it is called recursively.
				if (blots[i].type == Blot.types.CONTAINER){
					return blots[i];
				}
			}
			return null;
		}

		function getPreviousContainerBlot(blots, position){
			for (var i = position; i >= 0 ; i--) {
				blots[i].position = i; ///// updates position for blots --> required for Transform.Blot.insertBlockBlot(), since it is called recursively.
				if (blots[i].type == Blot.types.CONTAINER){
					return blots[i];
				}
			}
			return null;
		}

	return {init:init, getNextBlockBlot:getNextBlockBlot, getNextBlockOrContainerBlot:getNextBlockOrContainerBlot, getContainerBlot:getContainerBlot, getPreviousBlockBlot:getPreviousBlockBlot, getPreviousContainerBlot:getPreviousContainerBlot, getPreviousBlockOrContainerBlot:getPreviousBlockOrContainerBlot, insertBlot:insertBlot, mergeBlot:mergeBlot, getNextInlineBlot:getNextInlineBlot, getPreviousInlineBlot:getPreviousInlineBlot, getPreviousBlot:getPreviousBlot, getChildInlineBlot:getChildInlineBlot, getPreviousInlineBlot:getPreviousInlineBlot};
	})()

	var Transform = (function(){
		//// The Transform module is the skunkworks of implementing actual editor behavior from delta operations.
		//// There are 3 submodules, pertaining to the 3 levels of tranformation.
		//// * Delta - Loops through parchment blots, & calls appropriate INSERT, DELETE, or RETAIN method for the blot's type. One of my favorite design features of Quill.Parchment.Deltas is that there is no co-dependency between delta operations. You don't need to peek ahead or look back for context - each operaton is self-contained.
		//// * Blot - Fundamental blot transformations. Operates on top of Parchment module. It directly touches DOM nodes, but also relies on DOM module
		//// * DOM - provides important convenience methods for navigating & modify canvas DOM nodes.


		//// Other Modules:
		//// * Normalize - This is the one place where we do in fact "look back" to ensure that Lists and Tables are formatted properly, and that Lists have proper indentation. Also make sure that equivalent Inline blots are merged.

		//// Developer Note: It is easy to confuse Transform.Delta() with normal Delta(), and confuse Transform.Blot() with normal Blot(). Be aware of your scope! 

		var _Delta = (function(){
			///// flags for whether operation occurs at the HEAD, MIDDLE, or TAIL of blot node.
			var HEAD = 1;
			var MIDDLE = 2;
			var TAIL = 3;

			function applyDelta (canvas, blot, delta, context){
				if (delta[RETAIN]){ /////// 1. RETAIN ///////////
					if (!delta.attr) {
						return 
					}
					var blotLength = blot.length;
					var newFormatting = Delta.Attr.mergeAttr(delta.attr, blot.attr);
					if (blot.type < Blot.types.BLOCK) {
						if (context.start > 0) {
							Transform.Blot.splitInlineBlot(canvas, blot, context.start, blot.attr, blot.attr);
						} else if (context.end < blot.length) {
							Transform.Blot.splitInlineBlot(canvas, blot, context.end, delta.attr, blot.attr);
							Transform.Blot.replaceInlineBlot(canvas, blot, newFormatting);
						} else {
							Transform.Blot.replaceInlineBlot(canvas, blot, delta.attr);
						}
					} else if (blot.type >= Blot.types.BLOCK) {
						_Blot.applyFormattingToBlockBlot(canvas, blot, delta);
						///// TODO: remove unneeded attributes like 'indent' and 'numbering', and pass back to applyDeltas() for correcting history.
						Blot.Block.cleanAttr(blot);
					}
				} else if (delta.ins) { /////// 2. INSERT //////////
					var newBlot = Blot.blotFromDelta(canvas, delta, blot);
					if (!blot) { //// bootstrap
						Parchment.insertBlot(canvas[EDITOR].blots, newBlot, canvas[EDITOR].blots.length);
						if (newBlot.parent) {
							canvas.appendChild(newBlot.parent); /// for most containers
						} else {
							canvas.appendChild(newBlot.node); /// for text paragraphs
						}
						newBlot.node.appendChild(document.createElement("BR")); //// bug fix for test Deltas30. Bootstrapped blocks did not have <br> placeholder.
						return;
					}
					if (blot.type >= Blot.types.BLOCK) { //// 2.1. insert into BLOCK or CONTAINER
						if ( (newBlot.type === Blot.types.CONTAINER) || (newBlot.attr && newBlot.attr.range ) ) { //// 2.1.1. insert CONTAINER. ('can't rely on type, because blotFromDelta never sets CONTAINER TYPE.)
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
							Transform.Blot.insertBlockBlot(canvas, newBlot);
							_Blot.applyFormattingToBlockBlot(canvas, newBlot, delta);
							return Normalize.normalizeContainerBlot(canvas, newBlot)
						} else if (newBlot.type == Blot.types.BLOCK){  //// 2.1.2. insert BLOCK
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
							Transform.Blot.insertBlockBlot(canvas, newBlot);
						} else if ((newBlot.type < Blot.types.BLOCK) && (blot.type >= Blot.types.BLOCK) ){ // 2.1.1. insert Inline or Embed.
							var lastChild = DOM.getLastChild(blot.node);
							if (lastChild === null) {
								if (blot.node.lastChild){ //// if there is a placeholder <BR> tag, remove it.
									blot.node.lastChild.remove();
								}
							} else if (Blot.Container.tags.indexOf(lastChild.tagName) === -1) { //// This logic indirectly assures inline & embed elements are inserted before nested list containers.
								lastChild = null; 
							} else if (blot.node.firstChild.tagName === "BR") { /// there is a child list, but there might still be a placeholder <br> element
								blot.node.firstChild.remove(); //// if there is a placeholder <BR> tag, remove it. 
							}
							blot.node.insertBefore(newBlot.child, lastChild);
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
						}
					} else if (delta.ins === "\n") { /// insert BLOCK or CONTAINER into INLINE or EMBED
						if ((blot.child.previousSibling === null) && (context.position == HEAD) ){ //// insert occurs at beginning of first INLINE element of a parent BLOCK.
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
						} else { //// insert occurs in middle or tail of parent BLOCK. must split & attach child elements accordingly.
							if (context.position == HEAD) {
								Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
								DOM.attachPreviousSibs(newBlot.node, blot.child.previousSibling);
							} else if (context.position == MIDDLE){
								var next = Transform.Blot.splitInlineBlot(canvas, blot, context.start, blot.attr, blot.attr)[1];
								Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position + 1);
								DOM.attachPreviousSibs(newBlot.node, blot.child);
							} else if (context.position == TAIL) { //// should not encounter this condition -->
								if (!blot.child.nextSibling) { /// There is no next sibling --> operation will remove all elements --> add <BR> placeholder
									blot.child.parentElement.appendChild( document.createElement("BR") );
								}
								Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position + 1);
								DOM.attachPreviousSibs(newBlot.node, blot.child);
							}
						}
						if (newBlot.attr && newBlot.attr.range) {
							Transform.Blot.insertBlockBlot(canvas, newBlot);
							_Blot.applyFormattingToBlockBlot(canvas, newBlot, delta);
							return Normalize.normalizeContainerBlot(canvas, newBlot);
						} else if (newBlot.type === Blot.types.BLOCK) { //// attach new BLOCK or CONTAINER to canvas DOM.
							Transform.Blot.insertBlockBlot(canvas, newBlot);
						}
					} else { //// 2.2. insert INLINE or EMBED into INLINE or EMBED
		/*				if (Delta.Attr.check_attr_equality(blot.attr, newBlot.attr) ) { ///// <--- possible optimizing, but requires changes to applyDeltas().
							console.log(context);
							blot.node.replaceData(context.start, 0, newBlot.node.nodeValue);
							blot.ins = blot.node.textContent;
							blot.length = blot.ins.length;
						} else*/
						if (context.position === HEAD){
							blot.child.parentElement.insertBefore(newBlot.child, blot.child);
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position);
						} else if (context.position === TAIL){
							blot.child.parentElement.insertBefore(newBlot.child, blot.child.nextSibling);
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position+1);
						} else {
							Transform.Blot.splitInlineBlot(canvas, blot, context.start, blot.attr, blot.attr);
							blot.child.parentElement.insertBefore((newBlot.child || newBlot.node), blot.child.nextSibling);
							Parchment.insertBlot(canvas[EDITOR].blots, newBlot, blot.position+1);
						}

					}
				} else if (delta[DELETE]) {//////// 3. DELETE //////////
					if (blot.type < Blot.types.BLOCK) {
						if (context.position === HEAD) {
							if (context.end < blot.length) {
								Transform.Blot.splitInlineBlot(canvas, blot, context.end, blot.attr, blot.attr);
							}
							var parent = blot.child.parentElement;
							blot.child.remove();
							blot.length = 0; //// safest way to remove blots
							if (parent.firstChild == null){ //// no inline elements or subcontainers
//								if (canvas[EDITOR].blots[blot.position+1].node == parent){
									parent.appendChild( document.createElement('BR') ); //// if no child elements, add placeholder to make it display properly in DOM
//								}
							}
//							if ( (canvas[EDITOR].blots[blot.position+1].type >= 4) && (canvas[EDITOR].blots[Math.max(blot.position-1, 0)].type >= 4) ){
//								parent.appendChild( document.createElement('BR') ); //// if no child elements, add placeholder to make it display properly in DOM
//							}
						} else if (context.position === TAIL) {
							//// do nothing
						} else {
							Transform.Blot.splitInlineBlot(canvas, blot, context.start, blot.attr, blot.attr);
						}
					} else if (blot.type >= Blot.types.BLOCK) {
						Transform.Blot.removeBlockBlot(canvas, blot);
//							console.log(Transform.DOM.removeEmptyNodesByChild)
//							Transform.DOM.removeEmptyNodesByChild(blot.node);
						blot.length = 0;
					}
				}
			}

			function applyDeltas (canvas, deltas){
				deltas = Delta.splitNewLineDeltas( safeClone(deltas) );
				var history = [];
				var deltaIndex = 0; 
				var counter = 0;
				for (var i = 0; i < canvas[EDITOR].blots.length; i++) { //// INSERT DELTAS
					counter ++
					if (counter == 180){console.log(canvas[EDITOR].blots, deltas);die;}
					var blot = canvas[EDITOR].blots[i];
					blot.position = i;
					if (i > 0) {
						var prevBlot = canvas[EDITOR].blots[i-1];
						blot.index = prevBlot.index + prevBlot.length;
					} else {
						blot.index = 0;
					}
					for (var j = 0; j < deltas.length; j){
						var delta = deltas[0];
						var lowerBound = blot.index; 
						var upperBound = lowerBound + blot.length;
						var deltaLength = (delta[RETAIN] || delta[DELETE] || 0);
						var start = Math.max(deltaIndex - lowerBound, 0); /// can't be less than 0.
						var end = start + deltaLength;
						if (deltaIndex > upperBound) {
							break; /// breaks deltas loop; inspect next blot with same delta.
						} // else if (lowerBound > (deltaIndex + deltaLength)){
		//					deltas.shift();
		//					continue; //// next delta with same blot.
		//				}

						/////// Get short descriptors of delta position ////////////
						var contained; ///// whether delta operation will be completed on this blot.
						var position; ///// whether delta operation begins on head, tail, or middle of the blot.

						if (upperBound >= deltaIndex + deltaLength){ ///// see if delta operation will be completed on this blot. Important for 'retain' and 'delete'.
							contained = true;
						} else {
							contained = false;
						}
						if (lowerBound == deltaIndex){ ///// see if delta operation begins on head, tail, or middle of the blot.
							position = HEAD;
						} else if (upperBound == deltaIndex){
							position = TAIL;
						} else if ( (lowerBound < deltaIndex) && (upperBound > deltaIndex) ){ ///// probably don't need to test this --> logically required;
							position = MIDDLE;
						}

						////// Should we go to the next blot ///////
						if (position === TAIL){
							if (delta[DELETE] || delta[RETAIN]){
								break; //// go to next blot for range operations.
							} else { // delta.ins
								if ( (blot.type === Blot.types.CONTAINER) && (position === TAIL) ){/// Insert at end of document --> must go to deltas.reverse(), but don't shift this delta.
									break;
								}
								var nextBlot = canvas[EDITOR].blots[blot.position+1];
								if (nextBlot){
									if (delta.node && nextBlot.child){ //// canvas may insert focusNode as 'node' into deltas for help with dead elements from change-tracking.
										if (delta.node.nextSibling == nextBlot.child){
											break; //// canvas focus is actually on next blot --> go to next blot.
										}
									} else if ( (nextBlot.type < Blot.types.EMBED) && Delta.Attr.check_attr_equality(delta.attr, nextBlot.attr) ) {
										break; //// next blot has same formatting --> simpler operation by going to next blot;
									} else if (blot.ins == '\n'){
										break; //// if current blot is block, go to next. Insert is probably text for next block element.
									}
								}
//								i++; //// if there is an insert operation, increment blots loop counter.
							}
						}

						//// create undo history
						if (delta[INSERT]) {
							history.push( Delta.createDelta(DELETE, (delta[INSERT].length || 1) ) );
						} else if (position === HEAD){
							if (delta[DELETE]){
								if (blot.position === canvas[EDITOR].blots.length-1){ //// Don't Delete last BLOCK element if it has valid inline elements. /// Test #33.
									var childBlot = Parchment.getChildInlineBlot(canvas[EDITOR].blots, blot.position)
									if (childBlot !== null){
										break;
									}
								}
								if (typeof(blot[INSERT]) === 'string') {
									history.push( Delta.createDelta(INSERT, blot[INSERT].substr(start, end), blot.attr ) );
								} else { //// embed object
									history.push( Delta.createDelta(INSERT, safeClone(blot[INSERT]), blot.attr ) );
								}
							} else if (delta[RETAIN]) {
								if (!delta.hasOwnProperty(ATTRIBUTES) ){ //// if no formatting --> speed things up. (See a few lines below...)
									history.push( Delta.createDelta(RETAIN, (end-start) ) );
								} else { //// create retain for each segment.
									history.push( Delta.createDelta(RETAIN, (Math.min(end, blot.length) - start), Delta.Attr.diffAttr(blot[ATTRIBUTES], delta[ATTRIBUTES]) ) );
								}
							}
						}
						var correction = applyDelta(canvas, blot, delta, {contained:contained, position:position, index:i, start:start, end:end} );
						if (correction){ //// Needed for ContainerBlotNormalization();
							console.log("correction", correction);
							history = Delta.mergeDeltas(history, correction)[0];
						}

						counter ++;				
						if (counter == 250){console.log(canvas[EDITOR].blots, deltas, contained, start, end, deltaIndex);die};
						/////// update indices & offset. f//////

						if (delta[DELETE]){
							if (position === HEAD){ //// delete only operates when position === HEAD
								delta[DELETE] = delta[DELETE] - (upperBound-lowerBound);
								if (delta[DELETE] <= 0){
									deltas.shift();
									break;
								}
							}
						}

						if (delta[RETAIN]) {
							if (!delta.hasOwnProperty(ATTRIBUTES) ){ //// No formatting --> speed things up
								if (position === MIDDLE) {break;}
								deltaIndex = deltaIndex + delta[RETAIN];
								deltas.shift();
							} else if (position === MIDDLE) {
								//// pass --> just how retain works. It split the blot, and expects to transform the second half on the next cycle
							} else {
								deltaIndex = deltaIndex + Math.min(blot.length, delta[RETAIN] )
								if (position === HEAD) {
									delta[RETAIN] = delta[RETAIN] - blot.length;
								}
								if (delta[RETAIN] <= 0){deltas.shift()} 
							}
						} else if (delta.ins) {
							deltaIndex = deltaIndex + (delta.ins.length || 1); //// the 'or 1' is essential for deltas of embedded blots.
							deltas.shift();
						} else if (delta[DELETE] > 0) {
							break; //// go to next blot
						} else { //// if 'retain', 'del', (or 'ins') are set to 0 --> it will crash canvas without this test.
							deltas.shift();
						}
					}
		
					/////// normalize blots ///////
					if (blot.length == 0){
						(blot.child || blot.node).remove();
						canvas[EDITOR].blots.splice(i, 1);
						i--; /// must decrement to account for missing blot.
					} else if (blot.type === Blot.types.CONTAINER) {
						var correction = Normalize.normalizeContainerBlot(canvas, blot);
						if (correction){ //// Needed for ContainerBlotNormalization();
							history = Delta.mergeDeltas(history, correction)[0];
						}
					} else {
						var didMerge = Parchment.mergeBlot(canvas[EDITOR].blots, prevBlot, blot); 
						if (didMerge){//// mergeBlot does tests whether blots are appropriate for merging. If merge happend, it spliced one blot from array. Decrement counter.
							i--;
						} 
					}
				}
				
				if (deltas.length) { //// APPEND DELTAS
					/// If there are remaining deltas, they are inserted outside the range of the existing document.
					///// SETUP INITIAL VARIABLES
					var length = canvas[EDITOR].blots.length;
					var historyLength = history.length;
					if (length > 0){
						var prev = canvas[EDITOR].blots[length-1]
						var firstIndex = prev.index + prev.length;
					} else {
						var firstIndex  = 0;
					}

					///// APPLY DELTAS IN REVERSE ORDER
					deltas.reverse().map(function(delta, index){ //// we do last deltas first, because parents are listed after children in parchment.
						if (!delta.ins) {
							//// we allow deletion in 1 specific situation - when last BLOCK is deleted, but a new block is inserted afterward to replace it.
							if ( delta[DELETE] > 0 ){
								if ((index === deltas.length -1) && (index !== 0) ){ //// If index > 0, we have a guarantee that there is now a new BLOCK in the document after the current BLOCK blot, so it is safe to delete this BLOCK blot.
									history.splice(historyLength, 0, Delta.createDelta(INSERT, blot[INSERT], blot.attr ) ); //// add it to UNDO history at the proper position. // Test 34 Undos.
									var correction = applyDelta(canvas, canvas[EDITOR].blots[length-1], delta, {contained:contained, position:HEAD, index:lastIndex} );
									if (correction){ //// Needed for ContainerBlotNormalization();
										history = Delta.mergeDeltas(history, correction)[0];
									}
									canvas[EDITOR].blots.splice(length-1, 1); //// remove deleted BLOCK blot.
									canvas[EDITOR].blots[length-1].position--; //// decrement the blot position --> essential for accurate mergeBlot(); /// Test 34 Undos
									var isMerged = Parchment.mergeBlot(canvas[EDITOR].blots, canvas[EDITOR].blots[length-2], canvas[EDITOR].blots[length-1]);//// merge identical inline elements. Test #34.
									if (isMerged){
										length--;/// The loop to normalize Blots depends on this value --> update it since we may have removed an original blot from document.
									}
									var correction = Normalize.normalizeContainerBlot(canvas, Parchment.getContainerBlot(canvas[EDITOR].blots, length-2)); //// we might be deleting a Container Blot --> so we have to normalize the containers in the document.
									if (correction){ //// Needed for ContainerBlotNormalization();
										history = Delta.mergeDeltas(history, correction)[0];
									}
									length--; /// The loop to normalize Blots depends on this value --> update it since we definitely removed one original blot from document.
									firstIndex = canvas[EDITOR].blots[length-1].index + canvas[EDITOR].blots[length-1].length; // update the initial index since we are starting from a different blot.
								}
							}
							return; 
							throw ("Error, Invalid parchment delta. canvas expected insert-transformation, because the operation exceeds the bounds of the document.");
						}
						if (index === 0){ ///// bootstrap first delta
							if (delta.ins !== "\n"){ ///// if not block or container --> throw error --> can insert inline or embed without block.
								console.log(delta, canvas[EDITOR].blots); //die;
								throw ("Error, Invalid parchment delta"); 
							}
							var lastBlot = canvas[EDITOR].blots[length];
							if (lastBlot) {	var lastIndex = lastBlot.index + lastBlot.length; } else { var lastIndex = 0; }
							var correction = applyDelta(canvas, null, delta, {contained:contained, position:HEAD, index:lastIndex} );
							if (correction){ //// Needed for ContainerBlotNormalization();
								history = Delta.mergeDeltas(history, correction)[0];
							}
						} else {
							var lastBlot = canvas[EDITOR].blots[length];
							var lastIndex = lastBlot.index + lastBlot.length;
							var correction = applyDelta(canvas, canvas[EDITOR].blots[length], delta, {contained:contained, position:HEAD, index:lastIndex} );
							if (correction){ //// Needed for ContainerBlotNormalization();
								history = Delta.mergeDeltas(history, correction)[0];
							}
							Parchment.mergeBlot(canvas[EDITOR].blots, canvas[EDITOR].blots[length], canvas[EDITOR].blots[length+1]);//// merge identical inline elements. Test #34.
						}
						history.push( Delta.createDelta(DELETE, (delta[INSERT].length || 1) ) );
					})

					///// NORMALIZE BLOTS
					canvas[EDITOR].blots.slice(length).reduce( function(editorIndex, blot, PosIndex) {
						blot.position = length + PosIndex;
						blot.index = editorIndex;
						if (blot.type === Blot.types.CONTAINER) {
							var correction = Normalize.normalizeContainerBlot(canvas, blot);
							if (correction){ //// Needed for ContainerBlotNormalization();
								history = Delta.mergeDeltas(history, correction)[0];
							}
						}
						return editorIndex + blot.length;
					}, firstIndex )
				}
				return Delta.normalizeDeltas(history);
			};

			return {applyDelta:applyDelta,applyDeltas:applyDeltas}

		})();

		var DOM = (function(){
			function attachFollowingSibs (parent, node) {
				var nextSib = node.nextSibling;
				parent.appendChild(node);
				if (nextSib){
					attachFollowingSibs(parent, nextSib);
				}
			};

			function attachPreviousSibs (parent, node) {
				var prevSib = node.previousSibling;
				parent.insertBefore(node, parent.firstChild)
				if (prevSib){
					attachPreviousSibs(parent, prevSib);
				}
			};

			function getInlineParent (textNode){ /// gets highest level inline element.
				if (textNode.parentElement){
					if (Blot.Block.tags.indexOf(textNode.parentElement.tagName) > -1){
						return textNode;
					}
					return getInlineParent(textNode.parentElement);
				}
				return textNode;
			};

			function getParentElements (canvas, element){
				var nodes = [];
				function ascend_tree(element, counter){
					if (element !== canvas) {
						nodes.splice(0, 0, element);
						return ascend_tree(element.parentElement, counter);
					} else {

					}
				}
				ascend_tree(element, 0);
				return nodes;
			}

			function getParentContainers(element){
				var nodes = [];
				function ascend_tree(element){
////					if (element.parentNode === null){ return } //// Sometimes list elements get detached from the canvas. It's OK to bring them home.
					if (element.parentNode === null){ console.log(element, element.textContent, nodes); }
					var index = ['OL','UL','LI'].indexOf(element.parentNode.tagName)
					if (index == -1){
						return ;
					} else if (index==2) {
						ascend_tree(element.parentNode);
					} else {
						nodes.splice(0,0, element.parentNode);
						ascend_tree(element.parentNode);
					}
				}
				ascend_tree(element);
				return nodes;
			}

			function getLastChild (node){ //// easy method when we don't want the trailing <br> tag that most browsers insert in a content-editable block element.
				if (!node.lastChild){
					return null
				}
				if (node.lastChild.tagName === "BR"){ //// 
					return node.lastChild.previousSibling;
				}
				return node.lastChild;
			}

			function removeEmptyNodes (node){
				var last = DOM.getLastChild(node);
				if (last) {
					if ( ['TBODY','TABLE','TR'].indexOf(last.tagName) > -1) { //// TABLE
						var ret = removeEmptyNodes(last);
						if (!ret) {
							node.remove();
							return null;
						}
					} else if ( (['OL','UL','LI', 'P'].indexOf(last.tagName) > -1) && (node.childNodes.length == 1) ) { //// LIST & PARAGRAPH
						var ret = removeEmptyNodes(last);
						if (!ret) {
							node.remove();
							return null;
						}
					}
				} else {
					node.remove();
					return null;
				}
				return node;
			}

			function removeEmptyNodesByChild(node) {
				if (!node){
					return 
				}
				if (DOM.getLastChild(node) === null) {
					var parent = node.parentElement;
					node.remove();
					removeEmptyNodesByChild(parent);
				}
			}

			return {attachFollowingSibs:attachFollowingSibs, attachPreviousSibs:attachPreviousSibs, getInlineParent:getInlineParent, getParentElements:getParentElements, getParentContainers:getParentContainers, getLastChild:getLastChild, removeEmptyNodes:removeEmptyNodes, removeEmptyNodesByChild:removeEmptyNodesByChild};
		})()

		var _Blot = (function(){

			function splitInlineBlot (canvas, blot, index, attr1, attr2){
				var currentElement = DOM.getInlineParent(blot.node);
				var blockElement = currentElement.parentElement;
				var nextSib = currentElement.nextSibling;
				var nextText = blot.node.splitText(index);
				var nextBlot = Blot.create(blot.type, nextText, attr2);

				blot.child= Blot.createNodeFromAttr(attr1, blot.node);
				if (attr1){
					blot.attr = Delta.Attr.mergeAttr(attr1, {}); ////normalize attr
				}
				if (currentElement.nodeType != 3){ //// remove node if it is not a text node
					currentElement.remove();
				}
				blot.ins = blot.node.nodeValue;
				blot.length = blot.ins.length;
				blockElement.insertBefore(blot.child, nextSib);
				blockElement.insertBefore(nextBlot.child, nextSib);
				Parchment.insertBlot(canvas[EDITOR].blots, nextBlot, blot.position+1);
				return [blot, nextBlot];
			}

			function replaceInlineBlot (canvas, blot, newAttr){ //// intended for formatting operations.
				var old = DOM.getInlineParent(blot.node); //// get current DOM state.
				var nextSib = old.nextSibling;
				var parentElement = old.parentElement;
				old.remove(); /// sometimes blot.child is the text node. ---> remove oldBlot before creating new blot with same textNode.
				var attrs = Delta.Attr.mergeAttr(newAttr, blot['attr'])
				var newNode = Blot.createNodeFromAttr(attrs, blot.node );
				blot.child = newNode;
				blot.attr = attrs;
				parentElement.insertBefore(newNode, nextSib); //// add new Element to DOM.
				return blot;
			}

			function insertBlockBlot (canvas, newBlot){
				var nextBlockBlot = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, newBlot.position + 1);
				nextBlockBlot.node.parentElement.insertBefore(newBlot.node, nextBlockBlot.node);
				var lastInlineChild = Parchment.getChildInlineBlot(canvas[EDITOR].blots, newBlot.position);
				var counter = 0
				while (lastInlineChild !== null) {
					counter++;
					if (counter == 200){die;}
					newBlot.node.insertBefore(lastInlineChild.child, newBlot.node.firstChild);
					lastInlineChild = Parchment.getChildInlineBlot(canvas[EDITOR].blots, lastInlineChild.position);
				}
				if (!newBlot.node.firstChild) {
					newBlot.node.appendChild( document.createElement('BR') ); //// if no child elements, add placeholder to make it display properly in DOM
				}
//				if (!nextBlockBlot.node.firstChild) { //// unnessecary right now
//					nextBlockBlot.node.appendChild( document.createElement('BR') ); //// if no child elements, add placeholder to make it display properly in DOM
//				}
 
			}

			function replaceBlockBlot (blot, containerTag, attr){
				if (attr) {
					blot.attr = attr;
				}
				var newNode = Blot.Block.createNode( containerTag, blot.attr);
/*				var lastChild = DOM.getLastChild(blot.node);
				if (lastChild){
					DOM.attachPreviousSibs(newNode, lastChild);
				}*/
				if (blot.node.lastChild){
					DOM.attachPreviousSibs(newNode, blot.node.lastChild);
				}
				blot.node.parentElement.insertBefore(newNode, blot.node); ////
				blot.node.remove();
				blot.node = newNode;
				return blot;
			}

			function removeBlockBlot (canvas, blot) {
				var container = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position);
				var nextBlockBlot = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, blot.position + 1);
				if (!nextBlockBlot){ //// this is last blot in canvas.
//					if (canvas[EDITOR].blots.length > 1){
//						console.log('ERROR: Cannot delete last block blot in document.')
//					} else {
//						DOM.removeEmptyNodesByChild(blot.node);
//					}
					blot.node.remove();
					if (canvas.lastChild) { //// If last child was nested list node, it might leave artifacts --> clean them up.
						DOM.removeEmptyNodes(canvas.lastChild);
					}
					return;
				}
				if (blot.type === Blot.types.CONTAINER) {
					removeContainerBlot(canvas, blot);
					DOM.removeEmptyNodesByChild(blot.parent);
				}
				var lastChild = Parchment.getChildInlineBlot(canvas[EDITOR].blots, blot.position); /// Attach all Inline elements to following block.
				if (lastChild){
//					if (nextBlockBlot.node.firstChild == null){console.log(nextBlockBlot)}
					if (nextBlockBlot.node.firstChild && (nextBlockBlot.node.firstChild.tagName == "BR") && (canvas[EDITOR].blots[blot.position+1] !== nextBlockBlot.node.firstChild) ){ //// Normalizing nextBlockBlot if it contains empty placeholder.
						//// only removes placeholder if we know we are appending children from blot.node
						nextBlockBlot.node.firstChild.remove();
					}
					DOM.attachPreviousSibs(nextBlockBlot.node, lastChild.child);
				}
				var childList = DOM.getLastChild(blot.node); //// Attach childList if exists.
				if (childList){
					blot.node.parentElement.insertBefore(childList, blot.node);
				}
				DOM.removeEmptyNodesByChild(blot.node);
			}

			function changeBlockToContainer (canvas, blot, newAttr, _anchor) { //// TODO: FOUND MY BUG
				var container = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position);
				var anchor = _anchor || container.parent;
				if (!anchor){
					var anchor = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position+1).parent;
					if (!anchor){
						var anchor = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, blot.position+1).node;
					}
				}
				var newNode = Blot.Container.createNode( newAttr );
				replaceBlockBlot(blot, newAttr.range, newAttr);
				blot.type = Blot.types.CONTAINER;
				blot.attr = newAttr;
				if (newNode){
					blot.parent = newNode;
					blot.parent.appendChild(blot.node);
					anchor.parentElement.insertBefore(newNode, anchor);
				} else {
					anchor.parentElement.insertBefore(blot.node, anchor);
				}
				attachPreviousBlocks(canvas, blot, blot.node, blot.position);
				return blot;
			}

			function changeContainerToBlock (canvas, blot, newAttr) {
				blot.type = Blot.types.BLOCK;
				blot.attr = newAttr;
				var nextContainer = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position+1);
				if (nextContainer.parent) {
					var anchor = nextContainer.parent.firstChild;
				} else {
					var anchor = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, blot.position+1).node;
				}
				if (Blot.Container.tags.indexOf(blot.node.lastChild.tagName) > -1) { //// If nested HTML list --> pop container.
					blot.node.parentElement.insertBefore(blot.node.lastChild, blot.node);
				}
				attachPreviousBlocks(canvas, nextContainer, anchor, blot.position+1);
				if (blot.parent){
					if (blot.parent.parentElement === null){ 
						/// small optimization. Sometimes, blot.parent is already detached from document. 
						/// removeEmptyNodesByChild() does not check for this condition - because it is a frequently used, recursive method; and this condition only occurs in this function.
						blot.parent.remove();
					} else { //// we can't just remove blot.parent, because blot.parent may have other children in a nested list structure.
						DOM.removeEmptyNodesByChild(blot.parent);
					}
					delete blot.parent; //// normalize blot
				}
				///// TODO: remove container attributes
			}

			function attachPreviousBlocks (canvas, containerBlot, anchorElement, position) {
				//// relies on Parchment to understand which Blocks to attach.
				if (position === undefined){
					position = containerBlot.position;
				}
				var prevBlockBlot = Parchment.getPreviousBlockBlot(canvas[EDITOR].blots, position - 1);
				if (prevBlockBlot == null){
					return;
				}
				var p = prevBlockBlot.node.parentElement;
				replaceBlockBlot(prevBlockBlot, containerBlot.attr.range);//		var newNode = Blot.Block.createNode(containerNode.tagName);
				var newNode = prevBlockBlot.node;
				if (containerBlot.parent) {
					containerBlot.parent.insertBefore(newNode, (anchorElement||containerBlot.parent.firstChild) );
				} else {
					canvas.insertBefore(newNode, anchorElement);
				}
				if (DOM.getLastChild(p) === null) {
					DOM.removeEmptyNodesByChild(p);
				}
				attachPreviousBlocks( canvas, containerBlot, newNode, prevBlockBlot.position);
			}

			function splitContainerBlot (canvas, blot, newAttr){ //// handles list nesting & tables
				var ContainerBlot = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position + 1 );
				var containerNode = ContainerBlot.parent;
				var listType = ContainerBlot.attr[NUMBERING];
				var attr = newAttr || ContainerBlot.attr;
				var oldParent = blot.node.parentElement;

				var node = blot.node;
				var parents = DOM.getParentElements(canvas, node);

				var indent = 0;
				parents.map(function(parent){
					if (Blot.Container.tags.indexOf(parent.tagName) > -1){
						indent ++;
					}
				});
				var topNode = parents[0];
				var nextNode = document.createElement(topNode.tagName);
				topNode.parentElement.insertBefore(nextNode, topNode.nextSibling);
				var lastNode = nextNode;
				for ( var i = 1; i < parents.length; i++ ){
					var tmpNode = parents[i];
					if (Blot.Container.tags.indexOf(tmpNode.parentElement.tagName) > -1) {
						while (tmpNode.nextSibling) {
							lastNode.appendChild(tmpNode.nextSibling);
						}
					}
					if (Blot.Container.tags.indexOf(tmpNode.tagName) > -1) {
						var a = document.createElement(tmpNode.tagName);
						lastNode.insertBefore(a, lastNode.firstChild);
						lastNode = a;
					}
				}
				
				var lastChild = DOM.getLastChild(node);
				if (lastChild && (['UL','OL'].indexOf(lastChild.tagName) > -1) ){

					nextNode.insertBefore(lastChild, nextNode.firstChild);
					Normalize.normalizeListHTML(canvas, Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, blot.position+1) );
				}
				canvas.insertBefore(node, nextNode);
				if (blot.type === Blot.types.BLOCK){
					changeBlockToContainer(canvas, blot, attr, nextNode);
				} else if (blot.type === Blot.types.CONTAINER) {
					blot.parent = blot.node;
					delete blot.attr.indent;
					replaceContainerBlot(canvas, blot, attr, true );
				}
				var nextContainer = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position+1);
				while (nextContainer && (nextContainer.attr[NUMBERING] == listType) ) {
					//console.log('blue', nextContainer.attr[NUMBERING], nextContainer.attr.range, listType)
					nextContainer.parent = nextContainer.node.parentElement;
					nextContainer = Parchment.getContainerBlot(canvas[EDITOR].blots, nextContainer.position+1 );
				}
				//// remove empty containers --> canvas depends on removing these empty nodes.
				DOM.removeEmptyNodesByChild(lastNode); /// TODO: Hack to prevent propogation of empty <TR> elements. Probably something wrong with logic that will be exposed in the right list scenario as well.
				DOM.removeEmptyNodesByChild(oldParent);
				DOM.removeEmptyNodes(nextNode);
				DOM.removeEmptyNodes(topNode);
			}

			function replaceContainerBlot (canvas, blot, newAttr) {
				var oldNode = blot.parent || null;
				var newNode = Blot.Container.createNode( newAttr );
				if (oldNode){
					if (newNode) {
						oldNode.parentElement.insertBefore(newNode, oldNode);
					} else {
						oldNode.parentElement.insertBefore(blot.node, oldNode);
					}
					if (!DOM.getLastChild(oldNode)) {
						oldNode.remove();
					}
				} else if (newNode) {
					blot.node.parentElement.insertBefore(newNode, blot.node.nextSibling);
				}
				replaceBlockBlot(blot, newAttr.range, newAttr);
				if (newNode) {
					blot.parent = newNode;
					blot.parent.appendChild(blot.node);
				} else {
					delete blot.parent;
				}
				attachPreviousBlocks(canvas, blot, blot.node, blot.position);
				return blot;
			}

			function removeContainerBlot (canvas, blot) {
				var nextContainer = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position+1);
				var nextBlockBlot = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, blot.position + 1);
				blot.type = Blot.types.BLOCK;
				if ((nextContainer.parent) && (blot.node === nextContainer.parent.parentElement)) { //// nested lists are a complication we must deal with.
					blot.node.parentElement.insertBefore(nextContainer.parent, blot.node.nextSibling);
				} else {
					attachPreviousBlocks(canvas, nextContainer, nextBlockBlot.node, blot.position);
				}
				if (blot.parent){
					if (!DOM.getLastChild(blot.parent) ){
						blot.parent.remove();
						delete blot.parent;
					}
				}
			}

			function applyFormattingToBlockBlot (canvas, blot, delta) {
				var deltaAttr = Delta.Attr.getAttr(delta);
				var blotAttr = Delta.Attr.getAttr(blot);
				if (deltaAttr[RANGE]){ ///insert or change container type. 
					if ( blot.attr && (delta.attr.range === blot.attr.range) && (blot.type === Blot.types.CONTAINER) ) {
						console.log('NUMBERING code 1')
						if (delta.attr[NUMBERING] != blot.attr[NUMBERING]){
							Transform.Blot.replaceContainerBlot(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr) );
						} else {} /// no structural change. Normalize.normalizeContainerBlot() will handle changed indent levels.
					} 
					else if (blot.parent) {
						Transform.Blot.splitContainerBlot(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr));
						return ;
					} else if (blot.node.parentElement === canvas) {//// not only for <p> elements, but also for <li> & <tr> elements before they have been normalized.
						Transform.Blot.changeBlockToContainer(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr) );
					} else if (blot.node.parentElement !== canvas) {
						Transform.Blot.splitContainerBlot(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr));
					} else if (blot.type === Blot.types.CONTAINER) {
						Transform.Blot.replaceContainerBlot(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr) );
					} else if (blot.type === Blot.types.BLOCK) {
						Transform.Blot.changeBlockToContainer(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr) );
					}
				} else if (blotAttr[RANGE] && (deltaAttr[RANGE] === false)) { /// remove container
					Transform.Blot.changeContainerToBlock(canvas, blot, Delta.Attr.mergeAttr(delta.attr, blot.attr) );
				} 
				if (delta.attr.hasOwnProperty('indent')) {
					if (blot.type === Blot.types.CONTAINER ) { //// INDENT can only apply to Container elements
						blot.attr.indent = delta.attr.indent;
					}
				} else {
	//				console.log('ERROR: BLOCK formatting not supported yet');
				}
			}

			return {splitInlineBlot:splitInlineBlot, replaceInlineBlot:replaceInlineBlot, insertBlockBlot:insertBlockBlot, replaceBlockBlot:replaceBlockBlot, removeBlockBlot:removeBlockBlot, changeBlockToContainer:changeBlockToContainer, changeContainerToBlock:changeContainerToBlock, attachPreviousBlocks:attachPreviousBlocks, splitContainerBlot:splitContainerBlot, replaceContainerBlot:replaceContainerBlot, removeContainerBlot:removeContainerBlot, applyFormattingToBlockBlot:applyFormattingToBlockBlot};
		})();

		var Normalize = (function(){
			function normalizeContainerBlot (canvas, blot) { //// TODO: This causes a bug with undo operations.
				var prevCon = Parchment.getPreviousContainerBlot(canvas[EDITOR].blots, blot.position -1);
				if (blot.parent) {
					if (blot.parent === canvas) { //// TODO: is this still necessary? 1/15/19 YES.
						delete blot.parent; 
					} else if (['UL','OL'].indexOf(blot.parent.tagName) > -1) { //// make lists to be HTML compliant
						normalizeListHTML(canvas, blot, prevCon);
					} else {
						normalizeTableHTML(canvas, blot);
					}
				}
				if (!prevCon){return null}
				if (prevCon.node.parentElement == blot.node.parentElement){
					var undoValue = [{'retain':prevCon.index},{retain:1, 'attr':{'range':prevCon.attr.range}}];
					prevCon.type = Blot.types.BLOCK;
					delete prevCon.attr.range;
					Blot.Block.cleanAttr(prevCon)
					if (prevCon.parent) {
						delete prevCon.parent
					}
					return undoValue; ////
				}
				return null
			}

			ListUtility = (function() {
				function checkListItemPlaceHolder(childList){ ///// make sure that list items with child lists have placeholder <BR> elements if they need it.
					var listItem = childList.parentElement;
					if (listItem.tagName === "LI") {
						if (childList.previousSibling === null) {
							listItem.insertBefore( document.createElement("BR"), childList);
						}
					}
				}

				function checkPlaceHolders (listContainer, num) { /// a placeholder is any <OL> or <UL> tag that is directly nested in another <OL> or <UL> tag (instead of nesting inside <LI>).
					if (['OL','UL'].indexOf(listContainer.parentElement.tagName) > -1){
						if (num) {
							return checkPlaceHolders(listContainer.parentElement, num-1);
						}
						return null; /// too many placeholders.
					} else if ('LI' === listContainer.parentElement.tagName){

					}
					if (num) {
						return null; /// too few placeholders.
					};
					checkListItemPlaceHolder(listContainer); /// small normalization.
					return listContainer; /// Goldilocks.
				}

				function clearPlaceHolders(listContainer){
					var ph = listContainer.parentElement;
					if (['OL','UL'].indexOf(ph) > -1){ /// if placeholder ...
						ph.parentElement.insertBefore(listContainer, ph);
						if (!DOM.getLastChild(ph)){
							ph.remove() // remove placeholder if empty
						}
						clearPlaceHolders(listContainer);
					}
				}

				function addPlaceHolders (blot, num) {
					if (num === 0){
						return blot.parent;
					}
					var parent = blot.parent;
					blot.parent = document.createElement(blot.parent.tagName);
					parent.insertBefore(blot.parent, blot.node);
					blot.parent.appendChild(blot.node);
				
					addPlaceHolders(blot, num-1);
					return parent;
				}

				function correctPlaceHolderElements (blot){
					var tree = DOM.getParentContainers(blot.node);
					var indent = blot.attr.indent || 0;
					if ( (indent + 1) === tree.length){return blot.parent}
					else if ( (indent + 1) > tree.length) { //// add placeholders
						var childList = DOM.getLastChild(blot.node);
						if ( (childList !== null) && (['UL','OL'].indexOf(childList.tagName) > -1 ) ){ //// if blot.node already has nested list --> use existing list instead of adding placeholders
							var parent = blot.parent;
							parent.insertBefore(childList, blot.node);
							childList.insertBefore(blot.node, childList.firstChild);
							blot.parent = childList;
							ListUtility.addPlaceHolders(blot, (indent - tree.length));
							//// return parent; ///// TODO: seems like this should be the way to go.
							return blot.parent;
						} //// blot.node does not have a nested list --> go straight to adding placeholders.
						return ListUtility.addPlaceHolders(blot, 1+(indent - tree.length));
					} else if (tree.length > indent) { //// jump placeholders

						var parent = tree[indent];
						if (parent !== blot.parent){
							var prevSib = blot.node.previousSibling;
							parent.insertBefore(blot.node, parent.firstChild);
							while (prevSib && prevSib.tagName == "LI"){ //// make sure that sibling elements get moved as well. TODO: make more elegant by using blots.
								var _prevSib = prevSib.previousSibling;
								parent.insertBefore(prevSib, parent.firstChild);
								prevSib = _prevSib;
							}
							DOM.removeEmptyNodesByChild(blot.parent);
							blot.parent = parent;
						}
						return blot.parent;
					}
				}

				function getListItemByIndent (node, indent){
					if (indent) {
						if (node.tagName === "LI") {
							return getListItemByIndent(node.parentElement, indent);
						} else if (indent == 1){
							if (node.parentElement.tagName != "LI"){
								return node;
							}
						}
						return getListItemByIndent(node.parentElement, indent-1);
					}
					return node;
				}

				return {checkPlaceHolders:checkPlaceHolders, clearPlaceHolders:clearPlaceHolders, addPlaceHolders:addPlaceHolders, getListItemByIndent:getListItemByIndent, correctPlaceHolderElements:correctPlaceHolderElements};
			})();

			function normalizeListHTML (canvas, blot, prevCon){
				if ( (!prevCon) || (prevCon.node.tagName != "LI") ){ //// beginning of document or beginning of list.
					if (ListUtility.checkPlaceHolders(blot.parent, (blot.attr.indent || 0)) ) {
						return;
					}
					ListUtility.correctPlaceHolderElements(blot);
					return;
				}

				var prevTree = DOM.getParentContainers(prevCon.node);
				var blotTree = DOM.getParentContainers(blot.node);
				if (prevTree[0] !== blotTree[0]){ //// canvas behavior: merge consecutive lists. 
					if ( (!prevCon.parent) || (blot.parent.tagName != prevCon.parent.tagName) ) { //// TODO: We need more rigorous thinking about which lists should be combined.
						ListUtility.correctPlaceHolderElements(blot);
						return ; //// different types of list --> no normalization possible
					}
					prevTree[0].appendChild(blotTree[0]); //// just append entire list & let normalization handle the rest.
				}

				if ((prevCon.attr.indent || 0 ) == (blot.attr.indent || 0) ){ //// List Containers at same indent level
					if (!Delta.Attr.check_attr_equality (blot.attr, prevCon.attr)){	return;}
					if (blot.parent == prevCon.parent){return } //// SANITY --> already attached properly
					while (blot.parent.childNodes.length){ //// NOTE: childNodes.forEach() causes unexpected behavior
						prevCon.parent.appendChild(blot.parent.firstChild);
					}
					blot.parent.remove();
					blot.parent = prevCon.parent;
					return;
				}

				if ((prevCon.attr.indent || 0)+1 === blot.attr.indent) { //// List Container at one greater depth.
					if (prevCon.node === blot.parent.parentElement) {return } //// SANITY --> already attached properly
					var oldParent = blot.parent.parentElement;
					prevCon.node.appendChild(blot.parent); //// add sublist.
					DOM.removeEmptyNodesByChild(oldParent); //// remove old parent node if empty
					return;
				}

				if ((prevCon.attr.indent || 0) > (blot.attr.indent || 0)) { //// List Container at less depth.
					var listItem = ListUtility.getListItemByIndent(prevCon.node, prevCon.attr.indent - (blot.attr.indent || 0));
					if (blot.parent === listItem.parentElement){ //// SANITY --> already attached properly
						return;
					}
					ListUtility.clearPlaceHolders(blot.parent);

					var anchor = listItem.nextSibling;
					listItem.parentElement.insertBefore(blot.node, anchor);
					var oldParent = blot.parent;
					blot.parent = listItem.parentElement;
					Transform.Blot.attachPreviousBlocks(canvas, blot, blot.node, blot.position);
					DOM.removeEmptyNodesByChild(oldParent);
					return
				}

				if ((prevCon.attr.indent || 0) < blot.attr.indent ) { /// List Container at 2 or greater depth
					var num = blot.attr.indent - (prevCon.attr.indent || 0);
					var ph = ListUtility.checkPlaceHolders( blot.node, num );
					if (ph) {
						if (ph.parentElement === prevCon.node) { //// SANITY --> already attached properly
							return 
						}
					}
					ph = ListUtility.correctPlaceHolderElements(blot);

					Transform.Blot.attachPreviousBlocks(canvas, blot, blot.node, blot.position);
					for (var i = 1; i < num; i++) { //// get the top placeholder
						ph = ph.parentElement;
					}
					var possibleEmpty = ph.parentElement; //// possibly empty after a container split.
//					console.log(prevCon.node, ph);
					if (prevCon.node !== ph){
						prevCon.node.appendChild(ph);
					}
					DOM.removeEmptyNodesByChild(possibleEmpty);
				}
			}

			function normalizeTableHTML (canvas, blot){
				if (!blot.parent){
					return;
				}
				if (blot.parent.tagName === "TR"){ 
					if (blot.parent.parentElement.tagName === 'TABLE') { //// non-normalized table
						if (['TBODY','TFOOT'].indexOf(blot.parent.previousSibling.tagName) > -1){
							var tbody = blot.parent.previousSibling;
						} else {
							var tbody = document.createElement('TBODY');
							blot.parent.parentElement.appendChild(tbody);
						}
						tbody.appendChild(blot.parent);
						var tableElement = blot.parent.parentElement.parentElement
					} else if (blot.parent.parentElement.tagName === 'TBODY') { //// normalized table
						//// Even for normalized tables, we still have to check to see if we should combine tables.
						//// adjacent tables must will be merged, just like with lists.
						//// This behavior is actually essential for undos.
						var tableElement = blot.parent.parentElement.parentElement

					}
					if (tableElement){
						if (blot.parent.previousSibling == null) { //// Only try to merge tables on first TR row.
							var prevCon = Parchment.getPreviousContainerBlot(canvas[EDITOR].blots, blot.position -1);
							if ( (tableElement.tagName === tableElement.previousSibling.tagName) && (Delta.Attr.check_attr_equality(blot.attr, prevCon.attr) ) ) {
								DOM.attachPreviousSibs(tableElement.lastChild, tableElement.previousSibling.lastChild.lastChild);
								tableElement.previousSibling.remove();
							}
						}
						return ;
					}
					var next = blot.parent.nextSibling;
					var prev = blot.parent.previousSibling;
					if (next && (next.tagName === 'TABLE') ){
						next.firstChild.insertBefore(blot.parent, next.firstChild.firstChild);
					} else if (prev && (prev.tagName === 'TABLE') ) {
						prev.lastChild.appendChild(blot.parent);
					} else {
						var tbl = document.createElement('TABLE');
						var tbody = document.createElement('TBODY');
						tbl.appendChild(tbody);
						blot.parent.parentElement.insertBefore(tbl, blot.parent);
						tbody.appendChild(blot.parent);
					}
				}
			}

			return {normalizeContainerBlot:normalizeContainerBlot, normalizeListHTML:normalizeListHTML, ListUtility:ListUtility, normalizeTableHTML:normalizeTableHTML}
		})();


		return {Delta:_Delta, Blot:_Blot, DOM:DOM, Normalize:Normalize}

	})()
		
	var State = (function(){
		///// There are 2 paths to creating the document state.
		/////// 1. Transform.Delta.applyDeltas() for each delta. (slow, because it modifies DOM every step) --> update()
		/////// 2. Delta.mergeDeltas(), then Transform.Delta.applyDeltas() for the final state. (fast, because it only touches DOM at last step) --> batchUpdate()
		///// Both Paths must be able to create "undo" deltas & both must be efficient.
		////// Efficient "undo" delta creation is integrated with the mergeDelta or applyDelta.
		////// Generating a diff between two complete document states would be an inefficient way to generate a delta.
		//// This means that we unwanted complexity with redundant implementations of a critically important method.
		//// But it gets worse:
		//// Not all deltaMerge operations can generate an "undo" delta. --> We can only generate "undo" deltas when working with a full document state & a delta.
		//// That means there are 2 deltaMerge methods: "generic" and "with document and undo deltas"

		//// Relationship between Diff and Undo.
		///// A + B = C
		///// C + Undo = A
		///// Diff(C, A) = Undo
		///// An Undo is the output of a Diff.
		///// An Undo is the context-specific inverse of a delta.

		///// Initially, I thought that I would have to implement 2 separate mergeDeltas() methods, b/c sometimes I needed the "undo" operation, and sometimes getting an "undo" operation is impossible.
		///// Getting an "undo" operation is impossible when the initial deltas array has RETAIN or DELETE operations.
		///// Now, there is only 1 mergeDeltas operation & it always returns the "undo" operations. However, the developer should never trust the "undo" operations unless she is certain that the initial array only has INSERT operations.

		// Figuring out the cache, undo array, and ops array is pretty complicated. Consider the following scenarios:
		// 1. User types a sentence into the editor. If we could send the entire sentence as one delta operation, it would be exponentially smaller.
		//   In this situation, we apply the operation & store the delta in a cache array.
		//   When we call the save() method, it merges all the operations in the cache & stores it in the ops array, then empties the cache.
		//   The undo array is the mirror of the ops array, so that we only populate it with the inverse deltas of the ops array - not the cache array.
		//   So the save() method empties cache, merges changes, pushes the merged delta into ops, and pushes the inverse of the merged delta into undos.
		//   The "transform()" method is intended for this use case. It calls the "dirty()" method to indicate that the cache has items.
		//   NOTE: If there is an "undoIndex" != 0, then we must merge those undo deltas into the new transform delta.
		// 2. User receives an update from a collaborating editor.
		//   In this situation, the update delta should not be stored in cache. The delta should be applied as received.
		//   In this situation, the ops and undos arrays should be populated immediately.
		//   the "update()" method is intended for this use case. 
		//   Since we are not touching the cache, it does not call "dirty()".
		//   Since the information is already in permanent storage, it does not trigger "save()".
		//   NOTE: This opens us up to having to merge conflicting deltas - called a "patch". This is a TODO feature.
		//   Unlike the "mergeDeltas()" method, which merges sequential deltas; a "patch()" method would merge deltas that diverge.
		// 3. User instantiates processor with the entire history of the document.
		//   In this scenario, we there are a lot of updates to apply. Applying each delta operation on the canvas would be inefficient.
		//   It is much more efficient to get the final state of the delta operations, and then apply one update on the canvas.
		//   We call mergeDeltas() for each deltas array to obtain the final state, then call applyDeltas().
		//   Even though we only call applyDeltas() once, we still want each component delta to be part of the undos and ops history.
		//   That means the mergeDeltas() method must be returning inverse deltas to create the undo history.
		//   The "batchUpdate()" method is intended for this use case.
		//   Since we are not touching the cache, it does not call "dirty()".
		//   Since the information is already in permanent storage, it does not trigger "save()".
		// 4. User undos work.
		//   4.1. If there are items in cache.
		//     we have to save those operations. (cache.length > 0) => save();
		//   4.2. Once there are no items in cache.
		//     decrement the UndoIndex.
		//     apply the undo delta designated by the UndoIndex.
		//     We don't want looking back at history to create its own history --> that would be complicated, unintuitive, expensive, and detrimental. 
		//     Undos do not go into cache or call "dirty()".
		//     However, since our editor autosaves, the user may expect the undo operations to be saved().
		//     Therefore, if the user leaves the canvas, the "blur" event will trigger save(), which will save an undo operations.
		//     Any advancing transform() operation that occurs while (undoIndex != 0) will merge the applied undo deltas, and reset UndoIndex to 0.
		//     NOTE: undo operations cannot be used to erase history - It's non-destructive. --> This is a design feature for the collaborative environment.
		//     In a scenario which requires auditing portion of the document is required, not destroying history is essential to preserve integrity of author attribution.
		// 5. User redos work.
		//   If UndoIndex != 0, then the editor applys the "ops" delta that corresponds to the position of the UndoIndex.
		//   This means that the "ops" array must directly mirror the "undos" array: operation for operation.
		//   Does not call "dirty()" or directly trigger save(). Redo != Transform.

		///// property names to be added to canvas[EDITOR] object.
		var COUNTER = 'counter'; // To minimize network traffic; & to make change logs more meaningful; we save changes after 2 seconds of non-activity.
		var CACHE = 'cache'; // before the save() event, deltas are stored in CACHE. Acts as a "dirty" flag.
		var OPS = 'ops'; // The save() event merges Deltas in cache into a single deltas, and moves it to OPS.
		var UNDOS = 'undos'; // Each undo operation corresponds to an operation in OPS or CACHE.
		var UNDOINDEX = 'undoIndex'; // Can also act as a "dirty" flag in specific conditions.
		var TIMESTAMP = 't';
		var TRANSMIT = null; // transmit() callback fired by the save() event.

        function _decrement (canvas){
			canvas[EDITOR][COUNTER] --
            if (canvas[EDITOR][COUNTER] > 0) {
                setTimeout(function(){_decrement(canvas)},1000);
            }
            else if (canvas[EDITOR][COUNTER] == 0){
				save(canvas); // fire save() event.
			} else {
				// counter == -1 --> callback already fired & is locked by the save() method.
				// save() method will reset the counter
			}
        }

		function dirty (canvas){
			if (canvas[EDITOR][COUNTER] === -1) {
				///// -1 is a magic number to indicate that the save() method has a lock on the editor.
			} else if (canvas[EDITOR][COUNTER] < 1) {
                canvas[EDITOR][COUNTER]=2;
                _decrement(canvas);
            } else {
                canvas[EDITOR][COUNTER]=2;
            }
		}


		function receive (canvas, Deltas, delta, undo) {
			console.log('receive', Deltas);
//			if (Deltas.length == 0){return}

			var OpIndex = canvas[EDITOR][OPS].length; // reset OpIndex. Another transaction may have completed.
			if (OpIndex > 0) {
				var lastTimestamp = canvas[EDITOR][OPS][OpIndex-1][TIMESTAMP];
			} else {
				var lastTimestamp =0;
			}

			var undoIndex = canvas[EDITOR][UNDOINDEX];
			var newDelta, newUndo
			var _newUndo = [];
			if (canvas[EDITOR].cache.length) {
				newDelta = Delta.batchMerge( canvas[EDITOR][CACHE]);
				_newUndo = Delta.batchMerge( canvas[EDITOR][UNDOS].slice(canvas[EDITOR][CACHE].length * -1).reverse() );
				newDelta = Delta.mergeDeltas(delta, newDelta)[0];
				newUndo = Delta.mergeDeltas(_newUndo, undo)[0]
			} else if (undoIndex < 0) { //// save undo operations to be permanent operation.
				newDelta = Delta.batchMerge( canvas[EDITOR][UNDOS].slice(undoIndex) );
				newUndo = Delta.batchMerge( canvas[EDITOR][OPS].slice(undoIndex) );
				newDelta = Delta.mergeDeltas(delta, newDelta)[0];
				newUndo = Delta.mergeDeltas(undo, newUndo)[0];					
			} else {
				newDelta = delta;//delta;
				newUndo = undo;//undo;
			}

			var collab = [];
			var Undos = []
			for (var i = 0; i < Deltas.length ; i++ ) {
				var _delta = Deltas[i];
				if (_delta[0][TIMESTAMP] <= lastTimestamp ){ //// If we accidentally get updates twice, ignore.
					continue;
				}
				if (i+1 !== Deltas.length) {
					var patch = Delta.patchDeltas(newDelta, _delta, true);
					var _undo = Transform.Delta.applyDeltas( canvas, Delta.patchDeltas(newDelta, _delta, true) ); //// 
					Undos.push(_undo);
					collab = Delta.mergeDeltas(collab, _delta)[0];
					canvas[EDITOR][OPS].splice(OpIndex+i, 0, _delta);
				} else {
					canvas[EDITOR][OPS].splice(OpIndex+i, 0, Delta.patchDeltas(collab, _delta) );
					var finalUndo = Delta.patchDeltas(collab, undo);
					Undos.push(finalUndo);
				}
			}

			//// Almost freakin' done! We also need to patch the cache & collect its corresponding undos.
			canvas[EDITOR][CACHE].map(function(op, index, array){
				array.splice(index, 1, Delta.patchDeltas(collab, op) )
				var __undo = canvas[EDITOR][UNDOS].splice((array.length - index) * -1, 1)[0]; /// have to patch corresponding undos as well.
				Undos.push( Delta.patchDeltas(collab, __undo) );
			});

			//// Unfortunately, you cannot get canonical undos from merging Deltas.
			//// The only way to get the canonical undos is to work backwards.
			//// Begin by reversing the undo array, then merge the undo deltas.
			var collabUndo = [];
			Undos.reverse().map(function(_undo){
				var patch = Delta.batchMerge(collabUndo);
				collabUndo.push(_undo)
				canvas[EDITOR][UNDOS].splice(OpIndex, 0, Delta.patchDeltas(patch, _undo));//Delta.patchDeltas(newUndo, _undo) );
			});

			//// Undos should be right. Note that the UNDOS array may include ops that are still in CACHE.
			canvas[EDITOR][COUNTER] = 0; //// Release the lock on the dirty() & save() counter.
			if (canvas[EDITOR][CACHE].length > 0) { /// If there are still ops in cache, be sure to fire dirty().
				dirty(canvas);
			}
		}

		function ajax(url, method, data) {
		  return new Promise(function(resolve, reject) {
			var request = new XMLHttpRequest();
			request.responseType = 'text';
			request.onreadystatechange = function() {
			  if (request.readyState === XMLHttpRequest.DONE) {
				if (request.status === 200) {
				  resolve(request.responseText);
				} else {
				  reject(Error(request.statusText));
				}
			  }
			};
			request.onerror = function() {
			  reject(Error("Network Error"));
			};
			request.open(method, url, true);
			request.send(data);
		  });
		}

		function save (canvas, callback){
			//// very complicated save() method intended to handle merges of simultaneous edits from different users.
			//// TODO: create tests!

			canvas[EDITOR][COUNTER] = -1; //// set State.counter below 0 to end dirty() timer.
			callback = canvas[EDITOR][TRANSMIT] || transmit;

			var delta, undo, undo_length;
			var OpIndex = canvas[EDITOR][OPS].length; // number of completed save() transactions.
			if (canvas[EDITOR].cache.length) {
				delta = Delta.batchMerge( canvas[EDITOR][CACHE].splice(0) ); //// merge all delta operations into a single delta.
				undo = Delta.batchMerge( canvas[EDITOR][UNDOS].splice(OpIndex).reverse() ); //// get the corresponding undo operation for the merged delta
					// any undo ops after the OpIndex correspond directly to ops stored in cache.
					// Uses "splice" to remove undos that pertain to cache ops that are about to be removed
			} else if (canvas[EDITOR][UNDOINDEX] < 0) { //// save undo operations to be permanent operation.
				var undoIndex = canvas[EDITOR][UNDOINDEX];
				delta = Delta.batchMerge( canvas[EDITOR][UNDOS].slice(undoIndex) );
				undo = Delta.batchMerge( canvas[EDITOR][OPS].slice(undoIndex) );
				canvas[EDITOR][UNDOINDEX] = 0;
			}

			callback.call(canvas, delta, TIMESTAMP).then(function(response){
				receive(canvas, response, delta, undo);
			})

//			var Deltas = callback(canvas, delta, undo, receive); ////  callback is probably an asynchronous POST request --> which would allow a keyboard event interrupt.
			// Once the callback returns, we are guaranteed to have no more interrupts.
			// But we do have to check for any operations that may have occured while we were waiting for the callback to return.
			// We also have to guarantee that there are not 2 racing save() calls on the same editor field.
			// If the later save() returns first, it will screw up the index.
			// Ergo, we lock a field from saving by setting its counter to -1.
		}

		function transmit (canvas, deltas, undo, receive){
			var promise = new Promise(function(resolve, reject) {
				args = [];
				console.log(canvas, deltas, undo, receive);
			  setTimeout(resolve, 100, args);
			});
			return promise;
		}

		function init (canvas, callback) {
			canvas[EDITOR][OPS] = [];
			canvas[EDITOR][UNDOS] = [];
			canvas[EDITOR][UNDOINDEX] = 0;
			canvas[EDITOR][CACHE] = [];
			canvas[EDITOR][COUNTER] = 0;
			canvas[EDITOR][TRANSMIT] = callback;
		}

		function update (canvas, deltas) { //// Intended for delta operations that occur due to other user's work. Already saved to permanent storage & tend to already be consolidated.
			canvas[EDITOR][OPS].push(deltas);
			var undo = Transform.Delta.applyDeltas(canvas, deltas);
			canvas[EDITOR][UNDOS].push(undo);
		}

		function batchUpdate_old (canvas, Deltas) { //// Intended for initializing a document with a long work history. Note that the current problem with producing the undo history.
			//// TODO: there is a condition in which an operation expands the range of a container element created in an earlier operation. It is hard to undo this operation properly. batchUpdate currently does not support this operation.
			var state = [];
			var undos = canvas[EDITOR][UNDOS];
			Deltas.map(function(deltas){
				var undo
				[state, undo] = Delta.mergeDeltas(state, deltas);
				Delta.normalizeDeltas(undo);
				undos.push(undo);
			});
			Transform.Delta.applyDeltas(canvas, state);
		};

		function batchUpdate (canvas, Deltas) {
			Deltas.map(function(deltas){
				update(canvas, deltas);
			});
		}

		function transform (canvas, deltas) { //// Intended for delta operations that occur due to user input. Not yet saved to permanent storage & usually small operations that are more efficient to merge.
			canvas[EDITOR].cache.push(deltas);
			if (canvas[EDITOR].undoIndex < 0) { //// non-destructive to transformation history - even with undos.
				var undos = canvas[EDITOR][UNDOS].slice( canvas[EDITOR].undoIndex );
				var diff = [];
				undos.map(function(undoDeltas) {
					diff = Delta.mergeDeltas(diff, undoDeltas)[0];
				})
				[deltas, undo] = Delta.mergeDeltas(deltas, diff);
				canvas[EDITOR].undoIndex = 0;
			}
			var undo = Transform.Delta.applyDeltas(canvas, deltas);
			canvas[EDITOR][UNDOS].push(undo);
			dirty(canvas);
		}

		function undo (canvas) {
			var undoIndex = canvas[EDITOR].undoIndex - 1 ;
			var undo = canvas[EDITOR][UNDOS].slice( undoIndex, (undoIndex+1 || undefined) ); 
			if (undo.length > 0) {
				Transform.Delta.applyDeltas(canvas, undo[0]);
				canvas[EDITOR].undoIndex --;
			}
			//// we don't want to dirty() undo or redo, because we never delete histories & looking back at history should not create new history
			//// However, if a user undos, then leaves the canvas field, we have 'blur' event fire save(). We trust blur to 'save' us.
		}

		function redo (canvas) {
			var undoIndex = canvas[EDITOR].undoIndex;
			if (undoIndex < 0){
				var redo = canvas[EDITOR].ops.slice( undoIndex, (undoIndex+1 || undefined) )[0];
				Transform.Delta.applyDeltas(canvas, redo);
				canvas[EDITOR].undoIndex ++;
			}
			//// No dirty() call.
		}

		return {init:init, transform:transform, undo:undo, redo:redo, dirty:dirty, save:save, update:update, batchUpdate:batchUpdate, receive:receive}

	})();

	var Canvas = (function(){
		///// First Rule of Canvas --> Canvas does not mutate itself. Canvas asks editor Core to mutate the canvas with a delta object. Canvas just has to figure out how to make the delta based on the user's input. (This is different from Quill.js, where the editor calls APIs that generate the deltas. Canvas creates the deltas directly.)
		///// Canvas deals with cursor navigation & selection of canvas.

		var KeyBoard = (function(){
			///// Contexts
			var NORMAL = 0;
			var SHIFT = 1;
			var CTRL = 2;
			var META = 4;
			var CAPS = 8;

/*			var keys = {
				BACKSPACE: 8,
				TAB: 9,
				ENTER: 13,
				ESCAPE: 27,
				LEFT: 37,
				UP: 38,
				RIGHT: 39,
				DOWN: 40,
				DELETE: 46
			};*/

			var KeyMap = {}
			KeyMap[ NORMAL ] = {
				'Tab':'indent',
				'ArrowRight':'arrowRight',
				'ArrowLeft':'arrowLeft',
				'ArrowUp':'arrowMove',
				'ArrowDown':'arrowMove',
				'Delete':'delete',
//				'End':'getFreshRange'
			};
			KeyMap[ SHIFT ] = {
				'Tab':'reverseTab',
				'ENTER':'pageBreak',
				'ArrowRight':'arrowMove',
				'ArrowLeft':'arrowMove',
				'ArrowUp':'arrowMove',
				'ArrowDown':'arrowMove',
			};
			KeyMap[ CTRL ] = {
				'b':'bold',
				'u':'underline',
				'i':'italicize',
				'z':'undo',
				'ArrowRight':'arrowMove',
				'ArrowLeft':'arrowMove',
				'ArrowUp':'arrowMove',
				'ArrowDown':'arrowMove',
			};
			KeyMap[ META ] = {

			};
			KeyMap[ CAPS ] = {

			};
			KeyMap[	(CTRL+SHIFT) ] = {
				'Tab':'tab',
				'ArrowRight':'arrowMove',
				'ArrowLeft':'arrowMove',
				'ArrowUp':'arrowMove',
				'ArrowDown':'arrowMove',
				'Z':'redo',
				'z':'redo',
			};
			KeyMap[	(CTRL+META) ] = {
				'Tab':'tab',
			};
			KeyMap[	(SHIFT+META) ] = {

			};
			KeyMap[	(META+CAPS) ] = {
				'Tab':'tab',
			};
			
			function contextCode(e) {
				var ret = 0;
				if (e.shiftKey){
					ret = ret+SHIFT;	
				}
				if (e.ctrlKey){
					ret = ret+CTRL;
				}
				if (e.metaKey){
					ret = ret+META;
				}
				if (e.capsKey){
					ret = ret+CAPS;
				}
				return ret;

			}

			return {KeyMap:KeyMap, contextCode};
		})()

		var Actions = {
			'getFreshRange': function (canvas, event, range){
				setTimeout(function(){ //// refresh range after movement.
					Range.getFreshRange(canvas);
				},0)
			},
			'undo': function (canvas, event, range) {
				State.undo(canvas);
			},
			'redo': function (canvas, event, range) {
				State.redo(canvas);
			},
			'insert': function (canvas, event, range) {
				if (range.isRange){ //// if range --> delete selection.
					var format = range.inlineFormat
					var deltas = [
						Delta.createDelta(RETAIN, range.start),
						Delta.createDelta(DELETE, range.end-range.start)
					];
					State.transform(canvas, deltas);
					Range.collapse(canvas, 0);
					range.inlineFormat = format; //// collapse will erase inlineFormat, but in this scenario, we want to actually maintain the original inlineFormat.
				}
				var deltas = [
					Delta.createDelta(RETAIN, range.start),
					Delta.createDelta(INSERT, event.key)
				];
				if (Object.keys(range.inlineFormat).length){
					deltas[1][ATTRIBUTES] = range.inlineFormat;
				}
				State.transform(canvas, deltas);
				Range.move(canvas, 1);
			},
			'return': function (canvas, event, range) {
				var blockBlot = Transform.DOM.getInlineParent(range.startBlot.node).parentElement; //// TODO: this is bad.
				var deltas = [{"retain":range.start},{"ins":"\n"}];
				if (blockBlot.attr){
					Object.keys(blockBlot.attr).map(function(key){
						if (["indent","range"].indexOf(key) === -1){
							deltas[1][ATTRIBUTES][key] = blockBlot[ATTRIBUTES][key];
						}
					})
				}
				State.transform(canvas, deltas);
				Range.collapse(canvas, 1);
			},
			'move': function (canvas, event, range) {

			},
			'bold': function (canvas, event, range) { //// TODO: Has experimental STATIC support.
				if (range.isRange){
					if (range.inlineFormat.hasOwnProperty(STATIC.BOLD) ){
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.BOLD, false) )
						];
						range.inlineFormat[STATIC.BOLD] = false;
					} else {
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.BOLD, true) )
						];
						range.inlineFormat[STATIC.BOLD] = true;
					}
					State.transform(canvas, deltas);
					return deltas;
				} else {
					if (range.inlineFormat.hasOwnProperty(STATIC.BOLD)){
						delete range.inlineFormat[STATIC.BOLD];
					} else {
						range.inlineFormat[STATIC.BOLD] = true;
					}
				}
			},
			'italicize': function (canvas, event, range) { //// TODO: Has experimental STATIC support.
				if (range.isRange){
					if (range.inlineFormat.hasOwnProperty(STATIC.ITALIC) ){
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.ITALIC, false) )
						]
						range.inlineFormat[STATIC.ITALIC] = false;
					} else {
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.ITALIC, true) )
						]
						range.inlineFormat[STATIC.ITALIC] = true;
					}
					State.transform(canvas, deltas);
				} else {
					if (range.inlineFormat.hasOwnProperty(STATIC.ITALIC)){
						range.inlineFormat[STATIC.ITALIC] = false;
					} else {
						range.inlineFormat[STATIC.ITALIC] = true;
					}
				}
				return deltas;
			},
			'underline': function (canvas, event, range) { //// TODO: Has experimental STATIC support.
				if (range.isRange){
					if (range.inlineFormat.hasOwnProperty(STATIC.UNDERLINE) ){
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.UNDERLINE, false) )
						]
						range.inlineFormat[STATIC.UNDERLINE] = false;
					} else {
						var deltas = [
							Delta.createDelta(RETAIN, range.start),
							Delta.createDelta(RETAIN, range.end-range.start, Delta.createDelta(STATIC.UNDERLINE, true) )
						]
						range.inlineFormat[STATIC.UNDERLINE] = true;
					}
					State.transform(canvas, deltas);
				} else {
					if (range.inlineFormat.hasOwnProperty(STATIC.UNDERLINE)){
						range.inlineFormat[STATIC.UNDERLINE] = false;
					} else {
						range.inlineFormat[STATIC.UNDERLINE] = true;
					}
				}
				return deltas;
			},
			'tab': function (canvas, event, range) {
				console.log(range);
				var blockBlots = Range.getBlocksInRange(canvas, range);
				var container = Parchment.getContainerBlot(canvas[EDITOR].blots, range.startBlot.position);
				var prevBlot = Parchment.getPreviousBlockOrContainerBlot(canvas[EDITOR].blots, range.startBlot.position-1);
				var deltas = [];
				var deltaIndex = 0;
				blockBlots.map(function(blot, index){
					var newIndent = (blot.attr.indent || 0) + 1;
					if ((prevBlot.type === Blot.types.BLOCK) && (prevBlot.attr.indent != newIndent) ){
						var delta1 = Delta.createDelta(RETAIN, prevBlot.index - deltaIndex);
						var delta1 = Delta.createDelta(RETAIN, 1, {'range':container.attr.range});
						if (container.attr.indent){
							delta2.attr.indent = container.attr.indent;
						}
						deltaIndex = prevBlot.index+1;
						deltas.push(delta1); deltas.push(delta2);
					}
					if (container.attr.indent == newIndent){
						return;
					}
					if (blot.type === Blot.types.CONTAINER) {
						console.log(blot.index - deltaIndex, blot, deltaIndex);
						var delta1 = {'retain':blot.index - deltaIndex};
						var delta2 = {'retain':1, 'attr':{'indent':newIndent} };
						deltas.push(delta1); deltas.push(delta2);
					}

				})
				State.transform(canvas, deltas);
				Range.restoreRangeByIndex(canvas);
			},
			'indent': function (canvas, event, range) {
				var blocks = Range.getBlocksInRange(canvas);
				var prevBlock = Parchment.getPreviousBlockOrContainerBlot(canvas[EDITOR].blots, canvas[EDITOR].range.startBlot.position);
//				blocks.splice(0,0,prevBlock);
				var ops = blocks.reverse().reduce(function(acc, blot, array, index){
					if ( (index === 0) || (blot.type === Blot.types.CONTAINER) ){
						if (blot.attr && blot.attr.indent) {
							var indent = blot.attr.indent + 1
						} else {
							var indent = 1;
						}
						var obj = {'index':blot.index, attr:{'indent':indent} }
						if (blot.type === Blot.types.BLOCK){
							obj.attr['range'] = Parchment.getContainerBlot(canvas[EDITOR].blots, blot.position+1).attr.range;
						}
						acc.push(obj);
					}
					return acc
				}, []);
				var deltas = [];
				var deltaIndex = 0;
				if (prevBlock.type === Blot.types.BLOCK) {
					var container = Parchment.getContainerBlot(canvas[EDITOR].blots, prevBlock.position+1);
					deltas.push({retain:prevBlock.index}, {retain:1, attr:{range:container.attr.range} } )
					if (container.attr.indent){
						deltas[1].attr.indent = container.attr.indent;
					}
					deltaIndex = prevBlock.index + 1;
				} else if ((prevBlock.attr) && (prevBlock.attr.range === ops[0].range) ) {
					console.log('SO FAR UNUSED CONDITION')
					if (Container.isEqual(prevBlock.attr, ops[0])){
						deltas.push({retain:prevBlock.index}, {retain:1, attr:{range:false, indent:false} });
						deltaIndex = prevBlock.index + 1;
					}
				}
				ops.map(function(op){
					var nextRetain = op.index - deltaIndex;
					if (nextRetain > 0){
						deltas.push({retain:nextRetain});
					}
					deltas.push({retain:1, attr:op.attr});
					deltaIndex = op.index+1;
				})
				State.transform(canvas, deltas);
			},
			'outdent': function (canvas, event, range) {
				console.log('outdent not supported yet');
			},
			'formatBlocks': function (canvas, event, range) {
				console.log('formatBlocks not supported yet');
			},
			'arrowRight':function (canvas, event, range) {
				event.preventDefault();
				Range.move(canvas, 1);
			},
			'arrowLeft':function (canvas, event, range){
				event.preventDefault();
				Range.move(canvas, -1);
			},
			'arrowMove':function (canvas, event, range){
				setTimeout(function(){ //// refresh range after movement.
					Range.getFreshRange(canvas);
				},0)
			},
			'delete':function(canvas, event, range){
				event.preventDefault();
				if (range.isRange){
					var deltas = [{"retain":range.start},{"del":range.end-range.start}];
				} else {
					var deltas = [{"retain":range.start},{"del":1}];
				}
				State.transform(canvas, deltas);
			},
			'insertListRange':function(canvas, event, range){

			},
			'insertTableRange':function(canvas, event, range){

			},
			'insertTextRange':function(canvas, event, range){

			}
		}

		function Shortcut (canvas, event, range) { //// preventDefault();
			var func = KeyBoard.KeyMap[KeyBoard.contextCode(event)][event.key];
			if (func){
				event.preventDefault();
				var ret = Actions[func](canvas, event, range);
			} else {
				console.log('hi');
				setTimeout(function(){ //// refresh range after movement.
					Range.getFreshRange(canvas);
				},10)
			}
		}

		function Shortcut_special (canvas, event, range) { //// no preventDefault();
			var func = KeyBoard.KeyMap[KeyBoard.contextCode(event)][event.key];
			if (func){
				var ret = Actions[func](canvas, event, range);
			}
		}

		function connect (canvas, callback){
			canvas.contentEditable = true;
			canvas.style.whiteSpace = "pre-wrap";
			canvas[EDITOR] = {blots:[],range:{}};
			State.init(canvas, callback);	
			Range.init(canvas)
//			canvas[EDITOR].blots = Blot.blotsFromDOM(canvas);
/*			canvas.addEventListener('focus', function(e){
				if (! canvas[EDITOR].range.startBlot) { //// set range at beginning of document.
					Range.setRangeByIndices(canvas, 0, 0);
				} else {
//					Range.getFreshRange(this);
//					if (canvas[EDITOR].range.selection.anchorNode === canvas){
//						Range.setRangeByIndices(canvas, 0, 0);
//					}
				}
			});
			canvas.addEventListener('mouseover', function(e){
				if (! canvas[EDITOR].range.startBlot) { //// set range at beginning of document.
					Range.setRangeByIndices(canvas, 0, 0);
				}
			});*/
			canvas.addEventListener('mouseup', function(e){ //// 'click' will fire too soon, & doesn't fire when selecting more than 1 node.
				if (this === document.activeElement){ //// make sure editor is active so that window.getSelection() will return objects within the editor.
					Range.getFreshRange(this);
				}
			});
			canvas.addEventListener('blur', function(e){
//				Range.getFreshRange(this);
			});
			canvas.addEventListener('dblclick', function(e){
				Range.getFreshRange(this);
			})
			canvas.addEventListener('keydown', function(e){
				var range = canvas[EDITOR].range;
				if (e.key.length == 1){ //// 1. charKeys
					if (e.ctrlKey) { /// 1.1 formatShortcut
						Shortcut(canvas, e, range);
						if (range.isRange) {
							Range.restoreRangeByIndex(canvas);
						}
					} else { /// 1.2  charInput
						e.preventDefault();
						Actions.insert(canvas, e, range)
					}
				} else { //// 2. actionKeys
					if (e.keyCode == 13){
						e.preventDefault();
						Actions.return(canvas, e, range);
					} else if ((e.keyCode > 36) && (e.keyCode < 41) ){ // arrow Keys
						if (!e.altKey) {
							Shortcut_special(canvas, e, range);
						}
					} else if (e.keyCode == 8){ /// backspace
						e.preventDefault();
						var deltas = [{"retain":range.start-1},{"del":1}];
						State.transform(canvas, deltas);
						Range.move(this, -1);

					} else if (e.keyCode == 46) { //// delete
						Shortcut(canvas, e, range)
					} else if (e.keyCode == 9){ //// TAB
						e.preventDefault();
						Shortcut(canvas, e, range);
					} else if (e.keyCode === 35){
						Shortcut(canvas, e, range);
					}
				}
			})
			return canvas;
		}

		var Toolbar = (function(){ //// Universal Toolbar --> all editor instances share the same toolbar.
			var container = document.createElement('DIV');

			return {container:container};
		})()

		return { connect:connect, Shortcut:Shortcut, Actions:Actions, KeyBoard:KeyBoard, Toolbar:Toolbar}
	})();


/*	var Actions = {
		'delete':[],
		'return':[],
		'backspace':[],
		'indent':[],
		'cursorRight':[],
		'cursorLeft':[],
		'insert':[],
		'character':[],
		'clean':[],
		'undo':[],
		'redo':[],
	}*/

	var Range = (function(){

		function init(canvas){
			canvas[EDITOR]['range'] = rangeObject();
//			canvas[EDITOR]['range'].startBlot = canvas.firstChild;
//			canvas[EDITOR]['range'].endBlot = canvas.lastBlot;
		}

		function rangeObject(){
			return {
				'isReversed':false,
				'isRange':false,
				'start':0,
				'end':0,
				'selection':window.getSelection(),
				'startBlot':null,
				'endBlot':null,
				'inlineFormat':{},
			}
		}

		function getBlocksInRange(canvas) {
			var startPosition = canvas[EDITOR].range.startBlot.position;
			var endPosition = canvas[EDITOR].range.endBlot.position;
			var ret =  canvas[EDITOR].blots.slice(startPosition, endPosition + 1 ).reduce(function (acc, blot) {
				if (blot.type >= Blot.types.BLOCK) {
					acc.push(blot);
				}
				return acc;
			}, []);
			if (canvas[EDITOR].range.endBlot.type < Blot.types.BLOCK) {
				ret.push(Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, canvas[EDITOR].range.endBlot.position) );
			}
			return ret;
		}

		function getBlotByDOM(canvas, dom, startIndex){
			startIndex = startIndex || 0;
			for (var i = 0, len = canvas[EDITOR].blots.length; i < len; i++){
				var blot = canvas[EDITOR].blots[i];
				startIndex = startIndex + blot.length;
				if (blot.node == dom){
					return blot;
				}
			}
		}

		function getPreviousBlotByDOM (canvas, dom, index){
			while (index >= 0){
				var blot = canvas[EDITOR].blots[i];
				index--;
				if (blot.node == dom){
					return blot;
				}
			}
		}

		function getBlotByIndex (canvas, index){
			for (var i = 0, len = canvas[EDITOR].blots.length; i < len; i++){
				var blot = canvas[EDITOR].blots[i];
				if (( blot.index + blot.length ) >= index){
					if ( blot.index <= index ) {
						return blot;
					}
				}
			}
		}

		function getBlotRangeByIndex(canvas, start, end){ ///// used by Range(). Get blots that are touched by index range.
			return canvas[EDITOR].blots.filter(function(blot){			
				if (blot.index >= start){
					if (blot.index <= end) {
						return blot;
					}
				}
			})
		}

		function getLowestChildNode(node){
			if (node.firstChild){
				return getLowestChildNode(node.firstChild);
			}
			return node;
		}

/*		function getBlocksInRange (canvas, range){
			var ret = [];
			var blockBlot = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, range.startBlot.position);
			ret.push(blockBlot);
			while (blockBlot.position < range.endBlot.position){
				blockBlot = Parchment.getNextBlockOrContainerBlot(canvas[EDITOR].blots, range.startBlot.position);
				ret.push(blockBlot);
			}
			return ret;
		};*/

		function getBlotRangeByPosition (canvas, start, end){
			return canvas[EDITOR].blots.slice(start, end );
		}

		function getInlineBlotByIndex(canvas, index, direction){ //// IMPORTANT for Range(). Should not be used for Applying Delta operations - changing the index w/o warning is unsafe
			blot = getBlotByIndex(canvas, index);
			if (blot.ins == '\n'){
				if (direction > 0) { //// cursor is moving right
					var next = canvas[EDITOR].blots[blot.position+1];
				} else if (direction < 0) { //// cursor is moving left
					var next = canvas[EDITOR].blots[blot.position-1];
				}
				if (next) {
					return next
				} else { //// last or first blot of the document
					return null; 
				}
			}
			return blot;
		}

		function updateRangeSelection (canvas) {
			var range = canvas[EDITOR].range;
			if (range.isRange) {
				if (range.start === range.startBlot.index + range.startBlot.length) {
					range.startBlot = Parchment.getNextInlineBlot(canvas[EDITOR].blots, range.startBlot.position+1);
				}
				if (range.end === range.endBlot.index) {
					range.endBlot = Parchment.getPreviousInlineBlot(canvas[EDITOR].blots, range.endBlot.position-1);
				}
			}
			range.selection.removeAllRanges();
			var _range = document.createRange();
			var startOffset = Math.max(range.start - range.startBlot.index, 0); //// startOffset cannot be less than 0.
			var endOffset = Math.min(range.end - range.endBlot.index, range.endBlot.length); //// endOffset cannot be greater than node length.
			range.start = range.startBlot.index + startOffset; //// the new offsets might change our start & end indexes.
			range.end = range.endBlot.index + endOffset;
			_range.setStart(range.startBlot.node, startOffset);
			_range.setEnd(range.endBlot.node, endOffset);
			range.selection.addRange(_range);
		}

		function getInlineRangeFormat (canvas) { //// returns inline formatting based shared attributes from blots contained in range. --> important for range formatting.
			var range = canvas[EDITOR].range;
			var startBlot = range.startBlot;
			var endBlot = range.endBlot;

			var blots = canvas[EDITOR].blots.slice(startBlot.position, endBlot.position+1);
			range.inlineFormat = {};
			return blots.reduce(function(acc, blot, index){
				if (blot.ins === '\n'){
					return acc;
				} else if (!blot.attr){
					return {};
				}
				if (index === 0){
					Object.keys(blot.attr).map(function(key){
						acc[key] = blot.attr[key];
					});
				} else if (blot.attr){
					Object.keys(acc).map(function(key){
						if (acc[key] != blot.attr[key]){
							delete acc[key];
						}
					});
				}
				return acc;
			}, range.inlineFormat);
		}

		function getFreshRange (canvas){
			var selection = window.getSelection();
			var range = rangeObject();
			canvas[EDITOR].range = range;
			range.selection = selection;
			range.isRange = (!selection.isCollapsed); 

			//// find blots ////
/*			if (selection.focusNode === canvas){
				var focusNode = getLowestChildNode(canvas);
				var anchorNode = getLowestChildNode(canvas);
			} else {
				var focusNode = selection.focusNode
				var anchorNode = selection.anchorNode
			}*/
			if (selection.focusNode === canvas){ //// if empty  canvas, insert a paragraph
				State.transform(canvas, [{'ins':'\n',range:'text'}]);
				var focusBlot = getBlotByIndex(canvas, 0);
				var anchorBlot = getBlotByIndex(canvas, 0);
			} else {
				var focusBlot = getBlotByDOM(canvas, selection.focusNode); 
				var anchorBlot = getBlotByDOM(canvas, selection.anchorNode);
			}
//			console.log(anchorBlot, selection.anchorNode, selection.focusNode.children)
			//// handle if selection is reversed ////
			if (range.isRange){
				if (focusBlot.index < anchorBlot.index){
					range.isReversed = true;
				} else if ((selection.focusNode === selection.anchorNode) && (selection.focusOffset < selection.anchorOffset)){
					range.isReversed = true;
				}
			}
			//// tie range selection to blot indices. ////
			//// start & end is more relevant to the editor than focus & anchor ////

			if (anchorBlot == null){
			
			}
			//console.log(anchorBlot, range.anchorBlot)
			range.anchorBlot = anchorBlot;
			range.focusBlot = focusBlot;
			if (range.isReversed){ //// false by default.
				range.start = focusBlot.index + selection.focusOffset;
				range.end = anchorBlot.index + selection.anchorOffset;
				range.startBlot = focusBlot;
				range.endBlot = range.anchorBlot;
			} else {
				range.start = anchorBlot.index + selection.anchorOffset;
				range.end = focusBlot.index + selection.focusOffset;
				range.startBlot = anchorBlot;
				range.endBlot = focusBlot;
			}
//			console.log(range.startBot, focusBlot, anchorBlot);
			updateRangeSelection(canvas);
			getInlineRangeFormat(canvas);
			return range;
			
		};

		function setRangeByIndices(canvas, start, end){
			var range = canvas[EDITOR].range;
			range.start=start;
			range.end=end;
			range.isRange = (start !== end);
			range.startBlot = getBlotByIndex(canvas, start);
			range.endBlot = getBlotByIndex(canvas, end);

			range.isReversed = false; //// per the spec, it is impossible to set a range that is reversed. https://developer.mozilla.org/en-US/docs/Web/API/Range/setStart
			updateRangeSelection(canvas);
			getInlineRangeFormat(canvas);
			return range;
		}

		function restoreRangeByIndex (canvas){
			var range = canvas[EDITOR].range;
			setRangeByIndices(canvas, range.start, range.end)
		}

		function collapse (canvas, int){
			var range = canvas[EDITOR].range;
			range.start = range.start + (int || 0);
			range.isRange = false;
			range.end = range.start;
			range.startBlot = getInlineBlotByIndex(canvas, range.start, int);
			range.endBlot = range.startBlot;
			updateRangeSelection(canvas);
			getInlineRangeFormat(canvas);
		}

		function changePosition (canvas, int){
			var range = canvas[EDITOR].range;
//			range.isRange = false;
//			range.start = range.start + int;
//			range.end = range.start;
			var blot = getInlineBlotByIndex(canvas, range.start+int, int);
			if (blot !== null){ //// if we go out of document index, no change.
				range.start = range.start + int;
				range.end = range.start;
				range.startBlot = blot
				range.endBlot = range.startBlot;
				updateRangeSelection(canvas);
				getInlineRangeFormat(canvas);
			}
		};

		return {restoreRangeByIndex:restoreRangeByIndex, collapse:collapse, move:changePosition, getBlocksInRange:getBlocksInRange, setRangeByIndices:setRangeByIndices, getFreshRange:getFreshRange, getBlocksInRange:getBlocksInRange, init:init}

	})();

	return {blotsFromDOM:Blot.blotsFromDOM,applyDeltas:Transform.Delta.applyDeltas, connect:Canvas.connect, Range:Range, Blot:Blot, Canvas:Canvas, Delta:Delta, namespace:EDITOR, Parchment:Parchment, State:State, Transform:Transform, STATIC:STATIC };

})();

if (typeof(exports) !== "undefined"){
	exports.default = Shadow.Delta; //// export Delta module for use on Server.
	exports.static = Shadow.STATIC;
}

/*
var SUPPRESS = true;
Shadow.test = (function test(){
	if (SUPPRESS) {
		return
	}
	function check_equality (A, B){ //// http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
		var a = typeof(A); var b = typeof(B)
		if (a != b){
			if ( (a || false) == (b || false) ){return true;} ////functional equality ---> TODO: do I 
			return false
		} //// different types cannot be equal
		
		if (Array.isArray(A) && Array.isArray(B)){
			for (var i = 0, l = A.length; i < l; i++) { 
				if (!check_equality(A[i], B[i])){
					return false;
				}
			}
		} else if (a=="object") {
			var _a = Object.keys(A).sort(); var _b = Object.keys(B).sort(); /// get sorted keys
			if (_a.length != _b.length){ //// must have same number of keys
				return false
			}
			for (var i = 0, l = _a.length; i < l; i++) { //// must have same key:value pairs
				if (!check_equality(A[_a[i]], B[_b[i]])){
					return false;
				}
			}
		} else if ((a == "string") || (a=="number")){
			if (A != B){
				return false;
			}
		} else if (a == "undefined"){
			return true;
		} else if (a =="boolean"){
			return (A===B);
		}
		return true;
	}

	var self = this;
	function buildEditor(HTML){
		var Editor = document.createElement("DIV")
		Editor.innerHTML = (HTML || "");
		self.blotsFromDOM(Editor);
		return Editor;
	}
	(function test_build_editor1(){
		var HTML = "<p></p>"
		var editor = buildEditor(HTML); 
		if (editor.innerHTML != HTML) {
			console.log("ERROR: test_build_editor \n"+editor.innerHTML+"\n"+HTML)
		}
	})();
	(function test_build_editor2(){
		var HTML = "<p></p>"
		var editor = buildEditor(); /// not passing HTML
		if (editor.innerHTML != "") { //// therefore, innerHTML is empty
			console.log("ERROR: test_build_editor \n"+editor.innerHTML+"\n"+HTML)
		}
	})();

	(function test_blots(){
		var HTML = "<p>fjdks;ajfhgl<u>sk  hello World sd Barmitzvah </u><b><u>fas fas</u>dfa</b>sdf 1sdfdtd0010sff2f</p>";
		var editor = buildEditor(HTML);
		if (!editor[EDITOR].blots){
			console.log("ERROR: test_blots(): Blots did not attach to editor. ", editor);
		} else if (editor[EDITOR].blots.length != 6) {
			console.log("ERROR: test_blots(): Improper number of blots. Expected 6, but received " + editor[EDITOR].blots.length, editor);
		} else {
			var rez = ["fjdks;ajfhgl","sk  hello World sd Barmitzvah ","fas fas","dfa","sdf 1sdfdtd0010sff2f","\n"];
			editor[EDITOR].blots.map(function(blot, index){
				if (blot.ins != rez[index]){
					console.log("ERROR: test_blots(): Unexpected values. Expected "+blot.ins+ ", but received " + rez[index], editor);
				}
			})
		}
	})();

	(function buildEditorFromDeltas(){
		var editor = buildEditor();
		self.connect(editor);
		var deltas = [{'ins':"Hello World!"},{'ins':"\n"},{'ins':"This is bold text", attr:{'B':true} },{'ins':"This is italic text", attr:{'I':true} },{'ins':"This is underline text", attr:{'U':true} }, {'ins':'\n'}];
		var expectedBlots = [{"ins":"Hello World!","node":{},"length":12,"type":1,"child":{},"position":0, 'index':0},{"ins":"\n","length":1,"type":4,"node":{},"position":1,'index':12},{"ins":"This is bold text","node":{},"length":17,"type":1,"attr":{"B":true},"child":{},"position":2, 'index':13},{"ins":"This is italic text","node":{},"length":19,"type":1,"attr":{"I":true},"child":{},"position":3, 'index':30},{"ins":"This is underline text","node":{},"length":22,"type":1,"attr":{"U":true},"child":{},"position":4, 'index':49},{"ins":"\n","length":1,"type":4,"node":{},"position":5, 'index':71}];
		self.State.transform(editor, deltas);
		if (editor.innerHTML !== "<p>Hello World!</p><p><b>This is bold text</b><i>This is italic text</i><u>This is underline text</u></p>"){
			console.log('ERROR: ', arguments.callee.name, editor.innerHTML, deltas)
		} else if (!check_equality(editor[EDITOR].blots, expectedBlots) ){
			console.log('ERROR: ', arguments.callee.name, editor[EDITOR].blots, expectedBlots)
		}

	})();

}).call(Shadow);

*/