'use strict';

console.log('Starting node...');

var constants = require('./constants');
var utils = require('./utils');
var bucket = require('./bucket');
var bucketmanager = require('./bucketManager');

//Default value, used when debugging in VS.
var portNumber = 8080; 
var initialNodeIpAddress = 'localhost';
var initialNodePortNumber = portNumber;


if (process.argv[2] && process.argv[3] && process.argv[4]) {
   portNumber = process.argv[2];
   initialNodeIpAddress = process.argv[3];
   initialNodePortNumber = process.argv[4];
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
var nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update(addresses + portNumber);
var nodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);

console.log("Node id: " + nodeId);

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', function (req, res) {
   console.log(app.mountpath);
   //res.send('App Homepage');
   res.render('index', { NodeId: nodeId, IpAddresses: addresses, LocalPort: portNumber, InitialNodeIp: initialNodeIpAddress, InitialNodePort: initialNodePortNumber });
});

app.get('/ping', function (req, res) {

   var senderId = req.query.senderId;
   console.log('Ping received from ' + senderId);
   
   res.send({ type: "PONG", senderId: senderId, nodeId: nodeId });
});

app.get('/findnode', function (req, res) {

   var senderId = req.query.senderId;
   var targetNodeId = req.query.targetNodeId;

   console.log('Findnode received from ' + senderId);

   res.send({ type: "FINDNODE_RESPONSE", senderId: senderId, nodeId: nodeId, results: null });
});


// Get distance between this node and another random node
nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update("RANDOM 2");
var randomNodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);

console.log("Random node Id: " + randomNodeId);

console.log(utils.getDistance(nodeId, randomNodeId));

//Create a new bucket
var b = new bucket();

b.set(randomNodeId, { Ip: '192.168.2.1', Port: 8080})
console.log("Created a new bucket");

//Create a BucketManager
var bm = new bucketmanager(nodeId);
bm.receiveNode(randomNodeId, { ip: '192.168.2.1', port: 8080 });

bm.getClosestNodes(randomNodeId);

//restClient.get("http://google.com", function (data, response) {
//   // parsed response body as js object 
//   console.log(data);
//   // raw response 
//   console.log(response);
//});




