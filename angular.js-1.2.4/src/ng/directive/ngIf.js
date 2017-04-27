'use strict';
var ngIfDirective = ['$animate', function ($animate) {
	return {
		transclude: 'element',
		priority: 600,
		terminal: true,
		restrict: 'A',
		$$tlb: true,
		link: function ($scope, $element, $attr, ctrl, $transclude) {
			var block, childScope;
			$scope.$watch($attr.ngIf, function ngIfWatchAction(value) {
				if (toBoolean(value)) {
					if (!childScope) {
						childScope = $scope.$new();
						$transclude(childScope, function (clone) {
							clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
							// Note: We only need the first/last node of the cloned nodes.
							// However, we need to keep the reference to the jqlite wrapper as it might be changed later
							// by a directive with templateUrl when it's template arrives.
							block = {
								clone: clone
							};
							$animate.enter(clone, $element.parent(), $element);
						});
					}
				} else {
					if (childScope) {
						childScope.$destroy();
						childScope = null;
					}
					if (block) {
						$animate.leave(getBlockElements(block.clone));
						block = null;
					}
				}
			});
		}
	};
}];
