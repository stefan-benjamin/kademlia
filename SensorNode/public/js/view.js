$(document).ready(function () {
   
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

   $('#envReadButton').click(function () {
      $.getJSON('/sensors/environment', null, function (resultData) {
         $("#resultDiv").empty().append(JSON.stringify(resultData));
      });
   });

});

