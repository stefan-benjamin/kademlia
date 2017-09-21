var globals = require('./globals');

if (globals.useGpio) {
   var onoff = require('onoff');
   var Gpio = onoff.Gpio;
   var pin4 = new Gpio(4, 'out');
}

exports.writeToPin4 = function (value) {
   if (globals.useGpio) {
      pin4.write(value, function () { //#E
         console.log("Changed PIN 4 state to: " + value);
      });
   }
};

exports.readFromPin4 = function () {
   if (globals.useGpio) {
      return pin4.readSync();
   }
   return 0;
};