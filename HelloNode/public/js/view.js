$(document).ready(function () {

   $("#nodeLookupButton").click(function () {
      console.log("Node lookup button clicked");
   
      var queryData = {targetNodeId : 1234}

      $.getJSON("/api/internal/nodelookup", queryData, function (resultData) {
         $("#resultDiv").empty().append(resultData.result);

      });

      

   });

});

