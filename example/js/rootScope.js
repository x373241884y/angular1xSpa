'use strict';
function $RootScopeProvider(){
    var TTL = 10;
    var $rootScopeMinErr = minErr('$rootScope');
    var lastDirtyWatch = null;

    this.digestTtl = function(value) {
        if (arguments.length) {
            TTL = value;
        }
        return TTL;
    };

    this.$get = ['$injector', '$exceptionHandler', '$parse', '$browser',
        function( $injector,   $exceptionHandler,   $parse,   $browser) {

            function Scope() {
                this.$id = nextUid();
                this.$$phase = this.$parent = this.$$watchers =
                    this.$$nextSibling = this.$$prevSibling =
                        this.$$childHead = this.$$childTail = null;
                this['this'] = this.$root =  this;
                this.$$destroyed = false;
                this.$$asyncQueue = [];
                this.$$postDigestQueue = [];
                this.$$listeners = {};
                this.$$listenerCount = {};
                this.$$isolateBindings = {};
            }
            Scope.prototype = {
                constructor: Scope,
                $new: function(isolate) {
                    var ChildScope,
                        child;

                    if (isolate) {
                        child = new Scope();
                        child.$root = this.$root;
                        // ensure that there is just one async queue per $rootScope and its children
                        child.$$asyncQueue = this.$$asyncQueue;
                        child.$$postDigestQueue = this.$$postDigestQueue;
                    } else {
                        // Only create a child scope class if somebody asks for one,
                        // but cache it to allow the VM to optimize lookups.
                        if (!this.$$childScopeClass) {
                            this.$$childScopeClass = function() {
                                this.$$watchers = this.$$nextSibling =
                                    this.$$childHead = this.$$childTail = null;
                                this.$$listeners = {};
                                this.$$listenerCount = {};
                                this.$id = nextUid();
                                this.$$childScopeClass = null;
                            };
                            this.$$childScopeClass.prototype = this;
                        }
                        child = new this.$$childScopeClass();
                    }
                    child['this'] = child;
                    child.$parent = this;
                    child.$$prevSibling = this.$$childTail;
                    if (this.$$childHead) {
                        this.$$childTail.$$nextSibling = child;
                        this.$$childTail = child;
                    } else {
                        this.$$childHead = this.$$childTail = child;
                    }
                    return child;
                },
                $watch: function(watchExp, listener, objectEquality) {
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
                        watcher.fn = function(newVal, oldVal, scope) {listenFn(scope);};
                    }

                    if (typeof watchExp == 'string' && get.constant) {
                        var originalFn = watcher.fn;
                        watcher.fn = function(newVal, oldVal, scope) {
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

                    return function deregisterWatch() {
                        arrayRemove(array, watcher);
                        lastDirtyWatch = null;
                    };
                },
                $watchCollection: function(obj, listener) {
                    var self = this;
                    // the current value, updated on each dirty-check run
                    var newValue;
                    // a shallow copy of the newValue from the last dirty-check run,
                    // updated to match newValue during dirty-check run
                    var oldValue;
                    // a shallow copy of the newValue from when the last change happened
                    var veryOldValue;
                    // only track veryOldValue if the listener is asking for it
                    var trackVeryOldValue = (listener.length > 1);
                    var changeDetected = 0;
                    var objGetter = $parse(obj);
                    var internalArray = [];
                    var internalObject = {};
                    var initRun = true;
                    var oldLength = 0;

                    function $watchCollectionWatch() {
                        newValue = objGetter(self);
                        var newLength, key, bothNaN;

                        if (!isObject(newValue)) { // if primitive
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
                                bothNaN = (oldValue[i] !== oldValue[i]) &&
                                    (newValue[i] !== newValue[i]);
                                if (!bothNaN && (oldValue[i] !== newValue[i])) {
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
                                        bothNaN = (oldValue[key] !== oldValue[key]) &&
                                            (newValue[key] !== newValue[key]);
                                        if (!bothNaN && (oldValue[key] !== newValue[key])) {
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
                                for(key in oldValue) {
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
                        if (initRun) {
                            initRun = false;
                            listener(newValue, newValue, self);
                        } else {
                            listener(newValue, veryOldValue, self);
                        }

                        // make a copy for the next time a collection is changed
                        if (trackVeryOldValue) {
                            if (!isObject(newValue)) {
                                //primitive
                                veryOldValue = newValue;
                            } else if (isArrayLike(newValue)) {
                                veryOldValue = new Array(newValue.length);
                                for (var i = 0; i < newValue.length; i++) {
                                    veryOldValue[i] = newValue[i];
                                }
                            } else { // if object
                                veryOldValue = {};
                                for (var key in newValue) {
                                    if (hasOwnProperty.call(newValue, key)) {
                                        veryOldValue[key] = newValue[key];
                                    }
                                }
                            }
                        }
                    }

                    return this.$watch($watchCollectionWatch, $watchCollectionAction);
                },
                $digest: function() {
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
                    // Check for changes to browser url that happened in sync before the call to $digest
                    $browser.$$checkUrlChange();

                    lastDirtyWatch = null;

                    do { // "while dirty" loop
                        dirty = false;
                        current = target;

                        while(asyncQueue.length) {
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
                                                if ((value = watch.get(current)) !== (last = watch.last) &&
                                                    !(watch.eq
                                                        ? equals(value, last)
                                                        : (typeof value === 'number' && typeof last === 'number'
                                                    && isNaN(value) && isNaN(last)))) {
                                                    dirty = true;
                                                    lastDirtyWatch = watch;
                                                    watch.last = watch.eq ? copy(value, null) : value;
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
                                    while(current !== target && !(next = current.$$nextSibling)) {
                                        current = current.$parent;
                                    }
                                }
                            } while ((current = next));

                        // `break traverseScopesLoop;` takes us to here

                        if((dirty || asyncQueue.length) && !(ttl--)) {
                            clearPhase();
                            throw $rootScopeMinErr('infdig',
                                '{0} $digest() iterations reached. Aborting!\n' +
                                'Watchers fired in the last 5 iterations: {1}',
                                TTL, toJson(watchLog));
                        }

                    } while (dirty || asyncQueue.length);

                    clearPhase();

                    while(postDigestQueue.length) {
                        try {
                            postDigestQueue.shift()();
                        } catch (e) {
                            $exceptionHandler(e);
                        }
                    }
                },
                $destroy: function() {
                    // we can't destroy the root scope or a scope that has been already destroyed
                    if (this.$$destroyed) return;
                    var parent = this.$parent;

                    this.$broadcast('$destroy');
                    this.$$destroyed = true;
                    if (this === $rootScope) return;

                    forEach(this.$$listenerCount, bind(null, decrementListenerCount, this));

                    // sever all the references to parent scopes (after this cleanup, the current scope should
                    // not be retained by any of our references and should be eligible for garbage collection)
                    if (parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
                    if (parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
                    if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
                    if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;


                    // All of the code below is bogus code that works around V8's memory leak via optimized code
                    // and inline caches.
                    //
                    // see:
                    // - https://code.google.com/p/v8/issues/detail?id=2073#c26
                    // - https://github.com/angular/angular.js/issues/6794#issuecomment-38648909
                    // - https://github.com/angular/angular.js/issues/1313#issuecomment-10378451

                    this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead =
                        this.$$childTail = this.$root = null;

                    // don't reset these to null in case some async task tries to register a listener/watch/task
                    this.$$listeners = {};
                    this.$$watchers = this.$$asyncQueue = this.$$postDigestQueue = [];

                    // prevent NPEs since these methods have references to properties we nulled out
                    this.$destroy = this.$digest = this.$apply = noop;
                    this.$on = this.$watch = function() { return noop; };
                },
                $eval: function(expr, locals) {
                    return $parse(expr)(this, locals);
                },
                $evalAsync: function(expr) {
                    // if we are outside of an $digest loop and this is the first time we are scheduling async
                    // task also schedule async auto-flush
                    if (!$rootScope.$$phase && !$rootScope.$$asyncQueue.length) {
                        $browser.defer(function() {
                            if ($rootScope.$$asyncQueue.length) {
                                $rootScope.$digest();
                            }
                        });
                    }

                    this.$$asyncQueue.push({scope: this, expression: expr});
                },

                $$postDigest : function(fn) {
                    this.$$postDigestQueue.push(fn);
                },
                $apply: function(expr) {
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
                $on: function(name, listener) {
                    var namedListeners = this.$$listeners[name];
                    if (!namedListeners) {
                        this.$$listeners[name] = namedListeners = [];
                    }
                    namedListeners.push(listener);

                    var current = this;
                    do {
                        if (!current.$$listenerCount[name]) {
                            current.$$listenerCount[name] = 0;
                        }
                        current.$$listenerCount[name]++;
                    } while ((current = current.$parent));

                    var self = this;
                    return function() {
                        var indexOfListener = indexOf(namedListeners, listener);
                        if (indexOfListener !== -1) {
                            namedListeners[indexOfListener] = null;
                            decrementListenerCount(self, 1, name);
                        }
                    };
                },
                $emit: function(name, args) {
                    var empty = [],
                        namedListeners,
                        scope = this,
                        stopPropagation = false,
                        event = {
                            name: name,
                            targetScope: scope,
                            stopPropagation: function() {stopPropagation = true;},
                            preventDefault: function() {
                                event.defaultPrevented = true;
                            },
                            defaultPrevented: false
                        },
                        listenerArgs = concat([event], arguments, 1),
                        i, length;

                    do {
                        namedListeners = scope.$$listeners[name] || empty;
                        event.currentScope = scope;
                        for (i=0, length=namedListeners.length; i<length; i++) {

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
                $broadcast: function(name, args) {
                    var target = this,
                        current = target,
                        next = target,
                        event = {
                            name: name,
                            targetScope: target,
                            preventDefault: function() {
                                event.defaultPrevented = true;
                            },
                            defaultPrevented: false
                        },
                        listenerArgs = concat([event], arguments, 1),
                        listeners, i, length;

                    //down while you can, then up and next sibling or up and next sibling until back at root
                    while ((current = next)) {
                        event.currentScope = current;
                        listeners = current.$$listeners[name] || [];
                        for (i=0, length = listeners.length; i<length; i++) {
                            // if listeners were deregistered, defragment the array
                            if (!listeners[i]) {
                                listeners.splice(i, 1);
                                i--;
                                length--;
                                continue;
                            }

                            try {
                                listeners[i].apply(null, listenerArgs);
                            } catch(e) {
                                $exceptionHandler(e);
                            }
                        }

                        // Insanity Warning: scope depth-first traversal
                        // yes, this code is a bit crazy, but it works and we have tests to prove it!
                        // this piece should be kept in sync with the traversal in $digest
                        // (though it differs due to having the extra check for $$listenerCount)
                        if (!(next = ((current.$$listenerCount[name] && current.$$childHead) ||
                            (current !== target && current.$$nextSibling)))) {
                            while(current !== target && !(next = current.$$nextSibling)) {
                                current = current.$parent;
                            }
                        }
                    }

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

            function decrementListenerCount(current, count, name) {
                do {
                    current.$$listenerCount[name] -= count;

                    if (current.$$listenerCount[name] === 0) {
                        delete current.$$listenerCount[name];
                    }
                } while ((current = current.$parent));
            }

            /**
             * function used as an initial value for watchers.
             * because it's unique we can easily tell it apart from other values
             */
            function initWatchVal() {}
        }];
}