const jwt = require("jsonwebtoken");
const Boom = require("boom");

const STRINGS = require("./const.js");

const bearerPrefix = "Bearer ";

module.exports = function(extensionId, secret) {
  return {
    // Verify the header and the enclosed JWT.
    verifyAndDecode: header => {
      if (header.startsWith(bearerPrefix)) {
        try {
          const token = header.substring(bearerPrefix.length);
          return jwt.verify(token, secret, { algorithms: ["HS256"] });
        } catch (ex) {
          throw Boom.unauthorized(STRINGS.invalidJwt);
        }
      }
      throw Boom.unauthorized(STRINGS.invalidAuthHeader);
    },
    // Create and return a JWT for use by this service.
    makeServerToken: channelId => {
      const payload = {
        exp: 4696365877,
        channelId: channelId,
        user_id: extensionId,
        pubsub_perms: {
          listen: ["broadcast"],
          send: ["*"]
        },
        role: "external"
      };
      return bearerPrefix + jwt.sign(payload, secret, { algorithm: "HS256" });
    }
  };
};
