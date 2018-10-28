const mongoose = require("mongoose");
const Viewer = require("./models/Viewer");
function setup(connection) {
  return {
    addEmoteCount: function(emote, increment) {},
    gainExp: userId => {
      Viewer.findById(userId, (err, viewer) => {
        if (err) throw err;
        if (!viewer) {
          viewer = new Viewer({ _id: userId, experience: 0 });
          console.log("New user created")
        }
        viewer.experience += 1;
        viewer.save((err, updatedViewer) => {
          if (err) throw err;
        });
      });
    },
    getAll: () => {
      return Viewer.find((err, v) => {
        console.log(v);
      });
    }
  };
}

module.exports = function(connectionString) {
  const connection = mongoose.connect(connectionString);
  return setup(connection);
};
