require.config({
  paths: {
    jquery: 'lib/jquery/jquery-1.11.1.min',
    jqueryui: 'lib/jquery/jquery-ui.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    'backbone.localStorage': 'lib/backbone.localStorage-min',
    socketio: 'socket.io',
    //infrastructure: "infrastructure"
    templates: 'src/templates'
  },
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
  }
});

require( [ "infrastructure" ], function () {

require([
  // Load our app module and pass it to our definition function
  'src/backbone-app',
  'socketio',
  'src/backbone-help/help'

], function(App, io, help){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  

	var socket;

	socket = io.connect('/', {'reconnection delay':900000});
	if(!window.chrome) {
		$("#exit").hide();
	}
	
	App.initialize(socket);
	
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
	

	$("#option_field").find("button").tooltip();
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
    

	$('#show_options').on("click", function() {
		help.show_hide_options($("#pcap_options").is(":visible"));
	});
	
	$("#pcap_clear").on("click", function() {
		if($("#pcap_output").html().length > 0 && confirm("Are you sure?"))
			help.clearList($("#pcap_output"));
	});
	$("#snmp_clear").on("click", function() {
		if($("#snmp_output").html().length > 0 && confirm("Are you sure?"))
			help.clearList($("#snmp_output"));
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
			var str = packet.timestamp + " " + packet.version + " " + packet.ip + " " + packet.command + " id=" + packet.reqid;
			var oid_str = _(packet.oids).map(function(oid) {
				return oid.oid + ((!!oid.type) ? (" " + oid.type + "=" + oid.data) : "");
			}).join(", ");
			if(_(packet.oids).size() > 1)
				oid_str = " [ " + oid_str + " ] ";
			str += oid_str;
			if(packet.status !== "0")
				str += "error: " + packet.status;
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
			data1.newfilename = data.newfilename;
		} else {
			$("#filename").val("");
			data1.newfilename = null;
		} 
		data1.checked = true;
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
				help.clearList($("#snmp_output"));
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
});

