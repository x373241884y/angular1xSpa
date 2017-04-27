'use strict';
var ngIncludeDirective = ['$http', '$templateCache', '$anchorScroll', '$compile', '$animate', '$sce',
	function ($http, $templateCache, $anchorScroll, $compile, $animate, $sce) {
		return {
			restrict: 'ECA',
			priority: 400,
			terminal: true,
			transclude: 'element',
			compile: function (element, attr) {
				var srcExp = attr.ngInclude || attr.src,
					onloadExp = attr.onload || '',
					autoScrollExp = attr.autoscroll;
				return function (scope, $element, $attr, ctrl, $transclude) {
					var changeCounter = 0,
						currentScope,
						currentElement;
					var cleanupLastIncludeContent = function () {
						if (currentScope) {
							currentScope.$destroy();
							currentScope = null;
						}
						if (currentElement) {
							$animate.leave(currentElement);
							currentElement = null;
						}
					};
					scope.$watch($sce.parseAsResourceUrl(srcExp), function ngIncludeWatchAction(src) {
						var afterAnimation = function () {
							if (isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
								$anchorScroll();
							}
						};
						var thisChangeId = ++changeCounter;
						if (src) {
							$http.get(src, {cache: $templateCache}).success(function (response) {
								if (thisChangeId !== changeCounter) return;
								var newScope = scope.$new();

								var clone = $transclude(newScope, noop);
								cleanupLastIncludeContent();
								currentScope = newScope;
								currentElement = clone;
								currentElement.html(response);
								$animate.enter(currentElement, null, $element, afterAnimation);
								$compile(currentElement.contents())(currentScope);
								currentScope.$emit('$includeContentLoaded');
								scope.$eval(onloadExp);
							}).error(function () {
								if (thisChangeId === changeCounter) cleanupLastIncludeContent();
							});
							scope.$emit('$includeContentRequested');
						} else {
							cleanupLastIncludeContent();
						}
					});
				};
			}
		};
	}];
