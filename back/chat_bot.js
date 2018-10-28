var tmi = require("tmi.js");
var test_emotes = ["monkaS", "Keepo", "Kappa", "PogChamp", "4Head", "LUL"];
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
  console.log(msg_arr);
  return msg_arr.some(word => word.includes(phrase));
}

module.exports = function({ dbContext, localCache, triggers }) {
  dbContext.getAll();
  // creates and connects the bot
  var client = new tmi.client(options);
  client.connect();

  client.on("connected", function(address, port) {
    client.action(targetChannel, "Hello, it's boba bot! I have connected!");
  });

  // responds to messages
  client.on("chat", function(channelName, user, message, self) {
    if (self) return;
    const channelId = user["room-id"];
    if (!localCache.train[channelId]) {
      console.log("Setup train cache " + channelId);
      localCache.train[channelId] = {
        emote: null,
        passengers: [],
        count: 0,
        trainLength: 0
      };
    }
    if (localCache.train[channelId].emote !== null) {
      contains_phrase = parseMsgForPhrase(message, test_emotes[localCache.train[channelId].emote]);
      if (contains_phrase) {
        console.log("Phrase found!");
        localCache.train[channelId].count++;
        if (localCache.train[channelId].count / 20 >localCache.train[channelId].trainLength) {
          triggers.lengthenTrainTrigger(channelId);
          localCache.train[channelId].trainLength++;
        }
        passengers = localCache.train[channelId].passengers;
        if (!passengers.includes(user["user-id"])) {
          passengers.push(user["user-id"]);
          dbContext.gainExp(user["user-id"]);
        }
      }
    }
  });

  return client;
};
