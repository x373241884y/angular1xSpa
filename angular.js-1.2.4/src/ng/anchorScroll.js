'use strict';
function $AnchorScrollProvider() {
	var autoScrollingEnabled = true;
	this.disableAutoScrolling = function () {
		autoScrollingEnabled = false;
	};
	this.$get = ['$window', '$location', '$rootScope', function ($window, $location, $rootScope) {
		var document = $window.document;

		function getFirstAnchor(list) {
			var result = null;
			forEach(list, function (element) {
				if (!result && lowercase(element.nodeName) === 'a') result = element;
			});
			return result;
		}

		function scroll() {
			var hash = $location.hash(), elm;

			if (!hash) {
				$window.scrollTo(0, 0);
			} else if ((elm = document.getElementById(hash))) {
				elm.scrollIntoView();
			} else if ((elm = getFirstAnchor(document.getElementsByName(hash)))) {
				elm.scrollIntoView();

			} else if (hash === 'top') {
				$window.scrollTo(0, 0);
			}
		}

		if (autoScrollingEnabled) {
			$rootScope.$watch(function autoScrollWatch() {
					return $location.hash();
				},
				function autoScrollWatchAction() {
					$rootScope.$evalAsync(scroll);
				});
		}
		return scroll;
	}];
}
