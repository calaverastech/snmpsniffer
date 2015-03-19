#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
	os = require('os'),
	connect = require('connect'),
	express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var preprocessor = require('./preprocess.js');
var exec = require('child_process').exec, 
	child, snmp_process, pcap_process;
//var pcap = require('./build/Release/pcap_binding'),
//  socketwatcher = require('./build/Release/socketwatcher');
//var pcap = require('./pcap.js');
var pcap = require('pcap');
//	snmp = require ("net-snmp");
var util = require('util');
var Hex = require("./hex.js");
var Base64 = require("./base64.js");
var ASN1 = require("./asn1.js");
var log4js = require('log4js');

var PORT = process.env.PORT || 5000;

var IP4Regex = new RegExp("^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$");
var IP4CIDRRegex = new RegExp("^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(/(d|[1-2]d|3[0-2]))$");
var PORTRange = new RegExp("^\d+\s*-+\s*\d+$");

var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
var writer = null;

var ostype = os.type();
var pcapBufferSize = 10*1024*1024;
var snmpBufferSize = 200*1024;
var PCAP_DIR = ".snmpsniffer",
	PCAP_DATA_DIR = ".snmpsniffer_data",
	LOG_DIR = path.join(PCAP_DIR, "log");
	
function createDir(name) {
	if(!!name && name.length > 0 && !fs.existsSync(name)) {
		var dirs = _(name.split(path.sep)).compact();
		var dir = (name.charAt(0) === path.sep) ? path.sep : "";
		try {
			_(dirs).each(function(d) {
				dir += ((dir.length > 0) ?  path.sep:"") + d;
				if(!fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}	
			});
		} catch(err) {
			logger.error(err.message);
			//console.log(err.message);
			throw err;
		}
	}
}	
	
function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function getUserFile(dir, filename) {
	if(!!filename && filename.length > 0) {
		if((ostype == 'Windows_NT' && filename.split(path.sep)[0].match(/^[A-Z]:\\/i)) || (filename.charAt(0) == '/')) {
			return filename;
		}
		var fulldir = !!dir ? path.join(getUserHome(), dir) : path.join(getUserHome(), PCAP_DIR);
		createDir(fulldir);
		return path.join(fulldir, filename);
	}
	return null;
}	

function getLogFile(logfile) {
	if(logfile === "console") {
		return "console";
	} else {
		var log = getUserFile(LOG_DIR, logfile);
		if(ostype == 'Linux' || ostype == "Darwin") {
			if(!fs.existsSync(log)) {
				fs.writeFileSync(log, '');
			}
			try {
				fs.chmodSync(log, 0777);
			} catch (e) {
				//console.log(e.message);
			}
		}
		
		//var ostype = os.type();
		//var dir = writer.path;
		//var home = getUserHome();
		//if((ostype == 'Linux' || ostype == "Darwin") && dir.indexOf(home) === 0) {
			//var index = home.lastIndexOf("/");
			//var command = "chown -R " + home.substring(index + 1) + " " + dir;
				//console.log("chown", command);
				//exec("chown -R " + home.substring(index + 1) + " " + dir);
		  	//}
		return log;
	}	
}


function decode(pem) {
    try {
        var der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
        return ASN1.decode(der);
    } catch (e) {
    	return e.message;
    }
}

function decoded_data(asn1) {
	function breakLines(str, length) {
        var lines = str.split(/\r?\n/),
        o = '';
	    for (var i = 0; i < lines.length; ++i) {
	        var line = lines[i];
	        if (i > 0) o += "\n";
	        while (line.length > length) {
	            o += line.substring(0, length);
	            o += "\n";
	            line = line.substring(length);
	        }
	        o += line;
	    }
	    return o;
	}
    var head = asn1.typeName().replace(/_/g, " ");
    var dec = {head: head};
    var content = asn1.content();
    if (content !== null) {
        content = String(content); // it might be a number
        dec['value'] = content;
        dec['tag'] = asn1.tag;
    }
    if (asn1.sub !== null) {
    	dec['sub'] = [];
        for (var i = 0, max = asn1.sub.length; i < max; ++i)
            dec['sub'].push(decoded_data(asn1.sub[i]));
    }
    return dec;
 };
 
 function decoded_pdu(asn1) {
	 
	 function find_pdu(s) {
		if(!!s) {
			if(_(s).isArray()) {
				for(var i=0; i<s.length; i++) {
					var pdu = find_pdu(s[i]);
					if(pdu != null)
						return pdu;
				}
			} else if(!!s.tag && !!s.tag.command) {
				return s;
			} else {
				return find_pdu(s.sub);
			}
		}
		return null;
	 }
	 
	 var pdu = {};
	 var dec = decoded_data(asn1);
	 if(dec['head'].trim() === "SEQUENCE") {
		 var sub = dec['sub'];
		 if(!!sub && sub.length >= 3) {
			 var version = sub[0];
			 if(version['head'].trim() === "INTEGER") {
				 var ver,
				 	command,
				    requid,
				 	status,
				 	oids = [];
				 switch(version['value']) {
				 	case '0': ver = "v1"; break;
				 	case '1': ver = "v2c"; break;
				 	case '3': ver  = "v3"; break;
				 	default: ver = "uknown snmp version";
				 } 
				 var pdu_seq = find_pdu(sub.slice(1));
				 if(!!pdu_seq && !!pdu_seq.sub && pdu_seq.sub.length >= 3) {
					command = pdu_seq.tag['command'];
					var pdu_sub = pdu_seq.sub;
					if(pdu_sub[0]['head'].trim() === "INTEGER")
						reqid = pdu_sub[0]['value'];
					if(pdu_sub[1]['head'].trim() === "INTEGER") {
						status = pdu_sub[1]['value'];
					}
					var index = 3;
					while(oids.length === 0 && index < pdu_sub.length) {
						if(pdu_sub[index]['head'].trim() === "SEQUENCE" && !!pdu_sub[index]['sub'] && pdu_sub[index]['sub'].length > 0) {
							var seq_sub = pdu_sub[index]['sub'];
							seq_sub.forEach(function(d) {
								if(d['head'].trim() === "SEQUENCE" && !!d['sub'] && d['sub'].length > 0) {
									var data_sub = d['sub'];
									if(data_sub[0]['head'].trim() === "OBJECT IDENTIFIER") {
										var oid = {oid: data_sub[0]['value']};
										if(!!data_sub[1] && data_sub[1]['head'] !== "NULL") {
											oid['type'] = data_sub[1]['head'];
											oid['data'] = data_sub[1]['value'];
										} 
										oids.push(oid);
									}
								}
							});
						}
						index++;
					}
					if(oids.length > 0) {
						pdu["version"] = ver;
						pdu["command"] = command;
						pdu["reqid"] = reqid;
						pdu["oids"] = oids;
						pdu["status"] = status;
					}
				 }
			 }
		 }
	 }
	 return pdu;
 }
 
var header = ["Time", "Session", "Type", "RequestId", "Status", "Syntax", "OID", "Value"];
function writeheader() {
	if(!!writer) {
		_(header).each(function(h, index) {
			if(index > 0)
				writer.write("\t");
			writer.write(h);
		});
		writer.write("\n");
	}
}

function setWriter(filename) {
	
	if(!!filename) {
		try {
			var dir = path.dirname(filename);
			createDir(dir);
			writer = fs.createWriteStream(filename);
			writer
				 .on('error', function (error) {
					 logger.error("error writing to file: " + error);
					 //console.log("error writing to file: " + error);
					 throw error;
				 })
		    	.on('finish', function() {
		    		logger.info("writing to file finished");
					//console.log("writing to file finished");
		           });
			writeheader();
		} catch (err) {
			logger.error("error setting up file: " + err.message);
			//console.log("error setting up file: " + err.message);
			throw err;
		}
	} else {
		writer = null;
	}
}

function write(pdu) {
	function writeData(d, end) {
		writer.write((!!d ? d : "") + (!!end ? "\n": "\t"));
	}
	
	function writeByKey(key, end) {
		writeData(pdu[key], end);
	}
	
	if(!!writer) {
		var oids = pdu.oids;
		_(oids).each(function(d) {
			writeByKey('timestamp');
			writeByKey('ip');
			writeByKey('command');
			writeByKey('reqid');
			var status = pdu.status + ((pdu.status === "0") ? "(Success)" : "(Error)");
			writeData(status);
			writeData(d.type);
			writeData(d.oid);
			writeData(d.data, true);
		});
	}
}

var app = express()
  , http = require('http')
  , server = http.createServer(app);


preprocessor.preprocess(PORT);
var logger;
if(!!LOG_FILE  && LOG_FILE.trim() === "console") {
	logger = log4js.getLogger();
} else {
	//log4js.loadAppender('file');
	log4js.configure({
		 appenders: [
		   { type: 'file', filename: getLogFile(LOG_FILE || 'server.log'), category: 'snmpsniffer', "maxLogSize": 20480,
		      "backups": 10 }
		  ]
		});
    //log4js.addAppender(log4js.appenders.file(getLogFile(LOG_FILE || 'server.log')), "snmpsniffer");
	logger = log4js.getLogger('snmpsniffer');
}

var io = require('socket.io')(server, {
	closeTimeout: 900000,
	heartbeatTimeout: 900000,
	heartbeatInterval: 600000
	});

//io.use(function(socket, next) {
//	   if(_(io.sockets.connected).isEmpty()) {
//		   next();
//	   } else {
//		   console.log("Only one client can be connected at a time");
//		   next(new Error("Only one client can be connected at a time"));
//	   }
//	});


require('jade');
app.set('view engine', 'jade');
app.locals.layout = false;
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.locals._ = require("underscore");
app.use(express.static(__dirname + '/icons'));
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/js'));
app.use(express.static(__dirname + '/node_modules/socket.io/node_modules/socket.io-client'));

app.get('/', function(req, res){
	var interfaces = require('os').networkInterfaces();
	var home = getUserHome() + ((ostype == 'Windows_NT')?"\\":"/" + PCAP_DATA_DIR);
	res.render('index', {interfaces: interfaces, home:home});
});

try {
	server.listen(PORT);
	
} catch(err) {
	logger.fatal(err.message);
	//console.log(err.message);
	process.exit(1);
}


logger.info('Server running at port ' + PORT);
//console.log('Server running at port ' + PORT);
//console.log("To stop the server, press CTRL-C");

if(!!BROWSER) {
	child = exec(BROWSER, function(error, stdout, stderr) {
	    //if(!!stderr) {
	    //	console.log('error: ' + stderr);
	    //}
	    if (error !== null) {
	      console.log("This application requires either Google Chrome or Firefox. If they are installed, please, run the application in the command line as 'snmpsniffer --no-browser' and then point your browser to http://localhost:" + PORT + " . Otherwise, install either Google Chrome or Firefox.\n");
	      logger.fatal("This application requires either Google Chrome or Firefox. Exec error: " + error);
	      //console.log("This application requires either Google Chrome or Firefox. If they are installed, please, run the application in the command line as 'netplayback --no-browser' and then point your browser to http://localhost:" + PORT + " . Otherwise, install either Google Chrome or Firefox.\n");
	      //console.log('exec error: ' + error);
	      process.exit(1);
	    }
	});
}

io.sockets.on('connection', socketConnect);

process.on('exit', function(code) {
  if(!!writer)
	  writer.end();
  //logger.info('About to exit with code:', code);
  console.log('About to exit with code:', code);
});

function socketConnect(socket) {
  logger.info('client socket '+socket.id+" connected");
  //console.log('client socket '+socket.id+" connected");

  var now;
  var pcap_session = null;
  var snmp_running = false,
	responses_only = false;
  var DEFAULT_PORT = 161;
	
  function checkfile(filename) {
	  return !!filename && fs.existsSync(filename);
  }
  
  function stringifyPorts(ports, direction, savedports) {
	  var filter = "";
	  if(ports.length > 0) {
		  var d = ((direction.length > 0) ? direction : " ");
		  //filter += " and (";
		  filter += _.map(ports, function(port) {
			  savedports.push(port);
			  return d + (port.match(PORTRange) ? " portrange " : " port ") + port;
		  }).join(" and ");
		  //filter += " ) ";
	  } else {
		  //filter += " and port " + DEFAULT_PORT;
		  filter += " port " + DEFAULT_PORT;
		  savedports.push(DEFAULT_PORT);
	  }
	  return filter;
  }
  
  function stringifyOpts(opts, savedports) {
	  var filter = "";
	  if(_(opts).isEmpty()) {
		  filter += " port " + DEFAULT_PORT;
		  savedports.push(DEFAULT_PORT);
	  } else {
		  filter += _.map(opts, function(opt) {
			  var direction = "";
			  if(opt.src == "true" && opt.dst != "true") {
			  		direction = " src ";
			  } else if(opt.dst == "true" && opt.src != "true") {
				    direction = " dst ";
			  }
			  var ipstr = "";
			  if(opt.ip.length > 0) { 
				ipstr = ((direction.length > 0) ? direction : (opt.ip.match(IP4CIDRRegex) ? " net " : " host ")) + opt.ip;
			  };
			  var portstr = stringifyPorts(opt.ports, direction, savedports);
			  if(ipstr.length > 0 && portstr.length > 0) {
				  portstr = " and ( " + portstr + " ) ";
			  }
			  return ipstr + portstr;
		  }).join(" or ");
	  } 
	  return filter;
  }
  
  socket.on("pcap_start", function(data) {
	  var filename = getUserFile(PCAP_DATA_DIR, data.filename);
	  if(!data['checked'] && checkfile(filename)) {
		  socket.emit("pcap_file_overwrite", {data:data, newfilename:filename});
	  } else {
		  filename = data['newfilename'] || filename;
		  responses_only = data.responses_only;
		  now = (new Date()).getTime();
		  var options = data.options;
		  var ports = [];
		  var filter = "udp and " + stringifyOpts(data.options, ports);
		  console.log("filter", filter);
		  try {
			  pcap_session = pcap.createSession(data.inter, filter, pcapBufferSize*data.bufferMult);
			  logger.info("starting sniffing...");
			  socket.emit("pcap_start");
			  setWriter(filename);
			  pcap_session.on('packet', function (raw_packet) {
				  try {
					  if(pcap_session.opened) {
						  //console.log("on packet", util.inspect(pcap_session));
						  var packet = pcap.decode.packet(raw_packet);
						  var header = packet.pcap_header;
						  var timestamp = Math.round(100 * (header.tv_sec * 1000 + header.tv_usec/1000 - now))/100;
						  //console.log(util.inspect(packet, {depth: null}));
						  //console.log(packet.link.ip.udp.data.toString('hex'));
						  var asn1 = decode(packet.payload.payload.payload.data.toString('hex'));
						  var pdu = decoded_pdu(asn1);
						  //console.log(util.inspect(pdu, {depth: null}));
						  if(!!pdu.oids && pdu.oids.length > 0) {
							  pdu['timestamp'] = timestamp;
							  pdu['ip'] = _(packet.payload.payload.daddr).values().join(".");
							  write(pdu);
							  socket.emit("pcap_track", {packet: pdu, responses_only:responses_only});
						  }
					  }
				  } catch(err1) {
					  logger.error("packet capture error: " + err1.message);
					  //console.log(err1.message);
				  }
			  });
		  } catch(err) {
			  logger.error(err);
			  //console.log(err);
			  var msg = err.toString();
			  if(msg.indexOf("socket:") == 0)
				  msg += ". You need to run the program as an administrator.";
			  socket.emit("app_error", msg);
		  }
	} 
  });
  
  socket.on("pcap_stop", function() {
	  if(!!pcap_session) {
		  pcap_session.removeAllListeners("packet");
	  }
	  
	  if(!!writer) {
		  writer.end();
		  //var ostype = os.type();
		  //var dir = writer.path;
		  //var home = getUserHome();
		  //if((ostype == 'Linux' || ostype == "Darwin") && dir.indexOf(home) === 0) {
			//var index = home.lastIndexOf("/");
			//var command = "chown -R " + home.substring(index + 1) + " " + dir;
				//console.log("chown", command);
				//exec("chown -R " + home.substring(index + 1) + " " + dir);
		  	//}
	  }
	  logger.info("stopping sniffing...");  
	  socket.emit("pcap_stop");
  });

  socket.on("snmp_start", function(snmp) {
	  	var data = snmp.data;
	  	var bufferMult = snmp.bufferMult;
	  	if(_(data).isArray()) {
	  		snmp_running = true;
	  		_(data).each(function(d) {
	  			if(snmp_running) {
	  				try {
			  			exec(d, {maxBuffer: bufferMult*snmpBufferSize}, function(err, stdout, stderr) {
			  			    if (err !== null) {
			  			      var error = err.message;
			  			      logger.error('exec error: ' + error);
			  			      //console.log('exec error: ' + error);
			  			      socket.emit("app_error", error);
			  			      socket.emit("snmp_track", {count:data.length, input:d, error:error});
			  			    } else {
			  			    	socket.emit("snmp_track", {count:data.length, input:d, output:stdout});
			  			    }
			  			 });
		  			 } catch (e) {
		  				 logger.error(e.message);
		  				 //console.log(e);
		  			 }	 
		  		}
	  		});
	  	} else {
	  		socket.emit("snmp_stop");
	  	}
  });
  
  socket.on("snmp_stop", function() {
	  snmp_running = false;
	  socket.emit("snmp_stop");
  });
  
  socket.on("disconnect", function() {
	  logger.info("disconnected");
	  //console.log("disconnected");
	  //if(_(io.sockets.connected).isEmpty()) {
	  //	  process.exit();
	  //} 
  });
  
  socket.on("close_window", function() {
	  logger.info("closing window");
	  //console.log("closing window");
	  if(_(io.sockets.connected).size() == 1) {
	  	  process.exit();
	  } 
  });
  
}
  




	
	