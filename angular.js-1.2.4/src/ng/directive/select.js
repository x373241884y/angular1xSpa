'use strict';
var ngOptionsMinErr = minErr('ngOptions');
var ngOptionsDirective = valueFn({terminal: true});
// jshint maxlen: false
var selectDirective = ['$compile', '$parse', function ($compile, $parse) {
	//0000111110000000000022220000000000000000000000333300000000000000444444444444444000000000555555555555555000000066666666666666600000000000000007777000000000000000000088888
	var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/,
		nullModelCtrl = {$setViewValue: noop};
// jshint maxlen: 100
	return {
		restrict: 'E',
		require: ['select', '?ngModel'],
		controller: ['$element', '$scope', '$attrs', function ($element, $scope, $attrs) {
			var self = this,
				optionsMap = {},
				ngModelCtrl = nullModelCtrl,
				nullOption,
				unknownOption;
			self.databound = $attrs.ngModel;
			self.init = function (ngModelCtrl_, nullOption_, unknownOption_) {
				ngModelCtrl = ngModelCtrl_;
				nullOption = nullOption_;
				unknownOption = unknownOption_;
			};
			self.addOption = function (value) {
				assertNotHasOwnProperty(value, '"option value"');
				optionsMap[value] = true;
				if (ngModelCtrl.$viewValue == value) {
					$element.val(value);
					if (unknownOption.parent()) unknownOption.remove();
				}
			};
			self.removeOption = function (value) {
				if (this.hasOption(value)) {
					delete optionsMap[value];
					if (ngModelCtrl.$viewValue == value) {
						this.renderUnknownOption(value);
					}
				}
			};
			self.renderUnknownOption = function (val) {
				var unknownVal = '? ' + hashKey(val) + ' ?';
				unknownOption.val(unknownVal);
				$element.prepend(unknownOption);
				$element.val(unknownVal);
				unknownOption.prop('selected', true); // needed for IE
			};
			self.hasOption = function (value) {
				return optionsMap.hasOwnProperty(value);
			};
			$scope.$on('$destroy', function () {
				// disable unknown option so that we don't do work when the whole select is being destroyed
				self.renderUnknownOption = noop;
			});
		}],
		link: function (scope, element, attr, ctrls) {
			// if ngModel is not defined, we don't need to do anything
			if (!ctrls[1]) return;
			var selectCtrl = ctrls[0],
				ngModelCtrl = ctrls[1],
				multiple = attr.multiple,
				optionsExp = attr.ngOptions,
				nullOption = false, // if false, user will not be able to select it (used by ngOptions)
				emptyOption,
			// we can't just jqLite('<option>') since jqLite is not smart enough
			// to create it in <select> and IE barfs otherwise.
				optionTemplate = jqLite(document.createElement('option')),
				optGroupTemplate = jqLite(document.createElement('optgroup')),
				unknownOption = optionTemplate.clone();
			// find "null" option
			for (var i = 0, children = element.children(), ii = children.length; i < ii; i++) {
				if (children[i].value === '') {
					emptyOption = nullOption = children.eq(i);
					break;
				}
			}
			selectCtrl.init(ngModelCtrl, nullOption, unknownOption);
			// required validator
			if (multiple && (attr.required || attr.ngRequired)) {
				var requiredValidator = function (value) {
					ngModelCtrl.$setValidity('required', !attr.required || (value && value.length));
					return value;
				};
				ngModelCtrl.$parsers.push(requiredValidator);
				ngModelCtrl.$formatters.unshift(requiredValidator);
				attr.$observe('required', function () {
					requiredValidator(ngModelCtrl.$viewValue);
				});
			}
			if (optionsExp) setupAsOptions(scope, element, ngModelCtrl);
			else if (multiple) setupAsMultiple(scope, element, ngModelCtrl);
			else setupAsSingle(scope, element, ngModelCtrl, selectCtrl);
			////////////////////////////
			function setupAsSingle(scope, selectElement, ngModelCtrl, selectCtrl) {
				ngModelCtrl.$render = function () {
					var viewValue = ngModelCtrl.$viewValue;
					if (selectCtrl.hasOption(viewValue)) {
						if (unknownOption.parent()) unknownOption.remove();
						selectElement.val(viewValue);
						if (viewValue === '') emptyOption.prop('selected', true); // to make IE9 happy
					} else {
						if (isUndefined(viewValue) && emptyOption) {
							selectElement.val('');
						} else {
							selectCtrl.renderUnknownOption(viewValue);
						}
					}
				};
				selectElement.on('change', function () {
					scope.$apply(function () {
						if (unknownOption.parent()) unknownOption.remove();
						ngModelCtrl.$setViewValue(selectElement.val());
					});
				});
			}
			function setupAsMultiple(scope, selectElement, ctrl) {
				var lastView;
				ctrl.$render = function () {
					var items = new HashMap(ctrl.$viewValue);
					forEach(selectElement.find('option'), function (option) {
						option.selected = isDefined(items.get(option.value));
					});
				};
				// we have to do it on each watch since ngModel watches reference, but
				// we need to work of an array, so we need to see if anything was inserted/removed
				scope.$watch(function selectMultipleWatch() {
					if (!equals(lastView, ctrl.$viewValue)) {
						lastView = copy(ctrl.$viewValue);
						ctrl.$render();
					}
				});
				selectElement.on('change', function () {
					scope.$apply(function () {
						var array = [];
						forEach(selectElement.find('option'), function (option) {
							if (option.selected) {
								array.push(option.value);
							}
						});
						ctrl.$setViewValue(array);
					});
				});
			}
			function setupAsOptions(scope, selectElement, ctrl) {
				var match;
				if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) {
					throw ngOptionsMinErr('iexp',
						"Expected expression in form of " +
						"'_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
						" but got '{0}'. Element: {1}",
						optionsExp, startingTag(selectElement));
				}
				var displayFn = $parse(match[2] || match[1]),
					valueName = match[4] || match[6],
					keyName = match[5],
					groupByFn = $parse(match[3] || ''),
					valueFn = $parse(match[2] ? match[1] : valueName),
					valuesFn = $parse(match[7]),
					track = match[8],
					trackFn = track ? $parse(match[8]) : null,
				// This is an array of array of existing option groups in DOM.
				// We try to reuse these if possible
				// - optionGroupsCache[0] is the options with no option group
				// - optionGroupsCache[?][0] is the parent: either the SELECT or OPTGROUP element
					optionGroupsCache = [[{element: selectElement, label: ''}]];
				if (nullOption) {
					// compile the element since there might be bindings in it
					$compile(nullOption)(scope);
					// remove the class, which is added automatically because we recompile the element and it
					// becomes the compilation root
					nullOption.removeClass('ng-scope');
					// we need to remove it before calling selectElement.html('') because otherwise IE will
					// remove the label from the element. wtf?
					nullOption.remove();
				}
				// clear contents, we'll add what's needed based on the model
				selectElement.html('');
				selectElement.on('change', function () {
					scope.$apply(function () {
						var optionGroup,
							collection = valuesFn(scope) || [],
							locals = {},
							key, value, optionElement, index, groupIndex, length, groupLength, trackIndex;
						if (multiple) {
							value = [];
							for (groupIndex = 0, groupLength = optionGroupsCache.length;
							     groupIndex < groupLength;
							     groupIndex++) {
								// list of options for that group. (first item has the parent)
								optionGroup = optionGroupsCache[groupIndex];
								for (index = 1, length = optionGroup.length; index < length; index++) {
									if ((optionElement = optionGroup[index].element)[0].selected) {
										key = optionElement.val();
										if (keyName) locals[keyName] = key;
										if (trackFn) {
											for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
												locals[valueName] = collection[trackIndex];
												if (trackFn(scope, locals) == key) break;
											}
										} else {
											locals[valueName] = collection[key];
										}
										value.push(valueFn(scope, locals));
									}
								}
							}
						} else {
							key = selectElement.val();
							if (key == '?') {
								value = undefined;
							} else if (key === '') {
								value = null;
							} else {
								if (trackFn) {
									for (trackIndex = 0; trackIndex < collection.length; trackIndex++) {
										locals[valueName] = collection[trackIndex];
										if (trackFn(scope, locals) == key) {
											value = valueFn(scope, locals);
											break;
										}
									}
								} else {
									locals[valueName] = collection[key];
									if (keyName) locals[keyName] = key;
									value = valueFn(scope, locals);
								}
							}
						}
						ctrl.$setViewValue(value);
					});
				});
				ctrl.$render = render;
				// TODO(vojta): can't we optimize this ?
				scope.$watch(render);
				function render() {
					// Temporary location for the option groups before we render them
					var optionGroups = {'': []},
						optionGroupNames = [''],
						optionGroupName,
						optionGroup,
						option,
						existingParent, existingOptions, existingOption,
						modelValue = ctrl.$modelValue,
						values = valuesFn(scope) || [],
						keys = keyName ? sortedKeys(values) : values,
						key,
						groupLength, length,
						groupIndex, index,
						locals = {},
						selected,
						selectedSet = false, // nothing is selected yet
						lastElement,
						element,
						label;
					if (multiple) {
						if (trackFn && isArray(modelValue)) {
							selectedSet = new HashMap([]);
							for (var trackIndex = 0; trackIndex < modelValue.length; trackIndex++) {
								locals[valueName] = modelValue[trackIndex];
								selectedSet.put(trackFn(scope, locals), modelValue[trackIndex]);
							}
						} else {
							selectedSet = new HashMap(modelValue);
						}
					}
					// We now build up the list of options we need (we merge later)
					for (index = 0; length = keys.length, index < length; index++) {
						key = index;
						if (keyName) {
							key = keys[index];
							if (key.charAt(0) === '$') continue;
							locals[keyName] = key;
						}
						locals[valueName] = values[key];
						optionGroupName = groupByFn(scope, locals) || '';
						if (!(optionGroup = optionGroups[optionGroupName])) {
							optionGroup = optionGroups[optionGroupName] = [];
							optionGroupNames.push(optionGroupName);
						}
						if (multiple) {
							selected = isDefined(
								selectedSet.remove(trackFn ? trackFn(scope, locals) : valueFn(scope, locals))
							);
						} else {
							if (trackFn) {
								var modelCast = {};
								modelCast[valueName] = modelValue;
								selected = trackFn(scope, modelCast) === trackFn(scope, locals);
							} else {
								selected = modelValue === valueFn(scope, locals);
							}
							selectedSet = selectedSet || selected; // see if at least one item is selected
						}
						label = displayFn(scope, locals); // what will be seen by the user
						// doing displayFn(scope, locals) || '' overwrites zero values
						label = isDefined(label) ? label : '';
						optionGroup.push({
							// either the index into array or key from object
							id: trackFn ? trackFn(scope, locals) : (keyName ? keys[index] : index),
							label: label,
							selected: selected                   // determine if we should be selected
						});
					}
					if (!multiple) {
						if (nullOption || modelValue === null) {
							// insert null option if we have a placeholder, or the model is null
							optionGroups[''].unshift({id: '', label: '', selected: !selectedSet});
						} else if (!selectedSet) {
							// option could not be found, we have to insert the undefined item
							optionGroups[''].unshift({id: '?', label: '', selected: true});
						}
					}
					// Now we need to update the list of DOM nodes to match the optionGroups we computed above
					for (groupIndex = 0, groupLength = optionGroupNames.length;
					     groupIndex < groupLength;
					     groupIndex++) {
						// current option group name or '' if no group
						optionGroupName = optionGroupNames[groupIndex];
						// list of options for that group. (first item has the parent)
						optionGroup = optionGroups[optionGroupName];
						if (optionGroupsCache.length <= groupIndex) {
							// we need to grow the optionGroups
							existingParent = {
								element: optGroupTemplate.clone().attr('label', optionGroupName),
								label: optionGroup.label
							};
							existingOptions = [existingParent];
							optionGroupsCache.push(existingOptions);
							selectElement.append(existingParent.element);
						} else {
							existingOptions = optionGroupsCache[groupIndex];
							existingParent = existingOptions[0];  // either SELECT (no group) or OPTGROUP element
							// update the OPTGROUP label if not the same.
							if (existingParent.label != optionGroupName) {
								existingParent.element.attr('label', existingParent.label = optionGroupName);
							}
						}
						lastElement = null;  // start at the beginning
						for (index = 0, length = optionGroup.length; index < length; index++) {
							option = optionGroup[index];
							if ((existingOption = existingOptions[index + 1])) {
								// reuse elements
								lastElement = existingOption.element;
								if (existingOption.label !== option.label) {
									lastElement.text(existingOption.label = option.label);
								}
								if (existingOption.id !== option.id) {
									lastElement.val(existingOption.id = option.id);
								}
								// lastElement.prop('selected') provided by jQuery has side-effects
								if (lastElement[0].selected !== option.selected) {
									lastElement.prop('selected', (existingOption.selected = option.selected));
								}
							} else {
								// grow elements
								// if it's a null option
								if (option.id === '' && nullOption) {
									// put back the pre-compiled element
									element = nullOption;
								} else {
									// jQuery(v1.4.2) Bug: We should be able to chain the method calls, but
									// in this version of jQuery on some browser the .text() returns a string
									// rather then the element.
									(element = optionTemplate.clone())
										.val(option.id)
										.attr('selected', option.selected)
										.text(option.label);
								}
								existingOptions.push(existingOption = {
									element: element,
									label: option.label,
									id: option.id,
									selected: option.selected
								});
								if (lastElement) {
									lastElement.after(element);
								} else {
									existingParent.element.append(element);
								}
								lastElement = element;
							}
						}
						// remove any excessive OPTIONs in a group
						index++; // increment since the existingOptions[0] is parent element not OPTION
						while (existingOptions.length > index) {
							existingOptions.pop().element.remove();
						}
					}
					// remove any excessive OPTGROUPs from select
					while (optionGroupsCache.length > groupIndex) {
						optionGroupsCache.pop()[0].element.remove();
					}
				}
			}
		}
	};
}];
var optionDirective = ['$interpolate', function ($interpolate) {
	var nullSelectCtrl = {
		addOption: noop,
		removeOption: noop
	};
	return {
		restrict: 'E',
		priority: 100,
		compile: function (element, attr) {
			if (isUndefined(attr.value)) {
				var interpolateFn = $interpolate(element.text(), true);
				if (!interpolateFn) {
					attr.$set('value', element.text());
				}
			}
			return function (scope, element, attr) {
				var selectCtrlName = '$selectController',
					parent = element.parent(),
					selectCtrl = parent.data(selectCtrlName) ||
						parent.parent().data(selectCtrlName); // in case we are in optgroup
				if (selectCtrl && selectCtrl.databound) {
					// For some reason Opera defaults to true and if not overridden this messes up the repeater.
					// We don't want the view to drive the initialization of the model anyway.
					element.prop('selected', false);
				} else {
					selectCtrl = nullSelectCtrl;
				}
				if (interpolateFn) {
					scope.$watch(interpolateFn, function interpolateWatchAction(newVal, oldVal) {
						attr.$set('value', newVal);
						if (newVal !== oldVal) selectCtrl.removeOption(oldVal);
						selectCtrl.addOption(newVal);
					});
				} else {
					selectCtrl.addOption(attr.value);
				}
				element.on('$destroy', function () {
					selectCtrl.removeOption(attr.value);
				});
			};
		}
	};
}];
