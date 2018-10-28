var tmi = require('tmi.js');
var test_emotes = ['Keepo', 'Kappa', 'PogChamp', '4Head', 'LUL'];
var curr_emote = 0;

var hypeTrainPassengers = [];
var hypeTrainOn = true;
var phrase = test_emotes[curr_emote];

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
    client.action(targetChannel, "Hello, it's boba bot! I have connected!");
});

// responds to messages
client.on('chat', function(channel, user, message, self) {
    if(hypeTrainOn) {
        contains_phrase = parseMsgForPhrase(message);
        if(contains_phrase) {
            if (!hypeTrainPassengers.includes(user['user-id'])) {
                hypeTrainPassengers.push(user['user-id']);
            }
            //TODO
            // talk to database to add exp to user

            client.action(targetChannel, phrase)

            curr_emote = (curr_emote + 1) % test_emotes.length;
            phrase = test_emotes[curr_emote];
        }
    }
});

function parseMsgForPhrase(msg) {
    var msg_arr = msg.split(" ");
    var num_words = msg_arr.length;
    
    for(let i=0; i<num_words; i++) {
        if (msg_arr[i] == phrase) {
            return true;
        }
    }
    return false
}
