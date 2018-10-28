const mongoose = require("mongoose");

const viewerSchema = new mongoose.Schema({
  _id: String,
  username: String,
  experience: Number,
  level: Number
});

module.exports = mongoose.model("Viewer", viewerSchema);