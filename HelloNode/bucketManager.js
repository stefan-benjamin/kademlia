'use strict';

const constants = require('./constants');
const utils = require('./utils');
const bucket = require('./bucket');

class BucketManager {

    constructor(pCurrentNodeId) {
        this.buckets = new Map();
        this.currentNodeId = pCurrentNodeId;
    }

    _selectBucket(contactId) {
        var distance = utils.getDistance(this.currentNodeId, contactId);

        var x = 0;
        while (true) {
            if (Math.pow(2, x) <= distance && distance < Math.pow(2, x + 1)) {
                break;
            }
            x++;
        }

        return x;
    }

    receiveNode(nodeId, contact) {
        var appropriateBucket = this._selectBucket(nodeId);

        if (this.buckets.has(appropriateBucket)) {
            
        }
        else {
            var tempBucket = new bucket();
            this.buckets.set(appropriateBucket, tempBucket);
        }

        this.buckets.get(appropriateBucket).set(nodeId, contact);
    }

    getClosestNodes(nodeId) {
        var distanceFromMeToTargetNode = utils.getDistance(nodeId, this.currentNodeId);

        var bucketNumber = Math.floor(Math.log2(distanceFromMeToTargetNode));

    }

    getBuckets() {
       var result = [];
       //iterate through the buckets
       this.buckets.forEach(function (value, key, map) {
          var bucketNodesArray = [];
          value.forEach(function (value, key, map) {

             var nodeInfo = {};
             nodeInfo.nodeId = key;
             nodeInfo.ipAddress = value.ip;
             nodeInfo.port = value.port;

             bucketNodesArray.push(nodeInfo);
          })

          result.push(bucketNodesArray);
       })

       return result;
    }


}

module.exports = BucketManager;