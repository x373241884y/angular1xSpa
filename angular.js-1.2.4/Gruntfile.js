var files = require('./angularFiles').files;
var util = require('./lib/grunt/utils.js');
var path = require('path');

module.exports = function (grunt) {
	//grunt plugins
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-jasmine-node');
	grunt.loadNpmTasks('grunt-ddescribe-iit');
	grunt.loadNpmTasks('grunt-merge-conflict');
	grunt.loadNpmTasks('grunt-parallel');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadTasks('lib/grunt');

	var NG_VERSION = util.getVersion();
	var dist = 'angular-' + NG_VERSION.full;


	//global beforeEach
	util.init();


	//config
	grunt.initConfig({
		NG_VERSION: NG_VERSION,

		clean: {
			build: ['build'],
			tmp: ['tmp']
		},

		jshint: {
			options: {
				jshintrc: true,
			},
			ng: {
				files: {src: files['angularSrc']},
			},
			ngAnimate: {
				files: {src: 'src/ngAnimate/**/*.js'},
			},
			ngCookies: {
				files: {src: 'src/ngCookies/**/*.js'},
			},
			ngLocale: {
				files: {src: 'src/ngLocale/**/*.js'},
			},
			ngMock: {
				files: {src: 'src/ngMock/**/*.js'},
			},
			ngResource: {
				files: {src: 'src/ngResource/**/*.js'},
			},
			ngRoute: {
				files: {src: 'src/ngRoute/**/*.js'},
			},
			ngSanitize: {
				files: {src: 'src/ngSanitize/**/*.js'},
			},
			ngScenario: {
				files: {src: 'src/ngScenario/**/*.js'},
			},
			ngTouch: {
				files: {src: 'src/ngTouch/**/*.js'},
			}
		},

		build: {
			scenario: {
				dest: 'build/angular-scenario.js',
				src: [
					'bower_components/jquery/jquery.js',
					util.wrap([files['angularSrc'], files['angularScenario']], 'ngScenario/angular')
				],
				styles: {
					css: ['css/angular.css', 'css/angular-scenario.css']
				}
			},
			angular: {
				dest: 'build/angular.js',
				src: util.wrap([files['angularSrc']], 'angular'),
				styles: {
					css: ['css/angular.css'],
					generateCspCssFile: true,
					minify: true
				}
			},
			loader: {
				dest: 'build/angular-loader.js',
				src: util.wrap(files['angularLoader'], 'loader')
			},
			touch: {
				dest: 'build/angular-touch.js',
				src: util.wrap(files['angularModules']['ngTouch'], 'module')
			},
			mocks: {
				dest: 'build/angular-mocks.js',
				src: util.wrap(files['angularModules']['ngMock'], 'module'),
				strict: false
			},
			sanitize: {
				dest: 'build/angular-sanitize.js',
				src: util.wrap(files['angularModules']['ngSanitize'], 'module')
			},
			resource: {
				dest: 'build/angular-resource.js',
				src: util.wrap(files['angularModules']['ngResource'], 'module')
			},
			animate: {
				dest: 'build/angular-animate.js',
				src: util.wrap(files['angularModules']['ngAnimate'], 'module')
			},
			route: {
				dest: 'build/angular-route.js',
				src: util.wrap(files['angularModules']['ngRoute'], 'module')
			},
			cookies: {
				dest: 'build/angular-cookies.js',
				src: util.wrap(files['angularModules']['ngCookies'], 'module')
			},
			"promises-aplus-adapter": {
				dest: 'tmp/promises-aplus-adapter++.js',
				src: ['src/ng/q.js', 'lib/promises-aplus/promises-aplus-test-adapter.js']
			}
		},


		min: {
			angular: 'build/angular.js',
			animate: 'build/angular-animate.js',
			cookies: 'build/angular-cookies.js',
			loader: 'build/angular-loader.js',
			touch: 'build/angular-touch.js',
			resource: 'build/angular-resource.js',
			route: 'build/angular-route.js',
			sanitize: 'build/angular-sanitize.js'
		},



		copy: {
			i18n: {
				files: [
					{src: 'src/ngLocale/**', dest: 'build/i18n/', expand: true, flatten: true}
				]
			}
		},


		compress: {
			build: {
				options: {archive: 'build/' + dist + '.zip', mode: 'zip'},
				src: ['**'], cwd: 'build', expand: true, dot: true, dest: dist + '/'
			}
		},

		write: {
			versionTXT: {file: 'build/version.txt', val: NG_VERSION.full},
			versionJSON: {file: 'build/version.json', val: JSON.stringify(NG_VERSION)}
		}
	});


	grunt.registerTask('minify', ['bower', 'clean', 'build', 'minall']);
	grunt.registerTask('package', ['bower', 'clean', 'buildall', 'minall', 'copy', 'write', 'compress']);
	grunt.registerTask('package-without-bower', ['clean', 'buildall', 'minall', 'copy', 'write', 'compress']);
	grunt.registerTask('checks', ['jshint']);
	grunt.registerTask('default', ['package']);
};
