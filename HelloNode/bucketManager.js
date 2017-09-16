'use strict';

const constants = require('./constants');
var globals = require('./globals');
const utils = require('./utils');
const bucket = require('./bucket');

class BucketManager {

    constructor() {
        this.buckets = new Map();
        this.DISTANCE_IS_ZERO = "ERR1001";
    }

    _selectBucket(contactId) {
       var distance = utils.getDistance(globals.nodeId, contactId);

       if (distance <= 0) {
           return this.DISTANCE_IS_ZERO;
       }

        var x = 0;
        while (true) {
            if (Math.pow(2, x) <= distance && distance < Math.pow(2, x + 1)) {
                break;
            }
            x++;
        }

        return x;
    }

    _getKNodesFromNeighbourBuckets(bucketIndex) {

    }

    receiveNode(nodeId, contact) {
        var appropriateBucket = this._selectBucket(nodeId);

        if (appropriateBucket === this.DISTANCE_IS_ZERO) {
            console.log("WARNING: Unable to add myself to a bucket.");
            return false;
        }

        if (!this.buckets.has(appropriateBucket)) {
           var tempBucket = new bucket();
           this.buckets.set(appropriateBucket, tempBucket);
        }
       
        this.buckets.get(appropriateBucket).set(nodeId, contact);
    }

    getClosestNodes(nodeId) {
        var distanceFromMeToTargetNode = utils.getDistance(nodeId, globals.nodeId);
        var bucketIndex = Math.floor(Math.log2(distanceFromMeToTargetNode));

        var result = {};


        if (this.buckets.has(bucketIndex)) {
            result.bucket = this.buckets.get(bucketIndex);
        }
        else {
            //try looking to the left and right of the current bucket index and see if we find a bucket
            var offset = 1;

            while (offset <= constants.BUCKET_NEIGHBOUR_SEARCH_RANGE) {
                
                var rightOfBucket = bucketIndex + offset;
                var leftOfBucket = bucketIndex - offset;

                if (this.buckets.has(rightOfBucket)) {
                    result.bucket = this.buckets.get(rightOfBucket);
                    break;
                }
                else if (leftOfBucket > 0 && this.buckets.has(leftOfBucket)) {
                    result.bucket = this.buckets.get(leftOfBucket);
                    break;
                }

                offset++;
            }

        }

        return result;

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

          var bucketResult = { key: key, nodes: bucketNodesArray }

          result.push(bucketResult);
       })

       return result;
    }


}

module.exports = BucketManager;