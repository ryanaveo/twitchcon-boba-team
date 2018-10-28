var tmi = require('tmi.js');

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
    channels: ["kyoushiiiro"]
};

// creates and connects the bot
var client = new tmi.client(options);
client.connect();

client.on('connected', function(address, port) {
    client.action("kyoushiiiro", "Hello, it's boba bot!");
});

// responds to messages
client.on('chat', function(channel, user, message, self) {
    if(message === "!twitch") {
        client.action("kyoushiiiro", "twitch.tv/kyoushiiiro");
    }
    else {
        client.action("kyoushiiiro", user['display-name'] + " is awesome!");
    }
});
