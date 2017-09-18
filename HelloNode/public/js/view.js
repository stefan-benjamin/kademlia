$(document).ready(function () {

   $("#nodeLookupButton").click(function () {
      console.log("Node lookup button clicked");

      var targetNodeId = $("#nodeIdInput").val();

      var queryData = { targetNodeId: targetNodeId}

      $.getJSON("/api/internal/nodelookup", queryData, function (resultData) {
         $("#resultDiv").empty().append(resultData.result);

      });

      

   });

});

