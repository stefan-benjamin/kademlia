exports.getIpAddresses = function () {
   var os = require('os');

   var interfaces = os.networkInterfaces();
   var addresses = [];
   for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
         var address = interfaces[k][k2];
         if (address.family === 'IPv4' && !address.internal ) {
            addresses.push(address.address);
         }
      }
   }

   return addresses;
}

//exports.getIpAddressesAsString = function () {
//   var addresses = this.getIpAddresses();
//   var result = "";

//   addresses.forEach(function (entry) {
//      result += entry;
//   });

//   return result;
//}

