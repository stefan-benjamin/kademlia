$(document).ready(function () {

   $("#nodeLookupButton").click(function () {
      console.log("Node lookup button clicked");

      var targetNodeId = $("#nodeIdInput").val();

      var queryData = { targetNodeId: targetNodeId}

      $.getJSON("/api/internal/nodelookup", queryData, function (resultData) {
         $("#resultDiv").empty().append(JSON.stringify(resultData.result));

      });

      

   });

   
   $('#ledOffButton').click(function () {
      var data = { value: 0 };
      $.post('/actuators/led', data, function (resp) {
         
      });
   });

   $('#ledOnButton').click(function () {
      var data = { value: 1 };
      $.post('/actuators/led', data, function (resp) {

      });
   });

});

