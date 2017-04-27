'use strict';
var ngAttributeAliasDirectives = {};
// boolean attrs are evaluated
forEach(BOOLEAN_ATTR, function (propName, attrName) {
	// binding to multiple is not supported
	if (propName == "multiple") return;
	var normalized = directiveNormalize('ng-' + attrName);
	ngAttributeAliasDirectives[normalized] = function () {
		return {
			priority: 100,
			compile: function () {
				return function (scope, element, attr) {
					scope.$watch(attr[normalized], function ngBooleanAttrWatchAction(value) {
						attr.$set(attrName, !!value);
					});
				};
			}
		};
	};
});
// ng-src, ng-srcset, ng-href are interpolated
forEach(['src', 'srcset', 'href'], function (attrName) {
	var normalized = directiveNormalize('ng-' + attrName);
	ngAttributeAliasDirectives[normalized] = function () {
		return {
			priority: 99, // it needs to run after the attributes are interpolated
			link: function (scope, element, attr) {
				attr.$observe(normalized, function (value) {
					if (!value)
						return;
					attr.$set(attrName, value);
					// on IE, if "ng:src" directive declaration is used and "src" attribute doesn't exist
					// then calling element.setAttribute('src', 'foo') doesn't do anything, so we need
					// to set the property as well to achieve the desired effect.
					// we use attr[attrName] value since $set can sanitize the url.
					if (msie) element.prop(attrName, attr[attrName]);
				});
			}
		};
	};
});
