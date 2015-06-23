define([
  'jquery',
  'underscore'
], function($, _) {

	var defaults = {ip: null, src: false, dst: false, port: null, ports: []};
	
	return {
		defaults: function() { return defaults; },
		get_form_data: function(form, data) {
	    	var fields = (!data) ? {} : data;
	   	    $(form).serialize().split("&").forEach(function(par) {
			    var item = par.split("=");
			    if(item.length >= 2) {
			    	fields[item[0]] = decodeURIComponent(item[1]).replace(/\+/g, "");
			    }
			});
	   	    return fields;
	    },
		fill_dialog: function(attributes) {
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
		},
		show_hide_options: function(hide) {
			if(hide) {
				$('#show_options').text("Show Options");
				$("#pcap_options").hide();
			} else {
				$('#show_options').text("Hide Options");
				$("#pcap_options").show();
			}
		}
	}
	
});

