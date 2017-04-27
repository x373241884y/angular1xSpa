'use strict';
function $$SanitizeUriProvider() {
	var aHrefSanitizationWhitelist = /^\s*(https?|ftp|mailto|tel|file):/, //匹配协议头
		imgSrcSanitizationWhitelist = /^\s*(https?|ftp|file):|data:image\//; //匹配图片协议头
	this.aHrefSanitizationWhitelist = function (regexp) {
		if (isDefined(regexp)) {
			aHrefSanitizationWhitelist = regexp;
			return this;
		}
		return aHrefSanitizationWhitelist;
	};
	this.imgSrcSanitizationWhitelist = function (regexp) {
		if (isDefined(regexp)) {
			imgSrcSanitizationWhitelist = regexp;
			return this;
		}
		return imgSrcSanitizationWhitelist;
	};
	this.$get = function () {
		return function sanitizeUri(uri, isImage) {
			var regex = isImage ? imgSrcSanitizationWhitelist : aHrefSanitizationWhitelist;
			var normalizedVal;
			// NOTE: urlResolve() doesn't support IE < 8 so we don't sanitize for that case.
			if (!msie || msie >= 8) {
				normalizedVal = urlResolve(uri).href;
				if (normalizedVal !== '' && !normalizedVal.match(regex)) {
					return 'unsafe:' + normalizedVal;
				}
			}
			return uri;
		};
	};
}
