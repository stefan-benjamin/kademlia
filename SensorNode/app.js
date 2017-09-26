'use strict';

console.log('Starting node...');

var constants = require('./constants');
var globals = require('./globals');
var gpioInterface = require('./gpioInterface');

var express = require('express');
const bodyParser = require('body-parser');
var app = express(); // the main app
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));

app.listen(globals.portNumber);
console.log("Listening on port " + globals.portNumber);

// view engine setup
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', function (req, res) {
   console.log(app.mountpath);
   
   res.render('index', {});
});

app.post('/actuators/led', function (req, res) {
   var ledValue = parseInt(req.body.value);

   gpioInterface.writeToPin4(ledValue);
   res.send();
});

app.get('/actuators/led', function (req, res) {
   var pin4Value = gpioInterface.readFromPin4();

   res.send({ led: pin4Value });
});