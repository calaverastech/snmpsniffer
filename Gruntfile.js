module.exports = function(grunt) {
    var src = ["*.js","public/js/app.js", "!*.min.js", "!Gruntfile.js"];
    //var tests = ["spec/**/*.spec.js"];
    var tests_local_backend = ["spec/**/*-local-backend.spec.js"];
    var tests_frontend = ["spec/**/*-frontend.spec.js"];
    var tests_local = tests_local_backend.concat(tests_frontend);
    var allJs_local = tests_local.concat(src);
    var tests_demo = ["spec/**/*-demo.spec.js"];
    var tests = [];
    var supportingFiles = ["Gruntfile.js"];
    var allJs = tests.concat(src);
    
    var HOME = 	process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    
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
        	serverCopy: {
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
        	serverCopyBack: {
        		cwd: "tmp", 
        		src: ["*.min.js"],
        		dest: ".",
        		expand: true
        	},
        	folderCopy: {
		        expand: true
        	}
        },
        clean: {
        	build: {
        		src: ["app/*.app", "installers/mac/*.dmg","installers/mac/*.mpkg", "packages/**/.tar.gz"],
        		expand: true
        	}
        
        },
    	foldersCopy: {
            config_folders: {
    			scriptsFolder: "scripts",
    			projectsFolder: "projects"
    		},
    		result_folders: {
    			appFolder: "app",
    			installersFolder: "installers",
    			packagesFolder: "packages"
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
        compress: {
        	linux: {
        		options: {
        			mode: "tgz",
        			dest: "packages/linux/",
        			ext: ".tar.gz"
        		},
        		files: [ 
        		         {
	        		        src: ["icons/**", "LICENSE/**/*.txt", "public/css/**", "public/dist/**/*.js", "views/*", "LICENSE*", "README.txt", "package.json", "*.min.js"]
        		         },
        		         {
        		        	 src: ["installers/linux/*"], flatten: true, expand: true
        		         }
        		         
        			   ]
        	}
        },
        gitadd: {
        	task: {
        		options: {
        			all: true
        		}
        	}
        },
        gitcommit: {
        	task: {
        		options: {
        			message: "New Build "+ grunt.template.today('mmmm dd, yyyy'),
        			allowEmpty: true
        		}
        	}
        },
        gitpush: {
        	origin_master: {
        		options: {
        			remote: 'origin',
        			branch: 'master'
        		}
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
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-commands');
    grunt.loadNpmTasks('grunt-git');
    
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
    
    
    grunt.registerTask("uglifyServer", "Uglify server files", function() {
    	grunt.task.run("commands:mkdir_tmp");
    	grunt.task.run('copy:serverCopy');
    	grunt.task.run("uglify");
    });
    
    grunt.registerTask("copyMinServer", "Copy uglified server files", function() {
		grunt.task.run('copy:serverCopyBack');
		grunt.task.run('commands:rm_tmp');
    });
    
    grunt.registerTask("minify", "Minify javascript files", ["requirejs:compile", "uglifyServer", "copyMinServer"]);
    
    grunt.registerTask("cleanAll", "Remove files", function(destdir) {
    	grunt.config("clean.build.cwd", destdir);
    	grunt.task.run("clean:build");
    	//var dirs = grunt.config.get("clean.build");
    	//dirs.forEach(function(d) {
    	//	d = destdir + "/" + d;
    	//});
    	//grunt.config("clean.build", dirs);
    	
    });
    
    grunt.registerMultiTask("foldersCopy", function() {
    	var copyos = !!grunt.option("copyos") ? ("/" + grunt.option("copyos")):"";
    	console.log(copyos);
    	var srcdir = (!!grunt.option("relativesrc") ? (HOME + "/") : "") + grunt.option("srcdir");
    	var destdir = (!!grunt.option("relativedest") ? (HOME + "/") : "") + grunt.option("destdir");
    	grunt.config("copy.folderCopy.cwd", srcdir);
    	grunt.config("copy.folderCopy.dest", destdir);
    	var srcs = [];
    	if(this.args.length > 0) {
    		srcs.push(this.args[0] + ((this.args[0] == "app") ? "" : copyos) + "/**/*");
    	} else {
	    	for(var key in this.data) {
	    		srcs.push(this.data[key] + ((this.data[key] == "app") ? "" : copyos) + "/**/*");
	    	}
    	}
    	grunt.config("copy.folderCopy.src", srcs);
    	if(!!grunt.option("clean")) {
    		grunt.task.run("cleanAll:"+destdir);
    	}
        console.log("func", grunt.config("copy.folderCopy"));
    	grunt.task.run("copy:folderCopy");
    });
    
    grunt.registerTask("gitProjects", "New build", ["gitadd", "gitcommit", "gitpush:origin_master"]);
    
    grunt.registerTask("packageLinux", "Create application archive for Linux", function() {
    	var filename = grunt.option("archive") + grunt.config("compress.linux.options.ext");
    	var files = grunt.config.get("compress.linux.files");
    	files.forEach(function(f) {
    		f.dest = grunt.option("archive");
    	});
    	grunt.config("compress.linux.files", files);
    	grunt.config("compress.linux.options.archive", grunt.config("compress.linux.options.dest") + filename);
    	//console.log(grunt.config("compress.linux"));
    	grunt.task.run("compress:linux");
    });  
    
//    grunt.registerTask('karmaDist', 'Karma tests for minified frontend', function() {
//    	grunt.config('karma.unit.options.basePath', 'public/dist');
//    	grunt.task.run("karma:unit");
//    });

    //Grunt local machine
    //grunt.registerTask('local', ["jshintLocal", "minify", "mochaLocal", "karma:unit"]);
    grunt.registerTask('local', ["jshintLocal", "mochaLocal", "karma:unit"]);
    
};