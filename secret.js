exports.addins = function(client, NICK){
  client.addListener('message', function (from, to, message) {
    if (from === 'firebot' || from === NICK) {
      console.log("ignoring firebot");
      return;
    }

    // put secret stuff here
  });

}
