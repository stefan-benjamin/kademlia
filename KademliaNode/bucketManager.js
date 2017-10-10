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

        if (distanceFromMeToTargetNode === 0) {
            var bucketIndex = 0;
        }
        else {
            var bucketIndex = Math.floor(Math.log2(distanceFromMeToTargetNode));
        }
        

        if (!this.buckets.has(bucketIndex)) {
           this.buckets.set(bucketIndex, new bucket());
        }
      
        return bucketIndex;
    }

    _getTargetNodeElseGetBucketWithClosestNodes(nodeId, bucketIndex) {

        //if (typeof this.buckets.get(bucketIndex) === 'undefined') {
        //    return { returnType: constants.GET_CLOSEST_NODE_FOUND_NOTHING };
        //}

        var bucketWithClosestNodes = this.buckets.get(bucketIndex);

        var result = {};

        if (bucketWithClosestNodes.has(nodeId)) {
            result.returnType = constants.GET_CLOSEST_NODE_FOUND_THE_NODE;
            result.content = bucketWithClosestNodes.getFull(nodeId);
        }
        else {
            result.returnType = constants.GET_CLOSEST_NODE_FOUND_A_BUCKET;
            //result.content = bucketWithClosestNodes.toJson();


           //if bucketWithClosestNodes.length == k return it.
           //otherwise create a new tempBucket and add the elements from bucketWithClosestNodes.
           //also start loooking left and right from the index to try to fill this tempbucket with k elements.

            var tempBucket = new bucket();
            bucketWithClosestNodes.toJson().forEach(function (element) {
               tempBucket.set(element.nodeId, { ip: element.ipAddress, port: element.port });
            });

            if (tempBucket.size < constants.K)
            {
               var offset = 1;

               while (offset <= constants.BUCKET_NEIGHBOUR_SEARCH_RANGE) {

                  var rightOfBucket = bucketIndex + offset;
                  var leftOfBucket = bucketIndex - offset;

                  if (this.buckets.has(rightOfBucket)) {

                     this.buckets.get(rightOfBucket).toJson().forEach(function (element) {
                        if (tempBucket.size < constants.K) {
                           tempBucket.set(element.nodeId, { ip: element.ipAddress, port: element.port });
                        }
                        else {
                           
                        }
                     });
                  }
                  if (this.buckets.has(leftOfBucket)) {

                     this.buckets.get(leftOfBucket).toJson().forEach(function (element) {
                        if (tempBucket.size < constants.K) {
                           tempBucket.set(element.nodeId, { ip: element.ipAddress, port: element.port });
                        }
                        else {
                           
                        }
                     });
                  }

                  offset++;
               }

            }

            result.content = tempBucket.toJson();
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
        var result = { returnType: constants.GET_CLOSEST_NODE_FOUND_NOTHING, content: {} };

        var bucketIndex = this._selectBucketForReading(nodeId);

        result = this._getTargetNodeElseGetBucketWithClosestNodes(nodeId, bucketIndex);

        return result;
    }

    getBuckets() {
        var result = [];
        var self = this;
        //iterate through the buckets
        this.buckets.forEach(function (value, key, map) {
            var bucketJson = value.toJson();

            result.push({ key: key, nodes: bucketJson });
        })

        return result;
    }
}

module.exports = BucketManager;