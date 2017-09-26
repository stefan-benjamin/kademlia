$(document).ready(function () {

   $("#nodeLookupButton").click(function () {
      console.log("Node lookup button clicked");

      var targetNodeId = $("#nodeIdInput").val();

      var queryData = { targetNodeId: targetNodeId}

      $.getJSON("/api/internal/nodelookup", queryData, function (resultData) {
         $("#resultDiv").empty().append(JSON.stringify(resultData.result));

      });
    });

   $("#storeButton").click(function () {
       console.log("Store button clicked");

       var key = $("#keyInput").val();

       var value = $("#valueInput").val();

       var queryData = { senderId: null, forward: true, key: key, value: value }

       $.post('/api/store', queryData, function (resp) {
           $("#storeResultDiv").empty().append(resp)
       });
   });

});

