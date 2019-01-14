///// This is the plugin framework used by the Lazu CSL Processor. It is already included in laz.js.
///// This file exists for publication as an open-source product.


var FrameWork = (function(){

	var Public = {} //// Holds Public functions
	var Private = {} //// Holds Developer functions
	var Modules = {} //// registry of modules
	var State = {}
	var Tracks = {}
	var Hooks = {}
	var Introspection = {"Tracks":Tracks,"Modules":Modules} /// holds internal state of important Framework variables for debuggins.
	function Introspect(){return Introspection}

	function callbackWrapper(track, index, args){
		var self = this;
		args.pop() /// remove old callback
		var fn = track[index];
		var callback = track[index+1]
		if (callback == undefined){
			_callback = (function(){
				return Array.from(arguments);
			})
		} else {
			var _callback = function(){
				return callbackWrapper.call(self, track, index+1, args)
			}
		}
		args.push(_callback);
		return fn.apply(this, args);

	}

	var Signal = (function(){
		var self = this;
		var functions = {};
		var subscribe = function(obj){
			if (functions[obj.name] == undefined) {
				functions[obj.name] = {};
			}
			functions[obj.name].push(obj.fn);
		}
		var unsubscribe = function(obj){
			if (functions(obj.name) != undefined){
				var index=functions[obj.name].index(obj.fn)
				functions[obj.name].slice(index, 1)
			}
		}
		var publish = function(name, args){
			if (functions[name] != undefined) {
				functions[obj.name].map(function(fn){
					fn.apply(self, args);
				})
			}
		}

		Introspection["Signals"] = functions;
		return {
			subscribe:subscribe,
			unsubscribe:unsubscribe,
			publish:publish,
		}
	})()

	function getFunction(fn){
		var self = this;
		return function(){
			var args = Array.from(arguments)
			args.push(0) // add placeholder
			return callbackWrapper.call(self, Tracks[fn], 0, args)
		}
	}

	function execHook(hook, args){
		Hooks[hook].map(function(fn){
			args = fn.apply(this, args)
		})
		return args
	}
	function registerHook(hook, fn){
		if (Hooks[hook] == undefined){
			Hooks[hook] = []
		}
		Hooks.push(fn)
	}

	var Plugin = (function(){ //// Functionality is implemented fully through Plugins
		//// allow flexible ordering of registering hooks.
		var PreHook = {};
		var PostHook = {};

		var Functions ={} 	//// registry of functions by name
		var Exec = []; //// execution sequence

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
			var fn, subroutine
			if (typeof(plugin.name) == "undefined"){ plugin.name = plugin.fn.name; }
			Functions[plugin.name] = plugin.fn;
			if (plugin.pre != undefined){
				if (Functions[plugin.pre] != undefined){ //// dependent function exists
					addFn.call(this.self, plugin.name, plugin.pre, "pre")
				} else { //// register in PreHook for when dependent function arrives
					if (PreHook[plugin.pre] == undefined){
						PreHook[plugin.pre] = []
					}
					PreHook[plugin.pre].push(plugin.name)
				}
			}
			else if (plugin.post != undefined){
				if (Functions[plugin.post] != undefined){ //// dependent function exists
					addFn.call(this.self, plugin.name, plugin.post, "post")
				} else { //// register in PostHook for when dependent function arrives
					if (PostHook[plugin.post] == undefined){
						PostHook[plugin.post] = []
					}
					PostHook[plugin.post].push(plugin.name)
				}
			} else {
				addFn.call(this.self, plugin.name, plugin.pre, "none")
			}
		}

		var registerModule = function(module){
			module.call(this.self)
		}

		function callback(){
			var self = this.self;
			var args = Array.from(arguments)
			args.push(0) //// add placeholder.
			return callbackWrapper.call(self, Tracks["Config"], 0, args)
		}

		function execute(){
			var self = this.self;
			var args = Array.from(arguments)
			args.push(0) //// add placeholder.
			Exec.map(function(fn){
				args = fn.apply(self, args)
			})
			return args
		}

		return {
			register:register,
			registerModule:registerModule,
			Exec:Exec,
			callback:callback, //// for methods with callbacks
			execute:execute, //// for methods without callbacks
		}
	})()

	function getCallback(track){
		return callbackWrapper.call(self, Tracks["Config"], 0, args)
	}

	Private["Modules"]=Modules;
	Private["Plugin"]=Plugin;
	Private["State"]=State;
	Private["Public"] = Public;
	Private["Tracks"] = Tracks;
	Private["Signal"] = Signal;
	Private["getFunction"] = getFunction;
	Private["Introspect"] = Introspect;
	Plugin.self = Private;


	Public["Private"]=Private; //// to let developers explore.
	Public["Plugin"]=Plugin;
	return Public;
})
