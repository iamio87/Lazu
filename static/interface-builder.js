var SetLogic = (function(){

	var conditionObjList = [];
	var macros = {};
	var macroList = []

	function ObjectIntersection( A, B ) { //// A is parent, B is child. Operates on Conditions.match object.
		function intersection(A, B){ /// return elements held in common by both arrays
			if (check_list_equality(A, [0])){ /// zero represents an infinite set. B is a subset of A. return B.
				return B;
			} else if (check_list_equality(B, [0])){ //// B can also be an infinite set. If so, return A.
				return A;
			}
			return A.filter(function(n){ 
				return B.indexOf(n) !== -1;
			})
		}
		var ret = clone(A);
		Object.keys(B).map(function(key){
			if (A.hasOwnProperty(key)==false){
				ret[key]=[0]
			}
			ret[key] = intersection(ret[key], B[key])
		})
		return ret
	}

	function clone(object){
		return JSON.parse(JSON.stringify(object)) // Not only is this the fastest; it's recommended.
	}

	function complement(list){
		function _complement(A){
			var ret = ConditionsTemplate()
			Object.keys(A['match']).map(function(key){
				if (check_list_equality(A['match'][key], [0])) {
					ret['exclude'][key] = []
				} else {
					ret['exclude'][key] = A['match'][key]
				}
			})
			Object.keys(A['exclude']).map(function(key){
				if (A['exclude'][key].length == 0) {
					ret['match'][key] = [0]
				} else {
					ret['match'][key] = A['exclude'][key]
				}
			})
			return ret
		}
		return list.map(function(item){
			return _complement(item);
		})
	}

	function check_list_equality(A, B){ //// http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
		if (A.length != B.length){
			return false
		}
		  for (var i = 0, l=A.length; i < l; i++) {
		      // Check if we have nested arrays
		      if (A[i] instanceof Array && B[i] instanceof Array) {
		          // recurse into the nested arrays
		          if (!equals(A[i],B[i])){
		              return false;
					    }
		      } else if (A[i] != B[i]) { 
		          // Warning - two different object instances will never be equal: {x:20} != {x:20}
		          return false;   
		      }           
		  }
		return true;
	}

	function ObjectUnion( A, B ){ //// A is parent, B is child. Operates on Conditions.exclude object.
		function union(a, b){ /// return single instance of element held by either array.
			b.map(function(n){
				if (a.indexOf(n) == -1){
					a.push(n)
				}
			})
		}
		var ret = clone(A)
		Object.keys(B).map(function(key){
			if (A.hasOwnProperty(key) == false){
				ret[key] = [] /// empty array represents empty set. B is a superset of A. return B.
			}
			union(ret[key], B[key])
		})
		return ret
	}


	function JoinTests(list){
		function _joinTests( A, B ){
			return {"match":ObjectIntersection(A['match'], B['match']),"exclude":ObjectUnion(A["exclude"], B["exclude"])}
		}
		var ret = list.shift();
		while (list.length > 0){
			ret = _joinTests(ret, list.shift());
		}
		return [ret];
	}

	function SplitTest(A){
		var ret =[]
		Object.keys(A['match']).map(function(prop){
			var obj = ConditionsTemplate()
			obj['match'][prop] = clone(A['match'][prop])
			ret.push(obj)
		})
		Object.keys(A['exclude']).map(function(prop){
			var obj = ConditionsTemplate()
			obj['exclude'][prop] = clone(A['exclude'][prop])
			ret.push(obj)
		})
		return ret
	}

	var getConditions = function(element){
		/// match all --> add conditions to conditions.matches object
		/// match none --> add conditions to conditions.excludes object and return multiple conditions objects.
		/// match any --> add conditions and return multiple conditions objects for branching logic paths.
		/// returns array of condition objects.
		if (element.attrs.hasOwnProperty('match')){
			var matchTest = element.attrs['match'] // "all","any","none"
		} else {
			var matchTest = "all"
		}
		var attrs
		var ret = []
		if (matchTest == "any"){
			Object.keys(element.attrs).map(function(key) {
				if (key != "match"){ //// exclude the "match" attribute alwayss
					var conditions = ConditionsTemplate()
					conditions['match'][key] = element.attrs[key].split(" ")
					ret.push(conditions)
				}
			})	
		} else if (matchTest == "all") {
			var conditions = ConditionsTemplate()
			Object.keys(element.attrs).map(function(key) {
				if (key !="match"){
					conditions['match'][key] = element.attrs[key].split(" ")
				}
			})
			ret.push(conditions)
		} else if (matchTest == "none") {
			var conditions = ConditionsTemplate()
			Object.keys(element.attrs).map(function(key) {
				if (key != "match"){
					conditions['exclude'][key] = element.attrs[key].split(" ")
				}
			})
			ret.push(conditions)
		} else if (matchTest == "nand") {//// notAll
			Object.keys(element.attrs).map(function(key) {
				if (key != "match"){ //// exclude the "match" attribute alwayss
					var conditions = ConditionsTemplate()
					conditions['exclude'][key] = element.attrs[key].split(" ")
					ret.push(conditions)
				}
			})	
		}
		return ret
	}

	var _compileConditions = function(output, inputList){
		//// inputList is supposed to be a matrix, or 2-level array.
		//// inputList is usually the output of getConditions()
		//// output is a single-level array.
		//// output usually is ParentConditions
		var list = clone(inputList); /// clone, so we don't disturb shared inputList.
		if (check_list_equality(output, [])){
			output = list.shift();
			return _compileConditions(output, list);
		} else if (list.length == 0) {
			return output;
		} else {
			var newOutput = [];
			output.map(function(A){
				list[0].map(function(B){
					newOutput.push(JoinTests([A, B])[0]);
				})
			})
			list.shift()
			return _compileConditions(newOutput, list);
		}
	}

	function parseConditions(element, parentConditions){

		var matchTest
		var Conditions = element.children.filter(function(item){ 
			return item.name == "conditions"
		})
		if (Conditions.length == 1){ /// support for <condition> elements.
			if (Conditions[0].attrs.hasOwnProperty('match')){
				matchTest = Conditions[0].attrs['match'] // "all","any","none","notAll"
			} else {
				matchTest = "all"
			}
			var childConditions = Conditions[0].children.map(function(A){
				return getConditions(A)
			})
		} else { //// No <conditions> element to worry about.
			matchTest = "all"
			var childConditions = [getConditions(element)]
		}
		var descendantConditions = [];
		var siblingConditions = [];
		//// These test exist solely to support <conditions> elements. Regular <if> elements are equivalent to <conditions match="all">, because the "match" case has already been applied in getConditions(element). It's only the two-layer logic of <conditions> that requires advanced logic.
		if (matchTest == "any") {
			siblingConditions = complement(JoinTests(_compileConditions([], childConditions)))
			childConditions.map(function(row){
				row.map(function(A){
					descendantConditions.push(A)
				})
			})
		} else if (matchTest == "none") {
			descendantConditions = complement(_compileConditions([], childConditions))
			childConditions.map(function(row){
				row.map(function(A){
					SplitTest(A).map(function(a){
						siblingConditions.push(a)
					})
				})
			})
		} else if (matchTest == "nand") {///not all
			siblingConditions = JoinTests(_compileConditions([], childConditions))
			childConditions.map(function(row){
				complement(row).map(function(A){
					descendantConditions.push(A)
				})
			})
		} else if (matchTest == "all") {
			descendantConditions = _compileConditions([], childConditions);
			childConditions.map(function(row){
				complement(row).map(function(A){
					SplitTest(A).map(function(a){
						siblingConditions.push(a)
					})
				})
			})
		}
		var descendantList = _compileConditions(parentConditions, [descendantConditions]) //// always a match all test for combining with parent conditions.
		var siblingList = _compileConditions(parentConditions, [siblingConditions]) /// subsequent sibilings inherit restrictions that are the inverse of the conditions applied to children of this element.
		return [descendantList, siblingList]
	}

	function parseIf(element, parentConditions){
		if (element.name == "else"){
			element.children.map(function(child){
				parseTree(child, parentConditions); /// this can be asynchronous
			})
			return 0;
		}
		var descendantList, siblingList
		[descendantList, siblingList] = parseConditions(element, parentConditions)
		element.children.map(function(child){
			parseTree(child, descendantList); /// this can be asynchronous
		})
		return siblingList
	}

	function parseDescription(element, conditions, containerVariable){
		function _iter(description, conditions){
			var descendantList, siblingList
			[descendantList, siblingList] = parseConditions(description, conditions)
			descendantList.map(function(conditionObj){
				conditionObj['fieldName']=element.attrs.variable;
				conditionObj['datatype']="description";
				if (typeof(containerVariable)!="undefined"){
					conditionObj['containerVariable'] = containerVariable;
				}
				conditionObj['textContent'] = description.children[0];
				conditionObjList.push(conditionObj)
			})
			return siblingList
		}
		element.children.map(function(item){
			if (item.name == "description"){
				if (Object.keys(item.attrs).length == 0){
					item.attrs.NeedsAtLeastOneAttribute =""
				}
				conditions = _iter(item, conditions)
			}
		})
	}

	function getSubFields(element){
		return element.children.filter(function(item){
			return item
		})
	}

	function parseTree(element, conditions){
		conditions=clone(conditions)
		if (element.name == "text") {
			if (element.attrs.hasOwnProperty('macro')){
				macroList.push(element.attrs.macro)
				parseTree(macros[element.attrs.macro], conditions);
			} else if (element.attrs.hasOwnProperty('variable')){
				conditions.map(function(conditionObj){
					conditionObj['fieldName']=element.attrs.variable;
					conditionObj['datatype']="text";
					conditionObjList.push(conditionObj)
				})
				parseDescription(element, clone(conditions))
			} else {
			
			}
		} else if (element.name == "names"){
			conditions.map(function(conditionObj){
				conditionObj['fieldName']=element.attrs.variable;
				conditionObj['datatype']="names"
				conditionObjList.push(conditionObj)
			})
//			parseDescription(element, clone(conditions))
		} else if (element.name == "number"){
			conditions.map(function(conditionObj){
				conditionObj['fieldName']=element.attrs.variable;
				conditionObj['datatype']="number"
				conditionObjList.push(conditionObj)
			})
			parseDescription(element, clone(conditions))
		} else if (element.name == "date"){
			conditions.map(function(conditionObj){
				conditionObj['fieldName']=element.attrs.variable;
				conditionObj['datatype']="date"
				conditionObjList.push(conditionObj)
			})
			parseDescription(element, clone(conditions))
		} else if (element.name == "container"){
			subfields = getSubFields(element);
			var descriptionConditions = clone(conditions)
			conditions.map(function(conditionObj){
				conditionObj['fieldName'] = element.attrs.variable;
				conditionObj['datatype'] = "containers";
				conditionObj['subfields'] = [];
				descriptions = subfields.map(function(subfield){
					if (subfield.name == "container-part"){
						conditionObj['subfields'].push({"fieldName":subfield.attrs.variable,"datatype":"string"})
					}
				})
				conditionObjList.push(conditionObj)
			})
			parseDescription(element, clone(descriptionConditions))
			subfields.map(function(subfield){
				if (subfield.children.length > 0){
					parseDescription(subfield, descriptionConditions, element.attrs.variable)
				}
			})
		} else if (element.name == "macro") {
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name == "choose"){
			element.children.map(function(item){
				conditions = parseIf(item, conditions)
			})
		} else if (element.name == "layout"){
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name == "substitute"){
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name == "group"){
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name=="else"){
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name=="style"){ /// top-level element of CSL style. 
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name=="bibliography"){ /// top-level element of CSL style. 
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else if (element.name=="citation"){ /// top-level element of CSL style. 
			element.children.map(function(item){
				parseTree(item, conditions)
			})
		} else {
			return 1
		}
	}

	function ConditionsTemplateStart() {
		return {
			"match":{
				"type":[0],
				"styletype":[0],
			},
			"exclude":{
				"type":[],
				"styletype":[],
			}
		}
	}

	function ConditionsTemplate() {
		return {
			"match":{	},
			"exclude":{	}
		}
	}

	function compileConditions(CSLtree){
		var citation, bibliography
		macros={}
		macroList = []
		conditionObjList =[]

		CSLtree.filter(function(element){
			if (element.name == "macro") {
				macros[element.attrs.name] = element;
			} else if (element.name == "bibliography") {
				bibliography = element;
			} else if (element.name == "citation") {
				citation = element;
			}
		})

		try {
			parseTree(bibliography, [ConditionsTemplateStart()]);
		} catch(e) {}
		try {
			parseTree(citation, [ConditionsTemplateStart()]);
		} catch(e){console.log('failure', citation, e)}
//		; /// you can parse the whole tree just fine. However, I want to make sure the bibliographyLayout is parsed first, because it's more comprehensive --> and I want FieldOrder to reflect bibliography formatting over citation formatting.
		return conditionObjList;
	}

	return {//// Public API
		compileConditions:compileConditions,
		check_list_equality:check_list_equality,
		conditionObjList:conditionObjList,
		JoinTests:JoinTests,
		macros:macros
	}
})()


var FormUtility = (function(){
	var container_locators = {}//{'type':{},'styletype':{}}

	var monthValues = ["month-01","month-02","month-03","month-04","month-05","month-06","month-07","month-08","month-09","month-10","month-11","month-12"]
	var seasonValues = ["season-01","season-02","season-03","season-04"]
	var locale
	var localeRules
	var style_type_select
	var getMonthLabels = function(){
		return monthValues.map(function(value){
			var ret = {}
			ret[value] = {"short":localeRules.terms[value]['short'], "long":localeRules.terms[value]["long"]};
			return ret;
//			return localeRules.terms[value]
		})
	}

	var getSeasonLabels = function(){
		return seasonValues.map(function(value){
			var ret = {}
			ret[value] = {"short":localeRules.terms[value]['short'], "long":localeRules.terms[value]["long"]};
			return ret;
		})
	}

	var reduce_style_types_to_json = function(parent){
		return parent.children.map(function(item){
			var ret = {}
			ret.styletype = item.attrs.styletype
			ret.value = item.attrs.styletype
			ret.label = item.attrs.label || item.attrs.text || name_to_label(item.attrs.styletype);
			if (item.name == "branch"){ //// Branch node
				ret.submenu = reduce_style_types_to_json(item)
				ret.submenu.map(function(subitem){
					if (subitem.styletype == ret.styletype){
						ret.csltype = subitem.csltype
					}
				})
			} else { //// Leaf node
				ret.csltype = item.attrs.csltype;
				StyleTypes.push(item.attrs.styletype);
				StyleTypes_to_CSLTypes[item.attrs.styletype] = item.attrs.csltype;
			}
			return ret
		})
	}

	var rules = function(){ 
		locale = citeproc.opt["default-locale"][0]
		localeRules = citeproc.locale[locale];
		console.log(citeproc.cslXml.dataObj.children);
		var interface_node = citeproc.cslXml.dataObj.children.filter(function(item){ return item.name == "interface"});
		if ((interface_node).length){
			var style_type_tree = interface_node[0].children.filter(function(item){ return item.name=="styletypetree"})[0];
			style_type_select = reduce_style_types_to_json(style_type_tree);
		}
		return citeproc.cslXml.dataObj.children;
	}
	function clone(object){
		return JSON.parse(JSON.stringify(object)) // Not only is this the fastest; it's recommended.dds
	}
	function nameToLabel(string){
		if (string == ""){
			return string
		}
		return string.split('_').map(function(str){
			return str[0].toUpperCase() + str.slice(1)
		}).join(' ')
	}
	var reservedVariables = ['first-reference-note-number','locator','year-suffix',"locator-date","locator-extra",	'citation-label',	'citation-number']
//// locator is not a reservedVariable, because we need to know whether it is located in containers element. ////
/*	var CSLvariables = [
		'abstract',
		'annote',
		'archive',
		'archive_location',
		'archive-place',
		'authority',
		'call-number',
		'collection-title',
		'container-title',
		'container-title-short',
		'dimensions',
		'DOI',
		'event',
		'event-place',
		'genre',
		'ISBN',
		'ISSN',
		'jurisdiction',
		'keyword',
		'medium',
		'note',
		'original-publisher',
		'original-publisher-place',
		'original-title',
		'page',
		'page-first',
		'PMCID',
		'PMID',
		'publisher',
		'publisher-place',
		'references',
		'reviewed-title',
		'scale',
		'section',
		'source',
		'status',
		'title',
		'title-short',
		'hereinafter',
		'URL',
		'version'
	]*/
//	CSLvariables = [];
	var CSLtypes = [
		"article",
		"article-magazine",
		"article-newspaper",
		"article-journal",
		"bill",
		"book",
		"broadcast",
		"chapter",
		"dataset",
		"entry",
		"entry-dictionary",
		"entry-encyclopedia",
		"figure",
		"graphic",
		"interview",
		"legislation",
		"legal_case",
		"manuscript",
		"map",
		"motion_picture",
		"musical_score",
		"pamphlet",
		"paper-conference",
		"patent",
		"post",
		"post-weblog",
		"personal_communication",
		"report",
		"review",
		"review-book",
		"song",
		"speech",
		"thesis",
		"treaty",
		"webpage"
	]

	var NamesSubfields = function(){return [
		{"datatype":"text","fieldName":"family","label":"Family"},
		{"datatype":"text","fieldName":"given","label":"Given"},
		{"datatype":"text","fieldName":"suffix","label":"Suffix"},
		{"datatype":"text","fieldName":"dropping-particle","label":"Dropping-Particle"}, /// inserted after given name, only when family name is also displayed
		{"datatype":"text","fieldName":"non-dropping-particle","label":"Non-Dropping-Particle"} /// inserted before Family name, but may be irrelevant to sorting.
		]
	}
	var DateSubfields = function(){return [
		{"datatype":"date-year","fieldName":"year","label":"Year"},
		{"datatype":"date-month","fieldName":"month","label":"Month"},
		{"datatype":"date-day","fieldName":"day","label":"Day"},
//		{"datatype":"selectSeason","fieldName":"season","label":"Season"}, /// inserted after given name, only when family name is also displayed
//		{"datatype":"selectEpoch","fieldName":"epoch","label":"Epoch"}, /// inserted before Family name, but may be irrelevant to sorting.
//		{"type":"text","fieldName":"calendar","label":"Calendar"} //// designated by csl style?
		]
	}

	var SourceTypes=[];
	var StyleTypes = [];
	var StyleTypes_to_CSLTypes = {};
	var VariableFields = {"types":{},"styletypes":{}};
	var FieldDataType = {}; //// this is a staging area for data. It's a tradeoff of memory for performance. VariableFields is the main object that is passed.
	
	function addField(obj, type, domain) {
		if (reservedVariables.indexOf(obj.fieldName) ==-1){
			if (typeof(VariableFields[domain][type])=="undefined"){
				VariableFields[domain][type]=[]
			}

			if (VariableFields[domain][type].indexOf(obj.fieldName) == -1){
				VariableFields[domain][type].push(obj.fieldName)
			}
			if (typeof(FieldDataType[type]) == "undefined"){
				FieldDataType[type]={};
			}
			if (typeof(FieldDataType[type][obj.fieldName]) == "undefined"){
				FieldDataType[type][obj.fieldName] = {'datatype': obj.datatype, 'fieldName':obj.fieldName, 'label':nameToLabel(obj.fieldName)};
				if (obj.datatype == "names"){
					FieldDataType[type][obj.fieldName].subfields = NamesSubfields()
				} else if (obj.datatype == "date"){
					FieldDataType[type][obj.fieldName].subfields = DateSubfields()
				}
			}
			if (obj.datatype=="containers"){
				/// remove "locator" and other restricted fields from containers
				/// also add "label" attribute to subfields.
				if (typeof(FieldDataType[type][obj.fieldName]["subfields"]) == "undefined"){
					var field = obj
					FieldDataType[type][obj.fieldName]["subfields"] = obj.subfields.filter(function(subfield){
						if (reservedVariables.indexOf(subfield.fieldName) ==-1){
							subfield.label = nameToLabel(subfield.fieldName)
							return subfield  /// faster than clone?
						} else if (subfield.fieldName == "locator"){
							container_locators[type] = field.fieldName
						}
					})
//////here//////
				} else {
					obj.subfields.filter.call(obj, function(subfield){
						if (FieldDataType[type][obj.fieldName]["subfields"].indexOf(subfield) == -1){
							if (reservedVariables.indexOf(subfield.fieldName) ==-1){
								subfield.label = nameToLabel(subfield.fieldName)
								FieldDataType[type][obj.fieldName]["subfields"].push(subfield) //// make sure all subfields are added.
							}
						}
					})
				}
			}
			if (obj.datatype=="description"){//// Add descriptions to fields that don't already have a description.
				if ((type=="type") && (obj.match.styletype[0] != 0)){
					return // Ignore type information if styletypes are given.
				}
				if (typeof(obj.containerVariable) != "undefined"){ //// container-part description
					var subfield = FieldDataType[type][obj.containerVariable]['subfields'].filter(function(field){					
						return field.fieldName == obj.fieldName
					})[0]
					if (typeof(subfield.description)=="undefined"){
						subfield.description = obj.textContent
					}
				}
				else if (typeof(FieldDataType[type][obj.fieldName].description) == "undefined"){ //// normal variable description
					FieldDataType[type][obj.fieldName].description = obj.textContent;
				}
			}
		}
	}

	function EvaluateConditionObjects(list, counter){
	 //// House-work on first call.
			//// CSL recommends following their source type taxonomy, but it's not required. Make sure non-CSL source types are included if explicitly referenced by style.
			//// Some style sheets might not support every CSL source type. Exclude CSL source types that would never be displayed.
			//// If style sheet has catch-all, so that it renders something for every possible source type, it turns "var infinite" to "true" - and we put all CSL-defined types into the list.

		var infinite = false;
		list.map(function(obj){////make sure non-standard source-types are added.
			if (!SetLogic.check_list_equality(obj['match']['type'], [0])){/// NOT == [0]
				obj['match']['type'].map(function(type){
					if (SourceTypes.indexOf(type)==-1){ //// ...and not already listed...
						SourceTypes.push(type) //// ...then add to list
					}
				})
			} else { //// if Infinite set, make sure all CSL source types are included as well
				if (!infinite){ 
					infinite = true; /// only have to do this once.
					if (SetLogic.check_list_equality(obj['exclude']['type'], [0])){ //// no exclusions, all CSL types are included
						CSLtypes.map(function(type){
							if (SourceTypes.indexOf(type) == -1){
								SourceTypes.push(type)
							}
						})
					} else {
						CSLtypes.map(function(type){
							if (SourceTypes.indexOf(type) == -1){
								if (obj['exclude']['type'].indexOf(type) ==-1){
									SourceTypes.push(type)
									infinite = false;/// Unless these conditions are occur.
								}
							}
						})
					}
				}
			}
		})
		if (infinite){
			list.map(function(obj){
				obj['exclude']['type'].map(function(type){ ////add implied fields. no need to check for [0]. 
					if (SourceTypes.indexOf(type)==-1){
						SourceTypes.push(type)
					}
				})
			})
		}

		///// Finished creating list of CSL types.
		///// List of styletypes should already be compiled by different method.
		
		var prevLength = list.length;
		var newList = [];

		list.map(function(obj){
			var types = obj['match']['type'];
			var styletypes = obj['match']['styletype'];
			if (SetLogic.check_list_equality(types, [0])){ //// [0] includes all types.
				types = clone(SourceTypes);
			}
/*			if (StyleTypes.length > 0) { //// if StyleTypes are defined
				if (SetLogic.check_list_equality(styletypes, [0])){ //// if no match restrictions...
					styletypes = clone(StyleTypes); /// ...assign styletypes to full list
				}
				styletypes = styletypes.filter(function(styletype){ //// remove any styletypes that are excluded
					return obj['exclude']['styletype'].indexOf(styletype) == -1 /// if not excluded, return
				})
			} else {//// if StyleTypes are not defined
				styletypes = [0] //// apply no restrictions.
			}*/
			var types = types.filter(function(type){
				return obj['exclude']['type'].indexOf(type) == -1 /// if not excluded, return
			})
			if (StyleTypes.length == 0) { //// if StyleTypes are undefined
				types.map(function(type){
					addField(obj, type, "types")
				})
			} else { //// if StyleTypes are defined
				if (SetLogic.check_list_equality(styletypes, [0])){ //// if no match restrictions...
					styletypes = clone(StyleTypes); /// ...assign styletypes to full list
				}
				styletypes = styletypes.filter(function(styletype){ //// remove any styletypes that are excluded
					return obj['exclude']['styletype'].indexOf(styletype) == -1 /// if not excluded, return
				})
				styletypes.map(function(styletype){
					var cslType = StyleTypes_to_CSLTypes[styletype]
					if (types.indexOf(cslType) > -1){
						addField(obj, styletype, "styletypes");
//						addField(obj, cslType, "types");
					}
				})

			}
		})
	}

	function retrieve(){
		SourceTypes=[];
		StyleTypes = [];

		VariableFields = {"types":{},"styletypes":{}};
		FieldDataType = {};

		EvaluateConditionObjects(SetLogic.compileConditions(rules()));
		Object.keys(VariableFields["types"]).map(function(key){
			var relevantFields = VariableFields["types"][key]
			relevantFields.filter(function(field, index){
				VariableFields["types"][key][index] = clone(FieldDataType[key][field]);
			})
		})
		Object.keys(VariableFields["styletypes"]).map(function(key){
			var relevantFields = VariableFields["styletypes"][key]
			relevantFields.filter(function(field, index){
				VariableFields["styletypes"][key][index] = clone(FieldDataType[key][field]);
			})
		})
		var selectSourceTypeMenu = []
		SourceTypes.map(function(type){
			selectSourceTypeMenu.push({'cslType':type,'value':type,'label':nameToLabel(type)})
		})
		StyleTypes.map(function(type){
			selectSourceTypeMenu.push({'cslType':type,'value':type,'label':nameToLabel(type)})
		})
		return {'fields':VariableFields, 'menu':selectSourceTypeMenu, 'cslmenu':selectSourceTypeMenu, "styletypemenu":style_type_select,'dateSelect': { "months":getMonthLabels(), "seasons":getSeasonLabels()}, 'locators':container_locators,'StyleTypes':StyleTypes};
	}

	return { //// Public API
		rules:rules,
		retrieve:retrieve,
		z:VariableFields,
		styletypes:StyleTypes,
		types:SourceTypes
	}
})()


//sample1 = {'match':{'arg1':[0]},'exclude':{'arg1':['A','B','C','D'],'arg2':['a','b','c','d']}}
//sample2 = {'match':{'arg1':['A','B','C','D']},'exclude':{'arg3':['1','2','3','4'],'arg2':['c','d','e','f']}}



/* This section is a mind-fuck. If you thought programming formal logic would be easy, then you've never done it. It's counter-intuitive.
It's not the simple logic that's the problem, the problem is really about nesting complexity. But before we get to the fun, riduculous problems, let's have a refresher in set logic.

A set is a collection of members. Let's think of them as arrays "[]". A set is empty if it has no members. The members of a set can also be infinite, even if it does have limitations. However, the easiests sets to work with are sets with a finite number of members. I refer to sets with finite membership (including empty sets) as "positive sets", because they can be expressed as themselves. Infinite sets (such as complement sets defined below) can only be expressed as the "negative" of a finite set.

Relationship between sets can be made, and recharacterized as sets themselves. 

If you want to join two or more sets to together, it's called the "union" of sets. A union is a superset of all members of its subsets. --> Union = expansion

If you want only the common members of two or more sets, it's call the "intersection" of sets. An intersection is a subset of each of the higher sets. --> Intersection = reduction (contraction)

If you want only the members that are NOT part of a set, it's called the "complement" of the set. In formal logic, it is stated as "NOT a member of Set" and is represent as " ~Set " in notation. The complement of a set is infinite set that it is impossible to represent in positive terms. A complement can only be represented as the negative of another set. The "complement" operator is often ambiguous when expressed in natural language, and it is impossible to express directly in a programming context.

A truth set is a collection of members that satisfy a truth statement or equation. Membership in the set is determined by whether that member can satisfy the equation. For example, the set Food is defined by the equation is_editable(x)? If a material is edible, then it is a member of the set Food.

Mapping out set operations to natural English is not straightforward, it has some interesting wrinkles. There are 4 basic logic operations:
"All" --> All conditions must return true.
"Any" --> At least one condition must return true.
"None" --> All conditions must return false. (Same as "Not any")
"Not All" --> At least one condition must return false. 

Even though there are 4 basic logic operations, there are only 3 types of set operations ('union', 'intersection', 'complement'). How can we reconcile set logic with our intuitive logic?

Let's take a little rabit trail with logic operators. See below:
"AND" --> A AND B are both true. Corresponds to "Intersection" in truth set logic.
"OR" --> A is true, OR B is true. Corresponds to "Union" in truth set logic.
"NOT" --> A is not true. Corresponds to "complement" in truth set logic.
"XOR" (eXclusive OR) --> A is true, OR B is true, but not both are true. No correspondence.
The "XOR" operator has no correlary in natural language or in set logic. Also note that "Not" does not operate on more than one statement. Wierd, huh? However, we are going to use these logic operators to help us translate from natural language to set logic.


Using logic operators as an intermediate language, we translate natural language logic in to set logic operations on truth sets.
"ALL" --> True if A AND B are true --> Intersection(A, B)
"ANY" --> True A OR B are true--> Union(A, B)
"NONE" --> True if A AND B are false --> Intersection(~A, ~B)
"NOT ALL" --> True if A OR B are false --> Union(~A, ~B)

I am going to apply these rules to compiling CSL logic. We start with an object {} called "conditions". Whenever we encounter a truth set expressed as a positive, we record it in conditions['match']. Whenever we encounter a truth set expressed as a complement (or negative) of another set, then we record those criteria in conditions["exclude"]. If you haven't realized it already, complement sets are not logically symmetrical to positive sets.
When the CSL processor evaluates the truth of a statement, it will return true if the object matches ANY member of the conditions['match']. It will return false if the object matches ANY member of the conditions['exclude'] set. Thus, to be completely true, the object must match NONE of the conditions['exclude']. In order to work with positive sets, we can use De Morgan's law to transform our formulas so that they only deal with finite sets.

"All" --> Intersection(A['match'], B['match'])
"Any" --> Union(A['match'], B['match'])
"None/Not Any") --> Intersection(~A, ~B) --> ~Union(A, B) --> Union(A['exclude'], B['exclude'])
"Not All" --> Union(~A, ~B) --> ~Intersection(A, B) --> Intersection(A['exclude'], B['exclude'])

De Morgan's Law
~(P | Q) <-> (~P & ~Q)
~(P & Q) <-> ~P | ~Q

Let's get back to the application of these logic operations on our "conditions" object. When performing an Intersection() operation, you can return a single object. However, a Union operation might be too complicated to be represented by a single "conditions" object, so it will return multiple objects that must be evaluated independently.

"All" returns a single object. The negation of "All" is "Not All", which also returns a single object.
"Any" returns multiple objects. The negation of "Any" is "None/Not Any", which also returns multiple objects.

The conditions['match'] object starts as an infinite set. Any additional criteria decreases the possible set of condition['match']. The match group cannot grow.
The conditions['exclude'] object starts as an empty set. Any additional criteria expands the possible set of conditions['exclude']. The exclude group cannot shrink.

One problem that I run into a lot is trying to represent CSL logic in truth tables. The 1st conditional can be represented as "If (A)". The subsequent level is "If ((A) & B)". The next level would be "If (((A) & B) & C)." And so on. Each level is joined by a logical "AND" operation, so it's always an intersection operation. Also consider that each conditional can only be evaluated after the previous conditional. So the constraints on the truth set can only be increased; the constraints are never decreased. That is why conditions['match'] is always intersected, but conditions['exclude'] is actually unioned. 

The second problem I run into is dealing with OR operations ("ANY" and "NONE"). In truth tables, they are represented as (A OR B OR C). Unfortunately, these are complex to represent as an array. I am trying to compress branching logic into a flat conditions object with "match" and "exclude" arrays. The relative position of the "OR" condition is relevant to evaluating a truth statement. However, information about relative position is purposefully discarded in my compressed condition objects. However, I can get around this limitation by creating two condition objects - with each representing a different valid truth condition.

The JurisM-CSL extension supports complex conditional logic using a <conditions> and <condition> elements. The following details how it flows:
<condition>
    "all" --> [intersection(match1, match2)]
	"any" --> [match1, match2]
    "none" --> [union(exclude1, exclude2)]
	"notAll" --> [exclude1, exclude2]

<conditions>// ~ means "compliment". "AC" means union of "A" and "C". Array elements are joined by "OR".
	"all"	--> "set1" AND 	"set2"	= "set3"
				[A, B]		[C, D]	= [AC, AD, BC, BD]

	"any"	--> "set1" OR 	"set2"	= "set3"
				[A, B]		[C, D] 	= [A, B, C, D]

	"none"	--> "set1" AND 	"set2"	= "set3"
				[A, B]		[C, D] 	= [~AC, ~AD, ~BC, ~BD]

	"notAll"--> "set1" AND 	"set2"	= "set3"
				[A, B]		[C, D]	= [~A, ~B, ~C, ~D]
 */

/*
all --> none
none --> all
any --> all
any --> none
all --> any
none --> any

<text macro="macroname"/>
<text variable=""> //form="short/verb" //value="variableName"
<text term=""> // like value, but is limited to Appendix II, and can be pluralized and genderized
<text value=""> // like term, but no support for localization?
<choose>
<if>
<else-if>
<else>
<conditions>
<condition>

conditions: position; match=all,any,none; variable; type; styletype; is-numeric; is-plural; disambiguate, is-uncertain-date; 

<number variable>
<text variable>
<names variable>
<date variable> //date-parts

excluded_variables = ["locator","locator-date","locator-extra","first-reference-note-number"]
*/

// we are going to ignore <group> elements for our logical testing. Yes, it's an implied conditional,but if <group> is the root element, then we have to resolve the ambiguity in favor of display. We must rely on explicit conditions to narrow field choice.

/*var conditions = {
	"matchAll":"",
	"matchAny":"",
	"matchNone":"",
	"type":[],
	"styletype":[],
	"variable":[],
	"position":[],
	"is-numeric":[],
	"is-plural":[],
	"disambiguate":[],
	"is-uncertain-date":[]
}
*/
