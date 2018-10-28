/**
 *    Copyright 2018 Amazon.com, Inc. or its affiliates
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const fs = require('fs');
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const color = require('color');
const ext = require('commander');
const jwt = require('jsonwebtoken');
const request = require('request');
const mongoose = require("mongoose");
const DBurl = "mongodb://" + config.get("Database.user") + ":" + config.get("Database.password") + "@ds143683.mlab.com:43683/twitchcon";
mongoose.connect("mongodb://boba:twitchcon2018@ds143683.mlab.com:43683/twitchcon");

// The developer rig uses self-signed certificates.  Node doesn't accept them
// by default.  Do not use this in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use verbose logging during development.  Set this to false for production.
const verboseLogging = true;
const verboseLog = verboseLogging ? console.log.bind(console) : () => { };

// Service state variables
const serverTokenDurationSec = 30;          // our tokens for pubsub expire after 30 seconds
const userCooldownMs = 1000;                // maximum input rate per user to prevent bot abuse
const userCooldownClearIntervalMs = 60000;  // interval to reset our tracking object
const channelCooldownMs = 1000;             // maximum broadcast rate per channel
const bearerPrefix = 'Bearer ';             // HTTP authorization headers have this prefix

const channelCooldowns = {};                // rate limit compliance
let userCooldowns = {};                     // spam prevention

var hypeTrainOn = false
let last_updated = Date.now()

function missingOnline(name, variable) {
  const option = name.charAt(0);
  return `Extension ${name} required in online mode.\nUse argument "-${option} <${name}>" or environment variable "${variable}".`;
}

const STRINGS = {
  secretEnv: 'Using environment variable for secret',
  clientIdEnv: 'Using environment variable for client-id',
  ownerIdEnv: 'Using environment variable for owner-id',
  secretLocal: 'Using local mode secret',
  clientIdLocal: 'Using local mode client-id',
  ownerIdLocal: 'Using local mode owner-id',
  serverStarted: 'Server running at %s',
  secretMissing: missingOnline('secret', 'EXT_SECRET'),
  clientIdMissing: missingOnline('client ID', 'EXT_CLIENT_ID'),
  ownerIdMissing: missingOnline('owner ID', 'EXT_OWNER_ID'),
  messageSendError: 'Error sending message to channel %s: %s',
  pubsubResponse: 'Message to c:%s returned %s',
  cyclingColor: 'Cycling color for c:%s on behalf of u:%s',
  startHypeTrainBroadcast: 'Broadcasting %s for c:%s',
  sendUserInfo: 'Sending {exp: %d, level: %d} to c:%s',
  cooldown: 'Please wait before clicking again',
  invalidAuthHeader: 'Invalid authorization header',
  invalidJwt: 'Invalid JWT',
};

ext.
  version(require('../package.json').version).
  option('-s, --secret <secret>', 'Extension secret').
  option('-c, --client-id <client_id>', 'Extension client ID').
  option('-o, --owner-id <owner_id>', 'Extension owner ID').
  option('-l, --is-local', 'Developer rig local mode').
  parse(process.argv);

const ownerId = getOption('ownerId', 'ENV_OWNER_ID', '100000001');
const secret = Buffer.from(getOption('secret', 'ENV_SECRET', 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'), 'base64');
let clientId;
if (ext.isLocal && ext.args.length) {
  const localFileLocation = path.resolve(ext.args[0]);
  clientId = require(localFileLocation).id;

clientId = getOption('clientId', 'ENV_CLIENT_ID', clientId);
// Get options from the command line, environment, or, if local mode is
// enabled, the local value.
function getOption(optionName, environmentName, localValue) {
  const option = (() => {
    if (ext[optionName]) {
      return ext[optionName];
    } else if (process.env[environmentName]) {
      console.log(STRINGS[optionName + 'Env']);
      return process.env[environmentName];
    } else if (ext.isLocal && localValue) {
      console.log(STRINGS[optionName + 'Local']);
      return localValue;
    }
    console.log(STRINGS[optionName + 'Missing']);
    process.exit(1);
  })();
  console.log(`Using "${option}" for ${optionName}`);
  return option;
}

const server = new Hapi.Server({
  host: 'localhost',
  port: 8081,
  tls: {
    // If you need a certificate, execute "npm run cert".
    key: fs.readFileSync(path.resolve(__dirname, '..', 'conf', 'server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '..', 'conf', 'server.crt')),
  },
  routes: {
    cors: {
      origin: ['*'],
    },
  },
});

// Verify the header and the enclosed JWT.
function verifyAndDecode(header) {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jwt.verify(token, secret, { algorithms: ['HS256'] });
    }
    catch (ex) {
      throw Boom.unauthorized(STRINGS.invalidJwt);
    }
  }
  throw Boom.unauthorized(STRINGS.invalidAuthHeader);
}

function userQueryHandler(req) {
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  const userExp = getExpFromDatabase(opaqueUserId);
  const userLevel = getLevelFromDatabase(opaqueUserId);

  verboseLog(STRINGS.sendUserInfo, userExp, userLevel, opaqueUserId);
  return {userExp, userLevel};
}

function hypeStartHandler(req) {
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  // return if already started hype train
  if(hypeTrainOn) {
      return;
  }
  hypeTrainOn = true;

  //TODO
  // set the desired emote/phrase
  phrase = "test_phrase";
  // start tracking who sends the desired emote/phrase and how often (in chatbot)

  // increase the exp of people as needed (through database)

  // broadcast the start of the hype train
  sendStartHypeTrainBroadcast(channelId);

  // start to broadcast updates to hype train at repeated intervals to frontend to display a literal hype train
}

function sendStartHypeTrainBroadcast(channelId) {
    // Set the HTTP headers require by the Twitch API.
    const headers = {
        'Client-ID': clientId,
        'Content-Type': 'application/json',
        'Authorization': bearerPrefix + makeServerToken(channelId),
    };

    // Create the POST body for the Twitch API request.
    const body = JSON.stringify({
        content_type: 'application/json',
        message: "startHypeTrain",
        targets: ['broadcast'],
    });

    // Send the broadcast request to the Twitch API.
    verboseLog(STRINGS.startHypeTrainBroadcast, "startHypeTrain", channelId);
    const apiHost = ext.isLocal ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';
    request(
        `https://${apiHost}/extensions/message/${channelId}`,
        {
            method: 'POST',
            headers,
            body,
        }
        , (err, res) => {
            if (err) {
                console.log(STRINGS.messageSendError, channelId, err);
            } else {
                verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
            }
        });
}

function hypeStopHandler(req) {
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  if(!hypeTrainOn) {
    return;
  }
  hypeTrainOn = false;
  
  //TODO
  // stop tracking who sends the desired phrase (in chatbot)
  
  // update exp for final time (through database)

  // broadcast the end of the hype train
  sendStopHypeTrainBroadcast(channelId);
}

function sendStopHypeTrainBroadcast(channelId) {
    // Set the HTTP headers require by the Twitch API.
    const headers = {
        'Client-ID': clientId,
        'Content-Type': 'application/json',
        'Authorization': bearerPrefix + makeServerToken(channelId),
    };

    // Create the POST body for the Twitch API request.
    const body = JSON.stringify({
        content_type: 'application/json',
        message: "stopHypeTrain",
        targets: ['broadcast'],
    });

    // Send the broadcast request to the Twitch API.
    verboseLog(STRINGS.startHypeTrainBroadcast, "stopHypeTrain", channelId);
    const apiHost = ext.isLocal ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';
    request(
        `https://${apiHost}/extensions/message/${channelId}`,
        {
            method: 'POST',
            headers,
            body,
        }
        , (err, res) => {
            if (err) {
                console.log(STRINGS.messageSendError, channelId, err);
            } else {
                verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
            }
        });
}


// Create and return a JWT for use by this service.
function makeServerToken(channelId) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
    channel_id: channelId,
    user_id: ownerId, // extension owner ID for the call to Twitch PubSub
    role: 'external',
    pubsub_perms: {
      send: ['*'],
    },
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

(async () => {
  // Handle a broadcaster requesting to start a hype train
  server.route({
    method: 'POST',
    path: '/hype/start',
    handler: hypeStartHandler,
  });

  server.route({
    method: 'POST',
    path: '/hype/stop',
    handler: hypeStopHandler,
  });

  // Handle a viewer requesting their user info
  server.route({
    method: 'GET',
    path: '/user/query',
    handler: userQueryHandler,
  });

  // Start the server.
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);

  // Periodically clear cool-down tracking to prevent unbounded growth due to
  // per-session logged-out user tokens.
  setInterval(() => { userCooldowns = {}; }, userCooldownClearIntervalMs);
})();
