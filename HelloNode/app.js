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

var storedValues = new Map();


app.get('/', function (req, res) {
   console.log(app.mountpath);
   //res.send('App Homepage');
   var buckets = bm.getBuckets();

   var storedValuesArray = [];
   //iterate through the storedValues
   storedValues.forEach(function (value, key, map) {
      var storedValueJson = { key: key, value: value };

      storedValuesArray.push(storedValueJson);
   })

   res.render('index', { nodeId: globals.nodeId, ipAddresses: globals.ipAddresses, localPort: globals.portNumber, initialNodeIp: globals.initialNodeIpAddress, initialNodePort: globals.initialNodePortNumber, buckets: buckets, storedValues: storedValuesArray });
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

app.post('/api/findnode', function (req, res) {

   var senderId = req.body.senderId;
   var senderPort = req.body.senderPort;
   var targetNodeId = req.body.targetNodeId;

   //The IP address of the sender needs to be retrieved from the query itself.
   var senderIpAddress = req.socket.remoteAddress;

   senderIpAddress = utils.convertIPv6ToIPv4(senderIpAddress);

   console.log('FindNode received from ' + senderId);

   //find closest nodes
   var result = bm.getClosestNodes(targetNodeId);

   res.send({ senderId: senderId, nodeId: globals.nodeId, targetNodeId: targetNodeId, result: result });

   //after sending the result, update our own bucket because we got information regarding the sender
   bm.receiveNode(senderId, { ip: senderIpAddress, port: senderPort });
});

app.post('/api/store', function (req, res) {

   var senderId = req.body.senderId;
   var forward = req.body.forward;
   var key = req.body.key;
   var value = req.body.value;
   
   console.log('Store received from ' + senderId);

   if (forward) {
      //find closest nodes
      var result = bm.getClosestNodes(globals.nodeId);

      //call store on the k closest nodes - without further forwarding
      if (result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET) {
         
         result.content.forEach(function (node) {

             pinger.store(node.ipAddress, node.port, false, key, value, function(){}, function(){});
         });
      }
   }
   else
   {
      //the call is not coming from the GUI, the value needs to be stored.
      storedValues.set(key, value);
   }

   res.send({ senderId: senderId, nodeId: globals.nodeId, success: true });
});

app.get('/api/internal/nodelookup', function (req, res) {
   var calledNodes = new Map();
   
   var targetNodeId = req.query.targetNodeId;
   var resultFound = false;
  
   var runningQueries = 0;

   //look in its own buckets
   var bucketResult = bm.getClosestNodes(targetNodeId);

   if (bucketResult.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE)
   {
      res.send({ result: bucketResult.content });
      return;
   }

   _find(bucketResult, targetNodeId);
   
   function _find(bucketResult, nodeTargetId)
   {
      //shortlist the nodes to contact for further find_node
      //call find_node on alpha nodes from the returned result
      var maxIndex = Math.min(bucketResult.content.length, constants.alpha);

      for (var i = 0; i < maxIndex; i++) {
         var nodeIpAddress = bucketResult.content[i].ipAddress;
         var nodePort = bucketResult.content[i].port;
         var nodeId = bucketResult.content[i].nodeId;

         if (nodeId !== globals.nodeId && !calledNodes.has(nodeId)) { //don't call yourself remotely - local buckets are already handled.
            console.log("Making findNode call to " + nodeIpAddress + " on port " + nodePort);
            runningQueries++;
            pinger.findNode(nodeIpAddress, nodePort, targetNodeId, function (data) {
               calledNodes.set(data.nodeId);

               var result = data.result;
               runningQueries--;

               //check that we did not find the required value
               if (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE) {
                  //return data.result.content;
                  res.send({ result: data.result.content });
                  resultFound = true;

                  //update your own bucket with the found node
                  bm.receiveNode(data.result.content.nodeId, { ip: data.result.content.ipAddress, port: data.result.content.port })
               }
               else if (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET)
               {
                  //update your own bucket with the new nodes we know about
                  data.result.content.forEach(function (node) {
                     bm.receiveNode(node.nodeId, { ip: node.ipAddress, port: node.port });
                  });
               }

               if (!resultFound && runningQueries < constants.alpha) {
                  _find(data.result, nodeTargetId);
               }

            }, function () {
               runningQueries--;

            })
         }

         
      }

      if (resultFound)
      {
         return;
      }
   }
   
});

//THIS IS A TEST - TO BE REMOVED

// Get distance between this node and another random node
nodeIdCrypto = crypto.createHash('sha1');
nodeIdCrypto.update("RANDOM 2");
var randomNodeId = nodeIdCrypto.digest("hex").substr(0, constants.B);
console.log("Random node Id: " + randomNodeId);
console.log(utils.getDistance(globals.nodeId, randomNodeId));
//bm.receiveNode(randomNodeId, { ip: '192.168.2.1', port: 8080 });
//bm.getClosestNodes(randomNodeId);

//END: THIS IS A TEST - TO BE REMOVED

// When we start, make a ping to the other known node. 
var result = pinger.ping(globals.initialNodeIpAddress, globals.initialNodePortNumber, function (result) {
   bm.receiveNode(result.nodeId, { ip: result.requestedIpAddress, port: result.requestedPort });

}, function () {
   console.log("Ping to intial known node failed");
   });










