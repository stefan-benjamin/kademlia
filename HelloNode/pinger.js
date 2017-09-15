var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

exports.pingNode = function (ipAddress, portNumber) {

   console.log("Pinging node with ip: " + ipAddress + " on port " + portNumber);

   restClient.post("http://" + ipAddress + ":" + portNumber + "/api/ping", function (data, response) {
      // parsed response body as js object 
      console.log(data);
      // raw response 
      console.log(response);

   });

};
