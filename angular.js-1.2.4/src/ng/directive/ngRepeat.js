'use strict';
var ngRepeatDirective = ['$parse', '$animate', function ($parse, $animate) {
	var NG_REMOVED = '$$NG_REMOVED';
	var ngRepeatMinErr = minErr('ngRepeat');
	return {
		transclude: 'element',
		priority: 1000,
		terminal: true,
		$$tlb: true,
		link: function ($scope, $element, $attr, ctrl, $transclude) {
			var expression = $attr.ngRepeat;
			var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/),
				trackByExp, trackByExpGetter, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn,
				lhs, rhs, valueIdentifier, keyIdentifier,
				hashFnLocals = {$id: hashKey};
			if (!match) {
				throw ngRepeatMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.",
					expression);
			}
			lhs = match[1];
			rhs = match[2];
			trackByExp = match[4];
			if (trackByExp) {
				trackByExpGetter = $parse(trackByExp);
				trackByIdExpFn = function (key, value, index) {
					// assign key, value, and $index to the locals so that they can be used in hash functions
					if (keyIdentifier) hashFnLocals[keyIdentifier] = key;
					hashFnLocals[valueIdentifier] = value;
					hashFnLocals.$index = index;
					return trackByExpGetter($scope, hashFnLocals);
				};
			} else {
				trackByIdArrayFn = function (key, value) {
					return hashKey(value);
				};
				trackByIdObjFn = function (key) {
					return key;
				};
			}
			match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
			if (!match) {
				throw ngRepeatMinErr('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.",
					lhs);
			}
			valueIdentifier = match[3] || match[1];
			keyIdentifier = match[2];
			// Store a list of elements from previous run. This is a hash where key is the item from the
			// iterator, and the value is objects with following properties.
			//   - scope: bound scope
			//   - element: previous element.
			//   - index: position
			var lastBlockMap = {};
			//watch props
			$scope.$watchCollection(rhs, function ngRepeatAction(collection) {
				var index, length,
					previousNode = $element[0],     // current position of the node
					nextNode,
				// Same as lastBlockMap but it has the current state. It will become the
				// lastBlockMap on the next iteration.
					nextBlockMap = {},
					arrayLength,
					childScope,
					key, value, // key/value of iteration
					trackById,
					trackByIdFn,
					collectionKeys,
					block,       // last object information {scope, element, id}
					nextBlockOrder = [],
					elementsToRemove;
				if (isArrayLike(collection)) {
					collectionKeys = collection;
					trackByIdFn = trackByIdExpFn || trackByIdArrayFn;
				} else {
					trackByIdFn = trackByIdExpFn || trackByIdObjFn;
					// if object, extract keys, sort them and use to determine order of iteration over obj props
					collectionKeys = [];
					for (key in collection) {
						if (collection.hasOwnProperty(key) && key.charAt(0) != '$') {
							collectionKeys.push(key);
						}
					}
					collectionKeys.sort();
				}
				arrayLength = collectionKeys.length;
				// locate existing items
				length = nextBlockOrder.length = collectionKeys.length;
				for (index = 0; index < length; index++) {
					key = (collection === collectionKeys) ? index : collectionKeys[index];
					value = collection[key];
					trackById = trackByIdFn(key, value, index);
					assertNotHasOwnProperty(trackById, '`track by` id');
					if (lastBlockMap.hasOwnProperty(trackById)) {
						block = lastBlockMap[trackById];
						delete lastBlockMap[trackById];
						nextBlockMap[trackById] = block;
						nextBlockOrder[index] = block;
					} else if (nextBlockMap.hasOwnProperty(trackById)) {
						// restore lastBlockMap
						forEach(nextBlockOrder, function (block) {
							if (block && block.scope) lastBlockMap[block.id] = block;
						});
						// This is a duplicate and we need to throw an error
						throw ngRepeatMinErr('dupes', "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}",
							expression, trackById);
					} else {
						// new never before seen block
						nextBlockOrder[index] = {id: trackById};
						nextBlockMap[trackById] = false;
					}
				}
				// remove existing items
				for (key in lastBlockMap) {
					// lastBlockMap is our own object so we don't need to use special hasOwnPropertyFn
					if (lastBlockMap.hasOwnProperty(key)) {
						block = lastBlockMap[key];
						elementsToRemove = getBlockElements(block.clone);
						$animate.leave(elementsToRemove);
						forEach(elementsToRemove, function (element) {
							element[NG_REMOVED] = true;
						});
						block.scope.$destroy();
					}
				}
				// we are not using forEach for perf reasons (trying to avoid #call)
				for (index = 0, length = collectionKeys.length; index < length; index++) {
					key = (collection === collectionKeys) ? index : collectionKeys[index];
					value = collection[key];
					block = nextBlockOrder[index];
					if (nextBlockOrder[index - 1]) previousNode = getBlockEnd(nextBlockOrder[index - 1]);
					if (block.scope) {
						// if we have already seen this object, then we need to reuse the
						// associated scope/element
						childScope = block.scope;
						nextNode = previousNode;
						do {
							nextNode = nextNode.nextSibling;
						} while (nextNode && nextNode[NG_REMOVED]);
						if (getBlockStart(block) != nextNode) {
							// existing item which got moved
							$animate.move(getBlockElements(block.clone), null, jqLite(previousNode));
						}
						previousNode = getBlockEnd(block);
					} else {
						// new item which we don't know about
						childScope = $scope.$new();
					}
					childScope[valueIdentifier] = value;
					if (keyIdentifier) childScope[keyIdentifier] = key;
					childScope.$index = index;
					childScope.$first = (index === 0);
					childScope.$last = (index === (arrayLength - 1));
					childScope.$middle = !(childScope.$first || childScope.$last);
					// jshint bitwise: false
					childScope.$odd = !(childScope.$even = (index & 1) === 0);
					// jshint bitwise: true
					if (!block.scope) {
						$transclude(childScope, function (clone) {
							clone[clone.length++] = document.createComment(' end ngRepeat: ' + expression + ' ');
							$animate.enter(clone, null, jqLite(previousNode));
							previousNode = clone;
							block.scope = childScope;
							// Note: We only need the first/last node of the cloned nodes.
							// However, we need to keep the reference to the jqlite wrapper as it might be changed later
							// by a directive with templateUrl when it's template arrives.
							block.clone = clone;
							nextBlockMap[block.id] = block;
						});
					}
				}
				lastBlockMap = nextBlockMap;
			});
		}
	};
	function getBlockStart(block) {
		return block.clone[0];
	}
	function getBlockEnd(block) {
		return block.clone[block.clone.length - 1];
	}
}];
