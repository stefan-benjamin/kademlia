var globals = require('./globals');
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

exports.pingNode = function (ipAddress, portNumber, callback, errorCallback) {
   
   console.log("Pinging node with ip: " + ipAddress + " on port " + portNumber);

   var args = {
      data: { senderId: globals.nodeId, senderPort: globals.portNumber },
      headers: { "Content-Type": "application/json" }
   };

   var req = restClient.post("http://" + ipAddress + ":" + portNumber + "/api/ping", args, function (data, response) {
      // parsed response body as js object 
      console.log("Pong received from " + ipAddress + " on port " + portNumber);

      callback({ nodeId: data.nodeId, requestedIpAddress: ipAddress, requestedPort: portNumber });
   }
   );

   req.on('error', function (err) {
      console.log("Error while pinging " + ipAddress + " on port " + portNumber);

      errorCallback({ error: err, requestedIpAddress: ipAddress, requestedPort: portNumber });
   });
};
