'use strict';

console.log('Hello world. Starting server...');

var express = require('express');
var app = express(); // the main app

var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

app.listen(8080)

app.get('/', function (req, res) {
   console.log(app.mountpath); // /admin
   res.send('App Homepage');
});

// direct way 
restClient.get("http://google.com", function (data, response) {
   // parsed response body as js object 
   console.log(data);
   // raw response 
   console.log(response);
});




