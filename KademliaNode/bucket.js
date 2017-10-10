'use strict';

const constants = require('./constants');
const utils = require('./utils');
var restClient = require('./restClient');

//HEAD - end of the map (right side)
//TAIL - start of the map (left side)

class Bucket extends Map {
  
   set(nodeId, contact) {
      if (this.has(nodeId))
      {
         super.delete(nodeId);
         super.set(nodeId, contact); //setting at the end of the map (HEAD)
      }
      else
      {
         if (this.size < constants.K) //the bucket is not full
         {
            super.set(nodeId, contact); //setting at the end of the map (HEAD)
         }
         else //bucket is full so we need to decide if to kick a contact
         {
            var self = this;

            //ping the oldest contact in the bucket (TAIL)
            var oldestContactKey = this.keys().next().value;
            var oldestContactValue = this.get(oldestContactKey);
            
            restClient.ping(oldestContactValue.ip, oldestContactValue.port, function () {
               //if ping is successful - move this contact to head and ignore the newly arrived contact
               self.delete(oldestContactKey);
               self.set(oldestContactKey, oldestContactValue);

            }, function () {
               //if ping fails - remove this contact (from tail) and add the new contact (at head)
               self.delete(oldestContactKey);
               self.set(nodeId, contact)
            })
         }
      }
   }

   getFull(nodeId)
   {
      return { nodeId: nodeId, ipAddress: super.get(nodeId).ip, port: super.get(nodeId).port }
   }

   toJson() {
      
      var bucketNodesArray = [];
      this.forEach(function (value, key, map) {

         var nodeInfo = {};
         nodeInfo.nodeId = key;
         nodeInfo.ipAddress = value.ip;
         nodeInfo.port = value.port;

         bucketNodesArray.push(nodeInfo);
      })
      
      return bucketNodesArray;
   }
}

module.exports = Bucket;