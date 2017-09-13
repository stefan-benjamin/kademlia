'use strict';

const constants = require('./constants');
const utils = require('./utils');
const bucket = require('./bucket');

class BucketManager {

    constructor(pCurrentNodeId) {
        this.buckets = new Map();
        this.buckets.values()
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
            this.buckets.get(appropriateBucket).set(nodeId, contact);
        }
        else {
            var tempBucket = new bucket();
            this.buckets.set(appropriateBucket, tempBucket);
        }
    }

    getClosestNodes(nodeId) {
        var distanceFromMeToTargetNode = utils.getDistance(nodeId, this.currentNodeId);

        var bucketNumber = Math.floor(Math.log2(distanceFromMeToTargetNode));

    }


}

module.exports = BucketManager;