var mongoose = require ('mongoose') // MongoDB driver

exports.teamMembers = ['bebe', 'alint', 'andrei', 'teodosia', 'andreih',
  'bsilverberg', 'davehunt', 'krupa', 'mbrandt', 'retornam', 'rbillings', 'stephend', 'zac'];
exports.regulars = ['klrmn', 'automatedtester'];
exports.ignoreSeen = exports.teamMembers.concat(exports.regulars);

exports.shortNick = function(nick) {
  return nick.match(/[^|]*/).toString().toLowerCase();
}

exports.setUpMongo = function(uristring) {

  var mongoOptions = { db: { safe: true }};

  // Makes connection asynchronously. Mongoose will queue up database
  // operations and release them when the connection is complete.
  mongoose.connect(uristring, mongoOptions, function (err, res) {
    if (err) {
      console.log ('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
      console.log ('Succeeded connected to: ' + uristring);
    }
  });

  // Specify the user schema
  var userSchema = new mongoose.Schema({
    nick: String,
    lastSeen: Date
  });

  User = mongoose.model('Users', userSchema);
}

exports.logUser = function(nick) {
  nick = exports.shortNick(nick);
  User.findOne( { nick : nick } , function (err, user) {
    if (err) {
      console.log(err);
      return;
    } else {
      if (user) {
        user.lastSeen = new Date();
        user.save();
        console.log('%s was seen again at: %s.', user.nick, user.lastSeen);
      } else {
        var dateAdded = new Date();
        var newUser = new User ({
          nick: nick,
          lastSeen: dateAdded
        });
        newUser.save();
        console.log('%s was added at: %s.', nick, dateAdded);
      }
    }
  });
}

exports.greetIfSeen = function(nick, joinMessage, client, channel){
  nick = exports.shortNick(nick);
  if (exports.teamMembers.indexOf(nick) != -1) {
    return;
  }
  var now = new Date();
  User.findOne( {  nick : nick, lastSeen : { $gt : now.setDate(now.getDate() - 7) } } , function (err, user) {
    if (err) {
      console.log(err);
      return;
    }
    if (user) {
      console.log('%s was last seen at %s.', user.nick, user.lastSeen);
    } else {
      console.log('%s has not been seen within the past week.', nick);
      client.say(channel, joinMessage);
    }
  });
}
