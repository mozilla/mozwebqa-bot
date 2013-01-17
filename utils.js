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

setInterval(function(){
  exports.joined=[]
}, 604800000)//one week
