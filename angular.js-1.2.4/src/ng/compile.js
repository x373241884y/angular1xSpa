'use strict';
var $compileMinErr = minErr('$compile');
$CompileProvider.$inject = ['$provide', '$$sanitizeUriProvider'];
function $CompileProvider($provide, $$sanitizeUriProvider) {
	var hasDirectives = {}, //存在的指令
		Suffix = 'Directive', //后缀
		COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\d\w\-_]+)\s+(.*)$/, //匹配注释指令写法
		CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/; //class指令写法

	var EVENT_HANDLER_ATTR_REGEXP = /^(on[a-z]+|formaction)$/;
	this.directive = function registerDirective(name, directiveFactory) { //注册指令
		assertNotHasOwnProperty(name, 'directive');
		if (isString(name)) { //是字符串
			assertArg(directiveFactory, 'directiveFactory'); //是函数吗?
			if (!hasDirectives.hasOwnProperty(name)) { // 如果该指令还没有任何一个指令工厂//hasDirectives这里面没有name属性时处理
				hasDirectives[name] = []; //相同名字的指令存储在一个数组里面,这里说明了一个名字可以对应多个指令
				// 将该指令注册为服务，也就是说当我们通过$injector服务来获取该服务返回的指令对象集合（注意：是有缓存的单例哦
				$provide.factory(name + Suffix, ['$injector', '$exceptionHandler', //加上后缀"Directive",注册指令服务
					function ($injector, $exceptionHandler) {
						// 指令对象集合
						var directives = [];
						// 循环遍历指令工厂集合，并收集每个工厂函数返回的指令对象
						forEach(hasDirectives[name], function (directiveFactory, index) {
							try {
								// 调用工厂函数，注意这里用的是$injector，所以工厂函数也可以是一个拥有依赖注入的函数或数组
								var directive = $injector.invoke(directiveFactory); //这里指令invoke的第二个参数self都是没有的
								if (isFunction(directive)) {
									directive = {compile: valueFn(directive)}; //执行valueFn该函数封装 了一个返回匿名函数,该函数返回传进去的参数
								} else if (!directive.compile && directive.link) {
									directive.compile = valueFn(directive.link);
								}
								directive.priority = directive.priority || 0; //默认级别
								directive.index = index;
								directive.name = directive.name || name;
								directive.require = directive.require || (directive.controller && directive.name);
								directive.restrict = directive.restrict || 'A';  //默认为A类指令
								directives.push(directive);
							} catch (e) {
								$exceptionHandler(e);
							}
						});
						return directives;
					}]);
			}
			hasDirectives[name].push(directiveFactory); // 存储当前指令工厂
		} else {//不是字符串(是对象),循环对象所有属性,执行registerDirective,这里用来注册多个指令挂在一个对象上的情况
			forEach(name, reverseParams(registerDirective));
		}
		// 提供链式调用
		return this;
	};
	this.aHrefSanitizationWhitelist = function (regexp) {
		if (isDefined(regexp)) {
			$$sanitizeUriProvider.aHrefSanitizationWhitelist(regexp);
			return this;
		} else {
			return $$sanitizeUriProvider.aHrefSanitizationWhitelist();
		}
	};
	this.imgSrcSanitizationWhitelist = function (regexp) {
		if (isDefined(regexp)) {
			$$sanitizeUriProvider.imgSrcSanitizationWhitelist(regexp);
			return this;
		} else {
			return $$sanitizeUriProvider.imgSrcSanitizationWhitelist();
		}
	};
	this.$get = [
		'$injector', '$interpolate', '$exceptionHandler', '$http', '$templateCache', '$parse',
		'$controller', '$rootScope', '$document', '$sce', '$animate', '$$sanitizeUri',
		function ($injector, $interpolate, $exceptionHandler, $http, $templateCache, $parse,
		          $controller, $rootScope, $document, $sce, $animate, $$sanitizeUri) {
			var Attributes = function (element, attr) {
				this.$$element = element;
				this.$attr = attr || {};
			};
			Attributes.prototype = {
				$normalize: directiveNormalize,
				$addClass: function (classVal) {
					if (classVal && classVal.length > 0) {
						$animate.addClass(this.$$element, classVal);
					}
				},
				$removeClass: function (classVal) {
					if (classVal && classVal.length > 0) {
						$animate.removeClass(this.$$element, classVal);
					}
				},
				$updateClass: function (newClasses, oldClasses) {
					this.$removeClass(tokenDifference(oldClasses, newClasses));
					this.$addClass(tokenDifference(newClasses, oldClasses));
				},
				$set: function (key, value, writeAttr, attrName) {
					// TODO: decide whether or not to throw an error if "class"
					//is set through this function since it may cause $updateClass to
					//become unstable.
					var booleanKey = getBooleanAttrName(this.$$element[0], key),
						normalizedVal,
						nodeName;
					if (booleanKey) {
						this.$$element.prop(key, value);
						attrName = booleanKey;
					}
					this[key] = value;
					// translate normalized key to actual key
					if (attrName) {
						this.$attr[key] = attrName;
					} else {
						attrName = this.$attr[key];
						if (!attrName) {
							this.$attr[key] = attrName = snake_case(key, '-');
						}
					}
					nodeName = nodeName_(this.$$element);
					// sanitize a[href] and img[src] values
					if ((nodeName === 'A' && key === 'href') ||
						(nodeName === 'IMG' && key === 'src')) {
						this[key] = value = $$sanitizeUri(value, key === 'src');
					}
					if (writeAttr !== false) {
						if (value === null || value === undefined) {
							this.$$element.removeAttr(attrName);
						} else {
							this.$$element.attr(attrName, value);
						}
					}
					// fire observers
					var $$observers = this.$$observers;
					$$observers && forEach($$observers[key], function (fn) {
						try {
							fn(value);
						} catch (e) {
							$exceptionHandler(e);
						}
					});
				},
				$observe: function (key, fn) {
					var attrs = this,
						$$observers = (attrs.$$observers || (attrs.$$observers = {})),
						listeners = ($$observers[key] || ($$observers[key] = []));
					listeners.push(fn);
					$rootScope.$evalAsync(function () {
						if (!listeners.$$inter) {
							// no one registered attribute interpolation function, so lets call it manually
							fn(attrs[key]);
						}
					});
					return fn;
				}
			};
			var startSymbol = $interpolate.startSymbol(),
				endSymbol = $interpolate.endSymbol(),
				denormalizeTemplate = (startSymbol == '{{' || endSymbol == '}}')
					? identity
					: function denormalizeTemplate(template) {
					return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);
				},
				NG_ATTR_BINDING = /^ngAttr[A-Z]/;
			return compile;
			//================================
			//$compile 用法：
			//$compile(element.content(),transcludeFn,maxPriority,ignoreDirective,previousCompileContext)($scope);
			//$compile就是下面的函数
			function compile($compileNodes, transcludeFn, maxPriority, ignoreDirective,
			                 previousCompileContext) {
				if (!($compileNodes instanceof jqLite)) {
					// jquery always rewraps, whereas we need to preserve the original selector so that we can
					// modify it.
					$compileNodes = jqLite($compileNodes);
				}
				// We can not compile top level text elements since text nodes can be merged and we will
				// not be able to attach scope data to them, so we will wrap them in <span>
				forEach($compileNodes, function (node, index) {
					if (node.nodeType == 3 && node.nodeValue.match(/\S+/)) {
						$compileNodes[index] = node = jqLite(node).wrap('<span></span>').parent()[0];
					}
				});
				var compositeLinkFn =
					compileNodes($compileNodes, transcludeFn, $compileNodes,
						maxPriority, ignoreDirective, previousCompileContext);
				return function publicLinkFn(scope, cloneConnectFn, transcludeControllers) {
					assertArg(scope, 'scope');
					// important!!: we must call our jqLite.clone() since the jQuery one is trying to be smart
					// and sometimes changes the structure of the DOM.
					var $linkNode = cloneConnectFn
						? JQLitePrototype.clone.call($compileNodes) // IMPORTANT!!!
						: $compileNodes;
					forEach(transcludeControllers, function (instance, name) {
						$linkNode.data('$' + name + 'Controller', instance);
					});
					// Attach scope only to non-text nodes.
					for (var i = 0, ii = $linkNode.length; i < ii; i++) {
						var node = $linkNode[i];
						if (node.nodeType == 1 || node.nodeType == 9) {
							$linkNode.eq(i).data('$scope', scope);
						}
					}
					safeAddClass($linkNode, 'ng-scope');
					if (cloneConnectFn) cloneConnectFn($linkNode, scope);
					if (compositeLinkFn) compositeLinkFn(scope, $linkNode, $linkNode);
					return $linkNode;
				};
			}

			function safeAddClass($element, className) {
				try {
					$element.addClass(className);
				} catch (e) {
					// ignore, since it means that we are trying to set class on
					// SVG element, where class name is read-only.
				}
			}

			function compileNodes(nodeList, transcludeFn, $rootElement, maxPriority, ignoreDirective,
			                      previousCompileContext) {
				var linkFns = [],
					nodeLinkFn, childLinkFn, directives, attrs, linkFnFound;
				for (var i = 0; i < nodeList.length; i++) {
					attrs = new Attributes();
					// we must always refer to nodeList[i] since the nodes can be replaced underneath us.
					directives = collectDirectives(nodeList[i], [], attrs, i === 0 ? maxPriority : undefined,
						ignoreDirective);
					nodeLinkFn = (directives.length)
						? applyDirectivesToNode(directives, nodeList[i], attrs, transcludeFn, $rootElement,
						null, [], [], previousCompileContext)
						: null;
					childLinkFn = (nodeLinkFn && nodeLinkFn.terminal || !nodeList[i].childNodes || !nodeList[i].childNodes.length)
						? null
						: compileNodes(nodeList[i].childNodes,
						nodeLinkFn ? nodeLinkFn.transclude : transcludeFn);
					linkFns.push(nodeLinkFn);
					linkFns.push(childLinkFn);
					linkFnFound = (linkFnFound || nodeLinkFn || childLinkFn);
					//use the previous context only for the first element in the virtual group
					previousCompileContext = null;
				}
				// return a linking function if we have found anything, null otherwise
				return linkFnFound ? compositeLinkFn : null;
				function compositeLinkFn(scope, nodeList, $rootElement, boundTranscludeFn) {
					var nodeLinkFn, childLinkFn, node, $node, childScope, childTranscludeFn, i, ii, n;
					// copy nodeList so that linking doesn't break due to live list updates.
					var stableNodeList = [];
					for (i = 0, ii = nodeList.length; i < ii; i++) {
						stableNodeList.push(nodeList[i]);
					}
					for (i = 0, n = 0, ii = linkFns.length; i < ii; n++) {
						node = stableNodeList[n];
						nodeLinkFn = linkFns[i++];
						childLinkFn = linkFns[i++];
						$node = jqLite(node);
						if (nodeLinkFn) {
							if (nodeLinkFn.scope) {
								childScope = scope.$new();
								$node.data('$scope', childScope);
								safeAddClass($node, 'ng-scope');
							} else {
								childScope = scope;
							}
							childTranscludeFn = nodeLinkFn.transclude;
							if (childTranscludeFn || (!boundTranscludeFn && transcludeFn)) {
								nodeLinkFn(childLinkFn, childScope, node, $rootElement,
									createBoundTranscludeFn(scope, childTranscludeFn || transcludeFn)
								);
							} else {
								nodeLinkFn(childLinkFn, childScope, node, $rootElement, boundTranscludeFn);
							}
						} else if (childLinkFn) {
							childLinkFn(scope, node.childNodes, undefined, boundTranscludeFn);
						}
					}
				}
			}

			function createBoundTranscludeFn(scope, transcludeFn) {
				return function boundTranscludeFn(transcludedScope, cloneFn, controllers) {
					var scopeCreated = false;
					if (!transcludedScope) {
						transcludedScope = scope.$new();
						transcludedScope.$$transcluded = true;
						scopeCreated = true;
					}
					var clone = transcludeFn(transcludedScope, cloneFn, controllers);
					if (scopeCreated) {
						clone.on('$destroy', bind(transcludedScope, transcludedScope.$destroy));
					}
					return clone;
				};
			}

			function collectDirectives(node, directives, attrs, maxPriority, ignoreDirective) {
				var nodeType = node.nodeType,
					attrsMap = attrs.$attr,
					match,
					className;
				switch (nodeType) {
					case 1:
						// use the node name: <directive>
						addDirective(directives,
							directiveNormalize(nodeName_(node).toLowerCase()), 'E', maxPriority, ignoreDirective);
						// iterate over the attributes
						for (var attr, name, nName, ngAttrName, value, nAttrs = node.attributes,
							     j = 0, jj = nAttrs && nAttrs.length; j < jj; j++) {
							var attrStartName = false;
							var attrEndName = false;
							attr = nAttrs[j];
							if (!msie || msie >= 8 || attr.specified) {
								name = attr.name;
								// support ngAttr attribute binding
								ngAttrName = directiveNormalize(name);
								if (NG_ATTR_BINDING.test(ngAttrName)) {
									name = snake_case(ngAttrName.substr(6), '-');
								}
								var directiveNName = ngAttrName.replace(/(Start|End)$/, '');
								if (ngAttrName === directiveNName + 'Start') {
									attrStartName = name;
									attrEndName = name.substr(0, name.length - 5) + 'end';
									name = name.substr(0, name.length - 6);
								}
								nName = directiveNormalize(name.toLowerCase());
								attrsMap[nName] = name;
								attrs[nName] = value = trim((msie && name == 'href')
									? decodeURIComponent(node.getAttribute(name, 2))
									: attr.value);
								if (getBooleanAttrName(node, nName)) {
									attrs[nName] = true; // presence means true
								}
								addAttrInterpolateDirective(node, directives, value, nName);
								addDirective(directives, nName, 'A', maxPriority, ignoreDirective, attrStartName,
									attrEndName);
							}
						}
						// use class as directive
						className = node.className;
						if (isString(className) && className !== '') {
							while (match = CLASS_DIRECTIVE_REGEXP.exec(className)) {
								nName = directiveNormalize(match[2]);
								if (addDirective(directives, nName, 'C', maxPriority, ignoreDirective)) {
									attrs[nName] = trim(match[3]);
								}
								className = className.substr(match.index + match[0].length);
							}
						}
						break;
					case 3:
						addTextInterpolateDirective(directives, node.nodeValue);
						break;
					case 8:
						try {
							match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue);
							if (match) {
								nName = directiveNormalize(match[1]);
								if (addDirective(directives, nName, 'M', maxPriority, ignoreDirective)) {
									attrs[nName] = trim(match[2]);
								}
							}
						} catch (e) {
							// turns out that under some circumstances IE9 throws errors when one attempts to read
							// comment's node value.
							// Just ignore it and continue. (Can't seem to reproduce in test case.)
						}
						break;
				}
				directives.sort(byPriority);
				return directives;
			}

			function groupScan(node, attrStart, attrEnd) {
				var nodes = [];
				var depth = 0;
				if (attrStart && node.hasAttribute && node.hasAttribute(attrStart)) {
					var startNode = node;
					do {
						if (!node) {
							throw $compileMinErr('uterdir',
								"Unterminated attribute, found '{0}' but no matching '{1}' found.",
								attrStart, attrEnd);
						}
						if (node.nodeType == 1) {
							if (node.hasAttribute(attrStart)) depth++;
							if (node.hasAttribute(attrEnd)) depth--;
						}
						nodes.push(node);
						node = node.nextSibling;
					} while (depth > 0);
				} else {
					nodes.push(node);
				}
				return jqLite(nodes);
			}

			function groupElementsLinkFnWrapper(linkFn, attrStart, attrEnd) {
				return function (scope, element, attrs, controllers, transcludeFn) {
					element = groupScan(element[0], attrStart, attrEnd);
					return linkFn(scope, element, attrs, controllers, transcludeFn);
				};
			}

			function applyDirectivesToNode(directives, compileNode, templateAttrs, transcludeFn,
			                               jqCollection, originalReplaceDirective, preLinkFns, postLinkFns,
			                               previousCompileContext) {
				previousCompileContext = previousCompileContext || {};
				var terminalPriority = -Number.MAX_VALUE,
					newScopeDirective,
					controllerDirectives = previousCompileContext.controllerDirectives,
					newIsolateScopeDirective = previousCompileContext.newIsolateScopeDirective,
					templateDirective = previousCompileContext.templateDirective,
					nonTlbTranscludeDirective = previousCompileContext.nonTlbTranscludeDirective,
					hasTranscludeDirective = false,
					hasElementTranscludeDirective = false,
					$compileNode = templateAttrs.$$element = jqLite(compileNode),
					directive,
					directiveName,
					$template,
					replaceDirective = originalReplaceDirective,
					childTranscludeFn = transcludeFn,
					linkFn,
					directiveValue;
				// executes all directives on the current element
				for (var i = 0, ii = directives.length; i < ii; i++) {
					directive = directives[i];
					var attrStart = directive.$$start;
					var attrEnd = directive.$$end;
					// collect multiblock sections
					if (attrStart) {
						$compileNode = groupScan(compileNode, attrStart, attrEnd);
					}
					$template = undefined;
					if (terminalPriority > directive.priority) {
						break; // prevent further processing of directives
					}
					if (directiveValue = directive.scope) {
						newScopeDirective = newScopeDirective || directive;
						// skip the check for directives with async templates, we'll check the derived sync
						// directive when the template arrives
						if (!directive.templateUrl) {
							assertNoDuplicate('new/isolated scope', newIsolateScopeDirective, directive,
								$compileNode);
							if (isObject(directiveValue)) {
								newIsolateScopeDirective = directive;
							}
						}
					}
					directiveName = directive.name;
					if (!directive.templateUrl && directive.controller) {
						directiveValue = directive.controller;
						controllerDirectives = controllerDirectives || {};
						assertNoDuplicate("'" + directiveName + "' controller",
							controllerDirectives[directiveName], directive, $compileNode);
						controllerDirectives[directiveName] = directive;
					}
					if (directiveValue = directive.transclude) {
						hasTranscludeDirective = true;
						// Special case ngIf and ngRepeat so that we don't complain about duplicate transclusion.
						// This option should only be used by directives that know how to how to safely handle element transclusion,
						// where the transcluded nodes are added or replaced after linking.
						if (!directive.$$tlb) {
							assertNoDuplicate('transclusion', nonTlbTranscludeDirective, directive, $compileNode);
							nonTlbTranscludeDirective = directive;
						}
						if (directiveValue == 'element') {
							hasElementTranscludeDirective = true;
							terminalPriority = directive.priority;
							$template = groupScan(compileNode, attrStart, attrEnd);
							$compileNode = templateAttrs.$$element =
								jqLite(document.createComment(' ' + directiveName + ': ' +
									templateAttrs[directiveName] + ' '));
							compileNode = $compileNode[0];
							replaceWith(jqCollection, jqLite(sliceArgs($template)), compileNode);
							childTranscludeFn = compile($template, transcludeFn, terminalPriority,
								replaceDirective && replaceDirective.name, {
									// Don't pass in:
									// - controllerDirectives - otherwise we'll create duplicates controllers
									// - newIsolateScopeDirective or templateDirective - combining templates with
									//   element transclusion doesn't make sense.
									//
									// We need only nonTlbTranscludeDirective so that we prevent putting transclusion
									// on the same element more than once.
									nonTlbTranscludeDirective: nonTlbTranscludeDirective
								});
						} else {
							$template = jqLite(jqLiteClone(compileNode)).contents();
							$compileNode.html(''); // clear contents
							childTranscludeFn = compile($template, transcludeFn);
						}
					}
					if (directive.template) {
						assertNoDuplicate('template', templateDirective, directive, $compileNode);
						templateDirective = directive;
						directiveValue = (isFunction(directive.template))
							? directive.template($compileNode, templateAttrs)
							: directive.template;
						directiveValue = denormalizeTemplate(directiveValue);
						if (directive.replace) {
							replaceDirective = directive;
							$template = jqLite('<div>' +
								trim(directiveValue) +
								'</div>').contents();
							compileNode = $template[0];
							if ($template.length != 1 || compileNode.nodeType !== 1) {
								throw $compileMinErr('tplrt',
									"Template for directive '{0}' must have exactly one root element. {1}",
									directiveName, '');
							}
							replaceWith(jqCollection, $compileNode, compileNode);
							var newTemplateAttrs = {$attr: {}};
							// combine directives from the original node and from the template:
							// - take the array of directives for this element
							// - split it into two parts, those that already applied (processed) and those that weren't (unprocessed)
							// - collect directives from the template and sort them by priority
							// - combine directives as: processed + template + unprocessed
							var templateDirectives = collectDirectives(compileNode, [], newTemplateAttrs);
							var unprocessedDirectives = directives.splice(i + 1, directives.length - (i + 1));
							if (newIsolateScopeDirective) {
								markDirectivesAsIsolate(templateDirectives);
							}
							directives = directives.concat(templateDirectives).concat(unprocessedDirectives);
							mergeTemplateAttributes(templateAttrs, newTemplateAttrs);
							ii = directives.length;
						} else {
							$compileNode.html(directiveValue);
						}
					}
					if (directive.templateUrl) {
						assertNoDuplicate('template', templateDirective, directive, $compileNode);
						templateDirective = directive;
						if (directive.replace) {
							replaceDirective = directive;
						}
						nodeLinkFn = compileTemplateUrl(directives.splice(i, directives.length - i), $compileNode,
							templateAttrs, jqCollection, childTranscludeFn, preLinkFns, postLinkFns, {
								controllerDirectives: controllerDirectives,
								newIsolateScopeDirective: newIsolateScopeDirective,
								templateDirective: templateDirective,
								nonTlbTranscludeDirective: nonTlbTranscludeDirective
							});
						ii = directives.length;
					} else if (directive.compile) {
						try {
							linkFn = directive.compile($compileNode, templateAttrs, childTranscludeFn);
							if (isFunction(linkFn)) {
								addLinkFns(null, linkFn, attrStart, attrEnd);
							} else if (linkFn) {
								addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd);
							}
						} catch (e) {
							$exceptionHandler(e, startingTag($compileNode));
						}
					}
					if (directive.terminal) {
						nodeLinkFn.terminal = true;
						terminalPriority = Math.max(terminalPriority, directive.priority);
					}
				}
				nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope === true;
				nodeLinkFn.transclude = hasTranscludeDirective && childTranscludeFn;
				// might be normal or delayed nodeLinkFn depending on if templateUrl is present
				return nodeLinkFn;
				////////////////////
				function addLinkFns(pre, post, attrStart, attrEnd) {
					if (pre) {
						if (attrStart) pre = groupElementsLinkFnWrapper(pre, attrStart, attrEnd);
						pre.require = directive.require;
						if (newIsolateScopeDirective === directive || directive.$$isolateScope) {
							pre = cloneAndAnnotateFn(pre, {isolateScope: true});
						}
						preLinkFns.push(pre);
					}
					if (post) {
						if (attrStart) post = groupElementsLinkFnWrapper(post, attrStart, attrEnd);
						post.require = directive.require;
						if (newIsolateScopeDirective === directive || directive.$$isolateScope) {
							post = cloneAndAnnotateFn(post, {isolateScope: true});
						}
						postLinkFns.push(post);
					}
				}

				function getControllers(require, $element, elementControllers) {
					var value, retrievalMethod = 'data', optional = false;
					if (isString(require)) {
						while ((value = require.charAt(0)) == '^' || value == '?') {
							require = require.substr(1);
							if (value == '^') {
								retrievalMethod = 'inheritedData';
							}
							optional = optional || value == '?';
						}
						value = null;
						if (elementControllers && retrievalMethod === 'data') {
							value = elementControllers[require];
						}
						value = value || $element[retrievalMethod]('$' + require + 'Controller');
						if (!value && !optional) {
							throw $compileMinErr('ctreq',
								"Controller '{0}', required by directive '{1}', can't be found!",
								require, directiveName);
						}
						return value;
					} else if (isArray(require)) {
						value = [];
						forEach(require, function (require) {
							value.push(getControllers(require, $element, elementControllers));
						});
					}
					return value;
				}

				function nodeLinkFn(childLinkFn, scope, linkNode, $rootElement, boundTranscludeFn) {
					var attrs, $element, i, ii, linkFn, controller, isolateScope, elementControllers = {}, transcludeFn;
					if (compileNode === linkNode) {
						attrs = templateAttrs;
					} else {
						attrs = shallowCopy(templateAttrs, new Attributes(jqLite(linkNode), templateAttrs.$attr));
					}
					$element = attrs.$$element;
					if (newIsolateScopeDirective) {
						var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/;
						var $linkNode = jqLite(linkNode);
						isolateScope = scope.$new(true);
						if (templateDirective && (templateDirective === newIsolateScopeDirective.$$originalDirective)) {
							$linkNode.data('$isolateScope', isolateScope);
						} else {
							$linkNode.data('$isolateScopeNoTemplate', isolateScope);
						}
						safeAddClass($linkNode, 'ng-isolate-scope');
						forEach(newIsolateScopeDirective.scope, function (definition, scopeName) {
							var match = definition.match(LOCAL_REGEXP) || [],
								attrName = match[3] || scopeName,
								optional = (match[2] == '?'),
								mode = match[1], // @, =, or &
								lastValue,
								parentGet, parentSet;
							isolateScope.$$isolateBindings[scopeName] = mode + attrName;
							switch (mode) {
								case '@':
									attrs.$observe(attrName, function (value) {
										isolateScope[scopeName] = value;
									});
									attrs.$$observers[attrName].$$scope = scope;
									if (attrs[attrName]) {
										// If the attribute has been provided then we trigger an interpolation to ensure
										// the value is there for use in the link fn
										isolateScope[scopeName] = $interpolate(attrs[attrName])(scope);
									}
									break;
								case '=':
									if (optional && !attrs[attrName]) {
										return;
									}
									parentGet = $parse(attrs[attrName]);
									parentSet = parentGet.assign || function () {
											// reset the change, or we will throw this exception on every $digest
											lastValue = isolateScope[scopeName] = parentGet(scope);
											throw $compileMinErr('nonassign',
												"Expression '{0}' used with directive '{1}' is non-assignable!",
												attrs[attrName], newIsolateScopeDirective.name);
										};
									lastValue = isolateScope[scopeName] = parentGet(scope);
									isolateScope.$watch(function parentValueWatch() {
										var parentValue = parentGet(scope);
										if (parentValue !== isolateScope[scopeName]) {
											// we are out of sync and need to copy
											if (parentValue !== lastValue) {
												// parent changed and it has precedence
												isolateScope[scopeName] = parentValue;
											} else {
												// if the parent can be assigned then do so
												parentSet(scope, parentValue = isolateScope[scopeName]);
											}
										}
										return lastValue = parentValue;
									});
									break;
								case '&':
									parentGet = $parse(attrs[attrName]);
									isolateScope[scopeName] = function (locals) {
										return parentGet(scope, locals);
									};
									break;
								default:
									throw $compileMinErr('iscp',
										"Invalid isolate scope definition for directive '{0}'." +
										" Definition: {... {1}: '{2}' ...}",
										newIsolateScopeDirective.name, scopeName, definition);
							}
						});
					}
					transcludeFn = boundTranscludeFn && controllersBoundTransclude;
					if (controllerDirectives) {
						forEach(controllerDirectives, function (directive) {
							var locals = {
								$scope: directive === newIsolateScopeDirective || directive.$$isolateScope ? isolateScope : scope,
								$element: $element,
								$attrs: attrs,
								$transclude: transcludeFn
							}, controllerInstance;
							controller = directive.controller;
							if (controller == '@') {
								controller = attrs[directive.name];
							}
							controllerInstance = $controller(controller, locals);
							// For directives with element transclusion the element is a comment,
							// but jQuery .data doesn't support attaching data to comment nodes as it's hard to
							// clean up (http://bugs.jquery.com/ticket/8335).
							// Instead, we save the controllers for the element in a local hash and attach to .data
							// later, once we have the actual element.
							elementControllers[directive.name] = controllerInstance;
							if (!hasElementTranscludeDirective) {
								$element.data('$' + directive.name + 'Controller', controllerInstance);
							}
							if (directive.controllerAs) {
								locals.$scope[directive.controllerAs] = controllerInstance;
							}
						});
					}
					// PRELINKING
					for (i = 0, ii = preLinkFns.length; i < ii; i++) {
						try {
							linkFn = preLinkFns[i];
							linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs,
								linkFn.require && getControllers(linkFn.require, $element, elementControllers), transcludeFn);
						} catch (e) {
							$exceptionHandler(e, startingTag($element));
						}
					}
					// RECURSION
					// We only pass the isolate scope, if the isolate directive has a template,
					// otherwise the child elements do not belong to the isolate directive.
					var scopeToChild = scope;
					if (newIsolateScopeDirective && (newIsolateScopeDirective.template || newIsolateScopeDirective.templateUrl === null)) {
						scopeToChild = isolateScope;
					}
					childLinkFn && childLinkFn(scopeToChild, linkNode.childNodes, undefined, boundTranscludeFn);
					// POSTLINKING
					for (i = postLinkFns.length - 1; i >= 0; i--) {
						try {
							linkFn = postLinkFns[i];
							linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs,
								linkFn.require && getControllers(linkFn.require, $element, elementControllers), transcludeFn);
						} catch (e) {
							$exceptionHandler(e, startingTag($element));
						}
					}
					// This is the function that is injected as `$transclude`.
					function controllersBoundTransclude(scope, cloneAttachFn) {
						var transcludeControllers;
						// no scope passed
						if (arguments.length < 2) {
							cloneAttachFn = scope;
							scope = undefined;
						}
						if (hasElementTranscludeDirective) {
							transcludeControllers = elementControllers;
						}
						return boundTranscludeFn(scope, cloneAttachFn, transcludeControllers);
					}
				}
			}

			function markDirectivesAsIsolate(directives) {
				// mark all directives as needing isolate scope.
				for (var j = 0, jj = directives.length; j < jj; j++) {
					directives[j] = inherit(directives[j], {$$isolateScope: true});
				}
			}

			function addDirective(tDirectives, name, location, maxPriority, ignoreDirective, startAttrName,
			                      endAttrName) {
				if (name === ignoreDirective) return null;
				var match = null;
				if (hasDirectives.hasOwnProperty(name)) {
					for (var directive, directives = $injector.get(name + Suffix),
						     i = 0, ii = directives.length; i < ii; i++) {
						try {
							directive = directives[i];
							if ((maxPriority === undefined || maxPriority > directive.priority) &&
								directive.restrict.indexOf(location) != -1) {
								if (startAttrName) {
									directive = inherit(directive, {$$start: startAttrName, $$end: endAttrName});
								}
								tDirectives.push(directive);
								match = directive;
							}
						} catch (e) {
							$exceptionHandler(e);
						}
					}
				}
				return match;
			}

			function mergeTemplateAttributes(dst, src) {
				var srcAttr = src.$attr,
					dstAttr = dst.$attr,
					$element = dst.$$element;
				// reapply the old attributes to the new element
				forEach(dst, function (value, key) {
					if (key.charAt(0) != '$') {
						if (src[key]) {
							value += (key === 'style' ? ';' : ' ') + src[key];
						}
						dst.$set(key, value, true, srcAttr[key]);
					}
				});
				// copy the new attributes on the old attrs object
				forEach(src, function (value, key) {
					if (key == 'class') {
						safeAddClass($element, value);
						dst['class'] = (dst['class'] ? dst['class'] + ' ' : '') + value;
					} else if (key == 'style') {
						$element.attr('style', $element.attr('style') + ';' + value);
						dst['style'] = (dst['style'] ? dst['style'] + ';' : '') + value;
						// `dst` will never contain hasOwnProperty as DOM parser won't let it.
						// You will get an "InvalidCharacterError: DOM Exception 5" error if you
						// have an attribute like "has-own-property" or "data-has-own-property", etc.
					} else if (key.charAt(0) != '$' && !dst.hasOwnProperty(key)) {
						dst[key] = value;
						dstAttr[key] = srcAttr[key];
					}
				});
			}

			function compileTemplateUrl(directives, $compileNode, tAttrs,
			                            $rootElement, childTranscludeFn, preLinkFns, postLinkFns, previousCompileContext) {
				var linkQueue = [],
					afterTemplateNodeLinkFn,
					afterTemplateChildLinkFn,
					beforeTemplateCompileNode = $compileNode[0],
					origAsyncDirective = directives.shift(),
				// The fact that we have to copy and patch the directive seems wrong!
					derivedSyncDirective = extend({}, origAsyncDirective, {
						templateUrl: null, transclude: null, replace: null, $$originalDirective: origAsyncDirective
					}),
					templateUrl = (isFunction(origAsyncDirective.templateUrl))
						? origAsyncDirective.templateUrl($compileNode, tAttrs)
						: origAsyncDirective.templateUrl;
				$compileNode.html('');
				$http.get($sce.getTrustedResourceUrl(templateUrl), {cache: $templateCache}).
				success(function (content) {
					var compileNode, tempTemplateAttrs, $template, childBoundTranscludeFn;
					content = denormalizeTemplate(content);
					if (origAsyncDirective.replace) {
						$template = jqLite('<div>' + trim(content) + '</div>').contents();
						compileNode = $template[0];
						if ($template.length != 1 || compileNode.nodeType !== 1) {
							throw $compileMinErr('tplrt',
								"Template for directive '{0}' must have exactly one root element. {1}",
								origAsyncDirective.name, templateUrl);
						}
						tempTemplateAttrs = {$attr: {}};
						replaceWith($rootElement, $compileNode, compileNode);
						var templateDirectives = collectDirectives(compileNode, [], tempTemplateAttrs);
						if (isObject(origAsyncDirective.scope)) {
							markDirectivesAsIsolate(templateDirectives);
						}
						directives = templateDirectives.concat(directives);
						mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
					} else {
						compileNode = beforeTemplateCompileNode;
						$compileNode.html(content);
					}
					directives.unshift(derivedSyncDirective);
					afterTemplateNodeLinkFn = applyDirectivesToNode(directives, compileNode, tAttrs,
						childTranscludeFn, $compileNode, origAsyncDirective, preLinkFns, postLinkFns,
						previousCompileContext);
					forEach($rootElement, function (node, i) {
						if (node == compileNode) {
							$rootElement[i] = $compileNode[0];
						}
					});
					afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes, childTranscludeFn);
					while (linkQueue.length) {
						var scope = linkQueue.shift(),
							beforeTemplateLinkNode = linkQueue.shift(),
							linkRootElement = linkQueue.shift(),
							boundTranscludeFn = linkQueue.shift(),
							linkNode = $compileNode[0];
						if (beforeTemplateLinkNode !== beforeTemplateCompileNode) {
							// it was cloned therefore we have to clone as well.
							linkNode = jqLiteClone(compileNode);
							replaceWith(linkRootElement, jqLite(beforeTemplateLinkNode), linkNode);
						}
						if (afterTemplateNodeLinkFn.transclude) {
							childBoundTranscludeFn = createBoundTranscludeFn(scope, afterTemplateNodeLinkFn.transclude);
						} else {
							childBoundTranscludeFn = boundTranscludeFn;
						}
						afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode, $rootElement,
							childBoundTranscludeFn);
					}
					linkQueue = null;
				}).
				error(function (response, code, headers, config) {
					throw $compileMinErr('tpload', 'Failed to load template: {0}', config.url);
				});
				return function delayedNodeLinkFn(ignoreChildLinkFn, scope, node, rootElement, boundTranscludeFn) {
					if (linkQueue) {
						linkQueue.push(scope);
						linkQueue.push(node);
						linkQueue.push(rootElement);
						linkQueue.push(boundTranscludeFn);
					} else {
						afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, node, rootElement, boundTranscludeFn);
					}
				};
			}

			function byPriority(a, b) {
				var diff = b.priority - a.priority;
				if (diff !== 0) return diff;
				if (a.name !== b.name) return (a.name < b.name) ? -1 : 1;
				return a.index - b.index;
			}

			function assertNoDuplicate(what, previousDirective, directive, element) {
				if (previousDirective) {
					throw $compileMinErr('multidir', 'Multiple directives [{0}, {1}] asking for {2} on: {3}',
						previousDirective.name, directive.name, what, startingTag(element));
				}
			}

			function addTextInterpolateDirective(directives, text) {
				var interpolateFn = $interpolate(text, true);
				if (interpolateFn) {
					directives.push({
						priority: 0,
						compile: valueFn(function textInterpolateLinkFn(scope, node) {
							var parent = node.parent(),
								bindings = parent.data('$binding') || [];
							bindings.push(interpolateFn);
							safeAddClass(parent.data('$binding', bindings), 'ng-binding');
							scope.$watch(interpolateFn, function interpolateFnWatchAction(value) {
								node[0].nodeValue = value;
							});
						})
					});
				}
			}

			function getTrustedContext(node, attrNormalizedName) {
				if (attrNormalizedName == "srcdoc") {
					return $sce.HTML;
				}
				var tag = nodeName_(node);
				// maction[xlink:href] can source SVG.  It's not limited to <maction>.
				if (attrNormalizedName == "xlinkHref" ||
					(tag == "FORM" && attrNormalizedName == "action") ||
					(tag != "IMG" && (attrNormalizedName == "src" ||
					attrNormalizedName == "ngSrc"))) {
					return $sce.RESOURCE_URL;
				}
			}

			function addAttrInterpolateDirective(node, directives, value, name) {
				var interpolateFn = $interpolate(value, true);
				// no interpolation found -> ignore
				if (!interpolateFn) return;
				if (name === "multiple" && nodeName_(node) === "SELECT") {
					throw $compileMinErr("selmulti",
						"Binding to the 'multiple' attribute is not supported. Element: {0}",
						startingTag(node));
				}
				directives.push({
					priority: 100,
					compile: function () {
						return {
							pre: function attrInterpolatePreLinkFn(scope, element, attr) {
								var $$observers = (attr.$$observers || (attr.$$observers = {}));
								if (EVENT_HANDLER_ATTR_REGEXP.test(name)) {
									throw $compileMinErr('nodomevents',
										"Interpolations for HTML DOM event attributes are disallowed.  Please use the " +
										"ng- versions (such as ng-click instead of onclick) instead.");
								}
								// we need to interpolate again, in case the attribute value has been updated
								// (e.g. by another directive's compile function)
								interpolateFn = $interpolate(attr[name], true, getTrustedContext(node, name));
								// if attribute was updated so that there is no interpolation going on we don't want to
								// register any observers
								if (!interpolateFn) return;
								// TODO(i): this should likely be attr.$set(name, iterpolateFn(scope) so that we reset the
								// actual attr value
								attr[name] = interpolateFn(scope);
								($$observers[name] || ($$observers[name] = [])).$$inter = true;
								(attr.$$observers && attr.$$observers[name].$$scope || scope).
								$watch(interpolateFn, function interpolateFnWatchAction(newValue, oldValue) {
									//special case for class attribute addition + removal
									//so that class changes can tap into the animation
									//hooks provided by the $animate service. Be sure to
									//skip animations when the first digest occurs (when
									//both the new and the old values are the same) since
									//the CSS classes are the non-interpolated values
									if (name === 'class' && newValue != oldValue) {
										attr.$updateClass(newValue, oldValue);
									} else {
										attr.$set(name, newValue);
									}
								});
							}
						};
					}
				});
			}

			function replaceWith($rootElement, elementsToRemove, newNode) {
				var firstElementToRemove = elementsToRemove[0],
					removeCount = elementsToRemove.length,
					parent = firstElementToRemove.parentNode,
					i, ii;
				if ($rootElement) {
					for (i = 0, ii = $rootElement.length; i < ii; i++) {
						if ($rootElement[i] == firstElementToRemove) {
							$rootElement[i++] = newNode;
							for (var j = i, j2 = j + removeCount - 1,
								     jj = $rootElement.length;
							     j < jj; j++, j2++) {
								if (j2 < jj) {
									$rootElement[j] = $rootElement[j2];
								} else {
									delete $rootElement[j];
								}
							}
							$rootElement.length -= removeCount - 1;
							break;
						}
					}
				}
				if (parent) {
					parent.replaceChild(newNode, firstElementToRemove);
				}
				var fragment = document.createDocumentFragment();
				fragment.appendChild(firstElementToRemove);
				newNode[jqLite.expando] = firstElementToRemove[jqLite.expando];
				for (var k = 1, kk = elementsToRemove.length; k < kk; k++) {
					var element = elementsToRemove[k];
					jqLite(element).remove(); // must do this way to clean up expando
					fragment.appendChild(element);
					delete elementsToRemove[k];
				}
				elementsToRemove[0] = newNode;
				elementsToRemove.length = 1;
			}

			function cloneAndAnnotateFn(fn, annotation) {
				return extend(function () {
					return fn.apply(null, arguments);
				}, fn, annotation);
			}
		}];
}
var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i;
function directiveNormalize(name) {
	return camelCase(name.replace(PREFIX_REGEXP, ''));
}
function nodesetLinkingFn(scope,
                          nodeList,
                          rootElement,
                          boundTranscludeFn) {
}
function directiveLinkingFn(nodesetLinkingFn,
                            scope,
                            node,
                            rootElement,
                            boundTranscludeFn) {
}
function tokenDifference(str1, str2) {
	var values = '',
		tokens1 = str1.split(/\s+/),
		tokens2 = str2.split(/\s+/);
	outer:
		for (var i = 0; i < tokens1.length; i++) {
			var token = tokens1[i];
			for (var j = 0; j < tokens2.length; j++) {
				if (token == tokens2[j]) continue outer;
			}
			values += (values.length > 0 ? ' ' : '') + token;
		}
	return values;
}
