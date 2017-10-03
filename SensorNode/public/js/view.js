$(document).ready(function () {
   
   $('#ledOffButton').click(function () {
      sendLedChangeRequest(0);
   });

   $('#ledOnButton').click(function () {
      sendLedChangeRequest(1);
   });

   $('#envReadButton').click(function () {
      $.getJSON('/sensors/environment', null, function (resultData) {
         $("#resultDiv").empty().append(JSON.stringify(resultData));
      });
   });

   function sendLedChangeRequest(value)
   {
      var data = { value: value };

      $.ajax({
         url: '/actuators/led',
         method: 'PUT',
         data: JSON.stringify(data),
         contentType: 'application/json',
         success: function (result) {
            // handle success
         },
         error: function (request, msg, error) {
            // handle failure
         }
      });
   }

});

