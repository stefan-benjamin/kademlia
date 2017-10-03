var globals = require('./globals');
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
      parameters: { senderId: globals.nodeId, senderPort: globals.portNumber, targetNodeId : targetNodeId },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.get("http://" + ipAddress + ":" + portNumber + "/api/findnode", args, function (data, response) {
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

exports.store = function (ipAddress, portNumber, forward, key, value, callback, errorCallback)
{
   console.log("REST_CLIENT: Calling store on node with ip: " + ipAddress + " on port " + portNumber);

   var args = {
      data: { senderId: globals.nodeId, forward: forward, key: key, value: value },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.post("http://" + ipAddress + ":" + portNumber + "/api/store", args, function (data, response) {
      // parsed response body as js object 
      console.log("REST_CLIENT: Store result received from " + ipAddress + " on port " + portNumber);

      callback({ nodeId: data.nodeId, success: data.success, requestedIpAddress: ipAddress, requestedPort: portNumber });
   }
   );

   req.on('error', function (err) {
      console.log("REST_CLIENT: Error while calling Store on " + ipAddress + " on port " + portNumber);

      errorCallback({ error: err, requestedIpAddress: ipAddress, requestedPort: portNumber });
   });
}

exports.findValue = function (ipAddress, portNumber, targetKey, callback, errorCallback)
{
   console.log("REST_CLIENT: Calling findValue on node with ip: " + ipAddress + " on port " + portNumber);

   var args = {
      parameters: { senderId: globals.nodeId, targetKey: targetKey },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.get("http://" + ipAddress + ":" + portNumber + "/api/findvalue", args, function (data, response) {
      // parsed response body as js object 
      console.log("REST_CLIENT: Findvalue result received from " + ipAddress + " on port " + portNumber + "DATA: " + data);



      callback({ nodeId: data.nodeId, key: data.key, value: data.value, result: data.result, requestedIpAddress: ipAddress, requestedPort: portNumber });
   }
   );

   req.on('error', function (err) {
      console.log("REST_CLIENT: Error while calling Findvalue on " + ipAddress + " on port " + portNumber);

      errorCallback({ error: err, requestedIpAddress: ipAddress, requestedPort: portNumber });
   });
}
