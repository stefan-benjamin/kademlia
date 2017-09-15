'use strict';

console.log('Starting node...');

var constants = require('./constants');
var globals = require('./globals');
var pinger = require('./restClient');
var utils = require('./utils');
var bucket = require('./bucket');
var bucketmanager = require('./bucketManager');

if (process.argv[2] && process.argv[3] && process.argv[4]) {
   globals.portNumber = process.argv[2];
   globals.initialNodeIpAddress = process.argv[3];
   globals.initialNodePortNumber = process.argv[4];
}

globals.ipAddresses = utils.getIpAddresses();

console.log("IP addresses: " + globals.ipAddresses );

var express = require('express');
const bodyParser = require('body-parser');
var app = express(); // the main app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.listen(globals.portNumber);
console.log("Listening on port " + globals.portNumber);

var crypto = require('crypto');
var nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update(globals.ipAddresses + globals.portNumber);
globals.nodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);

console.log("Node id: " + globals.nodeId);

//Create a BucketManager
var bm = new bucketmanager();

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', function (req, res) {
   console.log(app.mountpath);
   //res.send('App Homepage');
   var buckets = bm.getBuckets();

   res.render('index', { nodeId: globals.nodeId, ipAddresses: globals.ipAddresses, localPort: globals.portNumber, initialNodeIp: globals.initialNodeIpAddress, initialNodePort: globals.initialNodePortNumber, buckets: buckets });
});

app.post('/api/ping', function (req, res) {

   var senderId = req.body.senderId;
   var senderPort = req.body.senderPort;
   //The IP address of the sender needs to be retrieved from the query itself.
   var senderIpAddress = req.connection.remoteAddress;
   
   console.log('Ping received from ' + senderId + ', having IP: ' + senderIpAddress);

   //update buckets - insert the senderId
   
   res.send({ senderId: senderId, nodeId: globals.nodeId });
});

app.get('/api/findnode', function (req, res) {

   var senderId = req.query.senderId;
   var targetNodeId = req.query.targetNodeId;

   console.log('Findnode received from ' + senderId);

   res.send({ type: "FINDNODE_RESPONSE", senderId: senderId, nodeId: globals.nodeId, targetNodeId: targetNodeId, results: null });
});

// Get distance between this node and another random node
nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update("RANDOM 2");
var randomNodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);

console.log("Random node Id: " + randomNodeId);

console.log(utils.getDistance(globals.nodeId, randomNodeId));

bm.receiveNode(randomNodeId, { ip: '192.168.2.1', port: 8080 });

//b.set(randomNodeId, { Ip: '192.168.2.1', Port: 8080})
console.log("Created a new bucket");

bm.receiveNode(randomNodeId, { ip: '192.168.2.1', port: 8080 });

bm.getClosestNodes(randomNodeId);

// When we start, make a ping to the other known node. 
var result = pinger.pingNode(globals.initialNodeIpAddress, globals.initialNodePortNumber, function (result) {
   console.log("Ping ok");
   bm.receiveNode(result.nodeId, { ipAddress: globals.initialNodeIpAddress, port: globals.initialNodePortNumber });
   
}, function () {
   console.log("Ping failed");
   });





