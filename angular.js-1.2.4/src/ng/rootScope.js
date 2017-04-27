'use strict';
function $RootScopeProvider() {
	var TTL = 10;
	var $rootScopeMinErr = minErr('$rootScope');
	var lastDirtyWatch = null;
	this.digestTtl = function (value) {
		if (arguments.length) {
			TTL = value;
		}
		return TTL;
	};
	this.$get = ['$injector', '$exceptionHandler', '$parse', '$browser',
		function ($injector, $exceptionHandler, $parse, $browser) {
			function Scope() {
				this.$id = nextUid();
				this.$$phase = this.$parent = this.$$watchers =
					this.$$nextSibling = this.$$prevSibling =
						this.$$childHead = this.$$childTail = null;
				this['this'] = this.$root = this;
				this.$$destroyed = false;
				this.$$asyncQueue = [];
				this.$$postDigestQueue = [];
				this.$$listeners = {};
				this.$$isolateBindings = {};
			}

			Scope.prototype = {
				constructor: Scope,
				$new: function (isolate) {
					var ChildScope,
						child;
					if (isolate) {
						child = new Scope();
						child.$root = this.$root;
						// ensure that there is just one async queue per $rootScope and its children
						child.$$asyncQueue = this.$$asyncQueue;
						child.$$postDigestQueue = this.$$postDigestQueue;
					} else {
						ChildScope = function () {
						}; // should be anonymous; This is so that when the minifier munges
						// the name it does not become random set of chars. This will then show up as class
						// name in the debugger.
						ChildScope.prototype = this;
						child = new ChildScope();
						child.$id = nextUid();
					}
					child['this'] = child;
					child.$$listeners = {};
					child.$parent = this;
					child.$$watchers = child.$$nextSibling = child.$$childHead = child.$$childTail = null;
					child.$$prevSibling = this.$$childTail;
					if (this.$$childHead) {
						this.$$childTail.$$nextSibling = child;
						this.$$childTail = child;
					} else {
						this.$$childHead = this.$$childTail = child;
					}
					return child;
				},
				$watch: function (watchExp, listener, objectEquality) {
					var scope = this,
						get = compileToFn(watchExp, 'watch'),
						array = scope.$$watchers,
						watcher = {
							fn: listener,
							last: initWatchVal,
							get: get,
							exp: watchExp,
							eq: !!objectEquality
						};
					lastDirtyWatch = null;
					// in the case user pass string, we need to compile it, do we really need this ?
					if (!isFunction(listener)) {
						var listenFn = compileToFn(listener || noop, 'listener');
						watcher.fn = function (newVal, oldVal, scope) {
							listenFn(scope);
						};
					}
					if (typeof watchExp == 'string' && get.constant) {
						var originalFn = watcher.fn;
						watcher.fn = function (newVal, oldVal, scope) {
							originalFn.call(this, newVal, oldVal, scope);
							arrayRemove(array, watcher);
						};
					}
					if (!array) {
						array = scope.$$watchers = [];
					}
					// we use unshift since we use a while loop in $digest for speed.
					// the while loop reads in reverse order.
					array.unshift(watcher);
					return function () {
						arrayRemove(array, watcher);
					};
				},
				$watchCollection: function (obj, listener) {
					var self = this;
					var oldValue;
					var newValue;
					var changeDetected = 0;
					var objGetter = $parse(obj);
					var internalArray = [];
					var internalObject = {};
					var oldLength = 0;

					function $watchCollectionWatch() {
						newValue = objGetter(self);
						var newLength, key;
						if (!isObject(newValue)) {
							if (oldValue !== newValue) {
								oldValue = newValue;
								changeDetected++;
							}
						} else if (isArrayLike(newValue)) {
							if (oldValue !== internalArray) {
								// we are transitioning from something which was not an array into array.
								oldValue = internalArray;
								oldLength = oldValue.length = 0;
								changeDetected++;
							}
							newLength = newValue.length;
							if (oldLength !== newLength) {
								// if lengths do not match we need to trigger change notification
								changeDetected++;
								oldValue.length = oldLength = newLength;
							}
							// copy the items to oldValue and look for changes.
							for (var i = 0; i < newLength; i++) {
								if (oldValue[i] !== newValue[i]) {
									changeDetected++;
									oldValue[i] = newValue[i];
								}
							}
						} else {
							if (oldValue !== internalObject) {
								// we are transitioning from something which was not an object into object.
								oldValue = internalObject = {};
								oldLength = 0;
								changeDetected++;
							}
							// copy the items to oldValue and look for changes.
							newLength = 0;
							for (key in newValue) {
								if (newValue.hasOwnProperty(key)) {
									newLength++;
									if (oldValue.hasOwnProperty(key)) {
										if (oldValue[key] !== newValue[key]) {
											changeDetected++;
											oldValue[key] = newValue[key];
										}
									} else {
										oldLength++;
										oldValue[key] = newValue[key];
										changeDetected++;
									}
								}
							}
							if (oldLength > newLength) {
								// we used to have more keys, need to find them and destroy them.
								changeDetected++;
								for (key in oldValue) {
									if (oldValue.hasOwnProperty(key) && !newValue.hasOwnProperty(key)) {
										oldLength--;
										delete oldValue[key];
									}
								}
							}
						}
						return changeDetected;
					}

					function $watchCollectionAction() {
						listener(newValue, oldValue, self);
					}

					return this.$watch($watchCollectionWatch, $watchCollectionAction);
				},
				$digest: function () {
					var watch, value, last,
						watchers,
						asyncQueue = this.$$asyncQueue,
						postDigestQueue = this.$$postDigestQueue,
						length,
						dirty, ttl = TTL,
						next, current, target = this,
						watchLog = [],
						logIdx, logMsg, asyncTask;
					beginPhase('$digest');
					lastDirtyWatch = null;
					do { // "while dirty" loop
						dirty = false;
						current = target;
						while (asyncQueue.length) {
							try {
								asyncTask = asyncQueue.shift();
								asyncTask.scope.$eval(asyncTask.expression);
							} catch (e) {
								clearPhase();
								$exceptionHandler(e);
							}
							lastDirtyWatch = null;
						}
						traverseScopesLoop:
							do { // "traverse the scopes" loop
								if ((watchers = current.$$watchers)) {
									// process our watches
									length = watchers.length;
									while (length--) {
										try {
											watch = watchers[length];
											// Most common watches are on primitives, in which case we can short
											// circuit it with === operator, only when === fails do we use .equals
											if (watch) {
												if ((value = watch.get(current)) !== (last = watch.last) && !(watch.eq
														? equals(value, last)
														: (typeof value == 'number' && typeof last == 'number'
													&& isNaN(value) && isNaN(last)))) {
													dirty = true;
													lastDirtyWatch = watch;
													watch.last = watch.eq ? copy(value) : value;
													watch.fn(value, ((last === initWatchVal) ? value : last), current);
													if (ttl < 5) {
														logIdx = 4 - ttl;
														if (!watchLog[logIdx]) watchLog[logIdx] = [];
														logMsg = (isFunction(watch.exp))
															? 'fn: ' + (watch.exp.name || watch.exp.toString())
															: watch.exp;
														logMsg += '; newVal: ' + toJson(value) + '; oldVal: ' + toJson(last);
														watchLog[logIdx].push(logMsg);
													}
												} else if (watch === lastDirtyWatch) {
													// If the most recently dirty watcher is now clean, short circuit since the remaining watchers
													// have already been tested.
													dirty = false;
													break traverseScopesLoop;
												}
											}
										} catch (e) {
											clearPhase();
											$exceptionHandler(e);
										}
									}
								}
								// Insanity Warning: scope depth-first traversal
								// yes, this code is a bit crazy, but it works and we have tests to prove it!
								// this piece should be kept in sync with the traversal in $broadcast
								if (!(next = (current.$$childHead ||
									(current !== target && current.$$nextSibling)))) {
									while (current !== target && !(next = current.$$nextSibling)) {
										current = current.$parent;
									}
								}
							} while ((current = next));
						// `break traverseScopesLoop;` takes us to here
						if (dirty && !(ttl--)) {
							clearPhase();
							throw $rootScopeMinErr('infdig',
								'{0} $digest() iterations reached. Aborting!\n' +
								'Watchers fired in the last 5 iterations: {1}',
								TTL, toJson(watchLog));
						}
					} while (dirty || asyncQueue.length);
					clearPhase();
					while (postDigestQueue.length) {
						try {
							postDigestQueue.shift()();
						} catch (e) {
							$exceptionHandler(e);
						}
					}
				},
				$destroy: function () {
					// we can't destroy the root scope or a scope that has been already destroyed
					if (this.$$destroyed) return;
					var parent = this.$parent;
					this.$broadcast('$destroy');
					this.$$destroyed = true;
					if (this === $rootScope) return;
					if (parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
					if (parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
					if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
					if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;
					// This is bogus code that works around Chrome's GC leak
					// see: https://github.com/angular/angular.js/issues/1313#issuecomment-10378451
					this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead =
						this.$$childTail = null;
				},
				$eval: function (expr, locals) {
					return $parse(expr)(this, locals);
				},
				$evalAsync: function (expr) {
					// if we are outside of an $digest loop and this is the first time we are scheduling async
					// task also schedule async auto-flush
					if (!$rootScope.$$phase && !$rootScope.$$asyncQueue.length) {
						$browser.defer(function () {
							if ($rootScope.$$asyncQueue.length) {
								$rootScope.$digest();
							}
						});
					}
					this.$$asyncQueue.push({scope: this, expression: expr});
				},
				$$postDigest: function (fn) {
					this.$$postDigestQueue.push(fn);
				},
				$apply: function (expr) {
					try {
						beginPhase('$apply');
						return this.$eval(expr);
					} catch (e) {
						$exceptionHandler(e);
					} finally {
						clearPhase();
						try {
							$rootScope.$digest();
						} catch (e) {
							$exceptionHandler(e);
							throw e;
						}
					}
				},
				$on: function (name, listener) {
					var namedListeners = this.$$listeners[name];
					if (!namedListeners) {
						this.$$listeners[name] = namedListeners = [];
					}
					namedListeners.push(listener);
					return function () {
						namedListeners[indexOf(namedListeners, listener)] = null;
					};
				},
				$emit: function (name, args) {
					var empty = [],
						namedListeners,
						scope = this,
						stopPropagation = false,
						event = {
							name: name,
							targetScope: scope,
							stopPropagation: function () {
								stopPropagation = true;
							},
							preventDefault: function () {
								event.defaultPrevented = true;
							},
							defaultPrevented: false
						},
						listenerArgs = concat([event], arguments, 1),
						i, length;
					do {
						namedListeners = scope.$$listeners[name] || empty;
						event.currentScope = scope;
						for (i = 0, length = namedListeners.length; i < length; i++) {
							// if listeners were deregistered, defragment the array
							if (!namedListeners[i]) {
								namedListeners.splice(i, 1);
								i--;
								length--;
								continue;
							}
							try {
								//allow all listeners attached to the current scope to run
								namedListeners[i].apply(null, listenerArgs);
							} catch (e) {
								$exceptionHandler(e);
							}
						}
						//if any listener on the current scope stops propagation, prevent bubbling
						if (stopPropagation) return event;
						//traverse upwards
						scope = scope.$parent;
					} while (scope);
					return event;
				},
				$broadcast: function (name, args) {
					var target = this,
						current = target,
						next = target,
						event = {
							name: name,
							targetScope: target,
							preventDefault: function () {
								event.defaultPrevented = true;
							},
							defaultPrevented: false
						},
						listenerArgs = concat([event], arguments, 1),
						listeners, i, length;
					//down while you can, then up and next sibling or up and next sibling until back at root
					do {
						current = next;
						event.currentScope = current;
						listeners = current.$$listeners[name] || [];
						for (i = 0, length = listeners.length; i < length; i++) {
							// if listeners were deregistered, defragment the array
							if (!listeners[i]) {
								listeners.splice(i, 1);
								i--;
								length--;
								continue;
							}
							try {
								listeners[i].apply(null, listenerArgs);
							} catch (e) {
								$exceptionHandler(e);
							}
						}
						// Insanity Warning: scope depth-first traversal
						// yes, this code is a bit crazy, but it works and we have tests to prove it!
						// this piece should be kept in sync with the traversal in $digest
						if (!(next = (current.$$childHead || (current !== target && current.$$nextSibling)))) {
							while (current !== target && !(next = current.$$nextSibling)) {
								current = current.$parent;
							}
						}
					} while ((current = next));
					return event;
				}
			};
			var $rootScope = new Scope();
			return $rootScope;
			function beginPhase(phase) {
				if ($rootScope.$$phase) {
					throw $rootScopeMinErr('inprog', '{0} already in progress', $rootScope.$$phase);
				}
				$rootScope.$$phase = phase;
			}

			function clearPhase() {
				$rootScope.$$phase = null;
			}

			function compileToFn(exp, name) {
				var fn = $parse(exp);
				assertArgFn(fn, name);
				return fn;
			}

			function initWatchVal() {
			}
		}];
}
