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
        CWD: process.env.SNMPSNIFFER_PROJECT,
        DEST: process.env.SNMPSNIFFER_PRODUCT,
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
              args: ["server", "--nobrowser"]
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
                        }},
        		        { expand: true, cwd: '<%= CWD %>', src: "installers/mac/checknode.sh", dest: '<%= DEST %>/Resources', flatten:true }
        		]
        	},
            macScriptsCopy: {
                cwd: '<%= CWD %>',
                src: "installers/mac/checknode.sh",
                dest: "scripts",
                expand: true,
                flatten: true
            },
            macDistributionCopy: {
                options: {
                    process: function(content, srcpath) {
                        return content.replace(/&lt;/g, "<").replace(/^\s+$/, "");
                    }
                }
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
    	createPackagesMac: {
            libCopy: {
                src: ["icons/**", "LICENSE/**", "public/css/**", "public/dist/**", "!public/dist/**/*.txt", "views/*", "LICENSE*.txt", "README*.txt", "package.json", "*.min.js"],
                dir: "preflight",
                name: "lib"
            },
            preflightCopy: {
				src: ["installers/mac/preinstall", "installers/mac/preinstall-script"],
				name: "preflight"
			},
			commandCopy: {
    			src: ["bin/mac/snmpsniffer"],
    			name: "command",
    			loc: '/usr/local/bin'
    		},
			uninstallCopy: {
    			src: ["installers/mac/snmpsniffer-uninstall"],
    			name: "uninstall",
    			loc: '/usr/local/bin'
			},
			appCopy: {
				name: "app",
				loc: "/Applications",
                src: "**/*"
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
                    //return 'mkdir -p app && /usr/local/bin/platypus -A -y -o "None" -i ' + cwd + '/icons/snmpsniffer.icns -V ' + version + ' -u "CalaverasTech.com" -I com.calaverastech.Snmpsniffer -f ' + cwd + '/bin/mac/snmpsniffer-run.sh ' + comm + " " + app;
                    //return 'mkdir -p app && /usr/local/bin/platypus -A -y -o "None" -i ' + cwd + '/icons/snmpsniffer.icns -V ' + version + ' -u "CalaverasTech.com" -I com.calaverastech.Snmpsniffer ' + comm + " " + app;
                },
    			stdout: true
    		},
    		createScriptPkg: {
    			cmd: function(identifier, scripts, pkgname) {
    				return "pkgbuild --identifier " + identifier + " --nopayload --scripts " + scripts + " " + pkgname + ".pkg";
    			},
    			stdout: true
    		},
    		analyzeMacPkg: {
    			cmd: function (root, plist) {
    				return "pkgbuild --analyze --root " + root + " " + plist;
    			},
    			stdout: true
    		},
    			
    		createMacPkgFromPlist: {
    			cmd: function(root, plist, identifier, loc, pkgname) {
    				return "pkgbuild --root " + root + " --component-plist " + plist + " --identifier " + identifier + " --version " + version + " --install-location " + loc + " " + pkgname + ".pkg";
    			},
    			stdout: true
    		},

    		createMacPkg: {
    			cmd: function(root, identifier, loc, pkgname) {
    				return "pkgbuild --root " + root + " --identifier " + identifier + " --version " + version + " --install-location " + loc + " " + pkgname + ".pkg";
    			},
    			stdout: true
    		},
    		synthesizeMacProduct: {
    			cmd: function(packages, distr) {
                    var dest = grunt.config("DEST");
                    var packagesStr = _.map(packages.split(","), function(p) {return " --package " + dest + "/" + p}).join(" ");
    				return "productbuild --synthesize " + packagesStr + " " + dest + "/" + distr;
    			},
    			stdout: true
    		},
    		createMacProduct: {
    			cmd: function(distr, respath, packages, pkgname) {
                    var cwd = grunt.config("DEST");
                    var dest = grunt.config("CWD") + "/installers/mac";
                    return "productbuild --distribution " + cwd + "/" + distr + " --resources " + cwd + "/" + respath + " --package-path " + cwd + " " + dest + "/" + pkgname + ".pkg";
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
        xmlpoke: {
            updateDistribution: {
                options: {
                    replacements: [
                        {
                            xpath: "/installer-gui-script/options",
                            valueType: "remove"
                        },
                        {
                            xpath: '/installer-gui-script',
                            valueType: "append",
                            value: "<title>SNMPSniffer</title>" + grunt.util.linefeed + "<license file='LICENSE.txt' />" + grunt.util.linefeed + "<options allow-external-scripts='yes' />" + grunt.util.linefeed + "<installation-check script='check_node();' />" + grunt.util.linefeed + "<script />" + grunt.util.linefeed
                        },
                        {
                            xpath: '//script'
                        }
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
            	cwd: "<%= CWD %>",
                all: true
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
    grunt.loadNpmTasks('grunt-plistbuddy');
    grunt.loadNpmTasks('grunt-chmod');
    grunt.loadNpmTasks('grunt-xmlpoke');
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
        grunt.task.run(["run:server", "mochaTest:test", "stop:server"]);
    });
    
    grunt.registerTask("backup", "Backup the project", function() {
    	var destfile = path.dirname(grunt.config("CWD")) + "/" + path.basename(grunt.config("CWD")) + "-" + grunt.template.today('yyyy-mmmm-dd-h:MM:TT');
    	grunt.config("copy.folderCopy.cwd", grunt.config("CWD"));
    	grunt.config("copy.folderCopy.src", "**/*");
    	grunt.config("copy.folderCopy.dest", destfile);
    	grunt.task.run("copy:folderCopy");
    });
    
    grunt.registerTask("gitProjects", "New build", function(msg) {
    	grunt.config("gitcommit.task.options.message", msg);
    	grunt.task.run(["gitadd", "gitcommit"]);
     });
    
     //Grunt local machine
    //grunt.registerTask('local', ["jshintLocal", "minify", "mochaLocal", "karma:unit"]);
    grunt.registerTask('local', "Local tests", function(passw, commitmsg) {
    	grunt.task.run(["backup", "jshintLocal", "exec:runassudo:mochaLocal:"+passw, "karma:unit"]);
    	var msg = (!commitmsg)? ("New build " + grunt.template.today('mmmm dd h:MM TT, yyyy')):commitmsg;
    	grunt.task.run(["gitProjects:"+msg, "gitpush"]);
    });

    grunt.registerTask("uglifyServer", "Uglify server files", function() {
    	//grunt.task.run("commands:mkdir_tmp");
        grunt.task.run(["exec:mkdir:"+grunt.config("CWD"), "copy:serverCopy", "uglify"]);
    });
    
    grunt.registerTask("copyMinServer", "Copy uglified server files", function() {
		grunt.task.run(['copy:serverCopyBack', "exec:rmdir:"+grunt.config("CWD")]);
		//grunt.task.run('commands:rm_tmp');
    });
    
    grunt.registerTask("minify", "Minify javascript files", ["requirejs:compile", "uglifyServer", "copyMinServer"]);
    
    //grunt.registerTask("gitMac", "New build Mac", function() {
    //	grunt.config("gitadd.files.src", ["installers/mac/*.pkg", "installers/mac/*.dmg", "packages/mac/*"]);
    //	grunt.task.run("gitProjects");
    //});
    	
    grunt.registerTask("archiveLinux", "Create application archive for Linux", function() {
    	var filename =  "snmpsniffer-linux-v"+version + grunt.config("compress.linux.options.ext");
    	var files = grunt.config.get("compress.linux.files");
    	//files.forEach(function(f) {
    	//	f.dest = grunt.option("archive");
    	//});
    	grunt.config("compress.linux.files", files);
    	grunt.config("compress.linux.options.archive", grunt.config("compress.linux.options.dest") + filename);
    	grunt.task.run("compress:linux");
    });  
    
    grunt.registerMultiTask("createPackagesMac", "Create Mac packages", function() {
        var cwd = grunt.config("CWD");
        var dir = grunt.config("DEST") + (!!this.data.dir ? ("/snmpsniffer" + this.data.dir) : "");
        var name = "snmpsniffer" + this.data.name;
        var dest = dir + "/" + name;
        var pkgname = dest;
    	var identifier = "com.calaverastech.snmpsniffer" + this.data.name + ".pkg";
        var appName = "SNMPSniffer.app";
        var comm = cwd + "/bin/mac/snmpsniffer";
        if(this.target === "appCopy") {
            var app =cwd + "/app/" + appName;
            grunt.task.run("exec:createMacApp:"+cwd + ":" + comm + ":" + app);
            cwd = cwd + "/app";
    	} 
    	grunt.config("copy.folderCopy.cwd", cwd);
    	grunt.config("copy.folderCopy.src", this.data.src);
    	grunt.config("copy.folderCopy.dest", dest);
                            
    	if(this.target === "preflightCopy" || this.target === "commandCopy" || this.target === "uninstallCopy") {
            grunt.config("copy.folderCopy.flatten", true);
    	} else {
            grunt.config("copy.folderCopy.flatten", false);
                            
    	}
        grunt.task.run("copy:folderCopy");
                            
        if(this.target === "preflightCopy" || this.target === "commandCopy" || this.target === "uninstallCopy" || this.target === "appCopy") {
            if(this.target === "appCopy") {
                grunt.config("chmod.src", [dest+"/**/MacOS/*", dest+"/**/Resources/script"]);
            } else {
                grunt.config("chmod.src", dest+"/*");
            }
            grunt.task.run("chmod");
        }
                            
    	if(this.target === "libCopy") {
            grunt.task.run("exec:npmPack:"+dir+":"+dest);
    	} else if(this.target === "appCopy") {
    		var plistpath = dir+"/Info.plist";
    		grunt.task.run("exec:analyzeMacPkg:"+dest+":"+plistpath);
    		grunt.config("plistbuddy.setFlagRelocatable.src", plistpath);
    		grunt.task.run("plistbuddy:setFlagRelocatable");
    		grunt.task.run("exec:createMacPkgFromPlist:"+dest+":"+plistpath+":"+identifier+":"+this.data.loc+":"+pkgname);
    	} else if(this.target === "preflightCopy") {
            grunt.task.run("exec:createScriptPkg:"+identifier+":"+dest+":"+pkgname);
    	} else {
    		grunt.task.run("exec:createMacPkg:"+dest+":"+identifier+":"+this.data.loc+":"+pkgname);
    	}
    });
    
    grunt.registerTask("productMac", "Create Mac product", function() {
                       
        var cwd = grunt.config("CWD");
        var dest = grunt.config("DEST");

    	grunt.task.run("copy:macResourcesCopy");
                       
        var names = _.chain(grunt.config.get("createPackagesMac")).filter(function(el) {
                        return !el.dir;
                    }).values().pluck("name").value();
        var packages = _.map(names, function(n) {return "snmpsniffer"+n+".pkg"});
                       
        grunt.task.run("exec:synthesizeMacProduct:"+packages+":distribution-0.dist");
        var distrfiles = {};
        distrfiles[dest + "/distribution-1.dist"] = dest + "/distribution-0.dist";

        grunt.config("xmlpoke.updateDistribution.files", distrfiles);
                       
        var checkscript = "<![CDATA[" + grunt.util.linefeed + grunt.file.read(cwd + "/installers/mac/checknode.js") + grunt.util.linefeed + "]]>";
        
        var scriptIndex = _.findIndex(grunt.config.get("xmlpoke.updateDistribution.options.replacements"), function(r) {
            return r.xpath === "//script";
        });

        grunt.config("xmlpoke.updateDistribution.options.replacements."+scriptIndex+".value", checkscript);             
                       
        grunt.task.run("xmlpoke");
                       
        grunt.config("copy.macDistributionCopy.src", dest+"/distribution-1.dist");
        grunt.config("copy.macDistributionCopy.dest", dest+"/distribution.dist");
        grunt.task.run("copy:macDistributionCopy");
        
                       
        var pkgname = "SNMPSniffer-v"+version;
        grunt.task.run("exec:createMacProduct:distribution.dist:Resources:" + packages + ":" + pkgname);
                       
        grunt.task.run("exec:createMacDmg:SNMPSniffer:"+pkgname);
                            
        var name = "snmpsniffer-mac-v"+version;
        var dir = cwd + "/packages/mac/" + name;
        grunt.config("copy.folderCopy.cwd", cwd);
        grunt.config("copy.folderCopy.src", ["installers/mac/*-uninstall", "installers/mac/*.pkg", "README.txt"]);
        grunt.config("copy.folderCopy.dest", dir);
        grunt.config("copy.folderCopy.flatten", true);
                       
        grunt.task.run("copy:folderCopy");
                       
        grunt.config("chmod.src", dir + "/snmpsniffer-uninstall");
        grunt.task.run("chmod");
                       
        grunt.task.run("exec:compressMac:"+ cwd + "/packages/mac:"+name);
                       
        //grunt.config("compress.mac.options.archive", cwd + "/packages/mac/snmpsniffer-mac-v"+version+".tar.gz");
        //grunt.task.run("compress:mac");
    });
                                
    grunt.registerTask("packageLinux", "Create Linux installer archive", ["clean:linuxPrepare", "minify", "archiveLinux", "gitProjects:"+"Linux new Build "+ grunt.template.today('mmmm dd h:MM TT, yyyy')]);
    //grunt.registerTask("packageLinux", "Create Linux installer archive", ["clean:linuxPrepare", "minify", "archiveLinux"]);
                     
                     
    grunt.registerTask("packageMac", "Create packages and archive for Mac", ["clean:macPrepare", "clean:macBuild", "minify", "createPackagesMac", "productMac", "clean:macGarbage", "gitProjects:" + "Mac new Build "+ grunt.template.today('mmmm dd h:MM TT, yyyy')]);
    //grunt.registerTask("packageMac", "Create packages and archive for Mac", ["clean:macPrepare", "clean:macBuild", "minify", "createPackagesMac", "productMac", "clean:macGarbage"]);
    
//    grunt.registerTask('karmaDist', 'Karma tests for minified frontend', function() {
//    	grunt.config('karma.unit.options.basePath', 'public/dist');
//    	grunt.task.run("karma:unit");
//    });

};