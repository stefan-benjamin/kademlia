﻿var globals = require('./globals');
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

exports.ping = function (ipAddress, portNumber, callback, errorCallback) {
   
   console.log("REST_CLIENT: Pinging node with ip: " + ipAddress + " on port " + portNumber);

   var args = {
      data: { senderId: globals.nodeId, senderPort: globals.portNumber },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.post("http://" + ipAddress + ":" + portNumber + "/api/ping", args, function (data, response) {
      // parsed response body as js object 
      console.log("REST_CLIENT: Pong received from " + ipAddress + " on port " + portNumber);

      callback({ nodeId: data.nodeId, requestedIpAddress: ipAddress, requestedPort: portNumber });
   }
   );

   req.on('error', function (err) {
      console.log("REST_CLIENT: Error while pinging " + ipAddress + " on port " + portNumber);

      errorCallback({ error: err, requestedIpAddress: ipAddress, requestedPort: portNumber });
   });
};

exports.findNode = function (ipAddress, portNumber, targetNodeId, callback, errorCallback) {

   console.log("REST_CLIENT: Calling find_node on node with ip: " + ipAddress + " on port " + portNumber + ". Target node id: " + targetNodeId);

   var args = {
      data: { senderId: globals.nodeId, senderPort: globals.portNumber, targetNodeId : targetNodeId },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.post("http://" + ipAddress + ":" + portNumber + "/api/findnode", args, function (data, response) {
      // parsed response body as js object 
      console.log("REST_CLIENT: FindNode result received from " + ipAddress + " on port " + portNumber);

      callback({ nodeId: data.nodeId, result: data.result, requestedIpAddress: ipAddress, requestedPort: portNumber });
   }
   );

   req.on('error', function (err) {
      console.log("REST_CLIENT: Error while calling FindNode on " + ipAddress + " on port " + portNumber);

      errorCallback({ error: err, requestedTargetNodeId: targetNodeId, requestedIpAddress: ipAddress, requestedPort: portNumber });
   });
};
