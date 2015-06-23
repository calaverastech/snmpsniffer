define([
  'jquery',
  'underscore',
  'backbone',
  // Pull in the Collection module from above,
  'src/models/OptionModel',
  'src/collections/OptionCollection',
  'src/views/OptionView',
  'src/backbone-help/help',
  'jqueryui'

], function($, _, Backbone, OptionModel, OptionCollection, OptionView, help){
  var OptionListView = Backbone.View.extend({
	el: $("#option_field"),
	initialize: function () {
		this.opts = new OptionCollection( null, { view: this });
		this.opts.on('invalid', function(data, err) {
			alert(err);
		});
		this.listenTo(this.opts, "add", this.addLi);
	    this.opts.fetch();
	    this.render();
	},
	events: {
		"click #add_option":  "showDialog",
	    "click #remove_all": function() {
			if(this.opts.length > 0 && confirm("Are you sure, you want to remove all items?")) {
				$("#remove_all").blur();
				this.removeAll();
			}
		}
	},
	showDialog: function () {
		help.fill_dialog();
		$("#add_dialog").dialog("open");
	},
	removeAll: function() {
		_.invoke(this.opts.toArray(), 'destroy');
		this.opts.reset();
	},
	addModel: function(attr) {
		return this.opts.create(attr, {validate: true});
	},
	addLi: function (model) {
		var optionView = new OptionView({model: model});
		this.$el.find("#option_list").append(optionView.render().el);
	},
	setModel: function(id, data) {
		return this.opts.get(id).save(data, {validate: true});
	}
  });
  
  return OptionListView;
});