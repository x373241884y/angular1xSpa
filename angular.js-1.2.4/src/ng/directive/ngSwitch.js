'use strict';
var ngSwitchDirective = ['$animate', function ($animate) {
	return {
		restrict: 'EA',
		require: 'ngSwitch',
		// asks for $scope to fool the BC controller module
		controller: ['$scope', function ngSwitchController() {
			this.cases = {};
		}],
		link: function (scope, element, attr, ngSwitchController) {
			var watchExpr = attr.ngSwitch || attr.on,
				selectedTranscludes,
				selectedElements,
				selectedScopes = [];
			scope.$watch(watchExpr, function ngSwitchWatchAction(value) {
				for (var i = 0, ii = selectedScopes.length; i < ii; i++) {
					selectedScopes[i].$destroy();
					$animate.leave(selectedElements[i]);
				}
				selectedElements = [];
				selectedScopes = [];
				if ((selectedTranscludes = ngSwitchController.cases['!' + value] || ngSwitchController.cases['?'])) {
					scope.$eval(attr.change);
					forEach(selectedTranscludes, function (selectedTransclude) {
						var selectedScope = scope.$new();
						selectedScopes.push(selectedScope);
						selectedTransclude.transclude(selectedScope, function (caseElement) {
							var anchor = selectedTransclude.element;
							selectedElements.push(caseElement);
							$animate.enter(caseElement, anchor.parent(), anchor);
						});
					});
				}
			});
		}
	};
}];
var ngSwitchWhenDirective = ngDirective({
	transclude: 'element',
	priority: 800,
	require: '^ngSwitch',
	compile: function (element, attrs) {
		return function (scope, element, attr, ctrl, $transclude) {
			ctrl.cases['!' + attrs.ngSwitchWhen] = (ctrl.cases['!' + attrs.ngSwitchWhen] || []);
			ctrl.cases['!' + attrs.ngSwitchWhen].push({transclude: $transclude, element: element});
		};
	}
});
var ngSwitchDefaultDirective = ngDirective({
	transclude: 'element',
	priority: 800,
	require: '^ngSwitch',
	link: function (scope, element, attr, ctrl, $transclude) {
		ctrl.cases['?'] = (ctrl.cases['?'] || []);
		ctrl.cases['?'].push({transclude: $transclude, element: element});
	}
});
