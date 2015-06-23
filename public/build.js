({
  paths: {
    jquery: 'lib/jquery/jquery-1.11.1.min',
    jqueryui: 'lib/jquery/jquery-ui.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
   'backbone.localStorage': 'lib/backbone.localStorage-min',
    socketio: '../../node_modules/socket.io/node_modules/socket.io-client/socket.io',
    templates: 'src/templates',
    infrastructure: "infrastructure"
  },
  fileExclusionRegExp: /^(.+\/)*(test.*|coverage)$/,
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
  },
  shim: {
	    'socketio': {
	      exports: 'io'
		}
  },
  baseUrl : "js",
  removeCombined: true,
  findNestedDependencies: true,
  dir: "dist",
  optimizeAllPluginResources: true,
  noBuildTxt: true,
  optimizeCss: "standard",
  modules: [
		{
		    name: "app",
		    exclude: [
		       "infrastructure"
		    ]
		},
        {
            name: "infrastructure"
        }
	]
})