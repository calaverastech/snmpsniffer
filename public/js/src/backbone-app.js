define([
  'jquery', 
  'underscore', 
  'backbone',
  '../src/router', // Request router.js
], function($, _, Backbone, Router){
  var initialize = function(socket){
    // Pass in our Router module and call it's initialize function
    Router.initialize(socket);
  };

  return { 
    initialize: initialize
  };
});