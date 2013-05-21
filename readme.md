#MozWebQA IRC Bot

This is an IRC bot that sits and monitors what is happening in the channel it is also good at trying to help users where it can!

## Starting the Bot
By default the bot is called "mozwebqabot" and it joins #mozwebqa. You can override these values by passing them on the command line.
The syntax is ```node bot.js [nick] \#[channel_name]```

Note that you must escape the #-sign in the channel name using a backslash.

## Deploying the bot to Heroku
For information on deploying the bot to Heroku, see https://devcenter.heroku.com/articles/nodejs

### Killing the process on Heroku
```heroku ps:scale web=0```
