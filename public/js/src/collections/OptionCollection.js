define([
  'jquery',
  'underscore',
  'backbone',
  'src/models/OptionModel',
  'backbone.localStorage'
], function($, _, Backbone, OptionModel){
  var OptionCollection = Backbone.Collection.extend({
	  model: OptionModel,
	  localStorage: new Backbone.LocalStorage("options-backbone"),
	  contains: function(attr) {
			return this.some(function(opt) {
				var ports = opt.get('ports');
				return (opt.get('ip') === attr.ip) && (_(ports).isEmpty() || ports.some(function(p) {
						var re = new RegExp("(\,\s*)?"+p+"(\s*\,)?");
						return attr.port.match(re);
				}));
			});
	  }

  });
 
  return OptionCollection;
});


