module.exports = function(grunt) {
    var src = ["*.js"];
    var tests = ["spec/**/*.spec.js"];
    var supportingFiles = ["Gruntfile.js"];
    //var allJs = tests.concat(src);
    var allJs = tests;
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true
            },
            files: {
                src: allJs
            }
        },
        mochaTest: {
            test: {
                src: allJs,
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
    grunt.registerTask("travis", ["jshint", "mocha_istanbul:coverage", "coveralls:src"]);

    //Check code coverage with grunt cover
    grunt.registerTask("cover", ["mocha_istanbul:coverage"]);

    //Just run grunt for day to day work
    grunt.registerTask("default", ["jshint", "mochaTest:test"]);
};