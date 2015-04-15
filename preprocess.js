#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2)),
	pkg = require('./package.json'),
	semver = require('semver'),
	os = require('os'),
	_ = require('underscore');	
	
var allowed = ["help", "version", "chrome", "firefox", "nobrowser", "browser", "log-file"];


exports.preprocess = function(port) {
	var unsup = _.difference(_.chain(argv).omit("_").keys().value(), allowed);
	if(unsup.length > 0) {
		console.log("Unsupported options: " + unsup + ". Run the command with a '--help' to see the options available");
		process.exit();
	}
	
	if(!!argv.help) {
		console.log("Usage: " + pkg['name'] + " [options]");
		console.log("       where options include:");
		console.log("");
		console.log("--version                          Application version");
		console.log("--help                             Print help");
		console.log("--chrome                           Use Google Chrome browser");
		console.log("--firefox                          Use Firefox browser");
		console.log("--no-browser or --nobrowser        Don't open any browser");
		console.log("                                   (should be open as a separate command)");
		console.log("--log-file                         Log into file");
		console.log("                                   (default HOME/.snmpsniffer/log/server.log,");
		console.log("                                   'console' for console)");
		process.exit();
	} else if(!!argv.version) {
		console.log(pkg["name"] + " v." + pkg["version"]);
		process.exit();
	} else {
		//check node version
		var nodever = process.version;
		var jsonver = pkg["engines"]["node"];
		if(!semver.satisfies(nodever, ">=" + jsonver)) {
			console.log("The required node version is at least " + jsonver + "; but your node version is " + nodever + ". Please, update your node version");
			process.exit(1);
		}	
	}
	var runchrome,
		runfirefox,
		ostype = os.type();
	
	if(!argv['no-browser'] && !!argv['browser'] && !argv['nobrowser']) {
		var runchrome,
		runfirefox,
		ostype = os.type();
		if(ostype == 'Linux') {
			runchrome = "google-chrome --user-data-dir='' --new-window http://localhost:"+port;
			runfirefox = "firefox -new-window http://localhost:"+port;
		} else if(ostype == 'Windows_NT') {
			runchrome = "chrome.exe --new-window http://localhost:"+port;
			runfirefox = "firefox.exe -new-window http://localhost:"+port;	
		} else if(ostype == 'Darwin') {
			runchrome = 'open -n "/Applications/Google Chrome.app" --args --js-flags=--stack_trace_limit=-1 --user-data-dir=/tmp/jsleakcheck --new-window http://localhost:'+port;
			runfirefox = 'open -n /Applications/Firefox.app --args -new-instance http://localhost:'+port;
		} else {
			console.log("Your OS type " + ostype + " is not supported");
			exit(1);
		}
					
		var brow = "";
		if(!!argv.chrome) {
			brow = runchrome;
		} else if(!!argv.firefox) {
			brow = runfirefox;	
		} else {
			brow = runchrome + " || " + runfirefox;
		}
		global.BROWSER = brow;
	} else {
		global.BROWSER = null;
	}
	
	global.LOG_FILE = argv['log-file'] || "server.log";
	
	return argv._;
	
}
	


