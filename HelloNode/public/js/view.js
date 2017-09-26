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

       $.post('/api/store', key, value, function (resp) {
           $("#storeResultDiv").empty().append(resp)
       });
   });

});

