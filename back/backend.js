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
const express = require('express');
const path = require('path');
const Boom = require('boom');
const ext = require('commander');
const jwt = require('jsonwebtoken');
const request = require('request');
const config = require("config");
const mongoose = require("mongoose");
const DBurl = "mongodb://" + config.get("Database.user") + ":" + config.get("Database.password") + "@ds143683.mlab.com:43683/twitchcon";
const bearerPrefix = 'Bearer ';

let secret = "y91EoSF/in9k+rpH9BeJkFgHlEBnM1F2E91iZjQXLuk="
secret = Buffer.from(secret, 'base64');
const clientId = "pSvxEshRubpZIppMh6dmGAQEB20u05";

const Viewer = require("./models/Viewer");

mongoose.connect("mongodb://boba:twitchcon2018@ds143683.mlab.com:43683/twitchcon");

const STRINGS = {
  secretEnv: 'Using environment variable for secret',
  clientIdEnv: 'Using environment variable for client-id',
  ownerIdEnv: 'Using environment variable for owner-id',
  secretLocal: 'Using local mode secret',
  clientIdLocal: 'Using local mode client-id',
  ownerIdLocal: 'Using local mode owner-id',
  serverStarted: 'Server running at %s',
  messageSendError: 'Error sending message to channel %s: %s',
  pubsubResponse: 'Message to c:%s returned %s',
  cyclingColor: 'Cycling color for c:%s on behalf of u:%s',
  colorBroadcast: 'Broadcasting color %s for c:%s',
  sendColor: 'Sending color %s to c:%s',
  cooldown: 'Please wait before clicking again',
  invalidAuthHeader: 'Invalid authorization header',
  invalidJwt: 'Invalid JWT',
};
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

function colorCycleHandler(req) {
  // Verify all requests.
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  // Store the color for the channel.
  let currentColor = channelColors[channelId] || initialColor;

  // Bot abuse prevention:  don't allow a user to spam the button.
  if (userIsInCooldown(opaqueUserId)) {
    throw Boom.tooManyRequests(STRINGS.cooldown);
  }

  // Rotate the color as if on a color wheel.
  verboseLog(STRINGS.cyclingColor, channelId, opaqueUserId);
  currentColor = color(currentColor).rotate(colorWheelRotation).hex();

  // Save the new color for the channel.
  channelColors[channelId] = currentColor;

  // Broadcast the color change to all other extension instances on this channel.
  attemptColorBroadcast(channelId);

  return currentColor;
}

function trainHandler(req) {
  let payload;
  console.log('here')
  try{
    payload = verifyAndDecode(req.headers.authorization);
  }catch(e){
    console.log(e)
    return e
  }
  console.log(payload);
  // request(
  //   `https://${apiHost}/extensions/message/${channelId}`,
  //   {
  //     method: 'POST',
  //     headers,
  //     body,
  //   }
  //   , (err, res) => {
  //     if (err) {
  //       console.log(STRINGS.messageSendError, channelId, err);
  //     } else {
  //       verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
  //     }
  //   });
}

 function sendTrainBroadcast(req, reply) {
  // Set the HTTP headers required by the Twitch API.
  const headers = {
    'Client-ID': clientId,
    'Content-Type': 'application/json',
    'Authorization': bearerPrefix + makeServerToken(req.payload.channelId),
  };
  // Create the POST body for the Twitch API request.
  const body = JSON.stringify({
    content_type: 'application/json',
    message: "Hello",
    targets: ['broadcast'],
  });

  // Send the broadcast request to the Twitch API.
  const apiHost = 'api.twitch.tv';
  request(
    `https://${apiHost}/extensions/message/${req.payload.channelId}`,
    {
      method: 'POST',
      headers,
      body,
    }
    , (err, res) => {
      if (err) {
        console.log(STRINGS.messageSendError, channelId, err);
      } else{
        return Promise.resolve("OK")
      }
    });
}

// Create and return a JWT for use by this service.
function makeServerToken(channelId) {
  const payload = {
      "exp": 4696365877,
      "channelId": channelId,
      "pubsub_perms": {
        "listen": [ "broadcast"],
        "send": ["broadcast"]
      },
      "role": "external"
    };
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

(async () => {
  server.route({
    method: 'POST',
    path: '/train',
    handler: sendTrainBroadcast
  });

  server.route({
    method:'GET',
    path:'/',
    handler:()=>{
      console.log('hello')
    }
  })
  // Start the server.
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);
})();
