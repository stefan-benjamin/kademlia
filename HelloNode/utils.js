var constants = require('./constants');
var xor = require('buffer-xor');
var ipaddr = require('ipaddr.js');


exports.getIpAddresses = function () {
   var os = require('os');

   var interfaces = os.networkInterfaces();
   var addresses = [];
   for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
         var address = interfaces[k][k2];
         if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
         }
      }
   }

   return addresses;
};

exports.getDistance = function (id1, id2) {
  
   var a = new Buffer(id1, 'hex')
   var b = new Buffer(id2, 'hex')

   return xor(a,b).readUInt8();
};


exports.convertIPv6ToIPv4 = function (ipv6Address) {

    if (ipaddr.IPv6.isValid(ipv6Address)) {
        var parsedAddress = ipaddr.parse(ipv6Address);
        return parsedAddress.toIPv4Address().toString();
    }
    //If it is an ipv4, simply return it
    else if (ipaddr.IPv4.isValid(ipv6Address)) {
        return ipv6Address;
    }
    else {
        return false;
    }
}