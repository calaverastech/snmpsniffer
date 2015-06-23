define([
  'underscore',
  'backbone',
  'src/backbone-help/help'
], function(_, Backbone, help) {
  
  var OptionModel = Backbone.Model.extend({
		defaults: help.defaults,
	  //initialize: function(attributes){
		//	console.log('initializing...');
		//	attributes.ports = _(attributes.port.split(",")).map(function(p) {
		//		return p.trim();
		//	});
	  //    Backbone.Model.prototype.initialize.apply(this, arguments);
	  //},
		set: function(attributes, options) {
		  //console.log("setting...");
			if(!!attributes.port) {
				attributes.ports = _.chain(attributes.port.split(",")).map(function(p) {
					return p.trim();
				}).compact().value();
			}
			return Backbone.Model.prototype.set.apply(this, arguments);
		},
		validate: function(attributes, options) {
			//console.log("validating...", attributes, options);
			//hack to prevent second validation
			if(_.chain(options).omit("validate", "collection").isEmpty().value()){
				//console.log("really validating...");
				if((!attributes.ip || attributes.ip.length === 0) && (!attributes.port || attributes.port.length === 0)) {
					return "You have to specify either ip or port";
				}
				if(!attributes.src && !attributes.dst) {
					return "This data needs to be either source or destination";
				}
				//new record
				if(!!options.collection && this.collection.contains(attributes)) {
					return "The ip and port(s) are already on the list";
				}
			}
		},
		edit: function(attr) {
			this.save(attr);
		} 
  });

  return OptionModel;

});