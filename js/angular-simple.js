/**
 * Created by toor on 15-8-11.
 */
var lodash = require('lodash');
function Scope() {
    this.$$watchers = [];
}

Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn
    };
    this.$$watchers.push(watcher);
};
Scope.prototype.$digest = function () {
    var self = this;
    lodash.forEach(this.$$watchers, function (watch) {
        //watch.listenerFn();
        var newValue = watch.watchFn(self);
        var oldValue = watch.last;
        if (newValue != oldValue) {
            watch.listenerFn(newValue, oldValue, self);
        }
        watch.last = newValue;
    });
};

//test angularjs
var scope = new Scope();
scope.firstName = 'Joe';
scope.counter = 0;

scope.$watch(function (scope) {
    return scope.firstName;
}, function (newValue, oldValue, scope) {
    scope.counter++;
})

// We haven't run $digest yet so counter should be untouched:
console.log(scope.counter === 0);

// The first digest causes the listener to be run
scope.$digest();
console.log(scope.counter === 1);

// Further digests don't call the listener...
scope.$digest();
scope.$digest();
console.log(scope.counter === 1);

// ... until the value that the watch function is watching changes again
scope.firstName = 'Jane';
scope.$digest();
scope.$digest();
console.log(scope.counter === 2);