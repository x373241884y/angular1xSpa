'use strict';
function classDirective(name, selector) {
  name = 'ngClass' + name;
  return function() {
    return {
      restrict: 'AC',
      link: function(scope, element, attr) {
        var oldVal;
        scope.$watch(attr[name], ngClassWatchAction, true);
        attr.$observe('class', function(value) {
          ngClassWatchAction(scope.$eval(attr[name]));
        });
        if (name !== 'ngClass') {
          scope.$watch('$index', function($index, old$index) {
            // jshint bitwise: false
            var mod = $index & 1;
            if (mod !== old$index & 1) {
              var classes = flattenClasses(scope.$eval(attr[name]));
              mod === selector ?
                attr.$addClass(classes) :
                attr.$removeClass(classes);
            }
          });
        }
        function ngClassWatchAction(newVal) {
          if (selector === true || scope.$index % 2 === selector) {
            var newClasses = flattenClasses(newVal || '');
            if(!oldVal) {
              attr.$addClass(newClasses);
            } else if(!equals(newVal,oldVal)) {
              attr.$updateClass(newClasses, flattenClasses(oldVal));
            }
          }
          oldVal = copy(newVal);
        }
        function flattenClasses(classVal) {
          if(isArray(classVal)) {
            return classVal.join(' ');
          } else if (isObject(classVal)) {
            var classes = [], i = 0;
            forEach(classVal, function(v, k) {
              if (v) {
                classes.push(k);
              }
            });
            return classes.join(' ');
          }
          return classVal;
        }
      }
    };
  };
}
var ngClassDirective = classDirective('', true);
var ngClassOddDirective = classDirective('Odd', 0);
var ngClassEvenDirective = classDirective('Even', 1);
