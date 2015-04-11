var socket;

$(document).ready(function () {
	
	socket = io.connect('/', {'reconnection delay':900000});
	if(!window.chrome) {
		$("#exit").hide();
	}
	
    //Backbone
    window.App = {
	  Models: {},
	  Collections: {},
	  Views: {}
	};
    
    var defaults = {ip: null, src: false, dst: false, port: null, ports: []};
    var snmp_count = 0;
    
	App.Models.Opt = Backbone.Model.extend({
		defaults: defaults,
	    //initialize: function(attributes){
		//	console.log('initializing...');
		//	attributes.ports = _(attributes.port.split(",")).map(function(p) {
		//		return p.trim();
		//	});
	    //    Backbone.Model.prototype.initialize.apply(this, arguments);
	    //},
		set: function(attributes, options) {
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
				if((!attributes.ip || attributes.ip.length == 0) && (!attributes.port || attributes.port.length == 0)) {
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
	
	
	App.Collections.Opts = Backbone.Collection.extend({
		model: App.Models.Opt,
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
	
	function fill_dialog(attributes) {
		if(!attributes) {
			$("#dialog_form > #id").val("0");
			$("#dialog_form > input[type='checkbox']").prop("checked", true);
		} else {
			$.each(attributes, function(key, value){
				$('[name='+key+']', "#dialog_form").val(value);
			});
			$("#dialog_form > input[type='checkbox']").prop("checked", function() {
				return attributes[$(this).attr("name")];
			});
		}
    };
	
	App.Views.OptionView = Backbone.View.extend({
		  tagName: 'li',
		  template: _.template($("#option_template").html()),
		  initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
	   	  },
	   	  events: {
			"click .remove-option": "removeOpt",
			"click .edit-option": "showDialog",
			"click .src,.dst": "toggleCheckbox"
	   	  },
		  showDialog: function () {
		   	  fill_dialog(this.model.attributes);
			  $("#add_dialog").dialog("open");
		  },
	   	  removeOpt: function() {
			 if(confirm("Are you sure, you want to remove this option?")) {
				 this.model.destroy();
			 }
	   	  },
	   	  toggleCheckbox: function(ev) {
	   		  ev.preventDefault();
	   		  var checkbox = $(ev.currentTarget);
	   		  var options = {};
	   		  options[$(checkbox).attr("name")] = $(checkbox).is(":checked");
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
	
	App.Views.AppView = Backbone.View.extend({
		el: $("#option_field"),
		initialize: function () {
			this.opts = new App.Collections.Opts( null, { view: this });
			this.opts.on('invalid', function(data, err) {
				alert(err);
			});
			this.listenTo(this.opts, "add", this.addLi);
		    this.opts.fetch();
		    this.render();
		},
		events: {
			"click #add_option":  "showDialog"
		},
		showDialog: function () {
			fill_dialog();
			$("#add_dialog").dialog("open");
		},
		addModel: function(attr) {
			return this.opts.create(attr, {validate: true});
		},
		addLi: function (model) {
			var optionView = new App.Views.OptionView({model: model});
			this.$el.find("#option_list").append(optionView.render().el);
		},
		setModel: function(id, data) {
			return this.opts.get(id).save(data, {validate: true});
		}
		
	});
	
	var appview = new App.Views.AppView;
	
	window.onbeforeunload = closeWindow;
	$("#exit").on("click", function() {
		window.open(location, '_self').close();
		//window.close();
		//socket.emit("kill_window");
	});
	
	function closeWindow(){
		socket.emit("close_window");
		return null;
	}

	$("#dialog_form > input[type='checkbox']").on("click", function() {
		$(this).val($(this).is(":checked"));
	});
	$("#option_list > li > input[type='checkbox']").on("click", function(ev) {
		ev.preventDefault();
	});
	

	$("#option_field > button").tooltip();
	var wid = $("#content").width()/2;
	//console.log(Math.max(wid, 600));
    $("#option_list").resizable({  maxWidth: Math.max($("#content").width()/5, 500) });
    $("#commands").resizable({  maxWidth: Math.max(wid, 800) });
    $("#pcap_output").resizable({ maxWidth: Math.max(wid, 600) });
    $("#snmp_output").resizable({ maxWidth: Math.max(wid, 800) });
    
    function resizeToWidth(elem, w3) {
    	if($(elem).width() > w3 || $(elem).width() < w3) {
    		$(elem).width(w3);
    	} 
    }
    
    resizeToWidth($("#commands"), Math.min(wid, 800));
    resizeToWidth($("#snmp_output"), Math.min(wid, 800));
    resizeToWidth($("#pcap_output"), Math.min(4*wid/5, 600));
    resizeToWidth($("#option_list"), Math.min($("#content").width()/5, 500));
    
    //function resizeWin(wid1, wid2) {
    //	resizeToWidth($("#commands"), wid1);
    //	resizeToWidth($("#snmp_output"), wid1);
    //	resizeToWidth($("#pcap_output"), wid1);
    //	resizeToWidth($("#option_list"), wid2);
    //}
    
    //resizeWin($("#content").width()/3, $("#content").width()/5);
    
    //$(window).resize(function() {
    //	resizeWin($("#content").width()/3, $("#content").width()/5);
    //});
    
    
    function get_form_data(form, data) {
    	var fields = (!data) ? {} : data;
   	    $(form).serialize().split("&").forEach(function(par) {
		    var item = par.split("=");
		    if(item.length >= 2) {
		    	fields[item[0]] = decodeURIComponent(item[1]).replace(/\+/g, "");
		    }
		});
   	    return fields;
    }
    
    $("#log").dialog({
	      modal: true,
	      buttons: {
	        Ok: function() {
	          $( this ).dialog( "close" );
	      	}
	      }
    });
    
    $("#log").keypress(function(e) {
    	if ($(this).dialog("isOpen") && e.keyCode == $.ui.keyCode.ENTER) {
		  $(this).parent().find("button:eq(1)").trigger("click");
		  return false;
		}
	});
    
    $("#show_log").on("click", function() {
    	$("#log").dialog("open");
    });
    
	$("#add_dialog").dialog({ autoOpen: false, modal: true, width: 460, buttons: [{text: "Submit", click: function(e) {
		        var e = e || window.event;
		 		if (typeof e.stopPropagation != "undefined") {
		 			e.stopPropagation();
		 		} else {
		 			e.cancelBubble = true;
		 		}
		        e.preventDefault();
		        var model;
		    	var fields = _.clone(defaults);
		    	get_form_data($("#dialog_form"), fields);
				var id = fields['id'];
				if(id == '0') {
					model = appview.addModel(_.omit(fields, "id"));
				} else {
					model = appview.setModel(id, fields);
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
	$("#remove_all").on("click", function() {
		$("#remove_all").blur();
		if(appview.opts.length > 0) {
			if(confirm("Are you sure, you want to remove all items?")) {
				appview.opts.each(function(opt) {
					if(!!opt)
						opt.destroy();
				});
				appview.opts.reset();
			}
		}	
	});
	
	function show_hide_options(hide) {
		if(hide) {
			$('#show_options').text("Show Options");
			$("#pcap_options").hide();
		} else {
			$('#show_options').text("Hide Options");
			$("#pcap_options").show();
		}
	}
	
	show_hide_options(appview.opts.length == 0);
	
	$('#show_options').on("click", function() {
		show_hide_options($("#pcap_options").is(":visible"));
	});
	
	function clearList(l) {
		$(l).find("li").remove();
	};
	

	$("#pcap_clear").on("click", function() {
		if($("#pcap_output").html().length > 0 && confirm("Are you sure?"))
			clearList($("#pcap_output"));
	});
	$("#snmp_clear").on("click", function() {
		if($("#snmp_output").html().length > 0 && confirm("Are you sure?"))
			clearList($("#snmp_output"));
	});
	
	$("#start_pcap").on("click", function() {
		  if($(this).val() == "Stop") {
			  socket.emit("pcap_stop");
		  } else {
			  clearList($("#pcap_output"));
			  var options = appview.opts.toJSON();
			  socket.emit("pcap_start", {inter:$("#interface").val(), filename:$("#filename").val(), bufferMult:$("#buffer").val(), options:options, responses_only:$("#responses_only").is(":checked")});
		  }
	});
	$("#responses_only").on("change", function() {
		if($(this).is(":checked")) {
			$("#pcap_output > li.req").hide();
		} else {
			$("#pcap_output > li.req").show();
		}
	});
	
	function add_output(output, str, cl, hide) {
		function add_line(line) {
			if(!!str && str.length > 0) {
				var elem = $("<li></li>").text(line);
				if(!!cl)
					$(elem).addClass(cl);
				$(output).append(elem);
				if(!!hide)
					$(elem).hide();
			}
		}
		if(!!str) {
			if(_(str).isArray()) {
				_(str).each(function(s) {
					add_line(s.toString());
				});
			} else {
				add_line(str.toString());
			}
		}
	}
	
	
	function add_pcap_entry(data) {
		var packet = data.packet;
		if(!!packet) {
			var str = packet['timestamp'] + " " + packet['version'] + " " + packet['ip'] + " " + packet['command'] + " id=" + packet['reqid'];
			var oid_str = _(packet.oids).map(function(oid) {
				return oid.oid + ((!!oid.type) ? (" " + oid.type + "=" + oid.data) : "");
			}).join(", ");
			if(_(packet.oids).size() > 1)
				oid_str = " [ " + oid_str + " ] ";
			str += oid_str;
			if(packet["status"] !== "0")
				str += "error: " + packet["status"];
			var cl = (packet.command === "Response") ? "res":"req";
			add_output($("#pcap_output"), str, cl, (data.responses_only && packet.command !== "Response"));
		}
	}
	
	function pcap_controls(started) {
		if(started)
			$("#options_message").text("Options are not editable while running the sniffer");
		else
			$("#options_message").text("");
		$("#interface, #add_option, #remove_all, .remove-option, .edit-option, .src,.dst").prop("disabled", started);
		$("#filename").prop("disabled", started);
		$("#buffer").prop("disabled", started);
		$("#pcap_clear").prop("disabled", started);
		$("#responses_only").prop("disabled", started);
	}
	
	socket.on("pcap_start", function() {
		$("#start_pcap").val("Stop");
		pcap_controls(true);
		$("#pcap_status > b").text("Package sniffing on");
	});
	
	socket.on("pcap_file_overwrite", function(data) {
		var data1 = data.data;
		if(confirm("The file already exists, overwrite it?")) {
			data1['newfilename'] = data.newfilename;
		} else {
			$("#filename").val("");
			data1['newfilename'] = null;
		} 
		data1["checked"] = true;
		socket.emit("pcap_start", data1);
	});

	socket.on("pcap_track", function(data) {
		add_pcap_entry(data);
	});
	
	socket.on("pcap_stop", function() {
		$("#start_pcap").val("Start");
		pcap_controls(false);
		$("#pcap_status > b").text("Package sniffing off");
		//alert("The process stopped");
	});
	
	$("#run_snmp").on("click", function() {
		if($(this).val() == "Cancel") {
			socket.emit("snmp_stop");
		} else {
			var commands = _($("#snmp_commands").val().split(";")).compact();
			if(!commands || _(commands).isEmpty()) {
				alert("No commands provided");
			} else {
				$(this).val("Cancel");
				$("#snmp_loading").show();
				clearList($("#snmp_output"));
				snmp_count = 0;
				socket.emit("snmp_start", {data: commands, bufferMult: $("#buffer").val()});
			}
		}
	});
	
	function add_snmp_entry(data) {
		 add_output($("#snmp_output"), data.input);
		 add_output($("#snmp_output"), (!!data.output ? data.output.split("\n") : ""));
		 add_output($("#snmp_output"), data.error);
		 snmp_count++;
		 if(snmp_count >= data.count) {
			 socket.emit("snmp_stop");
		 }
	}
	
	socket.on("snmp_track", function(data) {
		add_snmp_entry(data);
	});
	
	socket.on("snmp_stop", function() {
		$("#snmp_loading").hide();
		$("#run_snmp").val("Run SNMP");
	});
	
	socket.on("app_error", function(msg) {
		console.log("app error");
		alert(msg);
	});
	
	socket.on("error", function(err) {
		alert(err.toString()); 
	});
	
});
