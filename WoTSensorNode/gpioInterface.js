var globals = require('./globals');

setInterval(readSensorData, 3000);

sensorData = { temperature: -100, humidity: -100 };

if (globals.useGpio == 1) {
   console.log("Using hardware GPIO ports instead of simulation values.")

   var sensor = require('node-dht-sensor');
   var onoff = require('onoff');
   var Gpio = onoff.Gpio;
   var pin4 = new Gpio(17, 'out');
}

exports.writeToPin17 = function (value) {
   if (globals.useGpio == 1) {
      pin4.write(value, function () {
         console.log("Changed PIN 4 state to: " + value);
      });
   }
};

exports.readFromPin17 = function () {
   if (globals.useGpio == 1) {
      return pin4.readSync();
   }
   return 0;
};

exports.getEnvSensorData = function () {
   return sensorData;
}

function readSensorData() {
   if (globals.useGpio == 1) {
      sensor.read(22, 4, function (err, temperature, humidity) {
         sensorData = { temperature: temperature, humidity: humidity };
       });
   } else {
       sensorData = { temperature: randomNo(10, 30), humidity: randomNo(0, 100) };
   }
}

function randomNo(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}