const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "Photographer"],
      default: "user",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", authSchema);

module.exports = User;
