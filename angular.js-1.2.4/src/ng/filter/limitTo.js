'use strict';
function limitToFilter() {
	return function (input, limit) {
		if (!isArray(input) && !isString(input)) return input;
		limit = int(limit);
		if (isString(input)) {
			//NaN check on limit
			if (limit) {
				return limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length);
			} else {
				return "";
			}
		}
		var out = [],
			i, n;
		// if abs(limit) exceeds maximum length, trim it
		if (limit > input.length)
			limit = input.length;
		else if (limit < -input.length)
			limit = -input.length;
		if (limit > 0) {
			i = 0;
			n = limit;
		} else {
			i = input.length + limit;
			n = input.length;
		}
		for (; i < n; i++) {
			out.push(input[i]);
		}
		return out;
	};
}
