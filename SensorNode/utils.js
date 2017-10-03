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

exports.createHash = function (inputText) {
    var crypto = require('crypto');
    var cryptoObject = crypto.createHash('sha1');
    cryptoObject.update(inputText);
    return cryptoObject.digest("hex").substr(0, 10);
};