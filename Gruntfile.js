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

    var path = require("path");
    var _ = require('lodash');
    
    var ver = grunt.file.readJSON("package.json").version,
        versions = ver.split("."),
        major = versions[0],
        minor = versions[1],
        version = major + "." + minor;
    
    //var allJs = tests;
    grunt.initConfig({
        CWD: process.env.SNMPSNIFFER_PROJECT || process.cwd(),
        DEST: process.env.SNMPSNIFFER_PRODUCT || process.cwd(),
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
        run: {
            options: {
              wait: false
            },
            server: {
              args: ["server", "--nobrowser", "--log-file=console"]
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
		        expand: true,
                mode: true
        	},
        	macResourcesCopy: {
        		files: [
        		        { expand: true, cwd: '<%= CWD %>', src: "LICENSE*.txt", dest: '<%= DEST %>/Resources/en.lproj', rename: function(dest, src) {
                         return dest + "/" + "LICENSE.txt";
                        }}
        		]
        	},
        	macFilesCopy: {
        		files: [
                        {cwd: "<%= CWD %>", src: ["installers/mac/preinstall", "installers/mac/preinstall-script"], dest: "<%= DEST %>/snmpsnifferpreflight", expand: true, flatten: true},
                        {cwd: "<%= CWD %>", src: ["icons/**", "LICENSE/**", "public/css/**", "public/dist/**", "!public/dist/**/*.txt", "views/*", "LICENSE*.txt", "README*.txt", "package.json", "*.min.js"], dest: "<%= DEST %>/snmpsnifferpreflight/lib", expand: true},
                        {cwd: "<%= CWD %>", src: ["bin/mac/snmpsniffer"], dest: "<%= DEST %>/snmpsniffercommand", expand: true, flatten: true},
                        {cwd: "<%= CWD %>", src: ["installers/mac/snmpsniffer-uninstall"], dest: "<%= DEST %>/snmpsnifferuninstall", expand: true, flatten: true},
                        {cwd: "<%= CWD %>/app", src: ["**/*"], dest: "<%= DEST %>/snmpsnifferapp", expand: true}
        		]
        	}
        },
        clean: {
            linuxPrepare: {
                cwd: '<%= CWD %>/',
                src: ["packages/linux/*"],
                expand: true,
                options: {
                    force: true
                }
            },
        	macPrepare: {
                cwd: '<%= CWD %>/',
        		src: ["app/*.app", "installers/mac/*.dmg","installers/mac/*.pkg", "packages/mac/*"],
        		expand: true,
        		options: {
        			force: true
        		}
        	},
        	macBuild: {
                cwd: '<%= DEST %>/',
                src: "**/*",
        		expand: true,
        		options: {
        			force: true
        		}
        	},
            macGarbage: {
                cwd: '<%= CWD %>/',
                src: "**/.DS_Store",
                expand:  true
            }
        },
    	exec: {
            mkdir: {
                cmd: function(dir) {
                     return "mkdir -p " + dir + " && rm -rf " + dir + "/*";
                }
            },
            rmdir: {
                cmd: function(dir) {
                    return "rm -rf " + dir;                }
            },
            rename: {
                cmd: function(cwd, oldname, newname) {
                    return "cd " + cwd + " && mv -T " + dir + "/" + oldname + " " + dir + "/" + newname;
                }
            },
            runassudo: {
            	cmd: function(taskname, passw) {
            		return "echo " + passw + " | sudo -S grunt " + taskname;
            	}
            },
            npmPack: {
                cmd: function(cwd, dir) {
                    return "cd " + cwd + " && npm pack " + dir + " && rm -rf " + dir;
                }
            },
            compressMac: {
                cmd: function(cwd, pkgname) {
                        return "tar --remove-files -pczf " + cwd + "/" + pkgname + ".tar.gz " + " -C "+ cwd + " " + pkgname;               
                }
            },
    		createMacApp: {
    			cmd: function(cwd, comm, app) {
    				return 'mkdir -p app && /usr/local/bin/platypus -A -y -o "Text Window" -i ' + cwd + '/icons/snmpsniffer.icns -V ' + version + ' -u "CalaverasTech.com" -I com.calaverastech.Snmpsniffer ' + comm + " " + app;
                },
    			stdout: true
    		},
            createMacDmg: {
                cmd: function(prodname, pkgname) {
                    var dest = grunt.config("CWD") + "/installers/mac";
                    return "hdiutil create -volname " + prodname + " -srcfolder " + dest + "/" + pkgname + ".pkg -ov -format UDZO " + dest + "/" + pkgname + ".dmg";
                },
                stdout: true
            }
    	},
        chmod: {
            options: {
                mode: "755"
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
        productbuild: {
        	snmpsniffer: {
        		options: {
        	        dest: "installers/mac",
        			pkgname: "SNMPSniffer-v"+version,
        			title: "SNMPSniffer",
        			resources: "<%= DEST %>/Resources",
        			license: "LICENSE.txt",
                    script:{src: "<%= CWD %>/installers/mac/check", title: 'Node 10 is not installed', message: 'The application requires Node.js 0.10 or above for the version 0.x. Node.js v4 and above haven\'t been tested yet.'}
                },
        		packages: {
        			cwd: "<%= DEST %>",
        			dest: "<%= DEST %>",
        			files: [
        			        {root: "snmpsnifferapp", pkgname: "snmpsnifferapp", version: version, location: "/Applications", identifier: "com.calaverastech.snmpsnifferapp.pkg", plistoptions: {BundleIsRelocatable: false}},
        			        {root: "snmpsniffercommand", pkgname: "snmpsniffercommand", version: version, location: "/usr/local/bin", identifier: "com.calaverastech.snmpsniffercommand.pkg"},
        			        {root: "snmpsnifferuninstall", pkgname: "snmpsnifferuninstall", version: version, location: "/usr/local/bin", identifier: "com.calaverastech.snmpsnifferuninstall.pkg"},
        			        {scripts: "snmpsnifferpreflight", pkgname: "snmpsnifferpreflight", identifier: "com.calaverastech.snmpsnifferpreflight.pkg"}
        			]
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
        plistbuddy: {
        	setFlagRelocatable: {
        		method: "Set",
        		entry: ":0:BundleIsRelocatable",
        		type: 'bool',
        		value: false
        	}
        },
        compress: {
        	linux: {
        		options: {
        			mode: "tgz",
        			dest: "packages/linux/",
        			ext: ".tar.gz",
        			expand: true
        		},
        		files: [ 
        		         {
	        		        src: ["bin/linux/*", "icons/**", "LICENSE/**", "public/css/**", "public/dist/**", "!public/dist/**/*.txt", "views/*", "LICENSE*.txt", "README*.txt", "package.json", "*.min.js"]
        		         },
        		         {
        		        	 src: ["installers/linux/*"], flatten: true, expand: true
        		         }
        			   ]
        	},
        	mac: {
                cwd: "<%= CWD %>",
                src: ["README.txt", "installers/mac/SNMPSniffer*.pkg", "installers/mac/snmpsniffer-uninstall"],
                mode: "tgz",
                expand: true,
                flatten: true
        	}
        },
        gitadd: {
        	task: {
        		options: {
            		cwd: "<%= CWD %>",
        			all: true
        		}
        	}
        },
        gitcommit: {
        	task: {
        		options: {
            		cwd: "<%= CWD %>",
            		message: "New Build "+ grunt.template.today('mmmm dd h:MM TT, yyyy'),
        			allowEmpty: true
        		}
        	}
        },
        gitpush: {
        	origin_master: {
        		options: {
            		cwd: "<%= CWD %>",
        			remote: 'origin',
        			branch: 'master'
        		}
        	}
        },
        gitfetch: {
            origin_master: {
              options: {
            	cwd: "<%= CWD %>"
              }
            }
        },
        gitpull: {
            origin_master: {
            options: {
	          	cwd: "<%= CWD %>",
	            remote: 'origin',
	            branch: 'master'
	        }
          }
        },
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
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-chmod');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-productbuild');
    
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
        grunt.task.run(["run:server", "mochaTest:test", "stop:server"]);
    });
    
    grunt.registerTask("backup", "Backup the project", function() {
    	var destfile = path.dirname(grunt.config("CWD")) + "/" + path.basename(grunt.config("CWD")) + "-" + grunt.template.today('yyyy-mmmm-dd-h:MM:TT');
    	grunt.config("copy.folderCopy.cwd", grunt.config("CWD"));
    	grunt.config("copy.folderCopy.src", "**/*");
    	grunt.config("copy.folderCopy.dest", destfile);
    	grunt.config("copy.folderCopy.dot", true);
    	grunt.task.run("copy:folderCopy");
    });
    
    grunt.registerTask("gitProjects", "New build", function() {
    	if(!!grunt.option("msg")) {
    		grunt.config("gitcommit.task.options.message", grunt.option("msg"));
    	}	
    	grunt.task.run(["gitadd", "gitcommit"]);
     });
    
     //Grunt local machine
    //grunt.registerTask('local', ["jshintLocal", "minify", "mochaLocal", "karma:unit"]);
    grunt.registerTask('local', "Local tests", function(passw, commitmsg) {
    	grunt.task.run(["backup", "jshintLocal", "exec:runassudo:mochaLocal:"+passw, "karma:unit"]);
    	if(!!commitmsg) {
    		grunt.option("msg", commitmsg);
    	}	
    	grunt.task.run(["gitProjects", "gitpush"]);
    });

    grunt.registerTask("uglifyServer", "Uglify server files", function() {
        grunt.task.run(["commands:mkdir_tmp", "copy:serverCopy", "uglify"]);
    });
    
    grunt.registerTask("copyMinServer", "Copy uglified server files", function() {
		grunt.task.run(['copy:serverCopyBack', "commands:rm_tmp"]);
    });
    
    grunt.registerTask("minify", "Minify javascript files", ["requirejs:compile", "uglifyServer", "copyMinServer"]);
    
    	
    grunt.registerTask("archiveLinux", "Create application archive for Linux", function() {
    	var filename =  "snmpsniffer-linux-v"+version + grunt.config("compress.linux.options.ext");
    	//var files = grunt.config.get("compress.linux.files");
    	//files.forEach(function(f) {
    	//	f.dest = grunt.option("archive");
    	//});
    	//grunt.config("compress.linux.files", files);
    	grunt.config("compress.linux.options.archive", grunt.config("compress.linux.options.dest") + filename);
    	grunt.task.run("compress:linux");
    });  
    
    
    grunt.registerTask("prepareMacProduct", "Prepare folders and files for Mac Product", function() {
        var cwd = grunt.config("CWD");
        var dest = grunt.config("DEST");

        var app = path.join(cwd, "app", "SNMPSniffer.app");
        var comm = path.join(cwd, "bin", "mac", "snmpsniffer");
        
        //create an app
        grunt.task.run("exec:createMacApp:"+cwd + ":" + comm + ":" + app);
        
        //copy folders
        grunt.task.run("copy:macFilesCopy");
        
        //compress lib
        grunt.task.run("exec:npmPack:"+path.join(dest, "snmpsnifferpreflight")+":lib");
        
        //set permissions
        grunt.config("chmod.src", [path.join(dest, "snmpsniffercommand")+"/*", path.join(dest, "snmpsnifferpreflight/preinstall*"), path.join(dest, "snmpsnifferuninstall")+"/*", path.join(dest, "snmpsnifferapp/SNMPSniffer.app/Contents/MacOS/*")]);
        grunt.task.run("chmod");
        
        //copy resources
    	grunt.task.run("copy:macResourcesCopy");
    });
    
    grunt.registerTask("createMacProduct", "Create Mac product", function() {
    	
        grunt.task.run("prepareMacProduct");

    	//callback to copy and compress the package
    	grunt.config("productbuild.snmpsniffer.callback", function() {
            var cwd = grunt.config("CWD");
           
            var name = "snmpsniffer-mac-v"+version;
            var dir = path.join(cwd, "packages/mac", name);
            grunt.config("copy.folderCopy.cwd", cwd);
            grunt.config("copy.folderCopy.src", ["installers/mac/*-uninstall", "installers/mac/*.pkg", "README.txt"]);
            grunt.config("copy.folderCopy.dest", dir);
            grunt.config("copy.folderCopy.flatten", true);
                           
            grunt.task.run("copy:folderCopy");
                           
            grunt.config("chmod.src", dir + "/snmpsniffer-uninstall");
            grunt.task.run("chmod");
                           
            grunt.task.run("exec:compressMac:"+ cwd + "/packages/mac:"+name);
    	});
                       
        grunt.task.run("productbuild:snmpsniffer");
    });
                                
    grunt.registerTask("packageLinux", "Create Linux installer archive", ["clean:linuxPrepare", "minify", "archiveLinux", "gitProjects"]);
    //grunt.registerTask("packageLinux", "Create Linux installer archive", ["clean:linuxPrepare", "minify", "archiveLinux"]);
                     
                     
    //grunt.registerTask("packageMac", "Create packages and archive for Mac", ["clean:macPrepare", "clean:macBuild", "minify", "createMacProduct", "clean:macGarbage", "gitProjects"]);
                     
                     
    grunt.registerTask("packageMac", "Create packages and archive for Mac", ["clean:macPrepare", "clean:macBuild", "minify", "createMacProduct", "clean:macGarbage"]);
                     
                     
//    grunt.registerTask('karmaDist', 'Karma tests for minified frontend', function() {
//    	grunt.config('karma.unit.options.basePath', 'public/dist');
//    	grunt.task.run("karma:unit");
//    });

};