/**
 *@author yoyo.liu
 * @param {Object} window
 * @param {Object} vx
 * 提交指令
 */
(function (window, vx, undefined) {
	'use strict';
	var app = vx.module("app"),noop=vx.noop;
	app.provider('$submitConfig', {
		submitErrProcess: noop,
		setSubmitErrProcess: function (fn) {
			this.submitErrProcess = fn;
		},
		submitCompileProcess: noop,
		setSubmitCompileProcess: function (fn) {
			this.submitCompileProcess = fn;
		},
		submitBeforeProcess: noop,
		setSubmitBeforeProcess: function (fn) {
			this.submitBeforeProcess = fn;
		},
		$get: ['$log',
			function ($log) {
				var self = this;
				return {
					doSubmitErrProcess: function (ctrlComment, errMessage, scope) {
						self.submitErrProcess(ctrlComment, errMessage, scope);
					},
					doSubmitCompileProcess: function (scope) {
						self.submitCompileProcess(scope);
					},
					doSubmitBeforeProcess: function (scope) {
						self.submitBeforeProcess(scope);
					}
				}
			}]

	});
	app.directive("uiSubmit", ['$parse', '$rootScope', "$submitConfig", "$log",
		function ($parse, $rootScope, $submitConfig, $log) {
			return {
				restrict: 'A',
				compile: function (element, attrs) {
					var fn = $parse(attrs["uiSubmit"], /* interceptorFn */null, /* expensiveChecks */true);
					return function ngEventHandler(scope, element) {

						$submitConfig.doSubmitCompileProcess(scope);

						element.on("submit", function (event) {
							$submitConfig.doSubmitBeforeProcess(scope);
							var form = scope[attrs.name], lang = attrs.language || scope["language"] || "zh_CN";
							var inputCtrls = attrs.$$element[0];
							for (var i = 0; i < inputCtrls.length; i++) {
								var ctrl = inputCtrls[i];
								//['input', 'select'].indexOf低版本的IE不支持数组的indexOf方法
								if ('inputselect'.indexOf(ctrl.tagName.toLowerCase()) !== -1) {
									ctrl.blur();
								}
								var validateAttr = ctrl.getAttribute("validate") || true;
								//默认原输入域的验证属性
								if ((ctrl.nodeName === "BUTTON") || (validateAttr === 'false')) {
									continue;
								}
								var message = {};
								message["zh_CN"] = {
									required: ctrl.getAttribute("required-message") || "不能为空",
									min: ctrl.getAttribute("min-message") || "最小值:" + ctrl.getAttribute("v-min"),
									max: ctrl.getAttribute("max-message") || "最大值:" + ctrl.getAttribute("v-max"),
									minlength: ctrl.getAttribute("minlength-message") || "最小长度:" + ctrl.getAttribute("v-minlength"),
									maxlength: ctrl.getAttribute("maxlength-message") || "最大长度:" + ctrl.getAttribute("v-maxlength"),
									pattern: ctrl.getAttribute("pattern-message") || "格式不正确",
									"default": "格式不正确"
								};
								message["en"] = {
									required: ctrl.getAttribute("required-message_en") || "required invalid",
									min: ctrl.getAttribute("min-message_en") || "min value:" + ctrl.getAttribute("v-min"),
									max: ctrl.getAttribute("max-message_en") || "max value:" + ctrl.getAttribute("v-max"),
									minlength: ctrl.getAttribute("minlength-message_en") || "min length:" + ctrl.getAttribute("v-minlength"),
									maxlength: ctrl.getAttribute("maxlength-message_en") || "max length:" + ctrl.getAttribute("v-maxlength"),
									pattern: ctrl.getAttribute("pattern-message_en") || "pattern invalid",
									"default": "pattern invalid"
								};
								var ctrlName = ctrl['name'] || ctrl['id'];
								//取域的title值
								var ctrlComment = lang === "en" ? "[" + (ctrl.getAttribute('title_en') || ctrlName) + "]  " : "[" + (ctrl.getAttribute('title_zh') || ctrl.title || ctrlName) + "]  ";
								for (var key in form.$error) {
									for (var j = 0; j < form.$error[key].length; j++) {
										if (ctrlName == form.$error[key][j].$name) {
											var errMessageAttrName = lang === "en" ? key + "-message_en" : key + "-message";
											var errMessage = message[lang][key] || ctrl.getAttribute(errMessageAttrName) || message[lang]['default'];
											//scope.showErrMessage(ctrlComment + errMessage);
											// scope.$apply(function() {
											// scope.$jsonError = [{
											// "_exceptionMessage" : ctrlComment + errMessage
											// }];
											// });
											//alert(ctrlComment + errMessage);
											$submitConfig.doSubmitErrProcess(ctrlComment, errMessage, scope);
											$log.error(ctrlComment + errMessage);
											return;
										}
									}
								}
							}
							var callback = function () {
								fn(scope, {
									$event: event
								});
							};
							scope.$apply(callback);
						});
					};
				}
			};
		}]);

})(window, window.vx);