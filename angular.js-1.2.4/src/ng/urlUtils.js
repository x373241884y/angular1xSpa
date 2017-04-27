'use strict';
var urlParsingNode = document.createElement("a");
var originUrl = urlResolve(window.location.href, true);
function urlResolve(url, base) {
	var href = url;
	if (msie) {
		// Normalize before parse.  Refer Implementation Notes on why this is
		// done in two steps on IE.
		urlParsingNode.setAttribute("href", href);
		href = urlParsingNode.href;
	}
	urlParsingNode.setAttribute('href', href);
	// urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	return {
		href: urlParsingNode.href,
		protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
		host: urlParsingNode.host,
		search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
		hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
		hostname: urlParsingNode.hostname,
		port: urlParsingNode.port,
		pathname: (urlParsingNode.pathname.charAt(0) === '/')
			? urlParsingNode.pathname
			: '/' + urlParsingNode.pathname
	};
}
function urlIsSameOrigin(requestUrl) {
	var parsed = (isString(requestUrl)) ? urlResolve(requestUrl) : requestUrl;
	return (parsed.protocol === originUrl.protocol &&
	parsed.host === originUrl.host);
}
