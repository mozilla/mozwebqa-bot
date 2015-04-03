// Requires
var irc = require('irc'),
    http = require('http'),
    https = require('https'),
    users = require('./users.js'),
    secret = require('./secret.js');

// read nick, channel and Mongo uristring from command line arguments if they exist
var CHANNEL = (process.argv[3]) ? process.argv[3] : '#mozwebqa',
  NICK = (process.argv[2]) ? process.argv[2] : 'mozwebqabot',
  uristring = (process.argv[4]) ? process.argv[4] :
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/' + NICK + 'Db';

users.setUpMongo(uristring);

var ircServer = 'irc.mozilla.org',
    nick = NICK,
    options = {
      channels: [CHANNEL],
      autoConnect: true,
      autoRejoin: true,
      debug: true
    },
    client = new irc.Client(ircServer, nick, options),
    help = { ":help" : "This is Help! :)",
             ":gist" : "Gives you a link to Pastebin",
             ":yt" : "Pass in your search and I will give you a YouTube link",
             "Bugzilla" : "Just add bug xxxxxx to a conversation and it will show a summary of the bug",
             ":source" : "Returns the GitHub URL for me",
             ":list" : "Returns the URL to the group's mailing list",
             ":standup" : "Shows the details for the standup the team has twice a week",
             ":meeting" : "Shows details and a link to the meetings page",
             ":newissue" : "Just add :newissue project to a conversation and it will show a summary of the bug",
             ":github" : "Show a list of GitHub projects",
             ":getInvolved" : "Provide some information on getting involved in Web QA testing",
             ":trivia [number]" : "Show number-based trivia from numbersapi.com",
             ":year [year]" : "Show year-based trivia from numbersapi.com",
             ":date [day/month]" : "Show date-based trivia from numbersapi.com",
             ":today" : "Show date-based trivia from numbersapi.com"
           },
    source = 'https://github.com/mozilla/mozwebqa-bot',

    github = {
      "flightdeck": "mozilla/FlightDeck-selenium",
      "affiliates": "mozilla/Affiliates-Tests",
      "moztrap": "mozilla/moztrap-tests",
      "addons": "mozilla/Addon-Tests",
      "mdn": "mozilla/mdn-tests",
      "mcom": "mozilla/mcom-tests",
      "snippets": "mozilla/snippets-tests",
      "sumo": "mozilla/sumo-tests",
      "socorro": "mozilla/Socorro-Tests",
      "marketing-template": "mozilla/marketing-project-template",
      "templates": "mozilla/mozwebqa-test-templates",
      "qmo": "mozilla/qmo-tests",
      "wiki": "mozilla/wiki-tests",
      "bouncer": "mozilla/bouncer-tests",
      "marketplace": "mozilla/marketplace-tests",
      "bidpom": "mozilla/bidpom"
    };

secret.addins(client, NICK, CHANNEL);

client.addListener('join'+CHANNEL, function (nick) {
  if (nick === 'firebot' || nick === NICK) {
    return;
  }
  var joinMessage = "Welcome to "+CHANNEL+" "+nick+"! We love visitors! I am the resident channel robot and I can help you figure out how to get involved. Please visit https://wiki.mozilla.org/QA/Execution/Web_Testing/Mozwebqabot to learn more."
  users.logUser(nick);
  users.greetIfSeen(nick, joinMessage, client, CHANNEL);
});

client.addListener('message', function (from, to, message) {
  if (from === 'firebot' || from === NICK) {
    console.log("ignoring firebot");
    return;
  }

  console.log(from + ' => ' + to + ': ' + message);
  if (message.search(nick) >= 0){
    if (message.search(/ hi[ $]?/i) >= 1){
      client.say(to, "Hi hi " + from);
    }
    if (message.search(/damn you/i) >= 0) {
      client.say(to, "I am so sorry " + from + ", can we hug?");
    }
    if (message.search(/pew pew/i) >= 0) {
      client.say(to, "Ouch! Damn you, " + from + "!");
    }
  }

  if (message.search(/:welcome/i) === 0){
    client.say(to, "Welcome to the Mozilla Web QA IRC channel. We love visitors! Please say hi and let us know how we can help you help us.");
  }

  if (message.search(/:getinvolved/i) === 0){
    client.say(to, "Hey " + from + " that's awesome that you'd like to get involved. Please tell me, are you interested in :Manual or :Automated testing.");
  }

  if (message.search(/:automated/i) === 0){
    client.say(to, "Very cool, " + from + ", I love automated testing too! You can find out more at https://quality.mozilla.org/teams/web-qa/#Automated, or just ask a question here.");
  }

  if (message.search(/:manual/i) === 0){
    client.say(to, "Very cool, " + from + ", I love manual testing too! You can find out more at https://quality.mozilla.org/teams/web-qa/#Manual, or just ask a question here.");
  }

  if (message.search(/:gist/i) === 0){
    client.say(to, "Please paste >3 lines of text to http://pastebin.mozilla.org");
  }

  if (message.search(/:help/i) === 0){
    for (var item in help){
      client.say(from, item + " : " + help[item]);
    }
  }

  if (message.search(/:yt/i) === 0){
    var options = {
        host: 'gdata.youtube.com',
        port: 443,
        path: "/feeds/api/videos?q=" + message.substring(4).replace(/ /g, '+') + "&alt=json",
        method: 'GET'
    };
    var req = https.request(options, function(res) {
      var apiResult = '';
          
      res.on('data', function(d) {
        apiResult += d;
      });
      res.on('end', function(){
        try{
          data = JSON.parse(apiResult);
          title = data["feed"]["entry"][0]["title"]["$t"]
          link = data["feed"]["entry"][0]["link"][0]["href"];
          client.say(to, title + " -- " + link);
        } catch(e) {
          console.error(e.message);
        }
      });
    });
    req.end();
  }

  if (message.search(/bug \d+/i) >= 0 || message.search(/https:\/\/bugzilla.mozilla.org\/show_bug.cgi\?id=(\d+)/i) >= 0 ){
    var bugID = "";
    if (/bug (\d+)/i.exec(message)) {
      bugID = /bug (\d+)/i.exec(message)[1]
    } else {
      bugID = /https:\/\/bugzilla.mozilla.org\/show_bug.cgi\?id=(\d+)/i.exec(message)[1];
    }

    var options = {
        host: 'api-dev.bugzilla.mozilla.org',
        port: 443,
        path: "/latest/bug?id=" + bugID,
        method: 'GET'
    };
    var apiResult = ''
    var req = https.request(options, function(res) {
      res.on('data', function(d) {
      apiResult += d; 
      });
            
      res.on('end', function(){
        var returnMessage = '';
        try{
          data = JSON.parse(apiResult);
          url = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugID;
          if (data["bugs"].length === 0){
            returnMessage = "I cannot see this bug, try clicking on " + url + " to see if it exists";
            client.say(to, returnMessage);
            return;
          }
          summary = data["bugs"]["0"]["summary"];
          severity = data["bugs"]["0"]["severity"];
          status = data["bugs"]["0"]["status"];
          resolution = data["bugs"]["0"]["resolution"];
          returnMessage = "Bug " + url + " " + severity + ", " + status + " " + resolution + ", " + summary;
          client.say(to, returnMessage);
        }catch(e){
          console.error(e);            
        }
      });
    });

    req.on('error', function (error) {
      console.error(error);
      client.say(to, "Unfortunately, there was an error trying to retrieve that bug, please try again. If this happens again, please ping :AutomatedTester");
    });

    req.end();
  }

  if (message.search(/:source/i) === 0){
    client.say(to, 'My details and code lives at ' + source + '. Go have a look!');
  }

  if (message.search(/:list/i) === 0){
    client.say(to, 'mozwebqa mailing list https://mail.mozilla.org/listinfo/mozwebqa');
  }

  if (message.search(/:meeting/i) === 0){
    client.say(to, "Come join us at 9AM PDT/PST on a Thursday. You can join in with Vidyo at https://v.mozilla.com/flex.html?roomdirect.html&key=ZAlDIwL9AJcf or dial in 650-903-0800 or 650-215-1282 x92 Conf #9303 (US/INTL) or 1-800-707-2533 (pin 369) Conf #9303 (US)");
  }

  if (message.search(/:newissue/i) >= 0){
    var project = /:newissue ([a-z-_]+)/.exec(message);
    if (project !== null){
      if (project[1] in github){
        client.say(to, "Please raise an issue at https://github.com/" + github[project[1]] + "/issues/new");
      } else {
        client.say(to, "Sorry, I don't know of that project. Please raise an issue at " + source + '/issues/new/ if I should know about it!');
      }
    } else {
      client.say(to, "Please use the syntax :newissue project. You can get a list of projects by calling :github");
    }
  }

  if (message.search(/:issues/i) >= 0){
    var project = /:issues ([a-z-_]+)/.exec(message);
    if (project !== null){
      var key = to.substring(1).toLowerCase();
      console.log(key);
      if (github[key] && github[key][project[1]]){
        client.say(to, "Issues for " + project[1] +  " can be found at " + github[key][project[1]] + "/issues");
      } else {
        client.say(to, "Sorry, I don't know of that project. Please raise an issue on " +
            source + "/issues/new if I should know about it");
      }
    } else {
      client.say(to, "Please use the syntax :issues project. You can get a list of projects by calling :github");
    }
  }

  if (message.search(/:github/i) === 0){
    for (var item in github){
      client.say(from, item + ": https://github.com/" + github[item]);
    }
  }

  if (message.search(/:trivia/i) === 0) {
    var number = message.indexOf(' ') !== -1 ? message.split(' ')[1] : 'random';
    respond(to, 'trivia', number);
  }

  if (message.search(/:year/i) === 0) {
    var number = message.indexOf(' ') !== -1  ? message.split(' ')[1] : 'random';
    respond(to, 'year', number);
  }

  if (message.search(/:date/i) === 0) {
    var number = message.indexOf(' ') !== -1  ? message.split(' ')[1] : 'random';
    respond(to, 'date', number);
  }

  if (message.search(/:today/i) === 0) {
    var now = new Date();
    month = now.getMonth() + 1;
    day = now.getDate();
    respond(to, 'date', month + '/' + day);
  }
});

client.addListener('error', function(message) {
  console.log('error: ', message);
});

function respond(to, type, number) {
  if (number !== 'random') {
    if (type === 'date') {
      date = number.split('/');
      if (date.length !== 2 || isNaN(date[0]) || isNaN(date[1])) {
        client.say(to, "That's not a valid date! Try again with the format :" + type + ' month/day');
        return;
      }
    } else if (isNaN(number)) {
      client.say(to, "That's not a valid number! Try again with the format :" + type + ' number');
      return;
    }
  }
  options = {
    host: 'numbersapi.com',
    port: 80,
    path: '/' + number + '/' + type,
    headers: { 'content-type': 'application/json' },
    method: 'GET'
  };
  var req = http.request(options, function(res) {
    var apiResult = '';
    res.on('data', function(chunk) {
      apiResult += chunk;
    });
    res.on('end', function() {
      try {
        data = JSON.parse(apiResult);
        text = data['text'];
        client.say(to, text + ' (http://numbersapi.com)');
      } catch(e) {
        console.error(e.message);
      }
    });
  });
  req.end();
}

//make server to keep heroku happy
https.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('IRC bot at '+CHANNEL+' on irc.mozilla.org\n');
}).listen(process.env.PORT||8080);
