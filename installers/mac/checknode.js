function check_node() {
    
    //var exit_code=system.run('/bin/sh', '-c', "version=$(node -v 2> /dev/null | sed 's/v[[:digit:]][[:punct:]]//' | bc);if [ $version -gt 10 ]; then exit 1;else exit 0;fi");
    
    
    //var exit_code=system.run('/bin/sh', '-c', "exit_code=$(node -e 'var version = process.version.match(/^v(\d+\.\d+)/)[1];if(version >= 0.15 && version < 1) console.log(0);else console.log(1)'| bc);exit $exit_code");
    
    
    //var exit_code=system.run('/bin/sh', '-c', "exit_code=$(node -e 'var version = process.version.match(/^v(\d+\.\d+)/)[1];console.log((version < 0.15 || version >= 1) ? 1 : 0)' | bc);exit 25");
    
    //var exit_code=system.run('/bin/sh', '-c', "exit $(version = $(node -e '(Number(process.version.match(/^v(\d+\.\d+)/)[1]));expr $version \"< \" 0.10)' -p | bc)");
    
    var exit_code=system.run('/bin/sh', '-c', "version=$(node -v 2> /dev/null | sed 's/^v//' | sed 's/[[:punct:]][[:digit:]]*$//' | bc);echo `node -v` >> /Users/user/Projects/mylog; echo 'version' >> /Users/user/Projects/mylog; echo $version >> /Users/user/Projects/mylog;if (( $(bc <<< '$version < 0.15') || $(bc <<< '$version >= 1') ));then echo 1 >> /Users/user/Projects/mylog;else echo 0 >> /Users/user/Projects/mylog; fi;exit 12");
    

    //var exit_code=system.run('/bin/sh', '-c', "val=12;exit $val");
                             
//if (exit_code != 0) {
    my.result.title = 'Node 10 is not installed'+exit_code;
    my.result.message = 'The application requires Node.js 0.10 or above for the version 0.x. Node.js v4 and above haven\'t been tested yet.'+exit_code;
    my.result.type = 'Fatal';
    return false;
  //}
  //return true;
}
