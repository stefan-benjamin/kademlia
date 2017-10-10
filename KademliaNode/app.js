'use strict';

console.log('Starting node...');

var constants = require('./constants');
var globals = require('./globals');
var restClient = require('./restClient');
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
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));

app.listen(globals.portNumber);
console.log("Listening on port " + globals.portNumber);

globals.nodeId = utils.createHash(globals.ipAddresses + globals.portNumber);

console.log("Node id: " + globals.nodeId);

// Create a BucketManager
var bm = new bucketmanager();

// Wiew engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var storedValues = new Map();
var historicalValues = [];


app.get('/', function (req, res) {
   console.log(app.mountpath);
   var buckets = bm.getBuckets();

   var storedValuesArray = [];
   //iterate through the storedValues and convert the map to an array
   storedValues.forEach(function (value, key, map) {
      var storedValueJson = { key: key, value: value };

      storedValuesArray.push(storedValueJson);
   })

   res.render('index', { nodeId: globals.nodeId, ipAddresses: globals.ipAddresses, localPort: globals.portNumber, initialNodeIp: globals.initialNodeIpAddress, initialNodePort: globals.initialNodePortNumber, buckets: buckets, storedValues: storedValuesArray, historicalValues: historicalValues, sensorIpAddress: globals.sensorNodeIpAddress, sensorPortNumber: globals.sensorNodePortNumber });
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
   var senderPort = req.query.senderPort;
   var targetNodeId = req.query.targetNodeId;

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

   var keyHash = utils.createHash(key);

   if (forward) {
      //find closest nodes to the given key      
      var result = bm.getClosestNodes(keyHash);

      //Call store on the k closest nodes - without further forwarding
      if (result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET) {

         result.content.forEach(function (node) {

            restClient.store(node.ipAddress, node.port, false, key, value, function () { }, function () { });
         });
      }
   }
   else {
      storedValues.set(keyHash, value);
      historicalValues.push({ keyHash: keyHash, timeStamp: new Date().toUTCString(), value: value });
   }
   
   res.send({ senderId: senderId, nodeId: globals.nodeId, success: true });
});


app.get('/api/findvalue', function (req, res) {

   var senderId = req.query.senderId;
   var key = req.query.targetKey;

   console.log('FindValue received from ' + senderId);

   var keyHash = utils.createHash(key);

   if (storedValues.has(keyHash)) {
      res.send({ senderId: senderId, nodeId: globals.nodeId, key: key, value: storedValues.get(keyHash) });
   }
   else {
      //find closest nodes
      var result = bm.getClosestNodes(keyHash);

      res.send({ senderId: senderId, nodeId: globals.nodeId, result: result });
   }
});

app.get('/api/internal/valuelookup', function (req, res) {
   var targetKey = req.query.targetValueKey;

   var calledNodes = new Map();
   var resultFound = false;
   var runningQueries = 0;

   var targetValueKeyHash = utils.createHash(targetKey);

   //look in its own storage for the given key hash
   if (storedValues.has(targetValueKeyHash)) {
      res.send({ key: targetKey, value: storedValues.get(targetValueKeyHash) });
      return;
   }

   //keyhash was not found locally - query the closest k nodes (relative to the keyhash)
   var bucketResult = bm.getClosestNodes(targetValueKeyHash);

   //the bucket manager cannot return constants.GET_CLOSEST_NODE_FOUND_THE_NODE
   //it will return a list of known nodes - close to the key hash.
   _findValueIterative(bucketResult, targetKey)

   function _findValueIterative(bucketResult, targetKey) {
      var maxIndex = Math.min(bucketResult.content.length, constants.alpha);

      for (var i = 0; i < maxIndex; i++) {
         var nodeIpAddress = bucketResult.content[i].ipAddress;
         var nodePort = bucketResult.content[i].port;
         var nodeId = bucketResult.content[i].nodeId;

         if (nodeId !== globals.nodeId && !calledNodes.has(nodeId)) { //don't call yourself remotely - local buckets are already handled.
            console.log("Making findValue call to " + nodeIpAddress + " on port " + nodePort);
            runningQueries++;

            restClient.findValue(nodeIpAddress, nodePort, targetKey, function (data) {
               calledNodes.set(data.nodeId);
               runningQueries--;

               if (data.key && data.value && !resultFound) //the first result has been found
               {
                  res.send({ key: data.key, value: data.value });
                  resultFound = true;
               }
               else //a bucket has been returned - searching continues (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET)
               {
                  if (!resultFound && runningQueries < constants.alpha) {
                     _findValueIterative(data.result, targetKey);
                  }
               }

            }, function () {
               runningQueries--;
            });
         }
      }

      if (resultFound) {
         return;
      }
   }
});


app.get('/api/internal/nodelookup', function (req, res) {
   var calledNodes = new Map();

   var targetNodeId = req.query.targetNodeId;
   var resultFound = false;

   var runningQueries = 0;

   //look in its own buckets
   var bucketResult = bm.getClosestNodes(targetNodeId);

   if (bucketResult.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE) {
      res.send({ result: bucketResult.content });
      return;
   }

   _findNodeIterative(bucketResult, targetNodeId);

   function _findNodeIterative(bucketResult, nodeTargetId) {
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
            restClient.findNode(nodeIpAddress, nodePort, targetNodeId, function (data) {
               calledNodes.set(data.nodeId);

               var result = data.result;
               runningQueries--;

               //check that we did not find the required value
               if (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE) {
                  
                  res.send({ result: data.result.content });
                  resultFound = true;

                  //update your own bucket with the found node
                  bm.receiveNode(data.result.content.nodeId, { ip: data.result.content.ipAddress, port: data.result.content.port })
               }
               else if (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET) {
                  //update your own bucket with the new nodes we know about
                  data.result.content.forEach(function (node) {
                     bm.receiveNode(node.nodeId, { ip: node.ipAddress, port: node.port });
                  });
               }

               if (!resultFound && runningQueries < constants.alpha) {
                  _findNodeIterative(data.result, nodeTargetId);
               }

            }, function () {
               runningQueries--;
            })
         }
      }

      if (resultFound) {
         return;
      }
   }
});

app.post('/api/wot/register/', function (req, res) {
   var nodeId = req.body.nodeId;

   var closestNodes = bm.getClosestNodes(nodeId);

   if (closestNodes.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET && closestNodes.content[0]) {
      var targetNode = closestNodes.content[0];
   }
   else if (closestNodes.returnType === constants.GET_CLOSEST_NODE_FOUND_THE_NODE) {
      var targetNode = closestNodes.content;
   }

   restClient.takeSensorResponsibility(
   targetNode.ipAddress,
      targetNode.port,
      nodeId,
      utils.convertIPv6ToIPv4(req.socket.remoteAddress),
      req.body.nodePort,
      function (data) {
         console.log("Success" + req.body.nodePort);
      },
      function (data) {
         console.log("There was an error");
      });

   res.send();
});

app.post('/api/wot/takeSensorResponsibility', function (req, res) {

   var senderId = req.body.senderId;
   var sensorNodeId = req.body.sensorNodeId;

   globals.sensorNodeIpAddress = req.body.sensorIpAddress;
   globals.sensorNodePortNumber = req.body.sensorPortNumber;

   console.log("Generating key for the sensor data...");

   globals.sensorDataKey = globals.sensorNodeIpAddress + globals.sensorNodePortNumber + globals.sensorNodeApi;
   globals.sensorDataKeyHash = utils.createHash(globals.sensorNodeIpAddress + globals.sensorNodePortNumber + globals.sensorNodeApi);

   setInterval(getSensorData, 5000);

   res.send();
});

function getSensorData() {
   console.log("Getting sensor data...");

   restClient.getSensorValue(globals.sensorNodeIpAddress, globals.sensorNodePortNumber, globals.sensorNodeApi, function (data) {

      //find closest nodes to the given key     
      var result = bm.getClosestNodes(globals.sensorDataKeyHash);

      //call store on the k closest nodes - without further forwarding
      if (result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET) {

         result.content.forEach(function (node) {

            restClient.store(node.ipAddress, node.port, false, globals.sensorDataKey, data, function () { }, function () { });
         });
      }
   }, function () {

   });
}
  
// When the node is started, make a ping to the other known node. 
var result = restClient.ping(globals.initialNodeIpAddress, globals.initialNodePortNumber, function (result) {
   bm.receiveNode(result.nodeId, { ip: result.requestedIpAddress, port: result.requestedPort });

   if (result.nodeId != globals.nodeId) {
      restClient.findNode(globals.initialNodeIpAddress, globals.initialNodePortNumber, result.nodeId, function (data) {
         if (data.result.returnType === constants.GET_CLOSEST_NODE_FOUND_A_BUCKET) {
            //update the buckets with the nodes received from the initial partner
            data.result.content.forEach(function (node) {
               bm.receiveNode(node.nodeId, { ip: node.ipAddress, port: node.port });
            });
         }
      }, function (error) {
         console.log("FindNode to intial known node failed.");
      });
   }

}, function () {
   console.log("Ping to intial known node failed");
});