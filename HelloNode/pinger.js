var globals = require('./globals');
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

exports.pingNode = function (ipAddress, portNumber) {

   console.log("Pinging node with ip: " + ipAddress + " on port " + portNumber);

   var args = {
      data: { senderId: globals.nodeId, senderPort: globals.portNumber },
      headers: { "Content-Type": "application/json" }
   };

   restClient.post("http://" + ipAddress + ":" + portNumber + "/api/ping", args, function (data, response) {
      // parsed response body as js object 
      console.log(data);
      // raw response 
      console.log(response);
   });
};
