var globals = require('./globals');
var fs = require('fs')

setInterval(readSensorData, 3000);

sensorData = { temperature: -100, humidity: -100 };


if (globals.useGpio) {
   var sensor = require('node-dht-sensor');
   var onoff = require('onoff');
   var Gpio = onoff.Gpio;
   var pin4 = new Gpio(17, 'out');
}

exports.writeToPin17 = function (value) {
   if (globals.useGpio) {
      pin4.write(value, function () { //#E
         console.log("Changed PIN 4 state to: " + value);
      });
   }
};

exports.readFromPin17 = function () {
   if (globals.useGpio) {
      return pin4.readSync();
   }
   return 0;
};

exports.getEnvSensorData = function () {
   return sensorData;
}

function readSensorData() {
   //console.log("Reading sensor data...");

   if (globals.useGpio) {
      sensor.read(22, 4, function (err, temperature, humidity) {
         sensorData = { temperature: temperature, humidity: humidity };
       });
   }
   if (globals.noSensors) {
       fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8', function (err, data) {
           if (err) {
               return console.log(err);
           }
           sensorData = { temperature: data.substr(0, 5), humidity: 0 };
           console.log(data.substr(0, 5));
       });
   }
}

