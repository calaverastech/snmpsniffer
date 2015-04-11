var should = require('should');
var io = require('socket.io-client');
var _ = require('underscore');

var socketURL = 'http://0.0.0.0:5000';
var options = { transports: ['websocket'],
                'force new connection': true };
var filter = {inter: 'eth0', filename:'', bufferMult:1, options:{}, responses_only:true};
var snmp1 = "snmpget -u usr-md5-none -A authkey1 -a MD5 -l authnoPriv demo.snmplabs.com -v3 iso.3.6.1.2.1.1.4.0  iso.3.6.1.2.1.1.9.1.3.1 iso.3.6.1.2.1.2.2.1.1.1 iso.3.6.1.2.1.2.2.1.5.1 -e 0x80004fb805636c6f75644dab22cc";
var snmp2 = "snmpget -c public demo.snmplabs.com -v2c iso.3.6.1.2.1.1.1.0";
var snmp3 = "snmpwalk -c public demo.snmplabs.com -v2c 1.3.6";
	
describe("testing socket", function() {
	it("should sniff 3 packets after pressing 'Start'", function(done) {
		var socket = io.connect(socketURL, options);
		socket.on("connect", function() {
			socket.emit('pcap_start', filter);
			socket.on('pcap_start', function() {
				socket.emit('snmp_start', {data: [snmp1], bufferMult:2});
				var ind = 0;
				socket.on("pcap_track", function(data) {
					ind++;
					var packet = data.packet;
					packet.version.should.equal("v3");
					packet.ip.should.equal("195.218.195.228");
					var oids = packet.oids;
					oids.should.be.instanceOf(Array).and.have.lengthOf(4);
					var oidvals = _(oids).pluck("oid");
					oidvals.should.containEql("1.3.6.1.2.1.1.4.0");
					oidvals.should.containEql("1.3.6.1.2.1.1.9.1.3.1");
					if(packet.command === "Response") {
						oids.should.containEql({oid: "1.3.6.1.2.1.1.4.0", type: 'OCTET STRING', data: 'SNMP Laboratories, info@snmplabs.com'});
						oids.should.containEql({oid: "1.3.6.1.2.1.1.9.1.3.1", type: 'OCTET STRING', data: 'new comment'});
						oids.should.containEql({oid: "1.3.6.1.2.1.2.2.1.1.1", type: 'INTEGER', data: '1'});
						oids.should.containEql({oid: "1.3.6.1.2.1.2.2.1.5.1", type: 'Gauge32', data: '05F5E100'});
					} else {
						packet.command.should.equal("Get");
					}
					if(ind === 3) {
						socket.emit('snmp_stop');
						socket.disconnect();
						done();
					}
				});
			});
		});
	});
	it("should stop sniffing packets after pressing 'Stop'", function(done) {
		var socket = io.connect(socketURL, options);
		socket.on("connect", function() {
			socket.emit('pcap_start', filter);
			socket.on("pcap_start", function() {
				socket.emit("pcap_stop");
				socket.on("pcap_stop", function() {
					socket.emit('snmp_start', {data: [snmp1], bufferMult:2});
					var ind = 0;
					setTimeout(function () {
						socket.on("pcap_track", function(data) {
							ind++;
						});
					}, 2000);
					ind.should.equal(0);
					socket.emit('snmp_stop');
					socket.on('snmp_stop', function() {
						socket.disconnect();
						done();
					});
				});
			});
		});
	});
	it("should run snmp after pressing 'Run SNMP'", function(done) {
		var socket = io.connect(socketURL, options);
		socket.on("connect", function() {
			socket.emit('snmp_start', {data: [snmp2], bufferMult:2});
			socket.on("snmp_track", function(data) {
				data.input.trim().should.equal(snmp2);
				data.output.trim().should.equal('iso.3.6.1.2.1.1.1.0 = STRING: "SunOS zeus.snmplabs.com 4.1.3_U1 1 sun4m"');
				socket.emit('snmp_stop');
				socket.on('snmp_stop', function() {
					socket.disconnect();
					done();
				});
			});
		});
	});
	it("should cancel running SNMP after pressing 'Cancel'", function(done) {
		var socket = io.connect(socketURL, options);
		socket.on("connect", function() {
			socket.emit('snmp_start', {data: [snmp3], bufferMult:10});
			socket.emit('snmp_stop');
			socket.on("snmp_stop", function() {
				var ind = 0;
				setTimeout(function () {
					socket.on("snmp_track", function(data) {
						ind++;
					});
				}, 2000);
				ind.should.equal(0);
				socket.disconnect();
				done();
			});
		});
	});
});

