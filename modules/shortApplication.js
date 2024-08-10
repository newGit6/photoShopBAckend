const mongoose = require("mongoose");

const shortApplicationSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    thumbnails: [String], // Array of filenames
    videos: [String], // Array of filenames
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", shortApplicationSchema);
