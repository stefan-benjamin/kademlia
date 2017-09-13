'use strict';

const constants = require('./constants');
const utils = require('./utils');

//HEAD - end of the map (right side)
//TAIL - start of the map (left side)

class Bucket extends Map {
  
   set(nodeId, contact) {
      if (this.has(nodeId)) {
         super.delete(nodeId);
         super.set(nodeId, contact); //setting at the end of the map (HEAD)
      } else if (this.size < constants.K) { //if the bucket is not full
         let bucketEntries = [...this.entries()]; //save existing entries

         super.clear(); 
         super.set(nodeId, contact); //add the new element - at the TAIL

         for (let [nodeId, contact] of bucketEntries) { //add all the already existing elements again
            super.set(nodeId, contact);
         }
      }
   }
}

module.exports = Bucket;