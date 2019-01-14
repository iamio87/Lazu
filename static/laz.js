// The lazu citation processor aims to have a modular, extensible structure, with APIs for plugins.
// As much as possible, use functional design patterns - instead of OOP.
//// favor explicit parameters over lookups to state objects.
//// Exception: circular references are not allowed. Pass object ids when objects have relationships to each other.
///// Tip: The Util class has methods for assigning unique IDs.
//// modules should not have depency on other modules.

//// arbitrary temporary variables are stored in "buildObj" parameter when building tokens from the JSON-tree structure.
//// arbitrary temporary variables are stored in "execObj" parameter when rendering cites.
//// to reduce the need for discovering where one is located in the JSON-tree structure, "scopeObj" parameter is used.

// Style guide: variables "this" & "self" must always refer to the citation processor.
// Style guide: "reference" refers to a bibliographic item.
// Style guide: "cite" refers to a in-document attribution to a reference.
// Style guide: "citation" refers to a cluster of contiguous cites. Sometimes called "citation-cluster".
// Style guide: "item" may refer to "reference","cite", or "citation".
// Style guide: used closures instead of prototypes.


//// 1. Framework provides the core plugin architecture that the lazu processor is built upon. It is licensed under BSD license.
var FrameWork = (function(){
	var Public = {} //// Holds Public functions
	var Private = {} //// Holds Developer functions
	var Modules = [] //// registry of modules. For use by plugin-developers
	var State = {} //// Keep all data related to the state of a style and its references in the State object.
	var Tracks = {} //// Tracks is a container for public functions - it enables plugins to extend the functionality of public API functions.
	//// One of the features of Tracks is that functions are executed through callbacks - allowing asynchronous functions to be seemlessly integrated.
	//// Support for asyncronous functions causes a bit of overhead. Reserve Tracks for user input API's, not for repetitive methods.
	var Introspection = {"Tracks":Tracks,"Modules":Modules} /// holds internal state of important Framework variables for debugging.
	Public["Introspect"] = 	function(){return Introspection};
	Private["Modules"] = Modules;
	Private["Public"] = Public;
	Private["Tracks"] = Tracks;

	var Signal = (function(){
		var self = this;
		var functions = {};
		var subscribe = function(name, fn){
			if (functions[name] == undefined){
				functions[name] = [];
			}
			functions[name].push(fn);
		}
		var unsubscribe = function(name,fn){
			if (functions(name) != undefined){
				var index=functions[name].index(fn)
				functions[name].slice(index, 1)
			}
		}
		var publish = function(name, args){
			if (functions[name] != undefined) {
				functions[name].map(function(fn){
					fn.apply(self, args);
				})
			}
		}
		return {
			subscribe:subscribe,
			unsubscribe:unsubscribe,
			publish:publish,
		}
	}).call(Private);
	
	Introspection["Signal"] = Signal;
	Private["Signal"] = Signal;

	function callbackWrapper(track, index, args, trackName){
		var self = this;
		var fn = track[index];
		var callback = track[index+1]
		if (callback == undefined){ /// End of function track: return values
			_callback = (function(){
				self.Signal.publish(trackName); // Outside applications can listen for when function is complete.
				return Array.from(arguments);
			})
		} else {
			var _callback = function(){
				var newArgs = Array.from(arguments);
				return callbackWrapper.call(self, track, index+1, newArgs, trackName);
			}
		}
		args.push(_callback);
		return fn.apply(this, args);
	}

	function getFunction(fn, index){
		var self = this;
		var pos = index || 0;
		return function(){
			var args = Array.from(arguments);
			return callbackWrapper.call(self, Tracks[fn], pos, args, fn);
		}
	}

	var Plugin = (function(){ //// Functionality is implemented fully through Plugins
		//// allow flexible ordering of registering hooks.
		var Private = this;
		var self = Private;
		var PreHook = {};
		var PostHook = {};

		var Functions ={} 	//// registry of functions by name

		function addFn(name, dependent, method){
			var self = this
			var Func = Functions[dependent]
			var Exec = this.Tracks[name.split('.')[0]]
			if (Exec == undefined){
				Exec=[]
				this.Tracks[name.split('.')[0]]=Exec
			}
			var index = Exec.indexOf(Func)
			if (method == "post"){
				index += 1
			}
			Exec.splice(index, 0, Functions[name])
			if (PreHook[name] != undefined){
				PreHook[name].map(function(pre){
					addFn.call(self, pre, name, "pre")
				})
				delete PreHook[name]
			}
			if (PostHook[name] != undefined){
				PostHook[name].map(function(post){
					addFn.call(self, post, name, "post")
				})
				delete PostHook[name]
			}
		}
		var register = function(plugin) {
			var fn;
			if (typeof(plugin.name) == "undefined"){ plugin.name = plugin.fn.name; }
			Functions[plugin.name] = plugin.fn;
			if (plugin.pre != undefined){
				if (Functions[plugin.pre] != undefined){ //// dependent function exists
					addFn.call(self, plugin.name, plugin.pre, "pre")
				} else { //// register in PreHook for when dependent function arrives
					if (PreHook[plugin.pre] == undefined){
						PreHook[plugin.pre] = []
					}
					PreHook[plugin.pre].push(plugin.name)
				}
			}
			else if (plugin.post != undefined){
				if (Functions[plugin.post] != undefined){ //// dependent function exists
					addFn.call(self, plugin.name, plugin.post, "post")
				} else { //// register in PostHook for when dependent function arrives
					if (PostHook[plugin.post] == undefined){
						PostHook[plugin.post] = []
					}
					PostHook[plugin.post].push(plugin.name)
				}
			} else {
				addFn.call(self, plugin.name, plugin.pre, "none")
			}
		}

		var registerModule = function(module){
			Private.Modules.push(module.name)
			module.call(self)
			return 1;
		}

		function execute(TrackName){
			var args = Array.from(arguments)
			Tracks[TrackName].map(function(fn){
				args = fn.apply(self, args)
			})
			return args
		}

		return {
			register:register,
			registerModule:registerModule,
			execute:execute, //// for methods without callbacks
		}
	}).call(Private)

	Private["Plugin"]=Plugin;
	Private["State"]=State;

	Private["getFunction"] = getFunction;
	Plugin.self = Private;


	Public["Private"]=Private; //// to let developers explore.
	Public["Plugin"]=Plugin;
	return Public;
})



//// 2. FirstOrderModules provide the core features for CSL processor. Plugin developers should pay most attention to the Core Modules in order to understand how the Processor works.
//// 1st order submodules can contain dependencies only with other 1st order submodules; they cannot contain dependencies on later modules.
//// 2nd order modules can have dependencies on 1st & 2nd order modules, but 2nd order modules cannot have dependencies on later modules.
function FirstOrderModules(){
	var self = this; //// create "self" variable in order to have easy reference to citation processor in filter(), map(), and reduce() functions.
	this.CSL = {}; //// 2.1 CSL container holds data and functions pertaining to the CSL specification.

	this.CSL.DATATYPES = []; /// Allows plugins to register new datatypes with Processor, such as "text", "date", "names" and "number".

	//// The processor follows citeproc-js paradigm of using "tokens" to implement CSL functionality. Cites and references are rendered by passing bibliographic information to these tokens.
	this.CSL.Node = {}; //// Contains functions about how to handle xml nodes in CSL XML styles. It attaches tokens to appropriate context.
	this.CSL.Attributes = {}; //// Contains functions about how to handle xml attributes in CSL XML styles. It usually affects state information contained in the token.
	this.CSL.Blob = {}; //// Contains functions that are executed by CSL Nodes in the rendering context. Blobs are attached to token.execs, and return an output.
	this.CSL.Sort = {}; //// Contains functions for how to sort items based on datatypes.

	//// When tokens are given variables, the token by default looks up variables in the bibliographic reference object. These are special variables that exist outside of the reference's bibliography.
	this.CSL.REFERENCEVARIABLES = [ // These are CSL variables generated by the processor about the reference item.
		"first-reference-note-number",
		"year-suffix",
		"citation-number",
		"citation-label",
	];
	this.CSL.CITEVARIABLES = [ // These are special cite variables.
		"prefix",
		"suffix",
		"locator",
		"position",
		"near-note"
	]; 

	//// The CSL specification appendix defines names for various datatypes in order to improve compatability between styles. Variables are text variables by default.
    this.CSL.NAME_VARIABLES = [
        "author",
        "collection-editor",
        "composer",
        "container-author",
        "director",
        "editor",
        "translator",
        "editorial-director",
        "interviewer",
        "original-author",
        "recipient"
    ];
    this.CSL.NUMBER_VARIABLES = [
        "chapter-number",
        "collection-number",
        "edition",
        "page",
        "issue",
        "number",
        "number-of-pages",
        "number-of-volumes",
        "volume",
    ];
    this.CSL.DATE_VARIABLES = [
        "accessed", 
        "issued",
        "event-date", 
        "container", 
        "original-date",
        "publication-date",
        "available-date",
        "submitted"
    ];

	///// These "STATIC" variables are used internally by the processor.
	this.STATIC = {};
	this.STATIC.WAIT = 0;
	this.STATIC.SINGLE = 1;
	this.STATIC.MULTIPLE = 0;
	this.STATIC.SINGLETON = 2; // singleton XML node
	this.STATIC.END = 1; // closing XML node
	this.STATIC.START = 0; // opening XML node
	this.STATIC.ASCENDING = 1; // sort order ascending
	this.STATIC.DESCENDING = -1; // sort order descending
	this.STATIC.TRUE = 1;
	this.STATIC.FALSE = -1; // explicit false testing (not falsey testing).

    this.STATIC.POSITION_FIRST = 0; // first cite to an item
    this.STATIC.POSITION_SUBSEQUENT = 1; // not the first cite to an item
    this.STATIC.POSITION_IBID = 2; // immediately prior cite also referenced the same item
    this.STATIC.POSITION_IBID_WITH_LOCATOR = 3; // immediately prior cite also referenced the same item, but locator is different

	//// for display-as-sort-order attribute ////
	this.STATIC.NEVER = 0;
	this.STATIC.SORT_ONLY = 1;
	this.STATIC.DISPLAY_AND_SORT = 2;

	///// For sort key nodes /////
	this.STATIC.BIBLIOGRAPHYVAR = 1;
	this.STATIC.REFERENCEVAR = 2;
	this.STATIC.CITEVAR = 3;

	this.State = {};

	if ("undefined" === typeof console) {
		this.CSL.debug = function (str) {
		    dump("CSL: " + str + "\n");
		};
		this.CSL.error = function (str) {
		    dump("CSL error: " + str + "\n");
		};
	} else {
		this.CSL.debug = function (str) {
		    console.log("CSL: " + str);
		};
		this.CSL.error = function (str) {
		    console.log("CSL error: " + str);
		};
	}

	this.Hash = (function HashModule(){	//// 2.2 finding a good hash function is hard.
		//// python uses unsigned 32-bit; javascript uses signed 32-bit. For compatability in my dev environment, hash drops trailing bit. Deprecate later?
		function hashPerson(obj){
			var hash = 0;
			var keys = ["family","given","suffix","dropping-particle","non-dropping-particle"]
			keys.map(function(key){
				var str = obj[key];
				for (var char in str){
					hash += str.charCodeAt(char);
					hash += (hash << 10);//>>>1;
					hash ^= (hash >>> 6);
					hash = hash<<1;// >>>1;
				}
			})
			hash += hash << 3;
			hash ^= hash >>> 11;
			hash += hash << 15;
			hash = (hash >>>1) /// make it positive
			return hash
		}
		function hashString(string){
			var hash = 0;
			for (var char in string){
				hash += str.charCodeAt(char);
				hash += (hash << 10);//>>>1;
				hash ^= (hash >>> 6);
				hash = hash<<1;// >>>1;
			}
			hash += hash << 3;
			hash ^= hash >>> 11;
			hash += hash << 15;
			hash = (hash >>>1) /// make it positive
			return hash
		}

		function hashList(list){
			var hash = 0;
			list.map(function(int, index){
				hash += parseInt(int, 10);
				hash += (hash << 10)>>>1;
				hash ^= (hash >>> 6);
				hash = hash<<1 >>>1;
			})
			hash += hash << 3;
			hash ^= hash >>> 11;
			hash += hash << 15;
			hash = (hash >>>1) /// make it positive
			return hash
		}
		return {person:hashPerson,string:hashString,list:hashList}
	})()

	this.Relationships = (function(){ //// 2.3 This is a Module for managing many-to-many relationships.
		//// Currently used only for authors & references.
		var state = {};

		var add_rel = function(obj){
			var key0, key1, val1, val2;
			[key0, key1] = Object.keys(obj);
			[val0, val1] = [obj[key0], obj[key1]];
			if (!state.hasOwnProperty(key0)){state[key0] = {}};
			if (!state.hasOwnProperty(key1)){state[key1] = {}};
			if (!state[key0].hasOwnProperty(val0)){state[key0][val0] = {}};
			if (!state[key1].hasOwnProperty(val1)){state[key1][val1] = {}};
			if (!state[key0][val0].hasOwnProperty(key1)){state[key0][val0][key1] = []};
			if (!state[key1][val1].hasOwnProperty(key0)){state[key1][val1][key0] = []};
			state[key0][val0][key1].push(val1);
			state[key1][val1][key0].push(val0);
		}

		var rem_rel = function(obj){
			keys = Object.keys(obj)
			if (keys.length == 1){ //// delete an object, and all relationship pointing to object.
				var rels = state[keys[0]][obj[keys[0]]];
				Object.keys(rels).map(function(key){
					var items = rels[key]
					items.map(function(item){
						var index = state[key][item][keys[0]].indexOf(obj[keys[0]])
						state[key][item][keys[0]].slice(index, 1)
					})
				})
				delete state[keys[0]][obj[keys[0]]];
			} else if (keys.length == 2){ //// deletes a relationship - leaves objects intact
				try {
					var array = state[keys[0]][obj[keys[0]]][keys[1]]
					var index = array.indexOf(obj[keys[1]])
					array.slice(index, 1);
				} catch(e) {}
			}
		}
		var flush = function(){
			Object.keys(state).map(function(key){
				delete state[key];
			})
		}
		return {
			add:add_rel,
			remove:rem_rel,
			state:state,
			flush:flush
		}
	})()

	this.Util = (function(){ //// 2.4 Util module provides helper functions
		function check_list_equality(A, B){ //// http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
			if (A.length != B.length){
				return false
			}
			for (var i = 0, l=A.length; i < l; i++) {
			  // Check if we have nested arrays
			  if (A[i] instanceof Array && B[i] instanceof Array) {
				  // recurse into the nested arrays
				  if (!check_list_equality(A[i],B[i])){
					  return false;
						}
			  } else if (A[i] != B[i]) { 
				  // Warning - two different object instances will never be equal: {x:20} != {x:20}
				  return false;   
			  }           
			}
			return true;
		};

		function safeClone(obj){ /// preserves references to functions in lists.
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

		function applyInheritance(decorators, parentDecorators){
		/// comparable to Decoration.applyInheritance, but doesn't respect special key words.
			Object.keys(parentDecorators || {}).map(function(key){
				if (!decorators.hasOwnProperty(key)){
					decorators[key] = parentDecorators[key];	
				}
			});
			return decorators;
		};

		function setObjectId(State, obj, force) {
			var id, direction;
			if (!obj.id || force) {
				id = Math.floor(Math.random() * 100000000000000);
				while (true) {
				    direction = 0;
				    if (!State[id.toString(32)]) {
				        obj.id = id.toString(32);
				        break;
				    } else if (!direction && id < 50000000000000) {
				        direction = 1;
				    } else {
				        direction = -1;
				    }
				    if (direction === 1) {
				        id += 1;
				    } else {
				        id += -1;
					}
				}
				obj.id = id;
			}
			State[obj.id] = obj;
			return obj;
		};

		function inferDataType(data){
			var jstype = typeof(data);
			if (jstype == "string") {
				return "text";
			} else if (jstype == "number") {
				return "number";
			} else if (Array.isArray(data)){
				if (data.length){
					if (data[0].hasOwnProperty("family")){
						return "names";
					} else {
						return "date";
					}
				} else {
					return undefined
				}
			} else {
				return undefined;
			}		
		}

		function inferDataType(key){ 	//// variable data-types are not declared in "sort" context. This is most reliable way to infer the datatype in that situation.
			if (self.CSL.NUMBER_VARIABLES.indexOf(key) > -1){
				return "number";
			} else if (self.CSL.NAME_VARIABLES.indexOf(key) > -1){
				return "names";
			} else if (self.CSL.DATE_VARIABLES.indexOf(key) > -1){
				return "date";
			} else {
				return "text";
			}
		}

		function intToLowerCase (int){ //// used for year-suffixes
			int = int+1; /// "a" starts at 0.
			if (int < 26){
				return String.fromCharCode(int+96)
			} else {
				var i = 1;
				var string = "";
				var current = 1;
				var next = 26;
				while ((current <= int) || (i == 1)){
					string = String.fromCharCode(((int % next) / current) + 96) + string;
					i++;
					var current = next;
					var next = Math.pow(26, i);
				}
				return string;
			}
		}

		function lowerCaseToInt(string){ //// used for year-suffixes
			var ret = 0;
			for (var i = 0; i < string.length; i++){
				var num = string.charCodeAt(i) - 96;
				var power = string.slice(i).length - 1;
				var base = Math.pow(26, power);
				ret = ret + (num * base);
			}
			return ret-1; /// "a" starts at 0.
		}

		return {check_list_equality:check_list_equality,clone:safeClone, applyInheritance:applyInheritance, setObjectId:setObjectId, inferDataType:inferDataType, intToLowerCase:intToLowerCase, lowerCaseToInt:lowerCaseToInt};
	}).call(this);


	(function CSLXMLModule(){ //// 2.5  It parses CSL XML styles, and converts the XML tree into a JSON-tree structure. See State.CSLJSON for output.
		//// CSLXML creates an intermediate object between the raw XML, and the token objects that actually render the items.

		this.CSL.XML = (function XMLParser () { ///// 2.5.1 CSL.XML is the XML parser. This module is taken directly from citeproc-js.
			function _listifyString(str) {
				str = str.split(/(?:\r\n|\n|\r)/).join(" ").replace(/>[	 ]+</g, "><").replace(/<\!--.*?-->/g, "");
				var lst = str.split("><");
				var stylePos = null;
				for (var i=0,ilen=lst.length;i<ilen;i++) {
					if (i > 0) {
					    lst[i] = "<" + lst[i];
					}
					if (i < (lst.length-1)) {
					    lst[i] = lst[i] + ">";
					}
					if ("number" != typeof stylePos) {
					    if (lst[i].slice(0, 7) === "<style " || lst[i].slice(0, 8) == "<locale ") {
					        stylePos = i;
					    }
					}
				}
				lst = lst.slice(stylePos);
				for (var i=lst.length-2;i>-1;i--) {
					if (lst[i].slice(1).indexOf("<") === -1) {
					    var stub = lst[i].slice(0, 5);
					    if (stub === "<term") {
					        if (lst[i+1].slice(0, 6) === "</term") {
					            lst[i] = lst[i] + lst[i+1];
					            lst = lst.slice(0, i+1).concat(lst.slice(i+2));
					        }
					    } else if (["<sing", "<mult"].indexOf(stub) > -1) {
					        if (lst[i].slice(-2) !== "/>" && lst[i+1].slice(0, 1) === "<") {
					            lst[i] = lst[i] + lst[i+1];
					            lst = lst.slice(0, i+1).concat(lst.slice(i+2));
					        }
					    }
					}
				}
				return lst;
			}
			function _decodeHtmlEntities(str) {
				return str
					.split("&amp;").join("&")
					.split("&quot;").join("\"")
					.split("&gt;").join(">").split("&lt;").join("<")
					.replace(/&#([0-9]{1,6});/gi, function(match, numStr) {
					    var num = parseInt(numStr, 10); // read num as normal number
					    return String.fromCharCode(num);
					})
					.replace(/&#x([a-f0-9]{1,6});/gi, function(match, numStr){
					    var num = parseInt(numStr, 16); // read num as hex
					    return String.fromCharCode(num);
					});
			}
			function _getAttributes(elem) {
				var m = elem.match(/([^\'\"=	 ]+)=(?:\"[^\"]*\"|\'[^\']*\')/g);
				if (m) {
					for (var i=0,ilen=m.length;i<ilen;i++) {
					    m[i] = m[i].replace(/=.*/, "");
					}
				}
				return m;
			}
			function _getAttribute(elem, attr) {
				var rex = RegExp('^.*[	 ]+' + attr + '=(\"(?:[^\"]*)\"|\'(?:[^\']*)\').*$');
				var m = elem.match(rex);
				return m ? m[1].slice(1, -1) : null;
			}
			function _getTagName(elem) {
				var rex = RegExp("^<([^	 />]+)");
				var m = elem.match(rex);
				return m ? m[1] : null;
			}
			function _castObjectFromOpeningTag(elem) {
				var obj = {};
				obj.name = _getTagName(elem);
				obj.attrs = {};
				var attributes = _getAttributes(elem);
				if (attributes) {
					for (var i=0,ilen=attributes.length;i<ilen;i++) {
					    var attr = {
					        name: attributes[i],
					        value: _getAttribute(elem, attributes[i])
					    }
					    obj.attrs[attr.name] = _decodeHtmlEntities(attr.value);
					}
				}
				obj.children = [];
				return obj;
			}
			function _extractTextFromCompositeElement(elem) {
				var m = elem.match(/^.*>([^<]*)<.*$/);
				return _decodeHtmlEntities(m[1]);
			}
			function _appendToChildren(stack, obj) {
				stack.slice(-1)[0].push(obj);
			}
			function _extendStackWithNewChildren(stack, obj) {
				stack.push(obj.children);
			}
			function _processElement(stack, elem) {
				var obj;
				if (elem.slice(1).indexOf('<') > -1) {
					var tag = elem.slice(0, elem.indexOf('>')+1);
					obj = _castObjectFromOpeningTag(tag);
					obj.children = [_extractTextFromCompositeElement(elem)];
					_appendToChildren(stack, obj);
				} else if (elem.slice(-2) === '/>') {
					obj = _castObjectFromOpeningTag(elem);
					if (_getTagName(elem) === 'term') {
					    obj.children.push('');
					}
					_appendToChildren(stack, obj);
				} else if (elem.slice(0, 2) === '</') {
					stack.pop();
				} else {
					obj = _castObjectFromOpeningTag(elem);
					_appendToChildren(stack, obj)
					_extendStackWithNewChildren(stack, obj);
				}
			}

			function parseXML(str) {
				var _pos = 0;
				var _obj = {children:[]};
				var stack = [_obj.children];
				var lst = _listifyString(str);
				for (var i=0,ilen=lst.length;i<ilen;i++) {
					var elem = lst[i];
					_processElement(stack, elem);
				}
				return _obj.children[0];
			};

			return {parse:parseXML};
		}).call(this);

		this.CSL.Tree = (function NodeTree(){ /// 2.5.2 CSL.Tree has functions for navigating CSL nodes in its intermediate JSON-tree structure.
			var getNodesByName = function(myjson,name,nameattrval,ret){
				var nodes, node, pos, len;
				if (!ret) {
					var ret = [];
				}
				if (!myjson || !myjson.children) {
					return ret;
				}
				if (name === myjson.name) {
					if (nameattrval) {
						if (nameattrval === myjson.attrs.name) {
						    ret.push(myjson);
						}
					} else {
						ret.push(myjson);
					}
				}
				for (var i=0,ilen=myjson.children.length;i<ilen;i+=1){
					if ("object" !== typeof myjson.children[i]) {
						continue;
					}
					getNodesByName(myjson.children[i],name,nameattrval,ret);
				}
				return ret;
			};

			var getNodeByNameAttribute = function (myjson,val) {
				var i, ilen;
				for (i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
					if (!myjson.children[i] || "string" === typeof myjson.children[i]) {
						continue;
					}
					if (myjson.children[i].attrs.name == val) {
						return myjson.children[i];
////// delete=> 	myjson.children = myjson.children.slice(0,i).concat(myjson.children.slice(i+1));
					}
				}
			}

			function childNodeLength(node){
				if (typeof(myjson)=="string"){ return 0; }
				if (node.hasOwnProperty('children')){
					return node.children.length;
				}
				return 0;
			};

			var getNodeValue = function (myjson,name) {
				var ret = "";
				if (name){
					myjson.children.map(function(child){
						if (child.name === name) {
						    if (child.children.length) {
						        ret = child;
						    } else {
						        ret = "";
						    }
						}
					})
				} else if (myjson) {
					ret = myjson;
				}
				if (ret && ret.children && ret.children.length == 1 && "string" === typeof ret.children[0]) {
					ret = ret.children[0];
				}
				return ret;
			};
			var numberofnodes = function (myjson) {
				if (myjson && "number" == typeof myjson.length) {
					return myjson.length;
				} else {
					return 0;
				}
			};
			var content = function (myjson) {
				var ret = "";
				if (!myjson || !myjson.children) {
					return ret;
				}
				for (var i=0, ilen=myjson.children.length; i < ilen; i += 1) {
					if ("string" === typeof myjson.children[i]) {
						ret += myjson.children[i];
					}
				}
				return ret;
			};
			var getAttributes = function (myjson) {
				var ret = {};
				for (var attrname in myjson.attrs) {
					ret["@"+attrname] = myjson.attrs[attrname];
				}
				return ret;
			};

			return {getNodesByName:getNodesByName, getNodeByNameAttribute:getNodeByNameAttribute, getNodeValue:getNodeValue,getAttributes:getAttributes,childNodeLength:childNodeLength};
		}).call(this);

		this.CSL.XML.retrieveXML = function retrieveXML(url, callback){ //// 2.5.3 user API to retrieve CSL XML data from a URL.
			//// This is the first function that uses the Tracks plugin architecture.
	        var xmldata = new XMLHttpRequest;
	        var contentType = 'text/xml';
			xmldata.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					callback(this.responseText.toString());
				}
			};
	        xmldata.open('GET', url, true);
	        xmldata.send(null);
		};
		

		function LoadCSL(){ ///// 2.5.4 this function creates the Public API for loading CSL styles and CSL locales
			this.State.CSLJSON = {}; //// contains cslXML for style, locale, & macros.

			function loadFallbackLocale(url){
				var fn = this.getFunction("loadFallbackLocale")
				fn(url);
			}
			function parseData(data, callback){
				return callback(this.CSL.XML.parse(data));
			}
			function saveStyle(object, callback){
				this.State.CSLJSON["style"] = object; /// We don't actually need to save the object, but it might help debugging.
				return callback(object);
			}
			function saveLocale(object, callback){
				this.State.CSLJSON["locale"] = object;
				return callback(object);
			}

			this.Plugin.register({name:"loadStyle.retrieveXML",fn:this.CSL.XML.retrieveXML, pre:"loadStyle.parseData"});
			this.Plugin.register({name:"loadStyle.parseData",fn:parseData});
			this.Plugin.register({name:"loadStyle.saveStyle",fn:saveStyle,post:"loadStyle.parseData"});

			this.Plugin.register({name:"loadLocale.retrieveXML",fn:this.CSL.XML.retrieveXML});
			this.Plugin.register({name:"loadLocale.parseData",fn:parseData,pre:"loadLocale.saveLocale"});
			this.Plugin.register({name:"loadLocale.saveLocale", fn:saveLocale, post:"loadLocale.retrieveXML"})	;	

			this.Public["loadStyle"] = function loadStyle(url){
				var fn = this.getFunction("loadStyle");
				return fn(url);
			}
			this.Public["loadLocale"] = function loadLocale(url){
				var fn = this.getFunction("loadLocale");
				return fn(url);
			}
			return""
		}
		LoadCSL.call(this)
	}).call(this)

	this.Builder  = (function TokenBuilder(){ //// 2.6 After converting xml to json, Builder converts that CSL-JSON into tokens.
		var self = this;
		//// Items can be rendered in the bibliogrphy context, or in the citation context.
		//// Within each context, there are sub-contexts for sorting ("sort"), and rendering ("tokens")
		this.Engine = {"bibliography":{rendertokens:[], sortTokens:[],opts:{}}, "citation":{renderTokens:[], sortTokens:[],opts:{}} }; // Engine is the container for ALL tokens. 

		var Token = function (name, tokentype) { //// the building block for rendering styles
			return {
				name:name, 
				strings:{}, 
				decorations:{}, 
				execs:[], 
				tokentype:tokentype, 
				tests:[]
			}
		};

		function cloneToken (token) { 
			var newtok, key, pos, len;
			if ("string" === typeof token) {
				return token;
			}
			newtok = Token(token.name, token.tokentype);
			for (key in token.strings) {
				if (token.strings.hasOwnProperty(key)) {
				    newtok.strings[key] = token.strings[key];
				}
			}
			if (token.decorations) {
				newtok.decorations = {};
				Object.keys(token.decorations).map(function(key, index){
					newtok.decorations[key] = token.decorations[key]
				})
			}
			if (token.variables) {
				newtok.variables = token.variables.slice();
			}
			if (token.execs) {
				newtok.execs = token.execs.slice();
				newtok.tests = token.tests.slice();
				newtok.rawtests = token.tests.slice();
			}
			if (token.tokens) {
				newtok.tokens = token.tokens.map(function(childTok){ return cloneToken(childTok)});
			}
			return newtok;
		};

		function NodeToToken (node, tokentype, buildObj, scopeObj) {
			var self = this;
			var name, attributes, token;
			name = node.name;
			if (buildObj.skip){ //// Skipping feature for development --> not safe.
				if (name != buildObj.skip){ //// Only node creating skip can turn off skip
					return;
				} else {
					buildObj.skip = false;
				}
			}
			if (!name) {
				return;
			}
			if (!self.CSL.Node[node.name]) { ////make sure node name is defined
				console.log(node, this.CSL.Node);
				throw "Undefined node name \"" + name + "\".";
			}
			attributes = self.CSL.Tree.getAttributes(node);
			token = Token(name, tokentype);			
			if (tokentype !== self.STATIC.END) {
				Object.keys(attributes).map(function(key, array){
					if (tokentype === self.STATIC.END && key !== "@language" && key !== "@locale") {
			            return;
			        }
		            if (self.CSL.Attributes[key]) { //// Add attribute functions & tests to token.
	                    self.CSL.Attributes[key].call(self, token, buildObj, "" + attributes[key]);
		            } else {
		                self.CSL.debug("warning: undefined attribute \""+key+"\" in style");
		            }
				})
			};
			var macro = self.CSL.Node[name].call(self, token, buildObj, scopeObj);/// Ony text.macro should return a value - scopeObj.children --> macros are thus transparent to engine.
			return (macro || token);
		};

		function buildMacro (node, buildObj, macroName){
			try {
				if (node.children.length){
					return node.children.map(function(childNode, index){
						return buildToken.call(self, childNode, buildObj);///iterate through children
					})
				}
			} catch(e){
				console.log("ERROR: style references an undefined macro: "+macroName); //// helluva problem to debug without this warning.
			}
		}

		function buildToken (node, buildObj) {
			if (typeof(node) == "string"){ //// handle text content of nodes.
				return {name:"content",value:node};
			}//// handle text content of nodes.
			if (node.name=="macro"){
				return "";
			}
			var scopeObj = {parent:node};
			var oldDecorations = buildObj.decorations;
			if (node.children.length > 0) {
			    var OpenTok = NodeToToken.call(self, node, self.STATIC.START, buildObj, scopeObj)//enterFunc
				if (OpenTok != undefined){ //// for nodes that are unrecognized by the processor
					self.Decoration.applyInheritance(OpenTok.decorations, buildObj.decorations); //// make sure that parent styling attributes apply to child elements
					buildObj.decorations = OpenTok.decorations
				}
				scopeObj["children"] = node.children.map(function(childNode, index){
				    return buildToken.call(self, childNode, buildObj);///iterate through children
				})
				scopeObj["open"] = OpenTok;
			    var CloseTok = NodeToToken.call(self, node, self.STATIC.END, buildObj, scopeObj)//leaveFunc
				buildObj.decorations = oldDecorations
				return [OpenTok, CloseTok]
			} else {
			    var SingleTok = NodeToToken.call(self, node, self.STATIC.SINGLETON, buildObj, scopeObj)//singtonFunc
				if (SingleTok != undefined){ //// for nodes that are unrecognized by the processor
					self.Decoration.applyInheritance(SingleTok.decorations, buildObj.decorations); //// make sure that parent styling attributes apply to element
				}
				return [SingleTok] //// non-macro singletons.
			}
		}

		function buildTokenList (nodes, buildObj) {
			buildToken.call(this, nodes, buildObj);
			return buildObj;
		};

		function buildCSL (CSLobject, callback){
			if (!self.CSL.Tree.getNodeValue(CSLobject)) return;
			var buildObj = { //// creates object that is passed as buildObj parameter.
				macros:{},
			};
			var macros = self.CSL.Tree.getNodesByName(CSLobject, "macro")
			macros.map(function(macro){
				buildObj.macros[macro.attrs.name] = macro;
			})
			return callback(buildTokenList.call(self, CSLobject, buildObj));
		}

		return {buildTokenList:buildTokenList, buildToken:buildToken, buildMacro:buildMacro, Token:Token, cloneToken:cloneToken, NodeToToken:NodeToToken, buildCSL:buildCSL}
	}).call(this);

	this.Decoration = (function(outputFormat){
		var self = this;
		API={};
//		EnglishArticles = ["a","an","the", "some"];
//		EnglishConjunctions = ["and","but","or","nor","for","besides"]
//		EnglishPrepositions = ["since","ago","before","past","till","until","by","on","beside", "next to", "under", "below","over","above","through","into","towards","onto","from","off","out of","aboard","about",   "above", "absent", "across","after","against", "along","alongside", "amid","among","anti","apud", "around", "as","astride", "at","bar", "before","behind","below", "beneath", "beside", "besides", "between", "beyond", "but", "by", "concerning", "considering", "despite", "down", "during", "except", "excepting", "excluding", "following", "for", "from", "in", "inside", "into", "like", "minus", "near","notwithstanding", "of", "off", "on", "onto", "opposite", "outside", "over", "past", "per", "plus", "regarding", "round", "save", "since", "than", "through", "throughout", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "via", "with", "within", "without", ]
//		var nps = [].concat(EnglishArticles, EnglishConjunctions, EnglishPrepositions);

		var SpanAttrs = {
			"@font-style/italic":["font-style","italic"],
			"@font-style/normal":["font-style",""],
			"@font-variant/small-caps": ["font-variant","small-caps"],
			"@font-variant/normal": ["font-variant",""],
			"@font-weight/bold": ["font-weight","bold"],
			"@font-weight/normal": ["font-weight",""],
			"@font-weight/light": ["font-weight",""],
			"@text-decoration/none": ["text-decoration",""],
			"@text-decoration/underline": ["text-decoration","underline"],
			"@vertical-align/sup": ["vertical-align","super"], //// no css property for superscript - so we also need to have font-size/smaller.
			"@vertical-align/sub": ["vertical-align","sub"],//// no css property for subscript
			"@font-size/smaller": ["font-size","smaller"],
			"@vertical-align/baseline": ["vertical-align","super"],
			"@font-size/normal": ["font-size:",""],
		}

		var TextCaseTransform = {
			"@text-case/normal":function(value){
				return value;
			},
			"@text-case/lowercase":function(value){
				return value.toLowerCase();
			},
			"@text-case/uppercase":function(value){
				return value.toUpperCase();
			},
			"@text-case/capitalize-first":function(value){ //// same as sentence case
				if (value.length){
					return value.slice(0,1).toUpperCase() + value.slice(1);
				}
				return value;
			},
			"@text-case/sentence":function(value){ //// same as capitalize-first case
				if (value.length){
					return value.slice(0,1).toUpperCase() + value.slice(1);
				}
				return value;
			},
			/*"@text-case/title":function(value){
				if (value.length){
					var array = value.split("-").map(function(word){
						if (TitleCaseExceptions.indexOf(word) == -1){ //// To do: a little expensive
							return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
						} else {
							return word
						}
					});
					value = array.join(" ");
					var array = value.split(" ").map(function(word){
						if (TitleCaseExceptions.indexOf(word) == -1){
							return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
						} else {
							return word
						}
					});
					return array.join(" ");
				}
				return value;
			},*/
			"@text-case/title":function(value){
				if (value.length){
					var array = value.split(" ").map(function(word){
						return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
					});
					return array.join(" ");
				}
				return value;
			},			
		}

		function applyInheritance(decorators, parentDecorators){
			Object.keys(parentDecorators || {}).map(function(key){
				if (!decorators.hasOwnProperty(key)){
					if ((key != "@strip-periods") && (key != "@text-case")){ ///// text-case and strip-periods cannot be inherited.
						decorators[key] = parentDecorators[key];	
					}
				}
			});
			return decorators;
		};

		function getDecorationList(value, decorators){ //// also applies text transformations
			var keys = Object.keys(decorators||{});
			var decorations = keys.reduce(function(array, key){
				if (key == "@text-case"){
					value = TextCaseTransform[key + "/" + decorators[key]](value);//// @text-case must be evaluated before other decorations.
				} else if (key == "@strip-periods"){
					if (decorators[key] == "true"){
						value = value.replace(/\./g, " ").replace(/\s+/g, " ").replace(/\s+$/,"");
					}
				} else {
					array.push(key + "/" + decorators[key]);
				}
				return array;
			},[])
			return [value, decorations.sort()];
		}

/*		API["html/DOM"] = function(value, decorators){
			if ((value == "") || (value==undefined)){ return "" }
			var span = HTMLTransform(value, decorators);
			if (span.hasAttribute("style")){
				return span
			} else {
				return span.children[0];
			}
		}*/

		function html(list){
			var inSpan = false;
			var result = list.reduce(function(array, tok){
				if (Array.isArray(tok)){
					var ret = ""
					if (inSpan){
						ret = '</span>'
					}
					var attrs = tok.reduce(function(attrs, attr){
						if (!SpanAttrs.hasOwnProperty(attr)){
							return attrs;
						} else if (SpanAttrs[attr][1] != ""){ //// If attr == default value for attr, don't add attr to span style.
							attrs = attrs+SpanAttrs[attr][0]+": "+SpanAttrs[attr][1]+"; ";
						}
						return attrs;
					},"")
					if (attrs.length){
						ret = ret+'<span style="'+attrs.trim()+'">';
						inSpan = true;
					} else {
						inSpan = false;
					}
					array.push(ret);
				} else if (typeof(tok) == "string"){
					array.push(tok);
				}
				return array;
			},[]);
			if (inSpan){/// sanity check
				result.push("</span>");
			}
			return result.join("");
		}

		function parentDecorate(token, valueList, execObj, newExecObj){
			execObj.decorations = execObj.decorations || [];
			valueList = valueList || [];
			if (valueList.length == 0){return valueList}
			var decorations
			var keys = Object.keys(execObj.decorators||{});
			var decorations = keys.reduce(function(array, key){
				if (key == "@text-case"){} else if (key == "@strip-periods"){} else {
					array.push(key + "/" + decorators[key]);
				}
				return array;
			},[]).sort()
			var result = [];
			/* No delimiter checking */
			var prefix = (token.strings.prefix||"");
			var suffix = token.strings.suffix || "";
			if (self.Util.check_list_equality(execObj.tailDecorations, execObj.decorations)){
				result.splice(0, 0, prefix);
			} else if (prefix != "") {
				result.splice(0, 0, execObj.decorations);
				result.splice(0, 0, prefix);
			}
			result = result.concat(valueList);
			execObj.tailDecorations = newExecObj.tailDecorations;
			if (self.Util.check_list_equality(execObj.tailDecorations, execObj.decorations)){
				result.push(suffix);
			} else if (suffix != "") {
				result.push(execObj.decorations);
				result.push(suffix);
				execObj.tailDecorations = execObj.decorations;
			}
			return result;
		}

		function decorate (value, strings, decorations, execObj){ 
			execObj.tailDecorations = execObj.tailDecorations || [];
			execObj.decorations = execObj.decorations || [];
			value = value || "";
			var delimiter = execObj.activeDelimiter || "";
			if (value == ""){return value}
			var decorations
			[value, decorations] = getDecorationList(value, decorations);
			var result = [];
			if (execObj.skipDelimiter){ /// use parent delimiter on first pass.
				if (self.Util.check_list_equality(execObj.tailDecorations, execObj.parent.decorations)){
					result.push(delimiter);

				} else if (delimiter != "") {
					result.push(execObj.parent.decorations);
					result.push(delimiter);
					execObj.tailDecorations = execObj.parent.decorations ;
				}
				var prefix = strings.prefix||"";
				execObj.skipDelimiter = false;
			} else {
				var prefix = delimiter + (strings.prefix||"");//prefix;
			}
			execObj.activeDelimiter = execObj.delimiter;
			var suffix = strings.suffix || "";
			if (self.Util.check_list_equality(execObj.tailDecorations, execObj.decorations)){
				result.push(prefix);
			} else if (prefix != "") {
				result.push(execObj.decorations);
				result.push(prefix);
				execObj.tailDecorations = execObj.decorations;
			}
			if (!self.Util.check_list_equality(decorations, execObj.tailDecorations)){
				result.push(decorations);
				execObj.tailDecorations = decorations;
			}
			result.push(value);
			if (self.Util.check_list_equality(decorations, execObj.decorations)){
				result.push(suffix);
			} else if (suffix != "") {
				result.push(execObj.decorations);
				result.push(suffix);
				execObj.tailDecorations = execObj.decorations;
			}
			return result;
		}

		if (outputFormat == undefined){
			outputFormat = "html/DOM";
		}


		//// Decoration module depends on the layout node to parse the output of Decorate.
		this.CSL.Blob.layout = function(token, source, context, execObj){ //// This is the first CSL.Blob function
			var newExecObj = execObj; 
			var result = [];
			token.decorations = token.decorations || [];
			var keys = Object.keys(token.decorations||{});
			var decorations = keys.reduce(function(array, key){
				if (key == "@text-case"){} else if (key == "@strip-periods"){} else {
					array.push(key + "/" + token.decorations[key]);
				}
				return array;
			},[]).sort()

			execObj.decorations = decorations;
			execObj.tailDecorations = decorations;

			if (decorations.length){
				result.push(decorations);
			} 
			if (token.strings.prefix){
				result.push(token.strings.prefix);
			}
			result = result.concat( this.Render.execTokens(token.tokens, self.Util.clone(source), context, newExecObj) );
			if (!self.Util.check_list_equality(newExecObj.tailDecorations, decorations)){
				result.push(decorations);
			}
			if (token.strings.suffix){
				result.push(token.strings.suffix);
			}
			return html(result);
			/// we don't trim() results. Components should not leave trailing whitespace, b/c that would cause almost impossible to detect errors when sorting by macro. Trimming must occur before this point.
		}
		this.CSL.Node.layout = function (token, buildObj, scopeObj) { //// This is the first CSL.Node function
			if (token.tokentype == this.STATIC.START){
				buildObj.decorations = self.Decoration.applyInheritance(token.decorations, buildObj.decorations);
				buildObj.subarea = "layout";
				token.toplevel = buildObj.tokens;
				buildObj.tokens.push(token)
				token.tokens = [];
				buildObj.tokens = token.tokens;
				if (buildObj.area == "citation"){
					token.strings.delimiter = token.strings.delimiter || "; "; // default layout delimiter is "; "
					this.Engine.citation.opts["delimiter"] = token.strings.delimiter;
				}
				token.execs.push(this.CSL.Blob.layout);
			} else if (token.tokentype == this.STATIC.END){
				buildObj.tokens = scopeObj.open.toplevel;
			}
		}

		return {applyInheritance:applyInheritance, decorate:decorate, html:html, getDecorationList:getDecorationList, parentDecorate:parentDecorate}
	}).call(this, "html/text");


	this.Render = (function RenderModule(){
		var self = this;

		function tokenExec (token, next, source, context, execObj) {
			if (token.test) {
				var result = token.test.call(this, source, context);
				if (result){
					next = token.succeed;
				} else {
					next = token.fail;
				}
			} else if (token.next){
				next = token.next; //// support for <else> statements
			} else {
				next++;
			}
			var result = token.execs.reduce(function(acc, fn){
				var rez = fn.call(self, token, source, context, execObj);
				if (rez != undefined){
					return acc.concat(rez);
				} else {
					return acc;
				}
			}, []);
			return [next, result];/// token.next overrides next --> enables conditional branching
		};
		function execTokens (tokens, source, context, execObj){
			var next = 0;
			var rez, result = [];
			while (next < tokens.length) {
				[next, rez] = tokenExec.call(self, tokens[next], next, source, context, execObj);
				result = result.concat(rez);
			}
			return result;
		}

		function renderCite (source, context, execObj){
			//// context is permanent (required for disambiguation)
			//// execObj is temporary (discarded at end of scope)
			context = context || {};
			context["nameVars"] = (context["nameVars"] || []);
			execObj = execObj || newExecObj(); /// accept execObj, b/c disambig needs to read it after.
			var area = execObj.area || context.area || "bibliography";
			var ret= execTokens(self.Engine[area].tokens, source, context, execObj).join("");
			return ret;
		}


		function newExecObj (){
			var execObj = {}; /// accept execObj, b/c disambig needs to read it after.
			execObj["disambig"] = {};
			execObj["tailDecorations"] = [];
			execObj["activeDelimiter"] = "";
			execObj["decorations"] = [];
			execObj["vars"] = [];
			execObj["outputs"] = {};
			execObj["nameVars"] = {};
			return execObj;
		}
		return {renderCite:renderCite, tokenExec:tokenExec, execTokens:execTokens, newExecObj:newExecObj}

	}).call(this);

}

function SecondOrderModules(){

	var self = this;

	(function InfoBuilder(){
		this.CSL.Node.info = function (token, buildObj, scopeObj) {
			if (token.tokentype === self.STATIC.START) {
			    buildObj.skip = "info";
			} else {
			    buildObj.skip = false;
			}
		};
	}).call(this);

	this.Match = (function () { //// functions for synthesizing test conditions within a style.
		var API = {};
		API.merge = function (tests, match){
			return API[(match || "all")](tests); /// "all" is default match test
		};
		API.any = function (tests) {
			return function (Item, item) {
			    for (var i=0, ilen=tests.length; i < ilen; i += 1) {
			        var result = tests[i](Item, item);
			        if (result) {
			            return true;
			        }
			    }
			    return false;
			};
		};
		API.none = function (tests) {
			return function (Item, item) {
			    for (var i=0,ilen=tests.length;i<ilen;i+=1) {
			        var result = tests[i](Item,item);
			        if (result) {
			            return false;
			        }
			    }
			    return true;
			};
		};
		API.all = function (tests) {
			return function (Item, item) {
			    for (var i=0,ilen=tests.length;i<ilen;i+=1) {
			        var result = tests[i](Item,item);
			        if (!result) {
			            return false;
			        }
			    }
			    return true;
			};
		};
		API[undefined] = API.all;
		API[""] = API.all;
		API.nand = function (tests) {
			return function (Item, item) {
			    for (var i=0,ilen=tests.length;i<ilen;i+=1) {
			        var result = tests[i](Item,item);
			        if (!result) {
			            return true;
			        }
			    }
			    return false;
			};
		};
		return API;
	})();

	this.Style = (function StyleBuilder(){
		var self = this;
		var state = {opt:{}, dataTypes:{}, variables:{}};
		var flush = function(){
			Object.keys(state).map(function(key){
				Object.keys(state[key]).map(function(subkey){
					delete state[key][subkey];
				})
			})
		}

		self.Plugin.register({name:"loadStyle.buildStyle",fn:self.Builder.buildCSL, post:"loadStyle.saveStyle"});

		function setOpt(key, val){
			state.opt[key] = val;
		}

		function getOpt(key){
			return state.opt[key];
		}
		function registerVariable(token){
			if (self.CSL.DATATYPES.indexOf(token.name) == -1){ //// check registered types. This will exclude "variable" attributes on condition nodes.
				return
			}
			var dataType = token.name;
			if (state.dataTypes[dataType] == undefined){
				state.dataTypes[dataType] = []
			}
			token.variables.map(function(varname){
				if (state.variables[varname] == undefined){
					state.variables[varname] = token.name;
				}
				if (state.variables[varname] != token.name){
					console.log("ERROR: two datatypes" + state.variables[varname] + "," + token.name + "are assigned to variable '" + varname + "'");
				} else if (state.dataTypes[dataType].indexOf(varname) == -1){
					state.dataTypes[dataType].push(varname);
				}
			})

		}

		function typeByVar(varname){
			return state.variables[varname];
		}
		function varsByType(dataType){
			return state.dataTypes[dataType] || [];
		}

		this.CSL.Node.style = function (token, buildObj) {
			if (token.tokenType == self.STATIC.START){
				buildObj.area = "style";
			} else {
				if (this.Style.getOpt("demote-non-dropping-particle") == undefined){
					this.Style.setOpt("demote-non-dropping-particle", this.STATIC.NEVER);
				}
			}
		};

		return {
			setOpt:setOpt,
			getOpt:getOpt,
			registerVariable:registerVariable,
			dataType:typeByVar,
			varsByType:varsByType,
			typeByVar:typeByVar,
			flush:flush,
		}
	}).call(this);


	this.Locale = (function LocaleBuilder(){
		var self = this;
		var State = {};
		var Primary, Secondary;
		function flush(){
			State = {};
		}

		////// Flow for retrieving normal locale term value ///////
		function retrieveLanguage(langCode, name, form, number, lastTried){
			try {
				return retrieveTerm(State[langCode], name, form, number);
			} catch(e) {
				if ((langCode != self.Locale.Primary) && (lastTried == undefined)){
					return retrieveLanguage(self.Locale.Primary, name, form, number, langCode);
				} else if (langCode == self.Locale.Primary){ 
					return retrieveLanguage(self.Locale.Secondary, name, form, number, langCode);
				} else {
					return ""; /// If there is no value, return empty string. See http://docs.citationstyles.org/en/stable/specification.html#id32
				}
			}
		}
		function retrieveTerm(langObj, name){
			try {
				return langObj.terms[name];
			} catch(e) {
				throw "term is not defined for locale." //// 
			}
		}

		function getOrdGender(obj, params){
			var gender = params.gender || "neuter";
			if (obj.hasOwnProperty(gender)){
				return obj[gender]
			} else if (obj.hasOwnProperty("neuter")){
				return obj["neuter"];
			} else if (obj.hasOwnProperty("masculine")){
				return obj["masculine"];
			} else if (obj.hasOwnProperty("feminine")){
				return obj["feminine"];
			} else {
				return ""
			}
		}

		function getOrdMatchType(obj, number, params){
			if (obj.hasOwnProperty("whole-number")){
				if (obj["whole-number"].hasOwnProperty(number)){
					return getOrdGender(obj["whole-number"][number], params);
				}
			}
			number = number.slice(-2);
			if (obj.hasOwnProperty("last-two-digits")){
				if (obj["last-two-digits"].hasOwnProperty(number)){
					return getOrdGender(obj["last-two-digits"][number], params);
				}
			}
			number = "0"+number.slice(-1);
			try {
				if (obj["last-digit"].hasOwnProperty(number)){
					return getOrdGender(obj["last-digit"][number], params);
				}
			} catch(e){
				console.log("Error: calling for 'ordinal' form without defining generic oridinal values in locale.")
			}
			return getOrdGender(obj["last-digit"]["default"], params);
		}

		function getOrdinalValue(number, params, lang){
			if (number.length == 1){
				var number_string = "0"+number;
			} else {
				var number_string = "" + number;
			}
			var form = params.form || "short";
			if (form == "long"){
				if (State[lang].ordinals["long"].hasOwnProperty(number_string)){
					return getOrdGender(State[lang].ordinals["long"][number_string], params); /// return name
				}
			}
			return number + getOrdMatchType(State[lang].ordinals.short, number_string, params) /// add suffix to number.
		}

		function setPrimary(langCode){
			if (self.Locale.Secondary == undefined){ //// Demote current Primary to Secondary
				self.Locale.Secondary = self.Locale.Primary;
			}
			self.Locale.Primary = langCode;
		}
		function setSecondary(langCode){
			self.Locale.Secondary = langCode;
		}
		function initializeLanguage(langCode){
			if (!State.hasOwnProperty(langCode)){
				State[langCode]={
					terms:{},
					ordinals:{short:{},long:{}},
					options:{},
					dateFormat:{},
				}
			}
			if (Object.keys(State).length == 1){ //// Set to Primary if first Locale to load. We don't like Primary to be empty.
				self.Locale.Primary = langCode;
			}
		}
		function setTerm(token, langCode){
			if (token.strings.name.indexOf("ordinal")>-1){
				setOrdinal(token, langCode);
				return;
			}
			if (!State[langCode].terms.hasOwnProperty(token.strings.name)){
				State[langCode].terms[token.strings.name] = {};
			}
			var term = State[langCode].terms[token.strings.name];
			var form = token.strings.form || "long"; /// ["long", "short", "verb", "verb-short", "symbol"]
			if (!term.hasOwnProperty(form)){
				term[form] = {}
			}
			if (token.strings.gender != undefined){
				term["gender"] = token.strings.gender;
			}
			if (token.strings.value){ /// if only one form
				term[form] = token.strings.value;
			} else { /// if has plural & singular form
				term[form]["single"] = token.strings.single;
				term[form]["multiple"] = token.strings.multiple;
			}
		}
		function setOrdinal(token, langCode){
			var ordinalParts = token.strings.name.split("-"); // up to 2 dashes in ordinal term name.
			if (ordinalParts[0] == "long"){
				var form = ordinalParts.shift(); /// == "long" "short" form.
			} else {
				var form = "short";
			}
			var matchType = token.strings["match"] || "last-digit"; /// ["last-digit","last-two-digits","whole-number"]
			if (ordinalParts.length > 1){
				var number = ""+ordinalParts.pop();
			} else {
				var number = "default";
			}
			var genderForm = token.strings["gender-form"] || "neuter"; /// ["masculine, feminine, neuter"] // assigns gender transformation to ordinal terms.
			if (form == "long"){
				if (!State[langCode].ordinals.long.hasOwnProperty(number)){
					State[langCode].ordinals.long[number]={}
				}
				State[langCode].ordinals.long[number][genderForm] = token.strings.value;
			} else { /// form == "short"
				if (!State[langCode].ordinals[form].hasOwnProperty(matchType)){
					State[langCode].ordinals[form][matchType]={};
				}
				if (!State[langCode].ordinals[form][matchType].hasOwnProperty(number)){
					State[langCode].ordinals[form][matchType][number] = {};
				}
				State[langCode].ordinals[form][matchType][number][genderForm] = token.strings.value;
			}
		}

		function getPluralForm(term, plural){
			if (typeof(term) == "string"){
				return term;
			} else if (plural == true){	
				return term.multiple;
			} else { /// plural == false
				return term.single;
			}
		}

		function getForm(term, form, plural){
			if (term.hasOwnProperty(form)){
				return getPluralForm(term[form], plural);
			} else {
				if (form == "long"){
					return ""
				} else if (form == "short"){
					return getForm(term, "long", plural);
				} else if (form == "verb"){
					return getForm(term, "long", plural);
				} else if (form == "verb-short"){
					return getForm(term, "verb", plural);
				} else if (form == "symbol"){
					return getForm(term, "short", plural);
				} else {
					return getForm(term, "long", plural);
				}
			}
		}

		function getTerm(name, params, langCode){
			//// Get parameters or assign default.
			if (params == undefined){params={}}
			if (langCode == undefined){langCode = self.Locale.Primary}
			var term = retrieveLanguage(langCode, name) || "";
			var form = params.form || "long";
			var plural = params.plural || self.CSL.WAIT;
			return getForm(term, form, plural)
		}
		function getTermGender(name, langCode){
			//// Get parameters or assign default.
			if (langCode == undefined){langCode = self.Locale.Primary}
			var term = retrieveLanguage(langCode, name);
			if (term == undefined){
				return "";
			}
			return term.gender;
		}
		function getOrdinal(number, params, langCode){
			if (params == undefined){params = {};}
			if (langCode == undefined){langCode = self.Locale.Primary}
				return getOrdinalValue(""+number, params, langCode); //// return number spelled out.s
		}
		function setOption(key, val, langCode){
			State[langCode].options[key]=val;
		}
		function getOption(key, langCode){
			var lang = langCode || self.Locale.Primary;
			return State[lang].options[key]
		}
		function setDateFormat(form, token, langCode){
			State[langCode].dateFormat[form] = token;
		}
		function getDateFormat(form, langCode){
			var lang = langCode || self.Locale.Primary;
			return State[lang].dateFormat[form];
		}

		(function(){
			self.CSL.Attributes["@form"] = function (token, buildObj, arg) {
				token.strings.form = arg;
			};
			self.CSL.Attributes["@xml:lang"] = function (token, buildObj, arg) { //// locale
				token.lang = arg;
				if (token.name == "style"){
					this.Style.setOpt("xml:lang", arg);
				} //else if (token.name == "locale"){
//					this.Locale.initializeLanguage(arg); //// already initialized in CSL.Node.locale
//				}
			};
			self.CSL.Attributes["@lang"] = self.CSL.Attributes["@xml:lang"];
			self.CSL.Attributes["@default-locale"] = function (token, buildObj, arg) { //// locale
				if (token.tokentype== self.STATIC.START){
					this.Locale.setPrimary(arg);
				}
			};
			self.CSL.Attributes["@term"] = function (token, buildObj, arg) { //// only on <text> nodes
				if (arg === "sub verbo") {
					token.strings.term = "sub-verbo";
				} else {
					token.strings.term = arg;
				}
			};
			self.CSL.Attributes["@gender"] = function (token, buildObj, arg) {
				token.strings.gender = arg;
			};
			self.CSL.Attributes["@gender-form"] = function (token, buildObj, arg) {
				token.strings["gender-form"] = arg;
			};
			self.CSL.Node.locale = function (token, buildObj, scopeObj) {
				if (token.tokentype === self.STATIC.START) {
					if (token.lang == "undefined"){
						token.lang = "en-US";
					}
					buildObj.tokens = [];
					buildObj.area = "locale";
					buildObj.lang = token.lang;
					initializeLanguage(token.lang);
				} else if (token.tokentype === self.STATIC.END) {
/*					if (this.Engine["locales"] == undefined){
						this.Engine["locales"] = {};
					}
					if (this.Engine["locales"][scopeObj.open.lang]==undefined){
						this.Engine["locales"][scopeObj.open.lang] = {tokens:[],opt:{}};
					}
					this.Engine["locales"][scopeObj.open.lang].tokens = buildObj.tokens;
					buildObj.tokens = [];*/
					buildObj.area = ""
				}
			};
			self.CSL.Node["style-options"] = function(token, buildObj){
				if ((token.tokentype == self.STATIC.SINGLETON) || (token.tokentype == self.STATIC.END)){
					var limitDayOrdinals = token.strings["@limit-day-ordinals-to-day-1"];
//					var punctuation = token.strings["punctuation-in-quote"] || "false";
					if (limitDayOrdinals == "true"){limitDayOrdinals = true;} else {limitDayOrdinals=false}
					setOption("limit-day-ordinals-to-day-1", limitDayOrdinals, buildObj.lang);
//					setOption("punctuation-in-quote", punctuation, buildObj.lang);
				}	
			};
			self.CSL.Node.terms = function(token, buildObj){
				if (token.tokentype == self.STATIC.START){
					buildObj.tokens = []; //// create disposable target
				}
				if (token.tokentype == self.STATIC.END){// move locale terms from build area to permanent storage.
					while (buildObj.tokens.length > 0){
						var termToken = buildObj.tokens.shift();
						setTerm(termToken, buildObj.lang)
					}
				}
			};
			self.CSL.Node.term = function(token, buildObj, scopeObj){
				if ((token.tokentype == self.STATIC.SINGLETON) || (token.tokentype == self.STATIC.START)){
					buildObj.tokens.push(token);
				} else if (token.tokentype == self.STATIC.END){
					scopeObj.children.map(function(child){
						if (child.name == "content"){ //// text content
							scopeObj.open.strings.value = child.value;
						} else { //// <single> or <multiple>
							scopeObj.open.strings[child[1].name] = child[1].strings.value;
						}
					})
				}
			};
			self.CSL.Node.single = function(token, buildObj, scopeObj){
				if (token.tokentype == self.STATIC.END){
					scopeObj.children.map(function(child){
						token.strings.value = child.value;
						scopeObj.open.strings.value = child.value;
					})
				}
			};
			self.CSL.Node.multiple = function(token, buildObj, scopeObj){
				if (token.tokentype == self.STATIC.END){
					scopeObj.children.map(function(child){
						token.strings.value = child.value;
						scopeObj.open.strings.value = child.value;
					})
				}
			};
			self.CSL.Attributes["@limit-day-ordinals-to-day-1"] = function(token, buildObj, arg){
				token.strings["@limit-day-ordinals-to-day-1"] = arg;
			}

		})()

		function buildLocale(object, callback){
//			var langCode = self.CSL.Tree.getNodesByName(object, "locale")[0].attrs["xml:lang"];
			self.Builder.buildTokenList(object, "locale");
			return callback(object);
		}

		self.Plugin.register({name:"loadLocale.buildTokens", fn:self.Builder.buildCSL, post:"loadLocale.saveLocale"})

		return {
			initializeLanguage:initializeLanguage,
			getTerm:getTerm,
			getTermGender:getTermGender,
			setTerm:setTerm,
			getOrdinal:getOrdinal,
			setOrdinal:setOrdinal,
			getOption:getOption,
			setOption:setOption,
			getDateFormat: getDateFormat,
			setDateFormat: setDateFormat,
			Primary:Primary,
			Secondary:Secondary,
			setPrimary:setPrimary,
			setSecondary:setSecondary,
			flush:flush,
		}


	}).call(this);


	(function MacroNodeModule(){

		this.CSL.Node.macro = function (token, buildObj, scopeObj) { 

		};
		this.CSL.Attributes["@macro"] = function (token, buildObj, arg) {
			token.macro = arg;
		};
	}).call(this);

	function GroupNodeModule(){
		var self = this;
		function ParentNodeStart(token, buildObj){
			if (token.name == "name"){ ///// 
				/// save inherited styling for safe-keeping.
				token.inheritedDecorations = buildObj.decorations;
				/// apply parent styling to current token & to buildObj. buildObj will pass styling to children.
				buildObj.decorations = self.Decoration.applyInheritance(token.decorations, buildObj.decorations);
			}
			/* attach subsequent tokens to be children of this token. */
			token.priortokens = buildObj.tokens; /// save old token list
			if (token.tokens){
				buildObj.tokens = token.tokens;
			} else {
				buildObj.tokens = []; /// clean slate for child token list
				token.tokens = buildObj.tokens;
			}
		}
		function ParentNodeEnd(token, buildObj){
			buildObj.tokens = token.priortokens; // reset buildObj w/ prior toks from saved
			if (token.name == "name"){
				buildObj.decorations = token.inheritedDecorations; /// reset buildObj styling
			}
			token.tokens.map(function(tok){
				self.Decoration.applyInheritance(tok.decorations, token.decorations);
			});
			delete token.priortokens; /// cleanup to prevent hard to track bugs.

			delete token.inheritedDecorations;

		}

		function ParentBlobExecObj(token, execObj){

			/* apply styling from parent token to child tokens */
			var newExecObj = self.Util.clone(execObj);
			newExecObj.decorations = self.Decoration.getDecorationList("", token.decorations)[1];
			newExecObj.strings = token.strings || {};
			newExecObj.parent = execObj;
			newExecObj.delimiter = token.strings.delimiter;
			newExecObj.skipDelimiter = true;
			newExecObj.outputs = execObj.outputs;
			return newExecObj;
		}

		self.CSL.Blob.group = function GroupBlob(token, source, context, execObj){
			var newExecObj = ParentBlobExecObj.call(this, token, execObj); /// clone execObj
			var val = this.Render.execTokens(token.tokens, source, context, newExecObj);
			if (val.join("").length > 0){
				execObj.activeDelimiter = execObj.delimiter;
			}
			return this.Decoration.parentDecorate(token, val, execObj, newExecObj);
		}


		self.CSL.Node.group = function(token, buildObj, scopeObj){
			/// group is an implicit conditional
			if (token.tokentype == self.STATIC.START){
				ParentNodeStart.call(this, token, buildObj);

			} else if (token.tokentype == self.STATIC.END){
				ParentNodeEnd.call(this, scopeObj.open, buildObj);

				// Switcharoo: closing tok precedes opening tok
				buildObj.tokens.push(token); // add closing tok to parent tok list
				buildObj.tokens.push(scopeObj.open); // add opening tok to parent tok list on 1st
				scopeObj.open.execs.push(this.CSL.Blob.group); // 2nd tok to call blob

				/* <group> is implied conditional. Build conditions */
				var variables = [];
				scopeObj.open.tokens.map(function(tok){
					if (tok.hasOwnProperty("variables")){
						if (self.CSL.DATATYPES.indexOf(tok.name) > -1){
							variables = variables.concat(tok.variables);
						}
					}
				});
				if (variables.length){
			        this.CSL.Attributes["@variable"].call(self, token, buildObj, variables.join(" "));
					token.test = this.Match.merge(token.tests, "all");
					token.fail = buildObj.tokens.length;
					token.succeed = token.fail - 1;
				}
			}
		};
		this.Group = {ParentNodeStart:ParentNodeStart, ParentNodeEnd:ParentNodeEnd, ParentBlobExecObj:ParentBlobExecObj}

	}
	this.Plugin.registerModule(GroupNodeModule);

	(function FormattingAttributes(){
		this.CSL.Attributes["@font-variant"] = function (token, buildObj, arg) {
			token.decorations["@font-variant"] = arg;
		};
		this.CSL.Attributes["@font-weight"] = function (token, buildObj, arg) {
			token.decorations["@font-weight"] = arg;
		};
		this.CSL.Attributes["@font-style"] = function (token, buildObj, arg) {
			token.decorations["@font-style"] = arg;
		};
		this.CSL.Attributes["@text-decoration"] = function (token, buildObj, arg) {
			token.decorations["@text-decoration"] = arg;
		};
		this.CSL.Attributes["@text-case"] = function (token, buildObj, arg) {
			token.decorations["@text-case"] = arg;
		};
		this.CSL.Attributes["@vertical-align"] = function (token, buildObj, arg) {
			token.decorations["@vertical-align"] = arg;
			if (arg == "baseline"){
				token.decorations["@font-size"] = "normal";
			} else { /// "super" or "sub"
				token.decorations["@font-size"] = "smaller";
			}
		};
		this.CSL.Attributes["@suffix"] = function (token, buildObj, arg) {
			token.strings.suffix = arg;
		};
		this.CSL.Attributes["@prefix"] = function (token, buildObj, arg) {
			token.strings.prefix = arg;
		};
		this.CSL.Attributes["@delimiter"] = function (token, buildObj, arg) {
			token.strings.delimiter = arg;
		};

	}).call(this);

	(function MiscAttributes(){
		self.CSL.Attributes["@value"] = function (token, buildObj, arg) {
			token.strings.value = arg;
		};
		self.CSL.Attributes["@name"] = function (token, buildObj, arg) {
			token.strings.name = arg;
		};
		self.CSL.Attributes["@strip-periods"] = function (token, buildObj, arg) {
			token.decorations["@strip-periods"] = arg;
		};

		var registerUsedVariable = function (token, source, context, execObj){ //// useful for <substitute> elements; not used by <group> elements
			if (token.name == "names"){
				token.variables.map(function(variable){
					if (source.hasOwnProperty(variable)){
//						if (execObj["vars"] == undefined){
//							execObj["vars"] = [];
//						}
						execObj.vars.push(variable);
						if (execObj["nameVars"] == undefined){ /// nameVars is essential for disambig.
							execObj["nameVars"] = {};
						}
						if (execObj.nameVars[variable] == undefined){
							execObj.nameVars[variable] = token;//.tokens.filter(function(tok){return tok.name == "name"})[0];
						}
					}
				})
			} else if (source.hasOwnProperty(token.variables[0])){
				var variable = token.variables[0];
				if (token.variables[0] != ""){
//					if (execObj["vars"] == undefined){
//						execObj["vars"] = [];
//					}
					if (execObj.vars.indexOf(variable) == -1){
						execObj.vars.push(token.variables[0])
					}
				}
			}
		}

		self.CSL.Attributes["@variable"] = function (token, buildObj, arg) {
			token.variables = arg.split(/\s+/);
			token.variable = token.variables[0];
			this.Style.registerVariable(token);
			var varType = token.name
			if ("label" === this.name && this.variables[0]) {
				this.strings.term = this.variables[0];
			} else if (["names", "date", "text","number"].indexOf(token.name) > -1) {
				token.execs.push(registerUsedVariable);
			} else if (["if", "else-if", "condition","group"].indexOf(token.name) > -1) {
		
				var maketest_variable = function (variable) {
				    return function(source, context){
				        var myitem = source;
				        if (source && ["locator", "locator-extra", "locator-date"].indexOf(variable) > -1) {
				            myitem = context;
				        }
				        if (variable === "hereinafter" && state.sys.getAbbreviation && myitem.id) {
				            if (state.transform.abbrevs["default"].hereinafter[myitem.id]) {
				                return true;
				            }
				        } else if (myitem[variable]) {
				            if ("number" === typeof myitem[variable] || "string" === typeof myitem[variable]) {
				                return true;
				            } else if ("object" === typeof myitem[variable]) {
				                for (key in myitem[variable]) {
				                    if (myitem[variable][key]) {
				                        return true;
				                    }
				                }
				            }
				        }
				        return false;
				    }
				}
				var tests = [];
				for (var i=0;i<token.variables.length;i+=1) {
					tests.push(maketest_variable(token.variables[i]));
				}
				token.tests.push(this.Match.any(tests));
			}
		};


	}).call(this);

	this.Sorting = (function(){
		var self = this;

		var strcmp_opts = {
			sensitivity:"base",
			ignorePunctuation:true,
			numeric:true
	   	}
/*		function strip_prepositions(str){
			var m;
			if ("string" === typeof str) {
				m = str.toLocaleLowerCase();
				m = str.match(/^((a|an|the)\s+)/);
			}
			if (m) {
				str = str.substr(m[1].length);
			}
			return str;
		}

		function flatten(arr){ /// for cite order with cluster array
			return array.reduce(function(result, cluster){
				return result.concat(cluster.cites)
			}, []);
		};*/

		function mergeTokenTests(token, a, b){
			var len = token.execs.length;
			for (var i=0; i < len; i++){
				var ret = token.execs[i].call(self, token, a, b);
				if (ret != 0){
					return ret * token.sortOrder;
				}
			}
			return 0;
		};

		function compareNumbers(a, b, locale, strcmp_opts){
			var intA = parseInt(a);
			var intB = parseInt(b);
			if (!isNaN(intA)){
				if (!isNaN(intB)) {
					if (intA != intB){ /// if same parseInt value, continue to following comparison
						return intA - intB;
					}
				} else {
					return -1;
				}
			} else if (!isNaN(intB)){
				return 1;
			}
			var strA = a + " ";
			var strB = b + " ";
			var len = Math.floor(strA.length, strB.length);
			return strA.slice(0, len).localeCompare(strB.slice(0, len), locale, strcmp_opts);
		}

		function sort (sortTokens, Items){
			if (!(sortTokens[0]) || !(sortTokens[0].vartype)){
				sortTokens.map(function(token){
					if (token.variables){
						token.vartype = self.Style.dataType(token.variables[0]);
					}
					if ((token.vartype == undefined) && !(token.macro)){
						token.vartype = self.Util.inferDataType(token.variables[0]);
					}
				})
			}
			var len = sortTokens.length;
			Items.sort(function(a, b){
				var index = 0;
				var ret = 0;
				while (ret == 0){
					if (index < len){
						if (self.CSL.REFERENCEVARIABLES.indexOf(sortTokens[index].variable) > -1){
							var variable = sortTokens[index].variable
							var A = self.State.Sources[a];
							var B = self.State.Sources[b];
							ret = mergeTokenTests(sortTokens[index], A, B);
							console.log(variable, A[variable], B[variable], ret);
						} else {
							var A = self.State.Sources[a].bibliography;
							var B = self.State.Sources[b].bibliography;
							ret = mergeTokenTests(sortTokens[index], A, B);
						}
						index++;
					} else {
						break;
					}
				}
				return ret;
			})
		}

		function sortCites (sortTokens, Items){
			if (!(sortTokens[0]) || !(sortTokens[0].vartype)){
				sortTokens.map(function(token){
					if (token.variables){
						token.vartype = self.Style.dataType(token.variables[0]);
						if (!token.vartype){
							token.vartype = self.Util.inferDataType(token.variables[0]);
						}
					}
				})
			}
			var len = sortTokens.length;
			Items.sort(function(a, b){
				var index = 0;
				var ret = 0;
				while (ret == 0){
					if (index < len){
						if (self.CSL.REFERENCEVARIABLES.indexOf(sortTokens[index].variable) > -1){
							var A = self.State.Sources[a.source];
							var B = self.State.Sources[b.source];
							ret = mergeTokenTests(sortTokens[index], A, B);
						} else if (self.CSL.CITEVARIABLES.indexOf(sortTokens[index].variable) > -1) {
							ret = mergeTokenTests(sortTokens[index], a, b);
						} else {
							var A = self.State.Sources[a.source].bibliography;
							var B = self.State.Sources[b.source].bibliography;
							ret = mergeTokenTests(sortTokens[index], A, B);
						}
						index++;
					} else {
						break;
					}
				}
				return ret;
			})
		}

		function compareNames(nameListA, nameListB, locale){
			var nonDropping = self.Style.getOpt("demote-non-dropping-particle");
			if (nonDropping == self.STATIC.NEVER){
				var nameParts = ['non-dropping-particle','family','given','dropping-particle','suffix'];
			} else {
				var nameParts = ['family','given','dropping-particle','non-dropping-particle','suffix'];
			}
			var textA = nameListA.map(function(nameID){
				var name = self.State.Names.Persons[nameID] || nameID;	/// nameID for fallback; assumes noramlized name format.
				return nameParts.reduce(function(acc, namePart){
					if ((name[namePart] || "") !== ""){
						acc.push(name[namePart]);
					}
					return acc;
				}, []).join(" ");
			}).join(" ");
			var textB = nameListB.map(function(nameID){
				var name = self.State.Names.Persons[nameID] || nameID;
				return nameParts.reduce(function(acc, namePart){
					if ((name[namePart] || "") !== ""){
						acc.push(name[namePart]);
					}
					return acc;
				}, []).join(" ");
			}).join(" ");
			return textA.localeCompare(textB, locale, strcmp_opts);
		}

		function compareDates(date1, date2){
			var parts = ["year","month","day"]
			for (var i = 0; i < 2; i++) {
				var ret = parseInt((date1[0] || {})[parts[i]] || 0) - parseInt((date2[0] || {})[parts[i]] || 0);
				if (ret > 0){
					return 1;
				} else if (ret < 0){
					return -1;
				}
			}
			if ((date1.length === date2.length) && (date1.length === 1)){
				return 0;
			}
			for (var i = 0; i < 2; i++) {
				var ret = parseInt((date1[1] || {})[parts[i]] || 0) - parseInt((date2[1] || {})[parts[i]] || 0);
				if (ret > 0){
					return 1;
				} else if (ret < 0){
					return -1;
				}
			}
			return 0;
		}

		function compareVariableValues(token, itemA, itemB, locale){			
			var varname = token.variable;
			var datatype = token.vartype;
			if (token.domain == self.STATIC.BIBLIOGRAPHYVAR){
				var idA = (itemA.source || itemA.id); /// (cite or reference)
				var idB = (itemB.source || itemB.id); /// (cite or reference)
				itemA = self.State.Sources[idA].bibliography;
				itemB = self.State.Sources[idB].bibliography;
			}
			if (datatype == "text"){
				return (itemA[varname] || "").localeCompare(itemB[varname], locale, strcmp_opts);
			} else if (datatype == "number") {
				return compareNumbers(itemA[varname], itemB[varname], locale, strcmp_opts);
			} else if (datatype == "date"){
				return compareDates((itemA[varname] || []), (itemB[varname] || []), locale);
			} else if (datatype == "names"){
				return compareNames((itemA[varname] || []), (itemB[varname] || []), locale);
			} else {
				return (itemA[varname] || "").localeCompare(itemB[varname], locale, strcmp_opts);
			}
		}


		function compareMacroOutputs(token, itemA, itemB, locale){
			var idA = (itemA.source || itemA.id); /// (cite or reference)
			var idB = (itemB.source || itemB.id); /// (cite or reference)
			itemA = self.State.Sources[idA].bibliography;
			itemB = self.State.Sources[idB].bibliography;
			var context = {area:token.strings.area};
			var execObj = this.Render.newExecObj();
			var textA = self.Render.execTokens(token.children, itemA, context, execObj).join("");
			var execObj = this.Render.newExecObj();
			var textB = self.Render.execTokens(token.children, itemB, context, execObj).join("");
			return textA.localeCompare(textB, locale, strcmp_opts);
		}

		this.CSL.Node.sort = function (token, buildObj, scopeObj){
			if (token.tokentype == self.STATIC.START){
				buildObj.sort = {tokens:[]};
				buildObj.subarea = "sort";
				buildObj.sortVariables = [];
			}
			else if (token.tokentype == self.STATIC.END){
				//// clean up buildObj variables that have been set by <sort> attributes
				delete buildObj["names-min"];
				delete buildObj["names-first"];
				delete buildObj["names-use-last"];
			}
		};

		this.CSL.Node.key = function(token, buildObj, scopeObj){
			if (token.tokentype != self.STATIC.END){
				if (token.sortOrder == undefined){
					token.sortOrder = self.STATIC.ASCENDING;
				}
				if (token.variables){ /// key with variable
					var locale = buildObj.lang;
					if (self.CSL.CITEVARIABLES.indexOf(token.variable) > -1){
						token["domain"] = self.STATIC.CITEVAR;
					} else if (self.CSL.REFERENCEVARIABLES.indexOf(token.variable) > -1){
						token["domain"] = self.STATIC.REFERENCEVAR;
						if (token.variable.indexOf("number") > -1){ //// 
							token.vartype = "number";
						}
					} else {
						token["domain"] = self.STATIC.BIBLIOGRAPHYVAR;
					}
					token.execs.push(compareVariableValues);
				} else if (token.macro){ /// key with macro
					var oldTokens = buildObj.tokens
					token.strings.area = buildObj.area;
					buildObj.tokens = [];
					token.children = self.Builder.buildMacro(buildObj.macros[token.macro], buildObj, token.macro)[0];
					buildObj.tokens = oldTokens;
					token.execs.push(compareMacroOutputs);
				}
				if ((token.variable === "citation-number") && (buildObj.area === "bibliography")){
//					console.log(token.variable)
//					buildObj.sort.tokens.push(token);
				} else {
					buildObj.sort.tokens.push(token);
				}
			}
		};

		this.CSL.Attributes["@sort"] = function (token, buildObj, arg){
			if (arg == "descending"){
				token.sortOrder = self.STATIC.DESCENDING;
			} else {
				token.sortOrder = self.STATIC.ASCENDING;
			}
		}
		
		return {sort:sort, sortCites:sortCites, compareNumbers:compareNumbers};

	}).call(this);


	this.Sources = (function SourcesModule(){ 
		var self = this;
		var State = self.State["Sources"] = {};
		self.State.SourceIndex = [];
		function saveSource(source, callback){
			var obj = {bibliography:source, id:source.id};
			if (!State.hasOwnProperty(obj.id)){ /// if source object is new
				this.Util.setObjectId(State, obj);
				self.State.SourceIndex.push(obj.id);
			} else {
				this.Util.setObjectId(State, obj);/// saves new state; even if already has ID.

				if (self.Citation.Disambig.Ambigs.Keys[obj.id]){ // update disambig /// TODO: move to Disambig module

					//// We only have to clear data from Ambigs; we don't have to worry about Disambigs. Clearing out Ambigs will cause Disambigs to be written over.
					var output = self.Citation.Disambig.Ambigs.Keys[obj.id][0];
					var affectedSources = Object.keys(this.Citation.Disambig.Ambigs.Outputs[output]).map(function(sourceID){return sourceID});
					delete this.Citation.Disambig.Ambigs.Keys[obj.id];
					delete this.Citation.Disambig.Ambigs.Rules[obj.id];
					this.Citation.Disambig.Ambigs.Outputs[output] = {};
					affectedSources.map(function(sourceID){
						delete self.State.Sources[sourceID]["year-suffix"];
						delete self.State.Sources[sourceID]["year-suffix-variable"];
						delete self.Citation.Disambig.Ambigs.Keys[sourceID];
						delete self.Citation.Disambig.Ambigs.Rules[sourceID];
						self.Citation.Disambig.register({source:sourceID,"near-note":0,"position":0}, 0);
					})
				}
			}
			this.Sorting.sort(this.Engine.bibliography.sort.tokens, self.State.SourceIndex);
			return callback(source);
		}

		function clone(obj, callback){
			return callback(this.Util.clone(obj));
		}

		self.Plugin.register({name:"addSource.cloneSource",fn:clone}) // don't change any outside data!
		self.Plugin.register({name:"addSource.saveSource", fn:saveSource, post:"addSource.cloneSource"})
		self.Public["Source"]= {add:self.getFunction("addSource")} //// accepts sourceID

		return {index:self.State.SourceIndex, add:self.getFunction("addSource")}
	}).call(this);

	(function DisambiguationModule(){

		function execTest(collision, test, counter){ /// tests == intermediateTransformations; collision == CollisionKeeper().
			var output = collision.outputs()[0]; /// Should ONLY ever have 1 hash
			if (Object.keys(collision.Outputs[output]).length == 1){ /// no ambiguity
				return [collision.spawn(), collision];
			}
			//// If a disambiguation operation succeeds, we pass the new hash (which is the new citation)
			//// If a disambiguation operation fails, we revert to the prior hash --> thus undoing unsuccessful disambiguation transformation.
			//// If transformations were not possible, but ambiguities in the same scope have been disambiguated, 
			var changed = collision.spawn();
			var unchanged = collision.spawn();
			collision.getIDs(output).map(function(ID){
				var newOutput, newRules;
				[newOutput, newRules] = test(ID, self.Util.clone(collision.getRules(ID)), counter, output, collision); //// added collision parameter for add-year-suffix; in which transformation is relative to the other ambiguous cites.
				if (output == newOutput){ //// no transformation -> no possible future transformation --> add cite to finished object
					unchanged.add(ID, output, newRules);
				} else { //// possible future transformation 
					changed.add(ID, newOutput, newRules);
				}
			})
			return [changed, unchanged];
		}

		function intermediateTransformation(collision, tests, counter){
			if (tests.length==0){ /// no test
				return collision;
			}
			if (Array.isArray(tests[0])){
				return initTransform(collision, tests[0], 0);
			}
			var changed, unchanged;
			[changed, unchanged] = execTest(collision, tests[0], counter);
			function evalResult(changed, unchanged){
				if (changed.outputs().length == 0){ /// condition 1: no transformation & no disambiguation --> rollback changes.
					return collision;
				} else if ((changed.outputs().length == 1) && (unchanged.outputs().length == 0)){ //// condition 2: transformation occurred but no disambiguation --> possible rollback
					var result = intermediateTransformation(changed, tests.slice(1), counter);
					if (result.outputs().length == 1){ //// still no disambiguation, so rollback
						/// spawn new instance to check for higher counter.
						return collision.spawn(collision.outputs()[0]);
					} else { /* disambiguation, so apply changes*/
						unchanged.integrate(result);
						return unchanged;
					}
				} else { //// condition 3: disambiguation successful
					var result = changed.outputs().reduce(function(result, output){
						var partial = intermediateTransformation(changed.spawn(output), tests.slice(1), counter);
						result.integrate(partial)
						return result;
					}, unchanged);
					return result
				}
			}
			return evalResult(changed, unchanged);
		}

		function initTransform(collision, tests, counter){
			var rez = intermediateTransformation(collision, tests, counter);
			if (rez == collision){
				return collision
			} else if (rez.Ambigs.length){
				var result = rez.outputs().reduce(function(result, output){
					var partial = initTransform(rez.spawn(output), tests, counter+1);
					result.integrate(partial)
					return result;
				}, collision.spawn());
				return result
			} else {
				return rez;
			}
		}

		//// outter level discrete transformations. calls integrated transformations /////
		function discreteTransformation(collision, testArray){
			var result = collision.spawn();
			var stillAmbiguous = testArray.reduce(function(prev, tests) {
				var next = collision.spawn();
				prev.outputs().map(function(output){
					if (prev.Ambigs.indexOf(output) > -1){
						var begin = prev.spawn(output);
						var end = initTransform(begin, tests, 0);
						next.integrate(end);
					} else {
						result.integrate(prev.spawn(output));
					}
				})
				return next;
			}, collision);
			result.integrate(stillAmbiguous);
			return result;
		}

		var CollisionKeeper = (function(){ //// Special object for managing cites with colliding outputs.
			//// the original version was output-based; they new version is rule-based.
			var Outputs = {};
			var Rules = {};
			var Ambigs = [];
			function add (ID, output, rules){
				if (Outputs[output] == undefined){
					Outputs[output] = [];
				} else if ((Ambigs.indexOf(output) == -1) && (Rules[ID] == undefined)){
					// only add once, but adding the same ID twice does not trigger it.
					Ambigs.push(output)
				}
				Rules[ID] = rules || {};
				Outputs[output].push(ID);
				return Outputs[output].length;
			}
			function getIDs (output){
				if (output == undefined){
					output = Object.keys(Outputs)[0]
				}
				return Outputs[output];
			}

			function outputs (){
				return Object.keys(Outputs);
			}
			function spawn (output){
				if (output == undefined){
					return CollisionKeeper();
				}
				return getIDs(output).reduce(function(ret, ID){
					ret.add(ID, output); /// add return count
					ret.Rules[ID] = self.Util.clone(Rules[ID]);
					return ret;
				}, CollisionKeeper())
			}
			function integrate (collision){ 
			//// Used to populate new objects --> no danger of over-writing keys.
				collision.outputs().map(function(output){
					collision.getIDs(output).map(function(ID){
						add(ID, output);
						Rules[ID] = collision.Rules[ID]
					});
				});
			}
			function setRules(ID, rules){
				Rules[ID] = rules;
			}
			function getRules(ID, rules){
				return Rules[ID];
			}
			return {add:add, outputs:outputs, getIDs:getIDs, setRules:setRules, getRules:getRules, spawn:spawn, integrate:integrate, Rules:Rules, Ambigs:Ambigs, Outputs:Outputs}
		})

		var AdvancedCollisionKeeper = (function(){ //// Special object for managing cites with colliding outputs.
			//// the original version was output-based; they new version is rule-based.
			var Outputs = {};
			var Keys = {}
			var Rules = {};
			var Ambigs = [];
			function add (ID, output, rules){
				var key = ID[0];
				var subkey = ID[1];
				rules = rules || {};
				if (Rules[key] == undefined){
					Rules[key] = {};
				}	
				if (Outputs[output] == undefined){
					Outputs[output] = {};
				} else if ((Ambigs.indexOf(output) == -1) && (Rules[key][subkey] == undefined)){
					// only add once, but adding the same ID twice does not trigger it.
					Ambigs.push(output)
				}
				if (Outputs[output][key] == undefined){
					Outputs[output][key] = [];
				}

				if (Keys[key] == undefined){
					Keys[key] = {};
					Rules[key] = {};
				} else if (Keys[key][subkey] != undefined){
					//// make sure that output lists are up to date
					var oldOutput = Keys[key][subkey];
					if ((Outputs[oldOutput][key].length == 1) && (oldOutput != output)){
						delete Outputs[oldOutput][key]
					} else {
						var index = Outputs[oldOutput][key].indexOf(subkey);
						Outputs[oldOutput][key].splice(index, 1);
					}
				} 
				Keys[key][subkey] = output;
				Rules[key][subkey] = rules;
				Outputs[output][key].push(subkey);
				return Object.keys(Outputs[output]).length;
			}
//			function reset(output){
//				Object.keys(Outputs[output]).map(function(key){
//					delete Keys[ID];
//					delete Rules[key];
//				})
//				delete Outputs[output];
//			}
			function getIDs(output){
				if (output == undefined){
					output = Object.keys(Outputs)[0]
				}
				var IDs = Outputs[output];
				var ret= Object.keys(IDs).reduce(function(acc, key){
					var subkeys = IDs[key];
					subkeys.map(function(subkey){
						acc.push([key, subkey]);
					})
					return acc;
				}, [])
				return ret;
			}
			function outputs (ID){
				if (ID){
					if (Array.isArray(ID)){
						return Keys[ID[0]][ID[1]];
					}
				}
				return Object.keys(Outputs);
			}
			function spawn (output){
				if (output == undefined){
					return AdvancedCollisionKeeper();
				}
				var IDs = getIDs(output)
				return IDs.reduce(function(ret, ID){
					var key = ID[0];
					var subkey = ID[1];
					var rules = self.Util.clone(Rules[key][subkey])
					ret.add([key, subkey], output, rules);
					return ret;
				}, AdvancedCollisionKeeper())
			}
			function integrate (collision){ 
			//// Used to populate new objects --> no danger of over-writing keys.
				collision.outputs().map(function(output){
					var IDs = collision.getIDs(output);
					IDs.map(function(ID){
						var key = ID[0];
						var subkey = ID[1];
						var rules = self.Util.clone(collision.Rules[key][subkey])
						add([key, subkey], output, rules);
					});
				});
			}
			function getRules(ID){
				var key = ID[0];
				var subkey = ID[1];
				return Rules[key][subkey];
			}
			function flush (){ //// AdvancedCollisionKeeper is meant to be permanent.
				Ambigs = [];
				[Outputs, Keys, Rules].map(function(state){
					Object.keys(state).map(function(key){
						delete state[key];
					})
				})
			}

			return {add:add, outputs:outputs, getIDs:getIDs, spawn:spawn, integrate:integrate, Rules:Rules, getRules:getRules, Ambigs:Ambigs, flush:flush, Keys:Keys, Outputs:Outputs}
		})

		self.Disambig = {CollisionKeeper:CollisionKeeper, discreteTransformation:discreteTransformation, AdvCollisionKeeper:AdvancedCollisionKeeper};

	}).call(this);

	(function ConditionModule(){

		self.CSL.Node["if"] = function (token, buildObj, scopeObj) {
			if (token.tokentype == self.STATIC.START){
				buildObj.tokens.push(token);
				token.succeed = buildObj.tokens.length;
			} else if (token.tokentype == self.STATIC.END){
				buildObj.tokens.push(token);
				scopeObj.open.fail = buildObj.tokens.length;
				scopeObj.open.test = this.Match.merge(scopeObj.open.tests, scopeObj.open.match);
			/// if Open Tok fails, go to tok immediately after this tok.
			/// if Open Tok succeeds, skip all following tests. // Assigned by <choose>
			} else if (token.tokentype == self.STATIC.SINGLETON){
				buildObj.tokens.push(token);
				token.test = this.Match.merge(token.tests, token.match);
				token.fail = buildObj.tokens.length;
			/// if Tok fails, go to next tok
			/// if Tok succeeds, we must skip all following "else" & "else-if" statements.
			}
		};
		self.CSL.Node["else-if"] = self.CSL.Node["if"];

		self.CSL.Node["else"] = function (token, buildObj, scopeObj) {
			token.succeed = buildObj.tokens.length;
		};
		self.CSL.Node.choose = function (token, buildObj, scopeObj) {
			if (token.tokentype == self.STATIC.END){
				scopeObj.children.map(function(childTokenList){
					if (childTokenList.length ==2){ //// get close token
						childTokenList[1].next = buildObj.tokens.length;
					} else if (childTokenList.length ==1){ //singleton
						//// single success == closeTag next
						childTokenList[0].success = buildObj.tokens.length;
					}
				})
			}
		};
		self.CSL.Node["conditions"] = function (token, buildObj, scopeObj) {
			if (token.tokentype == self.STATIC.START){
				buildObj.conditions = [];
			}
			if (token.tokentype === self.STATIC.END) {
			    var test = this.Match.merge(buildObj.conditions, token.match);
				delete buildObj.conditions;
				scopeObj.parent.tests.push(token.test);
			}
		};
		self.CSL.Node["condition"] = function (token, buildObj, scopeObj) {
			if ((token.tokentype === self.STATIC.SINGLETON) || (token.tokentype === self.STATIC.START)) {
				if (token.tests.length > 0){
					var test = this.Match.merge(token.tests, token.match);
					buildObj.conditions.push(test);
				}
			}
		};
		self.CSL.Attributes["@match"] = function (token, buildObj, arg) {
			token.match = arg;
		};
		self.CSL.Attributes["@type"] = function (token, buildObj, arg) {
			var types = arg.split(/\s+/);
			var maketest = function (mytype) {
				return function(Item,item) {
				    var ret = (Item.type === mytype);
				    if (ret) {
				        return true;
				    } else {
				        return false;
				    }
				}
			}
			var tests = [];
			for (var i=0,ilen=types.length;i<ilen;i+=1) {
				tests.push(maketest(types[i]));
			}
			token.tests.push(this.Match.any(tests));
		};


	}).call(this);

	this.Bibliography = (function BibliographyModule(){
		function processSources(sourceList, callback){
			return callback( sourceList.map(function(source){
				var execObj = self.Render.newExecObj();
				execObj["source"] = source; //// for reference-grouping.
				var ret= self.Render.renderCite(self.State.Sources[source].bibliography, {area:"bibliography"}, execObj);
				return [ret, execObj];
			}) )
		};

		function getBibliographySources(callback){
			var clusterKeys = Object.keys(self.State.Clusters);
			if (clusterKeys.length && !(self.Engine.bibliography.sort.tokens.length)){
				var usedIDs = {};
				var sourceList = clusterKeys.reduce(function(acc, clusterKey){
					var cluster = self.State.Clusters[clusterKey];
					cluster.cites.map(function(cite){
						var sourceKey = cite.source;
						if (!usedIDs.hasOwnProperty(sourceKey)){
							usedIDs[sourceKey] = true;
							acc.push(sourceKey);
						}
					})
					return acc;
				}, [])
				self.State.SourceIndex = sourceList;
			} 
			if (callback){
				return callback(self.State.SourceIndex);
			}
			return self.State.SourceIndex;
		}
		self.Plugin.register({name:"makeBibliography.getSources",fn:getBibliographySources})

		function sortSources(sourceList, callback){
			if (!sourceList){
				sourceList = getBibliographySources();
			}
			self.Sorting.sort(self.Engine.bibliography.sort.tokens, sourceList);
			if (self.Style.dataType("citation-number")){
				sourceList.map(function(sourceID, index){
					self.State.Sources[sourceID]["citation-number"] = index+1;
				})
			}
			if (callback){
				return callback(sourceList);
			}
			return sourceList
		}
		self.Plugin.register({name:"makeBibliography.sortSources", post:"makeBibliography.getSources", fn:sortSources});

		self.Plugin.register({name:"makeBibliography.processSources", post:"makeBibliography.sortSources", fn: processSources});

		function packageBibliography(sourceOutputList, callback){
			if (self.Style.getOpt("subsequent-author-substitute")){
				referenceGrouping(sourceOutputList);
			}
			return callback(sourceOutputList.map(function(source){ return source[0];}))
//			return callback( "<div class='csl-bibiography'><div class='csl-bibliography-entry>" + sourceOutputList.join("</div><div class='csl-bibliography-entry'>") + "</div></div>")
		}

		self.Plugin.register({name:"makeBibliography.packageBibliography", post:"makeBibliography.processSources", fn:packageBibliography})

		self.Public["makeBibliography"] = function makeBibliography(){
			return self.getFunction("makeBibliography")()[0];
		};
		self.Public["bibRender"] = function(source){ //// comparable with easyCite().
			return self.Render.renderCite(source, {area:"bibliography"});
		};

		function referenceGrouping(sourceOutputList) {
			var subrule = self.Style.getOpt("subsequent-author-substitute-rule");
			var subtext = self.Style.getOpt("subsequent-author-substitute");
			var nameList = [];
			return sourceOutputList.map(function(sourceArray){
				var output = sourceArray[0];
				var execObj = sourceArray[1];
				var nameVars = self.Citation.Disambig.getNameVars(execObj.vars);
				if (nameVars.length){
					var primaryNameVar = nameVars[0];
					var newNameList = execObj.outputs[primaryNameVar].map(function(nameArr){
						return self.Decoration.html(nameArr); /// convert array of formatting & text into html string.
					});
					var etAl = execObj.nameVars[primaryNameVar].strings["et-al"] || self.Locale.getTerm("and others");
					var index = 0;
					if (subrule === "partial-first"){
						if ((nameList[index] == newNameList[index]) && (nameList[index] !== etAl) ){
							output = output.replace(newNameList[0], subtext);
						}
					} else if (subrule === "partial-each"){
						var len = Math.min(nameList.length, newNameList.length);
						var index = 0;
						while (index < len){
							if ((nameList[index] == newNameList[index]) && (nameList[index] !== etAl) ) {
								output = output.replace(newNameList[index], subtext);
								index ++;
							} else {
								break
							}
						}
					} else if (subrule === "complete-each"){
						if (nameList.length === newNameList.length){
							var same = true
							var len = nameList.length;
							var index = 0;
							while (index < len){
								if ((nameList[index] == newNameList[index])) {
									index++;
								} else {
									same = false;
									break
								}
							}
							if (same === true){
								newNameList.map(function(name){
									if (name != etAl){
										output = output.replace(name, subtext);
									}
								})
							}
						}
					} else { ///if (subrule === "complete-all")
						if (nameList.length === newNameList.length){
							var same = true
							var len = nameList.length;
							var index = 0;
							while (index < len){
								if ((nameList[index] == newNameList[index])) {
									index++;
								} else {
									same = false;
									break;
								}
							}
							if (same === true){
								var nameTok = execObj.nameVars[primaryNameVar];
								var source = self.State.Sources[execObj.source].bibliography;
								execObj.decorations = execObj.outputs[primaryNameVar][0]; //// reset necessary decorations
								var nameOutput = self.Decoration.html( self.Render.execTokens([nameTok], source, {area:"bibliography"}, execObj) );
								output = output.replace(nameOutput, subtext);
							}
						}
					}
					nameList = newNameList;
				} else {
					nameList = [];
				}
				sourceArray[0] = output;
			})
		};



		(function(){
			self.CSL.Node.bibliography = function (token, buildObj, scopeObj) {
				if (token.tokentype === self.STATIC.START) {
					buildObj.tokens = [];
					buildObj.sort = {tokens:[]};
					buildObj.area = "bibliography";
				} else if (token.tokentype == self.STATIC.END){
					self.Engine.bibliography.tokens = buildObj.tokens;
					self.Engine.bibliography.sort = buildObj.sort;
				}
			}

			self.CSL.Attributes["@subsequent-author-substitute"] = function(token, buildObj, arg){
				this.Style.setOpt("subsequent-author-substitute", arg);
			};
			self.CSL.Attributes["@subsequent-author-substitute-rule"] = function(token, buildObj, arg){
				this.Style.setOpt("subsequent-author-substitute-rule", arg);
			};
		})();

		return {sortSources:sortSources};

	}).call(this);


	this.Citation = (function ProcessCitationCluster(){
		var self = this;
		var ClusterIndex = [];
		var Clusters = {};
		var Cites = {};

		self.State["Clusters"] = Clusters; /// Clusters are citation clusters. Contain cites.
		self.State["Cites"] = Cites; /// Cites have relationships to Source & Cluster & contain prefix, suffix info.
		self.State.ClusterIndex = ClusterIndex; /// Order of appearance of clusters in doc

		function easyCite(cluster, context){ /// processes cite outside of document context --> no disambig or position
			context = (context || {})
			context["area"] = "citation";
			var delimiter = self.Engine.citation.tokens[0].tokens[0].strings.delimiter;
			var ret= cluster.cites.map(function(cite){
				var source = self.State.Sources[cite.id].bibliography;
				return self.Render.renderCite(source, context)
			}).join(delimiter);
			return ret;
		}
		self.Public["easyCite"] = easyCite;

		function setClusterID(currentCitation, preCitations, postCitations, callback){
			var cluster = self.Util.clone(currentCitation); // deep clone
			self.Util.setObjectId(Clusters, cluster)
			return sortCites(cluster, preCitations, postCitations);
		}
		self.Plugin.register({name:"processCitationCluster.setClusterID",fn:setClusterID})

		function sortCites(cluster, preCitations, postCitations, callback){
			self.Bibliography.sortSources(); //// Changes to cite order may affect the bibliography order, which affects citation-number.
			self.Sorting.sortCites(self.Engine.citation.sort.tokens, cluster.cites);
			//// we might need to sort bibliography sources again. Sometimes, bibliography sorting is dependent on citation order.
			//// However, testing so far shows it's not required. 

			return registerSources(cluster, preCitations, postCitations);
		}

		function registerSources(currentCitation, preCitations, postCitations, callback) {
			currentCitation.cites.map(function(cite){
				if (!self.State.Sources.hasOwnProperty(cite.source)){
					self.CSL.error("Error: we do not have information on source " + sourceID);
				} else if (currentCitation.note) { //// set first-reference-note-number
					if (1 == self.Sorting.compareNumbers(self.State.Sources[cite.source].bibliography["first-reference-note-number"], currentCitation.note, "en-US")){
						self.State.Sources[cite.source].bibliography["first-reference-note-number"] = currentCitation.note;
						self.State.Sources[cite.source]["first-reference-note-number"] = currentCitation.note;
					}
				}
			})
			return createRelationships(currentCitation, preCitations, postCitations);
		}

		function createRelationships(currentCitation, preCitations, postCitations, callback) {
			currentCitation.cites.map(function(cite){
				cite.cluster = currentCitation.id;
				self.Util.setObjectId(Cites, cite);
				self.Relationships.add({cite:cite.id,source:cite.source}); /// necessary if source info changes
			})
			return processCites(currentCitation, preCitations, postCitations, {});
		}

		function setPosition(context, precedingSources, subsequentSources, preClusters, postClusters, index){
			//// step1: set 'position' & 'near-note-distance' attr on contexts
			var sourceID = context.source;
			var precedingIndex = precedingSources.lastIndexOf(sourceID);
			var nearNoteDistance = self.citation.strings["near-note-distance"];
			if (precedingIndex == -1){
				context["position"] = self.STATIC.POSITION_FIRST;
				context["near-note-distance"] = 0; //
				context["near-note"] = 0;
			} else {
				context["near-note-distance"] = precedingSources.length - precedingIndex;
				if (context["near-note-distance"] > nearNoteDistance){
					context["near-note"] = 0;
				} else {
					context["near-note"] = 1;
				}

				//// IBID POSITION RULES
				var precedingSource = precedingSources.slice(-1)[0];
				if ((context["near-note-distance"] == 1)){
					if (index == 0){ /// preceding Source is in preceding cluster
						var clusterID = preClusters.slice(-1);
						var cluster = Clusters[clusterID];
						var precedingCite = cluster.cites.slice(-1)[0];
						var differentSource = cluster.cites.filter(function(cite){ return cite.source != sourceID }).length; //// this processor is slightly more expansive than the CSL spec.
							// technically, we should not allow "ibid"s when the previous citation contains more than 1 source. However, It makes sense to me that if there is more than 1 cite, all to the same source (which is allowed in CSL), then we should continue using "ibid".
					} else { /// preceding Source is in the same cluster
						var clusterID = context.cluster;
						var cluster = Clusters[clusterID];
						var precedingCite = cluster.cites.slice(index, index+1)[0];
					}

					if ((index == 0) && (differentSource != 0)){ /// only allow ibid if the preceding cluster has only 1 source citation.
						context["position"] = self.STATIC.POSITION_SUBSEQUENT;
					} else if ((precedingCite.locator || "") == ""){ // no prior locator
						if ((context.locator || "") === ""){
							context["position"] = self.STATIC.POSITION_IBID;
						} else {
							context["position"] = self.STATIC.POSITION_IBID_WITH_LOCATOR;
						}
					} else if ((context.locator || "") == ""){ // no locators at all
						context["position"] = self.STATIC.POSITION_SUBSEQUENT;
					} else { // both have locators
						if (context.locator == precedingCite.locator){
							context["position"] = self.STATIC.POSITION_IBID;
						} else {
							context["position"] = self.STATIC.POSITION_IBID_WITH_LOCATOR;
						}
					}
				} else {
					context["position"] = self.STATIC.POSITION_SUBSEQUENT;
				}
			}
			precedingSources.push(sourceID); /// add sourceID to precedingSources, so later cites in the cluster know about it.


			//// step2: ID cites & clusters that might need to be re-rendered.
			var affectedCites = [];
			if (context["position"] == self.STATIC.POSITION_FIRST){
				var length = subsequentSources.length + 1;
			} else {
				var length = (nearNoteDistance || 1);
			}
			var counter = 0
			postClusters.map(function(cluster){
				if (counter > length) {return}
				var ret = cluster.cites.filter(function(cite){
					counter = counter+1;
					if (cite.source == sourceID){ return cite.id }
				})
				if (ret.length){
					affectedCites.push({cluster:cluster.id,cite:ret[0]});
					counter = length;
				}
			});
			return affectedCites;
		};

		function processCites(cluster, preCitations, postCitations, disambig, callback){
			var precedingSources = preCitations.reduce(function(acc, clusterID){
				Clusters[clusterID].cites.map(function(cite){acc.push(cite.source)})
				return acc;
			}, []);
			var subsequentSources = postCitations.reduce(function(acc, clusterID){
				Clusters[clusterID].cites.map(function(cite){acc.push(cite.source)})
				return acc;
			}, []);
			var affectedSources = [];
			cluster.cites.map(function(cite, index){
				var affected = setPosition(cite, precedingSources, subsequentSources, preCitations, postCitations, index);
				affectedSources = affectedSources.concat(affected);
				affected = CiteDisambiguation.get(cite, cite);
				affectedSources = affectedSources.concat(affected);
				var execObj = self.Render.newExecObj();
				var source = self.State.Sources[cite.source].bibliography;
				execObj.disambig = CiteDisambiguation.Disambigs.Rules[cite.source][CiteDisambiguation.getsubkey(cite)];
				execObj.area = "citation";
				var output = self.Render.renderCite(source, cite, execObj);
//				cite.vars = execObj.vars;//
//				cite.nameVars= execObj.nameVars//
				cite.output = output;
			})
			var affectedCites = affectedSources.reduce(function(acc, sourceID){
				acc = acc.concat(self.Relationships.state.source[sourceID].cite);
				return acc;
			}, []);
			var affectedClusters = [cluster.id];
			affectedCites.map(function(citeID){
				var cite = Cites[citeID];
				if (affectedClusters.indexOf(cite.cluster) == -1){
					affectedClusters.push(cite.cluster);
				}
				var execObj = self.Render.newExecObj();;
				var source = self.State.Sources[cite.source].bibliography;
				execObj.disambig = CiteDisambiguation.Disambigs.Rules[cite.source][CiteDisambiguation.getsubkey(cite)];
				execObj.area = "citation";
				var output = self.Render.renderCite(source, cite, execObj);
//				cite.vars = execObj.vars;//
//				cite.nameVars= execObj.nameVars//
				cite.output = output;
			})
			var delimiter = self.Engine.citation.tokens[0].tokens[0].strings.delimiter;
			var ret = affectedClusters.reduce(function(acc, clusterID){
				var clusterObj = Clusters[clusterID];
				acc[clusterID] = clusterObj.cites.map(function(cite){return cite.output}).join(delimiter);
				return acc;
			}, {});
			ret.id = cluster.id;
			if (callback){
				return callback(ret);
			} else if (self.citation.strings.collapse){
				return CiteCollapse.collapse(ret);
			}
			return ret;		
		}

		var CiteCollapse = (function(){
			function collapseCitationNumbers(clusters){
				var layoutDelimiter = self.Engine.citation.opts.delimiter;
				Object.keys(clusters).map(function(key){
					if (key != "id"){
						var cites = clusters[key].split(layoutDelimiter);
						var output = cites.reduce(function(acc, cite){
							var CitationNumber = parseInt(cite, 10);
							if (CitationNumber+"" == cite){ /// if not true, then there is a locator, which will break the citation-number range.
								if (acc.length == 0){
									acc.push([CitationNumber]);
								} else if (acc.slice(-1)[0].slice(-1)[0] === CitationNumber-1){
									acc.slice(-1)[0].push(CitationNumber);
								} else {
									acc.push([CitationNumber]);
								}
							} else {
								acc.push([cite])
							}
							return acc;
						},[])
						var ret = output.reduce(function(acc, arr){ //// flatten & apply range
							if (arr.length > 2){
								var range = (""+arr[0])+"-"+arr[arr.length-1]
								acc.push(range);
							} else if (arr.length == 2){
								acc.push(arr[0]);
								acc.push(arr[1]);
							} else {
								acc.push(arr[0]);
							}
							return acc;
						},[]).join(layoutDelimiter);
						clusters[key] = ret;
					}
				})
				return clusters;
			}

			function collapseYear(clusters){
				var Citation = self.Engine.citation.tokens[0]
				var layoutDelimiter = self.Engine.citation.opts.delimiter;
				var afterCollapseDelimiter = self.Engine.citation.opts["after-collapse-delimiter"];
				Object.keys(clusters).map(function(key){
					if (key != "id"){
						var cluster = self.State.Clusters[key];
						var cites = cluster.cites;
						var nameOutputs = {};
						var outputOrder = [];
						cites.map(function(cite){
							var disambig = CiteDisambiguation.Disambigs.Rules[cite.source][CiteDisambiguation.getsubkey(cite)];
							var nameVarList = CiteDisambiguation.getNameVars(disambig.vars);
							if (nameVarList.length !== 0){
								var nameTok = disambig.nameVars[nameVarList[0]];
								var execObj = self.Render.newExecObj();
								var source = self.State.Sources[cite.source].bibliography;
								execObj.area = "citation";
								var nameOutput = self.Render.execTokens([nameTok], source, cite, execObj).join("");
								if (nameOutputs.hasOwnProperty(nameOutput)) {
									nameOutputs[nameOutput].push( cite.output.replace(nameOutput, "") );
								} else {
									nameOutputs[nameOutput] = [cite.output];
									outputOrder.push(nameOutput);
								}
							} else {
								outputOrder.push(cite.id);
							}
						})
						var len = outputOrder.length -1;
						if (outputOrder.length > 0){//// ignore cites without year variables.
							var ret = outputOrder.map(function(output, index){
								var collapsed = false;
								if (typeof(output) == "number"){ //// output == cite.id b/c there is no name output.
									var result = self.State.Cites[output].output;
								} else {
									var result = nameOutputs[output].join(layoutDelimiter);
									collapsed = true;
								}
								if ((index < len) && collapsed && (nameOutputs[output].length > 1)){
									return result + afterCollapseDelimiter;
								} else if (index < len){
									return result + layoutDelimiter;
								} else {
									return result;
								}
							}).join("");
							clusters[key] = ret;
						}
					}
				})
				return clusters;
			}
			function collapseYearSuffix(clusters){
				var layoutDelimiter = self.Engine.citation.opts.delimiter;
				var afterCollapseDelimiter = self.Engine.citation.opts["after-collapse-delimiter"];
				if (self.Engine.citation.tokens[0].strings["disambiguate-add-year-suffix"] == undefined){
					console.log('WARNING: collapse-year-suffix set to "true", but disambiguate-add-year-suffix is not set.');
				}
				Object.keys(clusters).map(function(key){
					if (key != "id"){
						var cluster = self.State.Clusters[key];
						var cites = self.Util.clone(cluster.cites);
						var suffixCites = {};
						var citeToOutput = {};
						var citeIDs = {};
						cites.map(function(cite, index){
							citeIDs[cite.id] = cite;
							cite["disambigKey"] = self.Citation.Disambig.getsubkey(cite);
							cite["disambig"] = CiteDisambiguation.Disambigs.Rules[cite.source][cite.disambigKey];
							if (cite.disambig["year-suffix"]){
								cite["ambigOutput"] = self.Citation.Disambig.Ambigs.outputs([cite.source, cite.disambigKey]);
								citeToOutput[cite.id] = cite.ambigOutput;
								if (!suffixCites[cite.ambigOutput]){
									suffixCites[cite.ambigOutput] = [cite.id];
								} else {
									suffixCites[cite.ambigOutput].push(cite.id);
								}
							}
						})
						var nameOutputs = {};
						var outputOrder = [];
						cites.map(function(cite){
							var disambig = CiteDisambiguation.Disambigs.Rules[cite.source][cite.disambigKey];
							var nameVarList = CiteDisambiguation.getNameVars(disambig.vars);
							var execObj = self.Render.newExecObj();
							var source = self.State.Sources[cite.source].bibliography;
							execObj.area = "citation";
							execObj.disambig["add-year-suffix"] = ["",""]; //// remove year suffix to identify originally ambiguous outputs
							if (disambig.primaryDateToken){
								var neutralDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
							} else {
								var neutralDateOutput = "";
							}
							if (nameVarList.length !== 0){
								var nameTok = disambig.nameVars[nameVarList[0]];
								var nameOutput = self.Render.execTokens([nameTok], source, cite, execObj).join("");
								if (nameOutputs.hasOwnProperty(nameOutput)) {
									if (cite.disambig["year-suffix"] && (suffixCites[citeToOutput[cite.id]].length > 1)){
										if ((cite.locator || "") == ""){
											var tmpOutput = citeToOutput[cite.id];
											var CiteIndex = suffixCites[tmpOutput].indexOf(cite.id);
											var prevCite = citeIDs[suffixCites[tmpOutput][(CiteIndex-1)]];
											if (CiteIndex == 0){ //// condition occurs when nameOutput already exists, but for a different year.
												if (!nameOutputs[nameOutput].hasOwnProperty(neutralDateOutput)){
													nameOutputs[nameOutput][neutralDateOutput] = []
												}
												cite.output = cite.output.replace(nameOutput, "");
												if (nameOutputs[nameOutput]["order"].indexOf(neutralDateOutput) ==-1){
													nameOutputs[nameOutput]["order"].push(neutralDateOutput);
												}
												var indexOfLocatorCite = suffixCites[tmpOutput].length;
												execObj.disambig["add-year-suffix"] = cite.disambig["add-year-suffix"];
												var oldDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
												var newSuffix = suffixCites[citeToOutput[cite.id]].reduce(function(acc, citeID, index){
													if ((citeIDs[citeID].locator || "") !=""){
														indexOfLocatorCite = index;
													}
													if (index == 0){
														acc.push(citeIDs[citeID].disambig["year-suffix"])
													} else if (index < indexOfLocatorCite){
														acc.push(citeIDs[citeID].disambig["year-suffix"])
													}
													return acc;
												},[])
												execObj.disambig["add-year-suffix"] = [0, joinSuffix(newSuffix, layoutDelimiter)];
												var newDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
												cite.output = cite.output.replace(oldDateOutput, newDateOutput);
												nameOutputs[nameOutput][neutralDateOutput].push( cite.output );
											} else if ((prevCite.locator || "")!=""){ //// if previous cite has a locator, we may start a new range.
												var indexOfLocatorCite = suffixCites[tmpOutput].length;
												execObj.disambig["add-year-suffix"] = cite.disambig["add-year-suffix"]
												var oldDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
												var newSuffix = suffixCites[citeToOutput[cite.id]].slice(CiteIndex).reduce(function(acc, citeID, index){
													if ((citeIDs[citeID].locator || "") !=""){
														indexOfLocatorCite = index;
													}
													if (index == 0){
														acc.push(citeIDs[citeID].disambig["year-suffix"])
													} else if (index < indexOfLocatorCite){
														acc.push(citeIDs[citeID].disambig["year-suffix"])
													}
													return acc;
												},[]);
												execObj.disambig["add-year-suffix"] = [0, joinSuffix(newSuffix, layoutDelimiter)];
												var newDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
												cite.output = cite.output.replace(oldDateOutput, newDateOutput);
												cite.output = cite.output.replace(nameOutput, "")
												nameOutputs[nameOutput][neutralDateOutput].push( cite.output.replace(nameOutput, "") );
												if (nameOutputs[nameOutput]["order"].indexOf(neutralDateOutput) == -1){
													nameOutputs[nameOutput]["order"].push(neutralDateOutput);
												}
											} else {
												/// incorporated by previous cite.
											}
										} else {
											nameOutputs[nameOutput][neutralDateOutput].push( cite.output.replace(nameOutput, "") );
											if (nameOutputs[nameOutput]["order"].indexOf(neutralDateOutput) ==-1){
												nameOutputs[nameOutput]["order"].push(neutralDateOutput);
											}
										}
									} else {
										if (!nameOutputs[nameOutput].hasOwnProperty(neutralDateOutput)){
											nameOutputs[nameOutput][neutralDateOutput] = []
										}
										nameOutputs[nameOutput][neutralDateOutput].push( cite.output.replace(nameOutput, "") );
										if (nameOutputs[nameOutput]["order"].indexOf(neutralDateOutput) ==-1){
											nameOutputs[nameOutput]["order"].push(neutralDateOutput);
										}
									}
								} else {
									if (cite.disambig["year-suffix"] && suffixCites[citeToOutput[cite.id]].length > 1){
										var indexOfLocatorCite = suffixCites[citeToOutput[cite.id]].length;
										execObj.disambig["add-year-suffix"] = cite.disambig["add-year-suffix"];
										var oldDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
										var newSuffix = suffixCites[citeToOutput[cite.id]].reduce(function(acc, citeID, index){
											if ((citeIDs[citeID].locator || "") !=""){
												indexOfLocatorCite = index;
											}
											if (index == 0){
												acc.push(citeIDs[citeID].disambig["year-suffix"])
											} else if (index < indexOfLocatorCite){
												acc.push(citeIDs[citeID].disambig["year-suffix"])
											}
											return acc;
										},[])
										execObj.disambig["add-year-suffix"] = [0, joinSuffix(newSuffix, layoutDelimiter)];
										var newDateOutput = self.Render.execTokens([disambig.primaryDateToken], source, cite, execObj).join("");
										cite.output = cite.output.replace(oldDateOutput, newDateOutput);
									}
									nameOutputs[nameOutput] = {}
									nameOutputs[nameOutput][neutralDateOutput]=[cite.output];
									nameOutputs[nameOutput]["order"] = [neutralDateOutput];
									outputOrder.push(nameOutput);
								}
							} else {
								outputOrder.push(cite.id);
							}
						})
						if (outputOrder.length > 0){
							var len = outputOrder.length - 1;
							var ret = outputOrder.map(function(output, index){
								var collapsed= false;
								if (typeof(output) == "number"){ //// output == cite.id b/c there is no name output.
									var result = self.State.Cites[output].output;
								} else { //// there was name output, so look up nameOutputs dict.
									var result = nameOutputs[output].order.map(function(neutralDate){
										if (nameOutputs[output][neutralDate].length > 1){
											collapsed = true;
										} else if (index > 1){
											collapsed = true;
										}
										return nameOutputs[output][neutralDate].join(layoutDelimiter);
									}).join(layoutDelimiter);
								}
								if ((index < len) && collapsed){
									return result + afterCollapseDelimiter;
								} else if (index < len){
									return result + layoutDelimiter;
								} else {
									return result;
								}
							}).join("");
							clusters[key] = ret;
						}
					}
				})
				return clusters;
			}

			function isConsecutive(a,b){
				return ((self.Util.lowerCaseToInt(a) + 1) == self.Util.lowerCaseToInt(b));
			}

			function joinSuffix(array, layoutDelimiter){
				var delimiter = self.citation.strings["year-suffix-delimiter"] || layoutDelimiter;
				var range = [];
				if (self.citation.strings.collapse == "year-suffix-range") {
					return array.reduce(function(acc, suffix, index, arr){
						if (index == 0){
							range.push(suffix);
						} else if (isConsecutive(array[index-1], suffix)){
							range.push(suffix);
						} else {
							if (range.length > 2){
								acc.push(range[0] + '–' + range.slice(-1)[0]);
							} else {
								acc.push(range.join(delimiter));
							}
							range = [suffix];
						}

						if (index + 1 == arr.length){
							if (range.length > 2){
								acc.push(range[0] + '–' + range.slice(-1)[0]);
							} else {
								acc.push(range.join(delimiter));
							}
						}
						return acc;
					}, []).join(delimiter);
				} else {
					return array.join(delimiter);
				}
			}

			function collapse (clusters){
				if (self.citation.strings.collapse){
					if (self.citation.strings.collapse == "citation-number"){
						return collapseCitationNumbers(clusters);
					} else if (self.citation.strings.collapse == "year"){
						return collapseYear(clusters);
					} else if (self.citation.strings.collapse == "year-suffix"){
						return collapseYearSuffix(clusters);
					} else if (self.citation.strings.collapse == "year-suffix-range") {
						return collapseYearSuffix(clusters);
					}
				}
				return clusters;
			}

			this.CSL.Attributes["@collapse"] = function(token, buildObj, arg){
				token.strings["collapse"] = arg;
			}

			this.CSL.Attributes["@year-suffix-delimiter"] = function(token, buildObj, arg){
				token.strings["year-suffix-delimiter"] = arg;
			}

			this.CSL.Attributes["@after-collapse-delimiter"] = function(token, buildObj, arg){
				token.strings["after-collapse-delimiter"] = arg;
			}

			return {collapse:collapse}
		}).call(this);

		var CiteDisambiguation = (function (){
			var Ambigs = self.Disambig.AdvCollisionKeeper();
			var Disambigs = self.Disambig.AdvCollisionKeeper();
			var subkeys = {};
			subkeys[self.STATIC.POSITION_FIRST] = {0:0, 1:1};
			subkeys[self.STATIC.POSITION_SUBSEQUENT] = {0:2, 1:3};
			subkeys[self.STATIC.POSITION_IBID] = {0:4, 1:5};
			subkeys[self.STATIC.POSITION_IBID_WITH_LOCATOR] = {0:6, 1:7};

			var CONTEXTS = {
				0:{"position":self.STATIC.POSITION_FIRST, "near-note":0},
				1:{"position":self.STATIC.POSITION_FIRST, "near-note":1},
				2:{"position":self.STATIC.POSITION_SUBSEQUENT, "near-note":0},
				3:{"position":self.STATIC.POSITION_SUBSEQUENT, "near-note":1},
				4:{"position":self.STATIC.POSITION_IBID, "near-note":0},
				5:{"position":self.STATIC.POSITION_IBID, "near-note":1},
				6:{"position":self.STATIC.POSITION_IBID_WITH_LOCATOR, "near-note":0},
				7:{"position":self.STATIC.POSITION_IBID_WITH_LOCATOR, "near-note":1},
			}
			var POSITIONTESTS = []; /// we don't test against every context, b/c of the huge overhead. we only test against positions that are in the style.
			//// one inevitable consequence is that a style that has position tests may be dramatically slower than a style without position tests. Hopefully, we can optimize disambig further.

			function getPositionTestsForCiteDisambiguationTesting(){
				var positionTests = self.Style.getOpt("position-tests") || [];

				if (positionTests.length == 0) { //// no position tests
					POSITIONTESTS = [0]; //// we still need a single default value for getsubkey();
					return POSITIONTESTS;
				}

				if (positionTests.indexOf("near-note") != -1){
					var nearNote = true;
					positionTests.splice(positionTests.indexOf("near-note"), 1);
				} else {
					var nearNote = false;
				}

				/// Sometimes position tests are implied from <else> conditions, which is tricky.
				/// if we test POSITION_FIRST, then there must be position subsequent as well.
				/// if we test any subsequent positions, then we must test POSITION_FIRST
				/// Therefore, we assume that at minimum, PositionTests must include the following:
				/// POSITION_FIRST, & at least 1 subtype of POSITION_SUBSQUENT; including (IBID);
				if (positionTests.indexOf(self.STATIC.POSITION_FIRST) == -1){ /// missing POSITION_FIRST; make implicit POSITION_FIRST test.
					positionTests.push(self.STATIC.POSITION_FIRST);
				} else if (positionTests.indexOf(self.STATIC.POSITION_SUBSEQUENT) == -1){ //// an explicit POSITION_FIRST test implies that we need a POSITION_SUBSEQUENT test.
					positionTests.push(self.STATIC.POSITION_SUBSEQUENT);
				}

				positionTests.map(function(position, index){
					if (position != 0){
						POSITIONTESTS.push(position*2);
					}
					if (nearNote){
						POSITIONTESTS.push((position*2)+1);
					}
				})
			}
			self.Plugin.register({name:"loadStyle.DisambigPositionTests", fn:getPositionTestsForCiteDisambiguationTesting, post:"loadStyle.buildStyle"})	;

			function getsubkey (cite){
				//// position & near-note are mapped to convenient CONTEXTS subkeys.
				var subkey = subkeys[cite.position][cite["near-note"]];

				//// This is a sanity check to ensure that cite.position never equals a value not contained in POSITIONTESTS - which would cause hard-to-test errors.
				while (POSITIONTESTS.indexOf(subkey) == -1){
					subkey = subkey-1;
				}
				return subkey;
			}

			function getNameVars (vars){
				var nameVars = self.Style.varsByType("names");
				var ret= vars.filter(function(variable){
					if (nameVars.indexOf(variable) > -1){
						return variable;
					}
				})
				return ret;
			}
			function getDateVars(vars){
				var dateVars = self.Style.varsByType("date");
				return vars.filter(function(variable){	return dateVars.indexOf(variable) > -1 });
			}

			function selectVar (ID, rules, counter, output){
				//// addNames counts through names in a nameList for 1 variable. It needs this helper method to count through the name variables.
				var nameVars = getNameVars(rules.vars);
				if (counter == nameVars.length){
					delete rules["nameVarCounter"];
					return [output, rules];
				} else {
					rules["nameVarCounter"] = counter;
					return [output+" ", rules];
				}
			};

			function addNames (ID, rules, counter, output){ 
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				if (rules["use-first"] == undefined){
					rules["use-first"] = {};
				}
				rules["use-first"][nameVar] = 0;
				var token = rules.nameVars[nameVar].tokens.filter(function(tok){ return tok.name=="name"})[0];
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				var useFirst = token.strings["et-al-use-first"] || 0;
				var etAlMin = token.strings["et-al-min"] || 0;
				if (context.position != self.STATIC.POSITION_FIRST){
					useFirst = token.strings["et-al-subsequent-use-first"] || useFirst;
					etAlMin = token.strings["et-al-subsequent-min"] || etAlMin;
				}
				if (nameArray.length < etAlMin){
					return [output, rules];
				} else if (etAlMin == 0) {
					return [output, rules];
				} else if (useFirst == 0){
					return [output, rules];
				} else if (nameArray.length == counter){
					return [output, rules];
				}
				rules["use-first"][nameVar] = useFirst+counter+1;
				var execObj = self.Render.newExecObj();
				execObj["disambig"] = rules;
				execObj['activeVariable'] = nameVar;
				var output = self.CSL.Blob.Name.call(self, token, nameArray, context, execObj).join("");
				return [output, rules];
			}

			function selectPosition(ID, rules, counter, output){
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				//// addNames counts through names in a nameList for 1 variable. It needs this helper method to count through the name variables.
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				if (counter == nameArray.length){
					delete rules["namePositionCounter"];
					return [output, rules];
				} else {
					rules["namePositionCounter"] = counter;
					return [output+" ", rules];
				}
			};

			function selectPrimaryPosition(ID, rules, counter, output){
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				//// addNames counts through names in a nameList for 1 variable. It needs this helper method to count through the name variables.
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				if (counter > 0){ //// we don't increment past 0, becuase we are only interested in primary name.
					delete rules["namePositionCounter"];
					return [output, rules];
				} else {
					rules["namePositionCounter"] = counter;
					return [output+" ", rules];
				}
			}

			function addLongForm (ID, rules, counter, output){
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				var position = rules.namePositionCounter;
				var token = rules.nameVars[nameVar].tokens.filter(function(tok){ return tok.name=="name"})[0];
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				if (rules['names'] == undefined){
					rules["names"] = {};
					rules["names"][nameVar] = {};
				} 
				if (rules["names"][nameVar] == undefined){
					rules["names"][nameVar] = {};
				}
				if (rules["names"][nameVar][position] == undefined){
					rules["names"][nameVar][position] = {}
				}
				rules.names[nameVar][position]["form"] = "long";
				rules.names[nameVar][position]["initialsLength"] = 1;
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				if (counter > nameArray.length){ /// counter rules prevent infinite loops.
					return [output, rules];
				}
				var execObj = self.Render.newExecObj();
				execObj["disambig"] = rules;
				execObj['activeVariable'] = nameVar;
				output = self.CSL.Blob.Name.call(self, token, nameArray, context, execObj).join("");
				return [output, rules];
			}

			function addNameInitials(ID, rules, counter, output){
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				var position = rules.namePositionCounter;
				var token = rules.nameVars[nameVar].tokens.filter(function(tok){ return tok.name=="name"})[0];
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				rules.names[nameVar][position]["initialsLength"] = counter+1;
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				var nameID = nameArray[rules.namePositionCounter];
				var givenName = self.State.Names.Persons[nameID].given.split(' ')
				if (counter == 0){
					return [output+" ", rules];
				}
				if (counter > givenName.length){ /// counter rules prevent infinite loops.
					return [output, rules];
				}
				var execObj = self.Render.newExecObj();
				execObj["disambig"] = rules;
				execObj['activeVariable'] = nameVar;
				output = self.CSL.Blob.Name.call(self, token, nameArray, context, execObj).join("");
				return [output, rules];
			}

			function expandNamesInitials(ID, rules, counter, output){
				var nameVars = getNameVars(rules.vars);
				var nameVar = nameVars[rules.nameVarCounter];
				var position = rules.namePositionCounter;
				var token = rules.nameVars[nameVar].tokens.filter(function(tok){ return tok.name=="name"})[0];
				if (rules["names"][nameVar][position]["expandInitials"] == undefined){
					rules["names"][nameVar][position]["expandInitials"] = [];
				}
				rules.names[nameVar][position]["expandInitials"].push(counter);
				var key = ID[0];
				var subkey = ID[1];
				var context = CONTEXTS[subkey];
				var nameArray = self.State.Sources[key].bibliography[nameVar];
				if (counter > nameArray.length){ /// counter rules prevent infinite loops.
					return [output, rules];
				}
				var execObj = self.Render.newExecObj();
				execObj["disambig"] = rules;
				execObj['activeVariable'] = nameVar;
				output = self.CSL.Blob.Name.call(self, token, nameArray, context, execObj).join("");
				return [output, rules];
			}

			function addYearSuffix(ID, rules, counter, output, collision){
				var sourceIDs = collision.getIDs().reduce(function(acc, tuple){
					if (acc.indexOf(tuple[0]) == -1){
						acc.push(tuple[0]);
					}
					return acc;
				}, [])
				var dateVars = getDateVars(rules.vars);
				if (dateVars.length === 0){
					return [output, rules];
				}
				self.Sorting.sort(self.Engine.bibliography.sort.tokens, sourceIDs);
				var suffix = sourceIDs.indexOf(ID[0]);
				self.State.Sources[ID[0]]["year-suffix"] = suffix;
				self.State.Sources[ID[0]]["year-suffix-variable"] = dateVars[0];
				rules["add-year-suffix"] = [dateVars[0], suffix];
				var rez = suffix;
				return [rez, rules];
			}

			function disambiguate (collision){
				var transformations =[];
				if (self.citation.strings["disambiguate-add-names"] == "true"){
					transformations.push([selectVar, addNames]);
				}
				if (self.citation.strings["disambiguate-add-givenname"] == "true"){
					if (self.citation.strings["givenname-disambiguation-rule"] == self.STATIC.NAMEDISAMBIG["all-names-with-initials"]){
						transformations.push([selectVar, [selectPosition, addLongForm, [addNameInitials]]]);
					} else if (self.citation.strings["givenname-disambiguation-rule"] == self.STATIC.NAMEDISAMBIG["primary-name"]){
						transformations.push([selectVar, [selectPrimaryPosition, addLongForm, [addNameInitials, expandNamesInitials]]]);
					} else if (self.citation.strings["givenname-disambiguation-rule"] == self.STATIC.NAMEDISAMBIG["primary-name-with-initials"]){
						transformations.push([selectVar, [selectPrimaryPosition, addLongForm, [addNameInitials]]]);
					} else {
						transformations.push([selectVar, [selectPosition, addLongForm, [addNameInitials, expandNamesInitials]]]);
					}
				}
				if (self.citation.strings["disambiguate-add-year-suffix"] == "true"){
					transformations.push([addYearSuffix]);
				}
				var ret = self.Disambig.discreteTransformation(collision, transformations);
				return ret;
			}

			function register (cite){
				var source = self.State.Sources[cite.source].bibliography;
				var affectedSources = POSITIONTESTS.reduce(function(acc, subkey, counter){
					var context = CONTEXTS[subkey];
					context['area'] = "citation";
					var tuple = [cite.source, subkey];
					var execObj = self.Render.newExecObj();
					var output = self.Render.renderCite(source, context, execObj);
					var rules = {"vars":execObj.vars, "nameVars":(execObj.nameVars || []), "outputs": execObj.outputs};
					var count = Ambigs.add(tuple, output, rules);
					if (count > 1){
						var dis = disambiguate(Ambigs.spawn(output), context);
						Disambigs.integrate(dis);
						var affectedSources = Object.keys(Ambigs.spawn(output).Rules); //// TODO: <-- HACK. Get Source IDs from Ambigs by output without spawn() method.
						affectedSources.map(function(sourceID){
							if (acc.indexOf(sourceID) == -1){
								acc.push(sourceID);
							}
						})
					} else {
						var bb = Ambigs.spawn(output);
						Disambigs.integrate(bb);
					}
					return acc;
				}, []);
				return [Disambigs.Rules[cite.source][getsubkey(cite)], affectedSources];
			}

			function setup(cite, context){
				var rules, affectedSources;
				if (Ambigs.Rules[cite.source] == undefined){
					[rules, affectedSources] = register(context);
				} else {
					return [];
				}
				return affectedSources;
			}
			return {Ambigs:Ambigs,Disambigs:Disambigs,register:register,get:setup, getsubkey:getsubkey,getNameVars:getNameVars,getDateVars:getDateVars}
		})();

		self.CSL.Node.citation =  function (token, buildObj, scopeObj) {
			if (token.tokentype === self.STATIC.START) {
				self.Engine.citation = {"opts":{},"tokens":[],"sort":[]};
				self.citation = token;
				buildObj.sort = {tokens:[]};
				buildObj.area = "citation";
				token.strings["disambiguate-add-names"] = token.strings["disambiguate-add-names"] || "false";
				token.strings["disambiguate-add-givenname"] = token.strings["disambiguate-add-givenname"] || false;
				token.strings["givenname-disambiguation-rule"] = token.strings["givenname-disambiguation-rule"] || self.STATIC.NAMEDISAMBIG["none"];
				token.strings["disambiguate-add-year-suffix"] = token.strings["disambiguate-add-year-suffix"] || "false";
				token.strings["near-note-distance"] = parseInt(token.strings["near-note-distance"]) || 5;
				token.tokens = [];
				token.execs.push(self.CSL.Blob.citation);
				buildObj.tokens = token.tokens;
			} else if (token.tokentype == self.STATIC.END){
				if (self.Engine.citation.opts.hasOwnProperty("after-collapse-delimiter") === false){
					self.Engine.citation.opts["after-collapse-delimiter"] = (scopeObj.open.strings["after-collapse-delimiter"] || self.Engine.citation.opts["delimiter"]);
				}
				self.Engine.citation.tokens = [scopeObj.open];//buildObj.tokens;
				self.Engine.citation.sort = buildObj.sort;
			}
		};

		self.CSL.Blob.citation = function (token, source, context, execObj){
			var ret = this.Render.execTokens(token.tokens, self.Util.clone(source), context, execObj);
			if (context.prefix){
				ret = context.prefix.trim()+ " " + ret;
			}
			if (context.suffix){
				ret = ret + " " + context.suffix.trim();
			}
			return ret;
		}

		self.STATIC.NAMEDISAMBIG = {
			"none":0,
			"all-names":1,
			"all-names-with-initials":2,
			"primary-name":3,
			"primary-name-with-initials":4,
			"by-cite":5,
		}
		self.CSL.Attributes["@disambiguate-add-names"] = function(token, buildObj, arg){
			token.strings["disambiguate-add-names"] = arg;
		}
		self.CSL.Attributes["@disambiguate-add-givenname"] = function(token, buildObj, arg){
			token.strings["disambiguate-add-givenname"] = arg;
		}
		self.CSL.Attributes["@givenname-disambiguation-rule"] = function(token, buildObj, arg){
			token.strings["givenname-disambiguation-rule"] = self.STATIC.NAMEDISAMBIG[arg];
		}
		self.CSL.Attributes["@disambiguate-add-year-suffix"] = function(token, buildObj, arg){
			token.strings["disambiguate-add-year-suffix"] = arg;
		}
		self.Public["processCitationCluster"] = this.getFunction("processCitationCluster");
		self.Public["processSource"] = this.getFunction("processSource");
		
		return {Disambig:CiteDisambiguation};

	}).call(this);

	(function PositionAttribute(){
		self.CSL.Attributes["@near-note"] = function (token, buildObj, arg){
			//// register test w/ Style for disambig module.
			var positionTests = self.Style.getOpt("position-tests");
			if (positionTests.indexOf("near-note") == -1){
				positionTests.push("near-note");
			}
			this.Style.setOpt("position-tests", positionTests);
    		this.Style.setOpt("near-note-distance", parseInt(arg, 10));
		}
		self.CSL.Attributes["@position"] = function (token, buildObj, arg) {

			var positions = {
				"first":self.STATIC.POSITION_FIRST,
				"subsequent": self.STATIC.POSITION_SUBSEQUENT,
				"ibid":self.STATIC.POSITION_IBID,
				"ibid-with-locator":self.STATIC.POSITION_IBID_WITH_LOCATOR,
				"near-note": self.STATIC.POSITION_SUBSEQUENT,
				"far-note": self.STATIC.POSITION_SUBSEQUENT, /// citeproc extension
			}

			var positionTests = self.Style.getOpt("position-tests") || [];
			
			var trypositions = arg.split(/\s+/);
			var maketest = function(tryposition) {
				return function(source, context){
					if (context.area === "bibliography") {
					    return false;
					}
				    if (context.position === 0 && tryposition === 0) {
				        return true;
				    } else if ((tryposition > 0) && (context.position >= tryposition)) {
				        return true;
				    } 
					return false;
				}
			}
			for (var i=0,ilen=trypositions.length;i<ilen;i+=1) {
				var tryposition = trypositions[i];
				if (tryposition === "first") {
					tryposition = self.STATIC.POSITION_FIRST;
				} else if (tryposition === "subsequent") {
					tryposition = self.STATIC.POSITION_SUBSEQUENT;
				} else if (tryposition === "ibid") {
					tryposition = self.STATIC.POSITION_IBID;
				} else if (tryposition === "ibid-with-locator") {
					tryposition = self.STATIC.POSITION_IBID_WITH_LOCATOR;
				}
				if ("near-note" === tryposition) {
					token.tests.push(function (Item, item) {
					    if (item && item.position >= self.CSL.POSITION_SUBSEQUENT && item["near-note"]) {
					        return true;
					    }
					    return false;
					});
				} else if ("far-note" === tryposition) {
					token.tests.push(function (Item, item) {
					    if (item && item.position == self.CSL.POSITION_SUBSEQUENT && !item["near-note"]) {
					        return true;
					    }
					    return false;
					});
				} else {
					token.tests.push(maketest(tryposition));
				}
				//// register test w/ Style for disambig module.
				var positionTests = self.Style.getOpt("position-tests") || [];
				if (positionTests.indexOf(tryposition) == -1){
					positionTests.push(tryposition);
				}
				this.Style.setOpt("position-tests", positionTests);
			}
		};
	}).call(this);
}

function RangeModule(){
	var self = this;
	this.RangeUtil = (function(){
		var rangerex = /([a-zA-Z]*)([0-9]+)\s*(?:\u2013|-)\s*([a-zA-Z]*)([0-9]+)/;
		function stringify (lst, range_delimiter) { /// rangeType == "page" or "year"
			var len = lst.length;
			for (pos = 1; pos < len; pos += 2) {
				if ("object" === typeof lst[pos]) {
				    lst[pos] = lst[pos].join("");
				}
			}
			var ret = lst.join("");
			ret = ret.replace(/([^\\])\-/g, "$1"+range_delimiter);
			return ret;
		};
		function listify (str, range_delimiter) {
			var hyphens = "\\s+\\-\\s+";
	        var this_range_delimiter = range_delimiter === "-" ? "" : range_delimiter;
			var delimRex = new RegExp("([^\\\\])[-" + this_range_delimiter + "\\u2013]", "g");
			str = str.replace(delimRex, "$1 - ").replace(/\s+-\s+/g, " - ");
			var rexm = new RegExp("([a-zA-Z]*[0-9]+" + hyphens + "[a-zA-Z]*[0-9]+)", "g");
			var rexlst = new RegExp("[a-zA-Z]*[0-9]+" + hyphens + "[a-zA-Z]*[0-9]+");
			var m = str.match(rexm); /// consecutive ranges
			var lst = str.split(rexlst); /// nonconsecutive ranges
			if (lst.length === 0) {
				var ret = m;
			} else {
				var ret = [lst[0]];
				for (pos = 1, len = lst.length; pos < len; pos += 1) {
				    ret.push(m[pos - 1].replace(/\s*\-\s*/g, "-"));
				    ret.push(lst[pos]);
				}
			}
			return ret;
		};
		function expand (str, range_delimiter) {
			var str = "" + str;
			var lst = listify(str, range_delimiter);
			var len = lst.length;
			for (var pos = 1; pos < len; pos += 2) {
				var m = lst[pos].match(rangerex);
				if (m) {
				    if (!m[3] || m[1] === m[3]) {
//						m[2] = ""+parseInt(m[2],10); //// for normalizing
//						m[4] = ""+parseInt(m[4],10); //// for normalizing
				        if (m[4].length < m[2].length) {
				            m[4] = m[2].slice(0, (m[2].length - m[4].length)) + m[4];
				        }
				        if (parseInt(m[2], 10) < parseInt(m[4], 10)) {
				            m[3] = range_delimiter + m[1];
				            lst[pos] = m.slice(1);
				        }
				    }
				};
				if ("string" === typeof lst[pos]) {
				    lst[pos] = lst[pos].replace(/\-/g, range_delimiter);
				};
			};
			return lst;
		};
		function minimize (range, range_delimiter, minchars, isyear) {
			var lst = expand(range, range_delimiter);
			var len = lst.length;
			for (var i = 1, ilen = lst.length; i < ilen; i += 2) {
				lst[i][3] = minimize_internal(lst[i][1], lst[i][3], minchars, isyear);
				if (lst[i][2].slice(1) === lst[i][0]) {
				    lst[i][2] = range_delimiter;
				}
			}
			return stringify(lst, range_delimiter);
		};
		function minimize_internal (begin, end, minchars, isyear) {
			if (!minchars) {
				minchars = 0;
			}
			var b = ("" + begin).split("");
			var e = ("" + end).split("");
			var ret = e.slice();
			ret.reverse();
			if (b.length === e.length) {
				for (var i = 0, ilen = b.length; i < ilen; i += 1) {
				    if (b[i] === e[i] && ret.length > minchars) {
				        ret.pop();
				    } else {
				        if (minchars && isyear && ret.length === 3) {
				            var front = b.slice(0, i);
				            front.reverse();
				            ret = ret.concat(front);
				        }
				        break;
				    }
				}
			}
			ret.reverse();
			return ret.join("");
		};
		function chicago (range, range_delimiter) {
			var lst = expand(range, range_delimiter);
			var len = lst.length;
			for (pos = 1; pos < len; pos += 2) {
				if ("object" === typeof lst[pos]) {
				    var m = lst[pos];
				    var begin = parseInt(m[1], 10);
				    var end = parseInt(m[3], 10);
				    if (begin > 100 && begin % 100 && parseInt((begin / 100), 10) === parseInt((end / 100), 10)) {
				        m[3] = "" + (end % 100);
				    } else if (begin >= 10000) {
				        m[3] = "" + (end % 1000);
				    }
				}
				if (m[2].slice(1) === m[0]) {
				    m[2] = range_delimiter;
				}
			}
			return stringify(lst, range_delimiter);
		};
		function Format (range, rangeType, range_delimiter, range_format){
			var range_delimiter = range_delimiter || self.Style.getOpt(rangeType + "-range-delimiter") || "-"; // "-" is default delimiter for number variables.
			range_format = range_format || self.Style.getOpt(rangeType + "-range-format");
			if (range_format == undefined){
				return range
			} else if (range_format == "chicago"){
				return chicago(range, range_delimiter);
			} else if (range_format == "minimal"){
				return minimize(range, range_delimiter, 1);
			} else if (range_format == "minimal-two"){
				return minimize(range, range_delimiter, 2);
			} else if (range_format == "expanded") {
				return stringify(expand(range, range_delimiter), range_delimiter);
			}
		}
		function Page(range){
			return Format(range, "page");
		}
		function Year(range){
			return Format(range, "year");
		}

		return {page:Page, year:Year};
	}).call(this);
}


function TextModule(){
	var self = this;
	(function TextNode(){
		self.CSL.DATATYPES.push("text");
		self.CSL.Node.text = function(token, buildObj, scopeObj){
			if (token.macro){
				return self.Builder.buildMacro(buildObj.macros[token.macro], buildObj, token.macro)
			} else if (token.variables) {
				if (self.CSL.CITEVARIABLES.indexOf(token.variable) > -1){
					token.execs.push(this.CSL.Blob.contextualText);
				} else if (self.CSL.REFERENCEVARIABLES.indexOf(token.variable) > -1){
					if (token.variable == "year-suffix"){
						this.Style.setOpt("render-year-suffix-in-text", true);
					}
					token.execs.push(this.CSL.Blob.sourceInfo);
				} else {
					token.execs.push(this.CSL.Blob.text);
				}
			} else if (token.strings.term) {
				token.strings.form = token.strings.form || "long";
				token.execs.push(this.CSL.Blob.term);
			}
			else if (token.strings.value) {
				token.execs.push(this.CSL.Blob.value);
			}
			buildObj.tokens.push(token);
		};
		this.CSL.Blob.contextualText = function(token, Item, context, execObj){
			var value = (context[token.variable] || execObj[token.variable] || "");
			if (Array.isArray(value)){ //// anticipates locator arrays for styles with <container> nodes.
				value = value[0];
			}
			if (token.variable == "locator"){
				value = self.RangeUtil.page(""+value); /// user might pass integers for locator (even though spec says it's text).
			}
			return self.Decoration.decorate(value, token.strings, token.decorations, execObj);
		};
		this.CSL.Blob.sourceInfo = function(token, source, context, execObj){
			if (token.variable == "citation-number"){
				var value = (this.State.SourceIndex.indexOf(source.id)+1)+"";
			} else {
				var value = this.State.Sources[source.id][token.variable];
			}
			if ((token.variable == "year-suffix") && (typeof(value) == "number")){
				value = self.Util.intToLowerCase(value);
			} else {
				value = value || "";
			}
			return self.Decoration.decorate(value, token.strings, token.decorations, execObj);
		};
		this.CSL.Blob.text = function(token, Item, context, execObj){
			return self.Decoration.decorate(Item[token.variable], token.strings, token.decorations, execObj);
		};
		this.CSL.Blob.term = function(token, Item, context, execObj){
			var term = self.Locale.getTerm(token.strings.term, {form:(token.strings.form || "long")});
			return self.Decoration.decorate(term, token.strings, token.decorations, execObj);
		};
		this.CSL.Blob.value = function(token, Item, context, execObj){
			return self.Decoration.decorate(token.strings.value, token.strings, token.decorations, execObj);
		};
		
	}).call(this);

}

function NumberModule(){

	/// it is initially tempting to normalize number values to actual integers. However, this is the wrong approach.
	/// number values are just strings with fancy formatting options (like Romanizing, ordinalizing, & page ranges)
	/// parsing number ranges will not work. 

	var self = this;
	self.CSL.DATATYPES.push("number");
/*    LOCATOR = {
        "art.": "article",
        "bk.": "book",
        "ch.": "chapter",
        "subch.": "subchapter",
        "p.": "page",
        "pp.": "page",
        "para.": "paragraph",
        "subpara.": "subparagraph",
        "pt.": "part",
        "r.": "rule",
        "sec.": "section",
        "subsec.": "subsection",
        "sch.": "schedule",
        "tit.": "title",
        "col.": "column",
        "fig.": "figure",
        "fol.": "folio",
        "l.": "line",
        "n.": "note",
        "no.": "issue",
        "op.": "opus",
        "sv.": "sub-verbo",
        "vrs.": "verse",
        "vol.": "volume"
    };
    STATUTE_SUBDIV_STRINGS_REVERSE = {
        "article": "art.",
        "book": "bk.",
        "chapter": "ch.",
        "subchapter": "subch.",
        "page": "p.",
        "paragraph": "para.",
        "subparagraph": "subpara.",
        "part": "pt.",
        "rule": "r.",
        "section": "sec.",
        "subsection": "subsec.",
        "schedule": "sch.",
        "title": "tit.",
        "column": "col.",
        "figure": "fig.",
        "folio": "fol.",
        "line": "l.",
        "note": "n.",
        "issue": "no.",
        "opus": "op.",
        "sub-verbo": "sv.",
        "sub verbo": "sv.",
        "verse": "vrs.",
        "volume": "vol."
    };

    var firstword = value.split(/\s+/)[0];
    var firstlabel = CSL.STATUTE_SUBDIV_STRINGS[firstword];
    if (firstlabel) {*/

	var ROMAN_NUMERALS = [
	    [ "", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix" ],
	    [ "", "x", "xx", "xxx", "xl", "l", "lx", "lxx", "lxxx", "xc" ],
	    [ "", "c", "cc", "ccc", "cd", "d", "dc", "dcc", "dccc", "cm" ],
	    [ "", "m", "mm", "mmm", "mmmm", "mmmmm"]
	];

	var Romanize = function (num) {
		var ret, pos, n, numstr, len;
		ret = "";
		if (num < 6000) {
		    numstr = num.toString().split("");
		    numstr.reverse();
		    pos = 0;
		    n = 0;
		    len = numstr.length;
		    for (pos = 0; pos < len; pos += 1) {
		        n = parseInt(numstr[pos], 10);
		        ret = ROMAN_NUMERALS[pos][n] + ret;
		    }
		}
		return ret;
	};

	function is_plural(val){
		var rangeDelimiters = [",",", ","-","/","::","–"];
		if (Array.isArray(val)){ //// anticipates Names Module
			return (val.length > 1);
		} else if (typeof(val) == "string"){
			var ret = rangeDelimiters.filter(function(delim){
				return val.indexOf(delim) > -1;
			})
			return (ret.length > 0);
		}
	}

	self.CSL.Blob.label = function(token, Item, context, execObj){
		var val = Item[token.variable];
		varname = token.variable;
		if (token.strings.plural == "always"){
			var plural = true;
		} else if (token.strings.plural == "never"){
			var plural = false;
		} else { /// token.strings.plural== "contextual"
			if (token.variable.slice(0,10) == "number-of-"){
				varname = token.variable.slice(10, -1);
				var plural = (parseInt(val) > 1);
			} else {
				var plural = is_plural(val);
			}
		}
		var term = self.Locale.getTerm(varname, { form: token.strings.form, plural:plural});
		return self.Decoration.decorate(term, token.strings, token.decorations, execObj);
	};
	self.CSL.Blob.Number = function NumberBlob(token, Item, context, execObj){
		var varname = token.variables[0];
		var value = (""+Item[varname]).replace(/^0+/, ''); /// remove leading 0's for normalizing strings
		if ("page" == varname){ /// page range support.
			var value = self.RangeUtil.page(value);
		};
		if (parseInt(value, 10)==NaN){//// If there are non-numeric characters --> no formatting
			var result = value || "";
		} else {
			var form = token.strings.form || "numeric"; // ["numeric","ordinal","long-ordinal","roman"]
			if (form == "ordinal"){
				var gender = this.Locale.getTermGender(varname);
				var result = this.Locale.getOrdinal(value, {form:"short",gender:gender});
			} else if (form == "long-ordinal"){
				var gender = this.Locale.getTermGender(varname);
				var result = this.Locale.getOrdinal(value, {form:"long",gender:gender});
			} else if (form == "roman") {
				var result = Romanize(value);
			} else {
				var result = ""+value;
			}
		}
		return self.Decoration.decorate(result, token.strings, token.decorations, execObj);
	};
	self.CSL.Node.number = function(token, buildObj, scopeObj) {
		if (token.variables){
			token.execs.push(this.CSL.Blob.Number);
		}
		buildObj.tokens.push(token);
	};
	this.CSL.Node.label = function (token, buildObj, scopeObj){
		token.strings.form = token.strings.form || "long";
		token.strings.plural = token.strings.plural || "contextual";
		if (token.hasOwnProperty("variables")){
			token.variable = token.variables[0];
		}
		token.execs.push(this.CSL.Blob.label);
		buildObj.tokens.push(token);
	};
	self.CSL.Attributes["@page-range-format"] = function(token, buildObj, arg){
		if (token.name == "style"){
			this.Style.setOpt("page-range-format", arg);
		}

	}
	self.Style.setOpt("page-range-delimiter", "-"); /// default page-range-delimiter;
	self.CSL.Attributes["@page-range-delimiter"] = function(token, buildObj, arg){
		if (token.name == "style"){
			this.Style.setOpt("page-range-delimiter", arg);
		}
	}

};



function StyleAttributesModule(){
	var self = this;
	self.CSL.Attributes["@version"] = function (token, buildObj, arg) {
		//// do nothing right now
	}
	self.CSL.Attributes["@class"] = function (token, buildObj, arg) {
		if (arg == "note"){

		} else if (arg = "in-text"){

		}
		//// do nothing right now
	}
	self.CSL.Attributes["@xmlns"] = function (token, buildObj, arg) {}
	self.CSL.Attributes["@punctuation-in-quote"] = function (token, buildObj, arg) {}
}



function DateModule(){

	this.CSL.DATATYPES.push("date");

	(function DateModule(){
		var self = this;
/*		var LocaleDateParse = function(){
			var numeric = self.Local.getDateFormat('numeric');
			var textual = self.Local.getDateFormat('text');
			var months = monthValues.reduce( function(acc, month){
				var long = self.Locale.getTerm(month, {form:"long"});
				var short = self.Locale.getTerm(month, {form:"short"});
				if (long != undefined){
					acc.long.push(long);
				}
				if (short != undefined){
					acc.short.push(short);
				}
				return acc;
			},{long:[],short:[]})

			var monthRegex = new RegExp(months.join('|'), gi)
			
			function parseDateString(str){
				var ret = {}
				str.replace(monthRegex, function(match){
					ret['month'] = match;
					return "";
				})
			}
			
			function update(){}
		})*/

		function parseDateArray(arr){
			var ret = {}
			if (arr.length ==1){
				return {year:arr[0]};
			} else if (arr.length == 2){
				if (arr[1].length > arr[0].length){
					ret['month'] = arr[0];
					ret['year'] = arr[1];
				} else {
					ret['month'] = arr[1];
					ret['year'] = arr[0];
				}
				return ret;
			} else if (arr.length == 3) {
				ret['month'] = arr[1];
				if (arr[0].length > 2){
					ret['year'] = arr[0];
					ret['day'] = arr[2];
				} else if (arr[2].length > 2){
					ret['year'] = arr[2];
					ret['day'] = arr[0];
				} else if (arr[0] < 2){
					ret['year'] = arr[2];
					ret['day'] = arr[0];
				} else if (arr[2] < 2){
					ret['year'] = arr[0];
					ret['day'] = arr[2];
				} else {
					self.Locale.getDateFormat('numeric').tokens.map(function(tok){
						ret[datePart] = arr[index];
					});
				}
				return ret;
			}
		}

    	function parseDateString (string){
			/// Can't assume that user data conforms to Locale spec. We assume that date-part delimiters are more numerous than date range-delimiters
			/// TODO: kanji support should be defined in locale file.
			var delimiterCounts = [{key:"/",count:0},{key:"-",count:0}];
			delimiterCounts.reduce(function(acc, obj){
				obj.count = string.split(obj.key).length;
				return ""
			},"")
			delimiterCounts.sort(function(a,b){
				return b.count - a.count;
			})
			if (delimiterCounts[1].count > 1){
				var dates = string.split(delimiterCounts[1].key).map(function(datestr){
					return datestr.split(delimiterCounts[0].key);
				});
			} else {
				var date = string.split(delimiterCounts[0].key)
				if ((date[0].length > 2) && (date[1].length > 2)){ /// CSLTEST date8-string-date-input
					var dates = [[date[0]],[date[1]]];
				} else {
					var dates = [date];
				}
			}
			return dates.map(function(date){
				return parseDateArray(date);
			})
		};

		self.Locale.Date = (function(){//// Default tokens
			state = {numeric:{},text:{}}
			return {state:state};
		})()

		self.CSL.Blob.date = function DateBlob(token, source, context, execObj){
			if (!execObj.disambig["primaryDateToken"]){ /// for cite grouping.
				execObj.disambig["primaryDateToken"] = token;
			}

			var varname = token.variables[0];
			var dateList = source[varname] || [];
			if (typeof(dateList) == "string"){
				dateList = parseDateString(dateList);
			}
			var yearPos = token.dateOrder.indexOf('year');
			var monthPos = token.dateOrder.indexOf('month');
			var dayPos = token.dateOrder.indexOf('day');
			var Positions = {year:yearPos,month:monthPos,day:dayPos}
			if (dateList.length == 0){
				return [""];
			}			
			var ret = [];

			//// begin year-suffix //////
//			if (execObj.disambig["add-year-suffix"]){
//				if (execObj.disambig["add-year-suffix"][0] === varname){
			var yearSuffix = ""
			execObj.disambig["year-suffix"] = ""; /// NOTE: not the same as "add-year-suffix"; this is a temporary disambig variable.
			if (self.State.Sources[source.id].hasOwnProperty("year-suffix")){ //// This is a liability --> trusting a source to have accurate information about disambiguation. No better way; but be careful.
				if (self.State.Sources[source.id]["year-suffix-variable"] == varname){
					if (!self.Style.getOpt("render-year-suffix-in-text")){
						if (execObj.disambig.hasOwnProperty("add-year-suffix")){ //// needed to support cite grouping
							yearSuffix = execObj.disambig["add-year-suffix"][1];
						} else { //// bibliography context doesn't have disambig.
							yearSuffix = self.State.Sources[source.id]["year-suffix"]; 
						}
						if (typeof(yearSuffix) === "number"){ ////suffix will be type "string" only if there has been a cite collapse.
							yearSuffix = self.Util.intToLowerCase(yearSuffix);
						}
					}
				}
			} ///// end year-suffix /////


			if (dateList.length == 1){ //// If there is no date range; it's easy-peasy.
				execObj.disambig["year-suffix"] = yearSuffix;
				return self.CSL.Blob.group.call(this, token, dateList[0], context, execObj);
			}

			//// date ranges are ugly right now. We are changing token strings, which violates our design philosophy.
			//// not sure if dropping prefixes is a desired behavior; esp. for internationalization.
			dateList = this.Util.clone(dateList); //// clone before transformations
			var droppedSuffixTok //// token before range-delimiter has suffix suppressed.
//			var droppedPrefixTok //// token after range-delimiter has prefix suppressed.
			if (dateList[0].year != dateList[1].year){
				var rangeDelimiter = "year"
				droppedSuffixTok = token.tokens.slice(-1)[0];
//				droppedPrefixTok = token.tokens.slice(0,1)[0];
			} else if (dateList[0].month != dateList[1].month){
				var rangeDelimiter = "month";
				if (yearPos < monthPos){
					delete dateList[1].year;
				} else {
					delete dateList[0].year;
				}
				droppedSuffixTok = token.tokens.reduce(function(acc, tok){
					if (tok.strings.name != "year"){ return tok } else {
						return acc
					}
				}, token); //// returns last token that is not a year-part
//				droppedPrefixTok = token.tokens.filter(function(tok){
//					if (tok.strings.name != "year"){ return tok } 
//				})[0]; //// return first token that is not a year-part
			} else if (dateList[0].day != dateList[1].day){
				var rangeDelimiter = "day";
				if (yearPos < dayPos){
					delete dateList[1].year;
				} else {
					delete dateList[0].year;
				}
				if (monthPos < dayPos){
					delete dateList[1].month;
				} else {
					delete dateList[0].month;
				}
				droppedSuffixTok = token.tokens.filter(function(tok){
					if (tok.strings.name == "day"){ return tok } 
				})[0];
//				droppedPrefixTok = token.tokens.slice(0,1)[0];; //// return first token that is not a year-part
			}

			var droppedSuffix = droppedSuffixTok.strings.suffix || ""; /// drop suffix on date-part token
//			var droppedPrefix = droppedPrefixTok.strings.prefix || ""; /// drop suffix on date-part token
			droppedSuffixTok.strings.suffix = "";

			var prefix = token.strings.prefix || ""; /// drop suffix on date-token
			var suffix = token.strings.suffix || "";	
			token.strings.suffix="";

			ret = dateList.reduce(function(acc, dateObj, index){
				var val = self.CSL.Blob.group.call(self, token, dateObj, context, execObj)
				acc = acc.concat(val)
				if (index == 0){ //// set variables for 2nd part of range
					token.strings.prefix="";
					acc = acc.concat(self.Decoration.decorate(token.delimiters[rangeDelimiter], token.strings, token.decorations, execObj));
					droppedSuffixTok.strings.suffix = droppedSuffix; /// add suffix back to tail token
					token.strings.suffix=suffix; /// reset suffix.
					execObj.disambig["year-suffix"] = yearSuffix; //// add year-suffix
//					droppedPrefixTok.strings.prefix = "";
				} else { //// cleanup after finishing range
					token.strings.prefix=prefix;
//					droppedPrefixTok.strings.prefix = droppedPrefix;
				}
				return acc;
			}, ret);
//			delete execObj.disambig["year-suffix"]; //// delete temp variable. Don't want extraneous variables being saved to Disambig state.
			return ret;
		};

		self.CSL.Node.date = function(token, buildObj, scopeObj){
			if (token.tokentype == self.STATIC.SINGLETON){
				var form = token.strings.form || "text"; /// Singletons are forced to locale form.
				var localeToken = this.Locale.getDateFormat(form);
				if (localeToken == undefined){
					console.log("ERROR: expected locale date is undefined.");
				}
				this.Decoration.applyInheritance(token.decorations, buildObj.decorations);
				//// Ambiguous whether DATE can inherit "@text-case" attribute from locale Date
				this.Decoration.applyInheritance(token.decorations, localeToken.decorations);
				if ((localeToken.decorations["@text-case"] != undefined) && (token.decorations["@text-case"] == undefined)){
					token.decorations["@text-case"] = localeToken.decorations["@text-case"];
				}
				//// end ambiguity
				this.Decoration.applyInheritance(token.strings, localeToken.strings); /// can inherit "delimiter"

				token.tokens = localeToken.tokens.map(function(childTok){ 
					var tok = self.Builder.cloneToken(childTok);// clone localized date-parts
					//// apply decorator inheritance while we are in the loop.
					self.Decoration.applyInheritance(tok.decorations, token.decorations);
					if (tok.strings.name == "month"){
						if ((token.decorations["@text-case"] != undefined) && (tok.decorations["@text-case"] == undefined)){
							tok.decorations["@text-case"] = token.decorations["@text-case"];
						}
					}
					return tok;
				})
				token.delimiters = localeToken.delimiters;
				token.dateOrder = localeToken.dateOrder;
				token.strings = localeToken.strings;
				buildObj.tokens.push(token);
				token.execs.push(self.CSL.Blob.date);
			} else if (token.tokentype == self.STATIC.START){
				var form = token.strings.form;
				if ((form == "numeric") || (form=="text")){
					if (buildObj.area != "locale"){
						var localeToken = this.Locale.getDateFormat(form);
						this.Decoration.applyInheritance(token.decorations, buildObj.decorations);
						this.Decoration.applyInheritance(token.decorations, localeToken.decorations);
						this.Decoration.applyInheritance(token.strings, localeToken.strings);
						token.tokens = localeToken.tokens.map(function(childTok){
							var tok = self.Builder.cloneToken(childTok);// clone localized date-parts
							//// apply decorator inheritance while we are in the loop.
							self.Decoration.applyInheritance(tok.decorations, token.decorations);
							if (tok.strings.name == "month"){
								if ((token.decorations["@text-case"] != undefined) && (tok.decorations["@text-case"] == undefined)){
									tok.decorations["@text-case"] = token.decorations["@text-case"];
								}
							}
							return tok;
						})
					} else if (buildObj.area == "locale"){	//// Locale date cannot take affixes
						delete token.strings.prefix;
						delete token.strings.suffix;
					}
				} else {
//					console.log('ERROR: No date-part elements defined in locale.')
				}
				self.Group.ParentNodeStart.call(this, token, buildObj);/// let group node deal with styling inheritance
			} else if (token.tokentype == self.STATIC.END){
				self.Group.ParentNodeEnd.call(this, scopeObj.open, buildObj);
				scopeObj.open["delimiters"] = {};
				scopeObj.open["dateOrder"] = scopeObj.open.tokens.map(function(tok){
					scopeObj.open.delimiters[tok.strings.name] = tok.strings["@range-delimiter"] || "–"; //// em-dash is default value (CSL date ranges)
					return tok.strings.name;
				});
				scopeObj.open.tokens.map(function(tok){
					//// apply decorator inheritance while we are in the loop.
					self.Decoration.applyInheritance(tok.decorations, scopeObj.open.decorations);
				});
				if (buildObj.area == "locale"){
					var form = scopeObj.open.strings.form || "text";
					this.Locale.setDateFormat(form, scopeObj.open, buildObj.lang)
				} else {
					scopeObj.open.execs.push(self.CSL.Blob.date);
					buildObj.tokens.push(scopeObj.open);
				}
			}
		};
		self.CSL.Node["date-part"] = function(token, buildObj, scopeObj){
			var arr = buildObj.tokens.filter(function(item){return item.strings.name == token.strings.name})
			if (arr.length){ //// using Locale-defined date format
				var tok = arr[0];

				// applyInheritance culls these 2 attributes, b/c outside of dates, they are not inheritable.
				var textCase = tok.decorations["@text-case"];
				var stripPeriods = tok.decorations["@strip-periods"];
				this.Decoration.applyInheritance(token.decorations, tok.decorations);
				tok.decorations = token.decorations;
				if ((token.decorations["@text-case"] == undefined) && (textCase != undefined)){
					tok.decorations["@text-case"] = textCase;
				}
				if ((token.decorations["@strip-periods"] == undefined) && (stripPeriods != undefined)){
					tok.decorations["@strip-periods"] = stripPeriods;
				}

				delete token.strings.suffix;// Non-locale date-parts cannot set affixes for localized dates
				delete token.strings.prefix;
				tok.strings = this.Decoration.applyInheritance(token.strings, tok.strings);/// locale date-parts can inherit "@form" & "@range-delimiter" attributes.
			} else { //// creating date format from scratch
				buildObj.tokens.push(token);
				if (token.strings.name == "day"){
					token.execs.push(self.CSL.Blob.dayPart);
				} else if (token.strings.name == "month"){
					token.execs.push(self.CSL.Blob.monthPart);
				} else if (token.strings.name == "year"){
					token.execs.push(self.CSL.Blob.yearPart);
				}
			}
		};
		self.CSL.Blob.dayPart = function(token, date, context, execObj){
			var form = token.strings.form || "numeric"; ////
			var value = date.day || "";
			if (value == ""){ return this.Decoration.decorate("", token.strings, token.decorations, execObj) }
			// do NOT display day-part if there is a year-part, but no month-part --> would make no sense.
			// if only has day-part, it is probably part of a date range.
/*			if ((date.month || "") == ""){
				if ((date.year || "") != ""){
					return this.Decoration.decorate("", token, execObj);
				}
			} */
			value = (""+value).replace(/^0+/, '');
			if (form == "ordinal"){
				if (self.Locale.getOption("limit-day-ordinals-to-day-1")) {
					if ((value == "1") || (value=="01")){
						var gender = this.Locale.getTermGender("day")
						var result = this.Locale.getOrdinal(value, {form:"short",gender:gender});
					} else {
						var result = value;
					}
				} else {
					var gender = this.Locale.getTermGender("day")
					var result = this.Locale.getOrdinal(value, {form:"short",gender:gender});
				}
			} else if (form == "numeric-leading-zeros"){
				var result = ""+ value
				if (result.length == 1){
					result = "0"+result;
				}
			} else {
				if ((value.length == 2) && (value[0]=="0")){
					value.splice(0,1);
				}
				var result = value;
			}
			return this.Decoration.decorate(result, token.strings, token.decorations, execObj);
		}
		self.CSL.Blob.yearPart = function(token, date, context, execObj){
			var form = token.strings.form || "long"; ////
			var value = date.year || "";
//			if (execObj.disambig["year-suffix"]){
//				console.log(execObj.disambig)
//			}
			value = ""+value + (execObj.disambig["year-suffix"] || "");
			if (form == "short"){
				return this.Decoration.decorate(value.slice(-2), token.strings, token.decorations, execObj);
			}
			return this.Decoration.decorate(value, token.strings, token.decorations, execObj);
		}
		self.CSL.Blob.monthPart = function(token, date, context, execObj){
			var form = token.strings.form || "long"; ////"long" is default
			var value = date.month || "";
			if (value == 0){return ""}
			value = (""+value).replace(/^0+/, '');
			if (value.length == 0){
				return ""
			}
			if (value.indexOf("season") > -1){
				if (form != "short") {form = "long"};
				value = this.Locale.getTerm(value, {form:form})
			} else if (form == "numeric"){
				if (value.indexOf("month-") > -1){
					value = value.slice(6);
				}
				if (value.indexOf("0") == 0){
					value = value.slice(1);
				}
			} else if (form == "numeric-leading-zeros"){
				if (value.indexOf("month-") > -1){
					value = value.slice(6);
				}
				if (value.length == 1){
					value = "0"+value;
				}
			} else if (form == "long"){
				if (value.length == 1){
					value = "0"+value;
				}
				if (value.indexOf("month-") == -1){
					value = "month-"+value;
				}
				value = this.Locale.getTerm(value, {form:form});
			} else if (form == "short"){
				if (value.length == 1){
					value = "0"+value;
				}
				if (value.indexOf("month-") == -1){
					value = "month-"+value;
				}
				value = this.Locale.getTerm(value, {form:form});
			}
			return this.Decoration.decorate(value, token.strings, token.decorations, execObj);
		}

		self.CSL.Attributes["@range-delimiter"] = function(token, buildObj, arg){
			token.strings["@range-delimiter"] = arg;
		}

	}).call(this);
}



function NameModule(){
//// et.al set?
// no --> and, delimiter-precedes-last
// yes --> POSITION
//// delimiter-precedes-et-al
//// et-al-min / et-al-use-first
//// et-al-subsequent-min/ et-al-subsequent-use-first
//// et-al-use-last 
//// locale?
////// form
////// initialize-with
//////// initialize
////// name as sort order
////// sort-separator

	var self = this;
	self.CSL.DATATYPES.push("names");
	self.CSL.LatinCyrillicLocales = [];
	self.CSL.NonLatinCyrillicLocales = [];
	var State = {};
	State.Persons = {}; //// stores name info by hash.
	State.PersonsList = [];
	State.FamilyNames = {}; //// required for global name disambiguation
	State.PrimaryNames = {}; //// required for global primary name disambiguation
	self.State.Names = State;
	var familyNames = {};
	var Names = {"name-parts": ["given","family","dropping-particle","non-dropping-particle","suffix"]};

	function extractNames(item, callback){
		var self = this;
		var primaryName = true;
		var nameVars = (self.Style.varsByType("names") || []);
		nameVars.map(function(key){
			if (item.hasOwnProperty(key)){
				var persons = item[key];
				if (Array.isArray(persons)){
					persons = persons.map(function(person){
						if (person.hasOwnProperty('institution')) {
							person.family = person.institution;
							delete person.institution;
						}
						var ID = self.Hash.person(person) //// ID == hash of name --> easy comparison.
						if (!State.Persons.hasOwnProperty(ID)){
							State.Persons[ID] = person; /// register family names
							if (State.FamilyNames[person.family] == undefined){
								State.FamilyNames[person.family] = []
							}
							State.FamilyNames[person.family].push(ID);
							if (primaryName){ //// register primary names
								if (State.PrimaryNames[person.family] == undefined){
									State.PrimaryNames[person.family] = []
								}
								State.PrimaryNames[person.family].push(ID);
								primaryName = false;
							}
							self.Relationships.add({"person":ID,"source":item.id})
						}
						return ID
					})
					item[key] = persons; //// replace nameList with list of personIDs.
				}
			}
		});
		return callback(item);
	}

	var NameDisambiguation = (function(){ /// global name disambiguation
		//// Developer Note: unlike by-cite name disambiguation, global name disambiguation does not require access to name tokens.
		var self = this;
		function addLongForm(ID, rules, counter, output){
			var nameDelimiter = " "; /// would be important to get actual value from token.
			rules["name-form"] = "long";
			rules["initialsLength"] = 1;
			var name = self.State.Names.Persons[ID];
			if (counter > 0){ /// counter rules prevent infinite loops.
				return [output, rules];
			}
			var rez= [name.family, (name["dropping-particle"] ||""), (name["non-dropping-particle"] || ""), (name["suffix"] || ""), (name.given || "").slice(0,1)].join(nameDelimiter);
			return [rez, rules];		
		}

		function addNameInitials(ID, rules, counter, output){
			var hyphen = ("-" || ""); /// would be important to get actual value from token.
			var nameDelimiter = " "; /// would be important to get actual value from token.
			rules["initialsLength"] = counter+1;
			var givenName = self.State.Names.Persons[ID].given || "";
			if (!self.Style.getOpt("initialize-with-hyphen")){
				var hyphen = "-";
			} else {
				var hyphen = "";
			}
			var rez = givenName.split(" ").map(function(str){
				return str.split("-").map(function(sub_str){
					return sub_str.slice(0,1);
				}).join(hyphen);
			}).join("");
			if (counter == rez.length){
				return [output, rules]
			}
			return [rez.slice(0, counter+1), rules];
		}

		function expandNameInitials(ID, rules, counter, output){
			var hyphen = ("-" || ""); /// would be important to get actual value from token.
			var nameDelimiter = " "; /// would be important to get actual value from token.
			if (rules["expandInitials"] == undefined){rules["expandInitials"] = [];}
			rules["expandInitials"].push(counter);
			var givenName = self.State.Names.Persons[ID].given || "";
			if (counter > givenName.split(" ").length){
				return output;
			}
			var rez = givenName.split(" ").map(function(str, index){
				if (rules["expandInitials"].indexOf(index) > -1){
					return str;
				}
				return str.split("-").map(function(sub_str){
					return sub_str.slice(0,1);
				}).join(hyphen);
			}).slice(0, counter+1).join(" ");
			return [rez, rules];
		}

		function disambiguateNameArray (names, noExpansion){
			if (noExpansion){
				var transformations = [[addLongForm],[addNameInitials]];
			} else {
				var transformations = [[addLongForm],[addNameInitials],[expandNameInitials]];
			}
			var collision = self.Disambig.CollisionKeeper();
			var ambigs = names.reduce(function(acc, nameID){
				var familyName = self.State.Names.Persons[nameID].family;
				var count = collision.add(nameID, familyName);
				if (count > 1){
					acc.push(familyName);
				}
				return acc;
			}, []);
			rez = self.Disambig.discreteTransformation(collision, transformations);
			return rez;
		}

		return {disambiguateNameArray:disambiguateNameArray};
	}).call(this);
	Names.Disambiguate = NameDisambiguation;


	this.CSL.Node.names = function(token, buildObj, scopeObj){
		token.strings.area = buildObj.area; // need to know if we are sorting
		if (token.tokentype != this.STATIC.END){
			self.Group.ParentNodeStart.call(this, token, buildObj);/// let group node deal with styling inheritance
			if ((token.variables.indexOf("editor") > -1) && (token.variables.indexOf("translator") > -1)){
				token.strings["editorTranslator"] = true; // sets flag to look for editor-translator special condition.
			}
			token.execs.push(this.CSL.Blob.names);
		}
		if (token.tokentype != self.STATIC.START){
			var tok = scopeObj.open || token;
			tok.strings.delimiter = (tok.strings.delimiter || "; ");// "; " is default delimiter between output of separate name variables.

			/// <name> ///
			var nameTok = tok.tokens.filter(function(childTok){ return childTok.name=="name" })
			if (nameTok.length == 0) {
				nameTok.push(new this.Builder.Token("name", this.CSL.SINGLETON));
				this.Decoration.applyInheritance(nameTok[0].decorations, tok.decorations);
				/// name node needs to know its decorations before being constructed.
				this.CSL.Node["name"].call(this, nameTok[0], buildObj, {});
			}
			tok["nameIndex"] = tok.tokens.indexOf(nameTok[0]);
			nameTok[0].parentDecorations = tok.decorations;

			/// et-al ///
			var etAl = tok.tokens.filter(function(childTok, index, array){ return childTok.name=="et-al" })
			if (etAl.length == 0) {
				nameTok[0]["etAl"] = new this.Builder.Token("et-al", this.STATIC.SINGLETON);
				this.CSL.Node["et-al"].call(this, nameTok[0]["etAl"], buildObj, {});
			} else {
				nameTok[0]["etAl"] = etAl[0];
			}
			this.Decoration.applyInheritance(nameTok[0]["etAl"].decorations, nameTok[0].decorations);
			tok.tokens.splice(tok.tokens.indexOf(nameTok[0]["etAl"]), 1);

			//// label ///
			tok["label"]={};
			// get decorations & strings from label
			var labels = tok.tokens.filter(function(childTok, index, array){
				if (childTok.name=="label"){
					tok["labelIndex"] = index;
					return childTok
				}
			})
			if (labels.length){
				tok.tokens.splice(tok["labelIndex"], 1);
				var labelDecorations = this.Decoration.applyInheritance(labels[0].decorations, tok.decorations);
				var labelStrings = labels[0].strings;
				/// create label token for each variable
				var variables = tok.variables.slice();// shallow copy;
				if (tok.strings.editorTranslator){ /// add editor-translator node if required
					variables.push("editortranslator");
				} 
				variables.map(function(variable){ 
					tok.label[variable] = new self.Builder.Token("label", self.STATIC.SINGLETON);
					tok.label[variable].variables = [variable];
					self.CSL.Node.label.call(self, tok.label[variable], buildObj, {});
					tok.tokens.splice(tok.tokens.indexOf(tok.label[variable]), 1);
					self.Decoration.applyInheritance(tok.label[variable].decorations, labelDecorations);
					self.Decoration.applyInheritance(tok.label[variable].strings, labelStrings);
				}) 
			}

			//// substitute /// 
			var substitute = tok.tokens.filter(function(childTok, index, array){ return childTok.name=="substitute" })
			if (substitute.length) {
				tok["substitute"] = substitute[0];
				this.Decoration.applyInheritance(tok["substitute"].decorations, tok.decorations);
				tok.tokens.splice(tok.tokens.indexOf(tok["substitute"]), 1);
			}

			self.Group.ParentNodeEnd.call(this, tok, buildObj);/// let group node deal with styling inheritance
			buildObj.tokens.push(tok);
		}

	};
	this.CSL.Node["name"] = function(token, buildObj, scopeObj){
		if (token.tokentype != this.STATIC.END){
			/* make sure global option is set */
			if (this.Style.getOpt("initialize-with-hyphen") == undefined){
				this.Style.setOpt("initialize-with-hyphen", true);
			}

			/* Inheritable Name options */
			token.strings.delimiter = (token.strings.delimiter || this.Style.getOpt("name-delimiter"))
			token.strings.form = (token.strings.form || this.Style.getOpt("name-form"))
			if (buildObj.subarea == "sort"){
				token.strings["et-al-min"] = (buildObj["names-min"] || token.strings["et-al-min"]);
				token.strings["et-al-use-first"] = (buildObj["names-use-first"] || token.strings["et-al-use-first"]);
				token.strings["et-al-use-last"] = (buildObj["names-use-last"] || token.strings["et-al-use-last"]);
				token.strings["et-al"] = ""; /// et-al value is not used for sorting
				token.strings["delimiter-precedes-et-al"] = "never"; //// we dont need delimiter before etal b/c etal is unused.
			}
			/* end Inheritable Name options */

			self.Group.ParentNodeStart(token, buildObj);
			token.strings.and = token.strings.and || "";
			token.strings.delimiter = token.strings.delimiter || ", "; // default is ", "
			token.strings["delimiter-precedes-et-al"] = token.strings["delimiter-precedes-et-al"] || "contextual";
			token.strings["delimiter-precedes-last"] = token.strings["delimiter-precedes-last"] || "contextual";
			if (token.strings["el-al-min"]){
				token.strings["el-al-subsequent-min"] = token.strings["el-al-subsequent-min"] || token.strings["et-al-min"]; /// subsequent defaults to default.
			}
			if (token.strings["el-al-use-first"]){
				token.strings["el-al-subsequent-use-first"] = token.strings["el-al-subsequent-use-first"] || token.strings["et-al-use-first"]; /// subsequent defaults to default.
			}
			token.strings["et-al-use-last"] = ((token.strings["et-al-use-last"] || "false") == "true") // false is default;
			token.strings.form = token.strings.form || "long";
			token.strings.initialize = ((token.strings.initialize || "true") == "true"); //true is default
			token.strings["sort-separator"] = token.strings["sort-separator"] || ", "; //", " is default
			token.strings.area = buildObj.area; /// "locale","bibliography","citation", etc..
			buildObj.nameToken = token;
		}
		if (token.tokentype != this.STATIC.START){
			var tok = scopeObj.open || token;
			buildObj.nameToken = tok;	
			tok.execs.push(this.CSL.Blob.Name);
			if (tok.family == undefined){
				tok.family = new this.Builder.Token("name-part", this.STATIC.SINGLETON);
				tok.family.strings["name"] = "family";
				this.CSL.Node["name-part"].call(this, tok.family, buildObj, {});
			}
			this.Decoration.applyInheritance(tok.family.decorations, tok.decorations);
			if (tok.given == undefined){
				tok.given = new this.Builder.Token("name-part", this.STATIC.SINGLETON);
				tok.given.strings["name"] = "given";
				this.CSL.Node["name-part"].call(this, tok.given, buildObj, {});
			}
			this.Decoration.applyInheritance(tok.given.decorations, tok.decorations);
			if (tok.suffix == undefined){
				tok.suffix = new this.Builder.Token("name-part", this.STATIC.SINGLETON);
				tok.suffix.strings["name"] = "suffix";
				this.CSL.Node["name-part"].call(this, tok.suffix, buildObj, {});
			}
			this.Decoration.applyInheritance(tok.suffix.decorations, tok.decorations);

			delete buildObj.nameToken;
			self.Group.ParentNodeEnd(tok, buildObj);
			if (tok.strings.and){
				this.Decoration.applyInheritance(tok["and"].decorations, buildObj.decorations);
			}
			buildObj.tokens.push(tok);
		}
	};
	this.CSL.Node["name-part"] = function (token, buildObj, scopeObj, execObj){
		if (token.tokentype != this.STATIC.END){
			token.strings.subarea = buildObj.subarea; /// "sort","layout", etc
			token.strings["demote-non-dropping-particle"] = (this.Style.getOpt("demote-non-dropping-particle") || this.STATIC.NEVER);
			if (token.strings.name == "family"){
				buildObj.nameToken.family = token;
				token.execs.push(this.CSL.Blob.familyPart);
			} else if (token.strings.name == "given"){
				buildObj.nameToken.given = token;
				token.execs.push(this.CSL.Blob.givenPart);
			} else if (token.strings.name == "suffix"){
//				buildObj.nameToken.suffix = token; // remove comment tics to enable suffixPart in styles.
				token.execs.push(this.CSL.Blob.suffixPart);
			}
			token.strings.area = buildObj.area;
		}
	};
	this.CSL.Node["et-al"] = function (token, buildObj, scopeObj){
		token.strings.term = token.strings.term || "and others";
		token.execs.push(this.CSL.Blob.term);
		buildObj.tokens.push(token);
	};

	this.CSL.Node.substitute = function (token, buildObj, scopeObj){
		if (token.tokentype != self.STATIC.END){
			buildObj.tokens.push(token);
			token.execs.push(this.CSL.Blob.substitute);
			self.Group.ParentNodeStart(token, buildObj, scopeObj)
		}
		if (token.tokentype != self.STATIC.START){
			var tok = scopeObj.open || token;
			self.Group.ParentNodeEnd(tok, buildObj, scopeObj)
		}
		
	};

	this.CSL.Blob.substitute = function (token, source, context, execObj){
		var next, rez;
		var length = execObj.vars.length;
		var result = token.tokens.reduce(function(acc, tok, index){
			if (acc.length != 0){
				return acc;
			}
			[next, rez] = self.Render.tokenExec(tok, index, source, context, execObj)
			if ((rez.length > 1)||((rez[0]) && (rez[0]!=""))){
				acc = acc.concat(rez);
				var used = execObj.vars.slice(length);
				used.map(function(varname){
					delete (source[varname]);
				})
			}
			return acc;
		}, []);
/*		if (!execObj.disambig["substitute"]){ ///// for cite grouping.
			execObj.disambig["substitute"] = result.join("");
		}*/
		return result;

	}


	function givenNameForm(string, nameTok, keepHyphen, initialsDelimiter, disambig){
		var initializeWith = nameTok.strings["initialize-with"];
		var expand = disambig.expandInitials || [];
		var givenNames = string.split(" ");
		if (nameTok.strings.form == "short"){ /// cat array if purpose is disambiguation.
			if (expand.length){
				var length = Math.max((disambig.initialsLength || 1), expand.slice(-1)[0]);
			} else {
				var length = disambig.initialsLength || 1;
			}
			givenNames = givenNames.slice(0, length);
		}
		if (nameTok.strings.initialize){
			var initialsDelimiter = (initialsDelimiter || nameTok.given.strings.delimiter || ""); 
		} else {
			var initialsDelimiter = " "; /// defers to name-part delimiter when not initializing.
		}
		if (keepHyphen){
			var hyphen = "-";
		} else {
			var hyphen = initialsDelimiter;
		}
		if (initializeWith == undefined){ // vanilla
			return string;
		}

		var ret = givenNames.map(function(givenName, index){ /// split given names
			//// The specification is open to interpretation. 
			// Ambiguity #1: for normalizing initials, what characters should be looked for?
			// Ambiguity #2: I am not sure why citeproc-js includes the toUpperCase() equality. Is ...
			// ... there a reason normalization only applies to upper-case characters? & If not, ...
			// ...  should initialized single characters always be upper-case?
			if (expand.indexOf(index) > -1){
				var initialize = false;
				initialsDelimiter = " "; /// for mixed names + initials (in disambiguated names), use the default delimiter for non-initialized names. //// TODO: Is this behavior we want?
			} else {
				var initialize = nameTok.strings.initialize;
			}
			return givenName.split("-").map(function(name){ //// handles hyphenated names.
				if (initialize == true){ /// initialize
					return name.slice(0, 1) + initializeWith;					
				} else if ((name.length == 1) && (name.toUpperCase() === name)){ // normalize 1.
					return name + initializeWith;
					// anybody named "D-Souza" or "Xan-X" will mess this up. Seems unlikely.
				} else if (name.slice(-1) == "."){// normalize 2.
					return name.slice(0,-1) + initializeWith;
				} else {
					return name;
				}
			}).join(hyphen);
		},[]).join(initialsDelimiter).trim(); // .trim() is required without initialsDelimiter.
		return ret;
	}

	this.CSL.Blob.givenPart = function (token, name, nameTok, execObj) {
		var keepHyphen = this.Style.getOpt("initialize-with-hyphen");
		var initialsDelimiter = ""; //// "initialsDelimiter" attribute is unsupported in spec. "" is only allowed value currently.
		if (token.strings.subarea == "sort"){
			if (token.strings["demote-non-dropping-particle"] > self.STATIC.NEVER){
				var parts = ["given","dropping-particle","non-dropping-particle"];
			} else {
				var parts = ["given","dropping-particle"];
			}
		} else {
			if (token.strings["demote-non-dropping-particle"] == self.STATIC.DISPLAY_AND_SORT){
				var parts = ["given","dropping-particle","non-dropping-particle"];
			} else {
				var parts = ["given","dropping-particle"];
			}
		}
		var output = parts.reduce(function(output, namePart){
			if (name.hasOwnProperty(namePart)){
				if (name[namePart] != ""){
					if (namePart == "given"){
						output.push(
							givenNameForm(name[namePart], nameTok, keepHyphen, initialsDelimiter, execObj.disambig)
						);
					} else {
						output.push(name[namePart]);
					}
				}
			};
			return output;
		},[]).join(" ");
		return this.Decoration.decorate(output, token.strings, token.decorations, execObj);
	};

	this.CSL.Blob.familyPart = function (token, name, nameTok, execObj){
		if (token.strings.subarea == "sort"){
			if (!token.strings.hasOwnProperty("demote-non-dropping-particle")){
				var parts = ["non-dropping-particle","family"];
			} else if (token.strings["demote-non-dropping-particle"] == self.STATIC.NEVER){
				var parts = ["non-dropping-particle","family"];
			} else {
				var parts = ["family"];
			}
		} else {
			if (!token.strings.hasOwnProperty("demote-non-dropping-particle")){
				var parts = ["non-dropping-particle","family"];
			}
			else if (token.strings["demote-non-dropping-particle"] < self.STATIC.DISPLAY_AND_SORT){
				var parts = ["non-dropping-particle","family"];
			} else {
				var parts = ["family"];
			}
		}
		var output = parts.reduce(function(output, namePart){
			if (name.hasOwnProperty(namePart)){
				if (name[namePart] != ""){
					output.push(name[namePart]);
				}
			};
			return output;
		},[]).join(" ");

		//// When (1) name order is not inverted, and (2) suffix exists--> suffixPart steals familyPart's string suffix, but suffixPart also ignores familyPart's decorations. Why so complicated? Name-Parts should not have string.prefixes, string.suffixes, or string.delimiters - that should be handled by <name> nodes. Just "NO."
		if (!execObj.invertedNameOrder){
			if ((name['suffix'] || "") != ""){
				var familyStrings = {};
				var suffixStrings = {};
				familyStrings["prefix"] = token.strings.prefix || "";
				suffixStrings["suffix"] = token.strings.suffix || "";
				var fam= this.Decoration.decorate(output, familyStrings, token.decorations, execObj)
				execObj.activeDelimiter = " ";
				var suf = this.Decoration.decorate(name.suffix, suffixStrings, nameTok.suffix.decorations, execObj);
				return [].concat(fam).concat(suf);
			}
		}
		return this.Decoration.decorate(output, token.strings, token.decorations, execObj);
	};

	this.CSL.Blob.suffixPart = function (token, name, nameTok, execObj){
		if (name.hasOwnProperty("suffix")){
			return this.Decoration.decorate(name.suffix, token.strings, token.decorations, execObj);
		} else {
			return [""];
		}
	}

	function disambigByLastName(familyName, nameID, noExpansion){
		return NameDisambiguation.disambiguateNameArray.call(self, State.FamilyNames[familyName], noExpansion).Rules[nameID]
	}
	function disambigByPrimaryName(familyName, nameID, noExpansion){
		var ret= NameDisambiguation.disambiguateNameArray.call(self, State.PrimaryNames[familyName], noExpansion).Rules[nameID];
		return ret;
	}

	function getOrderAndName(token, nameID, index, execObj, activeVar){
		var form = (token.strings.form || "long");
		var disambig = {};
		var person = State.Persons[nameID];
		if (token.strings.area == "citation"){			
			var rule = self.citation.strings["givenname-disambiguation-rule"];
			if (self.citation.strings["disambiguate-add-givenname"] != "true"){// "true" value means by-cite disambiguation; else we need global-name disambiguation
				if (State.FamilyNames[person.family].length > 1){
					if (rule != self.STATIC.NAMEDISAMBIG["none"]){
						if (rule == self.STATIC.NAMEDISAMBIG["all-names"]){
							disambig = disambigByLastName(person.family, nameID);
						} else if (rule == self.STATIC.NAMEDISAMBIG["all-names-with-initials"]){
							if ((token.strings["initialize-with"] != undefined) && token.strings["initialize"]){ /// initialize-with & initialize take precedence over name disambiguation.
								disambig = disambigByLastName(person.family, nameID, true);
							}
						} else if ((rule == self.STATIC.NAMEDISAMBIG["primary-name"]) && (index==0)){
							if (execObj.names.primary){ // only true for first name variable w/ output.
								disambig = disambigByPrimaryName(person.family, nameID, false);
							}
						} else if ((rule == self.STATIC.NAMEDISAMBIG["primary-name-with-initials"]) && (index==0)){
							if ((token.strings["initialize-with"] != undefined) && token.strings["initialize"]){ /// initialize-with & initialize take precedence over name disambiguation.
								if (execObj.names.primary){ // only true for first name variable w/ output.
									disambig = disambigByPrimaryName(person.family, nameID, true);
								}
							}
						} else if (rule == self.STATIC.NAMEDISAMBIG["by-cite"]){
							disambig = execObj.disambig.names[activeVar][index];
						}
					}
				}
			} else {
				if (execObj.disambig.names != undefined){
					if (execObj.disambig.names[activeVar] != undefined){
						if (execObj.disambig.names[activeVar][index] != undefined){
							disambig = execObj.disambig.names[activeVar][index];
						}
					}
				}
			}
			if (Object.keys(disambig).length){
				form = "long";
			};
		};
		var order
		if (form == "long") {
			if (!token.strings.hasOwnProperty("name-as-sort-order")){
				order = ["given", "family"]
			} else if ((token.strings["name-as-sort-order"] == "first") && (index == 0)){
				order = ["family", "given", "suffix"];
			} else if (token.strings["name-as-sort-order"] == "all"){
				order = ["family", "given", "suffix"];
			} else {
				order = ["given", "family"]
			}
		} else if (form == "short") {
			order = ["family"];
		}
		return [order, person, disambig]
	}
	var self = this;
	this.CSL.Blob.Name = function (token, nameList, context, execObj){
		var self = this;
		var etAlMin = 0;
		var useFirst = 0;		
		var position = context.position || this.STATIC.POSITION_FIRST;
		if (token.strings["et-al-min"] && token.strings["et-al-use-first"]){
			if (position != this.STATIC.POSITION_FIRST){
				etAlMin = token.strings["et-al-subsequent-min"] || token.strings["et-al-min"];
				useFirst = token.strings["et-al-subsequent-use-first"] || token.strings["et-al-use-first"];
			} else {
				etAlMin = token.strings["et-al-min"];
				useFirst = token.strings["et-al-use-first"];
			}
		} else if (token.strings["et-al-subsequent-min"]){ // This behavior is not allowed by spec.
			if (position != this.STATIC.POSITION_FIRST){
				etAlMin = token.strings["et-al-subsequent-min"];
				useFirst = token.strings["et-al-subsequent-use-first"];
			}
		}

		//// cite disambig ////
		var activeVar = execObj.activeVariable || "";
		if (execObj.disambig["use-first"] != undefined){
			if (execObj.disambig["use-first"][activeVar] != undefined){
				useFirst = execObj.disambig["use-first"][activeVar];
			}
		}

		var names = [];
		var truncation = false;
		var and;
		var lastDelimiterRule;
		if ((etAlMin != 0) && (useFirst != 0)) {
			if ((nameList.length >= etAlMin) & (nameList.length > useFirst)){
				truncation = true;
				names = nameList.filter(function(name, index){return index < useFirst});
				names = nameList.slice(0, useFirst);
				and = token["etAl"];
				lastDelimiterRule = token.strings["delimiter-precedes-et-al"];
				if (token.strings["et-al-use-last"] & (nameList.length > useFirst)){
					and = false;
					lastDelimiterRule = token.strings["delimiter-precedes-last"];
					names.push(nameList.slice(-1)); /// add the last name to the array
				}
			}
		}
		if (truncation == false) {
			names = nameList;
			and = token["and"] || false;
			lastDelimiterRule = token.strings["delimiter-precedes-last"];
		}
		var self = this;
		var newExecObj = this.Group.ParentBlobExecObj.call(this, token, execObj); /// clone execObj
		newExecObj["invertedNameOrder"] = false;

		if (token.strings.form == "count"){
//			var len = "000"+nameList.length;
			var len = "000"+names.length;
			return [len.slice(-4)];
		}
		execObj.outputs[activeVar] = [];//output.join("");
		var output = names.reduce(function(ret, nameID, index){
			var acc = [];
			var order, name, disambig
			[order, name, disambig] = getOrderAndName.call(self, token, nameID, index, execObj, activeVar)
			if (order[0] == "family"){
				newExecObj.invertedNameOrder = true;
			} else {
				newExecObj.invertedNameOrder = false;
			}
			newExecObj.disambig = disambig;
			order.map(function(namepart, index, array){
				if (index > 0){ /// sort-separator between inverted name parts.
					newExecObj.activeDelimiter = "";
					if ((name[namepart] || "") != ""){
						if (newExecObj.invertedNameOrder){ /// test for inverted name-part order
							acc = acc.concat(self.Decoration.decorate(token.strings["sort-separator"], {}, token.decorations, newExecObj));
						} else {
							acc = acc.concat(self.Decoration.decorate(" ", {}, token.decorations, newExecObj));
						}
					}
					newExecObj.activeDelimiter = "";
				}
				var rez = token[namepart].execs[0].call(self, token[namepart], name, token, newExecObj);
				acc = acc.concat(rez);
			});
			execObj.outputs[activeVar].push(acc); //// for reference-grouping
			//// set up delimiters /// ("et-al-use-last" and "et-al" and "and")
			newExecObj.activeDelimiter = "";
			newExecObj.delimiter="";
			if (token.strings["et-al-use-last"]){ //// "@et-al-use-last"
				if (index != names.length -1){ 
					acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj));
				}
				if ((index == (names.length - 2)) && (truncation)){
					acc = acc.concat(self.Decoration.decorate("... ", {}, token.parentDecorations, newExecObj))
				}
			} else if ((truncation) && (index == (names.length - 1))){ /// "@et-al"
				var etAl = token.etAl.execs[0].call(self, token.etAl, name, context, execObj);
				if (etAl != ""){ //// etAl == "" when et-al is undefined by style and locale.
					newExecObj.activeDelimiter = "";
					newExecObj.delimiter="";
					if (token.strings["delimiter-precedes-et-al"] == "contextual"){
						if (names.length > 1){
							acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
						} else {
							acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
						}
					} else if (token.strings["delimiter-precedes-et-al"] == "after-inverted-name"){
						if ((order[0] == "family") && (token.strings["name-as-sort-order"])){
							acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
						} else {
							acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
						}
					} else if (token.strings["delimiter-precedes-et-al"] == "always"){
						acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
					} else if (token.strings["delimiter-precedes-et-al"] == "never"){
						acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
					}
					newExecObj.activeDelimiter = "";
					newExecObj.delimiter="";
					execObj.tailDecorations = newExecObj.tailDecorations;
					execObj.outputs[activeVar].push(etAl); //// for reference-grouping
					acc=acc.concat(etAl);
					newExecObj.tailDecorations = execObj.tailDecorations;
				}
			} else if ((token.and) && (index == (names.length - 2)) && (!truncation)) { /// "@and" delimiter
				newExecObj.activeDelimiter = "";
				newExecObj.delimiter="";
				if (token.strings["delimiter-precedes-last"] == "contextual"){
					if (names.length > 2){
						acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
					} else {
						acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
					}
				} else if (token.strings["delimiter-precedes-last"] == "after-inverted-name"){
					if ((order[0] == "family") && (token.strings["name-as-sort-order"])){
						acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
					} else {
						acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
					}
				} else if (token.strings["delimiter-precedes-last"] == "always"){
					acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj))
				} else if (token.strings["delimiter-precedes-last"] == "never"){
					acc=acc.concat(self.Decoration.decorate(" ", {}, token.parentDecorations, newExecObj))
				}
				newExecObj.activeDelimiter = "";
				newExecObj.delimiter="";
				execObj.tailDecorations = newExecObj.tailDecorations;
				var and = token.and.execs[0].call(self, token.and, name, context, execObj)
				newExecObj.tailDecorations = execObj.tailDecorations;
				acc=acc.concat(and);
			} else if (index < names.length -1){  /// regular delimiter
				newExecObj.activeDelimiter = "";
				newExecObj.delimiter="";
				acc=acc.concat(self.Decoration.decorate(token.strings["delimiter"], {}, token.parentDecorations, newExecObj));
			}
			/// end delimiters ///

			if (index == 0){ /// over-write order if name-as-sort-order == "first"
				if (token.strings["name-as-sort-order"] == "first"){
					order = ["given", "family"];
				}
			}
			ret = ret.concat(acc);
			return ret;
		}, []);
		execObj.tailDecorations = newExecObj.tailDecorations;
		return output;
	}

	this.CSL.Blob.names = function(token, source, context, execObj) {
		var self=this;
		execObj.names = {primary:true}; /// global primary name dismabiguation msg.
		/// ed-trans set condition start ///
		var specialEditorTranslatorCondition = false;
		if (token.strings.editorTranslator == true){ 
			if (self.Util.check_list_equality((source.translator || []), (source.editor || []))){
				specialEditorTranslatorCondition = true;
			}
		}/// ed-trans set condition end ///
		var ret = token.variables.reduce(function(acc, variable, index){
			var ids = source[variable] || [];

			var names = ids;
			if (specialEditorTranslatorCondition){ // ed-trans. start //
				if (variable == "translator"){
					return acc;
				} else if (variable == "editor"){
					variable = "editortranslator";
					source["editortranslator"] = names;
				}
			} // ed-trans end //
			if (names.length){
				execObj.activeVariable = variable;
				if (acc.length){ // if prior content, add delimiter.
					acc=acc.concat( self.Decoration.decorate(token.strings.delimiter, {}, token.decorations, execObj) ) /// delimiter gets <names> decorations.
				}
				if (token.label[variable]){ // if label token.
					if (token.labelIndex < token.nameIndex ){ /// label before name
						acc=acc.concat( token.label[variable].execs[0].call(self, token.label[variable], source, context, execObj) )
						acc=acc.concat( self.CSL.Blob.group.call(self, token, names, context, execObj) )
					} else { /// label after name
						acc=acc.concat( self.CSL.Blob.group.call(self, token, names, context, execObj) )
						acc=acc.concat( token.label[variable].execs[0].call(self, token.label[variable], source, context, execObj) )
					}
				} else { /// no label token
					acc=acc.concat( self.CSL.Blob.group.call(self, token, names, context, execObj) )
				}

				execObj.names.primary = false; // if output, stop looking for primary names
			} else {
				
			}
			return acc
		},[]);
		delete execObj.names;
//		delete execObj.disambig.activeNameVar;
		if (ret.length == 0){
			if (token.substitute) {
				ret = token.substitute.execs[0].call(self, token.substitute, source, context, execObj);
			}
		}
		return ret;
	}

	this.CSL.Attributes["@and"] = function (token, buildObj, arg){
		token["and"] = new this.Builder.Token('term', this.STATIC.SINGLETON)
		token["and"].strings.form = arg;
		token["and"].strings.suffix=" ";
		if (arg != "symbol"){
			token.strings.and = "text"; // no default in spec; just avoiding error-checking later.
			token["and"].strings.term = "and";
			token["and"].execs.push(self.CSL.Blob.term);
		} else {
			token.strings.and = "symbol";
			token["and"].strings.value = "&";
			token["and"].execs.push(self.CSL.Blob.value);
		}
	};
	this.CSL.Attributes["@demote-non-dropping-particle"] = function (token, buildObj, arg){
		if (arg == "display-and-sort"){
			self.Style.setOpt("demote-non-dropping-particle", self.STATIC.DISPLAY_AND_SORT);
		} else if (arg == "sort-only"){
			self.Style.setOpt("demote-non-dropping-particle", self.STATIC.SORT_ONLY);
		} else {
			self.Style.setOpt("demote-non-dropping-particle", self.STATIC.NEVER);
		}
	};
	this.CSL.Attributes["@delimiter-precedes-et-al"] = function (token, buildObj, arg){
		token.strings["delimiter-precedes-et-al"] = arg;
	};
	this.CSL.Attributes["@delimiter-precedes-last"] = function (token, buildObj, arg){
		token.strings["delimiter-precedes-last"] = arg;
	};
	this.CSL.Attributes["@et-al"] = function (token, buildObj, arg){
		token.strings["et-al"] = arg;
	};
	this.CSL.Attributes["@et-al-min"] = function (token, buildObj, arg){
		token.strings["et-al-min"] = parseInt(arg);
	};
	this.CSL.Attributes["@et-al-use-first"] = function (token, buildObj, arg){
		token.strings["et-al-use-first"] = parseInt(arg);
	};
	this.CSL.Attributes["@et-al-subsequent-min"] = function (token, buildObj, arg){
		token.strings["et-al-subsequent-min"] = parseInt(arg);
	};
	this.CSL.Attributes["@et-al-subsequent-use-first"] = function (token, buildObj, arg){
		token.strings["et-al-subsequent-use-first"] = parseInt(arg);
	};
	this.CSL.Attributes["@et-al-use-last"] = function (token, buildObj, arg){
		token.strings["et-al-use-last"] = arg;
	};
	this.CSL.Attributes["@initialize"] = function (token, buildObj, arg){
		token.strings["initialize"] = arg;
	};
	this.CSL.Attributes["@initialize-with"] = function (token, buildObj, arg){
		token.strings["initialize-with"] = arg;
	};
	this.CSL.Attributes["@name-as-sort-order"] = function (token, buildObj, arg){
		token.strings["name-as-sort-order"] = arg;
	};
	this.CSL.Attributes["@sort-separator"] = function (token, buildObj, arg){
		token.strings["sort-separator"] = arg;
	};
	this.CSL.Attributes["@initialize-with-hyphen"] = function (token, buildObj, arg){
		this.Style.setOpt("initialize-with-hyphen", (arg=="true"));
	}

	///// names attributes that can be set by sort <key> nodes //////
	this.CSL.Attributes["@names-min"] = function (token, buildObj, arg){
		buildObj["names-min"] = arg;
	}
	this.CSL.Attributes["@names-use-first"] = function (token, buildObj, arg){
		buildObj["names-use-first"] = arg;
	}
	this.CSL.Attributes["@names-use-last"] = function (token, buildObj, arg){
		buildObj["names-use-last"] = arg;
	}

	self.Plugin.register({name:"addSource.extractNames", pre:"addSource.saveSource", fn:extractNames})
	self.Names = Names;
}



function flush(){
	var self = this;
	this.Engine = {"bibliography":{rendertokens:[], sortTokens:[]}, "citation":{renderTokens:[], sortTokens:[]} }
	Object.keys(self.State).map(function(key){
		if (key == "Names") {
			Object.keys(self.State[key]).map(function(name_key){
				Object.keys(self.State[key][name_key]).map(function(_key){
					delete self.State[key][name_key][_key];
				});
			});
		} else if (key == "SourceIndex") {
			self.State[key] = [];
		} else {
			Object.keys(self.State[key]).map(function(_key){
				delete self.State[key][_key];
			});
		}
	});

	self.Locale.flush();
	self.Relationships.flush();
	self.Citation.Disambig.Ambigs.flush();
	self.Citation.Disambig.Disambigs.flush();
	self.Style.flush();
}


function RefManagerModule(){ ///// TODO: Remove: it will be separate plugin.
	var RefManager = {};
	this.Public.RefManager = RefManager;
	var self = this;
	var state = {};

	RefManager.filter = function(key, arg, cmp){
		if (cmp == undefined){ cmp = 0 }
		var res = Object.keys(self.State.Sources).reduce(function(acc, id){
			if (self.State.Sources[id][key] == arg){
				acc.push(self.State.Sources[id])
			}
			return acc;
		}, [])
		return self.Bibliography.sortSources(res, function(){return arguments[0]});
	}
}

function LazuProcessor(){
	L = FrameWork();
	L.Plugin.registerModule(FirstOrderModules)
	L.Plugin.registerModule(SecondOrderModules)
	L.Plugin.registerModule(RangeModule);
	L.Plugin.registerModule(TextModule);
	L.Plugin.registerModule(NumberModule);
	L.Plugin.registerModule(StyleAttributesModule)
	L.Plugin.registerModule(DateModule)
	L.Plugin.registerModule(NameModule)
	L.Plugin.registerModule(flush)
	L.Plugin.registerModule(RefManagerModule)
	return L
}
