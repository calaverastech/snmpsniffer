define(['jquery', 'underscore', 'backbone', 'src/backbone-help/help', 'src/models/OptionModel', 'src/collections/OptionCollection', 'text!templates/optionTemplate.html', 'src/views/OptionView', 'src/views/OptionListView'], function($, _, Backbone, help, OptionModel, OptionCollection, optionTemplate, OptionView, OptionListView) {
	
var url = 'http://localhost:5000';	
var mockAttributes, mockFetch;
var start_ip = 1;
var sample_template = {ip: '123.456.7.xxx', src: true, dst: true, port: '161, 171', ports: [161, 171]};
var sample1 = {ip: '123.456.7.89', src: true, dst: true, port: '161, 171', ports: [161, 171]};


function make_sample(ip) {
	var sample = _(sample_template).clone();
	sample.ip = sample_template.ip.replace("xxx", ip.toString());
	return sample;
}

//mockAttributes = function() {
//	return sample1;
//};
	
function mockCollection(num) {
	var arr = [];
	for(var i = start_ip; i <= num; i++) {
		arr.push(make_sample(i.toString()));
	}
	return arr;
}


//mockFetchOpt = function(options) {
//  if (options === null) {
//    options = {};
//  }
//  this.set(mockAttributes());
//  if (options.success !== null) {
//    return options.success();
//  }
//};

//mockFetchCollection = function(options) {
//	if (options === null) {
//		options = {};
//	}
//	if (options.reset === true) {
//		return this.reset(mockCollection(20));
//	} else {
//		return (this.models = mockCollection(20));
//    }
//};

describe('JQuery', function() {
    it('should be loaded', function() {
        expect($).toBeDefined();
    });
});

describe('Underscore', function() {
    it('should be loaded', function() {
        expect(_).toBeDefined();
    });
});

describe('Backbone', function() {
    it('should be loaded', function() {
        expect(Backbone).toBeDefined();
    });
});

describe("Button Click Event Tests", function() {
  var spyEvent;
  
});
  

describe("OptionListView form", function () {
	var appview = new OptionListView();
	var arr = mockCollection(3);
	arr.forEach(function(m, index) {
		appview.addModel(m);
	});
	
	beforeEach(function() {
		appview = new OptionListView();
	});
	
	afterEach(function() {
		_.invoke(appview.opts.toArray(), 'destroy');
		appview.opts.reset();
	});
		
	it("loads saved models", function() {
		expect(appview.opts.length).toBe(3);
	});
});


describe("OptionListView form", function () {
	var appview, model;
	
	beforeEach(function() {
		appview = new OptionListView();
		//console.log("before each", appview.opts.length);
		spyOn(window, 'alert');
	});
	
	afterEach(function() {
		_.invoke(appview.opts.toArray(), 'destroy');
		appview.opts.reset();
		//console.log("after each", appview.opts.length);
	});
	
	it("does not add an empty model", function() {
		model = appview.addModel({});
		expect(model).not.toBeTruthy();
		expect(window.alert).toHaveBeenCalledWith("You have to specify either ip or port");
		expect(appview.opts.length).toBe(0);
	});
	
	it("does not add a model with both ip and port missing", function() {
		model = appview.addModel({src: true, dst: true});
		expect(model).not.toBeTruthy();
		expect(window.alert).toHaveBeenCalledWith("You have to specify either ip or port");
		expect(appview.opts.length).toBe(0);
	});
	
	it("does not add a model which is neither source nor destination", function() {
		model = appview.addModel({ip: '123.45.6.78', port: '161', src:false, dst: false});
		expect(model).not.toBeTruthy();
		expect(window.alert).toHaveBeenCalledWith("This data needs to be either source or destination");
		expect(appview.opts.length).toBe(0);
	});
	
	it("adds a model with the parameters passed", function() {
		model = appview.addModel(make_sample(start_ip));
		expect(model).toBeTruthy();
		expect(model.isValid()).toBe(true);
		expect(model.validationError).toBe(null);
		expect(appview.opts.length).toBe(1);
		expect(appview.opts.findWhere({ip: start_ip})).not.toBe(null);
	});
	
	it("does not add the same ip and port twice", function() {
		appview.addModel(make_sample(start_ip));
		model = appview.addModel(make_sample(start_ip));
		expect(model).not.toBeTruthy();
		expect(window.alert).toHaveBeenCalledWith("The ip and port(s) are already on the list");
		expect(appview.opts.length).toBe(1);
	});
	
	it("adds the right number of models with the parameters passed", function() {
		var arr = mockCollection(3);
		arr.forEach(function(m, index) {
			appview.addModel(m);
		});
		expect(appview.opts.length).toBe(3);
		appview.addModel(make_sample(start_ip));
		expect(appview.opts.length).toBe(3);
	});
	
	it("modifies a model with the parameters passed", function() {
		var arr = mockCollection(3);
		arr.forEach(function(m, index) {
			appview.addModel(m);
		});
		expect(appview.opts.at(0).get('ip')).toBe(make_sample(start_ip).ip);
		appview.setModel(appview.opts.at(0).get('id'), make_sample(25));
		expect(appview.opts.at(0).get('ip')).toBe(make_sample(25).ip);
	});
	
	it("clears the list of models", function() {
		var arr = mockCollection(3);
		arr.forEach(function(m, index) {
			appview.addModel(m);
		});
		expect(appview.opts.length).toBe(3);
		appview.removeAll();
		expect(appview.opts.length).toBe(0);
	});
});

describe("OptionView form", function () {
	var appview, optview;
	
	beforeEach(function() {
		appview = new OptionListView();
		var arr = mockCollection(3);
		arr.forEach(function(m, index) {
			appview.addModel(m);
		});
		optview = new OptionView({model: appview.opts.at(1)});
		spyOn(window, 'alert');
	});
	
	afterEach(function() {
		_.invoke(appview.opts.toArray(), 'destroy');
		appview.opts.reset();
	});
	
	it("removes a model", function() {
		expect(appview.opts.length).toBe(3);
		optview.removeOpt();
		expect(appview.opts.length).toBe(2);
	});
	
	it("alters src and dst", function() {
		optview.setModel({src: false});
		expect(appview.opts.at(1).get('src')).toBe(false);
		optview.setModel({dst: false});
		expect(window.alert).toHaveBeenCalledWith("This data needs to be either source or destination");
		expect(appview.opts.at(1).get('dst')).toBe(true);
		optview.setModel({src: true});
		expect(appview.opts.at(1).get('src')).toBe(true);
		optview.setModel({dst: false});
		expect(appview.opts.at(1).get('dst')).toBe(false);
		optview.setModel({dst: true});
		expect(appview.opts.at(1).get('dst')).toBe(true);
	});
	
});

});


	
