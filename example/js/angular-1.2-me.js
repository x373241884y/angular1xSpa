!function (window, document, undefined) {
	"use strict";
	function getName(fn) {
		return fn.name || fn.toString().match(/function\s*([^(]*)\(/)[1]
	}

	Object.prototype.getLength = function () {
		var count = 0;
		for (var i in this) {
			if (this.hasOwnProperty(i)) {
				count++;
			}
		}
		return count;
	}
	function minErr(module) { //使用模块(如$rootScope)产生一个错误工场函数
		return function () { //该函数new 一个 Error对象
			var message,
				i,
				code = arguments[0],//第一个参数是错误码
				prefix = "[" + (module ? module + ":" : "") + code + "] ",
				template = arguments[1],//第二个参数是模板
				templateArgs = arguments,
				stringify = function (obj) {
					var result;
					if ("function" == typeof obj) {
						result = obj.toString().replace(/ \{[\s\S]*$/, "");
					} else if ("undefined" == typeof obj) {
						result = "undefined";
					} else if ("string" != typeof obj) {
						result = JSON.stringify(obj);
					} else {
						result = obj;
					}
					return result;
				};
			message = prefix + template.replace(/\{\d+\}/g, function (match) {
					var arg,
						index = +match.slice(1, -1);
					var result;
					if (index + 2 < templateArgs.length) {
						arg = templateArgs[index + 2];
						if ("function" == typeof arg) {
							result = arg.toString().replace(/ ?\{[\s\S]*$/, "");
						} else if ("undefined" == typeof arg) {
							result = "undefined";
						} else if ("string" != typeof arg) {
							result = toJson(arg);
						} else {
							result = arg;
						}
					} else {
						result = match;
					}
					return result;
				});
			message = message + "\nhttp://errors.angularjs.org/1.2.1/" + (module ? module + "/" : "") + code;
			for (i = 2; i < arguments.length; i++) {
				message = message + (2 == i ? "?" : "&") + "p" + (i - 2) + "=" + encodeURIComponent(stringify(arguments[i]));
			}
			return new Error(message);
		}
	}

	function isArrayLike(obj) {
		if (null == obj || isWindow(obj)) {
			return !1;
		}
		var length = obj.length;
		if (1 === obj.nodeType && length) {
			return !0;
		} else if (isString(obj) || isArray(obj) || 0 === length) {
			return !0;
		} else {
			return "number" == typeof length && length > 0 && length - 1 in obj;
		}
	}

	function forEach(obj, iterator, context) {
		var key;
		if (obj) {
			if (isFunction(obj)) {//函数的情况
				for (key in obj) { //去除不需要循环的属性(prototype,length,name),并且只能是自定义的属性
					if (key != "prototype" && key != "length" && key != "name" && obj.hasOwnProperty(key))
						iterator.call(context, obj[key], key);
				}
			}
			else if (obj.forEach && obj.forEach !== forEach) //该对象有自已的forEach函数的情况
				obj.forEach(iterator, context);
			else if (isArrayLike(obj)) //对象是个类似数组的对象
				for (key = 0; key < obj.length; key++) {
					iterator.call(context, obj[key], key);
				}
			else
				for (key in obj) { //使用for in 循环  可以循环原型上的属性,使用hasOwnProperty限制了只能循环自定义属性
					obj.hasOwnProperty(key) && iterator.call(context, obj[key], key);
				}
		}
		return obj
	}

	function sortedKeys(obj) {
		var keys = [];
		for (var key in obj) {
			obj.hasOwnProperty(key) && keys.push(key);
		}
		return keys.sort()
	}

	function forEachSorted(obj, iterator, context) {
		var keys = sortedKeys(obj), i = 0;
		for (; i < keys.length; i++) {
			iterator.call(context, obj[keys[i]], keys[i]);
		}
		return keys;
	}

	//对传入的函数进行包装..包装后的函数参数使用与不包装的函数参数使用是相反的
	function reverseParams(iteratorFn) {  //reverseParams(fn)(args1,args2)实际执行的是fn(args2,args1)---反转参数执行fn
		return function (value, key) {
			iteratorFn(key, value)
		}
	}

	function nextUid() {
		for (var digit, index = uid.length; index;) {
			if (index--, digit = uid[index].charCodeAt(0), 57 == digit) return uid[index] = "A", uid.join("");
			if (90 != digit) return uid[index] = String.fromCharCode(digit + 1), uid.join("");
			uid[index] = "0"
		}
		return uid.unshift("0"), uid.join("")
	}

	function setHashKey(obj, h) {
		h ? obj.$$hashKey = h : delete obj.$$hashKey; //h为true,则设置Hash,否则就是删除Hash
	}

	function extend(dst) {
		var h = dst.$$hashKey;
		forEach(arguments, function (obj) { //对每一个参数都处理
			if (obj !== dst) { //如果是第一个参数(作为目标对象,跳过
				forEach(obj, function (value, key) {
					dst[key] = value;//每一次处理都是把后面的对象的属性及原型上的属性都附加到第一个对象上
				})
			}
		});
		setHashKey(dst, h); //修正hashKey
		return dst;
	}

	function int(str) {
		return parseInt(str, 10)
	}

	function inherit(parent, extra) {
		var childFn = extend(function () {
		}, {
			prototype: parent
		});
		return extend(new childFn, extra);
	}

	function noop() {
	}

	function identity($) {
		return $
	}

	function valueFn(value) { //把传进来的参数封装成一个函数，该函数返回传进来的参数
		return function () {
			return value
		}
	}

	function isUndefined(value) {
		return "undefined" == typeof value
	}

	function isDefined(value) {
		return "undefined" != typeof value
	}

	function isObject(value) {
		return null != value && "object" == typeof value
	}

	function isString(value) {
		return "string" == typeof value
	}

	function isNumber(value) {
		return "number" == typeof value
	}

	function isDate(value) {
		return "[object Date]" == toString.apply(value)
	}

	function isArray(value) {
		return "[object Array]" == toString.apply(value);
	}

	function isFunction(value) {
		return "function" == typeof value
	}

	function isRegExp(value) {
		return "[object RegExp]" == toString.apply(value)
	}

	function isWindow(obj) {
		return obj && obj.document && obj.location && obj.alert && obj.setInterval
	}

	function isScope(obj) {
		//每一个scope都有$evalAsync和$watch方法
		return obj && obj.$evalAsync && obj.$watch;
	}

	function isFile(obj) {
		return "[object File]" === toString.apply(obj)
	}

	function isElement(node) {
		return node && (node.nodeName || node.on && node.find)
	}

	function map(obj, iterator, context) {
		var results = [];
		return forEach(obj, function (value, index, list) {
			results.push(iterator.call(context, value, index, list))
		}), results
	}

	function includes(array, obj) {
		return -1 != indexOf(array, obj)
	}

	function indexOf(array, obj) {
		if (array.indexOf) return array.indexOf(obj);
		for (var i = 0; i < array.length; i++)
			if (obj === array[i]) return i;
		return -1
	}

	function arrayRemove(array, value) {
		var index = indexOf(array, value);
		return index >= 0 && array.splice(index, 1), value
	}

	function copy(source, destination) {
		if (isWindow(source) || isScope(source)) throw ngMinErr("cpws", "Can't copy! Making copies of Window or Scope instances is not supported.");
		if (destination) {
			if (source === destination) throw ngMinErr("cpi", "Can't copy! Source and destination are identical.");
			if (isArray(source)) {
				destination.length = 0;
				for (var i = 0; i < source.length; i++) destination.push(copy(source[i]))
			} else {
				var h = destination.$$hashKey;
				forEach(destination, function (value, key) {
					delete destination[key]
				});
				for (var key in source) destination[key] = copy(source[key]);
				setHashKey(destination, h)
			}
		} else destination = source, source && (isArray(source) ? destination = copy(source, []) : isDate(source) ? destination = new Date(source.getTime()) : isRegExp(source) ? destination = new RegExp(source.source) : isObject(source) && (destination = copy(source, {})));
		return destination
	}

	function shallowCopy(src, dst) {
		dst = dst || {};
		for (var key in src) src.hasOwnProperty(key) && "$$" !== key.substr(0, 2) && (dst[key] = src[key]);
		return dst
	}

	function equals(o1, o2) {
		if (o1 === o2) return !0;
		if (null === o1 || null === o2) return !1;
		if (o1 !== o1 && o2 !== o2) return !0;
		var length, key, keySet, t1 = typeof o1,
			t2 = typeof o2;
		if (t1 == t2 && "object" == t1) {
			if (!isArray(o1)) {
				if (isDate(o1)) return isDate(o2) && o1.getTime() == o2.getTime();
				if (isRegExp(o1) && isRegExp(o2)) return o1.toString() == o2.toString();
				if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) || isArray(o2)) return !1;
				keySet = {};
				for (key in o1)
					if ("$" !== key.charAt(0) && !isFunction(o1[key])) {
						if (!equals(o1[key], o2[key])) return !1;
						keySet[key] = !0
					}
				for (key in o2)
					if (!keySet.hasOwnProperty(key) && "$" !== key.charAt(0) && o2[key] !== undefined && !isFunction(o2[key])) return !1;
				return !0
			}
			if (!isArray(o2)) return !1;
			if ((length = o1.length) == o2.length) {
				for (key = 0; length > key; key++)
					if (!equals(o1[key], o2[key])) return !1;
				return !0
			}
		}
		return !1
	}

	function csp() {
		return document.securityPolicy && document.securityPolicy.isActive || document.querySelector && !(!document.querySelector("[ng-csp]") && !document.querySelector("[data-ng-csp]"))
	}

	//合并数组(array1与array2(index-->array2.length分割后的数组合并)
	function concat(array1, array2, index) {
		return array1.concat(slice.call(array2, index))
	}

	function sliceArgs(args, startIndex) {
		return slice.call(args, startIndex || 0)
	}

	function bind(self, fn) {
		var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
		return !isFunction(fn) || fn instanceof RegExp ? fn : curryArgs.length ? function () {
			return arguments.length ? fn.apply(self, curryArgs.concat(slice.call(arguments, 0))) : fn.apply(self, curryArgs)
		} : function () {
			return arguments.length ? fn.apply(self, arguments) : fn.call(self)
		}
	}

	//序列化时过滤函数
	function toJsonReplacer(key, value) {
		var val = value;
		if ("string" == typeof key && "$" === key.charAt(0)) { //字符串第一个是$的返回undefined
			val = undefined;
		} else {
			if (isWindow(value)) { //是window对象
				val = "$WINDOW";
			} else if (value && document === value) {//是document
				val = "$DOCUMENT";
			} else {
				isScope(value) && (val = "$SCOPE"); //scope对象
			}
		}
		return val;
	}

	function toJson(obj, pretty) {
		if ("undefined" == typeof obj) {
			return undefined;
		}
		//对象序列化为JSON字符串
		return JSON.stringify(obj, toJsonReplacer, pretty ? "  " : null);
	}

	function fromJson(json) {
		if (isString(json)) {
			//JSON串到Object
			JSON.parse(json);
		}
		return json;
	}

	function toBoolean(value) {
		if (value && 0 !== value.length) {
			var v = lowercase("" + value);
			value = !("f" == v || "0" == v || "false" == v || "no" == v || "n" == v || "[]" == v)
		} else value = !1;
		return value
	}

	function startingTag(element) {
		element = jqLite(element).clone();
		try {
			element.html("")
		} catch (e) {
		}
		var TEXT_NODE = 3,
			elemHtml = jqLite("<div>").append(element).html();
		try {
			return element[0].nodeType === TEXT_NODE ? lowercase(elemHtml) : elemHtml.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/, function (match, nodeName) {
				return "<" + lowercase(nodeName)
			})
		} catch (e) {
			return lowercase(elemHtml)
		}
	}

	function tryDecodeURIComponent(value) {
		try {
			return decodeURIComponent(value)
		} catch (e) {
		}
	}

	function parseKeyValue(keyValue) {
		var key_value, key, obj = {};
		return forEach((keyValue || "").split("&"), function (keyValue) {
			if (keyValue && (key_value = keyValue.split("="), key = tryDecodeURIComponent(key_value[0]), isDefined(key))) {
				var val = isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : !0;
				obj[key] ? isArray(obj[key]) ? obj[key].push(val) : obj[key] = [obj[key], val] : obj[key] = val
			}
		}), obj
	}

	function toKeyValue(obj) {
		var parts = [];
		return forEach(obj, function (value, key) {
			isArray(value) ? forEach(value, function (arrayValue) {
				parts.push(encodeUriQuery(key, !0) + (arrayValue === !0 ? "" : "=" + encodeUriQuery(arrayValue, !0)))
			}) : parts.push(encodeUriQuery(key, !0) + (value === !0 ? "" : "=" + encodeUriQuery(value, !0)))
		}), parts.length ? parts.join("&") : ""
	}

	function encodeUriSegment(val) {
		return encodeUriQuery(val, !0).replace(/%26/gi, "&").replace(/%3D/gi, "=").replace(/%2B/gi, "+")
	}

	function encodeUriQuery(val, pctEncodeSpaces) {
		return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, pctEncodeSpaces ? "%20" : "+")
	}

	function angularInit(element, bootstrap) {
		console.debug('exec angularInit(element, bootstrap)');
		function append(element) {
			element && elements.push(element);
		}

		var appElement,
			module,
			elements = [element],
			names = ["ng:app", "ng-app", "x-ng-app", "data-ng-app"],
			NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;
		forEach(names, function (name) {
			names[name] = !0;
			append(document.getElementById(name));
			name = name.replace(":", "\\:");
			if (element.querySelectorAll) {
				forEach(element.querySelectorAll("." + name), append);
				forEach(element.querySelectorAll("." + name + "\\:"), append);
				forEach(element.querySelectorAll("[" + name + "]"), append);
			}
		});
		forEach(elements, function (element) {
			if (!appElement) {
				var className = " " + element.className + " ";
				var match = NG_APP_CLASS_REGEXP.exec(className);
				if (match) {
					appElement = element, module = (match[2] || "").replace(/\s+/g, ",");
				} else {
					forEach(element.attributes, function (attr) {
						!appElement && names[attr.name] && (appElement = element, module = attr.value);
					})
				}
			}
		});
		//上面一大段都在查找ng-app所在元素(有必要吗?)...
		if (appElement) { //判断ng-app节点是否存在...不存在只能自已手动加载
			bootstrap(appElement, module ? [module] : []);
			console.info('angular startup success');
		}
	}

	function bootstrap(element, modules) { //if ng-app="app",then modules=["app"] app应用启动点...
		console.debug('exec bootstrap(element, modules)');
		var doBootstrap = function () {
			element = jqLite(element);
			if (element.injector()) {
				var tag = element[0] === document ? "document" : startingTag(element);
				throw ngMinErr("btstrpd", "App Already Bootstrapped with this Element '{0}'", tag)
			}
			modules = modules || [];
			modules.unshift(["$provide",
				function ($provide) {
					$provide.value("$rootElement", element);
				}
			]);
			modules.unshift("ng");//if ng-app="app",then modules =["ng",Array[2],"app"],ng is dep  ngLocale
			var injector = createInjector(modules);//后面实例化使用返回来的instanceInjector
			//上面执行完成后，所有的服务和指令已经注册完成
			injector.invoke(["$rootScope", "$rootElement", "$compile", "$injector", "$animate",
				function (scope, element, compile, injector) {
					scope.$apply(function () {
						element.data("$injector", injector);
						compile(element)(scope);
					})
				}
			]);
			return injector;
		};
		var NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

		var result;
		if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
			result = doBootstrap();
		} else {
			window.name = window.name.replace(NG_DEFER_BOOTSTRAP, "");
			angular.resumeBootstrap = function (extraModules) {
				forEach(extraModules, function (module) {
					modules.push(module);
				});
				doBootstrap();
			};
			result = void 0;  //void 0 ===undefined
		}
		return result;
	}

	function snake_case(name, separator) {
		return separator = separator || "_", name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
			return (pos ? separator : "") + letter.toLowerCase()
		})
	}

	function bindJQuery() {
		console.debug('exec bindJQuery()');
		jQuery = window.jQuery;
		if (jQuery) {  //有是jQuery的话,
			jqLite = jQuery;
			extend(jQuery.fn, {
				scope: JQLitePrototype.scope,
				isolateScope: JQLitePrototype.isolateScope,
				controller: JQLitePrototype.controller,
				injector: JQLitePrototype.injector,
				inheritedData: JQLitePrototype.inheritedData
			});
			jqLitePatchJQueryRemove("remove", !0, !0, !1);
			jqLitePatchJQueryRemove("empty", !1, !1, !1);
			jqLitePatchJQueryRemove("html", !1, !1, !0);
		}
		else { //没有的话
			jqLite = JQLite;  //把构造器给jqLite
			angular.element = jqLite; //把构造器给angular的element属性
		}
	}

	/**全文三处使用
	 * 1.assertArg(isFunction(fn),name,reason)断言是否是函数,
	 * 2.assertArg(scope,"scope"),断言是否scope定义了,第三个参数自动用undefined填充
	 * 3.assertArg(directiveFactory, "directiveFactory"),断言指令工厂是否定义
	 * @param arg
	 * @param name
	 * @param reason
	 * @returns {*}
	 */
	function assertArg(arg, name, reason) {
		if (!arg) {
			throw ngMinErr("areq", "Argument '{0}' is {1}", name || "?", reason || "required");
		}
		return arg
	}

	function assertArgFn(arg, name, acceptArrayAnnotation) { //assertArgFn(fn, "fn", !0);
		acceptArrayAnnotation && isArray(arg) && (arg = arg[arg.length - 1]);
		var msg;
		if (arg && "object" == typeof arg) {
			msg = arg.constructor.name || "Object";
		} else {
			msg = typeof arg;
		}
		var reason = "not a function, got " + msg;
		assertArg(isFunction(arg), name, reason);//不是函数,抛出异常
		return arg;
	}

	function assertNotHasOwnProperty(name, context) {
		if ("hasOwnProperty" === name) {
			throw ngMinErr("badname", "hasOwnProperty is not a valid {0} name", context);
		}
	}

	function getter(obj, path, bindFnToScope) {
		if (!path) return obj;
		for (var key, keys = path.split("."), lastInstance = obj, len = keys.length, i = 0; len > i; i++) {
			key = keys[i], obj && (obj = (lastInstance = obj)[key]);
		}
		return !bindFnToScope && isFunction(obj) ? bind(lastInstance, obj) : obj
	}

	function getBlockElements(block) {
		if (block.startNode === block.endNode) return jqLite(block.startNode);
		var element = block.startNode,
			elements = [element];
		do {
			if (element = element.nextSibling, !element) break;
			elements.push(element)
		} while (element !== block.endNode);
		return jqLite(elements)
	}

	function setupModuleLoader(window) {
		console.debug('exec setupModuleLoader(window)');
		function ensure(obj, name, factory) {
			if (!obj[name]) {
				obj[name] = factory();//存在返回，不存在定义
			}
			return obj[name];//存在返回，不存在定义
			//return obj[name] || (obj[name] = factory()); //origin code
		}

		var $injectorMinErr = minErr("$injector"),
			ngMinErr = minErr("ng");//...
		var angular = ensure(window, "angular", Object);
		/*get window.angular*/

		return ensure(angular, "module", function () {//angular设置module
			var modules = {};
			//返回给angularModule
			return function (name, requires, configFn) {  //angular.module,angularModule引用指向这个闭包方法
				//感觉这个函数没用,防止模块名与hasOwnProperty相同?
				var assertNotHasOwnProperty = function (name, context) {
					if ("hasOwnProperty" === name) {
						throw ngMinErr("badname", "hasOwnProperty is not a valid {0} name", context);
					}
				};
				assertNotHasOwnProperty(name, "module"); //模块名为hasOwnProperty时异常
				//定义一个模块的时候，如果存在该模块，则去除旧模块(属性),以便后面设置新的相同模块
				if (requires && modules.hasOwnProperty(name)) {
					modules[name] = null;
				}
				console.info("do---angular.module...for:" + name);
				return ensure(modules, name, function () { //如果存在该模块,直接返回该模块,否则执行第三个参数里面的函数,饼设置该属性模块
					function invokeLater(provider, method, insertMethod) {
						return function () {//第三个参数没有定义时是push
							invokeQueue[insertMethod || "push"]([provider, method, arguments]); //push是尾部放入
							console.log("invokeQueue-len("+invokeQueue.length+")"+(insertMethod||"push")+"-[" + arguments[0]+","+arguments[1]+"]");
							return moduleInstance;
						}
					}

					if (!requires) {//first没有依赖,异常...
						throw $injectorMinErr("nomod", "Module '{0}' is not available! You either misspelled the module name or forgot to load it. If registering a module ensure that you specify the dependencies as the second argument.", name);
					}
					var invokeQueue = [],
						runBlocks = [],
						moduleInstance = {//定义了模块的属性
							_invokeQueue: invokeQueue,//
							_runBlocks: runBlocks, //运行队列
							requires: requires, //模块依赖
							name: name, //模块名
							provider: invokeLater("$provide", "provider"), //invokeLater可以当作是编译函数(工厂函数) app.provider
							factory: invokeLater("$provide", "factory"),//app.factory (if app is a module)
							service: invokeLater("$provide", "service"),//app.service
							value: invokeLater("$provide", "value"), //app.value
							constant: invokeLater("$provide", "constant", "unshift"), //首部放入
							animation: invokeLater("$animateProvider", "register"),
							filter: invokeLater("$filterProvider", "register"),//app.filter
							controller: invokeLater("$controllerProvider", "register"),//app.controller
							directive: invokeLater("$compileProvider", "directive"),//app.directive
							config: invokeLater("$injector", "invoke"),//app.config
							run: function (block) { //运行块(app.run)
								runBlocks.push(block);
								return this;
							}
						};
					if (configFn) {
						moduleInstance.config(configFn);//configFn是angular.module(angularModule)函数里面的第三个参数
					}
					console.info("moduleInstance==>" + name + ":");
					console.log(moduleInstance);
					return moduleInstance;
				});
			}
		});
	}

	function publishExternalAPI(angular) {
		console.debug('exec publishExternalAPI(angular)');
		extend(angular, { //把该对象属性都扩展给window.angular
			bootstrap: bootstrap,//startup
			copy: copy,
			extend: extend, //
			equals: equals,//
			element: jqLite,// 这个属性相当是jQuery($)
			forEach: forEach,//
			injector: createInjector,
			noop: noop,//
			bind: bind,
			toJson: toJson,//
			fromJson: fromJson,//
			identity: identity,//$--->$
			isUndefined: isUndefined,//
			isDefined: isDefined,//
			isString: isString,//
			isFunction: isFunction,//
			isObject: isObject,//
			isNumber: isNumber,//
			isElement: isElement,
			isArray: isArray,//
			version: version,//
			isDate: isDate,//
			lowercase: lowercase,//
			uppercase: uppercase,//
			callbacks: {
				counter: 0
			},
			$$minErr: minErr,
			$$csp: csp
		});
		angularModule = setupModuleLoader(window);
		try {
			angularModule("ngLocale"); //会出现异常
		} catch (e) {
			angularModule("ngLocale", []).provider("$locale", $LocaleProvider); //invokeLater("$provide", "provider")
		}
		angularModule("ng", ["ngLocale"], ["$provide", // invokeLater("$injector", "invoke") config,有第三个参数configFn
			function ($provide) {
				console.log('do  register $compile');
				$provide.provider("$compile", $CompileProvider)
					.directive({
						a: htmlAnchorDirective,
						input: inputDirective,
						textarea: inputDirective,
						form: formDirective,
						script: scriptDirective,
						select: selectDirective,
						style: styleDirective,
						option: optionDirective,
						ngBind: ngBindDirective,
						ngBindHtml: ngBindHtmlDirective,
						ngBindTemplate: ngBindTemplateDirective,
						ngClass: ngClassDirective,
						ngClassEven: ngClassEvenDirective,
						ngClassOdd: ngClassOddDirective,
						ngCloak: ngCloakDirective,
						ngController: ngControllerDirective,
						ngForm: ngFormDirective,
						ngHide: ngHideDirective,
						ngIf: ngIfDirective,
						ngInclude: ngIncludeDirective,
						ngInit: ngInitDirective,
						ngNonBindable: ngNonBindableDirective,
						ngPluralize: ngPluralizeDirective,
						ngRepeat: ngRepeatDirective,
						ngShow: ngShowDirective,
						ngStyle: ngStyleDirective,
						ngSwitch: ngSwitchDirective,
						ngSwitchWhen: ngSwitchWhenDirective,
						ngSwitchDefault: ngSwitchDefaultDirective,
						ngOptions: ngOptionsDirective,
						ngTransclude: ngTranscludeDirective,
						ngModel: ngModelDirective,
						ngList: ngListDirective,
						ngChange: ngChangeDirective,
						required: requiredDirective,
						ngRequired: requiredDirective,
						ngValue: ngValueDirective
					}) //注册内置指令
					.directive(ngAttributeAliasDirectives)
					.directive(ngEventDirectives);
				$provide.provider({ //注册内部服务
					$anchorScroll: $AnchorScrollProvider,
					$animate: $AnimateProvider,
					$browser: $BrowserProvider,
					$cacheFactory: $CacheFactoryProvider,
					$controller: $ControllerProvider,
					$document: $DocumentProvider,
					$exceptionHandler: $ExceptionHandlerProvider,
					$filter: $FilterProvider,
					$interpolate: $InterpolateProvider,
					$interval: $IntervalProvider,
					$http: $HttpProvider,
					$httpBackend: $HttpBackendProvider,
					$location: $LocationProvider,
					$log: $LogProvider,
					$parse: $ParseProvider,
					$rootScope: $RootScopeProvider,
					$q: $QProvider,
					$sce: $SceProvider,
					$sceDelegate: $SceDelegateProvider,
					$sniffer: $SnifferProvider,
					$templateCache: $TemplateCacheProvider,
					$timeout: $TimeoutProvider,
					$window: $WindowProvider
				})
			}
		]);
		console.log('ng module init config success(publishExternalAPI()end)');
	}

	function jqNextId() {
		return ++jqId
	}

	function camelCase(name) {
		return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
			if (offset) {
				return letter.toUpperCase();
			}
			return letter;
		}).replace(MOZ_HACK_REGEXP, "Moz$1");
	}

	function jqLitePatchJQueryRemove(name, dispatchThis, filterElems, getterIfNoArguments) {
		function removePatch(param) {
			var set, setIndex, setLength, element, childIndex, childLength, children, list = filterElems && param ? [this.filter(param)] : [this],
				fireEvent = dispatchThis;
			if (!getterIfNoArguments || null != param)
				for (; list.length;)
					for (set = list.shift(), setIndex = 0, setLength = set.length; setLength > setIndex; setIndex++)
						for (element = jqLite(set[setIndex]), fireEvent ? element.triggerHandler("$destroy") : fireEvent = !fireEvent, childIndex = 0, childLength = (children = element.children()).length; childLength > childIndex; childIndex++) list.push(jQuery(children[childIndex]));
			return originalJqFn.apply(this, arguments)
		}

		var originalJqFn = jQuery.fn[name];
		originalJqFn = originalJqFn.$original || originalJqFn, removePatch.$original = originalJqFn, jQuery.fn[name] = removePatch
	}

	function JQLite(element) {
		if (element instanceof JQLite) return element;
		if (!(this instanceof JQLite)) {
			if (isString(element) && "<" != element.charAt(0)) {
				throw jqLiteMinErr("nosel", "Looking up elements via selectors is not supported by jqLite! See: http://docs.angularjs.org/api/angular.element");
			}
			return new JQLite(element)
		}
		if (isString(element)) {
			var div = document.createElement("div");
			div.innerHTML = "<div>&#160;</div>" + element;
			div.removeChild(div.firstChild);
			jqLiteAddNodes(this, div.childNodes);
			var fragment = jqLite(document.createDocumentFragment());
			fragment.append(this)
		} else jqLiteAddNodes(this, element)
	}

	function jqLiteClone(element) {
		return element.cloneNode(!0)
	}

	function jqLiteDealoc(element) {
		jqLiteRemoveData(element);
		for (var i = 0, children = element.childNodes || []; i < children.length; i++) jqLiteDealoc(children[i])
	}

	function jqLiteOff(element, type, fn, unsupported) {
		if (isDefined(unsupported)) throw jqLiteMinErr("offargs", "jqLite#off() does not support the `selector` argument");
		var events = jqLiteExpandoStore(element, "events"),
			handle = jqLiteExpandoStore(element, "handle");
		handle && (isUndefined(type) ? forEach(events, function (eventHandler, type) {
			removeEventListenerFn(element, type, eventHandler), delete events[type]
		}) : forEach(type.split(" "), function (type) {
			isUndefined(fn) ? (removeEventListenerFn(element, type, events[type]), delete events[type]) : arrayRemove(events[type] || [], fn)
		}))
	}

	function jqLiteRemoveData(element, name) {
		var expandoId = element[jqName],
			expandoStore = jqCache[expandoId];
		if (expandoStore) {
			if (name) return delete jqCache[expandoId].data[name], void 0;
			expandoStore.handle && (expandoStore.events.$destroy && expandoStore.handle({}, "$destroy"), jqLiteOff(element)), delete jqCache[expandoId], element[jqName] = undefined
		}
	}

	function jqLiteExpandoStore(element, key, value) {
		var expandoId = element[jqName],
			expandoStore = jqCache[expandoId || -1];
		if (isDefined(value)) {
			if (!expandoStore) {
				element[jqName] = expandoId = jqNextId();
				expandoStore = jqCache[expandoId] = {};
			}
			expandoStore[key] = value;
			//return void 0;
			return undefined;
		}
		else {
			return expandoStore && expandoStore[key];
		}

	}

	function jqLiteData(element, key, value) {
		var data = jqLiteExpandoStore(element, "data"),
			isSetter = isDefined(value),
			keyDefined = !isSetter && isDefined(key),
			isSimpleGetter = keyDefined && !isObject(key);

		data || isSimpleGetter || jqLiteExpandoStore(element, "data", data = {});
		if (isSetter) {
			data[key] = value;
		} else {
			if (!keyDefined) {
				return data;
			}
			if (isSimpleGetter) {
				return data && data[key];
			}
			extend(data, key);
		}
	}

	function jqLiteHasClass(element, selector) {
		if (element.getAttribute) {
			var cssStr = (" " + (element.getAttribute("class") || "") + " ");
			cssStr = cssStr.replace(/[\n\t]/g, " ");
			return cssStr.indexOf(" " + selector + " ") > -1;
		}
		return false;
	}

	function jqLiteRemoveClass(element, cssClasses) { //remove classs
		if (cssClasses && element.setAttribute) {
			forEach(cssClasses.split(" "), function (cssClass) {
				var cssStr = (" " + (element.getAttribute("class") || "") + " ");
				cssStr = cssStr.replace(/[\n\t]/g, " ");
				cssStr = cssStr.replace(" " + trim(cssClass) + " ", " ");
				element.setAttribute("class", trim(cssStr));
			})
		}
	}

	function jqLiteAddClass(element, cssClasses) { //add class
		if (cssClasses && element.setAttribute) {
			var existingClasses = (" " + (element.getAttribute("class") || "") + " ").replace(/[\n\t]/g, " ");
			forEach(cssClasses.split(" "), function (cssClass) {
				cssClass = trim(cssClass);
				if (-1 === existingClasses.indexOf(" " + cssClass + " ")) {
					existingClasses += cssClass + " ";
				}
			});
			element.setAttribute("class", trim(existingClasses));
		}
	}

	function jqLiteAddNodes(root, elements) {
		if (elements) {
			elements = elements.nodeName || !isDefined(elements.length) || isWindow(elements) ? [elements] : elements;
			for (var i = 0; i < elements.length; i++) root.push(elements[i])
		}
	}

	function jqLiteController(element, name) {
		return jqLiteInheritedData(element, "$" + (name || "ngController") + "Controller")
	}

	function jqLiteInheritedData(element, name, value) {
		element = jqLite(element), 9 == element[0].nodeType && (element = element.find("html"));
		for (var names = isArray(name) ? name : [name]; element.length;) {
			for (var i = 0, ii = names.length; ii > i; i++)
				if ((value = element.data(names[i])) !== undefined) return value;
			element = element.parent()
		}
	}

	function getBooleanAttrName(element, name) {
		var booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];
		return booleanAttr && BOOLEAN_ELEMENTS[element.nodeName] && booleanAttr
	}

	function createEventHandler(element, events) {
		console.debug(' event createEventHandler(element, events) for nodeName ' + element.nodeName);
		var eventHandler = function (event, type) { //事件函数工厂
			console.debug(' event occur  for event ' + event.type);
			if (!event.preventDefault) {
				event.preventDefault = function () {
					event.returnValue = !1
				};
			}
			if (!event.stopPropagation) {
				event.stopPropagation = function () {
					event.cancelBubble = !0
				};
			}
			if (!event.target) {
				event.target = event.srcElement || document;
			}
			if (isUndefined(event.defaultPrevented)) {
				var prevent = event.preventDefault;
				event.preventDefault = function () {
					event.defaultPrevented = !0;
					prevent.call(event);
				};
				event.defaultPrevented = !1;
			}
			event.isDefaultPrevented = function () {
				return event.defaultPrevented || event.returnValue === !1
			};
			forEach(events[type || event.type], function (fn) {
				fn.call(element, event);
			});
			if (8 >= msie) {
				event.preventDefault = null;
				event.stopPropagation = null;
				event.isDefaultPrevented = null;
			} else {
				delete event.preventDefault;
				delete event.stopPropagation;
				delete event.isDefaultPrevented;
			}
		};
		eventHandler.elem = element;
		return eventHandler;
	}

	function hashKey(obj) {
		var key, objType = typeof obj;
		if ("object" == objType && null !== obj) {
			if ("function" == typeof(key = obj.$$hashKey)) {
				key = obj.$$hashKey();
			}
			key === undefined && (key = obj.$$hashKey = nextUid());
		}
		key = obj;
		return objType + ":" + key;
	}

	function HashMap(array) {
		forEach(array, this.put, this);
	}

	function annotate(fn) {
		var $inject, fnText, argDecl, last;
		if ("function" == typeof fn) {//if function
			if (!($inject = fn.$inject)) {  //传进来的函数是否设置了$inject,
				$inject = [];
				if (fn.length) {  //fn需要参数吗?
					fnText = fn.toString().replace(STRIP_COMMENTS, ""); //fn字符串去除注释
					argDecl = fnText.match(FN_ARGS);//返回形如["function testCtrl($scope,$xxx)", "$scope","$xxx"]的数组
					forEach(argDecl[1].split(FN_ARG_SPLIT), function (arg) {
						arg.replace(FN_ARG, function (all, underscore, name) {
							$inject.push(name);
						});
					})
				}
				fn.$inject = $inject;
			}
		} else if (isArray(fn)) { //if Array
			last = fn.length - 1;
			assertArgFn(fn[last], "fn");//数组最后一个是function?
			$inject = fn.slice(0, last);
		} else {
			assertArgFn(fn, "fn", !0);
		}
		return $inject;
	}

	function createInjector(modulesToLoad) {
		function supportObject(delegate) {
			return function (key, value) { //闭包函数,根据delegate生成不同的比包函数
				if (isObject(key)) {//key是对象的时侯,即注册多个服务和指令的时侯执行
					forEach(key, reverseParams(delegate));//把对象的每个属性作为key--->
					//function (value, key) {iteratorFn(key, value)}
					// iteratorFn is one of provider.factory.service.value.constant
					return void 0; //void===undefined
				}
				return delegate(key, value);//不是对象的时侯,直接执行provider.factory.service.value.constant.decorator方法
			}
		}

		function provider(name, provider_) { //这里传进来的可以是函数、数组、对象
			assertNotHasOwnProperty(name, "service"); //服务名不能是hasOwnProperty
			if (isFunction(provider_) || isArray(provider_)) {//如果是函数或者数组
				provider_ = providerInjector.instantiate(provider_); //这里在实例化服务提供者
			}
			if (!provider_.$get) { //经过上面的处理还是没有$get方法的话...  没有的话抛出异常
				throw $injectorMinErr("pget", "Provider '{0}' must define $get factory method.", name);
			}
			//提供者缓存对象的所有属性都是依赖和函数组成的数组或者仅是个function
			console.log("providerCache length :" + providerCache.getLength());
			return providerCache[name + providerSuffix] = provider_;
		}

		//这里就是上面的provider_是对象且具有$get函数的情况.factoryFn封装成了一个具有$get方法的对象
		function factory(name, factoryFn) {//factoryFn工厂函数，返回服务对象
			return provider(name, { //封装成服务对象，传递给provider
				$get: factoryFn //这里会给服务对象添加$get方法
			});
		}

		function service(name, constructor) {
			return factory(name, ["$injector",
				function ($injector) {
					return $injector.instantiate(constructor);
				}
			]);
		}

		function value(name, val) {
			return factory(name, valueFn(val)); //常量封装成函数,传递给factory
		}

		function constant(name, value) { //常量直接缓存
			assertNotHasOwnProperty(name, "constant");
			providerCache[name] = value;
			instanceCache[name] = value;
		}

		function decorator(serviceName, decorFn) {
			var origProvider = providerInjector.get(serviceName + providerSuffix),
				orig$get = origProvider.$get;
			origProvider.$get = function () { //重写$get方法
				var origInstance = instanceInjector.invoke(orig$get, origProvider);
				return instanceInjector.invoke(decorFn, null, {
					$delegate: origInstance
				});
			}
		}

		function loadModules(modulesToLoad) { //加载模块使用providerInjector注入器
			var moduleFn, invokeQueue, i, ii, runBlocks = [];
			forEach(modulesToLoad, function (module) {
				if (!loadedModules.get(module)) { //   如果没有加载过模块
					loadedModules.put(module, !0);  //string:ng: true这样的形式添加到loadedModules属性中
					try {
						if (isString(module)) { //是字符串
							moduleFn = angularModule(module);//获取模块
							var requireRunBlocks = loadModules(moduleFn.requires);//从依赖获取运行块
							runBlocks = runBlocks.concat(requireRunBlocks).concat(moduleFn._runBlocks);//所有运行块
							invokeQueue = moduleFn._invokeQueue;//处理模块的invoke 队列
							ii = invokeQueue.length;
							for (i = 0; i < ii; i++) {
								var invokeArgs = invokeQueue[i];
								var provider = providerInjector.get(invokeArgs[0]);//invokeArgs contain[provider(服务), method(执行方法), arguments(参数)]
								provider[invokeArgs[1]].apply(provider, invokeArgs[2]);//使用provider作为this执行环境执行method方法,使用第三个参数
								console.log("exec invokeQueue->:[" + invokeArgs[0] + "," + invokeArgs[1] + "," + Array.prototype.slice.call(invokeArgs[2]).join("-"));
							}
						}
						else {
							if (isFunction(module)) {
								runBlocks.push(providerInjector.invoke(module));
							}
							else if (isArray(module)) {
								runBlocks.push(providerInjector.invoke(module));
							} else {
								assertArgFn(module, "module");
							}
						}
					} catch (e) {
						if (isArray(module)) {
							module = module[module.length - 1];
						}
						if (e.message && e.stack && -1 == e.stack.indexOf(e.message)) {
							e = e.message + "\n" + e.stack;
						}
						throw $injectorMinErr("modulerr", "Failed to instantiate module {0} due to:\n{1}", module, e.stack || e.message || e)
					}
				}
			});
			return runBlocks;
		}

		function createInternalInjector(cache, factory) {
			function getService(serviceName) {//引用了第一个参数cache,形成闭包
				if (cache.hasOwnProperty(serviceName)) {//如果instanceCache(实例服务对象)有(即cache有这个属性
					if (cache[serviceName] === INSTANTIATING) { //这个对象是个空对象
						//抛出类似Error: [$injector:cdep] Unknown provider: $xxxProvider <- $xxx的异常,这里是实例化失败的provider创建的空服务对象
						throw $injectorMinErr("cdep", "Circular dependency found: {0}", path.join(" <- "));
					}
					return cache[serviceName]; //如果instanceCache有就直接拿
				}
				//如果instanceCache(实例服务对象)没有
				try {
					path.unshift(serviceName); //serviceName放入path里面作为第一个元素,保持实例化的一致性
					cache[serviceName] = INSTANTIATING;//缓存起来
					console.log("instanceCache length :" + cache.getLength());
					return cache[serviceName] = factory(serviceName);//获取服务,引用第二个参数(去providerCache里面拿provider实例化服务)
				} finally {
					path.shift();
				}
			}

			var cout = 1;

			function invoke(fn, self, locals) {
				console.log("invoke(fn, self, locals)-" + (getName(fn) || "null") + "--current self " + self + "--" + cout++);
				console.log(self && self['$get']);
				var length, i, key, args = [], $inject = annotate(fn);  //引用了annotate,获取参数数组,里面分析了三种注入解析注入参数的方式
				length = $inject.length;
				for (i = 0; i < length; i++) {
					key = $inject[i];
					if ("string" != typeof key) {
						throw $injectorMinErr("itkn", "Incorrect injection token! Expected service name as string, got {0}", key);
					}
					if (locals && locals.hasOwnProperty(key)) { //locals
						args.push(locals[key]);
					} else {
						args.push(getService(key));//获取服务对象放入args备用
					}
				}
				if (!fn.$inject) { //对于没有$inject属性的,那是因为fn是一个数组,最后一个是函数
					fn = fn[length]; //fn定为最后一个函数
				}
				//处理后的fn是一个函数
				switch (self ? -1 : args.length) { //self是Constructor {}创建的实例,
					case 0:
						return fn();
					case 1:
						return fn(args[0]); //一个依赖
					case 2:
						return fn(args[0], args[1]);//二个依赖
					case 3:
						return fn(args[0], args[1], args[2]);//三个依赖
					case 4:
						return fn(args[0], args[1], args[2], args[3]);//.....
					case 5:
						return fn(args[0], args[1], args[2], args[3], args[4]);
					case 6:
						return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
					case 7:
						return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
					case 8:
						return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
					case 9:
						return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
					case 10:
						return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
					default:
						return fn.apply(self, args); //实例化服务,self是Constructor{}对象,fn通常是函数,里面有this.$get=fn或者是数组
				}
			}

			function instantiate(Type, locals) {
				var instance,
					returnedValue,
					Constructor = function () {
					};
				if (isArray(Type)) { //如果是数组的话,拿最后一个元素(是函数)的prototype
					Constructor.prototype = (Type[Type.length - 1]).prototype;
				}
				Constructor.prototype = Type.prototype;
				instance = new Constructor; //实例化服务,服务都是对象,统一的构造函数,不同的原型
				returnedValue = invoke(Type, instance, locals);//这里invoke都有instance
				return isObject(returnedValue) || isFunction(returnedValue) ? returnedValue : instance; //是对象或是函数
			}

			return {//该对象是injector
				invoke: invoke,
				instantiate: instantiate,
				get: getService,//获取服务
				annotate: annotate,//获取待注入函数的参数
				has: function (name) {
					return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name)
				}
			};
		}

		var INSTANTIATING = {},
			providerSuffix = "Provider",
			path = [],
			loadedModules = new HashMap, //一个hash对象，用来存储已经加载过的模块
			providerCache = { //内置服务缓存
				$provide: { //第一个服务,该服务只位于缓存
					provider: supportObject(provider),
					factory: supportObject(factory),
					service: supportObject(service),
					value: supportObject(value),
					constant: supportObject(constant),
					decorator: decorator
				}
			};
		//创建一个内部的注册器实例对象，它跟下面的注册器实例对象拥有相同的方法，只是它们操作的参数不一样，
		// 这个操作的是providerCache和抛出错误的回调函数。*这里的$injector是第二个服务,
		//providerCache存储了所有的Provider(httpProvider,controllerProvider,compileProvider...)，含有$get属性的对象
		var providerInjector = providerCache.$injector = createInternalInjector(providerCache,
			function () {
				//抛出类似Error: [$injector:unpr] Unknown provider: $parsexProvider <- $parsex的异常
				throw $injectorMinErr("unpr", "Unknown provider: {0}", path.join(" <- "))
			}),
			instanceCache = {};
		//创建一个内部的注册器实例对象，并返回此注册器实例对象，此对象有几个方法，它的这几个方法里面有引用你
		// 通过createInternalInjector传进去的参数，因此，形成了闭包。
		// instanceCache存储实例化后的服务,没有$get属性的对象
		var instanceInjector = instanceCache.$injector = createInternalInjector(instanceCache,
			function (servicename) { //在实例中找不到时，会+后缀Provider继续在providerCache缓存中寻找
				var provider = providerInjector.get(servicename + providerSuffix);//加上后缀Provider,get =>getService
				return instanceInjector.invoke(provider.$get, provider);//这里使用providercache里面的$xxxxProvider实例化,并返回
			});
		var runBlocks = loadModules(modulesToLoad);
		/*加载初始化的模块*/
		forEach(runBlocks, function (fn) { //运行队列
			instanceInjector.invoke(fn || noop);
		});
		return instanceInjector;//返回注册器实例对象
	}

	function $AnchorScrollProvider() {
		var autoScrollingEnabled = !0;
		this.disableAutoScrolling = function () {
			autoScrollingEnabled = !1
		};
		this.$get = ["$window", "$location", "$rootScope",
			function ($window, $location, $rootScope) {
				function getFirstAnchor(list) {
					var result = null;
					forEach(list, function (element) {
						if (result || "a" !== lowercase(element.nodeName)) {
							result = element;
						}
					});
					return result;
				}

				function scroll() {
					var elm, hash = $location.hash();
					if (!hash) {
						$window.scrollTo(0, 0);
					} else if ((elm = document.getElementById(hash))) {
						elm.scrollIntoView();
					} else if ((elm = getFirstAnchor(document.getElementsByName(hash)))) {
						elm.scrollIntoView();

					} else if (hash === 'top') {
						$window.scrollTo(0, 0);
					}
				}

				var document = $window.document;
				if (autoScrollingEnabled) {
					$rootScope.$watch(function () {
						return $location.hash()
					}, function () {
						$rootScope.$evalAsync(scroll)
					});
				}

				return scroll;
			}
		]
	}

	function Browser(window, document, $log, $sniffer) {
		function completeOutstandingRequest(fn) {
			try {
				fn.apply(null, sliceArgs(arguments, 1))
			} finally {
				outstandingRequestCount--;
				if (0 === outstandingRequestCount)
					while (outstandingRequestCallbacks.length) {
						try {
							outstandingRequestCallbacks.pop()()
						} catch (e) {
							$log.error(e)
						}
					}
			}
		}

		function startPoller(interval, setTimeout) {
			!function check() {
				forEach(pollFns, function (pollFn) {
					pollFn()
				});
				pollTimeout = setTimeout(check, interval);
			}()
		}

		function fireUrlChange() {
			newLocation = null;
			if (lastBrowserUrl != self.url()) {
				lastBrowserUrl = self.url();
				forEach(urlChangeListeners, function (listener) {
					listener(self.url())
				});
			}
		}

		var self = this,
			rawDocument = document[0],
			location = window.location,
			history = window.history,
			setTimeout = window.setTimeout,
			clearTimeout = window.clearTimeout,
			pendingDeferIds = {};
		self.isMock = !1;
		var outstandingRequestCount = 0,
			outstandingRequestCallbacks = [];
		self.$$completeOutstandingRequest = completeOutstandingRequest;
		self.$$incOutstandingRequestCount = function () {
			outstandingRequestCount++
		};
		self.notifyWhenNoOutstandingRequests = function (callback) {
			forEach(pollFns, function (pollFn) {
				pollFn()
			});
			if (outstandingRequestCount === 0) {
				callback();
			} else {
				outstandingRequestCallbacks.push(callback);
			}
		};
		var pollTimeout, pollFns = [];
		self.addPollFn = function (fn) {
			if (isUndefined(pollTimeout)) {
				startPoller(100, setTimeout);
			}
			pollFns.push(fn);
			return fn;
		};
		var lastBrowserUrl = location.href,
			baseElement = document.find("base"),
			newLocation = null;
		self.url = function (url, replace) {
			if (location !== window.location) {
				location = window.location;
			}
			if (url) {
				if (lastBrowserUrl == url) return;
				lastBrowserUrl = url;
				if ($sniffer.history) {
					if (replace) {
						history.replaceState(null, "", url)
					} else {
						history.pushState(null, "", url), baseElement.attr("href", baseElement.attr("href"))
					}
				} else {
					newLocation = url;
					if (replace) {
						location.replace(url)
					} else {
						location.href = url;
					}
				}
				return self;
			} else if (newLocation) {
				return newLocation;
			} else {
				return location.href.replace(/%27/g, "'");
			}
		};
		var urlChangeListeners = [],
			urlChangeInit = !1;
		self.onUrlChange = function (callback) {
			if (!urlChangeInit) {
				$sniffer.history && jqLite(window).on("popstate", fireUrlChange);
				if ($sniffer.hashchange) {
					jqLite(window).on("hashchange", fireUrlChange);
				} else {
					self.addPollFn(fireUrlChange);
				}
				urlChangeInit = !0;
			}
			urlChangeListeners.push(callback)
			return callback;
		};
		self.baseHref = function () {
			var href = baseElement.attr("href");
			if (href) {
				return href.replace(/^https?\:\/\/[^\/]*/, "");
			}
			return "";
		};
		var lastCookies = {}, lastCookieString = "", cookiePath = self.baseHref();
		self.cookies = function (name, value) {
			var cookieLength, cookieArray, cookie, i, index;
			if (!name) {
				if (rawDocument.cookie !== lastCookieString) {
					lastCookieString = rawDocument.cookie, cookieArray = lastCookieString.split("; "), lastCookies = {}, i = 0;
					for (; i < cookieArray.length; i++) {
						cookie = cookieArray[i];
						index = cookie.indexOf("=");
						if (index > 0) {
							name = unescape(cookie.substring(0, index));
							if (lastCookies[name] === undefined) {
								lastCookies[name] = unescape(cookie.substring(index + 1));
							}
						}
					}
				}
				return lastCookies
			}
			if (value === undefined) {
				rawDocument.cookie = escape(name) + "=;path=" + cookiePath + ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
			} else {
				if (isString(value)) {
					cookieLength = (rawDocument.cookie = escape(name) + "=" + escape(value) + ";path=" + cookiePath).length + 1;
					if (cookieLength > 4096) {
						$log.warn("Cookie '" + name + "' possibly not set or overflowed because it was too large (" +
							cookieLength + " > 4096 bytes)!");
					}
				}
			}
		};
		self.defer = function (fn, delay) {
			var timeoutId;
			outstandingRequestCount++;
			timeoutId = setTimeout(function () {
				delete pendingDeferIds[timeoutId];
				completeOutstandingRequest(fn);
			}, delay || 0);
			pendingDeferIds[timeoutId] = !0;
			return timeoutId;
		};
		self.defer.cancel = function (deferId) {
			if (pendingDeferIds[deferId]) {
				delete pendingDeferIds[deferId];
				clearTimeout(deferId);
				completeOutstandingRequest(noop);
				return !0;
			} else {
				return !1;
			}
		}
	}

	function $BrowserProvider() {
		this.$get = ["$window", "$log", "$sniffer", "$document",
			function ($window, $log, $sniffer, $document) {
				return new Browser($window, $document, $log, $sniffer)
			}
		]
	}

	function $CacheFactoryProvider() {
		this.$get = function () {
			var caches = {};
			cacheFactory.info = function () {
				var info = {};
				forEach(caches, function (cache, cacheId) {
					info[cacheId] = cache.info()
				});
				return info;
			};
			cacheFactory.get = function (cacheId) {
				return caches[cacheId];
			};
			return cacheFactory;

			function cacheFactory(cacheId, options) { //工厂函数
				function refresh(entry) {
					if (entry != freshEnd) {
						if (staleEnd) {
							staleEnd == entry && (staleEnd = entry.n)
						} else {
							staleEnd = entry
						}
						link(entry.n, entry.p);
						link(entry, freshEnd);
						freshEnd = entry;
						freshEnd.n = null;
					}
				}

				function link(nextEntry, prevEntry) {
					if (nextEntry != prevEntry) {
						nextEntry && (nextEntry.p = prevEntry);
						prevEntry && (prevEntry.n = nextEntry);
					}
				}

				if (cacheId in caches) {
					throw minErr("$cacheFactory")("iid", "CacheId '{0}' is already taken!", cacheId);
				}
				var size = 0,
					stats = extend({}, options, {id: cacheId}),
					data = {},
					capacity = options && options.capacity || Number.MAX_VALUE,
					lruHash = {},
					freshEnd = null,
					staleEnd = null;
				return caches[cacheId] = { //产生一个hashmap
					put: function (key, value) {
						var lruEntry = lruHash[key] || (lruHash[key] = {
								key: key
							});
						refresh(lruEntry);
						if (isUndefined(value)) {
							return void 0;
						} else {
							key in data || size++;
							data[key] = value;
							if (size > capacity) {
								this.remove(staleEnd.key);
							}
							return value;
						}
					},
					get: function (key) {
						var lruEntry = lruHash[key];
						if (lruEntry) {
							refresh(lruEntry);
							return data[key];
						}
					},
					remove: function (key) {
						var lruEntry = lruHash[key];
						if (lruEntry) {
							lruEntry == freshEnd && (freshEnd = lruEntry.p);
							lruEntry == staleEnd && (staleEnd = lruEntry.n);
							link(lruEntry.n, lruEntry.p);
							delete lruHash[key];
							delete data[key];
							size--;
						}
					},
					removeAll: function () {
						data = {};
						size = 0;
						lruHash = {};
						freshEnd = staleEnd = null;
					},
					destroy: function () {
						data = null;
						stats = null;
						lruHash = null;
						delete caches[cacheId];
					},
					info: function () {
						return extend({}, stats, {
							size: size
						})
					}
				};
			}
		}
	}

	function $TemplateCacheProvider() {
		this.$get = ["$cacheFactory",
			function ($cacheFactory) {
				return $cacheFactory("templates")
			}
		]
	}

	function $CompileProvider($provide) {
		var hasDirectives = {}, //存在的指令
			Suffix = "Directive", //后缀
			COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\d\w\-_]+)\s+(.*)$/, //匹配注释指令写法
			CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/, //class指令写法
			aHrefSanitizationWhitelist = /^\s*(https?|ftp|mailto|tel|file):/,  //匹配协议头
			imgSrcSanitizationWhitelist = /^\s*(https?|ftp|file):|data:image\//,  //匹配图片协议头
			EVENT_HANDLER_ATTR_REGEXP = /^(on[a-z]+|formaction)$/;
		this.directive = function registerDirective(name, directiveFactory) { //注册指令
			assertNotHasOwnProperty(name, "directive");
			if (isString(name)) { //是字符串
				assertArg(directiveFactory, "directiveFactory"); //是函数吗?
				// 如果该指令还没有任何一个指令工厂
				if (!hasDirectives.hasOwnProperty(name)) { //hasDirectives这里面没有name属性时处理
					hasDirectives[name] = []; //相同名字的指令存储在一个数组里面,这里说明了一个名字可以对应多个指令
					console.log(name + Suffix);
					// 将该指令注册为服务，也就是说当我们通过$injector服务来获取该服务返回的指令对象集合（注意：是有缓存的单例哦
					$provide.factory(name + Suffix, ["$injector", "$exceptionHandler",//加上后缀"Directive",注册指令服务
						function ($injector, $exceptionHandler) {
							// 指令对象集合
							var directives = [];
							// 循环遍历指令工厂集合，并收集每个工厂函数返回的指令对象
							forEach(hasDirectives[name], function (directiveFactory, index) {
								try {
									// 调用工厂函数，注意这里用的是$injector，所以工厂函数也可以是一个拥有依赖注入的函数或数组
									var directive = $injector.invoke(directiveFactory);//这里指令invoke的第二个参数self都是没有的
									if (isFunction(directive)) {
										directive = {
											compile: valueFn(directive) //执行valueFn该函数封装 了一个返回匿名函数,该函数返回传进去的参数
										}
									} else if (!directive.compile && directive.link) {
										directive.compile = valueFn(directive.link);
									}
									directive.priority = directive.priority || 0;//默认级别
									directive.index = index;
									directive.name = directive.name || name;
									directive.require = directive.require || directive.controller && directive.name;
									directive.restrict = directive.restrict || "A";//默认为A类指令
									directives.push(directive);
								} catch (e) {
									$exceptionHandler(e)
								}
							});
							return directives;
						}
					]);
				}
				// 存储当前指令工厂
				hasDirectives[name].push(directiveFactory);
			} else { //不是字符串(是对象),循环对象所有属性,执行registerDirective,这里用来注册多个指令挂在一个对象上的情况
				forEach(name, reverseParams(registerDirective));
			}
			// 提供链式调用
			return this;
		};
		this.aHrefSanitizationWhitelist = function (regexp) { //设置 aHrefSanitizationWhitelist
			if (isDefined(regexp)) {
				aHrefSanitizationWhitelist = regexp;
				return this;
			}
			return aHrefSanitizationWhitelist;
		};
		this.imgSrcSanitizationWhitelist = function (regexp) { //设置 imgSrcSanitizationWhitelist
			if (isDefined(regexp)) {
				imgSrcSanitizationWhitelist = regexp;
				return this;
			}
			return imgSrcSanitizationWhitelist;
		};
		this.$get = ["$injector", "$interpolate", "$exceptionHandler", "$http", "$templateCache", "$parse", "$controller", "$rootScope", "$document", "$sce", "$animate",
			function ($injector, $interpolate, $exceptionHandler, $http, $templateCache, $parse, $controller, $rootScope, $document, $sce, $animate) {
				var Attributes = function (element, attr) {
					this.$$element = element;
					this.$attr = attr || {};
				};
				Attributes.prototype = {
					$normalize: directiveNormalize,
					$addClass: function (classVal) {
						if (classVal && classVal.length > 0) {
							$animate.addClass(this.$$element, classVal);
						}
					},
					$removeClass: function (classVal) {
						if (classVal && classVal.length > 0) {
							$animate.removeClass(this.$$element, classVal);
						}
					},
					$set: function (key, value, writeAttr, attrName) {
						function tokenDifference(str1, str2) {
							var values = [],
								tokens1 = str1.split(/\s+/),
								tokens2 = str2.split(/\s+/);
							outer: for (var i = 0; i < tokens1.length; i++) {
								for (var token = tokens1[i], j = 0; j < tokens2.length; j++)
									if (token == tokens2[j]) continue outer;
								values.push(token)
							}
							return values
						}

						if ("class" == key) {
							value = value || "";
							var current = this.$$element.attr("class") || "";
							this.$removeClass(tokenDifference(current, value).join(" "));
							this.$addClass(tokenDifference(value, current).join(" "))
						} else {
							var normalizedVal,
								nodeName,
								booleanKey = getBooleanAttrName(this.$$element[0], key);
							if (booleanKey) {
								this.$$element.prop(key, value);
								attrName = booleanKey;
							}
							this[key] = value;
							if (attrName) {
								this.$attr[key] = attrName;
							} else {
								attrName = this.$attr[key];
								if (!attrName) {
									this.$attr[key] = attrName = snake_case(key, "-");
								}
							}
							nodeName = nodeName_(this.$$element);
							if (("A" === nodeName && "href" === key || "IMG" === nodeName && "src" === key)) {
								if ((!msie || msie >= 8)) {
									normalizedVal = urlResolve(value).href;
									if ("" !== normalizedVal) {
										if ("href" === key && !normalizedVal.match(aHrefSanitizationWhitelist) || "src" === key && !normalizedVal.match(imgSrcSanitizationWhitelist)) {
											this[key] = value = "unsafe:" + normalizedVal;
										}
									}
								}
							}

							if (writeAttr !== !1) {
								if (null === value || value === undefined) {
									this.$$element.removeAttr(attrName);
								} else {
									this.$$element.attr(attrName, value);
								}
							}
						}
						var $$observers = this.$$observers;
						if ($$observers) {
							forEach($$observers[key], function (fn) {
								try {
									fn(value)
								} catch (e) {
									$exceptionHandler(e)
								}
							});
						}
					},
					$observe: function (key, fn) {
						var attrs = this,
							$$observers,
							listeners;
						if (attrs.$$observers) {
							$$observers = attrs.$$observers;
						} else {
							$$observers = attrs.$$observers = {};
						}
						if ($$observers[key]) {
							listeners = $$observers[key];
						} else {
							listeners = $$observers[key] = [];
						}
						listeners.push(fn);
						$rootScope.$evalAsync(function () {
							if (!listeners.$$inter) {
								fn(attrs[key]);
							}
						});
						return fn;
					}
				};
				var startSymbol = $interpolate.startSymbol(), denormalizeTemplate,
					endSymbol = $interpolate.endSymbol(), NG_ATTR_BINDING = /^ngAttr[A-Z]/;
				if ("{{" == startSymbol || "}}" == endSymbol) {
					denormalizeTemplate = identity;
				} else {
					denormalizeTemplate = function (template) {
						return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol)
					}
				}
				return compile;
				//$compile 用法：
				//$compile(element.content(),transcludeFn,maxPriority,ignoreDirective,previousCompileContext)($scope);
				//$compile就是下面的函数
				function compile($compileNodes, transcludeFn, maxPriority, ignoreDirective, previousCompileContext) {
					if (!$compileNodes instanceof jqLite) {
						$compileNodes = jqLite($compileNodes);
					}
					forEach($compileNodes, function (node, index) { //处理文本结点,使用span包裹
						if (3 == node.nodeType && node.nodeValue.match(/\S+/)) { //3	Text	代表元素或属性中的文本内容
							$compileNodes[index] = node = jqLite(node).wrap("<span></span>").parent()[0];
						}
					});
					//指令编译期(对每一个节点递归式调用compileNodes函数)
					var compositeLinkFn = compileNodes($compileNodes, transcludeFn, $compileNodes, maxPriority, ignoreDirective, previousCompileContext);
					//$compile(element.content())($scope,cloneConnectFn,transcludeControllers);
					return function (scope, cloneConnectFn, transcludeControllers) {
						var $linkNode;
						assertArg(scope, "scope");
						if (cloneConnectFn) {
							$linkNode = JQLitePrototype.clone.call($compileNodes);
						} else {
							$linkNode = $compileNodes;
						}
						forEach(transcludeControllers, function (instance, name) {
							$linkNode.data("$" + name + "Controller", instance);
						});
						for (var i = 0, ii = $linkNode.length; i < ii; i++) {
							var node = $linkNode[i];
							if ((1 == node.nodeType || 9 == node.nodeType)) { //1	Element	代表元素,9	Document	代表整个文档（DOM 树的根节点）。
								$linkNode.eq(i).data("$scope", scope); //给结点添加data数据(scope)
							}
						}
						safeAddClass($linkNode, "ng-scope"); //添加class ng-scope
						if (cloneConnectFn) {
							cloneConnectFn($linkNode, scope);
						}
						if (compositeLinkFn) { //进入指令 链接期
							compositeLinkFn(scope, $linkNode, $linkNode);
						}
						return $linkNode;
					}
				}

				function safeAddClass($element, className) {
					try {
						$element.addClass(className);
					} catch (e) {
					}
				}

				function compileNodes(nodeList, transcludeFn, $rootElement, maxPriority, ignoreDirective, previousCompileContext) {
					function compositeLinkFn(scope, nodeList, $rootElement, boundTranscludeFn) {
						//指令链接期(递归式调用该函数)
						var nodeLinkFn, childLinkFn, node, $node, childScope, childTranscludeFn, i, ii, n, stableNodeList = [];
						for (i = 0, ii = nodeList.length; ii > i; i++) {
							stableNodeList.push(nodeList[i]);
						}
						for (i = 0, n = 0, ii = linkFns.length; ii > i; n++) {
							node = stableNodeList[n];
							nodeLinkFn = linkFns[i++];
							childLinkFn = linkFns[i++];
							$node = jqLite(node);
							if (nodeLinkFn) {
								if (nodeLinkFn.scope) {
									childScope = scope.$new();
									$node.data("$scope", childScope);
									safeAddClass($node, "ng-scope");
								} else {
									childScope = scope;
								}
								childTranscludeFn = nodeLinkFn.transclude;
								if (childTranscludeFn || !boundTranscludeFn && transcludeFn) {
									nodeLinkFn(childLinkFn, childScope, node, $rootElement, createBoundTranscludeFn(scope, childTranscludeFn || transcludeFn))
								} else {
									//preLink+postLink
									nodeLinkFn(childLinkFn, childScope, node, undefined, boundTranscludeFn);
								}
							} else {
								if (childLinkFn) {
									childLinkFn(scope, node.childNodes, undefined, boundTranscludeFn);
								}
							}
						}
					}

					//对每一个节点列表(nodeList)定义一下linkFns空数组,directives={},attrs=new Attributes()
					var nodeLinkFn, childLinkFn, directives, attrs, linkFnFound, linkFns = [], i = 0, _maxPriority;
					for (; i < nodeList.length; i++) {
						attrs = new Attributes;
						if (0 === i) {
							_maxPriority = maxPriority;
						}
						//收集该节点上的所有指令
						directives = collectDirectives(nodeList[i], [], attrs, _maxPriority, ignoreDirective);
						if (directives.length) { //应用指令对当前节点
							nodeLinkFn = applyDirectivesToNode(directives, nodeList[i], attrs, transcludeFn, $rootElement, null, [], [], previousCompileContext);
						} else {
							nodeLinkFn = null;
						}
						//忽略了节点的link函数的情况(节点设置了terminal属性或没有子节点，或子节点长度为0，子节点的不编译了)
						if (nodeLinkFn && nodeLinkFn.terminal || !nodeList[i].childNodes || !nodeList[i].childNodes.length) {
							childLinkFn = null;
						} else { //编译子节点,返回linkFn
							childLinkFn = compileNodes(nodeList[i].childNodes, nodeLinkFn ? nodeLinkFn.transclude : transcludeFn);
						}
						linkFns.push(nodeLinkFn);
						linkFns.push(childLinkFn); //childLinkFn is function compositeLinkFn
						linkFnFound = linkFnFound || nodeLinkFn || childLinkFn;
						previousCompileContext = null;
					}
					if (linkFnFound) {
						return compositeLinkFn;
					}
					return null;
				}

				function createBoundTranscludeFn(scope, transcludeFn) {
					return function (transcludedScope, cloneFn, controllers) {
						var scopeCreated = !1;
						if (!transcludedScope) {
							transcludedScope = scope.$new();
							transcludedScope.$$transcluded = !0;
							scopeCreated = !0;
						}
						var clone = transcludeFn(transcludedScope, cloneFn, controllers);
						if (scopeCreated) {
							clone.on("$destroy", bind(transcludedScope, transcludedScope.$destroy));
						}
						return clone;
					}
				}

				function collectDirectives(node, directives, attrs, maxPriority, ignoreDirective) {
					var match, className, nodeType = node.nodeType, attrsMap = attrs.$attr;
					switch (nodeType) {
						case 1: //E(元素) <my-directive></my-directive>
							addDirective(directives, directiveNormalize(nodeName_(node).toLowerCase()), "E", maxPriority, ignoreDirective);//添加元素节点指令
							var attr, name, nName, ngAttrName, value, nAttrs = node.attributes;
							for (var j = 0, jj = nAttrs && nAttrs.length; jj > j; j++) { //查找元素上的属性指令
								var attrStartName = false, attrEndName = false;
								attr = nAttrs[j];
								if (!msie || msie >= 8 || attr.specified) {
									name = attr.name;
									ngAttrName = directiveNormalize(name);
									if (NG_ATTR_BINDING.test(ngAttrName)) {
										name = snake_case(ngAttrName.substr(6), "-")
									}
									var directiveNName = ngAttrName.replace(/(Start|End)$/, "");
									if (ngAttrName === directiveNName + "Start") {
										attrStartName = name;
										attrEndName = name.substr(0, name.length - 5) + "end";
										name = name.substr(0, name.length - 6);
									}
									nName = directiveNormalize(name.toLowerCase());
									attrsMap[nName] = name;
									attrs[nName] = value = trim(msie && "href" == name ? decodeURIComponent(node.getAttribute(name, 2)) : attr.value);
									if (getBooleanAttrName(node, nName)) {
										attrs[nName] = true;
									}
									addAttrInterpolateDirective(node, directives, value, nName);
									//A(属性,默认值),<div my-directive="expression"></div>
									addDirective(directives, nName, "A", maxPriority, ignoreDirective, attrStartName, attrEndName);//添加属性A指令
								}
							}
							className = node.className;
							if (isString(className) && "" !== className)
								for (; match = CLASS_DIRECTIVE_REGEXP.exec(className);) {
									nName = directiveNormalize(match[2]);
									//C(类名).<div class="my-directive:expression;"></div>
									if (addDirective(directives, nName, "C", maxPriority, ignoreDirective)) { //添加Class(C类)指令
										attrs[nName] = trim(match[3]);
									}
									className = className.substr(match.index + match[0].length);
								}
							break;
						case 3: //文本节点
							addTextInterpolateDirective(directives, node.nodeValue);
							break;
						case 8: //M(注释) <--directive:my-directive expression-->
							try {
								match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue);
								if (match) {
									nName = directiveNormalize(match[1]);
									if (addDirective(directives, nName, "M", maxPriority, ignoreDirective)) { //添加Comment(M类)指令
										attrs[nName] = trim(match[2]);
									}
								}
							} catch (e) {
							}
					}
					directives.sort(byPriority);
					return directives;
				}

				function groupScan(node, attrStart, attrEnd) {
					var nodes = [],
						depth = 0;
					if (attrStart && node.hasAttribute && node.hasAttribute(attrStart)) {
						do {
							if (!node) {
								throw $compileMinErr("uterdir", "Unterminated attribute, found '{0}' but no matching '{1}' found.", attrStart, attrEnd);
							}
							if (1 == node.nodeType) {
								node.hasAttribute(attrStart) && depth++;
								node.hasAttribute(attrEnd) && depth--;
							}
							nodes.push(node);
							node = node.nextSibling;
						} while (depth > 0)
					} else nodes.push(node);
					return jqLite(nodes)
				}

				function groupElementsLinkFnWrapper(linkFn, attrStart, attrEnd) {
					return function (scope, element, attrs, controllers, transcludeFn) {
						element = groupScan(element[0], attrStart, attrEnd);
						return linkFn(scope, element, attrs, controllers, transcludeFn);
					}
				}

				function applyDirectivesToNode(directives, compileNode, templateAttrs, transcludeFn, jqCollection, originalReplaceDirective, preLinkFns, postLinkFns, previousCompileContext) {

					previousCompileContext = previousCompileContext || {};//templateUrl存在的时候，该对象有意义
					var newScopeDirective,
						directive,
						directiveName,
						$template,
						linkFn,
						directiveValue,
						terminalPriority = -Number.MAX_VALUE, //指令终止编译优先级
					//下面4个变量默认为undefined
						controllerDirectives = previousCompileContext.controllerDirectives, //controller
						newIsolateScopeDirective = previousCompileContext.newIsolateScopeDirective, //前一个编译的独立scope
						templateDirective = previousCompileContext.templateDirective, //前一个编译的模板template指令
						nonTlbTranscludeDirective = previousCompileContext.nonTlbTranscludeDirective,//前一个编译的transclude指令

						hasTranscludeDirective = false,
						hasElementTranscludeDirective = false,
						$compileNode = templateAttrs.$$element = jqLite(compileNode),
						replaceDirective = originalReplaceDirective,
						childTranscludeFn = transcludeFn;
					//处理该节点上的所有指令
					for (var i = 0, ii = directives.length; ii > i; i++) {
						directive = directives[i];
						var attrStart = directive.$$start, attrEnd = directive.$$end;
						if (attrStart) { //区域指令 my-directive-start/end
							$compileNode = groupScan(compileNode, attrStart, attrEnd);
						}
						$template = undefined;
						//因为指令优先级是从大到小，这里判断指令优先级低于终止优先级,不处理剩下的指令
						if (terminalPriority > directive.priority) {
							break;
						}
						directiveValue = directive.scope;
						if (directiveValue) {
							newScopeDirective = newScopeDirective || directive;
							if (directive.templateUrl) {
								//同一节点，多个指令的情况
								assertNoDuplicate("new/isolated scope", newIsolateScopeDirective, directive, $compileNode);
								if (isObject(directiveValue)) {
									newIsolateScopeDirective = directive;
								}
							}
						}
						directiveName = directive.name;
						if (!directive.templateUrl && directive.controller) {//没有templateUrl,有controller,设置controller
							directiveValue = directive.controller;
							controllerDirectives = controllerDirectives || {};
							//同一节点，多个指令的情况
							assertNoDuplicate("'" + directiveName + "' controller", controllerDirectives[directiveName], directive, $compileNode);
							controllerDirectives[directiveName] = directive;
						}
						directiveValue = directive.transclude;
						if (directiveValue) { //子节点作为嵌入的情况:transclude:true or "element"
							hasTranscludeDirective = true;
							if (!directive.$$tlb) { //$$tlb就是用来指定在compile的时候不要check同一个元素被多次transclude
								assertNoDuplicate("transclusion", nonTlbTranscludeDirective, directive, $compileNode);
								nonTlbTranscludeDirective = directive;
							}
							//如果指令的transclude属性设置为字符串“element”时，则会用注释comment替换当前元素节点，再重新编译原先的DOM节点，
							if ("element" == directiveValue) { //transclude :"element"
								hasElementTranscludeDirective = true;
								terminalPriority = directive.priority;
								$template = groupScan(compileNode, attrStart, attrEnd);
								$compileNode = templateAttrs.$$element = jqLite(document.createComment(" " + directiveName + ": " + templateAttrs[directiveName] + " "));
								compileNode = $compileNode[0];
								replaceWith(jqCollection, jqLite(sliceArgs($template)), compileNode);
								//重新编译新的模板
								childTranscludeFn = compile($template, transcludeFn, terminalPriority, replaceDirective && replaceDirective.name, {
									nonTlbTranscludeDirective: nonTlbTranscludeDirective
								});
							} else {
								// 而如果transclude设置为默认的true时，则会继续编译其子节点，并通过transcludeFn传递编译后的DOM对象，完成用户自定义的DOM处理。
								$template = jqLite(jqLiteClone(compileNode)).contents();
								$compileNode.html("");
								childTranscludeFn = compile($template, transcludeFn);
							}
						}
						if (directive.template) { //html模板
							assertNoDuplicate("template", templateDirective, directive, $compileNode);
							templateDirective = directive;
							if (isFunction(directive.template)) { //is function
								directiveValue = directive.template($compileNode, templateAttrs);//获取返回值
							} else {
								directiveValue = directive.template;
							}
							directiveValue = denormalizeTemplate(directiveValue);
							if (directive.replace) { //是否替换
								replaceDirective = directive;
								$template = jqLite("<div>" + trim(directiveValue) + "</div>").contents(); //构建新的模板
								compileNode = $template[0];
								if (1 != $template.length || 1 !== compileNode.nodeType) {
									throw $compileMinErr("tplrt", "Template for directive '{0}' must have exactly one root element. {1}", directiveName, "");
								}
								replaceWith(jqCollection, $compileNode, compileNode);
								var newTemplateAttrs = {
										$attr: {}
									}, /*替换后需要重新收集指令*/
									templateDirectives = collectDirectives(compileNode, [], newTemplateAttrs),
									unprocessedDirectives = directives.splice(i + 1, directives.length - (i + 1));//分割指令并保存后面的指令，后面合并
								if (newIsolateScopeDirective) {
									markDirectivesAsIsolate(templateDirectives);
								}
								//模板里面的指令收集添加到directives([])中
								directives = directives.concat(templateDirectives).concat(unprocessedDirectives);
								//合并属性
								mergeTemplateAttributes(templateAttrs, newTemplateAttrs);
								//更新指令的长度
								ii = directives.length;
							} else {//直接嵌入作为子节点
								$compileNode.html(directiveValue);
							}
						}
						if (directive.templateUrl) { //template url
							assertNoDuplicate("template", templateDirective, directive, $compileNode);
							templateDirective = directive;
							if (directive.replace) {
								replaceDirective = directive;
							}
							//url
							nodeLinkFn = compileTemplateUrl(
								directives.splice(i, directives.length - i),
								$compileNode,
								templateAttrs,
								jqCollection,
								childTranscludeFn,
								preLinkFns,
								postLinkFns, {
									controllerDirectives: controllerDirectives,
									newIsolateScopeDirective: newIsolateScopeDirective,
									templateDirective: templateDirective,
									nonTlbTranscludeDirective: nonTlbTranscludeDirective
								});
							ii = directives.length;
						} else if (directive.compile) { //如果指令 存在compile function
							try {
								linkFn = directive.compile($compileNode, templateAttrs, childTranscludeFn); //执行编译函数
								if (isFunction(linkFn)) { //函数
									addLinkFns(null, linkFn, attrStart, attrEnd);
								} else if (linkFn) {//对象
									addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd);
								}
							} catch (e) {
								$exceptionHandler(e, startingTag($compileNode))
							}
						}
						if (directive.terminal) { //忽略其它指令设置终止优先级
							nodeLinkFn.terminal = true;
							terminalPriority = Math.max(terminalPriority, directive.priority);
						}
					}
					nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope === !0;
					nodeLinkFn.transclude = hasTranscludeDirective && childTranscludeFn;
					return nodeLinkFn;

					function addLinkFns(pre, post, attrStart, attrEnd) {
						if (pre) {
							if (attrStart) {
								pre = groupElementsLinkFnWrapper(pre, attrStart, attrEnd);
							}
							pre.require = directive.require;
							if ((newIsolateScopeDirective === directive || directive.$$isolateScope)) {
								pre = cloneAndAnnotateFn(pre, {
									isolateScope: !0
								});
							}
							preLinkFns.push(pre);
						}
						if (post) {
							if (attrStart) {
								post = groupElementsLinkFnWrapper(post, attrStart, attrEnd);
							}
							post.require = directive.require;
							if ((newIsolateScopeDirective === directive || directive.$$isolateScope)) {
								post = cloneAndAnnotateFn(post, {
									isolateScope: !0
								});
							}
							postLinkFns.push(post);
						}
					}

					function getControllers(require, $element, elementControllers) {
						var value, retrievalMethod = "data",
							optional = !1;
						if (isString(require)) {
							for (; "^" == (value = require.charAt(0)) || "?" == value;) {
								require = require.substr(1);
								if ("^" == value) {
									retrievalMethod = "inheritedData";
								}
								optional = optional || "?" == value;
							}
							value = null;
							if (elementControllers && "data" === retrievalMethod) {
								value = elementControllers[require];
							}
							if (!value) {
								value = $element[retrievalMethod]("$" + require + "Controller");
							}
							if (!value && !optional) {
								throw $compileMinErr("ctreq", "Controller '{0}', required by directive '{1}', can't be found!", require, directiveName);
							}
							return value;
						}
						if (isArray(require)) { //require多个的时候,返回数组
							value = [];
							forEach(require, function (require) {
								value.push(getControllers(require, $element, elementControllers));
							});
						}
						return value;
					}

					function nodeLinkFn(childLinkFn, scope, linkNode, $rootElement, boundTranscludeFn) {
						function controllersBoundTransclude(scope, cloneAttachFn) {
							var transcludeControllers;
							if (arguments.length < 2) {
								cloneAttachFn = scope;
								scope = undefined;
							}
							if (hasElementTranscludeDirective) {
								transcludeControllers = elementControllers;
							}
							return boundTranscludeFn(scope, cloneAttachFn, transcludeControllers);
						}

						var attrs, $element, i, ii, linkFn, controller, isolateScope, transcludeFn, elementControllers = {};
						if (compileNode === linkNode) {
							attrs = templateAttrs;
						} else {
							attrs = shallowCopy(templateAttrs, new Attributes(jqLite(linkNode), templateAttrs.$attr));
						}
						$element = attrs.$$element;
						if (newIsolateScopeDirective) {
							var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/,
								$linkNode = jqLite(linkNode);
							isolateScope = scope.$new(!0);
							if (templateDirective && templateDirective === newIsolateScopeDirective.$$originalDirective) {
								$linkNode.data("$isolateScope", isolateScope);
							} else {
								$linkNode.data("$isolateScopeNoTemplate", isolateScope);
								safeAddClass($linkNode, "ng-isolate-scope");
								forEach(newIsolateScopeDirective.scope, function (definition, scopeName) {
									var lastValue,
										parentGet,
										parentSet,
										match = definition.match(LOCAL_REGEXP) || [],
										attrName = match[3] || scopeName,
										optional = "?" == match[2],
										mode = match[1];
									isolateScope.$$isolateBindings[scopeName] = mode + attrName;
									switch (mode) {
										case "@":
											attrs.$observe(attrName, function (value) {
												isolateScope[scopeName] = value
											});
											attrs.$$observers[attrName].$$scope = scope;
											if (attrs[attrName]) {
												isolateScope[scopeName] = $interpolate(attrs[attrName])(scope);
											}
											break;
										case "=":
											if (optional && !attrs[attrName]) return;
											parentGet = $parse(attrs[attrName]);
											parentSet = parentGet.assign || function () {
													lastValue = isolateScope[scopeName] = parentGet(scope);
													throw  $compileMinErr("nonassign", "Expression '{0}' used with directive '{1}' is non-assignable!",
														attrs[attrName], newIsolateScopeDirective.name);
												};
											lastValue = isolateScope[scopeName] = parentGet(scope);
											isolateScope.$watch(function () {
												var parentValue = parentGet(scope);
												if (parentValue !== isolateScope[scopeName]) {
													if (parentValue !== lastValue) {
														lastValue = isolateScope[scopeName] = parentValue;
													} else {
														parentSet(scope, parentValue = lastValue = isolateScope[scopeName]);
													}
												}
												return parentValue;
											});
											break;
										case "&":
											parentGet = $parse(attrs[attrName]);
											isolateScope[scopeName] = function (locals) {
												return parentGet(scope, locals);
											};
											break;
										default:
											throw $compileMinErr("iscp", "Invalid isolate scope definition for directive '{0}'. Definition: {... {1}: '{2}' ...}",
												newIsolateScopeDirective.name, scopeName, definition);
									}
								});
							}
						}
						transcludeFn = boundTranscludeFn && controllersBoundTransclude;
						if (controllerDirectives) { //有控制器的指令
							forEach(controllerDirectives, function (directive) {
								var controllerInstance,
									locals = {
										$scope: directive === newIsolateScopeDirective || directive.$$isolateScope ? isolateScope : scope,
										$element: $element,
										$attrs: attrs,
										$transclude: transcludeFn
									};
								controller = directive.controller;
								if ("@" == controller) { //如果值为@,则用ng-controller的值
									controller = attrs[directive.name];
								}
								controllerInstance = $controller(controller, locals); //实例化,controller执行的时机
								elementControllers[directive.name] = controllerInstance;
								if (!hasElementTranscludeDirective) {
									$element.data("$" + directive.name + "Controller", controllerInstance);
								}
								if (directive.controllerAs) {
									locals.$scope[directive.controllerAs] = controllerInstance;
								}
							});
						}
						var targetScope, ctrls;
						//循环pre:function(){}
						for (i = 0, ii = preLinkFns.length; ii > i; i++) try {
							linkFn = preLinkFns[i];
							if (linkFn.isolateScope) { //独立scope
								targetScope = isolateScope;
							} else {
								targetScope = scope;
							}
							if (linkFn.require) { //获取所有需要的ctrls
								ctrls = getControllers(linkFn.require, $element, elementControllers);
							}
							//执行pre:fn
							linkFn(targetScope, $element, attrs, ctrls, transcludeFn);
						} catch (e) {
							$exceptionHandler(e, startingTag($element))
						}
						var scopeToChild = scope;
						if (newIsolateScopeDirective && (newIsolateScopeDirective.template || null === newIsolateScopeDirective.templateUrl)) {
							scopeToChild = isolateScope;
						}
						if (childLinkFn) {
							childLinkFn(scopeToChild, linkNode.childNodes, undefined, boundTranscludeFn);
						}
						//循环post:function(){}
						for (var i = postLinkFns.length - 1; i >= 0; i--) try {
							linkFn = postLinkFns[i];
							if (linkFn.isolateScope) { //独立scope
								targetScope = isolateScope;
							} else {
								targetScope = scope;
							}
							if (linkFn.require) { //获取所有需要的ctrls
								ctrls = getControllers(linkFn.require, $element, elementControllers);
							}
							//执行post:fn(or link:fn)
							linkFn(targetScope, $element, attrs, ctrls, transcludeFn);
						} catch (e) {
							$exceptionHandler(e, startingTag($element));
						}
					}

				}

				function markDirectivesAsIsolate(directives) {
					for (var j = 0, jj = directives.length; jj > j; j++) {
						directives[j] = inherit(directives[j], {
							$$isolateScope: !0
						});
					}
				}

				function addDirective(tDirectives, name, location, maxPriority, ignoreDirective, startAttrName, endAttrName) {
					if (name === ignoreDirective) return null; //忽略该指令
					var match = null;
					if (hasDirectives.hasOwnProperty(name)) { //存在该指令
						var directive,
							directives = $injector.get(name + Suffix),
							i = 0,
							ii = directives.length;
						for (; ii > i; i++) try {
							directive = directives[i];
							if ((maxPriority === undefined || maxPriority > directive.priority) && -1 != directive.restrict.indexOf(location)) {
								if (startAttrName) {
									directive = inherit(directive, {
										$$start: startAttrName,
										$$end: endAttrName
									});
								}
								tDirectives.push(directive);
								match = directive;
							}
						} catch (e) {
							$exceptionHandler(e);
						}
					}
					return match;
				}

				function mergeTemplateAttributes(dst, src) {
					var srcAttr = src.$attr,
						dstAttr = dst.$attr,
						$element = dst.$$element;
					forEach(dst, function (value, key) {
						if ("$" != key.charAt(0)) {
							if (src[key]) {
								value += ("style" === key ? ";" : " ") + src[key];
							}
							dst.$set(key, value, !0, srcAttr[key]);
						}
					});
					forEach(src, function (value, key) {
						if ("class" == key) {
							safeAddClass($element, value);
							dst["class"] = (dst["class"] ? dst["class"] + " " : "") + value;
						} else if ("style" == key) {
							$element.attr("style", $element.attr("style") + ";" + value);
							dst.style = (dst.style ? dst.style + ";" : "") + value;
						} else if (key.charAt(0) != '$' && !dst.hasOwnProperty(key)) {
							dst[key] = value;
							dstAttr[key] = srcAttr[key];
						}
					})
				}

				function compileTemplateUrl(directives, $compileNode, tAttrs, $rootElement, childTranscludeFn, preLinkFns, postLinkFns, previousCompileContext) {
					var afterTemplateNodeLinkFn,
						afterTemplateChildLinkFn,
						linkQueue = [],
						beforeTemplateCompileNode = $compileNode[0],
						origAsyncDirective = directives.shift(),
						derivedSyncDirective = extend({}, origAsyncDirective, {
							templateUrl: null,
							transclude: null,
							replace: null,
							$$originalDirective: origAsyncDirective
						}), templateUrl;
					if (isFunction(origAsyncDirective.templateUrl)) {
						templateUrl = origAsyncDirective.templateUrl($compileNode, tAttrs);
					} else {
						templateUrl = origAsyncDirective.templateUrl;
					}
					$compileNode.html("");
					$http.get($sce.getTrustedResourceUrl(templateUrl), {
						cache: $templateCache
					}).success(function (content) {
						var compileNode, tempTemplateAttrs, $template, childBoundTranscludeFn;
						content = denormalizeTemplate(content);
						if (origAsyncDirective.replace) {
							$template = jqLite("<div>" + trim(content) + "</div>").contents();
							compileNode = $template[0];
							if (1 != $template.length || 1 !== compileNode.nodeType) {
								throw $compileMinErr("tplrt", "Template for directive '{0}' must have exactly one root element. {1}",
									origAsyncDirective.name, templateUrl);
							}
							tempTemplateAttrs = {
								$attr: {}
							};
							replaceWith($rootElement, $compileNode, compileNode);
							//收集模板指令
							var templateDirectives = collectDirectives(compileNode, [], tempTemplateAttrs);
							if (isObject(origAsyncDirective.scope)) {
								markDirectivesAsIsolate(templateDirectives);
							}
							directives = templateDirectives.concat(directives);
							mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
						} else {
							compileNode = beforeTemplateCompileNode;
							$compileNode.html(content);
						}
						directives.unshift(derivedSyncDirective);
						afterTemplateNodeLinkFn = applyDirectivesToNode(directives, compileNode, tAttrs, childTranscludeFn, $compileNode, origAsyncDirective, preLinkFns, postLinkFns, previousCompileContext);
						forEach($rootElement, function (node, i) {
							if (node == compileNode) {
								$rootElement[i] = $compileNode[0];
							}
						});
						afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes, childTranscludeFn);
						for (; linkQueue.length;) {
							var scope = linkQueue.shift(),
								beforeTemplateLinkNode = linkQueue.shift(),
								linkRootElement = linkQueue.shift(),
								boundTranscludeFn = linkQueue.shift(),
								linkNode = $compileNode[0];
							if (beforeTemplateLinkNode !== beforeTemplateCompileNode) {
								linkNode = jqLiteClone(compileNode);
								replaceWith(linkRootElement, jqLite(beforeTemplateLinkNode), linkNode);
							}
							if (afterTemplateNodeLinkFn.transclude) {
								childBoundTranscludeFn = createBoundTranscludeFn(scope, afterTemplateNodeLinkFn.transclude);
							} else {
								childBoundTranscludeFn = boundTranscludeFn;
							}
							afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode, $rootElement, childBoundTranscludeFn);
						}
						linkQueue = null;
					}).error(function (response, code, headers, config) {
						throw $compileMinErr("tpload", "Failed to load template: {0}", config.url);
					});
					return function (ignoreChildLinkFn, scope, node, rootElement, boundTranscludeFn) { //nodeLinkFn,特殊的NodelinkFn
						if (linkQueue) {
							linkQueue.push(scope);
							linkQueue.push(node);
							linkQueue.push(rootElement);
							linkQueue.push(boundTranscludeFn);
						} else {
							afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, node, rootElement, boundTranscludeFn);
						}
					}
				}

				function byPriority(a, b) {
					var diff = b.priority - a.priority;
					if (diff !== 0) return diff;
					if (a.name !== b.name) {
						return (a.name < b.name) ? -1 : 1;
					}
					return a.index - b.index;
				}

				function assertNoDuplicate(what, previousDirective, directive, element) {
					if (previousDirective) {
						throw $compileMinErr("multidir", "Multiple directives [{0}, {1}] asking for {2} on: {3}",
							previousDirective.name, directive.name, what, startingTag(element))
					}
				}

				function addTextInterpolateDirective(directives, text) {
					var interpolateFn = $interpolate(text, !0);
					interpolateFn && directives.push({
						priority: 0,
						compile: valueFn(function (scope, node) {
							var parent = node.parent(),
								bindings = parent.data("$binding") || [];
							bindings.push(interpolateFn);
							safeAddClass(parent.data("$binding", bindings), "ng-binding");
							scope.$watch(interpolateFn, function (value) {
								node[0].nodeValue = value;
							})
						})
					});
				}

				function getTrustedContext(node, attrNormalizedName) {
					if ("xlinkHref" == attrNormalizedName || "IMG" != nodeName_(node)) {
						if (("src" == attrNormalizedName || "ngSrc" == attrNormalizedName)) {
							return $sce.RESOURCE_URL;
						}
					}
					return undefined;
				}

				function addAttrInterpolateDirective(node, directives, value, name) {
					var interpolateFn = $interpolate(value, !0);
					if (interpolateFn) {
						if ("multiple" === name && "SELECT" === nodeName_(node)) {
							throw $compileMinErr("selmulti", "Binding to the 'multiple' attribute is not supported. Element: {0}", startingTag(node));
						}
						directives.push({
							priority: 100,
							compile: function () {
								return {
									pre: function (scope, element, attr) {
										var $$observers = attr.$$observers || (attr.$$observers = {});
										if (EVENT_HANDLER_ATTR_REGEXP.test(name)) {
											throw $compileMinErr("nodomevents", "Interpolations for HTML DOM event attributes are disallowed." +
												"  Please use the ng- versions (such as ng-click instead of onclick) instead.");
										}
										interpolateFn = $interpolate(attr[name], !0, getTrustedContext(node, name));
										if (interpolateFn) {
											attr[name] = interpolateFn(scope);
											if (!$$observers[name]) {
												$$observers[name] = [];
											}
											$$observers[name].$$inter = true;
											if (attr.$$observers) {
												(attr.$$observers[name].$$scope || scope).$watch(interpolateFn, function (value) {
													attr.$set(name, value)
												});
											}
										}
									}
								}
							}
						});
					}
				}

				function replaceWith($rootElement, elementsToRemove, newNode) {
					var i, ii, firstElementToRemove = elementsToRemove[0],
						removeCount = elementsToRemove.length,
						parent = firstElementToRemove.parentNode;
					if ($rootElement)
						for (i = 0, ii = $rootElement.length; ii > i; i++) {
							if ($rootElement[i] == firstElementToRemove) {
								$rootElement[i++] = newNode;
								var j = i, j2 = j + removeCount - 1, jj = $rootElement.length;
								for (; jj > j; j++, j2++) {
									if (jj > j2) {
										$rootElement[j] = $rootElement[j2];
									} else {
										delete $rootElement[j];
									}
								}
								$rootElement.length -= removeCount - 1;
								break
							}
						}
					parent && parent.replaceChild(newNode, firstElementToRemove);
					var fragment = document.createDocumentFragment();
					fragment.appendChild(firstElementToRemove);
					newNode[jqLite.expando] = firstElementToRemove[jqLite.expando];
					for (var k = 1, kk = elementsToRemove.length; kk > k; k++) {
						var element = elementsToRemove[k];
						jqLite(element).remove();
						fragment.appendChild(element);
						delete elementsToRemove[k];
					}
					elementsToRemove[0] = newNode;
					elementsToRemove.length = 1;
				}

				function cloneAndAnnotateFn(fn, annotation) {
					return extend(function () {
						return fn.apply(null, arguments)
					}, fn, annotation)
				}


			}
		]
	}

	function directiveNormalize(name) {
		//<span ng-bind="name"></span> <br/>
		//<span ng:bind="name"></span> <br/>
		//<span ng_bind="name"></span> <br/>
		//<span data-ng-bind="name"></span> <br/>
		//<span x-ng-bind="name"></span> <br/>
		return camelCase(name.replace(PREFIX_REGEXP, ""))
	}

	function $ControllerProvider() {
		var controllers = {}, CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
		this.register = function (name, constructor) {
			assertNotHasOwnProperty(name, "controller");
			if (isObject(name)) {
				extend(controllers, name);//如果是一个对象
			} else {
				controllers[name] = constructor;//如果不是
			}
		};
		this.$get = ["$injector", "$window",
			function ($injector, $window) {
				return function (expression, locals) {
					var instance, match, constructor, identifier;
					if (isString(expression)) {
						match = expression.match(CNTRL_REG);
						constructor = match[1];
						identifier = match[3];
						if (controllers.hasOwnProperty(constructor)) {
							expression = controllers[constructor];
						} else {
							expression = getter(locals.$scope, constructor, !0) || getter($window, constructor, !0);
						}
						assertArgFn(expression, constructor, !0);
					}
					instance = $injector.instantiate(expression, locals);
					if (identifier) {
						if (!locals || "object" != typeof locals.$scope) {
							throw minErr("$controller")("noscp", "Cannot export controller '{0}' as '{1}'! No $scope object provided via `locals`.",
								constructor || expression.name, identifier);
						}
						locals.$scope[identifier] = instance;
					}
					return instance;
				}
			}
		]
	}

	function $DocumentProvider() {
		this.$get = ["$window",
			function (window) {
				return jqLite(window.document)
			}
		]
	}

	function $ExceptionHandlerProvider() {
		this.$get = ["$log",
			function ($log) {
				return function () {
					$log.error.apply($log, arguments)
				}
			}
		]
	}

	function parseHeaders(headers) {
		var key, val, i, parsed = {};
		if (headers) {
			forEach(headers.split("\n"), function (line) {
				i = line.indexOf(":");
				key = lowercase(trim(line.substr(0, i)));
				val = trim(line.substr(i + 1));
				if (key) {
					if (parsed[key]) {
						parsed[key] += ", " + val;
					} else {
						parsed[key] = val;
					}
				}
			});
		}
		return parsed;
	}

	function headersGetter(headers) {
		var headersObj = isObject(headers) ? headers : undefined;
		return function (name) {
			if (!headersObj) {
				headersObj = parseHeaders(headers);
			}
			if (name) {
				return headersObj[lowercase(name)] || null;
			} else {
				return headersObj;
			}
		}
	}

	function transformData(data, headers, fns) {
		if (isFunction(fns)) {
			return fns(data, headers);
		} else {
			forEach(fns, function (fn) {
				data = fn(data, headers)
			});
			return data;
		}
	}

	function isSuccess(status) { //http request is success when 200<=status<300
		return status >= 200 && 300 > status;
	}

	function $HttpProvider() {
		var JSON_START = /^\s*(\[|\{[^\{])/,
			JSON_END = /[\}\]]\s*$/,
			PROTECTION_PREFIX = /^\)\]\}',?\n/,
			CONTENT_TYPE_APPLICATION_JSON = {
				"Content-Type": "application/json;charset=utf-8"
			},
			defaults = this.defaults = {
				transformResponse: [
					function (data) {
						if (isString(data)) {
							data = data.replace(PROTECTION_PREFIX, "");
							if (JSON_START.test(data) && JSON_END.test(data))
								data = fromJson(data);
						}
						return data;
					}
				],
				transformRequest: [
					function (d) {
						return isObject(d) && !isFile(d) ? toJson(d) : d;//是对象且不是文件,转成Json
					}
				],
				headers: {
					common: {
						Accept: "application/json, text/plain, */*"
					},
					post: CONTENT_TYPE_APPLICATION_JSON,
					put: CONTENT_TYPE_APPLICATION_JSON,
					patch: CONTENT_TYPE_APPLICATION_JSON
				},
				xsrfCookieName: "XSRF-TOKEN",
				xsrfHeaderName: "X-XSRF-TOKEN"
			},
			interceptorFactories = this.interceptors = [],
			responseInterceptorFactories = this.responseInterceptors = [];
		this.$get = ["$httpBackend", "$browser", "$cacheFactory", "$rootScope", "$q", "$injector",
			function ($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {
				function $http(requestConfig) {
					function transformResponse(response) {
						var resp = extend({}, response, {
							data: transformData(response.data, response.headers, config.transformResponse)
						});
						return isSuccess(response.status) ? resp : $q.reject(resp)
					}

					function mergeHeaders(config) {
						function execHeaders(headers) {
							var headerContent;
							forEach(headers, function (headerFn, header) {
								isFunction(headerFn) && (headerContent = headerFn(), null != headerContent ? headers[header] = headerContent : delete headers[header])
							})
						}

						var defHeaderName, lowercaseDefHeaderName, reqHeaderName, defHeaders = defaults.headers,
							reqHeaders = extend({}, config.headers);
						defHeaders = extend({}, defHeaders.common, defHeaders[lowercase(config.method)]), execHeaders(defHeaders), execHeaders(reqHeaders);
						defaultHeadersIteration: for (defHeaderName in defHeaders) {
							lowercaseDefHeaderName = lowercase(defHeaderName);
							for (reqHeaderName in reqHeaders)
								if (lowercase(reqHeaderName) === lowercaseDefHeaderName) continue defaultHeadersIteration;
							reqHeaders[defHeaderName] = defHeaders[defHeaderName]
						}
						return reqHeaders
					}

					var config = {
						transformRequest: defaults.transformRequest,
						transformResponse: defaults.transformResponse
					}, headers = mergeHeaders(requestConfig);
					extend(config, requestConfig);
					config.headers = headers;
					config.method = uppercase(config.method);
					var xsrfValue = urlIsSameOrigin(config.url) ? $browser.cookies()[config.xsrfCookieName || defaults.xsrfCookieName] : undefined;
					xsrfValue && (headers[config.xsrfHeaderName || defaults.xsrfHeaderName] = xsrfValue);
					var serverRequest = function (config) {
							headers = config.headers;
							var reqData = transformData(config.data, headersGetter(headers), config.transformRequest);
							if (isUndefined(config.data)) {
								forEach(headers, function (value, header) {
									"content-type" === lowercase(header) && delete headers[header]
								});
							}
							if (isUndefined(config.withCredentials) && !isUndefined(defaults.withCredentials)) {
								config.withCredentials = defaults.withCredentials;
							}
							return sendReq(config, reqData, headers).then(transformResponse, transformResponse);
						},
						chain = [serverRequest, undefined],
						promise = $q.when(config);
					forEach(reversedInterceptors, function (interceptor) {
						if (interceptor.request || interceptor.requestError) {
							chain.unshift(interceptor.request, interceptor.requestError);
						}
						if ((interceptor.response || interceptor.responseError)) {
							chain.push(interceptor.response, interceptor.responseError);
						}
					});
					for (; chain.length;) {
						var thenFn = chain.shift(),
							rejectFn = chain.shift();
						promise = promise.then(thenFn, rejectFn)
					}
					promise.success = function (fn) {
						promise.then(function (response) {
							fn(response.data, response.status, response.headers, config)
						});
						return promise;
					};
					promise.error = function (fn) {
						promise.then(null, function (response) {
							fn(response.data, response.status, response.headers, config)
						})
						return promise;
					};
					return promise;
				}

				function createShortMethods() {
					forEach(arguments, function (name) {
						$http[name] = function (url, config) {
							return $http(extend(config || {}, {
								method: name,
								url: url
							}))
						}
					})
				}

				function createShortMethodsWithData() {
					forEach(arguments, function (name) {
						$http[name] = function (url, data, config) {
							return $http(extend(config || {}, {
								method: name,
								url: url,
								data: data
							}))
						}
					})
				}

				function sendReq(config, reqData, reqHeaders) {
					function done(status, response, headersString) {
						if (cache) {
							if (isSuccess(status)) {
								cache.put(url, [status, response, parseHeaders(headersString)]);

							} else {
								cache.remove(url)
							}
						}
						resolvePromise(response, status, headersString);
						$rootScope.$$phase || $rootScope.$apply();
					}

					function resolvePromise(response, status, headers) {
						status = Math.max(status, 0);
						if (isSuccess(status)) {
							deferred.resolve({
								data: response,
								status: status,
								headers: headersGetter(headers),
								config: config
							});
						} else {
							deferred.reject({
								data: response,
								status: status,
								headers: headersGetter(headers),
								config: config
							});
						}
					}

					function removePendingReq() {
						var idx = indexOf($http.pendingRequests, config);
						if (idx !== -1) {
							$http.pendingRequests.splice(idx, 1);
						}
					}

					var cache, cachedResp, deferred = $q.defer(),
						promise = deferred.promise,
						url = buildUrl(config.url, config.params);
					$http.pendingRequests.push(config);
					promise.then(removePendingReq, removePendingReq);
					if ((config.cache || defaults.cache)) {
						if (config.cache !== !1 && "GET" == config.method) {
							if (isObject(config.cache)) {
								cache = config.cache;
							} else if (isObject(defaults.cache)) {
								cache = defaults.cache;
							} else {
								cache = defaultCache;
							}
						}
					}
					if (cache) {
						cachedResp = cache.get(url);
						if (isDefined(cachedResp)) {
							if (cachedResp.then) {
								cachedResp.then(removePendingReq, removePendingReq);
								return cachedResp;
							}
							if (isArray(cachedResp)) {
								resolvePromise(cachedResp[1], cachedResp[0], copy(cachedResp[2]));
							} else {
								resolvePromise(cachedResp, 200, {});
							}
						} else {
							cache.put(url, promise);
						}
					}
					if (isUndefined(cachedResp)) {
						$httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout, config.withCredentials, config.responseType);
					}
					return promise;
				}

				function buildUrl(url, params) {
					if (!params) return url;
					var parts = [];
					forEachSorted(params, function (value, key) {
						null === value || isUndefined(value) || (isArray(value) || (value = [value]), forEach(value, function (v) {
							isObject(v) && (v = toJson(v)), parts.push(encodeUriQuery(key) + "=" + encodeUriQuery(v))
						}))
					});
					return url + (-1 == url.indexOf("?") ? "?" : "&") + parts.join("&");
				}

				var defaultCache = $cacheFactory("$http"),
					reversedInterceptors = [];
				forEach(interceptorFactories, function (interceptorFactory) {
					var interceptorInstance;
					if (isString(interceptorFactory)) {
						interceptorInstance = $injector.get(interceptorFactory);
					} else {
						interceptorInstance = $injector.invoke(interceptorFactory);
					}
					reversedInterceptors.unshift(interceptorInstance);
				});
				forEach(responseInterceptorFactories, function (interceptorFactory, index) {
					var responseFn;
					if (isString(interceptorFactory)) {
						responseFn = $injector.get(interceptorFactory);
					} else {
						responseFn = $injector.invoke(interceptorFactory);
					}
					reversedInterceptors.splice(index, 0, {
						response: function (response) {
							return responseFn($q.when(response))
						},
						responseError: function (response) {
							return responseFn($q.reject(response))
						}
					})
				});
				$http.pendingRequests = [];
				createShortMethods("get", "delete", "head", "jsonp");
				createShortMethodsWithData("post", "put");
				$http.defaults = defaults;
				return $http;
			}
		]
	}

	function $HttpBackendProvider() {
		this.$get = ["$browser", "$window", "$document",
			function ($browser, $window, $document) {
				return createHttpBackend($browser, XHR, $browser.defer, $window.angular.callbacks, $document[0], $window.location.protocol.replace(":", ""))
			}
		]
	}

	function createHttpBackend($browser, XHR, $browserDefer, callbacks, rawDocument, locationProtocol) {
		function jsonpReq(url, done) { //跨域请求+延迟加载
			var script = rawDocument.createElement("script"),
				doneWrapper = function () {
					rawDocument.body.removeChild(script);
					done && done(); //移除节点并回调done
				};
			script.type = "text/javascript", script.src = url;
			if (msie) {
				script.onreadystatechange = function () { //加载完成移除节点(for IE)
					/loaded|complete/.test(script.readyState) && doneWrapper()
				}
			} else {//加载完成移除节点
				script.onload = script.onerror = doneWrapper
			}
			rawDocument.body.appendChild(script);
			return doneWrapper;
		}

		return function (method, url, post, callback, headers, timeout, withCredentials, responseType) {
			function timeoutRequest() {  //请求超时状态置为-1, 使用跨域请求再处理一次,忽略XMLHttpRequest请求
				status = -1, jsonpDone && jsonpDone(), xhr && xhr.abort();
			}

			function completeRequest(callback, status, response, headersString) {
				var protocol = locationProtocol || urlResolve(url).protocol;
				timeoutId && $browserDefer.cancel(timeoutId);
				jsonpDone = xhr = null;
				if ("file" == protocol) {
					if (response) {
						status = 200;
					} else {
						status = 204;
					}
				} else {
					status = 404;
				}

				if (1223 == status) {
					status = 204;
				}
				callback(status, response, headersString);
				$browser.$$completeOutstandingRequest(noop);
			}

			var status;
			$browser.$$incOutstandingRequestCount();
			url = url || $browser.url();
			if ("jsonp" == lowercase(method)) {
				var callbackId = "_" + (callbacks.counter++).toString(36);
				callbacks[callbackId] = function (data) {
					callbacks[callbackId].data = data
				};
				var jsonpDone = jsonpReq(url.replace("JSON_CALLBACK", "angular.callbacks." + callbackId), function () {
					if (callbacks[callbackId].data) {
						completeRequest(callback, 200, callbacks[callbackId].data);
					} else {
						completeRequest(callback, status || -2)
					}
					delete callbacks[callbackId]
				})
			} else {
				var xhr = new XHR;
				xhr.open(method, url, !0); //启动一个请求
				forEach(headers, function (value, key) {
					isDefined(value) && xhr.setRequestHeader(key, value);  //设置请求头
				});
				xhr.onreadystatechange = function () {
					if (4 == xhr.readyState) {
						var responseHeaders = xhr.getAllResponseHeaders();
						//请求完成后的回调
						completeRequest(callback, status || xhr.status, xhr.responseType ? xhr.response : xhr.responseText, responseHeaders);
					}
				};
				withCredentials && (xhr.withCredentials = !0);
				responseType && (xhr.responseType = responseType);
				xhr.send(post || null);
			}
			if (timeout > 0) {
				var timeoutId = $browserDefer(timeoutRequest, timeout);
			}
			else {
				timeout && timeout.then && timeout.then(timeoutRequest);
			}
		}
	}

	function $InterpolateProvider() {
		var startSymbol = "{{",
			endSymbol = "}}";
		this.startSymbol = function (value) {
			return value ? (startSymbol = value, this) : startSymbol
		};
		this.endSymbol = function (value) {
			return value ? (endSymbol = value, this) : endSymbol
		};
		this.$get = ["$parse", "$exceptionHandler", "$sce",
			function ($parse, $exceptionHandler, $sce) {
				function $interpolate(text, mustHaveExpression, trustedContext) {
					var startIndex, endIndex, fn, exp, index = 0, parts = [], length = text.length, hasInterpolation = !1, concat = [];
					for (; length > index;) -1 != (startIndex = text.indexOf(startSymbol, index)) && -1 != (endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) ? (index != startIndex && parts.push(text.substring(index, startIndex)), parts.push(fn = $parse(exp = text.substring(startIndex + startSymbolLength, endIndex))), fn.exp = exp, index = endIndex + endSymbolLength, hasInterpolation = !0) : (index != length && parts.push(text.substring(index)), index = length);
					length = parts.length;
					if (!length) {
						parts.push("");
						length = 1;
					}
					if (trustedContext && parts.length > 1) {
						throw $interpolateMinErr("noconcat", "Error while interpolating: {0}\nStrict Contextual Escaping disallows interpolations that concatenate multiple expressions when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce", text);
					}
					if (!mustHaveExpression || hasInterpolation) {
						concat.length = length;
						fn = function (context) {
							try {
								for (var part, i = 0, ii = length; ii > i; i++) {
									if ("function" == typeof(part = parts[i])) {
										part = part(context);
										part = trustedContext ? $sce.getTrusted(trustedContext, part) : $sce.valueOf(part);
										null === part || isUndefined(part) ? part = "" : "string" != typeof part && (part = toJson(part));
									}
									concat[i] = part;

								}
								return concat.join("");
							} catch (err) {
								var newErr = $interpolateMinErr("interr", "Can't interpolate: {0}\n{1}", text, err.toString());
								$exceptionHandler(newErr)
							}
						};
						fn.exp = text;
						fn.parts = parts;
						return fn;
					}
					return void 0;
				}

				var startSymbolLength = startSymbol.length,
					endSymbolLength = endSymbol.length;
				$interpolate.startSymbol = function () {
					return startSymbol
				};
				$interpolate.endSymbol = function () {
					return endSymbol
				};
				return $interpolate;
			}
		]
	}

	function $IntervalProvider() {
		this.$get = ["$rootScope", "$window", "$q",
			function ($rootScope, $window, $q) {
				function interval(fn, delay, count, invokeApply) {
					var setInterval = $window.setInterval,
						clearInterval = $window.clearInterval,
						deferred = $q.defer(),
						promise = deferred.promise,
						iteration = 0,
						skipApply = isDefined(invokeApply) && !invokeApply;
					count = isDefined(count) ? count : 0;
					promise.then(null, null, fn);
					promise.$$intervalId = setInterval(function () {
						deferred.notify(iteration++);
						if (count > 0 && iteration >= count) {
							deferred.resolve(iteration);
							clearInterval(promise.$$intervalId);
							delete intervals[promise.$$intervalId];
						}
						if (!skipApply) {
							$rootScope.$apply();
						}
					}, delay);
					intervals[promise.$$intervalId] = deferred;
					return promise;
				}

				var intervals = {};
				interval.cancel = function (promise) {
					if (promise && promise.$$intervalId in intervals) {
						intervals[promise.$$intervalId].reject("canceled");
						clearInterval(promise.$$intervalId);
						delete intervals[promise.$$intervalId];
						return true;
					}
					return false;
				};
				return interval;
			}
		]
	}

	function $LocaleProvider() {
		this.$get = function () {
			return {
				id: "en-us",
				NUMBER_FORMATS: {
					DECIMAL_SEP: ".",
					GROUP_SEP: ",",
					PATTERNS: [{
						minInt: 1,
						minFrac: 0,
						maxFrac: 3,
						posPre: "",
						posSuf: "",
						negPre: "-",
						negSuf: "",
						gSize: 3,
						lgSize: 3
					}, {
						minInt: 1,
						minFrac: 2,
						maxFrac: 2,
						posPre: "¤",
						posSuf: "",
						negPre: "(¤",
						negSuf: ")",
						gSize: 3,
						lgSize: 3
					}],
					CURRENCY_SYM: "$"
				},
				DATETIME_FORMATS: {
					MONTH: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
					SHORTMONTH: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
					DAY: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
					SHORTDAY: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),
					AMPMS: ["AM", "PM"],
					medium: "MMM d, y h:mm:ss a",
					"short": "M/d/yy h:mm a",
					fullDate: "EEEE, MMMM d, y",
					longDate: "MMMM d, y",
					mediumDate: "MMM d, y",
					shortDate: "M/d/yy",
					mediumTime: "h:mm:ss a",
					shortTime: "h:mm a"
				},
				pluralCat: function (num) {
					return 1 === num ? "one" : "other"
				}
			}
		}
	}

	function encodePath(path) {
		for (var segments = path.split("/"), i = segments.length; i--;) {
			segments[i] = encodeUriSegment(segments[i]);
		}
		return segments.join("/");
	}

	function parseAbsoluteUrl(absoluteUrl, locationObj, appBase) {
		var parsedUrl = urlResolve(absoluteUrl, appBase);
		locationObj.$$protocol = parsedUrl.protocol, locationObj.$$host = parsedUrl.hostname, locationObj.$$port = int(parsedUrl.port) || DEFAULT_PORTS[parsedUrl.protocol] || null
	}

	function parseAppUrl(relativeUrl, locationObj, appBase) {
		var prefixed = "/" !== relativeUrl.charAt(0);
		prefixed && (relativeUrl = "/" + relativeUrl);
		var match = urlResolve(relativeUrl, appBase);
		locationObj.$$path = decodeURIComponent(prefixed && "/" === match.pathname.charAt(0) ? match.pathname.substring(1) : match.pathname), locationObj.$$search = parseKeyValue(match.search), locationObj.$$hash = decodeURIComponent(match.hash), locationObj.$$path && "/" != locationObj.$$path.charAt(0) && (locationObj.$$path = "/" + locationObj.$$path)
	}

	function beginsWith(begin, whole) {
		return 0 === whole.indexOf(begin) ? whole.substr(begin.length) : void 0
	}

	function stripHash(url) {
		var index = url.indexOf("#");
		return -1 == index ? url : url.substr(0, index)
	}

	function stripFile(url) {
		return url.substr(0, stripHash(url).lastIndexOf("/") + 1)
	}

	function serverBase(url) {
		return url.substring(0, url.indexOf("/", url.indexOf("//") + 2))
	}

	function LocationHtml5Url(appBase, basePrefix) {
		this.$$html5 = !0, basePrefix = basePrefix || "";
		var appBaseNoFile = stripFile(appBase);
		parseAbsoluteUrl(appBase, this, appBase);
		this.$$parse = function (url) {
			var pathUrl = beginsWith(appBaseNoFile, url);
			if (!isString(pathUrl)) throw $locationMinErr("ipthprfx", 'Invalid url "{0}", missing path prefix "{1}".', url, appBaseNoFile);
			parseAppUrl(pathUrl, this, appBase), this.$$path || (this.$$path = "/"), this.$$compose()
		};
		this.$$compose = function () {
			var search = toKeyValue(this.$$search),
				hash = this.$$hash ? "#" + encodeUriSegment(this.$$hash) : "";
			this.$$url = encodePath(this.$$path) + (search ? "?" + search : "") + hash, this.$$absUrl = appBaseNoFile + this.$$url.substr(1)
		};
		this.$$rewrite = function (url) {
			var appUrl, prevAppUrl;
			return (appUrl = beginsWith(appBase, url)) !== undefined ? (prevAppUrl = appUrl, (appUrl = beginsWith(basePrefix, appUrl)) !== undefined ? appBaseNoFile + (beginsWith("/", appUrl) || appUrl) : appBase + prevAppUrl) : (appUrl = beginsWith(appBaseNoFile, url)) !== undefined ? appBaseNoFile + appUrl : appBaseNoFile == url + "/" ? appBaseNoFile : void 0
		}
	}

	function LocationHashbangUrl(appBase, hashPrefix) {
		var appBaseNoFile = stripFile(appBase);
		parseAbsoluteUrl(appBase, this, appBase), this.$$parse = function (url) {
			var withoutBaseUrl = beginsWith(appBase, url) || beginsWith(appBaseNoFile, url),
				withoutHashUrl = "#" == withoutBaseUrl.charAt(0) ? beginsWith(hashPrefix, withoutBaseUrl) : this.$$html5 ? withoutBaseUrl : "";
			if (!isString(withoutHashUrl)) throw $locationMinErr("ihshprfx", 'Invalid url "{0}", missing hash prefix "{1}".', url, hashPrefix);
			parseAppUrl(withoutHashUrl, this, appBase), this.$$compose()
		}, this.$$compose = function () {
			var search = toKeyValue(this.$$search),
				hash = this.$$hash ? "#" + encodeUriSegment(this.$$hash) : "";
			this.$$url = encodePath(this.$$path) + (search ? "?" + search : "") + hash, this.$$absUrl = appBase + (this.$$url ? hashPrefix + this.$$url : "")
		}, this.$$rewrite = function (url) {
			return stripHash(appBase) == stripHash(url) ? url : void 0
		}
	}

	function LocationHashbangInHtml5Url(appBase, hashPrefix) {
		this.$$html5 = !0, LocationHashbangUrl.apply(this, arguments);
		var appBaseNoFile = stripFile(appBase);
		this.$$rewrite = function (url) {
			var appUrl;
			return appBase == stripHash(url) ? url : (appUrl = beginsWith(appBaseNoFile, url)) ? appBase + hashPrefix + appUrl : appBaseNoFile === url + "/" ? appBaseNoFile : void 0
		}
	}

	function locationGetter(property) {
		return function () {
			return this[property];
		}
	}

	function locationGetterSetter(property, preprocess) {
		return function (value) {
			if(isUndefined(value)){
				return this[property];
			}
			this[property] = preprocess(value);
			this.$$compose();
			return this;
		}
	}

	function $LocationProvider() {
		var hashPrefix = "",
			html5Mode = false;
		this.hashPrefix = function (prefix) {
			if (isDefined(prefix)) {
				hashPrefix = prefix;
				return this;
			}
			return hashPrefix;
		};
		this.html5Mode = function (mode) {
			if (isDefined(mode)) {
				html5Mode = mode;
				return this;
			}
			return html5Mode;
		};
		this.$get = ["$rootScope", "$browser", "$sniffer", "$rootElement",
			function ($rootScope, $browser, $sniffer, $rootElement) {
				function afterLocationChange(oldUrl) {
					$rootScope.$broadcast("$locationChangeSuccess", $location.absUrl(), oldUrl)
				}

				var $location,
					LocationMode,
					appBase,
					baseHref = $browser.baseHref(),
					initialUrl = $browser.url();
				if (html5Mode) {
					appBase = serverBase(initialUrl) + (baseHref || "/");
					if ($sniffer.history) {
						LocationMode = LocationHtml5Url;
					} else {
						LocationMode = LocationHashbangInHtml5Url;
					}
				} else {
					appBase = stripHash(initialUrl);
					LocationMode = LocationHashbangUrl;
				}
				$location = new LocationMode(appBase, "#" + hashPrefix);
				$location.$$parse($location.$$rewrite(initialUrl));
				$rootElement.on("click", function (event) {
					if (!event.ctrlKey && !event.metaKey && 2 != event.which) {
						var elm = jqLite(event.target);
						for (; "a" !== lowercase(elm[0].nodeName);) {
							if (elm[0] === $rootElement[0] || !(elm = elm.parent())[0]) return;
						}
						var absHref = elm.prop("href"),
							rewrittenUrl = $location.$$rewrite(absHref);
						absHref && !elm.attr("target") && rewrittenUrl && !event.isDefaultPrevented() && (event.preventDefault(), rewrittenUrl != $browser.url() && ($location.$$parse(rewrittenUrl), $rootScope.$apply(), window.angular["ff-684208-preventDefault"] = !0))
					}
				});
				$location.absUrl() != initialUrl && $browser.url($location.absUrl(), !0);
				$browser.onUrlChange(function (newUrl) {
					if ($location.absUrl() != newUrl) {
						if ($rootScope.$broadcast("$locationChangeStart", newUrl, $location.absUrl()).defaultPrevented) {
							$browser.url($location.absUrl());
							return void 0;
						}
						$rootScope.$evalAsync(function () {
							var oldUrl = $location.absUrl();
							$location.$$parse(newUrl);
							afterLocationChange(oldUrl);
						});
						$rootScope.$$phase || $rootScope.$digest();
					}
				});
				var changeCounter = 0;
				$rootScope.$watch(function () {
					var oldUrl = $browser.url(),
						currentReplace = $location.$$replace;
					if (!(changeCounter && oldUrl == $location.absUrl())) {
						changeCounter++;
						$rootScope.$evalAsync(function () {
							var obj = $rootScope.$broadcast("$locationChangeStart", $location.absUrl(), oldUrl);
							if (obj.defaultPrevented) {
								$location.$$parse(oldUrl)
							} else {
								$browser.url($location.absUrl(), currentReplace);
								afterLocationChange(oldUrl);
							}
						})
					}
					$location.$$replace = !1;
					return changeCounter;
				});
				return $location
			}
		]
	}

	function $LogProvider() {
		var debug = !0, self = this;
		this.debugEnabled = function (flag) {
			if (isDefined(flag)) {
				debug = flag;
				return this;
			} else {
				return debug;
			}
		};
		this.$get = ["$window",
			function ($window) {
				function formatError(arg) { //处理一些特殊参数，如Error
					if (arg instanceof Error) {
						if (arg.stack) { //这里说明是个异常参数 每一个Error对象都有stack和message属性
							if (arg.message && -1 === arg.stack.indexOf(arg.message)) {
								arg = "Error: " + arg.message + "\n" + arg.stack;
							} else {
								arg = arg.stack;
							}
						} else {
							if (arg.sourceURL) {
								arg = arg.message + "\n" + arg.sourceURL + ":" + arg.line;
							}
						}
					}
					return arg;
				}

				function consoleLog(type) {
					var console = $window.console || {};
					var logFn = console[type] || console.log || noop;
					if (logFn.apply) {
						return function () {
							var args = [];
							forEach(arguments, function (arg) {
								args.push(formatError(arg))
							});
							return logFn.apply(console, args); //console.log.apply(console,args)
						}
					} else {
						return function (arg1, arg2) {
							logFn(arg1, null == arg2 ? "" : arg2); //console.log(arg1,arg2)||noop(arg1,arg2)
						}
					}
				}

				return {
					log: consoleLog("log"),
					info: consoleLog("info"),
					warn: consoleLog("warn"),
					error: consoleLog("error"),
					debug: function () {
						var fn = consoleLog("debug");
						return function () {
							debug && fn.apply(self, arguments)
						}
					}()
				}
			}
		]
	}

	function ensureSafeMemberName(name, fullExpression) {
		if ("constructor" === name) {
			throw $parseMinErr("isecfld", 'Referencing "constructor" field in Angular expressions is disallowed! Expression: {0}', fullExpression);
		}
		return name
	}

	function ensureSafeObject(obj, fullExpression) {
		if (obj && obj.constructor === obj) {
			throw $parseMinErr("isecfn", "Referencing Function in Angular expressions is disallowed! Expression: {0}", fullExpression);
		}
		if (obj && obj.document && obj.location && obj.alert && obj.setInterval) {
			throw $parseMinErr("isecwindow", "Referencing the Window in Angular expressions is disallowed! Expression: {0}", fullExpression);
		}
		if (obj && (obj.nodeName || obj.on && obj.find)) {
			throw $parseMinErr("isecdom", "Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}", fullExpression);
		}
		return obj
	}

	function setter(obj, path, setValue, fullExp, options) {
		options = options || {};
		for (var key, element = path.split("."), i = 0; element.length > 1; i++) {
			key = ensureSafeMemberName(element.shift(), fullExp);
			var propertyObj = obj[key];
			propertyObj || (propertyObj = {}, obj[key] = propertyObj), obj = propertyObj, obj.then && options.unwrapPromises && (promiseWarning(fullExp), "$$v" in obj || !function (promise) {
				promise.then(function (val) {
					promise.$$v = val
				})
			}(obj), obj.$$v === undefined && (obj.$$v = {}), obj = obj.$$v)
		}
		return key = ensureSafeMemberName(element.shift(), fullExp), obj[key] = setValue, setValue
	}

	function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options) {
		return ensureSafeMemberName(key0, fullExp), ensureSafeMemberName(key1, fullExp), ensureSafeMemberName(key2, fullExp), ensureSafeMemberName(key3, fullExp), ensureSafeMemberName(key4, fullExp), options.unwrapPromises ? function (scope, locals) {
			var promise, pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
			return null === pathVal || pathVal === undefined ? pathVal : (pathVal = pathVal[key0], pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, promise.$$v = undefined, promise.then(function (val) {
				promise.$$v = val
			})), pathVal = pathVal.$$v), key1 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key1], pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, promise.$$v = undefined, promise.then(function (val) {
				promise.$$v = val
			})), pathVal = pathVal.$$v), key2 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key2], pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, promise.$$v = undefined, promise.then(function (val) {
				promise.$$v = val
			})), pathVal = pathVal.$$v), key3 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key3], pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, promise.$$v = undefined, promise.then(function (val) {
				promise.$$v = val
			})), pathVal = pathVal.$$v), key4 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key4], pathVal && pathVal.then && (promiseWarning(fullExp), "$$v" in pathVal || (promise = pathVal, promise.$$v = undefined, promise.then(function (val) {
				promise.$$v = val
			})), pathVal = pathVal.$$v), pathVal) : pathVal) : pathVal) : pathVal) : pathVal)
		} : function (scope, locals) {
			var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
			return null === pathVal || pathVal === undefined ? pathVal : (pathVal = pathVal[key0], key1 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key1], key2 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key2], key3 && null !== pathVal && pathVal !== undefined ? (pathVal = pathVal[key3], key4 && null !== pathVal && pathVal !== undefined ? pathVal = pathVal[key4] : pathVal) : pathVal) : pathVal) : pathVal)
		}
	}

	function getterFn(path, options, fullExp) {
		if (getterFnCache.hasOwnProperty(path)) return getterFnCache[path];
		var fn, pathKeys = path.split("."),
			pathKeysLength = pathKeys.length;
		if (options.csp) fn = 6 > pathKeysLength ? cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options) : function (scope, locals) {
			var val, i = 0;
			do val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], fullExp, options)(scope, locals), locals = undefined, scope = val; while (pathKeysLength > i);
			return val
		};
		else {
			var code = "var l, fn, p;\n";
			forEach(pathKeys, function (key, index) {
				ensureSafeMemberName(key, fullExp), code += "if(s === null || s === undefined) return s;\nl=s;\ns=" + (index ? "s" : '((k&&k.hasOwnProperty("' + key + '"))?k:s)') + '["' + key + '"];\n' + (options.unwrapPromises ? 'if (s && s.then) {\n pw("' + fullExp.replace(/\"/g, '\\"') + '");\n if (!("$$v" in s)) {\n p=s;\n p.$$v = undefined;\n p.then(function(v) {p.$$v=v;});\n}\n s=s.$$v\n}\n' : "")
			}), code += "return s;";
			var evaledFnGetter = new Function("s", "k", "pw", code);
			evaledFnGetter.toString = function () {
				return code
			}, fn = function (scope, locals) {
				return evaledFnGetter(scope, locals, promiseWarning)
			}
		}
		return "hasOwnProperty" !== path && (getterFnCache[path] = fn), fn
	}

	//=======================================
	function Lexer(options) {
		this.options = options;
	}

	Lexer.prototype = {
		constructor: Lexer,
		lex: function (text) {
			this.text = text;
			this.index = 0;
			this.ch = undefined;
			this.lastCh = ":";
			this.tokens = [];
			var token, json = [];
			for (; this.index < this.text.length;) {
				this.ch = this.text.charAt(this.index);
				if (this.is("\"'")) {
					this.readString(this.ch);
				}
				else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) {
					this.readNumber();
				}
				else if (this.isIdent(this.ch)) {
					this.readIdent();
					if (this.was("{,") && "{" === json[0]) {
						token = this.tokens[this.tokens.length - 1];
						if (token) {
							token.json = -1 === token.text.indexOf(".");
						}
					}
				}
				else if (this.is("(){}[].,;:?")) {
					this.tokens.push({
						index: this.index,
						text: this.ch,
						json: this.was(":[,") && this.is("{[") || this.is("}]:,")
					});
					if (this.is("{[")) {
						json.unshift(this.ch);
					}
					if (this.is("}]")) {
						json.shift();
					}
					this.index++;
				}
				else {
					if (this.isWhitespace(this.ch)) {
						this.index++;
						continue
					}
					var ch2 = this.ch + this.peek(),
						ch3 = ch2 + this.peek(2),
						fn = OPERATORS[this.ch],
						fn2 = OPERATORS[ch2],
						fn3 = OPERATORS[ch3];
					if (fn3) {
						this.tokens.push({
							index: this.index,
							text: ch3,
							fn: fn3
						});
						this.index += 3;
					} else if (fn2) {
						this.tokens.push({
							index: this.index,
							text: ch2,
							fn: fn2
						});
						this.index += 2;
					} else if (fn) {
						this.tokens.push({
							index: this.index,
							text: this.ch,
							fn: fn,
							json: this.was("[,:") && this.is("+-")
						});
						this.index += 1;
					} else {
						this.throwError("Unexpected next character ", this.index, this.index + 1);
					}
				}
				this.lastCh = this.ch;
			}
			return this.tokens;
		},
		is: function (chars) {
			return -1 !== chars.indexOf(this.ch)
		},
		was: function (chars) {
			return -1 !== chars.indexOf(this.lastCh)
		},
		peek: function (i) {
			var num = i || 1;
			if (this.index + num < this.text.length) {
				return this.text.charAt(this.index + num);
			}
			return false;
		},
		isNumber: function (ch) {
			return ch >= "0" && "9" >= ch
		},
		isWhitespace: function (ch) {
			return " " === ch || "\r" === ch || "	" === ch || "\n" === ch || "" === ch || " " === ch
		},
		isIdent: function (ch) {
			return ch >= "a" && "z" >= ch || ch >= "A" && "Z" >= ch || "_" === ch || "$" === ch
		},
		isExpOperator: function (ch) {
			return "-" === ch || "+" === ch || this.isNumber(ch)
		},
		throwError: function (error, start, end) {
			end = end || this.index;
			var colStr = isDefined(start) ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]" : " " + end;
			throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].", error, colStr, this.text)
		},
		readNumber: function () {
			var number = "", start = this.index;
			for (; this.index < this.text.length;) {
				var ch = lowercase(this.text.charAt(this.index));
				if ("." == ch || this.isNumber(ch)) {
					number += ch;
				}
				else {
					var peekCh = this.peek();
					if ("e" == ch && this.isExpOperator(peekCh)) {
						number += ch;
					}
					else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && "e" == number.charAt(number.length - 1)) number += ch;
					else {
						if (!this.isExpOperator(ch) || peekCh && this.isNumber(peekCh) || "e" != number.charAt(number.length - 1)) break;
						this.throwError("Invalid exponent")
					}
				}
				this.index++
			}
			number = 1 * number;
			this.tokens.push({
				index: start,
				text: number,
				json: !0,
				fn: function () {
					return number
				}
			});
		},
		readIdent: function () {
			var lastDot, peekIndex, methodName, ch, parser = this, ident = "", start = this.index;
			for (; this.index < this.text.length && (ch = this.text.charAt(this.index), "." === ch || this.isIdent(ch) || this.isNumber(ch));) {
				"." === ch && (lastDot = this.index);
				ident += ch;
				this.index++;
			}
			if (lastDot)
				for (peekIndex = this.index; peekIndex < this.text.length;) {
					ch = this.text.charAt(peekIndex);
					if ("(" === ch) {
						methodName = ident.substr(lastDot - start + 1);
						ident = ident.substr(0, lastDot - start);
						this.index = peekIndex;
						break
					}
					if (!this.isWhitespace(ch)) break;
					peekIndex++
				}
			var token = {
				index: start,
				text: ident
			};
			if (OPERATORS.hasOwnProperty(ident)) {
				token.fn = OPERATORS[ident];
				token.json = OPERATORS[ident];
			}
			else {
				var getter = getterFn(ident, this.options, this.text);
				token.fn = extend(function (self, locals) {
					return getter(self, locals)
				}, {
					assign: function (self, value) {
						return setter(self, ident, value, parser.text, parser.options)
					}
				})
			}
			this.tokens.push(token);
			if (methodName) {
				this.tokens.push({
					index: lastDot,
					text: ".",
					json: !1
				});
				this.tokens.push({
					index: lastDot + 1,
					text: methodName,
					json: !1
				})
			}
		},
		readString: function (quote) {
			var start = this.index;
			this.index++;
			var string = "", rawString = quote, escape = false;
			for (; this.index < this.text.length;) {
				var ch = this.text.charAt(this.index);
				rawString += ch;
				if (escape) {
					if ("u" === ch) {
						var hex = this.text.substring(this.index + 1, this.index + 5);
						if (!hex.match(/[\da-f]{4}/i)) {
							this.throwError("Invalid unicode escape [\\u" + hex + "]");
						}
						this.index += 4;
						string += String.fromCharCode(parseInt(hex, 16));
					} else {
						var rep = ESCAPE[ch];
						string += rep ? rep : ch
					}
					escape = false;
				} else if ("\\" === ch) {
					escape = true;
				}
				else {
					if (ch === quote) {
						this.index++;
						this.tokens.push({
							index: start,
							text: rawString,
							string: string,
							json: true,
							fn: function () {
								return string
							}
						});
						return undefined;
					}
					string += ch;
				}
				this.index++;
			}
			this.throwError("Unterminated quote", start);
		}
	};
	function Parser(lexer, $filter, options) {
		this.lexer = lexer;
		this.$filter = $filter;
		this.options = options;
	};
	Parser.ZERO = function () {
		return 0
	};
	Parser.prototype = {
		constructor: Parser,
		parse: function (text, json) {
			this.text = text;
			this.json = json;
			this.tokens = this.lexer.lex(text);
			if (json) {
				this.assignment = this.logicalOR;
				this.functionCall = this.fieldAccess = this.objectIndex = this.filterChain = function () {
					this.throwError("is not valid json", {
						text: text,
						index: 0
					});
				};
			}
			var value;
			if (json) {
				value = this.primary();
			} else {
				value = this.statements();
			}
			if (this.tokens.length != 0) {
				this.throwError("is an unexpected token", this.tokens[0]);
			}
			value.literal = !!value.literal;
			value.constant = !!value.constant;
			return value;
		},
		primary: function () {
			var primary;
			if (this.expect("(")) {
				primary = this.filterChain();
				this.consume(")");
			}
			else if (this.expect("[")) {
				primary = this.arrayDeclaration();
			}
			else if (this.expect("{")) {
				primary = this.object();
			}
			else {
				var token = this.expect();
				primary = token.fn;
				if (!primary) {
					this.throwError("not a primary expression", token);
				}
				if (token.json) {
					primary.constant = true;
					primary.literal = true;
				}
			}
			for (var next, context; next = this.expect("(", "[", ".");) {
				if ("(" === next.text) {
					primary = this.functionCall(primary, context);
					context = null;
				} else if ("[" === next.text) {
					context = primary;
					primary = this.objectIndex(primary);
				} else if ("." === next.text) {
					context = primary;
					primary = this.fieldAccess(primary);
				} else {
					this.throwError("IMPOSSIBLE");
				}
			}
			return primary;
		},
		throwError: function (msg, token) {
			throw $parseMinErr("syntax", "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].", token.text, msg, token.index + 1, this.text, this.text.substring(token.index))
		},
		peekToken: function () {
			if (0 === this.tokens.length) throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
			return this.tokens[0]
		},
		peek: function (e1, e2, e3, e4) {
			if (this.tokens.length > 0) {
				var token = this.tokens[0],
					t = token.text;
				if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) {
					return token;
				}
			}
			return false;
		},
		expect: function (e1, e2, e3, e4) {
			var token = this.peek(e1, e2, e3, e4);
			if (token) {
				if (this.json && !token.json) {
					this.throwError("is not valid json", token);
				}
				this.tokens.shift();
				return token;
			} else {
				return false;
			}
		},
		consume: function (e1) {
			this.expect(e1) || this.throwError("is unexpected, expecting [" + e1 + "]", this.peek())
		},
		unaryFn: function (fn, right) {
			return extend(function (self, locals) {
				return fn(self, locals, right)
			}, {
				constant: right.constant
			})
		},
		ternaryFn: function (left, middle, right) {
			return extend(function (self, locals) {
				return left(self, locals) ? middle(self, locals) : right(self, locals)
			}, {
				constant: left.constant && middle.constant && right.constant
			})
		},
		binaryFn: function (left, fn, right) {
			return extend(function (self, locals) {
				return fn(self, locals, left, right)
			}, {
				constant: left.constant && right.constant
			})
		},
		statements: function () {
			for (var statements = []; ;) {
				if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]")) {
					statements.push(this.filterChain());
				}
				if (!this.expect(";")) {
					if (1 === statements.length) {
						return statements[0];
					} else {
						return function (self, locals) {
							for (var value, i = 0; i < statements.length; i++) {
								var statement = statements[i];
								statement && (value = statement(self, locals));
							}
							return value;
						}
					}
				}
			}
		},
		filterChain: function () {
			for (var token, left = this.expression(); ;) {
				token = this.expect("|");
				if (!token) return left;
				left = this.binaryFn(left, token.fn, this.filter())
			}
		},
		filter: function () {
			for (var token = this.expect(), fn = this.$filter(token.text), argsFn = []; ;) {
				if (!(token = this.expect(":"))) {
					var fnInvoke = function (self, locals, input) {
						for (var args = [input], i = 0; i < argsFn.length; i++) args.push(argsFn[i](self, locals));
						return fn.apply(self, args)
					};
					return function () {
						return fnInvoke
					}
				}
				argsFn.push(this.expression())
			}
		},
		expression: function () {
			return this.assignment()
		},
		assignment: function () {
			var right, token, left = this.ternary();
			return (token = this.expect("=")) ? (left.assign || this.throwError("implies assignment but [" + this.text.substring(0, token.index) + "] can not be assigned to", token), right = this.ternary(), function (scope, locals) {
				return left.assign(scope, right(scope, locals), locals)
			}) : left
		},
		ternary: function () {
			var middle, token, left = this.logicalOR();
			return (token = this.expect("?")) ? (middle = this.ternary(), (token = this.expect(":")) ? this.ternaryFn(left, middle, this.ternary()) : (this.throwError("expected :", token), void 0)) : left
		},
		logicalOR: function () {
			for (var token, left = this.logicalAND(); ;) {
				if (!(token = this.expect("||"))) return left;
				left = this.binaryFn(left, token.fn, this.logicalAND())
			}
		},
		logicalAND: function () {
			var token, left = this.equality();
			return (token = this.expect("&&")) && (left = this.binaryFn(left, token.fn, this.logicalAND())), left
		},
		equality: function () {
			var token, left = this.relational();
			return (token = this.expect("==", "!=", "===", "!==")) && (left = this.binaryFn(left, token.fn, this.equality())), left
		},
		relational: function () {
			var token, left = this.additive();
			return (token = this.expect("<", ">", "<=", ">=")) && (left = this.binaryFn(left, token.fn, this.relational())), left
		},
		additive: function () {
			for (var token, left = this.multiplicative(); token = this.expect("+", "-");) left = this.binaryFn(left, token.fn, this.multiplicative());
			return left
		},
		multiplicative: function () {
			for (var token, left = this.unary(); token = this.expect("*", "/", "%");) left = this.binaryFn(left, token.fn, this.unary());
			return left
		},
		unary: function () {
			var token;
			return this.expect("+") ? this.primary() : (token = this.expect("-")) ? this.binaryFn(Parser.ZERO, token.fn, this.unary()) : (token = this.expect("!")) ? this.unaryFn(token.fn, this.unary()) : this.primary()
		},
		fieldAccess: function (object) {
			var parser = this,
				field = this.expect().text,
				getter = getterFn(field, this.options, this.text);
			return extend(function (scope, locals, self) {
				return getter(self || object(scope, locals), locals)
			}, {
				assign: function (scope, value, locals) {
					return setter(object(scope, locals), field, value, parser.text, parser.options)
				}
			})
		},
		objectIndex: function (obj) {
			var parser = this,
				indexFn = this.expression();
			return this.consume("]"), extend(function (self, locals) {
				var v, p, o = obj(self, locals),
					i = indexFn(self, locals);
				return o ? (v = ensureSafeObject(o[i], parser.text), v && v.then && parser.options.unwrapPromises && (p = v, "$$v" in v || (p.$$v = undefined, p.then(function (val) {
					p.$$v = val
				})), v = v.$$v), v) : undefined
			}, {
				assign: function (self, value, locals) {
					var key = indexFn(self, locals),
						safe = ensureSafeObject(obj(self, locals), parser.text);
					return safe[key] = value
				}
			})
		},
		functionCall: function (fn, contextGetter) {
			var argsFn = [];
			if (")" !== this.peekToken().text)
				do argsFn.push(this.expression()); while (this.expect(","));
			this.consume(")");
			var parser = this;
			return function (scope, locals) {
				for (var args = [], context = contextGetter ? contextGetter(scope, locals) : scope, i = 0; i < argsFn.length; i++) {
					args.push(argsFn[i](scope, locals));
				}
				var fnPtr = fn(scope, locals, context) || noop;
				ensureSafeObject(context, parser.text);
				ensureSafeObject(fnPtr, parser.text);
				if (fnPtr.apply) {
					var v = fnPtr.apply(context, args);
				} else {
					var v = fnPtr(args[0], args[1], args[2], args[3], args[4]);
				}
				return ensureSafeObject(v, parser.text);
			}
		},
		arrayDeclaration: function () {
			var elementFns = [],
				allConstant = !0;
			if ("]" !== this.peekToken().text)
				do {
					var elementFn = this.expression();
					elementFns.push(elementFn), elementFn.constant || (allConstant = !1)
				} while (this.expect(","));
			return this.consume("]"), extend(function (self, locals) {
				for (var array = [], i = 0; i < elementFns.length; i++) array.push(elementFns[i](self, locals));
				return array
			}, {
				literal: !0,
				constant: allConstant
			})
		},
		object: function () {
			var keyValues = [],
				allConstant = !0;
			if ("}" !== this.peekToken().text)
				do {
					var token = this.expect(),
						key = token.string || token.text;
					this.consume(":");
					var value = this.expression();
					keyValues.push({
						key: key,
						value: value
					}), value.constant || (allConstant = !1)
				} while (this.expect(","));
			return this.consume("}"), extend(function (self, locals) {
				for (var object = {}, i = 0; i < keyValues.length; i++) {
					var keyValue = keyValues[i];
					object[keyValue.key] = keyValue.value(self, locals)
				}
				return object
			}, {
				literal: !0,
				constant: allConstant
			})
		}
	};
	//=======================================

	function $ParseProvider() {
		var cache = {}, $parseOptions = {
			csp: !1,
			unwrapPromises: !1,
			logPromiseWarnings: !0
		};
		this.unwrapPromises = function (value) {
			if (isDefined(value)) {
				$parseOptions.unwrapPromises = !!value;
				return this;
			}
			return $parseOptions.unwrapPromises;
		};
		this.logPromiseWarnings = function (value) {
			if (isDefined(value)) {
				$parseOptions.logPromiseWarnings = value;
				return this;
			}
			return $parseOptions.logPromiseWarnings;
		};
		this.$get = ["$filter", "$sniffer", "$log",
			function ($filter, $sniffer, $log) {
				$parseOptions.csp = $sniffer.csp;
				promiseWarning = function (fullExp) {
					if ($parseOptions.logPromiseWarnings && !promiseWarningCache.hasOwnProperty(fullExp)) {
						promiseWarningCache[fullExp] = !0;
						$log.warn("[$parse] Promise found in the expression `" + fullExp + "`. Automatic unwrapping of promises in Angular expressions is deprecated.");
					}
				};
				return function (exp) {
					var parsedExpression;
					switch (typeof exp) {
						case "string":
							if (cache.hasOwnProperty(exp)) { //使用缓存
								return cache[exp];
							}
							var lexer = new Lexer($parseOptions),
								parser = new Parser(lexer, $filter, $parseOptions);
							parsedExpression = parser.parse(exp, !1);
							if ("hasOwnProperty" !== exp) {
								cache[exp] = parsedExpression;//缓存
							}
							return parsedExpression;
						case "function": //是函数,直接返回
							return exp;
						default:         //其它的返回一个空函数
							return noop
					}
				}
			}
		]
	}

	function $QProvider() {
		this.$get = ["$rootScope", "$exceptionHandler",
			function ($rootScope, $exceptionHandler) {
				var nextTick = function (callback) {
					$rootScope.$evalAsync(callback);
				};
				return qFactory(nextTick, $exceptionHandler);
			}
		]
	}

	function qFactory(nextTick, exceptionHandler) {
		function defaultCallback(value) {
			return value
		}

		function defaultErrback(reason) {
			return reject(reason)
		}

		function all(promises) {
			var deferred = defer(),
				counter = 0,
				results = isArray(promises) ? [] : {};
			forEach(promises, function (promise, key) {
				counter++;
				ref(promise).then(function (value) {
					if (!results.hasOwnProperty(key)) {
						results[key] = value;
						if (--counter == 0) {
							deferred.resolve(results);
						}
					}
				}, function (reason) {
					if (!results.hasOwnProperty(key)) {
						deferred.reject(reason);
					}
				});
			})
			if (0 === counter) {
				deferred.resolve(results)
			}
			return deferred.promise;
		}

		var defer = function () {
				defer.count = defer.count || 0;
				defer.count++;
				console.log(defer.count);
				var value, deferred, pending = [];
				return deferred = {
					resolve: function (val) { //发送任务完成
						if (pending) {
							var callbacks = pending;
							pending = undefined;
							value = ref(val);
							if (callbacks.length) {
								nextTick(function () {
									var callback;
									for (var i = 0; i < callbacks.length; i++) {
										callback = callbacks[i];
										value.then(callback[0], callback[1], callback[2]);
									}
								});
							}
						}
					},
					reject: function (reason) {
						deferred.resolve(reject(reason));
					},
					notify: function (progress) {
						if (pending) {
							var callbacks = pending;
							if (pending.length) {
								nextTick(function () {
									for (var callback, i = 0, ii = callbacks.length; ii > i; i++) {
										callback = callbacks[i];
										callback[2](progress);
									}
								});
							}
						}
					},
					promise: {
						then: function (callback, errback, progressback) {
							var result = defer(),

								wrappedCallback = function (value) {
									try {
										result.resolve((isFunction(callback) ? callback : defaultCallback)(value))
									} catch (e) {
										result.reject(e), exceptionHandler(e)
									}
								},
								wrappedErrback = function (reason) {
									try {
										result.resolve((isFunction(errback) ? errback : defaultErrback)(reason))
									} catch (e) {
										result.reject(e), exceptionHandler(e)
									}
								},
								wrappedProgressback = function (progress) {
									try {
										result.notify((isFunction(progressback) ? progressback : defaultCallback)(progress))
									} catch (e) {
										exceptionHandler(e)
									}
								};
							if (pending) {
								pending.push([wrappedCallback, wrappedErrback, wrappedProgressback])
							} else {
								value.then(wrappedCallback, wrappedErrback, wrappedProgressback)
							}
							return result.promise;
						},
						"catch": function (callback) {
							return this.then(null, callback);
						},
						"finally": function (callback) {
							function makePromise(value, resolved) {
								var result = defer();
								if (resolved) {
									result.resolve(value)
								} else {
									result.reject(value)
								}
								return result.promise;
							}

							function handleCallback(value, isResolved) {
								var callbackOutput = null;
								try {
									callbackOutput = (callback || defaultCallback)()
								} catch (e) {
									return makePromise(e, !1)
								}
								if (callbackOutput && isFunction(callbackOutput.then)) {
									return callbackOutput.then(function () {
										return makePromise(value, isResolved)
									}, function (error) {
										return makePromise(error, !1)
									});
								} else {
									return makePromise(value, isResolved);
								}
							}

							return this.then(function (value) {
								return handleCallback(value, !0)
							}, function (error) {
								return handleCallback(error, !1)
							});
						}
					}
				}
			},
			ref = function (value) { //保证返回带有then属性的对象
				if (value && isFunction(value.then)) {
					return value;
				} else {
					return {
						then: function (callback) {
							var result = defer();
							nextTick(function () {
								result.resolve(callback(value))
							});
							return result.promise;
						}
					}
				}
			},
			reject = function (reason) {
				return {
					then: function (callback, errback) {
						var result = defer();
						nextTick(function () {
							try {
								result.resolve((isFunction(errback) ? errback : defaultErrback)(reason))
							} catch (e) {
								result.reject(e);
								exceptionHandler(e);
							}
						});
						return result.promise;
					}
				}
			},
			when = function (value, callback, errback, progressback) { //return promise
				var done, result = defer();

				wrappedCallback = function (value) {
					try {
						return (isFunction(callback) ? callback : defaultCallback)(value)
					} catch (e) {
						return exceptionHandler(e), reject(e)
					}
				};
				wrappedErrback = function (reason) {
					try {
						return (isFunction(errback) ? errback : defaultErrback)(reason)
					} catch (e) {
						return exceptionHandler(e), reject(e)
					}
				};
				wrappedProgressback = function (progress) {
					try {
						return (isFunction(progressback) ? progressback : defaultCallback)(progress)
					} catch (e) {
						exceptionHandler(e)
					}
				};
				nextTick(function () {
					ref(value).then(function (value) {
						done || (done = !0, result.resolve(ref(value).then(wrappedCallback, wrappedErrback, wrappedProgressback)))
					}, function (reason) {
						done || (done = !0, result.resolve(wrappedErrback(reason)))
					}, function (progress) {
						done || result.notify(wrappedProgressback(progress))
					});
				});
				return result.promise;
			};
		return {
			defer: defer,
			reject: reject,
			when: when,
			all: all
		}
	}

	function $RootScopeProvider() { //rootScope服务
		var TTL = 10,
			$rootScopeMinErr = minErr("$rootScope");  //错误处理函数$rootScopeMinErr
		this.digestTtl = function (value) {
			return arguments.length && (TTL = value), TTL  //有参数为设置TTL,无参为获取TTL
		};
		this.$get = ["$injector", "$exceptionHandler", "$parse", "$browser",
			function ($injector, $exceptionHandler, $parse, $browser) {  //
				function Scope() {  //Scope构造函数
					this.$id = nextUid(), //实例属性
						//下面这些属性创建实例的时候设置为空,在某些条件下才给设置值
						this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null,
						this["this"] = this.$root = this, //把scope的$root属性只想
						this.$$destroyed = !1, //没有销毁的标志
						this.$$asyncQueue = [], //异步队列数组
						this.$$postDigestQueue = [],
						this.$$listeners = {},
						this.$$isolateBindings = {}
				}

				function beginPhase(phase) {
					if ($rootScope.$$phase) { //$$phase,异常标志,如果已经存在,抛出异常(如digest已经在执行时,再执行出现的异常)
						throw $rootScopeMinErr("inprog", "{0} already in progress", $rootScope.$$phase);
					}
					$rootScope.$$phase = phase //每一次执行digest之前设置该属性
				}

				function clearPhase() {
					$rootScope.$$phase = null  //执行完成digest之后清除该标志
				}

				function compileToFn(exp, name) { //编译成函数
					var fn = $parse(exp); //把一个表达式编译成函数
					assertArgFn(fn, name); //断言是否是函数,不是则抛出异常,不会执行下去
					return fn;
				}

				function initWatchVal() {
				}

				//Scope原型
				Scope.prototype = { //这些原型方法在scope创建成功之后执行
					constructor: Scope,//构造器标志
					$new: function (isolate) { //创建
						var Child, child;
						if (isolate) { //true,指令的独立作用域,非extend来的
							child = new Scope;
							child.$root = this.$root;//独立作用域特有的东西
							child.$$asyncQueue = this.$$asyncQueue; //独立作用域特有的东西
							child.$$postDigestQueue = this.$$postDigestQueue; //独立作用域特有的东西
						} else {
							Child = function () { //子作用域构造函数
							};
							Child.prototype = this; //把当前的对象作为其原型
							child = new Child;
							child.$id = nextUid(); //设置唯一id
						}
						child["this"] = child;//实例属性初始 化
						child.$$listeners = {};
						child.$parent = this;
						child.$$watchers = child.$$nextSibling = child.$$childHead = child.$$childTail = null;
						child.$$prevSibling = this.$$childTail; //该scope下上一次创建的Scope作为这一次创建的前一个兄弟
						if (this.$$childHead) { //如果当前scope有孩子scope的头
							this.$$childTail.$$nextSibling = child; //把当前的创建出来的孩子作为上一次创建出来的孩子的下一个兄弟
							this.$$childTail = child;//这一次创建出来的孩子放在当前的$$childTail,来标志每一次创建孩子时的最后一次创建的孩子
						} else { //如果没有第一个孩子
							this.$$childHead = this.$$childTail = child;//把当前的孩子作为第一个孩子,并设置其为最后一次创建的孩子
						}
						return child;
					},
					$watch: function (watchExp, listener, objectEquality) {
						var scope = this,
							get = compileToFn(watchExp, "watch"),//使用$parse解析表达式为一个get函数(获取值)
							array = scope.$$watchers,
							watcher = {
								fn: listener, //监听函数
								last: initWatchVal,//这是个空函数
								get: get, //使用$parse解析表达式为一个get函数(获取值)
								exp: watchExp, //监听的表达式
								eq: !!objectEquality //true深度比较,false简单的值比较,这里把非布尔值转成bool类型
							};
						if (!isFunction(listener)) { //如果监听函数不是函数,
							var listenFn = compileToFn(listener || noop, "listener");
							watcher.fn = function (newVal, oldVal, scope) {//使用$parse解析出一个监听函数,在该匿名函数中执行
								listenFn(scope);
							}
						}
						if ("string" == typeof watchExp && get.constant) {//表达式是字符串且get的字段不存在...
							var originalFn = watcher.fn;
							watcher.fn = function (newVal, oldVal, scope) { //执行监听函数之后就把监听器移出
								originalFn.call(this, newVal, oldVal, scope);
								arrayRemove(array, watcher); //
							}
						}
						array || (array = scope.$$watchers = []); //监听器队列不存在创建
						array.unshift(watcher); //监听器入队
						return function () {//返回一个函数用来移出该监听器
							arrayRemove(array, watcher);
						}
					},
					$watchCollection: function (obj, listener) {
						function $watchCollectionWatch() {
							newValue = objGetter(self);
							var newLength, key;
							if (isObject(newValue))
								if (isArrayLike(newValue)) {
									oldValue !== internalArray && (oldValue = internalArray, oldLength = oldValue.length = 0, changeDetected++), newLength = newValue.length, oldLength !== newLength && (changeDetected++, oldValue.length = oldLength = newLength);
									for (var i = 0; newLength > i; i++) oldValue[i] !== newValue[i] && (changeDetected++, oldValue[i] = newValue[i])
								} else {
									oldValue !== internalObject && (oldValue = internalObject = {}, oldLength = 0, changeDetected++), newLength = 0;
									for (key in newValue) newValue.hasOwnProperty(key) && (newLength++, oldValue.hasOwnProperty(key) ? oldValue[key] !== newValue[key] && (changeDetected++, oldValue[key] = newValue[key]) : (oldLength++, oldValue[key] = newValue[key], changeDetected++));
									if (oldLength > newLength) {
										changeDetected++;
										for (key in oldValue) oldValue.hasOwnProperty(key) && !newValue.hasOwnProperty(key) && (oldLength--, delete oldValue[key])
									}
								} else oldValue !== newValue && (oldValue = newValue, changeDetected++);
							return changeDetected
						}

						function $watchCollectionAction() {
							listener(newValue, oldValue, self)
						}

						var oldValue, newValue, self = this,
							changeDetected = 0,
							objGetter = $parse(obj),
							internalArray = [],
							internalObject = {}, oldLength = 0;
						return this.$watch($watchCollectionWatch, $watchCollectionAction)
					},
					$digest: function () {
						var watch, value, last, watchers, length, dirty, next, current,
							logIdx, logMsg, asyncTask, asyncQueue = this.$$asyncQueue,
							postDigestQueue = this.$$postDigestQueue,
							ttl = TTL,
							target = this, //目标是当前scope对象
							watchLog = [];
						console.info("do $digest");
						beginPhase("$digest"); //开始标志
						do {
							dirty = !1;
							current = target; //目标scope对象作为当前循环的scope对象
							for (; asyncQueue.length;)
								try {
									asyncTask = asyncQueue.shift();//队列里面的属性第一个是scope,第二个expression
									asyncTask.scope.$eval(asyncTask.expression);//这里拿到scope然后在对应的scope上执行$eval(exp)
								} catch (e) {
									$exceptionHandler(e)
								}
							console.log(current);
							do {
								if (watchers = current.$$watchers) //当前scope存在监听器
									for (length = watchers.length; length--;) //遍历所有监听器
										try {
											watch = watchers[length]; //从最后一个监听器开始
											if (watch) {
												console.log("watch:" + watch.exp);
												value = watch.get(current);
												last = watch.last;
												if (value !== last) {
													var flag = false;
													if (watch.eq) { //深度比较2个对象是否相等
														flag = equals(value, last);
													} else {  //value和last都是数字,并且是非法数字
														flag = "number" == typeof value && "number" == typeof last && isNaN(value) && isNaN(last);
													}
													if (!flag) { //深度比较时value和last相等,非深度比较时2个数字都非法时,下面的语句都不执行
														//深度比较为false,非深度比较
														dirty = !0;
														watch.last = (watch.eq ? copy(value) : value); //设置最后一次监听到的值
														watch.fn(value, last === initWatchVal ? value : last, current); //执行监听函数
														if (5 > ttl) {
															logIdx = 4 - ttl;
															watchLog[logIdx] || (watchLog[logIdx] = []);
															if (isFunction(watch.exp)) {
																logMsg = "fn: " + (watch.exp.name || watch.exp.toString());
															}
															logMsg = watch.exp;
															logMsg += "; newVal: " + toJson(value) + "; oldVal: " + toJson(last);
															watchLog[logIdx].push(logMsg);
														}
													}
												}

											}
										} catch (e) {
											$exceptionHandler(e)
										}
								//深度遍历
								//存在子scope,继续遍历子scope
								//不存在子scope,当前scope不是初始顶点target($rootScope.$digest()),且存在下一个兄弟scope
								var flagx = current !== target;
								if (current.$$childHead) {
									next = current.$$childHead;
								} else if (!flagx) {
									next = false;
								} else if (flagx) {
									next = current.$$nextSibling;
								}

								console.info(flagx ? "--------->noroot:::$id=" + current.$id : "-------->rootscope:::$id=" + current.$id);
								//上面的查找分3种情况:存在子scope,把当前的子scope给next,next为真进行下一while循环;没有子scope,并且不是顶点rootscope,这时候把
								//当前scope的下一个兄弟给next,如果下一个兄弟是不存在的,这里会进入下面的for循环（这个循环向上回归到父scope为当前,继续查找当前(parent)
								// 的下一个存在的兄弟，存在进入while循环,不存在继续向上回归,直到回归到rootscope,这时候next为null,while循环终止)
								if (!next) {
									next = current.$$nextSibling;
									for (; current !== target;) {
										current = current.$parent;
										next = current.$$nextSibling;
										if (next) {
											break;
										}
									}
								}
							} while (current = next); //这里当next是undefined或者null时跳出循环
							if (dirty && !ttl--) {//5次后还是dirty为结束
								clearPhase();
								throw  $rootScopeMinErr("infdig", "{0} $digest() iterations reached. Aborting!\nWatchers fired in the last 5 iterations: {1}", TTL, toJson(watchLog));
							}
							console.info("dirty====" + dirty);
						} while (dirty || asyncQueue.length); //当dirty标志为true或者异步队列长度大于0时
						clearPhase();//执行完结束
						for (; postDigestQueue.length;)
							try {
								postDigestQueue.shift()(); //脏检测之后的一些逻辑
							} catch (e) {
								$exceptionHandler(e);
							}
					},
					$destroy: function () {
						if ($rootScope != this && !this.$$destroyed) { //当前scope不是rootscope并且是没有销毁的
							var parent = this.$parent;
							this.$broadcast("$destroy"); //广播一下通知所有的scope这里把当前scope销毁了
							this.$$destroyed = !0; //设置销毁标志
							parent.$$childHead == this && (parent.$$childHead = this.$$nextSibling);//如果这是第一个孩子,把下一个兄弟作为父scope的度一个孩子
							parent.$$childTail == this && (parent.$$childTail = this.$$prevSibling); //如果这是最后一次创建出来的孩子,则把前一个兄弟作为父scope最后一次创建出来的孩子
							this.$$prevSibling && (this.$$prevSibling.$$nextSibling = this.$$nextSibling);//有前一个兄弟则把前一个兄弟的$$nextSibling作为前一个兄弟的下一个兄弟
							this.$$nextSibling && (this.$$nextSibling.$$prevSibling = this.$$prevSibling);//有下一个兄弟则把下一个兄弟的$$prevSibling作为下一个兄弟的前一个兄弟
							this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null //把当前scope的属性清空
						}
					},
					$eval: function (expr, locals) {
						return $parse(expr)(this, locals);
					},
					$evalAsync: function (expr) {
						//$$phase只有在$apply或者$digest时候存在,表示不同阶段
						if (!$rootScope.$$phase && !$rootScope.$$asyncQueue.length) {//$rootScope没有$$phase标志,且$rootScope.$$asyncQueue数组长度为0执行下面
							$browser.defer(function () {
								if ($rootScope.$$asyncQueue.length) { //异步队列长度为不为0执行
									$rootScope.$digest();
								}
							});
						}
						this.$$asyncQueue.push({ //异步任务入队
							scope: this,
							expression: expr
						})
					},
					$$postDigest: function (fn) {
						this.$$postDigestQueue.push(fn);//该队列存储了脏检测执行之后需要执行的逻辑
					},
					$apply: function (expr) {
						try {
							beginPhase("$apply"); //设定开始执行表达式标志
							return this.$eval(expr);//执行表达式(Scope变更)
						} catch (e) {
							$exceptionHandler(e); //异常处理
						} finally {
							clearPhase();//清除执行表达式标志
							try {
								$rootScope.$digest(); //脏值检测(View变更)
							} catch (e) {
								throw $exceptionHandler(e), e;
							}
						}
					},
					$on: function (name, listener) {  //
						var namedListeners = this.$$listeners[name];
						if (!namedListeners) {
							this.$$listeners[name] = namedListeners = [];
							namedListeners.push(listener);
						}
						return function () {
							namedListeners[indexOf(namedListeners, listener)] = null
						}
					},
					$emit: function (name) {
						var namedListeners, i, length, empty = [],
							scope = this,
							stopPropagation = !1,
							event = {
								name: name,
								targetScope: scope,
								stopPropagation: function () {
									stopPropagation = !0
								},
								preventDefault: function () {
									event.defaultPrevented = !0
								},
								defaultPrevented: !1
							},
							listenerArgs = concat([event], arguments, 1);
						do {
							namedListeners = scope.$$listeners[name] || empty;
							event.currentScope = scope;
							for (i = 0, length = namedListeners.length; length > i; i++)
								if (namedListeners[i])
									try {
										namedListeners[i].apply(null, listenerArgs);
									} catch (e) {
										$exceptionHandler(e)
									} else {
									namedListeners.splice(i, 1), i--, length--;
								}
							if (stopPropagation) {
								return event;
							}
							scope = scope.$parent;
						} while (scope);
						return event
					},
					$broadcast: function (name) {
						console.log('$broadcast');
						var listeners, i, length, target = this,
							current = target,
							next = target,
							event = {
								name: name,
								targetScope: target,
								preventDefault: function () {
									event.defaultPrevented = !0
								},
								defaultPrevented: !1
							},
							listenerArgs = concat([event], arguments, 1);
						do {
							current = next,
								event.currentScope = current,
								listeners = current.$$listeners[name] || [];
							if (/destroy/.test(name)) {
								console.log(111111);
								console.log(listeners);
							}
							for (i = 0, length = listeners.length; length > i; i++)
								if (listeners[i]) try {
									listeners[i].apply(null, listenerArgs);
								} catch (e) {
									$exceptionHandler(e)
								} else {
									listeners.splice(i, 1), i--, length--;
								}
							if (!(next = current.$$childHead || current !== target && current.$$nextSibling))
								for (; current !== target && !(next = current.$$nextSibling);) {
									current = current.$parent;
								}
						} while (current = next);
						return event
					}
				};
				var $rootScope = new Scope;
				return $rootScope;
			}
		]
	}

	function escapeForRegexp(s) {
		return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
	}

	function adjustMatcher(matcher) {
		if ("self" === matcher) return matcher;
		if (isString(matcher)) {
			if (matcher.indexOf("***") > -1) throw $sceMinErr("iwcard", "Illegal sequence *** in string matcher.  String: {0}", matcher);
			return matcher = escapeForRegexp(matcher).replace("\\*\\*", ".*").replace("\\*", "[^:/.?&;]*"), new RegExp("^" + matcher + "$")
		}
		if (isRegExp(matcher)) return new RegExp("^" + matcher.source + "$");
		throw $sceMinErr("imatcher", 'Matchers may only be "self", string patterns or RegExp objects')
	}

	function adjustMatchers(matchers) {
		var adjustedMatchers = [];
		return isDefined(matchers) && forEach(matchers, function (matcher) {
			adjustedMatchers.push(adjustMatcher(matcher))
		}), adjustedMatchers
	}

	function $SceDelegateProvider() {
		this.SCE_CONTEXTS = SCE_CONTEXTS;
		var resourceUrlWhitelist = ["self"],
			resourceUrlBlacklist = [];
		this.resourceUrlWhitelist = function (value) {
			return arguments.length && (resourceUrlWhitelist = adjustMatchers(value)), resourceUrlWhitelist
		};
		this.resourceUrlBlacklist = function (value) {
			return arguments.length && (resourceUrlBlacklist = adjustMatchers(value)), resourceUrlBlacklist
		};
		this.$get = ["$log", "$document", "$injector",
			function ($log, $document, $injector) {
				function matchUrl(matcher, parsedUrl) {
					return "self" === matcher ? urlIsSameOrigin(parsedUrl) : !!matcher.exec(parsedUrl.href)
				}

				function isResourceUrlAllowedByPolicy(url) {
					var i, n, parsedUrl = urlResolve(url.toString()),
						allowed = !1;
					for (i = 0, n = resourceUrlWhitelist.length; n > i; i++)
						if (matchUrl(resourceUrlWhitelist[i], parsedUrl)) {
							allowed = !0;
							break
						}
					if (allowed)
						for (i = 0, n = resourceUrlBlacklist.length; n > i; i++)
							if (matchUrl(resourceUrlBlacklist[i], parsedUrl)) {
								allowed = !1;
								break
							}
					return allowed
				}

				function generateHolderType(Base) {
					var holderType = function (trustedValue) {
						this.$$unwrapTrustedValue = function () {
							return trustedValue
						}
					};
					if (Base) {
						holderType.prototype = new Base;
					}
					holderType.prototype.valueOf = function () {
						return this.$$unwrapTrustedValue()
					};
					holderType.prototype.toString = function () {
						return this.$$unwrapTrustedValue().toString()
					};
					return holderType;
				}

				function trustAs(type, trustedValue) {
					var Constructor = null;
					if (byType.hasOwnProperty(type)) {
						Constructor = byType[type];
					}
					if (!Constructor) {
						throw $sceMinErr("icontext", "Attempted to trust a value in invalid context. Context: {0}; Value: {1}",
							type, trustedValue);
					}
					if (null === trustedValue || trustedValue === undefined || "" === trustedValue) {
						return trustedValue;
					}
					if ("string" != typeof trustedValue) {
						throw $sceMinErr("itype", "Attempted to trust a non-string value in a content requiring a string: Context: {0}", type);
					}
					return new Constructor(trustedValue);
				}

				function valueOf(maybeTrusted) {
					if (maybeTrusted instanceof trustedValueHolderBase) {
						return maybeTrusted.$$unwrapTrustedValue();
					}
					return maybeTrusted;
				}

				function getTrusted(type, maybeTrusted) {
					if (null === maybeTrusted || maybeTrusted === undefined || "" === maybeTrusted) {
						return maybeTrusted;
					}
					var constructor = null;
					if (byType.hasOwnProperty(type)) {
						constructor = byType[type];
					}
					if (constructor && maybeTrusted instanceof constructor) {
						return maybeTrusted.$$unwrapTrustedValue();
					}
					if (type === SCE_CONTEXTS.RESOURCE_URL) {
						if (isResourceUrlAllowedByPolicy(maybeTrusted)) {
							return maybeTrusted;
						}
						throw $sceMinErr("insecurl", "Blocked loading resource from url not allowed by $sceDelegate policy.  URL: {0}", maybeTrusted.toString())
					}
					if (type === SCE_CONTEXTS.HTML) {
						return htmlSanitizer(maybeTrusted);
					}
					throw $sceMinErr("unsafe", "Attempting to use an unsafe value in a safe context.")
				}

				var htmlSanitizer = function () {
					throw $sceMinErr("unsafe", "Attempting to use an unsafe value in a safe context.")
				};
				$injector.has("$sanitize") && (htmlSanitizer = $injector.get("$sanitize"));
				var trustedValueHolderBase = generateHolderType(), byType = {};
				byType[SCE_CONTEXTS.HTML] = generateHolderType(trustedValueHolderBase);
				byType[SCE_CONTEXTS.CSS] = generateHolderType(trustedValueHolderBase);
				byType[SCE_CONTEXTS.URL] = generateHolderType(trustedValueHolderBase);
				byType[SCE_CONTEXTS.JS] = generateHolderType(trustedValueHolderBase);
				byType[SCE_CONTEXTS.RESOURCE_URL] = generateHolderType(byType[SCE_CONTEXTS.URL]);
				return {
					trustAs: trustAs,
					getTrusted: getTrusted,
					valueOf: valueOf
				};
			}
		]
	}

	function $SceProvider() {
		var enabled = !0;
		this.enabled = function (value) {
			if (arguments.length) {
				enabled = !!value;
			}
			return enabled;
		};
		this.$get = ["$parse", "$document", "$sceDelegate",
			function ($parse, $document, $sceDelegate) {
				if (enabled && msie) {
					var documentMode = $document[0].documentMode;
					if (documentMode !== undefined && 8 > documentMode) {
						throw $sceMinErr("iequirks", "Strict Contextual Escaping does not support Internet Explorer version < 9 in quirks mode.  " +
							"You can fix this by adding the text <!doctype html> to the top of your HTML document.  See http://docs.angularjs.org/api/ng.$sce for more information.")
					}
				}
				var sce = copy(SCE_CONTEXTS);
				sce.isEnabled = function () {
					return enabled
				};
				sce.trustAs = $sceDelegate.trustAs;
				sce.getTrusted = $sceDelegate.getTrusted;
				sce.valueOf = $sceDelegate.valueOf;
				if (!enabled) {
					sce.trustAs = sce.getTrusted = function (type, value) {
						return value
					};
					sce.valueOf = identity;
				}
				sce.parseAs = function (type, expr) {
					var parsed = $parse(expr);
					if (parsed.literal && parsed.constant) {
						return parsed;
					}
					return function (self, locals) {
						return sce.getTrusted(type, parsed(self, locals));
					}
				};
				var parse = sce.parseAs,
					getTrusted = sce.getTrusted,
					trustAs = sce.trustAs;
				//SCE_CONTEXTS={
				//HTML: "html",
				//CSS: "css",
				//URL: "url",
				//RESOURCE_URL: "resourceUrl",
				//JS: "js"
				//}
				forEach(SCE_CONTEXTS, function (enumValue, name) {
					var lName = lowercase(name);
					sce[camelCase("parse_as_" + lName)] = function (expr) {
						return parse(enumValue, expr);
					};
					sce[camelCase("get_trusted_" + lName)] = function (value) {
						return getTrusted(enumValue, value);
					};
					sce[camelCase("trust_as_" + lName)] = function (value) {
						return trustAs(enumValue, value);
					}
				});
				return sce;
			}
		]
	}

	function $SnifferProvider() {
		this.$get = ["$window", "$document",
			function ($window, $document) {
				var vendorPrefix, match, eventSupport = {}, android = int((/android (\d+)/.exec(lowercase(($window.navigator || {}).userAgent)) || [])[1]),
					boxee = /Boxee/i.test(($window.navigator || {}).userAgent),
					document = $document[0] || {}, vendorRegex = /^(Moz|webkit|O|ms)(?=[A-Z])/,
					bodyStyle = document.body && document.body.style,
					transitions = !1,
					animations = !1;
				if (bodyStyle) {
					for (var prop in bodyStyle)
						if (match = vendorRegex.exec(prop)) {
							vendorPrefix = match[0], vendorPrefix = vendorPrefix.substr(0, 1).toUpperCase() + vendorPrefix.substr(1);
							break
						}
					vendorPrefix || (vendorPrefix = "WebkitOpacity" in bodyStyle && "webkit"), transitions = !!("transition" in bodyStyle || vendorPrefix + "Transition" in bodyStyle), animations = !!("animation" in bodyStyle || vendorPrefix + "Animation" in bodyStyle), !android || transitions && animations || (transitions = isString(document.body.style.webkitTransition), animations = isString(document.body.style.webkitAnimation))
				}
				return {
					history: !(!$window.history || !$window.history.pushState || 4 > android || boxee),
					hashchange: "onhashchange" in $window && (!document.documentMode || document.documentMode > 7),
					hasEvent: function (event) {
						if ("input" == event && 9 == msie) return !1;
						if (isUndefined(eventSupport[event])) {
							var divElm = document.createElement("div");
							eventSupport[event] = "on" + event in divElm
						}
						return eventSupport[event]
					},
					csp: csp(),
					vendorPrefix: vendorPrefix,
					transitions: transitions,
					animations: animations,
					msie: msie
				}
			}
		]
	}

	function $TimeoutProvider() {
		this.$get = ["$rootScope", "$browser", "$q", "$exceptionHandler",
			function ($rootScope, $browser, $q, $exceptionHandler) {
				function timeout(fn, delay, invokeApply) {
					var timeoutId,
						deferred = $q.defer(),
						promise = deferred.promise,
						skipApply = isDefined(invokeApply) && !invokeApply;
					timeoutId = $browser.defer(function () {
						try {
							deferred.resolve(fn())
						} catch (e) {
							deferred.reject(e), $exceptionHandler(e)
						} finally {
							delete deferreds[promise.$$timeoutId]
						}
						skipApply || $rootScope.$apply()
					}, delay);
					promise.$$timeoutId = timeoutId;
					deferreds[timeoutId] = deferred;
					return promise;
				}

				var deferreds = {};
				timeout.cancel = function (promise) {
					if (promise && promise.$$timeoutId in deferreds) {
						deferreds[promise.$$timeoutId].reject("canceled");
						delete deferreds[promise.$$timeoutId];
						$browser.defer.cancel(promise.$$timeoutId);
					}
					return !1;
				};
				return timeout;
			}
		]
	}

	function urlResolve(url, base) {
		var pathname, href = url;
		return msie && (urlParsingNode.setAttribute("href", href), href = urlParsingNode.href), urlParsingNode.setAttribute("href", href), pathname = removeWindowsDriveName(urlParsingNode.pathname, url, base), pathname = "/" === pathname.charAt(0) ? pathname : "/" + pathname, {
			href: urlParsingNode.href,
			protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
			host: urlParsingNode.host,
			search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
			hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
			hostname: urlParsingNode.hostname,
			port: urlParsingNode.port,
			pathname: pathname
		}
	}

	function urlIsSameOrigin(requestUrl) {
		var parsed = isString(requestUrl) ? urlResolve(requestUrl) : requestUrl;
		return parsed.protocol === originUrl.protocol && parsed.host === originUrl.host
	}

	function removeWindowsDriveName(path, url, base) {
		var firstPathSegmentMatch;
		return 0 === url.indexOf(base) && (url = url.replace(base, "")), windowsFilePathExp.exec(url) ? path : (firstPathSegmentMatch = windowsFilePathExp.exec(path), firstPathSegmentMatch ? firstPathSegmentMatch[1] : path)
	}

	function $WindowProvider() {
		this.$get = valueFn(window)
	}

	function $FilterProvider($provide) {
		function register(name, factory) {
			if (isObject(name)) {
				var filters = {};
				forEach(name, function (filter, key) {
					filters[key] = register(key, filter)
				});
				return filters;
			}
			return $provide.factory(name + suffix, factory);
		}

		var suffix = "Filter";
		this.register = register;
		this.$get = ["$injector",
			function ($injector) {
				return function (name) {
					return $injector.get(name + suffix)
				}
			}
		];
		register("currency", currencyFilter);
		register("date", dateFilter);
		register("filter", filterFilter);
		register("json", jsonFilter);
		register("limitTo", limitToFilter);
		register("lowercase", lowercaseFilter);
		register("number", numberFilter);
		register("orderBy", orderByFilter);
		register("uppercase", uppercaseFilter);
	}

	function filterFilter() {
		return function (array, expression, comparator) {
			if (!isArray(array)) return array;
			var comparatorType = typeof comparator,
				predicates = [];
			predicates.check = function (value) {
				for (var j = 0; j < predicates.length; j++)
					if (!predicates[j](value)) return !1;
				return !0
			}, "function" !== comparatorType && (comparator = "boolean" === comparatorType && comparator ? function (obj, text) {
				return angular.equals(obj, text)
			} : function (obj, text) {
				return text = ("" + text).toLowerCase(), ("" + obj).toLowerCase().indexOf(text) > -1
			});
			var search = function (obj, text) {
				if ("string" == typeof text && "!" === text.charAt(0)) return !search(obj, text.substr(1));
				switch (typeof obj) {
					case "boolean":
					case "number":
					case "string":
						return comparator(obj, text);
					case "object":
						switch (typeof text) {
							case "object":
								return comparator(obj, text);
							default:
								for (var objKey in obj)
									if ("$" !== objKey.charAt(0) && search(obj[objKey], text)) return !0
						}
						return !1;
					case "array":
						for (var i = 0; i < obj.length; i++)
							if (search(obj[i], text)) return !0;
						return !1;
					default:
						return !1
				}
			};
			switch (typeof expression) {
				case "boolean":
				case "number":
				case "string":
					expression = {
						$: expression
					};
				case "object":
					for (var key in expression) "$" == key ? !function () {
						if (expression[key]) {
							var path = key;
							predicates.push(function (value) {
								return search(value, expression[path])
							})
						}
					}() : !function () {
						if ("undefined" != typeof expression[key]) {
							var path = key;
							predicates.push(function (value) {
								return search(getter(value, path), expression[path])
							})
						}
					}();
					break;
				case "function":
					predicates.push(expression);
					break;
				default:
					return array
			}
			for (var filtered = [], j = 0; j < array.length; j++) {
				var value = array[j];
				predicates.check(value) && filtered.push(value)
			}
			return filtered
		}
	}

	function currencyFilter($locale) {
		var formats = $locale.NUMBER_FORMATS;
		return function (amount, currencySymbol) {
			return isUndefined(currencySymbol) && (currencySymbol = formats.CURRENCY_SYM), formatNumber(amount, formats.PATTERNS[1], formats.GROUP_SEP, formats.DECIMAL_SEP, 2).replace(/\u00A4/g, currencySymbol)
		}
	}

	function numberFilter($locale) {
		var formats = $locale.NUMBER_FORMATS;
		return function (number, fractionSize) {
			return formatNumber(number, formats.PATTERNS[0], formats.GROUP_SEP, formats.DECIMAL_SEP, fractionSize)
		}
	}

	function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
		if (isNaN(number) || !isFinite(number)) return "";
		var isNegative = 0 > number;
		number = Math.abs(number);
		var numStr = number + "",
			formatedText = "",
			parts = [],
			hasExponent = !1;
		if (-1 !== numStr.indexOf("e")) {
			var match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
			match && "-" == match[2] && match[3] > fractionSize + 1 ? numStr = "0" : (formatedText = numStr, hasExponent = !0)
		}
		if (hasExponent) fractionSize > 0 && number > -1 && 1 > number && (formatedText = number.toFixed(fractionSize));
		else {
			var fractionLen = (numStr.split(DECIMAL_SEP)[1] || "").length;
			isUndefined(fractionSize) && (fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac));
			var pow = Math.pow(10, fractionSize);
			number = Math.round(number * pow) / pow;
			var fraction = ("" + number).split(DECIMAL_SEP),
				whole = fraction[0];
			fraction = fraction[1] || "";
			var i, pos = 0,
				lgroup = pattern.lgSize,
				group = pattern.gSize;
			if (whole.length >= lgroup + group)
				for (pos = whole.length - lgroup, i = 0; pos > i; i++)(pos - i) % group === 0 && 0 !== i && (formatedText += groupSep), formatedText += whole.charAt(i);
			for (i = pos; i < whole.length; i++)(whole.length - i) % lgroup === 0 && 0 !== i && (formatedText += groupSep), formatedText += whole.charAt(i);
			for (; fraction.length < fractionSize;) fraction += "0";
			fractionSize && "0" !== fractionSize && (formatedText += decimalSep + fraction.substr(0, fractionSize))
		}
		return parts.push(isNegative ? pattern.negPre : pattern.posPre), parts.push(formatedText), parts.push(isNegative ? pattern.negSuf : pattern.posSuf), parts.join("")
	}

	function padNumber(num, digits, trim) {
		var neg = "";
		for (0 > num && (neg = "-", num = -num), num = "" + num; num.length < digits;) num = "0" + num;
		return trim && (num = num.substr(num.length - digits)), neg + num
	}

	function dateGetter(name, size, offset, trim) {
		return offset = offset || 0,
			function (date) {
				var value = date["get" + name]();
				return (offset > 0 || value > -offset) && (value += offset), 0 === value && -12 == offset && (value = 12), padNumber(value, size, trim)
			}
	}

	function dateStrGetter(name, shortForm) {
		return function (date, formats) {
			var value = date["get" + name](),
				get = uppercase(shortForm ? "SHORT" + name : name);
			return formats[get][value]
		}
	}

	function timeZoneGetter(date) {
		var zone = -1 * date.getTimezoneOffset(),
			paddedZone = zone >= 0 ? "+" : "";
		return paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
	}

	function ampmGetter(date, formats) {
		return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
	}

	function dateFilter($locale) {
		function jsonStringToDate(string) {
			var match;
			if (match = string.match(R_ISO8601_STR)) {
				var date = new Date(0),
					tzHour = 0,
					tzMin = 0,
					dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
					timeSetter = match[8] ? date.setUTCHours : date.setHours;
				match[9] && (tzHour = int(match[9] + match[10]), tzMin = int(match[9] + match[11])), dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
				var h = int(match[4] || 0) - tzHour,
					m = int(match[5] || 0) - tzMin,
					s = int(match[6] || 0),
					ms = Math.round(1e3 * parseFloat("0." + (match[7] || 0)));
				return timeSetter.call(date, h, m, s, ms), date
			}
			return string
		}

		var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
		return function (date, format) {
			var fn, match, text = "",
				parts = [];
			if (format = format || "mediumDate", format = $locale.DATETIME_FORMATS[format] || format, isString(date) && (date = NUMBER_STRING.test(date) ? int(date) : jsonStringToDate(date)), isNumber(date) && (date = new Date(date)), !isDate(date)) return date;
			for (; format;) match = DATE_FORMATS_SPLIT.exec(format), match ? (parts = concat(parts, match, 1), format = parts.pop()) : (parts.push(format), format = null);
			return forEach(parts, function (value) {
				fn = DATE_FORMATS[value], text += fn ? fn(date, $locale.DATETIME_FORMATS) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'")
			}), text
		}
	}

	function jsonFilter() {
		return function (object) {
			return toJson(object, !0)
		}
	}

	function limitToFilter() {
		return function (input, limit) {
			if (!isArray(input) && !isString(input)) return input;
			if (limit = int(limit), isString(input)) return limit ? limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length) : "";
			var i, n, out = [];
			for (limit > input.length ? limit = input.length : limit < -input.length && (limit = -input.length), limit > 0 ? (i = 0, n = limit) : (i = input.length + limit, n = input.length); n > i; i++) out.push(input[i]);
			return out
		}
	}

	function orderByFilter($parse) {
		return function (array, sortPredicate, reverseOrder) {
			function comparator(o1, o2) {
				for (var i = 0; i < sortPredicate.length; i++) {
					var comp = sortPredicate[i](o1, o2);
					if (0 !== comp) return comp
				}
				return 0
			}

			function reverseComparator(comp, descending) {
				return toBoolean(descending) ? function (a, b) {
					return comp(b, a)
				} : comp
			}

			function compare(v1, v2) {
				var t1 = typeof v1,
					t2 = typeof v2;
				return t1 == t2 ? ("string" == t1 && (v1 = v1.toLowerCase(), v2 = v2.toLowerCase()), v1 === v2 ? 0 : v2 > v1 ? -1 : 1) : t2 > t1 ? -1 : 1
			}

			if (!isArray(array)) return array;
			if (!sortPredicate) return array;
			sortPredicate = isArray(sortPredicate) ? sortPredicate : [sortPredicate], sortPredicate = map(sortPredicate, function (predicate) {
				var descending = !1,
					get = predicate || identity;
				return isString(predicate) && (("+" == predicate.charAt(0) || "-" == predicate.charAt(0)) && (descending = "-" == predicate.charAt(0), predicate = predicate.substring(1)), get = $parse(predicate)), reverseComparator(function (a, b) {
					return compare(get(a), get(b))
				}, descending)
			});
			for (var arrayCopy = [], i = 0; i < array.length; i++) arrayCopy.push(array[i]);
			return arrayCopy.sort(reverseComparator(comparator, reverseOrder))
		}
	}

	function ngDirective(directive) { //对于一些指令统一处理
		if (isFunction(directive)) { //函数的情况
			directive = {
				link: directive
			}
		}
		directive.restrict = directive.restrict || "AC"; //指令的默认属性为AC
		return valueFn(directive);
	}

	function FormController(element, attrs) {
		function toggleValidCss(isValid, validationErrorKey) {
			var removeclass_prefix, addclass_prefix;
			if (validationErrorKey) {
				validationErrorKey = "-" + snake_case(validationErrorKey, "-");
			} else {
				validationErrorKey = "";
			}
			if (isValid) {
				removeclass_prefix = INVALID_CLASS;

			} else {
				addclass_prefix = VALID_CLASS;
			}
			element.removeClass(removeclass_prefix + validationErrorKey)
			element.addClass(addclass_prefix + validationErrorKey);
		}

		var form = this,
			parentForm = element.parent().controller("form") || nullFormCtrl,
			invalidCount = 0,
			errors = form.$error = {}, controls = [];
		form.$name = attrs.name || attrs.ngForm;
		form.$dirty = !1;
		form.$pristine = !0;
		form.$valid = !0;
		form.$invalid = !1;
		parentForm.$addControl(form);
		element.addClass(PRISTINE_CLASS);
		toggleValidCss(!0);
		form.$addControl = function (control) {
			assertNotHasOwnProperty(control.$name, "input");
			controls.push(control);
			control.$name && (form[control.$name] = control);
		};
		form.$removeControl = function (control) {
			if (control.$name && form[control.$name] === control) {
				delete form[control.$name];
			}
			forEach(errors, function (queue, validationToken) {
				form.$setValidity(validationToken, !0, control);
			});
			arrayRemove(controls, control);
		};
		form.$setValidity = function (validationToken, isValid, control) {
			var queue = errors[validationToken];
			if (isValid && queue) {
				arrayRemove(queue, control);
				if (!queue.length) {
					invalidCount--;
					if (!invalidCount) {
						toggleValidCss(isValid);
						form.$valid = !0;
						form.$invalid = !1;
					}
					errors[validationToken] = !1;
					toggleValidCss(!0, validationToken);
					parentForm.$setValidity(validationToken, !0, form);
				}
			} else {
				if (!invalidCount) {
					toggleValidCss(isValid);
				}
				if (queue) {
					if (includes(queue, control)) return
				} else {
					errors[validationToken] = queue = [];
					invalidCount++;
					toggleValidCss(!1, validationToken);
					parentForm.$setValidity(validationToken, !1, form);
				}
				queue.push(control);
				form.$valid = !1;
				form.$invalid = !0;
			}
		};
		form.$setDirty = function () {
			element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
			form.$dirty = !0;
			form.$pristine = !1;
			parentForm.$setDirty();
		};
		form.$setPristine = function () {
			element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
			form.$dirty = !1;
			form.$pristine = !0;
			forEach(controls, function (control) {
				control.$setPristine()
			});
		};
		form.$getControllers = function () {
			return controls;
		};
	}

	function textInputType(scope, element, attr, ctrl, $sniffer, $browser) {
		var listener = function () {
			var value = element.val();
			if (toBoolean(attr.ngTrim || "T")) {
				value = trim(value);
			}
			if (ctrl.$viewValue !== value) {
				scope.$apply(function () {
					ctrl.$setViewValue(value)
				});
			}
		};
		if ($sniffer.hasEvent("input")) {
			element.on("input", listener);
		}
		else {
			var timeout, deferListener = function () {
				if (!timeout) {
					timeout = $browser.defer(function () {
						listener();
						timeout = null;
					});
				}
			};
			element.on("keydown", function (event) {
				var key = event.keyCode;
				91 === key || key > 15 && 19 > key || key >= 37 && 40 >= key || deferListener()
			});
			element.on("change", listener);
			if ($sniffer.hasEvent("paste")) {
				element.on("paste cut", deferListener);
			}
		}
		ctrl.$render = function () {
			element.val(ctrl.$isEmpty(ctrl.$viewValue) ? "" : ctrl.$viewValue)
		};
		var patternValidator, match, pattern = attr.ngPattern,
			validate = function (regexp, value) {
				if (ctrl.$isEmpty(value) || regexp.test(value)) {
					ctrl.$setValidity("pattern", !0);
					return value;
				} else {
					ctrl.$setValidity("pattern", !1);
					return undefined;
				}
			};
		if (pattern) {
			match = pattern.match(/^\/(.*)\/([gim]*)$/);
			if (match) {
				pattern = new RegExp(match[1], match[2]);
				patternValidator = function (value) {
					return validate(pattern, value)
				}
			} else {
				patternValidator = function (value) {
					var patternObj = scope.$eval(pattern);
					if (!patternObj || !patternObj.test) {
						throw minErr("ngPattern")("noregexp", "Expected {0} to be a RegExp but was {1}. Element: {2}", pattern, patternObj, startingTag(element));
					}
					return validate(patternObj, value);
				};
			}
			ctrl.$formatters.push(patternValidator);
			ctrl.$parsers.push(patternValidator);
		}
		if (attr.ngMinlength) {
			var minlength = int(attr.ngMinlength),
				minLengthValidator = function (value) {
					if (!ctrl.$isEmpty(value) && value.length < minlength) {
						ctrl.$setValidity("minlength", !1);
						return undefined;
					} else {
						ctrl.$setValidity("minlength", !0);
						return value;
					}
				};
			ctrl.$parsers.push(minLengthValidator);
			ctrl.$formatters.push(minLengthValidator);
		}
		if (attr.ngMaxlength) {
			var maxlength = int(attr.ngMaxlength),
				maxLengthValidator = function (value) {
					if (!ctrl.$isEmpty(value) && value.length > maxlength) {
						ctrl.$setValidity("maxlength", !1);
						return undefined;
					} else {
						ctrl.$setValidity("maxlength", !0);
						return value;
					}
				};
			ctrl.$parsers.push(maxLengthValidator);
			ctrl.$formatters.push(maxLengthValidator);
		}
	}

	function numberInputType(scope, element, attr, ctrl, $sniffer, $browser) {
		if (textInputType(scope, element, attr, ctrl, $sniffer, $browser), ctrl.$parsers.push(function (value) {
				var empty = ctrl.$isEmpty(value);
				return empty || NUMBER_REGEXP.test(value) ? (ctrl.$setValidity("number", !0), "" === value ? null : empty ? value : parseFloat(value)) : (ctrl.$setValidity("number", !1), undefined)
			}), ctrl.$formatters.push(function (value) {
				return ctrl.$isEmpty(value) ? "" : "" + value
			}), attr.min) {
			var minValidator = function (value) {
				var min = parseFloat(attr.min);
				return !ctrl.$isEmpty(value) && min > value ? (ctrl.$setValidity("min", !1), undefined) : (ctrl.$setValidity("min", !0), value)
			};
			ctrl.$parsers.push(minValidator), ctrl.$formatters.push(minValidator)
		}
		if (attr.max) {
			var maxValidator = function (value) {
				var max = parseFloat(attr.max);
				return !ctrl.$isEmpty(value) && value > max ? (ctrl.$setValidity("max", !1), undefined) : (ctrl.$setValidity("max", !0), value)
			};
			ctrl.$parsers.push(maxValidator), ctrl.$formatters.push(maxValidator)
		}
		ctrl.$formatters.push(function (value) {
			return ctrl.$isEmpty(value) || isNumber(value) ? (ctrl.$setValidity("number", !0), value) : (ctrl.$setValidity("number", !1), undefined)
		})
	}

	function urlInputType(scope, element, attr, ctrl, $sniffer, $browser) {
		textInputType(scope, element, attr, ctrl, $sniffer, $browser);
		var urlValidator = function (value) {
			return ctrl.$isEmpty(value) || URL_REGEXP.test(value) ? (ctrl.$setValidity("url", !0), value) : (ctrl.$setValidity("url", !1), undefined)
		};
		ctrl.$formatters.push(urlValidator), ctrl.$parsers.push(urlValidator)
	}

	function emailInputType(scope, element, attr, ctrl, $sniffer, $browser) {
		textInputType(scope, element, attr, ctrl, $sniffer, $browser);
		var emailValidator = function (value) {
			return ctrl.$isEmpty(value) || EMAIL_REGEXP.test(value) ? (ctrl.$setValidity("email", !0), value) : (ctrl.$setValidity("email", !1), undefined)
		};
		ctrl.$formatters.push(emailValidator), ctrl.$parsers.push(emailValidator)
	}

	function radioInputType(scope, element, attr, ctrl) {
		isUndefined(attr.name) && element.attr("name", nextUid()), element.on("click", function () {
			element[0].checked && scope.$apply(function () {
				ctrl.$setViewValue(attr.value)
			})
		}), ctrl.$render = function () {
			var value = attr.value;
			element[0].checked = value == ctrl.$viewValue
		}, attr.$observe("value", ctrl.$render)
	}

	function checkboxInputType(scope, element, attr, ctrl) {
		var trueValue = attr.ngTrueValue,
			falseValue = attr.ngFalseValue;
		isString(trueValue) || (trueValue = !0), isString(falseValue) || (falseValue = !1), element.on("click", function () {
			scope.$apply(function () {
				ctrl.$setViewValue(element[0].checked)
			})
		}), ctrl.$render = function () {
			element[0].checked = ctrl.$viewValue
		}, ctrl.$isEmpty = function (value) {
			return value !== trueValue
		}, ctrl.$formatters.push(function (value) {
			return value === trueValue
		}), ctrl.$parsers.push(function (value) {
			return value ? trueValue : falseValue
		})
	}

	function classDirective(name, selector) {
		return name = "ngClass" + name,
			function () {
				return {
					restrict: "AC",
					link: function (scope, element, attr) {
						function ngClassWatchAction(newVal) {
							(selector === !0 || scope.$index % 2 === selector) && (oldVal && !equals(newVal, oldVal) && removeClass(oldVal), addClass(newVal)), oldVal = copy(newVal)
						}

						function removeClass(classVal) {
							attr.$removeClass(flattenClasses(classVal))
						}

						function addClass(classVal) {
							attr.$addClass(flattenClasses(classVal))
						}

						function flattenClasses(classVal) {
							if (isArray(classVal)) return classVal.join(" ");
							if (isObject(classVal)) {
								var classes = [];
								return forEach(classVal, function (v, k) {
									v && classes.push(k)
								}), classes.join(" ")
							}
							return classVal
						}

						var oldVal;
						scope.$watch(attr[name], ngClassWatchAction, !0), attr.$observe("class", function () {
							ngClassWatchAction(scope.$eval(attr[name]))
						}), "ngClass" !== name && scope.$watch("$index", function ($index, old$index) {
							var mod = 1 & $index;
							mod !== old$index & 1 && (mod === selector ? addClass(scope.$eval(attr[name])) : removeClass(scope.$eval(attr[name])))
						})
					}
				}
			}
	}

	//上面定义了内部函数....下面定义局部变量(也是angularjs的全局变量)
	var lowercase = function (string) { //重新封壮了String.toLowerCase方法
		return isString(string) ? string.toLowerCase() : string;
	};
	var uppercase = function (string) {
		return isString(string) ? string.toUpperCase() : string
	};
	var manualLowercase = function (s) {
		return isString(s) ? s.replace(/[A-Z]/g, function (ch) {
			return String.fromCharCode(32 | ch.charCodeAt(0))
		}) : s
	};  //angularjs 定义的方法
	var manualUppercase = function (s) {
		return isString(s) ? s.replace(/[a-z]/g, function (ch) {
			return String.fromCharCode(-33 & ch.charCodeAt(0))
		}) : s
	};  //angularjs 定义的方法
	if ("i" !== "I".toLowerCase()) { //(原生方法是否有用)是否使用浏览器原生的方法
		lowercase = manualLowercase;
		uppercase = manualUppercase;
	}
	var msie;
	var jqLite;
	var jQuery;
	var angularModule;
	var nodeName_;

	var slice = [].slice;//获取数组slice方法
	var push = [].push; //获取数组push方法
	var toString = Object.prototype.toString;//获取Object原型的toString方法
	var ngMinErr = minErr("ng");
	var angular = (window.angular, window.angular || (window.angular = {}));//set window attr angular
	var uid = ["0", "0", "0"];

	msie = int((/msie (\d+)/.exec(lowercase(navigator.userAgent)) || [])[1]);
	if (isNaN(msie)) {
		msie = int((/trident\/.*; rv:(\d+)/.exec(lowercase(navigator.userAgent)) || [])[1])
	}
	noop.$inject = [];
	identity.$inject = [];
	var trim = function () {
		return String.prototype.trim ? function (value) {
			return isString(value) ? value.trim() : value
		} : function (value) {
			return isString(value) ? value.replace(/^\s*/, "").replace(/\s*$/, "") : value
		}
	}();
	nodeName_ = 9 > msie ? function (element) {
		return element = element.nodeName ? element : element[0], element.scopeName && "HTML" != element.scopeName ? uppercase(element.scopeName + ":" + element.nodeName) : element.nodeName
	} : function (element) {
		return element.nodeName ? element.nodeName : element[0].nodeName
	};
	var SNAKE_CASE_REGEXP = /[A-Z]/g;
	var version = {
		full: "1.2.1",
		major: 1,
		minor: 2,
		dot: 1,
		codeName: "underscore-empathy"
	};
	var jqCache = JQLite.cache = {};
	var jqName = JQLite.expando = "ng-" + (new Date).getTime();
	var jqId = 1;
	var addEventListenerFn = window.document.addEventListener ? function (element, type, fn) {
		element.addEventListener(type, fn, !1)
	} : function (element, type, fn) {
		element.attachEvent("on" + type, fn)
	};//添加事件监听函数
	var removeEventListenerFn = window.document.removeEventListener ? function (element, type, fn) {
		element.removeEventListener(type, fn, !1)
	} : function (element, type, fn) {
		element.detachEvent("on" + type, fn)
	};//移除事件监听函数
	var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
	var MOZ_HACK_REGEXP = /^moz([A-Z])/;
	var jqLiteMinErr = minErr("jqLite");
	var JQLitePrototype = JQLite.prototype = {
		ready: function (fn) {
			function trigger() {
				if (!fired) {
					fired = !0;
					fn();
				}
			}

			var fired = !1;
			//文档已经加载完成
			if ("complete" === document.readyState) {
				setTimeout(trigger);
			}
			else { //双重绑定--但只会执行一次
				this.on("DOMContentLoaded", trigger);
				JQLite(window).on("load", trigger);
			}
		},
		toString: function () {
			var value = [];
			return forEach(this, function (e) {
				value.push("" + e)
			}), "[" + value.join(", ") + "]"
		},
		eq: function (index) {
			return index >= 0 ? jqLite(this[index]) : jqLite(this[this.length + index])
		},
		length: 0,
		push: push,
		sort: [].sort,
		splice: [].splice
	};
	var BOOLEAN_ATTR = {};
	forEach("multiple,selected,checked,disabled,readOnly,required,open".split(","), function (value) {
		BOOLEAN_ATTR[lowercase(value)] = value
	});
	var BOOLEAN_ELEMENTS = {};
	forEach("input,select,option,textarea,button,form,details".split(","), function (value) {
		BOOLEAN_ELEMENTS[uppercase(value)] = !0
	});
	forEach({
		data: jqLiteData,
		inheritedData: jqLiteInheritedData,
		scope: function (element) {
			return jqLite(element).data("$scope") || jqLiteInheritedData(element.parentNode || element, ["$isolateScope", "$scope"])
		},
		isolateScope: function (element) {
			return jqLite(element).data("$isolateScope") || jqLite(element).data("$isolateScopeNoTemplate")
		},
		controller: jqLiteController,
		injector: function (element) {
			return jqLiteInheritedData(element, "$injector")
		},
		removeAttr: function (element, name) {
			element.removeAttribute(name)
		},
		hasClass: jqLiteHasClass,
		css: function (element, name, value) {
			if (name = camelCase(name), !isDefined(value)) {
				var val;
				return 8 >= msie && (val = element.currentStyle && element.currentStyle[name], "" === val && (val = "auto")), val = val || element.style[name], 8 >= msie && (val = "" === val ? undefined : val), val
			}
			element.style[name] = value
		},
		attr: function (element, name, value) {
			var lowercasedName = lowercase(name);
			if (BOOLEAN_ATTR[lowercasedName]) {
				if (!isDefined(value)) return element[name] || (element.attributes.getNamedItem(name) || noop).specified ? lowercasedName : undefined;
				value ? (element[name] = !0, element.setAttribute(name, lowercasedName)) : (element[name] = !1, element.removeAttribute(lowercasedName))
			} else if (isDefined(value)) element.setAttribute(name, value);
			else if (element.getAttribute) {
				var ret = element.getAttribute(name, 2);
				return null === ret ? undefined : ret
			}
		},
		prop: function (element, name, value) {
			return isDefined(value) ? (element[name] = value, void 0) : element[name]
		},
		text: function () {
			function getText(element, value) {
				var textProp = NODE_TYPE_TEXT_PROPERTY[element.nodeType];
				return isUndefined(value) ? textProp ? element[textProp] : "" : (element[textProp] = value, void 0)
			}

			var NODE_TYPE_TEXT_PROPERTY = [];
			return 9 > msie ? (NODE_TYPE_TEXT_PROPERTY[1] = "innerText", NODE_TYPE_TEXT_PROPERTY[3] = "nodeValue") : NODE_TYPE_TEXT_PROPERTY[1] = NODE_TYPE_TEXT_PROPERTY[3] = "textContent", getText.$dv = "", getText
		}(),
		val: function (element, value) {
			if (isUndefined(value)) {
				if ("SELECT" === nodeName_(element) && element.multiple) {
					var result = [];
					return forEach(element.options, function (option) {
						option.selected && result.push(option.value || option.text)
					}), 0 === result.length ? null : result
				}
				return element.value
			}
			element.value = value
		},
		html: function (element, value) {
			if (isUndefined(value)) return element.innerHTML;
			for (var i = 0, childNodes = element.childNodes; i < childNodes.length; i++) jqLiteDealoc(childNodes[i]);
			element.innerHTML = value
		}
	}, function (fn, name) {
		JQLite.prototype[name] = function (arg1, arg2) {
			var i, key;
			if ((2 == fn.length && fn !== jqLiteHasClass && fn !== jqLiteController ? arg1 : arg2) === undefined) {
				if (isObject(arg1)) {
					for (i = 0; i < this.length; i++) {
						if (fn === jqLiteData) {
							fn(this[i], arg1);
						} else {
							for (key in arg1) {
								fn(this[i], key, arg1[key]);
							}
						}
					}
					return this
				}
				var value = fn.$dv,
					jj, j = 0;
				if (value === undefined) {
					jj = Math.min(this.length, 1);
				} else {
					jj = this.length;
				}
				for (; jj > j; j++) {
					var nodeValue = fn(this[j], arg1, arg2);
					if (value) {
						value = value + nodeValue;
					} else {
						value = nodeValue;
					}
				}
				return value
			}
			for (i = 0; i < this.length; i++) {
				fn(this[i], arg1, arg2);
			}
			return this
		}
	});
	forEach({
		removeData: jqLiteRemoveData,
		dealoc: jqLiteDealoc,
		on: function onFn(element, type, fn, unsupported) {
			if (isDefined(unsupported)) {
				throw jqLiteMinErr("onargs", "jqLite#on() does not support the `selector` or `eventData` parameters");
			}
			var events = jqLiteExpandoStore(element, "events"),
				handle = jqLiteExpandoStore(element, "handle");
			if (!events) {
				jqLiteExpandoStore(element, "events", events = {});
			}
			if (!handle) {
				jqLiteExpandoStore(element, "handle", handle = createEventHandler(element, events));
			}
			forEach(type.split(" "), function (type) {
				var eventFns = events[type];
				if (!eventFns) {
					if ("mouseenter" == type || "mouseleave" == type) {
						var contains = document.body.contains || document.body.compareDocumentPosition ? function (a, b) {
							var adown = 9 === a.nodeType ? a.documentElement : a,
								bup = b && b.parentNode;
							return a === bup || !(!bup || 1 !== bup.nodeType || !(adown.contains ? adown.contains(bup) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(bup)))
						} : function (a, b) {
							if (b)
								for (; b = b.parentNode;)
									if (b === a) return !0;
							return !1
						};
						events[type] = [];
						var eventmap = {
							mouseleave: "mouseout",
							mouseenter: "mouseover"
						};
						onFn(element, eventmap[type], function (event) {
							var target = this,
								related = event.relatedTarget;
							(!related || related !== target && !contains(target, related)) && handle(event, type)
						})
					}
					else {
						addEventListenerFn(element, type, handle);
						events[type] = [];
					}
					eventFns = events[type];
				}
				eventFns.push(fn);
			})
		},
		off: jqLiteOff,
		replaceWith: function (element, replaceNode) {
			var index, parent = element.parentNode;
			jqLiteDealoc(element), forEach(new JQLite(replaceNode), function (node) {
				index ? parent.insertBefore(node, index.nextSibling) : parent.replaceChild(node, element), index = node
			})
		},
		children: function (element) {
			var children = [];
			return forEach(element.childNodes, function (element) {
				1 === element.nodeType && children.push(element)
			}), children
		},
		contents: function (element) {
			return element.childNodes || []
		},
		append: function (element, node) {
			forEach(new JQLite(node), function (child) {
				(1 === element.nodeType || 11 === element.nodeType) && element.appendChild(child)
			})
		},
		prepend: function (element, node) {
			if (1 === element.nodeType) {
				var index = element.firstChild;
				forEach(new JQLite(node), function (child) {
					element.insertBefore(child, index)
				})
			}
		},
		wrap: function (element, wrapNode) {
			wrapNode = jqLite(wrapNode)[0];
			var parent = element.parentNode;
			parent && parent.replaceChild(wrapNode, element), wrapNode.appendChild(element)
		},
		remove: function (element) {
			jqLiteDealoc(element);
			var parent = element.parentNode;
			parent && parent.removeChild(element)
		},
		after: function (element, newElement) {
			var index = element,
				parent = element.parentNode;
			forEach(new JQLite(newElement), function (node) {
				parent.insertBefore(node, index.nextSibling), index = node
			})
		},
		addClass: jqLiteAddClass,
		removeClass: jqLiteRemoveClass,
		toggleClass: function (element, selector, condition) {
			isUndefined(condition) && (condition = !jqLiteHasClass(element, selector)), (condition ? jqLiteAddClass : jqLiteRemoveClass)(element, selector)
		},
		parent: function (element) {
			var parent = element.parentNode;
			return parent && 11 !== parent.nodeType ? parent : null
		},
		next: function (element) {
			if (element.nextElementSibling) return element.nextElementSibling;
			for (var elm = element.nextSibling; null != elm && 1 !== elm.nodeType;) elm = elm.nextSibling;
			return elm
		},
		find: function (element, selector) {
			return element.getElementsByTagName(selector)
		},
		clone: jqLiteClone,
		triggerHandler: function (element, eventName, eventData) {
			var eventFns = (jqLiteExpandoStore(element, "events") || {})[eventName];
			eventData = eventData || [];
			var event = [{
				preventDefault: noop,
				stopPropagation: noop
			}];
			forEach(eventFns, function (fn) {
				fn.apply(element, event.concat(eventData))
			})
		}
	}, function (fn, name) {
		JQLite.prototype[name] = function (arg1, arg2, arg3) {
			for (var value, i = 0; i < this.length; i++) isUndefined(value) ? (value = fn(this[i], arg1, arg2, arg3), isDefined(value) && (value = jqLite(value))) : jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
			return isDefined(value) ? value : this
		};
		JQLite.prototype.bind = JQLite.prototype.on;
		JQLite.prototype.unbind = JQLite.prototype.off;
	});
	HashMap.prototype = {
		put: function (key, value) {
			this[hashKey(key)] = value
		},
		get: function (key) {
			return this[hashKey(key)]
		},
		remove: function (key) {
			var value = this[key = hashKey(key)];
			return delete this[key], value
		}
	};
	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m, //匹配function 参数
		FN_ARG_SPLIT = /,/, //匹配function 参数分格符
		FN_ARG = /^\s*(_?)(\S+?)\1\s*$/,
		STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm,
		$injectorMinErr = minErr("$injector"),
		$animateMinErr = minErr("$animate"),
		$AnimateProvider = ["$provide",
			function ($provide) {
				this.$$selectors = {};
				this.register = function (name, factory) {
					var key = name + "-animation";
					if (name && "." != name.charAt(0)) {
						throw $animateMinErr("notcsel", "Expecting class selector starting with '.' got '{0}'.", name);
					}
					this.$$selectors[name.substr(1)] = key;
					$provide.factory(key, factory);
				};
				this.$get = ["$timeout",
					function ($timeout) {
						return {
							enter: function (element, parent, after, done) {
								var afterNode = after && after[after.length - 1],
									parentNode = parent && parent[0] || afterNode && afterNode.parentNode,
									afterNextSibling = afterNode && afterNode.nextSibling || null;
								forEach(element, function (node) {
									parentNode.insertBefore(node, afterNextSibling)
								});
								if (done) {
									$timeout(done, 0, !1);
								}
							},
							leave: function (element, done) {
								element.remove();
								if (done) {
									$timeout(done, 0, !1)
								}
							},
							move: function (element, parent, after, done) {
								this.enter(element, parent, after, done)
							},
							addClass: function (element, className, done) {
								if (isString(className)) {
									className = className;
								} else if (isArray(className)) {
									className = className.join(" ");
								} else {
									className = "";
								}
								forEach(element, function (element) {
									jqLiteAddClass(element, className)
								});
								done && $timeout(done, 0, !1);
							},
							removeClass: function (element, className, done) {
								if (isString(className)) {
									className = className;
								} else if (isArray(className)) {
									className = className.join(" ");
								} else {
									className = "";
								}
								forEach(element, function (element) {
									jqLiteRemoveClass(element, className)
								});
								done && $timeout(done, 0, !1);
							},
							enabled: noop
						}
					}
				]
			}
		],
		$compileMinErr = minErr("$compile");
	$CompileProvider.$inject = ["$provide"];
	var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i,
		XHR = window.XMLHttpRequest || function () {
				try {
					return new ActiveXObject("Msxml2.XMLHTTP.6.0")
				} catch (e1) {
				}
				try {
					return new ActiveXObject("Msxml2.XMLHTTP.3.0")
				} catch (e2) {
				}
				try {
					return new ActiveXObject("Msxml2.XMLHTTP")
				} catch (e3) {
				}
				throw minErr("$httpBackend")("noxhr", "This browser does not support XMLHttpRequest.")
			},
		$interpolateMinErr = minErr("$interpolate"),
		PATH_MATCH = /^([^\?#]*)(\?([^#]*))?(#(.*))?$/,
		DEFAULT_PORTS = {
			http: 80,
			https: 443,
			ftp: 21
		},
		$locationMinErr = minErr("$location");
	LocationHashbangInHtml5Url.prototype = LocationHashbangUrl.prototype = LocationHtml5Url.prototype = {
		$$html5: !1,
		$$replace: !1,
		absUrl: locationGetter("$$absUrl"),
		url: function (url, replace) {
			if (isUndefined(url)) {
				return this.$$url;
			}
			var match = PATH_MATCH.exec(url);
			if(match[1]){
				this.path(decodeURIComponent(match[1]));
			}
			if(match[2] || match[1]){
				this.search(match[3] || "");
			}
			this.hash(match[5] || "", replace);
			return this;
		},
		protocol: locationGetter("$$protocol"),
		host: locationGetter("$$host"),
		port: locationGetter("$$port"),
		path: locationGetterSetter("$$path", function (path) {
			if("/" == path.charAt(0)){
				return path;
			}
			return "/" + path;
		}),
		search: function (search, paramValue) {
			switch (arguments.length) {
				case 0:
					return this.$$search;
				case 1:
					if (isString(search)) this.$$search = parseKeyValue(search);
					else {
						if (!isObject(search)){
							throw $locationMinErr("isrcharg", "The first argument of the `$location#search()` call must be a string or an object.");
						}
						this.$$search = search
					}
					break;
				default:
						if(isUndefined(paramValue) || null === paramValue){
							delete this.$$search[search]
						}else{
							this.$$search[search] = paramValue;
						}
			}
			this.$$compose();
			return this;
		},
		hash: locationGetterSetter("$$hash", identity),
		replace: function () {
			this.$$replace = true;
			return this;
		}
	};
	var promiseWarning,
		$parseMinErr = minErr("$parse"),
		promiseWarningCache = {},
		OPERATORS = {
			"null": function () {
				return null
			},
			"true": function () {
				return !0
			},
			"false": function () {
				return !1
			},
			undefined: noop,
			"+": function (self, locals, a, b) {
				return a = a(self, locals), b = b(self, locals), isDefined(a) ? isDefined(b) ? a + b : a : isDefined(b) ? b : undefined
			},
			"-": function (self, locals, a, b) {
				return a = a(self, locals), b = b(self, locals), (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0)
			},
			"*": function (self, locals, a, b) {
				return a(self, locals) * b(self, locals)
			},
			"/": function (self, locals, a, b) {
				return a(self, locals) / b(self, locals)
			},
			"%": function (self, locals, a, b) {
				return a(self, locals) % b(self, locals)
			},
			"^": function (self, locals, a, b) {
				return a(self, locals) ^ b(self, locals)
			},
			"=": noop,
			"===": function (self, locals, a, b) {
				return a(self, locals) === b(self, locals)
			},
			"!==": function (self, locals, a, b) {
				return a(self, locals) !== b(self, locals)
			},
			"==": function (self, locals, a, b) {
				return a(self, locals) == b(self, locals)
			},
			"!=": function (self, locals, a, b) {
				return a(self, locals) != b(self, locals)
			},
			"<": function (self, locals, a, b) {
				return a(self, locals) < b(self, locals)
			},
			">": function (self, locals, a, b) {
				return a(self, locals) > b(self, locals)
			},
			"<=": function (self, locals, a, b) {
				return a(self, locals) <= b(self, locals)
			},
			">=": function (self, locals, a, b) {
				return a(self, locals) >= b(self, locals)
			},
			"&&": function (self, locals, a, b) {
				return a(self, locals) && b(self, locals)
			},
			"||": function (self, locals, a, b) {
				return a(self, locals) || b(self, locals)
			},
			"&": function (self, locals, a, b) {
				return a(self, locals) & b(self, locals)
			},
			"|": function (self, locals, a, b) {
				return b(self, locals)(self, locals, a(self, locals))
			},
			"!": function (self, locals, a) {
				return !a(self, locals)
			}
		},
		ESCAPE = {
			n: "\n",
			f: "\f",
			r: "\r",
			t: "	",
			v: "",
			"'": "'",
			'"': '"'
		};
	var getterFnCache = {},
		$sceMinErr = minErr("$sce"),
		SCE_CONTEXTS = {
			HTML: "html",
			CSS: "css",
			URL: "url",
			RESOURCE_URL: "resourceUrl",
			JS: "js"
		},
		urlParsingNode = document.createElement("a"),
		windowsFilePathExp = /^\/?.*?:(\/.*)/,
		originUrl = urlResolve(window.location.href, !0);
	$FilterProvider.$inject = ["$provide"];
	currencyFilter.$inject = ["$locale"];
	numberFilter.$inject = ["$locale"];
	var DECIMAL_SEP = ".",
		DATE_FORMATS = {
			yyyy: dateGetter("FullYear", 4),
			yy: dateGetter("FullYear", 2, 0, !0),
			y: dateGetter("FullYear", 1),
			MMMM: dateStrGetter("Month"),
			MMM: dateStrGetter("Month", !0),
			MM: dateGetter("Month", 2, 1),
			M: dateGetter("Month", 1, 1),
			dd: dateGetter("Date", 2),
			d: dateGetter("Date", 1),
			HH: dateGetter("Hours", 2),
			H: dateGetter("Hours", 1),
			hh: dateGetter("Hours", 2, -12),
			h: dateGetter("Hours", 1, -12),
			mm: dateGetter("Minutes", 2),
			m: dateGetter("Minutes", 1),
			ss: dateGetter("Seconds", 2),
			s: dateGetter("Seconds", 1),
			sss: dateGetter("Milliseconds", 3),
			EEEE: dateStrGetter("Day"),
			EEE: dateStrGetter("Day", !0),
			a: ampmGetter,
			Z: timeZoneGetter
		},
		DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
		NUMBER_STRING = /^\-?\d+$/;
	dateFilter.$inject = ["$locale"];
	var lowercaseFilter = valueFn(lowercase),
		uppercaseFilter = valueFn(uppercase);
	orderByFilter.$inject = ["$parse"];
	var htmlAnchorDirective = valueFn({
			restrict: "E",
			compile: function (element, attr) {
				return 8 >= msie && (attr.href || attr.name || attr.$set("href", ""), element.append(document.createComment("IE fix"))),
					function (scope, element) {
						element.on("click", function (event) {
							element.attr("href") || event.preventDefault()
						})
					}
			}
		}),
		ngAttributeAliasDirectives = {};
	forEach(BOOLEAN_ATTR, function (propName, attrName) {
		if ("multiple" != propName) {
			var normalized = directiveNormalize("ng-" + attrName);
			ngAttributeAliasDirectives[normalized] = function () {
				return {
					priority: 100,
					compile: function () {
						return function (scope, element, attr) {
							scope.$watch(attr[normalized], function (value) {
								attr.$set(attrName, !!value)
							})
						}
					}
				}
			}
		}
	});
	forEach(["src", "srcset", "href"], function (attrName) {
		var normalized = directiveNormalize("ng-" + attrName);
		ngAttributeAliasDirectives[normalized] = function () {
			return {
				priority: 99,
				link: function (scope, element, attr) {
					attr.$observe(normalized, function (value) {
						if (value) {
							attr.$set(attrName, value);
							msie && element.prop(attrName, attr[attrName]);
						}
					})
				}
			}
		}
	});
	var nullFormCtrl = {
		$addControl: noop,
		$removeControl: noop,
		$setValidity: noop,
		$setDirty: noop,
		$setPristine: noop
	};
	FormController.$inject = ["$element", "$attrs", "$scope"];
	var formDirectiveFactory = function (isNgForm) {
			return ["$timeout", function ($timeout) {
				var formDirective = {
					name: "form",
					restrict: isNgForm ? "EAC" : "E",
					controller: FormController,
					compile: function () {
						return {
							pre: function (scope, formElement, attr, controller) {
								if (!attr.action) {
									var preventDefaultListener = function (event) {
										event.preventDefault ? event.preventDefault() : event.returnValue = !1
									};
									addEventListenerFn(formElement[0], "submit", preventDefaultListener);
									formElement.on("$destroy", function () {
										$timeout(function () {
											removeEventListenerFn(formElement[0], "submit", preventDefaultListener);
										}, 0, !1)
									})
								}
								var parentFormCtrl = formElement.parent().controller("form"),
									alias = attr.name || attr.ngForm;
								alias && setter(scope, alias, controller, alias);
								parentFormCtrl && formElement.on("$destroy",
									function () {
										parentFormCtrl.$removeControl(controller);
										alias && setter(scope, alias, undefined, alias);
										extend(controller, nullFormCtrl);
									})
							}
						}
					}
				};
				return formDirective
			}]
		},
		formDirective = formDirectiveFactory(),
		ngFormDirective = formDirectiveFactory(!0),
		URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
		EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/,
		NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/,
		inputType = {
			text: textInputType,
			number: numberInputType,
			url: urlInputType,
			email: emailInputType,
			radio: radioInputType,
			checkbox: checkboxInputType,
			hidden: noop,
			button: noop,
			submit: noop,
			reset: noop
		},
		inputDirective = ["$browser", "$sniffer",
			function ($browser, $sniffer) {
				return {
					restrict: "E",
					require: "?ngModel",
					link: function (scope, element, attr, ctrl) {
						if (ctrl) {
							var fn;
							fn = inputType[lowercase(attr.type)] || inputType.text;
							if (fn) {
								fn(scope, element, attr, ctrl, $sniffer, $browser);
							}
						}
					}
				}
			}
		],
		VALID_CLASS = "ng-valid",
		INVALID_CLASS = "ng-invalid",
		PRISTINE_CLASS = "ng-pristine",
		DIRTY_CLASS = "ng-dirty",
		NgModelController = ["$scope", "$exceptionHandler", "$attrs", "$element", "$parse",
			function ($scope, $exceptionHandler, $attr, $element, $parse) {
				function toggleValidCss(isValid, validationErrorKey) {
					if (validationErrorKey) {
						validationErrorKey = "-" + snake_case(validationErrorKey, "-");
					} else {
						validationErrorKey = "";
					}
					$element.removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey);
					$element.addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
				}

				this.$viewValue = Number.NaN;
				this.$modelValue = Number.NaN;
				this.$parsers = [];
				this.$formatters = [];
				this.$viewChangeListeners = [];
				this.$pristine = !0;
				this.$dirty = !1;
				this.$valid = !0;
				this.$invalid = !1;
				this.$name = $attr.name;
				var ngModelGet = $parse($attr.ngModel),
					ngModelSet = ngModelGet.assign;
				if (!ngModelSet) {
					throw minErr("ngModel")("nonassign", "Expression '{0}' is non-assignable. Element: {1}", $attr.ngModel, startingTag($element));
				}
				this.$render = noop;
				this.$isEmpty = function (value) {
					return isUndefined(value) || "" === value || null === value || value !== value
				};
				var parentForm = $element.inheritedData("$formController") || nullFormCtrl,
					invalidCount = 0,
					$error = this.$error = {};
				$element.addClass(PRISTINE_CLASS);
				toggleValidCss(!0);
				this.$setValidity = function (validationErrorKey, isValid) {
					if ($error[validationErrorKey] == !!isValid) {
						if (isValid) {
							$error[validationErrorKey] && invalidCount--;
							if (!invalidCount) {
								toggleValidCss(!0);
								this.$valid = !0;
								this.$invalid = !1;
							}
						} else {
							toggleValidCss(!1);
							this.$invalid = !0;
							this.$valid = !1;
							invalidCount++;
						}
						$error[validationErrorKey] = !isValid;
						toggleValidCss(isValid, validationErrorKey);
						parentForm.$setValidity(validationErrorKey, isValid, this);
					}
				};
				this.$setPristine = function () {
					this.$dirty = !1;
					this.$pristine = !0;
					$element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
				};
				this.$reset = function () {
					this.$setPristine();
					this.$viewValue = Number.NaN;
					this.$modelValue = Number.NaN;
					this.$pristine = !0;
					this.$dirty = !1;
					this.$valid = !0;
					this.$invalid = !1;
					this.$name = $attr.name;
					$error = this.$error = {};
					invalidCount = 0;
				};
				this.$setViewValue = function (value) {
					this.$viewValue = value;
					if (this.$pristine) {
						this.$dirty = !0;
						this.$pristine = !1;
						$element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
						parentForm.$setDirty();
					}
					forEach(this.$parsers, function (fn) {
						value = fn(value)
					});
					if (this.$modelValue !== value) {
						this.$modelValue = value;
						ngModelSet($scope, value);
						forEach(this.$viewChangeListeners, function (listener) {
							try {
								listener()
							} catch (e) {
								$exceptionHandler(e)
							}
						});
					}
				};
				var ctrl = this;
				$scope.$watch(function () {
					var value = ngModelGet($scope);
					if (ctrl.$modelValue !== value) {
						var formatters = ctrl.$formatters,
							idx = formatters.length;
						ctrl.$modelValue = value;
						for (; idx--;) {
							value = formatters[idx](value);
						}
						if (ctrl.$viewValue !== value) {
							ctrl.$viewValue = value;
							ctrl.$render();
						}
					}
				})
			}
		],
		ngModelDirective = function () {
			return {
				require: ["ngModel", "^?form"],
				controller: NgModelController,
				link: function (scope, element, attr, ctrls) {
					var modelCtrl = ctrls[0],
						formCtrl = ctrls[1] || nullFormCtrl;
					formCtrl.$addControl(modelCtrl);
					scope.$on("$destroy", function () {
						formCtrl.$removeControl(modelCtrl)
					})
				}
			}
		},
		ngChangeDirective = valueFn({
			require: "ngModel",
			link: function (scope, element, attr, ctrl) {
				ctrl.$viewChangeListeners.push(function () {
					scope.$eval(attr.ngChange)
				})
			}
		}),
		requiredDirective = function () {
			return {
				require: "?ngModel",
				link: function (scope, elm, attr, ctrl) {
					if (ctrl) {
						attr.required = !0;
						var validator = function (value) {
							if (attr.required && ctrl.$isEmpty(value)) {
								ctrl.$setValidity("required", !1);
								return void 0;
							} else {
								ctrl.$setValidity("required", !0);
								return value;
							}
						};
						ctrl.$formatters.push(validator);
						ctrl.$parsers.unshift(validator);
						attr.$observe("required", function () {
							validator(ctrl.$viewValue);
						});
					}
				}
			}
		},
		ngListDirective = function () {
			return {
				require: "ngModel",
				link: function (scope, element, attr, ctrl) {
					var match = /\/(.*)\//.exec(attr.ngList),
						separator = match && new RegExp(match[1]) || attr.ngList || ",",
						parse = function (viewValue) {
							if (!isUndefined(viewValue)) {
								var list = [];
								return viewValue && forEach(viewValue.split(separator), function (value) {
									value && list.push(trim(value))
								}), list
							}
						};
					ctrl.$parsers.push(parse);
					ctrl.$formatters.push(function (value) {
						return isArray(value) ? value.join(", ") : undefined
					});
					ctrl.$isEmpty = function (value) {
						return !value || !value.length
					};
				}
			}
		},
		CONSTANT_VALUE_REGEXP = /^(true|false|\d+)$/,
		ngValueDirective = function () {
			return {
				priority: 100,
				compile: function (tpl, tplAttr) {
					if (CONSTANT_VALUE_REGEXP.test(tplAttr.ngValue)) {
						return function (scope, elm, attr) {
							attr.$set("value", scope.$eval(attr.ngValue))
						};
					}
					return function (scope, elm, attr) {
						scope.$watch(attr.ngValue, function (value) {
							attr.$set("value", value)
						})
					}
				}
			}
		},
		ngBindDirective = ngDirective(function (scope, element, attr) {
			element.addClass("ng-binding").data("$binding", attr.ngBind);
			scope.$watch(attr.ngBind, function (value) {
				element.text(value == undefined ? "" : value);
			});
		}),
		ngBindTemplateDirective = ["$interpolate",
			function ($interpolate) {
				return function (scope, element, attr) {
					var interpolateFn = $interpolate(element.attr(attr.$attr.ngBindTemplate));
					element.addClass("ng-binding").data("$binding", interpolateFn);
					attr.$observe("ngBindTemplate", function (value) {
						element.text(value)
					});
				}
			}
		],
		ngBindHtmlDirective = ["$sce", "$parse",
			function ($sce, $parse) {
				return function (scope, element, attr) {
					function getStringValue() {
						return (parsed(scope) || "").toString();
					}

					element.addClass("ng-binding").data("$binding", attr.ngBindHtml);
					var parsed = $parse(attr.ngBindHtml);
					scope.$watch(getStringValue, function () {
						element.html($sce.getTrustedHtml(parsed(scope)) || "");
					})
				}
			}
		],
		ngClassDirective = classDirective("", !0),
		ngClassOddDirective = classDirective("Odd", 0),
		ngClassEvenDirective = classDirective("Even", 1),
		ngCloakDirective = ngDirective({
			compile: function (element, attr) {
				attr.$set("ngCloak", undefined), element.removeClass("ng-cloak")
			}
		}),
		ngControllerDirective = [
			function () {
				return {
					scope: !0,
					controller: "@"
				}
			}
		],
		ngEventDirectives = {};
	forEach("click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste".split(" "),
		function (name) {
			var directiveName = directiveNormalize("ng-" + name);
			ngEventDirectives[directiveName] = ["$parse",
				function ($parse) {
					return {
						compile: function ($element, attr) {
							var fn = $parse(attr[directiveName]);
							return function (scope, element) {
								element.on(lowercase(name), function (event) {
									scope.$apply(function () {
										fn(scope, {
											$event: event
										})
									})
								})
							}
						}
					}
				}
			]
		});
	var ngIfDirective = ["$animate",
			function ($animate) {
				return {
					transclude: "element",
					priority: 600,
					terminal: !0,
					restrict: "A",
					$$tlb: !0, //$$tlb就是用来指定在compile的时候不要check同一个元素被多次transclude。
					link: function ($scope, $element, $attr, ctrl, $transclude) {
						var block, childScope;
						$scope.$watch($attr.ngIf, function (value) {
							if (toBoolean(value)) {
								if (!childScope)
									childScope = $scope.$new();
								$transclude(childScope, function (clone) {
									block = {
										startNode: clone[0],
										endNode: clone[clone.length++] = document.createComment(" end ngIf: " + $attr.ngIf + " ")
									};
									$animate.enter(clone, $element.parent(), $element);
								})
							} else {
								if (childScope) {
									childScope.$destroy();
									childScope = null
								}
								if (block) {
									$animate.leave(getBlockElements(block));
									block = null;
								}
							}
						})
					}
				}
			}
		],
		ngIncludeDirective = ["$http", "$templateCache", "$anchorScroll", "$compile", "$animate", "$sce",
			function ($http, $templateCache, $anchorScroll, $compile, $animate, $sce) {
				return {
					restrict: "ECA",
					priority: 400,
					terminal: !0,
					transclude: "element",
					compile: function (element, attr) {
						var srcExp = attr.ngInclude || attr.src,
							onloadExp = attr.onload || "",
							autoScrollExp = attr.autoscroll;
						return function (scope, $element, $attr, ctrl, $transclude) {
							var currentScope, currentElement, changeCounter = 0,
								cleanupLastIncludeContent = function () { //清除scope和html
									if (currentScope) {
										currentScope.$destroy();
										currentScope = null;
									}
									if (currentElement) {
										$animate.leave(currentElement);
										currentElement = null;
									}
								};
							scope.$watch($sce.parseAsResourceUrl(srcExp), function (src) {
								var afterAnimation = function () {
									if (!isDefined(autoScrollExp) || autoScrollExp) {
										scope.$eval(autoScrollExp) && $anchorScroll();
									}
								};
								var thisChangeId = ++changeCounter;
								if (src) {
									$http.get(src, {
										cache: $templateCache
									}).success(function (response) {
										if (thisChangeId === changeCounter) {
											var newScope = scope.$new();
											$transclude(newScope, function (clone) {
												cleanupLastIncludeContent();
												currentScope = newScope;
												currentElement = clone;
												currentElement.html(response);
												$animate.enter(currentElement, null, $element, afterAnimation);
												$compile(currentElement.contents())(currentScope);
												currentScope.$emit("$includeContentLoaded");
												scope.$eval(onloadExp);
											});
										}
									}).error(function () {
										if (thisChangeId === changeCounter) {
											cleanupLastIncludeContent();
										}
									});
									scope.$emit("$includeContentRequested")
								} else {
									cleanupLastIncludeContent();
								}
							});
						}
					}
				}
			}
		],
		ngInitDirective = ngDirective({
			compile: function () {
				return {
					pre: function (scope, element, attrs) {
						scope.$eval(attrs.ngInit)
					}
				}
			}
		}),
		ngNonBindableDirective = ngDirective({
			terminal: !0,
			priority: 1e3
		}),
		ngPluralizeDirective = ["$locale", "$interpolate",
			function ($locale, $interpolate) {
				var BRACE = /{}/g;
				return {
					restrict: "EA",
					link: function (scope, element, attr) {
						var numberExp = attr.count,
							whenExp = attr.$attr.when && element.attr(attr.$attr.when),
							offset = attr.offset || 0,
							whens = scope.$eval(whenExp) || {}, whensExpFns = {}, startSymbol = $interpolate.startSymbol(),
							endSymbol = $interpolate.endSymbol(),
							isWhen = /^when(Minus)?(.+)$/;
						forEach(attr, function (expression, attributeName) {
							isWhen.test(attributeName) && (whens[lowercase(attributeName.replace("when", "").replace("Minus", "-"))] = element.attr(attr.$attr[attributeName]))
						});
						forEach(whens, function (expression, key) {
							whensExpFns[key] = $interpolate(expression.replace(BRACE, startSymbol + numberExp + "-" + offset + endSymbol))
						});
						scope.$watch(function () {
							var value = parseFloat(scope.$eval(numberExp));
							return isNaN(value) ? "" : (value in whens || (value = $locale.pluralCat(value - offset)), whensExpFns[value](scope, element, !0))
						}, function (newVal) {
							element.text(newVal)
						})
					}
				}
			}
		],
		ngRepeatDirective = ["$parse", "$animate",
			function ($parse, $animate) {
				var NG_REMOVED = "$$NG_REMOVED",
					ngRepeatMinErr = minErr("ngRepeat");
				return {
					transclude: "element",
					priority: 1e3,
					terminal: !0,
					$$tlb: !0,
					link: function ($scope, $element, $attr, ctrl, $transclude) {
						var trackByExp, trackByExpGetter, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn,
							lhs, rhs, valueIdentifier, keyIdentifier, expression = $attr.ngRepeat,
							match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/),
							hashFnLocals = {
								$id: hashKey
							};
						if (!match) {
							throw ngRepeatMinErr("iexp", "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression);
						}
						lhs = match[1], rhs = match[2], trackByExp = match[4];
						if (trackByExp) {
							trackByExpGetter = $parse(trackByExp);
							trackByIdExpFn = function (key, value, index) {
								keyIdentifier && (hashFnLocals[keyIdentifier] = key);
								hashFnLocals[valueIdentifier] = value;
								hashFnLocals.$index = index;
								return trackByExpGetter($scope, hashFnLocals);
							}
						} else {
							trackByIdArrayFn = function (key, value) {
								return hashKey(value)
							};
							trackByIdObjFn = function (key) {
								return key
							};
						}
						match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
						if (!match) {
							throw ngRepeatMinErr("iidexp", "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs);
						}
						valueIdentifier = match[3] || match[1];
						keyIdentifier = match[2];
						var lastBlockMap = {};
						$scope.$watchCollection(rhs, function (collection) {
							var index, length, nextNode, arrayLength, childScope, key, value,
								trackById, trackByIdFn, collectionKeys, block,
								elementsToRemove, previousNode = $element[0],
								nextBlockMap = {}, nextBlockOrder = [];
							if (isArrayLike(collection)) { //数组
								collectionKeys = collection;
								trackByIdFn = trackByIdExpFn || trackByIdArrayFn;
							}
							else { //对象
								trackByIdFn = trackByIdExpFn || trackByIdObjFn;
								collectionKeys = [];
								for (key in collection) {
									if (collection.hasOwnProperty(key) && "$" != key.charAt(0)) {
										collectionKeys.push(key);
									}
								}
								collectionKeys.sort();
							}
							arrayLength = collectionKeys.length;
							length = nextBlockOrder.length = collectionKeys.length;
							for (index = 0; length > index; index++) {
								if (collection === collectionKeys) {
									key = index;
								} else {
									key = collectionKeys[index];
								}
								value = collection[key];
								trackById = trackByIdFn(key, value, index);
								assertNotHasOwnProperty(trackById, "`track by` id");
								if (lastBlockMap.hasOwnProperty(trackById)) {
									block = lastBlockMap[trackById];
									delete lastBlockMap[trackById];
									nextBlockMap[trackById] = block;
									nextBlockOrder[index] = block;
								}
								else {
									if (nextBlockMap.hasOwnProperty(trackById)) {
										forEach(nextBlockOrder, function (block) {
											if (block && block.startNode) {
												lastBlockMap[block.id] = block;
											}
										});
										throw ngRepeatMinErr("dupes", "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}", expression, trackById);
									}
									nextBlockOrder[index] = {
										id: trackById
									};
									nextBlockMap[trackById] = !1;
								}
							}
							for (key in lastBlockMap)
								if (lastBlockMap.hasOwnProperty(key)) {
									block = lastBlockMap[key];
									elementsToRemove = getBlockElements(block);
									$animate.leave(elementsToRemove);
									forEach(elementsToRemove, function (element) {
										element[NG_REMOVED] = !0
									});
									block.scope.$destroy()
								}
							for (index = 0, length = collectionKeys.length; length > index; index++) {
								if (collection === collectionKeys) {
									key = index;
								} else {
									key = collectionKeys[index];
								}
								value = collection[key];
								block = nextBlockOrder[index];
								if (nextBlockOrder[index - 1]) {
									previousNode = nextBlockOrder[index - 1].endNode;
								}
								if (block.startNode) {
									childScope = block.scope;
									nextNode = previousNode;
									do {
										nextNode = nextNode.nextSibling;
									} while (nextNode && nextNode[NG_REMOVED]);
									if (block.startNode != nextNode) {
										$animate.move(getBlockElements(block), null, jqLite(previousNode))
									}
									previousNode = block.endNode;
								} else {
									childScope = $scope.$new();
								}
								childScope[valueIdentifier] = value;
								if (keyIdentifier) {
									childScope[keyIdentifier] = key;
								}
								childScope.$index = index;
								childScope.$first = 0 === index;
								childScope.$last = index === arrayLength - 1;
								childScope.$middle = !(childScope.$first || childScope.$last);
								childScope.$even = 0 === (1 & index);
								childScope.$odd = !childScope.$even;
								if (!block.startNode) {
									$transclude(childScope, function (clone) {
										clone[clone.length++] = document.createComment(" end ngRepeat: " + expression + " ");
										$animate.enter(clone, null, jqLite(previousNode));
										previousNode = clone;
										block.scope = childScope;
										if (previousNode && previousNode.endNode) {
											block.startNode = previousNode.endNode;
										} else {
											block.startNode = clone[0];
										}
										block.endNode = clone[clone.length - 1];
										nextBlockMap[block.id] = block;
									})
								}
							}
							lastBlockMap = nextBlockMap;
						})
					}
				}
			}
		],
		ngShowDirective = ["$animate",
			function ($animate) {
				return function (scope, element, attr) {
					scope.$watch(attr.ngShow, function (value) {
						$animate[toBoolean(value) ? "removeClass" : "addClass"](element, "ng-hide");
					})
				}
			}
		],
		ngHideDirective = ["$animate",
			function ($animate) {
				return function (scope, element, attr) {
					scope.$watch(attr.ngHide, function (value) {
						$animate[toBoolean(value) ? "addClass" : "removeClass"](element, "ng-hide");
					})
				}
			}
		],
		ngStyleDirective = ngDirective(function (scope, element, attr) {
			scope.$watch(attr.ngStyle, function (newStyles, oldStyles) {
				if (oldStyles && newStyles !== oldStyles) {
					forEach(oldStyles, function (val, style) {
						element.css(style, "")
					});
				}
				if (newStyles) {
					element.css(newStyles);
				}
			}, !0); //深度监听
		}),
		ngSwitchDirective = ["$animate",
			function ($animate) {
				return {
					restrict: "EA",
					require: "ngSwitch",
					controller: ["$scope",
						function () {
							this.cases = {}
						}
					],
					link: function (scope, element, attr, ngSwitchController) {
						var selectedTranscludes, selectedElements, watchExpr = attr.ngSwitch || attr.on,
							selectedScopes = [];
						scope.$watch(watchExpr, function (value) {
							for (var i = 0, ii = selectedScopes.length; ii > i; i++) {
								selectedScopes[i].$destroy();
								$animate.leave(selectedElements[i]);
							}
							selectedElements = [];
							selectedScopes = [];
							(selectedTranscludes = ngSwitchController.cases["!" + value] || ngSwitchController.cases["?"]) && (scope.$eval(attr.change), forEach(selectedTranscludes, function (selectedTransclude) {
								var selectedScope = scope.$new();
								selectedScopes.push(selectedScope), selectedTransclude.transclude(selectedScope, function (caseElement) {
									var anchor = selectedTransclude.element;
									selectedElements.push(caseElement), $animate.enter(caseElement, anchor.parent(), anchor)
								})
							}));
						})
					}
				}
			}
		],
		ngSwitchWhenDirective = ngDirective({
			transclude: "element",
			priority: 800,
			require: "^ngSwitch",
			compile: function (element, attrs) {
				return function (scope, element, attr, ctrl, $transclude) {
					ctrl.cases["!" + attrs.ngSwitchWhen] = ctrl.cases["!" + attrs.ngSwitchWhen] || [], ctrl.cases["!" + attrs.ngSwitchWhen].push({
						transclude: $transclude,
						element: element
					})
				}
			}
		}),
		ngSwitchDefaultDirective = ngDirective({
			transclude: "element",
			priority: 800,
			require: "^ngSwitch",
			link: function (scope, element, attr, ctrl, $transclude) {
				ctrl.cases["?"] = ctrl.cases["?"] || [];
				ctrl.cases["?"].push({
					transclude: $transclude,
					element: element
				})
			}
		}),
		ngTranscludeDirective = ngDirective({
			controller: ["$element", "$transclude",
				function ($element, $transclude) {
					if (!$transclude) {
						throw minErr("ngTransclude")("orphan", "Illegal use of ngTransclude directive in the template!" +
							" No parent directive that requires a transclusion found. Element: {0}", startingTag($element));
					}
					this.$transclude = $transclude
				}
			],
			link: function ($scope, $element, $attrs, controller) {
				controller.$transclude(function (clone) {
					$element.html("");
					$element.append(clone);
				})
			}
		}),
		scriptDirective = ["$templateCache",
			function ($templateCache) {
				return {
					restrict: "E",
					terminal: !0,
					compile: function (element, attr) {
						if ("text/ng-template" == attr.type) {
							var templateUrl = attr.id,
								text = element[0].text;
							$templateCache.put(templateUrl, text)
						}
					}
				}
			}
		],
		ngOptionsMinErr = minErr("ngOptions"),
		ngOptionsDirective = valueFn({
			terminal: !0
		}),
		selectDirective = ["$compile", "$parse",
			function ($compile, $parse) {
				var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/,
					nullModelCtrl = {
						$setViewValue: noop
					};
				return {
					restrict: "E",
					require: ["select", "?ngModel"],
					controller: ["$element", "$scope", "$attrs",
						function ($element, $scope, $attrs) {
							var nullOption, unknownOption, self = this,
								optionsMap = {}, ngModelCtrl = nullModelCtrl;
							self.databound = $attrs.ngModel;
							self.init = function (ngModelCtrl_, nullOption_, unknownOption_) {
								ngModelCtrl = ngModelCtrl_;
								nullOption = nullOption_;
								unknownOption = unknownOption_;
							};
							self.addOption = function (value) {
								assertNotHasOwnProperty(value, '"option value"');
								optionsMap[value] = !0;
								if (ngModelCtrl.$viewValue == value) {
									$element.val(value);
									unknownOption.parent() && unknownOption.remove();
								}
							};
							self.removeOption = function (value) {
								if (this.hasOption(value)) {
									delete optionsMap[value];
									ngModelCtrl.$viewValue == value && this.renderUnknownOption(value);
								}
							};
							self.renderUnknownOption = function (val) {
								var unknownVal = "? " + hashKey(val) + " ?";
								unknownOption.val(unknownVal);
								$element.prepend(unknownOption);
								$element.val(unknownVal);
								unknownOption.prop("selected", !0);
							};
							self.hasOption = function (value) {
								return optionsMap.hasOwnProperty(value)
							};
							$scope.$on("$destroy", function () {
								self.renderUnknownOption = noop
							})
						}
					],
					link: function (scope, element, attr, ctrls) {
						function setupAsSingle(scope, selectElement, ngModelCtrl, selectCtrl) {
							ngModelCtrl.$render = function () {
								var viewValue = ngModelCtrl.$viewValue;
								if (selectCtrl.hasOption(viewValue)) {
									unknownOption.parent() && unknownOption.remove();
									selectElement.val(viewValue);
									if ("" === viewValue) {
										emptyOption.prop("selected", !0);
									}
								} else {
									if (isUndefined(viewValue) && emptyOption) {
										selectElement.val("");
									} else {
										selectCtrl.renderUnknownOption(viewValue);
									}
								}
							};
							selectElement.on("change", function () {
								scope.$apply(function () {
									unknownOption.parent() && unknownOption.remove();
									ngModelCtrl.$setViewValue(selectElement.val());
								});
							})
						}

						function setupAsMultiple(scope, selectElement, ctrl) {
							var lastView;
							ctrl.$render = function () {
								var items = new HashMap(ctrl.$viewValue);
								forEach(selectElement.find("option"), function (option) {
									option.selected = isDefined(items.get(option.value))
								})
							};
							scope.$watch(function () {
								if (!equals(lastView, ctrl.$viewValue)) {
									lastView = copy(ctrl.$viewValue);
									ctrl.$render();
								}
							});
							selectElement.on("change", function () {
								scope.$apply(function () {
									var array = [];
									forEach(selectElement.find("option"), function (option) {
										option.selected && array.push(option.value)
									});
									ctrl.$setViewValue(array)
								})
							})
						}

						function setupAsOptions(scope, selectElement, ctrl) {
							function render() {
								var optionGroupName, optionGroup, option, existingParent, existingOptions,
									existingOption, key, groupLength, length, groupIndex, index, selected,
									lastElement, element, label, optionGroups = {
										"": []
									}, optionGroupNames = [""],
									modelValue = ctrl.$modelValue,
									values = valuesFn(scope) || [],
									keys = keyName ? sortedKeys(values) : values,
									locals = {}, selectedSet = !1;
								if (multiple)
									if (trackFn && isArray(modelValue)) {
										selectedSet = new HashMap([]);
										for (var trackIndex = 0; trackIndex < modelValue.length; trackIndex++) {
											locals[valueName] = modelValue[trackIndex];
											selectedSet.put(trackFn(scope, locals), modelValue[trackIndex]);
										}
									} else {
										selectedSet = new HashMap(modelValue);
									}
								for (index = 0; length = keys.length, length > index; index++) {
									if (key = index, keyName) {
										key = keys[index];
										if ("$" === key.charAt(0)) continue;
										locals[keyName] = key;
									}
									locals[valueName] = values[key];
									optionGroupName = groupByFn(scope, locals) || "";
									optionGroup = optionGroups[optionGroupName];
									if (!optionGroup) {
										optionGroup = optionGroups[optionGroupName] = [];
										optionGroupNames.push(optionGroupName);
									}
									if (multiple) {
										var remove;
										if (trackFn) {
											remove = trackFn(scope, locals);
										} else {
											remove = valueFn(scope, locals);
										}
										selected = isDefined(selectedSet.remove(remove));
									}
									else {
										if (trackFn) {
											var modelCast = {};
											modelCast[valueName] = modelValue;
											selected = trackFn(scope, modelCast) === trackFn(scope, locals);
										} else {
											selected = modelValue === valueFn(scope, locals);
										}
										selectedSet = selectedSet || selected;
									}
									label = displayFn(scope, locals);
									label = isDefined(label) ? label : "";
									optionGroup.push({
										id: trackFn ? trackFn(scope, locals) : keyName ? keys[index] : index,
										label: label,
										selected: selected
									});
								}
								if (!multiple) {
									if (nullOption || null === modelValue) {
										optionGroups[""].unshift({
											id: "",
											label: "",
											selected: !selectedSet
										});
									} else {
										if (!selectedSet) {
											optionGroups[""].unshift({
												id: "?",
												label: "",
												selected: !0
											});
										}
									}
								}
								for (groupIndex = 0, groupLength = optionGroupNames.length; groupIndex < groupLength; groupIndex++) {
									optionGroupName = optionGroupNames[groupIndex];
									optionGroup = optionGroups[optionGroupName];
									if (optionGroupsCache.length <= groupIndex) {
										existingParent = {
											element: optGroupTemplate.clone().attr("label", optionGroupName),
											label: optionGroup.label
										};
										existingOptions = [existingParent];
										optionGroupsCache.push(existingOptions);
										selectElement.append(existingParent.element);
									} else {
										existingOptions = optionGroupsCache[groupIndex];
										existingParent = existingOptions[0];
										if (existingParent.label != optionGroupName) {
											existingParent.element.attr("label", existingParent.label = optionGroupName);
										}
									}
									lastElement = null;
									for (index = 0, length = optionGroup.length; length > index; index++) {
										option = optionGroup[index];
										if ((existingOption = existingOptions[index + 1])) {
											lastElement = existingOption.element;
											if (existingOption.label !== option.label) {
												lastElement.text(existingOption.label = option.label);
											}
											if (existingOption.id !== option.id) {
												lastElement.val(existingOption.id = option.id);
											}
											if (lastElement[0].selected !== option.selected) {
												lastElement.prop("selected", existingOption.selected = option.selected);
											}
										} else {
											if ("" === option.id && nullOption) {
												element = nullOption;
											} else {
												element = optionTemplate.clone();
												element.val(option.id).attr("selected", option.selected);
												element.text(option.label);
												existingOptions.push(existingOption = {
													element: element,
													label: option.label,
													id: option.id,
													selected: option.selected
												});
												if (lastElement) {
													lastElement.after(element);
												} else {
													existingParent.element.append(element);
												}
												lastElement = element;
											}
										}
									}
									for (index++; existingOptions.length > index;) {
										existingOptions.pop().element.remove();
									}
								}
								for (; optionGroupsCache.length > groupIndex;) {
									optionGroupsCache.pop()[0].element.remove();
								}
							}

							var match;
							if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) {
								throw ngOptionsMinErr("iexp", "Expected expression in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_' but got '{0}'. Element: {1}", optionsExp, startingTag(selectElement));
							}
							var displayFn = $parse(match[2] || match[1]),
								valueName = match[4] || match[6],
								keyName = match[5],
								groupByFn = $parse(match[3] || ""),
								valueFn = $parse(match[2] ? match[1] : valueName),
								valuesFn = $parse(match[7]),
								track = match[8],
								trackFn = track ? $parse(match[8]) : null,
								optionGroupsCache = [
									[{
										element: selectElement,
										label: ""
									}]
								];
							if (nullOption) {
								$compile(nullOption)(scope);
								nullOption.removeClass("ng-scope");
								nullOption.remove();
							}
							selectElement.html("");
							selectElement.on("change", function () {
								scope.$apply(function () {
									var optionGroup, key, value, optionElement, index, groupIndex, length, groupLength, trackIndex, collection = valuesFn(scope) || [],
										locals = {};
									if (multiple) {
										for (value = [], groupIndex = 0, groupLength = optionGroupsCache.length; groupLength > groupIndex; groupIndex++) {
											optionGroup = optionGroupsCache[groupIndex];
											for (index = 1, length = optionGroup.length; length > index; index++)
												if ((optionElement = optionGroup[index].element)[0].selected) {
													key = optionElement.val();
													keyName && (locals[keyName] = key);
													if (trackFn) {
														for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
															locals[valueName] = collection[trackIndex];
															trackFn(scope, locals) != key;
														}
													}
													else {
														locals[valueName] = collection[key];
													}
													value.push(valueFn(scope, locals))
												}
										}
									} else if (key = selectElement.val(), "?" == key) {
										value = undefined;
									}
									else if ("" === key) {
										value = null;
									}
									else if (trackFn) {
										for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
											locals[valueName] = collection[trackIndex];
											if (trackFn(scope, locals) == key) {
												value = valueFn(scope, locals);
												break
											}
										}

									} else {
										locals[valueName] = collection[key];
										keyName && (locals[keyName] = key);
										value = valueFn(scope, locals);
									}
									ctrl.$setViewValue(value);
								});
							});
							ctrl.$render = render;
							scope.$watch(render);
						}

						if (ctrls[1]) {
							var emptyOption,
								selectCtrl = ctrls[0],
								ngModelCtrl = ctrls[1],
								multiple = attr.multiple,
								optionsExp = attr.ngOptions,
								nullOption = !1,
								optionTemplate = jqLite(document.createElement("option")),
								optGroupTemplate = jqLite(document.createElement("optgroup")),
								unknownOption = optionTemplate.clone(),
								i = 0, ii,
								children = element.children();

							for (ii = children.length; ii > i; i++)
								if ("" === children[i].value) {
									emptyOption = nullOption = children.eq(i);
									break
								}
							selectCtrl.init(ngModelCtrl, nullOption, unknownOption);
							if (multiple && (attr.required || attr.ngRequired)) {
								var requiredValidator = function (value) {
									ngModelCtrl.$setValidity("required", !attr.required || value && value.length);
									return value;
								};
								ngModelCtrl.$parsers.push(requiredValidator);
								ngModelCtrl.$formatters.unshift(requiredValidator);
								attr.$observe("required", function () {
									requiredValidator(ngModelCtrl.$viewValue);
								})
							}
							if (optionsExp) {
								setupAsOptions(scope, element, ngModelCtrl);
							} else if (multiple) {
								setupAsMultiple(scope, element, ngModelCtrl);
							} else {
								setupAsSingle(scope, element, ngModelCtrl, selectCtrl);
							}
						}
					}
				}
			}
		],
		optionDirective = ["$interpolate",
			function ($interpolate) {
				var nullSelectCtrl = {
					addOption: noop,
					removeOption: noop
				};
				return {
					restrict: "E",
					priority: 100,
					compile: function (element, attr) {
						if (isUndefined(attr.value)) {
							var interpolateFn = $interpolate(element.text(), !0);
							interpolateFn || attr.$set("value", element.text())
						}
						return function (scope, element, attr) {
							var selectCtrlName = "$selectController",
								parent = element.parent(),
								selectCtrl = parent.data(selectCtrlName) || parent.parent().data(selectCtrlName);
							if (selectCtrl && selectCtrl.databound) {
								element.prop("selected", !1)
							} else {
								selectCtrl = nullSelectCtrl;
							}
							if (interpolateFn) {
								scope.$watch(interpolateFn, function (newVal, oldVal) {
									attr.$set("value", newVal);
									if (newVal !== oldVal) {
										selectCtrl.removeOption(oldVal);
									}
									selectCtrl.addOption(newVal);
								})
							} else {
								selectCtrl.addOption(attr.value);
							}
							element.on("$destroy", function () {
								selectCtrl.removeOption(attr.value)
							})
						}
					}
				}
			}
		],
		styleDirective = valueFn({
			restrict: "E",
			terminal: !0
		});
	bindJQuery();
	publishExternalAPI(angular);
	jqLite(document).ready(function () {
		console.log('event..DOMContentLoaded..ready');
		angularInit(document, bootstrap); //
	});
}(window, document);

//
if (!angular.$$csp()) {
	angular.element(document).find("head").prepend('' +
		'<style type="text/css">' +
		'   @charset "UTF-8";' +
		'   [ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide{display:none !important;}' +
		'   ng\\:form{display:block;}' +
		'   .ng-animate-start{clip:rect(0,auto,auto,0);-ms-zoom:1.0001;}' +
		'   .ng-animate-active{clip:rect(-1px,auto,auto,0);-ms-zoom:1;}' +
		'</style>');
}