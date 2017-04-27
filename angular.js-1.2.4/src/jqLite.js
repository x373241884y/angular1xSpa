'use strict';
var jqCache = JQLite.cache = {},
	jqName = JQLite.expando = 'ng-' + new Date().getTime(),
	jqId = 1,
	addEventListenerFn = (window.document.addEventListener
		? function (element, type, fn) {
		element.addEventListener(type, fn, false);
	}
		: function (element, type, fn) {
		element.attachEvent('on' + type, fn);
	}),
	removeEventListenerFn = (window.document.removeEventListener
		? function (element, type, fn) {
		element.removeEventListener(type, fn, false);
	}
		: function (element, type, fn) {
		element.detachEvent('on' + type, fn);
	});

function jqNextId() {
	return ++jqId;
}


var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
var MOZ_HACK_REGEXP = /^moz([A-Z])/;
var jqLiteMinErr = minErr('jqLite');

function camelCase(name) {
	return name.
	replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
		return offset ? letter.toUpperCase() : letter;
	}).
	replace(MOZ_HACK_REGEXP, 'Moz$1');
}


function jqLitePatchJQueryRemove(name, dispatchThis, filterElems, getterIfNoArguments) {
	var originalJqFn = jQuery.fn[name];
	originalJqFn = originalJqFn.$original || originalJqFn;
	removePatch.$original = originalJqFn;
	jQuery.fn[name] = removePatch;

	function removePatch(param) {

		var list = filterElems && param ? [this.filter(param)] : [this],
			fireEvent = dispatchThis,
			set, setIndex, setLength,
			element, childIndex, childLength, children;

		if (!getterIfNoArguments || param != null) {
			while (list.length) {
				set = list.shift();
				for (setIndex = 0, setLength = set.length; setIndex < setLength; setIndex++) {
					element = jqLite(set[setIndex]);
					if (fireEvent) {
						element.triggerHandler('$destroy');
					} else {
						fireEvent = !fireEvent;
					}
					for (childIndex = 0, childLength = (children = element.children()).length;
					     childIndex < childLength;
					     childIndex++) {
						list.push(jQuery(children[childIndex]));
					}
				}
			}
		}
		return originalJqFn.apply(this, arguments);
	}
}

function JQLite(element) {
	if (element instanceof JQLite) {
		return element;
	}
	if (!(this instanceof JQLite)) {
		if (isString(element) && element.charAt(0) != '<') {
			throw jqLiteMinErr('nosel', 'Looking up elements via selectors is not supported by jqLite! See: http://docs.angularjs.org/api/angular.element');
		}
		return new JQLite(element);
	}

	if (isString(element)) {
		var div = document.createElement('div');


		div.innerHTML = '<div>&#160;</div>' + element; // IE insanity to make NoScope elements work!
		div.removeChild(div.firstChild); // remove the superfluous div
		jqLiteAddNodes(this, div.childNodes);
		var fragment = jqLite(document.createDocumentFragment());
		fragment.append(this); // detach the elements from the temporary DOM div.
	} else {
		jqLiteAddNodes(this, element);
	}
}

function jqLiteClone(element) {
	return element.cloneNode(true);
}

function jqLiteDealoc(element) {
	jqLiteRemoveData(element);
	for (var i = 0, children = element.childNodes || []; i < children.length; i++) {
		jqLiteDealoc(children[i]);
	}
}

function jqLiteOff(element, type, fn, unsupported) {
	if (isDefined(unsupported)) throw jqLiteMinErr('offargs', 'jqLite#off() does not support the `selector` argument');

	var events = jqLiteExpandoStore(element, 'events'),
		handle = jqLiteExpandoStore(element, 'handle');

	if (!handle) return; //no listeners registered

	if (isUndefined(type)) {
		forEach(events, function (eventHandler, type) {
			removeEventListenerFn(element, type, eventHandler);
			delete events[type];
		});
	} else {
		forEach(type.split(' '), function (type) {
			if (isUndefined(fn)) {
				removeEventListenerFn(element, type, events[type]);
				delete events[type];
			} else {
				arrayRemove(events[type] || [], fn);
			}
		});
	}
}

function jqLiteRemoveData(element, name) {
	var expandoId = element[jqName],
		expandoStore = jqCache[expandoId];

	if (expandoStore) {
		if (name) {
			delete jqCache[expandoId].data[name];
			return;
		}

		if (expandoStore.handle) {
			expandoStore.events.$destroy && expandoStore.handle({}, '$destroy');
			jqLiteOff(element);
		}
		delete jqCache[expandoId];
		element[jqName] = undefined; // ie does not allow deletion of attributes on elements.
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
	} else {
		return expandoStore && expandoStore[key];
	}
}

function jqLiteData(element, key, value) {
	var data = jqLiteExpandoStore(element, 'data'),
		isSetter = isDefined(value),
		keyDefined = !isSetter && isDefined(key),
		isSimpleGetter = keyDefined && !isObject(key);

	if (!data && !isSimpleGetter) {
		jqLiteExpandoStore(element, 'data', data = {});
	}

	if (isSetter) {
		data[key] = value;
	} else {
		if (keyDefined) {
			if (isSimpleGetter) {

				return data && data[key];
			} else {
				extend(data, key);
			}
		} else {
			return data;
		}
	}
}

function jqLiteHasClass(element, selector) {
	if (!element.getAttribute) return false;
	return ((" " + (element.getAttribute('class') || '') + " ").replace(/[\n\t]/g, " ").
	indexOf(" " + selector + " ") > -1);
}

function jqLiteRemoveClass(element, cssClasses) {
	if (cssClasses && element.setAttribute) {
		forEach(cssClasses.split(' '), function (cssClass) {
			element.setAttribute('class', trim(
				(" " + (element.getAttribute('class') || '') + " ")
					.replace(/[\n\t]/g, " ")
					.replace(" " + trim(cssClass) + " ", " "))
			);
		});
	}
}

function jqLiteAddClass(element, cssClasses) {
	if (cssClasses && element.setAttribute) {
		var existingClasses = (' ' + (element.getAttribute('class') || '') + ' ')
			.replace(/[\n\t]/g, " ");

		forEach(cssClasses.split(' '), function (cssClass) {
			cssClass = trim(cssClass);
			if (existingClasses.indexOf(' ' + cssClass + ' ') === -1) {
				existingClasses += cssClass + ' ';
			}
		});

		element.setAttribute('class', trim(existingClasses));
	}
}

function jqLiteAddNodes(root, elements) {
	if (elements) {
		elements = (!elements.nodeName && isDefined(elements.length) && !isWindow(elements))
			? elements
			: [elements];
		for (var i = 0; i < elements.length; i++) {
			root.push(elements[i]);
		}
	}
}

function jqLiteController(element, name) {
	return jqLiteInheritedData(element, '$' + (name || 'ngController' ) + 'Controller');
}

function jqLiteInheritedData(element, name, value) {
	element = jqLite(element);


	if (element[0].nodeType == 9) {
		element = element.find('html');
	}
	var names = isArray(name) ? name : [name];

	while (element.length) {

		for (var i = 0, ii = names.length; i < ii; i++) {
			if ((value = element.data(names[i])) !== undefined) return value;
		}
		element = element.parent();
	}
}


var JQLitePrototype = JQLite.prototype = {
	ready: function (fn) {
		var fired = false;

		function trigger() {
			if (fired) return;
			fired = true;
			fn();
		}

		if (document.readyState === 'complete') {
			setTimeout(trigger);
		} else {
			this.on('DOMContentLoaded', trigger); // works for modern browsers and IE9


			JQLite(window).on('load', trigger); // fallback to window.onload for others

		}
	},
	toString: function () {
		var value = [];
		forEach(this, function (e) {
			value.push('' + e);
		});
		return '[' + value.join(', ') + ']';
	},

	eq: function (index) {
		return (index >= 0) ? jqLite(this[index]) : jqLite(this[this.length + index]);
	},

	length: 0,
	push: push,
	sort: [].sort,
	splice: [].splice
};


var BOOLEAN_ATTR = {};
forEach('multiple,selected,checked,disabled,readOnly,required,open'.split(','), function (value) {
	BOOLEAN_ATTR[lowercase(value)] = value;
});
var BOOLEAN_ELEMENTS = {};
forEach('input,select,option,textarea,button,form,details'.split(','), function (value) {
	BOOLEAN_ELEMENTS[uppercase(value)] = true;
});

function getBooleanAttrName(element, name) {

	var booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];

	return booleanAttr && BOOLEAN_ELEMENTS[element.nodeName] && booleanAttr;
}

forEach({
	data: jqLiteData,
	inheritedData: jqLiteInheritedData,

	scope: function (element) {

		return jqLite(element).data('$scope') || jqLiteInheritedData(element.parentNode || element, ['$isolateScope', '$scope']);
	},

	isolateScope: function (element) {

		return jqLite(element).data('$isolateScope') || jqLite(element).data('$isolateScopeNoTemplate');
	},

	controller: jqLiteController,

	injector: function (element) {
		return jqLiteInheritedData(element, '$injector');
	},

	removeAttr: function (element, name) {
		element.removeAttribute(name);
	},

	hasClass: jqLiteHasClass,

	css: function (element, name, value) {
		name = camelCase(name);

		if (isDefined(value)) {
			element.style[name] = value;
		} else {
			var val;

			if (msie <= 8) {

				val = element.currentStyle && element.currentStyle[name];
				if (val === '') val = 'auto';
			}

			val = val || element.style[name];

			if (msie <= 8) {

				val = (val === '') ? undefined : val;
			}

			return val;
		}
	},

	attr: function (element, name, value) {
		var lowercasedName = lowercase(name);
		if (BOOLEAN_ATTR[lowercasedName]) {
			if (isDefined(value)) {
				if (!!value) {
					element[name] = true;
					element.setAttribute(name, lowercasedName);
				} else {
					element[name] = false;
					element.removeAttribute(lowercasedName);
				}
			} else {
				return (element[name] ||
				(element.attributes.getNamedItem(name) || noop).specified)
					? lowercasedName
					: undefined;
			}
		} else if (isDefined(value)) {
			element.setAttribute(name, value);
		} else if (element.getAttribute) {


			var ret = element.getAttribute(name, 2);

			return ret === null ? undefined : ret;
		}
	},

	prop: function (element, name, value) {
		if (isDefined(value)) {
			element[name] = value;
		} else {
			return element[name];
		}
	},

	text: (function () {
		var NODE_TYPE_TEXT_PROPERTY = [];
		if (msie < 9) {
			NODE_TYPE_TEXT_PROPERTY[1] = 'innerText';
			/** Element **/
			NODE_TYPE_TEXT_PROPERTY[3] = 'nodeValue';
			/** Text **/
		} else {
			NODE_TYPE_TEXT_PROPERTY[1] = /** Element **/
				NODE_TYPE_TEXT_PROPERTY[3] = 'textContent';
			/** Text **/
		}
		getText.$dv = '';
		return getText;

		function getText(element, value) {
			var textProp = NODE_TYPE_TEXT_PROPERTY[element.nodeType];
			if (isUndefined(value)) {
				return textProp ? element[textProp] : '';
			}
			element[textProp] = value;
		}
	})(),

	val: function (element, value) {
		if (isUndefined(value)) {
			if (nodeName_(element) === 'SELECT' && element.multiple) {
				var result = [];
				forEach(element.options, function (option) {
					if (option.selected) {
						result.push(option.value || option.text);
					}
				});
				return result.length === 0 ? null : result;
			}
			return element.value;
		}
		element.value = value;
	},

	html: function (element, value) {
		if (isUndefined(value)) {
			return element.innerHTML;
		}
		for (var i = 0, childNodes = element.childNodes; i < childNodes.length; i++) {
			jqLiteDealoc(childNodes[i]);
		}
		element.innerHTML = value;
	}
}, function (fn, name) {
	/**
	 * Properties: writes return selection, reads return first value
	 */
	JQLite.prototype[name] = function (arg1, arg2) {
		var i, key;


		if (((fn.length == 2 && (fn !== jqLiteHasClass && fn !== jqLiteController)) ? arg1 : arg2) === undefined) {
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

				return this;
			} else {

				var value = fn.$dv;

				var jj = (value === undefined) ? Math.min(this.length, 1) : this.length;
				for (var j = 0; j < jj; j++) {
					var nodeValue = fn(this[j], arg1, arg2);
					value = value ? value + nodeValue : nodeValue;
				}
				return value;
			}
		} else {

			for (i = 0; i < this.length; i++) {
				fn(this[i], arg1, arg2);
			}

			return this;
		}
	};
});

function createEventHandler(element, events) {
	var eventHandler = function (event, type) {
		if (!event.preventDefault) {
			event.preventDefault = function () {
				event.returnValue = false; //ie
			};
		}

		if (!event.stopPropagation) {
			event.stopPropagation = function () {
				event.cancelBubble = true; //ie
			};
		}

		if (!event.target) {
			event.target = event.srcElement || document;
		}

		if (isUndefined(event.defaultPrevented)) {
			var prevent = event.preventDefault;
			event.preventDefault = function () {
				event.defaultPrevented = true;
				prevent.call(event);
			};
			event.defaultPrevented = false;
		}

		event.isDefaultPrevented = function () {
			return event.defaultPrevented || event.returnValue === false;
		};

		forEach(events[type || event.type], function (fn) {
			fn.call(element, event);
		});


		if (msie <= 8) {

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


forEach({
	removeData: jqLiteRemoveData,

	dealoc: jqLiteDealoc,

	on: function onFn(element, type, fn, unsupported) {
		if (isDefined(unsupported)) throw jqLiteMinErr('onargs', 'jqLite#on() does not support the `selector` or `eventData` parameters');

		var events = jqLiteExpandoStore(element, 'events'),
			handle = jqLiteExpandoStore(element, 'handle');

		if (!events) jqLiteExpandoStore(element, 'events', events = {});
		if (!handle) jqLiteExpandoStore(element, 'handle', handle = createEventHandler(element, events));

		forEach(type.split(' '), function (type) {
			var eventFns = events[type];

			if (!eventFns) {
				if (type == 'mouseenter' || type == 'mouseleave') {
					var contains = document.body.contains || document.body.compareDocumentPosition ?
						function (a, b) {

							var adown = a.nodeType === 9 ? a.documentElement : a,
								bup = b && b.parentNode;
							return a === bup || !!( bup && bup.nodeType === 1 && (
									adown.contains ?
										adown.contains(bup) :
									a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
								));
						} :
						function (a, b) {
							if (b) {
								while ((b = b.parentNode)) {
									if (b === a) {
										return true;
									}
								}
							}
							return false;
						};

					events[type] = [];


					var eventmap = {mouseleave: "mouseout", mouseenter: "mouseover"};

					onFn(element, eventmap[type], function (event) {
						var target = this, related = event.relatedTarget;


						if (!related || (related !== target && !contains(target, related))) {
							handle(event, type);
						}
					});

				} else {
					addEventListenerFn(element, type, handle);
					events[type] = [];
				}
				eventFns = events[type];
			}
			eventFns.push(fn);
		});
	},

	off: jqLiteOff,

	replaceWith: function (element, replaceNode) {
		var index, parent = element.parentNode;
		jqLiteDealoc(element);
		forEach(new JQLite(replaceNode), function (node) {
			if (index) {
				parent.insertBefore(node, index.nextSibling);
			} else {
				parent.replaceChild(node, element);
			}
			index = node;
		});
	},

	children: function (element) {
		var children = [];
		forEach(element.childNodes, function (element) {
			if (element.nodeType === 1)
				children.push(element);
		});
		return children;
	},

	contents: function (element) {
		return element.childNodes || [];
	},

	append: function (element, node) {
		forEach(new JQLite(node), function (child) {
			if (element.nodeType === 1 || element.nodeType === 11) {
				element.appendChild(child);
			}
		});
	},

	prepend: function (element, node) {
		if (element.nodeType === 1) {
			var index = element.firstChild;
			forEach(new JQLite(node), function (child) {
				element.insertBefore(child, index);
			});
		}
	},

	wrap: function (element, wrapNode) {
		wrapNode = jqLite(wrapNode)[0];
		var parent = element.parentNode;
		if (parent) {
			parent.replaceChild(wrapNode, element);
		}
		wrapNode.appendChild(element);
	},

	remove: function (element) {
		jqLiteDealoc(element);
		var parent = element.parentNode;
		if (parent) parent.removeChild(element);
	},

	after: function (element, newElement) {
		var index = element, parent = element.parentNode;
		forEach(new JQLite(newElement), function (node) {
			parent.insertBefore(node, index.nextSibling);
			index = node;
		});
	},

	addClass: jqLiteAddClass,
	removeClass: jqLiteRemoveClass,

	toggleClass: function (element, selector, condition) {
		if (isUndefined(condition)) {
			condition = !jqLiteHasClass(element, selector);
		}
		(condition ? jqLiteAddClass : jqLiteRemoveClass)(element, selector);
	},

	parent: function (element) {
		var parent = element.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},

	next: function (element) {
		if (element.nextElementSibling) {
			return element.nextElementSibling;
		}

		var elm = element.nextSibling;
		while (elm != null && elm.nodeType !== 1) {
			elm = elm.nextSibling;
		}
		return elm;
	},

	find: function (element, selector) {
		if (element.getElementsByTagName) {
			return element.getElementsByTagName(selector);
		} else {
			return [];
		}
	},

	clone: jqLiteClone,

	triggerHandler: function (element, eventName, eventData) {
		var eventFns = (jqLiteExpandoStore(element, 'events') || {})[eventName];

		eventData = eventData || [];

		var event = [{
			preventDefault: noop,
			stopPropagation: noop
		}];

		forEach(eventFns, function (fn) {
			fn.apply(element, event.concat(eventData));
		});
	}
}, function (fn, name) {
	/**
	 * chaining functions
	 */
	JQLite.prototype[name] = function (arg1, arg2, arg3) {
		var value;
		for (var i = 0; i < this.length; i++) {
			if (isUndefined(value)) {
				value = fn(this[i], arg1, arg2, arg3);
				if (isDefined(value)) {

					value = jqLite(value);
				}
			} else {
				jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
			}
		}
		return isDefined(value) ? value : this;
	};

	JQLite.prototype.bind = JQLite.prototype.on;
	JQLite.prototype.unbind = JQLite.prototype.off;
});
