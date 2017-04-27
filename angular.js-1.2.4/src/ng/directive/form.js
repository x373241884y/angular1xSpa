'use strict';
var nullFormCtrl = {
	$addControl: noop,
	$removeControl: noop,
	$setValidity: noop,
	$setDirty: noop,
	$setPristine: noop
};
//asks for $scope to fool the BC controller module
FormController.$inject = ['$element', '$attrs', '$scope'];
function FormController(element, attrs) {
	var form = this,
		parentForm = element.parent().controller('form') || nullFormCtrl,
		invalidCount = 0, // used to easily determine if we are valid
		errors = form.$error = {},
		controls = [];
	// init state
	form.$name = attrs.name || attrs.ngForm;
	form.$dirty = false;
	form.$pristine = true;
	form.$valid = true;
	form.$invalid = false;
	parentForm.$addControl(form);
	// Setup initial state of the control
	element.addClass(PRISTINE_CLASS);
	toggleValidCss(true);
	// convenience method for easy toggling of classes
	function toggleValidCss(isValid, validationErrorKey) {
		validationErrorKey = validationErrorKey ? '-' + snake_case(validationErrorKey, '-') : '';
		element.
		removeClass((isValid ? INVALID_CLASS : VALID_CLASS) + validationErrorKey).
		addClass((isValid ? VALID_CLASS : INVALID_CLASS) + validationErrorKey);
	}
	form.$addControl = function (control) {
		// Breaking change - before, inputs whose name was "hasOwnProperty" were quietly ignored
		// and not added to the scope.  Now we throw an error.
		assertNotHasOwnProperty(control.$name, 'input');
		controls.push(control);
		if (control.$name) {
			form[control.$name] = control;
		}
	};
	form.$removeControl = function (control) {
		if (control.$name && form[control.$name] === control) {
			delete form[control.$name];
		}
		forEach(errors, function (queue, validationToken) {
			form.$setValidity(validationToken, true, control);
		});
		arrayRemove(controls, control);
	};
	form.$setValidity = function (validationToken, isValid, control) {
		var queue = errors[validationToken];
		if (isValid) {
			if (queue) {
				arrayRemove(queue, control);
				if (!queue.length) {
					invalidCount--;
					if (!invalidCount) {
						toggleValidCss(isValid);
						form.$valid = true;
						form.$invalid = false;
					}
					errors[validationToken] = false;
					toggleValidCss(true, validationToken);
					parentForm.$setValidity(validationToken, true, form);
				}
			}
		} else {
			if (!invalidCount) {
				toggleValidCss(isValid);
			}
			if (queue) {
				if (includes(queue, control)) return;
			} else {
				errors[validationToken] = queue = [];
				invalidCount++;
				toggleValidCss(false, validationToken);
				parentForm.$setValidity(validationToken, false, form);
			}
			queue.push(control);
			form.$valid = false;
			form.$invalid = true;
		}
	};
	form.$setDirty = function () {
		element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
		form.$dirty = true;
		form.$pristine = false;
		parentForm.$setDirty();
	};
	form.$setPristine = function () {
		element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
		form.$dirty = false;
		form.$pristine = true;
		forEach(controls, function (control) {
			control.$setPristine();
		});
	};
}
var formDirectiveFactory = function (isNgForm) {
	return ['$timeout', function ($timeout) {
		var formDirective = {
			name: 'form',
			restrict: isNgForm ? 'EAC' : 'E',
			controller: FormController,
			compile: function () {
				return {
					pre: function (scope, formElement, attr, controller) {
						if (!attr.action) {
							// we can't use jq events because if a form is destroyed during submission the default
							// action is not prevented. see #1238
							//
							// IE 9 is not affected because it doesn't fire a submit event and try to do a full
							// page reload if the form was destroyed by submission of the form via a click handler
							// on a button in the form. Looks like an IE9 specific bug.
							var preventDefaultListener = function (event) {
								event.preventDefault
									? event.preventDefault()
									: event.returnValue = false; // IE
							};
							addEventListenerFn(formElement[0], 'submit', preventDefaultListener);
							// unregister the preventDefault listener so that we don't not leak memory but in a
							// way that will achieve the prevention of the default action.
							formElement.on('$destroy', function () {
								$timeout(function () {
									removeEventListenerFn(formElement[0], 'submit', preventDefaultListener);
								}, 0, false);
							});
						}
						var parentFormCtrl = formElement.parent().controller('form'),
							alias = attr.name || attr.ngForm;
						if (alias) {
							setter(scope, alias, controller, alias);
						}
						if (parentFormCtrl) {
							formElement.on('$destroy', function () {
								parentFormCtrl.$removeControl(controller);
								if (alias) {
									setter(scope, alias, undefined, alias);
								}
								extend(controller, nullFormCtrl); //stop propagating child destruction handlers upwards
							});
						}
					}
				};
			}
		};
		return formDirective;
	}];
};
var formDirective = formDirectiveFactory();
var ngFormDirective = formDirectiveFactory(true);
