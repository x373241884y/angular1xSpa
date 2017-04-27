'use strict';
currencyFilter.$inject = ['$locale'];
function currencyFilter($locale) {
	var formats = $locale.NUMBER_FORMATS;
	return function (amount, currencySymbol) {
		if (isUndefined(currencySymbol)) currencySymbol = formats.CURRENCY_SYM;
		return formatNumber(amount, formats.PATTERNS[1], formats.GROUP_SEP, formats.DECIMAL_SEP, 2).
		replace(/\u00A4/g, currencySymbol);
	};
}
numberFilter.$inject = ['$locale'];
function numberFilter($locale) {
	var formats = $locale.NUMBER_FORMATS;
	return function (number, fractionSize) {
		return formatNumber(number, formats.PATTERNS[0], formats.GROUP_SEP, formats.DECIMAL_SEP,
			fractionSize);
	};
}
var DECIMAL_SEP = '.';
function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
	if (isNaN(number) || !isFinite(number)) return '';
	var isNegative = number < 0;
	number = Math.abs(number);
	var numStr = number + '',
		formatedText = '',
		parts = [];
	var hasExponent = false;
	if (numStr.indexOf('e') !== -1) {
		var match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
		if (match && match[2] == '-' && match[3] > fractionSize + 1) {
			numStr = '0';
		} else {
			formatedText = numStr;
			hasExponent = true;
		}
	}
	if (!hasExponent) {
		var fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;
		// determine fractionSize if it is not specified
		if (isUndefined(fractionSize)) {
			fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
		}
		var pow = Math.pow(10, fractionSize);
		number = Math.round(number * pow) / pow;
		var fraction = ('' + number).split(DECIMAL_SEP);
		var whole = fraction[0];
		fraction = fraction[1] || '';
		var i, pos = 0,
			lgroup = pattern.lgSize,
			group = pattern.gSize;
		if (whole.length >= (lgroup + group)) {
			pos = whole.length - lgroup;
			for (i = 0; i < pos; i++) {
				if ((pos - i) % group === 0 && i !== 0) {
					formatedText += groupSep;
				}
				formatedText += whole.charAt(i);
			}
		}
		for (i = pos; i < whole.length; i++) {
			if ((whole.length - i) % lgroup === 0 && i !== 0) {
				formatedText += groupSep;
			}
			formatedText += whole.charAt(i);
		}
		// format fraction part.
		while (fraction.length < fractionSize) {
			fraction += '0';
		}
		if (fractionSize && fractionSize !== "0") formatedText += decimalSep + fraction.substr(0, fractionSize);
	} else {
		if (fractionSize > 0 && number > -1 && number < 1) {
			formatedText = number.toFixed(fractionSize);
		}
	}
	parts.push(isNegative ? pattern.negPre : pattern.posPre);
	parts.push(formatedText);
	parts.push(isNegative ? pattern.negSuf : pattern.posSuf);
	return parts.join('');
}
function padNumber(num, digits, trim) {
	var neg = '';
	if (num < 0) {
		neg = '-';
		num = -num;
	}
	num = '' + num;
	while (num.length < digits) num = '0' + num;
	if (trim)
		num = num.substr(num.length - digits);
	return neg + num;
}
function dateGetter(name, size, offset, trim) {
	offset = offset || 0;
	return function (date) {
		var value = date['get' + name]();
		if (offset > 0 || value > -offset)
			value += offset;
		if (value === 0 && offset == -12) value = 12;
		return padNumber(value, size, trim);
	};
}
function dateStrGetter(name, shortForm) {
	return function (date, formats) {
		var value = date['get' + name]();
		var get = uppercase(shortForm ? ('SHORT' + name) : name);
		return formats[get][value];
	};
}
function timeZoneGetter(date) {
	var zone = -1 * date.getTimezoneOffset();
	var paddedZone = (zone >= 0) ? "+" : "";
	paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) +
		padNumber(Math.abs(zone % 60), 2);
	return paddedZone;
}
function ampmGetter(date, formats) {
	return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
}
var DATE_FORMATS = {
	yyyy: dateGetter('FullYear', 4),
	yy: dateGetter('FullYear', 2, 0, true),
	y: dateGetter('FullYear', 1),
	MMMM: dateStrGetter('Month'),
	MMM: dateStrGetter('Month', true),
	MM: dateGetter('Month', 2, 1),
	M: dateGetter('Month', 1, 1),
	dd: dateGetter('Date', 2),
	d: dateGetter('Date', 1),
	HH: dateGetter('Hours', 2),
	H: dateGetter('Hours', 1),
	hh: dateGetter('Hours', 2, -12),
	h: dateGetter('Hours', 1, -12),
	mm: dateGetter('Minutes', 2),
	m: dateGetter('Minutes', 1),
	ss: dateGetter('Seconds', 2),
	s: dateGetter('Seconds', 1),
	// while ISO 8601 requires fractions to be prefixed with `.` or `,`
	// we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
	sss: dateGetter('Milliseconds', 3),
	EEEE: dateStrGetter('Day'),
	EEE: dateStrGetter('Day', true),
	a: ampmGetter,
	Z: timeZoneGetter
};
var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
	NUMBER_STRING = /^\-?\d+$/;
dateFilter.$inject = ['$locale'];
function dateFilter($locale) {
	var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
	// 1        2       3         4          5          6          7          8  9     10      11
	function jsonStringToDate(string) {
		var match;
		if (match = string.match(R_ISO8601_STR)) {
			var date = new Date(0),
				tzHour = 0,
				tzMin = 0,
				dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
				timeSetter = match[8] ? date.setUTCHours : date.setHours;
			if (match[9]) {
				tzHour = int(match[9] + match[10]);
				tzMin = int(match[9] + match[11]);
			}
			dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
			var h = int(match[4] || 0) - tzHour;
			var m = int(match[5] || 0) - tzMin;
			var s = int(match[6] || 0);
			var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
			timeSetter.call(date, h, m, s, ms);
			return date;
		}
		return string;
	}
	return function (date, format) {
		var text = '',
			parts = [],
			fn, match;
		format = format || 'mediumDate';
		format = $locale.DATETIME_FORMATS[format] || format;
		if (isString(date)) {
			if (NUMBER_STRING.test(date)) {
				date = int(date);
			} else {
				date = jsonStringToDate(date);
			}
		}
		if (isNumber(date)) {
			date = new Date(date);
		}
		if (!isDate(date)) {
			return date;
		}
		while (format) {
			match = DATE_FORMATS_SPLIT.exec(format);
			if (match) {
				parts = concat(parts, match, 1);
				format = parts.pop();
			} else {
				parts.push(format);
				format = null;
			}
		}
		forEach(parts, function (value) {
			fn = DATE_FORMATS[value];
			text += fn ? fn(date, $locale.DATETIME_FORMATS)
				: value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
		});
		return text;
	};
}
function jsonFilter() {
	return function (object) {
		return toJson(object, true);
	};
}
var lowercaseFilter = valueFn(lowercase);
var uppercaseFilter = valueFn(uppercase);
