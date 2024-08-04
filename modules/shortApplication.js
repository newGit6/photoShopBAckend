const mongoose = require("mongoose");

const shortApplicationSchema = new mongoose.Schema(
  {
    title: { type: String, maxLength: 50 },
    description: { type: String, maxLength: 200 },
    thumbnail: { type: String },
    video: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", shortApplicationSchema);
