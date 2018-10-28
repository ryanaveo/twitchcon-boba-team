const mongoose = require("mongoose");
const Viewer = require("./models/Viewer");
function setup(connection) {
  return {
    addEmoteCount: function(emote, increment) {
        
    },
    gainExp: userId => {
      Viewer.findById(userId, (err, viewer) => {
        if (err) throw err;
        viewer.experience += 1;
        viewer.save((err, updatedViewer) => {
          if (err) throw err;
        });
      });
    }
  };
}

module.exports = function(connectionString) {
  const connection = mongoose.connect(connectionString);
  return setup(connection);
};
