const express  = require("express"),
      app      = express(),
      port     = 8080,
      config   = require("config"),
      DBurl    =  "mongodb://" + config.get("Database.user") + ":" + config.get("Database.password") + "@ds143683.mlab.com:43683/twitchcon"
      mongoose = require("mongoose");

mongoose.connect("mongodb://boba:twitchcon2018@ds143683.mlab.com:43683/twitchcon");

app.listen(port, function() {
  console.log("Server running on https://localhost:" + port);
});