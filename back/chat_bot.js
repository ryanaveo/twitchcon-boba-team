var tmi = require('tmi.js');
var hypeTrainPassengers = [];
var hypeTrainOn = true;
var phrase = "test_phrase";

var targetChannel = "kyoushiiiro";

// default settings, don't see a reason to change these
var options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    // the bot account
    identity: {
        username: "BobaBoisBot",
        password: "oauth:aaaaqyhnqu93o3mo194p89wd27ahft"
    },
    // the channel the bot will troll
    channels: [targetChannel]
};

// creates and connects the bot
var client = new tmi.client(options);
client.connect();

client.on('connected', function(address, port) {
    client.action(targetChannel, "Hello, it's boba bot!");
});

// responds to messages
client.on('chat', function(channel, user, message, self) {
    /*
    if(message === "!twitch") {
        client.action(targetChannel, "twitch.tv/kyoushiiiro");
    }
    else {
        client.action(targetChannel, user['display-name'] + " is awesome!");
    }
    */

    if(hypeTrainOn && message == phrase) {
        // talk to database to add exp to user
        hypeTrainPassengers.push(user['user-id']);
        client.action(targetChannel, hypeTrainPassengers);
    }
});
