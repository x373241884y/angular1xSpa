'use strict';

function hashKey(obj) {
	var objType = typeof obj,
		key;
	if (objType == 'object' && obj !== null) {
		if (typeof (key = obj.$$hashKey) == 'function') {
			// must invoke on object to keep the right this
			key = obj.$$hashKey();
		} else if (key === undefined) {
			key = obj.$$hashKey = nextUid();
		}
	} else {
		key = obj;
	}
	return objType + ':' + key;
}

function HashMap(array) {
	forEach(array, this.put, this);
}
HashMap.prototype = {

	put: function (key, value) {
		this[hashKey(key)] = value;
	},

	get: function (key) {
		return this[hashKey(key)];
	},

	remove: function (key) {
		var value = this[key = hashKey(key)];
		delete this[key];
		return value;
	}
};
