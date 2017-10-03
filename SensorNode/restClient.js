var globals = require('./globals');
var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

exports.register = function (ipAddress, portNumber, callback, errorCallback) {

    console.log("WoT_REST_CLIENT: Registering with ip: " + ipAddress + " on port " + portNumber);

    var args = {
        data: { nodeId: globals.nodeId, nodePort: globals.portNumber },
        headers: { "Content-Type": "application/json" }
    };

    var req = restClient.post("http://" + ipAddress + ":" + portNumber + "/register", args, function (data, response) {
        // parsed response body as js object 
        console.log("WoT_REST_CLIENT: Callback received from " + ipAddress + " on port " + portNumber);

        callback({ nodeId: data.nodeId, requestedIpAddress: ipAddress, requestedPort: portNumber });
    }
    );

    req.on('error', function (err) {
        console.log("WoT_REST_CLIENT: Error while registering " + ipAddress + " on port " + portNumber);

        errorCallback({ error: err, requestedIpAddress: ipAddress, requestedPort: portNumber });
    });
};