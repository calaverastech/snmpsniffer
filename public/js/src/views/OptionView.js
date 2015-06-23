define([
  'jquery',
  'underscore',
  'backbone',
  'src/models/OptionModel',
  'src/backbone-help/help',
  'text!templates/optionTemplate.html'
], function($, _, Backbone, OptionModel, help, optionTemplate){

var OptionView = Backbone.View.extend({
	  tagName: 'li',
	  //template: _.template($("#option_template").html()),
	  template: _.template(optionTemplate),
	  initialize: function() {
		   this.listenTo(this.model, 'change', this.render);
		   this.listenTo(this.model, 'remove', this.remove);
	  },
	  events: {
		  //"click .remove-option": "removeOpt",
		  "click .remove-option": function() {
				if(confirm("Are you sure, you want to remove this option?")) {
					this.removeOpt();
				}
		  },
		  "click .edit-option": "showDialog",
		  "click .src,.dst": "toggleCheckbox"
		  
	  },
	  showDialog: function () {
		   help.fill_dialog(this.model.attributes);
		   $("#add_dialog").dialog("open");
	  },
	  removeOpt: function() {
		   this.model.destroy();
	  },
	  toggleCheckbox: function(ev) {
		  ev.preventDefault();
		  var checkbox = $(ev.currentTarget);
		  var options = {};
		  options[$(checkbox).attr("name")] = $(checkbox).is(":checked");
		  this.setModel(options);
	  },
	  setModel: function(options) {
		  this.model.save(options, {validate:true});
	  },
	  render: function(attr, options) {
		if(!options || !!options.validate) {
			this.$el.html( this.template(this.model.toJSON()));
			this.$el.find("span.ui-icon").tooltip();
			return this;
		}
	  },
	  remove: function(){
	      this.$el.remove(); 
	  }
  });

  return OptionView;
});