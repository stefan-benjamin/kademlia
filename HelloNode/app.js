'use strict';

console.log('Starting node...');

var constants = require('./constants');
var utils = require('./utils');

var portNumber = 8080; //default value, used when debugging in VS.

if (process.argv[2]) {
   portNumber = process.argv[2];
}

var addresses = utils.getIpAddresses();

console.log("IP addresses: " + addresses );

var express = require('express');
var app = express(); // the main app

var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();
app.listen(portNumber);
console.log("Listening on port " + portNumber);

var crypto = require('crypto');
var nodeId = crypto.createHash('sha1');
nodeId.update(addresses + portNumber);
var nodeIdString = nodeId.digest("hex").substr(0, constants.B);
console.log("Node has Id: " + nodeIdString);

app.get('/', function (req, res) {
   console.log(app.mountpath);
   res.send('App Homepage');
});

app.get('/ping', function (req, res) {

   var senderId = req.query.senderId;
   console.log('Ping received from ' + senderId );

   res.send({ type: "PONG", senderId: senderId, nodeID: nodeIdString });
});

//restClient.get("http://google.com", function (data, response) {
//   // parsed response body as js object 
//   console.log(data);
//   // raw response 
//   console.log(response);
//});




