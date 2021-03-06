'use strict';

console.log('Starting sensor node...');

var constants = require('./constants');
var globals = require('./globals');
var utils = require('./utils');
var restClient = require('./restClient');

if (process.argv[2] && process.argv[3] && process.argv[4] && process.argv[5]) {
   globals.portNumber = process.argv[2];
   globals.initialNodeIpAddress = process.argv[3];
   globals.initialNodePortNumber = process.argv[4];
   globals.useGpio = process.argv[5];
}

var gpioInterface = require('./gpioInterface');

var express = require('express');
const bodyParser = require('body-parser');
var app = express(); // the main app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));

globals.ipAddresses = utils.getIpAddresses();
console.log("IP addresses: " + globals.ipAddresses);
globals.nodeId = utils.createHash(globals.ipAddresses + globals.portNumber);
console.log("NodeId: " + globals.nodeId);

app.listen(globals.portNumber);
console.log("Listening on port " + globals.portNumber);

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//Call register on the initial known node
console.log("Trying to register as a WoT sensor on the network. Accessing node on " + globals.initialNodeIpAddress + ", port:" + globals.initialNodePortNumber);

var regResult = restClient.register(globals.initialNodeIpAddress, globals.initialNodePortNumber, function () {
   console.log("Successfully registered on the network.");
}, function () {
   console.log("Error occurred while registering on the network.");
});

app.get('/', function (req, res) {
   console.log(app.mountpath);

   res.render('index', {});
});

app.put('/actuators/led', function (req, res) {
   var ledValue = parseInt(req.body.value);

   gpioInterface.writeToPin17(ledValue);
   res.send();
});

app.get('/actuators/led', function (req, res) {
   var pin17Value = gpioInterface.readFromPin17();

   res.send({ led: pin17Value });
});

app.get('/sensors/environment', function (req, res) {

   var sensorValue = gpioInterface.getEnvSensorData();

   res.send(sensorValue);
});