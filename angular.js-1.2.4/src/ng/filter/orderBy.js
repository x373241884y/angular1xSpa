'use strict';
orderByFilter.$inject = ['$parse'];
function orderByFilter($parse) {
	return function (array, sortPredicate, reverseOrder) {
		if (!isArray(array)) return array;
		if (!sortPredicate) return array;
		sortPredicate = isArray(sortPredicate) ? sortPredicate : [sortPredicate];
		sortPredicate = map(sortPredicate, function (predicate) {
			var descending = false, get = predicate || identity;
			if (isString(predicate)) {
				if ((predicate.charAt(0) == '+' || predicate.charAt(0) == '-')) {
					descending = predicate.charAt(0) == '-';
					predicate = predicate.substring(1);
				}
				get = $parse(predicate);
			}
			return reverseComparator(function (a, b) {
				return compare(get(a), get(b));
			}, descending);
		});
		var arrayCopy = [];
		for (var i = 0; i < array.length; i++) {
			arrayCopy.push(array[i]);
		}
		return arrayCopy.sort(reverseComparator(comparator, reverseOrder));
		function comparator(o1, o2) {
			for (var i = 0; i < sortPredicate.length; i++) {
				var comp = sortPredicate[i](o1, o2);
				if (comp !== 0) return comp;
			}
			return 0;
		}

		function reverseComparator(comp, descending) {
			return toBoolean(descending)
				? function (a, b) {
				return comp(b, a);
			}
				: comp;
		}

		function compare(v1, v2) {
			var t1 = typeof v1;
			var t2 = typeof v2;
			if (t1 == t2) {
				if (t1 == "string") {
					v1 = v1.toLowerCase();
					v2 = v2.toLowerCase();
				}
				if (v1 === v2) return 0;
				return v1 < v2 ? -1 : 1;
			} else {
				return t1 < t2 ? -1 : 1;
			}
		}
	};
}
