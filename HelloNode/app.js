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

console.log("IP addresses: " + globals.ipAddresses);

var express = require('express');
const bodyParser = require('body-parser');
var app = express(); // the main app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));

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
   var senderIpAddress = req.socket.remoteAddress;

   senderIpAddress = utils.convertIPv6ToIPv4(senderIpAddress);

   console.log('Ping received from ' + senderId + ', having IP: ' + senderIpAddress);

   //update buckets - insert the senderId
   bm.receiveNode(senderId, { ip: senderIpAddress, port: senderPort });

   res.send({ senderId: senderId, nodeId: globals.nodeId });
});

app.get('/api/findnode', function (req, res) {

   var senderId = req.query.senderId;
   var targetNodeId = req.query.targetNodeId;

   console.log('FindNode received from ' + senderId);

   //find closest nodes
   var result = bucketmanager.getClosestNodes(targetNodeId);

   res.send({ senderId: senderId, nodeId: globals.nodeId, targetNodeId: targetNodeId, result: result });
});

app.get('/api/internal/nodelookup', function (req, res) {
   var targetNodeId = req.query.targetNodeId;

   var closestNodeFound = null;

   //look in its own buckets
   var bucketResult = bm.getClosestNodes(targetNodeId);
   if (bucketResult.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE || bucketResult.returnType === constants.GET_CLOSEST_NODE_FOUND_NOTHING)
   {
      res.send({ result: bucketResult.content });
   }
   else //got a bucket as result
   {
      //shortlist the nodes to contact for further find_node

   }
   
});

//THIS IS A TEST - TO BE REMOVED

// Get distance between this node and another random node
nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update("RANDOM 2");
var randomNodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);
console.log("Random node Id: " + randomNodeId);
console.log(utils.getDistance(globals.nodeId, randomNodeId));
bm.receiveNode(randomNodeId, { ip: '192.168.2.1', port: 8080 });
bm.getClosestNodes(randomNodeId);

//END: THIS IS A TEST - TO BE REMOVED

// When we start, make a ping to the other known node. 
var result = pinger.ping(globals.initialNodeIpAddress, globals.initialNodePortNumber, function (result) {
   bm.receiveNode(result.nodeId, { ip: result.requestedIpAddress, port: result.requestedPort });

}, function () {
   console.log("Ping to intial known node failed");
});





