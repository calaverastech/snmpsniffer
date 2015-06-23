module.exports = function(grunt) {
    var src = ["*.js","public/js/app.js", "!*.min.js", "!Gruntfile.js"];
    //var tests = ["spec/**/*.spec.js"];
    var tests_local_backend = ["spec/**/*-local-backend.spec.js"];
    var tests_local_frontend = ["spec/**/*-local-frontend.spec.js"];
    var tests_local = tests_local_backend.concat(tests_local_frontend);
    var allJs_local = tests_local.concat(src);
    var tests_demo = ["spec/**/*-demo.spec.js"];
    var tests = [];
    var supportingFiles = ["Gruntfile.js"];
    var allJs = tests.concat(src);
    
    //var rjs_build = grunt.file.read('public/build.js').trim().slice(1,-1);
    //rjs_build = JSON.parse(rjs_build.replace(/(?:\r\n|\r|\n)/g, ""));
	/*jshint -W106 */
    var rjs_build = eval(grunt.file.read('public/build.js'));
    /*jshint +W106 */
    rjs_build.baseUrl = "public/js";
    rjs_build.dir = "public/dist";
    //console.log(rjs_build);
        
    //var allJs = tests;
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true,
                evil: true
            },
            files: {
                src: allJs
            }
        },
        mochaTest: {
            test: {
                src: tests_local_backend
            }
        },
        mocha_istanbul: {
            coverage: {
                src: allJs,
                options: {
                    reportFormats: ["text", "html", "lcov"],
                    excludes: tests.concat(supportingFiles)
                }
            }
        },
        coveralls: {
            src: {
                src: "coverage/lcov.info"
            }
        },
        karma: {
        	unit: {
            	options: {
        	        configFile: 'karma.conf.js'
        		}
        	}
        },
        requirejs: {
        	  compile: {
        		options: rjs_build      		
        	 }
        },
        copy: {
        	server_copy: {
        	    //src: ['preprocess.js', 'int10.js', 'hex.js', 'base64.js', 'asn1.js', 'server.js'],
        		src: ['server.js', 'asn1.js', 'preprocess.js'],
        	    dest: 'tmp/',
        	    expand: true,
        	    options: {
            		process: function (content, srcpath) {
        	    			return content.replace(/#\!.+node/, "")
        	    						  .replace(/(__dirname\s*\+\s*'\/public)\/js'/g,"$1/dist'" )
        	    						  .replace(/(\.\/.+)\.js(?!on)/g,"$1.min.js");
          			}
        		}
        	},
        	server_copy_back: {
        		cwd: "tmp", 
        		src: ["*.min.js"],
        		dest: ".",
        		expand: true
        	}
        	
        },
        uglify: {
        	libs: {
    	    	mangle: true,
    	    	compress: true,
    	    	files: {
	        		'tmp/int10.min.js': ["int10.js"],
	        		'tmp/asn1.min.js': ["tmp/asn1.js"],
	        		'tmp/hex.min.js': ["hex.js"],
	        		'tmp/base64.min.js': ["base64.js"]
        		}
        	},
        	server: {
        	    mangle: true,
                compress: true,
        		files: {
        			'tmp/preprocess.min.js': ["tmp/preprocess.js"],
        			'tmp/server.min.js': ["tmp/server.js"]
        		},
        		options: {
                    banner: '#!/usr/bin/env node\n'
        		}
        		
        	}
        },
        commands: {
        	mkdir_tmp: {
        		cmd: ["mkdir -p tmp", "rm -rf tmp/*"]
        	},
        	rm_tmp: {
        		cmd: ["rm -rf tmp"]
        	}
        },
        
        //commands: {
        //	modify_server: {
        //		cmd: ["mkdir tmp", "cd tmp", "./grunt-modify-server"]
        //	},
        //	copy_server: {
        //		cmd: ["./grunt-copy-server", "rm -rf tmp"]
        //	}
        //},
        watch: {
        	scripts: {
        	  files: ['**/*.js'],
        	  tasks: ['start'],
        	  options: {
        	    spawn: false
        	  }
        	}
        }
    });
    
    grunt.loadNpmTasks("grunt-coveralls");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-mocha-istanbul");
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-commands');
    grunt.loadNpmTasks("grunt-then");
    
    //grunt.loadNpmTasks('grunt-nodemon');
    //grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-contrib-connect');
    //grunt.loadNpmTasks('grunt-connect-socket.io');
    
    //grunt.registerTask('start', 'Start server', function() {
    //	grunt.util.spawn({
    //		cmd: 'echo',
    //		args: ['"hello"']
    //	});
    //	grunt.task.run('watch');
	//});

    //The travis ci build
    grunt.registerTask("travis", ["jshint", "mocha_istanbul:coverage", "coveralls:src", "karma:unit", "minify"]);

    //Check code coverage with grunt cover
    grunt.registerTask("cover", ["mocha_istanbul:coverage"]);

    //Just run grunt for day to day work
    grunt.registerTask("default", ["jshint", "karma:unit", "minify"]);
    
    grunt.registerTask("jshintLocal", 'Local jshint tests', function() {
    	grunt.config('jshint.files', allJs_local);
    	//grunt.config('jshint.files', tests_local);
    	grunt.task.run('jshint:files');
    });
    
    grunt.registerTask('mochaLocal', 'Local mocha tests', function() {
        grunt.config('mochaTest.test.src', tests_local_backend);
    	//grunt.config('mochaTest.test.src', allJs_local);
        grunt.task.run('mochaTest:test');
    });
    
    
    grunt.registerTask("uglifyServer", function() {
    	grunt.task.run("commands:mkdir_tmp");
    	grunt.task.run('copy:server_copy');
    	grunt.task.run("uglify");
    });
    
    grunt.registerTask("copyMinServer", function() {
		grunt.task.run('copy:server_copy_back');
		grunt.task.run('commands:rm_tmp');
    });
    
    grunt.registerTask("minify", ["uglifyServer", "copyMinServer"]);
    
    
//    grunt.registerTask("minify", function() {
//    	grunt.task.run("requirejs:compile");
//		grunt.task.run("commands:mkdir_tmp");
//		grunt.task.run('copy:server_copy');
//    	grunt.task.run("uglify");
//    	grunt.task.run('copy:server_copy_back');
//    	grunt.task.run('commands:rm_tmp');
//    });
    
    
    grunt.registerTask('karmaDist', 'Karma tests for minified frontend', function() {
    	grunt.config('karma.unit.options.basePath', 'public/dist');
    	grunt.task.run("karma:unit");
    });
    

    //Grunt local machine
    //grunt.registerTask('local', ["jshintLocal", "minify", "mochaLocal", "karma:unit"]);
    grunt.registerTask('local', ["jshintLocal", "mochaLocal", "karma:unit"]);
    
};