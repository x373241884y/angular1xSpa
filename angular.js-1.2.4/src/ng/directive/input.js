'use strict';
var URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;
var inputType = {
	'text': textInputType,
	'number': numberInputType,
	'url': urlInputType,
	'email': emailInputType,
	'radio': radioInputType,
	'checkbox': checkboxInputType,
	'hidden': noop,
	'button': noop,
	'submit': noop,
	'reset': noop
};
function textInputType(scope, element, attr, ctrl, $sniffer, $browser) {
	// In composition mode, users are still inputing intermediate text buffer,
	// hold the listener until composition is done.
	// More about composition events: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
	var composing = false;
	element.on('compositionstart', function () {
		composing = true;
	});
	element.on('compositionend', function () {
		composing = false;
	});
	var listener = function () {
		if (composing) return;
		var value = element.val();
		// By default we will trim the value
		// If the attribute ng-trim exists we will avoid trimming
		// e.g. <input ng-model="foo" ng-trim="false">
		if (toBoolean(attr.ngTrim || 'T')) {
			value = trim(value);
		}
		if (ctrl.$viewValue !== value) {
			scope.$apply(function () {
				ctrl.$setViewValue(value);
			});
		}
	};
	// if the browser does support "input" event, we are fine - except on IE9 which doesn't fire the
	// input event on backspace, delete or cut
	if ($sniffer.hasEvent('input')) {
		element.on('input', listener);
	} else {
		var timeout;
		var deferListener = function () {
			if (!timeout) {
				timeout = $browser.defer(function () {
					listener();
					timeout = null;
				});
			}
		};
		element.on('keydown', function (event) {
			var key = event.keyCode;
			// ignore
			//    command            modifiers                   arrows
			if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return;
			deferListener();
		});
		// if user modifies input value using context menu in IE, we need "paste" and "cut" events to catch it
		if ($sniffer.hasEvent('paste')) {
			element.on('paste cut', deferListener);
		}
	}
	// if user paste into input using mouse on older browser
	// or form autocomplete on newer browser, we need "change" event to catch it
	element.on('change', listener);
	ctrl.$render = function () {
		element.val(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);
	};
	// pattern validator
	var pattern = attr.ngPattern,
		patternValidator,
		match;
	var validate = function (regexp, value) {
		if (ctrl.$isEmpty(value) || regexp.test(value)) {
			ctrl.$setValidity('pattern', true);
			return value;
		} else {
			ctrl.$setValidity('pattern', false);
			return undefined;
		}
	};
	if (pattern) {
		match = pattern.match(/^\/(.*)\/([gim]*)$/);
		if (match) {
			pattern = new RegExp(match[1], match[2]);
			patternValidator = function (value) {
				return validate(pattern, value);
			};
		} else {
			patternValidator = function (value) {
				var patternObj = scope.$eval(pattern);
				if (!patternObj || !patternObj.test) {
					throw minErr('ngPattern')('noregexp',
						'Expected {0} to be a RegExp but was {1}. Element: {2}', pattern,
						patternObj, startingTag(element));
				}
				return validate(patternObj, value);
			};
		}
		ctrl.$formatters.push(patternValidator);
		ctrl.$parsers.push(patternValidator);
	}
	// min length validator
	if (attr.ngMinlength) {
		var minlength = int(attr.ngMinlength);
		var minLengthValidator = function (value) {
			if (!ctrl.$isEmpty(value) && value.length < minlength) {
				ctrl.$setValidity('minlength', false);
				return undefined;
			} else {
				ctrl.$setValidity('minlength', true);
				return value;
			}
		};
		ctrl.$parsers.push(minLengthValidator);
		ctrl.$formatters.push(minLengthValidator);
	}
	// max length validator
	if (attr.ngMaxlength) {
		var maxlength = int(attr.ngMaxlength);
		var maxLengthValidator = function (value) {
			if (!ctrl.$isEmpty(value) && value.length > maxlength) {
				ctrl.$setValidity('maxlength', false);
				return undefined;
			} else {
				ctrl.$setValidity('maxlength', true);
				return value;
			}
		};
		ctrl.$parsers.push(maxLengthValidator);
		ctrl.$formatters.push(maxLengthValidator);
	}
}
function numberInputType(scope, element, attr, ctrl, $sniffer, $browser) {
	textInputType(scope, element, attr, ctrl, $sniffer, $browser);
	ctrl.$parsers.push(function (value) {
		var empty = ctrl.$isEmpty(value);
		if (empty || NUMBER_REGEXP.test(value)) {
			ctrl.$setValidity('number', true);
			return value === '' ? null : (empty ? value : parseFloat(value));
		} else {
			ctrl.$setValidity('number', false);
			return undefined;
		}
	});
	ctrl.$formatters.push(function (value) {
		return ctrl.$isEmpty(value) ? '' : '' + value;
	});
	if (attr.min) {
		var minValidator = function (value) {
			var min = parseFloat(attr.min);
			if (!ctrl.$isEmpty(value) && value < min) {
				ctrl.$setValidity('min', false);
				return undefined;
			} else {
				ctrl.$setValidity('min', true);
				return value;
			}
		};
		ctrl.$parsers.push(minValidator);
		ctrl.$formatters.push(minValidator);
	}
	if (attr.max) {
		var maxValidator = function (value) {
			var max = parseFloat(attr.max);
			if (!ctrl.$isEmpty(value) && value > max) {
				ctrl.$setValidity('max', false);
				return undefined;
			} else {
				ctrl.$setValidity('max', true);
				return value;
			}
		};
		ctrl.$parsers.push(maxValidator);
		ctrl.$formatters.push(maxValidator);
	}
	ctrl.$formatters.push(function (value) {
		if (ctrl.$isEmpty(value) || isNumber(value)) {
			ctrl.$setValidity('number', true);
			return value;
		} else {
			ctrl.$setValidity('number', false);
			return undefined;
		}
	});
}
function urlInputType(scope, element, attr, ctrl, $sniffer, $browser) {
	textInputType(scope, element, attr, ctrl, $sniffer, $browser);
	var urlValidator = function (value) {
		if (ctrl.$isEmpty(value) || URL_REGEXP.test(value)) {
			ctrl.$setValidity('url', true);
			return value;
		} else {
			ctrl.$setValidity('url', false);
			return undefined;
		}
	};
	ctrl.$formatters.push(urlValidator);
	ctrl.$parsers.push(urlValidator);
}
function emailInputType(scope, element, attr, ctrl, $sniffer, $browser) {
	textInputType(scope, element, attr, ctrl, $sniffer, $browser);
	var emailValidator = function (value) {
		if (ctrl.$isEmpty(value) || EMAIL_REGEXP.test(value)) {
			ctrl.$setValidity('email', true);
			return value;
		} else {
			ctrl.$setValidity('email', false);
			return undefined;
		}
	};
	ctrl.$formatters.push(emailValidator);
	ctrl.$parsers.push(emailValidator);
}
function radioInputType(scope, element, attr, ctrl) {
	// make the name unique, if not defined
	if (isUndefined(attr.name)) {
		element.attr('name', nextUid());
	}
	element.on('click', function () {
		if (element[0].checked) {
			scope.$apply(function () {
				ctrl.$setViewValue(attr.value);
			});
		}
	});
	ctrl.$render = function () {
		var value = attr.value;
		element[0].checked = (value == ctrl.$viewValue);
	};
	attr.$observe('value', ctrl.$render);
}
function checkboxInputType(scope, element, attr, ctrl) {
	var trueValue = attr.ngTrueValue,
		falseValue = attr.ngFalseValue;
	if (!isString(trueValue)) trueValue = true;
	if (!isString(falseValue)) falseValue = false;
	element.on('click', function () {
		scope.$apply(function () {
			ctrl.$setViewValue(element[0].checked);
		});
	});
	ctrl.$render = function () {
		element[0].checked = ctrl.$viewValue;
	};
	// Override the standard `$isEmpty` because a value of `false` means empty in a checkbox.
	ctrl.$isEmpty = function (value) {
		return value !== trueValue;
	};
	ctrl.$formatters.push(function (value) {
		return value === trueValue;
	});
	ctrl.$parsers.push(function (value) {
		return value ? trueValue : falseValue;
	});
}
var inputDirective = ['$browser', '$sniffer', function ($browser, $sniffer) {
	return {
		restrict: 'E',
		require: '?ngModel',
		link: function (scope, element, attr, ctrl) {
			if (ctrl) {
				(inputType[lowercase(attr.type)] || inputType.text)(scope, element, attr, ctrl, $sniffer,
					$browser);
			}
		}
	};
}];
var VALID_CLASS = 'ng-valid',
	INVALID_CLASS = 'ng-invalid',
	PRISTINE_CLASS = 'ng-pristine',
	DIRTY_CLASS = 'ng-dirty';
var NgModelController = ['$scope', '$exceptionHandler', '$attrs', '$element', '$parse',
	function ($scope, $exceptionHandler, $attr, $element, $parse) {
		this.$viewValue = Number.NaN;
		this.$modelValue = Number.NaN;
		this.$parsers = [];
		this.$formatters = [];
		this.$viewChangeListeners = [];
		this.$pristine = true;
		this.$dirty = false;
		this.$valid = true;
		this.$invalid = false;
		this.$name = $attr.name;
		var ngModelGet = $parse($attr.ngModel),
			ngModelSet = ngModelGet.assign;
		if (!ngModelSet) {
			throw minErr('ngModel')('nonassign', "Expression '{0}' is non-assignable. Element: {1}",
				$attr.ngModel, startingTag($element));
		}
		this.$render = noop;
		this.$isEmpty = function (value) {
			return isUndefined(value) || value === '' || value === null || value !== value;
		};
		var parentForm = $element.inheritedData('$formController') || nullFormCtrl,
			invalidCount = 0, // used to easily determine if we are valid
			$error = this.$error = {}; // keep invalid keys here
		// Setup initial state of the control
		$element.addClass(PRISTINE_CLASS);
		toggleValidCss(true);
		// convenience method for easy toggling of classes
		function toggleValidCss(isValid, validationErrorKey) {
			validationErrorKey = validationErrorKey ? '-' + snake_case(validationErrorKey, '-') : '';
			$element.
			removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey).
			addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
		}

		this.$setValidity = function (validationErrorKey, isValid) {
			// Purposeful use of ! here to cast isValid to boolean in case it is undefined
			// jshint -W018
			if ($error[validationErrorKey] === !isValid) return;
			// jshint +W018
			if (isValid) {
				if ($error[validationErrorKey]) invalidCount--;
				if (!invalidCount) {
					toggleValidCss(true);
					this.$valid = true;
					this.$invalid = false;
				}
			} else {
				toggleValidCss(false);
				this.$invalid = true;
				this.$valid = false;
				invalidCount++;
			}
			$error[validationErrorKey] = !isValid;
			toggleValidCss(isValid, validationErrorKey);
			parentForm.$setValidity(validationErrorKey, isValid, this);
		};
		this.$setPristine = function () {
			this.$dirty = false;
			this.$pristine = true;
			$element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
		};
		this.$setViewValue = function (value) {
			this.$viewValue = value;
			// change to dirty
			if (this.$pristine) {
				this.$dirty = true;
				this.$pristine = false;
				$element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
				parentForm.$setDirty();
			}
			forEach(this.$parsers, function (fn) {
				value = fn(value);
			});
			if (this.$modelValue !== value) {
				this.$modelValue = value;
				ngModelSet($scope, value);
				forEach(this.$viewChangeListeners, function (listener) {
					try {
						listener();
					} catch (e) {
						$exceptionHandler(e);
					}
				});
			}
		};
		// model -> value
		var ctrl = this;
		$scope.$watch(function ngModelWatch() {
			var value = ngModelGet($scope);
			// if scope model value and ngModel value are out of sync
			if (ctrl.$modelValue !== value) {
				var formatters = ctrl.$formatters,
					idx = formatters.length;
				ctrl.$modelValue = value;
				while (idx--) {
					value = formatters[idx](value);
				}
				if (ctrl.$viewValue !== value) {
					ctrl.$viewValue = value;
					ctrl.$render();
				}
			}
			return value;
		});
	}];
var ngModelDirective = function () {
	return {
		require: ['ngModel', '^?form'],
		controller: NgModelController,
		link: function (scope, element, attr, ctrls) {
			// notify others, especially parent forms
			var modelCtrl = ctrls[0],
				formCtrl = ctrls[1] || nullFormCtrl;
			formCtrl.$addControl(modelCtrl);
			scope.$on('$destroy', function () {
				formCtrl.$removeControl(modelCtrl);
			});
		}
	};
};
var ngChangeDirective = valueFn({
	require: 'ngModel',
	link: function (scope, element, attr, ctrl) {
		ctrl.$viewChangeListeners.push(function () {
			scope.$eval(attr.ngChange);
		});
	}
});
var requiredDirective = function () {
	return {
		require: '?ngModel',
		link: function (scope, elm, attr, ctrl) {
			if (!ctrl) return;
			attr.required = true; // force truthy in case we are on non input element
			var validator = function (value) {
				if (attr.required && ctrl.$isEmpty(value)) {
					ctrl.$setValidity('required', false);
					return;
				} else {
					ctrl.$setValidity('required', true);
					return value;
				}
			};
			ctrl.$formatters.push(validator);
			ctrl.$parsers.unshift(validator);
			attr.$observe('required', function () {
				validator(ctrl.$viewValue);
			});
		}
	};
};
var ngListDirective = function () {
	return {
		require: 'ngModel',
		link: function (scope, element, attr, ctrl) {
			var match = /\/(.*)\//.exec(attr.ngList),
				separator = match && new RegExp(match[1]) || attr.ngList || ',';
			var parse = function (viewValue) {
				// If the viewValue is invalid (say required but empty) it will be `undefined`
				if (isUndefined(viewValue)) return;
				var list = [];
				if (viewValue) {
					forEach(viewValue.split(separator), function (value) {
						if (value) list.push(trim(value));
					});
				}
				return list;
			};
			ctrl.$parsers.push(parse);
			ctrl.$formatters.push(function (value) {
				if (isArray(value)) {
					return value.join(', ');
				}
				return undefined;
			});
			// Override the standard $isEmpty because an empty array means the input is empty.
			ctrl.$isEmpty = function (value) {
				return !value || !value.length;
			};
		}
	};
};
var CONSTANT_VALUE_REGEXP = /^(true|false|\d+)$/;
var ngValueDirective = function () {
	return {
		priority: 100,
		compile: function (tpl, tplAttr) {
			if (CONSTANT_VALUE_REGEXP.test(tplAttr.ngValue)) {
				return function ngValueConstantLink(scope, elm, attr) {
					attr.$set('value', scope.$eval(attr.ngValue));
				};
			} else {
				return function ngValueLink(scope, elm, attr) {
					scope.$watch(attr.ngValue, function valueWatchAction(value) {
						attr.$set('value', value);
					});
				};
			}
		}
	};
};
