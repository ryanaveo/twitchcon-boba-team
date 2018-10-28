var tmi = require("tmi.js");
var test_emotes = ["monkaS","Keepo", "Kappa", "PogChamp", "4Head", "LUL"];
var curr_emote = 0;

var phrase = test_emotes[curr_emote];

var targetChannel = "snowypowers";

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

function parseMsgForPhrase(msg, phrase) {
  var msg_arr = msg.split(" ");
  return msg_arr.some(word => phrase === word);
}

module.exports = function({ dbContext, localCache, triggers }) {
  // creates and connects the bot
  var client = new tmi.client(options);
  client.connect();

  client.on("connected", function(address, port) {
    client.action(targetChannel, "Hello, it's boba bot! I have connected!");
  });

  // responds to messages
  client.on("chat", function(channel, user, message, self) {
    if (!localCache.train[channel]) {
      localCache.train[channel] = {
        emote: null,
        passengers: [],
        count: 0,
        trainLength: 0
      };
    }
    if (localCache.train[channel].emote !== null) {
      contains_phrase = parseMsgForPhrase(test_emotes[emote]);
      if (contains_phrase) {
        localCache.train[channel].count++;
        if (localCache.train[channel].count / 20 > trainLength) {
          triggers.lengthenTrainTrigger(channel);
          localCache.train[channel].trainLength++;
        }
        passengers = localCache.train[channel].passengers;
        if (!passengers.includes(user["user-id"])) {
          passengers.push(user["user-id"]);
          dbContext.gainExp(user["user-id"]);
        }

        client.action(targetChannel, phrase);

        curr_emote = (curr_emote + 1) % test_emotes.length;
        phrase = test_emotes[curr_emote];
      }
    }
  });

  return client;
};
