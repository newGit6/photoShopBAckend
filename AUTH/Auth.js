const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../modules/authSchema"); // Ensure correct path

dotenv.config();

const router = express.Router();

// Check if JWT_SECRET is defined or create a fallback
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in the environment variables.");
  process.env.JWT_SECRET = "your_fallback_secret"; // Not recommended for production
}

// Middleware to parse JSON body
router.use(express.json());

// POST route for user registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, role } = req.body;

    // Check if the user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      confirmPassword,
      role,
    });

    // Save the user to the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role }, // Adjust payload as needed
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      message: "Registration successful",
      user: newUser,
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// POST route for user login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Adjust payload as needed
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      message: "Login successful",
      user: {
        email: user.email,
        role: user.role,
        id: user._id,
        // Add any additional user data needed in the frontend
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
