'use strict';
var $interpolateMinErr = minErr('$interpolate');
function $InterpolateProvider() {
	var startSymbol = '{{';
	var endSymbol = '}}';
	this.startSymbol = function (value) {
		if (value) {
			startSymbol = value;
			return this;
		} else {
			return startSymbol;
		}
	};
	this.endSymbol = function (value) {
		if (value) {
			endSymbol = value;
			return this;
		} else {
			return endSymbol;
		}
	};
	this.$get = ['$parse', '$exceptionHandler', '$sce', function ($parse, $exceptionHandler, $sce) {
		var startSymbolLength = startSymbol.length,
			endSymbolLength = endSymbol.length;

		function $interpolate(text, mustHaveExpression, trustedContext) {
			var startIndex,
				endIndex,
				index = 0,
				parts = [],
				length = text.length,
				hasInterpolation = false,
				fn,
				exp,
				concat = [];
			while (index < length) {
				if (((startIndex = text.indexOf(startSymbol, index)) != -1) &&
					((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1)) {
					(index != startIndex) && parts.push(text.substring(index, startIndex));
					parts.push(fn = $parse(exp = text.substring(startIndex + startSymbolLength, endIndex)));
					fn.exp = exp;
					index = endIndex + endSymbolLength;
					hasInterpolation = true;
				} else {
					// we did not find anything, so we have to add the remainder to the parts array
					(index != length) && parts.push(text.substring(index));
					index = length;
				}
			}
			if (!(length = parts.length)) {
				// we added, nothing, must have been an empty string.
				parts.push('');
				length = 1;
			}
			// Concatenating expressions makes it hard to reason about whether some combination of
			// concatenated values are unsafe to use and could easily lead to XSS.  By requiring that a
			// single expression be used for iframe[src], object[src], etc., we ensure that the value
			// that's used is assigned or constructed by some JS code somewhere that is more testable or
			// make it obvious that you bound the value to some user controlled value.  This helps reduce
			// the load when auditing for XSS issues.
			if (trustedContext && parts.length > 1) {
				throw $interpolateMinErr('noconcat',
					"Error while interpolating: {0}\nStrict Contextual Escaping disallows " +
					"interpolations that concatenate multiple expressions when a trusted value is " +
					"required.  See http://docs.angularjs.org/api/ng.$sce", text);
			}
			if (!mustHaveExpression || hasInterpolation) {
				concat.length = length;
				fn = function (context) {
					try {
						for (var i = 0, ii = length, part; i < ii; i++) {
							if (typeof (part = parts[i]) == 'function') {
								part = part(context);
								if (trustedContext) {
									part = $sce.getTrusted(trustedContext, part);
								} else {
									part = $sce.valueOf(part);
								}
								if (part === null || isUndefined(part)) {
									part = '';
								} else if (typeof part != 'string') {
									part = toJson(part);
								}
							}
							concat[i] = part;
						}
						return concat.join('');
					}
					catch (err) {
						var newErr = $interpolateMinErr('interr', "Can't interpolate: {0}\n{1}", text,
							err.toString());
						$exceptionHandler(newErr);
					}
				};
				fn.exp = text;
				fn.parts = parts;
				return fn;
			}
		}

		$interpolate.startSymbol = function () {
			return startSymbol;
		};
		$interpolate.endSymbol = function () {
			return endSymbol;
		};
		return $interpolate;
	}];
}
