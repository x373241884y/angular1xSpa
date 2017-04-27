'use strict';
var ngTranscludeDirective = ngDirective({
	controller: ['$element', '$transclude', function ($element, $transclude) {
		if (!$transclude) {
			throw minErr('ngTransclude')('orphan',
				'Illegal use of ngTransclude directive in the template! ' +
				'No parent directive that requires a transclusion found. ' +
				'Element: {0}',
				startingTag($element));
		}
		this.$transclude = $transclude;
	}],
	link: function ($scope, $element, $attrs, controller) {
		controller.$transclude(function (clone) {
			$element.html('');
			$element.append(clone);
		});
	}
});
