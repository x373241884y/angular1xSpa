'use strict';
var $sceMinErr = minErr('$sce');
var SCE_CONTEXTS = {
	HTML: 'html',
	CSS: 'css',
	URL: 'url',
	// RESOURCE_URL is a subtype of URL used in contexts where a privileged resource is sourced from a
	// url.  (e.g. ng-include, script src, templateUrl)
	RESOURCE_URL: 'resourceUrl',
	JS: 'js'
};
// Helper functions follow.
// Copied from:
// http://docs.closure-library.googlecode.com/git/closure_goog_string_string.js.source.html#line962
// Prereq: s is a string.
function escapeForRegexp(s) {
	return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
	replace(/\x08/g, '\\x08');
}
function adjustMatcher(matcher) {
	if (matcher === 'self') {
		return matcher;
	} else if (isString(matcher)) {
		// Strings match exactly except for 2 wildcards - '*' and '**'.
		// '*' matches any character except those from the set ':/.?&'.
		// '**' matches any character (like .* in a RegExp).
		// More than 2 *'s raises an error as it's ill defined.
		if (matcher.indexOf('***') > -1) {
			throw $sceMinErr('iwcard',
				'Illegal sequence *** in string matcher.  String: {0}', matcher);
		}
		matcher = escapeForRegexp(matcher).
		replace('\\*\\*', '.*').
		replace('\\*', '[^:/.?&;]*');
		return new RegExp('^' + matcher + '$');
	} else if (isRegExp(matcher)) {
		// The only other type of matcher allowed is a Regexp.
		// Match entire URL / disallow partial matches.
		// Flags are reset (i.e. no global, ignoreCase or multiline)
		return new RegExp('^' + matcher.source + '$');
	} else {
		throw $sceMinErr('imatcher',
			'Matchers may only be "self", string patterns or RegExp objects');
	}
}
function adjustMatchers(matchers) {
	var adjustedMatchers = [];
	if (isDefined(matchers)) {
		forEach(matchers, function (matcher) {
			adjustedMatchers.push(adjustMatcher(matcher));
		});
	}
	return adjustedMatchers;
}
function $SceDelegateProvider() {
	this.SCE_CONTEXTS = SCE_CONTEXTS;
	// Resource URLs can also be trusted by policy.
	var resourceUrlWhitelist = ['self'],
		resourceUrlBlacklist = [];
	this.resourceUrlWhitelist = function (value) {
		if (arguments.length) {
			resourceUrlWhitelist = adjustMatchers(value);
		}
		return resourceUrlWhitelist;
	};
	this.resourceUrlBlacklist = function (value) {
		if (arguments.length) {
			resourceUrlBlacklist = adjustMatchers(value);
		}
		return resourceUrlBlacklist;
	};
	this.$get = ['$injector', function ($injector) {
		var htmlSanitizer = function htmlSanitizer(html) {
			throw $sceMinErr('unsafe', 'Attempting to use an unsafe value in a safe context.');
		};
		if ($injector.has('$sanitize')) {
			htmlSanitizer = $injector.get('$sanitize');
		}
		function matchUrl(matcher, parsedUrl) {
			if (matcher === 'self') {
				return urlIsSameOrigin(parsedUrl);
			} else {
				// definitely a regex.  See adjustMatchers()
				return !!matcher.exec(parsedUrl.href);
			}
		}

		function isResourceUrlAllowedByPolicy(url) {
			var parsedUrl = urlResolve(url.toString());
			var i, n, allowed = false;
			// Ensure that at least one item from the whitelist allows this url.
			for (i = 0, n = resourceUrlWhitelist.length; i < n; i++) {
				if (matchUrl(resourceUrlWhitelist[i], parsedUrl)) {
					allowed = true;
					break;
				}
			}
			if (allowed) {
				// Ensure that no item from the blacklist blocked this url.
				for (i = 0, n = resourceUrlBlacklist.length; i < n; i++) {
					if (matchUrl(resourceUrlBlacklist[i], parsedUrl)) {
						allowed = false;
						break;
					}
				}
			}
			return allowed;
		}

		function generateHolderType(Base) {
			var holderType = function TrustedValueHolderType(trustedValue) {
				this.$$unwrapTrustedValue = function () {
					return trustedValue;
				};
			};
			if (Base) {
				holderType.prototype = new Base();
			}
			holderType.prototype.valueOf = function sceValueOf() {
				return this.$$unwrapTrustedValue();
			};
			holderType.prototype.toString = function sceToString() {
				return this.$$unwrapTrustedValue().toString();
			};
			return holderType;
		}

		var trustedValueHolderBase = generateHolderType(),
			byType = {};
		byType[SCE_CONTEXTS.HTML] = generateHolderType(trustedValueHolderBase);
		byType[SCE_CONTEXTS.CSS] = generateHolderType(trustedValueHolderBase);
		byType[SCE_CONTEXTS.URL] = generateHolderType(trustedValueHolderBase);
		byType[SCE_CONTEXTS.JS] = generateHolderType(trustedValueHolderBase);
		byType[SCE_CONTEXTS.RESOURCE_URL] = generateHolderType(byType[SCE_CONTEXTS.URL]);
		function trustAs(type, trustedValue) {
			var Constructor = (byType.hasOwnProperty(type) ? byType[type] : null);
			if (!Constructor) {
				throw $sceMinErr('icontext',
					'Attempted to trust a value in invalid context. Context: {0}; Value: {1}',
					type, trustedValue);
			}
			if (trustedValue === null || trustedValue === undefined || trustedValue === '') {
				return trustedValue;
			}
			// All the current contexts in SCE_CONTEXTS happen to be strings.  In order to avoid trusting
			// mutable objects, we ensure here that the value passed in is actually a string.
			if (typeof trustedValue !== 'string') {
				throw $sceMinErr('itype',
					'Attempted to trust a non-string value in a content requiring a string: Context: {0}',
					type);
			}
			return new Constructor(trustedValue);
		}

		function valueOf(maybeTrusted) {
			if (maybeTrusted instanceof trustedValueHolderBase) {
				return maybeTrusted.$$unwrapTrustedValue();
			} else {
				return maybeTrusted;
			}
		}

		function getTrusted(type, maybeTrusted) {
			if (maybeTrusted === null || maybeTrusted === undefined || maybeTrusted === '') {
				return maybeTrusted;
			}
			var constructor = (byType.hasOwnProperty(type) ? byType[type] : null);
			if (constructor && maybeTrusted instanceof constructor) {
				return maybeTrusted.$$unwrapTrustedValue();
			}
			// If we get here, then we may only take one of two actions.
			// 1. sanitize the value for the requested type, or
			// 2. throw an exception.
			if (type === SCE_CONTEXTS.RESOURCE_URL) {
				if (isResourceUrlAllowedByPolicy(maybeTrusted)) {
					return maybeTrusted;
				} else {
					throw $sceMinErr('insecurl',
						'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: {0}',
						maybeTrusted.toString());
				}
			} else if (type === SCE_CONTEXTS.HTML) {
				return htmlSanitizer(maybeTrusted);
			}
			throw $sceMinErr('unsafe', 'Attempting to use an unsafe value in a safe context.');
		}

		return {
			trustAs: trustAs,
			getTrusted: getTrusted,
			valueOf: valueOf
		};
	}];
}
function $SceProvider() {
	var enabled = true;
	this.enabled = function (value) {
		if (arguments.length) {
			enabled = !!value;
		}
		return enabled;
	};
	this.$get = ['$parse', '$sniffer', '$sceDelegate', function ($parse, $sniffer, $sceDelegate) {
		// Prereq: Ensure that we're not running in IE8 quirks mode.  In that mode, IE allows
		// the "expression(javascript expression)" syntax which is insecure.
		if (enabled && $sniffer.msie && $sniffer.msieDocumentMode < 8) {
			throw $sceMinErr('iequirks',
				'Strict Contextual Escaping does not support Internet Explorer version < 9 in quirks ' +
				'mode.  You can fix this by adding the text <!doctype html> to the top of your HTML ' +
				'document.  See http://docs.angularjs.org/api/ng.$sce for more information.');
		}
		var sce = copy(SCE_CONTEXTS);
		sce.isEnabled = function () {
			return enabled;
		};
		sce.trustAs = $sceDelegate.trustAs;
		sce.getTrusted = $sceDelegate.getTrusted;
		sce.valueOf = $sceDelegate.valueOf;
		if (!enabled) {
			sce.trustAs = sce.getTrusted = function (type, value) {
				return value;
			};
			sce.valueOf = identity;
		}
		sce.parseAs = function sceParseAs(type, expr) {
			var parsed = $parse(expr);
			if (parsed.literal && parsed.constant) {
				return parsed;
			} else {
				return function sceParseAsTrusted(self, locals) {
					return sce.getTrusted(type, parsed(self, locals));
				};
			}
		};
		// Shorthand delegations.
		var parse = sce.parseAs,
			getTrusted = sce.getTrusted,
			trustAs = sce.trustAs;
		forEach(SCE_CONTEXTS, function (enumValue, name) {
			var lName = lowercase(name);
			sce[camelCase("parse_as_" + lName)] = function (expr) {
				return parse(enumValue, expr);
			};
			sce[camelCase("get_trusted_" + lName)] = function (value) {
				return getTrusted(enumValue, value);
			};
			sce[camelCase("trust_as_" + lName)] = function (value) {
				return trustAs(enumValue, value);
			};
		});
		return sce;
	}];
}
