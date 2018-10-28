const fs = require("fs");
const Hapi = require("hapi");
const path = require("path");
const request = require("request");
const config = require("config");
const mongoose = require("mongoose");

const Viewer = require("./models/Viewer");
const jwtInitialiser = require("./jwt.js");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Configuration
const MONGO_USER = config.get("Database.user");
const MONGO_PASSWORD = config.get("Database.password");
const CLIENT_ID = config.get("twitch.clientId");
const USER_ID = config.get("twitch.userId");
const SECRET = Buffer.from(config.get("twitch.secret"), "base64");
const DBurl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@ds143683.mlab.com:43683/twitchcon`;
const STRINGS = require("./const.js");

const JWT = jwtInitialiser(USER_ID, SECRET);
mongoose.connect(DBurl);

const server = new Hapi.Server({
  host: "localhost",
  port: 8081,
  tls: {
    // If you need a certificate, execute "npm run cert".
    key: fs.readFileSync(path.resolve(__dirname, "conf", "server.key")),
    cert: fs.readFileSync(path.resolve(__dirname, "conf", "server.crt"))
  },
  routes: {
    cors: {
      origin: ["*"]
    }
  }
});

function userQueryHandler(req) {
  const payload = JWT.verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  const userExp = getExpFromDatabase(opaqueUserId);
  const userLevel = getLevelFromDatabase(opaqueUserId);

  verboseLog(STRINGS.sendUserInfo, userExp, userLevel, opaqueUserId);
  return { userExp, userLevel };
}

function hypeHandler(req) {
  if (req.payload.action === "start") {
    return sendPubSubMsg(
      {
        message: "StartHypeTrain",
        targets: ["broadcast"]
      },
      req.payload.channelId
    );
  }

  if (req.payload.action === "stop") {
    return sendPubSubMsg(
      {
        message: "StartHypeTrain",
        targets: ["broadcast"]
      },
      req.payload.channelId
    );
  }
}

function sendPubSubMsg(msg, channelId) {
  // Set the HTTP headers required by the Twitch API.
  const headers = {
    "Client-Id": CLIENT_ID,
    "Content-Type": "application/json",
    Authorization: JWT.makeServerChannelToken(channelId)
  };
  console.log(headers.Authorization)
  // Create the POST body for the Twitch API request.
  const mergedMsg = Object.assign(
    {},
    {
      content_type: "application/json",
      message: "Hello",
      targets: ["broadcast"]
    },
    msg
  );

  const body = JSON.stringify(mergedMsg);

  // Send the broadcast request to the Twitch API.
  const API_HOST = "api.twitch.tv";
  return new Promise((resolve, reject) => {
    request(
      `https://${API_HOST}/extensions/message/${channelId}`,
      {
        method: "POST",
        headers,
        body
      },
      (err, res) => {
        if (err) {
          console.log(STRINGS.messageSendError, channelId, err);
          reject("ERR", err);
        }
        console.log(res.statusCode, "SUCCESS");
        resolve("OK", res.payload);
      }
    );
  });
}

function getSecrets() {
  // Set the HTTP headers required by the Twitch API.
  const headers = {
    "Client-ID": CLIENT_ID,
    "Content-Type": "application/json",
    Authorization: JWT.makeServerToken()
  };

  console.log(headers.Authorization)

  // Send the broadcast request to the Twitch API.
  const API_HOST = "api.twitch.tv";
  return new Promise((resolve, reject) => {
    request(
      `https://${API_HOST}/extensions/${CLIENT_ID}/auth/secret`,
      {
        method: "GET",
        headers
      },
      (err, res) => {
        if (err) {
          console.log(err);
          reject("ERR");
        }
        console.log(res.statusCode, "SUCCESS");
        resolve(res.payload || res.statusCode);
      }
    );
  });
}

(async () => {
  // Basic test route
  server.route({
    method: "GET",
    path: "/",
    handler: () => {
      console.log("hello");
      return "OK";
    }
  });

  // Handle a broadcaster requesting to manage hype train
  server.route({
    method: "POST",
    path: "/hype",
    handler: hypeHandler
  });

  // Handle a viewer requesting their user info
  server.route({
    method: "GET",
    path: "/user/query",
    handler: userQueryHandler
  });

  server.route({
    method: "GET",
    path: "/secrets",
    handler: getSecrets
  });

  // Start the server.
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);
})();
