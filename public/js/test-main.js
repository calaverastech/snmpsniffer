//var allTestFiles = [];
//var TEST_REGEXP = /(spec|test)\.js$/i;

//var pathToModule = function(path) {
//  return path.replace(/^\/base\//, '').replace(/\.js$/, '');
//};

//Object.keys(window.__karma__.files).forEach(function(file) {
//  if (TEST_REGEXP.test(file)) {
//    // Normalize paths to RequireJS module names.
//    allTestFiles.push(pathToModule(file));
//  }
//});

var tests = [];
for (var file in window.__karma__.files) {
    if (/spec\.js$/.test(file)) {
        tests.push(file);
    }
}

requirejs.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base',

  // dynamically load all test files
  //deps: allTestFiles,
  deps: tests,
  
  paths: {
    jquery: 'lib/jquery/jquery-1.11.1.min',
    jqueryui: 'lib/jquery/jquery-ui.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    'backbone.localStorage': 'lib/backbone.localStorage-min',
    templates: 'src/templates'
  },
  shim: {
	  underscore: {
	      exports: "_"
	  },
	  backbone: {
	      deps: ['underscore', 'jquery'],
	      exports: 'Backbone'
	  },
	  'backbone.localStorage': {
		  deps: ['backbone'],
		  exports: 'Backbone'
	//  },
	  //shim: {
	//	    'socketio': {
	//	      exports: 'io'
	//		}
	  }
  },
  

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
