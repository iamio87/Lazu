CSLTEST = LazuProcessor();
setTimeout(function(){

/*CSLTEST.Plugin.registerModule(CoreModules)
CSLTEST.Plugin.registerModule(SecondOrderModules)
CSLTEST.Plugin.registerModule(StyleAttributesModule)
CSLTEST.Plugin.registerModule(RangeModule)
CSLTEST.Plugin.registerModule(NumberModule)
CSLTEST.Plugin.registerModule(DateModule)
CSLTEST.Plugin.registerModule(NameModule)*/



//(function(){
	function Test(){
		var self = this;
		function flush(){
			self.Engine = {bibliography:{sort:{tokens:[]},tokens:[]}};
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

		function ListCompare(A, B){ //// http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
			if (A.length != B.length){
					var div1 = document.createElement('DIV');
					var div2 = document.createElement('DIV');
					var br = document.createElement('BR');
					div1.innerHTML = "expected: " + B.length + " results";
					div2.innerHTML = "result: " + A.length + " results";
					document.getElementById('display').appendChild(div1);
					document.getElementById('display').appendChild(div2);
					document.getElementById('display').appendChild(br);
				return false
			}
			  for (var i = 0, l=A.length; i < l; i++) {
				  // Check if we have nested arrays
				  if (A[i] instanceof Array && B[i] instanceof Array) {
				      // recurse into the nested arrays
				      if (!equals(A[i],B[i])){
							console.log(A[i], B[i])
				          return false;
							}
				  } else if (A[i] != B[i]) { 
				      // Warning - two different object instances will never be equal: {x:20} != {x:20}
							console.log(A[i], B[i])
//							try {
							var div1 = document.createElement('DIV');
							var div2 = document.createElement('DIV');
							var br = document.createElement('BR');
							div1.innerHTML = "expected: " + B[i];
							div2.innerHTML = "result: " + A[i];
							document.getElementById('display').appendChild(div1);
							document.getElementById('display').appendChild(div2);
							document.getElementById('display').appendChild(br);
//							}catch(e){}
				      return false;   
				  }           
			  }
			return true
		}

		//// replace Default retrieve functions to accept XML strings instead of URLS.

		function compare(a, b){
			if (!ListCompare(a,b)){
				console.log("FAIL: ", this, a, b)
			}
		}

		//// Create test view
		function testBib(obj){
			flush();
			if (obj.hasOwnProperty("locale")){
				self.getFunction("loadStyle",1)(obj.locale);
			}
			if (obj.hasOwnProperty("style")){
				self.getFunction("loadStyle",1)(obj.style);
			} else {
				console.log("FAILURE: No style object given"); // style is required
			}
			obj.sources.map(function(source){
				self.Public.Source.add(source);
			})
			compare.call(obj, self.Public.makeBibliography(), obj.result);
		}

		function testCite(obj, prefix, suffix){
			flush();
			if (obj.hasOwnProperty("locale")){
				self.getFunction("loadStyle",1)(obj.locale);
			}
			if (obj.hasOwnProperty("style")){
				self.getFunction("loadStyle",1)(obj.style);
			} else {
				console.log("FAILURE: No style object given"); // style is required
			}
			var cluster = {};
			var cites = obj.sources.map(function(source){
				var id = self.Public.Source.add(source)[0].id;
				return {id:id, prefix:prefix, suffix:suffix};
			})
			cluster.cites = cites;
			var ret = self.Public.easyCite(cluster)
			compare.call(obj, ret , obj.result);
		}
		function testCites(obj, prefix, suffix){
			flush();
			if (obj.hasOwnProperty("locale")){
				self.getFunction("loadStyle",1)(obj.locale);
			}
			if (obj.hasOwnProperty("style")){
				self.getFunction("loadStyle",1)(obj.style);
			} else {
				console.log("FAILURE: No style object given"); // style is required
			}
			obj.sources.map(function(source){
				self.Public.Source.add(source);
			})
			var prevClusters = [];
			var outputs = {}
			obj.clusters.map(function(cluster){
				var r = self.Public.processCitationCluster(cluster, prevClusters, []);
				prevClusters.push(r.id)
				Object.keys(r).map(function(key){
					if (key != "id"){
						outputs[key] = r[key];
					}
				})
			})
			var retz = prevClusters.map(function(clusterID){
				return outputs[clusterID];
			})
			compare.call(obj, retz , obj.result);
		}
		function testCitesAndBib(obj, prefix, suffix){
			testCites(obj, prefix, suffix);
			compare.call(obj, CSLTEST.makeBibliography(), obj.bibliography);
		}

		var TestArea = {};
		TestArea["bibliography"] = function(citations){
			return self.Public.makeBibliography()
		}
		TestArea["cluster"] = function(cluster){
			return self.Public.processCitationCluster(cluster)
		}
		TestArea["source"] = function(citation){
			return self.Public.processSource(citation)
		}

		self.Public.Test = {flush:flush, testBib:testBib, testCite:testCite, testCites:testCites, testCitesAndBib};
	};
	CSLTEST.Plugin.registerModule(Test);
	var START = Date.now();

	CSLTEST.Test.testBib({ //// <text variable=""/>
		id:"textVar1",
		style:"<style><info></info><bibliography><layout><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["Home","Janice"],
	});
	CSLTEST.Test.testBib({ //// <text variable=""/> w/ formatting
		id:"textVar2",
		style:"<style><info></info><bibliography><layout><text font-weight='bold' variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:['<span style="font-weight: bold;">Home</span>','<span style="font-weight: bold;">Janice</span>'],
	});
	CSLTEST.Test.testBib({ //// <text value=""/>
		id:"textVal1",
		style:"<style><info></info><bibliography><layout><text value='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["title","title"],
	});
	CSLTEST.Test.testBib({ //// <text value=""/> w/ formatting
		id:"textVal2",
		style:"<style><info></info><bibliography><layout><text text-decoration='underline' value='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:['<span style="text-decoration: underline;">title</span>','<span style="text-decoration: underline;">title</span>'],
	});
	CSLTEST.Test.testBib({ //// <text term=""/> <locale:term name=""/> <locale>
		//// will fail unless document <HEAD> contains <meta charset="UTF-8">
		id:"textTerm1",
		style:"<style><info></info><bibliography><layout><text term='forthcoming'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["à paraître","à paraître"],
	});
	CSLTEST.Test.testBib({ //// <text term> w/ formatting
		id:"textTerm2",
		style:"<style><info></info><bibliography><layout><text font-style='italic' text-case='uppercase' term='forthcoming'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:['<span style="font-style: italic;">À PARAÎTRE</span>','<span style="font-style: italic;">À PARAÎTRE</span>'],
	});

	CSLTEST.Test.testBib({ //// Simple prefix, suffix
		id:"prefix-suffix1",
		style:'<style><info></info><bibliography><layout><text variable="title" prefix="$" suffix="#*" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["$Home#*","$Janice#*"],
	});

	CSLTEST.Test.testBib({ //// Simple Decorations - UPPERCASE
		id:"decorate1",
		style:'<style><info></info><bibliography><layout><text variable="title" text-case="uppercase" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["HOME","JANICE"],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - LOWERCASE
		id:"decorate2",
		style:'<style><info></info><bibliography><layout><text variable="title" text-case="lowercase" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home"},{id:"4","title":"Janice"}],
		result:["home","janice"],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - SENTENCE-CASE
		id:"decorate3",
		style:'<style><info></info><bibliography><layout><text variable="title" text-case="sentence" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"HOME, SWEET HOME"},{id:"4","title":"janice milo"}],
		result:["HOME, SWEET HOME","Janice milo"], // Sentence case does not convert uppercase to lower according to Spec.
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - CAPITALIZE-FIRST
		id:"decorate4",
		style:'<style><info></info><bibliography><layout><text variable="title" text-case="capitalize-first" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"HOME, SWEET HOME"},{id:"4","title":"janice milo"}],
		result:["HOME, SWEET HOME","Janice milo"],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - SMALL-CAPS
		id:"decorate5",
		style:'<style><info></info><bibliography><layout><text variable="title" font-variant="small-caps" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"HOME, SWEET HOME"},{id:"4","title":"janice milo"}],
		result:['<span style="font-variant: small-caps;">HOME, SWEET HOME</span>','<span style="font-variant: small-caps;">janice milo</span>'],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - UNDERLINE
		id:"decorate6",
		style:'<style><info></info><bibliography><layout><text variable="title" text-decoration="underline" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home, Sweet Home"},{id:"4","title":"Janice Milo"}],
		result:['<span style="text-decoration: underline;">Home, Sweet Home</span>','<span style="text-decoration: underline;">Janice Milo</span>'], 
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - BOLD
		id:"decorate7",
		style:'<style><info></info><bibliography><layout><text variable="title" font-weight="bold" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home, Sweet Home"},{id:"4","title":"Janice Milo"}],
		result:['<span style="font-weight: bold;">Home, Sweet Home</span>','<span style="font-weight: bold;">Janice Milo</span>'], 
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - strip-periods
		id:"decorate8",
		style:'<style><info></info><bibliography><layout><text variable="title" strip-periods="true" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"Home. Sweet. Home."},{id:"4","title":"Janice. Milo."}],
		result:['Home Sweet Home','Janice Milo'], 
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - combined - text variable
		id:"decorate9",
		style:'<style><info></info><bibliography><layout><text variable="title" text-case="sentence" font-variant="small-caps" text-decoration="underline", font-weight="bold"/></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"home, sweet home"},{id:"4","title":"janice milo"}],
		result:['<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">Home, sweet home</span>','<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">Janice milo</span>'],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - combined - locale term
		id:"decorate10",
		style:'<style><info></info><bibliography><layout><text term="forthcoming" text-case="sentence" font-variant="small-caps" text-decoration="underline", font-weight="bold" strip-periods="true"/></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître.</term></terms></locale>",
		sources:[{"id":"2","title":"home, sweet home"},{id:"4","title":"janice milo"}],
		result:['<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">À paraître</span>','<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">À paraître</span>'],
	});
	CSLTEST.Test.testBib({ //// Simple Decorations - combined - text value
		id:"decorate11",
		style:'<style><info></info><bibliography><layout><text value="Static. Value" text-case="sentence" font-variant="small-caps" text-decoration="underline", font-weight="bold" strip-periods="true"/></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{"id":"2","title":"home, sweet home"},{id:"4","title":"janice milo"}],
		result:['<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">Static Value</span>','<span style="font-variant: small-caps; font-weight: bold; text-decoration: underline;">Static Value</span>'],
	});
	CSLTEST.Test.testBib({ //// <choose><if/>
		id:"if1",
		style:"<style><info></info><bibliography><layout><choose><if type='a c'><text term='forthcoming' suffix=' '/></if></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","Janice","à paraître Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="any"/>
		id:"if-any1",
		style:"<style><info></info><bibliography><layout><choose><if match='any' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2", "title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","à paraître Janice","à paraître Wobble"],
	})
	CSLTEST.Test.testBib({ //// <choose><if match="all"/>
		id:"if-all1",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","Janice","à paraître Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="none"/>
		id:"if-none1",
		style:"<style><info></info><bibliography><layout><choose><if match='none' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["Home","Janice","Wobble"],
	})
	CSLTEST.Test.testBib({ //// <choose><if match="nand"/>
		id:"if-nand1",
		style:"<style><info></info><bibliography><layout><choose><if match='nand' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["Home","à paraître Janice","Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="all"/> <else>
		id:"if-else1",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","blue Janice","à paraître Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="any"/> <else>
		id:"if-else2",
		style:"<style><info></info><bibliography><layout><choose><if match='any' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","à paraître Janice","à paraître Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="none"/> <else>
		id:"if-else3",
		style:"<style><info></info><bibliography><layout><choose><if match='none' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["blue Home","blue Janice","blue Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><if match="nand"/> <else>
		id:"if-else4",
		style:"<style><info></info><bibliography><layout><choose><if match='nand' variable='title' type='a c'><text term='forthcoming' suffix=' '/></if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["blue Home","à paraître Janice","blue Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><else-if match="all"/>
		id:"else-if1",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a'><text term='forthcoming' suffix=' '/></if><else-if type='b' match='all'><text value='ELSEIF ' /></else-if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","ELSEIF Janice","blue Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><else-if match="any"/>
		id:"else-if2",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a'><text term='forthcoming' suffix=' '/></if><else-if type='a b' variable='title' match='any'><text value='ELSEIF ' /></else-if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","ELSEIF Janice","ELSEIF Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><else-if match="none"/>
		id:"else-if3",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a'><text term='forthcoming' suffix=' '/></if><else-if type='a b' variable='title' match='none'><text value='ELSEIF ' /></else-if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","blue Janice","blue Wobble"],
	});
	CSLTEST.Test.testBib({ //// <choose><else-if match="any"/>
		id:"else-if4",
		style:"<style><info></info><bibliography><layout><choose><if match='all' variable='title' type='a'><text term='forthcoming' suffix=' '/></if><else-if type='a b' variable='title' match='nand'><text value='ELSEIF ' /></else-if><else><text value='blue ' /></else></choose><text variable='title'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"1","title":"Home",type:"a"},{id:"2","title":"Janice",type:"b"},{id:"3","title":"Wobble",type:"c"}],
		result:["à paraître Home","blue Janice","ELSEIF Wobble"],
	});

	CSLTEST.Test.testBib({ //// <sort>
		id:"sort1",
		style:"<style><info></info><bibliography><sort><key variable='title'/><key variable='type'/></sort><layout><text variable='title'/><text variable='type'/></layout></bibliography></style>",
//		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Zahara",type:"a"},{id:"3","title":"Anise",type:"c"},{id:"4","title":"Anise",type:"b"}],
		result:["Aniseb","Anisec","Zaharaa"],
	});
	CSLTEST.Test.testBib({ //// <sort>"sort"="descending"
		id:"sort2",
		style:"<style><info></info><bibliography><sort><key variable='id' sort='descending'/></sort><layout><text variable='title'/></layout></bibliography></style>",
		sources:[{"id":"2","title":"Zahara"},{id:"3","title":"Barbados"},{id:"4","title":"Anise"}],
		result:["Anise","Barbados","Zahara"],
	});
	CSLTEST.Test.testBib({ //// <sort>"variable" = textVariable
		id:"sort3",
		style:"<style><info></info><bibliography><sort><key variable='title' sort='ascending'/></sort><layout><text variable='title'/></layout></bibliography></style>",
		sources:[{"id":"2","title":"Barbados"},{id:"3","title":"Zahara"},{id:"4","title":"Anise"}],
		result:["Anise","Barbados","Zahara"],
	});

	CSLTEST.Test.testBib({ //// <group> simple
		id:"group1",
		style:"<style><info></info><bibliography><sort><key variable='title' sort='ascending'/></sort><layout><group><text variable='title'/></group></layout></bibliography></style>",
		sources:[{"id":"2","title":"Barbados"},{id:"3","title":"Zahara"},{id:"4","title":"Anise"}],
		result:["Anise","Barbados","Zahara"],
	});
	CSLTEST.Test.testBib({ //// <group> missing variable
		id:"group2",
		style:"<style><info></info><bibliography><sort><key variable='title' sort='ascending'/></sort><layout><group><text term='forthcoming' suffix=' ' /><text value='from' suffix=' '/><text variable='publisher' /></group></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":"Barbados"},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:""}],
		result:["","","forthcoming from Penguin"],
	});

	CSLTEST.Test.testBib({ //// <group> missing variable in a macro
		id:"group3",
		style:"<style><info></info><macro name='showtitle'><text variable='publisher'/><text term='forthcoming' /></macro><bibliography><sort><key variable='title' sort='ascending'/></sort><layout><group><text macro='showtitle' /><text value='hi' /></group></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":"Barbados"},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:""}],
		result:["","","Penguinforthcominghi"],
	});

	CSLTEST.Test.testBib({ //// <group> Nested <group>
		id:"group4",
		style:"<style><info></info><sort><key variable='title' sort='ascending'/></sort><bibliography><layout><group><text variable='title' /><group><text term='forthcoming' prefix=' '/><text value=' from '/><text variable='publisher'/></group><text value='value' prefix=' - '/></group></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":""},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:""}],
		result:["","Zahara forthcoming from Penguin - value","Anise - value"],
	});

	CSLTEST.Test.testBib({ //// <group> with styling
		id:"group5",
		style:'<style><info></info><sort><key variable="title" sort="ascending"/></sort><bibliography><layout><group text-decoration="underline"><text variable="title" font-style="italic" /><text variable="publisher" text-decoration="none" prefix=" " suffix=" "/><text value="static" suffix="." font-weight="bold"/></group></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":"Hello",publisher:"Marseille"},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:"Moshi"}],
		result:['<span style="font-style: italic; text-decoration: underline;">Hello</span><span style="text-decoration: underline;"> </span>Marseille<span style="text-decoration: underline;"> </span><span style="font-weight: bold; text-decoration: underline;">static</span><span style="text-decoration: underline;">.</span>','<span style="font-style: italic; text-decoration: underline;">Zahara</span><span style="text-decoration: underline;"> </span>Penguin<span style="text-decoration: underline;"> </span><span style="font-weight: bold; text-decoration: underline;">static</span><span style="text-decoration: underline;">.</span>','<span style="font-style: italic; text-decoration: underline;">Anise</span><span style="text-decoration: underline;"> </span>Moshi<span style="text-decoration: underline;"> </span><span style="font-weight: bold; text-decoration: underline;">static</span><span style="text-decoration: underline;">.</span>'],
	});

	CSLTEST.Test.testBib({ //// <group> with nested styling
		id:"group6",
		style:'<style><info></info><sort><key variable="title" sort="ascending"/></sort><bibliography><layout><group prefix="(" suffix=")" text-decoration="underline"><text variable="title" font-style="italic" suffix="." /><group prefix="[" suffix="]" font-weight="bold"><text variable="publisher" font-weight="normal" prefix=" " suffix=" "/><text value="static" suffix="." text-decoration="none" /></group></group></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":"Hello",publisher:""},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:"Moshi"}],
		result:['(<span style="font-style: italic; text-decoration: underline;">Hello</span><span style="text-decoration: underline;">.</span>)','(<span style="font-style: italic; text-decoration: underline;">Zahara</span><span style="text-decoration: underline;">.[</span><span style="font-weight: bold; text-decoration: underline;"> </span><span style="text-decoration: underline;">Penguin</span><span style="font-weight: bold; text-decoration: underline;"> </span><span style="font-weight: bold;">static</span><span style="font-weight: bold; text-decoration: underline;">.</span><span style="text-decoration: underline;">]</span>)','(<span style="font-style: italic; text-decoration: underline;">Anise</span><span style="text-decoration: underline;">.[</span><span style="font-weight: bold; text-decoration: underline;"> </span><span style="text-decoration: underline;">Moshi</span><span style="font-weight: bold; text-decoration: underline;"> </span><span style="font-weight: bold;">static</span><span style="font-weight: bold; text-decoration: underline;">.</span><span style="text-decoration: underline;">]</span>)'],
	});

	CSLTEST.Test.testBib({ //// <group> with nested styling & delimiters
		id:"group7",
		style:'<style><info></info><sort><key variable="title" sort="ascending"/></sort><bibliography><layout><group font-style="italic" delimiter=" ** "><text variable="title" /><group font-weight="bold" delimiter=" ^^ " text-decoration="underline" suffix="~"><text variable="publisher" /><text value="static" /></group> <text value="Bubbly" suffix="."/></group></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":"Hello",publisher:"Barnham"},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:"Moshi"}],
		result:['<span style="font-style: italic;">Hello ** </span><span style="font-style: italic; font-weight: bold; text-decoration: underline;">Barnham ^^ static</span><span style="font-style: italic;">~ ** Bubbly.</span>','<span style="font-style: italic;">Zahara ** </span><span style="font-style: italic; font-weight: bold; text-decoration: underline;">Penguin ^^ static</span><span style="font-style: italic;">~ ** Bubbly.</span>','<span style="font-style: italic;">Anise ** </span><span style="font-style: italic; font-weight: bold; text-decoration: underline;">Moshi ^^ static</span><span style="font-style: italic;">~ ** Bubbly.</span>'],
	});

	CSLTEST.Test.testBib({ //// <group> Make sure that delimiter does not precede output when first child element of <group> is another <group>. Also that child <groups> inherit proper formatting
		id:"group8",
		style:"<style><info></info><sort><key variable='title' sort='ascending'/></sort><bibliography><layout><group delimiter=', '><group text-decoration='underline'><text  value='hi'/></group><text value='camber' /><group font-weight='bold'><text text-case='uppercase' value='home' /></group></group></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>forthcoming</term></terms></locale>",
		sources:[{"id":"2","title":""},{id:"3","title":"Zahara",publisher:"Penguin"},{id:"4","title":"Anise",publisher:""}],
		result:['<span style="text-decoration: underline;">hi</span>, camber, <span style="font-weight: bold;">HOME</span>','<span style="text-decoration: underline;">hi</span>, camber, <span style="font-weight: bold;">HOME</span>','<span style="text-decoration: underline;">hi</span>, camber, <span style="font-weight: bold;">HOME</span>'],
	});

	CSLTEST.Test.testBib({ //// <macro>
		id:"macro1",
		style:"<style><info></info><macro name='showtitle'><text variable='title'/><text value='yellow' /></macro><macro name='localeterm'><text term='forthcoming' /></macro><bibliography><sort><key variable='title' sort='descending'/></sort><layout><text macro='showtitle' /><text macro='localeterm' /><text value='hi' /></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Zahara"},{id:"3","title":"Barbados"},{id:"4","title":"Anise"}],
		result:["Zaharayellowà paraîtrehi","Barbadosyellowà paraîtrehi","Aniseyellowà paraîtrehi"],
	});
	CSLTEST.Test.testBib({ //// <macro> nested macros
		id:"macro2",
		style:"<style><info></info><macro name='showtitle'><text variable='title' suffix=' ' /><text value='yellow' suffix=' ' /><text macro='localeterm'/></macro><macro name='localeterm'><text term='forthcoming' /></macro><bibliography><sort><key variable='title' sort='descending'/></sort><layout><text macro='showtitle' /></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Zahara"},{id:"3","title":"Barbados"},{id:"4","title":"Anise"}],
		result:["Zahara yellow à paraître","Barbados yellow à paraître","Anise yellow à paraître"],
	});


	CSLTEST.Test.testBib({ //// <number>
		id:"number1",
		style:"<style><info></info><bibliography><sort><key variable='title' sort='descending'/></sort><layout><number variable='page'/></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Zahara", page:201882},{id:"3","title":"Barbados", page:17},{id:"4",title:"Anise",page:13}],
		result:["201882","17","13"],
	});

	CSLTEST.Test.testBib({ //// <number> form='roman'
		id:"number-roman",
		style:"<style><info></info><bibliography><sort><key variable='title' sort='descending'/></sort><layout><number variable='page' form='roman' /></layout></bibliography></style>",
		locale:"<locale xml:lang='en-US'><terms><term name='forthcoming'>à paraître</term></terms></locale>",
		sources:[{"id":"2","title":"Zahara", page:4812},{id:"3","title":"Barbados", page:17},{id:"4",title:"Anise",page:13}],
		result:["mmmmdcccxii", "xvii", "xiii" ],
	});

	CSLTEST.Test.testBib({ //// <number> form='ordinal' gender="feminine"
		id:"number-ordinal",
		style:"<style lang='en-US'><info></info><bibliography><sort><key variable='title' sort='descending'/></sort><layout><number variable='page' form='ordinal' /></layout></bibliography></style>",
		locale:'<locale xml:lang="en-US"><terms><term name="page" gender="feminine">      <single>page</single>      <multiple>pages</multiple>    </term>  <term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term></terms></locale>',
		sources:[{"id":"2","title":"Zahara", page:201882},{id:"3","title":"Damon", page:17},{id:"4",title:"Anise",page:13},{id:"1",title:"Barbados",page:1}],
		result:["201882ᵉ","17ᵉ","1ʳᵉ","13ᵉ"],
	});

	CSLTEST.Test.testBib({ //// <number> form='ordinal-long' <sort> key="number"
		id:"number-long-ordinal &&  sort by number",
		style:"<style lang='en-US'><info></info><bibliography><sort><key variable='page' sort='descending'/></sort><layout><number variable='page' form='long-ordinal' /></layout></bibliography></style>",
		locale:'<locale xml:lang="en-US"><terms><term name="page" gender="feminine">      <single>page</single>      <multiple>pages</multiple>    </term>  <term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term></terms></locale>',
		sources:[{id:"3","title":"Zahara", page:201882},{id:"2","title":"Barbados", page:3},{id:"4",title:"Anise",page:6},{id:"1",title:"Anise",page:1}],
		result:["201882ᵉ","sixième","troisième","premier"],
	});

	CSLTEST.Test.testBib({ //// <number> form='ordinal-long' <sort> key="number"
		id:"number-numeric",
		style:"<style lang='en-US'><info></info><bibliography><sort><key variable='page' sort='ascending'/></sort><layout><number variable='page' form='numeric' /></layout></bibliography></style>",
		locale:'<locale xml:lang="en-US"><terms><term name="page" gender="feminine">      <single>page</single>      <multiple>pages</multiple>    </term>  <term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term></terms></locale>',
		sources:[{id:"3","title":"Zahara", page:201882},{id:"2","title":"Barbados", page:3},{id:"4",title:"Anise",page:"06"},{id:"1",title:"Anise",page:1}],
		result:["1","3","6","201882"],
	});


	CSLTEST.Test.testBib({ //// <number> page-range-format='minimal' page-range-delimiter NOT SET, page-delimiter = ","
		id:"number page-range1",
		style:'<style page-range-format="minimal"><info></info><bibliography><sort><key variable="title" sort="descending"/></sort><layout><number variable="page" form="numeric" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{id:"1","title":"Zahara", page:"3-10, 71-72"},{id:"2","title":"Barbados", page:"100-104, 600-613, 1100-1123"},{id:"3",title:"Anise",page:"107-8, 505-17, 1002-6"},{id:"4",title:"Anibell",page:"321-25, 415-532, 11564-68, 13792-803"},{id:"5",title:"Scalise",page:"1496-1504, 2787-2816"} ],
		result:["3-10, 71-2", "1496-504, 2787-816", "100-4, 600-13, 1100-23", "107-8, 505-17, 1002-6", "321-5, 415-532, 11564-8, 13792-803" ],
	});

	CSLTEST.Test.testBib({ //// <number> page-range-format='chicago', page-delimiter = ";"
		id:"number page-range2",
		style:'<style page-range-format="chicago"><bibliography><sort><key variable="title" sort="descending"/></sort><layout><number variable="page" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{id:"1","title":"Zahara", page:"3-10; 71-72"},{id:"2","title":"Barbados", page:"100-104; 600-613; 1100-1123"},{id:"3",title:"Anise",page:"107-8; 505-17; 1002-6"},{id:"4",title:"Anibell",page:"321-25; 415-532; 11564-68; 13792-803"},{id:"5",title:"Scalise",page:"1496-1504; 2787-2816"} ],
		result:["3-10; 71-72", "1496-1504; 2787-2816", "100-104; 600-613; 1100-1123", "107-8; 505-17; 1002-6", "321-25; 415-532; 11564-68; 13792-803" ],
	});

	CSLTEST.Test.testBib({ //// <number> page-range-format='expanded', page-range-delimiter = ":"
		id:"number page-range3",
		style:'<style page-range-format="expanded" page-range-delimiter=":"><bibliography><sort><key variable="title" sort="descending"/></sort><layout><number variable="page" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{id:"1","title":"Zahara", page:"3-10, 71:72"},{id:"2","title":"Barbados", page:"100-104, 600-613, 1100-1123"},{id:"3",title:"Anise",page:"107-8, 505-17, 1002-6"},{id:"4",title:"Anibell",page:"321-25, 415-532, 11564:68, 13792:803"},{id:"5",title:"Scalise",page:"1496-1504, 2787-2816"} ],
		result:["3:10, 71:72", "1496:1504, 2787:2816", "100:104, 600:613, 1100:1123", "107:108, 505:517, 1002:1006", "321:325, 415:532, 11564:11568, 13792:13803" ],
	});

	CSLTEST.Test.testBib({ //// <number> page-range-format='minimal-two', page-range-delimiter = "-"
		id:"number page-range4",
		style:'<style page-range-format="minimal-two" page-range-delimiter="-"><bibliography><sort><key variable="title" sort="descending"/></sort><layout><number variable="page" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[{id:"1","title":"Zahara", page:"3-10, 71-72"},{id:"2","title":"Barbados", page:"100-104, 600-613, 1100-1123"},{id:"3",title:"Anise",page:"107-8, 505-17, 1002-6"},{id:"4",title:"Anibell",page:"321-25, 415-532, 11564-68, 13792-803"},{id:"5",title:"Scalise",page:"1496-1504, 2787-2816"} ],
		result:["3-10, 71-72", "1496-504, 2787-816", "100-04, 600-13, 1100-23", "107-08, 505-17, 1002-06", "321-25, 415-532, 11564-68, 13792-803" ],
	});
	CSLTEST.Test.testBib({ //// <label>
		id:"number label1",
		style:'<style page-range-format="minimal-two" page-range-delimiter="-"><bibliography><sort><key variable="title" sort="descending"/></sort><layout><label variable="page" font-weight="bold" suffix=" "/><number variable="page" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='page' ><single>p.</single><multiple>pp.</multiple></term></terms></locale>",
		sources:[{id:"1","title":"Zahara", page:"1-14"},{id:"2","title":"Barbados", page:"224"},{id:"3",title:"Anise",page:"0517"},{id:"4",title:"Anibell",page:"152, 839"},{id:"5",title:"Scalise",page:"1496-1504, 2787-2816"} ],
		result:['<span style="font-weight: bold;">pp.</span> 1-14', '<span style="font-weight: bold;">pp.</span> 1496-504, 2787-816', '<span style="font-weight: bold;">p.</span> 224', '<span style="font-weight: bold;">p.</span> 517', '<span style="font-weight: bold;">pp.</span> 152, 839' ],
	});
	CSLTEST.Test.testBib({ //// <label> page-range-format='minimal-two', page-range-delimiter = "-"
		id:"number label2",
		style:'<style><bibliography><sort><key variable="title" sort="descending"/></sort><layout><label form="short" variable="volume" suffix=" "/><number variable="volume" form="ordinal" /><text term="of" prefix=" " suffix=" "/><number variable="number-of-volumes"/><label variable="number-of-volumes" prefix=" " suffix="" /></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'><terms><term name='volume' ><single>volume</single><multiple>volumes</multiple></term><term form='short' name='volume' ><single>vol.</single><multiple>vols.</multiple></term><term name='of'>of</term><term name='ordinal'>th</term><term name='ordinal-01' >st</term><term name='ordinal-02' >nd</term><term name='ordinal-03' >rd</term></terms></locale>",
		sources:[{id:"1","title":"Zahara", "volume":"3","number-of-volumes":"3"},{id:"2","title":"Barbados",  "volume":"1-2","number-of-volumes":"4"},{id:"3",title:"Anise", "volume":"1","number-of-volumes":"1"}, ],
		result:['vol. 3rd of 3 volumes', 'vols. 1-2nd of 4 volumes', 'vol. 1st of 1 volume' ],
	});

/*	CSLTEST.Test.testBib({ //// <date> Basic numeric date. Tests whether date-parts are rendered.
		id:"date1-basic-numeric",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="numeric" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"> <date form="numeric" >    <date-part name="month" form="numeric" suffix="/" />    <date-part name="day" form="numeric" suffix="/" />    <date-part name="year" />  </date></locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:441,month:11,day:6}]},{id:"2","title":"Barbados", issued:[{year:1892,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:"1",day:"14"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:05}]}, {id:"5",title:"Constitution",issued:[{year:1783}]},],
		result:["11/6/441", "1892", "1783", "1/14/612", "5/1892"],
	});

	CSLTEST.Test.testBib({ //// <date> Basic text date. Tests integration with locale. month form="long"
		id:"date2-text",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="text" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"> <date form="numeric" >    <date-part name="month" form="numeric" suffix="/" />    <date-part name="day" form="numeric" suffix="/" />    <date-part name="year" />  </date><date form="text">    <date-part form="long" name="month" suffix=" " />    <date-part name="day" form="numeric" suffix=", "/>    <date-part name="year"/>  </date>	<terms><!-- LONG MONTH FORMS -->    <term name="month-01">January</term>    <term name="month-02">February</term>    <term name="month-03">March</term>    <term name="month-04">April</term>    <term name="month-05">May</term>    <term name="month-06">June</term>    <term name="month-07">July</term>    <term name="month-08">August</term>    <term name="month-09">September</term>    <term name="month-10">October</term>    <term name="month-11">November</term>    <term name="month-12">December</term>    <!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term>    <!-- SEASONS -->    <term name="season-01">Spring</term>    <term name="season-02">Summer</term>    <term name="season-03">Autumn</term>    <term name="season-04">Winter</term></terms></locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:441,month:11,day:14}]},{id:"2","title":"Barbados", issued:[{year:1892,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"14"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:05}]}, {id:"5",title:"Constitution",issued:[{year:1783}]},],
		result:[ "November 14, 441", "1892", "1783", "January 14, 612", "May 1892"],
	});

	CSLTEST.Test.testBib({ //// <date> Basic text date. Tests integration with locale. month form="short"
		id:"date3-text-short",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="text" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"> <date form="numeric" >    <date-part name="month" form="numeric-leading-zeros" suffix="/" />    <date-part name="day" form="numeric" suffix="/" />    <date-part name="year" />  </date><date form="text">    <date-part form="short" name="month" suffix=" " />    <date-part name="day" form="numeric" suffix=", "/>    <date-part name="year"/>  </date>	<terms><!-- LONG MONTH FORMS -->    <term name="month-01">January</term>    <term name="month-02">February</term>    <term name="month-03">March</term>    <term name="month-04">April</term>    <term name="month-05">May</term>    <term name="month-06">June</term>    <term name="month-07">July</term>    <term name="month-08">August</term>    <term name="month-09">September</term>    <term name="month-10">October</term>    <term name="month-11">November</term>    <term name="month-12">December</term>    <!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term>    <!-- SEASONS -->    <term name="season-01">Spring</term>    <term name="season-02">Summer</term>    <term name="season-03">Autumn</term>    <term name="season-04">Winter</term></terms></locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:441,month:11,day:14}]},{id:"2","title":"Barbados", issued:[{year:1892,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"14"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:05}]}, {id:"5",title:"Constitution",issued:[{year:1783}]},],
		result:[  "Nov. 14, 441", "1892", "1783", "Jan. 14, 612", "May 1892"],
	});
*/
	CSLTEST.Test.testBib({ //// <date> form="numeric-leading-zeros"
		id:"date4-numeric-leading-zeros",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="numeric" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"> <date form="numeric" >    <date-part name="month" form="numeric-leading-zeros" suffix="/" />    <date-part name="day" form="numeric-leading-zeros" suffix="/" />    <date-part name="year" />  </date><date form="text">    <date-part form="short" name="month" suffix=" " />    <date-part name="day" form="numeric" suffix=", "/>    <date-part name="year"/>  </date>	</locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:5,month:3,day:1}]},{id:"2","title":"Barbados", issued:[{year:1892,month:10,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"14"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:5}]}, {id:"5",title:"Constitution",issued:[{year:1783,month:12,day:31}]},],
		result:[ "03/01/5", "10/07/1892", "12/31/1783", "01/14/612", "05/1892"],
	});

	CSLTEST.Test.testBib({ //// <date> date ranges
		id:"date5-ranges",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="numeric" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"> <date form="numeric" >    <date-part name="month" form="numeric-leading-zeros" suffix="/" range-delimiter="--"/>    <date-part name="day" form="numeric-leading-zeros" suffix="/" range-delimiter="-"/>    <date-part name="year" range-delimiter="---"/>  </date><date form="text">    <date-part form="short" name="month" suffix=" " />    <date-part name="day" form="numeric" suffix=", "/>    <date-part name="year"/>  </date>	</locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:5,month:3,day:1},{year:15,month:2,day:22}]},{id:"2","title":"Barbados", issued:[{year:1892,month:6,day:7},{year:1892,month:10,day:3}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"21"},{year:"612",month:1,day:"22"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:5},{year:1842,month:5}]}, {id:"5",title:"Zora",issued:[{year:2003},{year:1917}]},],
		result:[  "03/01/5---02/22/15", "06/07--10/03/1892", "01/21-22/612", "05/1892---05/1842", "2003---1917"],
	});

	CSLTEST.Test.testBib({ //// <date> w/o Locale form
		id:"date6-no-locale-form",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="month" form="long" suffix=" " range-delimiter="--"/>    <date-part name="day" form="numeric-leading-zeros" suffix=", " range-delimiter="-"/>    <date-part name="year" range-delimiter="---"/></date></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"><terms><!-- LONG MONTH FORMS -->    <term name="month-01">January</term>    <term name="month-02">February</term>    <term name="month-03">March</term>    <term name="month-04">April</term>    <term name="month-05">May</term>    <term name="month-06">June</term>    <term name="month-07">July</term>    <term name="month-08">August</term>    <term name="month-09">September</term>    <term name="month-10">October</term>    <term name="month-11">November</term>    <term name="month-12">December</term></terms> </locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:5,month:3,day:1},{year:15,month:2,day:22}]},{id:"2","title":"Barbados", issued:[{year:1892,month:6,day:7},{year:1892,month:10,day:3}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"21"},{year:"612",month:1,day:"22"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:5},{year:1842,month:5}]}, {id:"5",title:"Zora",issued:[{year:2003},{year:1917}]},],
		result:["March 01, 5---February 22, 15", "June 07--October 03, 1892", "January 21-22, 612", "May 1892---May 1842", "2003---1917"],
	});

	CSLTEST.Test.testBib({ //// <date> limit day ordinals to day 1; + styling on date-parts
		id:"date7-limit-day-ordinals-to-day-1",
		style:'<style lang="fr-FR"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="text" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR">   <style-options limit-day-ordinals-to-day-1="true"/>   <date form="text" >    <date-part name="day" form="ordinal" suffix=" " />    <date-part name="month" form="short" suffix=" " strip-periods="true" text-case="uppercase" />        <date-part name="year" />  </date><terms>		<term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term>	<!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term> </terms></locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:5,month:3,day:1}]},{id:"2","title":"Barbados", issued:[{year:1892,month:10,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"1"},{year:"612",month:1,day:"4"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:5}]}, {id:"5",title:"Constitution",issued:[{year:1783,month:12,day:31}]},],
		result:["1ᵉʳ MAR 5", "7 OCT 1892", "31 DEC 1783", "1ᵉʳ–4 JAN 612", "MAY 1892"],
	});

	CSLTEST.Test.testBib({ //// <date> string date input
		///// STRING DATES are a convenience, no guarantees of accuracy. No guidance in spec for how to interpret possible variations in writing string dates.
		id:"date8-string-date-input",
		style:'<style lang="fr-FR"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="text" variable="issued" /></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR">   <style-options limit-day-ordinals-to-day-1="true"/>   <date form="text" >    <date-part name="day" form="ordinal" suffix=" " />    <date-part name="month" form="short" suffix=" " />        <date-part name="year" />  </date><terms>		<term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term>	<!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term> </terms></locale>',
		sources:[{id:"1",title:"Anise",issued:"5-3-1"}, /// uses locale for date order
			{id:"2","title":"Barbados", issued:"7-10-1892"}, /// uses length of value for date order
			{"id":"3","title":"Sam", issued:"612-01-1/720-5-14"}, // distinguish date-part delimiter from date-range delimiter
			{id:"4",title:"Yaor",issued:"05/1892-07/1892"}, // switched delimiters; no day-part on range
			 {id:"5",title:"Constitution",issued:"111-2013"}],//
		result:["1ᵉʳ Mar. 5", "7 Oct. 1892", "111–2013", "1ᵉʳ Jan. 612–14 May 720", "May–Jul. 1892"],
	});

	CSLTEST.Test.testBib({ //// <date> within <group>
		id:"date9-group integration",
		style:'<style lang="fr-FR"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><group text-decoration="underline"><text term="published" suffix=" "><date form="text" variable="issued" font-style="italic" /></group></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR">   <style-options limit-day-ordinals-to-day-1="true"/>   <date form="text" >    <date-part name="day" form="ordinal" suffix=" " />    <date-part name="month" form="short" suffix=" " />        <date-part name="year" />  </date><terms>		<term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> 	<term name="published" >publié</term>	<!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term>	<!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term> </terms></locale>',
		sources:[{id:"1",title:"Anise",issued:"5-3-1"}, /// uses locale for date order
			{id:"2","title":"Barbados", issued:"7-10-1892"}, /// uses length of value for date order
			{"id":"3","title":"Sam", issued:"612-01-1/720-5-14"}, // distinguish date-part delimiter from date-range delimiter
			{id:"4",title:"Yaor",issued:"05/1892-07/1892"}, // switched delimiters; no day-part on range
			 {id:"5",title:"Constitution",issued:"111-2013"}],//
		result:['<span style="text-decoration: underline;">publié </span><span style="font-style: italic; text-decoration: underline;">1ᵉʳ Mar. 5</span>', '<span style="text-decoration: underline;">publié </span><span style="font-style: italic; text-decoration: underline;">7 Oct. 1892</span>', '<span style="text-decoration: underline;">publié </span><span style="font-style: italic; text-decoration: underline;">111–2013</span>', '<span style="text-decoration: underline;">publié </span><span style="font-style: italic; text-decoration: underline;">1ᵉʳ Jan. 612–14 May 720</span>', '<span style="text-decoration: underline;">publié </span><span style="font-style: italic; text-decoration: underline;">May–Jul. 1892</span>'],
	});

	CSLTEST.Test.testBib({ //// <date> date-part inheritance
		id:"date10 - datepart inheritance",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date form="text" variable="issued" suffix=" B.C.E." text-decoration="underline" delimiter=" " text-case="lowercase"><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" font-weight="normal" font-style="italic" suffix="NOT DISPLAYED" range-delimiter="::"/> </date></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR">    <style-options punctuation-in-quote="false" limit-day-ordinals-to-day-1="true"/>	<date form="text" delimiter="@@@@@" prefix="NOT DISPLAYED" suffix="NOT DISPLAYED">    <date-part name="month" suffix=":" form="long" strip-periods="true" text-case="uppercase" />    <date-part name="day" suffix="," font-weight="bold"/>    <date-part name="year" form="short" range-delimiter="#######" />  </date>  <terms><term name="page" gender="feminine">      <single>page</single>      <multiple>pages</multiple>    </term>  <term name="ordinal">ᵉ</term><term name="ordinal-01" gender-form="feminine" match="whole-number">ʳᵉ</term><term name="ordinal-01" gender-form="masculine" match="whole-number">ᵉʳ</term> <!-- LONG ORDINALS -->    <term name="long-ordinal-01">premier</term>    <term name="long-ordinal-02">deuxième</term>    <term name="long-ordinal-03">troisième</term>    <term name="long-ordinal-04">quatrième</term>    <term name="long-ordinal-05">cinquième</term>    <term name="long-ordinal-06">sixième</term>    <term name="long-ordinal-07">septième</term>    <term name="long-ordinal-08">huitième</term>    <term name="long-ordinal-09">neuvième</term>    <term name="long-ordinal-10">dixième</term>    <!-- LONG MONTH FORMS -->    <term name="month-01">January</term>    <term name="month-02">February</term>    <term name="month-03">March</term>    <term name="month-04">April</term>    <term name="month-05">May</term>    <term name="month-06">June</term>    <term name="month-07">July</term>    <term name="month-08">August</term>    <term name="month-09">September</term>    <term name="month-10">October</term>    <term name="month-11">November</term>    <term name="month-12">December</term>    <!-- SHORT MONTH FORMS -->    <term name="month-01" form="short">Jan.</term>    <term name="month-02" form="short">Feb.</term>    <term name="month-03" form="short">Mar.</term>    <term name="month-04" form="short">Apr.</term>    <term name="month-05" form="short">May</term>    <term name="month-06" form="short">Jun.</term>    <term name="month-07" form="short">Jul.</term>    <term name="month-08" form="short">Aug.</term>    <term name="month-09" form="short">Sep.</term>    <term name="month-10" form="short">Oct.</term>    <term name="month-11" form="short">Nov.</term>    <term name="month-12" form="short">Dec.</term>    <!-- SEASONS -->    <term name="season-01">Spring</term>    <term name="season-02">Summer</term>    <term name="season-03">Autumn</term>    <term name="season-04">Winter</term></terms></locale>',
		sources:[{id:"1",title:"Anise",issued:[{year:105,month:3,day:1}]},{id:"2","title":"Barbados", issued:[{year:1892,month:10,day:7}]},{"id":"3","title":"Sam", issued:[{year:"612",month:1,day:"1"},{year:"612",month:1,day:"4"}]},{id:"4",title:"Yaor",issued:[{year:1892,month:5}]}, {id:"5",title:"Constitution",issued:[{year:1783,month:12,day:31},{year:1983,month:3,day:17}]},],
		result:['<span style="text-decoration: underline;">MAR: </span><span style="font-style: italic; text-decoration: underline;">1ᵉʳ</span><span style="text-decoration: underline;">, 105</span> B.C.E.','<span style="text-decoration: underline;">OCT: </span><span style="font-style: italic; text-decoration: underline;">7</span><span style="text-decoration: underline;">, 1892</span> B.C.E.','<span style="text-decoration: underline;">DEC: </span><span style="font-style: italic; text-decoration: underline;">31</span><span style="text-decoration: underline;">, 1783#######MAR: </span><span style="font-style: italic; text-decoration: underline;">17</span><span style="text-decoration: underline;">, 1983</span> B.C.E.','<span style="text-decoration: underline;">JAN: </span><span style="font-style: italic; text-decoration: underline;">1ᵉʳ</span><span style="text-decoration: underline;">::</span><span style="font-style: italic; text-decoration: underline;">4</span><span style="text-decoration: underline;">, 612</span> B.C.E.','<span style="text-decoration: underline;">MAY: 1892</span> B.C.E.'],
	});

	CSLTEST.Test.testBib({ //// <names> default behavior
		id:"names1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author" /></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"}]},{id:"2","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:["Tom Cairn Marston, Tim Johnson","Samuel Clemons"],
	});

	CSLTEST.Test.testBib({ //// <names> w/ child <name>
		id:"names2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><group text-decoration="underline" delimiter=", "><names variable="author"><name></name></names></group></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">Tom Cairn Marston, Tim Johnson, Frank Dempsey</span>','<span style="text-decoration: underline;">Samuel Clemons</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> w/ child <name> & <name-parts>
		id:"names3",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><group text-decoration="underline" delimiter=", "><group><text value="hial"/></group><names variable="author"><name><name-part name="given" text-case="uppercase"/><name-part font-weight="bold" name="family" /></name></names></group></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]}],
		result:['<span style="text-decoration: underline;">hial, TOM CAIRN </span><span style="font-weight: bold; text-decoration: underline;">Marston</span><span style="text-decoration: underline;">, FIRST MIDDLE </span><span style="font-weight: bold; text-decoration: underline;">Last</span><span style="text-decoration: underline;">, TIM </span><span style="font-weight: bold; text-decoration: underline;">Johnson</span><span style="text-decoration: underline;">, FRANK </span><span style="font-weight: bold; text-decoration: underline;">Dempsey</span>','<span style="text-decoration: underline;">hial, JEAN DE </span><span style="font-weight: bold; text-decoration: underline;">La Fontaine</span><span style="text-decoration: underline;"> III</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> w/ child <name> w/ name-as-sort-order + close tag
		id:"names4",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['La Last, First Middle de, Jr., Marston, Tom Cairn, Johnson, Tim, Dempsey, Frank','La Fontaine, Jean de, III','Clemons, Samuel'],
	});
	CSLTEST.Test.testBib({ //// <names> w/ child <name> w/ name-as-sort-order + close tag
		id:"names5",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['Marston, Tom Cairn, Tim Johnson, Frank Dempsey','La Fontaine, Jean de, III','Clemons, Samuel'],
	});
	CSLTEST.Test.testBib({ //// <name> w/ name-as-sort-order & sort-separator
		id:"names5.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" sort-separator="_" delimiter="__"/></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['Marston_Tom Cairn__Tim Johnson__Frank Dempsey','La Fontaine_Jean de_III','Clemons_Samuel'],
	});
	CSLTEST.Test.testBib({ //// <name> w/ name-as-sort-order & sort-separator & <name> delimiter
		id:"names5.4",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" sort-separator="_" delimiter="__" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['Marston_Tom Cairn__Johnson_Tim__Dempsey_Frank','La Fontaine_Jean de_III','Clemons_Samuel'],
	});
	CSLTEST.Test.testBib({ //// <name> ditto + <names> delimiter + styling inheritance of delimiters
		id:"names5.6",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names delimiter=" :: " variable="author editor" text-decoration="underline"><name name-as-sort-order="all" sort-separator=" - " delimiter=" -- " font-weight="bold" text-decoration="normal" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}], editor:[{family:"Greggs", given:"Samantha"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"}], author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", editor:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="font-weight: bold;">Marston - Tom Cairn</span><span style="text-decoration: underline;"> -- </span><span style="font-weight: bold;">Johnson - Tim</span><span style="text-decoration: underline;"> -- </span><span style="font-weight: bold;">Dempsey - Frank</span><span style="text-decoration: underline;"> :: </span><span style="font-weight: bold;">Greggs - Samantha</span>','<span style="font-weight: bold;">La Fontaine - Jean de - III</span><span style="text-decoration: underline;"> :: </span><span style="font-weight: bold;">Clemons - Samuel</span>','<span style="font-weight: bold;">Clemons - Samuel</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> decorations v <name> decorations. see "names7".
		id:"names6",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names text-decoration="underline" variable="author"><name name-as-sort-order="all" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+, +La Last, First Middle de+, Jr., +Johnson, Tim+, +Dempsey, Frank+</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>', '<span style="text-decoration: underline;">+Clemons, Samuel+</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> decorations v <name> decorations. see "names6"
		id:"names7",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name text-decoration="underline" name-as-sort-order="all" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", author:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">+La Last, First Middle de+, Jr.</span>, <span style="text-decoration: underline;">+Johnson, Tim+</span>, <span style="text-decoration: underline;">+Dempsey, Frank+</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>', '<span style="text-decoration: underline;">+Clemons, Samuel+</span>'],
	});

	CSLTEST.Test.testBib({ //// <names> "and" delimiter attribute as "symbol"
		id:"names8",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name and="symbol" text-decoration="underline" name-as-sort-order="all" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">+La Last, First Middle de+, Jr.</span>, <span style="text-decoration: underline;">+Johnson, Tim+</span>, & <span style="text-decoration: underline;">+Dempsey, Frank+</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span> & <span style="text-decoration: underline;">+Clemons, Samuel+</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" delimiter attribute as "text"
		id:"names9",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name and="text" text-decoration="underline" name-as-sort-order="all" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"},{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">+La Last, First Middle de+, Jr.</span>, <span style="text-decoration: underline;">+Johnson, Tim+</span>, <span style="text-decoration: underline;">+Dempsey, Frank+</span>, et <span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span> et <span style="text-decoration: underline;">+Clemons, Samuel+</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last"
		id:"names10", 
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="contextual" and="text" text-decoration="underline" name-as-sort-order="first" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.</span>, <span style="text-decoration: underline;">Tim+ +Johnson</span>, et <span style="text-decoration: underline;">Frank+ +Dempsey</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span> et <span style="text-decoration: underline;">Samuel+ +Clemons</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" == "after-inverted-name"
		id:"names11", 
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="after-inverted-name" and="text" text-decoration="underline" name-as-sort-order="first" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.</span>, <span style="text-decoration: underline;">Tim+ +Johnson</span> et <span style="text-decoration: underline;">Frank+ +Dempsey</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>, et <span style="text-decoration: underline;">Samuel+ +Clemons</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" == "after-inverted-name"
		id:"names11.3", 
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="after-inverted-name" and="text" text-decoration="underline" name-as-sort-order="all" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">+La Last, First Middle de+, Jr.</span>, <span style="text-decoration: underline;">+Johnson, Tim+</span>, et <span style="text-decoration: underline;">+Dempsey, Frank+</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>, et <span style="text-decoration: underline;">+Clemons, Samuel+</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" == "after-inverted-name"
		id:"names11.6", 
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="after-inverted-name" and="text" text-decoration="underline" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">Tom Cairn+ +Marston</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.</span>, <span style="text-decoration: underline;">Tim+ +Johnson</span> et <span style="text-decoration: underline;">Frank+ +Dempsey</span>','<span style="text-decoration: underline;">Jean de+ +La Fontaine III</span> et <span style="text-decoration: underline;">Samuel+ +Clemons</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" == "always"
		id:"names12",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="always" and="text" text-decoration="underline" name-as-sort-order="first" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston, Tom Cairn+</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.</span>, <span style="text-decoration: underline;">Tim+ +Johnson</span>, et <span style="text-decoration: underline;">Frank+ +Dempsey</span>','<span style="text-decoration: underline;">+La Fontaine, Jean de+, III</span>, et <span style="text-decoration: underline;">Samuel+ +Clemons</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" == "never". strings.suffix on family name-part comes after suffix name-part when order is not inverted.
		id:"names13",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="never" and="text" text-decoration="underline" name-as-sort-order="first" ><name-part name="given" suffix="+" /><name-part name="family" prefix="+" suffix="-"/></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston-, Tom Cairn+</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.-</span>, <span style="text-decoration: underline;">Tim+ +Johnson-</span> et <span style="text-decoration: underline;">Frank+ +Dempsey-</span>','<span style="text-decoration: underline;">+La Fontaine-, Jean de+, III</span> et <span style="text-decoration: underline;">Samuel+ +Clemons-</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-last" tests
		id:"names14",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name et-al-min="4" et-al-use-first="2"></name><et-al font-style="italic" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['Tom Cairn Marston, First Middle de La Last Jr., <span style="font-style: italic;">et al.</span>','Jean de La Fontaine III, Samuel Clemons'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "contextual"
		id:"names14.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-et-al="contextual" et-al-min="4" et-al-use-first="1"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Tom Cairn Marston et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "contextual"
		id:"names14.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-et-al="contextual" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Tom Cairn Marston, First Middle de La Last Jr., et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "always"
		id:"names14.3",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-et-al="always" et-al-min="4" et-al-use-first="1"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Tom Cairn Marston, et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "always"
		id:"names14.4",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-et-al="always" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Tom Cairn Marston, First Middle de La Last Jr., et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "always"
		id:"names14.5",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="always" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, First Middle de La Last Jr., et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "after-inverted-name"
		id:"names14.6",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, First Middle de La Last Jr. et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "after-inverted-name"
		id:"names14.6.5",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="1"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "after-inverted-name"
		id:"names14.7",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, La Last, First Middle de, Jr., et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "after-inverted-name"
		id:"names14.7.5",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="2"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, First Middle de La Last Jr. et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "and" & "delimiter-precedes-et-al" == "never"
		id:"names14.8",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="never" et-al-min="4" et-al-use-first="2" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, First Middle de La Last Jr. et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "delimiter-precedes-et-al" == "never"
		id:"names14.8.3",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="first" delimiter-precedes-et-al="never" et-al-min="4" et-al-use-first="1"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "delimiter-precedes-et-al" == "never"
		id:"names14.8.6",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name et-al-min="4" et-al-use-first="2" delimiter-precedes-et-al="never"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Tom Cairn Marston, First Middle de La Last Jr. et al.'],
	});
	CSLTEST.Test.testBib({ //// <names> "delimiter-precedes-et-al" == "never" / <et-al>node
		id:"names14.9",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" delimiter-precedes-et-al="never" et-al-min="3" et-al-use-first="2"></name><et-al font-style="italic" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, La Last, First Middle de, Jr. <span style="font-style: italic;">et al.</span>'],
	});
	CSLTEST.Test.testBib({ //// <names> "et-al-use-last"
		id:"names14.10.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" et-al-min="3" et-al-use-first="1" et-al-use-last="true"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, ... Dempsey, Frank'],
	});
	CSLTEST.Test.testBib({ //// <names> "et-al-use-last" overrides "and"
		id:"names14.10.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" delimiter-precedes-et-al="never" et-al-min="3" et-al-use-first="1" et-al-use-last="true" and="text"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, ... Dempsey, Frank'],
	});
	CSLTEST.Test.testBib({ //// <names> "et-al-use-last" overrides "delimiter-precedes-last"
		id:"names14.10.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" delimiter-precedes-last="never" delimiter-precedes-last="never" et-al-min="3" et-al-use-first="1" et-al-use-last="true"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, ... Dempsey, Frank'],
	});
	CSLTEST.Test.testBib({ //// <names> "et-al-use-last" overrides "et-al"
		id:"names14.10.3",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" delimiter-precedes-last="never" delimiter-precedes-last="never" et-al-min="3" et-al-use-first="1" et-al-use-last="true"></name><et-al font-style="italic" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]}],
		result:['Marston, Tom Cairn, ... Dempsey, Frank'],
	});
	CSLTEST.Test.testBib({ //// <et-al> node w/ formatting (w/ et-al delimiter)
		id:"names15",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="never" and="text" text-decoration="underline" name-as-sort-order="first" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="2"><name-part name="given" suffix="+" /><name-part name="family" prefix="+" suffix="-"/></name><et-al font-style="italic" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston-, Tom Cairn+</span>, <span style="text-decoration: underline;">First Middle de+ +La Last Jr.-</span> <span style="font-style: italic; text-decoration: underline;">et al.</span>','<span style="text-decoration: underline;">+La Fontaine-, Jean de+, III</span> et <span style="text-decoration: underline;">Samuel+ +Clemons-</span>'],
	});
	CSLTEST.Test.testBib({ //// <et-al> node w/ formatting (no et-al delimiter)
		id:"names15.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"><name delimiter-precedes-last="never" and="text" text-decoration="underline" name-as-sort-order="first" delimiter-precedes-et-al="after-inverted-name" et-al-min="4" et-al-use-first="1"><name-part name="given" suffix="+" /><name-part name="family" prefix="+" suffix="-"/></name><et-al font-style="italic" /></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Last",given:"First Middle","dropping-particle":'de', "non-dropping-particle":"La",suffix:"Jr."},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados", author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" },{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="text-decoration: underline;">+Marston-, Tom Cairn+</span>, <span style="font-style: italic; text-decoration: underline;">et al.</span>','<span style="text-decoration: underline;">+La Fontaine-, Jean de+, III</span> et <span style="text-decoration: underline;">Samuel+ +Clemons-</span>'],
	});
	CSLTEST.Test.testBib({ //// <label> node (after <name> node)
		id:"names16.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name/><label prefix=" (" suffix=")" font-weight="bold"></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}], editor:[{family:"Greggs", given:"Samantha"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"},{family:"Greggs", given:"Samantha"}], author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", editor:[{family:"Clemons",given:"Samuel"}]}],
		result:['Tom Cairn Marston, Tim Johnson, Frank Dempsey (<span style="font-weight: bold;">authors</span>); Samantha Greggs (<span style="font-weight: bold;">editor</span>)','Jean de La Fontaine III (<span style="font-weight: bold;">author</span>); Samuel Clemons, Samantha Greggs (<span style="font-weight: bold;">editors</span>)', 'Samuel Clemons (<span style="font-weight: bold;">editor</span>)'],
	});
	CSLTEST.Test.testBib({ //// <label> node (before <name> node)
		id:"names16.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><label suffix=": " font-weight="bold" /><name/></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise", author:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}], editor:[{family:"Greggs", given:"Samantha"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"},{family:"Greggs", given:"Samantha"}], author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", editor:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="font-weight: bold;">authors</span>: Tom Cairn Marston, Tim Johnson, Frank Dempsey; <span style="font-weight: bold;">editor</span>: Samantha Greggs','<span style="font-weight: bold;">author</span>: Jean de La Fontaine III; <span style="font-weight: bold;">editors</span>: Samuel Clemons, Samantha Greggs', '<span style="font-weight: bold;">editor</span>: Samuel Clemons'],
	});
	CSLTEST.Test.testBib({ //// <label> node (editor-translator condition)
		id:"names16.3-editor-translator",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="translator editor"><label suffix=": " font-weight="bold" /><name/></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple></term><term name="editor"><single>editor</single><multiple>editors</multiple></term><term name="translator"><single>translator</single><multiple>translators</multiple></term><term name="editortranslator"><single>creator</single><multiple>creators</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise", translator:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}], editor:[{family:"Marston",given:"Tom Cairn"},{family:"Johnson",given:"Tim"},{family:"Dempsey",given:"Frank"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"},{family:"Greggs", given:"Samantha"}], translator:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Barbados", editor:[{family:"Clemons",given:"Samuel"}],translator:[{family:"Clemons",given:"Samuel"}]}],
		result:['<span style="font-weight: bold;">creators</span>: Tom Cairn Marston, Tim Johnson, Frank Dempsey','<span style="font-weight: bold;">translator</span>: Jean de La Fontaine III; <span style="font-weight: bold;">editors</span>: Samuel Clemons, Samantha Greggs', '<span style="font-weight: bold;">creator</span>: Samuel Clemons'],
	});
	CSLTEST.Test.testBib({ //// <substitute> node
		id:"names17.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><substitute><text variable="title"/></substitute></names><group><text value=" ^^ " /><text variable="title" /></group></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term><term name="editortranslator"><single>creator/single><multiple>creators</multiple></term></term></terms></locale>',
		sources:[{id:"1",title:"Anise"},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"},{family:"Greggs", given:"Samantha"}], author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","title":"Samoa", editor:[]}],
		result:['Anise','Jean de La Fontaine III; Samuel Clemons, Samantha Greggs ^^ Barbados', 'Samoa'],
	});
	CSLTEST.Test.testBib({ //// <substitute> node
		id:"names17.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><substitute><text variable="title"/><text variable="publisher" font-weight="bold" /></substitute></names><group><text value=" ^^ " /><text variable="title" /></group></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise"},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Samuel"},{family:"Greggs", given:"Samantha"}], author:[{family:"Fontaine",given:"Jean", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","publisher":"Sangiovese", editor:[]}],
		result:['Anise','Jean de La Fontaine III; Samuel Clemons, Samantha Greggs ^^ Barbados', '<span style="font-weight: bold;">Sangiovese</span>'],
	});
	CSLTEST.Test.testBib({ //// "initialize-with" attribute
		id:"names18.1",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name initialize-with="."></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"G."},{family:"Greggs", given:"S"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},{id:"3","publisher":"Sangiovese", editor:[]}],
		result:['S. Clemons','J.-L. de La Fontaine III; G. Clemons, S. Greggs',""],
	});
	CSLTEST.Test.testBib({ //// "initialize-with" attribute "initialize"="false"
		id:"names18.2",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name initialize-with=". " initialize="false"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"G."},{family:"Greggs", given:"S"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]}],
		result:['Samuel Clemons','Jean-Luc de La Fontaine III; G. Clemons, S. Greggs'],
	});
	CSLTEST.Test.testBib({ //// "initialize-with" & "initialize-with-hyphen"
		id:"names18.3",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name initialize-with="." initialize="true" initialize-with-hyphen="false"></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="fr-FR"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"G."},{family:"Greggs", given:"S"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]}],
		result:['S. Clemons','J.L. de La Fontaine III; G. Clemons, S. Greggs'],
	});
	CSLTEST.Test.testBib({ //// "initialize" & "initialize-with-hyphen" set to default values
		id:"names18.4",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name initialize-with="" initialize="true" initialize-with-hyphen="true" and="text" ></name></names></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"G."},{family:"Greggs", given:"S"},{family:"Baker",given:"Ashley"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]}],
		result:['S Clemons','J-L de La Fontaine III; G Clemons, S Greggs, et A Baker'],
	});
	CSLTEST.Test.testCites({ //// test that layout delimiter works; b/c it is handled outside of Blob.layout. (it's in Blob.citation).
		id:"layout-delimiter",
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout delimiter=", "><text variable="title" /></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise"},
			{id:"2",title:"Butter"},
		],
		clusters:[{cites:[{source:"1"},{source:"2"}]}],
		result:["Anise, Butter"],
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names"
		id:"names19.1.1",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."},{family:"Washington",given:"Booker T."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, Barry Clemons, Sasha Clemons, Barry Clemons Jr., Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" & initialize-with not set.
		id:"names19.1.1.1",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Washington",given:"Booker T."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, Barry Clemons, Sasha Clemons, Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" & initialize-with="_".
		id:"names19.1.1.2",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="_" ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Washington",given:"Booker T."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, B_ Clemons, Sasha Clemons, Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" & initialize-with="_" & initialize="false"
		id:"names19.1.1.1",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="_" initialize="false"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Washington",given:"Booker T."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, Barry Clemons, Sasha Clemons, Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" name-as-sort-order="all"
		id:"names19.1.2",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" name-as-sort-order="all" delimiter="; "></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Washington",given:"Booker T."},{family:"Clemons", given:"Barry", suffix:"Jr."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Samuel; Clemons, Barry; Clemons, Sasha; Washington; Clemons, Barry, Jr.",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" name-as-sort-order="all" et-al
		id:"names19.1.3",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" name-as-sort-order="all" delimiter="; " et-al-min="3", et-al-use-first="3" delimiter-precedes-et-al="never"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Washington",given:"Booker T."},{family:"Clemons", given:"Barry", suffix:"Jr."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Samuel; Clemons, Barry; Clemons, Sasha et al.",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" and="text"
		id:"names19.1.4",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" and="text" ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."},{family:"Washington",given:"Booker T."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, Barry Clemons, Sasha Clemons, Barry Clemons Jr., et Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names" + initialize-with
		id:"names19.1.5",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."},{family:"Washington",given:"Booker T"}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, B. Clemons, Sasha Clemons, B. Clemons Jr., Washington",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names-with-initials" 
		id:"names19.2.1",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Washington",given:"Booker T."},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Clemons, Washington, Clemons, Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names-with-initials" + initialize-with
		id:"names19.2.2",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Washington",given:"Booker T."},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."}]}		],
		clusters:{cites:[{id:1}]},
		result:"S. Clemons, B. Clemons, Washington, S. Clemons, B. Clemons Jr.",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "all-names-with-initials" initialize="false"
		id:"names19.2.3",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." initialize="false"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Washington",given:"Booker T."},{family:"Clemons",given:"Sasha"},{family:"Clemons", given:"Barry", suffix:"Jr."}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Clemons, Washington, Clemons, Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation --> Rollback when no disambiguation possible.
		id:"names19.2.4",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="all-names-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",editor:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Sasha"}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "primary-name" 
		id:"names19.3",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="primary-name" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"}]}		],
		clusters:{cites:[{id:1}]},
		result:"Samuel Clemons, Clemons, Johnson; La Fontaine; Clemons; Gloria Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "primary-name-with-initials" 
		id:"names19.4.1",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="primary-name-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Clemons, Johnson; La Fontaine; Clemons; Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "primary-name-with-initials" + initialize-with
		id:"names19.4.2",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="primary-name-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"}]}		],
		clusters:{cites:[{id:1}]},
		result:"S. Clemons, Clemons, Johnson; La Fontaine; Clemons; G. Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation "primary-name-with-initials" initialize="false"
		id:"names19.4.3",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="primary-name-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." initialize="false"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"}]}		],
		clusters:{cites:[{id:1}]},
		result:"Clemons, Clemons, Johnson; La Fontaine; Clemons; Clemons",
	});
	CSLTEST.Test.testCite({ //// Global Name Disambiguation --> Rollback when no disambiguation possible.
		id:"names19.4.4",
		style:'<style lang="en-US"><info></info><citation givenname-disambiguation-rule="primary-name-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout delimiter="; "><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Sarah"}]}		],
		result:"Clemons, Clemons; La Fontaine; Clemons; Clemons",
	});

	CSLTEST.Test.testCites({
		id:"processesingCitations1",
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." initialize="false"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"}]}		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]}],
		result:[ "Clemons, Clemons, Johnson", "La Fontaine; Clemons" ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations2", /// disambiguate-add-names="true"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-names="true" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" et-al-min="1" et-al-use-first="1"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"},{family:"Smith",given:"Kevin"}]}		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"3"}]}],
		result:[ "Clemons, Clemons, et al.", "Clemons, Smith" ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations2.1", /// disambiguate-add-names="true" + MAKE SURE FLUSH() works to reset state
		style:'<style lang="en-US"><info></info><citation disambiguate-add-names="true" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" et-al-min="1" et-al-use-first="1"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"2",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Moore",given:"Frank Kora"}]},
			{id:"4","title":"March",editor:[{family:"Clemons",given:"Gloria"},{family:"Smith",given:"Kevin"}]}		],
		clusters:[{cites:[{source:"2"}]},{cites:[{source:"4"}]}],
		result:[ "Clemons, Clemons, et al.", "Clemons, Smith" ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations2.2", /// disambiguate-add-names="false"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-names="false" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" et-al-min="1" et-al-use-first="1"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barry"},{family:"Johnson",given:"Frank Kora"}]},{id:"2","title":"Barbados",editor:[{family:"Clemons",given:"Jean"}], author:[{family:"Fontaine",given:"Jean-Luc", "dropping-particle":"de","non-dropping-particle":"La", suffix:"III" }]},
{id:"3","title":"March",editor:[{family:"Clemons",given:"Gloria"},{family:"Smith",given:"Kevin"}]}		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"3"}]}],
		result:[ "Clemons et al.", "Clemons et al." ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations3", /// add hidden names disambiguation + multiple name variables
		style:'<style lang="en-US"><info></info><citation disambiguate-add-names="true" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" et-al-min="1" et-al-use-first="1"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Jones",given:"Barry"}],editor:[{family:"Johnson",given:"Frank"},{family:"Seymore",given:"Clive"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"Smith",given:"Barry"}],editor:[{family:"Johnson",given:"Frank"},{family:"Seymore",given:"Clive"}]},
			{id:"3","title":"March",author:[{family:"Clemons",given:"Samuel"},{family:"Jones",given:"Barry"}],editor:[{family:"Johnson",given:"Frank"},{family:"Seigland",given:"Clive"}]}   
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]}],
		result:[ "Clemons, Jones; Johnson, Seymore", "Clemons, Smith; Johnson et al.", "Clemons, Jones; Johnson, Seigland" ], /// 2nd cluster does not expand "editor" name list, b/c first disambiguation was successful.
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations4", /// disambiguate-add-givenname="true"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-givenname="true" givenname-disambiguation-rule="by-cite" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="."></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"}]},
			{id:"3","title":"March",author:[{family:"Clemons",given:"Miguel"}]}   
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},,{cites:[{source:"3"}]}],
		result:[ "Samuel Clemons", "Sandra Clemons","M. Clemons" ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations5", /// disambiguate-add-givenname="true" + givenname-disambiguation-rule="all-names-with-initials"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-givenname="true" givenname-disambiguation-rule="all-names-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"}]},
			{id:"3","title":"March",author:[{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Hank"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Allen Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley Cartwright Baker"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"5"}]},{cites:[{source:"6"}]},{cites:[{source:"7"}]},{cites:[{source:"8"}]}],
		result:[ "S. Clemons", "S. Clemons","M. Clemons","Simmons","Simmons","A.B. Mullins","A.C. Mullins","A.C.B. Mullins" ],
	});
	CSLTEST.Test.testCites({
		id:"processesingCitations6", /// disambiguate-add-givenname="true" + givenname-disambiguation-rule="primary-names"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-givenname="true" givenname-disambiguation-rule="primary-name" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"Clemons",given:"Miguel"},{family:"Oxford",given:"Buddy"}]}, /// not ambiguous, so primary name is not disambiguated
			{id:"4","title":"April",author:[{family:"Simmons",given:"Hank"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley Cartwright Baker"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"5"}]},{cites:[{source:"6"}]},{cites:[{source:"7"}]},{cites:[{source:"8"}]}],
		result:[ "Samuel Clemons, St. Claire", "Sandra Clemons, St. Claire", "Clemons, Oxford", "Hank Simmons", "Harry Simmons", "Andrew B. Mullins", "Andrew C. Mullins", "Ashley Mullins" ],
	});

	CSLTEST.Test.testCites({
		id:"processesingCitations7", /// disambiguate-add-givenname="true" + givenname-disambiguation-rule="primary-names-with-initials"
		style:'<style lang="en-US"><info></info><citation disambiguate-add-givenname="true" givenname-disambiguation-rule="primary-name-with-initials" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author editor"><name form="short" initialize-with="." ></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4",title:"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5",title:"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6",title:"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7",title:"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"5"}]},{cites:[{source:"6"}]},{cites:[{source:"7"}]},{cites:[{source:"8"}]}],
		result:[ "Clemons, St. Claire", "Clemons, St. Claire", "St. Clair, Clemons", "A. Simmons", "H. Simmons", "A.B. Mullins", "A.C. Mullins", "A. Mullins" ],
	});

	CSLTEST.Test.testCites({
		id:"processesingCitations8", /// makes sure that disambig uses the right <names> token for disambig. 
		style:'<style lang="en-US"><info></info><citation disambiguate-add-names="true" ><sort><key variable="title" sort="ascending"/></sort><layout><names variable="author"  ><name form="short" initialize-with="." et-al-min="1" et-al-use-first="1" /></names><text value=" -- " /><names variable="editor" ><name et-al-min="1" et-al-use-first="1"></name></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Sandra"}],editor:[{family:"St. Claire",given:"Samuel"},{family:"Michaels",given:"Ashley"}]},
			{id:"2",title:"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"Clemons",given:"Barbara"}],editor:[{family:"St. Claire",given:"Samuel"},{family:"Smith",given:"Marty"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]}],
		result:[ "Clemons -- Samuel St. Claire, Ashley Michaels", "Clemons -- Samuel St. Claire, Marty Smith" ]
	});

	CSLTEST.Test.testCites({ //// first, subsequent across clusters
		id:"Postion test - 1", 
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout delimiter="; "><choose><if position="first"><text value="first"/></if><else><text value="subsequent"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"4"}]}],
		result:[ "first", "first", "first", "subsequent", "subsequent", "subsequent", "first", "subsequent" ],
	});

	CSLTEST.Test.testCites({
		id:"position test -2", /// first, subsequent within clusters
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout delimiter="; "><choose><if position="subsequent"><text value="subsequent"/></if><else><text value="first"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"4"}]}],
		result:[ "first", "first", "first", "subsequent", "subsequent", "subsequent", "first", "subsequent" ],
	});

	CSLTEST.Test.testCites({
		id:"position test 3", /// first, subsequent, ibid
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout delimiter="; "><choose><if position="first"><text value="first"/></if><else-if position="ibid"><text value="ibid" /></else-if><else-if position="subsequent"><text value="subsequent"/></else-if></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		clusters:[{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"1"}]},{cites:[{source:"2"}]},{cites:[{source:"3"}]},{cites:[{source:"4"}]},{cites:[{source:"4"}]}],
		result:[ "first", "first", "first", "subsequent", "subsequent", "subsequent", "first", "ibid" ],
	});

	CSLTEST.Test.testCites({
		id:"position test 4", /// first, subsequent, ibid, ibid-with-locator
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="ascending"/></sort><layout delimiter="; "><choose><if position="first"><text value="first"/></if><else-if position="ibid-with-locator"><text value="ibid-with-locator"/></else-if><else-if position="ibid"><text value="ibid" /></else-if><else-if position="subsequent"><text value="subsequent"/></else-if></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		clusters:[
			{cites:[{source:"1"}]}, {cites:[{source:"1"}]},
			{cites:[{source:"2",locator:"24"}]},{cites:[{source:"2",locator:"24"}]},
			{cites:[{source:"3",locator:"16"}]},{cites:[{source:"3",locator:"87"}]},
			{cites:[{source:"4",locator:"50"}]},{cites:[{source:"4"}]},
			{cites:[{source:"5"}]}, {cites:[{source:"5", locator:"12"}]},
			{cites:[{source:"6"}, {source:"6"}]},
			{cites:[{source:"7"}, {source:"7"}]}, {cites:[{source:"7"}, {source:"7"}]},
		],
		result:[ "first", "ibid", "first", "ibid", "first", "ibid-with-locator", "first", "subsequent", "first", "ibid-with-locator", "first; ibid","first; ibid","ibid; ibid" ],
		//// WARNING: According to the CSL specification, the last result should be "subsequent; ibid". I think my result makes more sense, but I may change to conform with to the spec.
	});

	CSLTEST.Test.testBib({ //// <sort>"variable" = dateVariable
		id:"sort4",
		style:'<style><info></info><bibliography><sort><key variable="issued" sort="ascending"/></sort><layout><text variable="title"/></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:105,month:3,day:1}]},
			{id:"2","title":"Barbados", issued:[{year:1892,month:10,day:7}]},
			{id:"3.5","title":"Sam 2nd", issued:[{year:"612",month:1,day:"1"},{year:"612",month:8,day:"4"}]},
			{id:"3","title":"Sam 1st", issued:[{year:"612",month:1,day:"1"},{year:"612",month:1,day:"4"}]},
			{id:"4",title:"Yaor",issued:[{year:1892,month:5}]}, 
			{id:"5",title:"Constitution",issued:[{year:1783,month:12,day:31},{year:1983,month:3,day:17}]},
		],
		result:["Anise","Sam 1st","Sam 2nd","Constitution","Yaor","Barbados"],
	});
	CSLTEST.Test.testBib({ //// <sort>"variable" = dateVariable  sort="descending"
		id:"sort4.2",
		style:'<style><info></info><bibliography><sort><key variable="issued" sort="descending"/></sort><layout><text variable="title"/></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:105,month:3,day:1}]},
			{id:"2","title":"Barbados", issued:[{year:1892,month:10,day:7}]},
			{id:"3.5","title":"Sam 2nd", issued:[{year:"612",month:1,day:"1"},{year:"612",month:8,day:"4"}]},
			{id:"3","title":"Sam 1st", issued:[{year:"612",month:1,day:"1"},{year:"612",month:1,day:"4"}]},
			{id:"4",title:"Yaor",issued:[{year:1892,month:5}]}, 
			{id:"5",title:"Constitution",issued:[{year:1783,month:12,day:31},{year:1983,month:3,day:17}]},
		],
		result:["Barbados","Yaor","Constitution","Sam 2nd","Sam 1st","Anise"],
	});

	CSLTEST.Test.testBib({ //// <sort>"variable" = nameVariable
		id:"sort5",
		style:'<style xml:lang="en-US"><locale xml:lang="en-US" /><info></info><bibliography><sort><key variable="author" sort="ascending"/></sort><layout><names variable="author"><name name-as-sort-order="all" /></names></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		result:["Clemons, Samuel, St. Claire, Ashley", "Clemons, Samuel, St. Claire, Xan", "Mullins, Andrew Baker", "Mullins, Andrew Carter", "Mullins, Ashley", "Simmons, Andy", "Simmons, Harry", "St. Clair, Buddy, Clemons, Miguel"],
	});

	CSLTEST.Test.testBib({ //// <sort> with macro with text node
		id:"sort6",
		style:'<style><info></info><macro name="title"><text variable="title"/></macro><bibliography><sort><key macro="title" sort="ascending"/></sort><layout><text macro="title" /></layout></bibliography></style>',
		sources:[{id:"1",title:"Barbados"},{id:"2",title:"Zahara"},{id:"3",title:"Anise"}],
		result:["Anise","Barbados","Zahara"],
	});

	CSLTEST.Test.testBib({ //// <sort> variable=numberVariable
		id:"sort7",
		style:'<style><info></info><macro name="title"><text variable="title"/></macro><bibliography><sort><key variable="volume" sort="descending"/><key variable="page" sort="ascending" /></sort><layout><text macro="title" /></layout></bibliography></style>',
		sources:[{id:"3",title:"Anise",volume:14,page:"211"},{id:"2",title:"Zahara",volume:42,page:11},{id:"1",title:"Barbados",volume:14,page:52}],
		result:["Zahara","Barbados","Anise"],
	});

	CSLTEST.Test.testBib({ //// <sort> with macro and number nodes
		id:"sort8",
		style:'<style><info></info><macro name="title"><text variable="title"/></macro><macro name="sort"><number variable="volume" suffix=" "/><number variable="page" /></macro><bibliography><sort><key macro="sort" sort="ascending"/></sort><layout><text macro="title" /></layout></bibliography></style>',
		sources:[{id:"3",title:"Anise",volume:"14",page:"211"},{id:"2",title:"Zahara",volume:42,page:11},{id:"1",title:"Barbados",volume:14,page:52}],
		result:["Anise","Barbados","Zahara"],
	});

	CSLTEST.Test.testBib({ //// <sort> with macro and name nodes
		id:"sort9.1",
		style:'<style xml:lang="en-US"><info></info><macro name="authors"><names variable="author"><name name-as-sort-order="all" /></names></macro><bibliography><sort><key variable="author" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"von"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Clemons, Samuel, St. Claire, Ashley", "Clemons, Samuel, St. Claire, Xan", "de las Casas, Ashley","Mullins, Andrew Baker", "Mullins, Andrew Carter", "Mullins, Ashley", "Simmons, Andy", "Simmons, Harry", "St. Clair, Buddy, Clemons, Miguel","von Bernstein, Andrew Carter"],
	});
	CSLTEST.Test.testBib({ //// <sort> with macro and name nodes & demote-non-dropping-particle == "display-and-sort"
		id:"sort9.2",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name name-as-sort-order="all" /></names></macro><bibliography><sort><key variable="author" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Zed"}]},
			{id:"9.5","title":"September2",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Awk"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Bernstein, Andrew Carter Awk", "Bernstein, Andrew Carter Zed", "Casas, Ashley de las", "Clemons, Samuel, St. Claire, Ashley", "Clemons, Samuel, St. Claire, Xan", "Mullins, Andrew Baker", "Mullins, Andrew Carter", "Mullins, Ashley", "Simmons, Andy", "Simmons, Harry", "St. Clair, Buddy, Clemons, Miguel"],
	});
	CSLTEST.Test.testBib({ //// <sort> with macro and name nodes & demote-non-dropping-particle == "sort-only"
		id:"sort9.3 - demote-non-dropping-particle1",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="sort-only"><info></info><macro name="authors"><names variable="author"><name name-as-sort-order="all" /></names></macro><bibliography><sort><key variable="author" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Zed"}]},
			{id:"9.5","title":"September2",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Von Bernstein, Andrew Carter", "Zed Bernstein, Andrew Carter", "de las Casas, Ashley", "Clemons, Samuel, St. Claire, Ashley", "Clemons, Samuel, St. Claire, Xan", "Mullins, Andrew Baker", "Mullins, Andrew Carter", "Mullins, Ashley", "Simmons, Andy", "Simmons, Harry", "St. Clair, Buddy, Clemons, Miguel"],
	});

	CSLTEST.Test.testBib({ //// <sort> with macro and name nodes & no name-as-sort-order
		//// even though we are using a macro, sort still knows to use the family name for sort ordering
		//// additionally, for sorting, the non-dropping-particle is part of the FAMILY name; not the GIVEN name
		//// contrast with displaying names, where the non-dropping-particle is part of the GIVEN name (for formatting purposes).
		id:"sort9.4 - demote-non-dropping-particle2",
		style:'<style xml:lang="en-US"><info></info><macro name="authors"><names variable="author"><name /></names></macro><bibliography><sort><key macro="authors" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Zed"}]},
			{id:"9.5","title":"September2",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Andrew Baker Mullins", "Andrew Carter Mullins", "Andrew Carter Von Bernstein", "Andrew Carter Zed Bernstein", "Andy Simmons", "Ashley de las Casas", "Ashley Mullins", "Buddy St. Clair, Miguel Clemons","Harry Simmons","Samuel Clemons, Ashley St. Claire","Samuel Clemons, Xan St. Claire"],
	});

	CSLTEST.Test.testBib({ //// demote-non-dropping-particle is irrelevant when name-as-sort-order is not set on a macro
		id:"sort9.5 - demote-non-dropping-particle2",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name /></names></macro><bibliography><sort><key macro="authors" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Zed"}]},
			{id:"9.5","title":"September2",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Andrew Baker Mullins", "Andrew Carter Mullins", "Andrew Carter Von Bernstein", "Andrew Carter Zed Bernstein", "Andy Simmons", "Ashley de las Casas", "Ashley Mullins", "Buddy St. Clair, Miguel Clemons","Harry Simmons","Samuel Clemons, Ashley St. Claire","Samuel Clemons, Xan St. Claire"],
	});

	CSLTEST.Test.testBib({ //// overriding et-al attributes on sort keys - baseline
		id:"sort9.6.1 - overriding et-al attributes on sort keys",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name et-al-min="1" et-al-use-first="1" initialize-with="." name-as-sort-order="all" /></names></macro><bibliography><sort><key macro="authors" sort="ascending"/></sort><layout><text macro="authors" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Xan"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Zed"}]},
			{id:"9.5","title":"September2",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10","title":"October",author:[{family:"Casas",given:"Ashley","non-dropping-particle":"de las"}]},
		],
		result:["Bernstein, A.C. Von", "Bernstein, A.C. Zed", "Casas, A. de las", "Clemons, S.", "Clemons, S.", "Mullins, A.", "Mullins, A.B.", "Mullins, A.C.","Simmons, A.","Simmons, H.","St. Clair, B."],
	});
	CSLTEST.Test.testBib({ //// overriding et-al attributes on sort keys - names-min
		id:"sort9.6.2 - overriding et-al-min",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name et-al-min="1" et-al-use-first="1" form="short" /></names></macro><bibliography><sort><key macro="authors" sort="ascending" names-min="3"/></sort><layout><text macro="authors" /><text prefix=" " variable="title" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Ann"},{family:"Zealous",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Zach"},{family:"Arden",given:"Ashley"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"},{family:"Ariel",given:"Adam"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"},{family:"Winfrey",given:"Miguel"},{family:"August",given:"Angel"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		result:["Clemons Barbados", "Clemons Anise", "Mullins June", "Mullins July", "Mullins August", "Simmons May", "Simmons April", "St. Clair March"],
	});
	CSLTEST.Test.testBib({ //// overriding et-al attributes on sort keys - names-use-first
		id:"sort9.6.3 - overriding et-al-use-first",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name et-al-min="1" et-al-use-first="1" form="short" /></names></macro><bibliography><sort><key macro="authors" sort="ascending" names-use-first="2"/></sort><layout><text macro="authors" /><text prefix=" " variable="title" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Ann"},{family:"Zealous",given:"Ashley"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Zach"},{family:"Arden",given:"Ashley"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"},{family:"Ariel",given:"Adam"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"},{family:"Winfrey",given:"Miguel"},{family:"August",given:"Angel"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
		],
		result:["Clemons Barbados", "Clemons Anise", "Mullins June", "Mullins July", "Mullins August", "Simmons April", "Simmons May", "St. Clair March"],
	});
	CSLTEST.Test.testBib({ //// overriding et-al attributes on sort keys - names-use-first
		id:"sort9.6.4 - overriding et-al-use-last",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name et-al-min="1" et-al-use-first="1" form="short" et-al-use-last="false" /></names></macro><bibliography><sort><key macro="authors" sort="ascending" names-use-last="true"/></sort><layout><text macro="authors" /><text prefix=" " variable="title" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons"},{family:"Danforth"},{family:"Everdine"},{family:"Fanglio"},{family:"Genesee"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons"},{family:"Danforth"},{family:"Everdine"},{family:"Fanglio"}]},
			{id:"3","title":"March",author:[{family:"Clemons"},{family:"Danforth"}]},
			{id:"4","title":"April",author:[{family:"Clemons"}]},
		],
		result:["Clemons April", "Clemons March", "Clemons Barbados", "Clemons Anise",],
	});
	CSLTEST.Test.testBib({ //// macro sort by name count
		id:"sort9.6.5 - sort by count",
		style:'<style xml:lang="en-US" demote-non-dropping-particle="display-and-sort"><info></info><macro name="authors"><names variable="author"><name form="count" /></names></macro><bibliography><sort><key macro="authors" sort="descending" names-use-last="true"/></sort><layout><text variable="title" /></layout></bibliography></style>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons"},{family:"Danforth"},{family:"Everdine"},{family:"Fanglio"},{family:"Genesee"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons"},{family:"Danforth"},{family:"Everdine"},{family:"Fanglio"}]},
			{id:"3","title":"March",author:[{family:"Clemons"},{family:"Danforth"}]},
			{id:"4","title":"April",author:[{family:"Clemons"}]},
		],
		result:["Anise", "Barbados", "March", "April"],
	});

	CSLTEST.Test.testCites({
		id:"sort10.1 - citations", /// disambiguate-add-givenname="true" + givenname-disambiguation-rule="primary-names-with-initials"
		style:'<style lang="en-US"><info></info><citation><sort><key variable="author" sort="ascending"/></sort><layout delimiter="; "><text variable="title" suffix=" "/><names delimiter=" - " variable="author"><name form="short"/></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "Anise Clemons, St. Claire; May Simmons", "Anise Clemons, St. Claire; Barbados Clemons, St. Claire; June Mullins; July Mullins; April Simmons; May Simmons; March St. Clair, Clemons; September Von Bernstein" ],
	});

	CSLTEST.Test.testCites({
		id:"sort10.2.1 - citations & names", /// demote-non-dropping-particle /// sort="descending"
		style:'<style lang="en-US" demote-non-dropping-particle="sort-only" ><info></info><citation><sort><key variable="author" sort="descending"/></sort><layout delimiter="; "><text variable="title" suffix=" "/><names delimiter=" - " variable="author"><name form="short"/></names></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "May Simmons; Anise Clemons, St. Claire", "March St. Clair, Clemons; May Simmons; April Simmons; July Mullins; June Mullins; Barbados Clemons, St. Claire; Anise Clemons, St. Claire; September Von Bernstein" ],
	});

	CSLTEST.Test.testCites({
		id:"sort10.2.2 - citations & names", //// infering Name-type from data instead of style.
		style:'<style lang="en-US" ><info></info><citation><sort><key variable="author" sort="ascending"/></sort><layout delimiter="; "><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"March",author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"April",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"May",author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"June",author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"July",author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"August",author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"September",author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "Anise; May", "Anise; Barbados; June; July; April; May; March; September" ],
	});

	CSLTEST.Test.testCites({
		id:"sort10.3.1 - citations & dates",
		style:'<style lang="en-US"><info></info><citation><sort><key variable="issued" sort="ascending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(1985) Anise; (2027) Excellence", "(1985) Anise; (1989–1990) Fidget; (1989–1991) Cali; (2005) Inquisitive; (2026) Gizmo; (2027) Excellence; (2029) Denim; (2035) Barbados" ],
	});

	CSLTEST.Test.testCites({
		id:"sort10.3.2 - citations & dates", /// sort="descending"
		style:'<style lang="en-US"><info></info><citation><sort><key variable="issued" sort="descending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(2027) Excellence; (1985) Anise","(2035) Barbados; (2029) Denim; (2027) Excellence; (2026) Gizmo; (2005) Inquisitive; (1989–1991) Cali; (1989–1990) Fidget; (1985) Anise" ],
	});

	CSLTEST.Test.testCites({
		id:"sort10.4 - citation & text", /// disambiguate-add-givenname="true" + givenname-disambiguation-rule="primary-names-with-initials"
		style:'<style lang="en-US"><info></info><citation><sort><key variable="title" sort="descending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}]},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}]},
			{id:"6","title":"Fidget",issued:[{year:1998,month:11}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(2027) Excellence; (1985) Anise", "(2005) Inquisitive; (2026) Gizmo; (1998) Fidget; (2027) Excellence; (2029) Denim; (1989) Cali; (2035) Barbados; (1985) Anise" ],
	});
	CSLTEST.Test.testCites({
		id:"sort10.5 - citation & number", /// sort by number variable.
		style:'<style lang="en-US"><info></info><citation><sort><key variable="volume" sort="ascending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], volume:14},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}], volume:3},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}], volume:5},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}], volume:1},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}] }, //// no value for sort --> last - not first
			{id:"8","title":"Harness",issued:[{year:1998,month:12}], volume:4},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}], volume:"1"}, /// string still equals numeric.
		],
		clusters:[
			{cites:[{source:"6"},{source:"9"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(1989–1990) Fidget; (2005) Inquisitive", "(1989–1990) Fidget; (2005) Inquisitive; (2029) Denim; (2035) Barbados; (1989–1991) Cali; (2027) Excellence; (1985) Anise; (2026) Gizmo" ],
	});

	CSLTEST.Test.testCites({ 
		id:"sort10.6 - citations & macros",
		style:'<style lang="en-US" demote-non-dropping-particle="sort-only"><info></info><macro name="render" font-weight="bold"><names variable="author"><name form="short"/></names></macro><citation><sort><key macro="render" sort="ascending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text macro="render" /></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7, author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(1985) Clemons, St. Claire; (2027) Simmons", "(2005) Von Bernstein; (1985) Clemons, St. Claire; (2035) Clemons, St. Claire; (1989–1990) Mullins; (2026) Mullins; (2029) Simmons; (2027) Simmons; (1989–1991) St. Clair, Clemons" ],
	});

	CSLTEST.Test.testCitesAndBib({ //// SORT bibliographic entries by order of appearance.
		id:"cite & bib 1.0",
		style:'<style lang="en-US" demote-non-dropping-particle="sort-only"><info></info><macro name="render"><names variable="author"><name form="short"/></names></macro><citation><sort><key macro="render" sort="ascending"/></sort><layout delimiter="; "><date variable="issued" prefix="(" suffix=") "><date-part name="year" /></date><text macro="render" /></layout></citation><bibliography><layout><text variable="title"/></layout></bibliography></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and">et</term><term name="and others">et al.</term><term name="author"><single>author</single><multiple>authors</multiple><term name="editor"><single>editor</single><multiple>editors</multiple></term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7, author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"5"},{source:"1"}]}, {cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "(1985) Clemons, St. Claire; (2027) Simmons", "(2005) Von Bernstein; (1985) Clemons, St. Claire; (2035) Clemons, St. Claire; (1989–1990) Mullins; (2026) Mullins; (2029) Simmons; (2027) Simmons; (1989–1991) St. Clair, Clemons" ],
		bibliography:["Anise","Excellence","Inquisitive","Barbados","Fidget","Gizmo","Denim","Cali"],
	})

CSLTEST.Test.testCitesAndBib({ //// <date> year-suffix (needs to know about bibliography ordering); & formatting of year-suffix part
		//// year-suffixes are created based on ambiguities in citation context; the ambiguity of bibliographic references is irrelevant
		id:"date11.0 - year-suffix",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date><text variable="title" prefix=" "/></layout></bibliography><citation disambiguate-add-year-suffix="true" ><layout><date variable="issued" ><date-part name="year" form="long" /></date></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
//			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2",author:[{family:"Simmons",given:"Andy"}]},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7, author:[{family:"Simmons",given:"Harry"}]},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1991,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
//			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
//			{id:"8","title":"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
//			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"6"}]},{cites:[{source:"2"},{source:"3"},{source:"5"}]}
		],
		result:['1985a; 1989–1991b','1985b; 1989–1991a; 2027'],
		bibliography:["1985a Anise","1985b Barbados","1989–1991a Cali","2027 Excellence", "1989–1991b Fidget"],
	});


	CSLTEST.Test.testCitesAndBib({ ////  formatting of year-suffix part
		//// year-suffix part is properly considered part of the "year" variable, so it inherits formatting from the year-part variable.
		//// Note that suffix on a <date> element is placed after the year-suffix.
		id:"date11.1 - year-suffix",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date><text variable="title" prefix=" "/></layout></bibliography><citation disambiguate-add-year-suffix="true" ><layout><date variable="issued" font-weight="bold" suffix=" "><date-part name="year" form="long" font-style="italic"/></date><text value="." /></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"2"}]}
		],
		result:['<span style="font-style: italic; font-weight: bold;">1985a</span> .; <span style="font-style: italic; font-weight: bold;">1985b</span> .'],
		bibliography:["1985a Anise","1985b Barbados"],
	});
	CSLTEST.Test.testCitesAndBib({ //// <text variable="year-suffix"> in citation scope suppresses "year-suffix" output from <date>'s in the bibliography context
		id:"date11.2.1 - year-suffix in text node",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date></layout></bibliography><citation disambiguate-add-year-suffix="true" ><layout><date variable="issued"><date-part name="year" form="long"/></date><text variable="year-suffix" text-decoration="underline"/></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"2"}]}
		],
		result:["1985<span style=\"text-decoration: underline;\">a</span>; 1985<span style=\"text-decoration: underline;\">b</span>"],
		bibliography:["1985","1985"],
	});
	CSLTEST.Test.testCitesAndBib({ //// <text variable="year-suffix"> in bibliography scope suppresses "year-suffix" output from <date>'s in the citation context
		id:"date11.2.2 - year-suffix in text node",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date><text variable="year-suffix" prefix="-" text-case="uppercase" /><text variable="title" prefix=" "/></layout></bibliography><citation disambiguate-add-year-suffix="true" ><layout><date variable="issued"><date-part name="year" form="long"/></date></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"2"}]}
		],
		result:["1985; 1985"],
		bibliography:["1985-A Anise","1985-B Barbados"],
	});
	CSLTEST.Test.testCitesAndBib({ //// <text variable="year-suffix"> suppresses year-suffix output from date elements
		id:"date11.3 - year-suffix in text node",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date><text variable="year-suffix" /><text variable="title" prefix=" "/></layout></bibliography><citation disambiguate-add-year-suffix="true" ><layout><date variable="issued"><date-part name="year" form="long"/></date></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}],author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"2"}]}
		],
		result:["1985; 1985"],
		bibliography:["1985a Anise","1985b Barbados"],
	});

	CSLTEST.Test.testCitesAndBib({ //// add-year-suffix combined with name dismabiguation
		id:"date11.4 - year-suffix",
		style:'<style lang="en-US"><info></info><bibliography><sort><key variable="title" sort="ascending"/></sort><layout><date variable="issued" ><date-part name="year" form="long" /><date-part name="month" form="short"  /><date-part name="day" form="ordinal" /> </date><text variable="title" prefix=" "/></layout></bibliography><citation disambiguate-add-givenname="true"  disambiguate-add-names="true" disambiguate-add-year-suffix="true" ><layout><date variable="issued" suffix=" "><date-part name="year" form="long" /></date><names variable="author" ><name form="short" et-al-min="1" et-al-use-first="1"/></names></layout></citation></style>',
		locale:'<locale xml:lang="fr-FR"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2","title":"Barbados",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"4","title":"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5","title":"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"},{family:"Peterson",given:"Ashley"}]},
			{id:"6","title":"Farbados",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8","title":"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
		],
		clusters:[
			{cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6"},{source:"8"},{source:"7"}]}
		],
		result:['1985 Samuel Clemons, St. Claire; 1985a Sandra Clemons, St. Claire; 1989–1991 St. Clair; 1985 Clemons; 1985 Clemons, Peterson; 1985b Sandra Clemons, St. Claire; 2026b Mullins; 2026a Mullins'],
		bibliography:["1985 Anise","1985a Barbados","1989–1991 Cali","1985 Denim","1985 Escena","1985b Farbados","2026a Gizmo","2026b Hizmo"],
	});

	CSLTEST.Test.testBib({ //// locator in bibliography context is not displayed.
		id:"locator1",
		style:'<style><info></info><bibliography><layout><text variable="title"/><text variable="locator" prefix=" "/></layout></bibliography></style>',
		locale:"<locale xml:lang='en-US'></locale>",
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], locator:"24"},
		],
		result:["Anise"],
	});

	CSLTEST.Test.testCites({
		id:"locator2", 
		style:'<style><info></info><citation><layout><text variable="title"/><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, {cites:[{source:"1", locator:17},{source:"2",locator:42},{source:"3",locator:"174"},{source:"4",locator:"n. 17"},{source:"5",locator:["24",18]},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "Excellence 12; Anise p. 30","Anise 17; Barbados 42; Cali 174; Denim n. 17; Excellence 24; Fidget; Gizmo; Inquisitive" ],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-number1", 
		style:'<style><info></info><bibliography><sort></sort><layout><text variable="citation-number"/></layout></bibliography><citation><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, {note:"2", cites:[{source:"1", locator:17},{source:"2",locator:42},{source:"3",locator:"174"},{source:"4",locator:"n. 17"},{source:"5",locator:["24",18]},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "1-4 12; 2-4 p. 30","2-4 17; 3-2 42; 4-2 174; 5-2 n. 17; 1-4 24; 6-2; 7-2; 8-2" ],
		bibliography:["1","2","3","4","5","6","7","8"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-number2", 
		style:'<style><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text variable="title" prefix=" "/></layout></bibliography><citation><sort></sort><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Excellence",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Zansuou",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Sinapse",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, {note:"2", cites:[{source:"1", locator:17},{source:"2",locator:42},{source:"3",locator:"174"},{source:"4",locator:"n. 17"},{source:"5",locator:["24",18]},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "9-4 12; 4-4 p. 30","4-4 17; 1-2 42; 2-2 174; 3-2 n. 17; 9-4 24; 5-2; 6-2; 7-2" ],
		bibliography:["1 Barbados","2 Cali","3 Denim","4 Excellence","5 Fidget","6 Gizmo","7 Inquisitive","8 Sinapse","9 Zansuou"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-number3", 
		style:'<style><info></info><bibliography><sort><key variable="title" sort="descending" /></sort><layout><text variable="citation-number"/><text variable="title" prefix=" "/></layout></bibliography><citation><sort></sort><layout delimiter=", "><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]}, 
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}]},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, {note:"2", cites:[{source:"1", locator:17},{source:"2",locator:42},{source:"3",locator:"174"},{source:"4",locator:"n. 17"},{source:"5",locator:["24",18]},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "5-4 12, 9-4 p. 30","9-4 17, 8-2 42, 7-2 174, 6-2 n. 17, 5-4 24, 4-2, 3-2, 1-2" ],
		bibliography:["1 Inquisitive","2 Harness","3 Gizmo","4 Fidget","5 Excellence","6 Denim","7 Cali","8 Barbados","9 Anise"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - citation number", 
		style:'<style><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="citation-number" ><layout delimiter=", "><text variable="citation-number"/><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, //// ascending ranges are collapsed.
			{note:"2", cites:[{source:"3"},{source:"2"},{source:"1"}]}, //// descending ranges are not collapsed
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]}, //// a range must be at least 3 consecutive numbers
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"}]}, //// locators break range sequence.
		],
		result:[ "1-3","3, 2, 1","1, 2, 4, 5", "1 at 17, 2-5, 6 at n. 24, 7-9" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Excellence","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - citation number", 
		style:'<style><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="citation-number" ><layout delimiter=", "><text variable="citation-number"/><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, //// ascending ranges are collapsed.
			{note:"2", cites:[{source:"3"},{source:"2"},{source:"1"}]}, //// descending ranges are not collapsed
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"5"}]}, //// a range must be at least 3 consecutive numbers
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"}]}, //// locators break range sequence.
		],
		result:[ "1-3","3, 2, 1","1-3, 5", "1 at 17, 2-5, 6 at n. 24, 7-9" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Excellence","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive"],
	});


	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - year", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year"><layout delimiter=", "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"},{family:"Peterson",given:"Ashley"}]},
			{id:"6",title:"Farbados",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7, author:[{family:"Simmons",given:"Harry"}]},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, 
			{note:"2", cites:[{source:"3"},{source:"2"},{source:"1"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"}]},
		],
		result:[ "Clemons(1985), (1986), (1985)","Clemons(1985), (1986), (1985)", "Clemons(1985), (1986), St. Clair(1989–1991), Simmons(2027)","Clemons(1985) at 17, (1986), (1985), St. Clair(1989–1991), Simmons(2027), Mullins(1989–1990) at n. 24, (2026), (1998), Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Excellence","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - year & after-collapse-delimiter", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year" after-collapse-delimiter=" / "><layout delimiter=", "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"},{family:"Peterson",given:"Ashley"}]},
			{id:"6",title:"Farbados",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7, author:[{family:"Simmons",given:"Harry"}]},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, 
			{note:"2", cites:[{source:"3"},{source:"2"},{source:"1"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"}]},
		],
		result:[ "Clemons(1985), (1986), (1985)","Clemons(1985), (1986), (1985)", "Clemons(1985), (1986) / St. Clair(1989–1991), Simmons(2027)","Clemons(1985) at 17, (1986), (1985) / St. Clair(1989–1991), Simmons(2027), Mullins(1989–1990) at n. 24, (2026), (1998) / Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Excellence","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive"],
	});

	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - year-suffix", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year-suffix" disambiguate-add-year-suffix="true"><layout delimiter=", "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"5",title:"Escena",issued:[{year:1989,month:11},{year:1991,month:4}], author:[{family:"St. Clair",given:"Andy"},{family:"Peterson",given:"Ashley"}]},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10",title:"Janice",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"}]},
		],
		result:[ "Clemons(1985a, b), (1986)","Clemons(1985b), St. Clair(1989–1991a, b)", "Clemons(1985a), (1986), St. Clair(1989–1991a, b)","Clemons(1985a) at 17, (1985b, c), (1986), St. Clair(1989–1991a, b), Mullins(1989–1990) at n. 24, (2026), (1998), Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Escena","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive","10 Janice"],
	});
	CSLTEST.Test.testCitesAndBib({ //// revert back to cite-collapse="year" when disambiguate-add-year-suffix != "true"
		id:"citation-collapse - year-suffix", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year-suffix" disambiguate-add-year-suffix="false"><layout delimiter=", "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1989,month:11},{year:1991,month:3}],author:[{family:"St. Clair",given:"Buddy"},{family:"Clemons",given:"Miguel"}]},
			{id:"5",title:"Escena",issued:[{year:1989,month:11},{year:1991,month:4}], author:[{family:"St. Clair",given:"Andy"},{family:"Peterson",given:"Ashley"}]},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}],author:[{family:"Mullins",given:"Andrew Baker"}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10",title:"Janice",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"}]},
		],
		result:[ "Clemons(1985), (1985), (1986)","Clemons(1985), St. Clair(1989–1991), (1989–1991)", "Clemons(1985), (1986), St. Clair(1989–1991), (1989–1991)","Clemons(1985) at 17, (1985), (1985), (1986), St. Clair(1989–1991), (1989–1991), Mullins(1989–1990) at n. 24, (2026), (1998), Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Escena","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive","10 Janice"],
	});
	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - year-suffix-range", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year-suffix-range" disambiguate-add-year-suffix="true"><layout delimiter=", "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"7",title:"Gizmo",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10",title:"Janice",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"}]},
		],
		result:[ "Clemons(1985a–c), (1985d) at p. 12, (1985e, f), (1986)","Clemons(1985b–d)", "Clemons(1985a, c, d), (1986)","Clemons(1985a) at 17, (1985b–d), (1985e) at n. 24, (1985f, g), (1986), Mullins(1998), Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Escena","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive","10 Janice"],
	});
	CSLTEST.Test.testCitesAndBib({
		id:"citation-collapse - year-suffix-range 2", 
		style:'<style xml:lang="en-US"><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number"/><text prefix=" " variable="title" /></layout></bibliography><citation collapse="year-suffix-range" disambiguate-add-year-suffix="true" year-suffix-delimiter=", " after-collapse-delimiter=" / " ><layout delimiter="; "><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date><text variable="locator" prefix=" at "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Sandra"},{family:"St. Claire",given:"Samuel"}]},
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"7",title:"Gizmo",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"8",title:"Hizmo",issued:[{year:2026,month:5}],author:[{family:"Mullins",given:"Andrew Carter"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}],author:[{family:"Mullins",given:"Ashley"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Bernstein",given:"Andrew Carter","non-dropping-particle":"Von"}]},
			{id:"10",title:"Janice",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Sandra"}]},
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"}]},
		],
		result:[ "Clemons(1985a–c); (1985d) at p. 12; (1985e, f); (1986)","Clemons(1985b–d)", "Clemons(1985a, c, d); (1986)","Clemons(1985a) at 17; (1985b–d); (1985e) at n. 24; (1985f, g); (1986) / Mullins(1998); Von Bernstein(2005)" ],
		bibliography:["1 Anise","2 Barbados","3 Cali","4 Denim","5 Escena","6 Fidget","7 Gizmo","8 Harness","9 Inquisitive","10 Janice"],
	});
	CSLTEST.Test.testCitesAndBib({ //// tests that Processor does not crash when citation collapse is set, but no name variables exist for cite.
		id:"citation-collapse - year 2", 
		style:'<style><info></info><bibliography><layout><text variable="title"/></layout></bibliography><citation collapse="year" after-collapse-delimiter=" / "><layout><choose><if position="first"><names variable="author"/></if><else><text variable="title"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
			{id:"2",title:"Baz",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"}]},			
			{cites:[{source:"2"},{source:"1"}]}
		],
		result:[ "Samuel Clemons","Samuel Clemons; Anise"],
		bibliography:["Anise","Baz"],
	});
	CSLTEST.Test.testCitesAndBib({ //// tests that Processor does not crash 
		id:"citation-collapse - year-suffix 2", 
		style:'<style><info></info><bibliography><layout><text variable="title"/></layout></bibliography><citation collapse="year-suffix" after-collapse-delimiter=" / " disambiguate-add-year-suffix="true" ><layout><choose><if position="first"><names variable="author"/></if><else><text variable="title"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
			{id:"2",title:"Baz",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"}]},			
			{cites:[{source:"2"},{source:"1"}]}
		],
		result:[ "Samuel Clemons","Samuel Clemons; Anise"],
		bibliography:["Anise","Baz"],
	});
	CSLTEST.Test.testCitesAndBib({ //// tests that Processor does not crash 
		id:"citation-collapse - year-suffix-range 2", 
		style:'<style><info></info><bibliography><layout><text variable="title"/></layout></bibliography><citation collapse="year-suffix-range" after-collapse-delimiter=" / " disambiguate-add-year-suffix="true" ><layout><choose><if position="first"><names variable="author"/></if><else><text variable="title"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
			{id:"2",title:"Baz",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"}]},
		],
		clusters:[
			{cites:[{source:"1"}]},			
			{cites:[{source:"2"},{source:"1"}]}
		],
		result:[ "Samuel Clemons","Samuel Clemons; Anise"],
		bibliography:["Anise","Baz"],
	});


	CSLTEST.Test.testCitesAndBib({
		id:"reference-grouping1 && citation-collapsing cites in mixed form 1", 
		style:'<style xml:lang="en-US" ><info></info><bibliography subsequent-author-substitute="--" ><layout><names variable="author"><name et-al-min="2" et-al-use-first="2" delimiter-precedes-et-al="always" initialize-with="." /></names></layout></bibliography><citation collapse="year-suffix" disambiguate-add-year-suffix="true" year-suffix-delimiter=", " after-collapse-delimiter=" / "><layout delimiter="; "><choose><if position="first"><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date></if><else><text variable="title"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and others">et al.</term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Sandy"}]}, //// same name output as source 1, so it gets collapsed
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Arthur"}]}, //// different name output, it stays uncollapsed.
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, ///// collapsed, even though it follows a collapsed reference
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Blackburn",given:"Samuel"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Ingrid",given:"Jake"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"},{family:"Marshall",given:"Kevin"}]},
			{id:"10",title:"Janice",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"}]},//// not reference grouped, b/c it's missing the "et-al" in the rendered name.
			{id:"11",title:"Klein",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, /// not collapsed, because it does not immediately follow other A. Clemons references.
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"},{source:"11"}]},
		],
		result:[ "Clemons et al.(1985a, b); (1986); Clemons(1985a); (1985b); (1985c) / Mullins et al.(2026)","Cali; Denim; Escena", "Anise; Barbados; Denim; Escena","Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo; Mullins et al.(1998); (2005a, b) / Clemons(1985d)" ],
		bibliography:["S. Clemons, S. St. Claire", "--" ,"S. Clemons, A. St. Claire","A. Clemons","--","--","A. Mullins, S. Clemons, et al.","--","--","A. Mullins, S. Clemons", "A. Clemons"],
	});
	CSLTEST.Test.testCitesAndBib({
		id:"reference-grouping2 && citation-collapsing cites in mixed form 2", 
		style:'<style xml:lang="en-US" ><info></info><bibliography subsequent-author-substitute="--" subsequent-author-substitute-rule="complete-each" ><layout><names variable="author"><name et-al-min="2" et-al-use-first="2" delimiter-precedes-et-al="always" initialize-with="." /></names></layout></bibliography><citation collapse="year" disambiguate-add-year-suffix="true" year-suffix-delimiter=", " after-collapse-delimiter=" / "><layout><choose><if position="first"><names variable="author" ><name form="short" et-al-use-first="1" et-al-min="1"/></names><date variable="issued" prefix="(" suffix=")"><date-part name="year" /></date></if><else><text variable="title"/></else></choose></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and others">et al.</term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Sandy"}]}, //// same name output as source 1, so it gets collapsed
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Arthur"}]}, //// different name output, it stays uncollapsed.
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, ///// collapsed, even though it follows a collapsed reference
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Blackburn",given:"Samuel"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Ingrid",given:"Jake"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"},{family:"Marshall",given:"Kevin"}]},
			{id:"10",title:"Janice",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"}]}, //// not reference grouped, b/c it's missing the "et-al" in the rendered name.
			{id:"11",title:"Klein",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, /// not collapsed, because it does not immediately follow other A. Clemons references.
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"},{source:"11"}]},
		],
		result:[ "Clemons et al.(1985a); (1986); (1985b) / Clemons(1985a); (1985b); (1985c) / Mullins et al.(2026)","Cali; Denim; Escena", "Anise; Barbados; Denim; Escena","Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo; Mullins et al.(1998); (2005a); (2005b) / Clemons(1985d)" ],
		bibliography:["S. Clemons, S. St. Claire", "--, --" ,"S. Clemons, A. St. Claire","A. Clemons","--","--","A. Mullins, S. Clemons, et al.","--, --, et al.","--, --, et al.","A. Mullins, S. Clemons","A. Clemons"],
	});
	CSLTEST.Test.testCitesAndBib({
		id:"reference-grouping3", 
		style:'<style xml:lang="en-US" ><info></info><bibliography subsequent-author-substitute="--" subsequent-author-substitute-rule="partial-each" ><layout><names variable="author"><name et-al-min="2" et-al-use-first="2" delimiter-precedes-et-al="always" initialize-with="." /></names></layout></bibliography><citation collapse="year-suffix-range" disambiguate-add-year-suffix="true" year-suffix-delimiter=", " after-collapse-delimiter=" / "><layout><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and others">et al.</term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Sandy"}]}, //// same name output as source 1, so it gets collapsed
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Arthur"}]}, //// different name output, it stays uncollapsed.
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, ///// collapsed, even though it follows a collapsed reference
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Blackburn",given:"Samuel"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Ingrid",given:"Jake"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"},{family:"Marshall",given:"Kevin"}]},
			{id:"10",title:"Janice",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"}]}, //// partial reference grouping; missing the "et-al" in the rendered name still allows partial reference grouping
			{id:"11",title:"Klein",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, /// not collapsed, because it does not immediately follow other A. Clemons references.
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"},{source:"11"}]},
		],
		result:[ "Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo","Cali; Denim; Escena", "Anise; Barbados; Denim; Escena","Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo; Harness; Inquisitive; Janice; Klein" ],
		bibliography:["S. Clemons, S. St. Claire", "--, --" ,"--, A. St. Claire","A. Clemons","--","--","A. Mullins, S. Clemons, et al.","--, --, et al.","--, --, et al.","--, --","A. Clemons"],
	});
	CSLTEST.Test.testCitesAndBib({
		id:"reference-grouping4", 
		style:'<style xml:lang="en-US" ><info></info><bibliography subsequent-author-substitute="--" subsequent-author-substitute-rule="partial-first" ><layout><names variable="author"><name et-al-min="2" et-al-use-first="2" delimiter-precedes-et-al="always" initialize-with="." /></names></layout></bibliography><citation collapse="year-suffix-range" disambiguate-add-year-suffix="true" year-suffix-delimiter=", " after-collapse-delimiter=" / "><layout><text variable="title"/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"><terms><term name="and others">et al.</term></terms></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Samuel"}]},
			{id:"2",title:"Barbados",issued:[{year:1986,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Sandy"}]}, //// same name output as source 1, so it gets collapsed
			{id:"3",title:"Cali",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Samuel"},{family:"St. Claire",given:"Arthur"}]}, //// different name output, it stays uncollapsed.
			{id:"4",title:"Denim",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"5",title:"Escena",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]},
			{id:"6",title:"Fidget",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, ///// collapsed, even though it follows a collapsed reference
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Blackburn",given:"Samuel"}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samantha"},{family:"Ingrid",given:"Jake"}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"},{family:"Marshall",given:"Kevin"}]},
			{id:"10",title:"Janice",issued:[{year:2005,month:7}], author:[{family:"Mullins",given:"Andrew"},{family:"Clemons",given:"Samuel"}]}, 
			{id:"11",title:"Klein",issued:[{year:1985,month:2}], author:[{family:"Clemons",given:"Andy"}]}, /// not collapsed, because it does not immediately follow other A. Clemons references.
		],
		clusters:[
			{note:"1", cites:[{source:"1"},{source:"2"},{source:"3"},{source:"4"},{source:"5", locator:"p. 12"},{source:"6"},{source:"7"}]}, 
			{note:"2", cites:[{source:"3"},{source:"4"},{source:"5"}]}, 
			{note:"3", cites:[{source:"1"},{source:"2"},{source:"4"},{source:"5"}]},
			{note:"4", cites:[{source:"1", locator:17},{source:"2"},{source:"3"},{source:"4"},{source:"5"},{source:"6",locator:["n. 24"]},{source:"7"}, {source:"8"},{source:"9"},{source:"10"},{source:"11"}]},
		],
		result:[ "Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo","Cali; Denim; Escena", "Anise; Barbados; Denim; Escena","Anise; Barbados; Cali; Denim; Escena; Fidget; Gizmo; Harness; Inquisitive; Janice; Klein" ],
		bibliography:["S. Clemons, S. St. Claire", "--, S. St. Claire" ,"--, A. St. Claire","A. Clemons","--","--","A. Mullins, S. Clemons, et al.","--, S. Clemons, et al.","--, S. Clemons, et al.","--, S. Clemons","A. Clemons"],
	});

	CSLTEST.Test.testCites({ //// citation prefixes & suffixes are not part of CSL specification. (I think there should at least be a note).
		//// currently, this test intends to conform with the citeproc-js API.
		id:"prefix & suffix", 
		style:'<style><info></info><citation><layout><text variable="title"/><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],prefix:"see"},
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],prefix:'p. 15'},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{cites:[{source:"5",prefix:"see"},{source:"1", suffix:"(concerning hope)"}]}, {cites:[{source:"1", locator:17, prefix:"confer", suffix:"did not use T-tests"}, {source:"7", locator:32, prefix:"see also", suffix:"did use T-tests"}]},
		],
		result:[ "see Excellence; Anise (concerning hope)","confer Anise 17 did not use T-tests; see also Gizmo 32 did use T-tests" ],
	});

	CSLTEST.Test.testCites({ //// citation prefixes & suffixes are not part of CSL specification. (I think there should at least be a note).
		//// currently, this test intends to conform with the citeproc-js API.
		id:"prefix & suffix 2", 
		style:'<style><info></info><citation><layout><choose><if position="subsequent"><text variable="first-reference-note-number"/></if><else><text variable="title"/></else></choose><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],prefix:"see"},
			{id:"2","title":"Barbados",issued:[{year:2035,month:9}],prefix:'p. 15'},
			{id:"3","title":"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4","title":"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5","title":"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6","title":"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7","title":"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8","title":"Harness",issued:[{year:1998,month:12}]},
			{id:"9","title":"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",prefix:"see"},{source:"1", suffix:"(concerning hope)"}]}, {cites:[{source:"1", locator:17, prefix:"confer", suffix:"did not use T-tests"}, {source:"7", locator:32, prefix:"see also", suffix:"did use T-tests"}]},
		],
		result:[ "see Excellence; Anise (concerning hope)","confer 4 17 did not use T-tests; see also Gizmo 32 did use T-tests" ],
	});

	CSLTEST.Test.testCitesAndBib({ //// sort by citation-number in cites; when bibliography is sorted independently of citation order.
		id:"citation-number4 - sort by citation-number", 
		style:'<style><info></info><bibliography><sort><key variable="title" /></sort><layout><text variable="citation-number" suffix=" "/><date variable="issued" ><date-part name="year" form="long" suffix=" "/></date><text variable="title" /></layout></bibliography><citation><sort><key variable="citation-number" /></sort><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]}, 
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}]},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, 
			{note:"2", cites:[{source:"1", locator:"p. 1"},{source:"2",locator:"pg. 2"},{source:"3",locator:"pg. 3"},{source:"4",locator:"p. 4"},{source:"5",locator:"pg. 5"},{source:"6",locator:"p. 6"},{source:"7",locator:"p. 7"}, {source:"9",locator:"p. 9"}, {source:"8",locator:"p. 8"}]},
		],
		result:[ "1-4 p. 30; 5-4 12","1-4 p. 1; 2-2 pg. 2; 3-2 pg. 3; 4-2 p. 4; 5-4 pg. 5; 6-2 p. 6; 7-2 p. 7; 8-2 p. 8; 9-2 p. 9" ],
		bibliography:["1 1985 Anise","2 2035 Barbados","3 1989–1991 Cali","4 2029 Denim","5 2027 Excellence","6 1989–1990 Fidget","7 2026 Gizmo","8 1998 Harness","9 2005 Inquisitive"],
	});
	CSLTEST.Test.testCitesAndBib({ //// sort by citation-number in cites; when bibliography sort is also dependant on cite order
		id:"citation-number5 - sort by citation-number", 
		style:'<style><info></info><bibliography><layout><text variable="citation-number" suffix=" "/><date variable="issued" ><date-part name="year" form="long" suffix=" "/></date><text variable="title" /></layout></bibliography><citation><sort><key variable="citation-number" /></sort><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]}, 
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}]},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"1", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, 
			{note:"2", cites:[{source:"7",locator:"7"},{source:"8", locator:"p. 8"},{source:"5",locator:"p. 5"}]}, 
			{note:"3", cites:[{source:"1", locator:"p. 1"},{source:"2",locator:"pg. 2"},{source:"3",locator:"pg. 3"},{source:"4",locator:"n. 4"},{source:"5",locator:"pg. 5"},{source:"6",locator:"p. 6"},{source:"7",locator:"p. 7"}, {source:"9",locator:"p. 9"},{source:"8",locator:"p. 8"}]},
		],
		result:[ "1-1 12; 2-1 p. 30", "1-1 p. 5; 3-2 7; 4-2 p. 8" , "1-1 pg. 5; 2-1 p. 1; 3-2 p. 7; 4-2 p. 8; 5-3 pg. 2; 6-3 pg. 3; 7-3 n. 4; 8-3 p. 6; 9-3 p. 9"],
		bibliography:["1 2027 Excellence","2 1985 Anise","3 2026 Gizmo","4 1998 Harness","5 2035 Barbados","6 1989–1991 Cali","7 2029 Denim","8 1989–1990 Fidget","9 2005 Inquisitive"],
	});
	CSLTEST.Test.testCitesAndBib({ //// sort by citation-number is not allowed in bibliography sorting.
		id:"citation-number6 - sort by citation-number", 
		style:'<style><info></info><bibliography><sort><key variable="citation-number" /></sort><layout><text variable="citation-number" suffix=" "/><date variable="issued" ><date-part name="year" form="long" suffix=" "/></date><text variable="title" /></layout></bibliography><citation><sort><key variable="citation-number" /></sort><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]}, 
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}]},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"1", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, 
			{note:"2", cites:[{source:"7",locator:"7"},{source:"8", locator:"p. 8"},{source:"5",locator:"p. 5"}]}, 
			{note:"3", cites:[{source:"1", locator:"p. 1"},{source:"2",locator:"pg. 2"},{source:"3",locator:"pg. 3"},{source:"4",locator:"n. 4"},{source:"5",locator:"pg. 5"},{source:"6",locator:"p. 6"},{source:"7",locator:"p. 7"}, {source:"9",locator:"p. 9"},{source:"8",locator:"p. 8"}]},
		],
		result:[ "1-1 12; 2-1 p. 30", "1-1 p. 5; 3-2 7; 4-2 p. 8" , "1-1 pg. 5; 2-1 p. 1; 3-2 p. 7; 4-2 p. 8; 5-3 pg. 2; 6-3 pg. 3; 7-3 n. 4; 8-3 p. 6; 9-3 p. 9"],
		bibliography:["1 2027 Excellence","2 1985 Anise","3 2026 Gizmo","4 1998 Harness","5 2035 Barbados","6 1989–1991 Cali","7 2029 Denim","8 1989–1990 Fidget","9 2005 Inquisitive"],
	});
	CSLTEST.Test.testCitesAndBib({ //// sort by citation-number is not allowed in bibliography sorting.
		id:"citation-number6 - sort by citation-number", 
		style:'<style><info></info><bibliography><sort><key variable="citation-number" /><key variable="title" /></sort><layout><text variable="citation-number" suffix=" "/><date variable="issued" ><date-part name="year" form="long" suffix=" "/></date><text variable="title" /></layout></bibliography><citation><sort><key variable="citation-number" /></sort><layout><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}]}, 
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}]},
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"1", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, 
			{note:"2", cites:[{source:"7",locator:"7"},{source:"8", locator:"p. 8"},{source:"5",locator:"p. 5"}]}, 
			{note:"3", cites:[{source:"1", locator:"p. 1"},{source:"2",locator:"pg. 2"},{source:"3",locator:"pg. 3"},{source:"4",locator:"n. 4"},{source:"5",locator:"pg. 5"},{source:"6",locator:"p. 6"},{source:"7",locator:"p. 7"}, {source:"9",locator:"p. 9"},{source:"8",locator:"p. 8"}]},
		],
		result:[ "1-1 p. 30; 5-1 12", "5-1 p. 5; 7-2 7; 8-2 p. 8" , "1-1 p. 1; 2-3 pg. 2; 3-3 pg. 3; 4-3 n. 4; 5-1 pg. 5; 6-3 p. 6; 7-2 p. 7; 8-2 p. 8; 9-3 p. 9"],
		bibliography:["1 1985 Anise","2 2035 Barbados","3 1989–1991 Cali","4 2029 Denim","5 2027 Excellence","6 1989–1990 Fidget","7 2026 Gizmo","8 1998 Harness","9 2005 Inquisitive"],
	});


	CSLTEST.Test.testCitesAndBib({ //// 
		id:"layout attributes", 
		style:'<style><info></info><bibliography><layout prefix="(" suffix=")" delimiter="$" font-weight="bold"><text variable="citation-number"/></layout></bibliography><citation><sort><key variable="citation-number" /></sort><layout prefix="(" suffix=")" delimiter="$" text-decoration="underline"><text variable="citation-number"/><text prefix="-" variable="first-reference-note-number" /><text variable="locator" prefix=" "/></layout></citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			{id:"1",title:"Anise",issued:[{year:1985,month:2}],locator:12}, /// this locator is ignored
			{id:"2",title:"Barbados",issued:[{year:2035,month:9}],locator:'p. 15'}, /// this locator is ignored
			{id:"3",title:"Cali",issued:[{year:1989,month:11},{year:1991,month:3}]},
			{id:"4",title:"Denim",issued:[{year:2029,month:7}], volume:"2"},
			{id:"5",title:"Excellence",issued:[{year:2027,month:6}], volume:7},
			{id:"6",title:"Fidget",issued:[{year:1989,month:11},{year:1990,month:5}]},
			{id:"7",title:"Gizmo",issued:[{year:2026,month:5}]},
			{id:"8",title:"Harness",issued:[{year:1998,month:12}]},
			{id:"9",title:"Inquisitive",issued:[{year:2005,month:7}]},
		],
		clusters:[
			{note:"4", cites:[{source:"5",locator:"12"},{source:"1", locator:"p. 30"}]}, {note:"2", cites:[{source:"1", locator:17},{source:"2",locator:42},{source:"3",locator:"174"},{source:"4",locator:"n. 17"},{source:"5",locator:["24",18]},{source:"6"},{source:"7"}, {source:"9"}]},
		],
		result:[ "<span style=\"text-decoration: underline;\">(1-4 12)</span>$<span style=\"text-decoration: underline;\">(2-4 p. 30)</span>","<span style=\"text-decoration: underline;\">(1-4 24)</span>$<span style=\"text-decoration: underline;\">(2-4 17)</span>$<span style=\"text-decoration: underline;\">(3-2 42)</span>$<span style=\"text-decoration: underline;\">(4-2 174)</span>$<span style=\"text-decoration: underline;\">(5-2 n. 17)</span>$<span style=\"text-decoration: underline;\">(6-2)</span>$<span style=\"text-decoration: underline;\">(7-2)</span>$<span style=\"text-decoration: underline;\">(8-2)</span>" ],
		bibliography:[
			"<span style=\"font-weight: bold;\">(1)</span>",
			"<span style=\"font-weight: bold;\">(2)</span>",
			"<span style=\"font-weight: bold;\">(3)</span>",
			"<span style=\"font-weight: bold;\">(4)</span>",
			"<span style=\"font-weight: bold;\">(5)</span>",
			"<span style=\"font-weight: bold;\">(6)</span>",
			"<span style=\"font-weight: bold;\">(7)</span>",
			"<span style=\"font-weight: bold;\">(8)</span>"
		]
	});

/**/


//// TODO: citation-label
//// TODO: date seasons
//// TODO: sorting based on contextual or sourceInfo variables.
//// TODO: quotes and punctuation in quotes
//// TODO: LAYOUT prefix & suffix




//////// Official CSL Test Suite /////////
	CSLTEST.Test.testCites({ /// CSL spec does not allow prefixes, decorations, or suffixes on macros
		id:"affix_InterveningEmpty.txt", 
		style:'<style xmlns="http://purl.org/net/xbiblio/csl"      class="note"      version="1.0">  <info>    <id />    <title />    <updated>2009-08-10T04:49:00+09:00</updated>  </info>  <macro name="author">    <names variable="author">      <name/>    </names>  </macro>  <macro name="title">    <text variable="title"/>  </macro>  <macro name="journal">    <text variable="container-title"/>  </macro> <macro name="date">    <date variable="issued">      <date-part name="year"/>   </date>  </macro>  <citation>    <layout suffix=".">      <text macro="author"/>      <text macro="title" prefix=". " />      <text macro="journal"/>      <text macro="date" prefix=". "/>    </layout>  </citation></style>',
		locale:'<locale xml:lang="en-US"></locale>',
		sources:[
			 {
					"author": [
						{
						    "family": "Doe", 
						    "given": "John"
						}
					], 
					"id": "ITEM-1", 
					"issued": {
						"date-parts": [
						    [
						        "1965", 
						        "6", 
						        "1"
						    ]
						]
					}, 
					"issued":[{
							year:"1965", 
						    month:"6", 
						    day:"1"
					}], 
					"title": "His Anonymous Life", 
					"type": "book"
				}
		],
		clusters:[
			{cites:[{source:"ITEM-1"}]},
		],
		result:["John Doe. His Anonymous Life. 1965." ],
	});
	CSLTEST.Test.testCites({ 
		id:"affix_PrefixFullCitationTextOnly.txt", 
		style:'<style       xmlns="http://purl.org/net/xbiblio/csl"      class="note"      version="1.0">  <info>    <id />    <title />    <updated>2007-10-26T21:32:52+02:00</updated>  </info>  <citation>    <layout prefix="(" suffix=")">      <group delimiter=" ">        <names variable="author">          <name form="short" />        </names>        <date variable="issued">          <date-part name="year" />        </date>      </group>    </layout>  </citation></style>',
		sources:[
			{
				author: [
					{
						"family": "Smith", 
						"given": "John"
					}
				], 
				"id": "ITEM-1", 													
				"issued": {
					"date-parts": [
						[
						    "1965", 
						    "6", 
						    "1"
						]
					]
				}, 
				"issued":[{
						year:"2000", 
						month:"2", 
						day:"15"
				}], 
				"title": "Book C", 
				"type": "book"
			}
		],
		clusters:[
			{cites:[{source:"ITEM-1"}]},
		],
		result:["(Smith 2000)" ],
	});

	CSLTEST.Test.testCites({ 
		id:"textcase_TitleWithEmDash.txt", 
		style:'<style xmlns="http://purl.org/net/xbiblio/csl"      class="note"      version="1.0">  <info>    <id />    <title />    <updated>2009-08-10T04:49:00+09:00</updated>  </info>  <citation>    <layout delimiter="; ">      <text variable="title" text-case="title"/>    </layout>  </citation></style>',
		sources:[
			{
				"title": "Relationship of core self-evaluation traits—self-esteem, generalized self-efficacy, locus of control, and emotional stability—with job satisfaction and job performance: a meta-analysis",
				"id": "ITEM-1", 
				"type": "book"
			}
		],
		clusters:[
			{cites:[{source:"ITEM-1"}]},
		],
		result:["(Smith 2000)" ],
	});

/*	CSLTEST.Test.testCites({ 
		id:"affix_withCommas.txt", 
		style:'<style  xmlns="http://purl.org/net/xbiblio/csl" class="note" version="1.0"><citation> <layout delimiter=", "> <names variable="author" suffix=", " /> <text variable="title" font-style="italic" suffix=", "/> <date variable="issued"><date-part name="year" /></date>   </layout>  </citation></style>',
		sources:[
			{
				"author": [
				    {
				        "family": "Smith", 
				        "given": "John"
				    }
				], 
				"id": "ITEM-1", 
				"issued":[{
						year:"2000", 
						month:"2", 
						day:"15"
				}], 
				"title": "Book C", 
				"type": "book"
			},
			{
				"author": [
				    {
				        "family": "Jones", 
				        "given": "David"
				    }
				], 
				"id": "ITEM-2", 
				"issued":[{
						year:"2000", 
						month:"2", 
						day:"15"
				}], 
				"title": "Book D", 
				"type": "book"
			}
		],
		clusters:[
			{cites:[{source:"ITEM-1"},{source: "ITEM-2", prefix: ", and "}]},
			{cites:[{source:"ITEM-1", suffix:" is one source,"},{source: "ITEM-2", suffix: " is another."}]},
			{cites:[{source:"ITEM-1", suffix:" is one source,", locator:"23"},{source: "ITEM-2", suffix: " is another."}]},
		],
		result:["this is a pen that is a Smith pencil","","" ],
	});

	CSLTEST.Test.testCites({ //// input with html elements & a nocase class is not part of specification.
		id:"textcase_lowercase.txt", 
		style:'<style       xmlns="http://purl.org/net/xbiblio/csl"      class="note"      version="1.0">  <info>    <id />    <title />    <updated>2009-08-10T04:49:00+09:00</updated>  </info>  <citation>    <layout>      <text variable="title" text-case="lowercase"/>    </layout>  </citation></style>',
		sources:[
			{
				 "id": "ITEM-1", 
				"title": "This is a pen that is a <span class=\"nocase\">Smith</span> pencil", 
				"type": "book"
			}
		],
		clusters:[
			{cites:[{source:"ITEM-1"}]},
		],
		result:["this is a pen that is a Smith pencil" ],
	});
*/



/////// End Official CSL Test Suit ///////



	var STOP = Date.now();
	TIME = STOP-START;
	console.log('time',TIME);
/*c=CSLTEST.Private.Disambig.AdvCollisionKeeper();
c.add("qwer","key1",1);
c.add("qwer","key1",2);	
c.add("more","key1",2);	
c.add("qwer","key3",0);
c.add("qwer","key3",1);
/*console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([1099169063, 1562796409]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([982368049, 1562796409]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([1247741801, 1099169063]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([1247741801, 2062383600]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([1247741801, 1247741801]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([2062383600, 1586303520]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([2062383600, 683309676]))
console.log(CSLTEST.Private.Names.Disambiguate.disambiguateNameArray([2062383600, 1861493204, 1586303520]))*/

},
300)
