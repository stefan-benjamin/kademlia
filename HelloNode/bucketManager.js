'use strict';

const constants = require('./constants');
var globals = require('./globals');
const utils = require('./utils');
const bucket = require('./bucket');

class BucketManager {

    constructor() {
        this.buckets = new Map();
    }

    _selectBucketForInserting(contactId) {
       var distance = utils.getDistance(globals.nodeId, contactId);

       if (distance <= 0) {
           return constants.ERROR_SELECT_BUCKET_DISTANCE_IS_ZERO;
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

    _selectBucketForReading(nodeIdOfCurrentNode) {
        var distanceFromMeToTargetNode = utils.getDistance(nodeIdOfCurrentNode, globals.nodeId);
        var bucketIndex = -1;

        if (this.buckets.has(bucketIndex)) {
            bucketIndex = Math.floor(Math.log2(distanceFromMeToTargetNode));
        }
        else {
            var offset = 1;

            while (offset <= constants.BUCKET_NEIGHBOUR_SEARCH_RANGE) {

                var rightOfBucket = bucketIndex + offset;
                var leftOfBucket = bucketIndex - offset;

                if (this.buckets.has(rightOfBucket)) {
                    bucketIndex = rightOfBucket;
                    break;
                }
                else if (leftOfBucket > 0 && this.buckets.has(leftOfBucket)) {
                    bucketIndex = leftOfBucket;
                    break;
                }

                offset++;
            }
        }

        return bucketIndex;
    }

    _getTargetNodeElseGetBucketWithClosestNodes(nodeId, bucketIndex) {
        var bucketWithClosestNodes = this.buckets.get(bucketIndex);

        result = {};

        if (bucketWithClosestNodes.has(nodeId)) {
            result.returnType = constants.GET_CLOSEST_NODE_FOUND_THE_NODE;
            result.content = bucketWithClosestNodes.get(nodeId);
        }
        else {
            result.returnType = constants.GET_CLOSEST_NODE_FOUND_A_BUCKET;
            result.content = bucketWithClosestNodes;
        }

        return result;
    }


    receiveNode(nodeId, contact) {
        var appropriateBucket = this._selectBucketForInserting(nodeId);

        if (appropriateBucket === constants.ERROR_SELECT_BUCKET_DISTANCE_IS_ZERO) {
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
        //var distanceFromMeToTargetNode = utils.getDistance(nodeId, globals.nodeId);
        //var bucketIndex = Math.floor(Math.log2(distanceFromMeToTargetNode));

        //var result = { returnType: constants.GET_CLOSEST_NODE_FOUND_NOTHING, content: {} };


        //if (this.buckets.has(bucketIndex)) {
        //    result = this._getTargetNodeElseGetBucketWithClosestNodes(nodeId, bucketIndex);
        //}
        //else {
        //    //try looking to the left and right of the current bucket index and see if we find a bucket
        //    var offset = 1;

        //    while (offset <= constants.BUCKET_NEIGHBOUR_SEARCH_RANGE) {
                
        //        var rightOfBucket = bucketIndex + offset;
        //        var leftOfBucket = bucketIndex - offset;

        //        if (this.buckets.has(rightOfBucket)) {
        //            result.content = this.buckets.get(rightOfBucket);
        //            break;
        //        }
        //        else if (leftOfBucket > 0 && this.buckets.has(leftOfBucket)) {
        //            result.content = this.buckets.get(leftOfBucket);
        //            break;
        //        }

        //        offset++;
        //    }

        //}

        var result = { returnType: constants.GET_CLOSEST_NODE_FOUND_NOTHING, content: {} };

        var bucketIndex = this._selectBucketForReading(nodeId);

        result = this._getTargetNodeElseGetBucketWithClosestNodes(nodeId, bucketIndex);

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