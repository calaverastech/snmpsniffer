function check_node() {
  var exit_code=system.run('/bin/sh', '-c', "version=$(node -v 2> /dev/null | sed 's/v[[:digit:]][[:punct:]]//' | bc);exit_code=$(expr $version '<' 10.0 | bc);exit $exit_code");
  if (exit_code != 0) {
    my.result.title = 'Node 10 is not installed';
    my.result.message = 'The application requires Node.js 10 or above. Please, install it.';
    my.result.type = 'Fatal';
    return false;
  }
  return true;
}
