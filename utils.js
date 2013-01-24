var fs = require('fs');

exports.joined = []
exports.moderators = {}

exports.seen = function(nick){
  for (i in exports.joined){
    if (exports.joined[i]==nick){
      return true;
    }
  }
  return false;
}

exports.tell_moderators = function(message,client){
  for (nick in exports.moderators){
    if (exports.moderators[nick]){
      client.say(nick, message);
    }
  }
}

exports.save_seen = function(json){
  var joined_users_object = {
    joined: json || exports.joined
  };
  fs.writeFile("joined.json", JSON.stringify(joined_users_object), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Joined users updated successfully!");
    }
  });
}

exports.load_seen = function(){
  fs.readFile('joined.json', function (err, data) {
    if (err) {
      console.log(err);
    } else {
      var json_object = JSON.parse(data);
      exports.joined = json_object.joined;
      console.log("Joined users loaded successfully!");
    }
  });
}

exports.delete_seen = function(){
  fs.unlink('joined.json', function (err) {
    if (err) {
      console.log(err);
    }
    console.log('Joined users deleted successfully!');
  });
}

setInterval(function(){
  exports.joined=[]
  exports.delete_seen();
}, 604800000)//one week
