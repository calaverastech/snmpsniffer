// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'src/views/OptionListView',
  'src/backbone-help/help'
], function($, _, Backbone, OptionListView, help) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      // Default
      "": 'defaultAction'
    }
  });
  
  var initialize = function(){

    var app_router = new AppRouter;
    
    app_router.on('route:defaultAction', function (actions) {
        var optView = new OptionListView();
        
		help.show_hide_options(optView.opts.length === 0);
        $("#add_dialog").dialog({ autoOpen: false, modal: true, width: 500, buttons: [{text: "Submit", click: function(e) {
					e = e || window.event;
					if (typeof e.stopPropagation != "undefined") {
						e.stopPropagation();
					} else {
						e.cancelBubble = true;
					}
					e.preventDefault();
					var model;
					var fields = _.clone(help.defaults());
					help.get_form_data($("#dialog_form"), fields);
					var id = fields.id;
					if(!id || id == '0') {
						model = optView.addModel(_.omit(fields, "id"));
					} else {
						model = optView.setModel(id, fields);
					} 
					if(!!model && !model.validationError) {
						$(this).dialog("close");
					} 
				}
		    }, {text: "Cancel", click: function() {
					$(this).dialog("close");
				}
		    }],
		    create: function() {
		    	$("#add_dialog").keypress(function(e) {
		    		if ($(this).dialog("isOpen") && e.keyCode == $.ui.keyCode.ENTER) {
		    			$(this).parent().find("button:eq(1)").trigger("click");
		    			return false;
		    		}
		    	});
		    },
		    close: function() {
		    	$('#add_option').blur();
		    }
	    });
        
        optView.render();
    });
    

    Backbone.history.start();
  };
  return { 
    initialize: initialize
  };
});